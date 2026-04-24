import { db } from './clientApp';
import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  limit,
  startAfter,
  Timestamp,
  addDoc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { Group, Post, Member, GroupClass } from '@/types/group';

const GROUPS_COLLECTION = 'groups';

export const groupService = {
  // Helper to convert Firestore Timestamps to plain numbers
  _convertTimestamps: (data: any): any => {
    if (!data) return data;

    // Handle Firestore Timestamp specifically
    if (typeof data.toMillis === 'function') return data.toMillis();
    if (data.seconds !== undefined && data.nanoseconds !== undefined) {
      return data.seconds * 1000 + Math.floor(data.nanoseconds / 1000000);
    }

    // Handle Date object
    if (data instanceof Date) return data.getTime();

    if (Array.isArray(data)) return data.map(i => groupService._convertTimestamps(i));

    if (typeof data === 'object' && (data.constructor === Object || !data.constructor)) {
      const converted: any = {};
      for (const [key, value] of Object.entries(data)) {
        converted[key] = groupService._convertTimestamps(value);
      }
      return converted;
    }
    return data;
  },

  // Subscribe to group metadata
  subscribeGroup: (groupId: string, callback: (group: Group | null) => void) => {
    const docRef = doc(db, GROUPS_COLLECTION, groupId);

    return onSnapshot(docRef, async (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      const rawData = snapshot.data();
      if (!rawData) return;
      const data = groupService._convertTimestamps(rawData);

      // Initially set without posts or members (we'll fetch them separately)
      callback({
        id: snapshot.id,
        ...data,
        members: [], // Members now in subcollection
        memberCount: typeof data.memberCount === 'number' ? data.memberCount : 0,
        posts: []
      } as Group);
    });
  },

  // Subscribe to group members
  subscribeMembers: (groupId: string, callback: (members: Member[]) => void) => {
    const membersRef = collection(db, GROUPS_COLLECTION, groupId, 'members');
    const q = query(membersRef, orderBy('name', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const members = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Member[];
      callback(members);
    });
  },

  // Subscribe to group posts
  subscribePosts: (groupId: string, callback: (posts: Post[]) => void) => {
    const postsRef = collection(db, GROUPS_COLLECTION, groupId, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => {
        const data = groupService._convertTimestamps(doc.data());
        return {
          id: doc.id,
          ...data
        };
      }) as Post[];
      callback(posts);
    });
  },

  // Get all communities
  getGroups: async (): Promise<Group[]> => {
    const q = query(collection(db, GROUPS_COLLECTION));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = groupService._convertTimestamps(doc.data());
      return {
        id: doc.id,
        ...data,
        members: [],
        memberCount: typeof data.memberCount === 'number' ? data.memberCount : 0,
        posts: []
      } as Group;
    });
  },

  // Get group data once (for SSR or initial load)
  getGroup: async (groupId: string): Promise<Group | null> => {
    const docRef = doc(db, GROUPS_COLLECTION, groupId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) return null;

    // Get posts as well
    const postsRef = collection(db, GROUPS_COLLECTION, groupId, 'posts');
    const postsSnap = await getDocs(query(postsRef, orderBy('createdAt', 'desc')));
    const posts = postsSnap.docs.map(d => ({
      id: d.id,
      ...groupService._convertTimestamps(d.data())
    })) as Post[];

    const data = groupService._convertTimestamps(snapshot.data());

    return {
      id: snapshot.id,
      ...data,
      members: [],
      memberCount: typeof data?.memberCount === 'number' ? data?.memberCount : 0,
      posts
    } as Group;
  },

  // Get group members with pagination
  getGroupMembers: async (groupId: string, pageSize = 20, lastVisible?: any): Promise<{ members: Member[], lastVisible: any }> => {
    const membersRef = collection(db, GROUPS_COLLECTION, groupId, 'members');
    let q = query(membersRef, orderBy('joinedAt', 'desc'), limit(pageSize));

    if (lastVisible) {
      q = query(membersRef, orderBy('joinedAt', 'desc'), startAfter(lastVisible), limit(pageSize));
    }

    const snapshot = await getDocs(q);
    const members = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Member[];

    return {
      members,
      lastVisible: snapshot.docs[snapshot.docs.length - 1]
    };
  },

  // Get group members with full profiles
  getGroupMembersWithProfiles: async (groupId: string, pageSize = 20, lastVisible?: any): Promise<{ members: any[], lastVisible: any }> => {
    const { members, lastVisible: newLastVisible } = await groupService.getGroupMembers(groupId, pageSize, lastVisible);
    
    const membersWithProfiles = await Promise.all(members.map(async (member) => {
      const userRef = doc(db, 'users', member.id);
      const userSnap = await getDoc(userRef);
      return {
        ...member,
        profile: userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null
      };
    }));

    return {
      members: membersWithProfiles,
      lastVisible: newLastVisible
    };
  },

  // Like a post
  likePost: async (groupId: string, postId: string) => {
    const postRef = doc(db, GROUPS_COLLECTION, groupId, 'posts', postId);
    await updateDoc(postRef, {
      likes: increment(1)
    });
  },

  // Create a post
  createPost: async (groupId: string, postData: Partial<Post>) => {
    const postsRef = collection(db, GROUPS_COLLECTION, groupId, 'posts');
    const docRef = await addDoc(postsRef, {
      ...postData,
      createdAt: Timestamp.now(),
      likes: 0,
      comments: 0,
      views: 0
    });
    return docRef.id;
  },

  // Update a post
  updatePost: async (groupId: string, postId: string, postData: Partial<Post>) => {
    const postRef = doc(db, GROUPS_COLLECTION, groupId, 'posts', postId);
    await updateDoc(postRef, {
      ...postData,
      updatedAt: Timestamp.now()
    });
  },

  // Delete a post
  deletePost: async (groupId: string, postId: string) => {
    const postRef = doc(db, GROUPS_COLLECTION, groupId, 'posts', postId);
    await deleteDoc(postRef);
  },

  // Increment view count
  incrementPostViews: async (groupId: string, postId: string) => {
    const postRef = doc(db, GROUPS_COLLECTION, groupId, 'posts', postId);
    await updateDoc(postRef, {
      views: increment(1)
    });
  },

  // Subscribe to comments
  subscribeComments: (groupId: string, postId: string, callback: (comments: any[]) => void) => {
    const commentsRef = collection(db, GROUPS_COLLECTION, groupId, 'posts', postId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...groupService._convertTimestamps(doc.data())
      }));
      callback(comments);
    });
  },

  // Add a comment
  addComment: async (groupId: string, postId: string, commentData: any) => {
    const commentsRef = collection(db, GROUPS_COLLECTION, groupId, 'posts', postId, 'comments');
    const postRef = doc(db, GROUPS_COLLECTION, groupId, 'posts', postId);

    await addDoc(commentsRef, {
      ...commentData,
      createdAt: Timestamp.now()
    });

    await updateDoc(postRef, {
      comments: increment(1)
    });
  },

  // Delete a comment
  deleteComment: async (groupId: string, postId: string, commentId: string) => {
    const commentRef = doc(db, GROUPS_COLLECTION, groupId, 'posts', postId, 'comments', commentId);
    const postRef = doc(db, GROUPS_COLLECTION, groupId, 'posts', postId);

    await deleteDoc(commentRef);
    await updateDoc(postRef, {
      comments: increment(-1)
    });
  },

  // Join a group (Immediate for 'open' strategy)
  joinGroup: async (groupId: string, userId: string, memberData: Omit<Member, 'id'>) => {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    const memberRef = doc(db, GROUPS_COLLECTION, groupId, 'members', userId);

    // Add to members subcollection as active
    await setDoc(memberRef, {
      ...memberData,
      status: 'active',
      joinedAt: Timestamp.now()
    });

    // Increment member count in metadata
    await updateDoc(groupRef, {
      memberCount: increment(1)
    });
  },

  // Request to join a group (for 'approval' strategy)
  requestJoinGroup: async (groupId: string, userId: string, memberData: Omit<Member, 'id'>) => {
    const memberRef = doc(db, GROUPS_COLLECTION, groupId, 'members', userId);

    // Add to members subcollection as pending
    await setDoc(memberRef, {
      ...memberData,
      status: 'pending',
      joinedAt: Timestamp.now()
    });
  },

  // Approve a pending member
  approveMember: async (groupId: string, userId: string) => {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    const memberRef = doc(db, GROUPS_COLLECTION, groupId, 'members', userId);

    await updateDoc(memberRef, {
      status: 'active',
      approvedAt: Timestamp.now()
    });

    // Increment member count in metadata
    await updateDoc(groupRef, {
      memberCount: increment(1)
    });
  },

  // Reject a pending member
  rejectMember: async (groupId: string, userId: string) => {
    const memberRef = doc(db, GROUPS_COLLECTION, groupId, 'members', userId);

    await updateDoc(memberRef, {
      status: 'rejected',
      rejectedAt: Timestamp.now()
    });
  },

  // Leave a group
  leaveGroup: async (groupId: string, userId: string) => {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    const memberRef = doc(db, GROUPS_COLLECTION, groupId, 'members', userId);

    // Remove from members subcollection
    await deleteDoc(memberRef);

    // Decrement member count in metadata
    await updateDoc(groupRef, {
      memberCount: increment(-1)
    });
  },

  // Update group metadata
  updateGroupMetadata: async (groupId: string, data: Partial<Group>) => {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    // Remove id, members, posts if they accidentally passed in
    const { id, members, posts, ...cleanData } = data as any;
    await updateDoc(groupRef, {
      ...cleanData,
      updatedAt: Timestamp.now()
    });
  },
  
  // Subscribe to calendar events
  subscribeCalendarEvents: (groupId: string, callback: (events: any[]) => void) => {
    const eventsRef = collection(db, GROUPS_COLLECTION, groupId, 'calendar_events');
    const q = query(eventsRef, orderBy('startDate', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...groupService._convertTimestamps(doc.data())
      }));
      callback(events);
    });
  },

  // Add a calendar event
  addCalendarEvent: async (groupId: string, eventData: any) => {
    const eventsRef = collection(db, GROUPS_COLLECTION, groupId, 'calendar_events');
    const docRef = await addDoc(eventsRef, {
      ...eventData,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  },

  // Update a calendar event
  updateCalendarEvent: async (groupId: string, eventId: string, eventData: any) => {
    const eventRef = doc(db, GROUPS_COLLECTION, groupId, 'calendar_events', eventId);
    await updateDoc(eventRef, {
      ...eventData,
      updatedAt: Timestamp.now()
    });
  },

  // Delete a calendar event
  deleteCalendarEvent: async (groupId: string, eventId: string) => {
    const eventRef = doc(db, GROUPS_COLLECTION, groupId, 'calendar_events', eventId);
    await deleteDoc(eventRef);
  },

  // --- Classes Section ---
  
  // Subscribe to classes
  subscribeClasses: (groupId: string, callback: (classes: GroupClass[]) => void) => {
    const classesRef = collection(db, GROUPS_COLLECTION, groupId, 'classes');
    const q = query(classesRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const classes = snapshot.docs.map(doc => {
        const data = groupService._convertTimestamps(doc.data());
        return {
          id: doc.id,
          ...data
        };
      }) as GroupClass[];
      callback(classes);
    });
  },

  // Add a class
  addClass: async (groupId: string, classData: Partial<GroupClass>) => {
    const classesRef = collection(db, GROUPS_COLLECTION, groupId, 'classes');
    const docRef = await addDoc(classesRef, {
      ...classData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  },

  // Update a class
  updateClass: async (groupId: string, classId: string, classData: Partial<GroupClass>) => {
    const classRef = doc(db, GROUPS_COLLECTION, groupId, 'classes', classId);
    await updateDoc(classRef, {
      ...classData,
      updatedAt: Timestamp.now()
    });
  },

  // Delete a class
  deleteClass: async (groupId: string, classId: string) => {
    const classRef = doc(db, GROUPS_COLLECTION, groupId, 'classes', classId);
    await deleteDoc(classRef);
  },

  // Create a new group
  createGroup: async (groupData: Partial<Group>): Promise<string> => {
    const docRef = await addDoc(collection(db, GROUPS_COLLECTION), {
      ...groupData,
      memberCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  }
};
