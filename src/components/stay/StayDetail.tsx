'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { stayService } from '@/lib/firebase/stayService';
import { stayBookingService } from '@/lib/firebase/stayBookingService';
import { chatService } from '@/lib/firebase/chatService';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { Stay, StayBooking } from '@/types/stay';
import SectionCard from '@/components/ui/SectionCard';
import InfoRow from '@/components/ui/InfoRow';
import CollapseSection from '@/components/ui/CollapseSection';
import ChatRoom from '@/components/chat/ChatRoom';
import Link from 'next/link';
import { useModalNavigation } from '@/hooks/useModalNavigation';
import { useNavigation } from '@/components/providers/NavigationProvider';
import UserBadge from '@/components/common/UserBadge';
import { dictionary } from '@/i18n';
import { db } from '@/lib/firebase/clientApp';
import { doc, getDoc } from 'firebase/firestore';
import StayReservationFlow from './StayReservationFlow';
import { isWeekendOrHolidayStay } from '@/lib/utils/dateUtils';

import {
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

const parseFirebaseDate = (val: any): Date | null => {
  if (!val) return null;
  if (typeof val.toDate === 'function') {
    return val.toDate();
  }
  if (val._seconds !== undefined && val._seconds !== null) {
    return new Date(val._seconds * 1000);
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const formatPhoneNumberForDisplay = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/[^0-9+]/g, '');
  
  if (cleaned.startsWith('+82')) {
    const mainNum = cleaned.slice(3); 
    let formattedMain = mainNum;
    if (mainNum.startsWith('0') && mainNum.length > 9) {
      formattedMain = mainNum.slice(1);
    }
    
    if (formattedMain.length === 10) {
      formattedMain = `${formattedMain.slice(0, 2)}-${formattedMain.slice(2, 6)}-${formattedMain.slice(6)}`;
    } else if (formattedMain.length === 9) {
      formattedMain = `${formattedMain.slice(0, 2)}-${formattedMain.slice(2, 5)}-${formattedMain.slice(5)}`;
    } else if (formattedMain.length === 11) {
      formattedMain = `${formattedMain.slice(0, 3)}-${formattedMain.slice(3, 7)}-${formattedMain.slice(7)}`;
    }
    return `+82 ${formattedMain}`;
  }
  
  let localNum = cleaned.replace(/[^0-9]/g, '');
  if (localNum.length === 11) {
    return `${localNum.slice(0, 3)}-${localNum.slice(3, 7)}-${localNum.slice(7)}`;
  } else if (localNum.length === 10) {
    return `${localNum.slice(0, 3)}-${localNum.slice(3, 6)}-${localNum.slice(6)}`;
  }
  
  return phone;
};

interface StayDetailProps {
  stayId: string;
  onClose: () => void;
  isLiked: boolean;
  onToggleLike: (e: React.MouseEvent) => void;
}

export default function StayDetail({ stayId, onClose, isLiked, onToggleLike }: StayDetailProps) {
  const { user, setShowLogin, profile } = useAuth();
  const { t, formatDate, language } = useLanguage();
  const { setGlobalNavHidden } = useNavigation();
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

  const isAdmin = useMemo(() => {
    if (!user) return false;
    return stay?.host?.userId === user.uid || user.uid === 'adminstone' || (profile as any)?.role === 'admin';
  }, [user, stay, profile]);
  
  // URL-bound navigation
  const { value: modal, openModal, closeModal } = useModalNavigation('modal');
  const { value: chatId, openModal: openChat, closeModal: closeChat } = useModalNavigation('chatId');

  // Calendar states
  const [currentMonth, setCurrentMonth] = useState(startOfDay(new Date()));
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showReservationFlow, setShowReservationFlow] = useState(false);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [allBookings, setAllBookings] = useState<StayBooking[]>([]);
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<StayBooking | null>(null);
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
      setAllBookings(bookings);
      const dates: Date[] = [];
      bookings.forEach(b => {
        if (['APPLIED', 'PAYMENT_REQUESTED', 'PAID', 'CONFIRMED', 'CODE_SENT'].includes(b.status)) {
          const checkInVal = parseFirebaseDate(b.checkIn);
          const checkOutVal = parseFirebaseDate(b.checkOut);
          if (!checkInVal || !checkOutVal) return;

          let d = new Date(checkInVal);
          const end = new Date(checkOutVal);
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
    setGlobalNavHidden(true);
    return () => setGlobalNavHidden(false);
  }, [setGlobalNavHidden]);

  useEffect(() => {
    if (!stay?.groupId) return;
    const fetchVenueData = async () => {
      try {
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
  }, [isLoading]);

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
    if (!stay?.host?.userId) { alert(t('stay.host_info_missing', 'Host information is missing.')); return; }
    if (user.uid === stay.host.userId) { alert(t('stay.no_self_chat', 'You cannot chat with yourself.')); return; }

    if (!confirm(t('stay.confirm_chat', "Would you like to start a chat with the host?"))) return;

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
      alert(t('stay.chat_error', 'Failed to start chat. Please try again later.'));
    } finally {
      setIsChatLoading(false);
    }
  };

  const isDateBooked = (date: Date) => {
    const dayTime = startOfDay(new Date(date)).getTime();
    return allBookings.some(b => {
      if (!['APPLIED', 'PAYMENT_REQUESTED', 'PAID', 'CONFIRMED', 'CODE_SENT'].includes(b.status)) return false;
      const start = parseFirebaseDate(b.checkIn);
      const end = parseFirebaseDate(b.checkOut);
      if (!start || !end) return false;
      
      const startK = startOfDay(new Date(start)).getTime();
      const endK = startOfDay(new Date(end)).getTime();
      
      return (dayTime > startK && dayTime < endK) || dayTime === startK;
    });
  };

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
          alert(t('stay.dates_unavailable', 'Your selected dates include unavailable dates.'));
          return;
        }
        setEndDate(day);
      }
    }
  };

  const handleBookedDateClick = (day: Date) => {
    const found = allBookings.find(b => {
      if (!['APPLIED', 'PAYMENT_REQUESTED', 'PAID', 'CONFIRMED', 'CODE_SENT'].includes(b.status)) return false;
      const start = parseFirebaseDate(b.checkIn);
      const end = parseFirebaseDate(b.checkOut);
      if (!start || !end) return false;
      
      const testDay = startOfDay(new Date(day));
      const testStart = startOfDay(new Date(start));
      const testEnd = startOfDay(new Date(end));
      
      return testDay >= testStart && testDay < testEnd;
    });
    if (found) {
      setSelectedBookingForDetail(found);
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
        const formattedDate = formatDate(day, 'calendarDay');
        const cloneDay = day;
        const isPast = isBefore(day, startOfDay(new Date()));
        const isToday = isSameDay(day, new Date());
        const dayTime = startOfDay(new Date(day)).getTime();
        let isCheckInDate = false;
        let isCheckOutDate = false;
        let isLastNightsDate = false; 
        let isMiddleDate = false;

        allBookings.forEach(b => {
          if (!['APPLIED', 'PAYMENT_REQUESTED', 'PAID', 'CONFIRMED', 'CODE_SENT'].includes(b.status)) return;
          const start = parseFirebaseDate(b.checkIn);
          const end = parseFirebaseDate(b.checkOut);
          if (!start || !end) return;

          const startK = startOfDay(new Date(start)).getTime();
          const endK = startOfDay(new Date(end)).getTime();
          const lastNightK = endK - (24 * 60 * 60 * 1000); 

          if (dayTime === startK) {
            isCheckInDate = true;
          } else if (dayTime === endK) {
            isCheckOutDate = true;
          } else if (dayTime === lastNightK) {
            isLastNightsDate = true;
          } else if (dayTime > startK && dayTime < lastNightK) {
            isMiddleDate = true;
          }
        });

        const isBookedDay = isMiddleDate || isCheckInDate || isLastNightsDate;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelectedStart = startDate && isSameDay(day, startDate);
        const isSelectedEnd = endDate && isSameDay(day, endDate);
        const isBetween = startDate && endDate && day > startDate && day < endDate;

        const canClickBooked = isBookedDay && isAdmin;

        let cellClasses = "relative flex items-center justify-center h-12 w-full text-body-md transition-all ";
        if (!isCurrentMonth) cellClasses += "text-on-surface-variant/30 ";
        else if (isPast && !isBookedDay) {
          cellClasses += "text-on-surface-variant/30 cursor-not-allowed ";
        } else if (isBookedDay && !isAdmin) {
          cellClasses += "text-on-surface/90 cursor-default ";
        } else {
          cellClasses += "cursor-pointer hover:scale-105 active:scale-95 ";
        }

        let bgClasses = "";
        let textClasses = "";
        let cellStyle: React.CSSProperties = {};

        if (isSelectedStart) {
          bgClasses = "bg-primary rounded-full z-10 shadow-md border-2 border-blue-300";
          textClasses = "text-white font-extrabold";
        } else if (isSelectedEnd) {
          bgClasses = "bg-slate-800 rounded-full z-10 shadow-md border-2 border-slate-500";
          textClasses = "text-white font-extrabold";
        } else if (isBetween) {
          bgClasses = "bg-primary/10 rounded-none";
          textClasses = "text-primary font-medium";
        } else if (isCurrentMonth) {
          if (isCheckInDate) {
            bgClasses = "bg-[#fff1f3] rounded-full z-10";
            textClasses = "text-red-500 font-medium";
          } else if (isLastNightsDate) {
            bgClasses = "bg-[#fff1f3] rounded-full z-10";
            textClasses = "text-[#2d3435] font-medium";
          } else if (isMiddleDate) {
            bgClasses = "bg-[#fff5f6] rounded-full z-10";
            textClasses = "text-[#c0005a] font-medium";
          } else if (!isPast) {
            textClasses = "text-on-surface font-medium";
          }
        }

        days.push(
          <div 
            className={cellClasses} 
            key={day.toString()} 
            onClick={() => {
              if (isBookedDay) {
                if (canClickBooked) {
                  handleBookedDateClick(cloneDay);
                }
              } else {
                if (isPast) return;
                onDateClick(cloneDay);
              }
            }}
          >
            {isBetween && <div className="absolute inset-0 bg-primary/10" />}
            {isSelectedStart && endDate && <div className="absolute right-0 w-1/2 h-10 bg-primary/10" />}
            {isSelectedEnd && startDate && <div className="absolute left-0 w-1/2 h-10 bg-primary/10" />}
            <span 
              className={`relative z-10 flex flex-col items-center justify-center w-10 h-10 ${bgClasses} ${textClasses}`}
              style={cellStyle}
            >
              <span className="leading-none">{formattedDate}</span>
              {isCurrentMonth && isCheckInDate && (
                <span className="text-[7px] font-black leading-none mt-0.5 text-red-600 block scale-90">{t('stay.start_label', '시작')}</span>
              )}
              {isCurrentMonth && isLastNightsDate && (
                <span className="text-[7px] font-black leading-none mt-0.5 text-slate-900 block scale-90">{t('stay.end_label', '종료')}</span>
              )}
              {isToday && !isCheckInDate && !isLastNightsDate && (
                <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />
              )}
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

  const langKey = (language || 'KR').toUpperCase() === 'KR' ? 'KR' : 'EN';
  const stayKey = stayId === 'tango-stay-canaro' ? 'deokeun' : (stayId === 'tango-stay-hapjeong' ? 'hapjeong' : 'hongdae');
  const staysObj = dictionary && (dictionary as any)[langKey]?.stays;
  const stayLang = staysObj ? staysObj[stayKey] : undefined;

  const gallery = useMemo(() => {
    if (!stay) return [];
    if ((stay as any).gallery && (stay as any).gallery.length > 0) {
      return (stay as any).gallery;
    }
    return (stay.images || []).map((url: string, idx: number) => ({
      url,
      descKo: stay.descriptions?.ko?.[idx] || "",
      descEn: stay.descriptions?.en?.[idx] || ""
    }));
  }, [stay]);

  const images: string[] = stay ? gallery.map((item: any) => item.url) : [];

  const safeImgIdx = useMemo(() => {
    if (!images || images.length === 0) return 0;
    return Math.min(currentImgIdx, images.length - 1);
  }, [currentImgIdx, images]);

  const feeGuideLines = useMemo(() => {
    if (!stay || !stay.pricing) {
      if (stayLang?.calendar?.feeGuideLines && stayLang.calendar.feeGuideLines.length > 0) {
        return stayLang.calendar.feeGuideLines;
      }
      return [];
    }
    const lines: string[] = [];
    const sur = stay.pricing?.currency || "KRW";
    const symbol = sur === "KRW" ? "₩" : "$";
    
    if (stay.pricing?.baseRate !== undefined && stay.pricing?.baseRate !== null) {
      lines.push(`${t('group.stay.weekday_base_rate') || '평일 요금'}: ${symbol}${Number(stay.pricing.baseRate).toLocaleString()}`);
    }
    if (stay.pricing?.weekendSurcharge !== undefined && stay.pricing?.weekendSurcharge !== null) {
      lines.push(`${t('group.stay.weekend_surcharge') || '주말 할증 요금'}: ${symbol}${Number(stay.pricing.weekendSurcharge).toLocaleString()}`);
    }
    if (stay.pricing?.extraPersonFee !== undefined && stay.pricing?.extraPersonFee !== null) {
      lines.push(`${t('group.stay.extra_person_fee') || '추가 인원 요금'}: ${symbol}${Number(stay.pricing.extraPersonFee).toLocaleString()}`);
    }
    if (stay.pricing?.cleaningFee !== undefined && stay.pricing?.cleaningFee !== null) {
      lines.push(`${t('group.stay.cleaning_fee') || '청소비'}: ${symbol}${Number(stay.pricing.cleaningFee).toLocaleString()}`);
    }
    return lines;
  }, [stay, stayLang, t]);

  const calculatedPricing = useMemo(() => {
    if (!stay || !startDate || !endDate) return null;
    try {
      const nights = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const baseRate = stay.pricing?.baseRate || 0;
      const baseTotal = baseRate * nights;
      const cleaningFee = stay.pricing?.cleaningFee || 0;
      
      let weekendNights = 0;
      let curr = new Date(startDate);
      while (curr < endDate) {
        const tomorrow = addDays(curr, 1);
        if (isWeekendOrHolidayStay(curr, tomorrow, formatDate)) { 
          weekendNights++;
        }
        curr.setDate(curr.getDate() + 1);
      }
      const weekendSurcharge = weekendNights * (stay.pricing?.weekendSurcharge || 0);
      const grandTotal = baseTotal + cleaningFee + weekendSurcharge;

      return {
        nights,
        baseRate,
        baseTotal,
        weekendNights,
        weekendSurcharge,
        cleaningFee,
        grandTotal
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [stay, startDate, endDate, formatDate]);

  const baseRate = stay?.pricing?.baseRate || 0;
  const currency = stay?.pricing?.currency || 'KRW';

  const handleCheckoutClick = () => {
    if (!startDate || !endDate) {
      alert(t('stay.select_dates_first', '예약할 날짜를 달력에서 먼저 선택해 주세요.'));
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: 380,
          behavior: 'smooth'
        });
      }
      return;
    }
    setShowReservationFlow(true);
  };

  if (isLoading) return <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!stay) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <style dangerouslySetInnerHTML={{ __html: `
        .detail-scrollbar::-webkit-scrollbar { display: none; }
        .detail-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-rounded { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}} />

      {/* Header */}
      <div 
        className={`fixed top-0 left-0 right-0 z-[130] pointer-events-auto flex items-center justify-between px-4 pb-3 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-gradient-to-b from-black/30 to-transparent'}`}
        style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}
      >
        <button onClick={onClose} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors relative z-[140] ${isScrolled ? 'bg-slate-100 text-[#2d3435]' : 'bg-black/20 backdrop-blur-sm text-white'}`}>
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
        <div 
          className="relative aspect-square bg-surface-container overflow-hidden w-full"
          onTouchStart={(e) => touchStartX.current = e.touches[0].clientX}
          onTouchEnd={(e) => {
            const diff = touchStartX.current - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
              if (diff > 0 && safeImgIdx < images.length - 1) setCurrentImgIdx(safeImgIdx + 1);
              if (diff < 0 && safeImgIdx > 0) setCurrentImgIdx(safeImgIdx - 1);
            }
          }}
        >
          {/* Fallback */}
          {!images.length && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-on-surface-variant/30">
              <span className="material-symbols-rounded text-5xl mb-1">home</span>
              <span className="text-[10px] font-bold tracking-wider uppercase">{t('stay.no_image', 'No Image')}</span>
            </div>
          )}
          
          <div className="flex h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${safeImgIdx * 100}%)` }}>
            {images.map((img, i) => (
              <div key={i} className="w-full flex-shrink-0 h-full" onClick={() => openModal('images')}>
                <img src={img} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          {/* 1:1 Caption Overlay */}
          {gallery[safeImgIdx] && (gallery[safeImgIdx].descKo || gallery[safeImgIdx].descEn) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent pt-12 pb-14 px-4 text-white z-10 flex flex-col justify-end pointer-events-none">
              <p className="text-xs font-black leading-relaxed tracking-wide drop-shadow-md">
                {language === 'KR' ? gallery[safeImgIdx].descKo : gallery[safeImgIdx].descEn}
              </p>
              {language === 'KR' && gallery[safeImgIdx].descEn && (
                <p className="text-[10px] text-white/70 font-semibold mt-0.5 drop-shadow-sm">{gallery[safeImgIdx].descEn}</p>
              )}
              {language !== 'KR' && gallery[safeImgIdx].descKo && (
                <p className="text-[10px] text-white/70 font-semibold mt-0.5 drop-shadow-sm">{gallery[safeImgIdx].descKo}</p>
              )}
            </div>
          )}

          <div className="absolute bottom-4 left-4 flex flex-col items-start z-20">
            {images.length > 1 && (
              <>
                <span className="bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">{safeImgIdx + 1}/{images.length}</span>
                <div className="flex gap-1.5 items-center pl-1">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setCurrentImgIdx(i)} className={`rounded-full transition-all ${i === safeImgIdx ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`} />
                  ))}
                </div>
              </>
            )}
          </div>
          <button onClick={onToggleLike} className="absolute bottom-4 right-4 px-3 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center gap-1.5 text-white transition-transform active:scale-95 z-20">
            <span className="material-symbols-rounded text-[18px]" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0", color: isLiked ? '#ef4444' : 'white' }}>favorite</span>
            <span className="text-[11px] font-bold">{stay.likesCount || 0}</span>
          </button>
        </div>

        {/* Content Header */}
        <div className="px-4 pt-5 pb-4 border-b border-surface-variant/10 text-left">
          {stay.nativeTitle ? (
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="bg-primary/10 text-primary text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">STAY</span>
              <span className="text-[11px] font-bold text-primary tracking-wide">{stay.nativeTitle}</span>
            </div>
          ) : (
            <p className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest leading-none mb-1.5">STAY</p>
          )}
          <h1 className="text-xl font-black text-on-surface leading-tight font-headline">{stay.title}</h1>
          {stay.headline && (
            <p className="text-[13px] font-semibold text-on-surface-variant/80 mt-2.5 leading-relaxed whitespace-pre-line border-l-2 border-primary/20 pl-2.5">
              {stay.headline}
            </p>
          )}
        </div>

        {/* Scarcity Bar — Drive Urgency (Shop Standard) */}
        <div className="flex items-center gap-4 px-4 py-3 bg-[#fff8f0] border-b border-[#ffe8cc]">
          <div className="flex items-center gap-1 text-[#e67700]">
            <span className="material-symbols-rounded text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            <span className="text-xs font-bold">{Math.floor(Math.random() * 15) + 3} {t('stay.people_looking', 'people looking at this now')}</span>
          </div>
          <div className="flex items-center gap-1 text-[#596061]">
            <span className="material-symbols-rounded text-sm">event_available</span>
            <span className="text-xs font-medium">{t('stay.available_now', 'Available now')}</span>
          </div>
        </div>

        {/* Calendar */}
        <div className="mx-4 my-4">
          <SectionCard icon="calendar_month" title={t('stay.select_dates', 'Select Dates')}>
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#f2f4f4] text-[#596061]">
                <span className="material-symbols-rounded text-lg">chevron_left</span>
              </button>
              <h3 className="font-bold text-[#2d3435] text-[15px]">{formatDate(currentMonth, 'monthYear')}</h3>
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

        {/* Pricing (요금 안내) */}
        <div className="mx-4 my-4">
          <SectionCard icon="payments" title={calculatedPricing ? t('stay.selected_pricing_summary', 'Selected Period Pricing') : (stayLang?.calendar?.feeGuideTitle || t('stay.pricing_details', 'Pricing Details'))}>
            {calculatedPricing ? (
              <div className="space-y-3 px-1 py-1 text-xs text-left">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 mb-2">
                  <span className="font-bold text-slate-500">{t('stay.total_nights', 'Total Nights')}</span>
                  <span className="text-sm font-extrabold text-[#2d3435]">{calculatedPricing.nights} {t('stay.nights_unit', 'Nights')}</span>
                </div>
                <div className="space-y-2 border border-slate-100 rounded-2xl p-3 bg-white">
                  <div className="flex justify-between text-[#596061]">
                    <span className="font-semibold">{t('stay.base_rate_calc', 'Base Room Rate') || '기본 숙박 요금'} ({calculatedPricing.nights}박)</span>
                    <span className="font-bold">₩{calculatedPricing.baseTotal.toLocaleString()}</span>
                  </div>
                  {calculatedPricing.weekendSurcharge > 0 && (
                    <div className="flex justify-between text-[#596061]">
                      <span className="font-semibold">{t('stay.weekend_surcharge_calc', 'Weekend Surcharge') || '주말 할증 요금'} ({calculatedPricing.weekendNights}박)</span>
                      <span className="font-bold text-primary">+₩{calculatedPricing.weekendSurcharge.toLocaleString()}</span>
                    </div>
                  )}
                  {calculatedPricing.cleaningFee > 0 && (
                    <div className="flex justify-between text-[#596061]">
                      <span className="font-semibold">{t('stay.cleaning_fee_calc', 'Cleaning Fee') || '청소비'}</span>
                      <span className="font-bold">+₩{calculatedPricing.cleaningFee.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-dashed border-slate-100 pt-2.5 mt-1 flex justify-between text-[#2d3435] text-sm font-black">
                    <span>{t('stay.total_estimated', 'Total Amount') || '총 합계 금액'}</span>
                    <span className="text-primary text-base font-black">₩{calculatedPricing.grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <ul className="space-y-3 px-1 py-1 text-left">
                {(feeGuideLines || []).map((line: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary text-base shrink-0 mt-0.5">•</span>
                    <span className="text-sm font-semibold text-[#2d3435] leading-relaxed">{line}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        {/* Details (상세 안내 5대 아코디언) */}
        <div className="mx-4 my-4">
          <SectionCard icon="home_work" title={t('stay.stay_information', 'Stay Information')}>
            <div className="space-y-4">
              {/* 1. 공간의 특징 */}
              <CollapseSection icon="meeting_room" title={t('group.stay.room_features') || t('stay.room_features', 'Room Features')} defaultOpen={true}>
                <div className="space-y-4 my-2 px-1 text-sm leading-relaxed text-[#596061] font-medium whitespace-pre-line">
                  {stay.guides?.roomFeatures ? (
                    stay.guides.roomFeatures
                  ) : stayLang?.guide?.highlights?.list ? (
                    <ul className="space-y-3">
                      {stayLang.guide.highlights.list.map((item: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary text-base shrink-0 mt-0.5">•</span>
                          <div className="text-sm leading-relaxed">
                            <strong className="text-[#2d3435] font-extrabold">{item.t}</strong>
                            <p className="text-[#596061] font-medium mt-0.5">{item.d}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    t('stay.no_info', 'No information provided.')
                  )}
                  {(!stay.guides?.roomFeatures && stayLang?.guide?.highlights?.quote) && (
                    <div className="mt-4 p-4 bg-blue-50/50 border-l-4 border-primary rounded-r-xl">
                      <p className="text-xs font-bold text-primary leading-relaxed">
                        "{stayLang.guide.highlights.quote}"
                      </p>
                    </div>
                  )}
                </div>
              </CollapseSection>

              {/* 2. 오시는 길 */}
              <CollapseSection icon="directions_subway" title={t('group.stay.getting_here') || t('stay.getting_here', 'Getting Here')}>
                <div className="space-y-4 my-2 px-1 text-sm leading-relaxed text-[#596061] font-medium text-left">
                  {stay.location?.address && (
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100/50 mb-3 flex items-start gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">location_on</span>
                      <div>
                        <strong className="text-[11px] text-[#acb3b4] font-black uppercase tracking-wider block mb-0.5">{t('stay.address') || 'ADDRESS'}</strong>
                        <p className="text-sm font-bold text-[#2d3435]">{stay.location.address}</p>
                      </div>
                    </div>
                  )}
                  
                  {stay.location?.mapImageUrl && (
                    <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden border border-slate-100 shadow-sm mb-3">
                      <img src={stay.location.mapImageUrl} alt="Map Guide" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="whitespace-pre-line">
                    {stay.guides?.gettingHere ? (
                      stay.guides.gettingHere
                    ) : stayLang?.guide?.transport?.list ? (
                      <ul className="space-y-3">
                        {stayLang.guide.transport.list.map((item: any, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-primary text-base shrink-0 mt-0.5">•</span>
                            <div className="text-sm leading-relaxed">
                              <strong className="text-[#2d3435] font-extrabold">{item.t}</strong>
                              <p className="text-[#596061] font-medium mt-0.5">{item.d}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      t('stay.no_info', 'No information provided.')
                    )}
                  </div>
                </div>
              </CollapseSection>

              {/* 3. 시설 안내 */}
              <CollapseSection icon="concierge" title={t('group.stay.facility_guide') || t('stay.facility_guide', 'Facility Guide')}>
                <div className="space-y-4 my-2 px-1 text-sm leading-relaxed text-[#596061] font-medium whitespace-pre-line">
                  {stay.guides?.facilityGuide ? (
                    stay.guides.facilityGuide
                  ) : (stayLang?.guide?.facilities?.base || stayLang?.guide?.facilities?.add) ? (
                    <div className="space-y-4">
                      <ul className="space-y-3">
                        {stayLang?.guide?.facilities?.base && (
                          <li className="flex items-start gap-2">
                            <span className="text-primary text-base shrink-0 mt-0.5">•</span>
                            <div className="text-sm leading-relaxed">
                              <strong className="text-[#2d3435] font-extrabold">{stayLang.guide.facilities.base}</strong>
                              <p className="text-[#596061] font-medium mt-0.5">{stayLang.guide.facilities.baseDesc}</p>
                            </div>
                          </li>
                        )}
                        {stayLang?.guide?.facilities?.add && (
                          <li className="flex items-start gap-2">
                            <span className="text-primary text-base shrink-0 mt-0.5">•</span>
                            <div className="text-sm leading-relaxed">
                              <strong className="text-[#2d3435] font-extrabold">{stayLang.guide.facilities.add}</strong>
                              <p className="text-[#596061] font-medium mt-0.5">{stayLang.guide.facilities.addDesc}</p>
                            </div>
                          </li>
                        )}
                      </ul>
                      {stayLang?.guide?.facilities?.freeTitle && (
                        <div className="p-4 bg-slate-50/50 border-l-4 border-slate-400 rounded-r-xl">
                          <strong className="text-xs font-bold text-[#2d3435] block mb-1">
                            {stayLang.guide.facilities.freeTitle}
                          </strong>
                          <p className="text-xs font-medium text-[#596061] leading-relaxed whitespace-pre-line">
                            {stayLang.guide.facilities.freeDesc}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    t('stay.no_info', 'No information provided.')
                  )}
                </div>
              </CollapseSection>

              {/* 4. 호스트 소개 */}
              <CollapseSection icon="person" title={(dictionary[langKey] as any)?.common?.hostGuide?.title || t('stay.meet_your_host', 'Meet Your Host')}>
                <div className="space-y-3 my-2 px-1">
                  <ul className="space-y-3">
                    {((dictionary[langKey] as any)?.common?.hostGuide?.list || []).map((item: any, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary text-base shrink-0 mt-0.5">•</span>
                        <div className="text-sm leading-relaxed">
                          <strong className="text-[#2d3435] font-extrabold">{item.t}</strong>
                          <p className="text-[#596061] font-medium mt-0.5 whitespace-pre-line">{item.d}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </CollapseSection>

              {/* 5. 주변 명소 */}
              {((stayLang?.guide?.attractions?.list && stayLang.guide.attractions.list.length > 0)) && (
                <CollapseSection icon="explore" title={stayLang?.guide?.attractions?.title || t('stay.attractions', 'Nearby Attractions')}>
                  <div className="space-y-3 my-2 px-1">
                    <ul className="space-y-3">
                      {stayLang.guide.attractions.list.map((item: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary text-base shrink-0 mt-0.5">•</span>
                          <div className="text-sm leading-relaxed">
                            <strong className="text-[#2d3435] font-extrabold">{item.t}</strong>
                            <p className="text-[#596061] font-medium mt-0.5">{item.d}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CollapseSection>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Host */}
        <div className="mx-4 my-4">
          <SectionCard icon="person" title={t('stay.meet_your_host', 'Meet Your Host')}>
            <div className="flex items-center gap-4 mb-4 px-1">
              <UserBadge
                uid={stay.host?.userId || ''}
                photoURL={stay.host?.photo}
                nickname={stay.host?.name}
                avatarSize="w-14 h-14 ring-1 ring-slate-100/50 shadow-sm"
                nameClassName="text-sm font-bold text-[#2d3435]"
                subText={
                  <p className="text-[10px] text-[#acb3b4] font-black uppercase tracking-widest mt-0.5">
                    {t('stay.verified_host', 'Verified Host')}
                  </p>
                }
              />
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
              <span className="text-sm font-bold text-[#2d3435]">{isChatLoading ? t('stay.starting_chat', 'Starting Chat...') : t('stay.chat_with_host', 'Chat with Host')}</span>
            </button>
            <p className="text-[10px] text-[#acb3b4] text-center mt-2.5 font-medium">{stay.host?.name || t('stay.host', 'Host')} · {t('stay.chat_info_auto', 'Stay info will be sent automatically')}</p>
          </SectionCard>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 px-4 py-2.5 flex items-center gap-3 max-w-md mx-auto">
        <div className="flex-1 min-w-0 text-left">
          <p className="text-lg font-black text-[#2d3435] font-headline leading-tight">
            ₩{(calculatedPricing ? calculatedPricing.grandTotal : baseRate).toLocaleString()}
          </p>
          <p className="text-[10px] text-[#acb3b4]">
            {calculatedPricing ? t('stay.calculated_total_label', 'Total (1 Guest)') : t('stay.starting_price_night', 'Starting price / night')}
          </p>
        </div>
        <button onClick={onToggleLike} className={`w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center border transition-all active:scale-90 ${isLiked ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-[#e0e4e5] text-[#596061]'}`}>
          <span className="material-symbols-rounded text-xl" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
        </button>
        <button 
          onClick={handleCheckoutClick}
          disabled={!startDate || !endDate}
          className="flex-shrink-0 bg-primary disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed text-white px-7 py-3 rounded-xl font-black text-sm tracking-wide shadow-lg shadow-primary/20 active:scale-95 transition-transform"
        >
          {t('stay.checkout', 'Checkout')}
        </button>
      </div>

      {/* Chat Room */}
      {chatId && (
        <div className="fixed inset-0 z-[200] bg-white animate-in slide-in-from-bottom duration-300">
          <ChatRoom roomId={chatId} onBack={closeChat} />
        </div>
      )}

      {/* Image Viewer */}
      {modal === 'images' && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col justify-between animate-in fade-in duration-200">
          <div className="absolute top-0 right-0 p-4 z-10">
            <button onClick={closeModal} className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center">
              <span className="material-symbols-rounded">close</span>
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <img src={images[safeImgIdx]} className="max-w-full max-h-[80vh] object-contain" />
          </div>

          {/* 1:1 Caption Overlay in Lightbox */}
          {gallery[safeImgIdx] && (gallery[safeImgIdx].descKo || gallery[safeImgIdx].descEn) && (
            <div className="bg-black/60 backdrop-blur-md p-6 text-center text-white border-t border-white/5 z-10">
              <p className="text-sm font-bold leading-relaxed mb-1 drop-shadow-sm">
                {language === 'KR' ? gallery[safeImgIdx].descKo : gallery[safeImgIdx].descEn}
              </p>
              {language === 'KR' && gallery[safeImgIdx].descEn && (
                <p className="text-xs text-white/50">{gallery[safeImgIdx].descEn}</p>
              )}
              {language !== 'KR' && gallery[safeImgIdx].descKo && (
                <p className="text-xs text-white/50">{gallery[safeImgIdx].descKo}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reservation Flow Modal */}
      {showReservationFlow && startDate && endDate && (
        <StayReservationFlow
          stay={stay}
          checkIn={startDate}
          checkOut={endDate}
          onClose={() => setShowReservationFlow(false)}
          onComplete={() => {
            setShowReservationFlow(false);
            onClose();
          }}
        />
      )}

      {/* Booking Detail Modal */}
      {selectedBookingForDetail && (
        <div className="fixed inset-0 z-[220] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 relative shadow-2xl flex flex-col gap-4 text-left border border-slate-100 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedBookingForDetail(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center active:scale-90"
            >
              <span className="material-symbols-rounded text-lg">close</span>
            </button>
            
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">event_available</span>
              <h4 className="font-headline text-base font-black text-[#2d3435]">
                {t('stay.booking_detail_title', 'Reservation Detail')}
              </h4>
            </div>

            <div className="space-y-3.5 text-xs text-[#596061]">
              <div className="bg-[#fcf8f9] p-3 rounded-2xl border border-pink-100/50 mb-1 flex items-start gap-2.5">
                <span className="bg-pink-100 text-pink-700 text-[9px] font-black px-2 py-0.5 rounded-full mt-0.5 uppercase tracking-wide shrink-0">STAY</span>
                <div>
                  <strong className="text-sm font-black text-[#2d3435] block leading-tight">{selectedBookingForDetail.stayTitle}</strong>
                  <span className="text-[10px] text-slate-400 mt-1 block">No: {selectedBookingForDetail.id}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">{t('stay.check_in', 'Check-in')}</span>
                  <strong className="text-[13px] font-black text-[#2d3435]">
                    {formatDate(selectedBookingForDetail.checkIn?.toDate?.() || new Date(selectedBookingForDetail.checkIn), 'shortMonthDay')}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">{t('stay.check_out', 'Check-out')}</span>
                  <strong className="text-[13px] font-black text-[#2d3435]">
                    {formatDate(selectedBookingForDetail.checkOut?.toDate?.() || new Date(selectedBookingForDetail.checkOut), 'shortMonthDay')}
                  </strong>
                </div>
              </div>

              <div className="space-y-2.5 px-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-400">{t('stay.applicant', 'Guest')}</span>
                  <span className="font-bold text-[#2d3435]">{selectedBookingForDetail.applicantName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-400">{t('stay.contact_number_label', 'Contact')}</span>
                  <a 
                    href={`tel:${selectedBookingForDetail.contactNumber.replace(/[^0-9+]/g, '')}`}
                    className="font-bold text-[#2d3435] hover:text-primary transition-colors flex items-center gap-1.5 underline underline-offset-2 decoration-primary/30"
                  >
                    {formatPhoneNumberForDisplay(selectedBookingForDetail.contactNumber)}
                    <span className="material-symbols-rounded text-xs text-primary shrink-0">call</span>
                  </a>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-400">{t('stay.nights', 'Nights')} / {t('stay.guests_label', 'Guests')}</span>
                  <span className="font-bold text-[#2d3435]">
                    {selectedBookingForDetail.nights} {t('stay.nights_unit', 'Nights')} / {selectedBookingForDetail.guests} {t('stay.guests_unit_pp', 'Guest(s)')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-400">{t('stay.payment_amount', 'Total Fee')}</span>
                  <span className="font-extrabold text-primary text-sm">
                    ₩{(selectedBookingForDetail.pricing?.grandTotal || 0).toLocaleString()}
                  </span>
                </div>
                {selectedBookingForDetail.payment?.depositorName && (
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-400">{t('stay.depositor', 'Depositor')}</span>
                    <span className="font-bold text-[#2d3435]">{selectedBookingForDetail.payment.depositorName}</span>
                  </div>
                )}
                {selectedBookingForDetail.payment?.depositDate && (
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-400">{t('stay.deposit_date', 'Deposit Date')}</span>
                    <span className="font-bold text-[#2d3435]">{selectedBookingForDetail.payment.depositDate}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-400">{t('stay.status', 'Status')}</span>
                  <span className="font-extrabold text-[#2d3435] uppercase tracking-wide">
                    {selectedBookingForDetail.status === 'APPLIED' ? t('stay.status_applied', 'Applied') :
                     selectedBookingForDetail.status === 'PAYMENT_REQUESTED' ? t('stay.status_payment_requested', 'Payment Requested') :
                     selectedBookingForDetail.status === 'PAID' ? t('stay.status_paid', 'Paid (Verifying)') :
                     selectedBookingForDetail.status === 'CONFIRMED' ? t('stay.status_confirmed', 'Confirmed') :
                     selectedBookingForDetail.status === 'CODE_SENT' ? t('stay.status_code_sent', 'Door Code Sent') :
                     selectedBookingForDetail.status === 'COMPLETED' ? t('stay.status_completed', 'Completed') :
                     selectedBookingForDetail.status === 'CANCELLED' ? t('stay.status_cancelled', 'Cancelled') :
                     selectedBookingForDetail.status === 'REJECTED' ? t('stay.status_rejected', 'Rejected') :
                     selectedBookingForDetail.status}
                  </span>
                </div>
              </div>
            </div>
            
            {isAdmin && (
              <button 
                onClick={async () => {
                  if (confirm(t('stay.confirm_delete_booking', '정말 이 예약을 영구 삭제하시겠습니까?'))) {
                    try {
                      await stayBookingService.deleteBooking(selectedBookingForDetail.id);
                      setSelectedBookingForDetail(null);
                      alert(t('common.delete_success', '성공적으로 삭제되었습니다.'));
                    } catch (err) {
                      console.error('Failed to delete booking:', err);
                      alert(t('common.delete_fail', '삭제에 실패했습니다.'));
                    }
                  }
                }}
                className="mt-3 w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-black rounded-2xl transition-colors text-xs text-center active:scale-[0.98] border border-red-100"
              >
                {t('stay.delete_booking', '예약 삭제')}
              </button>
            )}

            <button 
              onClick={() => setSelectedBookingForDetail(null)}
              className="mt-2 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl transition-colors text-xs text-center active:scale-[0.98]"
            >
              {t('stay.close', 'Close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
