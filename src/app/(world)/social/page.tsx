'use client';

import { useState, useEffect } from 'react';
import { socialService } from '@/lib/firebase/socialService';
import { Social } from '@/types/social';
import SocialFilterBottomSheet from '@/components/social/SocialFilterBottomSheet';
import EditSocialEvent from '@/components/social/EditSocialEvent';

export default function SocialPage() {
  const [regulars, setRegulars] = useState<Social[]>([]);
  const [dailySocials, setDailySocials] = useState<Social[]>([]);
  const [activeDayOffset, setActiveDayOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSocial, setSelectedSocial] = useState<Social | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<{
    organizers: string[];
    venues: string[];
  }>({
    organizers: [],
    venues: []
  });

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

    return () => {
      unsubRegulars();
      unsubDaily();
    };
  }, [activeDayOffset]);

  // Filters
  const organizers = Array.from(new Set([...regulars, ...dailySocials].map(s => s.organizerName)));
  const venues = Array.from(new Set([...regulars, ...dailySocials].map(s => s.venueName)));

  // Filter Logic helper
  const filterSocials = (list: Social[]) => {
    return list.filter(s => {
      const title = String(s.title || '').toLowerCase();
      const org = String(s.organizerName || '').toLowerCase();
      const search = searchQuery.toLowerCase();
      
      const matchSearch = title.includes(search) || org.includes(search);
      const matchOrg = selectedFilters.organizers.length === 0 || selectedFilters.organizers.includes(s.organizerName);
      const matchVen = selectedFilters.venues.length === 0 || selectedFilters.venues.includes(s.venueName);
      
      return matchSearch && matchOrg && matchVen;
    });
  };

  return (
    <main className="min-h-screen bg-[#FBFDFD] pb-32">
      {/* Header & Search */}
      <div className="sticky top-0 z-30 bg-[#FBFDFD]/80 backdrop-blur-md px-6 pt-6 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-on-surface tracking-tighter font-headline">SOCIAL</h1>
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#dde4e5] text-on-surface shadow-sm active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-xl">tune</span>
          </button>
        </div>
        
        <div className="relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors">search</span>
          <input 
            type="text" 
            placeholder="Search socials, organizers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-white border border-[#dde4e5] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
        </div>

        {/* Day Selector */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
          {weekDays.map((date, i) => (
            <button
              key={i}
              onClick={() => setActiveDayOffset(i)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-20 rounded-xl transition-all ${
                activeDayOffset === i 
                ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105' 
                : 'bg-white text-on-surface-variant border border-[#dde4e5]'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="text-xl font-black tracking-tight">
                {date.getDate()}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 space-y-12 mt-4">
        {/* 1. Regular Socials Carousel */}
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-extrabold text-on-surface tracking-tight font-headline">Regular Socials</h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">Weekly Heritage</span>
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
                  onClick={() => setSelectedSocial(social)}
                  className="relative flex-shrink-0 w-72 h-96 rounded-lg overflow-hidden group shadow-sm transition-all hover:shadow-md cursor-pointer animate-in zoom-in-95 duration-500 text-left"
                >
                  <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={social.imageUrl} alt={social.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 p-6 space-y-1 text-left">
                    <h3 className="text-white text-xl font-bold font-headline leading-tight">{social.title}</h3>
                    <p className="text-white/80 text-sm font-medium">{social.organizerName}</p>
                    <p className="text-white/70 text-xs">{social.venueName}</p>
                    <p className="text-white/70 text-xs">{social.startTime} - {social.endTime}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 2. Popup Socials List */}
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 text-left">
          <h2 className="text-2xl font-extrabold text-on-surface tracking-tight font-headline">Popup Socials</h2>

          <div className="space-y-4">
            {filterSocials(dailySocials).filter(s => String(s.type).toLowerCase() === 'popup').length === 0 ? (
              <div className="w-full h-32 flex flex-col items-center justify-center opacity-30 bg-white rounded-lg border border-dashed border-gray-200">
                 <p className="text-xs font-black uppercase tracking-widest text-primary/40">No popup socials scheduled</p>
              </div>
            ) : (
              filterSocials(dailySocials).filter(s => String(s.type).toLowerCase() === 'popup').map(social => (
                <div 
                  key={social.id} 
                  onClick={() => setSelectedSocial(social)}
                  className="flex items-center gap-4 p-4 bg-white rounded-lg border border-[#dde4e5] hover:border-primary/30 transition-all cursor-pointer group shadow-sm active:scale-[0.98] text-left"
                >
                  <div className="flex flex-col items-center justify-center w-20 h-20 bg-[#F4FBFB] rounded-lg border-l-4 border-primary shrink-0">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(social.date ? social.date.toDate() : new Date()).getDay()]}
                    </span>
                    <span className="text-2xl font-black text-on-surface tracking-tighter">
                      {new Date(social.date ? social.date.toDate() : new Date()).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 space-y-0.5 text-left overflow-hidden">
                    <h4 className="text-lg font-bold text-on-surface font-headline leading-tight truncate">{social.title}</h4>
                    <p className="text-sm text-primary font-semibold truncate">{social.venueName}</p>
                    <p className="text-xs text-on-surface-variant font-medium truncate">
                      {social.startTime} - {social.endTime} {social.djName ? `• DJ ${social.djName}` : ''}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-[#dde4e5] group-hover:text-primary transition-all group-hover:translate-x-1">chevron_right</span>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-center pt-8">
             <button className="px-10 py-3 bg-white border border-[#dde4e5] text-primary font-bold text-sm tracking-widest uppercase rounded-lg hover:bg-primary hover:text-white transition-all active:scale-95 shadow-sm">
               More Socials
             </button>
          </div>
        </section>
      </div>

      {/* Overlays */}
      {isFilterOpen && (
        <SocialFilterBottomSheet 
          onClose={() => setIsFilterOpen(false)}
          onApply={(filters) => {
            setSelectedFilters(filters);
            setIsFilterOpen(false);
          }}
          selectedOrganizers={selectedFilters.organizers}
          selectedVenues={selectedFilters.venues}
        />
      )}

      {selectedSocial && (
        <EditSocialEvent 
          socialData={selectedSocial}
          onClose={() => setSelectedSocial(null)}
        />
      )}
    </main>
  );
}
