'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RentalSpace, RentalLike } from '@/types/rental';
import { rentalService } from '@/lib/firebase/rentalService';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useLanguage } from '@/contexts/LanguageContext';

interface RentalWishlistTrayProps {
  likes: RentalLike[];
  userId: string;
  onSpaceClick: (spaceId: string) => void;
}

type TrayState = 'COLLAPSED' | 'EXPANDED';

export default function RentalWishlistTray({ likes, userId, onSpaceClick }: RentalWishlistTrayProps) {
  const { t } = useLanguage();
  const [trayState, setTrayState] = useState<TrayState>('COLLAPSED');
  const [likedSpaces, setLikedSpaces] = useState<RentalSpace[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isHeaderVisible } = useNavigation();

  // Fetch space details for liked items
  useEffect(() => {
    if (likes.length === 0) {
      setLikedSpaces([]);
      return;
    }

    const fetchSpaces = async () => {
      setLoadingSpaces(true);
      const spaces = await Promise.all(
        likes.map(like => rentalService.getSpace(like.spaceId))
      );
      
      // Filter out nulls and attach status
      const validSpaces = spaces
        .map((s, i) => (s ? { ...s, _likeStatus: likes[i].status || 'liked' } : null))
        .filter((s): s is RentalSpace & { _likeStatus: 'liked' | 'pending' | 'in_progress' } => s !== null);
      
      // Sort: in_progress first, then pending, then liked
      validSpaces.sort((a, b) => {
        const getPriority = (status: string) => {
          if (status === 'in_progress') return 1;
          if (status === 'pending') return 2;
          return 3;
        };
        return getPriority(a._likeStatus) - getPriority(b._likeStatus);
      });
      
      setLikedSpaces(validSpaces);
      setLoadingSpaces(false);
    };

    fetchSpaces();
  }, [likes]);

  const handleUnlike = async (e: React.MouseEvent, spaceId: string) => {
    e.stopPropagation();
    try {
      await rentalService.toggleLike(userId, spaceId);
    } catch (err) {
      console.error('Failed to unlike:', err);
    }
  };

  const handleClearAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Clear all items from your wishlist?')) return;
    try {
      await rentalService.clearAllLikes(userId);
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
          {/* Top Row / Summary Bar */}
          <div className={`px-6 flex items-center justify-between py-3 cursor-pointer ${isExpanded ? 'border-b border-slate-100' : ''}`}>
            <div className="flex items-center">
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

            <div className="flex items-center gap-4">
              {isExpanded && (
                <button
                  onClick={handleClearAll}
                  className="text-[12px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                >
                  {t('common.clear_all')}
                </button>
              )}
              {!isExpanded && (
                <div className="flex -space-x-2">
                  {likedSpaces.slice(0, 3).map((s, i) => (
                    <div 
                      key={s.id} 
                      className={`w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden relative ${
                        (s as any)._likeStatus === 'in_progress' ? 'ring-2 ring-blue-500 ring-offset-1' :
                        (s as any)._likeStatus === 'pending' ? 'ring-2 ring-primary ring-offset-1' : ''
                      }`}
                      style={{ zIndex: 3 - i }}
                    >
                      {s.images?.[0] ? (
                        <img src={s.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-200">
                          <span className="material-symbols-rounded text-[14px] text-slate-400">image</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {likedSpaces.length > 3 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold z-0">
                      +{likedSpaces.length - 3}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Expanded List Area */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="max-h-[300px] overflow-y-auto no-scrollbar pb-2"
                ref={scrollRef}
              >
                {loadingSpaces ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {likedSpaces.map(space => {
                      const status = (space as any)._likeStatus;
                      return (
                        <div 
                          key={space.id}
                          onClick={() => onSpaceClick(space.id)}
                          className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group border border-transparent hover:border-slate-100"
                        >
                          <div className="relative">
                            <div className={`w-14 h-14 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 ${
                              status === 'in_progress' ? 'ring-2 ring-blue-500 ring-offset-2' :
                              status === 'pending' ? 'ring-2 ring-primary ring-offset-2' : ''
                            }`}>
                              {space.images?.[0] ? (
                                <img src={space.images[0]} alt={space.title} className="w-full h-full object-cover" />
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
                              {space.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-black text-slate-900">
                                ₩{space.pricePerHour.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium truncate">
                                {space.studioName || space.location}
                              </span>
                            </div>
                          </div>
                          
                          <button 
                            onClick={(e) => handleUnlike(e, space.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                          >
                            <span className="material-symbols-rounded text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                              favorite
                            </span>
                          </button>
                        </div>
                      );
                    })}
                    {likedSpaces.length === 0 && (
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
