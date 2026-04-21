"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Community } from "@/types/community";
import SpaceHomeConfig from "./SpaceHomeConfig";
import SpaceGalleryEditor from "./SpaceGalleryEditor";
import SpaceContactEditor from "./SpaceContactEditor";

const SpaceProfileSetup = ({ community }: { community: Community }) => {
  const [activePopup, setActivePopup] = useState<string | null>(null);

  return (
    <div className="flex-1 flex flex-col relative font-body selection:bg-blue-500/10">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-[#f7f5ff]/80 backdrop-blur-md flex justify-between items-center px-6 py-4 w-full border-b border-[#a3abd7]/10">
        <div className="flex items-center gap-4">
          <h1 className="font-headline font-bold tracking-tight text-[#242c51] text-xl">Profile Setting</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="hidden md:flex items-center gap-2 px-6 py-2 rounded-full bg-white text-[#0057bd] font-bold text-sm transition-all active:scale-95 border border-[#0057bd]/10 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            Preview
          </button>
          <button className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#242c51]/10 text-[#242c51]/40 font-bold text-sm cursor-not-allowed" disabled>
            Go Live
          </button>
        </div>
      </header>

      <section className="p-6 md:p-10 max-w-6xl mx-auto w-full">
        {/* Intro */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="font-headline font-bold text-4xl md:text-5xl text-[#242c51] mb-4 leading-tight">Setup your business profile</h2>
            <p className="text-[#515981] text-lg max-w-lg">Complete the mandatory configurations below to publish your platform and start accepting users.</p>
          </div>
          
          {/* Progress Indicator */}
          <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#a3abd7]/10 flex-shrink-0">
            <div className="flex items-center gap-4 mb-2">
              <span className="text-3xl font-black text-[#0057bd] font-headline">60%</span>
              <div className="flex-1 h-3 bg-[#efefff] rounded-full overflow-hidden min-w-[120px]">
                <div 
                  className="h-full bg-gradient-to-r from-[#0057bd] to-[#5391ff] transition-all duration-1000" 
                  style={{ width: '60%' }}
                ></div>
              </div>
            </div>
            <p className="text-xs font-bold text-[#515981]/60 uppercase tracking-widest text-right">3 of 5 steps finished</p>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          
          {/* Step 1: Home Config */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-8 rounded-2xl shadow-sm flex flex-col h-full border border-gray-100 hover:border-[#0057bd]/20 transition-all group"
          >
            <div className="mb-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#efefff] flex items-center justify-center text-[#0057bd]">
                  <span className="material-symbols-outlined text-[28px]">home_app_logo</span>
                </div>
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Completed</span>
              </div>
              <h3 className="font-headline font-bold text-xl text-[#242c51] mb-2 tracking-tight">1. Home Config</h3>
              <p className="text-sm text-[#515981] leading-relaxed">Customize your homepage banners, featured products, and the initial user welcome experience.</p>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-50">
              <button 
                onClick={() => setActivePopup('home-config')}
                className="w-full py-3 rounded-xl bg-[#efefff] text-[#0057bd] font-bold text-sm hover:bg-[#0057bd] hover:text-white transition-all active:scale-95 shadow-sm"
              >
                Edit
              </button>
            </div>
          </motion.div>

          {/* Step 2: Gallery */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-8 rounded-2xl shadow-sm flex flex-col h-full border border-gray-100 hover:border-[#893c92]/20 transition-all group"
          >
            <div className="mb-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#ffeefb] flex items-center justify-center text-[#893c92]">
                  <span className="material-symbols-outlined text-[28px]">collections</span>
                </div>
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Needs Edit</span>
              </div>
              <h3 className="font-headline font-bold text-xl text-[#242c51] mb-2 tracking-tight">2. Gallery</h3>
              <p className="text-sm text-[#515981] leading-relaxed">Upload high-resolution business assets and portfolio images.</p>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-50">
              <button 
                onClick={() => setActivePopup('gallery')}
                className="w-full py-3 rounded-xl bg-[#ffeefb] text-[#893c92] font-bold text-sm hover:bg-[#893c92] hover:text-white transition-all active:scale-95 shadow-sm"
              >
                Edit
              </button>
            </div>
          </motion.div>

          {/* Step 3: Contact Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-8 rounded-2xl shadow-sm flex flex-col h-full border border-gray-100 hover:border-[#3a53b7]/20 transition-all group"
          >
            <div className="mb-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#efefff] flex items-center justify-center text-[#3a53b7]">
                  <span className="material-symbols-outlined text-[28px]">contact_mail</span>
                </div>
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Completed</span>
              </div>
              <h3 className="font-headline font-bold text-xl text-[#242c51] mb-2 tracking-tight">3. Contact Info</h3>
              <p className="text-sm text-[#515981] leading-relaxed">Verified address, customer support email, and social media links.</p>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-50">
              <button 
                onClick={() => setActivePopup('contact')}
                className="w-full py-3 rounded-xl bg-[#f2f1ff] text-[#3a53b7] font-bold text-sm hover:bg-[#3a53b7] hover:text-white transition-all active:scale-95 shadow-sm"
              >
                Edit
              </button>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Editor Popups Overlay */}
      <AnimatePresence>
        {activePopup === 'home-config' && (
          <SpaceHomeConfig onClose={() => setActivePopup(null)} />
        )}
        {activePopup === 'gallery' && (
          <SpaceGalleryEditor onClose={() => setActivePopup(null)} />
        )}
        {activePopup === 'contact' && (
          <SpaceContactEditor onClose={() => setActivePopup(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SpaceProfileSetup;
