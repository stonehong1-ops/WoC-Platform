"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";

export default function GroupFunctionReviewPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const handleNext = () => {
    router.push(`/groups/${groupId}/next`);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="bg-[#faf9fe] text-[#1a1b1f] text-[16px] leading-[1.6] font-normal overflow-hidden min-h-screen relative font-body">
      {/* Background Content: Function Selection Screen */}
      <main className="min-h-screen pt-20 pb-32 px-[20px] md:px-[64px]">
        <header className="mb-[24px]">
          <h1 className="font-headline text-[32px] leading-[1.2] tracking-[-0.01em] font-semibold text-[#1a1b1f]">WoC Group Function Builder</h1>
          <p className="text-[16px] leading-[1.6] font-normal text-[#414755] mt-2">Select modules to expand your community's capabilities.</p>
        </header>

        {/* Bento Grid Selection (Background context) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#eeedf3] rounded-xl p-6 border border-[#c1c6d7]/30 flex flex-col gap-4 opacity-50">
            <span className="material-symbols-outlined text-[#0058bc] text-4xl">inventory_2</span>
            <h3 className="text-[24px] leading-[1.3] font-semibold text-[#1a1b1f]">Inventory Hub</h3>
            <p className="text-[14px] leading-[1.4] tracking-[0.01em] font-medium">Manage collective assets with ease.</p>
          </div>
          <div className="bg-[#eeedf3] rounded-xl p-6 border border-[#c1c6d7]/30 flex flex-col gap-4 opacity-50">
            <span className="material-symbols-outlined text-[#0058bc] text-4xl">analytics</span>
            <h3 className="text-[24px] leading-[1.3] font-semibold text-[#1a1b1f]">Impact Metrics</h3>
            <p className="text-[14px] leading-[1.4] tracking-[0.01em] font-medium">Track community growth and engagement.</p>
          </div>
          <div className="bg-[#eeedf3] rounded-xl p-6 border border-[#c1c6d7]/30 flex flex-col gap-4 opacity-50">
            <span className="material-symbols-outlined text-[#0058bc] text-4xl">stadium</span>
            <h3 className="text-[24px] leading-[1.3] font-semibold text-[#1a1b1f]">Event Master</h3>
            <p className="text-[14px] leading-[1.4] tracking-[0.01em] font-medium">Professional ticketing and hosting tools.</p>
          </div>
        </div>
      </main>

      {/* Bottom Sheet Overlay Container */}
      <div className="fixed inset-0 bg-[#1a1b1f]/20 z-50 flex flex-col justify-end">
        {/* The Bottom Sheet */}
        <section 
          className="w-full max-w-2xl mx-auto rounded-t-[32px] shadow-[0px_-20px_40px_rgba(0,0,0,0.08)] px-[20px] py-8 md:px-12 flex flex-col animate-slide-up"
          style={{
            background: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(255, 255, 255, 0.5)",
          }}
        >
          {/* Handle */}
          <div className="w-12 h-1.5 bg-[#c1c6d7]/50 rounded-full mx-auto mb-8"></div>
          
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-headline text-[32px] leading-[1.2] tracking-[-0.01em] font-semibold text-[#1a1b1f]">Review Selection</h2>
            <div className="bg-[#0058bc]/10 text-[#0058bc] px-4 py-1 rounded-full flex items-center gap-2">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="text-[14px] leading-[1.4] tracking-[0.01em] font-medium">5 Modules Active</span>
            </div>
          </div>

          {/* Function List */}
          <div className="flex flex-col gap-4 mb-[80px] overflow-y-auto max-h-[353px]">
            {[
              { icon: "manage_accounts", name: "Class Manager A", price: "$8/mo" },
              { icon: "how_to_reg", name: "Attendance Check", price: "$4/mo" },
              { icon: "notifications_active", name: "Parent Notifications", price: "$6/mo" },
              { icon: "smart_toy", name: "AI Assistant", price: "$12/mo" },
              { icon: "shopping_bag", name: "Group Shop", price: "$10/mo" }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-[#ffffff]/50 rounded-xl border border-white/40">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#e2dfff] flex items-center justify-center text-[#0c006a]">
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <span className="text-[18px] leading-[1.6] text-[#1a1b1f] font-semibold">{item.name}</span>
                </div>
                <span className="text-[16px] leading-[1.6] font-normal text-[#414755]">{item.price}</span>
              </div>
            ))}
          </div>

          {/* Footer Section */}
          <div className="mt-auto pt-6 border-t border-[#c1c6d7]/20">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="font-headline text-[32px] leading-[1.2] tracking-[-0.01em] font-semibold text-[#1a1b1f]">Total: $40 / month</p>
                <p className="text-[12px] leading-[1.2] font-semibold text-[#414755] mt-1">Starting next billing cycle</p>
              </div>
              <div className="hidden md:flex flex-col items-end opacity-60">
                <p className="text-[12px] leading-[1.2] font-semibold uppercase tracking-wider">Estimated Growth</p>
                <p className="text-[16px] leading-[1.6] font-bold text-[#0058bc]">+24% Efficiency</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={handleBack}
                className="w-full py-4 px-8 border border-[#c1c6d7] text-[#1a1b1f] font-semibold rounded-xl hover:bg-[#e3e2e7]/50 transition-all bg-transparent flex items-center justify-center gap-2"
              >
                Go back
              </button>
              <button 
                onClick={handleNext}
                className="w-full py-4 px-8 bg-[#0058bc] text-[#ffffff] font-bold rounded-xl shadow-lg shadow-[#0058bc]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                I agree and keep going
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
