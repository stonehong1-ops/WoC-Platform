'use client';

import './live.css';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Edit2,
  Music,
  GraduationCap,
  Building2
} from 'lucide-react';
import { galleryService, GalleryPost, GalleryComment, GalleryTag } from '@/lib/firebase/galleryService';
import { useAuth } from '@/components/providers/AuthProvider';
import { safeDate } from '@/lib/utils/safeDate';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigation } from '@/components/providers/NavigationProvider';

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
  const { t } = useLanguage();
  const { setIsHeaderVisible } = useNavigation();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  // 라이브 페이지는 snap-y 내부 스크롤 구조라 window scroll이 발생하지 않으므로
  // mount 시 즉시 헤더/푸터를 숨기고 unmount 시 복구한다
  useEffect(() => {
    setIsHeaderVisible(false);
    return () => setIsHeaderVisible(true);
  }, [setIsHeaderVisible]);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = galleryService.subscribeFeed((data) => {
      setPosts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to global compose event
  useEffect(() => {
    const handleComposeOpen = (e: CustomEvent) => {
      if (e.detail?.id === 'gallery') {
        router.push('/live/create');
      }
    };
    window.addEventListener('woc:compose:open', handleComposeOpen as EventListener);
    return () => window.removeEventListener('woc:compose:open', handleComposeOpen as EventListener);
  }, [router]);

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
            <p className="font-bold">{t('gallery.no_posts')}</p>
            <p className="text-sm">{t('gallery.be_first')}</p>
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
  const { t } = useLanguage();
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
    if (!user) return alert(t('gallery.sign_in_first'));
    const newIsLiked = !isLiked;
    await galleryService.toggleLike(post.id, user.uid, isLiked);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || user.uid !== post.authorId) return;
    if (confirm(t('gallery.confirm_delete'))) {
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
    const date = safeDate(timestamp);
    if (!date) return '';
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
                href={`/live/create?edit=${post.id}`} 
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
        
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Unified TAG v2 rendering */}
          {(post.tags && post.tags.length > 0) ? (
            post.tags.filter((tag: GalleryTag) => tag.type !== 'people').map((tag: GalleryTag) => {
              const href = tag.type === 'group' ? `/groups/${tag.id}` 
                : tag.type === 'social' ? `/social?id=${tag.id}` 
                : tag.type === 'event' ? `/events?id=${tag.id}` 
                : `/groups/${tag.groupId}?class=${tag.id}`;
              const TagIcon = tag.type === 'group' ? Building2 
                : tag.type === 'social' ? Music 
                : tag.type === 'event' ? Calendar 
                : GraduationCap;
              return (
                <Link 
                  key={`${tag.type}-${tag.id}`} 
                  href={href} 
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md text-xs font-semibold border border-white/20 hover:bg-black/50 transition-colors" 
                  onClick={(e) => e.stopPropagation()}
                >
                  <TagIcon size={12} className="text-white/80" />
                  <span className="text-white drop-shadow-sm">{tag.name}</span>
                  {tag.instructors && <span className="opacity-70 text-[10px] ml-0.5 border-l border-white/20 pl-1">{tag.instructors}</span>}
                </Link>
              );
            })
          ) : (
            /* Legacy fallback for posts without tags[] */
            <>
              {post.venueName && (
                <Link href={`/venues?id=${post.venueId}`} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md text-xs font-semibold border border-white/20" onClick={(e) => e.stopPropagation()}>
                  <Building2 size={12} className="text-white/80" />
                  <span className="text-white drop-shadow-sm">{post.venueName}</span>
                </Link>
              )}
              {post.eventName && (
                <Link href={`/events?id=${post.eventId}`} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md text-xs font-semibold border border-white/20" onClick={(e) => e.stopPropagation()}>
                  <Calendar size={12} className="text-white/80" />
                  <span className="text-white drop-shadow-sm">{post.eventName}</span>
                </Link>
              )}
            </>
          )}
          {/* People tags */}
          {post.tags && post.tags.filter((t: GalleryTag) => t.type === 'people').length > 0 && (
            <div className="flex items-center -space-x-1.5 ml-1">
              {post.tags.filter((t: GalleryTag) => t.type === 'people').map((t: GalleryTag) => (
                <div key={t.id} className="relative group/person cursor-pointer" title={t.name}>
                  {t.avatar 
                    ? <img src={t.avatar} alt={t.name} className="w-6 h-6 rounded-full border border-white/50 object-cover shadow-sm" />
                    : <div className="w-6 h-6 rounded-full border border-white/50 bg-black/40 backdrop-blur-sm flex items-center justify-center text-[10px] font-bold text-white shadow-sm">{t.name.charAt(0)}</div>
                  }
                  {/* Role Badge (if any) */}
                  {t.role === 'organizer' && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-purple-500 rounded-full border border-black/50 flex items-center justify-center text-[7px] font-bold text-white">O</div>}
                  {t.role === 'instructor' && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border border-black/50 flex items-center justify-center text-[7px] font-bold text-white">I</div>}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <p className="text-sm font-medium leading-snug line-clamp-3 drop-shadow-md whitespace-pre-wrap">
          {post.caption}
        </p>
      </div>

      {/* Right Side Vertical Actions */}
      <div className="absolute bottom-24 md:bottom-12 right-2 flex flex-col items-center gap-4 z-20">
        <Link href="/live/create" onClick={(e) => e.stopPropagation()} className="flex flex-col items-center gap-1 group">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-primary/80 backdrop-blur-md border border-white/20 text-white transition-transform active:scale-90 shadow-lg">
            <Plus size={18} />
          </div>
        </Link>

        <button className="flex flex-col items-center gap-1 group" onClick={handleLike}>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 transition-transform active:scale-90 ${isLiked ? 'text-[#ff2d55]' : 'text-white'}`}>
            <Heart size={18} fill={isLiked ? "#ff2d55" : "none"} className={isLiked ? "drop-shadow-[0_0_8px_rgba(255,45,85,0.5)]" : ""} />
          </div>
          <span className="text-white text-[10px] font-bold drop-shadow-md">{post.likesCount || 0}</span>
        </button>

        <button className="flex flex-col items-center gap-1 group" onClick={onOpenComments}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 text-white transition-transform active:scale-90">
            <MessageCircle size={18} fill="white" className="text-white drop-shadow-md" />
          </div>
          <span className="text-white text-[10px] font-bold drop-shadow-md">{post.commentsCount || 0}</span>
        </button>

        <button className="flex flex-col items-center gap-1 group">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 text-white transition-transform active:scale-90">
            <span className="material-symbols-outlined text-[18px] drop-shadow-md">share</span>
          </div>
          <span className="text-white text-[10px] font-bold drop-shadow-md">{t('gallery.share')}</span>
        </button>

        <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-white spin-slow mt-1 opacity-80">
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
  const { t } = useLanguage();

  useEffect(() => {
    const unsubscribe = galleryService.subscribeComments(postId, (data) => {
      setComments(data);
    });
    return () => unsubscribe();
  }, [postId]);

  const handleSubmit = async () => {
    if (!user) return alert(t('gallery.sign_in_first'));
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
          <div className="w-12 h-1.5 bg-outline-variant rounded-full"></div>
        </div>
        
        <div className="px-6 pb-4 border-b border-outline-variant flex justify-between items-center shrink-0">
          <h2 className="text-lg font-extrabold text-on-surface font-headline">{comments.length} {t('gallery.comments')}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container transition-colors">
            <X size={20} className="text-on-surface-variant" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <img src={comment.authorPhoto || '/default-avatar.png'} alt="" className="w-10 h-10 rounded-full object-cover border border-outline-variant shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-on-surface">{comment.authorName}</span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    {comment.createdAt ? t('gallery.just_now') : ''}
                  </span>
                </div>
                <p className="text-sm text-on-surface leading-relaxed">{comment.text}</p>
                <div className="flex gap-4 mt-2 text-xs font-bold text-on-surface-variant">
                  <button className="hover:text-on-surface transition-colors">{t('gallery.reply')}</button>
                </div>
              </div>
              <button className="text-outline hover:text-error transition-colors shrink-0 pt-2">
                <Heart size={16} />
              </button>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-on-surface-variant">
              <MessageCircle size={40} className="mb-4 opacity-20" />
              <p className="font-medium">{t('gallery.no_comments')}</p>
              <p className="text-sm opacity-80">{t('gallery.start_conversation')}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-outline-variant bg-surface shrink-0 mb-safe">
          <div className="flex items-center gap-3 bg-surface-container-lowest p-2 rounded-full border border-outline shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <img src={user?.photoURL || '/default-avatar.png'} alt="" className="w-8 h-8 rounded-full ml-1 object-cover" />
            <input 
              type="text" 
              className="flex-1 bg-transparent border-none text-sm focus:outline-none px-2 text-on-surface" 
              placeholder={t('gallery.add_comment')} 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button 
              className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-50 disabled:bg-outline-variant transition-all shrink-0" 
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
