import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { socialService } from '@/lib/firebase/socialService';
import { Social } from '@/types/social';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

interface DJScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  djId: string;
  djName: string;
  onSuccess?: () => void;
}

export default function DJScheduleModal({ isOpen, onClose, djId, djName, onSuccess }: DJScheduleModalProps) {
  const { t, language } = useLanguage();
  const [socials, setSocials] = useState<Social[]>([]);
  const [selectedSocialId, setSelectedSocialId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 드롭다운 검색 및 수동 입력용 상태 추가
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customSocialTitle, setCustomSocialTitle] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [customLocation, setCustomLocation] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const unsub = socialService.subscribeAllSocials((data) => {
      setSocials(data);
    });
    return () => unsub();
  }, [isOpen]);

  const selectedSocial = socials.find(s => s.id === selectedSocialId);

  // Helper to generate next 8 dates for regular socials
  const generateUpcomingDates = (social: Social) => {
    if (social.type !== "regular" || social.dayOfWeek === undefined) return [];
    const dates = [];
    const d = new Date();
    d.setHours(0,0,0,0);
    const diff = (social.dayOfWeek - d.getDay() + 7) % 7;
    let next = new Date(d);
    next.setDate(d.getDate() + diff);
    
    for (let i = 0; i < 8; i++) {
      const year = next.getFullYear();
      const month = String(next.getMonth() + 1).padStart(2, '0');
      const day = String(next.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
      next.setDate(next.getDate() + 7);
    }
    return dates;
  };

  const suggestedDates = selectedSocial ? generateUpcomingDates(selectedSocial) : [];
  const dateLocale = language === 'KR' ? 'ko-KR' : 'en-US';

  // Set default date when social selection changes
  useEffect(() => {
    if (selectedSocialId === 'none') {
      setSelectedDate('');
      return;
    }
    if (!selectedSocial) {
      setSelectedDate('');
      return;
    }

    if (selectedSocial.type === 'popup' && selectedSocial.date) {
      const pDate = typeof selectedSocial.date.toDate === 'function' 
        ? selectedSocial.date.toDate() 
        : new Date((selectedSocial.date as any).seconds * 1000);
      const year = pDate.getFullYear();
      const month = String(pDate.getMonth() + 1).padStart(2, '0');
      const day = String(pDate.getDate()).padStart(2, '0');
      setSelectedDate(`${year}-${month}-${day}`);
    } else {
      const upcoming = generateUpcomingDates(selectedSocial);
      if (upcoming.length > 0) {
        setSelectedDate(upcoming[0]);
      } else {
        setSelectedDate('');
      }
    }
  }, [selectedSocialId]);

  const handleSelectSocial = (socialId: string) => {
    setSelectedSocialId(socialId);
    setIsDropdownOpen(false);
    setSearchKeyword('');
    if (socialId === 'none') {
      setSelectedDate('');
    }
  };

  const filteredSocials = socials.filter(s => {
    if (s.subCategory === 'practica') return false;
    if (!searchKeyword) return true;
    const query = searchKeyword.toLowerCase();
    const title = (s.title || '').toLowerCase();
    const native = (s.titleNative || '').toLowerCase();
    return title.includes(query) || native.includes(query);
  });

  const handleSubmit = async () => {
    if (!selectedSocialId) {
      toast.error(t('myinfo.select_social_placeholder'));
      return;
    }

    if (selectedSocialId === 'none') {
      if (!customSocialTitle.trim()) {
        toast.error(language === 'KR' ? '소셜 이름을 입력해 주세요.' : 'Please enter social name.');
        return;
      }
      if (!selectedDate) {
        toast.error(t('social.alert_select_date_dj') || 'Please select a date');
        return;
      }

      setIsSubmitting(true);
      try {
        const userDocRef = doc(db, 'users', djId);
        const userSnap = await getDoc(userDocRef);
        let customSchedules = [];
        if (userSnap.exists()) {
          customSchedules = userSnap.data().customSchedules || [];
        }
        const randomId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11) + '_' + Date.now();
        const newSchedule = {
          id: randomId,
          socialTitle: customSocialTitle,
          date: selectedDate,
          time: customTime,
          location: customLocation,
          type: 'custom_dj_schedule'
        };
        await updateDoc(userDocRef, {
          customSchedules: [...customSchedules, newSchedule]
        });

        toast.success(t('myinfo.add_success'));
        onSuccess?.();
        onClose();
        // Reset states
        setCustomSocialTitle('');
        setCustomTime('');
        setCustomLocation('');
        setSelectedSocialId('');
        setSelectedDate('');
      } catch (error) {
        console.error('Failed to add custom DJ schedule:', error);
        toast.error(t('social.alert_failed_add_dj'));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!selectedDate) {
      toast.error(t('social.alert_select_date_dj') || 'Please select a date');
      return;
    }

    setIsSubmitting(true);
    try {
      await socialService.addDjToSocial(selectedSocialId, djId, djName, selectedDate);
      toast.success(t('myinfo.add_success'));
      onSuccess?.();
      onClose();
      // Reset states
      setSelectedSocialId('');
      setSelectedDate('');
    } catch (error) {
      console.error('Failed to add DJ schedule:', error);
      toast.error(t('social.alert_failed_add_dj'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Bottom Sheet */}
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[210] bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#f2f4f4] shrink-0">
              <div>
                <h2 className="text-lg font-black text-[#2d3435]">{t('myinfo.dj_schedule_add')}</h2>
                <p className="text-[11px] font-bold text-[#acb3b4] mt-0.5">{djName}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f8f9fa] text-[#596061] hover:bg-[#e8eaec] transition-colors">
                <span className="material-symbols-rounded text-lg">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Social Selection (Dropdown Autocomplete Search) */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-2">{t('myinfo.social_label')}</label>
                
                {selectedSocialId ? (
                  // Selected status
                  <div className="flex items-center justify-between w-full px-4 py-3 border border-primary/30 rounded-xl bg-primary/5 text-sm font-bold text-primary animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 truncate">
                      <span className="material-symbols-rounded text-base">
                        {selectedSocialId === 'none' ? 'draw' : 'link'}
                      </span>
                      <span className="truncate">
                        {selectedSocialId === 'none' 
                          ? t('myinfo.no_related_social') 
                          : (selectedSocial?.titleNative || selectedSocial?.title)}
                      </span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setSelectedSocialId('');
                        setSelectedDate('');
                      }} 
                      className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
                    >
                      <span className="material-symbols-rounded text-sm">close</span>
                    </button>
                  </div>
                ) : (
                  // Search Input
                  <div className="relative">
                    <div className="flex items-center gap-2 w-full px-4 py-3 border border-[#e0e4e5] rounded-xl focus-within:border-primary/50 bg-white shadow-sm transition-all">
                      <span className="material-symbols-rounded text-base text-outline">search</span>
                      <input
                        type="text"
                        placeholder={t('myinfo.search_social_placeholder')}
                        value={searchKeyword}
                        onChange={e => {
                          setSearchKeyword(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        className="w-full text-sm font-bold text-[#2d3435] focus:outline-none placeholder:text-[#acb3b4]"
                      />
                      {searchKeyword && (
                        <button 
                          type="button" 
                          onClick={() => setSearchKeyword('')} 
                          className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-outline"
                        >
                          <span className="material-symbols-rounded text-xs">close</span>
                        </button>
                      )}
                    </div>

                    {/* Dropdown Options */}
                    {isDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-[290]" 
                          onClick={() => setIsDropdownOpen(false)} 
                        />
                        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[300] bg-white border border-[#e0e4e5] rounded-xl shadow-xl max-h-60 overflow-y-auto no-scrollbar py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                          {/* 1. 관련 소셜 없음 (수동) 고정 옵션 */}
                          <div 
                            onClick={() => handleSelectSocial('none')}
                            className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-purple-700 hover:bg-purple-50 cursor-pointer border-b border-gray-100 transition-colors"
                          >
                            <span className="material-symbols-rounded text-sm">draw</span>
                            <span>{t('myinfo.no_related_social')}</span>
                          </div>

                          {/* 2. 검색 결과 */}
                          {filteredSocials.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-outline font-bold text-center">
                              {language === 'KR' ? '검색 결과가 없습니다.' : 'No socials found.'}
                            </div>
                          ) : (
                            filteredSocials.map(s => (
                              <div 
                                key={s.id}
                                onClick={() => handleSelectSocial(s.id)}
                                className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-[#2d3435] hover:bg-primary/5 cursor-pointer transition-colors"
                              >
                                <span className="material-symbols-rounded text-sm text-[#acb3b4]">link</span>
                                <div className="truncate flex-1">
                                  <p className="truncate">{s.titleNative || s.title}</p>
                                  {s.venueName && (
                                    <p className="text-[10px] text-outline truncate font-medium mt-0.5">
                                      📍 {s.venueNameNative || s.venueName}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Manual Input Fields for custom schedule */}
              {selectedSocialId === 'none' && (
                <div className="space-y-4 p-4 rounded-2xl bg-purple-50/30 border border-purple-100/50 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-[10px] font-bold text-purple-700/80 uppercase tracking-wider mb-2">
                      {t('myinfo.custom_social_title')} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={language === 'KR' ? '예: 솔땅 특별 정모' : 'e.g. Special Milonga'}
                      value={customSocialTitle}
                      onChange={e => setCustomSocialTitle(e.target.value)}
                      className="w-full px-4 py-3 border border-[#e0e4e5] focus:border-purple-300 rounded-xl text-sm font-bold text-[#2d3435] focus:outline-none bg-white shadow-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-purple-700/80 uppercase tracking-wider mb-2">
                        {t('myinfo.custom_social_time')}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 20:00 - 02:00"
                        value={customTime}
                        onChange={e => setCustomTime(e.target.value)}
                        className="w-full px-4 py-3 border border-[#e0e4e5] focus:border-purple-300 rounded-xl text-sm font-bold text-[#2d3435] focus:outline-none bg-white shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-purple-700/80 uppercase tracking-wider mb-2">
                        {t('myinfo.custom_location')}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Studio A"
                        value={customLocation}
                        onChange={e => setCustomLocation(e.target.value)}
                        className="w-full px-4 py-3 border border-[#e0e4e5] focus:border-purple-300 rounded-xl text-sm font-bold text-[#2d3435] focus:outline-none bg-white shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Date Selection */}
              {(selectedSocial || selectedSocialId === 'none') && (
                <div>
                  <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-2">{t('myinfo.date_label')}</label>
                  {selectedSocialId === 'none' ? (
                    // 관련 소셜 없음: 브라우저 달력 활성화
                    <input 
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-3 border border-[#e0e4e5] focus:border-primary/50 rounded-xl text-sm font-bold text-[#2d3435] bg-white outline-none shadow-sm"
                    />
                  ) : selectedSocial?.type === 'regular' ? (
                    <select
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-3 border border-[#e0e4e5] rounded-xl text-sm font-bold text-[#2d3435] focus:outline-none focus:border-primary/50 bg-white"
                    >
                      {suggestedDates.map(dateStr => (
                        <option key={dateStr} value={dateStr}>
                          {new Date(dateStr).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', weekday: 'short' })}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="date"
                      value={selectedDate}
                      disabled
                      className="w-full px-4 py-3 border border-[#e0e4e5] rounded-xl text-sm font-bold text-[#acb3b4] bg-[#f8f9fa] outline-none"
                    />
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedSocialId || (selectedSocialId === 'none' && !customSocialTitle.trim())}
                className="w-full py-4 bg-primary text-white rounded-xl text-sm font-black tracking-wide active:scale-[0.98] transition-transform disabled:opacity-50 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? t('myinfo.saving') : t('myinfo.dj_schedule_add')}
              </button>
              <div className="h-6" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
