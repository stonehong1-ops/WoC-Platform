'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stay, StayLike } from '@/types/stay';
import { stayService } from '@/lib/firebase/stayService';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useLanguage } from '@/contexts/LanguageContext';

interface StayWishlistTrayProps {
  likes: StayLike[];
  userId: string;
  onStayClick: (stayId: string) => void;
  stays: Stay[]; // 부모가 기확보한 모든 숙소 목록
}

type TrayState = 'COLLAPSED' | 'EXPANDED';

export default function StayWishlistTray({ likes, userId, onStayClick, stays }: StayWishlistTrayProps) {
  const { t } = useLanguage();
  const [trayState, setTrayState] = useState<TrayState>('COLLAPSED');
  const [likedStays, setLikedStays] = useState<Stay[]>([]);
  const [loadingStays, setLoadingStays] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isHeaderVisible } = useNavigation();

  // 2단계 리팩토링: 데이터베이스 추가 개별 조회를 100% 제거하고 부모 기확보 데이터를 동기식 정적 매칭하여 0ms 렌더링
  useEffect(() => {
    if (likes.length === 0) {
      setLikedStays([]);
      return;
    }

    // 부모로부터 주입된 stays 배열에서 likes에 해당하는 객체들만 동기 필터링 매칭
    const validStays = likes
      .map(like => {
        const found = stays.find(s => s.id === like.stayId);
        return found ? { ...found, _likeStatus: like.status } : null;
      })
      .filter((s): s is Stay & { _likeStatus: 'liked' | 'pending' | 'in_progress' | undefined } => s !== null);

    // 우선순위 정렬: in_progress -> pending -> liked
    validStays.sort((a, b) => {
      const getPriority = (status: string | undefined) => {
        if (status === 'in_progress') return 1;
        if (status === 'pending') return 2;
        return 3;
      };
      return getPriority(a._likeStatus) - getPriority(b._likeStatus);
    });

    setLikedStays(validStays);
    setLoadingStays(false);
  }, [likes, stays]);

  const handleUnlike = async (e: React.MouseEvent, stayId: string) => {
    e.stopPropagation();
    try {
      await stayService.toggleLike(userId, stayId);
    } catch (err) {
      console.error('Failed to unlike:', err);
    }
  };

  const handleClearAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to clear your wishlist?')) return;
    try {
      await stayService.clearAllLikes(userId);
      setTrayState('COLLAPSED');
    } catch (err) {
      console.error('Failed to clear likes:', err);
    }
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTrayState(prev => prev === 'EXPANDED' ? 'COLLAPSED' : 'EXPANDED');
  };

  const isExpanded = trayState === 'EXPANDED';

  // Hide tray when no likes
  if (likes.length === 0) return null;

  return (
    <>
      {/* ===== Standardized Floating FAB Tray (Premium Pattern) ===== */}
      <div 
        className="fixed inset-x-0 z-[60] px-6 w-full max-w-sm mx-auto pointer-events-none flex justify-center"
        style={{ 
          bottom: 'calc(64px + max(env(safe-area-inset-bottom), 12px) + 3mm)',
          transform: 'translateY(var(--woc-bottom-nav-y, 0px))',
          transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
        <motion.div 
          animate={{ 
            height: isExpanded ? 'auto' : '64px', 
            opacity: isHeaderVisible ? 1 : 0 
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          initial={false}
          className="w-full max-w-sm bg-white/95 backdrop-blur-3xl rounded-xl shadow-[0_24px_48px_rgba(0,0,0,0.12)] flex flex-col border border-white/60 overflow-hidden pointer-events-auto"
          onClick={() => !isExpanded && setTrayState('EXPANDED')}
        >
          {/* ===== Top Row / Summary Bar (Unified Standard) ===== */}
          <div className={`px-6 flex items-center justify-between py-3 cursor-pointer ${isExpanded ? 'border-b border-slate-100' : ''}`}>
            <div className="flex items-center">
              {/* Expand/Collapse toggle */}
              <div 
                onClick={handleToggleExpand}
                className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center transition-colors hover:bg-slate-200"
              >
                <span className="material-symbols-rounded text-primary text-xl">
                  {isExpanded ? 'expand_more' : 'expand_less'}
                </span>
              </div>

              <span className="text-sm text-slate-800 font-bold ml-3 tracking-wide">
                {likes.length === 0 ? t('common.no_activity') : (
                  <>
                    {likes.filter(l => l.status === 'in_progress').length > 0 && (
                      <span className="text-blue-500">{likes.filter(l => l.status === 'in_progress').length}{t('common.in_progress_count')}</span>
                    )}
                    {likes.filter(l => l.status === 'pending').length > 0 && (
                      <span className="text-primary">{likes.filter(l => l.status === 'pending').length}{t('common.pending_count')}</span>
                    )}
                    {likes.filter(l => l.status !== 'pending' && l.status !== 'in_progress').length}{t('common.liked')}
                  </>
                )}
              </span>
            </div>

            {/* Right side: Avatars + Actions */}
            <div className="flex items-center gap-4">
              {/* Collapsed state: Avatars */}
              {!isExpanded && likedStays.length > 0 && (
                <div className="flex -space-x-2">
                  {likedStays.slice(0, 3).map((stay, i) => (
                    <div 
                      key={stay.id} 
                      className={`w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden relative ${
                        (stay as any)._likeStatus === 'in_progress' ? 'ring-2 ring-blue-500 ring-offset-1' :
                        (stay as any)._likeStatus === 'pending' ? 'ring-2 ring-primary ring-offset-1' : ''
                      }`}
                      style={{ zIndex: 3 - i }}
                    >
                      {stay.images?.[0] ? (
                        <img src={stay.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-200">
                          <span className="material-symbols-rounded text-[14px] text-slate-400">image</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {likedStays.length > 3 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold z-0">
                      +{likedStays.length - 3}
                    </div>
                  )}
                </div>
              )}

              {/* Expanded state: Clear All */}
              {isExpanded && (
                <button
                  onClick={handleClearAll}
                  className="text-[12px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                >
                  {t('common.clear_all')}
                </button>
              )}


            </div>
          </div>

          {/* ===== Expanded List Area (Standardized Vertical List) ===== */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="max-h-[300px] overflow-y-auto no-scrollbar pb-2"
                ref={scrollRef}
              >
                {loadingStays ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {likedStays.map(stay => {
                      const status = (stay as any)._likeStatus;
                      return (
                        <div 
                          key={stay.id}
                          onClick={() => onStayClick(stay.id)}
                          className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group border border-transparent hover:border-slate-100"
                        >
                          <div className="relative">
                            <div className={`w-14 h-14 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 ${
                              status === 'in_progress' ? 'ring-2 ring-blue-500 ring-offset-2' :
                              status === 'pending' ? 'ring-2 ring-primary ring-offset-2' : ''
                            }`}>
                              {stay.images?.[0] ? (
                                <img src={stay.images[0]} alt={stay.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  <span className="material-symbols-rounded text-xl">image</span>
                                </div>
                              )}
                            </div>
                            
                            {status === 'in_progress' && (
                              <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shadow-sm">
                                {t('common.badge_in_progress')}
                              </div>
                            )}
                            {status === 'pending' && (
                              <div className="absolute -top-2 -right-2 bg-primary text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shadow-sm">
                                {t('common.badge_pending')}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-primary transition-colors">
                              {stay.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                                ₩{stay.pricing?.baseRate?.toLocaleString() || '0'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium truncate">
                                {stay.location?.district || stay.location?.address || 'Location'}
                              </span>
                            </div>
                          </div>
                          
                          <button 
                            onClick={(e) => handleUnlike(e, stay.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                          >
                            <span className="material-symbols-rounded text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                              favorite
                            </span>
                          </button>
                        </div>
                      );
                    })}
                    {likedStays.length === 0 && (
                      <div className="py-6 text-center text-slate-400 text-[13px] font-medium">
                        {t('common.no_activity_found')}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Backdrop for expanded state */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setTrayState('COLLAPSED')}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30"
          />
        )}
      </AnimatePresence>
    </>
  );
}
