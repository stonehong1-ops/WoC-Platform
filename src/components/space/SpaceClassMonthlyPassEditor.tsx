"use client";

import React from "react";
import { motion } from "framer-motion";

interface SpaceClassMonthlyPassEditorProps {
  onClose: () => void;
}

const SpaceClassMonthlyPassEditor: React.FC<SpaceClassMonthlyPassEditorProps> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[110] bg-surface flex flex-col overflow-y-auto no-scrollbar font-body text-on-surface"
    >
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 px-6 py-4 flex items-center border-b border-outline/20 bg-[#F1F5F9]">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-variant rounded-full transition-colors active:scale-95"
            >
              close
            </button>
            <h1 className="text-xl font-extrabold tracking-tight text-on-surface headline">Monthly Pass Editor</h1>
          </div>
          <button className="bg-primary text-white font-bold text-sm px-6 py-2 rounded-lg shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
            Save
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="max-w-md mx-auto px-6 py-8 space-y-6 w-full">
        {/* Basic Info Card */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline/20 shadow-sm space-y-5">
          {/* Class Title */}
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70" htmlFor="discount-title">Class Title</label>
            <input 
              className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-on-surface-variant/40 outline-none transition-all" 
              id="discount-title" 
              placeholder="Enter discount title" 
              type="text" 
              defaultValue="Summer Bundle"
            />
          </div>
          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70" htmlFor="discount-desc">Description</label>
            <textarea 
              className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-on-surface-variant/40 outline-none resize-none text-sm transition-all" 
              id="discount-desc" 
              placeholder="Describe the discount..." 
              rows={4}
            ></textarea>
          </div>
        </div>

        {/* Pricing & Discount Details Card */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline/20 shadow-sm space-y-5">
          <h2 className="text-sm font-extrabold headline text-on-surface uppercase tracking-widest mb-4">Pricing</h2>
          <div className="space-y-4">
            {/* Currency */}
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70">Currency</label>
              <div className="relative">
                <select className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none outline-none transition-all text-sm">
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-on-surface-variant">expand_more</span>
              </div>
            </div>
            {/* Amount */}
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-on-surface-variant font-bold text-sm">$</span>
                <input 
                  className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg pl-8 pr-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" 
                  placeholder="0.00" 
                  type="number" 
                  defaultValue="150.00"
                />
              </div>
            </div>
          </div>
          {/* Discount Description */}
          <div className="mt-5">
            <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70">Discount Rule</label>
            <textarea 
              className="w-full bg-surface-variant/20 border border-outline/30 rounded-lg px-4 py-3 text-on-surface/60 text-sm outline-none resize-none cursor-not-allowed" 
              disabled 
              id="discount-rule-display" 
              readOnly 
              defaultValue="아래 선택된 모든 수업을 모두 들을 수 있음"
            ></textarea>
          </div>
        </div>

        {/* Select Classes Card */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline/20 shadow-sm">
          <div className="mb-6">
            <h2 className="text-sm font-extrabold headline text-on-surface uppercase tracking-widest">Select Classes</h2>
            <p className="font-body text-xs text-on-surface-variant opacity-70 mt-1">Choose existing classes from this month to include in the bundle.</p>
          </div>
          {/* Class List */}
          <div className="space-y-3">
            {[
              { title: "Advanced Yoga Flow", schedule: "Mon, Wed • 10:00 AM", checked: true },
              { title: "Beginner Pilates", schedule: "Tue, Thu • 05:30 PM", checked: true },
              { title: "Vinyasa Core", schedule: "Fri • 12:00 PM", checked: true },
              { title: "Meditation & Breathwork", schedule: "Sun • 08:00 AM", checked: true },
            ].map((cls, idx) => (
              <label key={idx} className="flex items-center gap-4 p-4 bg-surface-variant/30 rounded-xl border border-outline/20 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5">
                  <input 
                    defaultChecked={cls.checked} 
                    className="peer appearance-none w-5 h-5 border border-outline/40 rounded bg-transparent checked:bg-primary checked:border-primary transition-all duration-200 cursor-pointer" 
                    type="checkbox"
                  />
                  <span className="material-symbols-outlined absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none text-xs font-bold transition-opacity duration-200">check</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{cls.title}</p>
                  <p className="text-[11px] font-bold text-on-surface-variant opacity-70">{cls.schedule}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </main>
    </motion.div>
  );
};

export default SpaceClassMonthlyPassEditor;
