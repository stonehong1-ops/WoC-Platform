'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  MapPin, 
  Calendar, 
  Plus, 
  X, 
  MoreHorizontal,
  Bookmark
} from 'lucide-react';
import { galleryService, GalleryPost, GalleryComment } from '@/lib/firebase/galleryService';
import { useAuth } from '@/components/providers/AuthProvider';
import './gallery.css';

const GalleryPage = () => {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [selectedPostForViewer, setSelectedPostForViewer] = useState<GalleryPost | null>(null);
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005BC0]"></div>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      {/* Feed */}
      <div className="gallery-feed">
        {posts.map((post) => (
          <GalleryCard 
            key={post.id} 
            post={post} 
            onOpenComments={() => setActiveCommentPost(post.id)}
            onOpenViewer={() => setSelectedPostForViewer(post)}
          />
        ))}
        
        {posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <Plus size={40} />
            </div>
            <p>아직 등록된 갤러리가 없습니다.</p>
            <p className="text-sm">첫 번째 주인공이 되어보세요!</p>
          </div>
        )}
      </div>

      {/* Floating Create Button */}
      <Link href="/gallery/create" className="btn-create-floating">
        <Plus size={28} />
      </Link>

      {/* Overlays */}
      {activeCommentPost && (
        <CommentBottomSheet 
          postId={activeCommentPost} 
          onClose={() => setActiveCommentPost(null)} 
        />
      )}

      {selectedPostForViewer && (
        <FullscreenViewer 
          post={selectedPostForViewer} 
          onClose={() => setSelectedPostForViewer(null)} 
        />
      )}
    </div>
  );
};

const GalleryCard = ({ 
  post, 
  onOpenComments,
  onOpenViewer 
}: { 
  post: GalleryPost, 
  onOpenComments: () => void,
  onOpenViewer: () => void
}) => {
  const { user } = useAuth();
  const [activeDot, setActiveDot] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const isLiked = post.likedBy?.includes(user?.uid || '');

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
    await galleryService.toggleLike(post.id, user.uid, isLiked);
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
    <div className="gallery-post" onClick={onOpenViewer}>
      {/* Top Overlay */}
      <div className="gallery-post-overlay-top">
        <div className="author-info">
          <img src={post.authorPhoto || '/default-avatar.png'} alt="" className="author-avatar" />
          <span className="author-name">
            {post.authorName}
            <span className="post-time">{formatTime(post.createdAt)}</span>
          </span>
        </div>
        <button className="text-white">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Media Carousel */}
      <div 
        className="gallery-media-container" 
        ref={carouselRef}
        onScroll={handleScroll}
      >
        {post.media.map((url, idx) => (
          <div key={idx} className="gallery-media-item">
            <img src={url} alt="" />
          </div>
        ))}
      </div>

      {/* Pagination Dots */}
      {post.media.length > 1 && (
        <div className="pagination-dots">
          {post.media.map((_, idx) => (
            <div key={idx} className={`dot ${activeDot === idx ? 'active' : ''}`} />
          ))}
        </div>
      )}

      {/* Bottom Overlay */}
      <div className="gallery-post-overlay-bottom">
        <div className="post-tags" onClick={(e) => e.stopPropagation()}>
          {post.venueName && (
            <Link href={`/venues?id=${post.venueId}`} className="tag-badge">
              <MapPin size={12} />
              {post.venueName}
            </Link>
          )}
          {post.eventName && (
            <Link href={`/events?id=${post.eventId}`} className="tag-badge">
              <Calendar size={12} />
              {post.eventName}
            </Link>
          )}
        </div>
        
        <div className="post-caption">
          {post.caption}
        </div>

        <div className="post-actions" onClick={(e) => e.stopPropagation()}>
          <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
            <Heart size={24} fill={isLiked ? "#ff2d55" : "none"} />
            <span className="action-label">{post.likesCount || 0}</span>
          </button>
          <button className="action-btn" onClick={onOpenComments}>
            <MessageCircle size={24} />
            <span className="action-label">{post.commentsCount || 0}</span>
          </button>
          <button className="action-btn">
            <Send size={24} />
          </button>
          <div className="flex-1"></div>
          <button className="action-btn">
            <Bookmark size={24} />
          </button>
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
    <div className="bottom-sheet-overlay" onClick={onClose}>
      <div className="bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle"></div>
        <div className="sheet-header">
          <span className="sheet-title">Comments</span>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <img src={comment.authorPhoto || '/default-avatar.png'} alt="" className="comment-avatar" />
              <div className="comment-body">
                <div className="comment-author">{comment.authorName}</div>
                <div className="comment-text">{comment.text}</div>
                <div className="comment-meta">
                  <span>{comment.createdAt ? 'just now' : ''}</span>
                  <span>Like</span>
                  <span>Reply</span>
                </div>
              </div>
              <button className="text-gray-400">
                <Heart size={14} />
              </button>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="py-10 text-center text-gray-400">아직 댓글이 없습니다.</div>
          )}
        </div>

        <div className="comment-input-area">
          <img src={user?.photoURL || '/default-avatar.png'} alt="" className="w-8 h-8 rounded-full" />
          <input 
            type="text" 
            className="comment-input" 
            placeholder="Add a comment..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button className="comment-submit" onClick={handleSubmit}>Post</button>
        </div>
      </div>
    </div>
  );
};

const FullscreenViewer = ({ post, onClose }: { post: GalleryPost, onClose: () => void }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="fixed inset-0 bg-black z-[200] flex flex-col">
      <div className="flex justify-between items-center p-4 text-white z-10">
        <button onClick={onClose}><X size={28} /></button>
        <div className="text-sm font-medium">{activeIndex + 1} / {post.media.length}</div>
        <button><MoreHorizontal size={28} /></button>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        <img 
          src={post.media[activeIndex]} 
          alt="" 
          className="max-w-full max-h-full object-contain"
        />
        
        {activeIndex > 0 && (
          <button 
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 p-2 rounded-full text-white"
            onClick={() => setActiveIndex(activeIndex - 1)}
          >
            &larr;
          </button>
        )}
        
        {activeIndex < post.media.length - 1 && (
          <button 
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 p-2 rounded-full text-white"
            onClick={() => setActiveIndex(activeIndex + 1)}
          >
            &rarr;
          </button>
        )}
      </div>

      <div className="p-6 bg-black/50 backdrop-blur-md text-white">
        <div className="flex items-center gap-3 mb-4">
          <img src={post.authorPhoto} className="w-8 h-8 rounded-full" alt="" />
          <span className="font-bold">{post.authorName}</span>
        </div>
        <p className="text-sm opacity-90 line-clamp-3">{post.caption}</p>
      </div>
    </div>
  );
};

export default GalleryPage;
