import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { groupService } from '@/lib/firebase/groupService';
import { chatService } from '@/lib/firebase/chatService';
import { userService } from '@/lib/firebase/userService';

import UserBadge from '../common/UserBadge';

interface GroupMembersPopupProps {
  roomId: string;
  onClose: () => void;
}

interface MemberInfo {
  id: string;
  nickname?: string;
  nativeNickname?: string;
  displayName?: string;
  photoURL?: string;
  role: 'owner' | 'admin' | 'staff' | 'member';
}

export default function GroupMembersPopup({ roomId, onClose }: GroupMembersPopupProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<any>(null);
  const [linkedGroupId, setLinkedGroupId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');
  const [kickingId, setKickingId] = useState<string | null>(null);
  const [confirmKickId, setConfirmKickId] = useState<string | null>(null);
  const handleClose = onClose; // Replaced useHistoryBack

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const roomData = await chatService.getChatRoom(roomId);
      if (!roomData) return;
      
      setRoom(roomData);
      const groupId = roomData.linkedGroupId;
      setLinkedGroupId(groupId || null);

      // Fetch group members with roles from subcollection
      let roleMap: Record<string, string> = {};
      let groupOwnerId: string | null = null;
      
      if (groupId) {
        const groupData = await groupService.getGroup(groupId);
        if (groupData) {
          groupOwnerId = groupData.ownerId || null;
        }
        
        const groupMembers = await groupService.getGroupMembersAll(groupId);
        groupMembers.forEach(member => {
          roleMap[member.id] = member.role || 'member';
        });
      }

      // Build members list from room participants
      const memberPromises = (roomData.participants || []).map(async (uid: string) => {
        const userData = await userService.getUserById(uid);
        const userDetails = (userData || {}) as any;
        
        let role: 'owner' | 'admin' | 'staff' | 'member' = 'member';
        if (uid === groupOwnerId) {
          role = 'owner';
        } else if (roleMap[uid] === 'admin' || roleMap[uid] === 'owner') {
          role = 'admin';
        } else if (roleMap[uid] === 'staff') {
          role = 'staff';
        }
        
        return {
          id: uid,
          nickname: userDetails.nickname,
          nativeNickname: userDetails.nativeNickname,
          displayName: userDetails.displayName,
          photoURL: userDetails.photoURL,
          role
        } as MemberInfo;
      });
      
      const membersData = await Promise.all(memberPromises);
      
      // Sort: owner first, then admin, then staff, then members
      const roleOrder: Record<string, number> = { owner: 0, admin: 1, staff: 2, member: 3 };
      membersData.sort((a, b) => (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3));
      
      setMembers(membersData);
      
      // Set current user's role
      if (user) {
        const myMember = membersData.find(m => m.id === user.uid);
        setCurrentUserRole(myMember?.role || 'member');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [roomId, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const canKick = currentUserRole === 'owner' || currentUserRole === 'admin' || currentUserRole === 'staff';

  const handleKick = async (targetId: string) => {
    if (!linkedGroupId) return;
    setKickingId(targetId);
    try {
      await groupService.kickMember(linkedGroupId, targetId);
      // Refresh member list
      await fetchData();
      setConfirmKickId(null);
    } catch (err) {
      console.error('Kick failed:', err);
      alert('Failed to remove member.');
    } finally {
      setKickingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <span className="font-['Inter'] font-bold text-[10px] leading-[1rem] text-[#004190] bg-[#d8e2ff] px-2 py-0.5 rounded-full mt-1 w-max">Owner</span>;
      case 'admin':
        return <span className="font-['Inter'] font-bold text-[10px] leading-[1rem] text-[#b31b25] bg-[#ffd8d8] px-2 py-0.5 rounded-full mt-1 w-max">Admin</span>;
      case 'staff':
        return <span className="font-['Inter'] font-bold text-[10px] leading-[1rem] text-[#6d3b00] bg-[#ffe5c2] px-2 py-0.5 rounded-full mt-1 w-max">Staff</span>;
      default:
        return <span className="font-['Inter'] font-bold text-[10px] leading-[1rem] text-[#424753] bg-[#e1e2eb] px-2 py-0.5 rounded-full mt-1 w-max">Member</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-[#f9f9ff] text-[#191b22] flex flex-col items-center overflow-y-auto">
      {/* TopAppBar */}
      <header className="bg-white/80 backdrop-blur-xl docked full-width top-0 z-50 border-b border-slate-100 shadow-sm flex justify-between items-center w-full px-4 h-16 max-w-[896px] mx-auto fixed">
        <button 
          onClick={handleClose}
          className="text-blue-600 hover:bg-slate-100 transition-colors active:scale-95 transition-transform p-2 rounded-full flex items-center justify-center"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-slate-900">Group Members</h1>
        <div className="w-10 h-10" />
      </header>

      <main className="w-full max-w-[896px] mt-16 px-6 py-8 flex flex-col space-y-10">
        {/* Member List */}
        <section className="flex flex-col space-y-2">
          {loading ? (
            <div className="animate-pulse flex flex-col gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-4 p-4 bg-white rounded-lg">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <h2 className="font-['Inter'] font-semibold text-[0.75rem] leading-[1rem] text-[#424753] uppercase tracking-wider mb-2">
                {members.length} Members
              </h2>
              
              {members.map(member => {
                const isProtected = member.role === 'owner' || member.role === 'admin' || member.role === 'staff';
                const isSelf = member.id === user?.uid;
                const showKick = canKick && !isProtected && !isSelf;
                
                return (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-[#ffffff] rounded-lg shadow-sm hover:shadow-md hover:outline-[#c2c6d5] hover:outline transition-all group">
                    <UserBadge
                      uid={member.id}
                      nickname={member.nickname || member.displayName || 'Unknown'}
                      nativeNickname={member.nativeNickname}
                      photoURL={member.photoURL}
                      avatarSize="w-12 h-12"
                      nameClassName="font-['Inter'] font-medium text-[0.875rem] leading-[1.25rem] text-[#191b22]"
                      nativeClassName="text-[12px] font-medium text-gray-500 normal-case tracking-normal ml-1.5"
                      subText={getRoleBadge(member.role)}
                    />
                    
                    {/* Kick button (visible to owner/admin/staff, not on protected or self) */}
                    {showKick && (
                      <div className="flex items-center">
                        {confirmKickId === member.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleKick(member.id)}
                              disabled={kickingId === member.id}
                              className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50"
                            >
                              {kickingId === member.id ? (
                                <span className="material-symbols-outlined animate-spin !text-[14px]">progress_activity</span>
                              ) : 'Remove'}
                            </button>
                            <button
                              onClick={() => setConfirmKickId(null)}
                              className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 active:scale-95 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmKickId(member.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500"
                            title="Remove member"
                          >
                            <span className="material-symbols-outlined !text-[20px]">person_remove</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
