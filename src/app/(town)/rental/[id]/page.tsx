'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { rentalService } from '@/lib/firebase/rentalService';
import { chatService } from '@/lib/firebase/chatService';
import { groupService } from '@/lib/firebase/groupService';
import { RentalSpace } from '@/types/rental';
import { Group } from '@/types/group';

export default function RentalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [space, setSpace] = useState<RentalSpace | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  // Image carousel
  const [currentImg, setCurrentImg] = useState(0);
  const touchStartX = useRef(0);
  const images = useMemo(() => space?.images?.length ? space.images : [], [space]);

  // UI state
  const [isScrolled, setIsScrolled] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  // Form State
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [headcount, setHeadcount] = useState<number | ''>('');
  const [purpose, setPurpose] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scarcity mock
  const [viewerCount] = useState(() => Math.floor(Math.random() * 18) + 5);

  useEffect(() => {
    const fetchSpaceAndGroup = async () => {
      try {
        const data = await rentalService.getSpace(resolvedParams.id);
        if (data) {
          setSpace(data);
          if (data.groupId) {
            const groupData = await groupService.getGroup(data.groupId);
            if (groupData) setGroup(groupData);
          }
        } else {
          alert('Space does not exist.');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSpaceAndGroup();
  }, [resolvedParams.id]);

  useEffect(() => {
    const handler = () => {
      if (window.scrollY > 60) setIsScrolled(true);
      else setIsScrolled(false);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
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

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return alert("Please login first");
    setIsLiked(!isLiked);
  };

  const handleChatWithOwner = async () => {
    if (!user) return alert("Login is required.");
    if (!space) return;
    if (user.uid === space.hostId) return alert("You cannot inquire about your own space.");

    setIsChatLoading(true);
    try {
      const roomId = await chatService.getOrCreatePrivateRoom([user.uid, space.hostId], user.uid, 'business');
      
      const spaceInfo = `[대관 문의]\n공간명: ${space.title}\n시간당: ₩${(space.pricePerHour || 0).toLocaleString()}\n위치: ${space.location}\n바로가기: ${window.location.origin}/rental/${space.id}`;
      await chatService.sendMessage({
        roomId,
        senderId: user.uid,
        senderName: user.displayName || 'User',
        senderPhoto: user.photoURL || undefined,
        text: spaceInfo,
        type: 'text'
      });
      
      router.push(`/chat/${roomId}`);
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

  // Reservation Form Handler
  const handleRequestSubmit = async () => {
    if (!user) return alert('Login is required.');
    if (user.uid === space?.hostId) return alert('You cannot inquire about your own space.');
    if (!date || !startTime || !endTime || !headcount || !purpose) return alert('Please fill in all required fields (Date, Time, People, Purpose).');

    setIsSubmitting(true);
    try {
      const result = await rentalService.createRequest({
        spaceId: space!.id,
        hostId: space!.hostId,
        guestId: user.uid,
        date,
        startTime,
        endTime,
        headcount: Number(headcount),
        purpose,
        message
      });
      
      alert('Your rental inquiry has been sent to the host. Moving to chat room.');
      if (result.chatRoomId) {
        router.push(`/chat/${result.chatRoomId}`);
      } else {
        router.push('/chat');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during processing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!space) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <span className="material-symbols-rounded text-6xl text-slate-300 mb-4">error_outline</span>
        <p className="text-[#596061] font-bold">Space not found.</p>
        <button onClick={() => router.back()} className="mt-4 px-6 py-2 bg-slate-100 text-[#2d3435] rounded-xl font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <main className="max-w-md mx-auto min-h-screen bg-white relative pb-[100px]">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-rounded { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}} />

      {/* ━━━ Header ━━━ */}
      <div className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 transition-all duration-300 max-w-md mx-auto ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-gradient-to-b from-black/30 to-transparent'}`}>
        <button onClick={() => router.back()} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'bg-slate-100 text-[#2d3435]' : 'bg-black/20 backdrop-blur-sm text-white'}`}>
          <span className="material-symbols-rounded text-xl">arrow_back</span>
        </button>
        <div className={`text-sm font-bold truncate max-w-[180px] transition-opacity ${isScrolled ? 'opacity-100 text-[#2d3435]' : 'opacity-0'}`}>{space.title}</div>
        <div className="flex items-center gap-2">
          <button onClick={handleToggleLike}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'bg-slate-100' : 'bg-black/20 backdrop-blur-sm'} ${isLiked ? 'text-red-500' : isScrolled ? 'text-[#2d3435]' : 'text-white'}`}>
            <span className="material-symbols-rounded text-xl" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
          </button>
        </div>
      </div>

      {/* ━━━ Scrollable Content ━━━ */}
      <div className="flex-1 w-full overflow-y-auto no-scrollbar pb-[80px]">

        {/* 1) Image Carousel */}
        <div className="relative aspect-square w-full overflow-hidden bg-[#f2f4f4]">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#c4cacc]">
            <span className="material-symbols-rounded text-5xl mb-1">local_mall</span>
            <span className="text-[10px] font-bold tracking-wider uppercase">No Image</span>
          </div>
          {images.length > 0 && (
            <div className="relative h-full" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              <div className="flex h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${currentImg * 100}%)` }}>
                {images.map((img, i) => (
                  <div key={i} className="w-full flex-shrink-0 h-full">
                    <img src={img} alt={`${space.title} ${i + 1}`} className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                ))}
              </div>
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
        </div>

        {/* 2) Title & Stats */}
        <div className="px-4 pt-5 pb-4 flex justify-between items-start border-b border-[#f2f4f4]">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-[10px] font-black text-[#acb3b4] uppercase tracking-widest leading-none mb-1.5">{group?.name || 'FREESTYLE TANGO'}</p>
            <h1 className="text-xl font-black text-[#2d3435] leading-tight font-headline">{space.title}</h1>
          </div>
          <div className="flex items-center gap-3 text-[#acb3b4] shrink-0 mt-3.5">
            <span className="flex items-center gap-0.5 text-[11px]">
              <span className="material-symbols-rounded text-xs">visibility</span> {viewerCount}
            </span>
            <span className="flex items-center gap-0.5 text-[11px]">
              <span className="material-symbols-rounded text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span> {space.likesCount || 0}
            </span>
            <span className="flex items-center gap-0.5 text-[11px]">
              <span className="material-symbols-rounded text-xs">chat_bubble</span> 0
            </span>
          </div>
        </div>

        {/* 2) Scarcity Bar */}
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

        {/* 3) Rental Options Form (Matching Fit & Options) */}
        <div className="mx-4 my-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
          <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
            <span className="material-symbols-rounded text-sm text-primary">calendar_month</span>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Reservation Options</p>
          </div>
          <div className="px-4 py-4 space-y-4">
            <div>
              <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2">Desired Date <span className="text-red-400">*</span></p>
              <input required type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full bg-white border border-[#e0e4e5] rounded-xl px-4 py-3 text-xs font-bold text-[#2d3435] focus:border-primary focus:ring-1 outline-none transition-all" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2">Start Time <span className="text-red-400">*</span></p>
                <input required type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                  className="w-full bg-white border border-[#e0e4e5] rounded-xl px-4 py-3 text-xs font-bold text-[#2d3435] focus:border-primary focus:ring-1 outline-none transition-all" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2">End Time <span className="text-red-400">*</span></p>
                <input required type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                  className="w-full bg-white border border-[#e0e4e5] rounded-xl px-4 py-3 text-xs font-bold text-[#2d3435] focus:border-primary focus:ring-1 outline-none transition-all" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2">Number of People <span className="text-red-400">*</span></p>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setHeadcount(Math.max(1, (Number(headcount) || 1) - 1))}
                  className="w-9 h-9 rounded-full bg-[#f2f4f4] flex items-center justify-center text-[#596061] active:scale-90">
                  <span className="material-symbols-rounded text-lg">remove</span>
                </button>
                <span className="text-base font-black text-[#2d3435] min-w-[50px] text-center">{headcount || 1} PPL</span>
                <button type="button" onClick={() => setHeadcount((Number(headcount) || 1) + 1)}
                  className="w-9 h-9 rounded-full bg-[#f2f4f4] flex items-center justify-center text-[#596061] active:scale-90">
                  <span className="material-symbols-rounded text-lg">add</span>
                </button>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2">Purpose <span className="text-red-400">*</span></p>
              <input required type="text" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g., Dance practice"
                className="w-full bg-white border border-[#e0e4e5] rounded-xl px-4 py-3 text-xs font-bold text-[#2d3435] focus:border-primary focus:ring-1 outline-none transition-all" />
            </div>
            <div>
              <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2">Message</p>
              <textarea rows={2} value={message} onChange={e => setMessage(e.target.value)} placeholder="Message for the host"
                className="w-full bg-white border border-[#e0e4e5] rounded-xl px-4 py-3 text-xs font-bold text-[#2d3435] focus:border-primary focus:ring-1 outline-none transition-all resize-none" />
            </div>
          </div>
        </div>

        {/* 5) Price */}
        <div className="px-4 py-4 border-b border-[#f2f4f4]">
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-[#2d3435] font-headline">₩{minMaxPrice.min.toLocaleString()}</span>
            {minMaxPrice.min !== minMaxPrice.max && (
              <span className="text-sm text-[#acb3b4] mb-0.5">~ ₩{minMaxPrice.max.toLocaleString()}</span>
            )}
            <span className="text-sm font-bold text-[#acb3b4] mb-1">/ hr</span>
          </div>

          <div className="mt-3 flex items-center gap-2 p-2.5 bg-[#f0f4ff] border border-[#d8e2ff] rounded-xl">
            <span className="material-symbols-rounded text-primary text-sm">schedule</span>
            <span className="text-[11px] text-primary font-bold">Minimum {space.minHours} hours required</span>
          </div>

          {/* Payment method note */}
          <div className="mt-2 flex items-center gap-2 p-2.5 bg-[#f8f9fa] rounded-xl">
            <span className="material-symbols-rounded text-sm text-[#596061]">account_balance</span>
            <span className="text-[11px] text-[#596061] font-medium">Payment: Bank Transfer</span>
          </div>
        </div>

        {/* 6) Amenities & Info */}
        <div className="px-4 py-4 border-b border-[#f2f4f4]">
          <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-3">Amenities & Info</p>
          <div className="space-y-2.5">
            {/* Capacity */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#f0f4ff] flex items-center justify-center">
                <span className="material-symbols-rounded text-primary text-sm">group</span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#2d3435]">Capacity</p>
                <p className="text-[11px] text-[#596061]">Maximum {space.capacity || '?'} people allowed</p>
              </div>
            </div>
            {/* Size */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#f8f9fa] flex items-center justify-center border border-[#e0e4e5]">
                <span className="material-symbols-rounded text-[#596061] text-sm">straighten</span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#2d3435]">Space Size</p>
                <p className="text-[11px] text-[#596061]">{space.size || 'N/A'}</p>
              </div>
            </div>
            {/* Floor Material */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#edf7ed] flex items-center justify-center">
                <span className="material-symbols-rounded text-green-600 text-sm">layers</span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#2d3435]">Floor Material</p>
                <p className="text-[11px] text-[#596061]">{space.floorMaterial || 'Wood'}</p>
              </div>
            </div>
            {/* Mirror */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#fff3f0] flex items-center justify-center">
                <span className="material-symbols-rounded text-[#e67700] text-sm">wall_lamp</span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#2d3435]">Mirror</p>
                <p className="text-[11px] text-[#596061]">{space.hasMirror ? 'Equipped with mirrors' : 'No mirrors available'}</p>
              </div>
            </div>
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
              <div className="p-3.5 bg-[#fff3f0] rounded-xl flex gap-2">
                <span className="material-symbols-rounded text-[#e67700] text-sm mt-0.5">warning</span>
                <p className="text-[11px] text-[#e67700] font-medium leading-relaxed whitespace-pre-wrap">
                  {group?.rentalSettings?.rentalInfo || space.rules}
                </p>
              </div>
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
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 px-4 py-2.5 flex items-center gap-3 max-w-md mx-auto pb-safe pt-safe">
        <div className="flex-1 min-w-0">
          <p className="text-lg font-black text-[#2d3435] font-headline leading-tight">₩{minMaxPrice.min.toLocaleString()}</p>
          <p className="text-[10px] text-[#acb3b4] truncate">Starting price / hr</p>
        </div>
        <button onClick={handleToggleLike}
          className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-colors active:scale-90 ${isLiked ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-[#e0e4e5] text-[#596061]'}`}>
          <span className="material-symbols-rounded text-xl" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
        </button>
        <button onClick={handleRequestSubmit} disabled={isSubmitting}
          className="flex-shrink-0 bg-primary text-white px-7 py-3 rounded-xl font-black text-sm tracking-wide shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-50">
          {isSubmitting ? 'Processing...' : 'Request'}
        </button>
      </div>

    </main>
  );
}
