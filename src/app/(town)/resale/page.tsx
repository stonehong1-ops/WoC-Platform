'use client';

import React from 'react';

export default function ResalePage() {
  const categories = [
    { name: 'All', active: true },
    { name: 'Shoes', active: false },
    { name: 'Apparel', active: false },
    { name: 'Accessories', active: false },
    { name: 'Equipment', active: false },
    { name: 'Others', active: false }
  ];

  const products = [
    {
      id: 1,
      title: 'Tango Performance Shoes - Size 37',
      location: 'Gangnam-gu',
      time: '2 hours ago',
      price: '₩45,000',
      chats: 12,
      likes: 8,
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEYWU9KQFCUvTK-L7S8K2B2NTZW0-U4QOsbEfBNdr0wVlI5COjMUdOnttyTf1ATnTq-0D57MF_iCdt2P_ufcmFIDsR6aW2EVzpn1RCfFANmw0A1DvWqY_DAIh1Dpg3KdtCTmEosV3gDP6CI-69W66AMfFHvbiayXbDo2BMcZsrpLYLzRsd_kgi9VOIG3Q12z7yd5O0Epoc9yVTMBkylFVQhZlyYJvzsV-aADxmiGtoGZmamnG3vV_v583N_Y8sTO03YDD3n8BnLULJ'
    },
    {
      id: 2,
      title: 'Satin Red Milonga Evening Dress',
      location: 'Seocho-dong',
      time: '5 hours ago',
      price: '₩120,000',
      chats: 4,
      likes: 24,
      liked: true,
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcgjNYSIOF8sKqo5VNEr0LuJvraqnC2itZuHQXf33KvzSkPiC-wU7Uc2T3T7cUW0tKNFY-n5KS2vAsnQCAcPQFlR9J2ByaaqwRVmfpMrbX2VOb8nNoh0Llfd_9_d7bIVqJPxVsKWNBFx3XLw9RcBU-LixlTBh356zdFAdafMa0n3-U2CgtiA3NjuNPtHCc0deOSL9PXUbpVA7Zo4Vjq2f-MBfP1gbUgkqL-Q7fcMAAh5p3_ZaFavBAwq4hi0ncXT6Wpw3WB_PZ2VRI'
    },
    {
      id: 3,
      title: 'Vintage Hand-painted Spanish Fan',
      location: 'Gangnam-gu',
      time: '8 hours ago',
      price: '₩35,000',
      chats: 2,
      likes: 15,
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTwr2OUERYTdpRMcbF-wFlxBGpbLx92YDLgnAGO_p3PPmzY7pTFna5ytO7HOBbJDfmmkvRZa4DqYamorSHr7nFXQ4xUH3u743pDaI15tB9qb-4x_Qi--BU97YxadjAKBIigSOjI_us92HO27JoLD01nKqB0MbxXWlfuM2Ab2AP2O79kP1AaBMfxs2g3cco7Nkoisc3qmPwtIx2wIMkbHj-i0SunmSH2NFhh_nM7kIQYk7ZUtrmgjVu9vT-lKTbMQ_k2v_4wJtBgRSI'
    },
    {
      id: 4,
      title: 'Portable Bluetooth Speaker (For Practice)',
      location: 'Nonhyeon-dong',
      time: '1 day ago',
      price: '₩88,000',
      chats: 6,
      likes: 31,
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6lvbb0-XPt6AbHmdb-tCmbjbtaJqrJHbVbUIHQ0Zkr_xkqu1vsPsHPYJK57keT99BHCfc0BqTZ9zYURkO511QryKUsWAOIFmdYgNf0pC7wR_Ft6r80BNsKqmMjoJ5HXA25o7SiGoKn99bEgi7PWtvGksBeCBnODeTVFffDFVTVknD-KXdGw0TAI7W4KL6QlByWQQAeyDtJFRpXTPjROGkGWoxD1ypCOKoGAHMAPuR5NFhBp6kCR3gaXtA0Yz9gR6UjkKv5qMimiBX'
    },
    {
      id: 5,
      title: "Men's Tailored Performance Vest",
      location: 'Gangnam-gu',
      time: '2 days ago',
      price: '₩65,000',
      chats: 1,
      likes: 9,
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBC3CROXxISp90yEYo97RrpHlDvLEaCahuDGwOe52QVp-8_AplLjL8f1b6itlyS5bAsoxeb4B-Tno9sefdZT95tQuypWlo5xdl_X1Z9LFfp3L09SqM3KurtDtQYCofTyNisfXg8b4wRTSwHaek8vC0qO0WIK1q0Yy107wOFPeObgED3snL6SGsx80xzFtcCkT5xQqFloZoC6KnnYw7f9dFsbsi9h-SwnGQPNHpV7cjRUKAQIJ35FUyL6KmPq4TkGX6S48EqyX4Nuctw'
    }
  ];

  return (
    <main className="max-w-2xl mx-auto min-h-screen flex flex-col pt-16">
      {/* Search and Location Header Section */}
      <section className="bg-white px-4 pt-4 pb-2 sticky top-16 z-40 border-b border-surface-container-highest">
        <div className="flex flex-col gap-3">
          {/* Location Picker */}
          <div className="flex items-center gap-1 group cursor-pointer w-fit">
            <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
            <span className="font-headline font-bold text-sm tracking-tight">Seoul, Gangnam-gu</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[16px]">expand_more</span>
          </div>
          {/* Search Bar */}
          <div className="relative flex items-center mb-2">
            <span className="material-symbols-outlined absolute left-4 text-on-surface-variant">search</span>
            <input 
              className="w-full pl-12 pr-4 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-sm font-medium placeholder:text-on-surface-variant/60 outline-none" 
              placeholder="Search in this Society..." 
              type="text"
            />
          </div>
        </div>
      </section>

      {/* Category Scroll Navigation */}
      <section className="bg-white py-4 border-b border-surface-container-highest">
        <div className="flex gap-2 overflow-x-auto px-4 no-scrollbar scroll-smooth">
          {categories.map((cat, i) => (
            <button 
              key={i}
              className={`px-5 py-2 rounded-full font-headline text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                cat.active 
                  ? 'bg-primary text-on-primary' 
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Product Listing: Vertical Bento Style */}
      <section className="flex flex-col p-4 gap-4">
        {products.map((product) => (
          <div 
            key={product.id}
            className="flex gap-4 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow group cursor-pointer border border-surface-container-highest/50"
          >
            <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg bg-surface-container">
              <img 
                alt={product.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                src={product.img} 
              />
            </div>
            <div className="flex flex-col justify-between flex-grow">
              <div>
                <h3 className="font-headline font-bold text-on-surface text-base leading-tight group-hover:text-primary transition-colors">
                  {product.title}
                </h3>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-on-surface-variant/80 font-medium uppercase tracking-wide">
                  <span>{product.location}</span>
                  <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                  <span>{product.time}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <span className="font-headline font-extrabold text-primary text-lg">{product.price}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                    <span className="text-xs font-bold">{product.chats}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${product.liked ? 'text-error' : 'text-on-surface-variant'}`}>
                    <span 
                      className="material-symbols-outlined text-[18px]" 
                      style={{ fontVariationSettings: product.liked ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      favorite
                    </span>
                    <span className="text-xs font-bold">{product.likes}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Floating Action Button Contextual (Marketplace Context) */}
      <button className="fixed bottom-24 right-6 w-14 h-14 bg-on-primary-fixed-variant text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50">
        <span className="material-symbols-outlined text-[32px]">add</span>
      </button>

      {/* Subtle End of List Indicator */}
      <div className="py-12 flex flex-col items-center justify-center gap-2 opacity-30">
        <span className="material-symbols-outlined text-4xl">inventory_2</span>
        <p className="text-xs font-bold uppercase tracking-widest">No more items to show</p>
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
