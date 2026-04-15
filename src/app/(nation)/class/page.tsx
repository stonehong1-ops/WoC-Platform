'use client';

import React from 'react';

export default function ClassPage() {
  return (
    <main className="max-w-md mx-auto min-h-screen pb-24 pt-16">
      {/* Filter Section: Segmented Control */}
      <section className="px-5 pt-6 pb-4 sticky top-16 bg-background/80 backdrop-blur-lg z-20">
        <div className="flex p-1 bg-surface-container rounded-full w-full">
          <button className="flex-1 py-2.5 text-sm font-semibold rounded-full bg-surface-container-lowest text-primary shadow-sm transition-all duration-200">
            Browse by Instructor
          </button>
          <button className="flex-1 py-2.5 text-sm font-medium rounded-full text-on-surface-variant hover:text-on-surface transition-all duration-200">
            Browse by Studio
          </button>
        </div>
      </section>

      {/* Instructor Showcase (Horizontal Scroll) */}
      <section className="mt-2">
        <div className="px-5 mb-4 flex justify-between items-center">
          <h2 className="font-headline text-lg font-extrabold tracking-tight">Featured Instructors</h2>
          <button className="text-primary text-xs font-bold uppercase tracking-wider">See All</button>
        </div>
        <div className="flex overflow-x-auto gap-4 px-5 no-scrollbar pb-2">
          {/* Instructor Card 1 */}
          <div className="flex-shrink-0 w-32 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full p-1 border-2 border-primary ring-4 ring-primary-container/30 mb-3 overflow-hidden">
              <img alt="Elena Rossi" className="w-full h-full object-cover rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDG1SjSSua4x98zWAP6jIRYO73gLp7R5XvxZhwJkmPdg4uS_F00-dcpQ5xc4Z8sO_3ystvQfpkIIkop-OosKTdHPFqxHMRQjgrGIbs8oVHxko6vuRiFjE0IhUA2mrSFn_OMFgzc2SffdYTVlJqxlbIoAeaNOo8jAIhSCU2E-PI1-MhBZgCVwo9IuAEj3sEuNP3lb2REtRK6DWUoLsNLOVh_3EPhmxfb60ZbDW3O1uQmw9YAWWNRZ4m8uAWeOpxZW9bTOW5_VYaQfgT-" />
            </div>
            <p className="font-headline font-bold text-sm text-center">Elena Rossi</p>
            <p className="text-xs text-on-surface-variant text-center">Argentine Tango</p>
          </div>
          {/* Instructor Card 2 */}
          <div className="flex-shrink-0 w-32 flex flex-col items-center opacity-80">
            <div className="w-24 h-24 rounded-full p-1 border border-outline-variant mb-3 overflow-hidden">
              <img alt="Mateo Silva" className="w-full h-full object-cover rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJ6gbxstIrr0Ra5KFDQIYLbqp25hCBQaKyDZ-XcsACA71zIeMRZRnRsVN-CMSiQBFWHN6X4QzgMy51gNC4u3KGJnPU8fRWSJugKhYK17IgxYh9TcILcd1t69RTx89ZalmXx4vuFz7FS7KgWfltzAOIDYR-wyDavH758TP43GU5MkLin5sDDgHyZkdmITzfFGIK8vfYkYzBi-cOhNiWVEviyo8w2uSB5C6kZLVmypBq4S34rAJr0C0r_veSjES7qwEON_LUdnt-QpIw" />
            </div>
            <p className="font-headline font-bold text-sm text-center text-on-surface">Mateo Silva</p>
            <p className="text-xs text-on-surface-variant text-center">Milonga Master</p>
          </div>
          {/* Instructor Card 3 */}
          <div className="flex-shrink-0 w-32 flex flex-col items-center opacity-80">
            <div className="w-24 h-24 rounded-full p-1 border border-outline-variant mb-3 overflow-hidden">
              <img alt="Sofia Kim" className="w-full h-full object-cover rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJ5BowXsWrZXLn3j7oKX4NXkXeU5FoS_LJNk7RpYnbCeV_tWXohNsZkTTTSLvN8D3b2ggkRf5o8w_WArAJcK1F9-gcq7qnY8BwdEZK9tSixEByTbvr1avklEhy1HPLnKlIKK5NZrsaAaJmGo_oGBr4Yag2NWVhfhdkpSyhnFuFcCp5e0l8fOYYyAnFTyaLx6uwoWkMr4RBVmNFHrsf2k8P-TlCgjBU-l-l54YPlTlx6pAPESlwYikfEE9av5tWNSNR9q5A35agJNHW" />
            </div>
            <p className="font-headline font-bold text-sm text-center text-on-surface">Sofia Kim</p>
            <p className="text-xs text-on-surface-variant text-center">Technique Pro</p>
          </div>
        </div>
      </section>

      {/* Category: Regular Monthly */}
      <section className="mt-10 px-5">
        <div className="flex items-baseline gap-2 mb-6">
          <h3 className="font-headline text-xl font-black text-on-surface">Regular Monthly</h3>
          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
        </div>
        <div className="space-y-6">
          {/* Class Card 1 */}
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-surface-variant flex flex-col group hover:shadow-md transition-shadow">
            <div className="relative h-44">
              <img alt="Beginner Tango Fundamentals" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbWZFipDUQUSt0BL1fFT5SimQvUkrdKAhz5pKizYXmVcZZMIeNpIyfbM4n8XbPY8t1bCPRnt-hSoVaBuwTwJ1Z-WFyLBb1BykrrMysIaG24pMHlX_vupqO8rlmQL0L0cG4LDf-DqN6TOiWmB2bxgRrzsPpI8MeFq6a9PSbMoHHSiP53vyYwVGTumgb_bjVbvbYZE98sxLaDRaCnQKvOjPcG2KiTmIrmEbJUHhKz3MMOAizfNduneVqHMm5w3lDIz98hGlgvz99kwAW" />
              <div className="absolute top-3 left-3 bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded tracking-widest uppercase shadow-sm">
                Level 1
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-headline font-extrabold text-base leading-tight">Beginner Tango Fundamentals</h4>
                <span className="material-symbols-outlined text-outline text-lg cursor-pointer hover:text-red-500 transition-colors">favorite</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-primary">Elena Rossi</span>
                <span className="text-[10px] text-outline">•</span>
                <span className="text-xs text-on-surface-variant">Seoul Salon</span>
              </div>
              <div className="bg-surface-container-low rounded-lg p-3 space-y-2 mb-4">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  <span className="text-xs font-medium">Mon 19:00 - 21:00 (4 Weeks)</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                  <span className="text-xs">Gangnam-gu, Seoul</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-outline font-bold uppercase tracking-tighter">Total Price</p>
                  <p className="font-headline font-black text-lg text-primary">120,000 KRW</p>
                </div>
                <button className="bg-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-bold shadow-md active:scale-95 transition-transform hover:brightness-110">
                  Register
                </button>
              </div>
            </div>
          </div>
          {/* Class Card 2 */}
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-surface-variant flex flex-col group hover:shadow-md transition-shadow">
            <div className="relative h-44">
              <img alt="Intermediate Milonga Rhythms" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCc1Lhp9LosvbbfRjGfdp3UBi5mMeofZyBUf_WrIonU9hS7wH4ClW-p4DZ6R0ze-Qph993KxvuqFe5YydMJz3ugLkg0_k4YldtVWQCp6Pq2NKLySuiYjCEaQBufNEDsC-GlXwcqxA0Hm8yyKxJFS2F-CpXFTXMrqXc4SflJL5qPs4ca0hASvDTUOr1norq3fjy--3BjAQnmyU-Wbw_ypXoWZJ6XnnNG00yFNcSSPuQwjHuuttSQh_pr7nu_4P5sZp9C5zcxnfUuEcPs" />
              <div className="absolute top-3 left-3 bg-secondary text-on-secondary text-[10px] font-bold px-2 py-1 rounded tracking-widest uppercase shadow-sm">
                Level 2
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-headline font-extrabold text-base leading-tight">Intermediate Milonga Rhythms</h4>
                <span className="material-symbols-outlined text-outline text-lg cursor-pointer hover:text-red-500 transition-colors">favorite</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-primary">Mateo Silva</span>
                <span className="text-[10px] text-outline">•</span>
                <span className="text-xs text-on-surface-variant">Hongdae Milonga</span>
              </div>
              <div className="bg-surface-container-low rounded-lg p-3 space-y-2 mb-4">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  <span className="text-xs font-medium">Wed 20:00 - 22:00 (4 Weeks)</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                  <span className="text-xs">Mapo-gu, Seoul</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-outline font-bold uppercase tracking-tighter">Total Price</p>
                  <p className="font-headline font-black text-lg text-primary">145,000 KRW</p>
                </div>
                <button className="bg-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-bold shadow-md active:scale-95 transition-transform hover:brightness-110">
                  Register
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category: Intensive Series */}
      <section className="mt-12 px-5">
        <div className="flex items-baseline gap-2 mb-6">
          <h3 className="font-headline text-xl font-black text-on-surface">Intensive Series</h3>
          <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
        </div>
        {/* Intensive Card: Bento Style Integration */}
        <div className="bg-inverse-surface text-inverse-on-surface rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/30 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-error text-[10px] font-black px-2 py-0.5 rounded text-white">LIMITED SLOTS</span>
              <span className="text-xs font-semibold text-primary">Special Workshop</span>
            </div>
            <h4 className="font-headline text-2xl font-bold text-white mb-2 leading-tight">Masterclass: Advanced Embellishments</h4>
            <p className="text-sm text-outline-variant mb-6 leading-relaxed">Perfect your technique with Elena Rossi in this exclusive weekend intensive series.</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-[10px] font-bold text-primary-fixed uppercase tracking-widest mb-1">Schedule</p>
                <p className="text-xs text-white">Sat - Sun <br/>10:00 - 16:00</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-[10px] font-bold text-primary-fixed uppercase tracking-widest mb-1">Fee</p>
                <p className="text-xs text-white">280,000 KRW <br/>(Total 12h)</p>
              </div>
            </div>
            <button className="w-full bg-white text-black py-4 rounded-xl font-black text-sm active:scale-[0.98] transition-all hover:bg-gray-100 shadow-lg">
              Reserve Your Spot
            </button>
          </div>
        </div>
      </section>

      {/* Category: Pop-up Specials */}
      <section className="mt-12 px-5 mb-10">
        <div className="flex items-baseline gap-2 mb-6">
          <h3 className="font-headline text-xl font-black text-on-surface">Pop-up Specials</h3>
          <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
        </div>
        {/* List Style for Pop-ups */}
        <div className="space-y-3">
          <div className="flex items-center gap-4 bg-surface-container-low p-3 rounded-xl border border-transparent hover:border-primary-container hover:bg-white transition-all shadow-sm cursor-pointer group">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <img alt="Friday Night Milonga" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuOYZpIdabp5UpgSlDtMdsEbQejGqwoyJtMogDOIwOMr1XhcLt-W7BW5Oe90Db6GqrWa44nX9u1W_J4zvkohrMgsH4TzqZSFBCsOPZQdK8CDcJpUr8b2UR1VZdfCBW632yIU2xuNIH0ICbwveAX5bAYewjDkY_t25U9rZanMVBEtdEDK_gwrxcLhBGwjftG3lsFEkuPq2v3tThFWjxfKwngI3EbavaeuzGRHV44wvA_Vz6XykEX92Ty39ygDrelxxpt5qmBGIcXAmz" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-primary uppercase mb-0.5">Fri Night Social</p>
              <h5 className="font-headline font-bold text-sm mb-1">Friday Night Milonga</h5>
              <div className="flex items-center gap-3 text-[11px] text-on-surface-variant">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">schedule</span> 20:00</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">payments</span> 15,000 KRW</span>
              </div>
            </div>
            <button className="bg-primary-container text-on-primary-container p-2 rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-sm">
              <span className="material-symbols-outlined text-lg">add</span>
            </button>
          </div>
          <div className="flex items-center gap-4 bg-surface-container-low p-3 rounded-xl border border-transparent hover:border-primary-container hover:bg-white transition-all shadow-sm cursor-pointer group">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <img alt="Tango Body Balance" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJyy16ovXZ_0qsI-LbVcU0WQoz50qPJ76UMUp0ZhcRg7IWDQaiDxg6Ua_bzDDH9Vxjr1JUheR6B9O4FOCqa5PuOjvResPbO-_sBbwYTbvdLT2kxsXUQrrGJ1pMcaFxZEA13VsfI-QCPAp4cMGMNvnfRE6Jq607G_eCiPYe_fQdcODm0-iaviQDLF5qzyTwCtkxKjXrCFA_Xgu3P_7PurdU3aGcApA6oiVvqI71mUyPHYHMT6n5QQWoknwsboKVHkisoeEhCBDHfnsu" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-primary uppercase mb-0.5">Conditioning</p>
              <h5 className="font-headline font-bold text-sm mb-1">Tango Body Balance</h5>
              <div className="flex items-center gap-3 text-[11px] text-on-surface-variant">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">schedule</span> Sun 11:00</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">payments</span> 25,000 KRW</span>
              </div>
            </div>
            <button className="bg-primary-container text-on-primary-container p-2 rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-sm">
              <span className="material-symbols-outlined text-lg">add</span>
            </button>
          </div>
        </div>
      </section>

      {/* Floating Action Notification (Contextual) */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-primary text-on-primary px-6 py-4 rounded-2xl shadow-2xl z-30 flex items-center justify-between pointer-events-auto active:scale-95 transition-transform cursor-pointer">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined">shopping_bag</span>
          <p className="text-xs font-bold">1 Class in Cart</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">120,000 KRW</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
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
