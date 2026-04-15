import React, { useState, useEffect, useRef } from 'react';
import { plazaService } from '@/lib/firebase/plazaService';
import { useAuth } from '@/components/providers/AuthProvider';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  content: string;
  parentId?: string;
  createdAt: any;
}

interface CommentsSheetProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CommentsSheet({ postId, isOpen, onClose }: CommentsSheetProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 배경 스크롤 차단
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && postId) {
      const unsubscribe = plazaService.subscribeComments(postId, (data) => {
        setComments(data);
      });
      return () => unsubscribe();
    }
  }, [isOpen, postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      await plazaService.addComment(postId, {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhoto: user.photoURL || '',
        content: newComment.trim(),
        parentId: replyTo?.id
      });
      setNewComment('');
      setReplyTo(null);
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  if (!isOpen) return null;

  // 계층형 댓글 정리
  const mainComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header Indicator for Mobile */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label text-[9px] font-black text-primary tracking-[0.25em] uppercase mb-1">Discussions</span>
            <h3 className="text-[18px] font-black font-display text-gray-900 uppercase">Comments</h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Comment List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
          {mainComments.map(comment => (
            <div key={comment.id} className="space-y-4">
              {/* Main Comment */}
              <div className="flex gap-3">
                <img src={comment.userPhoto || 'https://lh3.googleusercontent.com/a/default-user'} className="w-8 h-8 rounded-full flex-shrink-0 object-cover bg-gray-100" alt="" />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold text-[13px] text-gray-900">{comment.userName}</span>
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Just now</span>
                  </div>
                  <p className="text-[13px] text-gray-700 leading-relaxed mb-2">{comment.content}</p>
                  <button 
                    onClick={() => {
                      setReplyTo(comment);
                      inputRef.current?.focus();
                    }}
                    className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                  >
                    Reply
                  </button>
                </div>
              </div>

              {/* Replies (Nested) */}
              {getReplies(comment.id).map(reply => (
                <div key={reply.id} className="flex gap-3 ml-11 border-l-2 border-gray-50 pl-4">
                  <img src={reply.userPhoto || 'https://lh3.googleusercontent.com/a/default-user'} className="w-6 h-6 rounded-full flex-shrink-0 object-cover bg-gray-100" alt="" />
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-bold text-[12px] text-gray-900">{reply.userName}</span>
                      <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Just now</span>
                    </div>
                    <p className="text-[12px] text-gray-700 leading-relaxed">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {comments.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 py-20">
              <span className="material-symbols-outlined text-4xl mb-3">chat_bubble_outline</span>
              <p className="text-[11px] font-bold uppercase tracking-widest text-center">Be the first to share a thought<br/>in this space.</p>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-gray-50 bg-white sticky bottom-0">
          {replyTo && (
            <div className="px-4 py-2 bg-primary/[0.03] flex items-center justify-between mb-2 rounded-xl">
              <span className="text-[10px] font-bold text-primary italic">Replying to @{replyTo.userName}</span>
              <button onClick={() => setReplyTo(null)} className="material-symbols-outlined text-[14px] text-primary">close</button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              <img src={user?.photoURL || 'https://lh3.googleusercontent.com/a/default-user'} alt="" className="w-full h-full object-cover" />
            </div>
            <input 
              ref={inputRef}
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyTo ? `Write a reply...` : "Add a comment..."}
              className="flex-1 bg-gray-50 border-none rounded-full py-2.5 px-5 text-[13px] font-medium placeholder:text-gray-300 focus:ring-1 focus:ring-primary/20 transition-all outline-none"
            />
            <button 
              type="submit"
              disabled={!newComment.trim()}
              className="text-primary font-black text-[12px] uppercase tracking-widest px-2 disabled:opacity-30 transition-opacity"
            >
              Post
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
