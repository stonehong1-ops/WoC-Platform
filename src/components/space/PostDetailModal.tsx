'use client';

import React from 'react';
import { Post } from '@/types/community';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface PostDetailModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PostDetailModal({ post, isOpen, onClose }: PostDetailModalProps) {
  if (!post) return null;

  const formatDate = (date: any) => {
    if (!date) return '';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return formatDistanceToNow(d, { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl bg-surface rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* Content Side */}
            {post.image && (
              <div className="w-full md:w-1/2 bg-black flex items-center justify-center overflow-hidden h-64 md:h-auto">
                <img 
                  src={post.image} 
                  alt="" 
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div className={`flex flex-col flex-1 ${post.image ? 'md:w-1/2' : 'w-full'} bg-surface overflow-y-auto`}>
              <div className="p-8 sm:p-10">
                <div className="flex items-center gap-4 mb-8">
                  <img 
                    src={post.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.name || 'anon'}`} 
                    alt={post.author?.name || 'Anonymous'} 
                    className="w-12 h-12 rounded-2xl object-cover" 
                  />
                  <div>
                    <h3 className="font-headline font-black text-on-surface">@{post.author?.name || 'Anonymous'}</h3>
                    <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">
                      {formatDate(post.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {post.title && (
                    <h2 className="text-3xl font-headline font-black leading-tight text-on-surface">
                      {post.title}
                    </h2>
                  )}
                  <p className="text-xl text-on-surface-variant leading-relaxed font-medium">
                    {post.content}
                  </p>
                </div>

                <div className="mt-10 pt-10 border-t border-outline-variant/10">
                   <div className="flex items-center gap-6 text-on-surface-variant mb-10">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary fill-1">favorite</span>
                        <span className="font-black text-sm">{post.likes}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-tertiary">chat_bubble</span>
                        <span className="font-black text-sm">{post.comments}</span>
                      </div>
                   </div>

                   {/* Fake Comments for UI refinement */}
                   <div className="space-y-8">
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant/40">Comments</h4>
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-container shrink-0" />
                        <div className="flex-1 space-y-2">
                           <div className="flex items-center gap-2">
                              <span className="text-xs font-black">Alex Rivera</span>
                              <span className="text-[10px] text-on-surface-variant/40">2h ago</span>
                           </div>
                           <p className="text-sm text-on-surface-variant leading-relaxed">
                              This is absolutely stunning! The freestyle world needed this platform.
                           </p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-tertiary-container shrink-0" />
                        <div className="flex-1 space-y-2">
                           <div className="flex items-center gap-2">
                              <span className="text-xs font-black">Sarah Chen</span>
                              <span className="text-[10px] text-on-surface-variant/40">5h ago</span>
                           </div>
                           <p className="text-sm text-on-surface-variant leading-relaxed">
                              Can't wait for the next event in Seoul! 🔥
                           </p>
                        </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Comment Input Sticky at Bottom */}
              <div className="sticky bottom-0 p-8 pt-0 bg-surface/80 backdrop-blur-md">
                 <div className="flex gap-4 items-center bg-surface-container-high rounded-full p-2 pl-6 shadow-xl">
                    <input 
                      type="text" 
                      placeholder="Write a comment..." 
                      className="bg-transparent border-none focus:ring-0 text-sm font-bold flex-1"
                    />
                    <button className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center">
                      <span className="material-symbols-outlined">send</span>
                    </button>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
