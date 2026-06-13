'use client';

import '../live.css';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  X, Camera, ChevronLeft, Search, Check, ChevronDown, ChevronUp,
  Music, GraduationCap, Calendar, Users, User, Building2, Hash
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { galleryService, GalleryTag, GalleryPost } from '@/lib/firebase/galleryService';
import { tagSearchService, TagSearchResult } from '@/lib/firebase/tagSearchService';
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
  const editId = searchParams.get('edit');
  const source = searchParams.get('source');
  const isFromLive = source === 'live';
  const { language, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
                const uSnap = await getDoc(doc(db, 'users', uid));
                if (uSnap.exists()) {
                  const uData = uSnap.data();
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
                  const uSnap = await getDoc(doc(db, 'users', inst.userId));
                  if (uSnap.exists()) {
                    const uData = uSnap.data();
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
                const uSnap = await getDoc(doc(db, 'users', hId));
                if (uSnap.exists()) {
                  const uData = uSnap.data();
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
        router.back();
      } else {
        const newPost = await galleryService.createPost({ authorId: user.uid, authorName: user.displayName || profile?.nickname || 'Anonymous', authorPhoto: user.photoURL || '', ...postData });
        router.replace('/create-success?type=live&id=' + (newPost || ''));
      }
    } catch (err) {
      console.error(err);
      alert(t('gallery.error_saving', 'Error saving post.'));
    } finally {
      setIsUploading(false);
    }
  };

  // ---- Render ----
  return (
    <div className="fixed inset-0 z-[100] bg-white md:bg-black/80 flex justify-center backdrop-blur-sm">
      <div className="gallery-create-container w-full h-full overflow-y-auto bg-white shadow-xl flex flex-col relative">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 h-14 flex items-center justify-between z-50 sticky top-0">
          <button type="button" onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform text-slate-700">
            <span className="material-symbols-rounded text-2xl">arrow_back</span>
          </button>
          <span className="text-[16px] font-bold text-slate-800">{isEditMode ? t('gallery.edit_post', 'Edit Post') : t('gallery.new_post', 'New Post')}</span>
          <button 
            className="px-5 py-2 rounded-full bg-[#007AFF] text-white text-[14px] font-bold disabled:opacity-50 active:scale-95 transition-all" 
            onClick={handlePost} 
            disabled={isUploading || (images.length === 0 && existingImages.length === 0) || !caption.trim()}
          >
            {isUploading ? `${uploadProgress}%` : (isEditMode ? t('common.update', 'Update') : t('common.post', 'Post'))}
          </button>
        </div>

        {isUploading && <div className="w-full bg-gray-100 h-1"><div className="bg-primary h-1 transition-all" style={{ width: `${uploadProgress}%` }} /></div>}

        {/* Media Upload */}
        <div className="upload-section" style={{ padding: '12px 16px' }}>
          <div className="image-preview-scroll bg-gray-50/50 p-2.5 rounded-xl border border-dashed border-gray-200">
            {previews.map((item, idx) => (
              <div key={idx} className="preview-item animate-fade-in" style={{ flex: '0 0 80px', height: '100px' }}>
                {item.type === 'video'
                  ? <video src={item.url} className="w-full h-full object-cover rounded-lg" muted loop autoPlay playsInline />
                  : <img src={item.url} alt="" className="w-full h-full object-cover rounded-lg" />}
                <button className="btn-remove-image" onClick={() => removeImage(idx)}><X size={12} /></button>
              </div>
            ))}
            <button 
              className="btn-add-more flex flex-col items-center justify-center border border-dashed border-gray-300 hover:border-primary rounded-lg bg-white transition-all text-gray-400 hover:text-primary gap-1 shrink-0" 
              style={{ flex: '0 0 100px', height: '100px' }} 
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={20} />
              <span className="text-[9px] font-bold tracking-tight">{t('gallery.add_media') || '이미지/동영상 추가'}</span>
            </button>
          </div>
          <input type="file" multiple accept="image/*,video/*" hidden ref={fileInputRef} onChange={handleImageChange} />
        </div>

        {/* Caption - compact single line */}
        <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2 bg-white">
          <input
            type="text"
            className="flex-1 text-[16px] bg-transparent border-none focus:outline-none placeholder:text-gray-400 font-normal text-gray-800"
            placeholder={(t('gallery.write_caption') || '내용을 입력하세요...') + ' (필수)'}
            value={caption}
            maxLength={MAX_CAPTION}
            onChange={e => setCaption(e.target.value)}
          />
          <span className={`text-[10px] font-bold shrink-0 ${caption.length >= MAX_CAPTION ? 'text-red-500' : 'text-gray-300'}`}>
            {caption.length}/{MAX_CAPTION}
          </span>
        </div>

        {/* ── LIVE TOGGLE ── */}
        {!isFromLive && (
          <div className="px-4 py-2 border-b border-gray-100 bg-white">
            <button
              className="w-full flex items-center gap-2.5 py-1"
              onClick={() => setShowInLive(!showInLive)}
            >
              <span className="material-symbols-outlined text-[16px] text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
              <span className="text-xs font-bold text-gray-700 flex-1 text-left">{t('gallery.also_show_in_live', 'Also show in Live')}</span>
              <div className={`w-9 h-5 rounded-full transition-colors duration-200 flex items-center px-0.5 ${showInLive ? 'bg-red-500' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${showInLive ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>
        )}

        {/* ===== TAG SYSTEM v2 개편 ===== */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
          
          {/* [1] 태그 검색 섹션 (최상단) */}
          <div className="space-y-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-extrabold text-gray-500 uppercase tracking-wider">태그 검색</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="relative">
              <input
                type="text"
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-10 py-2.5 text-[16px] focus:outline-none focus:border-primary shadow-sm text-gray-800 placeholder:text-gray-400 placeholder:font-normal"
                placeholder={t('gallery.search_placeholder', 'Search group, social, event, class, people...')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3.5 top-3 text-gray-400" size={14} />
              {isSearching && (
                <div className="absolute right-4 top-3 w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              )}
            </div>

            {searchQuery.length >= 1 && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl max-h-60 overflow-y-auto shadow-lg divide-y divide-gray-50 z-20">
                {searchResults.length > 0 ? (
                  searchResults.map(r => (
                    <button
                      key={`${r.type}-${r.id}`}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left transition-colors"
                      onClick={() => addSearchResult(r)}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center border shrink-0 ${CLR[r.type] || 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                        {ICON[r.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-gray-900 truncate">
                          {getLocalizedName(r.name, (r as any).nameNative)}
                        </div>
                        <div className="text-[9px] text-gray-400 truncate">
                          {r.type.toUpperCase()} · {r.subtitle}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-6 text-center text-gray-400 text-[11px]">
                    {t('gallery.no_results', 'No results found.')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* [2] 연관 추천 태그 섹션 (가운데) - 단일 칩 정렬식 */}
          <div className="space-y-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-extrabold text-gray-500 uppercase tracking-wider">{t('gallery.relevant_tags') || '연관 추천 태그'}</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {loadingRelevant ? (
              <Spinner />
            ) : (
              <div className="flex flex-wrap gap-1.5 py-1">
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
                    <p className="text-[9px] text-gray-400 py-1 text-center w-full">연관된 추천 태그가 없습니다.</p>
                  )}
              </div>
            )}
          </div>

          {/* [3] 최종 태그 결과 섹션 (하단) */}
          <div className="flex-1 space-y-2.5 min-h-[120px]">
            <div className="flex items-center gap-1.5">
              <Hash size={12} className="text-gray-400 shrink-0" />
              <span className="text-[13px] font-extrabold text-gray-500 uppercase tracking-wider">최종 태그 결과</span>
            </div>

            {/* 선택된 태그가 없는 경우 안내 문구 */}
            {!selectedGroup && !selectedActivity && selectedPeople.length <= 1 && (
              <p className="text-[9px] text-gray-400 py-1.5 font-normal">
                태그된 정보가 없습니다. 추천 태그나 검색을 이용해 주세요.
              </p>
            )}

            {/* 최종 선택된 칩들의 목록 */}
            {(selectedGroup || selectedActivity || selectedPeople.length > 0) && (
              <div className="flex flex-wrap gap-1.5 py-0.5">
                {selectedGroup && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8.5px] font-extrabold border bg-white ${CLR.group} shadow-[0_1px_3px_rgba(0,0,0,0.04)]`}>
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
                      className="opacity-60 hover:opacity-100 ml-0.5"
                    >
                      <X size={9} />
                    </button>
                  </span>
                )}
                {selectedActivity && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8.5px] font-extrabold border bg-white ${CLR[selectedActivity.type]} shadow-[0_1px_3px_rgba(0,0,0,0.04)]`}>
                    {ICON[selectedActivity.type]}
                    <span>{getLocalizedName(selectedActivity.name, (selectedActivity as any).nameNative)}</span>
                    <button 
                      type="button" 
                      onClick={() => setSelectedActivity(null)} 
                      className="opacity-60 hover:opacity-100 ml-0.5"
                    >
                      <X size={9} />
                    </button>
                  </span>
                )}
                {selectedPeople.map(p => (
                  <div key={p.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-extrabold border bg-white ${CLR.people} shadow-[0_1px_3px_rgba(0,0,0,0.04)]`}>
                    {p.avatar
                      ? <img src={p.avatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                      : <User size={9} />}
                    <span>{getLocalizedName(p.name, (p as any).nameNative)}</span>
                    <span className="text-[7.5px] opacity-65">
                      {p.role === 'me' ? '(me)' : p.role === 'organizer' ? '(org)' : p.role === 'dj' ? '(dj)' : p.role === 'instructor' ? '(inst)' : ''}
                    </span>
                    {p.role !== 'me' && (
                      <button onClick={() => setSelectedPeople(prev => prev.filter(x => x.id !== p.id))} className="opacity-50 hover:opacity-100 ml-0.5">
                        <X size={8} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
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
