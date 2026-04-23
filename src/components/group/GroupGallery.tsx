"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Group, GallerySection } from '@/types/group';
import GroupFooter from './GroupFooter';
import ImageWithFallback from '@/components/common/ImageWithFallback';

interface GroupGalleryProps {
  group: Group;
}

const GroupGallery = ({ group }: GroupGalleryProps) => {
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'photos' | 'videos' } | null>(null);

  const gallery = group.gallery || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring" as const,
        damping: 25,
        stiffness: 100
      }
    }
  };

  return (
    <div className="relative z-10 pb-40 px-6 md:px-12 max-w-7xl mx-auto font-body">
      {/* Premium Gallery Header */}
      <section className="mb-24 md:mb-32 pt-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-10"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-12 h-[3px] bg-[#0057bd] rounded-full"></span>
              <p className="text-[#0057bd] text-[10px] font-black uppercase tracking-[0.4em] italic">
                {group.name} Archive
              </p>
            </div>
            <h2 className="font-headline font-black text-6xl md:text-8xl tracking-tighter text-[#242c51] italic uppercase leading-[0.85]">
              The <span className="text-[#0057bd] relative">
                Visual
                <motion.svg 
                  className="absolute -bottom-2 left-0 w-full h-3 text-[#0057bd]/20" 
                  viewBox="0 0 100 10" 
                  preserveAspectRatio="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="8" />
                </motion.svg>
              </span><br />Chronicle
            </h2>
          </div>
          
          <div className="max-w-xs md:text-right border-l-2 md:border-l-0 md:border-r-2 border-[#efefff] pl-6 md:pl-0 md:pr-6 py-2">
            <p className="text-[#515981] text-sm font-medium leading-relaxed italic opacity-70">
              "Capturing the ephemeral moments of rhythm and connection that define our global family."
            </p>
          </div>
        </motion.div>
      </section>

      {/* Gallery Sections */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-40"
      >
        {gallery.length > 0 ? (
          gallery.map((section, idx) => (
            <motion.section 
              key={section.id}
              variants={itemVariants}
              className="space-y-12"
            >
              {/* Section Header with Index */}
              <div className="flex items-end justify-between border-b-2 border-[#f1f3ff] pb-8">
                <div className="flex items-center gap-8">
                  <span className="font-headline font-black text-5xl md:text-6xl text-[#242c51]/5 italic leading-none select-none">
                    {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-headline font-black text-3xl md:text-4xl text-[#242c51] tracking-tight uppercase italic leading-none">
                      {section.title}
                    </h3>
                    <p className="text-[10px] font-black text-[#a3abd7] uppercase tracking-[0.3em] opacity-60">
                      {section.type === 'photos' ? 'Still Frame Collection' : 'Motion Picture Archive'}
                    </p>
                  </div>
                </div>
                
                <div className="hidden sm:flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-white border border-[#efefff] shadow-sm">
                  <span className="material-symbols-outlined text-[20px] text-[#0057bd] font-bold">
                    {section.type === 'photos' ? 'photo_camera' : 'videocam'}
                  </span>
                  <span className="text-[11px] font-black text-[#242c51] uppercase tracking-widest">
                    {section.media.length} {section.type === 'photos' ? 'Assets' : 'Clips'}
                  </span>
                </div>
              </div>

              {/* Enhanced Media Grid */}
              <div className={`grid gap-6 md:gap-8 ${
                section.type === 'photos' 
                  ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
                  : 'grid-cols-1'
              }`}>
                {section.media.map((url, mediaIdx) => (
                  <motion.div
                    key={mediaIdx}
                    whileHover={{ 
                      y: -10,
                      scale: 1.02,
                      transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] }
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedMedia({ url, type: section.type })}
                    className={`relative rounded-[2.5rem] overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-[#0057bd]/10 transition-all duration-500 bg-[#f8faff] border-4 border-white group/item ${
                      section.type === 'photos' 
                        ? 'aspect-[4/5]' 
                        : 'aspect-video max-w-5xl mx-auto w-full'
                    }`}
                  >
                    {section.type === 'photos' ? (
                      <ImageWithFallback 
                        src={url} 
                        alt={`${section.title} ${mediaIdx}`} 
                        fallbackType="gallery"
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover/item:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full relative group/video bg-[#1a1f3a]">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover/video:scale-110 group-hover/video:bg-[#0057bd] transition-all duration-500">
                            <span className="material-symbols-outlined text-white text-5xl font-black ml-1">
                              play_arrow
                            </span>
                          </div>
                        </div>
                        {/* Video Meta Info */}
                        <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
                          <div className="space-y-1">
                            <span className="block text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Cinematic Release</span>
                            <p className="text-white font-headline font-black text-xl uppercase tracking-wider italic">{section.title}</p>
                          </div>
                          <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                            <span className="text-white text-[10px] font-black uppercase tracking-widest">4K Content</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Premium Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#242c51]/60 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-500 flex items-end p-8">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-white text-xl">fullscreen</span>
                        <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Enlarge View</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          ))
        ) : (
          <div className="py-48 text-center space-y-10">
            <div className="relative inline-block">
              <div className="w-40 h-40 rounded-[4rem] bg-white border border-[#efefff] flex items-center justify-center mx-auto shadow-2xl shadow-blue-900/5">
                <span className="material-symbols-outlined text-6xl text-[#a3abd7]/40">photo_library</span>
              </div>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-4 border-2 border-dashed border-[#0057bd]/10 rounded-[5rem]"
              />
            </div>
            <div className="space-y-4">
              <h3 className="font-headline font-black text-3xl text-[#242c51] italic uppercase tracking-widest">Chronicle Idle</h3>
              <p className="text-[#a3abd7] text-sm font-medium max-w-sm mx-auto leading-relaxed">
                The visual history of this community is currently being curated. Join us soon as we unveil the first chapters.
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Fullscreen Preview Modal - Ultra Premium */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMedia(null)}
            className="fixed inset-0 z-[200] bg-[#1a1f3a]/98 backdrop-blur-3xl flex items-center justify-center p-6 md:p-16"
          >
            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-10 right-10 z-50 text-white bg-white/5 hover:bg-white/10 p-5 rounded-[2rem] border border-white/10 transition-all active:scale-90 flex items-center gap-3 px-8 group"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.3em] group-hover:mr-2 transition-all">Close Preview</span>
              <span className="material-symbols-outlined text-2xl">close</span>
            </motion.button>

            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 30 }}
              className="relative max-w-7xl w-full max-h-[85vh] rounded-[3rem] md:rounded-[5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedMedia.type === 'photos' ? (
                <ImageWithFallback 
                  src={selectedMedia.url} 
                  alt="Full view" 
                  fallbackType="gallery"
                  className="w-full h-full max-h-[85vh] object-contain bg-black/20"
                />
              ) : (
                <div className="aspect-video w-full bg-black flex items-center justify-center">
                  <video 
                    src={selectedMedia.url} 
                    controls 
                    autoPlay
                    className="w-full h-full"
                  />
                </div>
              )}
              
              {/* Media Status Bar */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-12 pt-24 hidden md:block">
                <div className="flex justify-between items-end">
                  <div className="space-y-2">
                    <h4 className="text-white font-headline font-black text-3xl italic uppercase tracking-tight">{group.name}</h4>
                    <p className="text-white/60 text-xs font-black uppercase tracking-[0.4em]">Official Community Media Asset</p>
                  </div>
                  <div className="flex gap-4">
                    <button className="px-8 py-4 bg-white text-[#242c51] rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#0057bd] hover:text-white transition-all">
                      Share Moment
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-64 border-t border-[#f1f3ff] pt-20">
        <GroupFooter communityName={group.name} />
      </div>
    </div>
  );
};

export default GroupGallery;


