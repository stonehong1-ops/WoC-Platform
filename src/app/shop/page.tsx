"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { shopService } from '@/lib/firebase/shopService';
import { venueService } from '@/lib/firebase/venueService';
import { Product, ProductLike } from '@/types/shop';
import { Venue } from '@/types/venue';
import WishlistTray from '@/components/shop/WishlistTray';
import ProductDetail from '@/components/shop/ProductDetail';
import CreateProduct from '@/components/shop/CreateProduct';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useModalNavigation } from '@/hooks/useModalNavigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { AnimatePresence } from 'framer-motion';

type SortOption = 'latest' | 'sale' | 'popular' | 'new' | 'price_asc' | 'price_desc';

const SORT_OPTIONS: { key: SortOption; label: string; icon: string; tKey: string }[] = [
  { key: 'latest', label: 'Latest', icon: 'schedule', tKey: 'shop.sort_latest' },
  { key: 'sale', label: 'Sale', icon: 'local_offer', tKey: 'shop.sort_sale' },
  { key: 'popular', label: 'Popular', icon: 'trending_up', tKey: 'shop.sort_popular' },
  { key: 'new', label: 'New', icon: 'fiber_new', tKey: 'shop.sort_new' },
  { key: 'price_asc', label: 'Price ↑', icon: 'arrow_upward', tKey: 'shop.sort_price_asc' },
  { key: 'price_desc', label: 'Price ↓', icon: 'arrow_downward', tKey: 'shop.sort_price_desc' },
];

const SHOP_FILTER_DEFS: Record<string, { labelKey: string; fullLabelKey?: string; icon?: string; categories?: string[] }> = {
  all: { labelKey: 'shop.filter_all', fullLabelKey: 'shop.filter_all' },
  w_shoes: { labelKey: 'shop.filter_shoes', fullLabelKey: 'shop.filter_woman_shoes', icon: 'face_2', categories: ['shoes', 'w_shoes', 'woman shoes', "women's shoes"] },
  m_shoes: { labelKey: 'shop.filter_shoes', fullLabelKey: 'shop.filter_man_shoes', icon: 'footprint', categories: ['m_shoes', 'man shoes', "men's shoes"] },
  w_wear: { labelKey: 'shop.filter_wear', fullLabelKey: 'shop.filter_woman_wear', icon: 'digital_wellbeing', categories: ['wear', 'dress', 'w_wear', 'dresses', 'woman wear', 'yoga wear'] },
  m_wear: { labelKey: 'shop.filter_wear', fullLabelKey: 'shop.filter_man_wear', icon: 'styler', categories: ['m_wear', 'man wear', 'suits'] },
  item: { labelKey: 'shop.filter_item', fullLabelKey: 'shop.filter_item', icon: 'diamond', categories: ['accessories', 'accessory', 'equipment', 'item', 'bag', 'others', 'bikes', 'equipments'] },
};

function ShopPageContent() {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allVenues, setAllVenues] = useState<Venue[]>([]);

  // Restore cached products and venues to achieve 0ms initial render after mount to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cachedProds = sessionStorage.getItem('woc_shop_all_products');
      if (cachedProds) {
        try {
          setAllProducts(JSON.parse(cachedProds));
        } catch (e) {
          console.error('Failed to parse cached shop products:', e);
        }
      }
      const cachedVens = sessionStorage.getItem('woc_shop_all_venues');
      if (cachedVens) {
        try {
          setAllVenues(JSON.parse(cachedVens));
        } catch (e) {
          console.error('Failed to parse cached shop venues:', e);
        }
      }
    }
  }, []);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeBrand, setActiveBrand] = useState('All');
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likes, setLikes] = useState<ProductLike[]>([]);
  const [togglingLike, setTogglingLike] = useState<string | null>(null);
  const [showBrandFilter, setShowBrandFilter] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const { setSubHeader } = useNavigation();
  
  const { 
    isOpen: isDetailOpen, 
    value: productId, 
    openModal: openDetail, 
    closeModal: handleCloseDetail,
    searchParams 
  } = useModalNavigation('productId');

  const {
    isOpen: isCreateOpen,
    openModal: openCreate,
    closeModal: closeCreate
  } = useModalNavigation('create');

  // Listen to global compose event
  useEffect(() => {
    const handleComposeOpen = (e: CustomEvent) => {
      if (e.detail?.id === 'shop') {
        openCreate('true');
      }
    };
    window.addEventListener('woc:compose:open', handleComposeOpen as EventListener);
    return () => window.removeEventListener('woc:compose:open', handleComposeOpen as EventListener);
  }, [openCreate]);

  const selectedProduct = useMemo(() => {
    if (!productId) return null;
    return allProducts.find(p => p.id === productId) || null;
  }, [productId, allProducts]);

  const handleOpenDetail = (product: Product) => {
    openDetail(product.id);
  };

  const shopFilters = useMemo(() => {
    const isMale = profile?.gender?.toLowerCase() === 'male' || profile?.gender?.toLowerCase() === 'man';
    const keys = isMale
      ? ['all', 'm_shoes', 'm_wear', 'item', 'w_shoes', 'w_wear']
      : ['all', 'w_shoes', 'w_wear', 'item', 'm_shoes', 'm_wear'];
    
    return keys.map(key => ({ key, ...SHOP_FILTER_DEFS[key] }));
  }, [profile?.gender]);

  // 1. Subscribe to ALL active products (client-side filter/sort)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('woc_shop_all_products');
      if (cached) {
        try {
          setAllProducts(JSON.parse(cached));
        } catch (e) {
          console.error('Failed to parse cached products:', e);
        }
      }
    }

    const unsub = shopService.subscribeAllProducts((data) => {
      setAllProducts(data);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('woc_shop_all_products', JSON.stringify(data));
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('woc_shop_all_venues');
      if (cached) {
        try {
          setAllVenues(JSON.parse(cached));
        } catch (e) {
          console.error('Failed to parse cached venues:', e);
        }
      }
    }

    const unsub = venueService.subscribeVenues((data) => {
      setAllVenues(data);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('woc_shop_all_venues', JSON.stringify(data));
      }
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to my likes
  useEffect(() => {
    if (!user) return;
    const unsub = shopService.subscribeMyLikes(user.uid, (likesData) => {
      setLikedIds(new Set(likesData.map(l => l.productId)));
      setLikes(likesData);
    });
    return () => unsub();
  }, [user]);

  // 3. Dynamic brands from data
  const brands = useMemo(() => {
    const shopVenues = allVenues.filter(v => 
      v.status === 'active' && 
      ((Array.isArray(v.types) && (v.types.includes('Shop') || v.types.includes('Service'))) || v.category === 'Shop' || v.category === 'Service')
    );
    const names = Array.from(new Set(shopVenues.map(v => v.name).filter(Boolean)));
    return ['All', ...names.sort()];
  }, [allVenues]);

  // 4. Filter + Sort
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Category filter by activeFilter
    if (activeFilter !== 'all') {
      const filter = SHOP_FILTER_DEFS[activeFilter];
      if (filter && filter.categories) {
        result = result.filter(p => {
          const cat = (p.category || '').toLowerCase().trim();
          return filter.categories!.some(c => cat === c.toLowerCase());
        });
      }
    }
    // Brand filter
    if (activeBrand !== 'All') {
      result = result.filter(p => p.brand === activeBrand);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        (p.title || p.name || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q)
      );
    }

    switch (sortOption) {
      case 'sale':
        result = result.filter(p => p.discountPrice && p.discountPrice > 0);
        result.sort((a, b) => {
          const dA = a.discountPrice ? (a.price - a.discountPrice) / a.price : 0;
          const dB = b.discountPrice ? (b.price - b.discountPrice) / b.price : 0;
          return dB - dA;
        });
        break;
      case 'popular':
        result.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        break;
      case 'new': {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        result = result.filter(p => {
          if (!p.createdAt) return false;
          const d = typeof p.createdAt === 'object' && 'toDate' in p.createdAt
            ? (p.createdAt as any).toDate() : new Date(p.createdAt as any);
          return d >= weekAgo;
        });
        break;
      }
      case 'price_asc':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_desc':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      default: break;
    }
    return result;
  }, [allProducts, activeFilter, activeBrand, searchQuery, sortOption]);

  const handleToggleLike = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (!user) return alert(t('shop.msg_login_first'));
    setTogglingLike(product.id);
    try { await shopService.toggleLike(user.uid, product.id); } catch (err) { console.error('Failed to toggle like:', err); }
    setTogglingLike(null);
  };
  
  // Teleport Filter Bar to Header (Premium Standard: Dual Row)
  useEffect(() => {
    const filterBar = (
      <div className="relative w-full bg-white flex flex-col shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)]">
        {/* Row 1: Scrollable Tabs */}
        <div className="w-full px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {shopFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-xl text-[12px] font-bold tracking-tight transition-all whitespace-nowrap border ${
                activeFilter === filter.key
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100'
                  : 'bg-slate-50/50 text-slate-500 border-slate-100 hover:bg-slate-100/80'
              }`}
            >
              {t(filter.fullLabelKey || filter.labelKey)}
            </button>
          ))}
        </div>
        
        {/* Row 2: Stats & Filters */}
        <div className="w-full h-11 px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
              {filteredProducts.length} <span className="text-slate-400 font-medium">{t('shop.items')}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Brand Filter Trigger */}
            <button 
              onClick={() => {
                setShowBrandFilter(!showBrandFilter);
                if (!showBrandFilter) setShowSortDropdown(false);
              }}
              className={`flex items-center gap-0.5 text-[12px] font-bold transition-all ${
                activeBrand !== 'All' 
                  ? 'text-blue-600' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {activeBrand === 'All' ? t('shop.brand') : activeBrand}
              <span className={`material-symbols-outlined text-[16px] transition-transform ${showBrandFilter ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {/* Sort Trigger */}
            <button 
              onClick={() => {
                setShowSortDropdown(!showSortDropdown);
                if (!showSortDropdown) setShowBrandFilter(false);
              }}
              className="flex items-center gap-0.5 text-[12px] font-bold text-slate-600 hover:text-slate-800 transition-all"
            >
              {t(SORT_OPTIONS.find(o => o.key === sortOption)?.tKey || 'shop.sort')}
              <span className={`material-symbols-outlined text-[16px] transition-transform ${showSortDropdown ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
          </div>
        </div>

        {/* Brand Selector Dropdown (Premium Grid) */}
        {showBrandFilter && (
          <div className="absolute top-full left-0 right-0 z-40 bg-white shadow-2xl border-t border-slate-100 p-4 max-h-[280px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-[14px] font-black text-slate-800 uppercase tracking-tight">{t('shop.filter_by_brand')}</span>
              <button 
                onClick={() => setShowBrandFilter(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 active:scale-90 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {brands.map(brand => (
                <button
                  key={brand}
                  onClick={() => {
                    setActiveBrand(brand);
                    setShowBrandFilter(false);
                  }}
                  className={`px-4 py-3 rounded-2xl text-[12px] font-bold text-left transition-all border ${
                    activeBrand === brand 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' 
                      : 'bg-slate-50/50 text-slate-600 border-transparent hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate pr-2">{brand}</span>
                    {activeBrand === brand && (
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-center">
              <button 
                onClick={() => setShowBrandFilter(false)}
                className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                {t('shop.close_filter')}
              </button>
            </div>
          </div>
        )}
 
        {/* Sort Options Dropdown */}
        {showSortDropdown && (
          <div className="absolute top-full right-0 z-40 bg-white shadow-2xl border-t border-slate-100 py-2 min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-300">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => {
                  setSortOption(opt.key);
                  setShowSortDropdown(false);
                }}
                className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left ${
                  sortOption === opt.key ? 'text-blue-600 font-bold' : 'text-slate-600 font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{opt.icon}</span>
                <span className="text-[13px]">{t(opt.tKey)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
    setSubHeader(filterBar);
    return () => setSubHeader(null);
  }, [
    activeFilter, activeBrand, sortOption, filteredProducts.length, 
    showBrandFilter, showSortDropdown, shopFilters, brands, setSubHeader
  ]);

  return (
    <main className="max-w-md mx-auto w-full relative min-h-screen bg-[#FAF8FF]">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-rounded { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}} />

      {/* ⑤ Product Grid (필터+정렬 결과) */}
      <div className="pt-4 px-4 mb-10 text-left min-h-[400px]">


        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
            <span className="material-symbols-rounded text-6xl mb-4">shopping_basket</span>
            <p className="text-xs font-black uppercase tracking-widest">
              {sortOption === 'sale' ? t('shop.no_sale_items') : sortOption === 'new' ? t('shop.no_new_arrivals') : t('shop.no_products')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} onClick={() => handleOpenDetail(product)} className="group cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="relative aspect-square rounded-xl bg-[#f2f4f4] overflow-hidden mb-3">
                  {/* Fallback View */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[#c4cacc]">
                    <span className="material-symbols-outlined text-4xl mb-1">local_mall</span>
                    <span className="text-[10px] font-bold tracking-wider uppercase">{t('shop.no_image')}</span>
                  </div>
                  
                  {/* Actual Image */}
                  {(product.images?.[0] || product.imageUrl) && (
                    <img
                      alt={product.title || product.name}
                      className="absolute inset-0 z-10 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 bg-[#f2f4f4]"
                      src={product.images?.[0] || product.imageUrl}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  {/* Sale badge */}
                  {product.discountPrice && product.discountPrice > 0 && (
                    <span className="absolute z-20 top-3 left-3 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                    </span>
                  )}
                  <button
                    onClick={(e) => handleToggleLike(e, product)}
                    className={`absolute z-20 top-3 right-3 w-8 h-8 backdrop-blur rounded-full flex items-center justify-center shadow-sm transition-colors active:scale-90 ${
                      likedIds.has(product.id) ? 'bg-red-50 text-red-500' : 'bg-white/90 text-[#2d3435] hover:text-red-500'
                    }`}
                    disabled={togglingLike === product.id}
                  >
                    <span className="material-symbols-rounded text-lg" style={{ fontVariationSettings: likedIds.has(product.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                  </button>
                </div>
                <div className="px-1">
                  <p className="text-[10px] font-bold text-[#5c5f62] uppercase tracking-tighter font-label">{product.brand}</p>
                  <h4 className="text-sm font-semibold text-[#2d3435] font-body truncate">{product.title || product.name}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#2d3435] font-headline">
                        ₩{(product.discountPrice || product.price || 0).toLocaleString()}
                      </span>
                      {product.discountPrice && product.discountPrice > 0 && (
                        <span className="text-[10px] text-[#596061] line-through">₩{product.price?.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ④ Hero Banner (Admin UX — 광고 배너) */}
      <div className="mt-8 px-4 pb-[80px]">
        <div className="relative h-56 rounded-xl overflow-hidden shadow-md">
          <img
            alt="Pro Tango Collection"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGnfXo5FxY7Zul6jIY3UznjFzl1jJLqKE2i8nVR5RvHsm5xoTCYtFszyXhXFR6rmt_dAR_SGHAAWFgTVbnMvT8OFxYKVT4CTMrjU6XNpoq8boSq1Jc91C4K_VG-3b4bWt3hMHoPlYd0UHkeGoRzsRTEsZZmnNPmD1LEUwwVH2dYsycT5_d1z0wMmwx1dQQxWoDZwtyWwyUrax43L3MBnqZLbhBlEWjD-D_7w_roVUSotZHY1kVtYku-UYAv5d8wg7rAU6TMtA8-isH"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6 text-left">
            <span className="text-[#d8e2ff] font-bold text-xs tracking-widest uppercase mb-1 font-label">{t('shop.new_season')}</span>
            <h2 className="text-white font-headline text-2xl font-extrabold leading-tight">{t('shop.hero_title')}</h2>
            <p className="text-white/80 text-sm mt-1 font-body">{t('shop.hero_desc')}</p>
            <button className="mt-4 bg-[#1A73E8] text-white w-fit px-6 py-2 rounded-full text-xs font-bold font-headline active:scale-95 transition-transform">{t('shop.hero_btn')}</button>
          </div>
        </div>
      </div>

      {/* ⑥ Wishlist Tray (Map-style FAB — 완료) */}
      {user && (
        <WishlistTray
          likes={likes}
          userId={user.uid}
          onProductClick={(productId) => {
            const p = allProducts.find(pr => pr.id === productId);
            if (p) handleOpenDetail(p);
          }}
        />
      )}

      {/* ⑦ Modals */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            isLiked={likedIds.has(selectedProduct.id)}
            onClose={handleCloseDetail}
            onToggleLike={handleToggleLike}
          />
        )}
        {isCreateOpen && (
          <CreateProduct 
            onClose={closeCreate}
            onSuccess={() => {
              // Optionally refresh or show success message
              closeCreate();
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto w-full min-h-screen bg-[#FAF8FF] flex items-center justify-center">
        <span className="material-symbols-rounded animate-spin text-slate-300 text-4xl">progress_activity</span>
      </div>
    }>
      <ShopPageContent />
    </Suspense>
  );
}
