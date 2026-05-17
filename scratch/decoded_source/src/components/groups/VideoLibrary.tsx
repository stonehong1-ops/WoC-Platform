import React, { useState } from 'react';

const MOCK_CATEGORIES = ['All Videos', 'Tutorials', 'Webinars', 'Interviews', 'Highlights'];
const MOCK_VIDEOS = [
  { id: 1, title: 'Platform Onboarding Tutorial', category: 'Tutorials', duration: '12:45', views: '2.4k', date: '2 days ago', thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=350&fit=crop', featured: true },
  { id: 2, title: 'Future of Community Building', category: 'Webinars', duration: '45:20', views: '1.2k', date: '1 week ago', thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=350&fit=crop', featured: false },
  { id: 3, title: 'Interview with the Founder', category: 'Interviews', duration: '28:15', views: '856', date: '2 weeks ago', thumbnail: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=600&h=350&fit=crop', featured: false },
  { id: 4, title: 'Annual Summit Highlights 2023', category: 'Highlights', duration: '05:30', views: '5.6k', date: '1 month ago', thumbnail: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=350&fit=crop', featured: false },
  { id: 5, title: 'How to Setup Your Profile', category: 'Tutorials', duration: '08:10', views: '3.1k', date: '1 month ago', thumbnail: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=600&h=350&fit=crop', featured: false },
  { id: 6, title: 'Q3 Product Update', category: 'Webinars', duration: '32:40', views: '940', date: '2 months ago', thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=350&fit=crop', featured: false },
];

export default function VideoLibrary() {
  const [activeCategory, setActiveCategory] = useState('All Videos');
  const featuredVideo = MOCK_VIDEOS.find(v => v.featured) || MOCK_VIDEOS[0];
  
  const filteredVideos = activeCategory === 'All Videos'
    ? MOCK_VIDEOS.filter(v => !v.featured)
    : MOCK_VIDEOS.filter(v => v.category === activeCategory && !v.featured);

  return (
    <div className="flex flex-col h-full bg-surface overflow-y-auto">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Video Library</h2>
          <p className="text-sm text-on-surface-variant mt-1">Watch and manage video content.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm w-fit">
          <span className="material-symbols-outlined text-sm">upload</span>
          Upload Video
        </button>
      </div>

      <div className="p-4 md:p-6 space-y-8">
        {/* Featured Video Section */}
        {activeCategory === 'All Videos' && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 flex flex-col">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black group cursor-pointer shadow-sm">
                <img src={featuredVideo.thumbnail} alt={featuredVideo.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/90 text-on-primary flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <span className="material-symbols-outlined text-3xl ml-1">play_arrow</span>
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/80 text-white text-xs font-medium rounded backdrop-blur-sm">
                  {featuredVideo.duration}
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-error/10 text-error text-[10px] font-bold rounded uppercase tracking-wider">Featured</span>
                  <span className="text-on-surface-variant text-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                    {featuredVideo.views}
                  </span>
                  <span className="text-on-surface-variant text-sm">• {featuredVideo.date}</span>
                </div>
                <h3 className="text-2xl font-bold text-on-surface">{featuredVideo.title}</h3>
                <p className="text-on-surface-variant mt-2 text-sm line-clamp-2">
                  Welcome to our comprehensive platform onboarding. Learn the ins and outs of our community features, navigation, and best practices to get the most out of your experience.
                </p>
              </div>
            </div>
            
            {/* Playlists Sidebar */}
            <div className="w-full lg:w-80 shrink-0">
              <div className="bg-surface-variant/30 rounded-2xl p-5 border border-outline-variant/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-on-surface">Your Playlists</h3>
                  <button className="text-primary text-sm font-medium hover:underline">See All</button>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Getting Started', count: 5, icon: 'school' },
                    { name: 'Weekly Townhalls', count: 12, icon: 'groups' },
                    { name: 'Saved for Later', count: 3, icon: 'bookmark' },
                  ].map((playlist, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-variant/50 cursor-pointer transition-colors group">
                      <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
                        <span className="material-symbols-outlined text-[20px]">{playlist.icon}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">{playlist.name}</h4>
                        <p className="text-xs text-on-surface-variant">{playlist.count} videos</p>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 py-2 border border-outline-variant rounded-xl text-sm font-medium text-on-surface hover:bg-surface-variant transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Create Playlist
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Categories & Video Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-on-surface">Recent Uploads</h3>
            
            {/* Custom styled select or just simple buttons for categories */}
            <div className="hidden md:flex items-center gap-2 bg-surface-variant/30 p-1 rounded-xl">
              {MOCK_CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeCategory === category
                      ? 'bg-surface shadow text-on-surface'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map(video => (
              <div key={video.id} className="group cursor-pointer flex flex-col">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-variant mb-3 shadow-sm border border-outline-variant/20">
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/90 text-black opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all flex items-center justify-center shadow-lg">
                      <span className="material-symbols-outlined text-2xl ml-1">play_arrow</span>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-[10px] font-medium rounded backdrop-blur-sm">
                    {video.duration}
                  </div>
                </div>
                <h4 className="font-semibold text-on-surface line-clamp-2 group-hover:text-primary transition-colors text-sm leading-tight mb-1">
                  {video.title}
                </h4>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs text-on-surface-variant">{video.category}</span>
                  <div className="flex items-center gap-2 text-[11px] text-on-surface-variant">
                    <span>{video.views} views</span>
                    <span>•</span>
                    <span>{video.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
