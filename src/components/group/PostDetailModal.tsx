'use client';

import React, { useState, useEffect } from 'react';
import { Post, Comment } from '@/types/group';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { groupService } from '@/lib/firebase/groupService';
import { useAuth } from '@/components/providers/AuthProvider';

interface PostDetailModalProps {
  groupId: string;
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (post: Post) => void;
}

export default function PostDetailModal({ groupId, post, isOpen, onClose, onEdit }: PostDetailModalProps) {
  const { user, profile, setShowLogin } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !post) return;

    const unsubscribe = groupService.subscribeComments(groupId, post.id, (fetchedComments) => {
      setComments(fetchedComments as Comment[]);
    });

    return () => unsubscribe();
  }, [isOpen, post, groupId]);

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

  const handleAddComment = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await groupService.addComment(groupId, post.id, {
        content: newComment.trim(),
        author: {
          id: user.uid,
          name: profile?.nickname || user.displayName || 'Anonymous',
          avatar: profile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`
        }
      });
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await groupService.deleteComment(groupId, post.id, commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await groupService.deletePost(groupId, post.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const isAuthor = user?.uid === post.author.id;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl bg-[#fcfaff] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 text-[#242c51] flex items-center justify-center transition-colors backdrop-blur-md"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* Media Side */}
            {(post.image || post.video) && (
              <div className="w-full md:w-3/5 bg-black flex items-center justify-center overflow-hidden h-64 md:h-auto relative">
                {post.video ? (
                  <video 
                    src={post.video} 
                    controls 
                    autoPlay 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img 
                    src={post.image} 
                    alt="" 
                    className="w-full h-full object-contain"
                  />
                )}
                <div className="absolute top-6 left-6 px-4 py-2 bg-black/20 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest">
                  {post.type}
                </div>
              </div>
            )}

            {/* Content Side */}
            <div className={`flex flex-col flex-1 ${post.image || post.video ? 'md:w-2/5' : 'w-full'} bg-white overflow-hidden`}>
              {/* Header */}
              <div className="p-8 border-b border-[#a3abd7]/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img 
                    src={post.author.avatar} 
                    alt={post.author.name} 
                    className="w-12 h-12 rounded-2xl object-cover ring-4 ring-[#efefff]" 
                  />
                  <div>
                    <h3 className="font-headline font-black text-[#242c51]">@{post.author.name}</h3>
                    <p className="text-[10px] text-[#515981]/50 font-black uppercase tracking-widest">
                      {formatDate(post.createdAt)}
                    </p>
                  </div>
                </div>

                {isAuthor && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onEdit(post)}
                      className="w-9 h-9 rounded-xl bg-primary/5 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button 
                      onClick={handleDeletePost}
                      className="w-9 h-9 rounded-xl bg-error/5 text-error flex items-center justify-center hover:bg-error hover:text-white transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-8">
                <div className="space-y-6">
                  {post.title && (
                    <h2 className="text-2xl font-headline font-black leading-tight text-[#242c51]">
                      {post.title}
                    </h2>
                  )}
                  <p className="text-lg text-[#515981] leading-relaxed font-medium whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 mt-10 pt-8 border-t border-[#a3abd7]/10">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary fill-1">favorite</span>
                    <span className="font-black text-sm text-[#242c51]">{post.likes}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#515981]/40">visibility</span>
                    <span className="font-black text-sm text-[#242c51]">{post.views}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="material-symbols-outlined text-tertiary">chat_bubble</span>
                    <span className="font-black text-sm text-[#242c51]">{comments.length}</span>
                  </div>
                </div>

                {/* Comments List */}
                <div className="mt-12 space-y-8 pb-10">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#515981]/40">Comments</h4>
                  
                  {comments.length === 0 ? (
                    <div className="py-10 text-center">
                      <p className="text-sm font-bold text-[#515981]/30">No comments yet. Be the first!</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-4 group/comment">
                          <img 
                            src={comment.author.avatar} 
                            className="w-10 h-10 rounded-xl object-cover shrink-0"
                            alt=""
                          />
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-[#242c51]">{comment.author.name}</span>
                                <span className="text-[10px] font-bold text-[#515981]/30">{formatDate(comment.createdAt)}</span>
                              </div>
                              {user?.uid === comment.author.id && (
                                <button 
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="opacity-0 group-hover/comment:opacity-100 transition-opacity text-error hover:scale-110"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-[#515981] leading-relaxed font-medium">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Comment Input */}
              <div className="p-8 bg-white border-t border-[#a3abd7]/10">
                <div className="flex gap-4 items-center bg-[#f7f5ff] rounded-[1.5rem] p-2 pl-6 focus-within:ring-2 focus-within:ring-primary transition-all">
                  <input 
                    type="text" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    placeholder="Write a premium comment..." 
                    disabled={isSubmitting}
                    className="bg-transparent border-none focus:ring-0 text-sm font-bold flex-1 text-[#242c51] placeholder:text-slate-300"
                  />
                  <button 
                    onClick={handleAddComment}
                    disabled={isSubmitting || !newComment.trim()}
                    className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    <span className="material-symbols-outlined text-lg">send</span>
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
