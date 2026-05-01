'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import '@/styles/groupstayeditor.css';
import { stayService } from '@/lib/firebase/stayService';
import { Stay, StayLike } from '@/types/stay';
import { useAuth } from '@/components/providers/AuthProvider';
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

export default function InterceptedStayPage() {
  const router = useRouter();
  const params = useParams();
  const stayId = params.id as string;
  const [stay, setStay] = useState<Stay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  
  // Accordion states
  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [isGettingOpen, setIsGettingOpen] = useState(false);
  const [isFacilityOpen, setIsFacilityOpen] = useState(false);

  const { user, setShowLogin } = useAuth();
  
  // Like state
  const [likedStays, setLikedStays] = useState<Set<string>>(new Set());
  const [isLiking, setIsLiking] = useState(false);

  // Calendar states
  const [currentMonth, setCurrentMonth] = useState(startOfDay(new Date()));
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

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

  // Mock booked dates (To be fetched from Firestore in future)
  const bookedDates: Date[] = []; 

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

  const onDismiss = useCallback(() => {
    router.back();
  }, [router]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    },
    [onDismiss]
  );

  const [groupCoords, setGroupCoords] = useState<{latitude: number; longitude: number} | null>(null);
  const [venueNameKo, setVenueNameKo] = useState<string>('');

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

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
      <div className="fixed inset-0 z-[100] bg-white overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-surface font-sans text-on-surface flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="font-body-md text-on-surface-variant">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!stay) {
    return (
      <div className="fixed inset-0 z-[100] bg-white overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-surface font-sans text-on-surface flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl opacity-30">bed</span>
            <p className="font-body-md">스테이를 찾을 수 없습니다.</p>
          </div>
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

  const images = stay.images?.length ? stay.images : ['https://lh3.googleusercontent.com/aida-public/AB6AXuCMx9USYhY1wAK3tXsol1nLIi8LvHOZbRivv88TS6BbbJnUOXTnTgi8ABg6fG7IIMh8OAAHj44IK9TeDNzZ7UpH_MeMZCxZiTBZw1QE8dOcrY5iPbQ9g3Jn6Q437Yz1hu_Zpyn0W3RDsYcUykogZQUtPAjOYsZwQdUI_WNBWXd8Nl_iql6UYkCYFmHx3hJkNuaMED9Q9Ck6wqaUFtqqF699faCWMk7RGlVFuM485UX8HtbTZciYRN-81JBze6CG9uCp8_d-O4sk900'];

  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      
      <style jsx global>{`
        /* Verbatim Styles from original HTML */
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Design System Token Overrides */
        :root {
          --primary: #0057bd;
          --on-primary: #ffffff;
          --primary-container: #d8e2ff;
          --on-primary-container: #001a42;
          --secondary: #3d56ba;
          --on-secondary: #ffffff;
          --secondary-container: #dde1ff;
          --on-secondary-container: #001355;
          --surface: #f9f9ff;
          --on-surface: #191b22;
          --surface-variant: #e1e2eb;
          --on-surface-variant: #424753;
          --outline: #727784;
          --outline-variant: #c2c6d5;
          --surface-container-lowest: #ffffff;
          --surface-container-low: #f2f3fc;
          --surface-container: #ededf6;
          --surface-container-high: #e7e7f1;
          --surface-container-highest: #e1e2eb;
          --error: #ba1a1a;
          
          /* Spacing */
          --container-max: 56rem;
          --page-margin: 1.5rem;
          --section-gap: 2.5rem;
        }

        .bg-surface { background-color: var(--surface) !important; }
        .text-on-surface { color: var(--on-surface) !important; }
        .bg-surface-container-lowest { background-color: var(--surface-container-lowest) !important; }
        .max-w-container-max { max-width: var(--container-max) !important; }
        .space-y-section-gap > :not([hidden]) ~ :not([hidden]) { margin-top: var(--section-gap) !important; }
        .px-page-margin { padding-left: var(--page-margin) !important; padding-right: var(--page-margin) !important; }
        .text-on-surface-variant { color: var(--on-surface-variant) !important; }
        .text-primary { color: var(--primary) !important; }
        .bg-primary { background-color: var(--primary) !important; }
        .text-on-primary { color: var(--on-primary) !important; }
        .bg-primary-container { background-color: var(--primary-container) !important; }
        .bg-surface-container-low { background-color: var(--surface-container-low) !important; }
        .bg-surface-container { background-color: var(--surface-container) !important; }
        .bg-surface-container-high { background-color: var(--surface-container-high) !important; }
        .bg-surface-container-highest { background-color: var(--surface-container-highest) !important; }
        .text-error { color: var(--error) !important; }
        .bg-error\\/5 { background-color: rgba(186, 26, 26, 0.05) !important; }
        .bg-error\\/10 { background-color: rgba(186, 26, 26, 0.1) !important; }
        .border-error\\/20 { border-color: rgba(186, 26, 26, 0.2) !important; }
        .border-outline-variant\\/20 { border-color: rgba(194, 198, 213, 0.2) !important; }
        .border-outline-variant\\/30 { border-color: rgba(194, 198, 213, 0.3) !important; }
        .border-outline-variant\\/10 { border-color: rgba(194, 198, 213, 0.1) !important; }
        .bg-primary\\/5 { background-color: rgba(0, 87, 189, 0.05) !important; }
        .border-primary\\/10 { border-color: rgba(0, 87, 189, 0.1) !important; }

        .font-title-md { font-family: 'Plus Jakarta Sans', sans-serif !important; font-weight: 700 !important; }
        .text-title-md { font-size: 1.125rem !important; line-height: 1.5rem !important; }
        .font-body-md { font-family: 'Inter', sans-serif !important; font-weight: 500 !important; }
        .text-body-md { font-size: 0.875rem !important; line-height: 1.25rem !important; }
        .font-headline-lg { font-family: 'Plus Jakarta Sans', sans-serif !important; font-weight: 800 !important; }
        .text-headline-lg { font-size: 1.5rem !important; line-height: 2rem !important; letter-spacing: -0.025em !important; }
        .font-label-sm { font-family: 'Inter', sans-serif !important; font-weight: 600 !important; }
        .text-label-sm { font-size: 0.75rem !important; line-height: 1rem !important; }
        .text-label-xs { font-size: 10px !important; line-height: 1rem !important; font-weight: 700 !important; }
        .font-display { font-family: 'Plus Jakarta Sans', sans-serif !important; }
        .font-body { font-family: 'Inter', sans-serif !important; }
      `}</style>

      <div className="bg-surface font-sans text-on-surface flex-1 overflow-hidden">
        <div className="max-w-container-max mx-auto bg-surface-container-lowest h-full relative shadow-2xl overflow-hidden flex flex-col">
          {/* TopAppBar */}
          <header className="bg-white/80 backdrop-blur-xl fixed top-0 z-50 flex justify-between items-center w-full max-w-container-max px-4 h-16 border-b border-outline-variant/20">
            <button 
              onClick={onDismiss}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-on-surface">arrow_back</span>
            </button>
            <div className="flex flex-col items-center flex-1">
              <span className="text-title-md font-title-md text-on-surface leading-tight">{stay.title}</span>
              {(stay.nativeTitle || venueNameKo) && (
                <span className="text-label-sm font-label-sm text-on-surface-variant leading-tight">{stay.nativeTitle || venueNameKo}</span>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleToggleLike} 
                disabled={isLiking}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-95"
              >
                <span className={`material-symbols-outlined transition-all ${likedStays.has(stayId) ? 'text-red-500 scale-110' : 'text-on-surface'}`} style={likedStays.has(stayId) ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  favorite
                </span>
              </button>
              <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-95">
                <span className="material-symbols-outlined text-on-surface">share</span>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto space-y-section-gap pb-48 pt-16 hide-scrollbar">
            {/* Image Gallery */}
            <section className="relative">
              <div className="aspect-video w-full overflow-hidden relative">
                <img 
                  alt={stay.title} 
                  className="w-full h-full object-cover" 
                  src={images[currentImgIdx]}
                />
                
                {/* Location Overlay */}
                <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1 z-10">
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                  <span className="text-label-sm font-medium">
                    {stay.location?.district ? `${stay.location.district}, ${stay.location.city}` : stay.location?.city || stay.location?.address}
                  </span>
                </div>

                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-label-sm backdrop-blur-md z-10">
                  {currentImgIdx + 1}/{images.length}
                </div>
                <div className="absolute inset-y-0 left-0 flex items-center px-2 z-10">
                  <button onClick={prevImg} className="w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white flex items-center justify-center rounded-full transition-colors">
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 z-10">
                  <button onClick={nextImg} className="w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white flex items-center justify-center rounded-full transition-colors">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Rate Information */}
            <section className="px-page-margin mt-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 w-full mx-auto overflow-hidden">
                {/* Price Hero Section */}
                <div className="px-6 bg-slate-50/50 flex flex-col items-center text-center py-12">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-primary text-6xl md:text-7xl font-extrabold tracking-tight">{formatRate(stay.pricing?.baseRate)}</span>
                    <span className="text-xl font-bold ml-2 text-primary/60 font-display">{currency}</span>
                  </div>
                  <p className="mt-2 text-slate-500 font-medium text-sm">per night</p>
                </div>
                {/* Details Grid */}
                <div className="bg-white p-6 border-t border-slate-100">
                  <div className="grid grid-cols-3 gap-4">
                    {/* Weekend Surcharge */}
                    <div className="flex items-center gap-2 py-1">
                      <span className="material-symbols-outlined text-primary/80 text-lg">calendar_month</span>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Weekend</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-slate-900 font-bold text-sm font-display">+{formatRate(stay.pricing?.weekendSurcharge)}</span>
                        </div>
                      </div>
                    </div>
                    {/* Extra Person */}
                    <div className="flex items-center gap-2 py-1">
                      <span className="material-symbols-outlined text-primary/80 text-lg">person</span>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Extra</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-slate-900 font-bold text-sm font-display">{formatRate(stay.pricing?.extraPersonFee)}</span>
                        </div>
                      </div>
                    </div>
                    {/* Cleaning Fee */}
                    <div className="flex items-center gap-2 py-1">
                      <span className="material-symbols-outlined text-primary/80 text-lg">auto_awesome</span>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Clean</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-slate-900 font-bold text-sm font-display">{formatRate(stay.pricing?.cleaningFee)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Select Dates */}
            <section className="px-page-margin">
              <h2 className="text-title-md font-title-md mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">calendar_month</span>
                Select Dates
              </h2>
              <div className="bg-surface-container rounded-3xl p-6 shadow-sm border border-outline-variant/10">
                <div className="flex justify-between items-center mb-6">
                  <button onClick={prevMonth} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors">
                    <span className="material-symbols-outlined text-on-surface">chevron_left</span>
                  </button>
                  <h3 className="font-title-md text-title-md">{format(currentMonth, 'MMMM yyyy')}</h3>
                  <button onClick={nextMonth} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors">
                    <span className="material-symbols-outlined text-on-surface">chevron_right</span>
                  </button>
                </div>
                <div className="grid grid-cols-7 mb-4">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="text-center font-label-sm text-on-surface-variant font-medium">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  {renderCells()}
                </div>
                
                {hasValidRange && (
                  <div className="mt-6 pt-4 border-t border-outline-variant/20 flex justify-between items-center animate-in fade-in">
                    <div className="text-on-surface-variant text-body-md">
                      {format(startDate!, 'MMM d')} - {format(endDate!, 'MMM d')}
                    </div>
                    <div className="font-title-md text-primary">
                      {nightCount} Nights
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Location Guide */}
            <section className="px-page-margin">
              <h2 className="text-title-md font-title-md mb-4">Location Guide</h2>
              <div className="rounded-3xl overflow-hidden bg-surface-container shadow-sm border border-outline-variant/10">
                <div className="aspect-video w-full bg-slate-200 relative">
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
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <p className="text-body-md text-on-surface flex-1">{stay.location?.address}</p>
                    <button 
                      onClick={() => {
                        if (stay.location?.address) {
                          navigator.clipboard.writeText(stay.location.address);
                          alert('Address copied to clipboard.');
                        }
                      }}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-surface-container-high rounded-full text-on-surface-variant hover:text-primary transition-colors active:scale-95"
                      title="주소 복사"
                    >
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    </button>
                  </div>
                  <div className="flex justify-center gap-8">
                    <a href={getMapLink('naver')} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 group">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all">
                        <span className="material-symbols-outlined">map</span>
                      </div>
                      <span className="text-label-sm font-semibold">Naver</span>
                    </a>
                    <a href={getMapLink('kakao')} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 group">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all">
                        <span className="material-symbols-outlined">explore</span>
                      </div>
                      <span className="text-label-sm font-semibold">Kakao</span>
                    </a>
                    <a href={getMapLink('google')} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 group">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all">
                        <span className="material-symbols-outlined">location_on</span>
                      </div>
                      <span className="text-label-sm font-semibold">Google</span>
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Expanded Details */}
            <section className="px-page-margin space-y-4">
              <div className="bg-surface-container-low rounded-3xl overflow-hidden border border-outline-variant/20 transition-all duration-300">
                <button onClick={() => setIsRoomOpen(!isRoomOpen)} className="w-full p-4 flex items-center justify-between hover:bg-surface-container-highest transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">meeting_room</span>
                    </div>
                    <p className="text-title-md font-title-md">Room Features</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant transition-transform duration-300" style={{ transform: isRoomOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                </button>
                {isRoomOpen && (
                  <div className="px-4 pb-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-on-surface-variant text-body-md leading-relaxed whitespace-pre-wrap">{stay.guides?.roomFeatures || 'No information available.'}</p>
                  </div>
                )}
              </div>
              <div className="bg-surface-container-low rounded-3xl overflow-hidden border border-outline-variant/20 transition-all duration-300">
                <button onClick={() => setIsGettingOpen(!isGettingOpen)} className="w-full p-4 flex items-center justify-between hover:bg-surface-container-highest transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">directions_subway</span>
                    </div>
                    <p className="text-title-md font-title-md">Getting Here</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant transition-transform duration-300" style={{ transform: isGettingOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                </button>
                {isGettingOpen && (
                  <div className="px-4 pb-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-on-surface-variant text-body-md leading-relaxed whitespace-pre-wrap">{stay.guides?.gettingHere || 'No information available.'}</p>
                  </div>
                )}
              </div>
              <div className="bg-surface-container-low rounded-3xl overflow-hidden border border-outline-variant/20 transition-all duration-300">
                <button onClick={() => setIsFacilityOpen(!isFacilityOpen)} className="w-full p-4 flex items-center justify-between hover:bg-surface-container-highest transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">concierge</span>
                    </div>
                    <p className="text-title-md font-title-md">Facility Guide</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant transition-transform duration-300" style={{ transform: isFacilityOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                </button>
                {isFacilityOpen && (
                  <div className="px-4 pb-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-on-surface-variant text-body-md leading-relaxed whitespace-pre-wrap">{stay.guides?.facilityGuide || 'No information available.'}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Meet Your Host */}
            <section className="px-page-margin">
              <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10">
                <h2 className="text-title-md font-title-md mb-6">Meet Your Host</h2>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary ring-4 ring-white shadow-sm flex-shrink-0">
                      {stay.host?.photo ? (
                        <img alt={stay.host.name} className="w-full h-full object-cover" src={stay.host.photo} />
                      ) : (
                        <div className="w-full h-full bg-primary-container flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-2xl">person</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-title-md font-title-md text-primary">{stay.host?.name || 'Host'}</h3>
                      <div className="flex items-center gap-1 text-on-surface-variant flex-wrap mt-1">
                        {stay.host?.rating ? (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-amber-500 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="text-label-sm font-semibold">{stay.host.rating}</span>
                            {stay.host?.reviewCount && (
                              <span className="text-label-sm opacity-60">({stay.host.reviewCount} reviews)</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-amber-500 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="text-label-sm">Host</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio / Headline */}
                {(stay.host?.bio || stay.headline) && (
                  <p className="text-on-surface-variant text-body-md leading-relaxed mb-6 whitespace-pre-wrap">
                    {stay.host?.bio || stay.headline}
                  </p>
                )}

                {/* Contacts */}
                {stay.host?.contacts && Object.keys(stay.host.contacts).length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-6 border-t border-primary/10">
                    {stay.host.contacts.phone && (
                      <a href={`tel:${stay.host.contacts.phone}`} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-primary/20 text-label-sm text-primary hover:bg-primary hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[16px]">call</span>
                        Call
                      </a>
                    )}
                    {stay.host.contacts.whatsapp && (
                      <a href={`https://wa.me/${stay.host.contacts.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-primary/20 text-label-sm text-primary hover:bg-primary hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[16px]">forum</span>
                        WhatsApp
                      </a>
                    )}
                    {stay.host.contacts.instagram && (
                      <a href={`https://instagram.com/${stay.host.contacts.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-primary/20 text-label-sm text-primary hover:bg-primary hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                        Instagram
                      </a>
                    )}
                    {stay.host.contacts.facebook && (
                      <a href={stay.host.contacts.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-primary/20 text-label-sm text-primary hover:bg-primary hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[16px]">public</span>
                        Facebook
                      </a>
                    )}
                  </div>
                )}
              </div>
            </section>
          </main>

          {/* Floating Action Bar */}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-md z-40">
            <div className="bg-surface-container-highest shadow-2xl rounded-3xl p-5 border border-outline-variant/30 flex items-center justify-between animate-in slide-in-from-bottom-8 duration-500 h-[96px]">
              
              {!startDate ? (
                // Initial State
                <div className="flex-1 text-center py-1">
                  <p className="text-title-md font-title-md text-on-surface">Select check-in date</p>
                </div>
              ) : !endDate ? (
                // StartDate State
                <>
                  <div className="flex-1">
                    <p className="text-title-md font-title-md text-on-surface">Select checkout date</p>
                    <p className="text-label-sm text-on-surface-variant mt-0.5">{format(startDate, 'MMM d')} ~</p>
                  </div>
                  <button 
                    onClick={clearDates} 
                    className="text-on-surface-variant text-label-sm font-label-sm hover:underline underline-offset-2 transition-all px-2 whitespace-nowrap flex-shrink-0"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                // EndDate State
                <>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-headline-lg text-primary leading-none">{formatRate(totalPrice)}</span>
                      <span className="text-label-sm font-bold text-primary mt-1">{currency}</span>
                    </div>
                    <p className="text-on-surface-variant text-[15px] font-medium">
                      {nightCount} nights, {format(endDate, 'd MMM')} check out
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Link href={checkoutLink} onClick={onDismiss}>
                      <button className="bg-primary text-on-primary px-6 py-1.5 rounded-xl font-title-md shadow-md active:scale-95 transition-transform whitespace-nowrap">
                        Book Now
                      </button>
                    </Link>
                    <button 
                      onClick={clearDates} 
                      className="text-on-surface-variant text-label-sm font-label-sm hover:underline underline-offset-2 transition-all px-2 whitespace-nowrap flex-shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
