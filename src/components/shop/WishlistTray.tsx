'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, ProductLike } from '@/types/shop';
import { shopService } from '@/lib/firebase/shopService';

interface WishlistTrayProps {
  likes: ProductLike[];
  userId: string;
  onProductClick: (productId: string) => void;
}

type TrayState = 'HIDDEN' | 'COLLAPSED' | 'EXPANDED';

export default function WishlistTray({ likes, userId, onProductClick }: WishlistTrayProps) {
  const [trayState, setTrayState] = useState<TrayState>('HIDDEN');
  const [likedProducts, setLikedProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Determine tray state from likes count
  useEffect(() => {
    if (likes.length === 0) {
      setTrayState('HIDDEN');
    } else if (trayState === 'HIDDEN') {
      setTrayState('COLLAPSED');
    }
    // If already COLLAPSED or EXPANDED, keep that state
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
        likes.map(like => shopService.getProduct(like.productId))
      );
      
      // Filter out nulls and attach status
      const validProducts = products
        .map((p, i) => (p ? { ...p, _likeStatus: likes[i].status } : null))
        .filter((p): p is Product & { _likeStatus: 'liked' | 'pending' | 'in_progress' | undefined } => p !== null);
      
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
      await shopService.toggleLike(userId, productId);
    } catch (err) {
      console.error('Failed to unlike:', err);
    }
  };

  const handleClearAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('찜 목록을 모두 비우시겠어요?')) return;
    try {
      await shopService.clearAllLikes(userId);
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
      {/* Position: identical to MapComponent.tsx L464 */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-sm z-40 pointer-events-auto">
        <motion.div 
          animate={{ height: isExpanded ? 'auto' : '56px', y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          initial={{ y: 100, opacity: 0 }}
          className="bg-white/95 backdrop-blur-3xl rounded-xl shadow-[0_24px_48px_rgba(0,0,0,0.12)] flex flex-col border border-white/60 overflow-hidden"
          onClick={() => !isExpanded && setTrayState('EXPANDED')}
        >
          {/* ===== Top Row / Summary Bar (Map L506 pattern) ===== */}
          <div className={`px-6 flex items-center justify-between py-3 cursor-pointer ${isExpanded ? 'border-b border-slate-100' : ''}`}>
            <div className="flex items-center">
              {/* Expand/Collapse toggle — Map L508-518 */}
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
                  {likes.filter(l => l.status === 'in_progress').length > 0 && (
                    <span className="text-blue-500">{likes.filter(l => l.status === 'in_progress').length} In Progress, </span>
                  )}
                  {likes.filter(l => l.status === 'pending').length > 0 && (
                    <span className="text-primary">{likes.filter(l => l.status === 'pending').length} Pending, </span>
                  )}
                  {likes.filter(l => l.status !== 'pending' && l.status !== 'in_progress').length} Liked Items
                </span>
              ) : (
                /* Collapsed: count summary */
                <span className="text-sm text-slate-800 font-bold ml-3 tracking-wide uppercase">
                  {likes.filter(l => l.status === 'in_progress').length > 0 && (
                    <span className="text-blue-500">{likes.filter(l => l.status === 'in_progress').length} IN PROGRESS, </span>
                  )}
                  {likes.filter(l => l.status === 'pending').length > 0 && (
                    <span className="text-primary">{likes.filter(l => l.status === 'pending').length} PENDING, </span>
                  )}
                  {likes.filter(l => l.status !== 'pending' && l.status !== 'in_progress').length} LIKED
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
            </div>
          </div>

          {/* ===== Expanded Card List (snap-x scroll, Map L552-663 pattern) ===== */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                ref={scrollRef}
                className="flex items-center overflow-x-auto px-6 gap-4 no-scrollbar snap-x snap-mandatory py-4 h-[130px]"
              >
                {likedProducts.length > 0 ? (
                  likedProducts.map((product) => (
                    <div 
                      key={product.id}
                      onClick={() => onProductClick(product.id)}
                      className="flex-none w-[calc(100%-24px)] bg-white rounded-lg p-2 shadow-sm border border-slate-50 flex gap-3 relative snap-center cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                    >
                      {/* Product image — Map L569-577 sizing */}
                      <div className="w-16 h-16 rounded bg-slate-100 flex-none overflow-hidden">
                        {product.images?.[0] || product.imageUrl ? (
                          <img 
                            src={product.images?.[0] || product.imageUrl} 
                            className="w-full h-full object-cover" 
                            alt={product.name} 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <span className="material-symbols-rounded text-xl">image</span>
                          </div>
                        )}
                      </div>

                      {/* Product info — Map L578-588 pattern */}
                      <div className="flex flex-col min-w-0 pr-8 justify-center">
                        {(product as any)._likeStatus === 'in_progress' ? (
                          <span className="text-[10px] font-bold text-white bg-blue-500 w-fit px-1.5 py-0.5 rounded mb-1 uppercase">
                            IN PROGRESS
                          </span>
                        ) : (product as any)._likeStatus === 'pending' ? (
                          <span className="text-[10px] font-bold text-white bg-primary w-fit px-1.5 py-0.5 rounded mb-1 uppercase">
                            PENDING
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-primary bg-primary/10 w-fit px-1.5 py-0.5 rounded mb-1 uppercase">
                            {product.brand || product.category}
                          </span>
                        )}
                        <h3 className="text-[17px] font-bold text-on-background truncate leading-tight">
                          {product.title || product.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                          ₩{product.price?.toLocaleString()}
                          {product.discountPrice ? (
                            <span className="ml-1 text-red-400 line-through">₩{product.discountPrice.toLocaleString()}</span>
                          ) : null}
                        </p>
                      </div>

                      {/* Unlike button (replaces Map's more_vert — L591-599) */}
                      <button 
                        onClick={(e) => handleUnlike(e, product.id)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-rounded text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>heart_minus</span>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-slate-400 text-xs font-medium">
                    {loadingProducts ? 'Loading...' : 'No liked items'}
                  </div>
                )}
                {/* Visual nudge for next card — Map L662 */}
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
