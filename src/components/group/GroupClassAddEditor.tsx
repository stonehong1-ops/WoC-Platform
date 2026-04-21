"use client";

import React from "react";
import { motion } from "framer-motion";

interface GroupClassAddEditorProps {
  onClose: () => void;
}

const GroupClassAddEditor: React.FC<GroupClassAddEditorProps> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[110] bg-surface flex flex-col overflow-y-auto no-scrollbar font-body text-on-surface"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F1F5F9] py-4 flex items-center border-b border-outline/20 px-4">
        <div className="max-w-md mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-variant rounded-full transition-colors active:scale-95"
            >
              close
            </button>
            <h1 className="text-xl font-extrabold tracking-tight text-on-surface headline">Add Class</h1>
          </div>
          <button className="bg-primary text-white font-bold text-sm px-5 py-2 rounded-lg shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
            Save
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-8 group-y-6 w-full">
        {/* Title and Description Section */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline/20 shadow-sm group-y-5">
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70">Class Title</label>
            <input 
              className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-on-surface-variant/40 outline-none transition-all" 
              placeholder="e.g. Advanced Contemporary Dance" 
              type="text"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70">Description</label>
            <textarea 
              className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-on-surface-variant/40 outline-none resize-none text-sm transition-all" 
              placeholder="Provide class syllabus and student expectations..." 
              rows={4}
            ></textarea>
            <div className="mt-2 flex justify-end">
              <span className="text-[10px] text-on-surface-variant font-bold opacity-60">0 / 2000 characters</span>
            </div>
          </div>
        </div>

        {/* Level Section */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline/20 shadow-sm">
          <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70">Level</label>
          <div className="relative">
            <select className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none outline-none transition-all">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
              <option>Masterclass</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-on-surface-variant">expand_more</span>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline/20 shadow-sm">
          <h2 className="text-sm font-extrabold headline text-on-surface uppercase tracking-widest mb-4">Pricing</h2>
          <div className="group-y-4">
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70">Currency</label>
              <div className="relative">
                <select className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none outline-none transition-all text-sm">
                  <option>USD - US Dollar</option>
                  <option>KRW - South Korean Won</option>
                  <option>EUR - Euro</option>
                  <option>JPY - Japanese Yen</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-on-surface-variant">expand_more</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-on-surface-variant font-bold text-sm">$</span>
                <input 
                  className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg pl-8 pr-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" 
                  placeholder="0.00" 
                  type="number"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Instructors Section */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline/20 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-sm font-extrabold headline text-on-surface uppercase tracking-widest">Instructors</h2>
            <button className="flex items-center gap-1.5 text-primary font-bold text-xs hover:bg-surface-variant px-3 py-1.5 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-base">add</span>
              Add Instructor
            </button>
          </div>
          <div className="group-y-3">
            <div className="flex items-center gap-4 p-4 bg-surface-variant/30 rounded-xl border border-outline/20 group">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">person</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-on-surface">Elena Rodriguez</p>
                <p className="text-[11px] font-bold text-on-surface-variant opacity-70">Lead Instructor</p>
              </div>
              <button className="material-symbols-outlined text-on-surface-variant/40 hover:text-error transition-colors">delete</button>
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline/20 shadow-sm">
          <div className="mb-6">
            <h2 className="text-sm font-extrabold headline text-on-surface uppercase tracking-widest">Schedule</h2>
          </div>
          <div className="group-y-6">
            {/* Schedule Entry (Week 1 Example) */}
            <div className="p-5 bg-surface-variant/30 rounded-xl border border-outline/20 relative">
              <div className="group-y-4">
                <div className="flex justify-between items-end">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase opacity-70">Date (Week 1)</label>
                    <input 
                      className="w-full bg-surface-container-lowest border border-outline/30 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 outline-none" 
                      type="date" 
                      defaultValue="2024-10-21"
                    />
                  </div>
                  <button className="ml-3 mb-1 material-symbols-outlined text-on-surface-variant/40 hover:text-error transition-colors">delete</button>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase opacity-70">Time Slot</label>
                  <input 
                    className="w-full bg-surface-container-lowest border border-outline/30 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 outline-none" 
                    placeholder="10:00 AM - 11:30 AM" 
                    type="text" 
                    defaultValue="10:00 AM - 11:30 AM"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase opacity-70">Lesson Content</label>
                  <textarea 
                    className="w-full bg-surface-container-lowest border border-outline/30 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 outline-none resize-none" 
                    placeholder="e.g. Fundamental movements and warm-up routine..." 
                    rows={2}
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <div className="relative w-24">
              <select className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg pl-4 pr-8 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 appearance-none outline-none transition-all font-bold">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-2.5 pointer-events-none text-on-surface-variant">expand_more</span>
            </div>
            <button className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 bg-primary text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
              <span className="material-symbols-outlined text-base">add</span>
              Add weeks
            </button>
          </div>
        </div>
      </main>

      {/* Decorative elements */}
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </motion.div>
  );
};

export default GroupClassAddEditor;
