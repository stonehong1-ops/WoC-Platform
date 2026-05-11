"use client";

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/clientApp';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '@/components/providers/NavigationProvider';

interface VenueDetailProps {
  venueId: string;
  onClose: () => void;
}

export default function VenueDetail({ venueId, onClose }: VenueDetailProps) {
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const { setGlobalNavHidden } = useNavigation();

  useEffect(() => {
    if (venueId) {
      setGlobalNavHidden(true);
      return () => setGlobalNavHidden(false);
    }
  }, [venueId, setGlobalNavHidden]);

  useEffect(() => {
    const fetchVenue = async () => {
      if (!venueId) return;
      setLoading(true);
      try {
        const docRef = doc(db, "venues", venueId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setVenue({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching venue:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVenue();
  }, [venueId]);

  if (!venueId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[100] bg-[#f8fbfa] flex flex-col"
      >
        {/* Header */}
        <div className={`absolute top-0 left-0 right-0 z-50 px-4 py-4 flex items-center justify-between transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-[#005BC0]/10' : 'bg-transparent pointer-events-none'}`}>
          <div className="flex-1 flex justify-start pointer-events-auto">
            <button 
              onClick={onClose}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${isScrolled ? 'bg-gray-100 hover:bg-gray-200 text-[#2d3435]' : 'bg-black/40 hover:bg-black/60 backdrop-blur-md text-white'}`}
            >
              <span className="material-symbols-outlined text-[20px] pl-1">arrow_back_ios</span>
            </button>
          </div>
          <div className={`flex-[2] flex justify-center items-center transition-all duration-300 ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
            <span className="text-[14px] font-black uppercase tracking-widest text-[#005BC0] truncate max-w-[200px]">Venue Detail</span>
          </div>
          <div className="flex-1 flex justify-end gap-2 pointer-events-auto">
             <button 
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${isScrolled ? 'bg-gray-100 hover:bg-gray-200 text-[#2d3435]' : 'bg-black/40 hover:bg-black/60 backdrop-blur-md text-white'}`}
            >
              <span className="material-symbols-rounded text-[20px]">share</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-grow flex items-center justify-center font-bold text-[#005BC0] animate-pulse">
            Loading...
          </div>
        ) : !venue ? (
          <div className="flex-grow flex flex-col items-center justify-center gap-4">
            <h1 className="text-2xl font-black">Venue Not Found</h1>
            <button onClick={onClose} className="text-[#005BC0] font-bold underline">Go Back</button>
          </div>
        ) : (
          <main 
            className="flex-grow flex flex-col overflow-y-auto no-scrollbar pb-[100px]"
            onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 50)}
          >
            {/* Hero Image */}
            <div className="w-full aspect-[4/5] bg-gray-100 relative select-none shrink-0">
              <img 
                src={venue.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000"} 
                alt={venue.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between pointer-events-none">
                <div>
                  <span className="px-3 py-1 bg-[#005BC0] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-md">
                    {venue.category || 'VENUE'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-6 -mt-6 relative z-10">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] p-8 shadow-[0_32px_80px_rgba(0,91,192,0.08)] border border-[#005BC0]/5"
              >
              
              <h1 className="mb-8">
                <span className="text-3xl font-black text-[#2D3435] leading-tight block">
                  {venue.name}
                </span>
                {venue.nameKo && (
                  <span className="text-lg font-bold text-[#596061] tracking-normal normal-case block mt-1">
                    {venue.nameKo}
                  </span>
                )}
              </h1>
              
              <div className="h-[1px] w-full bg-[#005BC0]/10 my-8" />
              
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#005BC0] text-[20px]">location_on</span>
                  <p className="text-[14px] font-bold text-[#596061] leading-relaxed">{venue.address}</p>
                </div>
                {venue.phone && (
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#005BC0] text-[20px]">call</span>
                    <p className="text-[14px] font-bold text-[#596061]">{venue.phone}</p>
                  </div>
                )}
              </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-10">
                <button className="bg-[#005BC0] text-white py-5 rounded-3xl font-black text-[13px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                  Share
                </button>
                <button className="bg-white text-[#005BC0] border border-[#005BC0]/20 py-5 rounded-3xl font-black text-[13px] uppercase tracking-widest active:scale-95 transition-all">
                  Favorite
                </button>
              </div>
            </div>
          </main>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
