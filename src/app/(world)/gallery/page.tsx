'use client';

import './gallery.css';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  MapPin, 
  Calendar, 
  Plus, 
  X, 
  MoreVertical,
  Bookmark,
  Trash2,
  Edit2
} from 'lucide-react';
import { galleryService, GalleryPost, GalleryComment } from '@/lib/firebase/galleryService';
import { useAuth } from '@/components/providers/AuthProvider';

// Helper to determine if a URL is a video
const isVideoUrl = (url: string) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('.mp4') || lowerUrl.includes('.mov') || lowerUrl.includes('.webm') || lowerUrl.includes('alt=media&token=');
  // Note: Firebase Storage URLs might not always end in .mp4, so checking for typical extensions is best we can do without metadata. We'll improve upload logic to save type if needed.
};

const GalleryPage = () => {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = galleryService.subscribeFeed((data) => {
      setPosts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-black">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-64px)] w-full bg-black overflow-hidden flex flex-col md:h-[calc(100vh)]">
      {/* Feed Container - Vertical Snap */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
      >
        {posts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-white/50 pb-20">
            <div className="bg-white/10 p-6 rounded-full mb-4 backdrop-blur-md">
              <Plus size={40} />
            </div>
            <p className="font-bold">No gallery posts yet.</p>
            <p className="text-sm">Be the first to share a moment!</p>
          </div>
        )}

        {posts.map((post) => (
          <GalleryCard 
            key={post.id} 
            post={post} 
            onOpenComments={() => setActiveCommentPost(post.id)}
          />
        ))}
      </div>

      {/* Floating Create Button */}
      <Link 
        href="/gallery/create" 
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 z-40 hover:scale-105 active:scale-95 transition-transform"
      >
        <Plus size={28} />
      </Link>

      {/* Comment Bottom Sheet */}
      <AnimatePresence>
        {activeCommentPost && (
          <CommentBottomSheet 
            postId={activeCommentPost} 
            onClose={() => setActiveCommentPost(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const GalleryCard = ({ 
  post, 
  onOpenComments
}: { 
  post: GalleryPost, 
  onOpenComments: () => void
}) => {
  const { user } = useAuth();
  const [activeDot, setActiveDot] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isLiked = post.likedBy?.includes(user?.uid || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsPlaying(true);
          videoRefs.current.forEach(video => {
            if (video) video.play().catch(() => {});
          });
        } else {
          setIsPlaying(false);
          videoRefs.current.forEach(video => {
            if (video) video.pause();
          });
        }
      });
    }, { threshold: 0.6 });

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  const handleScroll = () => {
    if (carouselRef.current) {
      const scrollLeft = carouselRef.current.scrollLeft;
      const width = carouselRef.current.offsetWidth;
      const index = Math.round(scrollLeft / width);
      setActiveDot(index);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return alert('로그인이 필요합니다.');
    const newIsLiked = !isLiked;
    await galleryService.toggleLike(post.id, user.uid, isLiked);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || user.uid !== post.authorId) return;
    if (confirm('정말로 이 게시물을 삭제하시겠습니까?')) {
      await galleryService.deletePost(post.id);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    videoRefs.current.forEach(video => {
      if (video) {
        if (isPlaying) video.pause();
        else video.play();
      }
    });
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    if (mins < 60) return `${mins}m`;
    if (hrs < 24) return `${hrs}h`;
    return `${days}d`;
  };

  return (
    <div ref={cardRef} className="relative h-full w-full snap-start snap-always bg-black">
      {/* Media Carousel */}
      <div 
        className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
        ref={carouselRef}
        onScroll={handleScroll}
        onClick={togglePlay}
      >
        {post.media.map((url, idx) => {
          const isVideo = post.mediaTypes ? post.mediaTypes[idx] === 'video' : (url.toLowerCase().includes('.mp4') || url.toLowerCase().includes('.mov') || url.toLowerCase().includes('.webm') || url.toLowerCase().includes('video'));
          return (
          <div key={idx} className="relative flex-none w-full h-full snap-start flex items-center justify-center">
            {isVideo ? (
              <video
                ref={el => { videoRefs.current[idx] = el }}
                src={url}
                className="w-full h-full object-cover"
                loop
                muted // Muted by default for autoplay
                playsInline
              />
            ) : (
              <img src={url} alt="" className="w-full h-full object-cover" />
            )}
            
            {/* Play/Pause Indicator (Overlay) */}
            {!isPlaying && isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                </div>
              </div>
            )}
          </div>
        )})}
      </div>

      {/* Top Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10 flex justify-between items-start pt-safe">
        <div className="flex items-center gap-3">
          <img src={post.authorPhoto || '/default-avatar.png'} alt="" className="w-10 h-10 rounded-full border border-white/20 object-cover" />
          <div className="flex flex-col text-white drop-shadow-md">
            <span className="font-bold text-sm tracking-tight leading-tight">{post.authorName}</span>
            <span className="text-[10px] text-white/70 font-medium">{formatTime(post.createdAt)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {user?.uid === post.authorId && (
            <>
              <Link 
                href={`/gallery/create?edit=${post.id}`} 
                className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Edit2 size={14} />
              </Link>
              <button 
                className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-500/80 transition-colors"
                onClick={handleDelete}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Pagination Dots */}
      {post.media.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full pt-safe">
          {post.media.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${activeDot === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`} 
            />
          ))}
        </div>
      )}

      {/* Bottom Overlay Info */}
      <div className="absolute bottom-0 left-0 right-16 p-4 pb-20 md:pb-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 flex flex-col justify-end text-white">
        
        <div className="flex flex-wrap gap-2 mb-3">
          {post.venueName && (
            <Link href={`/venues?id=${post.venueId}`} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold border border-white/10" onClick={(e) => e.stopPropagation()}>
              <MapPin size={12} />
              <span>{post.venueName}</span>
            </Link>
          )}
          {post.eventName && (
            <Link href={`/events?id=${post.eventId}`} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold border border-white/10" onClick={(e) => e.stopPropagation()}>
              <Calendar size={12} />
              <span>{post.eventName}</span>
            </Link>
          )}
        </div>
        
        <p className="text-sm font-medium leading-snug line-clamp-3 drop-shadow-md">
          {post.caption}
        </p>
      </div>

      {/* Right Side Vertical Actions */}
      <div className="absolute bottom-24 md:bottom-12 right-2 flex flex-col items-center gap-6 z-20">
        <button className="flex flex-col items-center gap-1 group" onClick={handleLike}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 transition-transform active:scale-90 ${isLiked ? 'text-[#ff2d55]' : 'text-white'}`}>
            <Heart size={26} fill={isLiked ? "#ff2d55" : "none"} className={isLiked ? "drop-shadow-[0_0_8px_rgba(255,45,85,0.5)]" : ""} />
          </div>
          <span className="text-white text-xs font-bold drop-shadow-md">{post.likesCount || 0}</span>
        </button>

        <button className="flex flex-col items-center gap-1 group" onClick={onOpenComments}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 text-white transition-transform active:scale-90">
            <MessageCircle size={26} fill="white" className="text-white drop-shadow-md" />
          </div>
          <span className="text-white text-xs font-bold drop-shadow-md">{post.commentsCount || 0}</span>
        </button>

        <button className="flex flex-col items-center gap-1 group">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 text-white transition-transform active:scale-90">
            <Send size={24} className="ml-1 drop-shadow-md" />
          </div>
          <span className="text-white text-xs font-bold drop-shadow-md">Share</span>
        </button>

        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white spin-slow mt-2 opacity-80">
          <img src={post.authorPhoto || '/default-avatar.png'} alt="" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
};

const CommentBottomSheet = ({ postId, onClose }: { postId: string, onClose: () => void }) => {
  const [comments, setComments] = useState<GalleryComment[]>([]);
  const [inputText, setInputText] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = galleryService.subscribeComments(postId, (data) => {
      setComments(data);
    });
    return () => unsubscribe();
  }, [postId]);

  const handleSubmit = async () => {
    if (!user) return alert('로그인이 필요합니다.');
    if (!inputText.trim()) return;

    await galleryService.addComment(postId, {
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      authorPhoto: user.photoURL || '',
      text: inputText,
      postId: postId
    });
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-xl h-[70vh] bg-white rounded-t-[2rem] flex flex-col overflow-hidden shadow-2xl"
      >
        <div className="w-full flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>
        
        <div className="px-6 pb-4 border-b border-gray-100 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-extrabold text-on-surface font-headline">{comments.length} Comments</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <img src={comment.authorPhoto || '/default-avatar.png'} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-100 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-gray-900">{comment.authorName}</span>
                  <span className="text-xs text-gray-400 font-medium">
                    {comment.createdAt ? 'just now' : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{comment.text}</p>
                <div className="flex gap-4 mt-2 text-xs font-bold text-gray-400">
                  <button className="hover:text-gray-600 transition-colors">Reply</button>
                </div>
              </div>
              <button className="text-gray-300 hover:text-red-500 transition-colors shrink-0 pt-2">
                <Heart size={16} />
              </button>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <MessageCircle size={40} className="mb-4 opacity-20" />
              <p className="font-medium">No comments yet.</p>
              <p className="text-sm opacity-80">Start the conversation.</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 mb-safe">
          <div className="flex items-center gap-3 bg-white p-2 rounded-full border border-gray-200 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <img src={user?.photoURL || '/default-avatar.png'} alt="" className="w-8 h-8 rounded-full ml-1 object-cover" />
            <input 
              type="text" 
              className="flex-1 bg-transparent border-none text-sm focus:outline-none px-2" 
              placeholder="Add a comment..." 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button 
              className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300 transition-all shrink-0" 
              onClick={handleSubmit}
              disabled={!inputText.trim()}
            >
              <Send size={14} className="ml-0.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GalleryPage;
