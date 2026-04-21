'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { shopService } from '@/lib/firebase/shopService';
import { Product } from '@/types/shop';
import CreateProduct from '@/components/shop/CreateProduct';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShopPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null);

  // 1. Subscribe to real-time products
  useEffect(() => {
    const unsub = shopService.subscribeProducts(activeCategory, (data) => {
      setProducts(data);
    });
    return () => unsub();
  }, [activeCategory]);

  // 2. Filter products locally based on search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['All', 'Shoes', 'Dresses', 'Accessories', 'Bikes', 'Yoga Wear', 'Equipments'];

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (!user) return alert("Please login first");
    
    setIsAddingToCart(product.id);
    await shopService.addToCart(user.uid, product);
    
    setTimeout(() => setIsAddingToCart(null), 1000);
  };

  return (
    <main className="max-w-md mx-auto min-h-screen pb-24 pt-20 bg-white relative">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}} />

      {/* 1. Search Bar */}
      <div className="px-4 pt-4 sticky top-16 bg-white/95 backdrop-blur-sm z-30 pb-2">
        <div className="flex items-center bg-white border border-[#acb3b4]/30 rounded-full px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-primary/10 transition-all">
          <span className="material-symbols-outlined text-[#596061] mr-3">search</span>
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm font-body w-full placeholder:text-[#596061]/60" 
            placeholder="Search products or brands..." 
            type="text" 
          />
          <span className="material-symbols-outlined text-[#1A73E8] ml-2 cursor-pointer">tune</span>
        </div>
      </div>

      {/* 2. Category Navigation */}
      <div className="mt-4 px-4 overflow-x-auto no-scrollbar flex gap-3 pb-2 z-20">
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold font-label transition-all ${
              activeCategory === cat ? 'bg-[#1A73E8] text-white shadow-lg shadow-primary/20' : 'bg-[#e4e9ea] text-[#2d3435] hover:bg-[#dfe3e8]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3. Featured Collection (Hero) - Kept static for design consistency */}
      <div className="mt-6 px-4">
        <div className="relative h-64 rounded-xl overflow-hidden shadow-md">
          <img 
            alt="Pro Tango Collection" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGnfXo5FxY7Zul6jIY3UznjFzl1jJLqKE2i8nVR5RvHsm5xoTCYtFszyXhXFR6rmt_dAR_SGHAAWFgTVbnMvT8OFxYKVT4CTMrjU6XNpoq8boSq1Jc91C4K_VG-3b4bWt3hMHoPlYd0UHkeGoRzsRTEsZZmnNPmD1LEUwwVH2dYsycT5_d1z0wMmwx1dQQxWoDZwtyWwyUrax43L3MBnqZLbhBlEWjD-D_7w_roVUSotZHY1kVtYku-UYAv5d8wg7rAU6TMtA8-isH" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6 text-left">
            <span className="text-[#d8e2ff] font-bold text-xs tracking-widest uppercase mb-1 font-label">New Season</span>
            <h2 className="text-white font-headline text-2xl font-extrabold leading-tight">Pro Tango Shoes</h2>
            <p className="text-white/80 text-sm mt-1 font-body">Engineered for grace and precision.</p>
            <button className="mt-4 bg-[#1A73E8] text-white w-fit px-6 py-2 rounded-full text-xs font-bold font-headline active:scale-95 transition-transform">SHOP COLLECTION</button>
          </div>
        </div>
      </div>

      {/* 4. Product Grid */}
      <div className="mt-8 px-4 mb-10 text-left min-h-[400px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline text-lg font-bold text-[#2d3435]">
            {activeCategory === 'All' ? 'Group Favorites' : `${activeCategory}`}
          </h3>
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{filteredProducts.length} Items</span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
            <span className="material-symbols-outlined text-6xl mb-4">shopping_basket</span>
            <p className="text-xs font-black uppercase tracking-widest">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="group cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="relative aspect-square rounded-xl bg-[#f2f4f4] overflow-hidden mb-3">
                  <img 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    src={product.imageUrl} 
                  />
                  <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-[#2d3435] shadow-sm hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined text-lg">favorite</span>
                  </button>
                </div>
                <div className="px-1">
                  <p className="text-[10px] font-bold text-[#5c5f62] uppercase tracking-tighter font-label">{product.brand}</p>
                  <h4 className="text-sm font-semibold text-[#2d3435] font-body truncate">{product.name}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold text-[#2d3435] font-headline">
                      ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <button 
                      onClick={(e) => handleAddToCart(e, product)}
                      className={`p-1.5 rounded-lg transition-all ${
                        isAddingToCart === product.id ? 'bg-green-500 text-white' : 'bg-[#d8e2ff] text-[#004fa8] hover:bg-primary hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg leading-none">
                        {isAddingToCart === product.id ? 'check' : 'add_shopping_cart'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Secondary Featured Bento Section (Visual Preservation) */}
      <div className="mt-4 px-4 pb-12">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#dde4e5] p-5 rounded-2xl flex flex-col justify-between h-40 text-left">
            <div>
              <h4 className="font-headline font-bold text-sm text-[#2d3435]">Weekly Deals</h4>
              <p className="text-xs text-[#596061] font-body mt-1">Up to 40% off biking gear</p>
            </div>
            <span className="material-symbols-outlined text-[#1A73E8] text-3xl">trending_down</span>
          </div>
          <div className="bg-[#d8e2ff] p-5 rounded-2xl flex flex-col justify-between h-40 text-left">
            <div>
              <h4 className="font-headline font-bold text-sm text-[#004fa8]">Group Pickup</h4>
              <p className="text-xs text-[#004fa8]/80 font-body mt-1">Free delivery at local studios</p>
            </div>
            <span className="material-symbols-outlined text-[#1A73E8] text-3xl">local_shipping</span>
          </div>
        </div>
      </div>

      {/* 6. Global Shop FAB (Consistent with WoC System) */}
      <button 
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        <span className="material-symbols-outlined text-[32px] font-bold relative z-10">sell</span>
      </button>

      {/* Create Product Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateProduct 
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              // Option: Show success toast
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
