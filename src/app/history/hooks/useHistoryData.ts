import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { classRegistrationService } from '@/lib/firebase/classRegistrationService';
import { groupService } from '@/lib/firebase/groupService';
import { bookingService } from '@/lib/firebase/bookingService';
import { stayBookingService } from '@/lib/firebase/stayBookingService';
import { StayBooking } from '@/types/stay';
import { ClassRegistration, Group } from '@/types/group';
import { BaseBooking } from '@/types/booking';
import { useLanguage } from '@/contexts/LanguageContext';
import { chatService } from '@/lib/firebase/chatService';
import { useModalNavigation } from '@/hooks/useModalNavigation';
import { db } from '@/lib/firebase/clientApp';
import { doc, updateDoc } from 'firebase/firestore';
import {
  getTimestamp,
  formatDate,
  formatOrderId,
  getStatusLabel,
  StatusKey
} from '../helpers/historyHelpers';

export function useHistoryData() {
  const { t, language } = useLanguage();
  const { user, profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Tab State
  const [activeTab, setActiveTab] = useState('All');

  // Core Data States
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

  // Next.js App Router Soft 캐시 플러시 강제 집행 (모바일 동기화 보장)
  useEffect(() => {
    router.refresh();
  }, [router]);

  // Unified Item Aggregator
  const unifiedItems = React.useMemo(() => {
    const items: any[] = [];

    // 1. Legacy Registrations (Monthly Pass, Old Classes)
    const regMap = new Map<string, ClassRegistration>();
    uidRegistrations.forEach(r => regMap.set(r.id, r));
    phoneRegistrations.forEach(r => regMap.set(r.id, r));

    const bookingIds = new Set(bookings.map(b => b.id));

    Array.from(regMap.values()).forEach(reg => {
      // Avoid duplicate display for registrations loaded from the bookings collection
      if (bookingIds.has(reg.id)) return;
      if (reg.status === 'CANCELED') return;

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
        imageUrl: reg.imageUrl || (reg as any).itemImageUrl || (reg as any).payload?.imageUrl || ''
      });
    });

    // 2. New Bookings (Daily Class, Shop, Stay, Rental)
    bookings.forEach(b => {
      if (b.status === 'CANCELLED') return;
      let domainType = 'All';
      if (b.domain && b.domain.startsWith('class')) domainType = 'Class';
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
      if (sb.status === 'CANCELLED') return;
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

  // Firestore Realtime Subscription Listeners
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

  // Sync selectedDetail & Group Info
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
    const groups: { date: string; items: any[] }[] = [];
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

  const handleOpenDetail = (item: any) => {
    router.push(`${pathname}?view=detail&id=${item.id}`, { scroll: false });
  };

  const handleCloseDetail = () => {
    if (view === 'detail') {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.replace(pathname, { scroll: false });
      }
    }
  };

  const handleChatWithSeller = async () => {
    if (!user || !selectedDetail) return;

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

  const updateHistoryItemMemo = async (itemId: string, source: string, newMemo: string, partnerName?: string) => {
    if (!itemId) return;
    try {
      if (source === 'registration') {
        const updates: any = { applicantMemo: newMemo };
        if (partnerName !== undefined) {
          updates.partnerName = partnerName;
        }
        await classRegistrationService.updateRegistration(itemId, updates);
      } else if (source === 'booking') {
        const updates: any = { memo: newMemo };
        if (partnerName !== undefined) {
          updates['payload.partnerName'] = partnerName;
        }
        await updateDoc(doc(db, 'bookings', itemId), updates);
      } else if (source === 'stay_booking') {
        await updateDoc(doc(db, 'stay_bookings', itemId), { notes: newMemo });
      }
      toast.success(language === 'KR' ? '변경 사항이 저장되었습니다.' : 'Changes have been saved.');
      
      // Update selectedDetail locally if it is currently open
      setSelectedDetail((prev: any) => {
        if (prev && prev.id === itemId) {
          const updatedRaw = { ...prev.raw, memo: newMemo, applicantMemo: newMemo };
          if (partnerName !== undefined) {
            updatedRaw.partnerName = partnerName;
          }
          return { ...prev, raw: updatedRaw };
        }
        return prev;
      });
    } catch (err) {
      console.error("Failed to update history details:", err);
      toast.error(language === 'KR' ? '변경 사항 저장에 실패했습니다.' : 'Failed to save changes.');
      throw err;
    }
  };

  const cancelHistoryItem = async (itemId: string, source: string) => {
    if (!itemId) return;
    try {
      if (source === 'registration') {
        await classRegistrationService.updateRegistration(itemId, { status: 'CANCELED' } as any);
      } else if (source === 'booking') {
        await updateDoc(doc(db, 'bookings', itemId), { status: 'CANCELED' });
      } else if (source === 'stay_booking') {
        await updateDoc(doc(db, 'stay_bookings', itemId), { status: 'CANCELED' });
      }
      toast.success(language === 'KR' ? '신청이 취소되었습니다.' : 'Application has been canceled.');
      
      // Update selectedDetail locally if it is currently open
      setSelectedDetail((prev: any) => prev && prev.id === itemId ? { ...prev, status: 'CANCELED', raw: { ...prev.raw, status: 'CANCELED' } } : prev);
    } catch (err) {
      console.error("Failed to cancel history item:", err);
      toast.error(language === 'KR' ? '신청 취소에 실패했습니다.' : 'Failed to cancel application.');
      throw err;
    }
  };

  return {
    t,
    language,
    user,
    profile,
    activeTab,
    setActiveTab,
    selectedDetail,
    groupDetails,
    isScrolled,
    setIsScrolled,
    isSelectionPopupOpen,
    setIsSelectionPopupOpen,
    chatRoomId,
    handleCloseChat,
    filteredItems,
    groupedItems,
    handleCopyAccount,
    handleOpenDetail,
    handleCloseDetail,
    handleChatWithSeller,
    updateHistoryItemMemo,
    cancelHistoryItem
  };
}
