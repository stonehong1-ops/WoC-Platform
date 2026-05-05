'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LostFoundItem, LostFoundLike } from '@/types/lostFound';
import { lostFoundService } from '@/lib/firebase/lostFoundService';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useLanguage } from '@/contexts/LanguageContext';

interface LostFoundWishlistTrayProps {
  likes: LostFoundLike[];
  userId: string;
  onItemClick: (itemId: string) => void;
}

type TrayState = 'COLLAPSED' | 'EXPANDED';

export default function LostFoundWishlistTray({ likes, userId, onItemClick }: LostFoundWishlistTrayProps) {
  const [trayState, setTrayState] = useState<TrayState>('COLLAPSED');
  const { t } = useLanguage();
  const [likedItems, setLikedItems] = useState<LostFoundItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isHeaderVisible } = useNavigation();

  // Fetch item details for liked items
  useEffect(() => {
    if (likes.length === 0) {
      setLikedItems([]);
      return;
    }

    const fetchItems = async () => {
      setLoadingItems(true);
      const items = await Promise.all(
        likes.map(like => lostFoundService.getItem(like.itemId))
      );
      
      // Filter out nulls and attach status
      const validItems = items
        .map((item, i) => (item ? { ...item, _likeStatus: likes[i].status || 'liked' } : null))
        .filter((item): item is LostFoundItem & { _likeStatus: 'liked' | 'pending' | 'in_progress' } => item !== null);
      
      // Sort: in_progress first, then pending, then liked
      validItems.sort((a, b) => {
        const getPriority = (status: string) => {
          if (status === 'in_progress') return 1;
          if (status === 'pending') return 2;
          return 3;
        };
        return getPriority(a._likeStatus) - getPriority(b._likeStatus);
      });
      
      setLikedItems(validItems);
      setLoadingItems(false);
    };

    fetchItems();
  }, [likes]);

  const handleUnlike = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    try {
      await lostFoundService.toggleLike(userId, itemId);
    } catch (err) {
      console.error('Failed to unlike:', err);
    }
  };

  const handleClearAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t('shop.confirm_clear_likes'))) return;
    try {
      await lostFoundService.clearAllLikes(userId);
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
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-sm z-[60] pointer-events-auto">
        <motion.div 
          animate={{ 
            height: isExpanded ? 'auto' : '64px', 
            y: isHeaderVisible ? 0 : 120, 
            opacity: isHeaderVisible ? 1 : 0 
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          initial={false}
          className="bg-white/95 backdrop-blur-3xl rounded-xl shadow-[0_24px_48px_rgba(0,0,0,0.12)] flex flex-col border border-white/60 overflow-hidden"
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
                {likes.length === 0 ? t('shop.no_activity') : (
                  <>
                    {likes.filter(l => l.status === 'in_progress').length > 0 && (
                      <span className="text-blue-500">{likes.filter(l => l.status === 'in_progress').length} {t('shop.in_progress')}, </span>
                    )}
                    {likes.filter(l => l.status === 'pending').length > 0 && (
                      <span className="text-primary">{likes.filter(l => l.status === 'pending').length} {t('shop.pending')}, </span>
                    )}
                    {likes.filter(l => l.status !== 'pending' && l.status !== 'in_progress').length} {t('shop.liked')}
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
                  {t('shop.clear_all')}
                </button>
              )}
              {!isExpanded && (
                <div className="flex -space-x-2">
                  {likedItems.slice(0, 3).map((item, i) => (
                    <div 
                      key={item.id} 
                      className={`w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden relative ${
                        (item as any)._likeStatus === 'in_progress' ? 'ring-2 ring-blue-500 ring-offset-1' :
                        (item as any)._likeStatus === 'pending' ? 'ring-2 ring-primary ring-offset-1' : ''
                      }`}
                      style={{ zIndex: 3 - i }}
                    >
                      {item.images?.[0] ? (
                        <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-200">
                          <span className="material-symbols-rounded text-[14px] text-slate-400">image</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {likedItems.length > 3 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold z-0">
                      +{likedItems.length - 3}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Expanded Card Scroll Area (Horizontal — Map FAB Style) */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center overflow-x-auto px-4 gap-3 no-scrollbar snap-x snap-mandatory py-3 h-[130px]"
                ref={scrollRef}
              >
                {loadingItems ? (
                  <div className="flex justify-center items-center w-full">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : likedItems.length > 0 ? (
                  <>
                    {likedItems.map(item => {
                      const status = (item as any)._likeStatus;
                      return (
                        <div 
                          key={item.id}
                          onClick={() => onItemClick(item.id)}
                          className={`flex-none w-[calc(100%-24px)] bg-white rounded-lg p-2 shadow-sm border flex gap-3 relative snap-center transition-all cursor-pointer ${
                            status === 'in_progress' ? 'border-blue-200 ring-1 ring-blue-100' :
                            status === 'pending' ? 'border-primary/20 ring-1 ring-primary/10' : 'border-slate-50'
                          }`}
                        >
                          <div className="w-16 h-16 rounded-lg bg-slate-100 flex-none overflow-hidden">
                            {item.images?.[0] ? (
                              <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <span className="material-symbols-rounded text-xl">image</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0 pr-8 justify-center flex-1">
                            {status && status !== 'liked' && (
                              <span className={`text-[9px] font-black uppercase tracking-widest w-fit px-1.5 py-0.5 rounded mb-1 ${
                                status === 'in_progress' ? 'bg-blue-500 text-white' : 'bg-primary text-white'
                              }`}>
                                {status === 'in_progress' ? t('shop.status_in_progress') : t('shop.status_pending')}
                              </span>
                            )}
                            <h3 className="text-[14px] font-bold text-slate-800 truncate leading-tight">
                              {item.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${item.type === 'LOST' ? 'bg-red-50 text-red-500' : 'bg-primary/10 text-primary'}`}>
                                {item.type}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium truncate">
                                {item.location}
                              </span>
                            </div>
                          </div>
                          
                          {/* Unlike Button — Always visible */}
                          <button 
                            onClick={(e) => handleUnlike(e, item.id)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <span className="material-symbols-rounded text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              favorite
                            </span>
                          </button>
                        </div>
                      );
                    })}
                    <div className="flex-none w-6 h-1" />
                  </>
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-slate-400 text-xs font-medium">
                    {t('shop.no_activity_found')}
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
