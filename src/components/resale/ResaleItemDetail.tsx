'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { resaleService } from '@/lib/firebase/resaleService';
import { chatService } from '@/lib/firebase/chatService';
import { ResaleItem, UserReputation } from '@/types/resale';
import { motion } from 'framer-motion';
import { safeDate } from '@/lib/utils/safeData';
import ResalePurchaseFlow from './ResalePurchaseFlow';
import ChatRoom from '@/components/chat/ChatRoom';
import UserProfileClickable from '@/components/common/UserProfileClickable';

interface ResaleItemDetailProps {
  item: ResaleItem;
  onClose: () => void;
}

export default function ResaleItemDetail({ item, onClose }: ResaleItemDetailProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sellerReputation, setSellerReputation] = useState<UserReputation | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [showPurchaseFlow, setShowPurchaseFlow] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isOwner = user?.uid === item.sellerId;

  useEffect(() => {
    // Fetch seller reputation
    const fetchReputation = async () => {
      try {
        const rep = await resaleService.getUserReputation(item.sellerId);
        setSellerReputation(rep);
      } catch (error) {
        console.error("Failed to fetch seller reputation", error);
      }
    };
    fetchReputation();
  }, [item.sellerId]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        setIsScrolled(scrollRef.current.scrollTop > 50);
      }
    };
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (scrollEl) {
        scrollEl.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const handleStatusChange = async (newStatus: 'active' | 'reserved' | 'sold') => {
    if (!isOwner) return;
    setIsSubmitting(true);
    try {
      await resaleService.updateItemStatus(item.id, newStatus);
      onClose();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status.");
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
      alert("Sharing is not supported on this device.");
    }
  };

  const handleChatClick = async () => {
    if (!user) {
      alert("Please log in to chat.");
      return;
    }
    const sellerId = item.sellerId;
    if (user.uid === sellerId) return alert('You cannot chat with yourself');

    const confirmed = window.confirm('이제 판매자와 대화방이 열리고 이 상품에 대한 문의가 진행됩니다. 계속하시겠습니까?');
    if (!confirmed) return;

    try {
      await resaleService.setProductPendingStatus(user.uid, item.id);
      
      const roomId = await chatService.getOrCreatePrivateRoom([user.uid, sellerId], user.uid, 'business');

      const productInfo = `[상품 문의]\n상품명: ${item.title}\n가격: ₩${item.price.toLocaleString()}\n바로가기: ${window.location.origin}/resale?itemId=${item.id}`;
      
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
      alert("Failed to initiate chat.");
    }
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      alert("Please log in to like.");
      return;
    }
    try {
      await resaleService.toggleLike(user.uid, item.id);
    } catch (error) {
      console.error("Failed to toggle like", error);
    }
  };

  const getRelativeTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = safeDate(timestamp);
    if (!date) return 'Just now';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const conditionLabels: Record<string, string> = {
    'S': 'New',
    'A': 'Like New',
    'B': 'Good',
    'C': 'Well-used'
  };

  const tradeMethodLabels: Record<string, string> = {
    'direct': 'Direct Meeting',
    'delivery': 'Global Delivery',
    'both': 'Both Available'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-white flex flex-col max-w-md mx-auto h-[100dvh] overflow-hidden"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-rounded { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}} />

      {/* Header - Glassmorphic / Scroll-responsive */}
      <div className={`absolute top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-surface-container' : 'bg-gradient-to-b from-black/50 to-transparent'}`}>
        <div className="flex justify-between items-center px-4 py-4 max-w-md mx-auto">
          <button 
            onClick={onClose} 
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isScrolled ? 'bg-surface-container text-[#2d3435]' : 'bg-black/20 text-white backdrop-blur-md hover:bg-black/40'}`}
          >
            <span className="material-symbols-rounded text-xl leading-none">arrow_back</span>
          </button>
          
          <div className="flex gap-2">
            {item.status !== 'active' && (
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center ${isScrolled ? 'bg-primary/10 text-primary' : 'bg-primary text-white'}`}>
                {item.status}
              </span>
            )}
            <button 
              onClick={handleShare}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isScrolled ? 'bg-surface-container text-[#2d3435]' : 'bg-black/20 text-white backdrop-blur-md hover:bg-black/40'}`}
            >
              <span className="material-symbols-rounded text-xl leading-none">share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth bg-white pb-28">
        {/* Hero Image */}
        <div 
          className="w-full aspect-square relative bg-surface-container cursor-pointer"
          onClick={() => setIsImageExpanded(true)}
        >
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-container text-[#596061]/50">
              <span className="material-symbols-rounded text-6xl">image</span>
            </div>
          )}
          {/* Stats - Floating on the right side */}
          <div className="absolute bottom-6 right-4 flex flex-col items-center gap-4 z-20" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center gap-1.5">
              <button 
                onClick={handleLikeClick}
                className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white transition-transform active:scale-90"
              >
                <span className="material-symbols-rounded text-2xl" style={{ fontVariationSettings: item.likesCount && item.likesCount > 0 ? "'FILL' 1" : "'FILL' 0", color: item.likesCount && item.likesCount > 0 ? '#ef4444' : 'white' }}>favorite</span>
              </button>
              <span className="text-white text-[11px] font-bold drop-shadow-md">{item.likesCount || 0}</span>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Seller Info Profile */}
          <div className="flex items-center justify-between pb-6 border-b border-surface-container-highest">
            <UserProfileClickable uid={item.sellerId} initialData={{ nickname: item.sellerName }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-rounded text-2xl">person</span>
                </div>
                <div>
                  <h4 className="font-headline font-bold text-base text-[#2d3435]">{item.sellerName}</h4>
                  <div className="text-[11px] font-medium text-[#596061] uppercase tracking-wider">{item.location === 'Seoul, Gangnam-gu' || item.location === 'Gangnam' ? 'Seoul, Korea' : item.location}</div>
                </div>
              </div>
            </UserProfileClickable>
            
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-[#596061] uppercase tracking-widest">Manner Temp</span>
                <span className="material-symbols-rounded text-[14px] text-red-500">thermostat</span>
              </div>
              <div className="font-headline font-black text-xl text-primary">
                {sellerReputation ? `${sellerReputation.hobbyScore.toFixed(1)}°C` : '...'}
              </div>
            </div>
          </div>

          {/* Item Details */}
          <div className="space-y-4">
            <div>
              <span className="inline-block px-2 py-1 bg-surface-container rounded text-[10px] font-bold text-[#596061] mb-2 uppercase tracking-wider">{item.category}</span>
              <h1 className="text-lg font-black text-[#2d3435] leading-tight font-headline mb-3">
                {item.title}
              </h1>
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#596061] uppercase tracking-wider">
                <span>{getRelativeTime(item.createdAt)}</span>
                <span className="w-1 h-1 rounded-full bg-[#acb3b4]"></span>
                <span className="flex items-center gap-1">Location: {item.location === 'Seoul, Gangnam-gu' || item.location === 'Gangnam' ? 'Seoul, Korea' : item.location}</span>
              </div>
            </div>

            {/* Badges / Specs */}
            <div className="grid grid-cols-2 gap-3 py-4">
              <div className="bg-[#f2f4f4] rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-[10px] font-black text-[#596061] uppercase tracking-widest">Condition</span>
                <span className="font-bold text-sm text-[#2d3435]">{conditionLabels[item.condition] || item.condition}</span>
              </div>
              <div className="bg-[#f2f4f4] rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-[10px] font-black text-[#596061] uppercase tracking-widest">Trade Method</span>
                <span className="font-bold text-sm text-[#2d3435]">{tradeMethodLabels[item.tradeMethod] || item.tradeMethod}</span>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm font-medium text-[#596061] leading-relaxed whitespace-pre-wrap">
                {item.description}
              </p>
            </div>
          </div>
        </div>

        {/* Chat with Seller - Positioned at bottom of content like Shop */}
        {!isOwner && (
          <div className="px-5 py-4">
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
              <span className="text-sm font-bold">Chat with Seller</span>
            </button>
            <p className="text-[10px] text-[#acb3b4] text-center mt-1.5">{item.sellerName} · Product info will be sent automatically</p>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 px-4 py-2.5 flex items-center gap-3 max-w-md mx-auto pb-6">
        <div className="flex-1 min-w-0">
          <p className="text-lg font-black text-[#2d3435] font-headline leading-tight">₩{item.price.toLocaleString()}</p>
          {!item.canNegotiate && (
            <p className="text-[10px] text-[#acb3b4] truncate mt-0.5">Fixed Price</p>
          )}
        </div>
        
        {isOwner ? (
          <div className="flex gap-2 flex-shrink-0">
            {item.status !== 'sold' && (
              <button
                onClick={() => handleStatusChange(item.status === 'reserved' ? 'active' : 'reserved')}
                disabled={isSubmitting}
                className="px-4 py-3 rounded-xl font-bold text-sm bg-[#f2f4f4] text-[#2d3435] hover:bg-[#e8eaec] transition-all"
              >
                {item.status === 'reserved' ? 'Cancel' : 'Reserve'}
              </button>
            )}
            {item.status !== 'sold' && (
              <button
                onClick={() => handleStatusChange('sold')}
                disabled={isSubmitting}
                className="bg-primary text-white px-5 py-3 rounded-xl font-black text-sm tracking-wide shadow-lg shadow-primary/20 active:scale-95 transition-transform"
              >
                Mark Sold
              </button>
            )}
            {item.status === 'sold' && (
              <button
                disabled
                className="px-5 py-3 rounded-xl font-black text-sm tracking-wide bg-[#f2f4f4] text-[#acb3b4] cursor-not-allowed"
              >
                Sold Out
              </button>
            )}
          </div>
        ) : (
          <>
            <button onClick={handleLikeClick}
              className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-colors active:scale-90 flex-shrink-0 ${item.likesCount && item.likesCount > 0 ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-[#e0e4e5] text-[#596061]'}`}>
              {/* Note: since resaleService doesn't pass 'isLiked' bool yet, using likesCount as temporary visual fallback. User will be refactoring this. */}
              <span className="material-symbols-rounded text-xl" style={{ fontVariationSettings: item.likesCount && item.likesCount > 0 ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
            </button>
            <button
              onClick={() => setShowPurchaseFlow(true)}
              disabled={item.status === 'sold'}
              className={`flex-shrink-0 px-7 py-3 rounded-xl font-black text-sm tracking-wide transition-transform ${
                item.status === 'sold' 
                  ? 'bg-[#f2f4f4] text-[#acb3b4] cursor-not-allowed'
                  : 'bg-primary text-white shadow-lg shadow-primary/20 active:scale-95'
              }`}
            >
              {item.status === 'sold' ? 'Sold Out' : 'Buy Now'}
            </button>
          </>
        )}
      </div>

      {/* Full Image Popup */}
      {isImageExpanded && item.imageUrl && (
        <div 
          className="fixed inset-0 z-[200] bg-black flex items-center justify-center animate-in fade-in duration-300"
          onClick={() => setIsImageExpanded(false)}
        >
          <button 
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={(e) => { e.stopPropagation(); setIsImageExpanded(false); }}
          >
            <span className="material-symbols-rounded">close</span>
          </button>
          <img src={item.imageUrl} alt={item.title} className="max-w-full max-h-full object-contain" />
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
    </motion.div>
  );
}
