import React, { useState, useEffect, useMemo } from 'react';
import GroupFooter from './GroupFooter';
import { groupService } from '@/lib/firebase/groupService';
import { Group, Post } from '@/types/group';
import { formatDistanceToNow } from 'date-fns';
import PostEditorModal from './PostEditorModal';
import PostDetailModal from './PostDetailModal';
import { motion, AnimatePresence } from 'framer-motion';
import ImageWithFallback from '@/components/common/ImageWithFallback';

interface GroupBoardProps {
  group: Group;
}

const GroupBoard = ({ group }: GroupBoardProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = groupService.subscribePosts(group.id, (fetchedPosts) => {
      setPosts(fetchedPosts);
    });
    return () => unsubscribe();
  }, [group.id]);

  const categories = useMemo(() => {
    const base = [{ id: 'all', title: 'All' }];
    return [...base, ...(group.boards || [])];
  }, [group.boards]);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      const matchesSearch = post.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           post.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [posts, selectedCategory, searchQuery]);

  const featuredPost = useMemo(() => {
    // Find the latest 'notice' or pinned post
    return filteredPosts.find(p => p.category === 'notice') || filteredPosts[0];
  }, [filteredPosts]);

  const otherPosts = useMemo(() => {
    if (!featuredPost) return filteredPosts;
    return filteredPosts.filter(p => p.id !== featuredPost.id);
  }, [filteredPosts, featuredPost]);

  const formatDate = (date: any) => {
    if (!date) return '';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return formatDistanceToNow(d, { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsDetailOpen(true);
    // Increment view count
    groupService.incrementPostViews(group.id, post.id);
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar bg-[#fcfaff]">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-32">
        {/* Board Header & Categories */}
        <section className="space-y-8 mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="text-left">
              <h2 className="font-headline font-black text-3xl text-[#242c51] tracking-tight">Group Board</h2>
              <p className="font-body text-sm text-[#515981] mt-1">Connect, share, and learn with fellow dancers.</p>
            </div>
            
            {/* Search Bar */}
            <div className="relative w-full md:w-80">
              <input 
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-none rounded-2xl px-12 py-3.5 text-sm font-bold text-[#242c51] shadow-sm ring-1 ring-[#a3abd7]/10 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-300"
              />
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            </div>
          </div>

          {/* Horizontal Scrollable Categories */}
          <div className="flex overflow-x-auto pb-2 -mx-6 px-6 gap-3 snap-x hide-scrollbar">
            {categories.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`snap-start flex-shrink-0 font-label font-black text-[10px] uppercase tracking-wider px-6 py-3 rounded-full transition-all active:scale-95
                  ${selectedCategory === cat.id 
                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                    : 'bg-white text-[#515981] shadow-sm ring-1 ring-[#a3abd7]/10 hover:bg-slate-50'}
                `}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </section>

        {/* Post Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Featured Post Card */}
          {featuredPost && (
            <article 
              onClick={() => handlePostClick(featuredPost)}
              className="bg-white rounded-[2.5rem] shadow-sm ring-1 ring-[#a3abd7]/10 overflow-hidden lg:col-span-2 group hover:shadow-xl hover:ring-primary/20 transition-all duration-500 flex flex-col sm:flex-row cursor-pointer group"
            >
              <div className="w-full sm:w-2/5 h-64 sm:h-auto relative overflow-hidden bg-slate-100">
                {(featuredPost.image || featuredPost.video) ? (
                  <>
                    {featuredPost.video ? (
                      <video src={featuredPost.video} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                    <ImageWithFallback 
                      src={featuredPost.image} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      alt="" 
                      fallbackType="gallery"
                    />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent sm:hidden" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-tertiary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-primary/20">article</span>
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-primary font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
                  {categories.find(c => c.id === featuredPost.category)?.title || 'Post'}
                </div>
              </div>
              
              <div className="p-10 flex flex-col justify-between w-full sm:w-3/5 text-left">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <ImageWithFallback 
                      src={featuredPost.author.avatar} 
                      className="w-8 h-8 rounded-xl object-cover ring-2 ring-white" 
                      alt="" 
                      nameForAvatar={featuredPost.author.name}
                      fallbackType="avatar"
                    />
                    <div>
                      <span className="block text-xs font-black text-[#242c51]">@{featuredPost.author.name}</span>
                      <span className="text-[10px] font-bold text-[#515981]/50 uppercase tracking-tighter">{formatDate(featuredPost.createdAt)}</span>
                    </div>
                  </div>
                  <h3 className="font-headline font-black text-2xl text-[#242c51] leading-tight mb-4 group-hover:text-primary transition-colors">
                    {featuredPost.title || featuredPost.content.substring(0, 50) + '...'}
                  </h3>
                  <p className="font-body text-[#515981] line-clamp-3 leading-relaxed">
                    {featuredPost.content}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-8 pt-8 border-t border-[#a3abd7]/10">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                      <span className="text-xs font-bold">{featuredPost.views || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                      <span className="text-xs font-bold">{featuredPost.comments || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-primary">
                    <span className="material-symbols-outlined text-[18px] fill-1">favorite</span>
                    <span className="text-xs font-bold">{featuredPost.likes || 0}</span>
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* Other Posts */}
          {otherPosts.map((post) => (
            <article 
              key={post.id}
              onClick={() => handlePostClick(post)}
              className="bg-white rounded-[2.5rem] shadow-sm ring-1 ring-[#a3abd7]/10 p-8 flex flex-col justify-between group hover:shadow-xl hover:ring-primary/20 transition-all duration-500 cursor-pointer text-left"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <ImageWithFallback 
                      src={post.author.avatar} 
                      className="w-8 h-8 rounded-xl object-cover" 
                      alt="" 
                      nameForAvatar={post.author.name}
                      fallbackType="avatar"
                    />
                    <div>
                      <span className="block text-xs font-black text-[#242c51]">@{post.author.name}</span>
                      <span className="text-[10px] font-bold text-[#515981]/50 uppercase tracking-tighter">{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full">
                    {categories.find(c => c.id === post.category)?.title || 'Post'}
                  </div>
                </div>

                {post.image && (
                  <div className="w-full h-40 rounded-2xl overflow-hidden mb-6 relative">
                    <ImageWithFallback 
                      src={post.image} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      alt="" 
                      fallbackType="gallery"
                    />
                  </div>
                )}
                
                {post.video && (
                  <div className="w-full h-40 rounded-2xl overflow-hidden mb-6 relative bg-black">
                    <video src={post.video} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-4xl opacity-60">play_circle</span>
                    </div>
                  </div>
                )}

                <h3 className="font-headline font-black text-xl text-[#242c51] leading-tight mb-3 group-hover:text-primary transition-colors">
                  {post.title || post.content.substring(0, 40) + '...'}
                </h3>
                <p className="font-body text-sm text-[#515981] line-clamp-3 leading-relaxed mb-6">
                  {post.content}
                </p>
              </div>

              <div className="flex items-center justify-between mt-auto pt-6 border-t border-[#a3abd7]/10">
                <div className="flex items-center gap-4 text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    <span className="text-xs font-bold">{post.views || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                    <span className="text-xs font-bold">{post.comments || 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-primary">
                  <span className="material-symbols-outlined text-[16px] fill-1">favorite</span>
                  <span className="text-xs font-bold">{post.likes || 0}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <div className="py-32 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-full bg-[#efefff] flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl text-primary/30">drafts</span>
            </div>
            <h3 className="text-xl font-headline font-black text-[#242c51]">No posts yet</h3>
            <p className="text-[#515981] mt-2">Be the first to share something with the group!</p>
            <button 
              onClick={() => setIsEditorOpen(true)}
              className="mt-8 px-8 py-3 bg-primary text-on-primary font-black rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              Create First Post
            </button>
          </div>
        )}

        {/* Floating Action Button for New Post */}
        <button 
          onClick={() => {
            setEditingPost(null);
            setIsEditorOpen(true);
          }}
          className="fixed bottom-24 right-6 w-16 h-16 bg-primary text-white rounded-[2rem] shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 group"
        >
          <span className="material-symbols-outlined text-3xl transition-transform group-hover:rotate-12" style={{ fontVariationSettings: "'FILL' 1" }}>edit</span>
        </button>
      </main>

      <GroupFooter communityName={group.name} />

      {/* Modals */}
      <PostEditorModal 
        group={group}
        post={editingPost}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingPost(null);
        }}
      />

      <PostDetailModal 
        groupId={group.id}
        post={selectedPost}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(post) => {
          setIsDetailOpen(false);
          setEditingPost(post);
          setIsEditorOpen(true);
        }}
      />
    </div>
  );
};

export default GroupBoard;
