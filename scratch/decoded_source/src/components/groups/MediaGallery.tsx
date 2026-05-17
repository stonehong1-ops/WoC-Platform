import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Data
const MOCK_ALBUMS = ['All', 'Events', 'Workshops', 'Behind the Scenes', 'Community'];
const MOCK_MEDIA = [
  { id: 1, url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=700&fit=crop', title: 'Annual Summit 2023', album: 'Events', likes: 124, downloads: 45 },
  { id: 2, url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500&h=400&fit=crop', title: 'Design Workshop', album: 'Workshops', likes: 89, downloads: 12 },
  { id: 3, url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&h=500&fit=crop', title: 'Team Building', album: 'Behind the Scenes', likes: 256, downloads: 88 },
  { id: 4, url: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=500&h=800&fit=crop', title: 'Community Mixer', album: 'Community', likes: 342, downloads: 150 },
  { id: 5, url: 'https://images.unsplash.com/photo-1475721025505-1113afab0ce8?w=500&h=400&fit=crop', title: 'Guest Speaker', album: 'Events', likes: 175, downloads: 60 },
  { id: 6, url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=600&fit=crop', title: 'Strategy Session', album: 'Behind the Scenes', likes: 92, downloads: 20 },
  { id: 7, url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&h=500&fit=crop', title: 'Hackathon Winners', album: 'Events', likes: 410, downloads: 205 },
  { id: 8, url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500&h=700&fit=crop', title: 'Networking Night', album: 'Community', likes: 150, downloads: 40 },
];

export default function MediaGallery() {
  const [activeAlbum, setActiveAlbum] = useState('All');
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  const filteredMedia = activeAlbum === 'All' 
    ? MOCK_MEDIA 
    : MOCK_MEDIA.filter(m => m.album === activeAlbum);

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="flex-none p-4 md:p-6 border-b border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Media Gallery</h2>
          <p className="text-sm text-on-surface-variant mt-1">Browse and manage community media assets.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant hover:bg-surface-variant transition-colors text-sm font-medium text-on-surface">
            <span className="material-symbols-outlined text-sm">folder</span>
            Manage Albums
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm">
            <span className="material-symbols-outlined text-sm">upload</span>
            Upload
          </button>
        </div>
      </div>

      {/* Album Filter */}
      <div className="flex-none px-4 md:px-6 py-4 overflow-x-auto no-scrollbar border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          {MOCK_ALBUMS.map(album => (
            <button
              key={album}
              onClick={() => setActiveAlbum(album)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeAlbum === album 
                  ? 'bg-primary-container text-on-primary-container' 
                  : 'bg-surface-variant/50 text-on-surface-variant hover:bg-surface-variant'
              }`}
            >
              {album}
            </button>
          ))}
        </div>
      </div>

      {/* Masonry Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {filteredMedia.map(media => (
            <div 
              key={media.id} 
              className="relative group break-inside-avoid rounded-2xl overflow-hidden cursor-pointer bg-surface-variant"
              onClick={() => setSelectedMedia(media)}
            >
              <img 
                src={media.url} 
                alt={media.title} 
                className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="inline-block px-2 py-1 bg-primary text-on-primary text-[10px] font-bold rounded mb-2 uppercase tracking-wider">
                    {media.album}
                  </span>
                  <h3 className="text-white font-medium text-sm mb-2">{media.title}</h3>
                  <div className="flex items-center gap-3 text-white/80 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">favorite</span>
                      {media.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">download</span>
                      {media.downloads}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fullscreen Viewer Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm"
          >
            <button 
              onClick={() => setSelectedMedia(null)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-50"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="w-full max-w-5xl h-[80vh] flex flex-col md:flex-row gap-6 p-4 md:p-8">
              <div className="flex-1 flex items-center justify-center h-full relative">
                <img 
                  src={selectedMedia.url} 
                  alt={selectedMedia.title} 
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
              <div className="w-full md:w-80 flex flex-col text-white">
                <div className="mb-6">
                  <span className="inline-block px-2 py-1 bg-primary text-on-primary text-[10px] font-bold rounded mb-3 uppercase tracking-wider">
                    {selectedMedia.album}
                  </span>
                  <h3 className="text-2xl font-bold mb-2">{selectedMedia.title}</h3>
                  <p className="text-white/60 text-sm">Uploaded on Oct 24, 2023</p>
                </div>
                
                <div className="flex items-center gap-4 mb-8">
                  <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium">
                    <span className="material-symbols-outlined text-[18px]">favorite</span>
                    {selectedMedia.likes}
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors text-sm font-medium">
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Download
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {['Community', 'Event', 'Photography', '2023'].map(tag => (
                        <span key={tag} className="px-3 py-1 rounded-full bg-white/5 text-white/80 text-xs border border-white/10">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Details</h4>
                    <div className="text-sm text-white/80 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-white/50">Resolution</span>
                        <span>4000 x 6000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Size</span>
                        <span>4.2 MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Format</span>
                        <span>JPG</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
