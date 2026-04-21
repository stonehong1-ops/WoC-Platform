"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SpaceClassAddEditor from "./SpaceClassAddEditor";
import SpaceClassDiscountEditor from "./SpaceClassDiscountEditor";
import SpaceClassMonthlyPassEditor from "./SpaceClassMonthlyPassEditor";

const SpaceClassEditor: React.FC = () => {
  const [activeSubEditor, setActiveSubEditor] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen font-body"
    >
      {/* Header - Integrating into body, but keeping it consistent with the internal layout */}
      <header className="px-6 py-6 w-full">
        <h1 className="font-headline font-extrabold text-2xl tracking-tight text-[#242c51]">Class Settings</h1>
        <p className="text-[#515981] text-sm mt-1">Manage your community classes and schedules.</p>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-4 pb-20 w-full text-[#242c51]">
        {/* Month Navigation Section */}
        <section className="mb-6 flex flex-col gap-3">
          <div className="flex items-center justify-between bg-white p-2 rounded-xl shadow-sm border border-[#a3abd7]/10">
            <button className="w-10 h-10 flex items-center justify-center text-[#0057bd] hover:bg-[#efefff] rounded-lg transition-colors">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <div className="text-center">
              <span className="text-lg font-bold headline text-[#242c51]">June 2024</span>
            </div>
            <button className="w-10 h-10 flex items-center justify-center text-[#0057bd] hover:bg-[#efefff] rounded-lg transition-colors">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-[#a3abd7]/10 shadow-sm">
            <span className="font-semibold text-[#515981] text-sm">Status: <span className="text-[#0057bd]">Open</span></span>
            <label className="relative inline-flex items-center cursor-pointer scale-90">
              <input defaultChecked className="sr-only peer" type="checkbox"/>
              <div className="w-11 h-6 bg-[#a3abd7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0057bd]"></div>
            </label>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="grid grid-cols-3 gap-3 mb-8">
          <button 
            onClick={() => setActiveSubEditor("add-class")}
            className="flex flex-col items-center justify-center gap-1.5 py-4 px-2 bg-[#0057bd] text-white rounded-xl font-bold headline text-[11px] hover:opacity-90 active:scale-95 transition-all shadow-md shadow-[#0057bd]/20"
          >
            <span className="material-symbols-outlined">add</span>
            <span>Add Class</span>
          </button>
          <button 
            onClick={() => setActiveSubEditor("discount")}
            className="flex flex-col items-center justify-center gap-1.5 py-4 px-2 bg-[#c7cfff] text-[#223ea2] rounded-xl font-bold headline text-[11px] hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined">percent</span>
            <span className="text-center leading-tight">Multi-class Discount</span>
          </button>
          <button 
            onClick={() => setActiveSubEditor("monthly-pass")}
            className="flex flex-col items-center justify-center gap-1.5 py-4 px-2 bg-[#f199f7] text-[#5e106a] rounded-xl font-bold headline text-[11px] hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
            <span className="text-center leading-tight">Monthly Pass</span>
          </button>
        </section>

        <AnimatePresence>
          {activeSubEditor === "add-class" && (
            <SpaceClassAddEditor onClose={() => setActiveSubEditor(null)} />
          )}
          {activeSubEditor === "discount" && (
            <SpaceClassDiscountEditor onClose={() => setActiveSubEditor(null)} />
          )}
          {activeSubEditor === "monthly-pass" && (
            <SpaceClassMonthlyPassEditor onClose={() => setActiveSubEditor(null)} />
          )}
        </AnimatePresence>

        {/* Class List Section */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-bold headline text-[#242c51]">Current Schedule</h2>
            <span className="text-[#515981] text-xs font-semibold uppercase tracking-wider">8 Classes total</span>
          </div>
          <div className="space-y-3">
            {/* Class Row 1 */}
            <div className="group cursor-pointer bg-white border border-[#a3abd7]/10 rounded-xl p-4 transition-all active:scale-[0.99] shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-base font-bold text-[#242c51] truncate headline">Beginner Tango</h3>
                    <span className="bg-[#f199f7]/30 text-[#7b2f85] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Popular</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#515981] font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm opacity-60">calendar_today</span>
                      <span>Monday</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm opacity-60">event</span>
                      <span>Dates: 1-8</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <img alt="Instructor" className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpy2QhE9HepwzXB2N9m4-9Wp4XJBa5DPtP5fs0Id8bSBcMTsYBrb2_Zi75bsvYvSF1x-A7_1U3JNHZS4vA6-V3K0MuiSsE6XHOxBSXgJBzER2sITeCViBJw40oTLBjGdHoNj396lX5WLVYqgLgsHtKDSQgoahbjCRitA1dggPXHGGxh5BF9dRH2l1SlofujrmlBLfZ3RL3z91yFvfTDLfZtGT1jxJp11YkIw0ATdiMi1ZW93X1oIg2iZwrqcitz13-cKP7YQnHlRY"/>
                  <span className="material-symbols-outlined text-[#a3abd7] group-hover:text-[#0057bd] transition-colors">chevron_right</span>
                </div>
              </div>
            </div>
            
            {/* Additional Rows */}
            {[
              { title: "Advanced Milonga", day: "Wednesday", dates: "3-10", icon: "person", iconColor: "text-[#515981]", iconBg: "bg-[#dde1ff]" },
              { title: "Tango Vals", day: "Friday", dates: "5-12", icon: "group", iconColor: "text-[#0057bd]", iconBg: "bg-[#6e9fff]/20" },
              { title: "Technique Solo", day: "Saturday", dates: "6-13", icon: "person", iconColor: "text-[#893c92]", iconBg: "bg-[#f199f7]/20" },
            ].map((cls, idx) => (
              <div key={idx} className="group cursor-pointer bg-white border border-[#a3abd7]/10 rounded-xl p-4 transition-all active:scale-[0.99] shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-base font-bold text-[#242c51] truncate headline">{cls.title}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#515981] font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm opacity-60">calendar_today</span>
                        <span>{cls.day}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm opacity-60">event</span>
                        <span>Dates: {cls.dates}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full border-2 border-white ${cls.iconBg} flex items-center justify-center shadow-sm`}>
                      <span className={`material-symbols-outlined text-[16px] ${cls.iconColor}`}>{cls.icon}</span>
                    </div>
                    <span className="material-symbols-outlined text-[#a3abd7] group-hover:text-[#0057bd] transition-colors">chevron_right</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

    </motion.div>
  );
};

export default SpaceClassEditor;
