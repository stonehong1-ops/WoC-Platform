import React, { useState, useMemo } from 'react';
import type { ChatRoom, ChatMessage, MessageType } from '@/types/chat';
import { safeDate } from '@/lib/utils/safeDate';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { groupService } from '@/lib/firebase/groupService';
import { chatService } from '@/lib/firebase/chatService';
import { toast } from 'sonner';
import { UserProfile } from '@/types/user';
import UserProfileClickable from '../common/UserProfileClickable';
import UserAvatar from '../common/UserAvatar';
import UserName from '../common/UserName';
import UserBadge from '../common/UserBadge';
import VoiceBubble from './VoiceBubble';
import MeetupCard from './MeetupCard';
import SettlementCard from './SettlementCard';
import PollCard from './PollCard';

const getGroupedReactions = (reactions: Record<string, string> = {}) => {
  const counts: Record<string, { count: number; users: string[] }> = {};
  Object.entries(reactions).forEach(([uid, emoji]) => {
    if (!counts[emoji]) {
      counts[emoji] = { count: 0, users: [] };
    }
    counts[emoji].count += 1;
    counts[emoji].users.push(uid);
  });
  return Object.entries(counts);
};

function GroupJoinActionCard({ message, user, t }: { message: ChatMessage; user: any; t: any }) {
  const [loading, setLoading] = useState(false);
  const metadata = message.metadata || {};
  const { actionType, groupId, userId, status = 'pending', groupName = 'Group' } = metadata;
  const canDecide = user?.uid && message.senderId !== user.uid;

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    if (loading) return;
    setLoading(true);
    try {
      if (actionType === 'group_join_request') {
        if (decision === 'approved') {
          await groupService.approveMember(groupId, userId);
          toast.success("가입 승인이 완료되었습니다.");
        } else {
          await groupService.rejectMember(groupId, userId);
          toast.success("가입 승인이 거절되었습니다.");
        }
      } else if (actionType === 'group_invite') {
        if (decision === 'approved') {
          const { userService } = await import('@/lib/firebase/userService');
          const userProfile = await userService.getUserById(userId);
          const memberData = {
            name: userProfile?.nickname || 'Anonymous',
            avatar: userProfile?.photoURL || '',
            role: 'member',
            joinedAt: Date.now()
          };
          await groupService.joinGroup(groupId, userId, memberData);
          toast.success("초대를 수락하여 가입이 완료되었습니다!");
        } else {
          toast.success("초대를 거절하셨습니다.");
        }
      }

      const msgRef = doc(db, 'chat_messages', message.id);
      await updateDoc(msgRef, {
        'metadata.status': decision
      });
    } catch (e) {
      console.error("Decision update failed:", e);
      toast.error("처리에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const isRequest = actionType === 'group_join_request';

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-100 dark:border-zinc-800 shadow-md min-w-[280px] max-w-[340px] space-y-4 text-left">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
          isRequest ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'bg-purple-50 text-purple-600 dark:bg-purple-900/20'
        }`}>
          <span className="material-symbols-outlined text-2xl font-bold">
            {isRequest ? 'person_add' : 'mail'}
          </span>
        </div>
        <div>
          <h4 className="text-sm font-black text-gray-900 dark:text-white">
            {isRequest ? "그룹 가입 승인 요청" : "그룹 초대 알림"}
          </h4>
          <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest leading-none">
            {groupName}
          </span>
        </div>
      </div>

      <p className="text-[13px] leading-relaxed text-gray-700 dark:text-zinc-300 font-medium">
        {message.text}
      </p>

      <div className="pt-2">
        {status === 'pending' ? (
          canDecide ? (
            <div className="flex gap-2">
              <button
                disabled={loading}
                onClick={() => handleDecision('rejected')}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-xs font-bold text-gray-600 dark:text-zinc-400 hover:bg-gray-50 active:scale-95 transition-all"
              >
                거절
              </button>
              <button
                disabled={loading}
                onClick={() => handleDecision('approved')}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
              >
                {loading ? "처리 중..." : "수락"}
              </button>
            </div>
          ) : (
            <div className="text-center py-2 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
              <span className="text-[11px] font-bold text-gray-400 dark:text-zinc-500">
                {isRequest ? "대표자의 결정을 기다리는 중입니다" : "상대방의 수락 결정을 기다리는 중입니다"}
              </span>
            </div>
          )
        ) : (
          <div className={`text-center py-2.5 rounded-xl text-xs font-bold ${
            status === 'approved' 
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
          }`}>
            {status === 'approved' 
              ? (isRequest ? "가입이 수락되었습니다" : "초대를 수락하여 가입되었습니다") 
              : (isRequest ? "가입이 거절되었습니다" : "초대를 거절하셨습니다")}
          </div>
        )}
      </div>
    </div>
  );
}

export interface ChatMessageListProps {
  roomId: string;
  room: ChatRoom | null;
  user: UserProfile | any;
  messages: ChatMessage[];
  displayMessages: ChatMessage[];
  allMembers: any[];
  otherUser: any;
  otherUsers: any[];
  translations: Record<string, string>;
  translatingIds: Set<string>;
  t: (key: string, ...args: any[]) => string;
  formatDate: (date: Date, type: string) => string;
  handleTranslate: (msgId: string, text: string) => Promise<void>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  isLoadingMore: boolean;
  messageLimit: number;
  isNoticeCollapsed: boolean;
  setIsNoticeCollapsed: (val: boolean) => void;
  isNoticeDetailOpen: boolean;
  setIsNoticeDetailOpen: (val: boolean) => void;
  currentNoticeIdx: number;
  setCurrentNoticeIdx: (val: number) => void;
  menuMsgId: string | null;
  setMenuMsgId: (id: string | null) => void;
  setReplyTo: (msg: ChatMessage | null) => void;
  setSelectedMedia: (media: { msgId: string; url: string; type: 'image' | 'video'; isOwn: boolean } | null) => void;
  handleBookingAction: (booking: any) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
}

export default function ChatMessageList({
  roomId,
  room,
  user,
  messages,
  displayMessages,
  allMembers,
  otherUser,
  otherUsers,
  translations,
  translatingIds,
  t,
  formatDate,
  handleTranslate,
  scrollRef,
  handleScroll,
  isLoadingMore,
  messageLimit,
  isNoticeCollapsed,
  setIsNoticeCollapsed,
  isNoticeDetailOpen,
  setIsNoticeDetailOpen,
  currentNoticeIdx,
  setCurrentNoticeIdx,
  menuMsgId,
  setMenuMsgId,
  setReplyTo,
  setSelectedMedia,
  handleBookingAction,
  cancelBooking
}: ChatMessageListProps) {
  const REACTION_EMOJIS = ['👍', '❤️', '🥰', '😂', '😮', '😢', '😡'];

  const getSenderName = (senderId: string, fallbackName?: string) => {
    if (senderId === user?.uid) return user.displayName || user.nickname || '나';
    const matchedUser = otherUsers.find((u: any) => u.id === senderId || u.uid === senderId);
    if (matchedUser) {
      return matchedUser.nickname || matchedUser.displayName || 'User';
    }
    if (otherUser && (otherUser.id === senderId || otherUser.uid === senderId)) {
      return otherUser.nickname || otherUser.displayName || 'User';
    }
    const member = allMembers.find((m: any) => m.id === senderId);
    if (member && (member.nickname || member.name || member.displayName)) {
      return member.nickname || member.name || member.displayName;
    }
    return fallbackName || 'User';
  };

  const getSenderPhoto = (senderId: string) => {
    if (senderId === user?.uid) return user.photoURL || '';
    const matchedUser = otherUsers.find((u: any) => u.id === senderId || u.uid === senderId);
    if (matchedUser && matchedUser.photoURL) return matchedUser.photoURL;
    if (otherUser && (otherUser.id === senderId || otherUser.uid === senderId) && otherUser.photoURL) {
      return otherUser.photoURL;
    }
    const member = allMembers.find((m: any) => m.id === senderId);
    return member?.photoURL || '';
  };

  const getStickerUrl = (mediaUrl: string, text: string) => {
    const legacyMap: Record<string, string> = {
      'sticker_hello': 'sticker_daily_1',
      'sticker_thanks': 'sticker_daily_2',
      'sticker_cheer': 'sticker_daily_3',
      'sticker_pray': 'sticker_daily_4',
      'sticker_congrats': 'sticker_daily_5',
      'sticker_sorry': 'sticker_daily_6',
      'sticker_love': 'sticker_daily_7',
      'sticker_question': 'sticker_daily_8'
    };

    let stickerId = '';
    
    if (mediaUrl && mediaUrl !== 'undefined' && mediaUrl !== 'null') {
      if (mediaUrl.includes('sticker_')) {
        const match = mediaUrl.match(/sticker_[a-zA-Z0-9_]+/);
        if (match) stickerId = match[0];
      } else if (mediaUrl.includes('/stickers/') || mediaUrl.includes('/images/stickers/')) {
        const fileName = mediaUrl.substring(mediaUrl.lastIndexOf('/') + 1);
        stickerId = fileName.split('.')[0];
      }
    }
    
    if (!stickerId && text && text.includes('sticker_')) {
      const match = text.match(/sticker_[a-zA-Z0-9_]+/);
      if (match) stickerId = match[0];
    }

    if (!stickerId && text && legacyMap[text]) {
      stickerId = legacyMap[text];
    } else if (stickerId && legacyMap[stickerId]) {
      stickerId = legacyMap[stickerId];
    }

    const finalStickerName = stickerId || 'sticker_daily_1';
    return `/stickers/${finalStickerName}.svg`;
  };

  const formatTime = (ts: any) => {
    const date = safeDate(ts);
    if (!date) return '';
    return formatDate(date, 'timeOnly');
  };

  const renderMessageText = (msg: ChatMessage) => {
    const text = msg.text;
    const getVal = (lines: string[], keys: string[]) => {
      const line = lines.find(l => keys.some(k => l.toLowerCase().includes(k.toLowerCase())));
      return line ? line.split(':').slice(1).join(':').trim() : null;
    };

    const TAGS = {
      ORDER_PLACED: ['[ORDER PLACED]', '[새 주문 알림]', '[주문 완료]'],
      PAYMENT_REPORTED: ['[PAYMENT REPORTED]', '[입금 완료 보고]', '[결제 보고됨]'],
      PRODUCT_INQUIRY: ['[PRODUCT INQUIRY]', '[상품 문의]'],
      STAY_BOOKING: ['[STAY BOOKING]', '[숙소 예약]', '[스테이 예약]'],
      STAY_PAYMENT: ['[STAY PAYMENT]', '[숙소 입금]', '[스테이 결제]'],
      RENTAL_INQUIRY: ['[RENTAL INQUIRY]', '[대관 문의]', '[렌탈 문의]']
    };

    if (TAGS.ORDER_PLACED.some(tag => text.includes(tag))) {
      const lines = text.split('\n');
      const orderNo = getVal(lines, ['Order No', '주문번호', '주문 번호']);
      const product = getVal(lines, ['Product', '상품명', 'Item', 'Title']);
      const option = getVal(lines, ['Option', '옵션']);
      const amount = getVal(lines, ['Amount', '결제금액', '금액', '수량']);
      const image = getVal(lines, ['Image', '이미지']);
      
      return (
        <div className="flex flex-col gap-3 min-w-[240px]">
          <div className="flex items-center gap-2 pb-2 border-b border-white/20">
            <span className="material-symbols-outlined text-lg">package_2</span>
            <span className="font-black uppercase tracking-widest text-[10px]">{t('chatroom.order_placed')}</span>
          </div>
          <div className="flex gap-3">
            {image && (
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white/10">
                <img src={image} className="w-full h-full object-cover" alt="" />
              </div>
            )}
            <div className="flex-1 space-y-1 min-w-0 max-w-[calc(100%-4.5rem)]">
              <p className="text-[10px] opacity-60 font-bold uppercase tracking-tighter truncate">{t('chatroom.label_order_no')}: {orderNo}</p>
              <p className="text-sm font-black leading-tight whitespace-normal break-words">{product}</p>
              <p className="text-[11px] font-bold opacity-80 whitespace-normal break-words">{option}</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase">{t('chatroom.label_total')}</span>
            <span className="text-base font-black">{amount}</span>
          </div>
        </div>
      );
    }

    if (TAGS.PAYMENT_REPORTED.some(tag => text.includes(tag))) {
      const lines = text.split('\n');
      const orderNo = getVal(lines, ['Order No', '주문번호', '주문 번호']);
      const productName = getVal(lines, ['Product', '상품명', 'Item', 'Title']);
      const depositor = getVal(lines, ['Depositor', '입금자명', '입금자']);

      return (
        <div className="flex flex-col gap-3 min-w-[240px]">
          <div className="flex items-center gap-2 pb-2 border-b border-white/20">
            <span className="material-symbols-outlined text-lg">payments</span>
            <span className="font-black uppercase tracking-widest text-[10px]">{t('chatroom.payment_reported')}</span>
          </div>
          <div className="space-y-1">
            {productName && (
              <p className="text-base font-black leading-tight text-inherit mb-1">{productName}</p>
            )}
            <p className="text-[10px] opacity-60 font-bold uppercase tracking-tighter">{t('chatroom.label_order_no')}: {orderNo}</p>
            <p className="text-[12px] font-bold opacity-90">{t('chatroom.transfer_reported_by', { name: depositor })}</p>
          </div>
          <div className="text-[10px] bg-white/10 px-3 py-1.5 rounded-full font-bold uppercase self-start">
            {msg.metadata?.status === 'CONFIRMED' || msg.metadata?.status === 'SELLER_CONFIRMED' 
              ? t('chatroom.status_confirmed', '승인 완료') 
              : msg.metadata?.status === 'CANCELLED' || msg.metadata?.status === 'SELLER_REJECTED' 
                ? t('chatroom.status_cancelled', '주문 취소') 
                : t('chatroom.status_reviewing', '검토 중')}
          </div>
        </div>
      );
    }

    if (TAGS.PRODUCT_INQUIRY.some(tag => text.includes(tag))) {
      const lines = text.split('\n');
      const brand = getVal(lines, ['Brand', '브랜드']);
      const title = getVal(lines, ['Title', '상품명']);
      const price = getVal(lines, ['Price', '가격']);
      const link = getVal(lines, ['Link', '링크', '바로가기']);
      const image = getVal(lines, ['Image', '이미지']);

      return (
        <div className="flex flex-col gap-3 min-w-[240px]">
          <div className="flex items-center gap-2 pb-2 border-b border-primary/10">
            <span className="material-symbols-outlined text-lg text-primary">shopping_bag</span>
            <span className="font-black uppercase tracking-widest text-[10px] text-primary">{t('chatroom.product_inquiry')}</span>
          </div>
          <div className="flex gap-3">
            {image && (
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                <img src={image} className="w-full h-full object-cover" alt="" />
              </div>
            )}
            <div className="flex-1 space-y-1 min-w-0 flex flex-col justify-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter truncate">{brand}</p>
              <p className="text-sm font-black text-gray-900 leading-tight line-clamp-2">{title}</p>
              <p className="text-base font-black text-primary">{price}</p>
            </div>
          </div>
          {link && (
            <a 
              href={link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-gray-50 hover:bg-gray-100 border border-gray-100 p-3 rounded-xl flex items-center justify-between group transition-all"
            >
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('chatroom.view_product')}</span>
              <span className="material-symbols-outlined text-sm text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all">arrow_forward_ios</span>
            </a>
          )}
        </div>
      );
    }

    if (TAGS.STAY_BOOKING.some(tag => text.includes(tag))) {
      const lines = text.split('\n');
      const stayName = getVal(lines, ['Stay', '숙소']);
      const dates = getVal(lines, ['Dates', '일정']);
      const nights = getVal(lines, ['Nights', '박', '숙박 일수']);
      const guests = getVal(lines, ['Guests', '인원']);
      const amount = getVal(lines, ['Amount', '금액']);
      const applicant = getVal(lines, ['Applicant', '예약자']);
      const image = getVal(lines, ['Image', '이미지']);

      return (
        <div className="flex flex-col gap-3 min-w-[240px]">
          <div className="flex items-center gap-2 pb-2 border-b border-primary/10">
            <span className="material-symbols-outlined text-lg text-primary">hotel</span>
            <span className="font-black uppercase tracking-widest text-[10px] text-primary">{t('chatroom.stay_booking')}</span>
          </div>
          <div className="flex gap-3">
            {image && (
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                <img src={image} className="w-full h-full object-cover" alt="" />
              </div>
            )}
            <div className="flex-1 space-y-1 min-w-0 flex flex-col justify-center">
              <p className="text-sm font-black text-gray-900 leading-tight line-clamp-2">{stayName}</p>
              <p className="text-[11px] text-gray-500 font-bold">{dates} · {t('chatroom.nights_count', { count: nights })}</p>
              <p className="text-[11px] text-gray-400">{t('chatroom.guests_count', { count: guests })} · {applicant}</p>
              <p className="text-base font-black text-primary">{amount}</p>
            </div>
          </div>
          <div className="text-[10px] bg-primary/5 border border-primary/10 text-primary px-3 py-1.5 rounded-full font-bold uppercase self-start">{t('chatroom.reservation_applied')}</div>
        </div>
      );
    }

    if (TAGS.STAY_PAYMENT.some(tag => text.includes(tag))) {
      const lines = text.split('\n');
      const stayName = getVal(lines, ['Stay', '숙소']);
      const dates = getVal(lines, ['Dates', '일정']);

      return (
        <div className="flex flex-col gap-3 min-w-[240px] bg-gradient-to-br from-teal-600 to-teal-800 text-white p-4 -m-3 rounded-2xl">
          <div className="flex items-center gap-2 pb-2 border-b border-white/20">
            <span className="material-symbols-outlined text-lg">payments</span>
            <span className="font-black uppercase tracking-widest text-[10px]">{t('chatroom.stay_payment')}</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold leading-tight">{stayName}</p>
            {dates && <p className="text-[11px] opacity-70">{dates}</p>}
            <p className="text-sm font-bold leading-tight mt-1">{t('chatroom.transfer_reported_confirm')}</p>
          </div>
          <div className="text-[10px] bg-white/10 px-3 py-1.5 rounded-full font-bold uppercase self-start">{t('chatroom.pending_confirmation')}</div>
        </div>
      );
    }

    if (TAGS.RENTAL_INQUIRY.some(tag => text.includes(tag))) {
      const lines = text.split('\n');
      const space = getVal(lines, ['Space', '공간']);
      const date = getVal(lines, ['Date', '날짜']);
      const time = getVal(lines, ['Time', '시간']);
      const purpose = getVal(lines, ['Purpose', '목적']);
      const headcount = getVal(lines, ['Headcount', '인원']);
      const message = getVal(lines, ['Message', '메시지']);

      return (
        <div className="flex flex-col gap-3 min-w-[240px]">
          <div className="flex items-center gap-2 pb-2 border-b border-primary/10">
            <span className="material-symbols-outlined text-lg text-primary">meeting_room</span>
            <span className="font-black uppercase tracking-widest text-[10px] text-primary">{t('chatroom.rental_inquiry')}</span>
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            {space && <p className="text-sm font-black text-gray-900 leading-tight">{space}</p>}
            <div className="bg-white/50 rounded-xl p-3 border border-gray-100 space-y-1">
              <p className="text-[11px] text-gray-600"><span className="font-bold text-gray-400 w-12 inline-block">{t('chatroom.label_date')}</span> {date}</p>
              <p className="text-[11px] text-gray-600"><span className="font-bold text-gray-400 w-12 inline-block">{t('chatroom.label_time')}</span> {time}</p>
              <p className="text-[11px] text-gray-600"><span className="font-bold text-gray-400 w-12 inline-block">{t('chatroom.label_guests')}</span> {headcount}</p>
              <p className="text-[11px] text-gray-600"><span className="font-bold text-gray-400 w-12 inline-block">{t('chatroom.label_purpose')}</span> {purpose}</p>
            </div>
            {message && (
              <p className="text-[12px] text-gray-800 bg-gray-50 p-3 rounded-xl mt-2 break-all whitespace-pre-wrap">{message}</p>
            )}
          </div>
          <div className="text-[10px] bg-primary/5 border border-primary/10 text-primary px-3 py-1.5 rounded-full font-bold uppercase self-start">{t('chatroom.negotiation_pending')}</div>
        </div>
      );
    }

    let displayString = translations[msg.id] || text;
    if (displayString.startsWith('chat.system_join_params::')) {
      try {
        const paramsStr = displayString.split('chat.system_join_params::')[1];
        const { name } = JSON.parse(paramsStr);
        const matchedMember = allMembers.find((m: any) => m.name === name || m.nickname === name || m.displayName === name)
          || otherUsers.find((u: any) => u.nickname === name || u.displayName === name);
        const resolvedName = matchedMember ? (matchedMember.nickname || matchedMember.name || matchedMember.displayName) : name;
        displayString = t('chat.system_join', { name: resolvedName });
      } catch (e) {}
    } else if (displayString.startsWith('chat.system_leave_params::')) {
      try {
        const paramsStr = displayString.split('chat.system_leave_params::')[1];
        const { name } = JSON.parse(paramsStr);
        const matchedMember = allMembers.find((m: any) => m.name === name || m.nickname === name || m.displayName === name)
          || otherUsers.find((u: any) => u.nickname === name || u.displayName === name);
        const resolvedName = matchedMember ? (matchedMember.nickname || matchedMember.name || matchedMember.displayName) : name;
        displayString = t('chat.system_leave', { name: resolvedName });
      } catch (e) {}
    } else if (displayString.startsWith('chat.system_kick_params::')) {
      try {
        const paramsStr = displayString.split('chat.system_kick_params::')[1];
        const { name } = JSON.parse(paramsStr);
        const matchedMember = allMembers.find((m: any) => m.name === name || m.nickname === name || m.displayName === name)
          || otherUsers.find((u: any) => u.nickname === name || u.displayName === name);
        const resolvedName = matchedMember ? (matchedMember.nickname || matchedMember.name || matchedMember.displayName) : name;
        displayString = t('chat.system_kick', { name: resolvedName });
      } catch (e) {}
    } else if (displayString.startsWith('chat.')) {
      displayString = t(displayString);
    }

    const renderParsedMentionText = (rawText: string) => {
      const parts = rawText.split(/(@\w+|@[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]+)/g);
      return parts.map((part, index) => {
        if (part.startsWith('@')) {
          const name = part.slice(1);
          
          if (name === 'all' || name === 'everyone') {
            return (
              <span key={index} className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-full text-[10.5px] font-black bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs select-none align-middle">
                <span className="material-symbols-outlined text-[12px] leading-none shrink-0">notifications_active</span>
                @all
              </span>
            );
          }
          if (name === 'admins') {
            return (
              <span key={index} className="inline-flex items-center gap-1 px-2.5 py-0.5 mx-0.5 rounded-full text-[10.5px] font-black bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-xs select-none align-middle">
                <span className="material-symbols-outlined text-[12px] leading-none shrink-0">military_tech</span>
                @admins
              </span>
            );
          }
          if (name === 'newcomer') {
            return (
              <span key={index} className="inline-flex items-center gap-1 px-2.5 py-0.5 mx-0.5 rounded-full text-[10.5px] font-black bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-xs select-none align-middle">
                <span className="material-symbols-outlined text-[12px] leading-none shrink-0">nature_people</span>
                @newcomer
              </span>
            );
          }

          const matchedMember = allMembers.find((m: any) => m.name === name);
          if (matchedMember) {
            return (
              <span key={index} className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-full text-[10.5px] font-black bg-primary text-white shadow-xs select-none align-middle">
                {matchedMember.avatar || matchedMember.photoURL ? (
                  <img src={matchedMember.avatar || matchedMember.photoURL} className="w-3.5 h-3.5 rounded-full object-cover shrink-0" alt="" />
                ) : (
                  <span className="material-symbols-outlined text-[11px] leading-none shrink-0">person</span>
                )}
                @{name}
              </span>
            );
          }
        }
        return part;
      });
    };

    return (
      <div className="flex flex-col gap-1">
        <div className="whitespace-pre-wrap break-words leading-relaxed select-text">
          {displayString.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {renderParsedMentionText(line)}
              {i !== displayString.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
        {translatingIds.has(msg.id) && (
          <span className="text-[10px] opacity-50 flex items-center gap-1 mt-0.5">
            <span className="w-2 h-2 rounded-full border border-current border-t-transparent animate-spin" />
            {t('chatroom.translating')}
          </span>
        )}
        {translations[msg.id] && (
          <span className="text-[10px] opacity-50 flex items-center gap-1 mt-0.5">
            <span className="material-symbols-outlined text-[12px]">g_translate</span>
            {t('chatroom.translated')}
          </span>
        )}
      </div>
    );
  };

  const handleAddEmojiReaction = async (msgId: string, emoji: string) => {
    if (!user) return;
    try {
      await chatService.toggleReaction(msgId, user.uid, emoji);
      setMenuMsgId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMessageDelete = async (msgId: string) => {
    if (!confirm(t('chat.delete_confirm', '메시지를 삭제하시겠습니까?'))) return;
    try {
      await chatService.deleteMessage(msgId);
      setMenuMsgId(null);
      toast.success(t('chat.deleted_toast', '메시지가 삭제되었습니다.'));
    } catch (e) {
      console.error(e);
      toast.error(t('common.error', '삭제에 실패했습니다.'));
    }
  };

  const notices: string[] = (room as any)?.notices || (room?.notice ? [room.notice] : []);
  const activeIdx = Math.min(currentNoticeIdx, notices.length - 1);
  const activeNotice = notices[activeIdx] || '';

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* Pinned Sticky Notice */}
      {notices.length > 0 && !isNoticeCollapsed && (
        <div className="bg-[#fcfcff] border-b border-blue-50/50 px-5 py-2.5 flex items-center justify-between gap-3 shadow-xs sticky top-0 z-10 transition-all duration-300">
          <div className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer" onClick={() => setIsNoticeDetailOpen(true)}>
            <span className="material-symbols-outlined text-[20px] text-blue-500 shrink-0">campaign</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11.5px] text-gray-800 font-bold leading-normal truncate">{activeNotice}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {notices.length > 1 && (
              <div className="flex items-center gap-0.5 bg-gray-100 rounded-full px-2 py-0.5">
                <button 
                  onClick={() => setCurrentNoticeIdx((currentNoticeIdx - 1 + notices.length) % notices.length)}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-[12px]">keyboard_arrow_left</span>
                </button>
                <span className="text-[8px] font-black text-gray-400">{activeIdx + 1}/{notices.length}</span>
                <button 
                  onClick={() => setCurrentNoticeIdx((currentNoticeIdx + 1) % notices.length)}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-[12px]">keyboard_arrow_right</span>
                </button>
              </div>
            )}
            <button 
              onClick={() => setIsNoticeCollapsed(true)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">expand_less</span>
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar scroll-smooth"
      >
        {/* Load More Indicator */}
        {isLoadingMore && (
          <div className="w-full py-3 flex justify-center items-center">
            <span className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {displayMessages.map((msg, idx) => {
          const isOwn = msg.senderId === user?.uid;
          const isSystem = msg.type === 'system';
          const showAvatar = !isOwn && !isSystem && (idx === 0 || displayMessages[idx - 1].senderId !== msg.senderId || displayMessages[idx - 1].type === 'system');

          const isGroupChat = room?.participants && room.participants.length > 2;
          const readByCount = msg.readBy ? msg.readBy.length : 1;
          const totalParticipants = room?.participants ? room.participants.length : 2;
          const unreadCount = Math.max(0, totalParticipants - readByCount);
          const isAllRead = unreadCount === 0;

          if (isSystem) {
            return (
              <div key={msg.id} className="w-full flex justify-center py-2">
                <div className="bg-gray-100/70 dark:bg-zinc-800/40 text-gray-500 dark:text-zinc-400 px-4 py-1.5 rounded-full text-[11px] font-bold shadow-xs">
                  {renderMessageText(msg)}
                </div>
              </div>
            );
          }

          if ((msg.type as string) === 'group_join_request' || (msg.type as string) === 'group_invite') {
            return (
              <div key={msg.id} className="w-full flex justify-center py-3">
                <GroupJoinActionCard message={msg} user={user} t={t} />
              </div>
            );
          }

          const hasReply = msg.replyTo;
          const repliedMsg = hasReply ? messages.find(m => m.id === msg.replyTo) : null;

          return (
            <div key={msg.id} className={`flex gap-3 relative ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {showAvatar && (
                <UserProfileClickable uid={msg.senderId}>
                  <div className="mt-1">
                    <UserAvatar photoURL={getSenderPhoto(msg.senderId)} className="w-8.5 h-8.5 rounded-2xl ring-2 ring-white shadow-xs object-cover" />
                  </div>
                </UserProfileClickable>
              )}
              {!showAvatar && !isOwn && <div className="w-8.5" />}

              <div className={`flex flex-col max-w-[70%] gap-1 relative ${isOwn ? 'items-end' : 'items-start'}`}>
                {showAvatar && (
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {getSenderName(msg.senderId, msg.senderName)}
                  </span>
                )}

                {/* Reply UI */}
                {repliedMsg && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-100 rounded-t-xl text-[10.5px] font-semibold text-gray-400 max-w-full truncate border-b-0">
                    <span className="material-symbols-outlined text-[12px] text-gray-300">reply</span>
                    <span className="truncate font-bold">
                      {repliedMsg.senderName || 'User'}: {repliedMsg.text}
                    </span>
                  </div>
                )}

                {/* Bubble Wrapper */}
                <div 
                  className="relative group/bubble flex items-end gap-1.5"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setMenuMsgId(msg.id);
                  }}
                >
                  {isOwn && (
                    <div className="flex flex-col items-end shrink-0">
                      {!isAllRead && (
                        <span className="text-[10px] font-bold text-zinc-400 tracking-tighter leading-none mb-0.5 select-none animate-in fade-in">
                          {isGroupChat ? `${readByCount}읽음` : '1'}
                        </span>
                      )}
                      <span className="text-[9px] text-gray-400 font-bold tracking-tight select-none pb-0.5 shrink-0">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  )}

                  {/* Main Bubble */}
                  <div 
                    onClick={() => {
                      if (msg.type === 'image' || msg.type === 'video') {
                        setSelectedMedia({ msgId: msg.id, url: msg.mediaUrl || '', type: msg.type || 'image', isOwn });
                      }
                    }}
                    className={`rounded-[24px] text-[14.5px] font-medium leading-relaxed relative ${
                      msg.type === 'meetup' || msg.type === 'remittance' || msg.type === 'poll' || msg.type === 'sticker'
                        ? 'bg-transparent border-0 p-0 shadow-none'
                        : msg.type === 'image' || msg.type === 'video'
                          ? 'p-0.5 overflow-hidden rounded-[26px] bg-gray-100 border border-gray-200/50 shadow-sm cursor-zoom-in'
                          : isOwn 
                            ? 'bg-[#0057bd] text-white shadow-xs rounded-tr-[4px] px-4.5 py-2.5' 
                            : 'bg-gray-100 text-gray-800 rounded-tl-[4px] shadow-xs px-4.5 py-2.5'
                    }`}
                  >
                    {/* Image Message */}
                    {msg.type === 'image' && msg.mediaUrl && (
                      <div className="relative max-w-[260px] aspect-[4/3] rounded-[24px] overflow-hidden bg-gray-50 flex items-center justify-center">
                        <img src={msg.mediaUrl} className="w-full h-full object-cover" alt="" loading="lazy" />
                      </div>
                    )}

                    {/* Video Message */}
                    {msg.type === 'video' && msg.mediaUrl && (
                      <div className="relative max-w-[260px] aspect-[4/3] rounded-[24px] overflow-hidden bg-gray-900 flex items-center justify-center group">
                        <video src={msg.mediaUrl} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                          <span className="material-symbols-outlined text-4xl text-white font-black drop-shadow-md">play_arrow</span>
                        </div>
                      </div>
                    )}

                    {/* Voice Message */}
                    {msg.type === 'voice' && msg.mediaUrl && (
                      <VoiceBubble url={msg.mediaUrl} isOwn={isOwn} />
                    )}

                    {/* Sticker Message */}
                    {msg.type === 'sticker' && (
                      <div className="w-[100px] h-[100px] select-none pointer-events-none">
                        <img src={getStickerUrl(msg.mediaUrl || '', msg.text || '')} className="w-full h-full object-contain" alt="" />
                      </div>
                    )}

                    {/* Meetup Card */}
                    {msg.type === 'meetup' && (
                      <MeetupCard message={msg} />
                    )}

                    {/* Settlement Card */}
                    {msg.type === 'remittance' && (
                      <SettlementCard message={msg} />
                    )}

                    {/* Poll Card */}
                    {msg.type === 'poll' && (
                      <PollCard message={msg} />
                    )}

                    {/* Standard Text or Action Cards */}
                    {msg.type !== 'image' && msg.type !== 'video' && msg.type !== 'voice' && msg.type !== 'sticker' && msg.type !== 'meetup' && msg.type !== 'remittance' && msg.type !== 'poll' && (
                      renderMessageText(msg)
                    )}
                  </div>

                  {!isOwn && (
                    <div className="flex flex-col items-start shrink-0">
                      {!isAllRead && (
                        <span className="text-[10px] font-bold text-zinc-400 tracking-tighter leading-none mb-0.5 select-none animate-in fade-in">
                          {isGroupChat ? `${readByCount}읽음` : '1'}
                        </span>
                      )}
                      <span className="text-[9px] text-gray-400 font-bold tracking-tight select-none pb-0.5 shrink-0">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Reactions List */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1 z-10">
                    {getGroupedReactions(msg.reactions).map(([emoji, { count }]) => (
                      <button
                        key={emoji}
                        onClick={() => handleAddEmojiReaction(msg.id, emoji)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold transition-all shadow-2xs ${
                          msg.reactions?.[user?.uid] === emoji
                            ? 'bg-primary/5 border-primary/20 text-primary scale-102 font-black'
                            : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span className="text-[10px] leading-none tracking-tight">{count}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Long Press Menu Overlay */}
                <AnimatePresence>
                  {menuMsgId === msg.id && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-3xs" onClick={() => setMenuMsgId(null)}>
                      <motion.div 
                        initial={{ scale: 0.92, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.92, opacity: 0 }}
                        className="bg-white rounded-3xl p-5 shadow-2xl border border-gray-100 w-full max-w-[280px] space-y-4 text-gray-800 dark:bg-zinc-900 dark:border-zinc-800 text-left"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Emojis row */}
                        <div className="grid grid-cols-7 gap-2 pb-3 border-b border-gray-100 dark:border-zinc-800 justify-items-center">
                          {REACTION_EMOJIS.map(emoji => (
                            <button 
                              key={emoji} 
                              onClick={() => handleAddEmojiReaction(msg.id, emoji)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-lg hover:scale-120 active:scale-90 transition-all ${
                                msg.reactions?.[user?.uid] === emoji ? 'bg-primary/10 border border-primary/20 shadow-xs' : ''
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>

                        {/* Menu Actions */}
                        <div className="flex flex-col gap-1">
                          <button 
                            onClick={() => {
                              setReplyTo(msg);
                              setMenuMsgId(null);
                            }}
                            className="w-full px-4 py-3 rounded-2xl flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 text-[13.5px] font-bold text-gray-700 dark:text-zinc-300 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px] text-gray-400">reply</span>
                            <span>{t('chat.menu_reply', '답장')}</span>
                          </button>

                          {(msg.type === 'text' || !msg.type) && (
                            <button 
                              onClick={() => handleTranslate(msg.id, msg.text)}
                              className="w-full px-4 py-3 rounded-2xl flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 text-[13.5px] font-bold text-gray-700 dark:text-zinc-300 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px] text-gray-400">g_translate</span>
                              <span>{translations[msg.id] ? t('chat.menu_undo_translate', '원문 보기') : t('chat.menu_translate', '번역')}</span>
                            </button>
                          )}

                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(msg.text || '');
                              setMenuMsgId(null);
                              toast.success(t('chat.copied_toast', '메시지가 클립보드에 복사되었습니다!'));
                            }}
                            className="w-full px-4 py-3 rounded-2xl flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 text-[13.5px] font-bold text-gray-700 dark:text-zinc-300 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px] text-gray-400">content_copy</span>
                            <span>{t('chat.menu_copy', '복사')}</span>
                          </button>

                          {isOwn && (
                            <button 
                              onClick={() => handleMessageDelete(msg.id)}
                              className="w-full px-4 py-3 rounded-2xl flex items-center gap-3 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 text-[13.5px] font-bold text-rose-500 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                              <span>{t('chat.menu_delete', '삭제')}</span>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
