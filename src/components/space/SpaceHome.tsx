"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Community } from "@/types/community";
import SpaceHomeMain from "./SpaceHomeMain";
import SpaceCalendar from "./SpaceCalendar";
import SpaceFeed from "./SpaceFeed";
import SpaceBoard from "./SpaceBoard";
import SpaceGallery from "./SpaceGallery";
import SpaceContact from "./SpaceContact";

export default function SpaceHome({ community }: { community: Community }) {
  const [activeTab, setActiveTab] = useState("Home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Home":
        return <SpaceHomeMain community={community} />;
      case "Calendar":
        return <SpaceCalendar community={community} />;
      case "Feed":
        return <SpaceFeed community={community} />;
      case "Board":
        return <SpaceBoard community={community} />;
      case "Gallery":
        return <SpaceGallery community={community} />;
      case "Contact":
        return <SpaceContact community={community} />;
      default:
        return <SpaceHomeMain community={community} />;
    }
  };

  return (
    <div className="bg-[#F1F5F9] text-[#242c51] min-h-screen flex overflow-hidden font-body selection:bg-[#0057bd]/10 relative">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@700;800&display=swap');
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          vertical-align: middle;
        }
        .font-headline { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .bg-blur-primary {
          background-image: radial-gradient(circle at top left, rgba(59, 130, 246, 0.05), transparent 40%);
        }
        
        .bg-blur-tertiary {
          background-image: radial-gradient(circle at bottom right, rgba(137, 60, 146, 0.05), transparent 40%);
        }
      `}</style>

      {/* Atmospheric Background Effects */}
      <div className="fixed inset-0 pointer-events-none bg-blur-tertiary -z-10"></div>
      <div className="fixed inset-0 pointer-events-none bg-blur-primary -z-10"></div>

      {/* Navigation Drawer Component (Sidebar) - DO NOT TOUCH AS PER USER REQUEST */}
      <aside className={`fixed inset-y-0 left-0 z-[60] flex flex-col py-8 bg-white dark:bg-slate-900 h-full w-80 rounded-r-3xl shadow-2xl shadow-blue-900/10 font-headline text-sm font-medium transition-transform duration-300 lg:translate-x-0 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Profile Header */}
        <div className="px-6 mb-8 flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => router.push('/')}>
            <div className="absolute -inset-1 bg-gradient-to-tr from-[#0057bd] to-[#6e9fff] rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <img 
              alt="Curator Admin" 
              className="relative h-14 w-14 rounded-full object-cover border-2 border-white shadow-sm" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0Ng87KONyvBOgFvp-1LRX3WNjTO0RexQhCMxyK_7YcS_2poaUarQZwyBw8sYF95IkjeYAfn6biKUc9jJ7qgBMQ1fCFDnVvLZ_9QLn6nC1t9Bi8ckk_ad1ugjRUoDbduXu1Io0HLBFbZxZOHsH4BMP1zVyMP48wE1l1tcJ1koxecJ9jmc5rELtjJDBBO_TYhwP_SD7y7HPn0GnFHOSew3pDnflxAK0ULU6qarjX6tItNDSzTnblhxLzlclR36i2yASGgKhQV-fLzw" 
            />
          </div>
          <div className="flex flex-col">
            <h2 className="text-[#242c51] font-extrabold text-lg tracking-tight">The Curator</h2>
            <span className="text-[#515981] text-xs font-medium">Community Lead</span>
          </div>
        </div>

        {/* Scrollable Menu Content */}
        <nav className="flex-1 overflow-y-auto px-4 space-y-6 no-scrollbar pb-10">
          {/* Section: Navigation */}
          <div>
            <h3 className="px-2 mb-2 text-[10px] uppercase tracking-[0.15em] font-bold text-[#a3abd7]">Navigation</h3>
            <button 
              onClick={() => router.push('/')}
              className="w-full flex items-center gap-3 px-4 py-3 text-[#242c51] dark:text-slate-300 hover:bg-[#f7f5ff] dark:hover:bg-slate-800 rounded-xl hover:translate-x-1 transition-transform duration-200"
            >
              <span className="material-symbols-outlined text-[#0057bd]">keyboard_return</span>
              <span>Return Home</span>
            </button>
          </div>

          {/* Section: Menu */}
          <div>
            <h3 className="px-2 mb-2 text-[10px] uppercase tracking-[0.15em] font-bold text-[#a3abd7]">Menu</h3>
            <div className="space-y-1">
              {[
                { id: "Home", icon: "home", label: "Home" },
                { id: "Calendar", icon: "calendar_today", label: "Calendar" },
                { id: "Feed", icon: "rss_feed", label: "Feed" },
                { id: "Board", icon: "forum", label: "Board" },
                { id: "Gallery", icon: "grid_view", label: "Gallery" },
                { id: "Contact", icon: "mail", label: "Contact" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeTab === item.id 
                      ? "bg-[#efefff] dark:bg-blue-900/30 text-[#0057bd] dark:text-blue-200 font-bold" 
                      : "text-[#242c51] dark:text-slate-300 hover:bg-[#f7f5ff] dark:hover:bg-slate-800 hover:translate-x-1"
                  }`}
                >
                  <span 
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: activeTab === item.id ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section: App Settings */}
          <div>
            <h3 className="px-2 mb-2 text-[10px] uppercase tracking-[0.15em] font-bold text-[#a3abd7]">App Settings</h3>
            <div className="space-y-1">
              {[
                { icon: "person_edit", label: "Setup Profile" },
                { icon: "settings_applications", label: "Community Settings" },
              ].map((item) => (
                <button key={item.label} className="w-full flex items-center gap-3 px-4 py-3 text-[#242c51] dark:text-slate-300 hover:bg-[#f7f5ff] dark:hover:bg-slate-800 rounded-xl hover:translate-x-1 transition-transform duration-200">
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}

              {/* Toggles */}
              {[
                { icon: "school", label: "Class Setting", active: true },
                { icon: "shopping_bag", label: "Shop Setting", active: false },
                { icon: "bed", label: "Stay Setting", active: true },
                { icon: "key", label: "Rental Setting", active: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between px-4 py-3 text-[#242c51] dark:text-slate-300 hover:bg-[#f7f5ff] dark:hover:bg-slate-800 rounded-xl group transition-all">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <div className={`w-8 h-4 rounded-full relative ${item.active ? "bg-[#0057bd]" : "bg-[#a3abd7]"}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${item.active ? "right-0.5" : "left-0.5"}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Admin */}
          <div className="pb-8">
            <h3 className="px-2 mb-2 text-[10px] uppercase tracking-[0.15em] font-bold text-[#a3abd7]">Admin</h3>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-[#242c51] dark:text-slate-300 hover:bg-[#f7f5ff] dark:hover:bg-slate-800 rounded-xl hover:translate-x-1 transition-transform duration-200">
              <span className="material-symbols-outlined">group</span>
              <span>Members</span>
              <span className="ml-auto bg-[#0057bd]/10 text-[#0057bd] text-[10px] font-black px-1.5 py-0.5 rounded-md">24</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Overlay for mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-80 h-screen overflow-y-auto no-scrollbar relative flex flex-col bg-transparent">
        {/* Top App Bar */}
        <header className="w-full top-0 sticky z-50 bg-slate-50/90 backdrop-blur-xl border-b border-slate-200/20 shadow-sm flex items-center justify-between px-6 h-16 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(true)} className="material-symbols-outlined text-[#0057bd] p-2 hover:bg-slate-200/50 rounded-full transition-all active:scale-90 flex items-center justify-center">menu</button>
            <h1 className="font-headline font-extrabold tracking-tight text-xl text-[#0057bd]">Freestyle Tango</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined text-[#0057bd] p-2 hover:bg-slate-200/50 rounded-full transition-all active:scale-95">search</button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* BottomNavBar (Mobile only) */}
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 md:px-4 pb-6 pt-3 bg-slate-50/95 backdrop-blur-2xl border-t border-slate-200/10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] lg:hidden">
          {[
            { id: "Home", icon: "home", label: "Home" },
            { id: "Calendar", icon: "calendar_today", label: "Calendar" },
            { id: "Feed", icon: "dynamic_feed", label: "Feed" },
            { id: "Board", icon: "forum", label: "Board" },
            { id: "Gallery", icon: "collections", label: "Gallery" },
            { id: "Contact", icon: "contact_support", label: "Contact" },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center justify-center px-3 py-1 scale-100 active:scale-95 transition-transform duration-200 ${
                activeTab === item.id ? "bg-blue-50 text-[#0057bd] rounded-2xl" : "text-slate-500 hover:text-[#0057bd]"
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === item.id ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
              <span className="font-label font-bold text-[10px] uppercase tracking-wider mt-1">{item.label}</span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}
