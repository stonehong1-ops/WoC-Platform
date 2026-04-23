"use client";

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GoogleMap, Marker } from '@react-google-maps/api';
import GroupFooter from './GroupFooter';
import { Group } from '@/types/group';
import ImageWithFallback from '@/components/common/ImageWithFallback';

interface GroupContactProps {
  group: Group;
  isLoaded: boolean;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapId: "425069951fef97d91810ab94",
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
};

const GroupContact = ({ group, isLoaded }: GroupContactProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const }
    }
  };

  const defaultCoords = { lat: 37.5665, lng: 126.9780 };
  const center = group.coordinates 
    ? { lat: group.coordinates.latitude, lng: group.coordinates.longitude } 
    : defaultCoords;

  return (
    <div className="relative z-10 max-w-6xl mx-auto pb-32 px-4 md:px-8 pt-8">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="text-center md:text-left space-y-2 mb-12">
          <h1 className="font-headline font-black text-4xl md:text-5xl tracking-tight text-[#242c51]">
            Contact & Location
          </h1>
          <p className="font-body text-[#7c8db5] text-lg max-w-2xl">
            Find our physical location, connect with our representative, or follow our social channels.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Main Map Card - 8 cols */}
          <motion.div 
            variants={itemVariants}
            className="md:col-span-8 bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-xl shadow-[#a3abd7]/10 border border-white/40 overflow-hidden flex flex-col group min-h-[500px]"
          >
            <div className="flex-1 relative bg-slate-100 overflow-hidden">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={center}
                  zoom={16}
                  onLoad={onMapLoad}
                  options={mapOptions}
                >
                  {group.coordinates && (
                    <Marker position={center} />
                  )}
                </GoogleMap>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-pulse flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-5xl text-[#a3abd7]">map</span>
                    <span className="text-[#a3abd7] font-black uppercase tracking-widest text-[10px]">Loading Map...</span>
                  </div>
                </div>
              )}
              
              {/* Overlay for Address Info */}
              <div className="absolute bottom-6 left-6 right-6 z-10">
                <div className="bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl border border-white flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#0057bd]/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#0057bd]">location_on</span>
                    </div>
                    <div className="text-left text-wrap max-w-xs md:max-w-md">
                      <h3 className="font-headline font-black text-[#242c51] text-lg leading-tight">
                        {group.name}
                      </h3>
                      <p className="font-body text-[#7c8db5] text-sm mt-1">
                        {group.address || "Address not specified"}
                        {group.detailedAddress && <span className="block opacity-70">{group.detailedAddress}</span>}
                      </p>
                    </div>
                  </div>
                  {group.address && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(group.address + (group.detailedAddress ? ' ' + group.detailedAddress : ''))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#0057bd] text-white px-8 py-3 rounded-2xl font-headline font-black text-sm tracking-wide shadow-lg shadow-[#0057bd]/20 hover:scale-[0.98] active:scale-95 transition-all w-full md:w-auto text-center"
                    >
                      Get Directions
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Representative Card - 4 cols */}
          <motion.div 
            variants={itemVariants}
            className="md:col-span-4 bg-[#0057bd] rounded-[2.5rem] p-8 flex flex-col justify-between text-white shadow-xl shadow-[#0057bd]/20"
          >
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <span className="font-label text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Representative</span>
                <span className="material-symbols-outlined opacity-60">verified_user</span>
              </div>
              
              <div className="flex flex-col items-center text-center py-4 space-y-4">
                <div className="w-24 h-24 rounded-full border-4 border-white/20 p-1 overflow-hidden shadow-2xl shadow-blue-900/20">
                  <ImageWithFallback 
                    src={group.representative?.avatar} 
                    alt={group.representative?.name || "Representative"} 
                    nameForAvatar={group.representative?.name}
                    fallbackType="avatar"
                    className="w-full h-full rounded-full object-cover bg-white/10" 
                  />
                </div>
                <div>
                  <h3 className="font-headline font-black text-2xl tracking-tight">
                    {group.representative?.name || "Community Staff"}
                  </h3>
                  <p className="font-body text-white/70 text-sm font-medium">
                    Primary Contact
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mt-8">
              {group.representative?.phone && (
                <a 
                  href={`tel:${group.representative.phone}`}
                  className="flex items-center gap-4 w-full bg-white/10 hover:bg-white/20 px-6 py-4 rounded-[1.5rem] transition-all border border-white/10 group"
                >
                  <div className="w-10 h-10 rounded-full bg-white text-[#0057bd] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-xl">call</span>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Mobile</span>
                    <span className="font-headline font-bold text-base">{group.representative.phone}</span>
                  </div>
                </a>
              )}
              <button className="flex items-center gap-4 w-full bg-white text-[#0057bd] hover:bg-white/90 px-6 py-4 rounded-[1.5rem] transition-all border border-white group">
                <div className="w-10 h-10 rounded-full bg-[#0057bd]/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-xl">chat_bubble</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-[#0057bd]/70">Message</span>
                  <span className="font-headline font-bold text-base">Send Inquiry</span>
                </div>
              </button>
            </div>
          </motion.div>

          {/* Public Transport Card - 6 cols */}
          <motion.div 
            variants={itemVariants}
            className="md:col-span-6 bg-white/70 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-xl shadow-[#a3abd7]/10 border border-white/40"
          >
            <div className="space-y-6 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0057bd]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#0057bd]">directions_transit</span>
                </div>
                <h3 className="font-headline font-black text-xl text-[#242c51]">Public Transportation</h3>
              </div>
              
              <div className="bg-[#f7f5ff] rounded-3xl p-6 min-h-[120px] flex items-center">
                {group.publicTransport ? (
                  <p className="font-body text-[#242c51] text-sm leading-relaxed whitespace-pre-wrap">
                    {group.publicTransport}
                  </p>
                ) : (
                  <p className="font-body text-[#7c8db5] text-sm italic">
                    Transportation information hasn't been added yet.
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Social Links Card - 6 cols */}
          <motion.div 
            variants={itemVariants}
            className="md:col-span-6 bg-[#f7f5ff] rounded-[2.5rem] p-8 shadow-xl shadow-[#a3abd7]/10 border border-white/40 flex flex-col justify-between"
          >
            <div className="space-y-6 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[#0057bd]">share</span>
                </div>
                <h3 className="font-headline font-black text-xl text-[#242c51]">Connect Online</h3>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { id: 'instagram', icon: 'photo_camera', label: 'Instagram', url: group.socialLinks?.instagram },
                  { id: 'facebook', icon: 'public', label: 'Facebook', url: group.socialLinks?.facebook },
                  { id: 'website', icon: 'language', label: 'Website', url: group.socialLinks?.website },
                  { id: 'twitter', icon: 'close', label: 'X', url: group.socialLinks?.twitter }
                ].map((sns) => (
                  <a 
                    key={sns.id}
                    href={sns.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex flex-col items-center gap-2 p-4 rounded-3xl transition-all border ${
                      sns.url 
                        ? "bg-white hover:bg-white border-white hover:border-[#0057bd]/20 hover:scale-105" 
                        : "bg-slate-100 border-transparent opacity-40 cursor-not-allowed"
                    }`}
                    onClick={(e) => !sns.url && e.preventDefault()}
                  >
                    <span className="material-symbols-outlined text-[#242c51]">{sns.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#242c51]">{sns.label}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="mt-8 p-4 bg-white/40 rounded-2xl flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#7c8db5]">
                Real-time support available
              </p>
            </div>
          </motion.div>

        </div>
      </motion.div>

      <div className="mt-20">
        <GroupFooter communityName={group.name} />
      </div>
    </div>
  );
};

export default GroupContact;
