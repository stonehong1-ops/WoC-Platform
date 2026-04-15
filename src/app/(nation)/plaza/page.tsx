"use client";

import React, { useState, useEffect } from 'react';
import { plazaService, Post } from '@/lib/firebase/plazaService';
import PageWrapper from '@/components/layout/PageWrapper';
import { useAuth } from '@/components/providers/AuthProvider';

export default function PlazaPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    const unsubscribe = plazaService.subscribePosts((data) => {
      setPosts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const tabs = ['All', 'Popular', 'Following', 'Events', 'Q&A'];

  // Filter posts based on search
  const filteredPosts = posts.filter(post => 
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageWrapper>
      <div className="flex flex-col h-screen bg-[#f8f9fa] font-manrope">
        {/* Header (1-pixel consistency with Venues) */}
        <div className="bg-white px-4 pt-6 pb-4 border-b border-gray-50 z-10">
          <div className="relative mb-4">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input 
              type="text" 
              placeholder="Search in Plaza"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#f1f3f4] border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#0061ff] transition-all"
            />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab 
                  ? 'bg-[#0061ff] text-white shadow-md' 
                  : 'bg-white text-gray-500 border border-gray-100 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Feed */}
        <div className="flex-grow overflow-y-auto px-4 py-8 space-y-6 scrollbar-hide">
          {filteredPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-50">
              {/* User Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden">
                  {post.userPhoto ? (
                    <img src={post.userPhoto} alt={post.userName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 leading-tight">{post.userName}</h4>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
                    {post.createdAt?.toDate().toLocaleDateString() || 'Just now'}
                  </p>
                </div>
              </div>

              {/* Content */}
              <p className="text-gray-700 text-sm leading-relaxed mb-6 whitespace-pre-wrap">
                {post.content}
              </p>

              {/* Images Grid (if any) */}
              {post.images && post.images.length > 0 && (
                <div className={`grid gap-2 mb-6 rounded-2xl overflow-hidden ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {post.images.map((img, idx) => (
                    <img key={idx} src={img} alt="post" className="w-full h-64 object-cover" />
                  ))}
                </div>
              )}

              {/* Interaction Bar */}
              <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                <button className="flex items-center gap-2 group">
                  <span className="material-symbols-outlined text-xl text-gray-400 group-hover:text-red-500 transition-colors">favorite</span>
                  <span className="text-xs font-bold text-gray-400 group-hover:text-gray-700">{post.likes}</span>
                </button>
                <button className="flex items-center gap-2 group">
                  <span className="material-symbols-outlined text-xl text-gray-400 group-hover:text-[#0061ff] transition-colors">chat_bubble</span>
                  <span className="text-xs font-bold text-gray-400 group-hover:text-gray-700">{post.commentsCount}</span>
                </button>
                <button className="flex items-center gap-2 group ml-auto">
                  <span className="material-symbols-outlined text-xl text-gray-400 group-hover:text-gray-700 transition-colors">share</span>
                </button>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex flex-col items-center py-20 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
              <div className="w-48 h-4 bg-gray-200 rounded-full"></div>
            </div>
          )}

          {!loading && filteredPosts.length === 0 && (
            <div className="text-center py-20 text-gray-300">
              <span className="material-symbols-outlined text-6xl mb-4">landscape</span>
              <p className="text-sm font-semibold uppercase tracking-widest">Nothing yet in the Plaza</p>
            </div>
          )}
        </div>

        {/* Floating Action Button (FAB): Compose */}
        <button
          className="fixed bottom-32 right-6 w-14 h-14 bg-[#0061ff] text-white rounded-full shadow-2xl shadow-[#0061ff]/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-20"
          onClick={() => alert("Write Post function coming soon")}
        >
          <span className="material-symbols-outlined text-2xl">edit_square</span>
        </button>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </PageWrapper>
  );
}
