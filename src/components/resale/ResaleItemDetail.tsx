'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { resaleService } from '@/lib/firebase/resaleService';
import { chatService } from '@/lib/firebase/chatService';
import { ResaleItem } from '@/types/resale';
import { safeDate } from '@/lib/utils/safeDate';
import ResalePurchaseFlow from './ResalePurchaseFlow';
import ChatRoom from '@/components/chat/ChatRoom';
import UserProfileClickable from '@/components/common/UserProfileClickable';
import { useNavigation } from '@/components/providers/NavigationProvider';

interface ResaleItemDetailProps {
  item: ResaleItem;
  onClose: () => void;
}

export default function ResaleItemDetail({ item, onClose }: ResaleItemDetailProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { setGlobalNavHidden } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Image carousel
  const [currentImg, setCurrentImg] = useState(0);
  const touchStartX = useRef(0);
  const images = (item.imageUrls?.length ? item.imageUrls : (item.imageUrl ? [item.imageUrl] : []));

  // UI state
  const [isScrolled, setIsScrolled] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [showPurchaseFlow, setShowPurchaseFlow] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isOwner = user?.uid === item.sellerId;

  useEffect(() => {
    setGlobalNavHidden(true);
    return () => setGlobalNavHidden(false);
  }, [setGlobalNavHidden]);

  // Scroll listener for header
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => setIsScrolled(el.scrollTop > 60);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  // Touch handlers for carousel
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentImg < images.length - 1) setCurrentImg(p => p + 1);
      if (diff < 0 && currentImg > 0) setCurrentImg(p => p - 1);
    }
  };

  const handleStatusChange = async (newStatus: 'active' | 'reserved' | 'sold') => {
    if (!isOwner) return;
    setIsSubmitting(true);
    try {
      await resaleService.updateItemStatus(item.id, newStatus);
      onClose();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert(t('resale.msg_update_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: `Check out ${item.title} on WoC!`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      alert(t('resale.msg_share_unsupported'));
    }
  };

  const handleChatClick = async () => {
    if (!user) {
      alert(t('resale.msg_login_chat'));
      return;
    }
    const sellerId = item.sellerId;
    if (user.uid === sellerId) return alert(t('resale.msg_no_self_chat'));

    if (!confirm(t('resale.msg_confirm_chat'))) return;

    try {
      await resaleService.setProductPendingStatus(user.uid, item.id);
      
      const roomId = await chatService.getOrCreatePrivateRoom([user.uid, sellerId], user.uid, 'business');

      const productInfo = `${t('resale.chat_inquiry_prefix')}\n${t('resale.chat_item_name')}: ${item.title}\n${t('resale.chat_price')}: ${item.currency || 'KRW'} ${item.price.toLocaleString()}\n${t('resale.chat_link')}: ${window.location.origin}/resale?itemId=${item.id}`;
      
      await chatService.sendMessage({
        roomId,
        senderId: user.uid,
        senderName: user.displayName || 'User',
        senderPhoto: user.photoURL || undefined,
        text: productInfo,
        type: 'text'
      });

      setChatRoomId(roomId);
    } catch (error) {
      console.error("Failed to start chat:", error);
      alert(t('resale.msg_chat_failed'));
    }
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      alert(t('resale.msg_login_like'));
      return;
    }
    try {
      await resaleService.toggleLike(user.uid, item.id);
    } catch (error) {
      console.error("Failed to toggle like", error);
    }
  };

  const getRelativeTime = (timestamp: any) => {
    if (!timestamp) return t('resale.just_now');
    const date = safeDate(timestamp);
    if (!date) return t('resale.just_now');
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return t('resale.just_now');
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}${t('resale.mins_ago')}`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}${t('resale.hours_ago')}`;
    return `${Math.floor(diffInSeconds / 86400)}${t('resale.days_ago')}`;
  };

  const conditionLabels: Record<string, string> = {
    'S': t('resale.cond_s'),
    'A': t('resale.cond_a'),
    'B': t('resale.cond_b'),
    'C': t('resale.cond_c')
  };

  const tradeMethodLabels: Record<string, string> = {
    'direct': t('resale.trade_direct'),
    'delivery': t('resale.trade_delivery'),
    'both': t('resale.trade_both')
  };

  const categoryLabels: Record<string, string> = {
    'Shoes': t('resale.cat_shoes'),
    'Apparel': t('resale.cat_apparel'),
    'Accessories': t('resale.cat_accessories'),
    'Equipment': t('resale.cat_equipment'),
    'Others': t('resale.cat_others')
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <style dangerouslySetInnerHTML={{ __html: `
        .detail-scrollbar::-webkit-scrollbar { display: none; }
        .detail-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-gradient-to-b from-black/30 to-transparent'}`}>
        <button onClick={onClose} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'bg-slate-100 text-[#2d3435]' : 'bg-black/20 backdrop-blur-sm text-white'}`}>
          <span className="material-symbols-rounded text-xl">arrow_back</span>
        </button>
        <div className={`text-base font-bold truncate max-w-[180px] transition-opacity ${isScrolled ? 'opacity-100 text-[#2d3435]' : 'opacity-0'}`}>{item.title}</div>
        <div className="flex items-center gap-2">
          {item.status !== 'active' && (
            <span className={`px-3 h-8 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center ${isScrolled ? 'bg-primary/10 text-primary' : 'bg-primary text-white'}`}>
              {item.status === 'sold' ? t('resale.btn_sold_out') : item.status === 'reserved' ? t('resale.btn_reserve') : item.status}
            </span>
          )}
          <button onClick={handleShare}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'bg-slate-100 text-[#2d3435]' : 'bg-black/20 backdrop-blur-sm text-white'}`}>
            <span className="material-symbols-rounded text-xl">share</span>
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto detail-scrollbar pb-[80px]">
        {/* Image Carousel */}
        <div className="relative aspect-square overflow-hidden bg-[#f2f4f4]">
          {/* Fallback */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#c4cacc]">
            <span className="material-symbols-rounded text-5xl mb-1">image</span>
            <span className="text-[10px] font-bold tracking-wider uppercase">{t('resale.no_image', 'No Image')}</span>
          </div>
          {/* Images */}
          {images.length > 0 && (
            <div className="relative h-full" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onClick={() => setIsImageExpanded(true)}>
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
                <button onClick={(e) => { e.stopPropagation(); setCurrentImg(p => p - 1); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 z-10">
                  <span className="material-symbols-rounded text-lg">chevron_left</span>
                </button>
              )}
              {images.length > 1 && currentImg < images.length - 1 && (
                <button onClick={(e) => { e.stopPropagation(); setCurrentImg(p => p + 1); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 z-10">
                  <span className="material-symbols-rounded text-lg">chevron_right</span>
                </button>
              )}
              {/* Overlay bottom left: Counter + Dots */}
              <div className="absolute bottom-4 left-4 flex flex-col items-start z-10" onClick={(e) => e.stopPropagation()}>
                {images.length > 1 && (
                  <>
                    <span className="bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">{currentImg + 1}/{images.length}</span>
                    <div className="flex gap-1.5 items-center pl-1">
                      {images.map((_, i) => (
                        <button key={i} onClick={(e) => { e.stopPropagation(); setCurrentImg(i); }}
                          className={`rounded-full transition-all ${i === currentImg ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Stats - Floating on the bottom right */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20" onClick={(e) => e.stopPropagation()}>
                <button onClick={handleLikeClick} className="px-3 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center gap-1.5 text-white transition-transform active:scale-95">
                  <span className="material-symbols-rounded text-[18px]" style={{ fontVariationSettings: item.likesCount && item.likesCount > 0 ? "'FILL' 1" : "'FILL' 0", color: item.likesCount && item.likesCount > 0 ? '#ef4444' : 'white' }}>favorite</span>
                  <span className="text-[11px] font-bold">{item.likesCount || 0}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Title & Stats */}
        <div className="px-4 pt-5 pb-4 flex justify-between items-start border-b border-[#f2f4f4]">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black text-[#acb3b4] uppercase tracking-widest leading-none">{categoryLabels[item.category] || item.category}</span>
              <span className="w-1 h-1 rounded-full bg-[#acb3b4]"></span>
              <span className="text-[10px] font-black text-[#acb3b4] uppercase tracking-widest leading-none">{getRelativeTime(item.createdAt)}</span>
            </div>
            <h1 className="text-xl font-black text-[#2d3435] leading-tight font-headline">{item.title}</h1>
          </div>
        </div>

        {/* Price */}
        <div className="px-4 py-4 border-b border-[#f2f4f4]">
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-[#2d3435] font-headline">{item.currency || 'KRW'} {item.price.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-[#acb3b4] font-medium mt-1.5">
            {item.canNegotiate ? t('resale.negotiable', 'Negotiable') : t('resale.fixed_price', 'Fixed Price')}
          </p>
        </div>

        {/* Location / Seller Info */}
        <div className="px-4 py-4 border-b border-[#f2f4f4]">
          <UserProfileClickable uid={item.sellerId} initialData={{ nickname: item.sellerName }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <span className="material-symbols-rounded text-xl">person</span>
              </div>
              <div className="flex-1">
                <h4 className="font-headline font-bold text-sm text-[#2d3435]">{item.sellerName}</h4>
                <div className="flex items-center gap-1 text-[11px] font-medium text-[#596061]">
                  <span className="material-symbols-rounded text-[12px]">location_on</span>
                  <span>{item.location === 'Seoul, Gangnam-gu' || item.location === 'Gangnam' ? t('resale.seoul_korea') : item.location}</span>
                  {item.locationDetail && <span>· {item.locationDetail}</span>}
                </div>
              </div>
            </div>
          </UserProfileClickable>
        </div>

        {/* Specs Boxed */}
        <div className="mx-4 my-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
          <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
            <span className="material-symbols-rounded text-sm text-primary">inventory_2</span>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('resale.item_specs', 'Item Specifications')}</p>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-[#596061] uppercase tracking-widest">{t('resale.condition')}</span>
              <span className="font-bold text-sm text-[#2d3435]">{conditionLabels[item.condition] || item.condition}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-[#596061] uppercase tracking-widest">{t('resale.trade_method')}</span>
              <span className="font-bold text-sm text-[#2d3435]">{tradeMethodLabels[item.tradeMethod] || item.tradeMethod}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="px-4 py-4 border-b border-[#f2f4f4]">
          <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2">{t('resale.description', 'Description')}</p>
          <p className="text-sm font-medium text-[#596061] leading-relaxed whitespace-pre-wrap">
            {item.description || t('resale.no_description', 'No description available.')}
          </p>
        </div>

        {/* Chat with Seller - Bottom of content */}
        {!isOwner && (
          <div className="px-4 py-4">
            <button
              onClick={handleChatClick}
              disabled={item.status === 'sold'}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl transition-colors active:scale-[0.98] ${
                item.status === 'sold'
                  ? 'bg-[#f2f4f4] text-[#acb3b4] cursor-not-allowed'
                  : 'bg-[#f2f4f4] hover:bg-[#e8eaec] text-[#2d3435]'
              }`}
            >
              <span className="material-symbols-rounded text-lg text-[#596061]">chat</span>
              <span className="text-sm font-bold">{t('resale.chat_with_seller')}</span>
            </button>
            <p className="text-[10px] text-[#acb3b4] text-center mt-1.5">{item.sellerName} · {t('resale.chat_info_auto')}</p>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 px-4 py-2.5 flex items-center gap-3 max-w-md mx-auto">
        <div className="flex-1 min-w-0">
          <p className="text-lg font-black text-[#2d3435] font-headline leading-tight">
            {item.currency || 'KRW'} {item.price.toLocaleString()}
          </p>
          <p className="text-[10px] text-[#acb3b4] truncate mt-0.5">
            {item.canNegotiate ? t('resale.negotiable', 'Negotiable') : t('resale.fixed_price', 'Fixed Price')}
          </p>
        </div>
        
        {isOwner ? (
          <div className="flex gap-2 flex-shrink-0">
            {item.status !== 'sold' && (
              <button
                onClick={() => handleStatusChange(item.status === 'reserved' ? 'active' : 'reserved')}
                disabled={isSubmitting}
                className="px-4 py-3 rounded-xl font-bold text-sm bg-[#f2f4f4] text-[#2d3435] hover:bg-[#e8eaec] transition-all"
              >
                {item.status === 'reserved' ? t('resale.btn_cancel') : t('resale.btn_reserve')}
              </button>
            )}
            {item.status !== 'sold' && (
              <button
                onClick={() => handleStatusChange('sold')}
                disabled={isSubmitting}
                className="bg-primary text-white px-5 py-3 rounded-xl font-black text-sm tracking-wide shadow-lg shadow-primary/20 active:scale-95 transition-transform"
              >
                {t('resale.btn_mark_sold')}
              </button>
            )}
            {item.status === 'sold' && (
              <button
                disabled
                className="px-5 py-3 rounded-xl font-black text-sm tracking-wide bg-[#f2f4f4] text-[#acb3b4] cursor-not-allowed"
              >
                {t('resale.btn_sold_out')}
              </button>
            )}
          </div>
        ) : (
          <>
            <button onClick={handleLikeClick}
              className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-colors active:scale-90 flex-shrink-0 ${item.likesCount && item.likesCount > 0 ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-[#e0e4e5] text-[#596061]'}`}>
              <span className="material-symbols-rounded text-xl" style={{ fontVariationSettings: item.likesCount && item.likesCount > 0 ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
            </button>
            <button
              onClick={() => setShowPurchaseFlow(true)}
              disabled={item.status === 'sold'}
              className={`flex-shrink-0 px-7 py-3 rounded-xl font-black text-sm tracking-wide shadow-lg transition-transform ${
                item.status === 'sold' 
                  ? 'bg-[#f2f4f4] text-[#acb3b4] cursor-not-allowed shadow-none'
                  : 'bg-primary text-white shadow-primary/20 active:scale-95'
              }`}
            >
              {item.status === 'sold' ? t('resale.btn_sold_out') : t('resale.btn_buy_now')}
            </button>
          </>
        )}
      </div>

      {/* Full Screen Image Viewer */}
      {isImageExpanded && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-in fade-in duration-200">
          <div className="absolute top-0 left-0 right-0 z-10 flex justify-end p-4">
            <button onClick={() => setIsImageExpanded(false)} className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center">
              <span className="material-symbols-rounded text-2xl">close</span>
            </button>
          </div>
          <div className="flex-1 w-full h-full flex items-center justify-center" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div className="flex w-full transition-transform duration-300 ease-out h-full items-center" style={{ transform: `translateX(-${currentImg * 100}%)` }}>
              {images.map((img, i) => (
                <div key={i} className="w-full flex-shrink-0 flex items-center justify-center px-4">
                  <img src={img} alt={`Fullscreen ${i + 1}`} className="w-full max-h-[80vh] object-contain" />
                </div>
              ))}
            </div>
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2">
              {images.map((_, i) => (
                <div key={i} className={`rounded-full transition-all ${i === currentImg ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40'}`} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Full Screen Chat Room */}
      {chatRoomId && (
        <div className="fixed inset-0 z-[200] bg-white animate-in slide-in-from-bottom duration-300">
          <ChatRoom
            roomId={chatRoomId}
            onBack={() => setChatRoomId(null)}
          />
        </div>
      )}

      {/* Purchase Flow */}
      {showPurchaseFlow && (
        <ResalePurchaseFlow
          item={item}
          onClose={() => setShowPurchaseFlow(false)}
          onComplete={() => {
            setShowPurchaseFlow(false);
            onClose(); // Close the detail modal entirely when done
          }}
        />
      )}
    </div>
  );
}
