import { db } from '../clientApp';
import { chatService } from '../chatService';
import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  getDocs,
  setDoc,
  limit,
  startAfter,
  Timestamp,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch
} from 'firebase/firestore';
import { Member } from '@/types/group';
import { UserProfile } from '@/types/user';
import { reportError } from '@/lib/utils/errorHandler';
import { GROUPS_COLLECTION, groupCrudService, membersCache } from './groupCrudService';

export const groupMemberService = {
  // Get all group members list
  getGroupMembersAll: async (groupId: string): Promise<Member[]> => {
    try {
      const membersSnap = await getDocs(collection(db, GROUPS_COLLECTION, groupId, 'members'));
      return membersSnap.docs.map(doc => ({
        id: doc.id,
        ...groupCrudService._convertTimestamps(doc.data())
      })) as Member[];
    } catch (error) {
      console.error('getGroupMembersAll error:', error);
      return [];
    }
  },

  getCachedMembers: (groupId: string): Member[] | null => {
    return membersCache.get(groupId) || null;
  },

  // Subscribe to group members
  subscribeMembers: (groupId: string, callback: (members: Member[]) => void) => {
    const membersRef = collection(db, GROUPS_COLLECTION, groupId, 'members');
    const q = query(membersRef);

    return onSnapshot(q, async (snapshot) => {
      const members = snapshot.docs.map(doc => ({
        id: doc.id,
        ...groupCrudService._convertTimestamps(doc.data())
      })) as Member[];
      
      membersCache.set(groupId, members);

      try {
        const groupRef = doc(db, GROUPS_COLLECTION, groupId);
        const groupSnap = await getDoc(groupRef);
        if (groupSnap.exists()) {
          const currentCount = groupSnap.data()?.memberCount;
          const activeMembers = members.filter(m => !m.status || m.status === 'active');
          if (typeof currentCount === 'number' && currentCount !== activeMembers.length) {
            await updateDoc(groupRef, { memberCount: activeMembers.length });
          }
        }
      } catch (e) { /* 보정 실패 무시 */ }

      callback(members);
    }, (error) => {
      console.error(`Error subscribing to members for group ${groupId}:`, error);
      callback([]);
    });
  },

  // Get group members with pagination
  getGroupMembers: async (groupId: string, pageSize = 20, lastVisible?: any): Promise<{ members: Member[], lastVisible: any }> => {
    try {
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
    } catch (error) {
      await reportError(error, 'groupService.getGroupMembers');
      return { members: [], lastVisible: null };
    }
  },

  // Get group members with full profiles
  getGroupMembersWithProfiles: async (groupId: string, pageSize = 20, lastVisible?: any): Promise<{ members: (Member & { profile: UserProfile | null })[], lastVisible: any }> => {
    try {
      const { members, lastVisible: newLastVisible } = await groupMemberService.getGroupMembers(groupId, pageSize, lastVisible);
      
      const membersWithProfiles = await Promise.all(members.map(async (member) => {
        const userRef = doc(db, 'users', member.id);
        const userSnap = await getDoc(userRef);
        return {
          ...member,
          profile: userSnap.exists() ? { id: userSnap.id, ...groupCrudService._convertTimestamps(userSnap.data()) } as UserProfile : null
        };
      }));

      return {
        members: membersWithProfiles,
        lastVisible: newLastVisible
      };
    } catch (error) {
      await reportError(error, 'groupService.getGroupMembersWithProfiles');
      return { members: [], lastVisible: null };
    }
  },

  // Join a group
  joinGroup: async (groupId: string, userId: string, memberData: Omit<Member, 'id'>) => {
    try {
      const groupRef = doc(db, GROUPS_COLLECTION, groupId);
      const memberRef = doc(db, GROUPS_COLLECTION, groupId, 'members', userId);
      const userRef = doc(db, 'users', userId);

      const batch = writeBatch(db);

      batch.set(memberRef, {
        ...memberData,
        status: 'active',
        joinedAt: Timestamp.now()
      });

      batch.update(groupRef, {
        memberCount: increment(1),
        memberIds: arrayUnion(userId)
      });

      batch.update(userRef, {
        joinedGroups: arrayUnion(groupId)
      });

      await batch.commit();

      try {
        await chatService.addGroupChatParticipant(groupId, userId);
      } catch (e) { console.error('Chat sync error (joinGroup):', e); }
    } catch (error) {
      await reportError(error, 'groupService.joinGroup');
      throw error;
    }
  },

  // Request to join a group
  requestJoinGroup: async (groupId: string, userId: string, memberData: Omit<Member, 'id'>) => {
    const memberRef = doc(db, GROUPS_COLLECTION, groupId, 'members', userId);
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

    batch.update(groupRef, {
      memberCount: increment(1),
      memberIds: arrayUnion(userId)
    });

    batch.update(userRef, {
      joinedGroups: arrayUnion(groupId)
    });

    await batch.commit();

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
    try {
      const groupRef = doc(db, GROUPS_COLLECTION, groupId);
      const memberRef = doc(db, GROUPS_COLLECTION, groupId, 'members', userId);
      const userRef = doc(db, 'users', userId);
      
      const batch = writeBatch(db);

      batch.delete(memberRef);

      batch.update(groupRef, {
        memberCount: increment(-1),
        memberIds: arrayRemove(userId)
      });

      batch.update(userRef, {
        joinedGroups: arrayRemove(groupId)
      });

      await batch.commit();

      try {
        await chatService.removeGroupChatParticipant(groupId, userId);
      } catch (e) { console.error('Chat sync error (leaveGroup):', e); }
    } catch (error) {
      await reportError(error, 'groupService.leaveGroup');
      throw error;
    }
  },

  // Kick a member from a group
  kickMember: async (groupId: string, userId: string) => {
    try {
      const groupRef = doc(db, GROUPS_COLLECTION, groupId);
      const memberRef = doc(db, GROUPS_COLLECTION, groupId, 'members', userId);
      const userRef = doc(db, 'users', userId);
      
      const batch = writeBatch(db);

      batch.delete(memberRef);

      batch.update(groupRef, {
        memberCount: increment(-1),
        memberIds: arrayRemove(userId)
      });

      batch.update(userRef, {
        joinedGroups: arrayRemove(groupId)
      });

      await batch.commit();

      try {
        await chatService.kickGroupChatParticipant(groupId, userId);
      } catch (e) { console.error('Chat sync error (kickMember):', e); }
    } catch (error) {
      await reportError(error, 'groupService.kickMember');
      throw error;
    }
  },

  // Claim admin rights for an unassigned group
  claimGroupAdmin: async (groupId: string, userId: string, memberData: Omit<Member, 'id'>): Promise<void> => {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    const memberRef = doc(db, GROUPS_COLLECTION, groupId, 'members', userId);
    const userRef = doc(db, 'users', userId);

    const batch = writeBatch(db);

    batch.update(groupRef, {
      ownerId: userId,
      memberCount: increment(1),
      memberIds: arrayUnion(userId),
      updatedAt: Timestamp.now(),
    });

    batch.set(memberRef, {
      ...memberData,
      role: 'owner',
      status: 'active',
      joinedAt: Timestamp.now()
    });

    batch.update(userRef, {
      joinedGroups: arrayUnion(groupId),
    });

    await batch.commit();

    try {
      await chatService.syncGroupChatAdmin(groupId, userId);
      await chatService.addGroupChatParticipant(groupId, userId);
    } catch (e) { console.error('Chat sync error (claimGroupAdmin):', e); }
  }
};
