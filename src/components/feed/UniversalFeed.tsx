'use client';

import React, { useState, useEffect } from 'react';
import FeedCreatePopup from './FeedCreatePopup';
import FeedPostCard from './FeedPostCard';
import { feedService } from '@/lib/firebase/feedService';
import { Post } from '@/types/feed';

interface UniversalFeedProps {
  context: any;
  currentUser: any;
}

export default function UniversalFeed({ context, currentUser }: UniversalFeedProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 실시간 포스트 구독: plaza 스코프면 'plaza'를 우선 타겟으로 설정
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

  return (
    <div className="text-on-surface font-body min-h-screen relative overflow-x-hidden">
      <main className="max-w-3xl mx-auto flex flex-col gap-4 pt-8 px-4 sm:px-6">
        {/* Feed Header/Composer (Simplified One-Line) */}
        <section
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-surface-container-lowest rounded-xl shadow-sm py-2.5 px-4 flex gap-4 items-center border border-outline-variant/10 cursor-pointer hover:bg-surface-container-low transition-colors"
        >
          <img
            alt={currentUser?.displayName || "Current User"}
            className="w-10 h-10 rounded-full object-cover shrink-0"
            src={currentUser?.photoURL || "https://lh3.googleusercontent.com/a/default-user"}
          />
          <div className="flex-1 text-on-surface-variant/60 text-sm">
            Share your latest moves or thoughts...
          </div>
        </section>

        {/* Feed Posts List */}
        <div className="flex flex-col gap-4 pb-20">
          {loading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-surface-container-lowest h-64 rounded-xl animate-pulse border border-outline-variant/10" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="py-20 text-center">
              <span className="material-symbols-outlined text-outline-variant text-6xl mb-4">post_add</span>
              <p className="text-on-surface-variant font-medium">No posts yet. Be the first to share!</p>
            </div>
          ) : (
            posts.map((post) => (
              <FeedPostCard 
                key={post.id} 
                post={post} 
                currentUser={currentUser}
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

      {/* Floating FAB */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40"
      >
        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
      </button>

      {/* Full Screen Post Creation Popup */}
      <FeedCreatePopup
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingPost(null);
        }}
        currentUser={currentUser}
        context={context}
        editingPost={editingPost}
      />
    </div>
  );
}
