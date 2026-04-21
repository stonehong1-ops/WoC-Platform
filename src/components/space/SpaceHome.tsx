"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Community } from "@/types/community";
import SpaceHomeMain from "./SpaceHomeMain";
import SpaceCalendar from "./SpaceCalendar";
import SpaceFeed from "./SpaceFeed";
import SpaceBoard from "./SpaceBoard";
import SpaceGallery from "./SpaceGallery";
import SpaceContact from "./SpaceContact";
import SpaceMap from "./SpaceMap";

export default function SpaceHome({ community }: { community: Community }) {
  const [activeTab, setActiveTab] = useState("Home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // In a real app, you would fetch posts here or subscribe to them
    // For now, we'll just set an empty array after a timeout to simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [community.id]);

  const renderContent = () => {
    switch (activeTab) {
      case "Home":
        return (
          <SpaceHomeMain 
            community={community} 
            posts={posts} 
            loading={loading} 
          />
        );
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
      case "Map":
        return <SpaceMap community={community} />;
      default:
        return <SpaceHomeMain community={community} />;
    }
  };

  return (
    <div className="bg-[#F1F5F9] relative min-h-screen font-body overflow-x-hidden text-[#242c51]">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&family=Inter:wght@400;500;600;700&display=swap');
        
        .bg-blur-primary {
          background-image: radial-gradient(circle at top left, rgba(0, 87, 189, 0.05), transparent 40%);
        }
        .bg-blur-tertiary {
          background-image: radial-gradient(circle at bottom right, rgba(137, 60, 146, 0.05), transparent 40%);
        }
        .font-headline { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>
      
      {/* Atmospheric Background Effects */}
      <div className="fixed inset-0 pointer-events-none bg-blur-tertiary -z-10"></div>
      <div className="fixed inset-0 pointer-events-none bg-blur-primary -z-10"></div>

      {/* TopAppBar */}
      <header className="fixed top-0 w-full bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm flex justify-between items-center px-6 h-16 z-50 transition-colors">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-primary hover:bg-surface-container-low scale-95 active:scale-90 transition-transform p-2 rounded-full flex items-center justify-center"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="font-headline font-extrabold tracking-tight text-xl text-primary">
            {community.name}
          </h1>
        </div>
        <div>
          <button className="text-primary hover:bg-surface-container-low scale-95 active:scale-90 transition-transform p-2 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">search</span>
          </button>
        </div>
      </header>

      {/* Main Experience Layer */}
      <main className="flex-1">
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
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 md:px-4 pb-6 pt-3 bg-surface-container-lowest/95 backdrop-blur-2xl border-t border-outline-variant/10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {[
          { id: "Home", icon: "home" },
          { id: "Calendar", icon: "calendar_today" },
          { id: "Feed", icon: "dynamic_feed" },
          { id: "Map", icon: "map" },
          { id: "Board", icon: "forum" },
          { id: "Gallery", icon: "collections" },
          { id: "Contact", icon: "contact_support" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center px-3 py-1 scale-100 active:scale-95 transition-transform duration-200 ${
              activeTab === item.id ? "bg-primary-container/20 text-primary rounded-2xl" : "text-on-surface-variant/60"
            }`}
          >
            <span 
              className="material-symbols-outlined" 
              style={{ fontVariationSettings: activeTab === item.id ? "'FILL' 1" : "" }}
            >
              {item.icon}
            </span>
            <span className="font-label font-bold text-[10px] uppercase tracking-wider mt-1">{item.id}</span>
          </button>
        ))}
      </nav>

      {/* Hamburger Drawer Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
              onClick={() => setIsMenuOpen(false)}
            />
             <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed top-0 left-0 w-4/5 max-w-sm h-full bg-surface-container-lowest shadow-2xl z-[70] p-8 flex flex-col"
            >
              <div className="flex justify-between items-center mb-12">
                <h2 className="font-headline font-black text-2xl text-primary uppercase tracking-tighter">Menu</h2>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <nav className="flex flex-col gap-6">
                <button 
                  onClick={() => router.push('/')}
                  className="flex items-center gap-4 text-lg font-bold text-on-surface hover:text-primary transition-colors group"
                >
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">home</span> Return Home
                </button>
                <hr className="border-outline-variant/10" />
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">Navigation</p>
                  {["Home", "Calendar", "Feed", "Map", "Board", "Gallery", "Contact"].map((label) => (
                    <button
                      key={label}
                      onClick={() => { setActiveTab(label); setIsMenuOpen(false); }}
                      className={`w-full text-left py-2 text-lg font-bold transition-all border-l-4 pl-4 ${
                        activeTab === label ? "text-primary border-primary bg-primary/5" : "text-on-surface/70 border-transparent hover:border-outline-variant/20"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
