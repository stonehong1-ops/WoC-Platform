'use client';

import React, { useState, useEffect } from 'react';
import BottomSheet from '../common/BottomSheet';
import { Comment, Post } from '@/types/feed';
import { feedService } from '@/lib/firebase/feedService';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import UserBadge from '../common/UserBadge';

interface CommentBottomSheetProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
}

export default function CommentBottomSheet({ post, isOpen, onClose, currentUser }: CommentBottomSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [replies, setReplies] = useState<Record<string, Comment[]>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && post.id) {
      // Fetch top-level comments
      const unsubscribe = feedService.subscribeComments(post.id, (fetchedComments) => {
        setComments(fetchedComments);
      });
      return () => unsubscribe();
    }
  }, [isOpen, post.id]);

  const toggleReplies = (commentId: string) => {
    if (expandedComments.has(commentId)) {
      setExpandedComments(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    } else {
      setExpandedComments(prev => new Set(prev).add(commentId));
      // 항상 구독 시작 (실시간 반영 보장)
      feedService.subscribeComments(post.id, (fetchedReplies) => {
        setReplies(prev => ({ ...prev, [commentId]: fetchedReplies }));
      }, commentId);
    }
  };

  const handleSubmitComment = async () => {
    if (!newCommentText.trim() || !currentUser) return;

    setIsLoading(true);
    try {
      await feedService.addComment(post.id, {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        userPhoto: currentUser.photoURL || '',
        content: newCommentText.trim(),
        parentId: replyTo?.id || null,
        repliesCount: 0
      });
      
      if (replyTo) {
        const parentId = replyTo.id;
        setExpandedComments(prev => new Set(prev).add(parentId));
        // 구독 갱신 (즉각 반영)
        feedService.subscribeComments(post.id, (fetchedReplies) => {
          setReplies(prev => ({ ...prev, [parentId]: fetchedReplies }));
        }, parentId);
      }
      
      setNewCommentText('');
      setReplyTo(null);
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderCommentItem = (comment: Comment, isReply = false) => {
    const timeAgo = comment.createdAt 
      ? formatDistanceToNow((comment.createdAt as any).toDate?.() || new Date(comment.createdAt as any), { addSuffix: true, locale: ko })
      : '방금 전';

    const isExpanded = expandedComments.has(comment.id);
    const commentReplies = replies[comment.id] || [];

    return (
      <div key={comment.id} className={`flex flex-col ${isReply ? 'ml-10 border-l-2 border-outline-variant/10 pl-4 mb-2' : 'border-b border-outline-variant/5 last:border-0 mb-4'}`}>
        <div className="flex flex-col py-2">
          <div className="flex justify-between items-start w-full">
            <UserBadge 
              uid={comment.userId}
              nickname={comment.userName}
              nativeNickname={comment.userNameNative}
              photoURL={comment.userPhoto}
              avatarSize="w-8 h-8"
              nameClassName="font-bold text-sm text-on-surface"
              nativeClassName="text-[11px] font-medium text-on-surface-variant leading-tight ml-1"
            />
            <span className="text-[10px] text-on-surface-variant mt-1 shrink-0">{timeAgo}</span>
          </div>
          <div className="pl-10 pr-2">
            <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
              {comment.content}
            </p>
            <div className="flex gap-4 mt-2">
              {!isReply && (
                <button 
                  onClick={() => setReplyTo(comment)}
                  className="text-xs font-bold text-primary/70 hover:text-primary transition-colors"
                >
                  답글 달기
                </button>
              )}
              <button className="text-xs font-medium text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">favorite</span>
                <span>좋아요</span>
              </button>
            </div>
            
            {/* Replies count indicator */}
            {comment.repliesCount !== undefined && comment.repliesCount > 0 && !isReply && (
              <button 
                onClick={() => toggleReplies(comment.id)}
                className="mt-3 text-xs font-bold text-on-surface-variant flex items-center gap-2 hover:opacity-70 group"
              >
                <div className="w-6 h-px bg-outline-variant/30 group-hover:bg-primary/30 transition-colors" />
                {isExpanded ? '답글 숨기기' : `답글 ${comment.repliesCount}개 보기`}
              </button>
            )}
          </div>
        </div>

        {/* Render Replies */}
        {isExpanded && commentReplies.length > 0 && (
          <div className="mt-2">
            {commentReplies.map(reply => renderCommentItem(reply, true))}
          </div>
        )}
      </div>
    );
  };

  const footer = (
    <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/10">
      {replyTo && (
        <div className="mb-2 px-3 py-1.5 bg-primary/5 rounded-lg flex justify-between items-center animate-in slide-in-from-bottom-2">
          <span className="text-[11px] text-primary font-medium">
            <strong>{replyTo.userName}{replyTo.userNameNative ? ` (${replyTo.userNameNative})` : ''}</strong>님에게 답글 남기는 중...
          </span>
          <button onClick={() => setReplyTo(null)} className="material-symbols-outlined text-sm text-on-surface-variant hover:text-on-surface transition-colors">close</button>
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-surface-container-high rounded-2xl px-4 py-2 flex items-center gap-2 border border-outline-variant/10 focus-within:border-primary/30 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
          <input
            type="text"
            placeholder={replyTo ? "답글을 입력하세요..." : "댓글을 입력하세요..."}
            className="flex-1 bg-transparent border-none outline-none text-sm text-on-surface py-1"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
          />
          <button 
            disabled={!newCommentText.trim() || isLoading}
            onClick={handleSubmitComment}
            className={`material-symbols-outlined ${newCommentText.trim() ? 'text-primary' : 'text-on-surface-variant/30'} transition-all hover:scale-110 active:scale-95`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            send
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <BottomSheet 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`댓글 ${post.commentsCount || 0}`}
      footer={footer}
      height="70vh"
    >
      <div className="pb-4 px-1">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/30">
            <span className="material-symbols-outlined text-6xl mb-3 opacity-20">chat_bubble_outline</span>
            <p className="text-sm font-medium">첫 번째 댓글을 남겨보세요!</p>
          </div>
        ) : (
          comments.map(comment => renderCommentItem(comment))
        )}
      </div>
    </BottomSheet>
  );
}
