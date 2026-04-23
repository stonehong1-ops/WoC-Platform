"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/clientApp';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';

export default function VenueDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenue = async () => {
      if (!id) return;
      const docRef = doc(db, "venues", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setVenue({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    };
    fetchVenue();
  }, [id]);

  const handleBack = () => {
    // If we're the first page in the history, go to /groups
    // window.history.length > 1 is usually true even on first load in some browsers, 
    // so we can also check document.referrer
    if (typeof window !== 'undefined' && window.history.length <= 1) {
      router.push('/groups');
    } else {
      router.back();
    }
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-bold text-[#005BC0] animate-pulse">Loading...</div>;
  if (!venue) return <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
    <h1 className="text-2xl font-black">Venue Not Found</h1>
    <button onClick={handleBack} className="text-[#005BC0] font-bold underline">Go Back</button>
  </div>;

  return (
    <div className="min-h-screen bg-[#f8fbfa] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-50 px-6 py-4 flex items-center justify-between border-b border-[#005BC0]/10">
        <button onClick={handleBack} className="tap-target -ml-2">
          <span className="material-symbols-outlined text-[#2D3435]">arrow_back_ios</span>
        </button>
        <span className="text-[14px] font-black uppercase tracking-widest text-[#005BC0]">Venue Detail</span>
        <div className="w-10" />
      </div>

      <main className="flex-grow p-6 flex flex-col gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-8 shadow-[0_32px_80px_rgba(0,91,192,0.08)] border border-[#005BC0]/5"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-[#005BC0] text-white text-[10px] font-black rounded-full uppercase tracking-widest">
              {venue.category}
            </span>
          </div>
          
          <h1 className="text-4xl font-black text-[#2D3435] leading-tight mb-2">
            {venue.name}
          </h1>
          {venue.nameKo && (
            <h2 className="text-xl font-bold text-[#596061] opacity-50 mb-6">
              {venue.nameKo}
            </h2>
          )}
          
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
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-[#005BC0] text-white py-5 rounded-3xl font-black text-[13px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
            Share
          </button>
          <button className="bg-white text-[#005BC0] border border-[#005BC0]/20 py-5 rounded-3xl font-black text-[13px] uppercase tracking-widest active:scale-95 transition-all">
            Favorite
          </button>
        </div>
      </main>
    </div>
  );
}
