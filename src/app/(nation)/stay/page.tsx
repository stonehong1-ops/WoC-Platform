'use client';

import React from 'react';

export default function StayPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 pt-20">
      {/* Search & Filter Section */}
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <div className="flex items-center bg-white rounded-full border border-[#acb3b4] px-6 py-4 shadow-sm focus-within:ring-2 focus-within:ring-[#1A73E8]/20 transition-all">
            <span className="material-symbols-outlined text-[#757c7d] mr-4">search</span>
            <input 
              className="bg-transparent border-none focus:ring-0 w-full font-body text-[#2d3435] placeholder:text-[#596061]" 
              placeholder="Search by location or hostname" 
              type="text" 
            />
            <div className="flex gap-2 ml-4">
              <button className="p-2 hover:bg-[#ebeeef] rounded-full text-[#1A73E8] transition-colors">
                <span className="material-symbols-outlined">tune</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Category Filters */}
        <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
          <button className="px-5 py-2.5 rounded-full bg-[#1A73E8] text-white font-label text-sm whitespace-nowrap">Couchsurfing</button>
          <button className="px-5 py-2.5 rounded-full bg-white text-[#596061] border border-[#acb3b4] hover:border-[#1A73E8] font-label text-sm whitespace-nowrap transition-colors">Dormitory</button>
          <button className="px-5 py-2.5 rounded-full bg-white text-[#596061] border border-[#acb3b4] hover:border-[#1A73E8] font-label text-sm whitespace-nowrap transition-colors">1-Room</button>
          <button className="px-5 py-2.5 rounded-full bg-white text-[#596061] border border-[#acb3b4] hover:border-[#1A73E8] font-label text-sm whitespace-nowrap transition-colors">2-Room</button>
          <button className="px-5 py-2.5 rounded-full bg-white text-[#596061] border border-[#acb3b4] hover:border-[#1A73E8] font-label text-sm whitespace-nowrap transition-colors">3-Room</button>
          <button className="px-5 py-2.5 rounded-full bg-white text-[#596061] border border-[#acb3b4] hover:border-[#1A73E8] font-label text-sm whitespace-nowrap transition-colors">Pension</button>
        </div>

        {/* Advanced Filter Row */}
        <div className="flex flex-wrap items-center gap-6 py-4 border-y border-[#acb3b4]/30">
          <div className="flex items-center gap-3">
            <span className="font-label text-xs font-semibold text-[#596061] uppercase tracking-wider">Price Range</span>
            <div className="flex items-center gap-2 bg-[#f2f4f4] px-4 py-2 rounded-lg border border-[#acb3b4]/50">
              <span className="text-xs font-medium">$50</span>
              <div className="w-32 h-1 bg-[#d8e2ff] rounded-full relative">
                <div className="absolute left-1/4 right-1/4 top-0 bottom-0 bg-[#1A73E8]"></div>
                <div className="absolute left-1/4 -top-1.5 w-4 h-4 bg-[#1A73E8] rounded-full shadow-md cursor-pointer"></div>
                <div className="absolute right-1/4 -top-1.5 w-4 h-4 bg-[#1A73E8] rounded-full shadow-md cursor-pointer"></div>
              </div>
              <span className="text-xs font-medium">$250+</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-label text-xs font-semibold text-[#596061] uppercase tracking-wider">Distance</span>
            <select className="bg-[#f2f4f4] border-[#acb3b4]/50 rounded-lg text-xs font-medium py-2 px-4 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none">
              <option>Within 2km of event</option>
              <option>Within 5km of event</option>
              <option>Within 10km of event</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listings Grid (Asymmetric Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Feature Card (Main Listing) */}
        <div className="md:col-span-8 group relative bg-white rounded-xl overflow-hidden border border-[#acb3b4]/30 hover:shadow-xl transition-all duration-300">
          <div className="relative h-[400px]">
            <img 
              className="w-full h-full object-cover" 
              alt="Modern spacious apartment" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4meRCDDlqgdfGgdEIzZji-y0zX0SUDSr-v2MCPfAH4ghn-ARw4hW-4yyNxqcltvHFdXExkrYH2WWu-t00hmWZbtXACPiOBJ2w9zPRqc19wmstqYT4ODi4-55INoKHLtSPZxSum93ieN3cwaKpO9mYLDBOXmgWePbE4VkAHqvBq_JDbkzjuf0qR1SY87UBLywXgBgaqpJ4-m6s2QxUaS2KxwKRzEzwgp158pIxrv3yOPX3j1qBrHSIFIXbrCl8uRKNj_ip3UcyRLy1" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <button className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-[#9f403d] transition-all">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            </button>
            <div className="absolute bottom-6 left-6 text-white text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-[#1A73E8] text-white text-[10px] font-bold rounded uppercase">Community Choice</span>
                <span className="flex items-center gap-1 text-sm font-medium"><span className="material-symbols-outlined text-sm">location_on</span>Berlin, Tech Hub</span>
              </div>
              <h2 className="text-3xl font-headline font-extrabold tracking-tight">The Creative Nomad Loft</h2>
            </div>
          </div>
          <div className="p-6 flex justify-between items-end">
            <div className="flex items-center gap-4">
              <img 
                className="w-12 h-12 rounded-full border-2 border-[#1A73E8] object-cover" 
                alt="Sarah K." 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWVjXQVvL7k6e8-TEABtfvicuksQiJ0EjB6fHAqSgf1FokFReoA6rrLlmpikL5acKZSEwF6bFBUKkcFMnWm7UfKUkUBnY61rWnnYjcj-_SfiKvbfRFciyOqfyBJPWJCtkiPs-MIWVS4RvqK7AlYOlXEq-Z2GCnAU_rmr3p411Vv7wVCAAegY22PrkKSIRB2g8sMji4ql1muPe2P1tuTl4Y0abuaEORrnmir0ubDHctJq9LPW82z2CB71buzCVhieCJmcx0-GMpa8kZ" 
              />
              <div className="text-left">
                <p className="font-headline text-lg font-bold text-[#2d3435]">Hosted by Sarah K.</p>
                <p className="text-sm text-[#596061]">Software Engineer • 4.98 (212 reviews)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-headline font-black text-[#1A73E8]">$120<span className="text-sm font-normal text-[#596061]">/night</span></p>
              <div className="mt-2 flex items-center gap-2">
                <input className="w-4 h-4 rounded border-[#acb3b4] text-[#1A73E8] focus:ring-[#1A73E8]" id="compare-1" type="checkbox" />
                <label className="text-xs font-bold text-[#596061] uppercase tracking-widest cursor-pointer" htmlFor="compare-1">Compare</label>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Card 1 */}
        <div className="md:col-span-4 flex flex-col gap-6 text-left">
          <div className="bg-white rounded-xl overflow-hidden border border-[#acb3b4]/30 hover:shadow-lg transition-all cursor-pointer">
            <div className="h-48 relative">
              <img className="w-full h-full object-cover" alt="Cozy artist studio" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDmPKidGYnTDBwR6sUIpC0PwUkDeWGk-TE09hiwZvf7I5pZKOJVNEMR7eiwEmGKqxmyuz4t3YDNclGshLLUe4anT1yp-kglppiis6BBtOGo29X5NDx1OQdBxpsXffbqI5ELRvFSuaen3KX5_Hyph1mch8sG5bR0LMF4ClHKh1el_p5GNdyeBAZQSO4MjYBP6SsCvUKNR5WV9KPd5uhi0bfkvS5xNUVX98LEcwxHwdNAaErEuYvN5JECEqFy7xId8hdj0t9lZ4gc-_c" />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-[#1A73E8] shadow-sm uppercase tracking-tighter">0.5km away</div>
            </div>
            <div className="p-4">
              <h3 className="font-headline font-bold text-lg mb-1 text-[#2d3435]">Cozy Artist Studio</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-xs text-[#596061]">person</span>
                <span className="text-xs text-[#596061] font-medium">Marc L., UI Designer</span>
              </div>
              <div className="flex justify-between items-center">
                <p className="font-headline font-extrabold text-lg text-[#2d3435]">$65<span className="text-xs font-normal">/night</span></p>
                <input className="w-4 h-4 rounded border-[#acb3b4] text-[#1A73E8] focus:ring-[#1A73E8]" type="checkbox" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl overflow-hidden border border-[#acb3b4]/30 hover:shadow-lg transition-all cursor-pointer">
            <div className="h-48 relative">
              <img className="w-full h-full object-cover" alt="Tech Hub Dorm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2f9_-FlkXnUu5VRJaB53C-GVrLmuQctb-Uf-nNgqsxvJC7huVTTOhDvSZ15et5S_gQv9ko5p5JUBrMrn6O_-S8AbQ7hIR-dkTAEe5wRwxdRYvYZw7ckjba9z_VOo6zdkHlRsCS8IMP9L783EtOBgqfP2yZIdfC_R0yvcVAAu0iEua82wRSY_rv4HmAz25I67YCp0kJUIDlNtalBqaV6LeZaSLJc5ZtazfCmmoUJXmGL3np7BG8PUyF2zs01yP0otbulaWbjRGNUL9" />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-[#1A73E8] shadow-sm uppercase tracking-tighter">1.2km away</div>
            </div>
            <div className="p-4">
              <h3 className="font-headline font-bold text-lg mb-1 text-[#2d3435]">Tech Hub Dorm</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-xs text-[#596061]">groups</span>
                <span className="text-xs text-[#596061] font-medium">Shared with Founders</span>
              </div>
              <div className="flex justify-between items-center">
                <p className="font-headline font-extrabold text-lg text-[#2d3435]">$45<span className="text-xs font-normal">/night</span></p>
                <input className="w-4 h-4 rounded border-[#acb3b4] text-[#1A73E8] focus:ring-[#1A73E8]" type="checkbox" />
              </div>
            </div>
          </div>
        </div>

        {/* Wide Card */}
        <div className="md:col-span-12 group bg-white rounded-xl overflow-hidden border border-[#acb3b4]/30 flex flex-col md:flex-row hover:shadow-lg transition-all text-left">
          <div className="md:w-1/3 h-64 md:h-auto overflow-hidden">
            <img 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              alt="Executive Suite" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0FctJieROO0E5dOlijxzk86DuOz9VpUatZhjoqc-k2e44COaWtZp5zayq3CrFzL_1qjH2tczkFdegfSY6wrKHDwrlxovIlscsMml5HnNcmUY5OJqRXB4KLikx_HZlqqDB7xLoPYdn6ZJpNaFWFrLH1dbmVQcJxDgd6hPYw7bs7hlvDzRvCzh10qM2nG3kcvwNjP3fumtTjPS6qPoTfyuWVK8Ao9bm86yc-zP_KdqKFWVA6KkwFVck7FHmpnUJ1lpv0ef0VdgOXO59" 
            />
          </div>
          <div className="p-8 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[#1A73E8] font-bold text-[10px] uppercase tracking-widest block mb-1">Newly Listed</span>
                  <h3 className="text-2xl font-headline font-extrabold text-[#2d3435]">Executive Suite @ The Core</h3>
                </div>
                <span className="flex items-center gap-1 font-bold text-[#1A73E8]">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  New
                </span>
              </div>
              <p className="text-[#596061] leading-relaxed mb-6 max-w-2xl">
                Perfect for focused project sprints. Located in the heart of the design district, featuring high-speed fiber, ergonomic seating, and a collaborative coffee bar downstairs.
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-1 bg-[#f2f4f4] px-3 py-1 rounded-full text-xs font-semibold text-[#596061]">
                  <span className="material-symbols-outlined text-sm">wifi</span> Gig-speed
                </div>
                <div className="flex items-center gap-1 bg-[#f2f4f4] px-3 py-1 rounded-full text-xs font-semibold text-[#596061]">
                  <span className="material-symbols-outlined text-sm">desk</span> Workspace
                </div>
                <div className="flex items-center gap-1 bg-[#f2f4f4] px-3 py-1 rounded-full text-xs font-semibold text-[#596061]">
                  <span className="material-symbols-outlined text-sm">coffee</span> Free Brew
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#acb3b4]/30">
              <div className="flex items-center gap-3">
                <img 
                  className="w-10 h-10 rounded-full object-cover" 
                  alt="Alex Chen" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXUXTNmxqCTUp-1Bhk4-Vnx6N5U8eh0GoQ3P-SbcKG2n9Cs5P5DoVsCjOZ3-jFYZlmulBSpiMTu81oUaU7fCFD9bxFXuPk27tO3SJDQd_4LOOdov1FI7vLPkTHY9t0IMA1gnYv1B0tqRoQc42hOGGL_nEGTOdbQyt7CUA0UQRhpqA4xdPaDeoYjR2T1d06LDwGNS1JPdLm24JyVCS8g_hn5EP7mW9XdvPI5Rs-j3lHdXHKg7y2YTlna2ougnnCXmlEK5jc4HW57VbL" 
                />
                <span className="text-sm font-bold text-[#2d3435]">Hosted by Alex Chen</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xl font-headline font-black text-[#1A73E8]">$180<span className="text-sm font-normal text-[#596061]">/night</span></p>
                </div>
                <input className="w-5 h-5 rounded border-[#acb3b4] text-[#1A73E8] focus:ring-[#1A73E8]" type="checkbox" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interaction: Compare Selection Bar */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[max-content]">
        <div className="bg-[#0c0f0f] text-[#9c9d9d] px-8 py-4 rounded-full shadow-2xl flex items-center gap-10 border border-white/10 backdrop-blur-xl bg-opacity-90">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-[#0c0f0f] overflow-hidden bg-[#d8e2ff]">
                <img 
                  className="w-full h-full object-cover opacity-80" 
                  alt="Selected stay" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSmpLrodmNeHuDNCMU_4ve-PZ9bGLmAsxa2GqPIo64HolrHPhqLClpW1S1s5WZtbdZh-64_B59DHjDFZiCbttzH7BIyaJHea5TC5a0QYgYyZWaE8A1aha7lJQxzi3M1gEbPAkEKiuvg9LWlbpRNsIg8-4n71p2QBLNSySkUNyLMR1RXW1XWQic1KctWE1qMKPQt7xv3evbSjyxzV7JsWRdp3-z_IySg-jY6KBAZ3ku6sejkFRNa4-6Q7KQG6vKWEkPA4OgTBMM-DGj" 
                />
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-[#0c0f0f] overflow-hidden bg-[#d8e2ff] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#9c9d9d] opacity-40">add</span>
              </div>
            </div>
            <p className="font-label text-sm font-bold">1 item selected for <span className="text-[#c2d4ff]">Comparison</span></p>
          </div>
          <div className="h-6 w-px bg-white/20"></div>
          <button className="bg-[#1A73E8] text-white px-6 py-2 rounded-full font-label text-sm font-bold hover:scale-105 active:scale-95 transition-all">
            Compare Now
          </button>
          <button className="text-[#9c9d9d]/60 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
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
