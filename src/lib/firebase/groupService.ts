import { db } from './clientApp';
import { chatService } from './chatService';
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
  increment,
  arrayUnion,
  arrayRemove,
  collectionGroup,
  where,
  writeBatch
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
  subscribeGroup: (groupId: string, callback: (group: Group | null) => void, errorCallback?: (error: any) => void) => {
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
    }, (error) => {
      console.error(`Error subscribing to group metadata for ${groupId}:`, error);
      if (errorCallback) errorCallback(error);
    });
  },

  // Subscribe to group members
  subscribeMembers: (groupId: string, callback: (members: Member[]) => void) => {
    const membersRef = collection(db, GROUPS_COLLECTION, groupId, 'members');
    const q = query(membersRef);

    return onSnapshot(q, (snapshot) => {
      const members = snapshot.docs.map(doc => ({
        id: doc.id,
        ...groupService._convertTimestamps(doc.data())
      })) as Member[];
      callback(members);
    }, (error) => {
      console.error(`Error subscribing to members for group ${groupId}:`, error);
      callback([]);
    });
  },

  // Subscribe to group posts
  subscribePosts: (groupId: string, callback: (posts: Post[]) => void, errorCallback?: (error: any) => void) => {
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
    }, (error) => {
      console.error(`Error subscribing to posts for group ${groupId}:`, error);
      if (errorCallback) errorCallback(error);
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

    const data = groupService._convertTimestamps(snapshot.data());

    // Fetch subcollections concurrently to attach to Group object
    const [postsSnap, classesSnap, discountsSnap] = await Promise.all([
      getDocs(query(collection(db, GROUPS_COLLECTION, groupId, 'posts'), orderBy('createdAt', 'desc'), limit(20))),
      getDocs(query(collection(db, GROUPS_COLLECTION, groupId, 'classes'), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, GROUPS_COLLECTION, groupId, 'discounts'), orderBy('createdAt', 'desc')))
    ]);

    const posts = postsSnap.docs.map(d => ({ id: d.id, ...groupService._convertTimestamps(d.data()) })) as Post[];
    const subClasses = classesSnap.docs.map(d => ({ ...groupService._convertTimestamps(d.data()), id: d.id })) as GroupClass[];
    const subDiscounts = discountsSnap.docs.map(d => ({ id: d.id, ...groupService._convertTimestamps(d.data()) }));

    return {
      id: snapshot.id,
      ...data,
      classes: [...subClasses, ...(data.classes || [])],
      discounts: [...subDiscounts, ...(data.discounts || [])],
      _legacyClasses: data.classes || [],
      _legacyDiscounts: data.discounts || [],
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
    const userRef = doc(db, 'users', userId);

    const batch = writeBatch(db);

    // Add to members subcollection as active
    batch.set(memberRef, {
      ...memberData,
      status: 'active',
      joinedAt: Timestamp.now()
    });

    // Increment member count and update memberIds in metadata
    batch.update(groupRef, {
      memberCount: increment(1),
      memberIds: arrayUnion(userId)
    });

    // Update user's joinedGroups
    batch.update(userRef, {
      joinedGroups: arrayUnion(groupId)
    });

    await batch.commit();

    // Sync: add to group chat room participants
    try {
      await chatService.addGroupChatParticipant(groupId, userId);
    } catch (e) { console.error('Chat sync error (joinGroup):', e); }
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
    const userRef = doc(db, 'users', userId);

    const batch = writeBatch(db);

    batch.update(memberRef, {
      status: 'active',
      approvedAt: Timestamp.now()
    });

    // Increment member count and update memberIds in metadata
    batch.update(groupRef, {
      memberCount: increment(1),
      memberIds: arrayUnion(userId)
    });

    // Update user's joinedGroups
    batch.update(userRef, {
      joinedGroups: arrayUnion(groupId)
    });

    await batch.commit();

    // Sync: add to group chat room participants (approval/invite strategy)
    try {
      await chatService.addGroupChatParticipant(groupId, userId);
    } catch (e) { console.error('Chat sync error (approveMember):', e); }
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
    const userRef = doc(db, 'users', userId);
    
    const batch = writeBatch(db);

    // Remove from members subcollection
    batch.delete(memberRef);

    // Decrement member count and remove from memberIds
    batch.update(groupRef, {
      memberCount: increment(-1),
      memberIds: arrayRemove(userId)
    });

    // Remove from user's joinedGroups
    batch.update(userRef, {
      joinedGroups: arrayRemove(groupId)
    });

    await batch.commit();

    // Sync: remove from group chat room participants
    try {
      await chatService.removeGroupChatParticipant(groupId, userId);
    } catch (e) { console.error('Chat sync error (leaveGroup):', e); }
  },

  // Kick a member from a group (admin/owner action)
  kickMember: async (groupId: string, userId: string) => {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    const memberRef = doc(db, GROUPS_COLLECTION, groupId, 'members', userId);
    const userRef = doc(db, 'users', userId);
    
    const batch = writeBatch(db);

    // Remove from members subcollection
    batch.delete(memberRef);

    // Decrement member count and remove from memberIds
    batch.update(groupRef, {
      memberCount: increment(-1),
      memberIds: arrayRemove(userId)
    });

    // Remove from user's joinedGroups
    batch.update(userRef, {
      joinedGroups: arrayRemove(groupId)
    });

    await batch.commit();

    // Sync: kick from group chat room participants (sends system message)
    try {
      await chatService.kickGroupChatParticipant(groupId, userId);
    } catch (e) { console.error('Chat sync error (kickMember):', e); }
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
    }, (error) => {
      console.error(`Error subscribing to calendar events for group ${groupId}:`, error);
      callback([]);
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
          ...data,
          id: doc.id
        };
      }) as GroupClass[];
      callback(classes);
    });
  },

  // Add a class
  addClass: async (groupId: string, classData: Partial<GroupClass>) => {
    const classesRef = collection(db, GROUPS_COLLECTION, groupId, 'classes');
    if (classData.id) {
      await setDoc(doc(classesRef, classData.id), {
        ...classData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return classData.id;
    } else {
      const docRef = await addDoc(classesRef, {
        ...classData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    }
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


  // --- Discounts Section ---
  subscribeDiscounts: (groupId: string, callback: (discounts: any[]) => void) => {
    const discountsRef = collection(db, GROUPS_COLLECTION, groupId, 'discounts');
    const q = query(discountsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...groupService._convertTimestamps(doc.data()) })));
    });
  },
  addDiscount: async (groupId: string, discountData: any) => {
    const discountsRef = collection(db, GROUPS_COLLECTION, groupId, 'discounts');
    if (discountData.id) {
      await setDoc(doc(discountsRef, discountData.id), { ...discountData, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
      return discountData.id;
    } else {
      const docRef = await addDoc(discountsRef, { ...discountData, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
      return docRef.id;
    }
  },
  updateDiscount: async (groupId: string, discountId: string, discountData: any) => {
    const discountRef = doc(db, GROUPS_COLLECTION, groupId, 'discounts', discountId);
    await updateDoc(discountRef, { ...discountData, updatedAt: Timestamp.now() });
  },
  deleteDiscount: async (groupId: string, discountId: string) => {
    await deleteDoc(doc(db, GROUPS_COLLECTION, groupId, 'discounts', discountId));
  },

  // Create a new group
  createGroup: async (groupData: Partial<Group>, userId?: string, memberData?: Omit<Member, 'id'>): Promise<string> => {
    // 1. Create the group document
    const defaultFunctions = ['dashboard', 'feed', 'live', 'calendar', 'members', 'notice', 'about', 'brand-setting', 'roles-permissions'];
    const docRef = doc(collection(db, GROUPS_COLLECTION));
    const batch = writeBatch(db);
    
    const initialData: any = {
      ...groupData,
      selectedFunctions: defaultFunctions,
      menuOrder: defaultFunctions,
      memberCount: 1, // Automatically counting the creator
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    if (userId) {
      initialData.memberIds = [userId];
    }

    batch.set(docRef, initialData);

    if (userId) {
      // 2. Add the user to the members subcollection as an owner
      const memberRef = doc(db, GROUPS_COLLECTION, docRef.id, 'members', userId);
      batch.set(memberRef, {
        ...(memberData || {}),
        name: memberData?.name || groupData.representative?.name || 'Owner',
        role: 'owner',
        status: 'active',
        joinedAt: Timestamp.now()
      });

      // 3. Update the user's joinedGroups array
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        joinedGroups: arrayUnion(docRef.id),
      });
    }

    await batch.commit();

    // 4. Auto-create linked group chat room (1:1 mapping)
    try {
      const joinStrategy = (groupData as any).membershipPolicy?.joinStrategy || 'open';
      await chatService.createGroupChatRoom(docRef.id, groupData.name || docRef.id, userId || 'system1', {
        coverImage: groupData.coverImage,
        description: groupData.description,
        joinStrategy,
      });
    } catch (chatErr) {
      console.error('Failed to create linked group chat room:', chatErr);
    }

    return docRef.id;
  },

  // Publish a group (Go Live)
  publishGroup: async (groupId: string): Promise<void> => {
    const docRef = doc(db, GROUPS_COLLECTION, groupId);
    await updateDoc(docRef, {
      isPublished: true,
      updatedAt: Timestamp.now(),
    });
  },

  // Claim admin rights for an unassigned group
  claimGroupAdmin: async (groupId: string, userId: string, memberData: Omit<Member, 'id'>): Promise<void> => {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    const memberRef = doc(db, GROUPS_COLLECTION, groupId, 'members', userId);
    const userRef = doc(db, 'users', userId);

    const batch = writeBatch(db);

    // 1. Set the user as the owner of the group, update member count and memberIds
    batch.update(groupRef, {
      ownerId: userId,
      memberCount: increment(1),
      memberIds: arrayUnion(userId),
      updatedAt: Timestamp.now(),
    });

    // 2. Add the user to the members subcollection as an admin
    batch.set(memberRef, {
      ...memberData,
      role: 'admin',
      status: 'active',
      joinedAt: Timestamp.now()
    });

    // 3. Update the user's joinedGroups array
    batch.update(userRef, {
      joinedGroups: arrayUnion(groupId),
    });

    await batch.commit();

    // 4. Sync: update group chat room admin + add as participant
    try {
      await chatService.syncGroupChatAdmin(groupId, userId);
      await chatService.addGroupChatParticipant(groupId, userId);
    } catch (e) { console.error('Chat sync error (claimGroupAdmin):', e); }
  },

  // --- Global Classes Section (for Class Portal) ---

  // Get all open classes across all groups (for week/month filtering)
  getGlobalClassesAll: async (): Promise<any[]> => {
    try {
      const q = query(
        collectionGroup(db, 'classes'),
        where('status', '==', 'Open')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => {
        const pathSegments = d.ref.path.split('/');
        const groupId = pathSegments[1] || '';
        return {
          id: d.id,
          groupId,
          ...groupService._convertTimestamps(d.data())
        };
      });
    } catch (error) {
      console.error('getGlobalClassesAll error:', error);
      return [];
    }
  },


  // Get all discounts (bundles) across all groups
  getGlobalDiscountsAll: async (): Promise<any[]> => {
    try {
      const snapshot = await getDocs(collectionGroup(db, 'discounts'));
      return snapshot.docs.map(d => {
        const pathSegments = d.ref.path.split('/');
        const groupId = pathSegments[1] || '';
        return { id: d.id, groupId, ...groupService._convertTimestamps(d.data()) };
      });
    } catch (error) {
      console.error('getGlobalDiscountsAll error:', error);
      return [];
    }
  },

  // Get all classes across all groups happening today
  getGlobalClassesToday: async (): Promise<any[]> => {
    try {
      const now = new Date();
      // Use local time for YYYY-MM-DD format
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      console.log(`[ClassPortal] Searching classes for today: ${todayStr}`);

      const q = query(
        collectionGroup(db, 'classes'),
        where('status', '==', 'Open')
      );
      
      const snapshot = await getDocs(q);
      const results: any[] = [];
      
      snapshot.docs.forEach(d => {
        const data = d.data();
        const hasToday = data.schedule?.some((s: any) => {
          if (!s.date) return false;
          
          let dStr = '';
          if (typeof s.date === 'string') {
            dStr = s.date.trim();
          } else if (s.date && typeof s.date.toDate === 'function') {
            const dObj = s.date.toDate();
            dStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
          } else if (s.date && s.date.seconds) {
            const dObj = new Date(s.date.seconds * 1000);
            dStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
          }

          if (!dStr) return false;

          // Standardize separator to hyphen and pad components
          const normalizedInput = dStr.replace(/[\.\/]/g, '-');
          const parts = normalizedInput.split('-');
          if (parts.length === 3) {
            const y = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
            const m = parts[1].padStart(2, '0');
            const d = parts[2].padStart(2, '0');
            const finalNormalized = `${y}-${m}-${d}`;
            
            if (finalNormalized === todayStr) return true;
          }

          // Fallback: Just compare numbers
          const digitsOnlyInput = dStr.replace(/\D/g, '');
          const digitsOnlyToday = todayStr.replace(/\D/g, '');
          
          // Handle YYMMDD vs YYYYMMDD
          if (digitsOnlyInput.length === 6 && digitsOnlyToday.length === 8) {
            return digitsOnlyToday.endsWith(digitsOnlyInput);
          }

          return digitsOnlyInput === digitsOnlyToday;
        });
        
        if (hasToday) {
          const pathSegments = d.ref.path.split('/');
          const groupId = pathSegments[1] || '';
          results.push({
            id: d.id,
            groupId,
            ...groupService._convertTimestamps(data)
          });
        }
      });
      
      console.log(`[ClassPortal] Found ${results.length} classes for today.`);
      return results;
    } catch (error) {
      console.error('getGlobalClassesToday error:', error);
      return [];
    }
  },

  // Get all special classes across all groups
  getGlobalSpecialClasses: async (): Promise<any[]> => {
    try {
      const q = query(
        collectionGroup(db, 'classes'),
        where('status', '==', 'Open'),
        where('classType', '==', 'special')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => {
        const pathSegments = d.ref.path.split('/');
        const groupId = pathSegments[1] || '';
        return {
          id: d.id,
          groupId,
          ...groupService._convertTimestamps(d.data())
        };
      });
    } catch (error) {
      console.error('getGlobalSpecialClasses error:', error);
      return [];
    }
  }
};
