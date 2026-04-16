'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { socialService } from '@/lib/firebase/socialService';
import { Social } from '@/types/social';
import SocialFilterBottomSheet from '@/components/social/SocialFilterBottomSheet';
import EditSocialEvent from '@/components/social/EditSocialEvent';
import SocialEventDetail from '@/components/social/SocialEventDetail';
import { AnimatePresence } from 'framer-motion';

export default function SocialPage() {
  const { user } = useAuth();
  const [regulars, setRegulars] = useState<Social[]>([]);
  const [popups, setPopups] = useState<Social[]>([]);
  const [dailySocials, setDailySocials] = useState<Social[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<{ organizers: string[]; venues: string[] }>({
    organizers: [],
    venues: []
  });

  const [activeDayOffset, setActiveDayOffset] = useState(0); // 0 = Today, 1 = Tomorrow...
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Week generation
  const getWeekDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  };
  const weekDays = getWeekDays();

  // 1. Subscribe to Regulars
  useEffect(() => {
    const unsub = socialService.subscribeSocials('regular', (data) => setRegulars(data));
    return () => unsub();
  }, []);

  // 2. Subscribe to Daily Socials (Filtered by selected day)
  useEffect(() => {
    const day = weekDays[activeDayOffset].getDay();
    const date = weekDays[activeDayOffset];
    const unsub = socialService.subscribeDailySocials(day, date, (data) => setDailySocials(data));
    return () => unsub();
  }, [activeDayOffset]);

  const handleApplyFilter = (filters: { organizers: string[]; venues: string[] }) => {
    setSelectedFilters(filters);
    setShowFilter(false);
  };
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSocial, setSelectedSocial] = useState<Social | null>(null);

  // Filter Logic
  const filterSocials = (list: Social[]) => {
    return list.filter(s => {
      const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.organizerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchOrg = selectedFilters.organizers.length === 0 || selectedFilters.organizers.includes(s.organizerName);
      const matchVen = selectedFilters.venues.length === 0 || selectedFilters.venues.includes(s.venueName);
      return matchSearch && matchOrg && matchVen;
    });
  };

  return (
    <main className="max-w-4xl mx-auto px-6 py-8 space-y-10 pt-24 bg-[#f4fbfb] min-h-screen relative font-body text-[#2D3435]">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}} />

      {/* 1. Search Bar Section */}
      <section className="w-full sticky top-16 z-40 bg-[#f4fbfb]/90 backdrop-blur-md py-2 text-left">
        <div className="relative flex items-center w-full bg-white border border-[#dde4e5] rounded-lg px-4 py-3 group focus-within:ring-1 focus-within:ring-primary transition-all shadow-sm">
          <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">search</span>
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-outline/60 text-sm font-medium ml-3 outline-none" 
            placeholder="Search organizers or venues..." 
            type="text"
          />
          <button 
            onClick={() => setShowFilter(true)}
            className="ml-2 p-1 text-outline hover:text-primary transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined">tune</span>
          </button>
        </div>
      </section>

      {/* 2. Regular Socials */}
      <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-on-surface tracking-tight font-headline">Regular Socials</h2>
          <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest">Weekly Heritage</span>
        </div>
        
        <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
          {filterSocials(regulars).length === 0 ? (
            <div className="w-full h-40 flex flex-col items-center justify-center opacity-20 bg-white rounded-lg border border-dashed border-gray-200">
               <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
               <p className="text-xs font-black uppercase tracking-widest">No matching regulars</p>
            </div>
          ) : (
            filterSocials(regulars).map(social => (
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

      {/* 3. Popup & Daily Socials */}
      <section className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 text-left">
        <h2 className="text-2xl font-extrabold text-on-surface tracking-tight font-headline">Daily & Popup Socials</h2>
        
        {/* Weekly Calendar Filter */}
        <section className="flex justify-between items-center bg-white border border-[#dde4e5] p-2 rounded-lg shadow-sm overflow-x-auto no-scrollbar">
          {weekDays.map((date, index) => {
            const isActive = activeDayOffset === index;
            const weekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return (
              <div 
                key={index}
                onClick={() => setActiveDayOffset(index)}
                className={`flex flex-col items-center w-12 py-3 rounded-lg cursor-pointer transition-all active:scale-95 ${
                  isActive ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant/60 hover:bg-gray-50'
                }`}
              >
                <span className={`text-[0.65rem] font-bold uppercase tracking-widest ${isActive ? 'text-white/80' : ''}`}>
                  {weekNames[date.getDay()]}
                </span>
                <span className="text-base font-bold">{date.getDate()}</span>
              </div>
            );
          })}
        </section>

        {/* Daily List Items */}
        <div className="space-y-4">
          {filterSocials(dailySocials).length === 0 ? (
             <div className="py-20 flex flex-col items-center justify-center opacity-20">
                <span className="material-symbols-outlined text-5xl mb-3">calendar_today</span>
                <p className="text-xs font-black uppercase tracking-widest">No socials scheduled for this day</p>
             </div>
          ) : (
            filterSocials(dailySocials).map(social => (
              <div 
                key={social.id} 
                onClick={() => setSelectedSocial(social)}
                className="flex items-center gap-6 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-50 animate-in fade-in slide-in-from-left-4 duration-500 cursor-pointer"
              >
                <div className="flex flex-col items-center justify-center w-20 h-20 bg-[#F4FBFB] rounded-lg border-l-4 border-primary shrink-0">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(social.date ? social.date.toDate() : new Date()).getDay()]}
                  </span>
                  <span className="text-2xl font-extrabold text-on-surface">
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
                <span className="material-symbols-outlined text-gray-200 group-hover:text-primary transition-colors">chevron_right</span>
              </div>
            ))
          )}
        </div>

        {/* More Button */}
        <div className="flex justify-center pt-8">
          <button className="px-10 py-3 bg-white border border-[#dde4e5] text-primary font-bold text-sm tracking-widest uppercase rounded-lg hover:bg-primary hover:text-white transition-all active:scale-95 shadow-sm">
            More Socials
          </button>
        </div>
      </section>

      {/* 4. Global Social Management FAB */}
      <button 
        onClick={() => setShowEditModal(true)}
        className="fixed bottom-10 right-10 w-20 h-20 bg-[#1f1f1f] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 hover:bg-primary active:scale-95 transition-all z-50 group shadow-primary/20"
      >
        <span className="material-symbols-outlined text-[36px] group-hover:rotate-90 transition-transform duration-300">add</span>
      </button>

      {/* Filter Bottom Sheet */}
      <AnimatePresence>
        {showFilter && (
          <SocialFilterBottomSheet 
            onClose={() => setShowFilter(false)}
            onApply={handleApplyFilter}
            selectedOrganizers={selectedFilters.organizers}
            selectedVenues={selectedFilters.venues}
          />
        )}
      </AnimatePresence>

      {/* Edit/Create Social Modal */}
      <AnimatePresence>
        {showEditModal && (
          <EditSocialEvent 
            onClose={() => setShowEditModal(false)}
            onSuccess={() => {}}
          />
        )}
      </AnimatePresence>

      {/* Social Detail Modal */}
      <AnimatePresence>
        {selectedSocial && (
          <SocialEventDetail 
            social={selectedSocial}
            onClose={() => setSelectedSocial(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
