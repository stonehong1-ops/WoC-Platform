'use client';

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
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

  // New Header Filter States
  const [activeTab, setActiveTab] = useState<'this_week' | 'popup' | 'favorite' | 'overview'>('this_week');
  const [showOrganizerFilter, setShowOrganizerFilter] = useState(false);
  const [showClubFilter, setShowClubFilter] = useState(false);
  const [selectedOrganizer, setSelectedOrganizer] = useState('All');
  const [selectedClub, setSelectedClub] = useState('All');

  const { location } = useLocation();
  const { user, profile, loading, setShowLogin } = useAuth();
  const [viewSocial, setViewSocial] = useState<Social | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const { setSubHeader } = useNavigation();
  const { t } = useLanguage();
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
  const { isOpen: isViewOpenURL, openModal: openViewURL, closeModal: closeViewURL } = useModalNavigation('viewSocial');
  const { isOpen: isEditOpenURL, openModal: openEditURL, closeModal: closeEditURL } = useModalNavigation('editSocial');

  useEffect(() => {
    if (!isCreateOpenURL && isCreateOpen) setIsCreateOpen(false);
  }, [isCreateOpenURL, isCreateOpen]);

  useEffect(() => {
    if (!isViewOpenURL && viewSocial) setViewSocial(null);
  }, [isViewOpenURL, viewSocial]);

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
    setViewSocial(social);
    openViewURL(social.id);
  };

  const handleCloseView = () => {
    setViewSocial(null);
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

  return (
    <main className="w-full relative pb-32 bg-slate-50/30 overflow-x-hidden">
      <div className="px-4 space-y-6 pt-4">

        {/* THIS WEEK TAB */}
        {activeTab === 'this_week' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">

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
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className={`text-sm font-black tracking-tighter ${!isSelected && isRed ? 'text-red-600' : ''
                        }`}>
                        {date.getDate()}
                      </span>
                      {holiday && !isSelected && <span className="w-1 h-1 rounded-full bg-red-500 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto no-scrollbar pt-2 -mx-4 px-4"
            >
              {filterSocials(regulars).filter(s => Number(s.dayOfWeek) === weekDays[activeDayOffset].getDay()).length === 0 ? (
                <div className="w-full h-40 flex flex-col items-center justify-center opacity-20 bg-white rounded-lg border border-dashed border-gray-200">
                  <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
                  <p className="text-xs font-black uppercase tracking-widest">{t('social.no_regular_today')}</p>
                </div>
              ) : (
                filterSocials(regulars).filter(s => Number(s.dayOfWeek) === weekDays[activeDayOffset].getDay()).map(social => (
                  <div
                    key={social.id}
                    onClick={() => handleOpenView(social)}
                    className="relative flex-shrink-0 w-60 h-80 rounded-lg overflow-hidden group shadow-sm transition-all hover:shadow-md cursor-pointer animate-in zoom-in-95 duration-500 text-left"
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
                const monthKey = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
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
                        className="relative flex items-center gap-4 p-4 bg-white rounded-lg border border-[#dde4e5] hover:border-primary/30 transition-all cursor-pointer group shadow-sm active:scale-[0.98] text-left"
                      >
                        <div className="flex flex-col items-center justify-center w-20 h-20 bg-[#F4FBFB] rounded-lg border-l-4 border-primary shrink-0">
                          {(() => {
                            const d = safeDate(social.date) || new Date(); return (<>
                              <span className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mb-1">
                                {d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                              </span>
                              <span className="text-2xl font-black text-on-surface tracking-tighter leading-none mb-1">
                                {d.getDate()}
                              </span>
                              <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest leading-none">
                                {d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
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
                      {group.date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                    </h3>
                    <div className="flex-1 h-px bg-slate-200"></div>
                  </div>
                  {group.socials.map((social) => {
                    const displayTitle = getSocialDisplayTitle(social);
                    return (
                      <div
                        key={`${social.id}-${group.date.getTime()}`}
                        onClick={() => handleOpenView(social)}
                        className="relative flex items-center gap-4 p-4 bg-white rounded-lg border border-[#dde4e5] hover:border-primary/30 transition-all cursor-pointer group shadow-sm active:scale-[0.98] text-left"
                      >
                        <div className="flex flex-col items-center justify-center w-20 h-20 bg-[#F4FBFB] rounded-lg border-l-4 border-primary shrink-0">
                          {(() => {
                            const d = group.date; return (<>
                              <span className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mb-1">
                                {d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                              </span>
                              <span className="text-2xl font-black text-on-surface tracking-tighter leading-none mb-1">
                                {d.getDate()}
                              </span>
                              <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest leading-none">
                                {d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
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
                            {group.date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </span>
                          <span className="text-[20px] font-black text-white leading-none tracking-tighter">
                            {group.date.getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[13px] font-black text-white tracking-tight">
                            {group.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
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
                            className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer active:bg-slate-100 group"
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
                                <span className="inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">location_on</span>{social.venueNameNative || social.venueName}</span>
                              </p>
                              <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                                <span className="inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">schedule</span>{social.startTime}-{social.endTime}</span>
                                {social.djName && <span className="ml-2 inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">headphones</span>DJ {social.djName}</span>}
                              </p>
                            </div>
                            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 group-hover:border-blue-200 transition-all">
                              <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-blue-600">chevron_right</span>
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

      {/* 신규 등록 (Create 모드) */}
      {isCreateOpen && (
        <EditSocialEvent
          onClose={handleCloseCreate}
          onSuccess={handleCloseCreate}
        />
      )}

      {/* 기존 소셜 편집 (Edit 모드) */}
      {selectedSocial && (
        <EditSocialEvent
          socialData={selectedSocial}
          onClose={handleCloseEdit}
        />
      )}

      {/* 뷰 모드 (일반 사용자) */}
      {viewSocial && (
        <SocialViewer
          social={viewSocial}
          onClose={handleCloseView}
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
