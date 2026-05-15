'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { picService } from '@/services/picService';
import { Pic } from '@/types/pic';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

const MOODS = ['All', 'Romantic', 'Vibrant', 'Chill', 'Energetic', 'Moody', 'Elegant', 'Warm', 'Calm'];
const ACTIVITIES = ['All', 'Social', 'Dining', 'Explore', 'Relax', 'Party', 'Learn', 'Exercise'];
const SEASONS = ['All', 'Spring', 'Summer', 'Autumn', 'Winter'];
const TIMES = ['All', 'Morning', 'Afternoon', 'Evening', 'Night'];


export default function PicsPage() {
  const { t } = useLanguage();
  
  const [pics, setPics] = useState<Pic[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  
  const [activeMood, setActiveMood] = useState('All');
  const [activeActivity, setActiveActivity] = useState('All');
  const [activeSeason, setActiveSeason] = useState('All');
  const [activeTime, setActiveTime] = useState('All');

  
  const [selectedPic, setSelectedPic] = useState<Pic | null>(null);

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
    <div className="min-h-screen bg-[#FAF8FF]">
      <Header />
      <div className="pt-24 pb-28 px-4 sm:px-6 max-w-[1600px] mx-auto">
        <div className="mb-12 text-center">
          <h1 className="font-display text-[42px] font-black text-on-surface tracking-tight leading-none mb-4 uppercase">
            PICS
          </h1>
          <p className="text-on-surface/50 font-medium max-w-xl mx-auto text-[15px] leading-relaxed">
            Explore our curated visual library. A collection of high-quality, aesthetic assets designed to elevate your community experience. Free to download.
          </p>
        </div>

        {/* Filters */}
        <div className="sticky top-16 z-30 bg-[#FAF8FF]/90 backdrop-blur-xl pt-4 pb-6 mb-8 border-b border-on-surface/[0.04]">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <span className="text-[12px] font-bold text-on-surface/40 uppercase tracking-widest mr-2 shrink-0">Mood</span>
              {MOODS.map(mood => (
                <button
                  key={mood}
                  onClick={() => setActiveMood(mood)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${activeMood === mood ? 'bg-primary text-on-primary shadow-md' : 'bg-surface border border-on-surface/10 text-on-surface/60 hover:bg-on-surface/5'}`}
                >
                  {mood}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <span className="text-[12px] font-bold text-on-surface/40 uppercase tracking-widest mr-2 shrink-0">Activity</span>
              {ACTIVITIES.map(activity => (
                <button
                  key={activity}
                  onClick={() => setActiveActivity(activity)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${activeActivity === activity ? 'bg-primary text-on-primary shadow-md' : 'bg-surface border border-on-surface/10 text-on-surface/60 hover:bg-on-surface/5'}`}
                >
                  {activity}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <span className="text-[12px] font-bold text-on-surface/40 uppercase tracking-widest mr-2 shrink-0">Season</span>
              {SEASONS.map(season => (
                <button
                  key={season}
                  onClick={() => setActiveSeason(season)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${activeSeason === season ? 'bg-primary text-on-primary shadow-md' : 'bg-surface border border-on-surface/10 text-on-surface/60 hover:bg-on-surface/5'}`}
                >
                  {season}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <span className="text-[12px] font-bold text-on-surface/40 uppercase tracking-widest mr-2 shrink-0">Time</span>
              {TIMES.map(time => (
                <button
                  key={time}
                  onClick={() => setActiveTime(time)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${activeTime === time ? 'bg-primary text-on-primary shadow-md' : 'bg-surface border border-on-surface/10 text-on-surface/60 hover:bg-on-surface/5'}`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

        </div>

        {loading && pics.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-[13px] font-bold text-on-surface/40 uppercase tracking-[0.2em]">Loading Assets</p>
          </div>
        ) : pics.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-on-surface/30 py-32 bg-surface rounded-[32px] border border-on-surface/[0.03]">
            <span className="material-symbols-outlined text-[64px] mb-4 opacity-50">wallpaper</span>
            <p className="text-[16px] font-bold tracking-tight">No assets found.</p>
            <p className="text-[13px] mt-2 font-medium opacity-70">Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
              {pics.map((pic) => (
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
              ))}
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
              <div className="text-center mt-12 mb-8">
                <p className="text-on-surface/30 font-bold text-[13px] uppercase tracking-widest">End of Collection</p>
              </div>
            )}
          </>
        )}
      </div>

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
                <span>{selectedPic.mood}</span>
                <span>•</span>
                <span>{selectedPic.activity}</span>
                <span>•</span>
                <span>{selectedPic.season}</span>
                {selectedPic.timeOfDay && (
                  <>
                    <span>•</span>
                    <span>{selectedPic.timeOfDay}</span>
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
                  Download Original
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
