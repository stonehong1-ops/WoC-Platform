"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { classRegistrationService } from '@/lib/firebase/classRegistrationService';
import { groupService } from '@/lib/firebase/groupService';
import { notificationService } from '@/lib/firebase/notificationService';
import { bookingService } from '@/lib/firebase/bookingService';
import { stayBookingService } from '@/lib/firebase/stayBookingService';
import { StayBooking } from '@/types/stay';
import { ClassRegistration, Group } from '@/types/group';
import { Notification } from '@/types/notification';
import { BaseBooking } from '@/types/booking';

import { useLanguage } from '@/contexts/LanguageContext';
import { chatService } from '@/lib/firebase/chatService';
import ChatRoom from '@/components/chat/ChatRoom';
import { useModalNavigation } from '@/hooks/useModalNavigation';
import { GroupClassSelectionPopup } from '@/components/groups/GroupClassSelectionPopup';

const getTimestamp = (val: any) => {
  if (!val) return 0;
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (val.seconds) return val.seconds * 1000;
  return new Date(val).getTime();
};

const TABS = ['All', 'Class', 'Social', 'Shop', 'Stay'];


type StatusKey = 'SUBMITTED' | 'BANK_TRANSFERRED' | 'SELLER_CONFIRMED' | 'SELLER_REJECTED' | 'REFUNDED' | 'DELIVERED' | string;

function getStatusLabel(status: StatusKey, t: any): string {
  switch (status) {
    case 'SUBMITTED':
    case 'PENDING':
    case 'PAYMENT_PENDING':
      return t('history.status_submitted') || 'Submitted';
    case 'BANK_TRANSFERRED':
    case 'WAITING_CONFIRMATION':
    case 'PAYMENT_REPORTED':
      return t('history.status_bank_transferred') || 'Bank Transferred';
    case 'SELLER_CONFIRMED':
    case 'CONFIRMED':
    case 'PAYMENT_COMPLETED':
      return t('history.status_seller_confirmed') || 'Seller Confirmed';
    case 'SELLER_REJECTED':
    case 'REJECTED':
      return t('history.status_seller_rejected') || 'Seller Rejected';
    case 'REFUNDED':
      return t('history.status_refunded') || 'Refunded';
    case 'DELIVERED':
      return t('history.status_delivered') || 'Delivered';
    case 'CANCELLED':
    case 'CANCELED':
      return t('history.status_cancelled') || 'Cancelled';
    default: return status.replace(/_/g, ' ').toUpperCase();
  }
}

function getStatusBadgeClass(status: StatusKey): string {
  switch (status) {
    case 'SUBMITTED':
    case 'PENDING':
    case 'PAYMENT_PENDING':
      return 'bg-slate-100 text-slate-800 border-slate-200';
    case 'BANK_TRANSFERRED':
    case 'WAITING_CONFIRMATION':
    case 'PAYMENT_REPORTED':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'SELLER_CONFIRMED':
    case 'CONFIRMED':
    case 'PAYMENT_COMPLETED':
    case 'DELIVERED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'SELLER_REJECTED':
    case 'REJECTED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'REFUNDED':
    case 'CANCELLED':
    case 'CANCELED':
      return 'bg-slate-100 text-slate-500 border-slate-200';
    default:
      return 'bg-surface-container text-on-surface-variant border-outline-variant';
  }
}

function formatDate(reg: ClassRegistration | any, t: any, language: string): string {
  const appliedAt = reg.appliedAt || reg.createdAt;
  if (!appliedAt) return t('history.date_recently') || 'Recently';
  const d = appliedAt.toDate ? appliedAt.toDate() : new Date(appliedAt as any);
  const locale = language === 'KR' ? 'ko-KR' : 'en-US';
  return d.toLocaleDateString(locale, { month: 'short', day: '2-digit', year: 'numeric' });
}


function formatFullDate(date: any, language: string): string {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  const locale = language === 'KR' ? 'ko-KR' : 'en-US';
  return d.toLocaleDateString(locale, { month: 'short', day: '2-digit', year: 'numeric' }) + ' • ' + d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatNotiDate(date: any, t: any, language: string): string {
  if (!date) return t('history.date_recently');
  const d = date.toDate ? date.toDate() : new Date(date);
  const locale = language === 'KR' ? 'ko-KR' : 'en-US';
  return d.toLocaleDateString(locale, { month: 'short', day: '2-digit', year: 'numeric' });
}

function formatOrderId(domain: string, id: string, rawOrderNumber?: string): string {
  if (rawOrderNumber) return `#${rawOrderNumber}`;
  const prefixMap: Record<string, string> = {
    'class': 'CLS',
    'class_legacy': 'CLS',
    'class_daily': 'CLS',
    'class_4w': 'CLS',
    'shop': 'SHP',
    'stay': 'STY',
    'rental': 'RNT'
  };
  const prefix = prefixMap[domain?.toLowerCase()] || 'ORD';
  const year = new Date().getFullYear();
  const shortId = id.slice(-6).toUpperCase();
  return `#${prefix}-${year}-${shortId}`;
}


function HistoryContent() {
  const { t, language } = useLanguage();
  const { user, profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  
  const [activeTab, setActiveTab] = useState('All');
  const [uidRegistrations, setUidRegistrations] = useState<ClassRegistration[]>([]);
  const [phoneRegistrations, setPhoneRegistrations] = useState<ClassRegistration[]>([]);
  const [bookings, setBookings] = useState<BaseBooking[]>([]);
  const [uidStayBookings, setUidStayBookings] = useState<StayBooking[]>([]);
  const [phoneStayBookings, setPhoneStayBookings] = useState<StayBooking[]>([]);

  // Derived state from URL for Detail Overlay
  const view = searchParams.get('view');
  const selectedId = searchParams.get('id');
  
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const [groupDetails, setGroupDetails] = useState<Group | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSelectionPopupOpen, setIsSelectionPopupOpen] = useState(false);
  
  const { value: chatId, openModal: openChat, closeModal: handleCloseChat } = useModalNavigation('chatId');
  const chatRoomId = chatId;

  // 1회 마운트 시 Next.js App Router Soft 캐시 플러시 강제 집행 (모바일 동기화 보장)
  useEffect(() => {
    router.refresh();
  }, [router]);

  const unifiedItems = React.useMemo(() => {
    const items: any[] = [];
    
    // Legacy Registrations (Monthly Pass, Old Classes)
    const regMap = new Map<string, ClassRegistration>();
    uidRegistrations.forEach(r => regMap.set(r.id, r));
    phoneRegistrations.forEach(r => regMap.set(r.id, r));
    
    Array.from(regMap.values()).forEach(reg => {
      items.push({
        id: reg.id,
        raw: reg,
        source: 'registration',
        type: 'Class',
        domain: 'class_legacy',
        title: reg.classTitle || (reg as any).itemName || 'Class',
        groupName: reg.groupName || (reg as any).payload?.groupName || '',
        dateLabel: formatDate(reg, t, language),
        timestamp: getTimestamp(reg.appliedAt || (reg as any).createdAt),
        status: reg.status as StatusKey,
        amount: reg.amount || (reg as any).totalAmount || 0,
        currency: reg.currency,
        appliedAt: reg.appliedAt,
        confirmedAt: reg.confirmedAt,
        imageUrl: (reg as any).imageUrl || ''
      });
    });

    // New Bookings (Daily Class, Shop, Stay, Rental)
    bookings.forEach(b => {
      let domainType = 'All';
      if (b.domain === 'class_daily' || b.domain === 'class_4w') domainType = 'Class';
      else if (b.domain === 'shop') domainType = 'Shop';
      else if (b.domain === 'stay') domainType = 'Stay';
      else if (b.domain === 'rental') domainType = 'Rental';

      items.push({
        id: b.id,
        raw: b,
        source: 'booking',
        type: domainType,
        domain: b.domain,
        title: b.itemName,
        groupName: b.payload?.groupName || '', 
        dateLabel: formatDate(b, t, language),
        timestamp: getTimestamp(b.createdAt),
        status: b.status as StatusKey,
        amount: b.totalAmount,
        currency: b.currency,
        appliedAt: b.createdAt,
        confirmedAt: b.confirmedAt,
        imageUrl: b.itemImageUrl || b.payload?.images?.[0] || b.payload?.imageUrl || ''
      });
    });

    // 3. Stay Bookings (stay_bookings collection)
    const stayMap = new Map<string, StayBooking>();
    uidStayBookings.forEach(sb => stayMap.set(sb.id, sb));
    phoneStayBookings.forEach(sb => stayMap.set(sb.id, sb));

    Array.from(stayMap.values()).forEach(sb => {
      items.push({
        id: sb.id,
        raw: sb,
        source: 'stay_booking',
        type: 'Stay',
        domain: 'stay',
        title: sb.stayTitle || 'Stay Room',
        groupName: sb.groupId || '',
        dateLabel: formatDate(sb, t, language),
        timestamp: getTimestamp(sb.appliedAt),
        status: sb.status as StatusKey,
        amount: sb.pricing?.grandTotal || 0,
        currency: sb.pricing?.currency || 'KRW',
        appliedAt: sb.appliedAt,
        confirmedAt: sb.payment?.confirmedAt || sb.updatedAt,
        imageUrl: sb.stayImageUrl || ''
      });
    });

    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [uidRegistrations, phoneRegistrations, bookings, uidStayBookings, phoneStayBookings, t, language]);

  // Sync selectedDetail with URL 'id'
  useEffect(() => {
    if (view === 'detail' && selectedId) {
      const found = unifiedItems.find(r => r.id === selectedId);
      if (found) {
        setSelectedDetail(found);
      }
    } else {
      setSelectedDetail(null);
    }
  }, [view, selectedId, unifiedItems]);

  useEffect(() => {
    if (!user) return;
    const unsubUid = classRegistrationService.subscribeToUserRegistrations(
      user.uid,
      (data) => setUidRegistrations(data)
    );

    const unsubBookings = bookingService.subscribeToUserBookings(
      user.uid,
      (data) => setBookings(data)
    );

    const unsubUidStayBookings = stayBookingService.subscribeToUserBookings(
      user.uid,
      (data) => setUidStayBookings(data)
    );

    let unsubPhoneStay: (() => void) | null = null;
    let unsubPhoneStay010: (() => void) | null = null;

    if (profile?.phoneNumber) {
      unsubPhoneStay = stayBookingService.subscribeToPhoneBookings(
        profile.phoneNumber,
        (data) => setPhoneStayBookings(prev => {
          const map = new Map([...prev.map(b => [b.id, b] as [string, StayBooking]), ...data.map(b => [b.id, b] as [string, StayBooking])]);
          return Array.from(map.values());
        })
      );
      
      if (profile.phoneNumber.startsWith('+82')) {
        const localPhone = '0' + profile.phoneNumber.slice(3);
        unsubPhoneStay010 = stayBookingService.subscribeToPhoneBookings(
          localPhone,
          (data) => setPhoneStayBookings(prev => {
            const map = new Map([...prev.map(b => [b.id, b] as [string, StayBooking]), ...data.map(b => [b.id, b] as [string, StayBooking])]);
            return Array.from(map.values());
          })
        );
      }
    } else if (user.phoneNumber) {
      unsubPhoneStay = stayBookingService.subscribeToPhoneBookings(
        user.phoneNumber,
        (data) => setPhoneStayBookings(prev => {
          const map = new Map([...prev.map(b => [b.id, b] as [string, StayBooking]), ...data.map(b => [b.id, b] as [string, StayBooking])]);
          return Array.from(map.values());
        })
      );
      if (user.phoneNumber.startsWith('+82')) {
        const localPhone = '0' + user.phoneNumber.slice(3);
        unsubPhoneStay010 = stayBookingService.subscribeToPhoneBookings(
          localPhone,
          (data) => setPhoneStayBookings(prev => {
            const map = new Map([...prev.map(b => [b.id, b] as [string, StayBooking]), ...data.map(b => [b.id, b] as [string, StayBooking])]);
            return Array.from(map.values());
          })
        );
      }
    }

    let unsubPhone: (() => void) | null = null;
    let unsubPhone010: (() => void) | null = null;

    if (profile?.phoneNumber) {
      unsubPhone = classRegistrationService.subscribeToPhoneRegistrations(
        profile.phoneNumber,
        (data) => setPhoneRegistrations(prev => {
          const map = new Map([...prev.map(r => [r.id, r] as [string, ClassRegistration]), ...data.map(r => [r.id, r] as [string, ClassRegistration])]);
          return Array.from(map.values());
        })
      );
      
      // Also check 010 format if it's +82
      if (profile.phoneNumber.startsWith('+82')) {
        const localPhone = '0' + profile.phoneNumber.slice(3);
        unsubPhone010 = classRegistrationService.subscribeToPhoneRegistrations(
          localPhone,
          (data) => setPhoneRegistrations(prev => {
            const map = new Map([...prev.map(r => [r.id, r] as [string, ClassRegistration]), ...data.map(r => [r.id, r] as [string, ClassRegistration])]);
            return Array.from(map.values());
          })
        );
      }
    } else if (user.phoneNumber) {
      unsubPhone = classRegistrationService.subscribeToPhoneRegistrations(
        user.phoneNumber,
        (data) => setPhoneRegistrations(prev => {
          const map = new Map([...prev.map(r => [r.id, r] as [string, ClassRegistration]), ...data.map(r => [r.id, r] as [string, ClassRegistration])]);
          return Array.from(map.values());
        })
      );
      if (user.phoneNumber.startsWith('+82')) {
        const localPhone = '0' + user.phoneNumber.slice(3);
        unsubPhone010 = classRegistrationService.subscribeToPhoneRegistrations(
          localPhone,
          (data) => setPhoneRegistrations(prev => {
            const map = new Map([...prev.map(r => [r.id, r] as [string, ClassRegistration]), ...data.map(r => [r.id, r] as [string, ClassRegistration])]);
            return Array.from(map.values());
          })
        );
      }
    }

    return () => {
      unsubUid();
      unsubBookings();
      unsubUidStayBookings();
      if (unsubPhoneStay) unsubPhoneStay();
      if (unsubPhoneStay010) unsubPhoneStay010();
      if (unsubPhone) unsubPhone();
      if (unsubPhone010) unsubPhone010();
    };
  }, [user, profile?.phoneNumber]);

  useEffect(() => {
    const groupId = selectedDetail?.raw?.groupId || selectedDetail?.raw?.payload?.groupId;
    if (groupId) {
      groupService.getGroup(groupId).then(g => setGroupDetails(g));
    } else {
      setGroupDetails(null);
    }
  }, [selectedDetail]);

  const filteredItems = activeTab === 'All'
    ? unifiedItems
    : unifiedItems.filter(item => item.type === activeTab);

  const groupedItems = React.useMemo(() => {
    const groups: { date: string, items: any[] }[] = [];
    let currentDate = '';
    
    filteredItems.forEach(item => {
      if (item.dateLabel !== currentDate) {
        currentDate = item.dateLabel;
        groups.push({ date: currentDate, items: [item] });
      } else {
        groups[groups.length - 1].items.push(item);
      }
    });
    return groups;
  }, [filteredItems]);

  const handleCopyAccount = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(t('history.toast_copy_account'));
    });

  };

  // Find class/bundle specific details
  let itemInfo: any = null;
  if (selectedDetail && groupDetails) {
    const raw = selectedDetail.raw;
    const itemType = raw.itemType || selectedDetail.domain;
    const classId = raw.classId || raw.itemId;
    
    if (itemType === 'discount') {
      itemInfo = groupDetails.discounts?.find(d => d.id === classId);
    } else {
      itemInfo = groupDetails.classes?.find(c => c.id === classId);
    }
  }

  // Fallback to payload for newer bookings without groupDetails
  if (!itemInfo && selectedDetail?.raw?.payload) {
    itemInfo = selectedDetail.raw.payload;
  }

  // Use group payment settings or class specific
  let bankInfo = itemInfo?.bankName && itemInfo?.accountNumber 
    ? { bankName: itemInfo.bankName, accountNumber: itemInfo.accountNumber, accountHolder: itemInfo.accountHolder } 
    : groupDetails?.classPaymentSettings?.bankDetails;

  // Fallback for Stay Bookings
  if (selectedDetail?.type === 'Stay' && selectedDetail?.raw?.payment) {
    const pay = selectedDetail.raw.payment;
    if (pay.bankName && pay.accountNumber) {
      bankInfo = {
        bankName: pay.bankName,
        accountNumber: pay.accountNumber,
        accountHolder: pay.holderName || pay.depositorName || ''
      };
    }
  }

  const handleOpenDetail = (item: any) => {
    // URL-based open
    router.push(`/history?view=detail&id=${item.id}`, { scroll: false });
  };

  const handleCloseDetail = () => {
    // URL contains ?view=detail&id=...
    // We want to remove these parameters. Using router.back() is best if we came from the list.
    // If entered directly via link, we replace to /history.
    if (view === 'detail') {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.replace('/history', { scroll: false });
      }
    }
  };

  const handleChatWithSeller = async () => {
    if (!user || !selectedDetail) return;
    
    // Attempt to resolve sellerId. Fallback to admin if none found.
    const sellerId = selectedDetail.raw?.sellerId || selectedDetail.raw?.hostId || selectedDetail.raw?.payload?.ownerId || groupDetails?.ownerId || 'adminstone';
    
    if (user.uid === sellerId) return alert(t('shop.msg_no_self_chat', 'You cannot chat with yourself'));

    try {
      const roomId = await chatService.getOrCreatePrivateRoom([user.uid, sellerId], user.uid, 'business');
      
      const orderId = formatOrderId(selectedDetail.domain, selectedDetail.id, selectedDetail.raw?.orderNumber);
      const itemType = selectedDetail.type;
      const title = selectedDetail.title;
      
      const infoText = `${t('history.chat_inquiry_prefix', '[Order Inquiry]')}\n${t('history.chat_order_id', 'Order ID')}: ${orderId}\n${t('history.chat_item', 'Item')}: [${itemType}] ${title}\n${t('history.chat_status', 'Status')}: ${getStatusLabel(selectedDetail.status, t)}`;

      await chatService.sendMessage({
        roomId,
        senderId: user.uid,
        senderName: user.displayName || t('common.user', 'User'),
        senderPhoto: user.photoURL || undefined,
        text: infoText,
        type: 'text'
      });
      
      openChat(roomId);
    } catch (err) {
      console.error("Failed to start chat:", err);
      alert(t('shop.msg_chat_failed', 'Failed to start chat. Please try again.'));
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8FF] text-on-background pb-24 font-['Inter']">

      {/* Scrollable Tab Bar - Standardized (Sticky at the top, just below global header) */}
      {!selectedDetail && (
        <div className="w-full bg-[#FAF8FF] overflow-x-auto no-scrollbar sticky top-0 z-40 border-b border-slate-100/50">
          <div className="flex items-center gap-1.5 px-6 py-3 min-w-max">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-bold tracking-wide transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-[#1E293B] text-white shadow-sm'
                    : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
                }`}
              >
                {t(`history.tab_${tab.toLowerCase().replace(' ', '_')}`)}

              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      {!selectedDetail && (
        <main className="py-6 max-w-[896px] mx-auto px-6 flex flex-col gap-4">
          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <span className="material-symbols-outlined text-outline text-5xl">receipt_long</span>
              <p className="text-[1.125rem] font-bold leading-[1.5rem] font-['Plus_Jakarta_Sans'] text-on-surface">
                {activeTab === 'All' ? t('history.no_history') : t('history.no_tab_history', { tab: t(`history.tab_${activeTab.toLowerCase().replace(' ', '_')}`) })}

              </p>
              <p className="text-[0.875rem] font-medium leading-[1.25rem] font-['Inter'] text-on-surface-variant">
                {activeTab === 'Class'
                  ? t('history.class_empty_desc')
                  : t('history.coming_soon')}
              </p>

            </div>
          )}

          {groupedItems.map(group => (
            <div key={group.date} className="flex flex-col gap-4">
              <div className="flex items-center gap-4 py-2 mt-2 first:mt-0">
                <h3 className="font-['Plus_Jakarta_Sans'] text-[1rem] font-bold text-on-surface-variant min-w-max">
                  {group.date}
                </h3>
                <div className="h-px bg-outline-variant/30 flex-1"></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {group.items.map(item => {
                  const displayId = formatOrderId(item.domain, item.id, item.raw?.orderNumber);
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => handleOpenDetail(item as any)} 
                      className={`group cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-500 ${item.status === 'PAYMENT_COMPLETED' || item.status === 'DELIVERED' || item.status === 'SELLER_CONFIRMED' ? 'opacity-75' : ''}`}
                    >
                      <div className="relative aspect-square rounded-xl bg-[#f2f4f4] overflow-hidden mb-3 shadow-sm border border-slate-100">
                        {/* Fallback View */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-[#c4cacc]">
                          <span className="material-symbols-outlined text-4xl mb-1">
                            {item.type === 'Class' ? 'sports_gymnastics' : item.type === 'Shop' ? 'local_mall' : item.type === 'Stay' ? 'bed' : 'receipt_long'}
                          </span>
                          <span className="text-[10px] font-bold tracking-wider uppercase">{item.type}</span>
                        </div>
                        
                        {/* Actual Image */}
                        {item.imageUrl && (
                          <img
                            alt={item.title}
                            className="absolute inset-0 z-10 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 bg-[#f2f4f4]"
                            src={item.imageUrl}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}

                        {/* Status Badge */}
                        <span className={`absolute z-20 top-3 left-3 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm backdrop-blur-sm bg-white/90 ${
                          (item.status === 'PAYMENT_COMPLETED' || item.status === 'SELLER_CONFIRMED' || item.status === 'DELIVERED') ? 'text-emerald-600' : 
                          (item.status === 'BANK_TRANSFERRED' || item.status === 'WAITING_CONFIRMATION') ? 'text-orange-600' : 'text-slate-600'
                        }`}>
                          {(item.status === 'PAYMENT_COMPLETED' || item.status === 'SELLER_CONFIRMED' || item.status === 'DELIVERED') && (
                            <span className="material-symbols-outlined text-[10px]">check_circle</span>
                          )}
                          {getStatusLabel(item.status, t)}
                        </span>
                      </div>
                      <div className="px-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter font-['Inter'] truncate">
                          {item.groupName || item.type} • {displayId}
                        </p>
                        <h4 className="text-[13px] font-semibold text-slate-800 font-['Plus_Jakarta_Sans'] truncate mt-0.5">
                          {item.title}
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[13px] font-black text-slate-800 font-['Inter']">
                            {item.currency === 'KRW' ? '₩' : (item.currency === 'USD' ? '$' : '')}{item.amount?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </main>
      )}

      {/* Detail Overlay - Full Screen (Shop Style) */}
      {selectedDetail && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
          <style dangerouslySetInnerHTML={{ __html: `
            .detail-scrollbar::-webkit-scrollbar { display: none; }
            .detail-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}} />

          {/* ━━━ Header ━━━ */}
          <div className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-gradient-to-b from-black/30 to-transparent'} max-w-md mx-auto`}>
            <button onClick={handleCloseDetail} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-90 ${isScrolled ? 'bg-slate-100 text-[#2d3435]' : 'bg-black/20 backdrop-blur-sm text-white'}`}>
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <div className={`text-base font-bold truncate max-w-[180px] transition-opacity ${isScrolled ? 'opacity-100 text-[#2d3435]' : 'opacity-0'}`}>{selectedDetail.title}</div>
            <div className="w-10"></div> {/* Placeholder to balance the flex-between */}
          </div>

          {/* ━━━ Scrollable Content ━━━ */}
          <div 
            className="flex-1 overflow-y-auto detail-scrollbar pb-[100px] max-w-md mx-auto w-full"
            onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 60)}
          >
            {/* 1) Image Carousel / Hero */}
            <div className="relative aspect-square overflow-hidden bg-[#f2f4f4]">
              {/* Fallback */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[#c4cacc]">
                <span className="material-symbols-outlined text-5xl mb-1">receipt_long</span>
                <span className="text-[10px] font-bold tracking-wider uppercase">{selectedDetail.type || 'Order'}</span>
              </div>
              
              {/* Actual Image */}
              {selectedDetail.imageUrl && (
                <div className="relative w-full h-full">
                  <img
                    alt={selectedDetail.title}
                    className="absolute inset-0 z-10 w-full h-full object-cover bg-[#f2f4f4]"
                    src={selectedDetail.imageUrl}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              {/* Status badge */}
              <span className={`absolute z-20 top-16 left-4 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm backdrop-blur-sm ${
                (selectedDetail.status === 'PAYMENT_COMPLETED' || selectedDetail.status === 'SELLER_CONFIRMED' || selectedDetail.status === 'DELIVERED') ? 'bg-emerald-500 text-white' : 
                (selectedDetail.status === 'BANK_TRANSFERRED' || selectedDetail.status === 'WAITING_CONFIRMATION') ? 'bg-orange-500 text-white' : 'bg-white/90 text-slate-800'
              }`}>
                {(selectedDetail.status === 'PAYMENT_COMPLETED' || selectedDetail.status === 'SELLER_CONFIRMED' || selectedDetail.status === 'DELIVERED') && (
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                )}
                {getStatusLabel(selectedDetail.status, t)}
              </span>
            </div>

            {/* 2) Title & Stats */}
            <div className="px-4 pt-5 pb-4 flex justify-between items-start border-b border-[#f2f4f4]">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-[10px] font-black text-[#acb3b4] uppercase tracking-widest leading-none mb-1.5">{selectedDetail.dateLabel} · {formatOrderId(selectedDetail.domain, selectedDetail.id, selectedDetail.raw?.orderNumber)}</p>
                <h1 className="text-xl font-black text-[#2d3435] leading-tight font-['Plus_Jakarta_Sans']">{selectedDetail.title}</h1>
              </div>
            </div>

            {/* 3) Status Timeline */}
            <div className="mx-4 my-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
              <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-blue-500">schedule</span>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{t('history.timeline')}</p>
              </div>
              <div className="px-4 py-5">
                <div className="relative border-l-2 border-slate-200 ml-2 space-y-6">
                  {/* Step 1: Application Submitted */}
                  <div className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1 ring-4 ring-white"></div>
                    <div className="flex flex-col">
                      <span className="font-['Inter'] text-[13px] font-bold text-[#2d3435]">{t('history.step_submitted')}</span>
                      <span className="font-['Inter'] text-[11px] text-[#596061] mt-0.5">{formatFullDate(selectedDetail.appliedAt, language)}</span>
                    </div>
                  </div>

                  {/* Step 2: Processing in Chat */}
                  <div className="relative pl-6">
                    <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1 ring-4 ring-white transition-colors ${(selectedDetail.status !== 'PAYMENT_PENDING' && selectedDetail.status !== 'PENDING' && selectedDetail.status !== 'SUBMITTED') ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
                    <div className="flex flex-col">
                      <span className={`font-['Inter'] text-[13px] font-bold ${(selectedDetail.status !== 'PAYMENT_PENDING' && selectedDetail.status !== 'PENDING' && selectedDetail.status !== 'SUBMITTED') ? 'text-[#2d3435]' : 'text-slate-400'}`}>
                        {t('history.step_processing') || 'Processing'}
                      </span>
                      <span className="font-['Inter'] text-[11px] text-[#596061] mt-0.5">
                        {t('history.processing_desc') || 'Updates will be provided via Chat.'}
                      </span>
                    </div>
                  </div>

                  {/* Step 3: Registration Complete */}
                  <div className="relative pl-6">
                    <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1 ring-4 ring-white transition-colors ${(selectedDetail.status === 'PAYMENT_COMPLETED' || selectedDetail.status === 'CONFIRMED' || selectedDetail.status === 'SELLER_CONFIRMED' || selectedDetail.status === 'DELIVERED') ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
                    <div className="flex flex-col">
                      <span className={`font-['Inter'] text-[13px] font-bold ${(selectedDetail.status === 'PAYMENT_COMPLETED' || selectedDetail.status === 'CONFIRMED' || selectedDetail.status === 'SELLER_CONFIRMED' || selectedDetail.status === 'DELIVERED') ? 'text-[#2d3435]' : 'text-slate-400'}`}>{t('history.step_complete')}</span>
                      {((selectedDetail.status === 'PAYMENT_COMPLETED' || selectedDetail.status === 'CONFIRMED' || selectedDetail.status === 'SELLER_CONFIRMED' || selectedDetail.status === 'DELIVERED') && selectedDetail.confirmedAt) ? (
                        <span className="font-['Inter'] text-[11px] text-[#596061] mt-0.5">{formatFullDate(selectedDetail.confirmedAt, language)}</span>
                      ) : (
                        <span className="font-['Inter'] text-[11px] text-slate-400 mt-0.5">{t('history.pending_admin')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4) Information Grid */}
            <div className="mx-4 my-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
              <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-blue-500">info</span>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{selectedDetail.raw?.itemType === 'discount' ? t('history.info_bundle') : t('history.info_class')}</p>
              </div>
              <div className="px-4 py-4 flex flex-col gap-4">
                {selectedDetail.type === 'Stay' && (() => {
                  const checkInVal = selectedDetail.raw?.checkIn;
                  const checkOutVal = selectedDetail.raw?.checkOut;
                  let stayStartLabel = '';
                  let stayEndLabel = '';
                  let checkOutLabel = '';

                  if (checkInVal) {
                    const dStart = checkInVal.toDate ? checkInVal.toDate() : new Date(checkInVal);
                    stayStartLabel = dStart.toLocaleDateString(language === 'KR' ? 'ko-KR' : 'en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                  }

                  if (checkOutVal) {
                    const dOut = checkOutVal.toDate ? checkOutVal.toDate() : new Date(checkOutVal);
                    checkOutLabel = dOut.toLocaleDateString(language === 'KR' ? 'ko-KR' : 'en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                    const dEnd = new Date(dOut.getTime() - 24 * 60 * 60 * 1000);
                    stayEndLabel = dEnd.toLocaleDateString(language === 'KR' ? 'ko-KR' : 'en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                  }

                  return (
                    <>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f2f4f4] flex items-center justify-center shrink-0 text-[#596061]">
                          <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                        </div>
                        <div className="pt-0.5">
                          <p className="font-['Inter'] text-[10px] font-black uppercase tracking-wider text-[#acb3b4] mb-0.5">{t('stay.check_in', 'Check-in')} - {t('stay.check_out', 'Check-out')}</p>
                          <p className="font-['Inter'] text-[13px] font-bold text-[#2d3435]">
                            {stayStartLabel} ~ {stayEndLabel}
                            <span className="text-xs text-[#596061] font-medium ml-2">
                              ({selectedDetail.raw?.nights} {t('stay.nights_unit', 'Nights')} · {checkOutLabel} 퇴실)
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f2f4f4] flex items-center justify-center shrink-0 text-[#596061]">
                          <span className="material-symbols-outlined text-[16px]">group</span>
                        </div>
                        <div className="pt-0.5">
                          <p className="font-['Inter'] text-[10px] font-black uppercase tracking-wider text-[#acb3b4] mb-0.5">{t('stay.guests_label', 'Guests')}</p>
                          <p className="font-['Inter'] text-[13px] font-bold text-[#2d3435]">
                            {selectedDetail.raw?.guests} {t('stay.guests_unit_pp', 'Guest(s)')}
                          </p>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {selectedDetail.type === 'Class' && itemInfo && (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#f2f4f4] flex items-center justify-center shrink-0 text-[#596061]">
                        <span className="material-symbols-outlined text-[16px]">person</span>
                      </div>
                      <div className="pt-0.5">
                        <p className="font-['Inter'] text-[10px] font-black uppercase tracking-wider text-[#acb3b4] mb-0.5">{t('history.instructor')}</p>
                        <p className="font-['Inter'] text-[13px] font-bold text-[#2d3435]">
                          {itemInfo.instructors?.map((i: any) => i.name).join(', ') || 'TBD'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#f2f4f4] flex items-center justify-center shrink-0 text-[#596061]">
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                      </div>
                      <div className="pt-0.5">
                        <p className="font-['Inter'] text-[10px] font-black uppercase tracking-wider text-[#acb3b4] mb-0.5">{t('history.venue')}</p>
                        <p className="font-['Inter'] text-[13px] font-bold text-[#2d3435]">{selectedDetail.groupName || 'Freestyle Studio'}</p>
                      </div>
                    </div>
                    {itemInfo.schedule && itemInfo.schedule.length > 0 && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f2f4f4] flex items-center justify-center shrink-0 text-[#596061]">
                          <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                        </div>
                        <div className="pt-0.5">
                          <p className="font-['Inter'] text-[10px] font-black uppercase tracking-wider text-[#acb3b4] mb-0.5">{t('history.schedule')} ({itemInfo.schedule.length} {t('history.sessions')})</p>
                          <ul className="font-['Inter'] text-[13px] font-medium text-[#596061] mt-1 space-y-1">
                            {itemInfo.schedule.map((s: any, i: number) => (
                              <li key={i}>{s.date} <span className="font-mono text-xs">{s.timeSlot}</span></li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {selectedDetail.raw?.itemType === 'discount' && itemInfo && (
                  <div className="flex items-start gap-3 w-full">
                    <div className="w-8 h-8 rounded-full bg-[#f2f4f4] flex items-center justify-center shrink-0 text-[#596061]">
                      <span className="material-symbols-outlined text-[16px]">list_alt</span>
                    </div>
                    <div className="pt-0.5 flex-1 min-w-0">
                      <p className="font-['Inter'] text-[10px] font-black uppercase tracking-wider text-[#acb3b4] mb-2">{t('history.included_classes')}</p>
                      
                      <div className="flex flex-col gap-2 mb-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                        {(itemInfo.includedClassIds && itemInfo.includedClassIds.length > 0 ? itemInfo.includedClassIds : (groupDetails?.classes?.map((c: any) => c.id) || [])).map((cId: string, idx: number) => {
                          const cls = groupDetails?.classes?.find(c => c.id === cId);
                          if (!cls) return null;
                          const isParticipating = selectedDetail.raw?.selectedClassIds?.includes(cId);
                          const partnerName = selectedDetail.raw?.participatingClassPartners?.[cId];
                          
                          return (
                            <div key={idx} className="flex flex-col gap-1 p-2.5 rounded-xl bg-white border border-slate-100/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                              <div className="flex items-center gap-2">
                                <span className={`material-symbols-outlined text-[16px] shrink-0 ${isParticipating ? 'text-emerald-500 font-bold' : 'text-slate-300'}`}>
                                  {isParticipating ? 'check_circle' : 'circle'}
                                </span>
                                <span className={`text-[12.5px] font-semibold truncate ${isParticipating ? 'text-slate-800' : 'text-slate-400'}`}>
                                  {cls.title}
                                </span>
                              </div>
                              {isParticipating && partnerName && (
                                <div className="pl-6 flex items-center gap-1.5 mt-0.5">
                                  <span className="material-symbols-outlined text-slate-400 text-[12px]">group</span>
                                  <span className="text-[11px] font-medium text-slate-500">
                                    {t('group.class.popup.partner_label')}: {partnerName}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* 수업/파트너 변경 버튼 */}
                      <button
                        onClick={() => setIsSelectionPopupOpen(true)}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-xl bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px] text-slate-600">edit_note</span>
                        <span className="text-[11.5px] font-bold text-slate-700">
                          {t('history.change_class_partners')}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
                
                {!itemInfo && (
                  <p className="font-['Inter'] text-[13px] text-slate-500">{t('history.loading')}</p>
                )}
              </div>
            </div>

            {/* 5) Payment & Bank Transfer */}
            <div className="px-4 py-4 border-b border-[#f2f4f4]">
              <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-3">{t('history.payment_details')}</p>
              
              <div className="space-y-2.5 mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-['Inter'] text-[13px] font-medium text-[#596061]">{t('history.method')}</span>
                  <span className="font-['Inter'] text-[13px] font-bold text-[#2d3435]">{t('history.bank_transfer')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-['Inter'] text-[13px] font-medium text-[#596061]">{t('history.total_amount')}</span>
                  <span className="font-['Plus_Jakarta_Sans'] text-[16px] font-black text-blue-600">
                    {selectedDetail.currency === 'KRW' ? '₩' : (selectedDetail.currency === 'USD' ? '$' : '')}{selectedDetail.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {bankInfo && (
                <div className="bg-[#f0f4ff] rounded-xl p-4 border border-[#d8e2ff]">
                  <h4 className="font-['Plus_Jakarta_Sans'] text-[12px] font-bold text-blue-800 mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">account_balance</span>
                    {t('history.transfer_info')}
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    <div className="flex justify-between items-center">
                      <span className="font-['Inter'] text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('history.bank')}</span>
                      <span className="font-['Inter'] text-[13px] font-bold text-slate-800">{bankInfo.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-['Inter'] text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('history.account_number')}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-['Inter'] text-[13px] font-bold text-slate-800 font-mono tracking-tight">{bankInfo.accountNumber}</span>
                        <button 
                          onClick={() => handleCopyAccount(bankInfo.accountNumber)}
                          className="text-blue-600 hover:text-blue-800 active:scale-95 transition-all w-6 h-6 flex items-center justify-center rounded bg-white border border-blue-100 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[13px]">content_copy</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-['Inter'] text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('history.account_holder')}</span>
                      <span className="font-['Inter'] text-[13px] font-bold text-slate-800">{bankInfo.accountHolder}</span>
                    </div>
                  </div>
                  {(selectedDetail.status === 'PAYMENT_PENDING' || selectedDetail.status === 'PENDING' || selectedDetail.status === 'SUBMITTED') && (
                    <p className="font-['Inter'] text-[11px] font-bold text-blue-600 mt-3 text-center bg-white/60 py-1.5 rounded-lg border border-blue-100/50">
                      {t('history.transfer_prompt')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Chat Action */}
            <div className="px-4 py-4">
              <button
                onClick={handleChatWithSeller}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#f2f4f4] hover:bg-[#e8eaec] rounded-2xl transition-colors active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-lg text-[#596061]">chat</span>
                <span className="text-sm font-bold text-[#2d3435]">{t('shop.chat_with_seller', 'Chat with Seller')}</span>
              </button>
              <p className="text-[10px] text-[#acb3b4] text-center mt-1.5">{selectedDetail.groupName} · {t('shop.product_info_auto_sent', 'Product info will be sent automatically')}</p>
            </div>
          </div>

          {/* ━━━ Fixed Bottom Bar ━━━ */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 px-4 py-2.5 flex items-center gap-3 max-w-md mx-auto pb-safe">
            <div className="flex-1 min-w-0">
              <p className="text-lg font-black text-[#2d3435] font-['Plus_Jakarta_Sans'] leading-tight">
                {selectedDetail.currency === 'KRW' ? '₩' : (selectedDetail.currency === 'USD' ? '$' : '')}{selectedDetail.amount.toLocaleString()}
              </p>
              <p className="text-[10px] text-[#acb3b4] truncate">{getStatusLabel(selectedDetail.status, t)}</p>
            </div>
            <button 
              onClick={handleCloseDetail}
              className="flex-shrink-0 bg-[#2d3435] text-white px-7 py-3 rounded-xl font-black text-sm tracking-wide active:scale-95 transition-transform"
            >
              {t('history.close') || 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Class/Partner Selection Popup for Students */}
      {isSelectionPopupOpen && selectedDetail && (
        <GroupClassSelectionPopup
          isOpen={isSelectionPopupOpen}
          onClose={() => setIsSelectionPopupOpen(false)}
          registration={selectedDetail.raw}
          allClasses={groupDetails?.classes || []}
          includedClassIds={itemInfo?.includedClassIds && itemInfo.includedClassIds.length > 0 ? itemInfo.includedClassIds : (groupDetails?.classes?.map((c: any) => c.id) || [])}
          canEdit={true}
        />
      )}

      {/* Chat Room Modal */}
      {chatRoomId && (
        <div className="fixed inset-0 z-[200] bg-white animate-in slide-in-from-right duration-300">
          <ChatRoom roomId={chatRoomId as string} onBack={handleCloseChat} />
        </div>
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}
