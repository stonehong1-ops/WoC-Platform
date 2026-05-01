import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useHistoryBack } from '@/hooks/useHistoryBack';
import UserBadge from '../common/UserBadge';

interface GroupMembersPopupProps {
  roomId: string;
  onClose: () => void;
}

export default function GroupMembersPopup({ roomId, onClose }: GroupMembersPopupProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<any>(null);
  const { handleClose } = useHistoryBack(true, onClose);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const roomDoc = await getDoc(doc(db, 'chat_rooms', roomId));
        if (roomDoc.exists()) {
          const roomData = roomDoc.data();
          setRoom(roomData);
          
          const memberPromises = (roomData.participants || []).map(async (uid: string) => {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              return { id: uid, ...userDoc.data() };
            }
            return { id: uid, nickname: 'Unknown' };
          });
          
          const membersData = await Promise.all(memberPromises);
          setMembers(membersData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [roomId]);

  return (
    <div className="fixed inset-0 z-[10000] bg-[#f9f9ff] text-[#191b22] flex flex-col items-center overflow-y-auto">
      {/* TopAppBar */}
      <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl docked full-width top-0 z-50 border-b border-slate-100 dark:border-slate-800 shadow-sm flex justify-between items-center w-full px-4 h-16 max-w-[896px] mx-auto fixed">
        <button 
          onClick={handleClose}
          className="text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95 transition-transform p-2 rounded-full flex items-center justify-center"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-slate-900 dark:text-slate-50">Group Members</h1>
        {/* Removed more_vert icon to balance header spacing */}
        <div className="w-10 h-10" />
      </header>

      <main className="w-full max-w-[896px] mt-16 px-6 py-8 flex flex-col space-y-10">
        {/* Invite Section */}
        <section>
          <button className="w-full flex items-center justify-center space-x-3 bg-[#0057bd] text-[#c2d3ff] rounded-xl p-4 shadow-sm hover:shadow-md hover:bg-[#0b5ac0] active:scale-95 transition-all duration-200">
            <span className="material-symbols-outlined">person_add</span>
            <span className="font-['Plus_Jakarta_Sans'] font-bold text-[1.125rem] leading-[1.5rem]">Invite New Member</span>
          </button>
        </section>

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
                const isOwner = room?.createdBy === member.id;
                const displayName = member.nickname || member.nativeNickname || member.displayName || 'Unknown';
                
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
                      subText={
                        isOwner ? (
                          <span className="font-['Inter'] font-bold text-[10px] leading-[1rem] text-[#004190] bg-[#d8e2ff] px-2 py-0.5 rounded-full mt-1 w-max">Owner</span>
                        ) : (
                          <span className="font-['Inter'] font-bold text-[10px] leading-[1rem] text-[#424753] bg-[#e1e2eb] px-2 py-0.5 rounded-full mt-1 w-max">Member</span>
                        )
                      }
                    />
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
