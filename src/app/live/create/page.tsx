'use client';

export const dynamic = 'force-dynamic';

import '../live.css';
import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useBackButtonClose } from '@/hooks/useBackButtonClose';
import { useLocalBackClose } from '@/hooks/useLocalBackClose';
import { Capacitor } from '@capacitor/core';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  X, Camera, ChevronLeft, Search, Check, ChevronDown, ChevronUp,
  Music, GraduationCap, Calendar, Users, User, Building2, Hash
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { galleryService, GalleryTag, GalleryPost } from '@/lib/firebase/galleryService';
import { tagSearchService, TagSearchResult } from '@/lib/firebase/tagSearchService';
import { userService } from '@/lib/firebase/userService';
import { classRegistrationService } from '@/lib/firebase/classRegistrationService';
import { db } from '@/lib/firebase/clientApp';
import { doc, getDoc, getDocs, collection, query, where, collectionGroup } from 'firebase/firestore';
import { useLocation } from '@/components/providers/LocationProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { storage } from '@/lib/firebase/clientApp';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const ICON: Record<string, React.ReactNode> = {
  group: <Building2 size={11} />,
  social: <Music size={11} />,
  event: <Calendar size={11} />,
  class: <GraduationCap size={11} />,
  people: <User size={11} />,
};
const CLR: Record<string, string> = {
  group: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  social: 'bg-purple-50 text-purple-700 border-purple-200',
  event: 'bg-amber-50 text-amber-700 border-amber-200',
  class: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  people: 'bg-pink-50 text-pink-700 border-pink-200',
};
const MAX_CAPTION = 30;

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
const GalleryCreateContent = () => {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { location } = useLocation();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit') || null;
  const source = searchParams?.get('source') || null;
  const returnTo = searchParams?.get('returnTo') || null;
  const isFromLive = source === 'live';
  const { language, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSafeNavigateBack = useCallback(() => {
    const groupIdParam = searchParams?.get('groupId') || null;
    const safeReturnTo = (returnTo && groupIdParam && returnTo.startsWith(`/groups/${groupIdParam}`))
      ? returnTo
      : (groupIdParam ? `/groups/${groupIdParam}?tab=live` : null);

    if (safeReturnTo) {
      router.replace(safeReturnTo);
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/groups');
    }
  }, [returnTo, searchParams, router]);

  // [스톤님 수술] Android 디바이스 백버튼 수술 — useLocalBackClose 로 0ms 안착
  useLocalBackClose(true, handleSafeNavigateBack);

  // Media
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{url: string; type: 'image'|'video'}[]>([]);
  const [existingImages, setExistingImages] = useState<{url: string; type: 'image'|'video'}[]>([]);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);

  // === TAG States ===
  const [selectedGroup, setSelectedGroup] = useState<TagSearchResult | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<TagSearchResult | null>(null);
  const [selectedPeople, setSelectedPeople] = useState<TagSearchResult[]>([]);
  const autoAddedIdsRef = useRef<string[]>([]);
  const [showInLive, setShowInLive] = useState(true);

  // Relevant Data pools
  const [userGroups, setUserGroups] = useState<TagSearchResult[]>([]);
  const [myRoleSocials, setMyRoleSocials] = useState<TagSearchResult[]>([]);
  const [myClasses, setMyClasses] = useState<TagSearchResult[]>([]);
  const [myActiveEvents, setMyActiveEvents] = useState<TagSearchResult[]>([]);
  const [loadingRelevant, setLoadingRelevant] = useState(true);
  const [loadingPeople, setLoadingPeople] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TagSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // KR/EN 적용을 위한 다국어 이름 도출 헬퍼
  const getLocalizedName = (name: string = '', nameNative: string = '') => {
    const isKr = language === 'KR';
    
    // 특수한 명칭 치환 매핑 (예: Cabeceo 까베세오)
    const handleSpecialNames = (str: string) => {
      if (!str) return '';
      const lower = str.toLowerCase();
      if (lower.includes('cabeceo') && lower.includes('까베세오')) {
        return isKr ? '까베세오' : 'Cabeceo';
      }
      
      // 영어와 한글 혼용 문자열을 쪼개어 반환하기
      // 한글이 뒤에 오고 영어가 앞에 오는 구조일 때
      const match = str.match(/^([A-Za-z0-9\s\-&',()]+)\s+([가-힣0-9\s!\?]+)$/);
      if (match) {
        return isKr ? match[2].trim() : match[1].trim();
      }
      
      // 반대로 한글이 앞에 오고 영어가 뒤에 올 때
      const match2 = str.match(/^([가-힣0-9\s!\?]+)\s+([A-Za-z0-9\s\-&',()]+)$/);
      if (match2) {
        return isKr ? match2[1].trim() : match2[2].trim();
      }

      return str;
    };

    if (isKr) {
      if (nameNative) return handleSpecialNames(nameNative);
      return handleSpecialNames(name);
    } else {
      if (name) return handleSpecialNames(name);
      return handleSpecialNames(nameNative);
    }
  };

  // ---- Load My Groups, Socials, Classes, Events on mount ----
  useEffect(() => {
    if (!user) return;
    const loadRelevant = async () => {
      setLoadingRelevant(true);
      try {
        const groupIdParam = searchParams.get('groupId');
        let groupVenueId = '';
        let targetGroupData: any = null;

        if (groupIdParam) {
          try {
            const groupSnap = await getDoc(doc(db, 'groups', groupIdParam));
            if (groupSnap.exists()) {
              targetGroupData = groupSnap.data();
              groupVenueId = targetGroupData.venueId || '';
              
              // Set selectedGroup by default if we are in group context
              setSelectedGroup({
                type: 'group',
                id: groupSnap.id,
                name: targetGroupData.name || '',
                nameNative: targetGroupData.nativeName || '',
                subtitle: targetGroupData.address || '',
                avatar: targetGroupData.logo || targetGroupData.coverImage || ''
              } as any);
            }
          } catch (e) {
            console.error('Error loading group context:', e);
          }
        }

        if (groupIdParam) {
          // [그룹 컨텍스트 모드]: 해당 그룹 장소의 콘텐츠만 독점 노출
          setUserGroups([]); // 기본 선택된 그룹은 추천 목록에 노출하지 않음

          // 2. 소셜: 장소 기준 소셜만 로드
          const uniqueSocials: TagSearchResult[] = [];
          if (groupVenueId) {
            try {
              const venueSocialsSnap = await getDocs(
                query(collection(db, 'socials'), where('venueId', '==', groupVenueId))
              );
              venueSocialsSnap.docs.forEach(d => {
                const s = d.data();
                uniqueSocials.push({
                  type: 'social' as const,
                  id: d.id,
                  name: s.title || '',
                  nameNative: s.titleNative || '',
                  subtitle: s.venueName || '소셜',
                  groupId: s.venueId
                });
              });
            } catch (err) {
              console.error('Error fetching socials for venue:', err);
            }
          }
          setMyRoleSocials(uniqueSocials);

          // 3. 클래스: 해당 그룹의 진행중인 모든 클래스만 로드
          const activeClasses: TagSearchResult[] = [];
          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          try {
            const groupClassesSnap = await getDocs(collection(db, 'groups', groupIdParam, 'classes'));
            groupClassesSnap.docs.forEach((d) => {
              const classData = d.data() as any;
              let lastDate: Date | null = null;
              if (classData.schedule && classData.schedule.length > 0) {
                let maxTime = 0;
                classData.schedule.forEach((entry: any) => {
                  if (entry.date) {
                    const t = new Date(entry.date).getTime();
                    if (t > maxTime) maxTime = t;
                  }
                });
                if (maxTime > 0) lastDate = new Date(maxTime);
              }

              if (!lastDate || lastDate.getTime() >= sevenDaysAgo) {
                const instructorNames = classData.instructors?.map((i: any) => i.name).join(', ') || '';
                activeClasses.push({
                  type: 'class' as const,
                  id: d.id,
                  name: classData.title || '',
                  nameNative: classData.titleNative || '',
                  subtitle: targetGroupData?.name || '',
                  groupId: groupIdParam,
                  instructors: instructorNames ? `by ${instructorNames}` : undefined
                });
              }
            });
          } catch (err) {
            console.error('Error fetching classes for group:', err);
          }
          setMyClasses(activeClasses);

          // 4. 이벤트: 장소 기준 진행중인 이벤트만 로드
          const uniqueEvents: TagSearchResult[] = [];
          if (groupVenueId) {
            try {
              const venueEventsSnap = await getDocs(
                query(collection(db, 'events'), where('venueId', '==', groupVenueId))
              );
              venueEventsSnap.docs.forEach(d => {
                const e = d.data();
                const startMs = e.startDate?.toMillis ? e.startDate.toMillis() : 0;
                const endMs = e.endDate?.toMillis ? e.endDate.toMillis() : 0;
                if (startMs <= Date.now() && endMs >= Date.now()) {
                  uniqueEvents.push({
                    type: 'event' as const,
                    id: d.id,
                    name: e.title || '',
                    nameNative: e.titleNative || '',
                    subtitle: e.venueName || e.location || ''
                  });
                }
              });
            } catch (err) {
              console.error('Error fetching events for venue:', err);
            }
          }
          setMyActiveEvents(uniqueEvents);

        } else {
          // [개인 컨텍스트 모드]: 기존의 개인화된 목록 로드

          // 1. 내가 소속된 그룹 조회
          const joinedGroups = profile?.joinedGroups || [];
          const groupsData: TagSearchResult[] = [];
          await Promise.all(joinedGroups.map(async (gId: string) => {
            try {
              const gSnap = await getDoc(doc(db, 'groups', gId));
              if (gSnap.exists()) {
                const data = gSnap.data();
                groupsData.push({
                  type: 'group' as const,
                  id: gSnap.id,
                  name: data.name || '',
                  nameNative: data.nativeName || '',
                  subtitle: data.address || '',
                  avatar: data.logo || data.coverImage || ''
                } as any);
              }
            } catch (e) {
              console.error(e);
            }
          }));
          setUserGroups(groupsData);

          // 2. 소셜 조회
          const uniqueSocials: TagSearchResult[] = [];
          const addUniqueSocial = (s: TagSearchResult) => {
            if (!uniqueSocials.some(x => x.id === s.id)) {
              uniqueSocials.push(s);
            }
          };

          const socialsSnap = await getDocs(collection(db, 'socials'));
          const allSocials = socialsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          const myRoleSocialsFiltered = allSocials.filter((s: any) => {
            if (!user?.uid) return false;
            const isOrg = (s.organizerId && s.organizerId === user.uid) || (Array.isArray(s.organizerIds) && s.organizerIds.includes(user.uid));
            const isStaff = Array.isArray(s.staffIds) && s.staffIds.includes(user.uid);
            const isDj = Array.isArray(s.djs) && s.djs.some((d: any) => d && d.djId === user.uid);
            return !!(isOrg || isStaff || isDj);
          }).map((s: any) => {
            return {
              type: 'social' as const,
              id: s.id,
              name: s.title || '',
              nameNative: s.titleNative || '',
              subtitle: '내 소셜',
              groupId: s.venueId
            };
          });

          const postsSnap = await getDocs(
            query(collection(db, 'galleries'), where('authorId', '==', user.uid))
          );
          const myPosts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryPost));
          myPosts.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
            return timeB - timeA;
          });
          const recentSocialTags: TagSearchResult[] = [];
          myPosts.forEach(post => {
            if (post.tags) {
              const socialTag = post.tags.find(t => t.type === 'social');
              if (socialTag && !recentSocialTags.some(s => s.id === socialTag.id)) {
                const originalSocial = allSocials.find((as: any) => as.id === socialTag.id);
                recentSocialTags.push({
                  type: 'social' as const,
                  id: socialTag.id,
                  name: originalSocial?.title || socialTag.name || '',
                  nameNative: originalSocial?.titleNative || (socialTag as any).nameNative || '',
                  subtitle: '최근 사용'
                });
              }
            }
          });

          myRoleSocialsFiltered.forEach(addUniqueSocial);
          recentSocialTags.slice(0, 3).forEach(addUniqueSocial);
          setMyRoleSocials(uniqueSocials);

          // 3. 클래스 조회
          const activeClasses: TagSearchResult[] = [];
          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

          const groupNamesCache: Record<string, string> = {};
          const getGroupName = async (gId: string) => {
            if (!gId) return '';
            if (groupNamesCache[gId]) return groupNamesCache[gId];
            try {
              const groupSnap = await getDoc(doc(db, 'groups', gId));
              if (groupSnap.exists()) {
                const name = groupSnap.data().name || '';
                groupNamesCache[gId] = name;
                return name;
              }
            } catch (e) {
              console.error(e);
            }
            return '';
          };

          const regs = await classRegistrationService.getUserRegistrations(user.uid);
          const activeRegs = regs.filter(r => r.status === 'PAYMENT_COMPLETED' || r.status === 'PAYMENT_REPORTED');
          
          await Promise.all(activeRegs.map(async (r) => {
            if (!r.groupId || !r.classId) return;
            try {
              const classRef = doc(db, 'groups', r.groupId, 'classes', r.classId);
              const classSnap = await getDoc(classRef);
              if (classSnap.exists()) {
                const classData = classSnap.data() as any;
                let lastDate: Date | null = null;
                if (classData.schedule && classData.schedule.length > 0) {
                  let maxTime = 0;
                  classData.schedule.forEach((entry: any) => {
                    if (entry.date) {
                      const t = new Date(entry.date).getTime();
                      if (t > maxTime) maxTime = t;
                    }
                  });
                  if (maxTime > 0) lastDate = new Date(maxTime);
                }
                
                if (!lastDate || lastDate.getTime() >= sevenDaysAgo) {
                  const instructorNames = classData.instructors?.map((i: any) => i.name).join(', ') || '';
                  activeClasses.push({
                    type: 'class' as const,
                    id: r.classId,
                    name: classData.title || r.classTitle || '',
                    nameNative: classData.titleNative || '',
                    subtitle: r.groupName || (await getGroupName(r.groupId)),
                    groupId: r.groupId,
                    instructors: instructorNames ? `by ${instructorNames}` : undefined
                  });
                }
              }
            } catch (err) {
              console.error(err);
            }
          }));

          try {
            const classesSnap = await getDocs(collectionGroup(db, 'classes'));
            await Promise.all(classesSnap.docs.map(async (d) => {
              const classData = d.data();
              const instructorsList = classData.instructors || [];
              const isInstructor = instructorsList.some((inst: any) => inst.userId === user.uid);
              if (isInstructor) {
                const pathSegments = d.ref.path.split('/');
                const gId = pathSegments[1] || '';
                
                let lastDate: Date | null = null;
                if (classData.schedule && classData.schedule.length > 0) {
                  let maxTime = 0;
                  classData.schedule.forEach((entry: any) => {
                    if (entry.date) {
                      const t = new Date(entry.date).getTime();
                      if (t > maxTime) maxTime = t;
                    }
                  });
                  if (maxTime > 0) lastDate = new Date(maxTime);
                }
                
                if (!lastDate || lastDate.getTime() >= sevenDaysAgo) {
                  const instructorNames = instructorsList.map((i: any) => i.name).join(', ') || '';
                  const gName = classData.groupName || (await getGroupName(gId));
                  activeClasses.push({
                    type: 'class' as const,
                    id: d.id,
                    name: classData.title || '',
                    nameNative: classData.titleNative || '',
                    subtitle: gName || '',
                    groupId: gId,
                    instructors: instructorNames ? `by ${instructorNames}` : undefined
                  });
                }
              }
            }));
          } catch (err) {
            console.error(err);
          }

          const dedupedClasses = activeClasses.filter((v, i, a) => a.findIndex(c => c.id === v.id) === i);
          setMyClasses(dedupedClasses);

          // 4. 이벤트 조회
          const uniqueEvents: TagSearchResult[] = [];
          const addUniqueEvent = (e: TagSearchResult) => {
            if (!uniqueEvents.some(x => x.id === e.id)) {
              uniqueEvents.push(e);
            }
          };

          const eventsSnap = await getDocs(collection(db, 'events'));
          const allEvents = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          const activeEvents = allEvents.filter((e: any) => {
            const startMs = e.startDate?.toMillis ? e.startDate.toMillis() : 0;
            const endMs = e.endDate?.toMillis ? e.endDate.toMillis() : 0;
            return startMs <= Date.now() && endMs >= Date.now();
          });
          const myActiveEventsFiltered = activeEvents.slice(0, 3).map((e: any) => ({
            type: 'event' as const,
            id: e.id,
            name: e.title || '',
            nameNative: e.titleNative || '',
            subtitle: e.venueName || e.location || ''
          }));
          
          myActiveEventsFiltered.forEach(addUniqueEvent);
          setMyActiveEvents(uniqueEvents.slice(0, 5));
        }
      } catch (e) {
        console.error('Relevant load error:', e);
      } finally {
        setLoadingRelevant(false);
      }
    };
    loadRelevant();
  }, [user, profile, searchParams]);

  // ---- When activity is selected, auto-add people based on role policies ----
  useEffect(() => {
    // Remove previously auto-added people first
    if (autoAddedIdsRef.current.length > 0) {
      const idsToRemove = autoAddedIdsRef.current;
      setSelectedPeople(prev => prev.filter(p => !idsToRemove.includes(p.id)));
      autoAddedIdsRef.current = [];
    }

    if (!selectedActivity) return;
    const load = async () => {
      setLoadingPeople(true);
      try {
        const results: TagSearchResult[] = [];
        const actId = selectedActivity.id;
        const actType = selectedActivity.type;

        // 1. 소셜 선택 시: org (organizerId, organizerIds) + dj (djs)
        if (actType === 'social') {
          const snap = await getDoc(doc(db, 'socials', actId));
          if (snap.exists()) {
            const data = snap.data();
            const userIds = new Set<string>();
            if (data.organizerId) userIds.add(data.organizerId);
            if (Array.isArray(data.organizerIds)) {
              data.organizerIds.forEach((id: string) => id && userIds.add(id));
            }
            if (Array.isArray(data.djs)) {
              data.djs.forEach((dj: any) => {
                if (dj && dj.djId) userIds.add(dj.djId);
              });
            }

            await Promise.all(Array.from(userIds).map(async (uid) => {
              try {
                const uData = await userService.getPublicProfile(uid);
                if (uData) {
                  const name = uData.nativeNickname ? `${uData.nickname || ''} ${uData.nativeNickname}` : (uData.nickname || 'User');
                  
                  let role = 'people';
                  if (uid === data.organizerId || (Array.isArray(data.organizerIds) && data.organizerIds.includes(uid))) {
                    role = 'organizer';
                  } else {
                    role = 'dj';
                  }

                  results.push({
                    type: 'people' as const,
                    id: uid,
                    name: name,
                    subtitle: role.toUpperCase(),
                    avatar: uData.photoURL || '',
                    role: role
                  });
                }
              } catch (e) {
                console.error(e);
              }
            }));
          }
        }

        // 2. 클래스 선택 시: 강사 (instructors)
        else if (actType === 'class' && (selectedActivity.groupId || selectedGroup?.id)) {
          const gId = selectedActivity.groupId || selectedGroup?.id || '';
          const snap = await getDoc(doc(db, 'groups', gId, 'classes', actId));
          if (snap.exists()) {
            const data = snap.data();
            const insts = data.instructors || [];
            await Promise.all(insts.map(async (inst: any) => {
              if (inst.userId) {
                try {
                  const uData = await userService.getPublicProfile(inst.userId);
                  if (uData) {
                    results.push({
                      type: 'people' as const,
                      id: inst.userId,
                      name: uData.nativeNickname ? `${uData.nickname || ''} ${uData.nativeNickname}` : inst.name,
                      subtitle: 'INSTRUCTOR',
                      avatar: uData.photoURL || inst.avatar || '',
                      role: 'instructor'
                    });
                  } else {
                    results.push({
                      type: 'people' as const,
                      id: inst.userId,
                      name: inst.name,
                      subtitle: 'INSTRUCTOR',
                      avatar: inst.avatar || '',
                      role: 'instructor'
                    });
                  }
                } catch {
                  results.push({
                    type: 'people' as const,
                    id: inst.userId,
                    name: inst.name,
                    subtitle: 'INSTRUCTOR',
                    avatar: inst.avatar || '',
                    role: 'instructor'
                  });
                }
              } else {
                results.push({
                  type: 'people' as const,
                  id: `instructor_${inst.name}`,
                  name: inst.name,
                  subtitle: 'INSTRUCTOR',
                  avatar: inst.avatar || '',
                  role: 'instructor'
                });
              }
            }));
          }
        }

        // 3. 이벤트 선택 시: 오거 (hostId, organizerId, organizerIds)
        else if (actType === 'event') {
          const snap = await getDoc(doc(db, 'events', actId));
          if (snap.exists()) {
            const data = snap.data();
            const hostIds = new Set<string>();
            if (data.hostId) hostIds.add(data.hostId);
            if (data.organizerId) hostIds.add(data.organizerId);
            if (Array.isArray(data.organizerIds)) {
              data.organizerIds.forEach((id: string) => id && hostIds.add(id));
            }

            await Promise.all(Array.from(hostIds).map(async (hId) => {
              try {
                const uData = await userService.getPublicProfile(hId);
                if (uData) {
                  results.push({
                    type: 'people' as const,
                    id: hId,
                    name: uData.nativeNickname ? `${uData.nickname || ''} ${uData.nativeNickname}` : (uData.nickname || 'Organizer'),
                    subtitle: 'ORGANIZER',
                    avatar: uData.photoURL || '',
                    role: 'organizer'
                  });
                }
              } catch (e) {
                console.error(e);
              }
            }));
          }
        }

        // Save new auto-added people IDs in ref
        const newIds = results.map(r => r.id);
        autoAddedIdsRef.current = newIds;

        // 중복 없이 피플 병합 (기존 me는 보존)
        setSelectedPeople(prev => {
          const merged = [...prev];
          for (const p of results) {
            if (!merged.find(x => x.id === p.id)) {
              merged.push(p);
            }
          }
          return merged;
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingPeople(false);
      }
    };
    load();
  }, [selectedActivity]);

  // ---- Add "me" by default ----
  useEffect(() => {
    if (user && !selectedPeople.find(p => p.id === user.uid)) {
      const nativeName = profile?.nativeNickname || '';
      const nickname = user.displayName || profile?.nickname || 'Me';
      const fullName = nativeName ? `${nickname} ${nativeName}` : nickname;
      
      setSelectedPeople(prev => {
        if (prev.find(p => p.id === user.uid)) return prev;
        return [{
          type: 'people',
          id: user.uid,
          name: fullName,
          subtitle: 'Me',
          avatar: user.photoURL || profile?.photoURL || '',
          role: 'me',
        }, ...prev];
      });
    }
  }, [user, profile]);

  // ---- Edit mode load ----
  useEffect(() => {
    if (!editId) return;
    setIsEditMode(true);
    galleryService.getPost(editId).then(post => {
      if (!post) return;
      const isAdmin = profile?.isAdmin === true || profile?.systemRole === 'admin';
      const isAuthor = !!(user && post.authorId === user.uid);
      if (user && !isAuthor && !isAdmin) {
        alert(t('gallery.no_permission', 'You do not have permission to edit.'));
        router.push('/live');
        return;
      }
      setCaption(post.caption);
      const loadedMedia = post.media.map((url, i) => ({
        url,
        type: post.mediaTypes ? post.mediaTypes[i] : (url.toLowerCase().includes('video') ? 'video' : 'image')
      })) as { url: string; type: 'image' | 'video' }[];
      setExistingImages(loadedMedia);
      setPreviews(loadedMedia);
      // Restore tags
      if (post.tags) {
        const groupTag = post.tags.find(t => t.type === 'group');
        if (groupTag) setSelectedGroup({ ...groupTag, subtitle: '', nameNative: (groupTag as any).nameNative || '' });
        const activityTag = post.tags.find(t => ['social', 'event', 'class'].includes(t.type));
        if (activityTag) setSelectedActivity({ ...activityTag, subtitle: activityTag.instructors || '', nameNative: (activityTag as any).nameNative || '' });
        const peopleTags = post.tags.filter(t => t.type === 'people');
        if (peopleTags.length > 0) {
          setSelectedPeople(peopleTags.map(t => ({ ...t, subtitle: t.role || '' })));
        }
      }
      setShowInLive(post.showInLive !== false);
    });
  }, [editId, user]);

  // ---- Search ----
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 1) {
        setIsSearching(true);
        try {
          const results = await tagSearchService.searchAll(searchQuery);
          setSearchResults(results);
        } catch (e) { console.error(e); }
        finally { setIsSearching(false); }
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addSearchResult = (r: TagSearchResult) => {
    if (r.type === 'group') { setSelectedGroup(r); }
    else if (['social', 'event', 'class'].includes(r.type)) { setSelectedActivity(r); }
    else if (r.type === 'people' && !selectedPeople.find(p => p.id === r.id)) {
      setSelectedPeople(prev => [...prev, r]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  // ---- Media ----
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length + existingImages.length > 10) return alert(t('gallery.max_files', 'Maximum 10 files.'));
    const newP = files.map(f => ({ url: URL.createObjectURL(f), type: f.type.startsWith('video/') ? 'video' as const : 'image' as const }));
    setImages(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...newP]);
  };
  const removeImage = (idx: number) => {
    const p = previews[idx];
    const eIdx = existingImages.findIndex(img => img.url === p.url);
    if (eIdx >= 0) setExistingImages(prev => prev.filter((_, i) => i !== eIdx));
    else {
      const fIdx = idx - existingImages.length;
      if (fIdx >= 0) setImages(prev => { const n = [...prev]; n.splice(fIdx, 1); return n; });
    }
    setPreviews(prev => { const n = [...prev]; n.splice(idx, 1); return n; });
  };

  // ---- Post ----
  const handlePost = async () => {
    if (!user) return alert(t('gallery.sign_in_first', 'Please sign in first.'));
    if (images.length === 0 && existingImages.length === 0) return alert(t('gallery.media_required', 'At least 1 media file is required.'));

    setIsUploading(true);
    setUploadProgress(0);
    try {
      let totalTransferred = 0;
      const totalBytes = images.reduce((a, f) => a + f.size, 0);
      const newMedia = await Promise.all(images.map(file =>
        new Promise<{url: string; type: 'image'|'video'}>((resolve, reject) => {
          const sRef = ref(storage, `gallery/${user.uid}/${Date.now()}_${file.name}`);
          const task = uploadBytesResumable(sRef, file);
          let last = 0;
          task.on('state_changed',
            s => { const d = s.bytesTransferred - last; last = s.bytesTransferred; totalTransferred += d; setUploadProgress(Math.min(100, Math.round(totalTransferred / totalBytes * 100))); },
            reject,
            async () => resolve({ url: await getDownloadURL(task.snapshot.ref), type: file.type.startsWith('video/') ? 'video' : 'image' })
          );
        })
      ));

      const finalUrls = [...existingImages.map(i => i.url), ...newMedia.map(m => m.url)];
      const finalTypes = [...existingImages.map(i => i.type), ...newMedia.map(m => m.type)];

      const clean = (obj: Record<string, any>) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ''));
      const tags: GalleryTag[] = [];
      if (selectedGroup) tags.push(clean({ type: 'group', id: selectedGroup.id, name: selectedGroup.name, nameNative: (selectedGroup as any).nameNative || '', avatar: selectedGroup.avatar }) as GalleryTag);
      if (selectedActivity) tags.push(clean({
        type: selectedActivity.type,
        id: selectedActivity.id,
        name: selectedActivity.name,
        nameNative: (selectedActivity as any).nameNative || '',
        groupId: selectedActivity.groupId || selectedGroup?.id,
        instructors: selectedActivity.instructors,
      }) as GalleryTag);
      selectedPeople.forEach(p => tags.push(clean({ type: 'people', id: p.id, name: p.name, avatar: p.avatar, role: p.role }) as GalleryTag));

      const postData = {
        media: finalUrls,
        mediaTypes: finalTypes,
        caption,
        tags,
        showInLive,
        venueId: '', venueName: '', eventId: '', eventName: '',
      };

      if (isEditMode && editId) {
        await galleryService.updatePost(editId, postData);
        handleSafeNavigateBack();
      } else {
        const newPost = await galleryService.createPost({ authorId: user.uid, authorName: user.displayName || profile?.nickname || 'Anonymous', authorPhoto: user.photoURL || '', ...postData });
        if (returnTo) {
          router.replace(returnTo);
        } else {
          router.replace('/create-success?type=live&id=' + (newPost || ''));
        }
      }
    } catch (err) {
      console.error(err);
      alert(t('gallery.error_saving', 'Error saving post.'));
    } finally {
      setIsUploading(false);
    }
  };

  // 2단계 마법사 관리
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 2;

  const handleHeaderBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    } else {
      const isDirty = caption || images.length > 0 || previews.length > 0;
      if (isDirty) {
        if (confirm(t('common.confirm_discard') || "작성 중인 내용이 있습니다. 정말 나가시겠습니까?")) {
          handleSafeNavigateBack();
        }
      } else {
        handleSafeNavigateBack();
      }
    }
  };

  const stepTitles: Record<number, string> = {
    1: language === 'KR' ? '미디어 및 게시글 내용' : 'Media & Content',
    2: language === 'KR' ? '연관 정보 및 인물 태그' : 'Tags & Mentions',
  };

  // ---- Render ----
  return (
    <div
      className="fixed inset-0 bg-white overflow-y-auto animate-in fade-in duration-300"
      style={{ zIndex: 100000, paddingTop: 'calc(56px + env(safe-area-inset-top, 0px))' }}
    >
      <style dangerouslySetInnerHTML={{ __html: `.material-symbols-rounded { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }` }} />

      {/* 소셜 100% 동일 Header (X버튼 삭제, 뒤로가기로 조작) */}
      <header
        className="fixed top-0 left-0 w-full flex-shrink-0 bg-white border-b border-slate-100 px-4 flex items-center justify-between z-50"
        style={{
          zIndex: 100010,
          paddingTop: 'env(safe-area-inset-top, 0px)',
          height: 'calc(56px + env(safe-area-inset-top, 0px))'
        }}
      >
        <button
          type="button"
          onClick={handleHeaderBack}
          className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform text-slate-700"
        >
          <span className="material-symbols-rounded text-2xl">arrow_back</span>
        </button>
        <h1 className="text-[16px] font-bold text-slate-800">
          {isEditMode ? (t('gallery.edit_post') || '라이브 수정') : (t('gallery.new_post') || '새 라이브')}
        </h1>
        <div className="w-10" />
      </header>

      {/* 소셜 100% 동일 Step Indicator Bar */}
      <div className="max-w-2xl mx-auto px-4 mt-3">
        <div className="flex items-center justify-between border border-slate-100 bg-slate-50/80 backdrop-blur rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700">
              {language === 'KR' ? `${step} / ${TOTAL_STEPS} 단계` : `Step ${step} of ${TOTAL_STEPS}`}
            </span>
            <span className="text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-0.5 rounded-full">
              {stepTitles[step]}
            </span>
          </div>
          <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#007AFF] transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {isUploading && (
        <div className="max-w-2xl mx-auto px-4 mt-2">
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#007AFF] h-full transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      <main className="pt-4 pb-36 max-w-2xl mx-auto px-4">
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* 카드 1: 미디어 첨부 */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                <span className="material-symbols-rounded text-sm text-primary">add_a_photo</span>
                <p className="text-[14px] font-bold text-primary">미디어 첨부 (사진 / 동영상)</p>
              </div>
              <div className="p-4">
                <div className="image-preview-scroll bg-[#f8f9fa] p-3 rounded-xl border border-dashed border-[#e0e4e5] flex gap-2 overflow-x-auto">
                  {previews.map((item, idx) => (
                    <div key={idx} className="preview-item relative shrink-0 rounded-lg overflow-hidden border border-[#e0e4e5]" style={{ width: '90px', height: '110px' }}>
                      {item.type === 'video'
                        ? <video src={item.url} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                        : <img src={item.url} alt="" className="w-full h-full object-cover" />}
                      <button className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white" onClick={() => removeImage(idx)}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button 
                    className="flex flex-col items-center justify-center border border-dashed border-[#acb3b4] hover:border-primary rounded-xl bg-white transition-all text-[#acb3b4] hover:text-primary gap-1 shrink-0" 
                    style={{ width: '100px', height: '110px' }} 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera size={24} />
                    <span className="text-[10px] font-bold">{t('gallery.add_media') || '미디어 추가'}</span>
                  </button>
                </div>
                <input type="file" multiple accept="image/*,video/*" hidden ref={fileInputRef} onChange={handleImageChange} />
              </div>
            </div>

            {/* 카드 2: 내용 작성 & 옵션 */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                <span className="material-symbols-rounded text-sm text-primary">edit_note</span>
                <p className="text-[14px] font-bold text-primary">게시글 내용 및 옵션</p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-[14px] font-bold text-[#acb3b4] mb-1.5">
                    게시글 설명 / 캡션 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <input
                      type="text"
                      className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-[16px] font-bold text-[#2d3435] placeholder:text-[#acb3b4] outline-none"
                      placeholder={(t('gallery.write_caption') || '내용을 입력하세요...') + ' (필수)'}
                      value={caption}
                      maxLength={MAX_CAPTION}
                      onChange={e => setCaption(e.target.value)}
                    />
                    <span className={`text-xs font-bold shrink-0 ml-2 ${caption.length >= MAX_CAPTION ? 'text-red-500' : 'text-[#acb3b4]'}`}>
                      {caption.length}/{MAX_CAPTION}
                    </span>
                  </div>
                </div>

                {!isFromLive && (
                  <div className="pt-2">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] hover:bg-[#f2f4f4] transition-colors"
                      onClick={() => setShowInLive(!showInLive)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-rounded text-red-500 text-lg">play_circle</span>
                        <span className="text-sm font-bold text-[#2d3435]">{t('gallery.also_show_in_live', 'Live 피드에도 함께 노출')}</span>
                      </div>
                      <div className={`w-10 h-5 rounded-full transition-colors duration-200 flex items-center px-0.5 ${showInLive ? 'bg-red-500' : 'bg-slate-300'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${showInLive ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* 카드 1: 태그 검색 */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white relative z-30">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                <span className="material-symbols-rounded text-sm text-primary">search</span>
                <p className="text-[14px] font-bold text-primary">태그 검색 (그룹, 소셜, 클래스, 이벤트, 인물)</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="relative flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <Search className="text-[#acb3b4] mr-2 shrink-0" size={18} />
                  <input
                    type="text"
                    className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-[16px] font-bold text-[#2d3435] placeholder:text-[#acb3b4] outline-none"
                    placeholder={t('gallery.search_placeholder', '검색어를 입력하세요...')}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {isSearching && (
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
                  )}
                </div>

                {searchQuery.length >= 1 && (
                  <div className="absolute left-4 right-4 mt-1 bg-white border border-[#e0e4e5] rounded-xl max-h-60 overflow-y-auto shadow-lg divide-y divide-[#f2f4f4] z-50">
                    {searchResults.length > 0 ? (
                      searchResults.map(r => (
                        <button
                          key={`${r.type}-${r.id}`}
                          type="button"
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f8f9fa] text-left transition-colors"
                          onClick={() => addSearchResult(r)}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center border shrink-0 ${CLR[r.type] || 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                            {ICON[r.type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-[#2d3435] truncate">
                              {getLocalizedName(r.name, (r as any).nameNative)}
                            </div>
                            <div className="text-[10px] font-medium text-[#acb3b4] truncate">
                              {r.type.toUpperCase()} · {r.subtitle}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="py-6 text-center text-[#acb3b4] text-xs font-medium">
                        {t('gallery.no_results', '검색 결과가 없습니다.')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 카드 2: 연관 추천 태그 */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                <span className="material-symbols-rounded text-sm text-primary">auto_awesome</span>
                <p className="text-[14px] font-bold text-primary">{t('gallery.relevant_tags') || '연관 추천 태그'}</p>
              </div>
              <div className="p-4">
                {loadingRelevant ? (
                  <Spinner />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {myRoleSocials.map(s => {
                      const isSelected = selectedActivity?.id === s.id;
                      return (
                        <ChipCompact
                          key={s.id}
                          label={getLocalizedName(s.name, (s as any).nameNative)}
                          icon={ICON.social}
                          onClick={() => setSelectedActivity(isSelected ? null : s)}
                          color={isSelected ? CLR.social : undefined}
                        />
                      );
                    })}
                    {myClasses.map(c => {
                      const isSelected = selectedActivity?.id === c.id;
                      return (
                        <ChipCompact
                          key={c.id}
                          label={getLocalizedName(c.name, (c as any).nameNative)}
                          icon={ICON.class}
                          onClick={async () => {
                            if (isSelected) {
                              setSelectedActivity(null);
                            } else {
                              setSelectedActivity(c);
                              if (c.groupId && (!selectedGroup || selectedGroup.id !== c.groupId)) {
                                try {
                                  const matchedGroup = userGroups.find(g => g.id === c.groupId);
                                  if (matchedGroup) {
                                    setSelectedGroup(matchedGroup);
                                  } else {
                                    const groupSnap = await getDoc(doc(db, 'groups', c.groupId));
                                    if (groupSnap.exists()) {
                                      const gData = groupSnap.data();
                                      setSelectedGroup({
                                        type: 'group',
                                        id: groupSnap.id,
                                        name: gData.name || '',
                                        nameNative: gData.nativeName || '',
                                        subtitle: gData.address || '',
                                        avatar: gData.logo || gData.coverImage || ''
                                      } as any);
                                    }
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }
                            }
                          }}
                          color={isSelected ? CLR.class : undefined}
                        />
                      );
                    })}
                    {myActiveEvents.map(e => {
                      const isSelected = selectedActivity?.id === e.id;
                      return (
                        <ChipCompact
                          key={e.id}
                          label={getLocalizedName(e.name, (e as any).nameNative)}
                          icon={ICON.event}
                          onClick={() => setSelectedActivity(isSelected ? null : e)}
                          color={isSelected ? CLR.event : undefined}
                        />
                      );
                    })}
                    {userGroups.filter(g => g.id !== selectedGroup?.id).map(g => {
                      const isSelected = selectedGroup?.id === g.id;
                      return (
                        <ChipCompact
                          key={g.id}
                          label={getLocalizedName(g.name, (g as any).nameNative)}
                          avatar={g.avatar}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedGroup(null);
                              if (selectedActivity?.groupId === g.id) {
                                setSelectedActivity(null);
                              }
                            } else {
                              setSelectedGroup(g);
                            }
                          }}
                          color={isSelected ? 'bg-indigo-500 text-white border-indigo-600' : undefined}
                        />
                      );
                    })}

                    {myRoleSocials.length === 0 && myClasses.length === 0 && myActiveEvents.length === 0 && userGroups.filter(g => g.id !== selectedGroup?.id).length === 0 && (
                      <p className="text-xs text-[#acb3b4] py-1 text-center w-full font-medium">연관된 추천 태그가 없습니다.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 카드 3: 최종 지정 태그 배지 목록 */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                <span className="material-symbols-rounded text-sm text-primary">style</span>
                <p className="text-[14px] font-bold text-primary">최종 지정 태그 목록</p>
              </div>
              <div className="p-4 min-h-[100px]">
                {!selectedGroup && !selectedActivity && selectedPeople.length <= 1 && (
                  <p className="text-xs text-[#acb3b4] font-medium py-2">
                    지정된 태그가 없습니다. 상단 검색이나 추천 태그를 눌러 등록해 주세요.
                  </p>
                )}

                {(selectedGroup || selectedActivity || selectedPeople.length > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {selectedGroup && (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-white ${CLR.group} shadow-sm`}>
                        {ICON.group}
                        <span>{getLocalizedName(selectedGroup.name, (selectedGroup as any).nameNative)}</span>
                        <button 
                          type="button" 
                          onClick={() => {
                            setSelectedGroup(null);
                            if (selectedActivity?.groupId === selectedGroup.id) {
                              setSelectedActivity(null);
                            }
                          }} 
                          className="hover:opacity-100 ml-1 text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )}
                    {selectedActivity && (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-white ${CLR[selectedActivity.type]} shadow-sm`}>
                        {ICON[selectedActivity.type]}
                        <span>{getLocalizedName(selectedActivity.name, (selectedActivity as any).nameNative)}</span>
                        <button 
                          type="button" 
                          onClick={() => setSelectedActivity(null)} 
                          className="hover:opacity-100 ml-1 text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )}
                    {selectedPeople.map(p => (
                      <div key={p.id} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-white ${CLR.people} shadow-sm`}>
                        {p.avatar
                          ? <img src={p.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                          : <User size={12} />}
                        <span>{getLocalizedName(p.name, (p as any).nameNative)}</span>
                        <span className="text-[10px] opacity-75">
                          {p.role === 'me' ? '(나)' : p.role === 'organizer' ? '(주최)' : p.role === 'dj' ? '(DJ)' : p.role === 'instructor' ? '(강사)' : ''}
                        </span>
                        {p.role !== 'me' && (
                          <button onClick={() => setSelectedPeople(prev => prev.filter(x => x.id !== p.id))} className="hover:opacity-100 ml-1 text-red-500">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 소셜 100% 동일 하단 네비게이션 버튼 바 */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 px-4 shadow-lg flex gap-3 items-center justify-between"
        style={{
          zIndex: 100010,
          paddingTop: '16px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          height: 'calc(76px + env(safe-area-inset-bottom, 0px))'
        }}
      >
        {step > 1 && (
          <button
            type="button"
            onClick={handleHeaderBack}
            className="flex-grow py-3.5 rounded-full border border-slate-200 text-slate-700 text-sm font-bold active:scale-95 transition-transform"
          >
            {language === 'KR' ? '이전 단계' : 'Previous'}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (step < TOTAL_STEPS) {
              setStep(prev => prev + 1);
            } else {
              handlePost();
            }
          }}
          disabled={isUploading || (step === 1 && (!caption.trim() || (images.length === 0 && existingImages.length === 0)))}
          className="flex-grow py-3.5 rounded-full bg-[#007AFF] text-white text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
        >
          {step < TOTAL_STEPS
            ? (language === 'KR' ? '다음 단계' : 'Next Step')
            : (isUploading ? `${uploadProgress}%` : (isEditMode ? (t('common.update') || "수정 완료") : (t('common.post') || "게시물 등록")))}
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** Compact selectable chip */
const ChipCompact = ({ label, sub, avatar, icon, color, onClick }: {
  label: string; sub?: string; avatar?: string;
  icon?: React.ReactNode; color?: string; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8.5px] font-extrabold shadow-[0_1.5px_4px_rgba(0,0,0,0.06)] transition-all active:scale-95 shrink-0 ${
      color ? `${color} border` : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-100'
    }`}
  >
    {avatar && <img src={avatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />}
    {icon && <span className="opacity-75 shrink-0">{icon}</span>}
    <span className="truncate max-w-[110px]">{label}</span>
    {sub && <span className="text-[7.5px] opacity-60 truncate max-w-[60px]">{sub}</span>}
  </button>
);

/** Loading spinner */
const Spinner = () => (
  <div className="flex items-center gap-2 py-1 text-gray-300">
    <div className="w-3 h-3 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
    <span className="text-[10px]">Loading...</span>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Page wrapper                                                       */
/* ------------------------------------------------------------------ */
const GalleryCreatePage = () => (
  <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
    <GalleryCreateContent />
  </Suspense>
);

export default GalleryCreatePage;
