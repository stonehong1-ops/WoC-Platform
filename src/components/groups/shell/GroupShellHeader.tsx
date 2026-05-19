// 그룹 App-in-App Shell의 그래디언트 헤더 + Leave/Switch 드롭다운
'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Group } from '@/types/group';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import ImageWithFallback from '@/components/common/ImageWithFallback';
import { groupService } from '@/lib/firebase/groupService';

interface GroupShellHeaderProps {
  group: Group;
  onExit: () => void;
}

export default function GroupShellHeader({ group, onExit }: GroupShellHeaderProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // 내 그룹 목록
  const [myGroups, setMyGroups] = useState<Group[]>([]);

  React.useEffect(() => {
    if (!user) return;
    const fetchMyGroups = async () => {
      try {
        const allGroups = await groupService.getGroups();
        const joined = allGroups.filter((g: any) => {
          const inJoinedGroups = profile?.joinedGroups && profile.joinedGroups.includes(g.id);
          const inMemberIds = g.memberIds && Array.isArray(g.memberIds) && g.memberIds.includes(user.uid);
          const isOwner = g.ownerId === user.uid;
          return inJoinedGroups || inMemberIds || isOwner;
        });
        setMyGroups(joined as Group[]);
      } catch (err) {
        console.error("Failed to load my groups", err);
      }
    };
    fetchMyGroups();
  }, [user, profile]);

  const handleSwitchGroup = (targetGroupId: string) => {
    if (targetGroupId === group.id) {
      setIsDropdownOpen(false);
      return;
    }
    setIsDropdownOpen(false);
    router.push(`/groups/${targetGroupId}`);
  };

  const handleLeaveGroup = () => {
    setIsDropdownOpen(false);
    onExit();
  };

  // 그룹 이니셜 (아이콘 대체)
  const groupInitial = group.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="header" style={{ background: 'var(--palette-gradient)' }}>
      {/* 장식용 원형 배경 (헤더 밖으로 넘치는 부분을 가리면서 드롭다운은 자르지 않기 위함) */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', borderRadius: 'inherit' }}>
        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          top: '-220px',
          right: '-100px',
          filter: 'blur(10px)'
        }} />
      </div>

      <div className="header-top">
        {/* 그룹 정보 */}
        <div className="group-info">
          <div className="group-icon">
            {group.logo ? (
              <ImageWithFallback
                src={group.logo}
                alt={group.name}
                className="w-full h-full rounded-full object-cover"
                fallbackType="cover"
              />
            ) : group.coverImage ? (
              <ImageWithFallback
                src={group.coverImage}
                alt={group.name}
                className="w-full h-full rounded-full object-cover"
                fallbackType="cover"
              />
            ) : (
              <span>{groupInitial}</span>
            )}
          </div>
          <div>
            <div className="group-title">{group.name}</div>
            {group.nativeName && (
              <div className="group-sub">{group.nativeName}</div>
            )}
          </div>
        </div>

        {/* Leave/Switch 버튼 */}
        <div className="leave-wrap">
          <button
            className="leave-btn"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
            <span>Exit</span>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {isDropdownOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-[99]"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="leave-dropdown"
                >
                  {/* 현재 그룹 */}
                  <div className="dropdown-section">
                    <div className="dropdown-label">Current Group</div>
                    <div className="club-item active-club">
                      <div
                        className="club-dot"
                        style={{ backgroundColor: group.headerThemeColor || '#1a1c23' }}
                      >
                        {groupInitial}
                      </div>
                      <div className="club-name">{group.name}</div>
                      <span className="material-symbols-outlined" style={{ color: 'var(--palette-main)', fontSize: 18 }}>check_circle</span>
                    </div>
                  </div>

                  {/* 다른 그룹 */}
                  {myGroups.filter(g => g.id !== group.id).length > 0 && (
                    <>
                      <div className="divider" />
                      <div className="dropdown-section">
                        <div className="dropdown-label">Switch to</div>
                        {myGroups.filter(g => g.id !== group.id).map(g => (
                          <div
                            key={g.id}
                            className="club-item"
                            onClick={() => handleSwitchGroup(g.id)}
                          >
                            <div
                              className="club-dot"
                              style={{ backgroundColor: g.headerThemeColor || '#636e72' }}
                            >
                              {g.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="club-name">{g.name}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* 나가기 */}
                  <div className="divider" />
                  <div
                    className="dropdown-section leave-club"
                    onClick={handleLeaveGroup}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 8 }}>exit_to_app</span>
                    Leave Group
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
