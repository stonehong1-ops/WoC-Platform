"use client";

import React from "react";
import { motion } from "framer-motion";

interface GroupShopAddEditorProps {
  onClose: () => void;
}

const GroupShopAddEditor: React.FC<GroupShopAddEditorProps> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[110] bg-[#F1F5F9] flex flex-col overflow-y-auto no-scrollbar font-body"
    >
      {/* TopAppBar */}
      <header className="bg-white/90 backdrop-blur-3xl sticky top-0 z-50 border-b border-slate-100 flex justify-between items-center w-full px-6 py-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="text-[#242c51] hover:bg-slate-100 transition-all duration-200 active:scale-[0.95] p-2 -ml-2 rounded-full"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <h1 className="font-headline font-extrabold text-[1.5rem] tracking-tight text-slate-900">Add Item</h1>
        </div>
        <button 
          onClick={onClose}
          className="bg-[#0057bd] text-white font-headline font-bold tracking-tight hover:bg-[#004ca6] transition-all duration-200 active:scale-[0.97] px-5 py-2 rounded-lg shadow-sm"
        >
          Save
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto p-6 group-y-8 mt-4 w-full">
        {/* Basic Info Section */}
        <section className="bg-white rounded-xl shadow-sm p-6 group-y-6 border border-[#a3abd7]/10">
          <div>
            <label className="block font-body text-[13px] font-medium text-[#515981] mb-2" htmlFor="item-title">Item Title</label>
            <input 
              className="w-full bg-[#cad2ff]/20 border-0 rounded-lg px-4 py-3 text-[#242c51] font-body text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 transition-all placeholder:text-[#a3abd7]" 
              id="item-title" 
              placeholder="e.g. Wireless Noise-Cancelling Headphones" 
              type="text"
            />
          </div>
          <div>
            <label className="block font-body text-[13px] font-medium text-[#515981] mb-2" htmlFor="item-description">Item Description</label>
            <textarea 
              className="w-full bg-[#cad2ff]/20 border-0 rounded-lg px-4 py-3 text-[#242c51] font-body text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 transition-all placeholder:text-[#a3abd7] resize-y" 
              id="item-description" 
              placeholder="Describe the item in detail..." 
              rows={4}
            ></textarea>
          </div>
        </section>

        {/* Images Section */}
        <section className="bg-white rounded-xl shadow-sm p-6 group-y-4 border border-[#a3abd7]/10">
          <div className="flex justify-between items-center">
            <label className="block font-body text-[13px] font-medium text-[#515981]">Item Images (Up to 5)</label>
            <span className="font-body text-[11px] text-[#a3abd7] uppercase font-bold tracking-wider">0 / 5</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {/* Upload Button */}
            <button className="aspect-square bg-[#e4e7ff]/30 border-2 border-dashed border-[#a3abd7]/40 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-[#d6dbff]/40 transition-colors group cursor-pointer active:scale-95 duration-200">
              <span className="material-symbols-outlined text-[#a3abd7] group-hover:text-[#0057bd] transition-colors text-3xl">add_photo_alternate</span>
              <span className="font-label text-[11px] font-bold uppercase tracking-wider text-[#a3abd7] group-hover:text-[#0057bd] transition-colors">Upload</span>
            </button>
            {/* Placeholder slots */}
            <div className="aspect-square bg-slate-50 border border-dashed border-[#a3abd7]/20 rounded-lg opacity-50"></div>
            <div className="aspect-square bg-slate-50 border border-dashed border-[#a3abd7]/20 rounded-lg opacity-50"></div>
            <div className="aspect-square bg-slate-50 border border-dashed border-[#a3abd7]/20 rounded-lg opacity-50 hidden sm:block"></div>
            <div className="aspect-square bg-slate-50 border border-dashed border-[#a3abd7]/20 rounded-lg opacity-50 hidden md:block"></div>
          </div>
        </section>

        {/* Categorization */}
        <section className="bg-white rounded-xl shadow-sm p-6 group-y-6 border border-[#a3abd7]/10">
          <div>
            <label className="block font-body text-[13px] font-medium text-[#515981] mb-2" htmlFor="category">Category</label>
            <div className="relative">
              <select 
                className="w-full bg-[#cad2ff]/20 border-0 rounded-lg px-4 py-3 text-[#242c51] font-body text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 transition-all appearance-none pr-10" 
                id="category"
                defaultValue=""
              >
                <option disabled value="">Select Category</option>
                <option value="electronics">Electronics</option>
                <option value="audio">Audio</option>
                <option value="accessories">Accessories</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#a3abd7] pointer-events-none">expand_more</span>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-white rounded-xl shadow-sm p-6 group-y-6 border border-[#a3abd7]/10 mb-8 font-body">
          <h3 className="font-headline font-bold text-[14px] uppercase tracking-wide text-[#242c51]">Pricing</h3>
          <div className="group-y-6">
            <div>
              <label className="block font-body text-[11px] font-bold text-[#a3abd7] uppercase tracking-wider mb-2" htmlFor="currency">Currency</label>
              <div className="relative">
                <select 
                  className="w-full bg-[#cad2ff]/20 border border-[#a3abd7]/20 rounded-lg px-4 py-3 text-[#242c51] font-body text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 transition-all appearance-none pr-10" 
                  id="currency"
                  defaultValue="USD"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="KRW">KRW - South Korean Won</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#a3abd7] pointer-events-none">expand_more</span>
              </div>
            </div>
            <div>
              <label className="block font-body text-[11px] font-bold text-[#a3abd7] uppercase tracking-wider mb-2" htmlFor="price">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#242c51] font-body text-[16px] font-semibold">$</span>
                <input 
                  className="w-full bg-[#cad2ff]/20 border border-[#a3abd7]/20 rounded-lg pl-8 pr-4 py-3 text-[#242c51] font-body text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 transition-all placeholder:text-[#a3abd7]" 
                  id="price" 
                  placeholder="0.00" 
                  type="number"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </motion.div>
  );
};

export default GroupShopAddEditor;
