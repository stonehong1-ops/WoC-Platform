'use client';

import { useState, useEffect } from 'react';
import { socialService } from '@/lib/firebase/socialService';
import { Social } from '@/types/social';
import SocialFilterBottomSheet from '@/components/social/SocialFilterBottomSheet';
import EditSocialEvent from '@/components/social/EditSocialEvent';
import { useLocation } from '@/components/providers/LocationProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import SocialViewer from '@/components/social/SocialViewer';
import SocialHeroCard, { DualText, SocialCardImage, getSocialDisplayTitle } from '@/components/social/SocialHeroCard';

export default function SocialPage() {
  const [regulars, setRegulars] = useState<Social[]>([]);
  const [popups, setPopups] = useState<Social[]>([]);
  const [dailySocials, setDailySocials] = useState<Social[]>([]);
  const [activeDayOffset, setActiveDayOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSocial, setSelectedSocial] = useState<Social | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<{
    organizers: string[];
    venues: string[];
  }>({
    organizers: [],
    venues: []
  });

  const { location } = useLocation();
  const { user, profile } = useAuth();
  const [viewSocial, setViewSocial] = useState<Social | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const canEdit = (s: Social) => {
    if (!user) return false;
    if (profile?.isAdmin || (profile as any)?.systemRole === 'admin') return true;
    if (user.uid === s.organizerId) return true;
    return false;
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this social event?')) {
      await socialService.deleteSocial(id);
      setActiveMenuId(null);
    }
  };

  // 모달 제어용 (디바이스 뒤로가기 대응)
  const openModal = (setter: Function, value: any) => {
    window.history.pushState({ modal: true }, '');
    setter(value);
  };

  const closeModal = (setter: Function, fallbackValue: any = null) => {
    if (window.history.state?.modal) {
      window.history.back(); // 이 호출이 popstate 이벤트를 발생시킵니다
    } else {
      setter(fallbackValue);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      // 뒤로가기 버튼 클릭 시 모든 모달 닫기
      setViewSocial(null);
      setIsCreateOpen(false);
      setSelectedSocial(null);
      setIsFilterOpen(false);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const countryDisplay = location.country.charAt(0).toUpperCase() + location.country.slice(1).toLowerCase();
  const cityDisplay = location.city === 'ALL' || !location.city ? 'All' : 
                    location.city.charAt(0).toUpperCase() + location.city.slice(1).toLowerCase();

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
        // Sort popups by date
        const sorted = [...data].sort((a, b) => {
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
          openModal(setViewSocial, social);
        }
      });
    }
  }, []);

  // 위치 필터 헬퍼 — strict mode: city 선택 시 city 필드 없는 데이터는 숨김
  const matchLocation = (s: Social) => {
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
  };

  const locationFilteredSocials = [...regulars, ...dailySocials, ...popups].filter(matchLocation);

  const organizers = Array.from(new Set(locationFilteredSocials.map(s => s.organizerName).filter(Boolean)));
  const venues = Array.from(new Set(locationFilteredSocials.map(s => s.venueName).filter(Boolean)));

  // Unified Filter Logic
  const filterSocials = (list: Social[]) => {
    return list.filter(s => {
      // 1. 위치 필터
      if (!matchLocation(s)) return false;

      // 2. Keyword Search
      const search = searchQuery.toLowerCase();
      const matchSearch = !search || 
        String(s.title || '').toLowerCase().includes(search) || 
        String(s.organizerName || '').toLowerCase().includes(search) || 
        String(s.venueName || '').toLowerCase().includes(search);

      // 3. Multi-dimensional Chip Filters
      const matchOrg = selectedFilters.organizers.length === 0 || selectedFilters.organizers.includes(s.organizerName);
      const matchVen = selectedFilters.venues.length === 0 || selectedFilters.venues.includes(s.venueName);
      
      return matchSearch && matchOrg && matchVen;
    });
  };

  return (
    <main className="min-h-screen bg-[#FBFDFD] pb-32">
      {/* Header & Search */}
      <div className="sticky top-0 z-30 bg-[#FBFDFD]/80 backdrop-blur-md px-6 pt-6 pb-4 flex flex-col gap-3">
        <div className="relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors">search</span>
          <input 
            type="text" 
            placeholder="Search socials, organizers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-14 bg-white border border-[#dde4e5] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
          <button 
            onClick={() => openModal(setIsFilterOpen, true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-xl">tune</span>
          </button>
        </div>

        {/* Filter Chips */}
        {(selectedFilters.organizers.length > 0 || selectedFilters.venues.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {selectedFilters.organizers.map(org => (
              <div key={org} className="flex items-center gap-1 pl-3 pr-2 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold shadow-sm">
                <span>{org}</span>
                <button 
                  onClick={() => setSelectedFilters(prev => ({ ...prev, organizers: prev.organizers.filter(o => o !== org) }))}
                  className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-primary/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            ))}
            {selectedFilters.venues.map(venue => (
              <div key={venue} className="flex items-center gap-1 pl-3 pr-2 py-1.5 bg-[#F4FBFB] text-on-surface border border-[#dde4e5] rounded-full text-xs font-bold shadow-sm">
                <span>{venue}</span>
                <button 
                  onClick={() => setSelectedFilters(prev => ({ ...prev, venues: prev.venues.filter(v => v !== venue) }))}
                  className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            ))}
            <button 
              onClick={() => setSelectedFilters({ organizers: [], venues: [] })}
              className="text-xs font-bold text-on-surface-variant hover:text-primary underline px-2 py-1.5"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      <div className="px-6 space-y-12 mt-4">
        {/* 1. Regular Socials Carousel */}
        <section className="space-y-6">
          <div className="flex items-end justify-between px-1">
            <h2 className="text-2xl font-extrabold text-on-surface tracking-tight font-headline">Regular Socials</h2>
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary/60">
                <span>{countryDisplay}</span>
                <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                <span>{cityDisplay}</span>
            </div>
          </div>

          {/* Day Selector - Moved Here */}
          <div className="grid grid-cols-7 gap-1.5 py-2">
            {weekDays.map((date, i) => (
              <button
                key={i}
                onClick={() => setActiveDayOffset(i)}
                className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all ${
                  activeDayOffset === i 
                  ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                  : 'bg-white text-on-surface-variant border border-[#dde4e5]'
                }`}
              >
                <span className="text-[9px] font-black uppercase tracking-tighter mb-1 opacity-70">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="text-lg font-black tracking-tighter">
                  {date.getDate()}
                </span>
              </button>
            ))}
          </div>
          
          <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
            {filterSocials(regulars).filter(s => Number(s.dayOfWeek) === weekDays[activeDayOffset].getDay()).length === 0 ? (
              <div className="w-full h-40 flex flex-col items-center justify-center opacity-20 bg-white rounded-lg border border-dashed border-gray-200">
                 <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
                 <p className="text-xs font-black uppercase tracking-widest">No regular socials today</p>
              </div>
            ) : (
              filterSocials(regulars).filter(s => Number(s.dayOfWeek) === weekDays[activeDayOffset].getDay()).map(social => (
                <div 
                  key={social.id} 
                  onClick={() => openModal(setViewSocial, social)}
                  className="relative flex-shrink-0 w-72 h-96 rounded-lg overflow-hidden group shadow-sm transition-all hover:shadow-md cursor-pointer animate-in zoom-in-95 duration-500 text-left"
                >
                  <SocialHeroCard social={social} />
                  
                  {/* Action Menu for Admins / Organizers */}
                  {canEdit(social) && (
                    <div className="absolute top-4 right-4 z-20">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === social.id ? null : social.id); }}
                        className="w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">more_vert</span>
                      </button>
                      {activeMenuId === social.id && (
                        <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-xl overflow-hidden border border-gray-100 py-1 origin-top-right animate-in fade-in zoom-in-95">
                          <button 
                            onClick={(e) => { e.stopPropagation(); openModal(setSelectedSocial, social); setActiveMenuId(null); }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(social.id); }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* 2. Popup Socials List */}
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 text-left">
          <h2 className="text-2xl font-extrabold text-on-surface tracking-tight font-headline">Popup Socials</h2>

          <div className="space-y-4">
            {filterSocials(popups).length === 0 ? (
              <div className="w-full h-32 flex flex-col items-center justify-center opacity-30 bg-white rounded-lg border border-dashed border-gray-200">
                 <p className="text-xs font-black uppercase tracking-widest text-primary/40">No popup socials scheduled</p>
              </div>
            ) : (
              filterSocials(popups).map(social => {
                const displayTitle = getSocialDisplayTitle(social);
                return (
                <div 
                  key={social.id} 
                  onClick={() => openModal(setViewSocial, social)}
                  className="relative flex items-center gap-4 p-4 bg-white rounded-lg border border-[#dde4e5] hover:border-primary/30 transition-all cursor-pointer group shadow-sm active:scale-[0.98] text-left"
                >
                  <div className="flex flex-col items-center justify-center w-20 h-20 bg-[#F4FBFB] rounded-lg border-l-4 border-primary shrink-0">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mb-1">
                      {new Date(social.date ? social.date.toDate() : new Date()).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                    </span>
                    <span className="text-2xl font-black text-on-surface tracking-tighter leading-none mb-1">
                      {new Date(social.date ? social.date.toDate() : new Date()).getDate()}
                    </span>
                    <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest leading-none">
                      {new Date(social.date ? social.date.toDate() : new Date()).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 space-y-0.5 text-left overflow-hidden pr-8">
                    <DualText 
                      text={displayTitle.primary}
                      subText={displayTitle.secondary}
                      primaryClassName="text-lg font-bold text-on-surface font-headline leading-tight truncate"
                      secondaryClassName="text-xs text-on-surface-variant font-medium truncate shrink-0"
                      containerClassName="w-full"
                    />
                    <DualText 
                      text={social.venueName}
                      primaryClassName="text-sm text-primary font-semibold truncate block mt-1"
                      secondaryClassName="text-[10px] text-primary/60 truncate block mt-0.5"
                    />
                    <p className="text-xs text-on-surface-variant font-medium truncate mt-1">
                      {social.startTime} - {social.endTime} {social.djName ? `• DJ ${social.djName}` : ''}
                    </p>
                  </div>

                  {/* Action Menu for Admins / Organizers */}
                  {canEdit(social) ? (
                    <div className="absolute top-4 right-4 z-20">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === social.id ? null : social.id); }}
                        className="w-8 h-8 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-500 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">more_vert</span>
                      </button>
                      {activeMenuId === social.id && (
                        <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-xl overflow-hidden border border-gray-100 py-1 origin-top-right animate-in fade-in zoom-in-95">
                          <button 
                            onClick={(e) => { e.stopPropagation(); openModal(setSelectedSocial, social); setActiveMenuId(null); }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(social.id); }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="material-symbols-outlined text-[#dde4e5] group-hover:text-primary transition-all group-hover:translate-x-1 absolute right-4 top-1/2 -translate-y-1/2">chevron_right</span>
                  )}
                </div>
                );
              })
            )}
          </div>

          <div className="flex justify-center pt-8">
             <button className="px-10 py-3 bg-white border border-[#dde4e5] text-primary font-bold text-sm tracking-widest uppercase rounded-lg hover:bg-primary hover:text-white transition-all active:scale-95 shadow-sm">
               More Socials
             </button>
          </div>
        </section>
      </div>

      {/* FAB - 신규 소셜 등록 버튼 */}
      <button
        onClick={() => openModal(setIsCreateOpen, true)}
        className="fixed bottom-24 right-6 z-40 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
        aria-label="소셜 등록"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>

      {/* Overlays */}
      {isFilterOpen && (
        <SocialFilterBottomSheet 
          onClose={() => closeModal(setIsFilterOpen, false)}
          onApply={(filters) => {
            setSelectedFilters(filters);
            closeModal(setIsFilterOpen, false);
          }}
          selectedOrganizers={selectedFilters.organizers}
          selectedVenues={selectedFilters.venues}
          availableOrganizers={organizers}
          availableVenues={venues}
        />
      )}

      {/* 신규 등록 (Create 모드) */}
      {isCreateOpen && (
        <EditSocialEvent 
          onClose={() => closeModal(setIsCreateOpen, false)}
          onSuccess={() => closeModal(setIsCreateOpen, false)}
        />
      )}

      {/* 기존 소셜 편집 (Edit 모드) */}
      {selectedSocial && (
        <EditSocialEvent 
          socialData={selectedSocial}
          onClose={() => closeModal(setSelectedSocial, null)}
        />
      )}

      {/* 뷰 모드 (일반 사용자) */}
      {viewSocial && (
        <SocialViewer 
          social={viewSocial}
          onClose={() => closeModal(setViewSocial, null)}
        />
      )}
    </main>
  );
}
