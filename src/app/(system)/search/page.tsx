'use client';

import React from 'react';

export default function SearchPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 pt-8 pb-24 space-y-10 min-h-screen bg-background">
      {/* 1. Search Input Section */}
      <section className="sticky top-20 z-40 bg-background/80 backdrop-blur-sm -mx-4 px-4 py-2">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-on-surface-variant group-focus-within:text-primary transition-colors">
              search
            </span>
          </div>
          <input
            className="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary h-14 pl-12 pr-4 rounded-xl font-body text-base shadow-sm transition-all outline-none placeholder:text-on-surface-variant"
            placeholder="Search moments, people..."
            type="text"
          />
        </div>
      </section>

      {/* 3. Trending Categories (Quick Filters) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-bold text-lg tracking-tight">Quick Filters</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="px-5 py-2.5 rounded-full bg-primary-container text-on-primary-container font-label text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-[18px]">group</span>
            Social
          </button>
          <button className="px-5 py-2.5 rounded-full bg-[#e4e9ea] text-[#2d3435] font-label text-sm font-medium flex items-center gap-2 hover:bg-[#dde4e5] transition-colors">
            <span className="material-symbols-outlined text-[18px]">content_cut</span>
            Salon
          </button>
          <button className="px-5 py-2.5 rounded-full bg-[#e4e9ea] text-[#2d3435] font-label text-sm font-medium flex items-center gap-2 hover:bg-[#dde4e5] transition-colors">
            <span className="material-symbols-outlined text-[18px]">event</span>
            Events
          </button>
          <button className="px-5 py-2.5 rounded-full bg-[#e4e9ea] text-[#2d3435] font-label text-sm font-medium flex items-center gap-2 hover:bg-[#dde4e5] transition-colors">
            <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
            Shop
          </button>
          <button className="px-5 py-2.5 rounded-full bg-[#e4e9ea] text-[#2d3435] font-label text-sm font-medium flex items-center gap-2 hover:bg-[#dde4e5] transition-colors">
            <span className="material-symbols-outlined text-[18px]">map</span>
            Map
          </button>
        </div>
      </section>

      {/* 2. Recent Searches Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-bold text-lg tracking-tight">Recent Searches</h2>
          <button className="text-primary font-label text-sm font-semibold hover:underline px-2 py-1">Clear All</button>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between py-3 px-1 hover:bg-surface-container-low rounded-lg group transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-400 text-[20px]">history</span>
              </div>
              <span className="font-body text-[#2d3435] font-medium">Summer Hair Trends 2024</span>
            </div>
            <span className="material-symbols-outlined text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">close</span>
          </div>
          <div className="flex items-center justify-between py-3 px-1 hover:bg-surface-container-low rounded-lg group transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-400 text-[20px]">history</span>
              </div>
              <span className="font-body text-[#2d3435] font-medium">Luxe Spa Downtown</span>
            </div>
            <span className="material-symbols-outlined text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">close</span>
          </div>
        </div>
      </section>

      {/* 4. Suggested for You */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-bold text-lg tracking-tight">Suggested for You</h2>
          <button className="text-gray-400 font-label text-sm font-medium hover:text-[#2d3435] transition-colors">Show more</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Large Card */}
          <div className="col-span-2 row-span-2 relative aspect-[4/5] rounded-2xl overflow-hidden group cursor-pointer">
            <img
              alt="Salon Interior"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0VpaWZEAW_CghYxIG0zuyAJT9M9M8kTq2MDxtd7_we1-qevs7SkOse3fabkCZ2s5nMCbiaHns7fwG-rP0ON0UBinhU5lsrelsd7elKE8jL6RMGO2HKF8T7_Zplgbp_EPgOccbVDJZGiQlIC2TvYdhGxmHrFMir-A7AVEpkuGj5Npj8OM1Q_KpZuLrpmwSjZChC4Khjf5jtBeZwN9h18vxgX7epVfokQm1IIMHpD3vDwPkXFVcKwPuPMhV0fR3UUlvsxro2lY43o89"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6 text-white w-full">
              <span className="bg-primary px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider mb-2 inline-block text-on-primary">Trending Salon</span>
              <h3 className="font-headline font-bold text-xl leading-tight mb-1">Velvet & Vine Grooming</h3>
              <p className="text-white/80 text-xs font-medium">Downtown • 4.9 ★ (2k+)</p>
            </div>
          </div>
          {/* Profile Card 1 */}
          <div className="col-span-1 bg-surface-container-low rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-3 border border-outline-variant hover:shadow-md transition-shadow cursor-pointer">
            <div className="relative">
              <img
                alt="Elena"
                className="w-16 h-16 rounded-full object-cover ring-2 ring-white"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJq1IUaOoz2LBsz9nrfDvvHPyU-5yyoxbi_yVXMsQnC7UuL-wig4JoYfpiDxFg-WdP_GH1YAs15oSBENR46qEu_j1ECbzGYB6iydSuAZGh-eXLb5Ib1L1L6REr49pdmy7QeBiNzHrSD8OnoJ_YwKMxFvYy5bn5sz_F_w8RNjZR9yXSMIOC5ulCbSz0dnuMyN3e9w0fdU-9vAE3EkS2xU3N9uUGpSp-qO6h8mUX-QZUiwy5icHh39Nj_FMRrhTT6vCaGdvNnb0osL9G"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#1A73E8] rounded-full flex items-center justify-center border-2 border-white">
                <span className="material-symbols-outlined text-[10px] text-white">check</span>
              </div>
            </div>
            <div>
              <p className="font-headline font-bold text-sm">Elena Rosas</p>
              <p className="text-gray-400 text-[11px] font-medium">Senior Colorist</p>
            </div>
            <button className="w-full py-2 bg-[#2d3435] text-white rounded-lg font-label text-xs font-bold hover:bg-[#2d3435]/90">Follow</button>
          </div>
          {/* Small Content Card 1 */}
          <div className="col-span-1 relative aspect-square rounded-2xl overflow-hidden group cursor-pointer">
            <img
              alt="Hair Dye"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_Cdk69OtyeoW89_8pXwA3jVsQ24hoO0HhI7tPMcJq8z78oL618q_MzhWEqZRmCQvFK6ftL_8FbU1lEaCFHDlsQNwQcxRo_Xc14BxMNTs4syKXTOOB3L-k3fP_gV_yPH8Nn3gdqZi7rP7J69aG49TLPdaLHa7LT-RYI0JaXt6mloS2ew7IKmrIJNrhnH02yXrLWsRFZisjUfTE1Apc_do6a6e__l5TjLrZVgGNJy-ODqBxUTMgEkWAMj5LeBWVTfyCjgMsQDQnQWcM"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors"></div>
            <div className="absolute top-3 left-3">
              <span className="material-symbols-outlined text-white text-[20px]">play_circle</span>
            </div>
          </div>
          {/* Small Content Card 2 */}
          <div className="col-span-1 relative aspect-square rounded-2xl overflow-hidden group cursor-pointer">
            <img
              alt="Tools"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBL1ZrJsH2NqTqGBcnSCUa30mf0bkEWUIvDqrtaAcojCLU5dzfVuF0eT41hwSkQKPJsLFHXNkYoHTZm9e0IBXjl5ceooM8GMo3Z4HOXwHaXt46jzI5TJA6wElb1FTpAh9ujGO0zweOO5i39kEDLBk9Mdl4woaIGoW1pNfixH7KczSx2c87Zg0pFzar-bod_-7dLaZ-0rD2Oh_PIyQaU6kT6XvX9zGW4lpzg1UwFQUcb4BMlbxGZvuruB2_k8kUMl68feeRr_3x8SRq5"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors"></div>
            <div className="absolute bottom-3 left-3 text-white">
              <p className="text-[10px] font-bold">New Arrival</p>
            </div>
          </div>
        </div>
      </section>

      {/* Creators to Watch */}
      <section className="space-y-4">
        <h2 className="font-headline font-bold text-lg tracking-tight">Creators to Watch</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          {[
            { name: 'Marcus.K', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPA9cIBIxUag6N-d4DsiL5TPhtUeh2u3jBbOXVGNaTFZQYIRU37m-W2rMppFra005tvsjMEAdQkxIJAwAharqikCN6OnpKGpH6mkTrbWCHt6Q89fdIC92Cgar-eCpCb6sHXLKE8KfiPyDEj6pWreAJ_n-qktuR73QNe7tr1aVUktG8hUzcovyaNl-oAEBJfcMrVZXn5mr1d1Ny3F80JnynQWzQaoJMadJc_vl29zJ7r9Y7I3elM441SF44JBgQNvvVfKdk_ThtLVB-' },
            { name: 'Sofia_L', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-ENQ6yyvXFtA2UO2ZQzquIwBfhUfq9A0owx_EXIQcMGhdrACciz-6yDySfvDcSUbLxORiW4UZvp0wXXiTjJiS7tj18ltGgE49-GZNK8ygiDeHkSXrCK-DlZkm2L80ivhGBqjieAzOubv_-YNFPg5il1TvJtJT-AOsKa_jLP7eHTqiYlNKKM_ctW1oiLGQAcmL2oZRPUjoDDY1gfgx-vuDMxwV_EqtYDR_Kqq3m0x6uBULQ5sXOWOCIgvK2U4sKz7_gZovVxBjrta8' },
            { name: 'Artur.V', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVZswbV4KKaiD2ZzDjEfnY1cPffmmLlB1i9OA77zL9t1T_wGULrQnTFagALLm_iUMMktnEAJ127UTy4j25FItkUHk5Bo71jQhoWtgqHQe0kz4CZEMKDUtXYObDmdgJ3-S90EoSBq4COlCeF-PH1RTl9WhnafUrUfM0sY1DFtl4jWzNL108wKep4V5tMW7R3pWVXJ9XogW_cvvFxMyxVgsAYcBqo-H0yxI87PkuLCnPkrYNObEEBBB-1_tnuQKPnV1IfTei4qUOAwuB' },
            { name: 'Lila.Glow', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5oUKsdZ1Vx1hjIRqKJG5VIaV8z0jxgzuvRh9MKtSyy0SqcrFTGaIOQPULSH3syGDrp5o2aKKAchQjQ-vqm4Jq5zzcOJdkEuxO0am82345s1ivYsOEQ7eXbTM2Y8xHpN904rwNf7BgVuhSkOHH8qX_8m0kTHGyUtnlJvj8RUo4tGdBv7jbgEtZxtjd27YdMYOpTVBzul6iBwIlXRdUU0CsHVI_EYh0r5ZTV917wZXcvdKfFOEBd1r5YwLBYuwDfFxD7ysEbe1ZkLYl' },
            { name: 'Jade_M', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAg_8j__9Q0lKCUGAY8E6vWgaTMvpdQnqj3r2u-CGn89xcF63E9TNYqEVUPKV9jGzPM2Tw-6Lk5Pek7WpKsD9Y8y8RsnrNUo4ebV9krhgAckvSSXnKrHzapVv5aSpNPzu-fd-XJ0cOjWiYMHYuyFrKDKkM9nVPlw4pnbuVkv4p9CR-pvCSZU5b252EUOE2TiZonGrWGbQqCbG-Dc0NE5DfyVU-t7tH9XH0b9BtLysLo4LvCkz5l0_ssVi87r3_Giypw1w-EJ2PhRgTj' }
          ].map((creator, i) => (
            <div key={i} className="flex-shrink-0 flex flex-col items-center space-y-2 cursor-pointer group">
              <div className="w-16 h-16 rounded-full p-1 ring-2 ring-gray-100">
                <img alt={creator.name} className="w-full h-full rounded-full object-cover" src={creator.img} />
              </div>
              <p className="text-[11px] font-semibold text-[#2d3435] group-hover:text-[#1A73E8] transition-colors">{creator.name}</p>
            </div>
          ))}
          <div className="flex-shrink-0 flex flex-col items-center space-y-2 cursor-pointer group">
            <div className="w-16 h-16 rounded-full p-1 ring-2 ring-gray-100">
              <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-400">add</span>
              </div>
            </div>
            <p className="text-[11px] font-semibold text-[#2d3435]">Discover</p>
          </div>
        </div>
      </section>

      {/* Mobile Bottom Nav (Usually redundant with global footer but following design) */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}
