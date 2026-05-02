'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResaleItem, ResaleLike } from '@/types/resale';
import { resaleService } from '@/lib/firebase/resaleService';

interface ResaleWishlistTrayProps {
  likes: ResaleLike[];
  userId: string;
  onProductClick: (productId: string) => void;
  onAddClick?: () => void;
}

type TrayState = 'COLLAPSED' | 'EXPANDED';

export default function ResaleWishlistTray({ likes, userId, onProductClick, onAddClick }: ResaleWishlistTrayProps) {
  const [trayState, setTrayState] = useState<TrayState>('COLLAPSED');
  const [likedProducts, setLikedProducts] = useState<ResaleItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Tray is always at least collapsed so the Add button is visible.
  useEffect(() => {
    if (likes.length > 0 && trayState === 'EXPANDED') {
      // Keep it expanded if it already is
    }
  }, [likes.length]);

  // Fetch product details for liked items
  useEffect(() => {
    if (likes.length === 0) {
      setLikedProducts([]);
      return;
    }

    const fetchProducts = async () => {
      setLoadingProducts(true);
      const products = await Promise.all(
        likes.map(like => resaleService.getItem(like.itemId))
      );
      
      // Filter out nulls and attach status
      const validProducts = products
        .map((p, i) => (p ? { ...p, _likeStatus: likes[i].status } : null))
        .filter((p): p is ResaleItem & { _likeStatus: 'liked' | 'pending' | 'in_progress' | undefined } => p !== null);
      
      // Sort: in_progress first, then pending, then liked
      validProducts.sort((a, b) => {
        const getPriority = (status: string | undefined) => {
          if (status === 'in_progress') return 1;
          if (status === 'pending') return 2;
          return 3;
        };
        return getPriority(a._likeStatus) - getPriority(b._likeStatus);
      });
      
      setLikedProducts(validProducts);
      setLoadingProducts(false);
    };

    fetchProducts();
  }, [likes]);

  const handleUnlike = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    try {
      await resaleService.toggleLike(userId, productId);
    } catch (err) {
      console.error('Failed to unlike:', err);
    }
  };

  const handleClearAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('찜 목록을 모두 비우시겠어요?')) return;
    try {
      await resaleService.clearAllLikes(userId);
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

  return (
    <>
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-sm z-40 pointer-events-auto">
        <motion.div 
          animate={{ height: isExpanded ? 'auto' : '56px', y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          initial={{ y: 100, opacity: 0 }}
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

              {isExpanded ? (
                <span className="text-sm text-slate-800 font-bold ml-3 tracking-wide">
                  {likes.length === 0 ? 'No Activity' : (
                    <>
                      {likes.filter(l => l.status === 'in_progress').length > 0 && (
                        <span className="text-blue-500">{likes.filter(l => l.status === 'in_progress').length} IN PROGRESS, </span>
                      )}
                      {likes.filter(l => l.status === 'pending').length > 0 && (
                        <span className="text-primary">{likes.filter(l => l.status === 'pending').length} PENDING, </span>
                      )}
                      {likes.filter(l => l.status !== 'pending' && l.status !== 'in_progress').length} LIKED ITEMS
                    </>
                  )}
                </span>
              ) : (
                <span className="text-sm text-slate-800 font-bold ml-3 tracking-wide">
                  {likes.length === 0 ? 'No Activity' : (
                    <>
                      {likes.filter(l => l.status === 'in_progress').length > 0 && (
                        <span className="text-blue-500">{likes.filter(l => l.status === 'in_progress').length} IN PROGRESS, </span>
                      )}
                      {likes.filter(l => l.status === 'pending').length > 0 && (
                        <span className="text-primary">{likes.filter(l => l.status === 'pending').length} PENDING, </span>
                      )}
                      {likes.filter(l => l.status !== 'pending' && l.status !== 'in_progress').length} LIKED
                    </>
                  )}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {isExpanded && (
                <button
                  onClick={handleClearAll}
                  className="text-[12px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                >
                  Clear All
                </button>
              )}
              {!isExpanded && (
                <div className="flex -space-x-2">
                  {likedProducts.slice(0, 3).map((p, i) => (
                    <div 
                      key={p.id} 
                      className={`w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden relative ${
                        (p as any)._likeStatus === 'in_progress' ? 'ring-2 ring-blue-500 ring-offset-1' :
                        (p as any)._likeStatus === 'pending' ? 'ring-2 ring-primary ring-offset-1' : ''
                      }`}
                      style={{ zIndex: 3 - i }}
                    >
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-200">
                          <span className="material-symbols-rounded text-[14px] text-slate-400">image</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {likedProducts.length > 3 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold z-0">
                      +{likedProducts.length - 3}
                    </div>
                  )}
                </div>
              )}
              
              {/* PLUS BUTTON ADDED HERE */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddClick?.();
                }}
                className="h-9 px-4 rounded-full bg-primary text-white flex items-center justify-center gap-1 shadow-md hover:scale-105 active:scale-95 transition-all ml-1"
              >
                <span className="font-bold text-xs tracking-wider">ADD</span>
                <span className="material-symbols-rounded text-[18px]">add</span>
              </button>
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
                {loadingProducts ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {likedProducts.map(product => {
                      const status = (product as any)._likeStatus;
                      return (
                        <div 
                          key={product.id}
                          onClick={() => onProductClick(product.id)}
                          className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group border border-transparent hover:border-slate-100"
                        >
                          <div className="relative">
                            <div className={`w-14 h-14 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 ${
                              status === 'in_progress' ? 'ring-2 ring-blue-500 ring-offset-2' :
                              status === 'pending' ? 'ring-2 ring-primary ring-offset-2' : ''
                            }`}>
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  <span className="material-symbols-rounded text-xl">image</span>
                                </div>
                              )}
                            </div>
                            
                            {status === 'in_progress' && (
                              <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shadow-sm">
                                IN PROG
                              </div>
                            )}
                            {status === 'pending' && (
                              <div className="absolute -top-2 -right-2 bg-primary text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shadow-sm">
                                PEND
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-primary transition-colors">
                              {product.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-black text-slate-900">
                                ₩{product.price.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium truncate">
                                {product.location}
                              </span>
                            </div>
                          </div>
                          
                          <button 
                            onClick={(e) => handleUnlike(e, product.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                          >
                            <span className="material-symbols-rounded text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                              favorite
                            </span>
                          </button>
                        </div>
                      );
                    })}
                    {likedProducts.length === 0 && (
                      <div className="py-6 text-center text-slate-400 text-[13px] font-medium">
                        No activity yet.
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
