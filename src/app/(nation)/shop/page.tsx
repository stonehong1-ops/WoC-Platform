'use client';

import React from 'react';

export default function ShopPage() {
  return (
    <main className="max-w-md mx-auto min-h-screen pb-24 pt-20">
      {/* 1. Search Bar */}
      <div className="px-4 pt-4 sticky top-16 bg-white/95 backdrop-blur-sm z-10 pb-2">
        <div className="flex items-center bg-white border border-[#acb3b4]/30 rounded-full px-4 py-3 shadow-sm">
          <span className="material-symbols-outlined text-[#596061] mr-3">search</span>
          <input 
            className="bg-transparent border-none focus:ring-0 text-sm font-body w-full placeholder:text-[#596061]/60" 
            placeholder="Search products or brands..." 
            type="text" 
          />
          <span className="material-symbols-outlined text-[#1A73E8] ml-2 cursor-pointer">tune</span>
        </div>
      </div>

      {/* 2. Category Navigation */}
      <div className="mt-4 px-4 overflow-x-auto no-scrollbar flex gap-3 pb-2">
        <button className="flex-shrink-0 px-5 py-2 rounded-full bg-[#1A73E8] text-white text-sm font-semibold font-label">All</button>
        <button className="flex-shrink-0 px-5 py-2 rounded-full bg-[#e4e9ea] text-[#2d3435] text-sm font-medium font-label hover:bg-[#dfe3e8] transition-colors">Shoes</button>
        <button className="flex-shrink-0 px-5 py-2 rounded-full bg-[#e4e9ea] text-[#2d3435] text-sm font-medium font-label hover:bg-[#dfe3e8] transition-colors">Dresses</button>
        <button className="flex-shrink-0 px-5 py-2 rounded-full bg-[#e4e9ea] text-[#2d3435] text-sm font-medium font-label hover:bg-[#dfe3e8] transition-colors">Accessories</button>
        <button className="flex-shrink-0 px-5 py-2 rounded-full bg-[#e4e9ea] text-[#2d3435] text-sm font-medium font-label hover:bg-[#dfe3e8] transition-colors">Bikes</button>
        <button className="flex-shrink-0 px-5 py-2 rounded-full bg-[#e4e9ea] text-[#2d3435] text-sm font-medium font-label hover:bg-[#dfe3e8] transition-colors">Yoga Wear</button>
      </div>

      {/* 3. Featured Collection (Hero) */}
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
      <div className="mt-8 px-4 mb-10 text-left">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline text-lg font-bold text-[#2d3435]">Community Favorites</h3>
          <button className="text-[#1A73E8] text-xs font-bold font-label">View All</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* Card 1: Shoes */}
          <div className="group cursor-pointer">
            <div className="relative aspect-square rounded-xl bg-[#f2f4f4] overflow-hidden mb-3">
              <img 
                alt="Red Tango Heels" 
                className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUzLY_k1X_n6wm22azZbz0w4vnptUhZVO4qmS_7xxYK-pSadL5CfSIEvjr1IfzOQYxS2G98df8ufx3zBCtltdwHXS41Z1GfZUmele1IEvwuYgYsR-Rs5PtsBI_52f-U0AFYT9_jHMJBT9Y0cS6epQd0APX0bQ0ccEqj9S_kMBt43xdds6XC__1Qivc4WmOef0G5LhFcgsgvzOMZjSUIjnxZKqY_1HPzaze1clVckK9WCLA8a7XDXGJUCDgUF9o5m-IqYia8sqKW53f" 
              />
              <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-[#2d3435] shadow-sm">
                <span className="material-symbols-outlined text-lg">favorite</span>
              </button>
            </div>
            <div className="px-1">
              <p className="text-[10px] font-bold text-[#5c5f62] uppercase tracking-tighter font-label">TANGO ELITE</p>
              <h4 className="text-sm font-semibold text-[#2d3435] font-body truncate">Scarlet Performance Heels</h4>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-[#2d3435] font-headline">$189.00</span>
                <button className="bg-[#d8e2ff] text-[#004fa8] p-1 rounded-lg">
                  <span className="material-symbols-outlined text-lg leading-none">add_shopping_cart</span>
                </button>
              </div>
            </div>
          </div>
          {/* Card 2: Yoga Wear */}
          <div className="group cursor-pointer">
            <div className="relative aspect-square rounded-xl bg-[#f2f4f4] overflow-hidden mb-3">
              <img 
                alt="Yoga Leggings" 
                className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCh2ktGRxHSyZK8x1zbTKvtz1D6Y0sXJIQB-NmfxZrJVxkdACfij20f-DYlpdaaBEIekaSD3uoyG6WsMS_Oxw0VgrKy3WUm9rD1MZoiDd5a3zoIZXlS_FMccSWDP4DVz-_XZOf7II9wwfgT87nvQFzbwWLJflQAyeNoILjGlN-DQJ5t8iErX0xpFWDoARNIUoFDU1c9GCMwUjPDRBwEgyvGiQXiD1Z-N-ZFE0-vXJ4NX6LSZLIXOxMmjiRQ4Q9EuRT35ZUwtE_QwpNV" 
              />
              <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-[#2d3435] shadow-sm">
                <span className="material-symbols-outlined text-lg">favorite</span>
              </button>
            </div>
            <div className="px-1">
              <p className="text-[10px] font-bold text-[#5c5f62] uppercase tracking-tighter font-label">ZEN FLOW</p>
              <h4 className="text-sm font-semibold text-[#2d3435] font-body truncate">Seamless Motion Leggings</h4>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-[#2d3435] font-headline">$75.00</span>
                <button className="bg-[#d8e2ff] text-[#004fa8] p-1 rounded-lg">
                  <span className="material-symbols-outlined text-lg leading-none">add_shopping_cart</span>
                </button>
              </div>
            </div>
          </div>
          {/* Card 3: Bike Helmet */}
          <div className="group cursor-pointer">
            <div className="relative aspect-square rounded-xl bg-[#f2f4f4] overflow-hidden mb-3">
              <img 
                alt="Bike Helmet" 
                className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJAZy2gVMefBK7_lj36xoARyahNLrZ1M55mrfJToa6B5Nx-TQnq4iK15NreDBHOEg9nbgVheiULmbbugOcAF_e39KvdwKDL2QWxuyvYNdcPZGxGuE2_NGfgr663Dfq8U3x4-rnlYYv8-xvJZwYiqUTphNoMabOezcBeF5iFeBgVXqFnm_zlYwU2JmVCBZCGiP8Q9-zeRftSrt48qYzVGJP5Ht9lh-4PX4l06YYIqVhKhykiU5Tm0iwzpwMwBf0cxlMNVxTdT89syX9" 
              />
              <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-[#2d3435] shadow-sm">
                <span className="material-symbols-outlined text-lg">favorite</span>
              </button>
            </div>
            <div className="px-1">
              <p className="text-[10px] font-bold text-[#5c5f62] uppercase tracking-tighter font-label">VELO TECH</p>
              <h4 className="text-sm font-semibold text-[#2d3435] font-body truncate">Aero-Guard Pro Helmet</h4>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-[#2d3435] font-headline">$120.00</span>
                <button className="bg-[#d8e2ff] text-[#004fa8] p-1 rounded-lg">
                  <span className="material-symbols-outlined text-lg leading-none">add_shopping_cart</span>
                </button>
              </div>
            </div>
          </div>
          {/* Card 4: Accessories */}
          <div className="group cursor-pointer">
            <div className="relative aspect-square rounded-xl bg-[#f2f4f4] overflow-hidden mb-3">
              <img 
                alt="Tango Fan" 
                className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwd--vLsYTNIUZ8Vmzh3XSg7eW6RBZb5I1EUTrH6y_Ccq_kNjiaE1tgwCNIkrfGFXlPpww6niMyDIFYaL0Db_sXQEARbLSgzL-xqU5gTJDK3vsxh8K_o7JDbeO6NomBLCDqQ2jNlZtPz01dxEVEnhdc1rZAomr5IPMHyRogLNU1yzNYOJIvzF6QZFoIf7i-DnW3F7YXrfY9P1HtoQJ3tnIqrX3OuShSf8KUMZXcr7ONhvOPtLnxnk7Yr54vuYxoEL1cwTW5JxPATr3" 
              />
              <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-[#2d3435] shadow-sm">
                <span className="material-symbols-outlined text-lg">favorite</span>
              </button>
            </div>
            <div className="px-1">
              <p className="text-[10px] font-bold text-[#5c5f62] uppercase tracking-tighter font-label">ACCESORIOS</p>
              <h4 className="text-sm font-semibold text-[#2d3435] font-body truncate">Hand-Crafted Lace Fan</h4>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-[#2d3435] font-headline">$45.00</span>
                <button className="bg-[#d8e2ff] text-[#004fa8] p-1 rounded-lg">
                  <span className="material-symbols-outlined text-lg leading-none">add_shopping_cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Secondary Featured Bento Section */}
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
              <h4 className="font-headline font-bold text-sm text-[#004fa8]">Community Pickup</h4>
              <p className="text-xs text-[#004fa8]/80 font-body mt-1">Free delivery at local studios</p>
            </div>
            <span className="material-symbols-outlined text-[#1A73E8] text-3xl">local_shipping</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}
