'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { rentalService } from '@/lib/firebase/rentalService';
import { chatService } from '@/lib/firebase/chatService';
import { groupService } from '@/lib/firebase/groupService';
import { RentalSpace } from '@/types/rental';
import { Group } from '@/types/group';
import SectionCard from '@/components/ui/SectionCard';
import InfoRow from '@/components/ui/InfoRow';
import CollapseSection from '@/components/ui/CollapseSection';
import ChatRoom from '@/components/chat/ChatRoom';
import RentalRequestFlow from './RentalRequestFlow';

interface RentalDetailProps {
  space: RentalSpace;
  isLiked: boolean;
  onClose: () => void;
  onToggleLike: (e: React.MouseEvent, space: RentalSpace) => void;
}

export default function RentalDetail({ space, isLiked, onClose, onToggleLike }: RentalDetailProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  
  // Image carousel
  const [currentImg, setCurrentImg] = useState(0);
  const touchStartX = useRef(0);
  const images = useMemo(() => space?.images?.length ? space.images : [], [space]);
  const [showImageModal, setShowImageModal] = useState(false);

  // UI state
  const [isScrolled, setIsScrolled] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Form State
  const [showRequestFlow, setShowRequestFlow] = useState(false);

  // Scarcity mock
  const [viewerCount] = useState(() => Math.floor(Math.random() * 18) + 5);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        if (space.groupId) {
          const groupData = await groupService.getGroup(space.groupId);
          if (groupData) setGroup(groupData);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchGroup();
  }, [space.groupId]);

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

  const handleChatWithOwner = async () => {
    if (!user) return alert("Login is required.");
    if (user.uid === space.hostId) return alert("You cannot inquire about your own space.");

    const confirmed = window.confirm('이제 호스트와 대화방이 열리고 이 공간에 대한 문의가 진행됩니다. 계속하시겠습니까?');
    if (!confirmed) return;

    setIsChatLoading(true);
    try {
      const roomId = await chatService.getOrCreatePrivateRoom([user.uid, space.hostId], user.uid, 'business');
      
      const spaceInfo = `[대관 문의]\n공간명: ${space.title}\n시간당: ₩${(space.pricePerHour || 0).toLocaleString()}\n위치: ${space.location}\n바로가기: ${window.location.origin}/rental?spaceId=${space.id}`;
      await chatService.sendMessage({
        roomId,
        senderId: user.uid,
        senderName: user.displayName || 'User',
        senderPhoto: user.photoURL || undefined,
        text: spaceInfo,
        type: 'text'
      });
      
      setChatRoomId(roomId);
    } catch (err) {
      console.error(err);
      alert('Error connecting to chat room.');
    } finally {
      setIsChatLoading(false);
    }
  };

  // Pricing Logic
  const minMaxPrice = useMemo(() => {
    if (group?.rentalSettings?.pricePalette) {
      const prices = Object.values(group.rentalSettings.pricePalette).filter(p => p > 0);
      if (prices.length > 0) {
        return { min: Math.min(...prices), max: Math.max(...prices) };
      }
    }
    if (space?.pricePerHour) return { min: space.pricePerHour, max: space.pricePerHour };
    return { min: 0, max: 0 };
  }, [group, space]);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <style dangerouslySetInnerHTML={{ __html: `
        .detail-scrollbar::-webkit-scrollbar { display: none; }
        .detail-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-rounded { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}} />

      {/* ━━━ Header ━━━ */}
      <div className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-gradient-to-b from-black/30 to-transparent'}`}>
        <button onClick={onClose} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'bg-slate-100 text-[#2d3435]' : 'bg-black/20 backdrop-blur-sm text-white'}`}>
          <span className="material-symbols-rounded text-xl">arrow_back</span>
        </button>
        <div className={`text-base font-bold truncate max-w-[180px] transition-opacity ${isScrolled ? 'opacity-100 text-[#2d3435]' : 'opacity-0'}`}>{space.title}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: space.title,
                url: window.location.href,
              }).catch(console.error);
            } else {
              alert('Share not supported on this browser');
            }
          }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'bg-slate-100' : 'bg-black/20 backdrop-blur-sm'} ${isScrolled ? 'text-[#2d3435]' : 'text-white'}`}>
            <span className="material-symbols-rounded text-xl">share</span>
          </button>
        </div>
      </div>

      {/* ━━━ Scrollable Content ━━━ */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto detail-scrollbar pb-[80px]">

        {/* 1) Image Carousel */}
        <div className="relative aspect-square w-full overflow-hidden bg-[#f2f4f4]">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#c4cacc]">
            <span className="material-symbols-rounded text-5xl mb-1">local_mall</span>
            <span className="text-[10px] font-bold tracking-wider uppercase">No Image</span>
          </div>
          {images.length > 0 && (
            <div className="relative h-full" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onClick={() => setShowImageModal(true)}>
              <div className="flex h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${currentImg * 100}%)` }}>
                {images.map((img, i) => (
                  <div key={i} className="w-full flex-shrink-0 h-full">
                    <img src={img} alt={`${space.title} ${i + 1}`} className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                ))}
              </div>
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
              {images.length > 1 && (
                <div className="absolute bottom-4 left-4 flex flex-col items-start z-10" onClick={(e) => e.stopPropagation()}>
                  <span className="bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">{currentImg + 1}/{images.length}</span>
                  <div className="flex gap-1.5 items-center pl-1">
                    {images.map((_, i) => (
                      <button key={i} onClick={(e) => { e.stopPropagation(); setCurrentImg(i); }}
                        className={`rounded-full transition-all ${i === currentImg ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`} />
                    ))}
                  </div>
                </div>
              )}

              {/* Stats - Floating on the bottom right (Shop pattern) */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20" onClick={(e) => e.stopPropagation()}>
                <button onClick={(e) => { e.stopPropagation(); onToggleLike(e, space); }} className="px-3 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center gap-1.5 text-white transition-transform active:scale-95">
                  <span className="material-symbols-rounded text-[18px]" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0", color: isLiked ? '#ef4444' : 'white' }}>favorite</span>
                  <span className="text-[11px] font-bold">{space.likesCount || 0}</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); }} className="px-3 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center gap-1.5 text-white transition-transform active:scale-95">
                  <span className="material-symbols-rounded text-[18px]">chat_bubble</span>
                  <span className="text-[11px] font-bold">0</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2) Title */}
        <div className="px-4 pt-5 pb-4 flex justify-between items-start border-b border-[#f2f4f4]">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-[10px] font-black text-[#acb3b4] uppercase tracking-widest leading-none mb-1.5">{group?.name || 'FREESTYLE TANGO'}</p>
            <h1 className="text-xl font-black text-[#2d3435] leading-tight font-headline">{space.title}</h1>
          </div>
        </div>

        {/* 3) Scarcity Bar */}
        <div className="flex items-center gap-4 px-4 py-3 bg-[#fff8f0] border-b border-[#ffe8cc]">
          <div className="flex items-center gap-1 text-[#e67700]">
            <span className="material-symbols-rounded text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            <span className="text-xs font-bold">Popular Space</span>
          </div>
          <div className="flex items-center gap-1 text-[#e67700]">
            <span className="material-symbols-rounded text-sm">visibility</span>
            <span className="text-xs font-bold">{viewerCount} viewing now</span>
          </div>
        </div>



        {/* 5) Payment Info */}
        <div className="px-4 py-4 border-b border-[#f2f4f4]">
          <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-3">Rental Policy</p>
          <div className="space-y-4">
            <InfoRow 
              icon="schedule" 
              title="Minimum Hours" 
              subtitle={`Minimum ${space.minHours} hours required per booking`} 
            />
            <InfoRow 
              icon="account_balance" 
              title="Payment Method" 
              subtitle="Bank Transfer only" 
            />
          </div>
        </div>

        {/* 6) Amenities & Info */}
        <div className="px-4 py-4 border-b border-[#f2f4f4]">
          <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-3">Amenities & Info</p>
          <div className="space-y-4">
            <InfoRow 
              icon="group" 
              iconBg="bg-[#f0f4ff]" 
              iconColor="text-primary" 
              title="Capacity" 
              subtitle={`Maximum ${space.capacity || '?'} people allowed`} 
            />
            <InfoRow 
              icon="straighten" 
              iconBg="bg-[#f8f9fa]" 
              iconColor="text-[#596061]" 
              title="Space Size" 
              subtitle={space.size || 'N/A'} 
            />
            <InfoRow 
              icon="layers" 
              iconBg="bg-[#edf7ed]" 
              iconColor="text-green-600" 
              title="Floor Material" 
              subtitle={space.floorMaterial || 'Wood'} 
            />
            <InfoRow 
              icon="wall_lamp" 
              iconBg="bg-[#fff3f0]" 
              iconColor="text-[#e67700]" 
              title="Mirror" 
              subtitle={space.hasMirror ? 'Equipped with mirrors' : 'No mirrors available'} 
            />
          </div>
          
          {space.facilities && space.facilities.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#f2f4f4]">
              <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2 flex items-center gap-1">
                Additional Facilities
              </p>
              <div className="flex flex-wrap gap-2">
                {space.facilities.map(f => (
                  <span key={f} className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#f2f4f4] text-[#2d3435] border border-[#e0e4e5]">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(group?.rentalSettings?.rentalInfo || space.rules) && (
            <div className="mt-4 pt-4 border-t border-[#f2f4f4]">
              <CollapseSection icon="warning" title="Rules & Guidelines" defaultOpen={true}>
                <p className="text-sm text-[#596061] leading-relaxed whitespace-pre-wrap">
                  {group?.rentalSettings?.rentalInfo || space.rules}
                </p>
              </CollapseSection>
            </div>
          )}
        </div>

        {/* 7) Description */}
        <div className="px-4 py-4 border-b border-[#f2f4f4]">
          <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2">Description</p>
          <p className={`text-sm text-[#596061] leading-relaxed whitespace-pre-line ${!showFullDesc ? 'line-clamp-4' : ''}`}>
            {space.description || 'No description available.'}
          </p>
          {space.description && space.description.length > 120 && (
            <button onClick={() => setShowFullDesc(!showFullDesc)} className="text-xs font-bold text-primary mt-2 flex items-center gap-0.5">
              {showFullDesc ? 'Less' : 'More'}
              <span className="material-symbols-rounded text-sm">{showFullDesc ? 'expand_less' : 'expand_more'}</span>
            </button>
          )}
        </div>

        {/* 8) Chat with Host */}
        <div className="px-4 py-4">
          <button
            onClick={handleChatWithOwner}
            disabled={isChatLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#f2f4f4] hover:bg-[#e8eaec] rounded-2xl transition-colors active:scale-[0.98] disabled:opacity-50"
          >
            {isChatLoading ? (
               <span className="w-5 h-5 border-2 border-[#596061] border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span className="material-symbols-rounded text-lg text-[#596061]">chat</span>
                <span className="text-sm font-bold text-[#2d3435]">Chat with Host</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-[#acb3b4] text-center mt-1.5">{group?.name || 'FREESTYLE TANGO'} · Inquiry includes space info</p>
        </div>
      </div>

      {/* ━━━ Fixed Bottom Bar (compact) ━━━ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 px-4 py-2.5 flex items-center gap-3 max-w-md mx-auto">
        <div className="flex-1 min-w-0">
          <p className="text-lg font-black text-[#2d3435] font-headline leading-tight">₩{minMaxPrice.min.toLocaleString()}</p>
          <p className="text-[10px] text-[#acb3b4] truncate">Starting price / hr</p>
        </div>
        <button onClick={(e) => onToggleLike(e, space)}
          className={`w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center border transition-colors active:scale-90 ${isLiked ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-[#e0e4e5] text-[#596061]'}`}>
          <span className="material-symbols-rounded text-xl" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
        </button>
        <button onClick={() => setShowRequestFlow(true)}
          className="flex-shrink-0 bg-primary text-white px-7 py-3 rounded-xl font-black text-sm tracking-wide shadow-lg shadow-primary/20 active:scale-95 transition-transform">
          Request
        </button>
      </div>

      {/* ━━━ Rental Request Flow ━━━ */}
      {showRequestFlow && (
        <RentalRequestFlow
          space={space}
          onClose={() => setShowRequestFlow(false)}
          onSuccess={(newChatRoomId) => {
            setShowRequestFlow(false);
            if (newChatRoomId) setChatRoomId(newChatRoomId);
          }}
        />
      )}

      {/* ━━━ Full Screen Image Viewer ━━━ */}
      {showImageModal && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-in fade-in duration-200">
          <div className="absolute top-0 left-0 right-0 z-10 flex justify-end p-4">
            <button onClick={() => setShowImageModal(false)} className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center">
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

      {/* ━━━ Full Screen Chat Room ━━━ */}
      {chatRoomId && (
        <div className="fixed inset-0 z-[200] bg-white animate-in slide-in-from-bottom duration-300">
          <ChatRoom
            roomId={chatRoomId}
            onBack={() => setChatRoomId(null)}
          />
        </div>
      )}
    </div>
  );
}
