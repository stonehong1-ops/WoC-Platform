'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { picService } from '@/services/picService';
import { Pic } from '@/types/pic';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import BottomSheet from '@/components/common/BottomSheet';
import { useNavigation } from '@/components/providers/NavigationProvider';

const MOODS = ['All', 'Romantic', 'Vibrant', 'Chill', 'Energetic', 'Moody', 'Elegant', 'Warm', 'Calm'];
const ACTIVITIES = ['All', 'Social', 'Dining', 'Explore', 'Relax', 'Party', 'Learn', 'Exercise'];
const SEASONS = ['All', 'Spring', 'Summer', 'Autumn', 'Winter'];
const TIMES = ['All', 'Morning', 'Afternoon', 'Evening', 'Night'];

export default function PicsPage() {
  const { t } = useLanguage();
  const { setSubHeader } = useNavigation();
  
  const [pics, setPics] = useState<Pic[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  
  const [activeMood, setActiveMood] = useState('All');
  const [activeActivity, setActiveActivity] = useState('All');
  const [activeSeason, setActiveSeason] = useState('All');
  const [activeTime, setActiveTime] = useState('All');

  // BottomSheet States
  const [activeBottomSheet, setActiveBottomSheet] = useState<'mood' | 'activity' | 'season' | 'time' | 'more' | null>(null);
  const [tempMood, setTempMood] = useState('All');
  const [tempActivity, setTempActivity] = useState('All');
  const [tempSeason, setTempSeason] = useState('All');
  const [tempTime, setTempTime] = useState('All');

  const [selectedPic, setSelectedPic] = useState<Pic | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const observerTarget = useRef(null);

  const fetchPics = async (isLoadMore = false, currentLastDoc: any = null) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await picService.getPicsPaginated({
        limitCount: 20,
        lastDoc: isLoadMore ? currentLastDoc : null,
        filters: {
          mood: activeMood !== 'All' ? activeMood : undefined,
          activity: activeActivity !== 'All' ? activeActivity : undefined,
          season: activeSeason !== 'All' ? activeSeason : undefined,
          timeOfDay: activeTime !== 'All' ? activeTime : undefined,
        }
      });

      const validPics = response.pics.filter(p => p.imageUrl);

      setPics(prev => isLoadMore ? [...prev, ...validPics] : validPics);
      setLastDoc(response.lastDoc);
      setHasMore(response.hasMore);

    } catch (error) {
      console.error("Failed to load pics", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial load & filter change
  useEffect(() => {
    setPics([]);
    setLastDoc(null);
    setHasMore(true);
    fetchPics(false, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMood, activeActivity, activeSeason, activeTime]);

  // PICS 분류 필터 바를 setSubHeader를 통해 상단 서브헤더로 Teleport (Premium Standard: Dual Row)
  useEffect(() => {
    const isAnyFilterActive = activeMood !== 'All' || activeActivity !== 'All' || activeSeason !== 'All' || activeTime !== 'All';
    const activeFiltersCount = [activeMood, activeActivity, activeSeason, activeTime].filter(v => v !== 'All').length;

    const filterBar = (
      <div className="relative w-full bg-white flex flex-col shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)]">
        <style dangerouslySetInnerHTML={{ __html: `
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />
        
        {/* Row 1: Scrollable Tabs */}
        <div className="w-full px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar relative z-50">
          {/* More Filters Chip (맨 왼쪽 배치) */}
          <button
            onClick={() => openFilters()}
            className={`flex-shrink-0 px-2.5 py-1.5 rounded-xl text-[12px] font-bold tracking-tight transition-all whitespace-nowrap border flex items-center gap-1 ${
              isAnyFilterActive
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100'
                : 'bg-slate-50/50 text-slate-500 border-slate-100 hover:bg-slate-100/80'
            }`}
          >
            <span className="material-symbols-outlined !text-[16px] flex items-center justify-center">tune</span>
            <span>{t('pics.more_filters')}</span>
            {isAnyFilterActive && (
              <span className="bg-white text-blue-600 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black ml-0.5">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* 세련된 세로 구분선 */}
          <div className="h-6 w-[1px] bg-slate-100 mx-1 shrink-0" />

          {/* Mood Chip */}
          <button
            onClick={() => setActiveBottomSheet('mood')}
            className={`flex-shrink-0 px-2.5 py-1.5 rounded-xl text-[12px] font-bold tracking-tight transition-all whitespace-nowrap border flex items-center gap-1 ${
              activeMood !== 'All'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100'
                : 'bg-slate-50/50 text-slate-500 border-slate-100 hover:bg-slate-100/80'
            }`}
          >
            <span>{activeMood !== 'All' ? t(`pics.mood.${activeMood}`) : t('pics.filter.mood')}</span>
            {activeMood !== 'All' ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMood('All');
                }}
                className="material-symbols-outlined !text-[14px] hover:text-blue-200 flex items-center justify-center ml-0.5"
              >
                close
              </span>
            ) : (
              <span className="material-symbols-outlined !text-[14px] opacity-60 flex items-center justify-center">arrow_drop_down</span>
            )}
          </button>

          {/* Activity Chip */}
          <button
            onClick={() => setActiveBottomSheet('activity')}
            className={`flex-shrink-0 px-2.5 py-1.5 rounded-xl text-[12px] font-bold tracking-tight transition-all whitespace-nowrap border flex items-center gap-1 ${
              activeActivity !== 'All'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100'
                : 'bg-slate-50/50 text-slate-500 border-slate-100 hover:bg-slate-100/80'
            }`}
          >
            <span>{activeActivity !== 'All' ? t(`pics.activity.${activeActivity}`) : t('pics.filter.activity')}</span>
            {activeActivity !== 'All' ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveActivity('All');
                }}
                className="material-symbols-outlined !text-[14px] hover:text-blue-200 flex items-center justify-center ml-0.5"
              >
                close
              </span>
            ) : (
              <span className="material-symbols-outlined !text-[14px] opacity-60 flex items-center justify-center">arrow_drop_down</span>
            )}
          </button>

          {/* Season Chip */}
          <button
            onClick={() => setActiveBottomSheet('season')}
            className={`flex-shrink-0 px-2.5 py-1.5 rounded-xl text-[12px] font-bold tracking-tight transition-all whitespace-nowrap border flex items-center gap-1 ${
              activeSeason !== 'All'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100'
                : 'bg-slate-50/50 text-slate-500 border-slate-100 hover:bg-slate-100/80'
            }`}
          >
            <span>{activeSeason !== 'All' ? t(`pics.season.${activeSeason}`) : t('pics.filter.season')}</span>
            {activeSeason !== 'All' ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSeason('All');
                }}
                className="material-symbols-outlined !text-[14px] hover:text-blue-200 flex items-center justify-center ml-0.5"
              >
                close
              </span>
            ) : (
              <span className="material-symbols-outlined !text-[14px] opacity-60 flex items-center justify-center">arrow_drop_down</span>
            )}
          </button>

          {/* Time Chip */}
          <button
            onClick={() => setActiveBottomSheet('time')}
            className={`flex-shrink-0 px-2.5 py-1.5 rounded-xl text-[12px] font-bold tracking-tight transition-all whitespace-nowrap border flex items-center gap-1 ${
              activeTime !== 'All'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100'
                : 'bg-slate-50/50 text-slate-500 border-slate-100 hover:bg-slate-100/80'
            }`}
          >
            <span>{activeTime !== 'All' ? t(`pics.time.${activeTime}`) : t('pics.filter.time')}</span>
            {activeTime !== 'All' ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTime('All');
                }}
                className="material-symbols-outlined !text-[14px] hover:text-blue-200 flex items-center justify-center ml-0.5"
              >
                close
              </span>
            ) : (
              <span className="material-symbols-outlined !text-[14px] opacity-60 flex items-center justify-center">arrow_drop_down</span>
            )}
          </button>
        </div>
        
        {/* Row 2: Stats & Reset Control */}
        <div className="w-full h-11 px-4 flex items-center justify-between border-t border-slate-100 bg-white">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
              {pics.length} <span className="text-slate-400 font-medium">{t('pics.items')}</span>
            </div>
          </div>
          
          {isAnyFilterActive && (
            <button 
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              <span className="material-symbols-outlined !text-[14px] flex items-center justify-center">restart_alt</span>
              <span>{t('pics.reset')}</span>
            </button>
          )}
        </div>
      </div>
    );

    setSubHeader(filterBar);
    return () => setSubHeader(null);
  }, [activeMood, activeActivity, activeSeason, activeTime, pics.length, setSubHeader, t]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchPics(true, lastDoc);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, lastDoc, activeMood, activeActivity, activeSeason, activeTime]);

  const openFilters = () => {
    setTempMood(activeMood);
    setTempActivity(activeActivity);
    setTempSeason(activeSeason);
    setTempTime(activeTime);
    setActiveBottomSheet('more');
  };

  const applyFilters = () => {
    setActiveMood(tempMood);
    setActiveActivity(tempActivity);
    setActiveSeason(tempSeason);
    setActiveTime(tempTime);
    setActiveBottomSheet(null);
  };

  const clearAllFilters = () => {
    setActiveMood('All');
    setActiveActivity('All');
    setActiveSeason('All');
    setActiveTime('All');
    setTempMood('All');
    setTempActivity('All');
    setTempSeason('All');
    setTempTime('All');
  };

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename.endsWith('.jpg') || filename.endsWith('.png') ? filename : `${filename}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div className="w-full bg-[#FAF8FF]">
      <div className="pt-0 pb-12 px-4 sm:px-6 max-w-[1600px] mx-auto">
        {/* Guide Announcement Box with Sparkles (No H1 Title) */}
        <div className="border border-on-surface/[0.06] rounded-2xl px-5 py-4 bg-surface/50 backdrop-blur-sm flex items-start gap-3.5 mb-6 mt-4">
          <span className="material-symbols-outlined text-[24px] text-primary shrink-0 mt-0.5 animate-pulse select-none">
            auto_awesome
          </span>
          <div className="flex flex-col gap-1 text-[13px] leading-relaxed font-semibold">
            <p className="text-on-surface">
              {t('pics.guide_box_text_kr')}
            </p>
            <p className="text-on-surface/50 font-normal">
              {t('pics.guide_box_text_en')}
            </p>
          </div>
        </div>



        {loading && pics.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-[13px] font-bold text-on-surface/40 uppercase tracking-[0.2em]">{t('pics.loading_assets')}</p>
          </div>
        ) : pics.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-on-surface/30 py-16 bg-surface rounded-[32px] border border-on-surface/[0.03]">
            <span className="material-symbols-outlined text-[64px] mb-4 opacity-50 select-none">wallpaper</span>
            <p className="text-[16px] font-bold tracking-tight">{t('pics.no_assets_found')}</p>
            <p className="text-[13px] mt-2 font-medium opacity-70">{t('pics.try_adjusting_filters')}</p>
          </div>
        ) : (
          <>
            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
              {pics.map((pic) => {
                if (failedImages[pic.id]) return null;
                return (
                <div 
                  key={pic.id} 
                  className="relative group break-inside-avoid overflow-hidden rounded-[24px] bg-surface-variant/30 border border-on-surface/[0.04] shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer"
                  onClick={() => setSelectedPic(pic)}
                >
                  <div className="relative w-full overflow-hidden bg-on-surface/5">
                    <Image 
                      src={pic.imageUrl} 
                      alt={pic.title || 'Pic Asset'} 
                      width={800} 
                      height={1200}
                      className="w-full h-auto object-cover transform transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      unoptimized
                      onError={() => setFailedImages(prev => ({ ...prev, [pic.id]: true }))}
                    />
                    
                    {/* Glassmorphism Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 ease-in-out flex flex-col justify-end p-5">
                      <div className="translate-y-6 group-hover:translate-y-0 transition-transform duration-400 ease-out">
                        {pic.tags && pic.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2.5">
                            {pic.tags.slice(0, 2).map((tag, idx) => (
                              <span key={idx} className="bg-white/20 backdrop-blur-md text-white text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <h3 className="text-white font-extrabold text-[16px] tracking-tight drop-shadow-md line-clamp-1">
                          {pic.title || 'Untitled Asset'}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
            
            {/* Infinite Scroll Target */}
            {hasMore && (
              <div ref={observerTarget} className="h-24 w-full flex items-center justify-center mt-8">
                {loadingMore && (
                  <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                )}
              </div>
            )}
            
            {!hasMore && pics.length > 0 && (
              <div className="text-center mt-8 mb-6">
                <p className="text-on-surface/30 font-bold text-[13px] uppercase tracking-widest">{t('pics.end_of_collection')}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Filter BottomSheet */}
      <BottomSheet
        isOpen={activeBottomSheet === 'more'}
        onClose={() => setActiveBottomSheet(null)}
        title={t('pics.more_filters')}
        height="auto"
        footer={
          <div className="p-4 flex items-center gap-3 bg-surface-container-lowest">
            <button
              onClick={() => {
                setTempMood('All');
                setTempActivity('All');
                setTempSeason('All');
                setTempTime('All');
              }}
              className="flex-1 py-3 text-[14px] font-bold text-on-surface-variant bg-surface-container-high rounded-[16px] transition-all hover:bg-surface-container-highest active:scale-95"
            >
              {t('pics.reset')}
            </button>
            <button
              onClick={applyFilters}
              className="flex-[2] py-3 text-[14px] font-bold text-on-primary bg-primary rounded-[16px] transition-all hover:bg-primary-dark active:scale-95 shadow-md shadow-primary/10"
            >
              {t('pics.apply')}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-6 py-2 px-1">
          {/* Mood Section */}
          <div>
            <h4 className="text-[12px] font-black text-on-surface/40 uppercase tracking-widest mb-3">
              {t('pics.filter.mood')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {MOODS.map(mood => (
                <button
                  key={mood}
                  onClick={() => setTempMood(mood)}
                  className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                    tempMood === mood
                      ? 'bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-300 border border-red-200/50 dark:border-red-900/30 shadow-sm'
                      : 'bg-surface border border-on-surface/10 text-on-surface/60 hover:bg-on-surface/5'
                  }`}
                >
                  {mood === 'All' ? t('pics.mood.All') : t(`pics.mood.${mood}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Section */}
          <div>
            <h4 className="text-[12px] font-black text-on-surface/40 uppercase tracking-widest mb-3">
              {t('pics.filter.activity')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {ACTIVITIES.map(activity => (
                <button
                  key={activity}
                  onClick={() => setTempActivity(activity)}
                  className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                    tempActivity === activity
                      ? 'bg-green-50 dark:bg-green-950/30 text-green-500 dark:text-green-300 border border-green-200/50 dark:border-green-900/30 shadow-sm'
                      : 'bg-surface border border-on-surface/10 text-on-surface/60 hover:bg-on-surface/5'
                  }`}
                >
                  {activity === 'All' ? t('pics.activity.All') : t(`pics.activity.${activity}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Season Section */}
          <div>
            <h4 className="text-[12px] font-black text-on-surface/40 uppercase tracking-widest mb-3">
              {t('pics.filter.season')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {SEASONS.map(season => (
                <button
                  key={season}
                  onClick={() => setTempSeason(season)}
                  className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                    tempSeason === season
                      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-500 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/30 shadow-sm'
                      : 'bg-surface border border-on-surface/10 text-on-surface/60 hover:bg-on-surface/5'
                  }`}
                >
                  {season === 'All' ? t('pics.season.All') : t(`pics.season.${season}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Time Section */}
          <div>
            <h4 className="text-[12px] font-black text-on-surface/40 uppercase tracking-widest mb-3">
              {t('pics.filter.time')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {TIMES.map(time => (
                <button
                  key={time}
                  onClick={() => setTempTime(time)}
                  className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                    tempTime === time
                      ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-500 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/30 shadow-sm'
                      : 'bg-surface border border-on-surface/10 text-on-surface/60 hover:bg-on-surface/5'
                  }`}
                >
                  {time === 'All' ? t('pics.time.All') : t(`pics.time.${time}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Mood BottomSheet */}
      <BottomSheet
        isOpen={activeBottomSheet === 'mood'}
        onClose={() => setActiveBottomSheet(null)}
        title={t('pics.filter.mood')}
        height="auto"
      >
        <div className="flex flex-col py-2 px-1">
          {MOODS.map(mood => (
            <button
              key={mood}
              onClick={() => {
                setActiveMood(mood);
                setActiveBottomSheet(null);
              }}
              className={`w-full py-4 px-5 flex items-center gap-3 hover:bg-on-surface/5 active:bg-on-surface/10 transition-all text-left text-[14px] rounded-2xl ${
                activeMood === mood ? 'text-red-500 font-bold bg-red-50/50 dark:bg-red-950/20' : 'text-on-surface/70 font-medium'
              }`}
            >
              <span className="flex-1">{mood === 'All' ? t('pics.mood.All') : t(`pics.mood.${mood}`)}</span>
              {activeMood === mood && (
                <span className="material-symbols-outlined text-[18px] text-red-500">check</span>
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Activity BottomSheet */}
      <BottomSheet
        isOpen={activeBottomSheet === 'activity'}
        onClose={() => setActiveBottomSheet(null)}
        title={t('pics.filter.activity')}
        height="auto"
      >
        <div className="flex flex-col py-2 px-1">
          {ACTIVITIES.map(activity => (
            <button
              key={activity}
              onClick={() => {
                setActiveActivity(activity);
                setActiveBottomSheet(null);
              }}
              className={`w-full py-4 px-5 flex items-center gap-3 hover:bg-on-surface/5 active:bg-on-surface/10 transition-all text-left text-[14px] rounded-2xl ${
                activeActivity === activity ? 'text-green-500 font-bold bg-green-50/50 dark:bg-green-950/20' : 'text-on-surface/70 font-medium'
              }`}
            >
              <span className="flex-1">{activity === 'All' ? t('pics.activity.All') : t(`pics.activity.${activity}`)}</span>
              {activeActivity === activity && (
                <span className="material-symbols-outlined text-[18px] text-green-500">check</span>
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Season BottomSheet */}
      <BottomSheet
        isOpen={activeBottomSheet === 'season'}
        onClose={() => setActiveBottomSheet(null)}
        title={t('pics.filter.season')}
        height="auto"
      >
        <div className="flex flex-col py-2 px-1">
          {SEASONS.map(season => (
            <button
              key={season}
              onClick={() => {
                setActiveSeason(season);
                setActiveBottomSheet(null);
              }}
              className={`w-full py-4 px-5 flex items-center gap-3 hover:bg-on-surface/5 active:bg-on-surface/10 transition-all text-left text-[14px] rounded-2xl ${
                activeSeason === season ? 'text-amber-500 font-bold bg-amber-50/50 dark:bg-amber-950/20' : 'text-on-surface/70 font-medium'
              }`}
            >
              <span className="flex-1">{season === 'All' ? t('pics.season.All') : t(`pics.season.${season}`)}</span>
              {activeSeason === season && (
                <span className="material-symbols-outlined text-[18px] text-amber-500">check</span>
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Time BottomSheet */}
      <BottomSheet
        isOpen={activeBottomSheet === 'time'}
        onClose={() => setActiveBottomSheet(null)}
        title={t('pics.filter.time')}
        height="auto"
      >
        <div className="flex flex-col py-2 px-1">
          {TIMES.map(time => (
            <button
              key={time}
              onClick={() => {
                setActiveTime(time);
                setActiveBottomSheet(null);
              }}
              className={`w-full py-4 px-5 flex items-center gap-3 hover:bg-on-surface/5 active:bg-on-surface/10 transition-all text-left text-[14px] rounded-2xl ${
                activeTime === time ? 'text-blue-500 font-bold bg-blue-50/50 dark:bg-blue-950/20' : 'text-on-surface/70 font-medium'
              }`}
            >
              <span className="flex-1">{time === 'All' ? t('pics.time.All') : t(`pics.time.${time}`)}</span>
              {activeTime === time && (
                <span className="material-symbols-outlined text-[18px] text-blue-500">check</span>
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Cinematic Lightbox */}
      {selectedPic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-xl transition-all">
          <div 
            className="absolute inset-0"
            onClick={() => setSelectedPic(null)}
          ></div>
          
          <div className="relative max-w-5xl w-full max-h-full flex flex-col md:flex-row gap-6 bg-surface/5 rounded-[32px] border border-white/10 overflow-hidden pointer-events-auto">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedPic(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full text-white transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* Image Container */}
            <div className="flex-1 relative bg-black/50 flex items-center justify-center min-h-[40vh] md:min-h-[70vh]">
              <Image 
                src={selectedPic.imageUrl} 
                alt={selectedPic.title || 'Pic Asset'} 
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            {/* Meta & Actions Sidebar */}
            <div className="w-full md:w-[320px] shrink-0 p-6 sm:p-8 flex flex-col">
              <h2 className="text-white font-display text-[28px] font-black leading-tight mb-2">
                {selectedPic.title || 'Untitled Asset'}
              </h2>
              <div className="flex items-center gap-2 text-white/50 text-[13px] font-medium mb-8">
                <span>{selectedPic.mood !== 'All' ? t(`pics.mood.${selectedPic.mood}`) : selectedPic.mood}</span>
                <span>•</span>
                <span>{selectedPic.activity !== 'All' ? t(`pics.activity.${selectedPic.activity}`) : selectedPic.activity}</span>
                <span>•</span>
                <span>{selectedPic.season !== 'All' ? t(`pics.season.${selectedPic.season}`) : selectedPic.season}</span>
                {selectedPic.timeOfDay && (
                  <>
                    <span>•</span>
                    <span>{selectedPic.timeOfDay !== 'All' ? t(`pics.time.${selectedPic.timeOfDay}`) : selectedPic.timeOfDay}</span>
                  </>
                )}
              </div>

              {selectedPic.tags && selectedPic.tags.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-white/40 text-[11px] font-bold uppercase tracking-widest mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPic.tags.map((tag, idx) => (
                      <span key={idx} className="bg-white/10 text-white/80 text-[12px] font-medium px-3 py-1.5 rounded-lg">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto pt-6">
                <button 
                  onClick={() => handleDownload(selectedPic.imageUrl, selectedPic.title || selectedPic.id)}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:scale-95 text-on-primary py-4 rounded-[16px] transition-all font-bold text-[16px] shadow-xl shadow-primary/20"
                >
                  <span className="material-symbols-outlined !text-[24px]">download</span>
                  {t('pics.download_original')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
