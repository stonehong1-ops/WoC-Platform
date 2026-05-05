'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { stayService } from '@/lib/firebase/stayService';
import { stayBookingService } from '@/lib/firebase/stayBookingService';
import { chatService } from '@/lib/firebase/chatService';
import { useAuth } from '@/components/providers/AuthProvider';
import { Stay } from '@/types/stay';
import SectionCard from '@/components/ui/SectionCard';
import InfoRow from '@/components/ui/InfoRow';
import CollapseSection from '@/components/ui/CollapseSection';
import ChatRoom from '@/components/chat/ChatRoom';
import Link from 'next/link';
import { useModalNavigation } from '@/hooks/useModalNavigation';

import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isBefore,
  startOfDay,
  eachDayOfInterval
} from 'date-fns';

interface StayDetailProps {
  stayId: string;
  onClose: () => void;
  isLiked: boolean;
  onToggleLike: (e: React.MouseEvent) => void;
}

export default function StayDetail({ stayId, onClose, isLiked, onToggleLike }: StayDetailProps) {
  const { user, setShowLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [stay, setStay] = useState<Stay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  
  // URL-bound navigation
  const { value: modal, openModal, closeModal } = useModalNavigation('modal');
  const { value: chatId, openModal: openChat, closeModal: closeChat } = useModalNavigation('chatId');

  // Calendar states
  const [currentMonth, setCurrentMonth] = useState(startOfDay(new Date()));
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [groupCoords, setGroupCoords] = useState<{latitude: number; longitude: number} | null>(null);
  const [venueNameKo, setVenueNameKo] = useState<string>('');



  useEffect(() => {
    if (!stayId) return;
    setIsLoading(true);
    const unsub = stayService.subscribeStay(stayId, (data) => {
      setStay(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, [stayId]);

  useEffect(() => {
    if (!stayId) return;
    const unsub = stayBookingService.subscribeToStayBookings(stayId, (bookings) => {
      const dates: Date[] = [];
      bookings.forEach(b => {
        if (['APPLIED', 'PAYMENT_REQUESTED', 'PAID', 'CONFIRMED', 'CODE_SENT'].includes(b.status)) {
          let d = new Date(b.checkIn?.toDate?.() || b.checkIn);
          const end = new Date(b.checkOut?.toDate?.() || b.checkOut);
          while (d < end) {
            dates.push(new Date(d));
            d.setDate(d.getDate() + 1);
          }
        }
      });
      setBookedDates(dates);
    });
    return () => unsub();
  }, [stayId]);

  useEffect(() => {
    if (!stay?.groupId) return;
    const fetchVenueData = async () => {
      try {
        const { db } = await import('@/lib/firebase/config');
        const { doc, getDoc } = await import('firebase/firestore');
        const groupRef = doc(db, 'groups', stay.groupId);
        const groupSnap = await getDoc(groupRef);
        
        if (groupSnap.exists()) {
          const groupData = groupSnap.data();
          if (groupData.venueId) {
            const venueRef = doc(db, 'venues', groupData.venueId);
            const venueSnap = await getDoc(venueRef);
            if (venueSnap.exists()) {
              const venueData = venueSnap.data();
              if (venueData.coordinates) setGroupCoords(venueData.coordinates);
              if (venueData.nameKo || venueData.name) setVenueNameKo(venueData.nameKo || venueData.name);
            }
          } else if (groupData.coordinates) {
             setGroupCoords(groupData.coordinates);
             setVenueNameKo(groupData.nativeName || groupData.name || '');
          }
        }
      } catch (err) {
        console.error('Failed to fetch venue data', err);
      }
    };
    fetchVenueData();
  }, [stay?.groupId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => setIsScrolled(el.scrollTop > 60);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: stay?.title || 'Stay',
          url: window.location.href,
        });
      } catch (err) { console.error('Share failed:', err); }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard.');
    }
  };

  const handleChatWithHost = async () => {
    if (!user) { setShowLogin(true); return; }
    if (!stay?.host?.userId) { alert('Host information is missing.'); return; }
    if (user.uid === stay.host.userId) { alert('You cannot chat with yourself.'); return; }

    if (!confirm("Would you like to start a chat with the host?")) return;

    try {
      setIsChatLoading(true);
      
      // 1. Mark as pending in wishlist
      await stayService.setStayPendingStatus(user.uid, stay.id);

      // 2. Get or create Business room
      const roomId = await chatService.getOrCreatePrivateRoom([user.uid, stay.host.userId], user.uid, 'business');

      // 3. Send initial stay info message (Standardized template)
      const initialMessage = `Hello, I'm inquiring about the stay '${stay.title}'.\nLocation: ${stay.location?.district ? `${stay.location.district}, ${stay.location.city}` : stay.location?.city || ''}\nPrice: ₩${(stay.pricing?.baseRate || 0).toLocaleString()}/night\nLink: ${window.location.origin}/stay?itemId=${stay.id}`;

      await chatService.sendMessage({
        roomId,
        senderId: user.uid,
        senderName: user.displayName || 'User',
        senderPhoto: user.photoURL || undefined,
        text: initialMessage,
        type: 'text'
      });
      
      // 4. Open full popup chat
      openChat(roomId);
    } catch (err) {
      console.error('Failed to init chat', err);
      alert('Failed to start chat. Please try again later.');
    } finally {
      setIsChatLoading(false);
    }
  };

  const isDateBooked = (date: Date) => bookedDates.some(bDate => isSameDay(date, bDate));
  const isRangeBlocked = (start: Date, end: Date) => {
    try {
      const range = eachDayOfInterval({ start, end });
      range.pop();
      return range.some(d => isDateBooked(d));
    } catch { return true; }
  };

  const onDateClick = (day: Date) => {
    if (isBefore(day, startOfDay(new Date()))) return;
    if (isDateBooked(day)) return;

    if (!startDate || (startDate && endDate)) {
      setStartDate(day);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (isBefore(day, startDate)) {
        setStartDate(day);
      } else if (isSameDay(day, startDate)) {
        setStartDate(null);
      } else {
        if (isRangeBlocked(startDate, day)) {
          alert('Your selected dates include unavailable dates.');
          return;
        }
        setEndDate(day);
      }
    }
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDateView = startOfWeek(monthStart);
    const endDateView = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDateView;

    while (day <= endDateView) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'd');
        const cloneDay = day;
        const isPast = isBefore(day, startOfDay(new Date()));
        const isBooked = isDateBooked(day);
        const isSelectedStart = startDate && isSameDay(day, startDate);
        const isSelectedEnd = endDate && isSameDay(day, endDate);
        const isBetween = startDate && endDate && day > startDate && day < endDate;
        const isCurrentMonth = isSameMonth(day, monthStart);

        let cellClasses = "relative flex items-center justify-center h-12 w-full text-body-md transition-colors ";
        if (!isCurrentMonth) cellClasses += "text-on-surface-variant/30 ";
        else if (isPast || isBooked) {
          cellClasses += "text-on-surface-variant/30 cursor-not-allowed ";
          if (isBooked) cellClasses += "line-through ";
        } else cellClasses += "cursor-pointer hover:bg-surface-container-high ";

        let bgClasses = "";
        let textClasses = "";
        if (isSelectedStart || isSelectedEnd) bgClasses = "bg-primary text-on-primary rounded-full z-10 shadow-md";
        else if (isBetween) {
          bgClasses = "bg-primary/10 rounded-none";
          textClasses = "text-primary font-medium";
        } else if (isCurrentMonth && !isPast) textClasses = "text-on-surface font-medium";

        days.push(
          <div className={cellClasses} key={day.toString()} onClick={() => !isPast && !isBooked && onDateClick(cloneDay)}>
            {isBetween && <div className="absolute inset-0 bg-primary/10" />}
            {isSelectedStart && endDate && <div className="absolute right-0 w-1/2 h-10 bg-primary/10" />}
            {isSelectedEnd && startDate && <div className="absolute left-0 w-1/2 h-10 bg-primary/10" />}
            <span className={`relative z-10 flex items-center justify-center w-10 h-10 ${bgClasses} ${textClasses}`}>
              {formattedDate}
            </span>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7 gap-y-2" key={day.toString()}>{days}</div>);
      days = [];
    }
    return rows;
  };

  if (isLoading) return <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!stay) return null;

  const images = stay.images?.length ? stay.images : [];
  const baseRate = stay.pricing?.baseRate || 0;
  const currency = stay.pricing?.currency || 'KRW';

  let checkoutLink = `/stay/${stayId}/checkout`;
  if (startDate && endDate) checkoutLink += `?start=${format(startDate, 'yyyy-MM-dd')}&end=${format(endDate, 'yyyy-MM-dd')}`;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <style dangerouslySetInnerHTML={{ __html: `
        .detail-scrollbar::-webkit-scrollbar { display: none; }
        .detail-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-rounded { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}} />

      {/* Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-gradient-to-b from-black/30 to-transparent'}`}>
        <button onClick={onClose} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'bg-slate-100 text-[#2d3435]' : 'bg-black/20 backdrop-blur-sm text-white'}`}>
          <span className="material-symbols-rounded text-xl">arrow_back</span>
        </button>
        <div className={`text-base font-bold truncate max-w-[180px] transition-opacity ${isScrolled ? 'opacity-100 text-[#2d3435]' : 'opacity-0'}`}>{stay.title}</div>
        <div className="flex items-center gap-2">
          <button onClick={handleShare} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'bg-slate-100 text-[#2d3435]' : 'bg-black/20 backdrop-blur-sm text-white'}`}>
            <span className="material-symbols-rounded text-xl">share</span>
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto detail-scrollbar pb-[80px]">
        {/* Images */}
        <div className="relative aspect-square bg-surface-container">
          {/* Fallback */}
          {!images.length && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-on-surface-variant/30">
              <span className="material-symbols-rounded text-5xl mb-1">home</span>
              <span className="text-[10px] font-bold tracking-wider uppercase">No Image</span>
            </div>
          )}
          
          <div className="flex h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${currentImgIdx * 100}%)` }}>
            {images.map((img, i) => (
              <img key={i} src={img} className="w-full h-full object-cover flex-shrink-0" onClick={() => openModal('images')} />
            ))}
          </div>

          <div className="absolute bottom-4 left-4 flex flex-col items-start z-10">
            {images.length > 1 && (
              <>
                <span className="bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">{currentImgIdx + 1}/{images.length}</span>
                <div className="flex gap-1.5 items-center pl-1">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setCurrentImgIdx(i)} className={`rounded-full transition-all ${i === currentImgIdx ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`} />
                  ))}
                </div>
              </>
            )}
          </div>
          <button onClick={onToggleLike} className="absolute bottom-4 right-4 px-3 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center gap-1.5 text-white transition-transform active:scale-95">
            <span className="material-symbols-rounded text-[18px]" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0", color: isLiked ? '#ef4444' : 'white' }}>favorite</span>
            <span className="text-[11px] font-bold">{stay.likesCount || 0}</span>
          </button>
        </div>

        {/* Content Header */}
        <div className="px-4 pt-5 pb-4 border-b border-surface-variant/10">
          <p className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest leading-none mb-1.5">STAY</p>
          <h1 className="text-xl font-black text-on-surface leading-tight font-headline">{stay.title}</h1>
        </div>

        {/* Scarcity Bar — Drive Urgency (Shop Standard) */}
        <div className="flex items-center gap-4 px-4 py-3 bg-[#fff8f0] border-b border-[#ffe8cc]">
          <div className="flex items-center gap-1 text-[#e67700]">
            <span className="material-symbols-rounded text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            <span className="text-xs font-bold">{Math.floor(Math.random() * 15) + 3} people looking at this now</span>
          </div>
          <div className="flex items-center gap-1 text-[#596061]">
            <span className="material-symbols-rounded text-sm">event_available</span>
            <span className="text-xs font-medium">Available now</span>
          </div>
        </div>

        {/* Calendar */}
        <div className="mx-4 my-4">
          <SectionCard icon="calendar_month" title="Select Dates">
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#f2f4f4] text-[#596061]">
                <span className="material-symbols-rounded text-lg">chevron_left</span>
              </button>
              <h3 className="font-bold text-[#2d3435] text-[15px]">{format(currentMonth, 'MMMM yyyy')}</h3>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#f2f4f4] text-[#596061]">
                <span className="material-symbols-rounded text-lg">chevron_right</span>
              </button>
            </div>
            <div className="grid grid-cols-7 mb-4">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-[11px] font-black text-[#acb3b4] uppercase">{day}</div>
              ))}
            </div>
            <div className="space-y-1">{renderCells()}</div>
          </SectionCard>
        </div>

        {/* Pricing */}
        <div className="mx-4 my-4">
          <SectionCard icon="payments" title="Pricing Details">
            <div className="flex items-end gap-2 mb-4 px-1">
              <span className="text-2xl font-black text-[#2d3435] font-headline">{baseRate.toLocaleString()}</span>
              <span className="text-sm text-[#596061] font-bold mb-0.5">{currency} / night</span>
            </div>
            <div className="space-y-4">
              <InfoRow icon="calendar_month" iconColor="text-primary" title="Weekend Surcharge" subtitle="Applied on Fridays & Saturdays" right={<span className="text-xs font-bold text-primary">+{stay.pricing?.weekendSurcharge?.toLocaleString()}</span>} />
              <InfoRow icon="person" iconColor="text-primary" title="Extra Person Fee" subtitle={`Per additional guest (Base: ${stay.pricing?.baseGuests || 2})`} right={<span className="text-xs font-bold text-primary">+{stay.pricing?.extraPersonFee?.toLocaleString()}</span>} />
              <InfoRow icon="auto_awesome" iconBg="bg-green-50" iconColor="text-green-600" title="Cleaning Fee" subtitle="One-time fee per stay" right={<span className="text-xs font-bold text-green-600">+{stay.pricing?.cleaningFee?.toLocaleString()}</span>} />
            </div>
          </SectionCard>
        </div>

        {/* Details */}
        <div className="mx-4 my-4">
          <SectionCard icon="home_work" title="Stay Information">
            <div className="space-y-4">
              <CollapseSection icon="meeting_room" title="Room Features" defaultOpen={false}>
                <p className="whitespace-pre-wrap leading-relaxed text-sm text-[#596061]">{stay.guides?.roomFeatures || 'No information available.'}</p>
              </CollapseSection>
              <CollapseSection icon="directions_subway" title="Getting Here">
                <p className="whitespace-pre-wrap leading-relaxed text-sm text-[#596061]">{stay.guides?.gettingHere || 'No information available.'}</p>
              </CollapseSection>
              <CollapseSection icon="concierge" title="Facility Guide">
                <p className="whitespace-pre-wrap leading-relaxed text-sm text-[#596061]">{stay.guides?.facilityGuide || 'No information available.'}</p>
              </CollapseSection>
            </div>
          </SectionCard>
        </div>

        {/* Host */}
        <div className="mx-4 my-4">
          <SectionCard icon="person" title="Meet Your Host">
            <div className="flex items-center gap-4 mb-4 px-1">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-white border border-[#f2f4f4] shadow-sm">
                {stay.host?.photo ? (
                  <img src={stay.host.photo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                    <span className="material-symbols-rounded">person</span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2d3435]">{stay.host?.name || 'Host'}</h3>
                <p className="text-[10px] text-[#acb3b4] font-black uppercase tracking-widest mt-0.5">Verified Host</p>
              </div>
            </div>
            <button
              onClick={handleChatWithHost}
              disabled={isChatLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#f2f4f4] hover:bg-[#e8eaec] rounded-2xl transition-colors active:scale-[0.98]"
            >
              {isChatLoading ? (
                <div className="w-5 h-5 border-2 border-[#596061] border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-rounded text-lg text-[#596061]">chat</span>
              )}
              <span className="text-sm font-bold text-[#2d3435]">{isChatLoading ? 'Starting Chat...' : 'Chat with Host'}</span>
            </button>
            <p className="text-[10px] text-[#acb3b4] text-center mt-2.5 font-medium">{stay.host?.name || 'Host'} · Stay info will be sent automatically</p>
          </SectionCard>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 px-4 py-2.5 flex items-center gap-3 max-w-md mx-auto">
        <div className="flex-1 min-w-0">
          <p className="text-lg font-black text-[#2d3435] font-headline leading-tight">₩{baseRate.toLocaleString()}</p>
          <p className="text-[10px] text-[#acb3b4]">Starting price / night</p>
        </div>
        <button onClick={onToggleLike} className={`w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center border transition-all active:scale-90 ${isLiked ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-[#e0e4e5] text-[#596061]'}`}>
          <span className="material-symbols-rounded text-xl" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
        </button>
        <Link href={checkoutLink} className="flex-shrink-0 bg-primary text-white px-7 py-3 rounded-xl font-black text-sm tracking-wide shadow-lg shadow-primary/20 active:scale-95 transition-transform">
          Checkout
        </Link>
      </div>

      {/* Chat Room */}
      {chatId && (
        <div className="fixed inset-0 z-[200] bg-white animate-in slide-in-from-bottom duration-300">
          <ChatRoom roomId={chatId} onBack={closeChat} />
        </div>
      )}

      {/* Image Viewer */}
      {modal === 'images' && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-in fade-in duration-200">
          <div className="absolute top-0 right-0 p-4 z-10">
            <button onClick={closeModal} className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center">
              <span className="material-symbols-rounded">close</span>
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <img src={images[currentImgIdx]} className="max-w-full max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
