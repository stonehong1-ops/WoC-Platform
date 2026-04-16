"use client";

import React, { useState, useEffect } from 'react';
import { plazaService, Post } from '@/lib/firebase/plazaService';
import PageWrapper from '@/components/layout/PageWrapper';
import { useAuth } from '@/components/providers/AuthProvider';
import CreatePost from '@/components/plaza/CreatePost';
import CommentsSheet from '@/components/plaza/CommentsSheet';
import MediaViewer from '@/components/plaza/MediaViewer';
import PostSkeleton from '@/components/plaza/PostSkeleton';
import EmptyState from '@/components/common/EmptyState';

export default function PlazaPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [viewerData, setViewerData] = useState<{ items: {url: string, type: 'image' | 'video'}[], initialIndex: number } | null>(null);

  // Initial Fetch
  const fetchInitialPosts = async () => {
    setLoading(true);
    try {
      const { posts: newPosts, lastVisible } = await plazaService.getPostsPaginated(10);
      setPosts(newPosts);
      setLastDoc(lastVisible);
      setStoryUsers(stories);
      if (newPosts.length < 10) setHasMore(false);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Relationship Logic: Sorting Algorithm
  const sortedStories = React.useMemo(() => {
    // 1st Priority: Self
    const self = {
      userId: user?.uid,
      userName: 'Your Story',
      userPhoto: user?.photoURL,
      isSelf: true
    };

    const pinnedIds = (profile as any)?.pinnedUserIds || [];
    
    // Sort remaining users
    const others = [...storyUsers].filter(u => u.userId !== user?.uid);
    
    const sorted = others.sort((a, b) => {
      const aPinned = pinnedIds.includes(a.userId);
      const bPinned = pinnedIds.includes(b.userId);

      // 2nd Priority: Pinned
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      // Within same group, Unread first
      if (a.hasUnread && !b.hasUnread) return -1;
      if (!a.hasUnread && b.hasUnread) return 1;

      // 3rd Priority: Interaction Score (Mock score for now)
      const aScore = a.interactionScore || 0;
      const bScore = b.interactionScore || 0;
      return bScore - aScore;
    });

    return [self, ...sorted];
  }, [user, storyUsers, (profile as any)?.pinnedUserIds]);

  // Handle Pinning
  const handlePinToggle = async (targetId: string) => {
    if (!user) return;
    const pinnedIds = (profile as any)?.pinnedUserIds || [];
    const isCurrentlyPinned = pinnedIds.includes(targetId);
    
    try {
      await plazaService.togglePinUser(user.uid, targetId, isCurrentlyPinned);
      setContextMenu(null);
    } catch (error) {
      alert("Failed to update pin status.");
    }
  };

  // Long-press detection
  const handleTouchStart = (userId: string, e: any) => {
    if (userId === user?.uid) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    
    longPressTimer.current = setTimeout(() => {
      setContextMenu({ userId, x, y });
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  // Load More logic. Updated fetch size to 10 for better experience
  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const { posts: newPosts, lastVisible } = await plazaService.getPostsPaginated(10, lastDoc);
      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
        setLastDoc(lastVisible);
        if (newPosts.length < 10) setHasMore(false);
      }
    } catch (error) {
      console.error("Load more error:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Interaction Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    const target = document.getElementById('infinite-scroll-trigger');
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, loading, loadingMore, lastDoc]);

  const openComments = (postId: string) => {
    setSelectedPostId(postId);
    setIsCommentsOpen(true);
  };

  const tabs = ['All', 'Moments', 'Popular', 'Events', 'Q&A'];

  // Filter posts based on search (already loaded posts)
  const filteredPosts = posts.filter(post => 
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageWrapper>
      <div className="flex flex-col min-h-screen bg-white font-manrope" onClick={() => contextMenu && setContextMenu(null)}>
        {/* Context Menu for Pinning */}
        <AnimatePresence>
          {contextMenu && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y - 60, zIndex: 1000 }}
              className="bg-white shadow-2xl rounded-2xl border border-gray-100 py-2 min-w-[140px]"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); handlePinToggle(contextMenu.userId); }}
                className="w-full px-4 py-3 flex items-center gap-2 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">
                  {((profile as any)?.pinnedUserIds || []).includes(contextMenu.userId) ? 'keep_off' : 'keep'}
                </span>
                <span className="text-[12px] font-bold text-gray-900">
                  {((profile as any)?.pinnedUserIds || []).includes(contextMenu.userId) ? 'Unpin from Top' : 'Pin to Top'}
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Stories Section */}
        <section className="px-4 py-6 border-b border-gray-50">
          <div className="flex items-center gap-5 overflow-x-auto no-scrollbar pb-2">
            {sortedStories.map((story, i) => (
              <div 
                key={story.userId || i} 
                className="flex flex-col items-center flex-shrink-0 gap-2 relative group"
                onMouseDown={(e) => handleTouchStart(story.userId, e)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                onTouchStart={(e) => handleTouchStart(story.userId, e)}
                onTouchEnd={handleTouchEnd}
              >
                <div className={`relative w-16 h-16 rounded-full p-[2px] bg-white ring-2 ${story.hasUnread ? 'ring-[#0061ff]' : 'ring-gray-100'} transition-all group-active:scale-95`}>
                  <img
                    alt={story.userName}
                    className="w-full h-full rounded-full object-cover"
                    src={story.userPhoto || "https://lh3.googleusercontent.com/a/default-user"}
                  />
                  
                  {/* Pin Badge */}
                  {((profile as any)?.pinnedUserIds || []).includes(story.userId) && (
                    <div className="absolute bottom-0 right-0 bg-white shadow-md rounded-full w-5 h-5 flex items-center justify-center border border-gray-100 animate-in zoom-in">
                      <span className="material-symbols-outlined text-[12px] text-primary font-bold">push_pin</span>
                    </div>
                  )}

                  {/* Add Story Badge for Self */}
                  {story.isSelf && (
                    <div className="absolute bottom-0 right-0 bg-[#0061ff] text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm">
                      <span className="material-symbols-outlined text-[14px]">add</span>
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-bold ${story.hasUnread ? 'text-gray-900' : 'text-gray-500'} uppercase tracking-tight truncate max-w-[64px]`}>
                  {story.userName}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Quick Post Bar */}
        <section className="px-4 py-6 bg-white border-b border-gray-50 shadow-sm sticky top-16 z-20 backdrop-blur-md bg-white/90">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 ring-1 ring-gray-100">
              <img src={user?.photoURL || "https://lh3.googleusercontent.com/a/default-user"} alt="User profile" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 relative cursor-pointer group" onClick={() => setIsCreateModalOpen(true)}>
              <div className="w-full bg-[#f8f9fa] border border-transparent hover:border-primary/20 rounded-[24px] py-3 px-6 h-[48px] flex items-center shadow-inner transition-all">
                <span className="text-gray-400 font-medium text-sm">Share your moment...</span>
                <span className="w-[1.5px] h-5 bg-primary ml-0.5 animate-pulse"></span>
              </div>
            </div>
            <button 
              className="text-primary hover:opacity-70 transition-opacity active:scale-90 duration-100"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <span className="material-symbols-outlined text-[24px]">photo_camera</span>
            </button>
          </div>
        </section>

        {/* 3. Social Feed */}
        <div className="flex-grow bg-[#f8f9fa] space-y-4 pb-24">
          {loading ? (
            <div className="space-y-4">
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </div>
          ) : filteredPosts.map((post) => (
            <article key={post.id} className="bg-white overflow-hidden shadow-sm">
              {/* Post Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 ring-1 ring-gray-100">
                    <img src={post.userPhoto || ""} alt={post.userName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-[13px] leading-none mb-1.5">{post.userName}</h4>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none">
                      {post.location || "TOKYO, JAPAN"}
                    </p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-900 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                </button>
              </div>

              {/* Post Media (Bleed Container with Horizontal Scroll) */}
              {post.images && post.images.length > 0 && (
                <div className="relative group">
                  <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar aspect-[4/3] bg-gray-50">
                    {post.images.map((imgUrl, idx) => (
                      <div 
                        key={idx}
                        className="flex-shrink-0 w-full h-full snap-start cursor-pointer relative"
                        onClick={() => {
                          const items = post.images?.map(url => ({
                            url,
                            type: (url.match(/\.(mp4|mov|webm|quicktime)/i) || url.includes('video')) ? 'video' as const : 'image' as const
                          })) || [];
                          setViewerData({ items, initialIndex: idx });
                        }}
                      >
                        {imgUrl.match(/\.(mp4|mov|webm|quicktime)/i) || imgUrl.includes('video') ? (
                          <video 
                            src={imgUrl} 
                            className="w-full h-full object-cover"
                            autoPlay 
                            muted 
                            loop 
                            playsInline 
                          />
                        ) : (
                          <img 
                            src={imgUrl} 
                            alt={`content-${idx}`} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                          />
                        )}

                        {/* Video Badge */}
                        {(imgUrl.match(/\.(mp4|mov|webm|quicktime)/i) || imgUrl.includes('video')) && (
                          <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md rounded-full px-2 py-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-white text-[14px]">play_circle</span>
                            <span className="text-[10px] text-white font-bold uppercase tracking-widest leading-none pt-0.5">Video</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Multi-image Indicator (Dots) */}
                  {post.images.length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                      {post.images.map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40 border border-black/10 shadow-sm" />
                      ))}
                    </div>
                  )}

                  {/* Image Count Badge */}
                  {post.images.length > 1 && (
                    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5">
                      <span className="text-[10px] text-white font-black uppercase tracking-widest">1 / {post.images.length}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Interaction Bar (Refined Editorial) */}
              <div className="px-4 py-4 flex items-center gap-6">
                <button 
                  onClick={() => plazaService.likePost(post.id)}
                  className="flex items-center gap-2 group"
                >
                  <span className={`material-symbols-outlined text-[22px] transition-all group-active:scale-125 ${post.likes > 0 ? 'text-red-500 fill-current' : 'text-gray-900'}`}>
                    favorite
                  </span>
                  <span className="text-[11px] font-black text-gray-900">{post.likes || 0}</span>
                </button>

                <button 
                  onClick={() => openComments(post.id)}
                  className="flex items-center gap-2 group"
                >
                  <span className="material-symbols-outlined text-[22px] text-gray-900 transition-transform group-active:scale-90">
                    chat_bubble
                  </span>
                  <span className="text-[11px] font-black text-gray-900">{post.commentsCount || 0}</span>
                </button>

                <button className="ml-auto flex items-center gap-2 text-gray-900">
                  <span className="material-symbols-outlined text-[22px]">share</span>
                </button>
              </div>
              
              {/* Post Content (Below Interaction) */}
              {post.content && (
                <div className="px-4 pb-6">
                  <p className="text-[13px] leading-relaxed text-gray-800">
                    <span className="font-black mr-2 text-gray-900">{post.userName}</span>
                    {post.content}
                  </p>
                </div>
              )}
            </article>
          ))}

          {/* If no posts, show refined Empty State */}
          {posts.length === 0 && !loading && (
            <EmptyState 
              title="No Moments Yet"
              description="Be the first one to share a moment in this community."
              icon="photo_camera"
              actionLabel="Create First Moment"
              onAction={() => setIsCreateModalOpen(true)}
            />
          )}

          {/* Infinite Scroll Trigger */}
          <div id="infinite-scroll-trigger" className="h-20 w-full flex items-center justify-center">
            {loadingMore && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading More</span>
              </div>
            )}
            {!hasMore && posts.length > 0 && (
              <div className="py-8 grayscale opacity-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">You've reached the end</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Post Modal remains active as backup */}
        <CreatePost isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        
        {selectedPostId && (
          <CommentsSheet 
            postId={selectedPostId} 
            isOpen={isCommentsOpen} 
            onClose={() => setIsCommentsOpen(false)} 
          />
        )}

        {viewerData && (
          <MediaViewer 
            items={viewerData.items} 
            initialIndex={viewerData.initialIndex} 
            isOpen={!!viewerData} 
            onClose={() => setViewerData(null)} 
          />
        )}
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </PageWrapper>
  );
}
