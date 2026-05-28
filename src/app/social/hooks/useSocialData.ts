import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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

export function useSocialData() {
  const [regulars, setRegulars] = useState<Social[]>([]);
  const [popups, setPopups] = useState<Social[]>([]);
  const [dailySocials, setDailySocials] = useState<Social[]>([]);
  const [activeDayOffset, setActiveDayOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSocial, setSelectedSocial] = useState<Social | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewType, setViewType] = useState<'slide' | 'list' | 'weekly' | 'favorite'>('slide');
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

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      socialService.getSocialById(id).then((social) => {
        if (social) {
          handleOpenView(social);
        }
      });
    }

    return () => {
      window.removeEventListener('woc:compose:open', handleComposeOpen as EventListener);
    };
  }, []);

  // 2. Real-time Firebase Subscriptions (Venues & User Likes)
  const isVenuesSubscribed = useRef(false);
  useEffect(() => {
    let unsubVenues = () => {};
    if (!isVenuesSubscribed.current) {
      isVenuesSubscribed.current = true;
      unsubVenues = onSnapshot(collection(db, 'venues'), (snapshot) => {
        const map: Record<string, any> = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          map[doc.id] = { id: doc.id, ...data };
          
          const city = (data.city || '').toUpperCase();
          if (city === 'SEOUL' && !data.seoulArea) {
            const address = (data.address || '').toLowerCase();
            const district = (data.district || '').toLowerCase();
            const gangbukDists = ['마포', '용산', '성동', '서대문', '종로', '중구', '광진', '은평', '성북', '동대문', '중랑', '강북', '도봉', '노원'];
            let assignedArea = 'gangnam';
            for (const d of gangbukDists) {
              if (address.includes(d) || district.includes(d)) {
                assignedArea = 'gangbuk';
                break;
              }
            }
            import('firebase/firestore').then(({ doc: fireDoc, updateDoc }) => {
              updateDoc(fireDoc(db, 'venues', doc.id), { seoulArea: assignedArea })
                .catch(err => console.error('seoulArea 자동 마이그레이션 실패:', err));
            });
          }
        });
        setVenuesMap(map);
      });
    }

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

  const hasPromptedAuth = useRef(false);

  // 3. Auth Guard & URL Modal State Sync (1회성 권유 가드 적용)
  useEffect(() => {
    if (!loading) {
      if (!user && !hasPromptedAuth.current) {
        hasPromptedAuth.current = true;
        setShowLogin(true);
      } else if (profile && !profile.isRegistered && !hasPromptedAuth.current) {
        hasPromptedAuth.current = true;
        setShowLogin(true);
      }
    }

    if (!isCreateOpenURL && isCreateOpen) {
      setIsCreateOpen(false);
    }

    if (!isEditOpenURL && selectedSocial) {
      setSelectedSocial(null);
    }
  }, [user, profile, loading, setShowLogin, isCreateOpenURL, isCreateOpen, isEditOpenURL, selectedSocial]);

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

  const handleOpenCreate = () => {
    setIsCreateOpen(true);
    openCreateURL('true');
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    closeCreateURL();
  };

  const handleOpenView = (social: Social) => {
    openViewURL(social.id);
  };

  const handleCloseView = () => {
    closeViewURL();
  };

  const handleOpenEdit = (social: Social) => {
    setSelectedSocial(social);
    openEditURL(social.id);
  };

  const handleCloseEdit = () => {
    setSelectedSocial(null);
    closeEditURL();
  };

  // Location filter checker
  const matchLocation = useCallback((s: Social) => {
    const isGlobal = !location.country || location.country === 'ALL';
    const isCityAll = !location.city || location.city === 'ALL';
    if (isGlobal && isCityAll) return true;

    if (!isGlobal) {
      if (!s.country) return false;
      const matchCountry = String(s.country).trim().toLowerCase() === String(location.country).trim().toLowerCase();
      if (!matchCountry) return false;
    }

    if (!isCityAll) {
      if (!s.city) return false;
      const matchCity = String(s.city).trim().toLowerCase() === String(location.city).trim().toLowerCase();
      if (!matchCity) return false;
    }

    return true;
  }, [location.country, location.city]);

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

    const filtered = locationFilteredSocials;
    const instances: { date: Date, social: Social }[] = [];

    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      const targetDayOfWeek = targetDate.getDay();
      const targetDateTime = targetDate.getTime();

      filtered.forEach(s => {
        const dayNum = Number(s.dayOfWeek);
        if (s.type === 'regular' && !isNaN(dayNum) && dayNum === targetDayOfWeek) {
          instances.push({ date: targetDate, social: s });
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
      if (rec === 'every' || rec === '') return true;
      if (rec === '1st' && ordinal === 1) return true;
      if (rec === '2nd' && ordinal === 2) return true;
      if (rec === '3rd' && ordinal === 3) return true;
      if (rec === '4th' && ordinal === 4) return true;
      if (rec === 'last' && isLast) return true;

      return false;
    });

    // 2. Popup milonga filter
    const matchedPopups = popups.filter(matchLocation).filter(s => {
      if (!s.date) return false;
      const sDate = typeof s.date.toDate === 'function' ? s.date.toDate() : new Date(s.date as any);
      return sDate.toDateString() === targetDate.toDateString();
    });

    const unifiedList = [...matchedRegulars, ...matchedPopups];

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
           location.city === 'DAEJEON' ? (language === 'KR' ? '대전' : 'Daejeon') :
           location.city === 'DAEGU' ? (language === 'KR' ? '대구' : 'Daegu') :
           location.city === 'GWANGJU' ? (language === 'KR' ? '광주' : 'Gwangju') :
           location.city === 'INCHEON' ? (language === 'KR' ? '인천' : 'Incheon') :
           location.city === 'JEJU' ? (language === 'KR' ? '제주' : 'Jeju') : location.city;
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
