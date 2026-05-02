import React, { useEffect, useState } from 'react';
import { PlatformUser } from '@/types/user';
import { userService } from '@/lib/firebase/userService';
import { groupService } from '@/lib/firebase/groupService';
import UserAvatar from '@/components/common/UserAvatar';

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
}

export default function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinedGroupsInfo, setJoinedGroupsInfo] = useState<any[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await userService.getUserById(userId);
        setUser(userData);
        
        if (userData?.joinedGroups && userData.joinedGroups.length > 0) {
          const groupsInfo = await Promise.all(
            userData.joinedGroups.map(async (groupId) => {
              try {
                const group = await groupService.getGroup(groupId);
                return {
                  id: groupId,
                  name: group?.name || 'Unknown Group',
                  icon: (group as any)?.category === 'dance' ? 'music_note' : 
                        (group as any)?.category === 'tech' ? 'computer' : 
                        (group as any)?.category === 'business' ? 'business_center' : 'language'
                };
              } catch (e) {
                return null;
              }
            })
          );
          setJoinedGroupsInfo(groupsInfo.filter(g => g !== null));
        }
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 modal-overlay" onClick={onClose}>
      <style dangerouslySetInnerHTML={{__html: `
        .modal-overlay {
            background-color: rgba(25, 27, 34, 0.7);
            backdrop-filter: blur(4px);
        }
      `}} />
      <div 
        className="bg-surface-container-lowest w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl ring-1 ring-outline-variant/30 flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {loading ? (
          <div className="w-full pt-10 pb-10 flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : !user ? (
          <div className="w-full pt-10 pb-10 flex flex-col items-center justify-center min-h-[300px]">
            <p className="text-on-surface-variant font-medium">User not found</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-primary/10 text-primary font-bold rounded-lg">Close</button>
          </div>
        ) : (
          <>
            <div className="w-full pt-10 pb-6 flex flex-col items-center">
              <div className="relative mb-6">
                <div className="w-28 h-28 rounded-full border-4 border-surface-container-high shadow-md overflow-hidden bg-surface-container">
                  <UserAvatar 
                    photoURL={user.photoURL} 
                    alt="User Profile Photo" 
                    className="w-full h-full"
                    iconSize="48px"
                  />
                </div>
                <button 
                  onClick={onClose}
                  className="absolute -top-4 -right-4 bg-surface shadow-sm p-2 rounded-full text-outline hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="px-6 space-y-1">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-primary text-[18px]">public</span>
                  <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">{(user as any).country || 'Global Citizen'}</span>
                </div>
                <h2 className="font-title-md text-[22px] text-on-background">{user.nickname || (user as any).displayName || 'Anonymous'}</h2>
                <p className="font-body-md text-on-surface-variant/70 italic text-[14px]">{(user as any).realName || (user as any).displayName || ''}</p>
              </div>
            </div>

            <div className="w-full px-8 pb-8 space-y-4">
              <div className="h-px bg-outline-variant/20 w-full mb-6"></div>
              
              <div className="space-y-4 text-left">
                {user.email && (
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                      <span className="material-symbols-outlined">mail</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-xs text-outline uppercase">Professional Email</span>
                      <span className="font-body-md text-on-background">{user.email}</span>
                    </div>
                  </div>
                )}
                {user.phoneNumber && (
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                      <span className="material-symbols-outlined">call</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-xs text-outline uppercase">Primary Mobile</span>
                      <span className="font-body-md text-on-background">{user.phoneNumber}</span>
                    </div>
                  </div>
                )}
              </div>

              {joinedGroupsInfo.length > 0 && (
                <div className="space-y-3 text-left pt-2 border-t border-outline-variant/10">
                  <span className="font-label-xs text-outline uppercase block mt-4">My Groups</span>
                  <div className="space-y-3 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                    {joinedGroupsInfo.map((g, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary/70 shrink-0">
                          <span className="material-symbols-outlined text-[18px]">{g.icon}</span>
                        </div>
                        <span className="font-body-md text-on-background text-[14px] line-clamp-1">{g.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-6 flex justify-center items-center gap-6">
                <button 
                  onClick={() => user.phoneNumber ? window.open(`tel:${user.phoneNumber}`) : alert('Phone number not available')}
                  className="flex-1 aspect-square max-w-[72px] rounded-2xl bg-primary text-on-primary flex flex-col items-center justify-center shadow-sm hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
                  <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Call</span>
                </button>
                <button 
                  className="flex-1 aspect-square max-w-[72px] rounded-2xl bg-primary text-on-primary flex flex-col items-center justify-center shadow-sm hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
                  <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Chat</span>
                </button>
                <button 
                  onClick={() => user.phoneNumber ? window.open(`https://wa.me/${user.phoneNumber.replace(/[^0-9]/g, '')}`) : alert('Phone number not available')}
                  className="flex-1 aspect-square max-w-[72px] rounded-2xl bg-primary text-on-primary flex flex-col items-center justify-center shadow-sm hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"></path>
                  </svg>
                  <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">WA</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
