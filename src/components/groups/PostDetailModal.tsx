'use client';

import React, { useState, useEffect } from 'react';
import { Post, Comment } from '@/types/group';
import { motion, AnimatePresence } from 'framer-motion';
import { groupService } from '@/lib/firebase/groupService';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { KIND_ICON, KIND_COLOR } from '@/constants/tags';
import UserProfileClickable from '@/components/common/UserProfileClickable';
import UserBadge from '@/components/common/UserBadge';

interface PostDetailModalProps {
  groupId: string;
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (post: Post) => void;
}

export default function PostDetailModal({ groupId, post, isOpen, onClose, onEdit }: PostDetailModalProps) {
  const { user, profile, setShowLogin } = useAuth();
  const { t, formatDate } = useLanguage();
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

  const handleAddComment = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!user) {
      console.log('No user, showing login');
      setShowLogin(true);
      return;
    }

    const trimmedComment = newComment.trim();
    if (!trimmedComment) {
      console.log('Empty comment, skipping');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Attempting to add comment:', { groupId, postId: post.id, content: trimmedComment });
      await groupService.addComment(groupId, post.id, {
        content: trimmedComment,
        author: {
          id: user.uid,
          name: profile?.nickname || user.displayName || 'Anonymous',
          avatar: profile?.photoURL || user.photoURL || ''
        }
      });
      setNewComment('');
      console.log('Comment added successfully');
    } catch (error: any) {
      console.error('Failed to add comment:', error);
      // Firebase permission-denied error check
      if (error.code === 'permission-denied') {
        alert(t('group.permission_denied', 'Permission denied. Please check your member status.'));
      } else {
        alert(t('group.comment_error', 'Failed to post comment. Please try again.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm(t('group.delete_comment_confirm', 'Delete this comment?'))) return;
    try {
      await groupService.deleteComment(groupId, post.id, commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm(t('group.delete_post_confirm', 'Are you sure you want to delete this post?'))) return;
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
          <main className="max-w-3xl mx-auto px-6 sm:px-8 md:px-12 py-section_gap pb-32">
            <article>
              {/* Article Header */}
              <div className="mb-section_gap bg-surface-container-lowest p-6 sm:p-8 rounded-3xl outline outline-1 outline-outline-variant/15 shadow-sm">
                <div className="mb-element_gap">
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-tertiary/10 text-tertiary font-label-sm text-label-sm uppercase tracking-wider">
                    {post.category === 'notice' ? t('group.notice', 'Notice') : post.category || t('group.general', 'General')}
                  </span>
                </div>
                <h1 className="font-display-lg text-display-lg text-on-surface mb-element_gap leading-tight">
                  {post.title}
                </h1>
                
                <UserBadge
                  uid={post.author.id || ''}
                  nickname={post.author.name}
                  photoURL={post.author.avatar}
                  avatarSize="w-12 h-12 rounded-full outline outline-1 outline-outline-variant/30"
                  nameClassName="font-label-md text-label-md text-on-surface"
                  className="w-full pt-6 border-t border-outline-variant/15 mt-6 cursor-pointer block text-left"
                  subText={
                    <div className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                      <time>{formatDate(post.createdAt, 'dateOnly')}</time>
                      <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                      <span>{readTime} {t('group.min_read', 'min read')}</span>
                    </div>
                  }
                />
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
                    <p key={i} className="font-body-lg text-body-lg leading-relaxed">
                      {p}
                    </p>
                  ))
                ) : (
                  <p className="font-body-lg text-body-lg leading-relaxed italic text-on-surface-variant/50">
                    {t('group.no_content', 'No content available.')}
                  </p>
                )}
              </div>

              {/* Engagement/Tags Section */}
              <div className="mt-section_gap pt-element_gap border-t border-outline-variant/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2 items-center">
                  {(post.postTags || post.tags)?.map((tag: any, idx: number) => {
                    if (typeof tag === 'string') {
                      return (
                        <span key={idx} className="px-3 py-1 bg-surface-container rounded-full font-label-sm text-label-sm text-on-surface-variant">#{tag}</span>
                      );
                    }
                    return (
                      <div key={tag.id || idx} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border border-outline-variant/30 font-label-sm text-sm ${KIND_COLOR[tag.kind] || 'text-on-surface-variant bg-surface-container'}`}>
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {KIND_ICON[tag.kind] || 'label'}
                        </span>
                        <span className="font-medium">{tag.label}</span>
                      </div>
                    );
                  })}
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
                <h4 className="font-title-lg text-title-lg text-on-surface mb-2">{t('group.comments', 'Comments')}</h4>
                
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
                      placeholder={t('group.share_thoughts', 'Share your thoughts...')}
                      className="w-full bg-transparent border-none focus:ring-0 resize-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 outline-none"
                      rows={2}
                    />
                    <div className="flex justify-end">
                      <button 
                        onClick={handleAddComment}
                        disabled={isSubmitting || !newComment.trim()}
                        className="px-6 py-2 bg-primary text-on-primary rounded-full font-label-md text-label-md shadow-sm hover:shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 disabled:hover:shadow-sm"
                      >
                        {t('group.post', 'Post')}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comment List */}
                <div className="w-full space-y-6 mt-4">
                  {comments.length === 0 ? (
                    <p className="font-body-md text-body-md text-on-surface-variant text-center py-6">{t('group.no_comments', 'No comments yet.')}</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex items-start justify-between group/comment w-full py-1">
                        <div className="flex-1 text-left">
                          <UserBadge
                            uid={comment.author.id || ''}
                            nickname={comment.author.name}
                            photoURL={comment.author.avatar}
                            avatarSize="w-10 h-10 ring-1 ring-slate-100/50 shadow-2xs"
                            nameClassName="font-label-md text-label-md text-on-surface hover:underline cursor-pointer"
                            className="block"
                            subText={
                              <div className="flex flex-col gap-1.5 mt-1">
                                <span className="font-label-sm text-label-sm text-on-surface-variant/70 font-medium">
                                  {formatDate(comment.createdAt, 'dateOnly')}
                                </span>
                                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mt-0.5 whitespace-pre-wrap">
                                  {comment.content}
                                </p>
                              </div>
                            }
                          />
                        </div>
                        {user?.uid === comment.author.id && (
                          <button 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="opacity-0 group-hover/comment:opacity-100 transition-opacity text-error hover:scale-110 p-1 shrink-0 self-start mt-1"
                            aria-label="Delete comment"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        )}
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
