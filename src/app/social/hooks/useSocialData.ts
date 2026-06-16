import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase/clientApp';
import { onSnapshot, collection } from 'firebase/firestore';
import { socialService } from '@/lib/firebase/socialService';
import { Social } from '@/types/social';
import { useLocation } from '@/components/providers/LocationProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { useModalNavigation } from "@/hooks/useModalNavigation";
import { 
  getWeekOrdinal, 
  isLastWeekOfMonth, 
  isKoreanHoliday, 
  detectSeoulDistrict 
} from '../constants/seoulRegions';
import { matchLocationGroup } from '../constants/regionMapping';

export function useSocialData() {
  const searchParams = useSearchParams();
  const [regulars, setRegulars] = useState<Social[]>([]);
  const [popups, setPopups] = useState<Social[]>([]);
  const [dailySocials, setDailySocials] = useState<Social[]>([]);
  const [activeDayOffset, setActiveDayOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSocial, setSelectedSocial] = useState<Social | null>(null);
  const [localViewSocial, setLocalViewSocial] = useState<Social | null>(null);
  const [viewSocialDate, setViewSocialDate] = useState<Date | null>(null);
  const isClosingRef = useRef(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewType, setViewType] = useState<'slide' | 'list' | 'weekly' | 'favorite'>('weekly');
  const [venuesMap, setVenuesMap] = useState<Record<string, any>>({});
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [likedSocialIds, setLikedSocialIds] = useState<string[]>([]);
  
  const carouselRef = useRef<HTMLDivElement>(null);
  
  const { location, toggleSelector } = useLocation();
  const { user, profile, loading, setShowLogin } = useAuth();
  const { setSubHeader } = useNavigation();
  const { t, language } = useLanguage();
  
  const dateLocale = language === 'KR' ? 'ko-KR' : 'en-US';

  // Calculate week days starting from today
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    });
  }, []);

  // 1. One-time Mount Interactions (Compose listener & URL Query Parameter check)
  useEffect(() => {
    const handleComposeOpen = (e: CustomEvent) => {
      if (e.detail?.id === 'social') {
        handleOpenCreate();
      }
    };
    window.addEventListener('woc:compose:open', handleComposeOpen as EventListener);

    // sessionStorage 플래그 체크 (통합 등록 메뉴에서 진입 시)
    const pending = sessionStorage.getItem('woc_compose_pending');
    if (pending === 'social') {
      sessionStorage.removeItem('woc_compose_pending');
      handleOpenCreate();
    }

    // 네이티브 URL 쿼리 즉각 검사 및 가드 (Next.js 라우터 얕은 라우팅 갱신 누락 방지)
    const checkNativeQuery = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('createSocial') === 'true') {
          setIsCreateOpen(true);
        } else {
          setIsCreateOpen(false);
        }

        const id = params.get('id');
        if (id) {
          socialService.getSocialById(id).then((social) => {
            if (social) {
              handleOpenView(social);
            }
          });
        }
      }
    };

    checkNativeQuery();
    window.addEventListener('popstate', checkNativeQuery);

    return () => {
      window.removeEventListener('woc:compose:open', handleComposeOpen as EventListener);
      window.removeEventListener('popstate', checkNativeQuery);
    };
  }, []);

  // 2. Real-time Firebase Subscriptions (Venues)
  useEffect(() => {
    const unsubVenues = onSnapshot(collection(db, 'venues'), (snapshot) => {
      const map: Record<string, any> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        map[doc.id] = { id: doc.id, ...data };
      });
      setVenuesMap(map);
    });

    return () => {
      unsubVenues();
    };
  }, []);

  // 3. Real-time Firebase Subscriptions (User Likes)
  useEffect(() => {
    let unsubLikes = () => {};
    if (user) {
      unsubLikes = socialService.subscribeMyLikes(user.uid, (likes) => {
        setLikedSocialIds(likes.map(l => l.id));
      });
    } else {
      setLikedSocialIds([]);
    }

    return () => {
      unsubLikes();
    };
  }, [user]);

  // Modal navigation setup
  const { isOpen: isCreateOpenURL, openModal: openCreateURL, closeModal: closeCreateURL } = useModalNavigation('createSocial');
  const { isOpen: isViewOpenURL, value: viewSocialId, openModal: openViewURL, closeModal: closeViewURL } = useModalNavigation('viewSocial');
  const { isOpen: isEditOpenURL, openModal: openEditURL, closeModal: closeEditURL } = useModalNavigation('editSocial');


  // URL 쿼리와 로컬 등록 모달 상태의 무결점 실시간 정밀 동기화 (Single Source of Truth)
  useEffect(() => {
    setIsCreateOpen(isCreateOpenURL);
  }, [isCreateOpenURL]);

  // URL 쿼리와 로컬 수정 모달 상태의 무결점 실시간 정밀 동기화 (Single Source of Truth)
  useEffect(() => {
    const editId = searchParams.get('editSocial');
    if (editId) {
      const found = regulars.find(s => s.id === editId)
        || popups.find(s => s.id === editId)
        || dailySocials.find(s => s.id === editId);
      if (found) {
        setSelectedSocial(found);
      }
    } else {
      setSelectedSocial(null);
    }
  }, [searchParams, regulars, popups, dailySocials]);

  // URL의 viewSocial 파라미터와 로컬 viewSocial 상태의 실시간 정밀 동기화
  useEffect(() => {
    const viewId = searchParams.get('viewSocial');
    const viewDateStr = searchParams.get('viewDate');
    
    if (isClosingRef.current) {
      if (!viewId) {
        isClosingRef.current = false;
      }
      return;
    }

    if (viewId) {
      const found = regulars.find(s => s.id === viewId)
        || popups.find(s => s.id === viewId)
        || dailySocials.find(s => s.id === viewId);
      if (found) {
        setLocalViewSocial(found);
        if (viewDateStr) {
          setViewSocialDate(new Date(viewDateStr));
        } else {
          setViewSocialDate(null);
        }
      }
    } else {
      setLocalViewSocial(null);
      setViewSocialDate(null);
    }
  }, [searchParams, regulars, popups, dailySocials]);

  // 4. Social data listener subscription & Carousel scroll reset
  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = 0;
    }

    const unsubRegulars = socialService.subscribeSocials('regular', (data) => {
      setRegulars(data);
    });

    const day = weekDays[activeDayOffset].getDay();
    const date = weekDays[activeDayOffset];
    const unsubDaily = socialService.subscribeDailySocials(day, date, (data) => {
      setDailySocials(data);
    });

    const unsubPopups = socialService.subscribeSocials('popup', (data) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const valid = data.filter(s => {
        if (!s.date) return false;
        const sDate = typeof s.date.toDate === 'function' ? s.date.toDate() : new Date(s.date as any);
        sDate.setHours(0, 0, 0, 0);
        return sDate.getTime() >= today.getTime();
      });
      const sorted = valid.sort((a, b) => {
        const dateA = a.date ? (typeof a.date.toDate === 'function' ? a.date.toDate().getTime() : new Date(a.date as any).getTime()) : 0;
        const dateB = b.date ? (typeof b.date.toDate === 'function' ? b.date.toDate().getTime() : new Date(b.date as any).getTime()) : 0;
        return dateA - dateB;
      });
      setPopups(sorted);
    });

    return () => {
      unsubRegulars();
      unsubDaily();
      unsubPopups();
    };
  }, [activeDayOffset, weekDays]);

  const handleToggleLike = async (e: React.MouseEvent, socialId: string) => {
    e.stopPropagation();
    if (!user) {
      setShowLogin(true);
      return;
    }
    try {
      await socialService.toggleLike(user.uid, socialId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreate = useCallback(() => {
    setIsCreateOpen(true);
    openCreateURL('true');
  }, [openCreateURL]);

  const handleCloseCreate = useCallback(() => {
    setIsCreateOpen(false);
    closeCreateURL();
  }, [closeCreateURL]);

  const handleOpenView = useCallback((social: Social, date?: Date) => {
    isClosingRef.current = false;
    setLocalViewSocial(social);
    setViewSocialDate(date || null);
    
    if (date) {
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
      openViewURL(social.id, { viewDate: dateStr });
    } else {
      openViewURL(social.id);
    }
  }, [openViewURL]);

  const handleCloseView = useCallback(() => {
    isClosingRef.current = true;
    closeViewURL();
    setLocalViewSocial(null);
    setViewSocialDate(null);

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    requestAnimationFrame(() => {
      isClosingRef.current = false;
    });
  }, [closeViewURL]);

  const handleOpenEdit = useCallback((social: Social) => {
    setSelectedSocial(social);
    openEditURL(social.id);
  }, [openEditURL]);

  const handleCloseEdit = useCallback(() => {
    setSelectedSocial(null);
    closeEditURL();
  }, [closeEditURL]);


  // Location filter checker
  const matchLocation = useCallback((s: Social) => {
    const isGlobal = !location.country || location.country === 'ALL' || location.country === 'GLOBAL';
    const isCityAll = !location.city || location.city === 'ALL';
    if (isGlobal && isCityAll) return true;

    if (!isGlobal) {
      const selectedCountryUpper = String(location.country).trim().toUpperCase();
      const docCountryUpper = String(s.country || '').trim().toUpperCase();
      
      if (selectedCountryUpper === 'KOREA') {
        const isKoreaDoc = !docCountryUpper || ['KOREA', 'KR', 'SOUTH KOREA'].includes(docCountryUpper);
        if (!isKoreaDoc) return false;
      } else {
        if (docCountryUpper !== selectedCountryUpper) return false;
      }
    }

    if (!isCityAll) {
      const venue = s.venueId ? venuesMap[s.venueId] : null;
      const resolvedCity = s.city || venue?.city || venue?.address || '';
      return matchLocationGroup(location.city, resolvedCity);
    }

    return true;
  }, [location.country, location.city, venuesMap]);

  const locationFilteredSocials = useMemo(() => {
    return [...regulars, ...dailySocials, ...popups].filter(matchLocation);
  }, [regulars, dailySocials, popups, matchLocation]);

  const viewSocial = useMemo(() => {
    if (!viewSocialId) return null;
    return regulars.find(s => s.id === viewSocialId)
      || popups.find(s => s.id === viewSocialId)
      || dailySocials.find(s => s.id === viewSocialId)
      || null;
  }, [viewSocialId, regulars, popups, dailySocials]);

  // Favorite timeline query
  const favoriteTimeline = useMemo(() => {
    if (viewType !== 'favorite') return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const liked = [...regulars, ...popups].filter(s => likedSocialIds.includes(s.id));
    const instances: { date: Date, social: Social }[] = [];

    liked.forEach(s => {
      if (s.type === 'popup' && s.date) {
        const sDate = typeof s.date.toDate === 'function' ? s.date.toDate() : new Date(s.date as any);
        sDate.setHours(0, 0, 0, 0);
        if (sDate >= today) {
          instances.push({ date: sDate, social: s });
        }
      } else if (s.type === 'regular' && s.dayOfWeek !== undefined) {
        const dayNum = Number(s.dayOfWeek);
        if (!isNaN(dayNum)) {
          for (let i = 0; i < 1; i++) {
            const d = new Date(today);
            let offset = dayNum - d.getDay();
            if (offset < 0) offset += 7;
            d.setDate(d.getDate() + offset + (i * 7));
            instances.push({ date: d, social: s });
          }
        }
      }
    });

    instances.sort((a, b) => a.date.getTime() - b.date.getTime());

    const grouped: Record<string, { date: Date, socials: Social[] }> = {};
    instances.forEach(inst => {
      const dateStr = inst.date.toDateString();
      if (!grouped[dateStr]) grouped[dateStr] = { date: inst.date, socials: [] };
      if (!grouped[dateStr].socials.find(s => s.id === inst.social.id)) {
        grouped[dateStr].socials.push(inst.social);
      }
    });

    return Object.values(grouped).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [viewType, regulars, popups, likedSocialIds]);

  // Overview weekly timeline query
  const overviewTimeline = useMemo(() => {
    if (viewType !== 'weekly') return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 쁘락띠까(practica) subCategory 제외 필터 적용
    const filtered = locationFilteredSocials.filter(s => s.subCategory !== 'practica');
    const instances: { date: Date, social: Social }[] = [];

    const year = today.getFullYear();
    const month = today.getMonth();
    const endOfMonth = new Date(year, month + 1, 0);
    const totalDays = endOfMonth.getDate();

    for (let i = 0; i < totalDays; i++) {
      const targetDate = new Date(year, month, 1 + i);
      const targetDayOfWeek = targetDate.getDay();
      const targetDateTime = targetDate.getTime();

      filtered.forEach(s => {
        const dayNum = Number(s.dayOfWeek);
        if (s.type === 'regular' && !isNaN(dayNum) && dayNum === targetDayOfWeek) {
          const ordinal = getWeekOrdinal(targetDate);
          const isLast = isLastWeekOfMonth(targetDate);
          const rec = (s.recurrence || 'every').trim().toLowerCase();
          const recParts = rec.split(',').map(x => x.trim());
          
          const matchRecurrence = recParts.some(part => {
            if (part === 'every' || part === '') return true;
            if (part === '1st' && ordinal === 1) return true;
            if (part === '2nd' && ordinal === 2) return true;
            if (part === '3rd' && ordinal === 3) return true;
            if (part === '4th' && ordinal === 4) return true;
            if (part === 'last' && isLast) return true;
            return false;
          });

          if (matchRecurrence) {
            instances.push({ date: targetDate, social: s });
          }
        } else if (s.type === 'popup' && s.date) {
          const sDate = typeof s.date.toDate === 'function' ? s.date.toDate() : new Date(s.date as any);
          sDate.setHours(0, 0, 0, 0);
          if (sDate.getTime() === targetDateTime) {
            instances.push({ date: targetDate, social: s });
          }
        }
      });
    }

    const grouped: Record<string, { date: Date, socials: Social[] }> = {};
    instances.forEach(inst => {
      const dateStr = inst.date.toDateString();
      if (!grouped[dateStr]) grouped[dateStr] = { date: inst.date, socials: [] };
      if (!grouped[dateStr].socials.find(s => s.id === inst.social.id)) {
        grouped[dateStr].socials.push(inst.social);
      }
    });

    const result = Object.values(grouped).sort((a, b) => a.date.getTime() - b.date.getTime());
    result.forEach(group => {
      group.socials.sort((a, b) => {
        const timeA = a.startTime || '00:00';
        const timeB = b.startTime || '00:00';
        return timeA.localeCompare(timeB);
      });
    });
    return result;
  }, [viewType, locationFilteredSocials]);

  // Today's socials stream generator
  const todaysSocials = useMemo(() => {
    const targetDate = weekDays[activeDayOffset];
    const targetDay = targetDate.getDay();
    const ordinal = getWeekOrdinal(targetDate);
    const isLast = isLastWeekOfMonth(targetDate);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const targetDateStr = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}`;

    // 1. Regular milonga filter
    const matchedRegulars = regulars.filter(matchLocation).filter(s => {
      if (Number(s.dayOfWeek) !== targetDay) return false;

      const rec = (s.recurrence || 'every').trim().toLowerCase();
      const recParts = rec.split(',').map(x => x.trim());

      return recParts.some(part => {
        if (part === 'every' || part === '') return true;
        if (part === '1st' && ordinal === 1) return true;
        if (part === '2nd' && ordinal === 2) return true;
        if (part === '3rd' && ordinal === 3) return true;
        if (part === '4th' && ordinal === 4) return true;
        if (part === 'last' && isLast) return true;
        return false;
      });
    });

    // 2. Popup milonga filter
    const matchedPopups = popups.filter(matchLocation).filter(s => {
      if (!s.date) return false;
      const sDate = typeof s.date.toDate === 'function' ? s.date.toDate() : new Date(s.date as any);
      return sDate.toDateString() === targetDate.toDateString();
    });

    // 3. 중복 일정 충돌 방지: 동일 장소(venueId)에 팝업 밀롱가 일정이 있으면 오늘 정규 밀롱가 일정은 숨김 처리
    const popupVenueIds = new Set(matchedPopups.map(p => p.venueId).filter(Boolean));
    const filteredRegulars = matchedRegulars.filter(r => !popupVenueIds.has(r.venueId));

    const unifiedList = [...filteredRegulars, ...matchedPopups];

    // 3. Dynamic DJ assignment mapping
    const listWithActiveDj = unifiedList.map(s => {
      const cloned = { ...s, hasActiveDj: false };
      if (cloned.djs && Array.isArray(cloned.djs) && cloned.djs.length > 0) {
        const matchedDj = cloned.djs.find(dj => dj && dj.date === targetDateStr);
        if (matchedDj && matchedDj.djName) {
          cloned.djName = matchedDj.djName;
          cloned.hasActiveDj = true;
        } else {
          cloned.djName = '';
          cloned.hasActiveDj = true;
        }
      }
      return cloned;
    });

    // 4. Merge duplicate events at the same venue, startTime and weekday
    const mergedList: any[] = [];
    listWithActiveDj.forEach(s => {
      const venueKey = String(s.venueId || s.venueName || '').trim().toLowerCase();
      const timeKey = String(s.startTime || '').trim();
      const uniqueKey = `${venueKey}_${timeKey}_${s.dayOfWeek || 'popup'}`;

      const existingIdx = mergedList.findIndex(item => {
        const itemVenueKey = String(item.venueId || item.venueName || '').trim().toLowerCase();
        const itemTimeKey = String(item.startTime || '').trim();
        const itemKey = `${itemVenueKey}_${itemTimeKey}_${item.dayOfWeek || 'popup'}`;
        return itemKey === uniqueKey;
      });

      if (existingIdx > -1) {
        const existing = mergedList[existingIdx];
        
        const currentDj = String(s.djName || '').trim();
        const existingDj = String(existing.djName || '').trim();
        const currentHasActive = !!s.hasActiveDj;
        const existingHasActive = !!existing.hasActiveDj;

        if (currentHasActive && !existingHasActive) {
          existing.djName = currentDj;
          existing.hasActiveDj = true;
        } else if (!currentHasActive && existingHasActive) {
          // Keep active DJ
        } else {
          if (currentDj && !existingDj) {
            existing.djName = currentDj;
          } else if (currentDj && existingDj && currentDj !== existingDj) {
            existing.djName = `${existingDj} / ${currentDj}`;
          }
        }

        if (!existing.imageUrl && s.imageUrl) {
          existing.imageUrl = s.imageUrl;
        }
        if (!existing.description && s.description) {
          existing.description = s.description;
        }
      } else {
        mergedList.push(s);
      }
    });

    const seen = new Set<string>();
    return mergedList.filter(s => {
      if (!s.id) return true;
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [regulars, popups, activeDayOffset, weekDays, matchLocation]);

  const cityDisplay = useMemo(() => {
    if (!location?.city || location.city === 'ALL') {
      return language === 'KR' ? '전체' : 'All';
    }
    return location.city === 'SEOUL' ? (language === 'KR' ? '서울' : 'Seoul') :
           location.city === 'BUSAN' ? (language === 'KR' ? '부산' : 'Busan') :
           location.city === 'GWANGJU' ? (language === 'KR' ? '광주' : 'Gwangju') :
           location.city === 'DAEJEON' ? (language === 'KR' ? '대전' : 'Daejeon') : location.city;
  }, [location?.city, language]);

  return {
    regulars,
    popups,
    dailySocials,
    activeDayOffset,
    setActiveDayOffset,
    searchQuery,
    setSearchQuery,
    selectedSocial,
    setSelectedSocial,
    isCreateOpen,
    setIsCreateOpen,
    viewType,
    setViewType,
    venuesMap,
    likedSocialIds,
    carouselRef,
    location,
    toggleSelector,
    user,
    profile,
    loading,
    setShowLogin,
    setSubHeader,
    t,
    language,
    dateLocale,
    weekDays,
    locationFilteredSocials,
    favoriteTimeline,
    overviewTimeline,
    todaysSocials,
    cityDisplay,
    viewSocial,
    localViewSocial,
    viewSocialDate,
    isViewOpenURL,
    isEditOpenURL,
    handleToggleLike,
    handleOpenCreate,
    handleCloseCreate,
    handleOpenView,
    handleCloseView,
    handleOpenEdit,
    handleCloseEdit
  };
}
