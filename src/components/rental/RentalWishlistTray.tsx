'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RentalSpace, RentalLike } from '@/types/rental';
import { rentalService } from '@/lib/firebase/rentalService';

interface RentalWishlistTrayProps {
  likes: RentalLike[];
  userId: string;
  onSpaceClick: (spaceId: string) => void;
}

type TrayState = 'HIDDEN' | 'COLLAPSED' | 'EXPANDED';

export default function RentalWishlistTray({ likes, userId, onSpaceClick }: RentalWishlistTrayProps) {
  const [trayState, setTrayState] = useState<TrayState>('HIDDEN');
  const [likedSpaces, setLikedSpaces] = useState<RentalSpace[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Determine tray state from likes count
  useEffect(() => {
    if (likes.length === 0) {
      setTrayState('HIDDEN');
    } else if (trayState === 'HIDDEN') {
      setTrayState('COLLAPSED');
    }
  }, [likes.length]);

  // Fetch stay details for liked items
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
      setLikedSpaces(spaces.filter((s): s is RentalSpace => s !== null));
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
    if (!confirm('찜 목록을 모두 비우시겠어요?')) return;
    try {
      await rentalService.clearAllLikes(userId);
      setTrayState('HIDDEN');
    } catch (err) {
      console.error('Failed to clear likes:', err);
    }
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTrayState(prev => prev === 'EXPANDED' ? 'COLLAPSED' : 'EXPANDED');
  };

  if (trayState === 'HIDDEN') return null;

  const isExpanded = trayState === 'EXPANDED';

  return (
    <>
      {/* ===== Map-style Floating FAB Tray ===== */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-sm z-40 pointer-events-auto">
        <motion.div 
          animate={{ height: isExpanded ? 'auto' : '56px', y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          initial={{ y: 100, opacity: 0 }}
          className="bg-white/95 backdrop-blur-3xl rounded-xl shadow-[0_24px_48px_rgba(0,0,0,0.12)] flex flex-col border border-white/60 overflow-hidden"
          onClick={() => !isExpanded && setTrayState('EXPANDED')}
        >
          {/* ===== Top Row / Summary Bar ===== */}
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

              {isExpanded ? (
                /* Expanded: header text */
                <span className="text-sm text-slate-800 font-bold ml-3 tracking-wide">
                  {likes.length} Liked Spaces
                </span>
              ) : (
                /* Collapsed: count summary */
                <span className="text-sm text-slate-800 font-bold ml-3 tracking-wide">
                  {likes.length} LIKED
                </span>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {isExpanded && (
                <button
                  onClick={handleClearAll}
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
                >
                  Clear all
                </button>
              )}
              <div className="h-5 w-[1px] bg-slate-200"></div>
              <button 
                onClick={handleToggleExpand}
                className="flex items-center justify-center text-primary active:scale-90 transition-transform"
              >
                <span className="material-symbols-rounded text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  favorite
                </span>
              </button>
            </div>
          </div>

          {/* ===== Expanded Card List (snap-x scroll) ===== */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                ref={scrollRef}
                className="flex items-center overflow-x-auto px-6 gap-4 no-scrollbar snap-x snap-mandatory py-4 h-[130px]"
              >
                {likedSpaces.length > 0 ? (
                  likedSpaces.map((space) => (
                    <div 
                      key={space.id}
                      onClick={() => onSpaceClick(space.id)}
                      className="flex-none w-[calc(100%-24px)] bg-white rounded-lg p-2 shadow-sm border border-slate-50 flex gap-3 relative snap-center cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                    >
                      {/* Space image */}
                      <div className="w-16 h-16 rounded bg-slate-100 flex-none overflow-hidden">
                        {space.images?.[0] ? (
                          <img 
                            src={space.images[0]} 
                            className="w-full h-full object-cover" 
                            alt={space.title} 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <span className="material-symbols-rounded text-xl">image</span>
                          </div>
                        )}
                      </div>

                      {/* Space info */}
                      <div className="flex flex-col min-w-0 pr-8 justify-center">
                        <span className="text-[10px] font-bold text-primary bg-primary/10 w-fit px-1.5 py-0.5 rounded mb-1 uppercase">
                          {space.category}
                        </span>
                        <h3 className="text-[17px] font-bold text-on-background truncate leading-tight">
                          {space.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium flex items-center gap-1">
                          {space.location && <span>{space.location}</span>}
                          {space.pricePerHour && (
                            <>
                              <span className="text-[10px]">•</span>
                              <span>₩{space.pricePerHour.toLocaleString()}/hour</span>
                            </>
                          )}
                        </p>
                      </div>

                      {/* Unlike button */}
                      <button 
                        onClick={(e) => handleUnlike(e, space.id)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-rounded text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>heart_minus</span>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-slate-400 text-xs font-medium">
                    {loadingSpaces ? 'Loading...' : 'No liked spaces'}
                  </div>
                )}
                {/* Visual nudge for next card */}
                <div className="flex-none w-10 h-1" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* No-scrollbar CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </>
  );
}
