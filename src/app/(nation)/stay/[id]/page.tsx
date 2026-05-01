'use client';

import React, { useState, useEffect, useRef } from 'react';
import '@/styles/groupstayeditor.css';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { stayService } from '@/lib/firebase/stayService';
import { stayBookingService } from '@/lib/firebase/stayBookingService';
import { useAuth } from '@/components/providers/AuthProvider';
import { Stay, StayLike } from '@/types/stay';
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

export default function StayDetailPage() {
  const params = useParams();
  const stayId = params.id as string;
  const { user, setShowLogin } = useAuth();
  const [stay, setStay] = useState<Stay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  
  // Accordion states
  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [isGettingOpen, setIsGettingOpen] = useState(false);
  const [isFacilityOpen, setIsFacilityOpen] = useState(false);

  // Scroll state
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Like state
  const [likedStays, setLikedStays] = useState<Set<string>>(new Set());
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => setIsScrolled(el.scrollTop > 60);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, [isLoading]);

  useEffect(() => {
    if (user) {
      const unsub = stayService.subscribeMyLikes(user.uid, (likes) => {
        const ids = new Set(likes.map(l => l.stayId));
        setLikedStays(ids);
      });
      return () => unsub();
    } else {
      setLikedStays(new Set());
    }
  }, [user]);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      setShowLogin(true);
      return;
    }

    if (isLiking || !stay) return;

    setIsLiking(true);
    const isCurrentlyLiked = likedStays.has(stay.id);
    
    // Optimistic UI update
    const newLikedStays = new Set(likedStays);
    if (isCurrentlyLiked) {
      newLikedStays.delete(stay.id);
      setStay(prev => prev ? { ...prev, likesCount: Math.max(0, (prev.likesCount || 0) - 1) } : prev);
    } else {
      newLikedStays.add(stay.id);
      setStay(prev => prev ? { ...prev, likesCount: (prev.likesCount || 0) + 1 } : prev);
    }
    setLikedStays(newLikedStays);

    try {
      await stayService.toggleLike(user.uid, stay.id);
    } catch (err) {
      console.error('Failed to toggle like', err);
      // Revert optimistic update
      setLikedStays(likedStays); // old state
      setStay(prev => prev ? { ...prev, likesCount: isCurrentlyLiked ? (prev.likesCount || 0) + 1 : Math.max(0, (prev.likesCount || 0) - 1) } : prev);
    } finally {
      setIsLiking(false);
    }
  };

  // Calendar states
  const [currentMonth, setCurrentMonth] = useState(startOfDay(new Date()));
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [groupCoords, setGroupCoords] = useState<{latitude: number; longitude: number} | null>(null);
  const [venueNameKo, setVenueNameKo] = useState<string>('');

  // 2024-2025 Korean Holidays (YYYY-MM-DD)
  const KOREAN_HOLIDAYS = [
    '2024-01-01', '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12',
    '2024-03-01', '2024-04-10', '2024-05-05', '2024-05-06', '2024-05-15',
    '2024-06-06', '2024-08-15', '2024-09-16', '2024-09-17', '2024-09-18',
    '2024-10-03', '2024-10-09', '2024-12-25',
    '2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30', '2025-03-01',
    '2025-03-03', '2025-05-05', '2025-05-06', '2025-06-06', '2025-08-15',
    '2025-10-03', '2025-10-05', '2025-10-06', '2025-10-07', '2025-10-09',
    '2025-12-25'
  ];

  const isWeekendRate = (date: Date) => {
    const day = date.getDay();
    if (day === 5 || day === 6) return true; // Fri, Sat
    // Pre-holiday check
    const tomorrow = addDays(date, 1);
    return KOREAN_HOLIDAYS.includes(format(tomorrow, 'yyyy-MM-dd'));
  };

  // Booked dates from Firestore
  const [bookedDates, setBookedDates] = useState<Date[]>([]);

  const isDateBooked = (date: Date) => {
    return bookedDates.some(bDate => isSameDay(date, bDate));
  };

  const isRangeBlocked = (start: Date, end: Date) => {
    try {
      const range = eachDayOfInterval({ start, end });
      range.pop(); // Checkout day can overlap with checkin
      return range.some(d => isDateBooked(d));
    } catch {
      return true;
    }
  };

  const clearDates = () => {
    setStartDate(null);
    setEndDate(null);
  };

  useEffect(() => {
    if (!stayId) return;
    setIsLoading(true);
    const unsub = stayService.subscribeStay(stayId, (data) => {
      setStay(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, [stayId]);

  // Fetch real-time booking data for calendar
  useEffect(() => {
    if (!stayId) return;
    const unsub = stayBookingService.subscribeToStayBookings(stayId, (bookings) => {
      const dates: Date[] = [];
      bookings.forEach(b => {
        if (['APPLIED', 'PAYMENT_REQUESTED', 'PAID', 'CONFIRMED', 'CODE_SENT'].includes(b.status)) {
          let d = new Date(b.checkIn?.toDate?.() || b.checkIn);
          const end = new Date(b.checkOut?.toDate?.() || b.checkOut);
          // Block all dates from check-in to check-out (excluding check-out day for overlaps)
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
              if (venueData.coordinates) {
                setGroupCoords(venueData.coordinates);
              }
              if (venueData.nameKo || venueData.name) {
                setVenueNameKo(venueData.nameKo || venueData.name);
              }
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

  const prevImg = () => setCurrentImgIdx(i => Math.max(0, i - 1));
  const nextImg = () => setCurrentImgIdx(i => Math.min((stay?.images?.length || 1) - 1, i + 1));

  const formatRate = (val?: number) => {
    if (!val) return '0';
    return val.toLocaleString();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: stay?.title || 'Stay',
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard.');
    }
  };

  const getMapLink = (type: 'naver' | 'kakao' | 'google') => {
    const lat = groupCoords?.latitude;
    const lng = groupCoords?.longitude;
    const name = venueNameKo || stay?.nativeTitle || stay?.title || '';
    
    if (lat && lng) {
      if (type === 'kakao') return `https://map.kakao.com/link/map/${name},${lat},${lng}`;
      if (type === 'naver') return `https://map.naver.com/v5/search/${name}?c=${lng},${lat},15,0,0,0,dh`;
      if (type === 'google') return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }

    const address = stay?.location?.address || '';
    if (!address) return '#';
    const enc = encodeURIComponent(address);
    if (type === 'naver') return `https://map.naver.com/v5/search/${enc}`;
    if (type === 'kakao') return `https://map.kakao.com/link/search/${enc}`;
    if (type === 'google') return `https://www.google.com/maps/search/?api=1&query=${enc}`;
    return '#';
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = (day: Date) => {
    if (isBefore(day, startOfDay(new Date()))) return;
    if (isDateBooked(day)) return; // Blocked

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
    let formattedDate = '';

    while (day <= endDateView) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        
        const isPast = isBefore(day, startOfDay(new Date()));
        const isBooked = isDateBooked(day);
        const isSelectedStart = startDate && isSameDay(day, startDate);
        const isSelectedEnd = endDate && isSameDay(day, endDate);
        const isBetween = startDate && endDate && day > startDate && day < endDate;
        const isCurrentMonth = isSameMonth(day, monthStart);

        let cellClasses = "relative flex items-center justify-center h-12 w-full text-body-md transition-colors ";
        
        if (!isCurrentMonth) {
          cellClasses += "text-on-surface-variant/30 ";
        } else if (isPast || isBooked) {
          cellClasses += "text-on-surface-variant/30 cursor-not-allowed ";
          if (isBooked) cellClasses += "line-through ";
        } else {
          cellClasses += "cursor-pointer hover:bg-surface-container-high ";
        }

        let bgClasses = "";
        let textClasses = "";

        if (isSelectedStart || isSelectedEnd) {
          bgClasses = "bg-primary text-on-primary rounded-full z-10 shadow-md";
        } else if (isBetween) {
          bgClasses = "bg-primary/10 rounded-none";
          textClasses = "text-primary font-medium";
        } else if (isCurrentMonth && !isPast) {
          textClasses = "text-on-surface font-medium";
        }

        let spanClasses = `flex items-center justify-center w-10 h-10 ${bgClasses} ${textClasses}`;

        days.push(
          <div
            className={cellClasses}
            key={day.toString()}
            onClick={() => !isPast && !isBooked && onDateClick(cloneDay)}
          >
            {isBetween && (
              <div className="absolute inset-0 bg-primary/10" />
            )}
            {isSelectedStart && endDate && (
              <div className="absolute right-0 w-1/2 h-10 bg-primary/10" />
            )}
            {isSelectedEnd && startDate && (
              <div className="absolute left-0 w-1/2 h-10 bg-primary/10" />
            )}
            <span className={`relative z-10 ${spanClasses}`}>
              {formattedDate}
            </span>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-y-2" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return rows;
  };

  if (isLoading) {
    return (
      <div className="bg-surface font-sans text-on-surface min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="font-body-md text-on-surface-variant">Loading...</span>
        </div>
      </div>
    );
  }

  if (!stay) {
    return (
      <div className="bg-surface font-sans text-on-surface min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-on-surface-variant">
          <span className="material-symbols-rounded text-5xl opacity-30">bed</span>
          <p className="font-body-md">스테이를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const currency = stay.pricing?.currency || 'KRW';

  let nightCount = 0;
  let totalPrice = stay.pricing?.baseRate || 0;
  let hasValidRange = false;

  const baseRate = stay.pricing?.baseRate || 0;
  const weekendSurcharge = stay.pricing?.weekendSurcharge || 0;
  const extraPersonFee = stay.pricing?.extraPersonFee || 0;
  const cleaningFee = stay.pricing?.cleaningFee || 0;
  const baseGuests = stay.pricing?.baseGuests || 2;
  const maxGuests = stay.maxGuests || 4;

  if (startDate && endDate) {
    const daysInInterval = eachDayOfInterval({ start: startDate, end: endDate });
    daysInInterval.pop(); // remove checkout day
    
    nightCount = daysInInterval.length;
    if (nightCount > 0) {
      hasValidRange = true;
      totalPrice = baseRate * nightCount;
    }
  }

  let checkoutLink = `/stay/${stayId}/checkout`;
  if (startDate && endDate) {
    checkoutLink += `?start=${format(startDate, 'yyyy-MM-dd')}&end=${format(endDate, 'yyyy-MM-dd')}`;
  }

  const images = stay.images?.length ? stay.images : ['https://lh3.googleusercontent.com/aida-public/AB6AXuCMx9USYhY1wAK3tXsol1nLIi8LvHOZbRivv88TS6BbbJnUOXTnTgi8ABg6fG7IIMh8OAAHj44IK9TeDNzZ7UpH_MeMZCxZiTBZw1QE8dOcrY5iPbQ9g3Jn6Q437Yz1hu_Zpyn0W3RDsYcUykogZQUtPAjOYsZwQdUI_WNBWXd8Nl_iql6UYkCYFmHx3hJkNuaMED9Q9Ck6wqaUFtqqF699faCWMk7RGlVFuM485UX8HtbTZciYRN-81JBze6'];

  return (
    <div className="bg-white min-h-screen flex flex-col font-sans animate-in slide-in-from-bottom duration-300">
      <style dangerouslySetInnerHTML={{ __html: `
        .detail-scrollbar::-webkit-scrollbar { display: none; }
        .detail-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* ━━━ Header ━━━ */}
      <div className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-gradient-to-b from-black/30 to-transparent'}`}>
        <button onClick={() => window.history.back()} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'bg-slate-100 text-[#2d3435]' : 'bg-black/20 backdrop-blur-sm text-white'}`}>
          <span className="material-symbols-rounded text-xl">arrow_back</span>
        </button>
        <div className={`flex flex-col items-center flex-1 transition-opacity ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>
           <span className="text-sm font-bold text-[#2d3435] truncate max-w-[180px]">{stay.title}</span>
           {(stay.nativeTitle || venueNameKo) && (
              <span className="text-[11px] font-bold text-slate-500 truncate max-w-[180px]">{stay.nativeTitle || venueNameKo}</span>
           )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleToggleLike} 
            disabled={isLiking}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'bg-slate-100 text-[#2d3435]' : 'bg-black/20 backdrop-blur-sm text-white'}`}
          >
            <span className={`material-symbols-rounded text-xl transition-all ${likedStays.has(stayId) ? 'text-red-500 scale-110' : ''}`} style={likedStays.has(stayId) ? { fontVariationSettings: "'FILL' 1" } : undefined}>
              favorite
            </span>
          </button>
          <button onClick={handleShare} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'bg-slate-100 text-[#2d3435]' : 'bg-black/20 backdrop-blur-sm text-white'}`}>
            <span className="material-symbols-rounded text-xl">share</span>
          </button>
        </div>
      </div>

      {/* ━━━ Scrollable Content ━━━ */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto detail-scrollbar pb-[80px]">

        {/* 1) Image Carousel */}
        <div className="relative aspect-[4/3] overflow-hidden bg-[#f2f4f4]">
          {images.length > 0 && (
            <div className="relative h-full">
              <div className="flex h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${currentImgIdx * 100}%)` }}>
                {images.map((img, i) => (
                  <div key={i} className="w-full flex-shrink-0 h-full">
                    <img src={img} alt={`${stay.title} ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              {/* Location Overlay */}
              <div className="absolute top-16 left-4 bg-black/60 text-white px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1 z-10">
                <span className="material-symbols-rounded text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                <span className="text-xs font-bold">{stay.location?.district ? `${stay.location.district}, ${stay.location.city}` : stay.location?.city || stay.location?.address}</span>
              </div>
              
              {/* Left/Right Arrows */}
              {images.length > 1 && currentImgIdx > 0 && (
                <button onClick={prevImg} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 z-10">
                  <span className="material-symbols-rounded text-lg">chevron_left</span>
                </button>
              )}
              {images.length > 1 && currentImgIdx < images.length - 1 && (
                <button onClick={nextImg} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 z-10">
                  <span className="material-symbols-rounded text-lg">chevron_right</span>
                </button>
              )}
              {/* Counter + Dots */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center">
                  <div className="flex gap-1.5 items-center">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setCurrentImgIdx(i)}
                        className={`rounded-full transition-all ${i === currentImgIdx ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`} />
                    ))}
                  </div>
                  <span className="absolute right-4 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{currentImgIdx + 1}/{images.length}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2) Title & Stats */}
        <div className="px-4 pt-5 pb-4 flex justify-between items-start border-b border-[#f2f4f4]">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-[10px] font-black text-[#acb3b4] uppercase tracking-widest leading-none mb-1.5">STAY</p>
            <h1 className="text-xl font-black text-[#2d3435] leading-tight font-headline">{stay.title}</h1>
            {(stay.nativeTitle || venueNameKo) && (
              <p className="text-xs font-bold text-slate-500 mt-1">{stay.nativeTitle || venueNameKo}</p>
            )}
          </div>
          <div className="flex items-center gap-3 text-[#acb3b4] shrink-0 mt-3.5">
            <span className="flex items-center gap-0.5 text-[11px]">
              <span className="material-symbols-rounded text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> {stay.host?.rating || 'New'}
            </span>
          </div>
        </div>

        {/* 3) Select Dates (Fit & Options style) */}
        <div className="mx-4 my-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
          <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
            <span className="material-symbols-rounded text-sm text-primary">calendar_month</span>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Select Dates</p>
          </div>
          <div className="px-4 py-4">
            <div className="flex justify-between items-center mb-6">
              <button onClick={prevMonth} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#f2f4f4] text-[#596061] active:scale-90 transition-transform">
                <span className="material-symbols-rounded text-lg">chevron_left</span>
              </button>
              <h3 className="font-bold text-[#2d3435] text-[15px]">{format(currentMonth, 'MMMM yyyy')}</h3>
              <button onClick={nextMonth} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#f2f4f4] text-[#596061] active:scale-90 transition-transform">
                <span className="material-symbols-rounded text-lg">chevron_right</span>
              </button>
            </div>
            <div className="grid grid-cols-7 mb-4">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-[11px] font-black text-[#acb3b4] uppercase">
                  {day}
                </div>
              ))}
            </div>
            <div className="space-y-1">
              {renderCells()}
            </div>
            {hasValidRange && (
              <div className="mt-4 pt-4 border-t border-[#f2f4f4] flex justify-between items-center animate-in fade-in">
                <div className="text-[#596061] font-bold text-sm">
                  {format(startDate!, 'MMM d')} - {format(endDate!, 'MMM d')}
                </div>
                <div className="font-black text-[#2d3435] text-sm">
                  {nightCount} Nights
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4) Pricing Details */}
        <div className="px-4 py-4 border-b border-[#f2f4f4]">
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-[#2d3435] font-headline">{formatRate(stay.pricing?.baseRate)}</span>
            <span className="text-sm text-[#acb3b4] font-bold mb-0.5">{currency} / night</span>
          </div>

          <div className="mt-4 space-y-2.5">
            {/* Weekend Surcharge */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#f0f4ff] flex items-center justify-center">
                <span className="material-symbols-rounded text-primary text-sm">calendar_month</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-[#2d3435]">Weekend Surcharge</p>
                <p className="text-[11px] text-[#596061]">Applied on Fridays & Saturdays</p>
              </div>
              <span className="text-xs font-bold text-primary">+{formatRate(stay.pricing?.weekendSurcharge)}</span>
            </div>

            {/* Extra Person */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#f0f4ff] flex items-center justify-center">
                <span className="material-symbols-rounded text-primary text-sm">person</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-[#2d3435]">Extra Person Fee</p>
                <p className="text-[11px] text-[#596061]">Per additional guest (Base: {baseGuests})</p>
              </div>
              <span className="text-xs font-bold text-primary">+{formatRate(stay.pricing?.extraPersonFee)}</span>
            </div>

            {/* Cleaning Fee */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#edf7ed] flex items-center justify-center">
                <span className="material-symbols-rounded text-green-600 text-sm">auto_awesome</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-[#2d3435]">Cleaning Fee</p>
                <p className="text-[11px] text-[#596061]">One-time fee per stay</p>
              </div>
              <span className="text-xs font-bold text-green-600">+{formatRate(stay.pricing?.cleaningFee)}</span>
            </div>
          </div>
        </div>

        {/* 5) Location Guide */}
        <div className="px-4 py-4 border-b border-[#f2f4f4]">
          <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-3">Location Guide</p>
          <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-[#e0e4e5]">
            <div className="aspect-video w-full bg-slate-100 relative">
              <iframe
                src={groupCoords 
                  ? `https://maps.google.com/maps?q=${groupCoords.latitude},${groupCoords.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                  : `https://maps.google.com/maps?q=${encodeURIComponent(stay.location?.address || stay.location?.city || '')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-4 mb-4">
                <p className="text-xs font-bold text-[#2d3435] flex-1 leading-relaxed">{stay.location?.address}</p>
                <button 
                  onClick={() => {
                    if (stay.location?.address) {
                      navigator.clipboard.writeText(stay.location.address);
                      alert('Address copied to clipboard.');
                    }
                  }}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#f2f4f4] rounded-full text-[#596061] hover:text-[#2d3435] transition-colors active:scale-95"
                >
                  <span className="material-symbols-rounded text-[18px]">content_copy</span>
                </button>
              </div>
              <div className="flex gap-2">
                <a href={getMapLink('naver')} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 rounded-xl border border-[#e0e4e5] text-center text-[11px] font-bold text-[#596061] hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all">Naver</a>
                <a href={getMapLink('kakao')} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 rounded-xl border border-[#e0e4e5] text-center text-[11px] font-bold text-[#596061] hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200 transition-all">Kakao</a>
                <a href={getMapLink('google')} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 rounded-xl border border-[#e0e4e5] text-center text-[11px] font-bold text-[#596061] hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all">Google</a>
              </div>
            </div>
          </div>
        </div>

        {/* 6) Details Accordions */}
        <div className="px-4 py-4 border-b border-[#f2f4f4]">
          <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-3">Stay Details</p>
          <div className="space-y-2">
            <div className="bg-[#f8f9fa] rounded-2xl overflow-hidden transition-all duration-300">
              <button onClick={() => setIsRoomOpen(!isRoomOpen)} className="w-full p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-primary text-sm">meeting_room</span>
                  <p className="text-xs font-bold text-[#2d3435]">Room Features</p>
                </div>
                <span className="material-symbols-rounded text-[#acb3b4] text-sm transition-transform duration-300" style={{ transform: isRoomOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
              </button>
              {isRoomOpen && (
                <div className="px-4 pb-4 pt-1 animate-in fade-in duration-300">
                  <p className="text-[#596061] text-[11px] leading-relaxed whitespace-pre-wrap">{stay.guides?.roomFeatures || 'No information available.'}</p>
                </div>
              )}
            </div>
            <div className="bg-[#f8f9fa] rounded-2xl overflow-hidden transition-all duration-300">
              <button onClick={() => setIsGettingOpen(!isGettingOpen)} className="w-full p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-primary text-sm">directions_subway</span>
                  <p className="text-xs font-bold text-[#2d3435]">Getting Here</p>
                </div>
                <span className="material-symbols-rounded text-[#acb3b4] text-sm transition-transform duration-300" style={{ transform: isGettingOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
              </button>
              {isGettingOpen && (
                <div className="px-4 pb-4 pt-1 animate-in fade-in duration-300">
                  <p className="text-[#596061] text-[11px] leading-relaxed whitespace-pre-wrap">{stay.guides?.gettingHere || 'No information available.'}</p>
                </div>
              )}
            </div>
            <div className="bg-[#f8f9fa] rounded-2xl overflow-hidden transition-all duration-300">
              <button onClick={() => setIsFacilityOpen(!isFacilityOpen)} className="w-full p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-primary text-sm">concierge</span>
                  <p className="text-xs font-bold text-[#2d3435]">Facility Guide</p>
                </div>
                <span className="material-symbols-rounded text-[#acb3b4] text-sm transition-transform duration-300" style={{ transform: isFacilityOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
              </button>
              {isFacilityOpen && (
                <div className="px-4 pb-4 pt-1 animate-in fade-in duration-300">
                  <p className="text-[#596061] text-[11px] leading-relaxed whitespace-pre-wrap">{stay.guides?.facilityGuide || 'No information available.'}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 7) Meet Your Host */}
        <div className="px-4 py-4">
          <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-3">Meet Your Host</p>
          <div className="bg-[#f8f9fa] rounded-3xl p-5 border border-[#e0e4e5]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-white border border-[#e0e4e5] flex-shrink-0">
                {stay.host?.photo ? (
                  <img alt={stay.host?.name || 'Host'} className="w-full h-full object-cover" src={stay.host.photo} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-rounded text-[#acb3b4] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2d3435]">{stay.host?.name || 'Host'}</h3>
                <div className="flex items-center gap-1 text-[#acb3b4] flex-wrap mt-0.5">
                  {stay.host?.rating ? (
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-rounded text-[#e67700] text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-[11px] font-bold text-[#596061]">{stay.host.rating}</span>
                      {stay.host?.reviewCount && (
                        <span className="text-[10px] opacity-70">({stay.host.reviewCount} reviews)</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold">New Host</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {(stay.host?.bio || stay.headline) && (
              <p className="text-[#596061] text-xs leading-relaxed mb-4 whitespace-pre-wrap">
                {stay.host?.bio || stay.headline}
              </p>
            )}

            {stay.host?.contacts && Object.keys(stay.host.contacts).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-4 border-t border-[#e0e4e5]">
                {stay.host.contacts.phone && (
                  <a href={`tel:${stay.host.contacts.phone}`} className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#e0e4e5] rounded-lg text-[10px] font-bold text-[#596061] hover:border-[#acb3b4] transition-colors">
                    <span className="material-symbols-rounded text-[14px]">call</span>
                    Call
                  </a>
                )}
                {stay.host.contacts.whatsapp && (
                  <a href={`https://wa.me/${stay.host.contacts.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#e0e4e5] rounded-lg text-[10px] font-bold text-[#596061] hover:border-[#acb3b4] transition-colors">
                    <span className="material-symbols-rounded text-[14px]">forum</span>
                    WhatsApp
                  </a>
                )}
                {stay.host.contacts.instagram && (
                  <a href={`https://instagram.com/${stay.host.contacts.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#e0e4e5] rounded-lg text-[10px] font-bold text-[#596061] hover:border-[#acb3b4] transition-colors">
                    <span className="material-symbols-rounded text-[14px]">photo_camera</span>
                    Instagram
                  </a>
                )}
                {stay.host.contacts.facebook && (
                  <a href={stay.host.contacts.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#e0e4e5] rounded-lg text-[10px] font-bold text-[#596061] hover:border-[#acb3b4] transition-colors">
                    <span className="material-symbols-rounded text-[14px]">public</span>
                    Facebook
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ━━━ Fixed Bottom Bar (compact) ━━━ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 px-4 py-2.5 pb-safe flex items-center gap-3 mx-auto h-[68px]">
        {!startDate ? (
          // Initial State
          <div className="flex-1">
            <p className="text-sm font-bold text-[#2d3435]">Select check-in date</p>
          </div>
        ) : !endDate ? (
          // StartDate State
          <div className="flex-1 flex justify-between items-center pr-2">
            <div>
              <p className="text-sm font-bold text-[#2d3435]">Select checkout</p>
              <p className="text-[10px] font-bold text-[#acb3b4] mt-0.5">{format(startDate, 'MMM d')} ~</p>
            </div>
            <button onClick={clearDates} className="text-[#596061] text-xs font-bold active:scale-95">Cancel</button>
          </div>
        ) : (
          // EndDate State
          <>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-black text-[#2d3435] font-headline leading-tight">₩{formatRate(totalPrice)}</p>
              <p className="text-[10px] text-[#acb3b4] truncate">
                {nightCount} nights · {format(endDate, 'd MMM')} out
              </p>
            </div>
            <button onClick={clearDates}
              className="w-11 h-11 rounded-xl flex items-center justify-center border bg-white border-[#e0e4e5] text-[#596061] transition-colors active:scale-90">
              <span className="material-symbols-rounded text-xl">close</span>
            </button>
            <Link href={checkoutLink} className="flex-shrink-0">
              <button className="bg-primary text-white px-6 py-3 rounded-xl font-black text-sm tracking-wide shadow-lg shadow-primary/20 active:scale-95 transition-transform">
                Book Now
              </button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
