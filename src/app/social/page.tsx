'use client';

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { db } from '@/lib/firebase/clientApp';
import { onSnapshot, collection } from 'firebase/firestore';
import { socialService } from '@/lib/firebase/socialService';
import { Social } from '@/types/social';
import { safeDate } from '@/lib/utils/safeDate';
import EditSocialEvent from '@/components/social/EditSocialEvent';
import { useLocation } from '@/components/providers/LocationProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import SocialViewer from '@/components/social/SocialViewer';
import SocialHeroCard, { DualText, SocialCardImage, getSocialDisplayTitle } from '@/components/social/SocialHeroCard';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { useModalNavigation } from "@/hooks/useModalNavigation";
import { getDjDisplay } from "@/lib/utils/socialUtils";
// 대한민국 법정공휴일 (2025-2027)
const KR_HOLIDAYS: Record<string, string> = {
  '2025-01-01': 'New Year', '2025-01-28': 'Seollal', '2025-01-29': 'Seollal', '2025-01-30': 'Seollal',
  '2025-03-01': 'Independence Movement', '2025-05-05': 'Children\'s Day', '2025-05-06': 'Buddha\'s Birthday',
  '2025-06-06': 'Memorial Day', '2025-08-15': 'Liberation Day', '2025-10-03': 'National Foundation',
  '2025-10-05': 'Chuseok', '2025-10-06': 'Chuseok', '2025-10-07': 'Chuseok', '2025-10-09': 'Hangul Day',
  '2025-12-25': 'Christmas',
  '2026-01-01': 'New Year', '2026-02-16': 'Seollal', '2026-02-17': 'Seollal', '2026-02-18': 'Seollal',
  '2026-03-01': 'Independence Movement', '2026-05-05': 'Children\'s Day', '2026-05-24': 'Buddha\'s Birthday',
  '2026-06-06': 'Memorial Day', '2026-08-15': 'Liberation Day', '2026-09-24': 'Chuseok',
  '2026-09-25': 'Chuseok', '2026-09-26': 'Chuseok', '2026-10-03': 'National Foundation', '2026-10-09': 'Hangul Day',
  '2026-12-25': 'Christmas',
  '2027-01-01': 'New Year', '2027-02-06': 'Seollal', '2027-02-07': 'Seollal', '2027-02-08': 'Seollal',
  '2027-03-01': 'Independence Movement', '2027-05-05': 'Children\'s Day', '2027-05-13': 'Buddha\'s Birthday',
  '2027-06-06': 'Memorial Day', '2027-08-15': 'Liberation Day', '2027-10-03': 'National Foundation',
  '2027-10-09': 'Hangul Day', '2027-10-13': 'Chuseok', '2027-10-14': 'Chuseok', '2027-10-15': 'Chuseok',
  '2027-12-25': 'Christmas',
};
function getDateKey(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function isKoreanHoliday(d: Date) { return KR_HOLIDAYS[getDateKey(d)] || null; }

function SocialContent() {
  const [regulars, setRegulars] = useState<Social[]>([]);
  const [popups, setPopups] = useState<Social[]>([]);
  const [dailySocials, setDailySocials] = useState<Social[]>([]);
  const [activeDayOffset, setActiveDayOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSocial, setSelectedSocial] = useState<Social | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Fullscreen and Horizontal City Swipable State using PWA back-button friendly URL Sync
  const { isOpen: isFullscreenOpen, openModal: openFullscreen, closeModal: closeFullscreen } = useModalNavigation('fullscreenBrief');
  const [activeCityTab, setActiveCityTab] = useState('서울');
  const cityScrollRef = useRef<HTMLDivElement>(null);

  // 실시간 모든 장소(Venues)의 실제 주소/구역 데이터베이스 동기화 및 자동 마이그레이션 상태
  const [venuesMap, setVenuesMap] = useState<Record<string, any>>({});
  
  useEffect(() => {
    return onSnapshot(collection(db, 'venues'), (snapshot) => {
      const map: Record<string, any> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        map[doc.id] = { id: doc.id, ...data };
        
        // 서울에 위치하고 seoulArea 필드가 없는 베뉴에 대해 1회성 마이그레이션 실시간 자동 수행
        const city = (data.city || '').toUpperCase();
        if (city === 'SEOUL' && !data.seoulArea) {
          const address = (data.address || '').toLowerCase();
          const district = (data.district || '').toLowerCase();
          
          const gangbukDists = ['마포', '용산', '성동', '서대문', '종로', '중구', '광진', '은평', '성북', '동대문', '중랑', '강북', '도봉', '노원'];
          let assignedArea = 'gangnam'; // 기본값 강남
          
          for (const d of gangbukDists) {
            if (address.includes(d) || district.includes(d)) {
              assignedArea = 'gangbuk';
              break;
            }
          }
          
          // Firestore updateDoc 원격 동적 마운트 실행
          import('firebase/firestore').then(({ doc: fireDoc, updateDoc }) => {
            updateDoc(fireDoc(db, 'venues', doc.id), { seoulArea: assignedArea })
              .catch(err => console.error('seoulArea 자동 마이그레이션 실패:', err));
          });
        }
      });
      setVenuesMap(map);
    });
  }, []);

  // New Header Filter States
  const [activeTab, setActiveTab] = useState<'this_week' | 'popup' | 'favorite' | 'overview'>('this_week');
  const [showOrganizerFilter, setShowOrganizerFilter] = useState(false);
  const [showClubFilter, setShowClubFilter] = useState(false);
  const [selectedOrganizer, setSelectedOrganizer] = useState('All');
  const [selectedClub, setSelectedClub] = useState('All');

  const { location } = useLocation();
  const { user, profile, loading, setShowLogin } = useAuth();

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const { setSubHeader } = useNavigation();
  const { t, language } = useLanguage();
  const dateLocale = language === 'KR' ? 'ko-KR' : 'en-US';
  const [likedSocialIds, setLikedSocialIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setLikedSocialIds([]);
      return;
    }
    return socialService.subscribeMyLikes(user.uid, (likes) => setLikedSocialIds(likes.map(l => l.id)));
  }, [user]);

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

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = 0;
    }
  }, [activeDayOffset]);

  // Listen to global compose event
  useEffect(() => {
    const handleComposeOpen = (e: CustomEvent) => {
      if (e.detail?.id === 'social') {
        handleOpenCreate();
      }
    };
    window.addEventListener('woc:compose:open', handleComposeOpen as EventListener);
    return () => window.removeEventListener('woc:compose:open', handleComposeOpen as EventListener);
  }, []);

  // Auth Guard for Social Page
  useEffect(() => {
    // Wait until both auth and profile loading are complete
    // profile can be null while still loading even after user is set
    if (!loading && !user) {
      setShowLogin(true);
    } else if (!loading && user && profile && !profile.isRegistered) {
      setShowLogin(true);
    }
  }, [user, profile, loading, setShowLogin]);

  const canEdit = (s: Social) => {
    if (!user) return false;
    if (profile?.isAdmin || (profile as any)?.systemRole === 'admin') return true;
    if (user.uid === s.organizerId) return true;
    return false;
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('social.confirm_delete'))) {
      await socialService.deleteSocial(id);
      setActiveMenuId(null);
    }
  };

  const { isOpen: isCreateOpenURL, openModal: openCreateURL, closeModal: closeCreateURL } = useModalNavigation('createSocial');
  const { isOpen: isViewOpenURL, value: viewSocialId, openModal: openViewURL, closeModal: closeViewURL } = useModalNavigation('viewSocial');
  const { isOpen: isEditOpenURL, openModal: openEditURL, closeModal: closeEditURL } = useModalNavigation('editSocial');

  useEffect(() => {
    if (!isCreateOpenURL && isCreateOpen) setIsCreateOpen(false);
  }, [isCreateOpenURL, isCreateOpen]);

  // viewSocial은 URL 파라미터(viewSocialId)에서 파생 — 별도 state/useEffect 불필요
  const viewSocial = useMemo(() => {
    if (!viewSocialId) return null;
    return regulars.find(s => s.id === viewSocialId)
      || popups.find(s => s.id === viewSocialId)
      || dailySocials.find(s => s.id === viewSocialId)
      || null;
  }, [viewSocialId, regulars, popups, dailySocials]);

  useEffect(() => {
    if (!isEditOpenURL && selectedSocial) setSelectedSocial(null);
  }, [isEditOpenURL, selectedSocial]);

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

  const countryDisplay = location?.country ? (location.country.charAt(0).toUpperCase() + location.country.slice(1).toLowerCase()) : '';
  const cityDisplay = !location?.city || location.city === 'ALL' ? 'All' :
    (location.city.charAt(0).toUpperCase() + location.city.slice(1).toLowerCase());

  // Calculate week days starting from today
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  useEffect(() => {
    // 1. Subscribe to all regulars for the carousel
    const unsubRegulars = socialService.subscribeSocials('regular', (data) => {
      setRegulars(data);
    });

    // 2. Subscribe to daily socials (Popups only via UI filter)
    const day = weekDays[activeDayOffset].getDay();
    const date = weekDays[activeDayOffset];
    const unsubDaily = socialService.subscribeDailySocials(day, date, (data) => {
      setDailySocials(data);
    });

    const unsubPopups = socialService.subscribeSocials('popup', (data) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Sort popups by date and filter future
      const valid = data.filter(s => {
        if (!s.date) return false;
        const sDate = typeof s.date.toDate === 'function' ? s.date.toDate() : new Date(s.date as any);
        sDate.setHours(0, 0, 0, 0);
        return sDate.getTime() >= today.getTime();
      });
      const sorted = valid.sort((a, b) => {
        const dateA = a.date ? a.date.toMillis() : 0;
        const dateB = b.date ? b.date.toMillis() : 0;
        return dateA - dateB;
      });
      setPopups(sorted);
    });

    return () => {
      unsubRegulars();
      unsubDaily();
      unsubPopups();
    };
  }, [activeDayOffset]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      socialService.getSocialById(id).then((social) => {
        if (social) {
          handleOpenView(social);
        }
      });
    }
  }, []);

  // 위치 필터 헬퍼 — strict mode: city 선택 시 city 필드 없는 데이터는 숨김
  const matchLocation = useCallback((s: Social) => {
    const isGlobal = !location.country || location.country === 'ALL';
    const isCityAll = !location.city || location.city === 'ALL';
    if (isGlobal && isCityAll) return true;

    // country 체크: s.country 없으면 제외 (strict)
    if (!isGlobal) {
      if (!s.country) return false;
      const matchCountry = String(s.country).trim().toLowerCase() === String(location.country).trim().toLowerCase();
      if (!matchCountry) return false;
    }

    // city 체크: s.city 없으면 제외 (strict), 있으면 정확히 비교
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

  const organizers = useMemo(() => Array.from(new Set(locationFilteredSocials.map(s => s.organizerName).filter(Boolean))), [locationFilteredSocials]);
  const venues = useMemo(() => Array.from(new Set(locationFilteredSocials.map(s => s.venueName).filter(Boolean))), [locationFilteredSocials]);

  // Calculate favorite timeline
  const favoriteTimeline = useMemo(() => {
    if (activeTab !== 'favorite') return [];
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
        // Only show 1 occurrence (this week) instead of 4
        for (let i = 0; i < 1; i++) {
          const d = new Date(today);
          let offset = Number(s.dayOfWeek) - d.getDay();
          if (offset < 0) offset += 7;
          d.setDate(d.getDate() + offset + (i * 7));
          instances.push({ date: d, social: s });
        }
      }
    });

    instances.sort((a, b) => a.date.getTime() - b.date.getTime());

    const grouped: Record<string, { date: Date, socials: Social[] }> = {};
    instances.forEach(inst => {
      const dateStr = inst.date.toDateString();
      if (!grouped[dateStr]) grouped[dateStr] = { date: inst.date, socials: [] };
      // Deduplicate regular socials on the same date (just in case)
      if (!grouped[dateStr].socials.find(s => s.id === inst.social.id)) {
        grouped[dateStr].socials.push(inst.social);
      }
    });

    return Object.values(grouped).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [activeTab, regulars, popups, likedSocialIds]);

  // Calculate overview timeline (7 days)
  const overviewTimeline = useMemo(() => {
    if (activeTab !== 'overview') return [];
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
        if (s.type === 'regular' && Number(s.dayOfWeek) === targetDayOfWeek) {
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
  }, [activeTab, locationFilteredSocials]);

  // SubHeader Injection
  useEffect(() => {
    const filterBar = (
      <div className="relative w-full bg-white flex flex-col shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] z-30">
        {/* Row 1: Scrollable Tabs */}
        <div className="w-full px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'this_week', label: t('social.tab_regular') },
            { id: 'popup', label: t('social.tab_popup') },
            { id: 'overview', label: t('social.tab_overview') },
            { id: 'favorite', label: t('social.tab_favorite') }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-xl text-[12px] font-bold tracking-tight transition-all whitespace-nowrap border ${activeTab === tab.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100'
                : 'bg-slate-50/50 text-slate-500 border-slate-100 hover:bg-slate-100/80'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Organizer / Club Filters — Overview only */}
        {activeTab === 'overview' && (
          <>
            <div className="w-full h-11 px-4 flex items-center justify-end gap-4">
              <button
                onClick={() => { setShowOrganizerFilter(!showOrganizerFilter); if (!showOrganizerFilter) setShowClubFilter(false); }}
                className={`flex items-center gap-0.5 text-[12px] font-bold transition-all ${selectedOrganizer !== 'All' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
              >
                {selectedOrganizer === 'All' ? t('social.filter_organizer') : selectedOrganizer}
                <span className={`material-symbols-outlined text-[16px] transition-transform ${showOrganizerFilter ? 'rotate-180' : ''}`}>expand_more</span>
              </button>
              <button
                onClick={() => { setShowClubFilter(!showClubFilter); if (!showClubFilter) setShowOrganizerFilter(false); }}
                className={`flex items-center gap-0.5 text-[12px] font-bold transition-all ${selectedClub !== 'All' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
              >
                {selectedClub === 'All' ? t('social.filter_club') : selectedClub}
                <span className={`material-symbols-outlined text-[16px] transition-transform ${showClubFilter ? 'rotate-180' : ''}`}>expand_more</span>
              </button>
            </div>
            {showOrganizerFilter && (
              <div className="absolute top-full left-0 right-0 z-40 bg-white shadow-2xl border-t border-slate-100 p-4 max-h-[280px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-[14px] font-black text-slate-800 uppercase tracking-tight">{t('social.filter_by_organizer')}</span>
                  <button onClick={() => setShowOrganizerFilter(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 active:scale-90 transition-all">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {['All', ...organizers].map(org => (
                    <button key={org} onClick={() => { setSelectedOrganizer(org); setShowOrganizerFilter(false); }}
                      className={`px-4 py-3 rounded-2xl text-[12px] font-bold text-left transition-all border ${selectedOrganizer === org ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'bg-slate-50/50 text-slate-600 border-transparent hover:bg-slate-100/80'}`}>
                      <div className="flex items-center justify-between"><span className="truncate pr-2">{org}</span>{selectedOrganizer === org && <span className="material-symbols-outlined text-[14px]">check_circle</span>}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {showClubFilter && (
              <div className="absolute top-full left-0 right-0 z-40 bg-white shadow-2xl border-t border-slate-100 p-4 max-h-[280px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-[14px] font-black text-slate-800 uppercase tracking-tight">{t('social.filter_by_club')}</span>
                  <button onClick={() => setShowClubFilter(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 active:scale-90 transition-all">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {['All', ...venues].map(ven => (
                    <button key={ven} onClick={() => { setSelectedClub(ven); setShowClubFilter(false); }}
                      className={`px-4 py-3 rounded-2xl text-[12px] font-bold text-left transition-all border ${selectedClub === ven ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'bg-slate-50/50 text-slate-600 border-transparent hover:bg-slate-100/80'}`}>
                      <div className="flex items-center justify-between"><span className="truncate pr-2">{ven}</span>{selectedClub === ven && <span className="material-symbols-outlined text-[14px]">check_circle</span>}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
    const height = activeTab === 'overview' ? 88 : 44;
    setSubHeader(filterBar, height);
  }, [activeTab, selectedOrganizer, selectedClub, showOrganizerFilter, showClubFilter, organizers, venues, setSubHeader]);

  // Dedicated unmount cleanup to avoid flashes during state updates
  useEffect(() => {
    return () => setSubHeader(null);
  }, [setSubHeader]);


  // District 정렬 우선순위: 강북(0) → 강남(1) → 기타(2)
  const districtOrder = (d?: string) => {
    if (d === '강북') return 0;
    if (d === '강남') return 1;
    return 2;
  };

  // Unified Filter Logic
  const filterSocials = (list: Social[]) => {
    const filtered = list.filter(s => {
      if (!matchLocation(s)) return false;

      const search = searchQuery.toLowerCase();
      const matchSearch = !search ||
        String(s.title || '').toLowerCase().includes(search) ||
        String(s.organizerName || '').toLowerCase().includes(search) ||
        String(s.venueName || '').toLowerCase().includes(search);

      // 팝업은 Organizer/Club 필터를 무시하고 검색어와 지역 조건만 반영
      if (s.type === 'popup') {
        return matchSearch;
      }

      const matchOrg = selectedOrganizer === 'All' || s.organizerName === selectedOrganizer;
      const matchVen = selectedClub === 'All' || s.venueName === selectedClub;

      return matchSearch && matchOrg && matchVen;
    });

    // 강북 → 강남 → 기타 순, 같은 district 내에서는 시작시간순
    return filtered.sort((a, b) => {
      const districtDiff = districtOrder(a.district) - districtOrder(b.district);
      if (districtDiff !== 0) return districtDiff;
      const timeA = a.startTime || '00:00';
      const timeB = b.startTime || '00:00';
      return timeA.localeCompare(timeB);
    });
  };

  // 특정 날짜가 해당 월의 몇 번째 요일인지 계산하는 헬퍼 (1st, 2nd, 3rd, 4th, 5th)
  const getWeekOrdinal = (d: Date) => Math.ceil(d.getDate() / 7);

  // 특정 날짜의 요일이 해당 월의 마지막 요일인지 계산하는 헬퍼
  const isLastWeekOfMonth = (d: Date) => {
    const currentMonth = d.getMonth();
    const nextWeekDate = new Date(d);
    nextWeekDate.setDate(d.getDate() + 7);
    return nextWeekDate.getMonth() !== currentMonth;
  };

  // Filtered regular socials for the currently active day (with intelligent ID-based deduplication & recurrence matching)
  const todaysSocials = useMemo(() => {
    const targetDate = weekDays[activeDayOffset];
    const targetDay = targetDate.getDay();
    const ordinal = getWeekOrdinal(targetDate);
    const isLast = isLastWeekOfMonth(targetDate);

    const list = filterSocials(regulars).filter(s => {
      // 1. 요일 매칭
      if (Number(s.dayOfWeek) !== targetDay) return false;

      // 2. 주기(recurrence) 매칭
      const rec = (s.recurrence || 'every').trim().toLowerCase();
      if (rec === 'every' || rec === '') return true;
      if (rec === '1st' && ordinal === 1) return true;
      if (rec === '2nd' && ordinal === 2) return true;
      if (rec === '3rd' && ordinal === 3) return true;
      if (rec === '4th' && ordinal === 4) return true;
      if (rec === 'last' && isLast) return true;

      return false;
    });

    const seen = new Set<string>();
    return list.filter(s => {
      if (!s.id) return true;
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [regulars, activeDayOffset, searchQuery, selectedOrganizer, selectedClub]);

  // Replaced with fixed 7 major cities for persistent quick tag filter UI
  const activeCities = useMemo(() => ['서울', '부산', '대전', '대구', '광주', '인천', '제주'], []);


  // Set default city tab once activeCities are computed
  useEffect(() => {
    if (activeCities.length > 0 && !activeCities.includes(activeCityTab)) {
      setActiveCityTab(activeCities[0]);
    }
  }, [activeCities]);

  // Swipe Scroll handler to bind horizontal scroll index back to activeCityTab
  const handleCityScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const width = container.offsetWidth;
    if (width <= 0) return;
    const index = Math.round(container.scrollLeft / width);
    if (activeCities[index] && activeCities[index] !== activeCityTab) {
      setActiveCityTab(activeCities[index]);
    }
  };

  // Scroll to active city container smoothly when city tab is tapped
  const scrollToCity = (city: string) => {
    setActiveCityTab(city);
    const index = activeCities.indexOf(city);
    const container = cityScrollRef.current;
    if (container && index !== -1) {
      container.scrollTo({
        left: container.offsetWidth * index,
        behavior: "smooth"
      });
    }
  };

  // District ordering priority helper
  const subDistrictOrder = (d?: string) => {
    if (!d) return 9;
    const lower = d.toLowerCase();
    if (lower.includes('홍대') || lower.includes('한강위')) return 0;
    if (lower.includes('강남') || lower.includes('한강아래')) return 1;
    if (lower.includes('강북')) return 2;
    return 3;
  };

  // 지능형 서울 한강 기준 강북(홍대인근) / 강남(강남지역) 초고속 지리 매퍼
  const detectSeoulDistrict = (social: Social): string => {
    // 1. 소셜 자체에 district가 이미 입력되어 있는 경우
    if (social.district && social.district.trim()) {
      const d = social.district.trim().toLowerCase();
      if (d.includes('강남') || d.includes('서초') || d.includes('송파') || d.includes('강동') || d.includes('양재')) {
        return language === 'KR' ? '한강아래 (강남지역)' : 'South of River (Gangnam)';
      }
      if (d.includes('강북') || d.includes('홍대') || d.includes('마포') || d.includes('신촌') || d.includes('종로') || d.includes('합정')) {
        return language === 'KR' ? '한강위 (홍대인근)' : 'North of River (Hongdae)';
      }
    }

    // 2. 실시간 동기화된 venue.seoulArea 초고속 쿼리 매핑 (서울 강남북 구분)
    const venue = venuesMap[social.venueId];
    if (venue && venue.seoulArea) {
      if (venue.seoulArea === 'gangbuk') {
        return language === 'KR' ? '한강위 (홍대인근)' : 'North of River (Hongdae)';
      }
      if (venue.seoulArea === 'gangnam') {
        return language === 'KR' ? '한강아래 (강남지역)' : 'South of River (Gangnam)';
      }
    }

    // 3. Fallback: 텍스트 키워드 기반 비상 분류 (DB 로딩 지연 대비)
    const venueName = (social.venueNameNative || social.venueName || '').toLowerCase();
    const gangbukKeywords = [
      '홍대', '마포', '신촌', '합정', '망원', '종로', '중구', '성동', '서대문', '이대', '상수', '광진', '용산', '한남', '이태원', '을지로', '광화문',
      'hongdae', 'mapo', 'sinchon', 'hapjeong', 'jongno', 'yongsan', 'hannam', 'itaewon',
      '바르샤', 'barsha', '엘빠소', 'elpaso', '아반', 'aban', '보헤미안', 'bohemian', '아르헨티나', 'argentina',
      '오쵸', 'ocho', '땅고마니아', 'tangomania', '라비다', 'lavida', '마구아', 'magua', '밀롱가헤이', 'milongahei',
      '라벤타나', '라 벤타나', 'ventana', 'la ventana', '알마', 'alma', '오나다', 'onada', 'atta', '아똬'
    ];

    for (const key of gangbukKeywords) {
      if (venueName.includes(key)) return language === 'KR' ? '한강위 (홍대인근)' : 'North of River (Hongdae)';
    }

    return language === 'KR' ? '한강아래 (강남지역)' : 'South of River (Gangnam)';
  };

  return (
    <main className="w-full relative pb-32 bg-slate-50/30 overflow-x-hidden">
      <div className="px-4 space-y-6 pt-4">

        {/* THIS WEEK TAB */}
        {activeTab === 'this_week' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Section Header with Premium Fullscreen Button */}
            <div className="flex justify-between items-center px-1 mb-3">
              <h2 className="text-[13px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                <span className="material-symbols-rounded text-base text-blue-600">calendar_today</span>
                {t('social.tab_regular')}
              </h2>
              <button
                onClick={() => openFullscreen('true')}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-xl active:scale-95 transition-all text-[11px] font-black shadow-md shadow-slate-900/10 hover:bg-slate-800"
              >
                <span className="material-symbols-rounded text-[14px]">grid_view</span>
                {language === 'KR' ? '풀스크린 브리프' : 'Fullscreen'}
              </button>
            </div>

            {/* Calendar (Date Selector Grid) */}
            <div className="w-full bg-white rounded-2xl p-2 shadow-sm border border-slate-100 mb-4">
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((date, i) => {
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const holiday = isKoreanHoliday(date);
                  const isRed = isWeekend || !!holiday;
                  const isSelected = activeDayOffset === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveDayOffset(i)}
                      className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all border ${isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm shadow-slate-200'
                        : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-500'
                        }`}
                    >
                      <span className={`text-[10px] font-bold uppercase tracking-tighter mb-0.5 ${isSelected
                        ? (isRed ? 'text-red-300' : 'text-slate-100')
                        : (isRed ? 'text-red-500' : 'text-slate-400')
                        }`}>
                        {date.toLocaleDateString(dateLocale, { weekday: 'short' })}
                      </span>
                      <span className={`text-sm font-black tracking-tighter ${!isSelected && isRed ? 'text-red-600' : ''
                        }`}>
                        {date.getDate()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto no-scrollbar pt-2 -mx-4 px-4"
            >
              {todaysSocials.length === 0 ? (
                <div className="w-full h-40 flex flex-col items-center justify-center opacity-20 bg-white rounded-lg border border-dashed border-gray-200">
                  <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
                  <p className="text-xs font-black uppercase tracking-widest">{t('social.no_regular_today')}</p>
                </div>
              ) : (
                todaysSocials.map(social => (
                  <div
                     key={social.id}
                     onClick={() => handleOpenView(social)}
                     className="relative flex-shrink-0 w-60 h-80 rounded-lg overflow-hidden group shadow-sm transition-all md:hover:shadow-md cursor-pointer animate-in zoom-in-95 duration-500 text-left"
                  >
                    <SocialHeroCard social={social} date={weekDays[activeDayOffset]} />

                    <button
                      onClick={(e) => handleToggleLike(e, social.id)}
                      className={`absolute z-20 top-3 right-3 w-8 h-8 backdrop-blur rounded-full flex items-center justify-center shadow-sm transition-colors active:scale-90 ${likedSocialIds.includes(social.id) ? 'bg-red-50 text-red-500' : 'bg-white/90 text-[#2d3435] hover:text-red-500'
                        }`}
                    >
                      <span
                        className="material-symbols-rounded text-lg"
                        style={{ fontVariationSettings: likedSocialIds.includes(social.id) ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        favorite
                      </span>
                    </button>

                  </div>
                ))
              )}
            </div>

            {/* Integrated Social Action */}
            <div className="mx-4 my-3 px-5 py-3 flex items-center justify-between bg-white rounded-xl border border-slate-100 shadow-sm">
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-tight">
                {t('social.host_new')}
              </p>
              <button
                onClick={() => handleOpenCreate()}
                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors py-2"
              >
                <span className="text-[13px] font-bold">{t('social.register')}</span>
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
              </button>
            </div>
          </section>
        )}

        {/* POPUP TAB */}
        {activeTab === 'popup' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
            {(() => {
              const filteredPopups = filterSocials(popups);
              if (filteredPopups.length === 0) {
                return (
                  <div className="w-full h-32 flex flex-col items-center justify-center opacity-30 bg-white rounded-lg border border-dashed border-gray-200">
                    <p className="text-xs font-black uppercase tracking-widest text-primary/40">{t('social.no_popup')}</p>
                  </div>
                );
              }

              const groupedPopups: Record<string, Social[]> = {};
              filteredPopups.forEach(social => {
                const d = safeDate(social.date) || new Date();
                const monthKey = d.toLocaleDateString(dateLocale, { year: 'numeric', month: 'long' });
                if (!groupedPopups[monthKey]) groupedPopups[monthKey] = [];
                groupedPopups[monthKey].push(social);
              });

              return Object.entries(groupedPopups).map(([monthStr, monthSocials]) => (
                <div key={monthStr} className="space-y-4">
                  <div className="flex items-center gap-4 py-2">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">{monthStr}</h3>
                    <div className="flex-1 h-px bg-slate-200"></div>
                  </div>
                  {monthSocials.map(social => {
                    const displayTitle = getSocialDisplayTitle(social);
                    return (
                      <div
                        key={social.id}
                        onClick={() => handleOpenView(social)}
                        className="relative flex items-center gap-4 p-4 bg-white rounded-lg border border-[#dde4e5] md:hover:border-primary/30 transition-all cursor-pointer group shadow-sm active:scale-[0.98] text-left"
                      >
                        <div className="flex flex-col items-center justify-center w-20 h-20 bg-[#F4FBFB] rounded-lg border-l-4 border-primary shrink-0">
                          {(() => {
                            const d = safeDate(social.date) || new Date(); return (<>
                              <span className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mb-1">
                                {d.toLocaleDateString(dateLocale, { weekday: 'short' }).toUpperCase()}
                              </span>
                              <span className="text-2xl font-black text-on-surface tracking-tighter leading-none mb-1">
                                {d.getDate()}
                              </span>
                              <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest leading-none">
                                {d.toLocaleDateString(dateLocale, { month: 'short' }).toUpperCase()}
                              </span>
                            </>);
                          })()}
                        </div>
                        <div className="flex-1 space-y-0.5 text-left overflow-hidden pr-8">
                          <DualText
                            text={displayTitle.primary}
                            subText={displayTitle.secondary}
                            primaryClassName="text-lg font-bold text-on-surface font-headline leading-tight truncate"
                            secondaryClassName="text-[11px] text-on-surface-variant/60 font-normal truncate shrink-0 ml-1.5"
                            containerClassName="w-full"
                          />
                          <DualText
                            text={social.venueName}
                            subText={social.venueNameNative}
                            primaryClassName="text-sm text-primary font-semibold truncate"
                            secondaryClassName="text-[10px] text-primary/50 font-normal truncate ml-1.5"
                            containerClassName="w-full mt-0.5"
                          />
                          <p className="text-xs text-on-surface-variant font-medium truncate mt-1">
                            {social.startTime} - {social.endTime} {(() => {
                              const djName = getDjDisplay(social, safeDate(social.date) || undefined);
                              return djName && djName !== 'TBD' && djName !== 'TBA' ? `• DJ ${djName}` : '';
                            })()}
                          </p>
                        </div>

                        <button
                          onClick={(e) => handleToggleLike(e, social.id)}
                          className={`absolute z-20 top-3 right-3 w-8 h-8 backdrop-blur rounded-full flex items-center justify-center shadow-sm transition-colors active:scale-90 ${likedSocialIds.includes(social.id) ? 'bg-red-50 text-red-500' : 'bg-white/90 text-[#2d3435] hover:text-red-500'
                            }`}
                        >
                          <span
                            className="material-symbols-rounded text-lg"
                            style={{ fontVariationSettings: likedSocialIds.includes(social.id) ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            favorite
                          </span>
                        </button>

                        <span className="material-symbols-outlined text-[#dde4e5] group-hover:text-primary transition-all group-hover:translate-x-1 absolute right-4 top-1/2 -translate-y-1/2">chevron_right</span>
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
          </section>
        )}

        {/* FAVORITE TAB */}
        {activeTab === 'favorite' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
            {favoriteTimeline.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2">favorite_border</span>
                <p className="text-sm font-medium">{t('social.no_liked')}</p>
              </div>
            ) : (
              favoriteTimeline.map((group, idx) => (
                <div key={idx} className="space-y-4">
                  <div className="flex items-center gap-4 py-2">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">
                      {group.date.toLocaleDateString(dateLocale, { weekday: 'short', month: 'long', day: 'numeric' })}
                    </h3>
                    <div className="flex-1 h-px bg-slate-200"></div>
                  </div>
                  {group.socials.map((social) => {
                    const displayTitle = getSocialDisplayTitle(social);
                    return (
                      <div
                        key={`${social.id}-${group.date.getTime()}`}
                        onClick={() => handleOpenView(social)}
                        className="relative flex items-center gap-4 p-4 bg-white rounded-lg border border-[#dde4e5] md:hover:border-primary/30 transition-all cursor-pointer group shadow-sm active:scale-[0.98] text-left"
                      >
                        <div className="flex flex-col items-center justify-center w-20 h-20 bg-[#F4FBFB] rounded-lg border-l-4 border-primary shrink-0">
                          {(() => {
                            const d = group.date; return (<>
                              <span className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mb-1">
                                {d.toLocaleDateString(dateLocale, { weekday: 'short' }).toUpperCase()}
                              </span>
                              <span className="text-2xl font-black text-on-surface tracking-tighter leading-none mb-1">
                                {d.getDate()}
                              </span>
                              <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest leading-none">
                                {d.toLocaleDateString(dateLocale, { month: 'short' }).toUpperCase()}
                              </span>
                            </>);
                          })()}
                        </div>
                        <div className="flex-1 space-y-0.5 text-left overflow-hidden pr-8">
                          <DualText
                            text={displayTitle.primary}
                            subText={displayTitle.secondary}
                            primaryClassName="text-lg font-bold text-on-surface font-headline leading-tight truncate"
                            secondaryClassName="text-[11px] text-on-surface-variant/60 font-normal truncate shrink-0 ml-1.5"
                            containerClassName="w-full"
                          />
                          <DualText
                            text={social.venueName}
                            subText={social.venueNameNative}
                            primaryClassName="text-sm text-primary font-semibold truncate"
                            secondaryClassName="text-[10px] text-primary/50 font-normal truncate ml-1.5"
                            containerClassName="w-full mt-0.5"
                          />
                          <p className="text-xs text-on-surface-variant font-medium truncate mt-1">
                            {social.startTime} - {social.endTime} {(() => {
                              const djName = getDjDisplay(social, group.date);
                              return djName && djName !== 'TBD' && djName !== 'TBA' ? `• DJ ${djName}` : '';
                            })()}
                          </p>
                        </div>

                        <button
                          onClick={(e) => handleToggleLike(e, social.id)}
                          className={`absolute z-20 top-3 right-3 w-8 h-8 backdrop-blur rounded-full flex items-center justify-center shadow-sm transition-colors active:scale-90 ${likedSocialIds.includes(social.id) ? 'bg-red-50 text-red-500' : 'bg-white/90 text-[#2d3435] hover:text-red-500'
                            }`}
                        >
                          <span
                            className="material-symbols-rounded text-lg"
                            style={{ fontVariationSettings: likedSocialIds.includes(social.id) ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            favorite
                          </span>
                        </button>

                        <span className="material-symbols-outlined text-[#dde4e5] group-hover:text-primary transition-all group-hover:translate-x-1 absolute right-4 top-1/2 -translate-y-1/2">chevron_right</span>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </section>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left pb-10">
            {/* Active filter label */}
            {(selectedOrganizer !== 'All' || selectedClub !== 'All') && (
              <div className="flex items-center gap-2 px-1">
                <span className="material-symbols-outlined text-[14px] text-blue-600">filter_alt</span>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  {selectedOrganizer !== 'All' ? selectedOrganizer : ''}{selectedOrganizer !== 'All' && selectedClub !== 'All' ? ' · ' : ''}{selectedClub !== 'All' ? selectedClub : ''}
                </span>
              </div>
            )}
            {overviewTimeline.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
                <p className="text-sm font-medium">{t('social.no_upcoming')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overviewTimeline.map((group, idx) => {
                  const isToday = group.date.toDateString() === new Date().toDateString();
                  const holiday = isKoreanHoliday(group.date);
                  const isWeekend = group.date.getDay() === 0 || group.date.getDay() === 6;
                  const isRed = isWeekend || !!holiday;
                  return (
                    <div key={idx} className="overflow-hidden rounded-xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
                      {/* Day Header */}
                      <div className={`flex items-center gap-3 px-4 py-3 border-b border-slate-100 ${isToday ? 'bg-blue-600' : isRed ? 'bg-red-500' : 'bg-slate-800'}`}>
                        <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-white/15 shrink-0">
                          <span className="text-[9px] font-black text-white/80 uppercase tracking-wider leading-none">
                            {group.date.toLocaleDateString(dateLocale, { weekday: 'short' })}
                          </span>
                          <span className="text-[20px] font-black text-white leading-none tracking-tighter">
                            {group.date.getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[13px] font-black text-white tracking-tight">
                            {group.date.toLocaleDateString(dateLocale, { month: 'long', day: 'numeric' })}
                            {isToday && <span className="ml-2 bg-white text-blue-600 px-1.5 py-0.5 rounded text-[9px] leading-none font-black">{t('social.today')}</span>}
                            {holiday && <span className="ml-2 bg-white/20 text-white px-1.5 py-0.5 rounded text-[9px] leading-none">{holiday}</span>}
                          </h3>
                        </div>
                        <span className="text-[11px] font-bold text-white/60 tracking-wider shrink-0">{group.socials.length} {t('social.events_count')}</span>
                      </div>
                      {/* Event Rows */}
                      <div className="bg-white divide-y divide-slate-50">
                        {group.socials.map(social => (
                          <div
                            key={social.id}
                            onClick={() => handleOpenView(social)}
                            className="px-4 py-3 flex items-center gap-3 md:hover:bg-slate-50 transition-colors cursor-pointer active:bg-slate-100 group"
                          >
                            {/* 소형 썸네일 */}
                            <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
                              {social.imageUrl ? (
                                <img src={social.imageUrl} alt={social.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="material-symbols-outlined text-[18px] text-slate-300">music_note</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 pr-2">
                              <h4 className="text-[14px] font-bold text-slate-800 truncate leading-tight flex items-baseline gap-1.5">
                                {social.title}
                                {social.titleNative && <span className="text-[10px] font-medium text-slate-400 truncate">{social.titleNative}</span>}
                              </h4>
                              <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                                <span className="inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[14px] leading-none">location_on</span>{social.venueNameNative || social.venueName}</span>
                              </p>
                              <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                                <span className="inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[14px] leading-none">schedule</span>{social.startTime}-{social.endTime}</span>
                                {social.djName && <span className="ml-2 inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[14px] leading-none">headphones</span>DJ {social.djName}</span>}
                              </p>
                            </div>
                            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 md:group-hover:border-blue-200 transition-all">
                              <span className="material-symbols-outlined text-[16px] text-slate-400 md:group-hover:text-blue-600">chevron_right</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {/* FULLSCREEN CROP BRIEF VIEW LAYER WITH CITY HORIZONTAL SWIPE */}
        {isFullscreenOpen && (
          <div className="fixed inset-0 z-[500] bg-[#f8f9fa] flex flex-col animate-in fade-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-2">
              <span className="material-symbols-rounded text-blue-600 text-lg">grid_view</span>
              <span className="text-slate-800 font-black text-[12px] tracking-widest uppercase">
                {weekDays[activeDayOffset].toLocaleDateString(dateLocale, { weekday: "short", month: "long", day: "numeric" })}
              </span>
            </div>
            <button 
              onClick={() => closeFullscreen()} 
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center active:scale-90 transition-transform hover:bg-slate-200"
            >
              <span className="material-symbols-rounded text-slate-600 text-lg">close</span>
            </button>
          </div>

          {/* City Swiper Indicator Tabs */}
          {activeCities.length > 0 && (
            <div className="flex px-3 py-2 bg-white border-b border-slate-200 gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {activeCities.map((city) => {
                const isActive = activeCityTab === city;
                const displayLabel = 
                  city === '서울' ? (language === 'KR' ? '서울' : 'Seoul') :
                  city === '부산' ? (language === 'KR' ? '부산' : 'Busan') :
                  city === '대전' ? (language === 'KR' ? '대전' : 'Daejeon') :
                  city === '대구' ? (language === 'KR' ? '대구' : 'Daegu') :
                  city === '광주' ? (language === 'KR' ? '광주' : 'Gwangju') :
                  city === '인천' ? (language === 'KR' ? '인천' : 'Incheon') :
                  city === '제주' ? (language === 'KR' ? '제주' : 'Jeju') : city;
                
                return (
                  <button
                    key={city}
                    onClick={() => scrollToCity(city)}
                    className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black tracking-tight transition-all whitespace-nowrap border flex items-center gap-1 active:scale-95 ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-[1.02]'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-rounded text-xs" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>push_pin</span>
                    <span className="mt-[0.5px]">{displayLabel}</span>
                  </button>
                );
              })}
            </div>
          )}


          {/* City Horizontal Swipe Layout */}
          <div 
            ref={cityScrollRef}
            onScroll={handleCityScroll}
            className="flex-1 flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar bg-[#f8f9fa]"
          >
            {activeCities.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-3xl mb-2">event_busy</span>
                <p className="text-xs font-black uppercase tracking-widest">{t('social.no_regular_today')}</p>
              </div>
            ) : (
              activeCities.map((city) => {
                const citySocials = todaysSocials.filter(s => {
                  const sCity = (s.city || '').trim().toLowerCase();
                  const targetCity = city.toLowerCase();
                  if (targetCity === '서울') return sCity === '서울' || sCity === 'seoul';
                  if (targetCity === '부산') return sCity === '부산' || sCity === 'busan';
                  if (targetCity === '대전') return sCity === '대전' || sCity === 'daejeon';
                  if (targetCity === '대구') return sCity === '대구' || sCity === 'daegu';
                  if (targetCity === '광주') return sCity === '광주' || sCity === 'gwangju';
                  if (targetCity === '인천') return sCity === '인천' || sCity === 'incheon';
                  if (targetCity === '제주') return sCity === '제주' || sCity === 'jeju';
                  return sCity === targetCity;
                });
                
                const isSeoul = city.includes('서울') || city.toLowerCase().includes('seoul');
                const isMany = citySocials.length >= 10;

                const grouped: Record<string, Social[]> = {};
                if (isSeoul) {
                  citySocials.forEach(s => {
                    const dist = detectSeoulDistrict(s);
                    if (!grouped[dist]) grouped[dist] = [];
                    grouped[dist].push(s);
                  });
                } else {
                  const key = language === 'KR' ? `${city} 전체` : `${city} Area`;
                  grouped[key] = citySocials;
                }

                const isDaySocial = (s: Social) => {
                  const time = s.startTime || '19:00';
                  const hour = parseInt(time.split(':')[0]);
                  return hour < 18;
                };

                const sortedDists = Object.keys(grouped).sort((a, b) => {
                  if (a.includes('한강위')) return -1;
                  if (b.includes('한강위')) return 1;
                  return a.localeCompare(b);
                });

                return (
                  <div 
                    key={city}
                    className="w-full h-full flex-shrink-0 snap-start flex flex-col overflow-y-auto px-4 py-4 space-y-6"
                  >
                    {citySocials.length === 0 ? (
                      <div className="w-full flex-1 flex flex-col items-center justify-center text-slate-400/40 p-8 bg-white rounded-3xl border border-slate-100/50 my-6 shadow-sm">
                        <span className="material-symbols-outlined text-5xl mb-3 text-slate-300">event_busy</span>
                        <p className="text-sm font-black uppercase tracking-widest text-slate-400">
                          {language === 'KR' ? '오늘 예정된 소셜이 없습니다' : 'No Socials Scheduled Today'}
                        </p>
                        <p className="text-[11px] font-bold text-slate-400/70 mt-1">
                          {language === 'KR' ? '다른 날짜의 소셜을 탐색해보세요!' : 'Explore other dates!'}
                        </p>
                      </div>
                    ) : (
                      sortedDists.map((dist) => {
                      const list = grouped[dist];
                      const dayList = list.filter(s => isDaySocial(s));
                      const nightList = list.filter(s => !isDaySocial(s));

                      const renderCardList = (cards: Social[], mode: 'emperor' | 'wide' | 'slim' | 'grid') => {
                        if (mode === 'emperor') {
                          return (
                            <div className="space-y-3">
                              {cards.map((social) => (
                                <div 
                                  key={social.id}
                                  onClick={() => handleOpenView(social)}
                                  className="relative w-full h-56 rounded-3xl overflow-hidden border border-slate-200 active:scale-[0.99] transition-all cursor-pointer shadow-sm bg-white flex flex-col justify-end p-5 select-none"
                                >
                                  {social.imageUrl ? (
                                    <div className="absolute inset-0 z-0">
                                      <img src={social.imageUrl} alt="" className="w-full h-full object-cover brightness-[0.95]" />
                                      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-white/40" />
                                    </div>
                                  ) : (
                                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-50/30 via-slate-50 to-white" />
                                  )}
                                  
                                  <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="flex justify-between items-center w-full">
                                      <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white rounded-xl text-[10px] font-black shadow-md shadow-blue-500/10">
                                        <span className="material-symbols-rounded text-xs">schedule</span>
                                        <span>{social.startTime} - {social.endTime}</span>
                                        <span className="ml-1 bg-white/20 px-1 rounded text-[8px] font-bold">
                                          {isDaySocial(social) ? (language === 'KR' ? '낮' : 'Day') : (language === 'KR' ? '밤' : 'Night')}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="mt-auto">
                                      <h3 className="text-lg font-black text-slate-800 leading-tight">
                                        {social.title}
                                        {social.titleNative && <span className="block text-xs font-bold text-slate-400 mt-0.5">{social.titleNative}</span>}
                                      </h3>
                                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-3 text-[10px] font-bold text-slate-600">
                                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-xl"><span className="material-symbols-outlined text-[13px] text-blue-500">location_on</span>{social.venueNameNative || social.venueName}</span>
                                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-xl"><span className="material-symbols-outlined text-[13px] text-slate-500">person</span>{social.organizerNameNative || social.organizerName}</span>
                                        {social.djName && <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-xl"><span className="material-symbols-outlined text-[13px] text-amber-500">headphones</span>DJ {social.djName}</span>}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        }

                        if (mode === 'wide') {
                          return (
                            <div className="space-y-3">
                              {cards.map((social) => (
                                <div 
                                  key={social.id}
                                  onClick={() => handleOpenView(social)}
                                  className="flex items-center gap-4 p-4 bg-white border border-slate-150 rounded-2xl active:scale-[0.98] transition-all cursor-pointer select-none text-left shadow-sm hover:border-blue-300 h-[104px]"
                                >
                                  <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                                    {social.imageUrl ? (
                                      <img src={social.imageUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                                        <span className="material-symbols-outlined text-lg">music_note</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0 pr-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg border border-blue-100 leading-none">{social.startTime} - {social.endTime}</span>
                                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none shrink-0 ${
                                        isDaySocial(social) 
                                          ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                                          : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                      }`}>
                                        {isDaySocial(social) ? (language === 'KR' ? '낮' : 'Day') : (language === 'KR' ? '밤' : 'Night')}
                                      </span>
                                      {social.djName && <span className="text-[9.5px] font-bold text-slate-400 truncate">DJ {social.djName}</span>}
                                    </div>
                                    <h4 className="text-[14.5px] font-black text-slate-800 truncate leading-tight mt-1.5 flex items-baseline gap-1.5">
                                      {social.title}
                                      {social.titleNative && <span className="text-[10px] font-semibold text-slate-400 truncate">{social.titleNative}</span>}
                                    </h4>
                                    <div className="flex items-center gap-2.5 mt-1.5 text-[10px] font-bold text-slate-500 truncate leading-none">
                                      <span className="inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[11px] text-blue-500 shrink-0">location_on</span>{social.venueNameNative || social.venueName}</span>
                                      <span className="inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[11px] text-slate-400 shrink-0">person</span>{social.organizerNameNative || social.organizerName}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        }

                        if (mode === 'slim') {
                          return (
                            <div className="space-y-2">
                              {cards.map((social) => (
                                <div 
                                  key={social.id}
                                  onClick={() => handleOpenView(social)}
                                  className="flex items-center gap-3 p-3 bg-white border border-slate-150 rounded-2xl active:scale-[0.98] transition-all cursor-pointer select-none text-left shadow-sm hover:border-blue-300 h-[78px]"
                                >
                                  <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                                    {social.imageUrl ? (
                                      <img src={social.imageUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                                        <span className="material-symbols-outlined text-sm">music_note</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0 pr-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9.5px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-lg border border-blue-100 leading-none">{social.startTime} - {social.endTime}</span>
                                      <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-md leading-none shrink-0 ${
                                        isDaySocial(social) 
                                          ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                                          : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                      }`}>
                                        {isDaySocial(social) ? (language === 'KR' ? '낮' : 'Day') : (language === 'KR' ? '밤' : 'Night')}
                                      </span>
                                      {social.djName && <span className="text-[9.5px] font-bold text-slate-400 truncate">DJ {social.djName}</span>}
                                    </div>
                                    <h4 className="text-[13.5px] font-black text-slate-800 truncate leading-tight mt-1 flex items-baseline gap-1.5">
                                      {social.title}
                                      {social.titleNative && <span className="text-[9.5px] font-semibold text-slate-400 truncate">{social.titleNative}</span>}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1 text-[9.5px] font-bold text-slate-500 truncate leading-none">
                                      <span className="inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[10px] text-blue-500 shrink-0">location_on</span>{social.venueNameNative || social.venueName}</span>
                                      <span className="inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[10px] text-slate-400 shrink-0">person</span>{social.organizerNameNative || social.organizerName}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        }

                        // 2-column Compact Simple Card layout for 10+ items
                        // 시작시간, 밀롱가명(가장 중요), 장소 • 오거
                        return (
                          <div className="grid grid-cols-2 gap-2">
                            {cards.map((social) => {
                              const displayTitle = getSocialDisplayTitle(social);
                              const venueText = social.venueNameNative || social.venueName;
                              const organizerText = social.organizerNameNative || social.organizerName;
                              
                              return (
                                <div 
                                  key={social.id}
                                  onClick={() => handleOpenView(social)}
                                  className="flex flex-col justify-between p-3 bg-white border border-slate-150 rounded-2xl active:scale-[0.98] transition-all cursor-pointer select-none text-left shadow-sm hover:border-blue-300 h-[88px]"
                                >
                                  {/* 시작시간 및 낮/밤 배지 */}
                                  <div className="flex items-center justify-between w-full">
                                    <div className="text-[11px] font-black text-blue-600 tracking-tight leading-none">
                                      {social.startTime}
                                    </div>
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded leading-none shrink-0 scale-90 origin-right ${
                                      isDaySocial(social) 
                                        ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                                        : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                    }`}>
                                      {isDaySocial(social) ? (language === 'KR' ? '낮' : 'Day') : (language === 'KR' ? '밤' : 'Night')}
                                    </span>
                                  </div>
                                  
                                  {/* 밀롱가명 (가장 중요) */}
                                  <div className="text-[13px] font-black text-slate-900 truncate leading-tight mt-1">
                                    {displayTitle.primary}
                                    {displayTitle.secondary && (
                                      <span className="text-[10px] font-semibold text-slate-400 ml-1">
                                        ({displayTitle.secondary})
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* 장소 • 주최자 */}
                                  <div className="text-[10.5px] font-bold text-slate-500 truncate leading-none mt-1.5 mb-0.5">
                                    <span>{venueText}</span>
                                    {organizerText && (
                                      <>
                                        <span className="text-slate-350 font-normal mx-1">•</span>
                                        <span className="text-slate-400 font-semibold">{organizerText}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      };

                      // Evaluate optimal density mode
                      const getDensityMode = (): 'emperor' | 'wide' | 'slim' | 'grid' => {
                        if (list.length === 1) return 'emperor';
                        if (list.length >= 2 && list.length <= 4) return 'wide';
                        if (list.length >= 5 && list.length <= 9) return 'slim';
                        return 'grid';
                      };

                      const currentMode = getDensityMode();

                      return (
                        <div key={dist} className="space-y-3">
                          {/* Sub-District Section Title */}
                          <div className="flex items-center gap-2 py-1 px-1">
                            <span className="material-symbols-rounded text-blue-600 text-xs">location_searching</span>
                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                              {dist} ({list.length})
                            </span>
                            <div className="flex-1 h-px bg-slate-200" />
                          </div>

                          {isMany ? (
                            // Grouped afternoon/night list in 2-column grid for 10+ items
                            <div className="space-y-4">
                              {dayList.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-1 text-[10px] font-black text-amber-500 uppercase tracking-wider pl-1">
                                    <span className="material-symbols-rounded text-xs">light_mode</span>
                                    {language === 'KR' ? '낮 시간 밀롱가 (18시 이전)' : 'Afternoon Milonga (Before 18:00)'}
                                  </div>
                                  {renderCardList(dayList, 'grid')}
                                </div>
                              )}
                              {nightList.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-1 text-[10px] font-black text-indigo-500 uppercase tracking-wider pl-1">
                                    <span className="material-symbols-rounded text-xs">dark_mode</span>
                                    {language === 'KR' ? '밤 시간 밀롱가 (18시 이후)' : 'Night Milonga (After 18:00)'}
                                  </div>
                                  {renderCardList(nightList, 'grid')}
                                </div>
                              )}
                            </div>
                          ) : (
                            // Use density-controlled layouts (emperor / wide / slim)
                            renderCardList(list, currentMode)
                          )}
                        </div>
                      );
                    })
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
      {isViewOpenURL && viewSocial && (
        <SocialViewer
          social={viewSocial}
          onClose={handleCloseView}
        />
      )}

      {isEditOpenURL && selectedSocial && (
        <EditSocialEvent
          socialData={selectedSocial}
          onClose={handleCloseEdit}
        />
      )}

      {isCreateOpen && (
        <EditSocialEvent
          onClose={handleCloseCreate}
        />
      )}
    </main>
  );
}

export default function SocialPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <SocialContent />
    </Suspense>
  );
}
