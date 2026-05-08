'use client';

import React, { useState, useEffect } from 'react';
import { Post, Comment } from '@/types/group';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
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
      return format(d, 'MMM d, yyyy');
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
          avatar: profile?.photoURL || user.photoURL || ''
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
  const paragraphs = post.content.split('\n').filter(p => p.trim() !== '');
  const readTime = Math.max(1, Math.ceil(post.content.length / 500));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[120] bg-surface text-on-surface overflow-y-auto w-full h-full"
        >
          {/* Top App Bar */}
          <header className="sticky top-0 w-full z-50 bg-surface border-b border-outline-variant/15 flex justify-between items-center h-16 px-page_margin mx-auto max-w-4xl transition-all">
            <button 
              onClick={onClose}
              aria-label="Go back" 
              className="flex items-center justify-center p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant active:scale-95 group"
            >
              <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform" data-icon="arrow_back">arrow_back</span>
            </button>
            <div className="flex items-center gap-4">
              {isAuthor && (
                <>
                  <button onClick={() => onEdit(post)} aria-label="Edit" className="flex items-center justify-center p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant active:scale-95">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button onClick={handleDeletePost} aria-label="Delete" className="flex items-center justify-center p-2 rounded-full hover:bg-surface-container-high transition-colors text-error active:scale-95">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </>
              )}
              <button aria-label="Bookmark" className="flex items-center justify-center p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant active:scale-95">
                <span className="material-symbols-outlined" data-icon="bookmark_border">bookmark_border</span>
              </button>
              <button aria-label="Share" className="flex items-center justify-center p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant active:scale-95">
                <span className="material-symbols-outlined" data-icon="share">share</span>
              </button>
            </div>
          </header>

          {/* Main Content Canvas */}
          <main className="max-w-3xl mx-auto px-page_margin py-section_gap pb-32">
            <article>
              {/* Article Header */}
              <div className="mb-section_gap">
                <div className="mb-element_gap">
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-tertiary/10 text-tertiary font-label-sm text-label-sm uppercase tracking-wider">
                    {post.category === 'notice' ? 'Notice' : post.category || 'General'}
                  </span>
                </div>
                <h1 className="font-display-lg text-display-lg text-on-surface mb-element_gap leading-tight">
                  {post.title}
                </h1>
                
                <div className="flex items-center gap-element_gap py-element_gap border-t border-b border-outline-variant/15 mt-8">
                  <div className="w-12 h-12 rounded-full bg-surface-variant flex-shrink-0 overflow-hidden outline outline-1 outline-outline-variant/30 flex items-center justify-center">
                    {post.author.avatar ? (
                      <img alt="Author Avatar" className="w-full h-full object-cover" src={post.author.avatar}/>
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant">person</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface">{post.author.name}</span>
                    <div className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                      <time>{formatDate(post.createdAt)}</time>
                      <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                      <span>{readTime} min read</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Article Body */}
              <div className="prose prose-lg max-w-none text-on-surface-variant space-y-6">
                {post.image && (
                  <div className="rounded-xl overflow-hidden bg-surface-container-low mb-10 outline outline-1 outline-outline-variant/15 flex items-center justify-center p-2">
                    <img alt="Post cover" className="w-full h-auto object-cover rounded-lg" src={post.image}/>
                  </div>
                )}
                
                {paragraphs.length > 0 ? (
                  paragraphs.map((p, i) => (
                    <p key={i} className={i === 0 
                      ? "font-body-lg text-body-lg leading-relaxed first-letter:text-5xl first-letter:font-headline-lg first-letter:font-bold first-letter:text-primary first-letter:mr-1 first-letter:float-left" 
                      : "font-body-md text-body-md leading-relaxed"
                    }>
                      {p}
                    </p>
                  ))
                ) : (
                  <p className="font-body-lg text-body-lg leading-relaxed italic text-on-surface-variant/50">
                    No content available.
                  </p>
                )}
              </div>

              {/* Engagement/Tags Section */}
              <div className="mt-section_gap pt-element_gap border-t border-outline-variant/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-surface-container rounded-full font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer">#{post.category || 'community'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface-container-low hover:bg-primary-container hover:text-on-primary-container text-on-surface-variant transition-colors group">
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform" data-icon="favorite">favorite</span>
                    <span className="font-label-md text-label-md">{post.likes || 0}</span>
                  </button>
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant transition-colors group">
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform" data-icon="chat_bubble">chat_bubble</span>
                    <span className="font-label-md text-label-md">{comments.length}</span>
                  </button>
                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface-container-low text-on-surface-variant">
                    <span className="material-symbols-outlined" data-icon="visibility">visibility</span>
                    <span className="font-label-md text-label-md">{post.views || 0}</span>
                  </div>
                </div>
              </div>

              {/* Comments Section (Adapted as Author Bios Card equivalent for functionality) */}
              <div className="mt-section_gap bg-surface-container-lowest rounded-xl outline outline-1 outline-outline-variant/15 p-6 flex flex-col gap-6 items-start w-full">
                <h4 className="font-title-lg text-title-lg text-on-surface mb-2">Comments</h4>
                
                {/* Input Area */}
                <div className="flex gap-4 items-start w-full bg-surface-container-low p-4 rounded-xl">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-variant shrink-0">
                    {profile?.photoURL || user?.photoURL ? (
                      <img src={profile?.photoURL || user?.photoURL || ''} alt="You" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined w-full h-full flex items-center justify-center text-on-surface-variant">person</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <textarea 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts..." 
                      className="w-full bg-transparent border-none focus:ring-0 resize-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 outline-none"
                      rows={2}
                    />
                    <div className="flex justify-end">
                      <button 
                        onClick={handleAddComment}
                        disabled={isSubmitting || !newComment.trim()}
                        className="px-6 py-2 bg-primary text-on-primary rounded-full font-label-md text-label-md shadow-sm hover:shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 disabled:hover:shadow-sm"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comment List */}
                <div className="w-full space-y-6 mt-4">
                  {comments.length === 0 ? (
                    <p className="font-body-md text-body-md text-on-surface-variant text-center py-6">No comments yet.</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-4 group/comment">
                        <div className="w-10 h-10 rounded-full bg-surface-variant shrink-0 overflow-hidden outline outline-1 outline-outline-variant/30 flex items-center justify-center">
                          {comment.author.avatar ? (
                            <img alt={comment.author.name} className="w-full h-full object-cover" src={comment.author.avatar}/>
                          ) : (
                            <span className="material-symbols-outlined text-sm text-on-surface-variant">person</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-label-md text-label-md text-on-surface">{comment.author.name}</span>
                              <span className="font-label-sm text-label-sm text-on-surface-variant">{formatDate(comment.createdAt)}</span>
                            </div>
                            {user?.uid === comment.author.id && (
                              <button 
                                onClick={() => handleDeleteComment(comment.id)}
                                className="opacity-0 group-hover/comment:opacity-100 transition-opacity text-error hover:scale-110 p-1"
                                aria-label="Delete comment"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            )}
                          </div>
                          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </article>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
