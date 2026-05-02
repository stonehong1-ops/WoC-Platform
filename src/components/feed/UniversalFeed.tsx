'use client';

import React, { useState, useEffect } from 'react';
import FeedCreatePopup from './FeedCreatePopup';
import FeedPostCard from './FeedPostCard';
import { feedService } from '@/lib/firebase/feedService';
import { Post } from '@/types/feed';
import UserAvatar from '@/components/common/UserAvatar';

interface UniversalFeedProps {
  context: any;
  currentUser: any;
  profile?: any;
  activeFilter?: string;
}

export default function UniversalFeed({ context, currentUser, profile, activeFilter = 'all' }: UniversalFeedProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const targetId = context.scope === 'plaza' ? 'plaza' : (context.scopeId || 'freestyle-tango');
    const unsubscribe = feedService.subscribePosts(
      targetId,
      (newPosts) => {
        setPosts(newPosts);
        setLoading(false);
      },
      {},
      (error) => {
        console.error("Feed subscription error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [context.scopeId]);

  // Derive filtered posts based on activeFilter
  const filteredPosts = React.useMemo(() => {
    let result = [...posts];
    
    switch (activeFilter) {
      case 'hot':
        // Threshold for "Hot": more than 0 interactions, sorted by engagement
        result = result.filter(p => (p.likesCount || 0) + (p.commentsCount || 0) > 0);
        result.sort((a, b) => ((b.likesCount || 0) + (b.commentsCount || 0)) - ((a.likesCount || 0) + (a.commentsCount || 0)));
        break;
      case 'my':
        // User's own posts
        result = result.filter(p => p.userId === currentUser?.uid);
        break;
      case 'pinned':
        // Pinned Posts (내가 Pin한 게시물)
        const pinnedPostIds = profile?.pinnedPostIds || [];
        result = result.filter(p => pinnedPostIds.includes(p.id));
        break;
      case 'friends':
        // Friends Filter: 내가 좋아요 또는 댓글을 단 포스트 목록
        const interactedPostIds = new Set([
          ...(profile?.likedPostIds || []),
          ...(profile?.commentedPostIds || [])
        ]);
        result = result.filter(p => interactedPostIds.has(p.id));
        break;
      case 'all':
      default:
        break;
    }
    
    return result;
  }, [posts, activeFilter, currentUser, profile]);

  return (
    <div className={`text-on-surface font-body relative ${context.scope === 'plaza' ? 'min-h-screen overflow-x-hidden' : ''}`}>
      {/* Ambient Background Effects */}
      <div className={`${context.scope === 'plaza' ? 'fixed inset-0 z-[-1] overflow-hidden pointer-events-none' : 'hidden'}`}>
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-3xl rounded-full"></div>
        <div className="absolute bottom-[20%] right-[-5%] w-[40%] h-[60%] bg-tertiary/5 blur-3xl rounded-full"></div>
      </div>

      <main className={`max-w-3xl mx-auto flex flex-col gap-6 px-4 sm:px-6 ${context.scope === 'plaza' ? 'pt-4' : 'pt-0 pb-16'}`}>
        {/* Feed Header/Composer (Bento Style) */}
        <section 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-surface-container-lowest rounded-xl shadow-sm p-4 sm:p-6 flex gap-4 items-start border border-outline-variant/10 cursor-pointer hover:shadow-md transition-all"
        >
          <UserAvatar 
            photoURL={profile?.photoURL || profile?.avatar || currentUser?.photoURL} 
            className="w-12 h-12 shrink-0" 
          />
          <div className="flex-1 flex flex-col gap-3">
            <div className="w-full bg-surface rounded-lg p-3 text-sm text-on-surface-variant/50 min-h-[60px]">
              Share your activities...
            </div>
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button className="text-on-surface-variant hover:text-primary hover:bg-primary/5 p-2 rounded-full transition-colors">
                  <span className="material-symbols-outlined">image</span>
                </button>
                <button className="text-on-surface-variant hover:text-primary hover:bg-primary/5 p-2 rounded-full transition-colors">
                  <span className="material-symbols-outlined">videocam</span>
                </button>
                <button className="text-on-surface-variant hover:text-primary hover:bg-primary/5 p-2 rounded-full transition-colors">
                  <span className="material-symbols-outlined">location_on</span>
                </button>
              </div>
              <button className="bg-primary text-on-primary font-label text-[11px] font-bold uppercase tracking-wider px-6 py-2 rounded-full shadow-md shadow-primary/20 hover:scale-95 transition-transform">
                Post
              </button>
            </div>
          </div>
        </section>

        {/* Feed Posts List */}
        <div className="flex flex-col gap-6 pb-24">
          {loading ? (
            <div className="flex flex-col gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-surface-container-lowest h-80 rounded-xl animate-pulse border border-outline-variant/10 shadow-sm" />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-20 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm">
              <span className="material-symbols-outlined text-outline-variant text-6xl mb-4">post_add</span>
              <p className="text-on-surface-variant font-medium">No posts found matching this filter.</p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <FeedPostCard 
                key={post.id} 
                post={post} 
                currentUser={currentUser}
                profile={profile}
                onEdit={(post) => {
                  setEditingPost(post);
                  setIsCreateModalOpen(true);
                }}
                onDelete={async (postId) => {
                  if (window.confirm('Are you sure you want to delete this post?')) {
                    try {
                      await feedService.deletePost(postId);
                    } catch (error) {
                      alert('Failed to delete post');
                    }
                  }
                }}
              />
            ))
          )}
        </div>
      </main>

      {/* Full Screen Post Creation Popup */}
      <FeedCreatePopup
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingPost(null);
        }}
        context={context}
        editingPost={editingPost}
      />
    </div>
  );
}
