"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Group } from '@/types/group';
import { GoogleMap, Marker } from '@react-google-maps/api';
import ImageWithFallback from '@/components/common/ImageWithFallback';

interface GroupInfoProps {
  group: Group;
  isLoaded: boolean; // For Google Maps
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

const GroupInfo = ({ group, isLoaded }: GroupInfoProps) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const filters = ['All', 'Events', 'Workshops', 'Classes', 'Socials'];

  // Gallery Data Flattening
  const allItems = useMemo(() => {
    const items: any[] = [];
    if (!group.gallery) return items;

    group.gallery.forEach((section) => {
      section.media.forEach((url, idx) => {
        items.push({
          id: `${section.id}-${idx}`,
          url,
          title: section.title,
          category: section.type === 'photos' ? 'Event' : 'Video',
          date: 'Oct 24, 2023',
          originalSection: section
        });
      });
    });
    return items;
  }, [group.gallery]);

  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesFilter = activeFilter === 'All' || 
                           item.category.toLowerCase() === activeFilter.toLowerCase().slice(0, -1) ||
                           item.originalSection.title.toLowerCase().includes(activeFilter.toLowerCase());
      
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesFilter && matchesSearch;
    });
  }, [allItems, activeFilter, searchQuery]);

  const defaultCoords = { lat: 37.5665, lng: 126.9780 };
  const center = group.coordinates 
    ? { lat: group.coordinates.latitude, lng: group.coordinates.longitude } 
    : defaultCoords;

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-['Plus_Jakarta_Sans']">
      {/* SECTION 1: GALLERY (Premium Design) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-[#002150] tracking-tight mb-2">Explore our community moments</h1>
            <p className="text-[#515981] font-medium">A visual journey through our events, workshops, and daily connections</p>
          </div>
          
          <div className="relative group max-w-md w-full">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-[#a3abd7] group-focus-within:text-primary transition-colors">search</span>
            </div>
            <input 
              type="text" 
              placeholder="Search moments..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 transition-all text-[#242c51] font-medium placeholder:text-[#a3abd7]"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-12">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ${
                activeFilter === filter
                  ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105'
                  : 'bg-white text-[#515981] hover:bg-gray-50 border border-transparent'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-24">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                onClick={() => setSelectedMedia(item.url)}
                className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <ImageWithFallback
                    src={item.url}
                    alt={item.title}
                    fallbackType="gallery"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
                  <span className="text-[10px] font-bold text-primary tracking-wider uppercase">{item.category}</span>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium text-white/80 uppercase tracking-widest">{item.date}</span>
                    <h3 className="text-lg font-bold text-white leading-tight">{item.title}</h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* DIVIDER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-px bg-gray-200 w-full mb-24"></div>
      </div>

      {/* SECTION 2: CONTACT & LOCATION (Integrated Design) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="mb-12">
          <h2 className="text-4xl font-extrabold text-[#002150] tracking-tight mb-2 text-center md:text-left">Contact & Location</h2>
          <p className="text-[#515981] font-medium text-center md:text-left">Find us, connect with our team, or follow our journey</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Map Card */}
          <div className="lg:col-span-8 bg-white rounded-[2.5rem] shadow-sm border border-white overflow-hidden flex flex-col min-h-[500px]">
            <div className="flex-1 relative bg-gray-100">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={center}
                  zoom={16}
                  onLoad={onMapLoad}
                  options={mapOptions}
                >
                  {group.coordinates && <Marker position={center} />}
                </GoogleMap>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-[#a3abd7] animate-pulse">map</span>
                </div>
              )}
              
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/95 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl border border-white flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary">location_on</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[#002150] text-lg leading-tight w-full truncate">
                        {group.name}
                        {group.nativeName && <span className="text-[0.8em] font-medium text-[#515981] ml-1.5">{group.nativeName}</span>}
                      </h3>
                      <p className="text-[#515981] text-sm mt-1 truncate">{group.address || "Address not specified"}</p>
                    </div>
                  </div>
                  {group.address && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(group.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-primary text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[0.98] transition-all"
                    >
                      Get Directions
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Representative & Socials */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            {/* Representative */}
            <div className="bg-primary rounded-[2.5rem] p-8 text-white shadow-xl shadow-primary/20">
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Representative</span>
                <span className="material-symbols-outlined opacity-60">verified_user</span>
              </div>
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-24 h-24 rounded-full border-4 border-white/20 p-1 mb-4">
                  <ImageWithFallback 
                    src={group.representative?.avatar} 
                    alt={group.representative?.name} 
                    fallbackType="avatar"
                    className="w-full h-full rounded-full object-cover" 
                  />
                </div>
                <h3 className="text-2xl font-extrabold">{group.representative?.name || "Community Staff"}</h3>
                <p className="text-white/70 text-sm font-medium">Primary Contact</p>
              </div>
              <div className="space-y-3">
                {group.representative?.phone && (
                  <a href={`tel:${group.representative.phone}`} className="flex items-center gap-4 bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all border border-white/10 group">
                    <div className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-xl">call</span>
                    </div>
                    <div className="text-left">
                      <span className="block text-[10px] font-bold uppercase tracking-widest opacity-60">Mobile</span>
                      <span className="text-base font-bold">{group.representative.phone}</span>
                    </div>
                  </a>
                )}
                <button className="flex items-center gap-4 bg-white text-primary hover:bg-gray-50 p-4 rounded-2xl transition-all w-full group">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-xl">chat_bubble</span>
                  </div>
                  <div className="text-left text-primary">
                    <span className="block text-[10px] font-bold uppercase tracking-widest opacity-60">Message</span>
                    <span className="text-base font-bold">Send Inquiry</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white">
              <h3 className="text-xl font-extrabold text-[#002150] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">share</span>
                Connect Online
              </h3>
              <div className="grid grid-cols-2 gap-4">
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
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border ${
                      sns.url 
                        ? "bg-gray-50 hover:bg-white border-transparent hover:border-primary/20 hover:shadow-sm" 
                        : "opacity-30 grayscale cursor-not-allowed border-transparent"
                    }`}
                    onClick={(e) => !sns.url && e.preventDefault()}
                  >
                    <span className="material-symbols-outlined text-[#242c51]">{sns.icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#242c51]">{sns.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMedia(null)}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
          >
            <button className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-4xl">close</span>
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-7xl w-full max-h-[85vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedMedia} 
                alt="Fullscreen view" 
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupInfo;
