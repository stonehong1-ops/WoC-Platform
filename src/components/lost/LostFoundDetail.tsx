'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { chatService } from '@/lib/firebase/chatService';
import { lostFoundService } from '@/lib/firebase/lostFoundService';
import { LostFoundItem } from '@/types/lostFound';

import { useLanguage } from '@/contexts/LanguageContext';
import UserBadge from '@/components/common/UserBadge';

interface LostFoundDetailProps {
  id: string;
  onClose: () => void;
}

export default function LostFoundDetail({ id, onClose }: LostFoundDetailProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [item, setItem] = useState<LostFoundItem | null>(null);
  const [userLike, setUserLike] = useState<any>(null); // Added to track status
  const [isLiked, setIsLiked] = useState(false);
  const [togglingLike, setTogglingLike] = useState(false);

  // Image carousel
  const [currentImg, setCurrentImg] = useState(0);
  const touchStartX = useRef(0);

  // UI state
  const [isScrolled, setIsScrolled] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load item
  useEffect(() => {
    if (!id) return;
    const unsub = lostFoundService.subscribeItem(id, (data) => {
      setItem(data);
    });
    return () => unsub();
  }, [id]);

  // Check if liked
  useEffect(() => {
    if (!user || !id) return;
    const unsub = lostFoundService.subscribeMyLikes(user.uid, (likesData) => {
      const foundLike = likesData.find(l => l.itemId === id);
      setUserLike(foundLike || null);
      setIsLiked(!!foundLike);
    });
    return () => unsub();
  }, [user, id]);

  // Scroll listener for header
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => setIsScrolled(el.scrollTop > 60);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  if (!item) return (
    <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const images = item.images || [];

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentImg < images.length - 1) setCurrentImg(p => p + 1);
      if (diff < 0 && currentImg > 0) setCurrentImg(p => p - 1);
    }
  };

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return alert(t('lost.login_required'));
    setTogglingLike(true);
    try { await lostFoundService.toggleLike(user.uid, item.id); } catch (err) { console.error(err); }
    setTogglingLike(false);
  };

  const handleChatWithAuthor = async () => {
    if (!user) return alert(t('lost.login_required'));
    const authorId = item.authorId;
    if (user.uid === authorId) return alert(t('lost.author_self_chat'));

    const confirmed = window.confirm(t('lost.confirm_chat'));
    if (!confirmed) return;

    try {
      const roomId = await chatService.getOrCreatePrivateRoom([user.uid, authorId], user.uid, 'business');
      const itemTypeLabel = item.type === 'LOST' ? t('lost.lost') : t('lost.found');
      const itemInfo = `[${t('lost.inquiry_title')}]\n${t('lost.case_title')}: ${item.title}\n${t('lost.location')}: ${item.location}\n${t('lost.inquiry_link')}: ${window.location.origin}/lost-found?lostId=${item.id}`;
      
      await chatService.sendMessage({
        roomId,
        senderId: user.uid,
        senderName: user.displayName || 'User',
        senderPhoto: user.photoURL || undefined,
        text: itemInfo,
        type: 'text'
      });

      // Update Like Status to PENDING
      await lostFoundService.updateLikeStatus(user.uid, item.id, 'pending');

      router.push(`/chat?roomId=${roomId}`);
    } catch (err) {
      console.error("Failed to start chat:", err);
      alert(t('lost.msg_fail_chat'));
    }
  };

  const handleResolve = async () => {
    if (!user || user.uid !== item.authorId) return;
    const confirmed = window.confirm(t('lost.confirm_resolve'));
    if (!confirmed) return;
    try {
      await lostFoundService.updateItem(item.id, { status: 'RESOLVED' });
      alert(t('lost.resolve_success'));
    } catch(err) {
      console.error(err);
      alert(t('lost.msg_fail_resolve'));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <style dangerouslySetInnerHTML={{ __html: `
        .detail-scrollbar::-webkit-scrollbar { display: none; }
        .detail-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* ━━━ Header ━━━ */}
      <div 
        className={`fixed top-0 left-0 right-0 z-[110] flex items-center justify-between px-4 pb-3 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-gradient-to-b from-black/30 to-transparent'}`}
        style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}
      >
        <button onClick={onClose} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'bg-slate-100 text-[#2d3435]' : 'bg-black/20 backdrop-blur-sm text-white'}`}>
          <span className="material-symbols-rounded text-xl">arrow_back</span>
        </button>
        <div className={`text-sm font-bold truncate max-w-[180px] transition-opacity ${isScrolled ? 'opacity-100 text-[#2d3435]' : 'opacity-0'}`}>{item.title}</div>
        <div className="flex items-center gap-2">
          {user?.uid === item.authorId && (
            <button onClick={() => router.push(`/lost-found/register?edit=${item.id}`)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'bg-slate-100 text-[#2d3435]' : 'bg-black/20 backdrop-blur-sm text-white'}`}>
              <span className="material-symbols-rounded text-xl">edit</span>
            </button>
          )}
        </div>
      </div>

      {/* ━━━ Scrollable Content ━━━ */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto detail-scrollbar pb-[80px]">

        {/* 1) Image Carousel */}
        <div className="relative aspect-square overflow-hidden bg-[#f2f4f4]">
          {/* Fallback */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#c4cacc]">
            <span className="material-symbols-rounded text-5xl mb-1">help_outline</span>
            <span className="text-[10px] font-bold tracking-wider uppercase">{t('lost.no_image')}</span>
          </div>
          {/* Images */}
          {images.length > 0 && (
            <div className="relative h-full" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              <div className="flex h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${currentImg * 100}%)` }}>
                {images.map((img, i) => (
                  <div key={i} className="w-full flex-shrink-0 h-full">
                    <img src={img} alt={`${item.title} ${i + 1}`} className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                ))}
              </div>
              {/* Left/Right Arrows */}
              {images.length > 1 && currentImg > 0 && (
                <button onClick={() => setCurrentImg(p => p - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 z-10">
                  <span className="material-symbols-rounded text-lg">chevron_left</span>
                </button>
              )}
              {images.length > 1 && currentImg < images.length - 1 && (
                <button onClick={() => setCurrentImg(p => p + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 z-10">
                  <span className="material-symbols-rounded text-lg">chevron_right</span>
                </button>
              )}
              {/* Counter + Dots */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center">
                  <div className="flex gap-1.5 items-center">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setCurrentImg(i)}
                        className={`rounded-full transition-all ${i === currentImg ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`} />
                    ))}
                  </div>
                  <span className="absolute right-4 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{currentImg + 1}/{images.length}</span>
                </div>
              )}
            </div>
          )}
          {/* Status Badge */}
          <span className={`absolute top-16 left-4 z-20 text-white text-xs font-black px-3 py-1 rounded-full ${
            item.status === 'RESOLVED' ? 'bg-gray-800' : item.type === 'LOST' ? 'bg-red-500' : 'bg-primary'
          }`}>
            {item.status === 'RESOLVED' ? t('lost.resolved') : item.type === 'LOST' ? t('lost.lost') : t('lost.found')}
          </span>

          {/* User Interaction Status Badge */}
          {userLike && (userLike.status === 'pending' || userLike.status === 'in_progress') && (
            <div className={`absolute top-16 right-4 z-20 px-3 py-1 rounded-full backdrop-blur-md border shadow-lg flex items-center gap-1.5 animate-in slide-in-from-right duration-500 ${
              userLike.status === 'in_progress' 
                ? 'bg-blue-500/90 border-blue-400 text-white' 
                : 'bg-primary/90 border-primary/50 text-white'
            }`}>
              <span className="material-symbols-rounded text-sm">
                {userLike.status === 'in_progress' ? 'motion_photos_on' : 'hourglass_empty'}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider">
                {userLike.status === 'in_progress' ? t('shop.status_in_progress') : t('shop.status_pending')}
              </span>
            </div>
          )}
        </div>

        {/* 2) Title & Stats */}
        <div className="px-4 pt-5 pb-4 flex justify-between items-start border-b border-[#f2f4f4]">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-[10px] font-black text-[#acb3b4] uppercase tracking-widest leading-none mb-1.5 flex items-center gap-1">
              <span className="material-symbols-rounded text-[12px]">location_on</span>
              {item.location}
            </p>
            <h1 className="text-xl font-black text-[#2d3435] leading-tight font-headline">{item.title}</h1>
          </div>
          <div className="flex items-center gap-3 text-[#acb3b4] shrink-0 mt-3.5">
            <span className="flex items-center gap-0.5 text-[11px]">
              <span className="material-symbols-rounded text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span> {item.likesCount || 0}
            </span>
          </div>
        </div>

        {/* 3) Info Bar */}
        <div className="flex items-center gap-4 px-4 py-3 bg-[#f8f9fa] border-b border-[#e0e4e5]">
          <div className="flex items-center gap-1 text-[#596061]">
            <span className="material-symbols-rounded text-sm">calendar_month</span>
            <span className="text-xs font-medium">{item.date}</span>
          </div>
          {item.reward && item.reward > 0 ? (
            <div className="flex items-center gap-1 text-[#1A73E8]">
              <span className="material-symbols-rounded text-sm">payments</span>
              <span className="text-xs font-bold">{t('lost.reward')}: ${item.reward.toLocaleString()}</span>
            </div>
          ) : null}
        </div>

        {/* 4) Description */}
        <div className="px-4 py-4 border-b border-[#f2f4f4]">
          <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2">{t('lost.description')}</p>
          <p className={`text-sm text-[#596061] leading-relaxed whitespace-pre-line ${!showFullDesc ? 'line-clamp-4' : ''}`}>
            {item.description || t('lost.no_description')}
          </p>
          {item.description && item.description.length > 120 && (
            <button onClick={() => setShowFullDesc(!showFullDesc)} className="text-xs font-bold text-primary mt-2 flex items-center gap-0.5">
              {showFullDesc ? t('lost.show_less') : t('lost.show_more')}
              <span className="material-symbols-rounded text-sm">{showFullDesc ? 'expand_less' : 'expand_more'}</span>
            </button>
          )}
        </div>

        {/* 5) Author Action */}
        <div className="px-4 py-4 space-y-3">
          {user?.uid !== item.authorId ? (
            <button
              onClick={handleChatWithAuthor}
              disabled={item.status === 'RESOLVED'}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#f2f4f4] hover:bg-[#e8eaec] rounded-2xl transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              <span className="material-symbols-rounded text-lg text-[#596061]">chat</span>
              <span className="text-sm font-bold text-[#2d3435]">{t('lost.chat_author')}</span>
            </button>
          ) : (
            <button
              onClick={handleResolve}
              disabled={item.status === 'RESOLVED'}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-800 text-white rounded-2xl transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              <span className="material-symbols-rounded text-lg">check_circle</span>
              <span className="text-sm font-bold">{t('lost.mark_resolved')}</span>
            </button>
          )}
          <p className="text-[10px] text-[#acb3b4] text-center mt-1.5">{t('lost.chat_info_auto')}</p>
        </div>
      </div>

      {/* ━━━ Fixed Bottom Bar (compact) ━━━ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 px-4 py-2.5 flex items-center gap-3 max-w-md mx-auto">
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <UserBadge
              uid={item.authorId || ''}
              photoURL={item.authorPhoto}
              nickname={item.authorName}
              avatarSize="w-6 h-6"
              nameClassName="text-sm font-semibold text-slate-800"
            />
          </div>
        </div>
        <button onClick={handleToggleLike} disabled={togglingLike}
          className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-colors active:scale-90 ${isLiked ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-[#e0e4e5] text-[#596061]'}`}>
          <span className="material-symbols-rounded text-xl" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
        </button>
        {user?.uid !== item.authorId && (
          <button onClick={handleChatWithAuthor} disabled={item.status === 'RESOLVED'}
            className="flex-shrink-0 bg-primary text-white px-7 py-3 rounded-xl font-black text-sm tracking-wide shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-50">
            {item.status === 'RESOLVED' ? t('lost.unavailable') : t('lost.contact')}
          </button>
        )}
      </div>
    </div>
  );
}
