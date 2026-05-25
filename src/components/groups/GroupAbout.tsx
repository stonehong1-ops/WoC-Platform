"use client";

import React, { useState, useEffect } from 'react';
import { Group } from '@/types/group';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase/clientApp';
import { doc, getDoc } from 'firebase/firestore';
import { groupService } from '@/lib/firebase/groupService';
import UserBadge from '@/components/common/UserBadge';


interface GroupAboutProps {
  group: Group;
  members?: any[];
  allUsers?: any[];
  isClaiming?: boolean;
  handleClaimAdmin?: (targetUserId: string, targetUserName: string) => Promise<void>;
  isMembersLoading?: boolean;
}

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

const GroupAbout: React.FC<GroupAboutProps> = ({ 
  group, 
  members, 
  allUsers = [], 
  isClaiming = false, 
  handleClaimAdmin,
  isMembersLoading = false
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  
  const [claimOwnerName, setClaimOwnerName] = useState("");
  const [claimOwnerId, setClaimOwnerId] = useState("");
  const [claimResults, setClaimResults] = useState<any[]>([]);
  const [showClaimResults, setShowClaimResults] = useState(false);
  const [showLiveMap, setShowLiveMap] = useState(false);

  const handleLeaveGroup = async () => {
    if (!user || !group.id) return;
    
    const confirmLeave = window.confirm(
      t("group.about.leave_confirm", "Are you sure you want to leave this community?")
    );
    if (!confirmLeave) return;

    setIsLeaving(true);
    try {
      await groupService.leaveGroup(group.id, user.uid);
      toast.success(t("group.about.leave_success", "Successfully left the community."));
      window.location.reload();
    } catch (error) {
      console.error("Failed to leave group:", error);
      toast.error(t("group.about.leave_fail", "Failed to leave the community. Please try again."));
    } finally {
      setIsLeaving(false);
    }
  };
  
  // Venue address fetched from venue document (not stored in group)
  const [venueAddress, setVenueAddress] = useState<string>('');

  // Date formatter for joined date
  const getJoinedDateString = (joinedAt: any) => {
    if (!joinedAt) return '';
    try {
      let dateObj: Date;
      if (joinedAt && typeof joinedAt.toDate === 'function') {
        dateObj = joinedAt.toDate();
      } else if (joinedAt instanceof Date) {
        dateObj = joinedAt;
      } else if (typeof joinedAt === 'number') {
        dateObj = new Date(joinedAt);
      } else if (typeof joinedAt === 'string') {
        dateObj = new Date(joinedAt);
      } else if (joinedAt.seconds) {
        dateObj = new Date(joinedAt.seconds * 1000);
      } else {
        return '';
      }
      
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}. ${month}. ${day}.`;
    } catch (e) {
      console.error("Failed to parse joinedAt date:", e);
      return '';
    }
  };

  // Fetch address from venue document (single source of truth)
  useEffect(() => {
    const fetchVenueAddress = async () => {
      if (group.venueId) {
        try {
          const vSnap = await getDoc(doc(db, 'venues', group.venueId));
          if (vSnap.exists()) {
            const vData = vSnap.data();
            setVenueAddress(vData.address || vData.city || '');
          }
        } catch (e) {
          console.error('Failed to fetch venue address:', e);
        }
      }
    };
    fetchVenueAddress();
  }, [group.venueId]);
  
  // Photo Viewer State
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Extract gallery images
  const getGalleryImages = () => {
    if (group.aboutPhotos && group.aboutPhotos.length > 0) {
      return group.aboutPhotos;
    }
    let images: string[] = [];
    if (group.gallery) {
      group.gallery.forEach(sec => {
        if (sec.type === 'photos' && sec.media) {
          images = [...images, ...sec.media];
        }
      });
    }
    return images;
  };
  const galleryImages = getGalleryImages();
  // Ensure we always have at least fallback images if empty
  const defaultFallback = "https://lh3.googleusercontent.com/aida/ADBb0ug-hPMVqq1Aj_dtT00E_6_II27LkLFavGyeJrot7giurbGLzEOWSPxMI9vbLcyL8z8WmaGTEVuwrH0tN2f-uDoxeG9_03SOAlsOK3JwaeB-ksfuSK5bYve8iAHv-du8nUXre_b7CdETBnRFLl347MwmNoaYtOewRCgeYEJyG4OLbEO7o4mof2PJJK680fdDXv8LNFANn3OcIBQkQ-WbJiYdGnot5Ko7F5B2YA6JMrRhjbjjunBmTlfszzJwMWlp9OhF4zuyz0Eq";
  const displayImages = galleryImages.length > 0 ? galleryImages : [group.coverImage || defaultFallback];

  const img1 = displayImages[0] || displayImages[0];
  const img2 = displayImages[1] || displayImages[0];
  const img3 = displayImages[2] || displayImages[0];
  const img4 = displayImages[3] || displayImages[0];
  const moreCount = displayImages.length > 4 ? displayImages.length - 4 : 0;

  const closeViewer = () => setIsViewerOpen(false); // Replaced useHistoryBack

  const openViewer = (index: number) => {
    if (displayImages.length === 0) return;
    setViewerIndex(Math.min(index, displayImages.length - 1));
    setIsViewerOpen(true);
  };

  const paginate = (newDirection: number) => {
    const newIndex = viewerIndex + newDirection;
    if (newIndex >= 0 && newIndex < displayImages.length) {
      setViewerIndex(newIndex);
    }
  };

  // Merge dynamic members and group.members safely, preventing duplicates
  const actualMembers = members || [];
  const groupMembers = group.members || [];
  const allMembersMap = new Map<string, any>();
  
  groupMembers.forEach(m => {
    if (m && m.id) {
      allMembersMap.set(m.id, {
        id: m.id,
        name: m.name,
        avatar: m.avatar || m.photoURL,
        role: m.role,
        joinedAt: m.joinedAt,
        status: m.status
      });
    }
  });
  
  actualMembers.forEach(m => {
    if (m && m.id) {
      allMembersMap.set(m.id, {
        ...allMembersMap.get(m.id),
        ...m,
        id: m.id,
        name: m.name || allMembersMap.get(m.id)?.name,
        avatar: m.avatar || m.photoURL || allMembersMap.get(m.id)?.avatar,
        role: m.role || allMembersMap.get(m.id)?.role
      });
    }
  });
  
  const mergedMembers = Array.from(allMembersMap.values());

  // Check current user's membership
  const currentMember = user ? mergedMembers.find(m => m.id === user.uid) : null;
  const isJoined = !!currentMember;

  // State to hold members with their full UserProfile fetched from DB
  const [membersWithProfiles, setMembersWithProfiles] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchProfiles = async () => {
      const withProfiles = await Promise.all(mergedMembers.map(async (member) => {
        try {
          const { userService } = await import('@/lib/firebase/userService');
          const userProfile = await userService.getUserById(member.id);
          return {
            ...member,
            profile: userProfile,
            isInstructor: userProfile?.isInstructor || member.role === 'instructor',
            isStaff: userProfile?.isStaff || userProfile?.systemRole === 'staff' || member.role === 'staff' || member.role === 'moderator',
            isDj: userProfile?.isDj,
            isServiceProvider: userProfile?.isServiceProvider,
            name: userProfile?.nickname || member.name || member.nickname || 'Unknown',
            avatar: userProfile?.photoURL || member.avatar || member.photoURL || null,
            phone: userProfile?.phoneNumber || member.phone || null,
            allowPhoneCalls: userProfile?.allowPhoneCalls !== false
          };
        } catch (error) {
          console.error(`Failed to fetch profile for user ${member.id}:`, error);
          return { ...member, profile: null };
        }
      }));
      if (isMounted) {
        setMembersWithProfiles(withProfiles);
      }
    };
    if (mergedMembers.length > 0) {
      fetchProfiles();
    }
    return () => { isMounted = false; };
  }, [members, group.members]);

  // Hybrid binding: fallback to mergedMembers until async profile load is complete
  const targetMembers = membersWithProfiles.length > 0 ? membersWithProfiles : mergedMembers;

  // Extract team members (Owner, Instructor, Staff)
  const ownersList: any[] = [];
  const owners = targetMembers.filter(m => m.role === 'owner' || m.id === group.ownerId);
  owners.forEach(owner => {
    ownersList.push({
      id: owner.id,
      name: owner.name,
      roleName: t("group.about.role.representative", "대표"),
      avatar: owner.avatar || null,
      phone: owner.phone || null,
      allowPhoneCalls: owner.allowPhoneCalls !== false
    });
  });
  if (ownersList.length === 0 && group.representative) {
    ownersList.push({
      id: group.ownerId || 'representative',
      name: group.representative.name,
      roleName: t("group.about.role.representative", "대표"),
      avatar: group.representative.avatar || null,
      phone: group.representative.phone || null
    });
  }
  const ownerIds = new Set(ownersList.map(o => o.id));

  const instructorsList: any[] = [];
  const instructors = targetMembers.filter(m => (m.role === 'instructor' || m.isInstructor) && !ownerIds.has(m.id));
  instructors.forEach(m => {
    instructorsList.push({
      id: m.id,
      name: m.name,
      roleName: t("group.about.role.instructor", "강사"),
      avatar: m.avatar || null,
      phone: m.phone || null,
      allowPhoneCalls: m.allowPhoneCalls !== false
    });
  });
  const instructorIds = new Set(instructorsList.map(i => i.id));

  const staffList: any[] = [];
  const staff = targetMembers.filter(m => 
    (m.role === 'staff' || m.role === 'moderator' || m.isStaff || m.isServiceProvider) && 
    !ownerIds.has(m.id) && 
    !instructorIds.has(m.id)
  );
  staff.forEach(m => {
    let roleLabel = t("group.about.role.staff", "스태프");
    if (m.role === 'moderator') {
      roleLabel = t("group.about.role.moderator", "운영진");
    }
    staffList.push({
      id: m.id,
      name: m.name,
      roleName: roleLabel,
      avatar: m.avatar || null,
      phone: m.phone || null,
      allowPhoneCalls: m.allowPhoneCalls !== false
    });
  });

  const hasOwnerInMembers = targetMembers.find(m => m.role === 'owner' || m.id === group.ownerId) || (group.representative ? { name: group.representative.name } : null);

  const renderTeamMemberCard = (member: any) => (
    <div key={member.id} className="flex items-center justify-between p-3.5 bg-surface border border-outline-variant/20 rounded-2xl">
      <UserBadge
        uid={member.id || ''}
        photoURL={member.avatar}
        nickname={member.name}
        avatarSize="w-12 h-12"
        nameClassName="font-label-md text-label-md font-bold text-on-surface"
        subText={
          <p className="font-label-sm text-label-sm text-on-surface-variant capitalize mt-0.5">
            {member.roleName}
          </p>
        }
      />
      <div className="flex gap-1">
        <button 
          className="p-2 text-primary hover:bg-primary-container rounded-full"
          onClick={() => toast.info(t('common.coming_soon') || 'Chat feature coming soon!')}
        >
          <span className="material-symbols-outlined">chat</span>
        </button>
        {member.phone && (
          <button 
            className="p-2 text-primary hover:bg-primary-container rounded-full"
            onClick={() => {
              if (member.allowPhoneCalls === false) {
                toast.error(t('myinfo.phone_private_toast'));
                return;
              }
              window.location.href = `tel:${member.phone}`;
            }}
          >
            <span className="material-symbols-outlined">call</span>
          </button>
        )}
      </div>
    </div>
  );

  const isLocked = group.ownerId === 'system1' || !group.ownerId;

  return (
    <div className="space-y-8">
      {/* 최상단 마운트 영역: 멤버 가입 & It's mine 클레임 */}
      <div className="space-y-4">
        {/* 1. It's mine 인라인 클레임 카드 (Locked 상태일 때 노출) */}
        {isLocked && (
          <div className="bg-white rounded-2xl p-6 border border-amber-200/50 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl font-bold">shield_person</span>
              </div>
              <div>
                <h4 className="font-title-lg text-title-lg font-bold text-on-surface">{t('group.claim.title') || "Claim Group Admin"}</h4>
                <p className="text-xs text-on-surface-variant font-medium mt-0.5">{t('group.claim.desc') || "Search and designate the owner of this community."}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <div className="relative flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <span className="material-symbols-outlined text-on-surface-variant mr-2 text-[20px]">person_filled</span>
                  <input
                    value={claimOwnerName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setClaimOwnerName(val);
                      setClaimOwnerId('');
                      if (val.length >= 1) {
                        const lower = val.toLowerCase();
                        const filtered = allUsers.filter((u: any) =>
                          (u.nickname && u.nickname.toLowerCase().includes(lower)) ||
                          (u.nativeNickname && u.nativeNickname.includes(val))
                        );
                        setClaimResults(filtered.slice(0, 6));
                        setShowClaimResults(filtered.length > 0);
                      } else {
                        setShowClaimResults(false);
                        setClaimResults([]);
                      }
                    }}
                    onFocus={() => claimOwnerName.length >= 1 && setShowClaimResults(claimResults.length > 0)}
                    onBlur={() => setTimeout(() => setShowClaimResults(false), 200)}
                    className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-on-surface placeholder:text-on-surface-variant/40 outline-none font-body"
                    placeholder={t('group.claim.search_placeholder') || "Enter name or nickname"}
                    type="text"
                  />
                  {claimOwnerId && (
                    <span className="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
                  )}
                </div>
                {showClaimResults && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#e0e4e5] rounded-xl shadow-lg z-50 overflow-hidden">
                    {claimResults.map((u: any) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setClaimOwnerName(u.nickname || u.nativeNickname || '');
                          setClaimOwnerId(u.id);
                          setShowClaimResults(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-[#f8f9fa] flex items-center gap-3 group transition-colors border-b border-[#f2f4f4] last:border-0"
                      >
                        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">person</span>
                        <div className="flex flex-col">
                          <p className="font-bold text-on-surface text-sm group-hover:text-primary leading-tight font-body">{u.nickname}</p>
                          {u.nativeNickname && <span className="text-[10px] text-on-surface-variant font-medium leading-tight font-body">{u.nativeNickname}</span>}
                        </div>
                        {u.id === user?.uid && (
                          <span className="ml-auto text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full font-body">{t('group.claim.me') || "Me"}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {claimOwnerId && (
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!handleClaimAdmin) return;
                      try {
                        await handleClaimAdmin(claimOwnerId, claimOwnerName);
                        setClaimOwnerName("");
                        setClaimOwnerId("");
                      } catch (e) {
                        toast.error(t('group.claim.error') || 'Failed to claim group admin');
                      }
                    }}
                    disabled={isClaiming}
                    className="w-full py-3 bg-[#0057bd] text-white font-bold rounded-xl active:scale-95 transition-all text-sm shadow-sm font-body"
                  >
                    {isClaiming ? (t('group.claim.saving') || "Saving...") : (t('group.claim.button') || "Claim Ownership (소유권 주장)")}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. 멤버 가입 / 이미 가입된 멤버 카드 */}
        {isMembersLoading ? (
          <div className="animate-pulse bg-[#f8f9fa] p-5 rounded-2xl border border-outline-variant/30 text-center shadow-sm h-36 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#0057bd]/20 border-t-[#0057bd] rounded-full animate-spin"></div>
          </div>
        ) : isJoined ? (
          <div className="bg-[#f8f9fa] p-5 rounded-2xl border border-outline-variant/30 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#0057bd]/10 text-[#0057bd] flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-2xl font-bold">verified</span>
            </div>
            <p className="text-[16px] leading-[1.6] text-on-surface font-bold mb-1 font-body">
              {t("group.about.already_member", "이미 가입된 멤버입니다")}
            </p>
            {currentMember?.joinedAt && (
              <p className="text-[12px] leading-[1.2] text-on-surface-variant mt-1 font-body">
                {t("group.about.joined_date", { date: getJoinedDateString(currentMember.joinedAt) })}
              </p>
            )}
            <div className="mt-4 pt-3 border-t border-[#f2f4f4]">
              <button
                onClick={handleLeaveGroup}
                disabled={isLeaving}
                className="text-[11px] font-bold text-on-surface-variant/40 hover:text-red-500 transition-colors duration-200 active:scale-95 disabled:opacity-50 font-body"
              >
                {isLeaving 
                  ? t("group.about.leaving") || "Leaving..." 
                  : t("group.about.leave") || "Leave Community"
                }
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#0057bd] p-5 rounded-2xl shadow-lg shadow-[#0057bd]/25">
            <p className="text-[18px] leading-[1.8] text-white mb-2 font-bold font-body">{t("group.about.become_member")}</p>
            <p className="text-[13px] leading-[1.3] text-white/80 mb-4 font-body">{t("group.about.join_desc", { name: group.name || 'our vibrant community' })}</p>
            <button 
              className="w-full py-3 bg-white text-[#0057bd] font-bold rounded-xl active:scale-[0.98] transition-transform shadow-sm font-body text-sm"
              onClick={() => toast.success(t("group.about.join_requested") || "Join request sent!")}
            >
              {t("group.about.join_button")}
            </button>
          </div>
        )}
      </div>

      {/* Fullscreen Photo Viewer */}
      <AnimatePresence>
        {isViewerOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md">
            <button 
              onClick={closeViewer}
              className="absolute top-6 right-6 text-white/70 hover:text-white z-50 p-2 bg-black/20 rounded-full backdrop-blur-sm transition-colors"
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
            
            <div className="absolute top-6 left-6 text-white/70 font-label-md bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
              {viewerIndex + 1} / {displayImages.length}
            </div>

            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <AnimatePresence initial={false} custom={viewerIndex}>
                <motion.img
                  key={viewerIndex}
                  src={displayImages[viewerIndex]}
                  custom={viewerIndex}
                  initial={{ opacity: 0, x: 300, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -300, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={(e, { offset, velocity }) => {
                    const swipe = swipePower(offset.x, velocity.x);
                    if (swipe < -swipeConfidenceThreshold) {
                      paginate(1);
                    } else if (swipe > swipeConfidenceThreshold) {
                      paginate(-1);
                    }
                  }}
                  className="absolute max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing"
                  draggable={false}
                />
              </AnimatePresence>
            </div>

            {/* Navigation Arrows */}
            {viewerIndex > 0 && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/30 text-white/70 hover:bg-black/50 hover:text-white backdrop-blur-md transition-all z-50"
                onClick={(e) => { e.stopPropagation(); paginate(-1); }}
              >
                <span className="material-symbols-outlined text-3xl">chevron_left</span>
              </button>
            )}
            {viewerIndex < displayImages.length - 1 && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/30 text-white/70 hover:bg-black/50 hover:text-white backdrop-blur-md transition-all z-50"
                onClick={(e) => { e.stopPropagation(); paginate(1); }}
              >
                <span className="material-symbols-outlined text-3xl">chevron_right</span>
              </button>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Section 1: Atmosphere */}
      <section>
        <h3 className="font-title-lg text-title-lg font-bold text-on-surface mb-4 tracking-tight">{t("group.about.atmosphere")}</h3>
        <div className="grid grid-cols-6 grid-rows-2 gap-2 h-[260px]">
          {/* Emotional Moment 1: Large Landscape */}
          <div 
            className="col-span-4 row-span-1 rounded-xl overflow-hidden shadow-sm cursor-pointer relative group"
            onClick={() => openViewer(0)}
          >
            <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Atmosphere 1" src={img1} loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
          {/* Emotional Moment 2: Portrait */}
          <div 
            className="col-span-2 row-span-2 rounded-xl overflow-hidden shadow-sm cursor-pointer relative group"
            onClick={() => openViewer(1)}
          >
            <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Atmosphere 2" src={img2} loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
          {/* Emotional Moment 3: Detail */}
          <div 
            className="col-span-2 row-span-1 rounded-xl overflow-hidden shadow-sm cursor-pointer relative group"
            onClick={() => openViewer(2)}
          >
            <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Atmosphere 3" src={img3} loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
          {/* More Card: Dark blur overlay */}
          <div 
            className="col-span-2 row-span-1 rounded-xl overflow-hidden shadow-sm relative cursor-pointer group"
            onClick={() => openViewer(3)}
          >
            <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Atmosphere 4" src={img4} loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
            {moreCount > 0 && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                <span className="font-label-md text-white text-lg">{t("group.about.more", { count: moreCount })}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 2: Evocative CTA & About */}
      <section className="space-y-6">
        {(group.story || group.description) && (
          <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant/30">
            <div className="relative">
              <p className={`font-body-md text-body-md text-on-surface-variant ${!isAboutExpanded ? 'line-clamp-3' : ''}`}>
                {group.story || group.description}
              </p>
              {!isAboutExpanded && (
                <button className="mt-2 text-primary font-label-md text-label-md" onClick={() => setIsAboutExpanded(true)}>{t("group.about.read_more")}</button>
              )}
            </div>
          </div>
        )}

        {/* Core Services */}
        {group.services && group.services.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-title-lg text-title-lg font-bold text-on-surface">{t("group.about.services", "Core Services")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.services.map((service, index) => (
                <div key={index} className="bg-surface p-4 rounded-2xl border border-outline-variant/30 flex items-start gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${service.color}15`, color: service.color }}>
                    <span className="material-symbols-outlined text-[20px]">{service.icon || 'bolt'}</span>
                  </div>
                  <div>
                    <h4 className="font-label-lg text-label-lg text-on-surface font-bold">{service.title}</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">{service.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </section>

      {/* Section 3: Hours & Rules (Minimalist Cards) */}
      <div className="grid grid-cols-1 gap-4">
        <section className="space-y-3">
          <h3 className="font-title-lg text-title-lg font-bold text-on-surface">{t("group.about.hours")}</h3>
          <div className="bg-surface border border-outline-variant/20 rounded-2xl divide-y divide-outline-variant/10 shadow-sm">
            {group.operatingHours && group.operatingHours.length > 0 ? (
              group.operatingHours.map((hours, idx) => (
                <div key={idx} className="px-5 py-4 flex justify-between font-body-md text-body-md">
                  <span className="text-on-surface-variant">{hours.label}</span>
                  <span className="text-on-surface font-semibold">{hours.time}</span>
                </div>
              ))
            ) : (
              <>
                <div className="px-5 py-4 flex justify-between font-body-md text-body-md">
                  <span className="text-on-surface-variant">{t("group.about.hours.mon_fri")}</span>
                  <span className="text-on-surface font-semibold">14:00 - 22:00</span>
                </div>
                <div className="px-5 py-4 flex justify-between font-body-md text-body-md">
                  <span className="text-on-surface-variant">{t("group.about.hours.sat_sun")}</span>
                  <span className="text-on-surface font-semibold">12:00 - 23:00</span>
                </div>
              </>
            )}
          </div>
        </section>
        <section className="space-y-3">
          <h3 className="font-title-lg text-title-lg font-bold text-on-surface">{t("group.about.rules")}</h3>
          <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
            <ul className="space-y-3">
              {group.houseRules && group.houseRules.length > 0 ? (
                group.houseRules.map((rule, idx) => (
                  <li key={idx} className="flex gap-4 font-body-md text-body-md text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                    <span>{rule}</span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex gap-4 font-body-md text-body-md text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-[20px]">stars</span>
                    <span>{t("group.about.rules.rule1")}</span>
                  </li>
                  <li className="flex gap-4 font-body-md text-body-md text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                    <span>{t("group.about.rules.rule2")}</span>
                  </li>
                  <li className="flex gap-4 font-body-md text-body-md text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-[20px]">block</span>
                    <span>{t("group.about.rules.rule3")}</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </section>
      </div>

      {/* Section 4: Team */}
      <section className="space-y-4">
        <h3 className="font-title-lg text-title-lg font-bold text-on-surface">{t("group.about.team")}</h3>
        
        {ownersList.length === 0 && instructorsList.length === 0 && staffList.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center bg-surface-container-low border border-outline-variant/30 rounded-2xl">
            <span className="material-symbols-outlined text-outline mb-2 text-3xl">group_off</span>
            <p className="font-body-md text-on-surface-variant">{t("group.about.no_team", "대표자나 스탭 정보가 없습니다.")}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Owners */}
            {ownersList.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider pl-1">{t("group.about.team.owners", "Owners")}</h4>
                <div className="space-y-2">
                  {ownersList.map(member => renderTeamMemberCard(member))}
                </div>
              </div>
            )}

            {/* Instructors */}
            {instructorsList.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider pl-1">{t("group.about.team.instructors", "Instructors")}</h4>
                <div className="space-y-2">
                  {instructorsList.map(member => renderTeamMemberCard(member))}
                </div>
              </div>
            )}

            {/* Staff */}
            {staffList.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider pl-1">{t("group.about.team.staff", "Staff & DJs")}</h4>
                <div className="space-y-2">
                  {staffList.map(member => renderTeamMemberCard(member))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Section 5: Payment Info */}
      {group.bankDetails && group.bankDetails.accountNumber && (
        <section className="bg-secondary-container/30 p-5 rounded-2xl border border-secondary-fixed-dim/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary filled">account_balance</span>
            <h3 className="font-label-md text-label-md font-bold text-on-surface">{t("group.about.payment")}</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-label-sm text-on-surface-variant mb-1">{group.bankDetails.bankName} {group.bankDetails.accountHolder && `(${group.bankDetails.accountHolder})`}</p>
              <p className="font-title-lg text-title-lg text-primary tracking-wider font-bold">{group.bankDetails.accountNumber}</p>
            </div>
            <button
              className="px-5 py-2.5 bg-primary text-on-primary font-label-sm text-label-sm rounded-xl active:scale-95 transition-transform font-bold"
              onClick={() => {
                navigator.clipboard.writeText(group.bankDetails?.accountNumber || "");
                toast.success(t("group.about.copied") || "Copied to clipboard!");
              }}
            >
              {t("group.about.copy")}
            </button>
          </div>
        </section>
      )}

      {/* Section 6: Scannable Info (Location) - from venue */}
      {venueAddress && (
        <section>
          <h3 className="font-title-lg text-title-lg font-bold text-on-surface mb-4">{t("group.about.location")}</h3>
          
          {/* Actual Google Maps iframe Preview */}
          <div 
            className="rounded-2xl overflow-hidden border border-outline-variant/30 mb-3 h-48 relative shadow-sm group bg-slate-50 flex items-center justify-center"
          >
            {showLiveMap ? (
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://www.google.com/maps?q=${encodeURIComponent(venueAddress.split(',')[0].trim())}&output=embed`}
              ></iframe>
            ) : (
              <div 
                className="w-full h-full flex flex-col items-center justify-center cursor-pointer bg-slate-100/50 hover:bg-slate-100 transition-colors"
                onClick={() => setShowLiveMap(true)}
              >
                <span className="material-symbols-outlined text-3xl text-primary mb-2">map</span>
                <span className="text-xs font-bold text-on-surface-variant">지도 불러오기 (데이터 절약 모드)</span>
              </div>
            )}
            
            {showLiveMap && (
              <div 
                className="absolute inset-0 bg-transparent cursor-pointer z-10"
                onClick={() => {
                  const query = encodeURIComponent(venueAddress.split(',')[0].trim() || "");
                  window.open(`https://map.naver.com/v5/search/${query}`, '_blank');
                }}
              ></div>
            )}

            <div className="absolute bottom-3 right-3 bg-surface/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-label-md text-on-surface-variant border border-outline-variant/20 z-20 pointer-events-none">
              {showLiveMap ? t("group.about.tap_expand") : "터치하여 지도 활성화"}
            </div>
          </div>

          {(() => {
            const addressParts = venueAddress.split(',');
            const mainAddress = addressParts[0].trim();
            const detailAddress = addressParts.slice(1).join(',').trim();
            
            return (
              <div className="flex items-center justify-between mb-3 p-3.5 bg-surface-container-low border border-outline-variant/30 rounded-xl">
                <div>
                  <p className="font-body-md text-body-md text-on-surface">{mainAddress}</p>
                  {detailAddress && (
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{detailAddress}</p>
                  )}
                </div>
                <button
                  className="px-4 py-2 bg-primary/10 text-primary font-label-sm text-label-sm rounded-lg active:bg-primary/20 shrink-0 ml-3 font-bold"
                  onClick={() => {
                    navigator.clipboard.writeText(mainAddress);
                    toast.success(t("group.about.copied") || "Copied to clipboard!");
                  }}
                >
                  {t("group.about.copy")}
                </button>
              </div>
            );
          })()}
          
          {/* Map buttons */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button 
              className="flex flex-col items-center justify-center py-3 bg-surface border border-outline-variant/40 rounded-xl active:bg-surface-container transition-colors shadow-sm"
              onClick={() => {
                const query = encodeURIComponent(venueAddress.split(',')[0].trim() || "");
                window.open(`https://map.naver.com/v5/search/${query}`, '_blank');
              }}
            >
              <span className="material-symbols-outlined text-on-surface mb-1">map</span>
              <span className="text-[10px] font-label-sm text-on-surface-variant">{t("group.about.map.naver")}</span>
            </button>
            <button 
              className="flex flex-col items-center justify-center py-3 bg-surface border border-outline-variant/40 rounded-xl active:bg-surface-container transition-colors shadow-sm"
              onClick={() => {
                const query = encodeURIComponent(venueAddress.split(',')[0].trim() || "");
                window.open(`https://map.kakao.com/link/search/${query}`, '_blank');
              }}
            >
              <span className="material-symbols-outlined text-on-surface mb-1">explore</span>
              <span className="text-[10px] font-label-sm text-on-surface-variant">{t("group.about.map.kakao")}</span>
            </button>
            <button 
              className="flex flex-col items-center justify-center py-3 bg-surface border border-outline-variant/40 rounded-xl active:bg-surface-container transition-colors shadow-sm"
              onClick={() => {
                const query = encodeURIComponent(venueAddress.split(',')[0].trim() || "");
                window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
              }}
            >
              <span className="material-symbols-outlined text-on-surface mb-1">location_on</span>
              <span className="text-[10px] font-label-sm text-on-surface-variant">{t("group.about.map.google")}</span>
            </button>
          </div>

          {group.publicTransport && (
            <p className="font-label-sm text-label-sm text-primary flex items-center gap-1.5 p-3.5 bg-primary/5 rounded-xl border border-primary/10">
              <span className="material-symbols-outlined text-[16px]">info</span>
              {group.publicTransport}
            </p>
          )}
        </section>
      )}

      {/* Footer */}
      <footer className="pt-10 pb-6 border-t border-outline-variant/20">
        <div className="space-y-3 text-on-surface-variant/60 font-label-sm text-label-sm leading-relaxed">
          <p className="font-semibold text-on-surface-variant/80">{group.name || 'Community Studio'}</p>
          <div className="grid grid-cols-1 gap-1">
            <p>{t("group.about.representative")} {hasOwnerInMembers?.name || '-'}</p>
            {group.businessRegistrationNumber && <p>{t("group.about.registration_no", "Registration No.")} {group.businessRegistrationNumber}</p>}
            <p>{t("group.about.address")} {venueAddress || '-'}</p>
          </div>
          <p className="pt-6 uppercase tracking-[0.2em] text-[10px] font-bold text-on-surface-variant/40">© {new Date().getFullYear()} {(group.name || 'COMMUNITY').toUpperCase()}</p>
        </div>
      </footer>
    </div>
  );
};

export default GroupAbout;
