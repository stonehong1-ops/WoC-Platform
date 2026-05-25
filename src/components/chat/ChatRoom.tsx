'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { chatService } from '@/lib/firebase/chatService';
import { userService } from '@/lib/firebase/userService';
import { useRouter } from 'next/navigation';
import type { ChatRoom, ChatMessage, MessageType } from '@/types/chat';
import { useAuth } from '@/components/providers/AuthProvider';
import { safeDate } from '@/lib/utils/safeDate';
import { toast } from 'sonner';
import VoiceBubble from './VoiceBubble';
import MeetupCard from './MeetupCard';
import SettlementCard from './SettlementCard';
import PollCard from './PollCard';
import EmojiParticleCanvas, { EmojiParticleCanvasRef } from './EmojiParticleCanvas';
import GroupMembersPopup from './GroupMembersPopup';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

import UserProfileClickable from '../common/UserProfileClickable';
import UserAvatar from '../common/UserAvatar';
import UserName from '../common/UserName';
import UserBadge from '../common/UserBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBookingEngine } from '@/hooks/useBookingEngine';
import { shopService } from '@/lib/firebase/shopService';

const EMOTICONS_DAILY = [
  { id: 'sticker_daily_1', fileId: 'sticker_hello', label: '인사' },
  { id: 'sticker_daily_2', fileId: 'sticker_thanks', label: '감사' },
  { id: 'sticker_daily_3', fileId: 'sticker_cheer', label: '응원' },
  { id: 'sticker_daily_4', fileId: 'sticker_pray', label: '기도' },
  { id: 'sticker_daily_5', fileId: 'sticker_congrats', label: '축하' },
  { id: 'sticker_daily_6', fileId: 'sticker_sorry', label: '죄송' },
  { id: 'sticker_daily_7', fileId: 'sticker_love', label: '사랑' },
  { id: 'sticker_daily_8', fileId: 'sticker_question', label: '질문' },
  { id: 'sticker_daily_9', fileId: 'sticker_hello', label: '기쁨' },
  { id: 'sticker_daily_10', fileId: 'sticker_thanks', label: '슬픔' },
  { id: 'sticker_daily_11', fileId: 'sticker_cheer', label: '놀람' },
  { id: 'sticker_daily_12', fileId: 'sticker_pray', label: '화남' },
  { id: 'sticker_daily_13', fileId: 'sticker_congrats', label: '윙크' },
  { id: 'sticker_daily_14', fileId: 'sticker_sorry', label: '메롱' },
  { id: 'sticker_daily_15', fileId: 'sticker_love', label: '졸림' },
  { id: 'sticker_daily_16', fileId: 'sticker_question', label: '눈물' },
  { id: 'sticker_daily_17', fileId: 'sticker_hello', label: '당황' },
  { id: 'sticker_daily_18', fileId: 'sticker_thanks', label: '삐짐' },
  { id: 'sticker_daily_19', fileId: 'sticker_cheer', label: '부끄' },
  { id: 'sticker_daily_20', fileId: 'sticker_pray', label: '최고' }
];

const EMOTICONS_ANIMAL = [
  { id: 'sticker_animal_1', fileId: 'sticker_pray', label: '냥이 안녕' },
  { id: 'sticker_animal_2', fileId: 'sticker_congrats', label: '냥이 감사' },
  { id: 'sticker_animal_3', fileId: 'sticker_sorry', label: '냥이 리액' },
  { id: 'sticker_animal_4', fileId: 'sticker_love', label: '냥이 하트' },
  { id: 'sticker_animal_5', fileId: 'sticker_question', label: '냥이 슬픔' },
  { id: 'sticker_animal_6', fileId: 'sticker_hello', label: '댕댕 안녕' },
  { id: 'sticker_animal_7', fileId: 'sticker_thanks', label: '댕댕 감사' },
  { id: 'sticker_animal_8', fileId: 'sticker_cheer', label: '댕댕 최고' },
  { id: 'sticker_animal_9', fileId: 'sticker_pray', label: '댕댕 하트' },
  { id: 'sticker_animal_10', fileId: 'sticker_congrats', label: '댕댕 슬픔' },
  { id: 'sticker_animal_11', fileId: 'sticker_sorry', label: '곰돌 인사' },
  { id: 'sticker_animal_12', fileId: 'sticker_love', label: '곰돌 응원' },
  { id: 'sticker_animal_13', fileId: 'sticker_question', label: '곰돌 축하' },
  { id: 'sticker_animal_14', fileId: 'sticker_hello', label: '토끼 하트' },
  { id: 'sticker_animal_15', fileId: 'sticker_thanks', label: '토끼 메롱' },
  { id: 'sticker_animal_16', fileId: 'sticker_cheer', label: '판다 굿' },
  { id: 'sticker_animal_17', fileId: 'sticker_pray', label: '판다 잠잠' },
  { id: 'sticker_animal_18', fileId: 'sticker_congrats', label: '햄찌 냠냠' },
  { id: 'sticker_animal_19', fileId: 'sticker_sorry', label: '햄찌 미안' },
  { id: 'sticker_animal_20', fileId: 'sticker_love', label: '아기새 럽' }
];

const EMOTICONS_NEON = [
  { id: 'sticker_reaction_1', fileId: 'sticker_sorry', label: 'OK' },
  { id: 'sticker_reaction_2', fileId: 'sticker_love', label: 'YES' },
  { id: 'sticker_reaction_3', fileId: 'sticker_question', label: 'NO' },
  { id: 'sticker_reaction_4', fileId: 'sticker_hello', label: '대박' },
  { id: 'sticker_reaction_5', fileId: 'sticker_thanks', label: '축하축하' },
  { id: 'sticker_reaction_6', fileId: 'sticker_cheer', label: '화이팅' },
  { id: 'sticker_reaction_7', fileId: 'sticker_pray', label: '인정' },
  { id: 'sticker_reaction_8', fileId: 'sticker_congrats', label: '깜놀' },
  { id: 'sticker_reaction_9', fileId: 'sticker_sorry', label: '헐' },
  { id: 'sticker_reaction_10', fileId: 'sticker_love', label: '쉿' },
  { id: 'sticker_reaction_11', fileId: 'sticker_question', label: '굿모닝' },
  { id: 'sticker_reaction_12', fileId: 'sticker_hello', label: '굿나잇' },
  { id: 'sticker_reaction_13', fileId: 'sticker_thanks', label: '문의하기' },
  { id: 'sticker_reaction_14', fileId: 'sticker_cheer', label: '주문완료' },
  { id: 'sticker_reaction_15', fileId: 'sticker_pray', label: '예약완료' },
  { id: 'sticker_reaction_16', fileId: 'sticker_congrats', label: '약속완료' },
  { id: 'sticker_reaction_17', fileId: 'sticker_sorry', label: '환영해요' },
  { id: 'sticker_reaction_18', fileId: 'sticker_love', label: '감사해요' },
  { id: 'sticker_reaction_19', fileId: 'sticker_question', label: '최고에요' },
  { id: 'sticker_reaction_20', fileId: 'sticker_hello', label: '수고했어' }
];

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

interface ChatRoomProps {
  roomId: string;
  onBack: () => void;
}

export default function ChatRoom({ roomId, onBack }: ChatRoomProps) {
  const { user } = useAuth();
  const { t, formatDate } = useLanguage();
  const { handleBookingAction, cancelBooking } = useBookingEngine();
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(`woc_chat_messages_${roomId}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.error('Failed to parse cached chat messages:', e);
        }
      }
    }
    return [];
  });
  const [inputText, setInputText] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const [otherUsers, setOtherUsers] = useState<any[]>([]);

  // Woc Mentions States & Helpers
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');

  const handleInputChange = (val: string) => {
    setInputText(val);
    const lastAtIdx = val.lastIndexOf('@');
    if (lastAtIdx !== -1) {
      const afterAt = val.slice(lastAtIdx + 1);
      const hasSpace = afterAt.includes(' ');
      if (!hasSpace) {
        setIsMentionOpen(true);
        setMentionFilter(afterAt.toLowerCase());
        return;
      }
    }
    setIsMentionOpen(false);
  };

  const handleSelectMention = (targetName: string) => {
    const lastAtIdx = inputText.lastIndexOf('@');
    if (lastAtIdx !== -1) {
      const beforeAt = inputText.slice(0, lastAtIdx);
      const newInput = `${beforeAt}@${targetName} `;
      setInputText(newInput);
    }
    setIsMentionOpen(false);
  };

  const [room, setRoom] = useState<ChatRoom | null>(null);

  const particleCanvasRef = useRef<EmojiParticleCanvasRef | null>(null);

  // 감정 이모티콘 팡팡 이펙트 실시간 기폭 헬퍼 함수
  const triggerEmotionEffect = (text: string) => {
    if (!text || !particleCanvasRef.current) return;
    const clean = text.toLowerCase();
    
    // 🎉 congrats theme
    if (
      clean.includes("축하") || 
      clean.includes("🎉") || 
      clean.includes("congrats") || 
      clean.includes("congratulation") || 
      clean.includes("경축") ||
      clean.includes("sticker_congrats") ||
      clean.includes("sticker_daily_5")
    ) {
      particleCanvasRef.current.trigger("congrats");
      return;
    }

    // ❤️ love theme
    if (
      clean.includes("사랑") || 
      clean.includes("하트") || 
      clean.includes("❤️") || 
      clean.includes("love") || 
      clean.includes("sticker_love") ||
      clean.includes("sticker_daily_7")
    ) {
      particleCanvasRef.current.trigger("love");
      return;
    }

    // ⭐ cheer theme
    if (
      clean.includes("응원") || 
      clean.includes("화이팅") || 
      clean.includes("최고") || 
      clean.includes("파이팅") || 
      clean.includes("👍") || 
      clean.includes("cheer") ||
      clean.includes("sticker_cheer") ||
      clean.includes("sticker_daily_3")
    ) {
      particleCanvasRef.current.trigger("cheer");
      return;
    }

    // 🌸 thanks theme
    if (
      clean.includes("감사") || 
      clean.includes("고마워") || 
      clean.includes("thanks") || 
      clean.includes("sticker_thanks") ||
      clean.includes("sticker_daily_2") ||
      clean.includes("sticker_hello") ||
      clean.includes("sticker_daily_1")
    ) {
      particleCanvasRef.current.trigger("thanks");
      return;
    }
  };

  // 실시간 수신 메시지 감정 이모티콘 팡팡 이펙트 리액티브 감지기
  useEffect(() => {
    if (messages.length === 0 || !user) return;
    const lastMsg = messages[messages.length - 1];
    
    if (lastMsg && lastMsg.senderId !== user.uid) {
      const msgTime = typeof lastMsg.timestamp?.toDate === 'function' 
        ? lastMsg.timestamp.toDate().getTime() 
        : (lastMsg.timestamp?.seconds ? lastMsg.timestamp.seconds * 1000 : Date.now());
        
      if (Date.now() - msgTime < 1500) {
        triggerEmotionEffect(lastMsg.text);
      }
    }
  }, [messages, user]);

  // 4단계: 실시간 리액티브 기여 스탯 집계 엔진 (메모리상 연산 0% 렉 보증)
  const memberStats = useMemo(() => {
    const stats: Record<string, { textCount: number; stickerCount: number; meetupCount: number; paidCount: number }> = {};
    
    messages.forEach((msg) => {
      const sender = msg.senderId;
      if (!sender) return;
      if (!stats[sender]) {
        stats[sender] = { textCount: 0, stickerCount: 0, meetupCount: 0, paidCount: 0 };
      }
      
      if (msg.type === 'text' || !msg.type) {
        stats[sender].textCount += 1;
      } else if (msg.type === 'sticker') {
        stats[sender].stickerCount += 1;
      } else if (msg.type === 'meetup') {
        stats[sender].meetupCount += 1;
      } else if (msg.type === 'remittance') {
        const paidUsers = msg.metadata?.paidUsers || [];
        paidUsers.forEach((uid: string) => {
          if (!stats[uid]) {
            stats[uid] = { textCount: 0, stickerCount: 0, meetupCount: 0, paidCount: 0 };
          }
          stats[uid].paidCount += 1;
        });
      }
    });
    
    return stats;
  }, [messages]);

  // Invite members states
  const router = useRouter();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');
  const [allInviteUsers, setAllInviteUsers] = useState<any[]>([]);
  const [selectedInviteUserIds, setSelectedInviteUserIds] = useState<Set<string>>(new Set());
  const [isInviting, setIsInviting] = useState(false);

  // Find the latest pending order metadata
  const getLatestPendingOrder = () => {
    const resolvedIds = new Set<string>();
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.metadata && (msg.metadata.actionType === 'booking_approval' || msg.metadata.actionType === 'shop_approval')) {
        const status = msg.metadata.status;
        const id = msg.metadata.bookingId || msg.metadata.orderId;
        if (id && status && ['SELLER_CONFIRMED', 'SELLER_REJECTED', 'CONFIRMED', 'CANCELLED'].includes(status)) {
          resolvedIds.add(id);
        }
      }
    }

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.metadata && (msg.metadata.actionType === 'booking_approval' || msg.metadata.actionType === 'shop_approval')) {
        const status = msg.metadata.status;
        const id = msg.metadata.bookingId || msg.metadata.orderId;
        const sellerId = msg.metadata.sellerId;
        const buyerId = msg.metadata.buyerId;
        
        if (status && id && sellerId && buyerId && !resolvedIds.has(id) && 
            ['SUBMITTED', 'PENDING', 'BANK_TRANSFERRED', 'PAYMENT_REPORTED', 'WAITING_CONFIRMATION'].includes(status)) {
          return {
            id,
            domain: msg.metadata.domain || (msg.metadata.actionType === 'booking_approval' ? 'class' : 'shop'),
            status,
            sellerId,
            buyerId,
            msgId: msg.id,
            itemName: msg.metadata.itemName,
            actionType: msg.metadata.actionType
          };
        }
      }
    }
    return null;
  };

  const latestOrder = getLatestPendingOrder();
  const isSeller = latestOrder && user && latestOrder.sellerId === user.uid;

  const getStatusTranslation = (status: string) => {
    if (status === 'PAYMENT_REPORTED') return t('history.status_bank_transferred', '송금 완료');
    if (status === 'WAITING_CONFIRMATION') return t('history.status_confirming', '입금 확인중');
    const key = `history.status_${status.toLowerCase()}`;
    return t(key, status);
  };

  const getDomainTranslation = (domain: string) => {
    if (domain === 'class') return t('common.class_domain', '수업/모임');
    if (domain === 'shop') return t('common.shop_domain', '마켓');
    return domain;
  };
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [menuMsgId, setMenuMsgId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);


  // 톡방 전체 멤버 목록 (나를 포함)
  const allMembers = useMemo(() => {
    const list: any[] = [];
    if (user) {
      list.push({
        id: user.uid,
        name: user.displayName || 'Me',
        photoURL: user.photoURL,
        role: room?.admins?.includes(user.uid) ? 'admin' : 'member',
        joinedAt: null
      });
    }
    otherUsers.forEach((u: any) => {
      list.push({
        id: u.id,
        name: u.nickname || u.displayName || 'User',
        photoURL: u.photoURL,
        role: room?.admins?.includes(u.id) ? 'admin' : 'member',
        joinedAt: u.joinedAt || null
      });
    });
    return list;
  }, [user, otherUsers, room]);

  const isMessageMentionsMe = (msg: ChatMessage) => {
    if (!user || !msg.text) return false;
    const text = msg.text;
    const myName = user.displayName || '';
    if (myName && text.includes(`@${myName}`)) return true;
    if (text.includes('@all') || text.includes('@everyone')) return true;

    const isAdmin = room?.admins?.includes(user.uid) || false;
    if (isAdmin && text.includes('@admins')) return true;

    const myMemberInfo = allMembers.find((m: any) => m.id === user.uid);
    if (myMemberInfo?.joinedAt && text.includes('@newcomer')) {
      try {
        const joinedDate = safeDate(myMemberInfo.joinedAt);
        if (joinedDate) {
          const diffDays = (Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays <= 7) return true;
        }
      } catch (e) {}
    }
    return false;
  };

  // Woc Mentions List Generator
  const filteredMentionTargets = useMemo(() => {
    if (!isMentionOpen) return [];

    const targets = [
      {
        id: 'all',
        name: 'all',
        label: t('mention.everyone_label', '모두 언급'),
        desc: t('mention.everyone_desc', '대화방 내 모든 멤버에게 알림'),
        icon: 'notifications_active',
        isRole: true
      },
      {
        id: 'admins',
        name: 'admins',
        label: t('mention.admins_label', '운영진 언급'),
        desc: t('mention.admins_desc', '톡방 방장 및 관리자 그룹에게만 알림'),
        icon: 'military_tech',
        isRole: true
      },
      {
        id: 'newcomer',
        name: 'newcomer',
        label: t('mention.newcomers_label', '신입 멤버 언급'),
        desc: t('mention.newcomers_desc', '가입 7일 이내의 새내기 멤버들에게만 알림'),
        icon: 'nature_people',
        isRole: true
      }
    ];

    otherUsers.forEach((u: any) => {
      targets.push({
        id: u.id,
        name: u.nickname || u.displayName || 'User',
        label: u.nickname || u.displayName || 'User',
        desc: `@${u.nickname || u.displayName || 'User'}`,
        icon: u.photoURL || '',
        isRole: false
      });
    });

    if (!mentionFilter) return targets;
    return targets.filter(t => 
      t.name.toLowerCase().includes(mentionFilter) || 
      t.label.toLowerCase().includes(mentionFilter)
    );
  }, [isMentionOpen, mentionFilter, otherUsers, t]);

  const [isGroupMembersOpen, setIsGroupMembersOpen] = useState(false);
  const [isAccessBlocked, setIsAccessBlocked] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{msgId: string, url: string, type: 'image' | 'video', isOwn: boolean} | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{file: File | Blob, url: string, type: 'image' | 'video' | 'voice'} | null>(null);
  const closeSelectedMedia = () => setSelectedMedia(null);
  const handleMediaClose = closeSelectedMedia; // Replaced useHistoryBack
  const [messageLimit, setMessageLimit] = useState(50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);

  const [isNoticeCollapsed, setIsNoticeCollapsed] = useState(false);
  const [isNoticeDetailOpen, setIsNoticeDetailOpen] = useState(false);
  const [isStickerDrawerOpen, setIsStickerDrawerOpen] = useState(false);
  const [activeStickerTab, setActiveStickerTab] = useState<'daily' | 'animal' | 'neon'>('daily');
  const [isFeatureDrawerOpen, setIsFeatureDrawerOpen] = useState(false);
  const [currentNoticeIdx, setCurrentNoticeIdx] = useState(0);
  const [newNoticeText, setNewNoticeText] = useState('');
  const [isAddingNotice, setIsAddingNotice] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [bgOpacity, setBgOpacity] = useState(100);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatBgColor, setChatBgColor] = useState('#b2c7da');
  const [isSilentMode, setIsSilentMode] = useState(false);
  const [showSilentOption, setShowSilentOption] = useState(false);
  const longPressTimer = useRef<any>(null);

  // Auto-close silent push option chip when clicking outside
  useEffect(() => {
    const handleGlobalClick = () => {
      setShowSilentOption(false);
    };
    if (showSilentOption) {
      window.addEventListener('click', handleGlobalClick);
    }
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [showSilentOption]);

  // Load custom background color from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && roomId) {
      const savedColor = localStorage.getItem(`woc_chat_bg_color_${roomId}`);
      if (savedColor) {
        setChatBgColor(savedColor);
      } else {
        setChatBgColor('#b2c7da'); // 카톡 시그니처 기본값
      }
    }
  }, [roomId]);

  const handleBgColorChange = (color: string) => {
    setChatBgColor(color);
    if (typeof window !== 'undefined' && roomId) {
      localStorage.setItem(`woc_chat_bg_color_${roomId}`, color);
    }
  };

  // Merge current user (me) with other participants (online status sync included)
  const allParticipantsList = useMemo(() => {
    const list: any[] = [];
    if (user) {
      list.push({
        id: user.uid,
        nickname: user.displayName || '나',
        nativeNickname: (user as any).nativeNickname || '',
        photoURL: user.photoURL,
        isMe: true,
        isOnline: true
      });
    }
    const isGroup = room?.participants && room.participants.length > 2;
    if (isGroup) {
      otherUsers.forEach(u => {
        list.push({
          id: u.id || u.uid,
          nickname: u.nickname || u.displayName || 'User',
          nativeNickname: u.nativeNickname || '',
          photoURL: u.photoURL,
          isMe: false,
          isOnline: u.isOnline ?? false
        });
      });
    } else if (otherUser) {
      list.push({
        id: otherUser.id || otherUser.uid,
        nickname: otherUser.nickname || otherUser.displayName || 'User',
        nativeNickname: otherUser.nativeNickname || '',
        photoURL: otherUser.photoURL,
        isMe: false,
        isOnline: otherUser.isOnline ?? false
      });
    }
    return list;
  }, [user, room, otherUser, otherUsers]);

  const [isMeetupModalOpen, setIsMeetupModalOpen] = useState(false);
  const [meetupTitle, setMeetupTitle] = useState('');
  const [meetupDate, setMeetupDate] = useState('');
  const [meetupLocation, setMeetupLocation] = useState('');
  const [meetupMaxCapacity, setMeetupMaxCapacity] = useState('5');
  const [meetupDescription, setMeetupDescription] = useState('');

  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementTitle, setSettlementTitle] = useState('');
  const [settlementTotalAmount, setSettlementTotalAmount] = useState('');
  const [settlementBankName, setSettlementBankName] = useState('');
  const [settlementAccountNumber, setSettlementAccountNumber] = useState('');

  const handleCreateSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementTitle.trim() || !settlementTotalAmount || !settlementBankName || !settlementAccountNumber || !user || !room) return;

    try {
      const total = parseInt(settlementTotalAmount) || 0;
      const numParticipants = room.participants?.length || 1;
      const perPerson = Math.round(total / numParticipants);

      await chatService.sendSettlementMessage(roomId, user.uid, user.displayName || 'Anonymous', {
        title: settlementTitle.trim(),
        totalAmount: total,
        perPersonAmount: perPerson,
        bankName: settlementBankName.trim(),
        accountNumber: settlementAccountNumber.trim(),
        attendees: room.participants || [user.uid]
      });

      setSettlementTitle('');
      setSettlementTotalAmount('');
      setSettlementBankName('');
      setSettlementAccountNumber('');
      setIsSettlementModalOpen(false);
      toast.success(t('chat.settlement_proposed_toast', '1/N 정산 요청이 톡방에 공유되었습니다!'));
    } catch (err) {
      console.error("Failed to propose settlement:", err);
      toast.error(t('chat.settlement_failed_toast', '정산 요청에 실패했습니다.'));
    }
  };

  const handleCreateMeetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetupTitle.trim() || !user) return;

    try {
      await chatService.sendMessage({
        roomId,
        senderId: user.uid,
        senderName: user.displayName || 'Anonymous',
        text: meetupTitle.trim(),
        type: 'meetup',
        metadata: {
          date: meetupDate,
          location: meetupLocation.trim(),
          maxCapacity: parseInt(meetupMaxCapacity) || 0,
          attendees: [user.uid],
          description: meetupDescription.trim(),
          isConfirmed: false
        }
      });
      
      setMeetupTitle('');
      setMeetupDate('');
      setMeetupLocation('');
      setMeetupMaxCapacity('5');
      setMeetupDescription('');
      setIsMeetupModalOpen(false);
      toast.success(t('chat.meetup_proposed_toast', '새로운 대화 약속이 제안되었습니다!'));
    } catch (err) {
      console.error("Failed to propose meetup:", err);
      toast.error(t('chat.meetup_failed_toast', '약속 제안에 실패했습니다.'));
    }
  };

  // Woc Polls States & Handler
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [pollTitle, setPollTitle] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false);

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollTitle.trim() || !user || !room) return;

    const filteredOptions = pollOptions.map(o => o.trim()).filter(o => o !== '');
    if (filteredOptions.length < 2) {
      toast.error(t('poll.min_options_error', '최소 2개 이상의 투표 항목을 입력해 주세요.'));
      return;
    }

    try {
      const initialVotes: Record<string, string[]> = {};
      filteredOptions.forEach((_, idx) => {
        initialVotes[String(idx)] = [];
      });

      await chatService.sendMessage({
        roomId,
        senderId: user.uid,
        senderName: user.displayName || 'Anonymous',
        text: pollTitle.trim(),
        type: 'poll',
        metadata: {
          options: filteredOptions,
          votes: initialVotes,
          isClosed: false,
          allowMultiple: pollAllowMultiple
        }
      });

      setPollTitle('');
      setPollOptions(['', '']);
      setPollAllowMultiple(false);
      setIsPollModalOpen(false);
      toast.success(t('poll.created_toast', '새로운 톡방 투표가 생성되었습니다!'));
    } catch (err) {
      console.error("Failed to create poll:", err);
      toast.error(t('poll.create_failed_toast', '투표 생성에 실패했습니다.'));
    }
  };

  // Invite members useEffect & handler
  useEffect(() => {
    if (isInviteModalOpen && room) {
      userService.getAllUsers().then(users => {
        // Exclude users already in this chat room
        const activeParticipants = new Set(room.participants || []);
        setAllInviteUsers(users.filter(u => !activeParticipants.has(u.id)));
      }).catch(console.error);
    } else {
      setInviteSearchQuery('');
      setSelectedInviteUserIds(new Set());
      setAllInviteUsers([]);
    }
  }, [isInviteModalOpen, room]);

  const handleInviteUsers = async () => {
    if (!user || !room || selectedInviteUserIds.size === 0 || isInviting) return;
    setIsInviting(true);
    try {
      const inviteeIds = Array.from(selectedInviteUserIds);
      
      if (room.participants.length === 2) {
        // 1:1 chat -> Create a new custom group chat
        const allNewParticipants = Array.from(new Set([...room.participants, ...inviteeIds]));
        const newRoomId = await chatService.createGeneralGroupChatRoom(allNewParticipants, user.uid);
        
        setIsInviteModalOpen(false);
        // Navigate to the newly created room
        router.push(`/chat?roomId=${newRoomId}`);
        toast.success(t('chatroom.group_created_toast', '새로운 단체 대화방이 생성되었습니다!'));
      } else {
        // Group chat -> Invite directly into the existing room
        await chatService.inviteUser(room.id, inviteeIds);
        
        // Send join system messages for each invited user
        for (const invitedId of inviteeIds) {
          await chatService.sendGroupSystemMessage(room.id, invitedId, 'join');
        }
        
        setIsInviteModalOpen(false);
        toast.success(t('chatroom.users_invited_toast', '사용자가 초대되었습니다!'));
      }
    } catch (err) {
      console.error("Failed to invite users:", err);
      toast.error(t('common.error', '사용자 초대에 실패했습니다.'));
    } finally {
      setIsInviting(false);
    }
  };

  // 1-b. 브라우저 온라인 감지 및 펜딩 큐 동기화
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updatePending = () => {
      if ((chatService as any).getPendingMessages) {
        setPendingMessages((chatService as any).getPendingMessages(roomId));
      }
    };

    updatePending();

    const handleOnlineStatus = async () => {
      if (navigator.onLine && (chatService as any).processPendingQueue) {
        await (chatService as any).processPendingQueue();
        updatePending();
      }
    };

    window.addEventListener('online', handleOnlineStatus);
    const interval = setInterval(handleOnlineStatus, 3000);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      clearInterval(interval);
    };
  }, [roomId, messages]);

  const displayMessages = useMemo(() => {
    const localPending = pendingMessages.map(pm => ({
      ...pm,
      id: pm.tempId || `pending_${pm.timestamp?.seconds || Date.now()}`,
      timestamp: pm.timestamp || { seconds: Date.now() / 1000, nanoseconds: 0 },
      isPending: !navigator.onLine || !pm.isFailed,
      isFailed: pm.isFailed || false
    }));

    const filteredPending = localPending.filter(pm => {
      return !messages.some(m => m.senderId === pm.senderId && m.text === pm.text && Math.abs((m.timestamp?.seconds || 0) - (pm.timestamp?.seconds || 0)) < 10);
    });

    return [...messages, ...filteredPending];
  }, [messages, pendingMessages]);

  const handleTranslate = async (msgId: string, text: string) => {
    if (translations[msgId]) {
      const newTrans = { ...translations };
      delete newTrans[msgId];
      setTranslations(newTrans);
      setMenuMsgId(null);
      return;
    }

    setTranslatingIds(prev => new Set(prev).add(msgId));
    setMenuMsgId(null);
    try {
      const targetLang = navigator.language.split('-')[0] || 'en';
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
      const data = await res.json();
      const translatedText = data[0].map((item: any) => item[0]).join('');
      setTranslations(prev => ({ ...prev, [msgId]: translatedText }));
    } catch (err) {
      console.error('Translation failed', err);
      alert(t('chatroom.translation_failed'));
    } finally {
      setTranslatingIds(prev => {
        const next = new Set(prev);
        next.delete(msgId);
        return next;
      });
    }
  };
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingTimeRef = useRef<number>(0);

  const REACTION_EMOJIS = ['👍', '❤️', '🥰', '😂', '😮', '😢', '😡'];

  // 1. Subscribe to Messages & Room Info
  useEffect(() => {
    if (!user || !roomId) return;

    const unsubMessages = chatService.subscribeMessages(roomId, messageLimit, (newMsgs) => {
      setMessages(newMsgs);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`woc_chat_messages_${roomId}`, JSON.stringify(newMsgs));
      }
      // Mark as read logic
      chatService.resetUnreadCount(roomId, user.uid);
      
      // Mark individual messages as read in batch
      const unreadMsgIds = newMsgs
        .filter(msg => msg.readBy && !msg.readBy.includes(user.uid))
        .map(msg => msg.id);
        
      if (unreadMsgIds.length > 0) {
        // Using chatService to batch process them (assuming it exists or was added)
        if ((chatService as any).markMessagesAsReadBatch) {
          (chatService as any).markMessagesAsReadBatch(unreadMsgIds, user.uid);
        } else {
          // Fallback if not available
          unreadMsgIds.forEach(id => chatService.markMessageAsRead(id, user.uid));
        }
      }
    });

    const roomRef = doc(db, 'chat_rooms', roomId);
    const unsubRoom = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        setRoom({ id: docSnap.id, ...data } as ChatRoom);
        
        // Check typing status
        const typingArray = data.typing || [];
        const othersTyping = typingArray.filter((uid: string) => uid !== user.uid);
        setIsOtherTyping(othersTyping.length > 0);
      }
    });

    return () => {
      unsubMessages();
      unsubRoom();
    };
  }, [roomId, user, messageLimit]);

  useEffect(() => {
    if (!room || !user) return;
    
    const isGroup = room.participants && room.participants.length > 2;

    if (isGroup) {
      const fetchGroupUsers = async () => {
        try {
          const otherIds = room.participants.filter(p => p !== user.uid);
          const promises = otherIds.map(id => getDoc(doc(db, 'users', id)));
          const snaps = await Promise.all(promises);
          const users = snaps.filter(s => s.exists()).map(s => s.data());
          setOtherUsers(users);
        } catch (err) {
          console.error("Failed to fetch group users", err);
        }
      };
      fetchGroupUsers();
    } else if (room.type === 'private' || room.type === 'personal' || room.type === 'business') {
      const otherUserId = room.participants.find(p => p !== user.uid);
      if (otherUserId) {
        const fetchUser = async () => {
          try {
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            if (userDoc.exists()) {
              setOtherUser(userDoc.data());
            }
          } catch (err) {
            console.error("Failed to fetch other user", err);
          }
        };
        fetchUser();
      }
    }

    // Group chat access control
    if (room.type === 'groups') {
      const isAlreadyMember = room.participants?.includes(user.uid);
      if (room.joinPolicy === 'open' && room.linkedGroupId) {
        // Open groups: auto-join on entry
        if (!isAlreadyMember) {
          chatService.autoJoinGroupChat(room.linkedGroupId, user.uid);
        }
        setIsAccessBlocked(false);
      } else if (!isAlreadyMember) {
        // Approval/Invite groups: block non-members
        setIsAccessBlocked(true);
      } else {
        setIsAccessBlocked(false);
      }
    }
  }, [room, user]);

  // 2. Scroll to Bottom or Maintain Scroll Pos
  useEffect(() => {
    if (scrollRef.current) {
      if (isLoadingMore) {
        // Restore scroll position after loading older messages
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevScrollHeightRef.current;
        setIsLoadingMore(false);
      } else {
        // Scroll to bottom on new message
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0 && messages.length >= messageLimit) {
      prevScrollHeightRef.current = e.currentTarget.scrollHeight;
      setIsLoadingMore(true);
      setMessageLimit(prev => prev + 50);
    }
  };

  // 3. Send Logic
  const handleSend = async () => {
    if (!inputText.trim() || !user) return;
    const text = inputText;
    setInputText('');
    
    // 로컬에서 감정 팡팡 이펙트 즉각 선제 트리거
    triggerEmotionEffect(text);
    
    await chatService.sendMessage({
      roomId,
      senderId: user.uid,
      senderName: user.displayName || 'Anonymous',
      text,
      type: 'text',
      replyTo: replyTo?.id,
      metadata: isSilentMode ? { isSilent: true } : undefined
    });
    setReplyTo(null);
    setIsSilentMode(false); // Reset to normal send after one-shot silent push
  };

  const startLongPress = (e: React.MouseEvent | React.TouchEvent) => {
    if (!inputText.trim()) return;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setShowSilentOption(true);
    }, 500); // Trigger after 500ms
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  // 4. File Upload Logic
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const type: MessageType = file.type.startsWith('image/') ? 'image' : 'video';
    const url = URL.createObjectURL(file);
    setPreviewMedia({ file, url, type });
    e.target.value = '';
  };

  const confirmAndSendMedia = async () => {
    if (!previewMedia || !user) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const { file, type } = previewMedia;
      const extension = type === 'voice' ? 'webm' : (file instanceof File ? file.name.split('.').pop() : 'bin');
      const path = `chat/${roomId}/${Date.now()}_media.${extension}`;
      const url = await chatService.uploadChatMedia(file, path, (p) => setUploadProgress(Math.round(p)));

      const defaultText = type === 'image' ? t('chatroom.sent_photo') : type === 'video' ? t('chatroom.sent_video') : t('chatroom.sent_voice');
      await chatService.sendMessage({
        roomId,
        senderId: user.uid,
        senderName: user.displayName || 'Anonymous',
        text: defaultText,
        type,
        mediaUrl: url
      });
      setPreviewMedia(null);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const cancelMediaPreview = () => {
    if (previewMedia?.url) URL.revokeObjectURL(previewMedia.url);
    setPreviewMedia(null);
  };

  // 5. Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size < 100) return;

        const url = URL.createObjectURL(audioBlob);
        setPreviewMedia({ file: audioBlob, url, type: 'voice' });
      };

      recorder.start();
      setIsRecording(true);
      setRecordDuration(0);
      timerRef.current = setInterval(() => setRecordDuration(p => p + 1), 1000);
    } catch (err) {
      alert(t('chatroom.mic_permission_needed'));
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // UI Helpers
  const formatTime = (ts: any) => {
    const date = safeDate(ts);
    if (!date) return '';
    return formatDate(date, 'timeOnly');
  };

  const renderMessageText = (msg: ChatMessage) => {
    const text = msg.text;
    
    // Helper to extract value by key (supports English and Korean labels)
    const getVal = (lines: string[], keys: string[]) => {
      const line = lines.find(l => keys.some(k => l.toLowerCase().includes(k.toLowerCase())));
      return line ? line.split(':').slice(1).join(':').trim() : null;
    };

    // System Message Tags (Source of truth in code, localized in LanguageContext)
    const TAGS = {
      ORDER_PLACED: ['[ORDER PLACED]', '[새 주문 알림]', '[주문 완료]'],
      PAYMENT_REPORTED: ['[PAYMENT REPORTED]', '[입금 완료 보고]', '[결제 보고됨]'],
      PRODUCT_INQUIRY: ['[PRODUCT INQUIRY]', '[상품 문의]'],
      STAY_BOOKING: ['[STAY BOOKING]', '[숙소 예약]', '[스테이 예약]'],
      STAY_PAYMENT: ['[STAY PAYMENT]', '[숙소 입금]', '[스테이 결제]'],
      RENTAL_INQUIRY: ['[RENTAL INQUIRY]', '[대관 문의]', '[렌탈 문의]']
    };

    // 1. Order Placed Card
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

    // 2. Payment Reported Card
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

    // 3. Product Inquiry Card
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

    // 4. Stay Booking Card
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

    // 5. Stay Payment Reported Card
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

    // 6. Rental Inquiry Card
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
        displayString = t('chat.system_join', { name });
      } catch (e) {}
    } else if (displayString.startsWith('chat.system_leave_params::')) {
      try {
        const paramsStr = displayString.split('chat.system_leave_params::')[1];
        const { name } = JSON.parse(paramsStr);
        displayString = t('chat.system_leave', { name });
      } catch (e) {}
    } else if (displayString.startsWith('chat.system_kick_params::')) {
      try {
        const paramsStr = displayString.split('chat.system_kick_params::')[1];
        const { name } = JSON.parse(paramsStr);
        displayString = t('chat.system_kick', { name });
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

  // Access blocked screen for non-member group chats
  if (isAccessBlocked && room) {
    return (
      <div className="flex flex-col h-full bg-white relative overflow-hidden font-manrope">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4 bg-white/80 backdrop-blur-xl z-20 sticky top-0">
          <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all text-gray-500">
            <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
          </button>
          <h2 className="text-lg font-bold text-gray-900 truncate">{room.name || t('chatroom.group_chat', 'Group Chat')}</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-slate-400">lock</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t('chatroom.members_only', 'Members Only')}</h3>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
            {t('chatroom.members_only_desc', 'This group chat is only accessible to group members. Join the group first to participate in this chat.')}
          </p>
          <button
            onClick={onBack}
            className="mt-8 px-8 py-3 bg-[#0057bd] text-white font-bold rounded-xl hover:bg-[#00469b] active:scale-95 transition-all shadow-lg shadow-blue-900/10"
          >
            {t('chatroom.go_back', 'Go Back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col h-full bg-white relative overflow-hidden font-manrope transition-opacity duration-150"
      style={{ opacity: bgOpacity / 100 }}
    >
      {/* Header */}
      {(room?.participants && room.participants.length <= 2) ? (
        <div className="px-4.5 py-2.5 border-b border-gray-100/50 flex items-center justify-between bg-white/80 backdrop-blur-xl z-20 sticky top-0">
          <div className="flex items-center gap-4.5">
            <button onClick={onBack} className="md:hidden w-8.5 h-8.5 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all text-gray-500">
              <span className="material-symbols-outlined text-[18px]">arrow_back_ios_new</span>
            </button>
            <UserBadge
              uid={room.participants.find(p => p !== user?.uid) || ''}
              nickname={otherUser?.nickname || otherUser?.displayName || t('chatroom.unknown', 'Unknown')}
              nativeNickname={otherUser?.nativeNickname}
              photoURL={otherUser?.photoURL}
              avatarSize="w-9 h-9 ring-2 ring-white shadow-xs"
              nameClassName="text-[15.5px] font-black text-gray-900 uppercase tracking-tighter line-clamp-1 hover:text-primary transition-colors"
              nativeClassName="text-[11px] font-medium text-gray-500 normal-case tracking-normal ml-1.5"
              subText={
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{otherUser?.location || t('chatroom.default_location', 'Seoul, Korea')}</span>
                </div>
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
              title="메뉴"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4.5 py-2.5 border-b border-gray-100/50 flex items-center justify-between bg-white z-20 sticky top-0">
          <div className="flex items-center gap-4.5">
            <button onClick={onBack} className="md:hidden w-8.5 h-8.5 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all text-gray-500">
              <span className="material-symbols-outlined text-[18px]">arrow_back_ios_new</span>
            </button>
            <div className="flex flex-col">
              <h2 className="text-[15.5px] font-black text-gray-900 uppercase tracking-tighter line-clamp-1">
                {room?.name || otherUsers.map(u => u.nickname || u.displayName).join(', ') || t('chatroom.room_chat')}
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{room?.participants ? t('chatroom.members_count', { count: room.participants.length }) : t('chatroom.live_syncing')}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
              title="메뉴"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
          </div>
        </div>
      )}

      {/* Pinned Sticky Notice */}
      {(() => {
        const notices: string[] = (room as any)?.notices || (room?.notice ? [room.notice] : []);
        if (notices.length === 0 || isNoticeCollapsed) return null;
        
        // 인덱스 바운더리 검증 및 보정
        const activeIdx = Math.min(currentNoticeIdx, notices.length - 1);
        const activeNotice = notices[activeIdx] || '';

        return (
          <div className="bg-[#fcfcff] border-b border-blue-50/50 px-5 py-2.5 flex items-center justify-between gap-3 shadow-xs sticky top-0 z-10 transition-all duration-300">
            <div className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer" onClick={() => setIsNoticeDetailOpen(true)}>
              <span className="material-symbols-outlined text-[20px] text-blue-500 shrink-0">campaign</span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">{t('chatroom.notice_title', '톡공지')}</div>
                <p className="text-[12.5px] font-bold text-gray-700 truncate">{activeNotice}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {notices.length > 1 && (
                <div className="flex items-center gap-1 bg-blue-50/70 border border-blue-100/30 px-2 py-0.5 rounded-full shrink-0">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentNoticeIdx(prev => (prev > 0 ? prev - 1 : notices.length - 1)); }}
                    className="text-blue-500 hover:text-blue-700 active:scale-90 transition-transform font-black text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center bg-white shadow-xs"
                  >
                    ‹
                  </button>
                  <span className="text-[9px] font-black text-blue-600/90 tracking-tighter select-none scale-90 px-0.5">
                    {activeIdx + 1}/{notices.length}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentNoticeIdx(prev => (prev < notices.length - 1 ? prev + 1 : 0)); }}
                    className="text-blue-500 hover:text-blue-700 active:scale-90 transition-transform font-black text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center bg-white shadow-xs"
                  >
                    ›
                  </button>
                </div>
              )}
              <button 
                onClick={() => setIsNoticeCollapsed(true)}
                className="text-[10.5px] font-black text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-50 transition-all"
              >
                {t('chatroom.notice_hide_once', '접기')}
              </button>
            </div>
          </div>
        );
      })()}

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar transition-all duration-300"
        style={{ backgroundColor: chatBgColor }}
      >
        {displayMessages.map((msg, idx) => {
          const isOwn = msg.senderId === user?.uid;
          const prevTimestamp = idx > 0 ? safeDate(displayMessages[idx-1]?.timestamp)?.toDateString() : null;
          const currentTimestamp = safeDate(msg.timestamp)?.toDateString();
          const showDate = idx === 0 || prevTimestamp !== currentTimestamp;

          // Read Status calculation helpers
          const isGroupChat = room?.participants && room.participants.length > 2;
          const readCount = msg.readBy ? msg.readBy.length : 1;
          const isAllRead = msg.readBy && room?.participants && msg.readBy.length === room.participants.length;

          // 아무도 안 읽은 상태에서 삭제된 경우 렌더링 생략
          const isDeletedMsg = msg.isDeleted === true;
          const otherReadCount = msg.readBy ? msg.readBy.filter((uId: string) => uId !== msg.senderId).length : 0;
          if (isDeletedMsg && otherReadCount === 0) {
            return null;
          }

          return (
            <React.Fragment key={msg.id}>
              {showDate && currentTimestamp && (
                <div className="flex justify-center my-10">
                  <div className="px-5 py-1.5 bg-gray-100/50 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {(() => {
                      const d = safeDate(msg.timestamp);
                      if (!d) return t('chatroom.today');
                      const now = new Date();
                      const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
                      const yesterday = new Date(now);
                      yesterday.setDate(yesterday.getDate() - 1);
                      if (isSameDay(d, now)) return t('chatroom.today');
                      if (isSameDay(d, yesterday)) return t('chatroom.yesterday');
                      return formatDate(d, 'dateOnly');
                    })()}
                  </div>
                </div>
              )}

              <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} group max-w-[85%] ${isOwn ? 'ml-auto' : ''}`}>
                {/* Sender Name */}
                {!isOwn && (
                  <div className="mb-2 ml-1">
                    <UserBadge 
                      uid={msg.senderId} 
                      nickname={msg.senderName} 
                      avatarSize="w-6 h-6"
                      nameClassName="text-[10px] font-black text-gray-400 uppercase tracking-tighter cursor-pointer hover:text-primary transition-colors"
                      isCol={true}
                    />
                  </div>
                )}

                <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {/* Bubble */}
                  <div 
                    onClick={async () => {
                      if (!msg.isDeleted) {
                        setMenuMsgId(menuMsgId === msg.id ? null : msg.id);
                        if (msg.type === 'text' || !msg.type) {
                          try {
                            await navigator.clipboard.writeText(msg.text);
                            toast.success(t('chatroom.copied_toast', '텍스트가 복사되었습니다!'));
                          } catch (err) {
                            console.error('Failed to copy text:', err);
                          }
                        }
                      }
                    }}
                    className={`relative text-[14px] font-medium leading-relaxed transition-all duration-300 ${
                      !msg.isDeleted && msg.type === 'sticker'
                        ? 'bg-transparent shadow-none border-none px-0 py-0'
                        : !msg.isDeleted && (msg.type === 'image' || msg.type === 'video')
                          ? `rounded-[20px] overflow-hidden ${isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'} bg-transparent shadow-sm`
                          : `px-5 py-3.5 rounded-3xl shadow-sm ${
                              isOwn 
                                ? (isAllRead
                                    ? 'bg-blue-100 text-blue-900 rounded-tr-sm border border-blue-200/50' 
                                    : 'bg-primary text-white rounded-tr-sm') 
                                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm hover:border-primary/20'
                            } ${isMessageMentionsMe(msg) ? 'mention-glow' : ''}`
                    } ${menuMsgId === msg.id ? 'scale-[1.02] shadow-xl' : ''}`}
                  >
                    {/* Silent Push Badge & Tooltip */}
                    {!msg.isDeleted && msg.type !== 'sticker' && msg.metadata?.isSilent && (
                      <div className={`absolute top-1.5 ${isOwn ? 'left-2' : 'right-2'} group/silent z-30 select-none cursor-help`}>
                        <div className="w-4 h-4 flex items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200/80 border border-slate-200/60 shadow-sm text-slate-400/90 hover:text-[#4682b4] hover:scale-105 transition-all">
                          <span className="material-symbols-outlined text-[10px] leading-none">notifications_paused</span>
                        </div>
                        {/* Tooltip */}
                        <div className={`absolute bottom-full mb-1 hidden group-hover/silent:block bg-gradient-to-r from-slate-800 to-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-lg whitespace-nowrap z-50 ${isOwn ? 'left-0' : 'right-0'} animate-in fade-in zoom-in duration-150`}>
                          {t('chat.silent_send_tooltip', '상대를 배려하여 소리 없이 전송된 메시지입니다.')}
                        </div>
                      </div>
                    )}

                    {/* Reply Context */}
                    {msg.replyTo && (
                      <div className={`mb-3 p-2 rounded-xl text-[11px] border-l-4 ${
                        (msg.type === 'image' || msg.type === 'video')
                          ? 'bg-gray-100 border-gray-300 text-gray-800 mx-2 mt-2'
                          : isOwn ? 'bg-white/10 border-white/30' : 'bg-gray-50 border-primary/30'
                      }`}>
                        <div className="font-black uppercase tracking-tighter mb-0.5 opacity-60">{t('chatroom.replied_to_message')}</div>
                        <div className="line-clamp-1 opacity-80">{messages.find(m => m.id === msg.replyTo)?.text || t('chatroom.message_not_found')}</div>
                      </div>
                    )}

                    {msg.isDeleted ? (
                      <div className="flex items-center gap-2 opacity-50 py-1">
                        <span className="material-symbols-outlined text-[16px]">block</span>
                        <span className="text-[13px] italic">{t('chatroom.message_deleted')}</span>
                      </div>
                    ) : msg.type === 'voice' ? (
                      <VoiceBubble url={msg.mediaUrl!} isOwn={isOwn} timestamp={formatTime(msg.timestamp)} />
                    ) : msg.type === 'image' ? (
                      <div className="relative group bg-gray-100 flex items-center justify-center min-h-[100px] min-w-[100px]" onClick={(e) => { e.stopPropagation(); setSelectedMedia({ msgId: msg.id, url: msg.mediaUrl!, type: 'image', isOwn }); }}>
                        <img src={msg.mediaUrl} className="max-w-full max-h-[300px] object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in block" />
                      </div>
                    ) : msg.type === 'video' ? (
                      <div className="relative group cursor-pointer bg-gray-100 flex items-center justify-center min-h-[100px] min-w-[100px]" onClick={(e) => { e.stopPropagation(); setSelectedMedia({ msgId: msg.id, url: msg.mediaUrl!, type: 'video', isOwn }); }}>
                        <video src={msg.mediaUrl} className="max-w-full max-h-[300px] object-cover block" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined text-white text-4xl">play_circle</span>
                        </div>
                      </div>
                    ) : msg.type === 'meetup' ? (
                      <MeetupCard message={msg} />
                    ) : msg.type === 'remittance' ? (
                      <SettlementCard message={msg} />
                    ) : msg.type === 'poll' ? (
                      <PollCard message={msg} />
                    ) : msg.type === 'sticker' ? (
                      <div className="py-1 select-none pointer-events-none animate-in zoom-in-50 duration-300">
                        <img 
                          src={`/images/stickers/${
                            [...EMOTICONS_DAILY, ...EMOTICONS_ANIMAL, ...EMOTICONS_NEON].find(s => s.id === msg.text)?.fileId || msg.text
                          }.png`} 
                          alt={msg.text} 
                          className="w-[120px] h-[120px] object-contain hover:scale-105 transition-transform duration-300 mix-blend-multiply"
                        />
                      </div>
                    ) : (
                      <div>{renderMessageText(msg)}</div>
                    )}

                    {/* Grouped Reactions */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div 
                        className={`absolute -bottom-3.5 flex gap-1 z-20 ${
                          isOwn ? 'left-3' : 'right-3'
                        }`}
                      >
                        {getGroupedReactions(msg.reactions).map(([emoji, data]) => {
                          const userNames = data.users.map(uId => {
                            if (uId === user?.uid) return t('common.me', '나');
                            const matchUser = otherUsers.find(ou => ou.id === uId) || otherUser;
                            return matchUser?.nickname || matchUser?.displayName || t('common.unknown_user', 'User');
                          }).join(', ');
                          
                          return (
                            <button 
                              key={emoji}
                              onClick={(e) => {
                                e.stopPropagation();
                                chatService.toggleReaction(msg.id, user?.uid || '', emoji);
                              }}
                              title={userNames}
                              className="bg-white px-2 py-0.5 rounded-full shadow-md border border-gray-100/80 hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-1 text-[11px] font-bold text-gray-700 animate-in zoom-in"
                            >
                              <span>{emoji}</span>
                              {data.count > 1 && <span className="text-[10px] text-gray-400 font-extrabold">{data.count}</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Meta (Time / Status) */}
                  <div className="flex flex-col gap-0.5 items-center justify-end pb-1 shrink-0">
                    {msg.isPending && (
                      <div className="flex items-center gap-1 opacity-60">
                        <svg className="animate-spin h-3.5 w-3.5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-[9px] font-bold text-primary tracking-widest">{t('chat.pending', '전송중')}</span>
                      </div>
                    )}
                    {msg.isFailed && (
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const { id, isPending, isFailed, ...clean } = msg;
                            if ((chatService as any).removePendingMessage) {
                              (chatService as any).removePendingMessage(msg.tempId || msg.id);
                            }
                            await chatService.sendMessage(clean);
                          } catch (err) {
                            console.error("Manual resend failed:", err);
                          }
                        }}
                        className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors"
                        title={t('chat.failed_click_retry', '전송 실패 - 클릭하여 재시도')}
                      >
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        <span className="text-[9px] font-bold tracking-widest uppercase">{t('chat.retry', '재시도')}</span>
                      </button>
                    )}
                    {!msg.isPending && !msg.isFailed && (
                      <>
                        {isGroupChat ? (
                          !isAllRead && (
                            <span className="text-[10px] font-black text-amber-500 tracking-tighter leading-none mb-0.5 animate-in fade-in select-none">
                              {readCount}읽음
                            </span>
                          )
                        ) : (
                          !isAllRead && (
                            <span className="text-[10px] font-black text-amber-500 tracking-tighter leading-none mb-0.5 animate-in fade-in select-none">
                              1
                            </span>
                          )
                        )}
                        <span className="text-[10px] font-bold text-gray-300 uppercase shrink-0">
                          {formatTime(msg.timestamp)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Message Menu (Context Actions) */}
                <AnimatePresence>
                  {menuMsgId === msg.id && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className={`flex flex-col gap-2 mt-3 ${isOwn ? 'items-end' : 'items-start'}`}
                    >
                      {/* Functional Buttons Line */}
                      <div className="flex gap-1 bg-white p-1.5 rounded-full shadow-sm border border-gray-100">
                        <button 
                          onClick={() => { setReplyTo(msg); setMenuMsgId(null); }}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all text-gray-500"
                        >
                          <span className="material-symbols-outlined text-[18px]">reply</span>
                        </button>
                        <button 
                          onClick={() => handleTranslate(msg.id, msg.text)}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all text-gray-500"
                        >
                          <span className="material-symbols-outlined text-[18px]">translate</span>
                        </button>
                        {msg.type === 'text' && !msg.isDeleted && (
                          <button 
                            onClick={async () => {
                              try {
                                const notices = (room as any)?.notices || (room?.notice ? [room.notice] : []);
                                if (notices.length >= 5) {
                                  toast.error(t('chatroom.notice_limit_exceeded', '공지는 최대 5개까지만 등록할 수 있습니다.'));
                                  return;
                                }
                                await chatService.addRoomNotice(roomId, msg.text, notices);
                                setMenuMsgId(null);
                                toast.success(t('chat.notice_added_toast', '새 공지가 등록되었습니다.'));
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-blue-50 hover:text-blue-500 transition-all text-gray-500"
                            title={t('chatroom.set_as_notice', '공지 등록')}
                          >
                            <span className="material-symbols-outlined text-[18px]">campaign</span>
                          </button>
                        )}
                        {isOwn && (
                          <button 
                            onClick={() => { chatService.updateMessage(msg.id, { isDeleted: true, text: t('chatroom.deleted_message') }); setMenuMsgId(null); }}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all text-gray-500"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                      
                      {/* Emojis Line */}
                      <div className="flex gap-1.5 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                        {REACTION_EMOJIS.map(emoji => (
                          <button 
                            key={emoji}
                            onClick={() => {
                              chatService.toggleReaction(msg.id, user?.uid || '', emoji);
                              setMenuMsgId(null);
                            }}
                            className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 hover:scale-110 transition-all text-[18px]"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Typing Indicator */}
      <AnimatePresence>
        {isOtherTyping && (
          <motion.div 
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            className="px-6 pb-2 flex items-center gap-2 text-gray-400 text-xs font-medium"
          >
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            {otherUser?.displayName ? t('chatroom.is_typing', { name: otherUser.displayName }) : t('chatroom.someone_is_typing')}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="w-full relative z-30 bg-white">
        {/* Reply Preview */}
        <AnimatePresence>
          {replyTo && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gray-50 rounded-2xl mb-4 p-4 flex items-center justify-between border-l-4 border-primary"
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{t('chatroom.replying_to', { name: replyTo.senderName })}</span>
                <p className="text-[13px] font-medium text-gray-500 line-clamp-1">{replyTo.text}</p>
              </div>
              <button 
                onClick={() => setReplyTo(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all text-gray-400"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Media Preview */}
        <AnimatePresence>
          {previewMedia && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white rounded-2xl mb-4 p-4 flex flex-col gap-3 border border-gray-100 shadow-sm"
            >
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-black text-gray-900 uppercase tracking-widest">
                  {previewMedia.type === 'voice' ? t('chatroom.voice_message_preview') : t('chatroom.media_preview')}
                </span>
                <button 
                  onClick={cancelMediaPreview}
                  disabled={isUploading}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all text-gray-500"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              
              <div className="flex justify-center bg-gray-50 rounded-xl overflow-hidden min-h-[100px] relative border border-gray-100">
                {previewMedia.type === 'image' && <img src={previewMedia.url} className="max-h-[200px] object-contain p-2" />}
                {previewMedia.type === 'video' && <video src={previewMedia.url} controls className="max-h-[200px]" />}
                {previewMedia.type === 'voice' && <audio src={previewMedia.url} controls className="w-full m-4" />}
                
                {isUploading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span className="text-[10px] font-black text-primary uppercase">{t('chatroom.uploading', { progress: uploadProgress })}</span>
                  </div>
                )}
              </div>
              
              {!isUploading && (
                <div className="flex justify-end">
                  <button
                    onClick={confirmAndSendMedia}
                    className="px-6 py-2.5 bg-primary text-white text-[13px] font-black uppercase tracking-wide rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                  >
                    <span>{t('chatroom.send_media', { type: t(`chatroom.${previewMedia.type}`) })}</span>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Kakao-style Integrated Input Area */}
        <div className="w-full bg-white border-t border-gray-200/80 p-2.5 pb-3 flex flex-col shrink-0">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*,video/*"
          />
          <input 
            type="file" 
            ref={albumInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*"
          />
          <input 
            type="file" 
            ref={cameraInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*"
            capture="environment"
          />
          <input 
            type="file" 
            ref={videoInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="video/*"
          />

          {/* Line 1: Rich Text Input (No Border) */}
          <div className="w-full min-h-[48px] sm:min-h-[56px] relative">
            {/* Smart Mention Suggestion Popup Menu */}
            <AnimatePresence>
              {isMentionOpen && filteredMentionTargets.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  className="absolute bottom-full left-0 right-0 mb-3 bg-white/95 backdrop-blur-md border border-gray-100 rounded-3xl p-3 shadow-xl z-[150] flex flex-col gap-1.5 max-h-[220px] overflow-y-auto no-scrollbar dark:bg-zinc-900/95 dark:border-zinc-800 text-left"
                >
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2 pb-1 border-b border-gray-100/50 dark:border-zinc-800">
                    {t('poll.options_label', '멘션 대상 선택')}
                  </div>
                  {filteredMentionTargets.map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => handleSelectMention(target.name)}
                      className="w-full flex items-center justify-between p-2 rounded-2xl hover:bg-primary/5 active:scale-99 transition-all text-left group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {target.isRole ? (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm ${
                            target.id === 'all' 
                              ? 'bg-gradient-to-br from-pink-500 to-rose-500' 
                              : target.id === 'admins'
                                ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                                : 'bg-gradient-to-br from-emerald-400 to-teal-500'
                          }`}>
                            <span className="material-symbols-outlined text-[18px]">{target.icon}</span>
                          </div>
                        ) : (
                          target.icon ? (
                            <img src={target.icon} className="w-8 h-8 rounded-full object-cover shrink-0 shadow-sm" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-black text-xs uppercase shadow-sm">
                              {target.name.charAt(0)}
                            </div>
                          )
                        )}
                        
                        <div className="min-w-0 flex flex-col justify-center">
                          <span className={`text-[13px] font-black leading-none mb-0.5 truncate ${
                            target.isRole
                              ? target.id === 'all'
                                ? 'text-pink-500'
                                : target.id === 'admins'
                                  ? 'text-amber-600 dark:text-amber-500'
                                  : 'text-emerald-600 dark:text-emerald-500'
                              : 'text-gray-800 dark:text-zinc-100'
                          }`}>
                            {target.label}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold truncate">{target.desc}</span>
                        </div>
                      </div>
                      
                      <span className="material-symbols-outlined text-[16px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                        arrow_forward_ios
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <textarea 
              value={inputText}
              onChange={(e) => {
                handleInputChange(e.target.value);
                if (user && roomId) {
                  const now = Date.now();
                  if (now - lastTypingTimeRef.current > 2000) {
                    chatService.setTypingStatus(roomId, user.uid, true);
                    lastTypingTimeRef.current = now;
                  }
                  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = setTimeout(() => {
                    chatService.setTypingStatus(roomId, user.uid, false);
                    lastTypingTimeRef.current = 0;
                  }, 2000);
                }
              }}
              onFocus={() => {
                setIsInputFocused(true);
                setIsStickerDrawerOpen(false);
                setIsFeatureDrawerOpen(false);
              }}
              onBlur={() => {
                setTimeout(() => setIsInputFocused(false), 150);
              }}
              disabled={isRecording}
              placeholder={isRecording ? t('chatroom.recording') : t('chatroom.type_message')}
              className="w-full bg-transparent border-none focus:ring-0 focus:border-none text-[14px] sm:text-[15px] leading-[22px] font-medium placeholder:text-gray-400 text-gray-900 resize-none py-1 px-1 no-scrollbar disabled:opacity-50 min-h-[38px] sm:min-h-[46px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>

          {/* Line 2: Toolbar & Send Button */}
          <div className="flex justify-between items-center w-full mt-1">
            {/* Left Toolbar Icons */}
            <div className="flex items-center gap-4 sm:gap-5.5">
              {/* Plus More Feature */}
              <button 
                disabled={isRecording}
                onClick={() => {
                  setIsFeatureDrawerOpen(!isFeatureDrawerOpen);
                  setIsStickerDrawerOpen(false);
                }}
                className={`w-7 h-7 flex items-center justify-center transition-all ${
                  isFeatureDrawerOpen ? 'text-primary scale-110' : 'text-gray-400 hover:text-gray-600'
                }`}
                title={t('chat.more_features', '더보기')}
              >
                <span className="material-symbols-outlined text-[23px] sm:text-[25px]">add</span>
              </button>

              {/* Emoticon Smiley */}
              {!isRecording && (
                <button 
                  onClick={() => {
                    setIsStickerDrawerOpen(!isStickerDrawerOpen);
                    setIsFeatureDrawerOpen(false);
                  }}
                  className={`w-7 h-7 flex items-center justify-center shrink-0 relative transition-all ${
                    isStickerDrawerOpen ? 'text-primary scale-110' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title={t('chatroom.sticker_title', '이모티콘')}
                >
                  <span className="material-symbols-outlined text-[22px] sm:text-[24px]">sentiment_satisfied</span>
                  {/* Small Red/Orange Notification Dot on top right */}
                  <span className="absolute top-0.5 right-0.5 w-[5px] h-[5px] sm:w-[6px] sm:h-[6px] bg-red-500 rounded-full ring-1 ring-white" />
                </button>
              )}
            </div>

            {/* Right Opacity Slider & Send Combo */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Opacity Control Slider (Exactly like Kakao PC) */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="relative flex items-center w-20 md:w-24 group">
                  <input 
                    type="range" 
                    min="20" 
                    max="100" 
                    value={bgOpacity}
                    onChange={(e) => setBgOpacity(parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-400/80 hover:accent-primary focus:outline-none"
                    style={{
                      background: `linear-gradient(to right, #9ca3af 0%, #9ca3af ${((bgOpacity - 20) / 80) * 100}%, #e5e7eb ${((bgOpacity - 20) / 80) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-400 absolute right-0 border border-white translate-x-1/2 pointer-events-none group-hover:bg-primary transition-colors" />
                </div>
              </div>

              {/* Send Button Combo */}
              <div className="flex items-center shrink-0 relative">
                {/* Silent Push Option Chip */}
                {showSilentOption && (
                  <div className="absolute bottom-full right-0 mb-2 z-50 bg-white border border-gray-200 shadow-xl rounded-lg p-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSilentMode(true);
                        setShowSilentOption(false);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-700 rounded-md transition-all whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#4682b4] animate-pulse">notifications_paused</span>
                      <span className="text-[12px] font-bold">{t('chat.silent_send_option', '조용히 보내기')}</span>
                    </button>
                  </div>
                )}

                {isRecording ? (
                  <div className="flex items-center gap-2 px-1 animate-in fade-in zoom-in">
                    <span className="text-[12px] font-black text-red-500 animate-pulse">{Math.floor(recordDuration/60)}:{(recordDuration%60).toString().padStart(2, '0')}</span>
                    <button 
                      onClick={stopRecording}
                      className="w-8 h-8 shrink-0 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md shadow-red-500/20"
                    >
                      <span className="material-symbols-outlined text-[16px]">stop</span>
                    </button>
                  </div>
                ) : isSilentMode ? (
                  <div className="flex items-center rounded-[4px] bg-gradient-to-r from-slate-400 to-[#4682b4] hover:from-slate-500 hover:to-[#36648b] text-white transition-all shadow-md shadow-[#4682b4]/20 select-none">
                    <button 
                      onClick={() => setIsSilentMode(false)}
                      className="px-4 py-1.5 text-[12px] sm:text-[13px] font-black tracking-tighter flex items-center gap-1.5 text-white"
                    >
                      <span className="material-symbols-outlined text-[16px] animate-bounce">notifications_paused</span>
                      <span>{t('chat.silent_mode_badge', '조용히')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center rounded-[4px] bg-[#f9f9f9] border border-gray-200 hover:bg-gray-100 transition-all select-none">
                    <button 
                      onClick={handleSend}
                      onMouseDown={startLongPress}
                      onMouseUp={cancelLongPress}
                      onMouseLeave={cancelLongPress}
                      onTouchStart={startLongPress}
                      onTouchEnd={cancelLongPress}
                      disabled={!inputText.trim()}
                      className="px-4.5 py-1.5 text-[12px] sm:text-[13px] font-black tracking-tighter text-[#5c5c5c] disabled:opacity-40 disabled:hover:bg-[#f9f9f9]"
                    >
                      {t('chatroom.send', '전송')}
                    </button>
                    {/* Vertical separator */}
                    <div className="w-[1px] h-3.5 bg-gray-300" />
                    {/* Dropdown arrow */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info(t('chatroom.send_info', 'Enter 키로 전송 가능합니다!'));
                      }}
                      className="px-1.5 py-1.5 text-gray-400 hover:text-gray-600 flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[15px] leading-none">keyboard_arrow_down</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Upload Status */}
        <AnimatePresence>
          {isUploading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-full shadow-2xl border border-gray-50 flex items-center gap-3"
            >
              <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-[12px] font-black text-gray-800 uppercase tracking-widest">
                {t('chatroom.uploading', { progress: uploadProgress })}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feature Board Drawer */}
      <AnimatePresence>
        {isFeatureDrawerOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 320, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#f8f9fa] border-t border-gray-100 overflow-hidden relative z-20 flex flex-col shrink-0"
          >
            {/* Header Title */}
            <div className="px-5 py-3 border-b border-gray-200/50 flex items-center justify-between shrink-0 bg-white">
              <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest leading-none">{t('chat.more_features', '더보기 기능')}</span>
              <button 
                onClick={() => setIsFeatureDrawerOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            
            {/* Features Board Content */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-x-3 gap-y-5 w-full max-w-2xl px-2 sm:px-4 justify-items-center">
                {/* Feature 1: Camera */}
                <button 
                  onClick={() => {
                    setIsFeatureDrawerOpen(false);
                    cameraInputRef.current?.click();
                  }}
                  className="group flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-all w-full max-w-[80px]"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] bg-sky-50 hover:bg-sky-100 text-sky-500 flex items-center justify-center shadow-sm border border-sky-100/50 group-hover:shadow-md transition-all">
                    <span className="material-symbols-outlined text-[26px] sm:text-[28px]">photo_camera</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-black text-gray-500 group-hover:text-gray-800 transition-colors truncate">{t('chatroom.camera', '카메라')}</span>
                </button>

                {/* Feature 2: Album */}
                <button 
                  onClick={() => {
                    setIsFeatureDrawerOpen(false);
                    albumInputRef.current?.click();
                  }}
                  className="group flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-all w-full max-w-[80px]"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] bg-emerald-50 hover:bg-emerald-100 text-emerald-500 flex items-center justify-center shadow-sm border border-emerald-100/50 group-hover:shadow-md transition-all">
                    <span className="material-symbols-outlined text-[26px] sm:text-[28px]">image</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-black text-gray-500 group-hover:text-gray-800 transition-colors truncate">{t('chatroom.album', '사진첩')}</span>
                </button>

                {/* Feature 3: Video */}
                <button 
                  onClick={() => {
                    setIsFeatureDrawerOpen(false);
                    videoInputRef.current?.click();
                  }}
                  className="group flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-all w-full max-w-[80px]"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] bg-amber-50 hover:bg-amber-100 text-amber-500 flex items-center justify-center shadow-sm border border-amber-100/50 group-hover:shadow-md transition-all">
                    <span className="material-symbols-outlined text-[26px] sm:text-[28px]">movie</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-black text-gray-500 group-hover:text-gray-800 transition-colors truncate">{t('chatroom.video', '동영상')}</span>
                </button>

                {/* Feature 4: Schedule */}
                <button 
                  onClick={() => {
                    setIsFeatureDrawerOpen(false);
                    setIsMeetupModalOpen(true);
                  }}
                  className="group flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-all w-full max-w-[80px]"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] bg-purple-50 hover:bg-purple-100 text-purple-500 flex items-center justify-center shadow-sm border border-purple-100/50 group-hover:shadow-md transition-all">
                    <span className="material-symbols-outlined text-[26px] sm:text-[28px]">calendar_month</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-black text-gray-500 group-hover:text-gray-800 transition-colors truncate">{t('chat.schedule_meetup', '약속 잡기')}</span>
                </button>

                {/* Feature 5: Voice */}
                <button 
                  onClick={() => {
                    setIsFeatureDrawerOpen(false);
                    startRecording();
                  }}
                  className="group flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-all w-full max-w-[80px]"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center shadow-sm border border-red-100/50 group-hover:shadow-md transition-all">
                    <span className="material-symbols-outlined text-[26px] sm:text-[28px]">mic</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-black text-gray-500 group-hover:text-gray-800 transition-colors truncate">{t('chatroom.voice', '음성 메시지')}</span>
                </button>

                {/* Feature 6: Notice Board */}
                <button 
                  onClick={() => {
                    setIsFeatureDrawerOpen(false);
                    setIsNoticeDetailOpen(true);
                  }}
                  className="group flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-all w-full max-w-[80px]"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] bg-blue-50 hover:bg-blue-100 text-blue-500 flex items-center justify-center shadow-sm border border-blue-100/50 group-hover:shadow-md transition-all">
                    <span className="material-symbols-outlined text-[26px] sm:text-[28px]">campaign</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-black text-gray-500 group-hover:text-gray-800 transition-colors truncate">{t('chatroom.notice_board', '공지 핀보드')}</span>
                </button>

                {/* Feature 7: Settlement Request */}
                <button 
                  onClick={() => {
                    setIsFeatureDrawerOpen(false);
                    setIsSettlementModalOpen(true);
                  }}
                  className="group flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-all w-full max-w-[80px]"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm border border-amber-100/50 group-hover:shadow-md transition-all">
                    <span className="material-symbols-outlined text-[26px] sm:text-[28px]">payments</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-black text-gray-500 group-hover:text-gray-800 transition-colors truncate">{t('chatroom.settlement_request', '1/N 정산 요청')}</span>
                </button>

                {/* Feature 8: Poll (투표 만들기) */}
                <button 
                  onClick={() => {
                    setIsFeatureDrawerOpen(false);
                    setIsPollModalOpen(true);
                  }}
                  className="group flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-all w-full max-w-[80px]"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] bg-pink-50 hover:bg-pink-100 text-pink-500 flex items-center justify-center shadow-sm border border-pink-100/50 group-hover:shadow-md transition-all">
                    <span className="material-symbols-outlined text-[26px] sm:text-[28px]">how_to_vote</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-black text-gray-500 group-hover:text-gray-800 transition-colors truncate">{t('poll.create_title', '투표 만들기')}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoticon / Sticker Drawer */}
      <AnimatePresence>
        {isStickerDrawerOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 260, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#f8f9fa] border-t border-gray-100 overflow-hidden relative z-20 flex flex-col shrink-0"
          >
            {/* Header Tabs */}
            <div className="px-5 py-3 border-b border-gray-200/50 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-1 bg-gray-50 p-0.5 rounded-xl border border-gray-100">
                <button 
                  onClick={() => setActiveStickerTab('daily')}
                  className={`px-3.5 py-1.5 text-[11.5px] font-black rounded-lg transition-all flex items-center gap-1 ${
                    activeStickerTab === 'daily' 
                      ? 'bg-white text-primary shadow-xs' 
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  <span className="text-[14px]">😊</span>
                  <span>{t('chatroom.tab_daily', '데일리')}</span>
                </button>
                <button 
                  onClick={() => setActiveStickerTab('animal')}
                  className={`px-3.5 py-1.5 text-[11.5px] font-black rounded-lg transition-all flex items-center gap-1 ${
                    activeStickerTab === 'animal' 
                      ? 'bg-white text-primary shadow-xs' 
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  <span className="text-[14px]">🐱</span>
                  <span>{t('chatroom.tab_animal', '동물')}</span>
                </button>
                <button 
                  onClick={() => setActiveStickerTab('neon')}
                  className={`px-3.5 py-1.5 text-[11.5px] font-black rounded-lg transition-all flex items-center gap-1 ${
                    activeStickerTab === 'neon' 
                      ? 'bg-white text-primary shadow-xs' 
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  <span className="text-[14px]">🔥</span>
                  <span>{t('chatroom.tab_neon', '리액션')}</span>
                </button>
              </div>
              <button 
                onClick={() => setIsStickerDrawerOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            
            {/* Stickers Grid */}
            <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 justify-items-center">
                {(() => {
                  const targetList = 
                    activeStickerTab === 'animal' ? EMOTICONS_ANIMAL :
                    activeStickerTab === 'neon' ? EMOTICONS_NEON :
                    EMOTICONS_DAILY;
                  return targetList.map((sticker) => (
                    <button 
                      key={sticker.id}
                      onClick={async () => {
                        if (!user) return;
                        // 로컬에서 스티커 감정 팡팡 선제 트리거
                        triggerEmotionEffect(sticker.id);
                        try {
                          await chatService.sendMessage({
                            roomId,
                            senderId: user.uid,
                            senderName: user.displayName || 'Anonymous',
                            text: sticker.id,
                            type: 'sticker'
                          });
                        } catch (err) {
                          console.error("Failed to send sticker:", err);
                        }
                      }}
                      className="group flex flex-col items-center gap-1.5 hover:scale-110 active:scale-95 transition-all p-1.5 rounded-2xl hover:bg-white hover:shadow-sm"
                    >
                      <img 
                        src={`/images/stickers/${sticker.fileId || sticker.id}.png`} 
                        alt={sticker.label}
                        className="w-14 h-14 object-contain select-none pointer-events-none mix-blend-multiply"
                      />
                      <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-600 transition-colors">{sticker.label}</span>
                    </button>
                  ));
                })()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notice Detail Modal */}
      <AnimatePresence>
        {isNoticeDetailOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => {
              setIsNoticeDetailOpen(false);
              setIsAddingNotice(false);
              setNewNoticeText('');
            }}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-md p-7 shadow-2xl relative overflow-hidden flex flex-col gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                    <span className="material-symbols-outlined text-[22px]">campaign</span>
                  </div>
                  <h3 className="text-[18px] font-black text-gray-900 uppercase tracking-tighter">
                    {t('chatroom.notice_board', '공지 핀보드')}
                  </h3>
                </div>
                
                {/* Multi-notice Navigator */}
                {(() => {
                  const notices: string[] = (room as any)?.notices || (room?.notice ? [room.notice] : []);
                  if (notices.length <= 1) return null;
                  const activeIdx = Math.min(currentNoticeIdx, notices.length - 1);
                  return (
                    <div className="flex items-center gap-1.5 bg-blue-50/70 border border-blue-100/30 px-2 py-1 rounded-full shrink-0">
                      <button 
                        onClick={() => setCurrentNoticeIdx(prev => (prev > 0 ? prev - 1 : notices.length - 1))}
                        className="text-blue-500 hover:text-blue-700 active:scale-90 transition-transform font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center bg-white shadow-xs"
                      >
                        ‹
                      </button>
                      <span className="text-[10px] font-black text-blue-600/90 tracking-tighter select-none scale-90 px-0.5">
                        {activeIdx + 1}/{notices.length}
                      </span>
                      <button 
                        onClick={() => setCurrentNoticeIdx(prev => (prev < notices.length - 1 ? prev + 1 : 0))}
                        className="text-blue-500 hover:text-blue-700 active:scale-90 transition-transform font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center bg-white shadow-xs"
                      >
                        ›
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Notice Card Viewer or Register Notice Form */}
              {(() => {
                const notices: string[] = (room as any)?.notices || (room?.notice ? [room.notice] : []);
                const activeIdx = Math.min(currentNoticeIdx, notices.length - 1);
                const activeNotice = notices[activeIdx] || '';

                if (isAddingNotice) {
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-4"
                    >
                      <div className="text-[11px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">
                        {t('chatroom.add_notice', '새 공지 쓰기')}
                      </div>
                      <textarea
                        value={newNoticeText}
                        onChange={(e) => setNewNoticeText(e.target.value)}
                        placeholder={t('chatroom.notice_input_placeholder', '새로운 공지 내용을 입력하세요 (최대 200자)')}
                        maxLength={200}
                        rows={4}
                        className="bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-2xl p-4 w-full text-[13px] font-medium text-gray-700 resize-none outline-none transition-all leading-relaxed"
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setIsAddingNotice(false);
                            setNewNoticeText('');
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-500 text-[12px] font-bold rounded-xl hover:bg-gray-200 transition-all"
                        >
                          {t('common.cancel', '취소')}
                        </button>
                        <button 
                          onClick={async () => {
                            if (!newNoticeText.trim()) return;
                            if (notices.length >= 5) {
                              toast.error(t('chatroom.notice_limit_exceeded', '공지는 최대 5개까지만 등록할 수 있습니다.'));
                              return;
                            }
                            try {
                              await chatService.addRoomNotice(roomId, newNoticeText.trim(), notices);
                              toast.success(t('chat.notice_added_toast', '새 공지가 등록되었습니다.'));
                              setNewNoticeText('');
                              setIsAddingNotice(false);
                              setCurrentNoticeIdx(0); // 새 공지가 맨 앞으로 가므로 인덱스를 0으로 세팅
                            } catch (err) {
                              console.error(err);
                              toast.error(t('chatroom.notice_write_error', '공지 등록에 실패했습니다.'));
                            }
                          }}
                          className="px-4 py-2 bg-blue-500 text-white text-[12px] font-bold rounded-xl hover:bg-blue-600 transition-all shadow-xs"
                        >
                          {t('chatroom.set_as_notice', '공지 등록')}
                        </button>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <div className="flex flex-col gap-4">
                    {/* Notice Card with subtle glassmorphic effect */}
                    <div className="bg-[#fcfcff] border border-blue-100/50 rounded-2xl p-5 shadow-xs relative overflow-hidden transition-all duration-300 min-h-[140px] flex flex-col justify-between">
                      {notices.length > 0 ? (
                        <>
                          <div className="text-[13px] font-medium leading-relaxed text-gray-700 whitespace-pre-wrap max-h-[180px] overflow-y-auto no-scrollbar">
                            {activeNotice}
                          </div>
                          
                          {/* Card Footer with meta-info or actions */}
                          <div className="flex justify-between items-center mt-4 pt-3 border-t border-blue-50/50">
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                              {t('chatroom.notice_title', '톡공지')} {activeIdx + 1}
                            </span>
                            {room?.participants?.includes(user?.uid || '') && (
                              <button 
                                onClick={async () => {
                                  try {
                                    await chatService.removeRoomNotice(roomId, activeIdx, notices);
                                    toast.success(t('chat.notice_removed_toast', '공지가 해제되었습니다.'));
                                    
                                    // 지워진 뒤의 인덱스 보정
                                    const nextLength = notices.length - 1;
                                    if (nextLength === 0) {
                                      setIsNoticeDetailOpen(false);
                                    } else {
                                      setCurrentNoticeIdx(prev => Math.max(0, Math.min(prev, nextLength - 1)));
                                    }
                                  } catch (err) {
                                    console.error(err);
                                    toast.error(t('chatroom.notice_remove_error', '공지 해제에 실패했습니다.'));
                                  }
                                }}
                                className="text-red-500 hover:text-red-600 active:scale-95 transition-all text-[11px] font-bold flex items-center gap-1 hover:bg-red-50/50 px-2.5 py-1.5 rounded-lg"
                              >
                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                {t('chat.remove_notice', '공지 내리기')}
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                          <span className="material-symbols-outlined text-[36px] mb-2 text-gray-300">campaign</span>
                          <span className="text-[12px] font-bold">
                            {t('chatroom.no_notices', '등록된 톡공지가 없습니다.')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-between items-center mt-2">
                      {room?.participants?.includes(user?.uid || '') && notices.length < 5 && (
                        <button 
                          onClick={() => setIsAddingNotice(true)}
                          className="px-4 py-2.5 bg-blue-50 text-blue-500 text-[12px] font-bold rounded-xl hover:bg-blue-100 transition-all flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[15px]">add</span>
                          {t('chatroom.add_notice', '새 공지 쓰기')}
                        </button>
                      )}
                      
                      <button 
                        onClick={() => setIsNoticeDetailOpen(false)}
                        className="px-5 py-2.5 bg-gray-100 text-gray-600 text-[12px] font-black uppercase rounded-xl hover:bg-gray-200 transition-all ml-auto"
                      >
                        {t('common.close', '닫기')}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGroupMembersOpen && (
          <GroupMembersPopup
            roomId={roomId}
            onClose={() => setIsGroupMembersOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Media Fullscreen Viewer */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center"
            onClick={handleMediaClose}
          >
            <div className="absolute top-6 right-6 flex flex-col gap-3 z-[110]">
              <button 
                className="w-12 h-12 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-md"
                onClick={(e) => { e.stopPropagation(); handleMediaClose(); }}
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
              {selectedMedia.isOwn && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    chatService.updateMessage(selectedMedia.msgId, { isDeleted: true, text: t('chatroom.deleted_message') }); 
                    handleMediaClose(); 
                  }}
                  className="w-12 h-12 rounded-full bg-black/40 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors backdrop-blur-md"
                >
                  <span className="material-symbols-outlined text-2xl">delete</span>
                </button>
              )}
            </div>

            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="flex-1 w-full flex items-center justify-center p-4 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedMedia.type === 'image' ? (
                <img src={selectedMedia.url} className="max-w-full max-h-full object-contain rounded-xl" />
              ) : (
                <video src={selectedMedia.url} controls autoPlay className="max-w-full max-h-full rounded-xl" />
              )}
            </motion.div>

            {/* Bottom Emojis for Media */}
            <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center z-[110] bg-gradient-to-t from-black/80 to-transparent" onClick={e => e.stopPropagation()}>
              <div className="flex gap-3 bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20">
                {REACTION_EMOJIS.map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => {
                      chatService.toggleReaction(selectedMedia.msgId, user?.uid || '', emoji);
                      handleMediaClose();
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 hover:scale-125 transition-all text-[24px]"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Glassmorphism Bottom Sheet for Order Management */}
      <AnimatePresence>
        {isManageModalOpen && latestOrder && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setIsManageModalOpen(false)} />
            
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white/90 backdrop-blur-xl rounded-t-[32px] p-6 shadow-2xl border border-white/20 z-10 flex flex-col gap-5 text-gray-800"
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto" />
              
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black uppercase tracking-tighter text-gray-900">{t('chatroom.manage_order_title', 'Manage Order')}</h3>
                <button 
                  onClick={() => setIsManageModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-all text-gray-500"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              <div className="bg-gray-50/50 border border-gray-100/50 rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-wider">
                  <span>{t('chatroom.domain', 'Domain')}</span>
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-black">{getDomainTranslation(latestOrder.domain)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-wider">
                  <span>{t('chatroom.order_name', 'Order Name')}</span>
                  <span className="text-gray-700 font-bold truncate max-w-[180px]">{latestOrder.itemName || t('common.item', 'Item')}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-wider">
                  <span>{t('chatroom.current_status', 'Current Status')}</span>
                  <span className="text-orange-500 font-black">{getStatusTranslation(latestOrder.status)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={async () => {
                    try {
                      if (latestOrder.actionType === 'booking_approval') {
                        await handleBookingAction(latestOrder.id, 'SELLER_CONFIRMED', latestOrder.msgId, roomId);
                      } else {
                        await shopService.updateOrderStatus(latestOrder.id, 'CONFIRMED');
                        await chatService.updateMessage(latestOrder.msgId, { 'metadata.status': 'CONFIRMED' } as any);
                        await chatService.sendMessage({
                          roomId,
                          senderId: user?.uid || 'adminstone',
                          senderName: user?.displayName || 'Host',
                          text: `chat.system_order_confirmed`,
                          type: 'text',
                          metadata: {
                            actionType: 'shop_approval',
                            orderId: latestOrder.id,
                            status: 'CONFIRMED',
                            domain: 'shop',
                            sellerId: latestOrder.sellerId,
                            buyerId: latestOrder.buyerId
                          }
                        });
                      }
                      setIsManageModalOpen(false);
                    } catch (err) {
                      console.error("Failed to confirm order:", err);
                      alert(t('chatroom.failed_to_confirm', 'Failed to confirm order'));
                    }
                  }}
                  className="w-full py-4 bg-primary text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  <span>{t('chatroom.confirm_payment', 'Confirm Payment')}</span>
                </button>

                <button
                  onClick={async () => {
                    try {
                      if (latestOrder.actionType === 'booking_approval') {
                        await handleBookingAction(latestOrder.id, 'SELLER_REJECTED', latestOrder.msgId, roomId);
                      } else {
                        await shopService.updateOrderStatus(latestOrder.id, 'CANCELLED');
                        await chatService.updateMessage(latestOrder.msgId, { 'metadata.status': 'CANCELLED' } as any);
                        await chatService.sendMessage({
                          roomId,
                          senderId: user?.uid || 'adminstone',
                          senderName: user?.displayName || 'Host',
                          text: `chat.system_order_cancelled`,
                          type: 'text',
                          metadata: {
                            actionType: 'shop_approval',
                            orderId: latestOrder.id,
                            status: 'CANCELLED',
                            domain: 'shop',
                            sellerId: latestOrder.sellerId,
                            buyerId: latestOrder.buyerId
                          }
                        });
                      }
                      setIsManageModalOpen(false);
                    } catch (err) {
                      console.error("Failed to cancel order:", err);
                      alert(t('chatroom.failed_to_cancel', 'Failed to cancel order'));
                    }
                  }}
                  className="w-full py-4 bg-red-50 hover:bg-red-100 text-red-500 font-bold text-sm uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">cancel</span>
                  <span>{t('chatroom.cancel_order', 'Cancel Order')}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Woc Meetup Scheduler proposal popup modal */}
      <AnimatePresence>
        {isMeetupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setIsMeetupModalOpen(false)} />
            
            <motion.form 
              onSubmit={handleCreateMeetup}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border border-gray-100 z-10 flex flex-col gap-4 text-gray-800"
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto sm:hidden" />
              
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black uppercase tracking-tighter text-gray-900">
                  {t('chat.propose_meetup', '새 대화 약속 제안하기')}
                </h3>
                <button 
                  type="button"
                  onClick={() => setIsMeetupModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-all text-gray-500"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              {/* Title input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  {t('chat.meetup_title', '약속 주제 *')}
                </label>
                <input 
                  type="text" 
                  required
                  value={meetupTitle}
                  onChange={(e) => setMeetupTitle(e.target.value)}
                  placeholder={t('chat.meetup_title_placeholder', '예: 2차 스터디 일정 조율, 커피 챗')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-primary/20 transition-all"
                />
              </div>

              {/* Date & Time Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  {t('chat.meetup_datetime', '모임 일시')}
                </label>
                <input 
                  type="datetime-local" 
                  value={meetupDate}
                  onChange={(e) => setMeetupDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-primary/20 transition-all"
                />
              </div>

              {/* Location Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  {t('chat.meetup_location', '모임 장소')}
                </label>
                <input 
                  type="text" 
                  value={meetupLocation}
                  onChange={(e) => setMeetupLocation(e.target.value)}
                  placeholder={t('chat.meetup_location_placeholder', '예: 3층 스터디룸, 강남역 스타벅스')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-primary/20 transition-all"
                />
              </div>

              {/* Capacity Input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                    {t('chat.meetup_capacity', '최대 정원')}
                  </label>
                  <span className="text-xs font-black text-primary">{meetupMaxCapacity}명</span>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max="30"
                  value={meetupMaxCapacity}
                  onChange={(e) => setMeetupMaxCapacity(e.target.value)}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Description Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  {t('chat.meetup_desc', '상세 설명')}
                </label>
                <textarea 
                  value={meetupDescription}
                  onChange={(e) => setMeetupDescription(e.target.value)}
                  placeholder={t('chat.meetup_desc_placeholder', '준비물이나 모임에 대한 간단한 설명을 적어주세요.')}
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[13px] font-medium text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-primary/20 transition-all resize-none"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-4 bg-primary text-white text-sm font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span className="material-symbols-outlined text-lg">calendar_add_on</span>
                <span>{t('chat.propose_meetup_btn', '새 약속 생성하여 제안')}</span>
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Woc Remittance: Proposal popup modal */}
      <AnimatePresence>
        {isSettlementModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setIsSettlementModalOpen(false)} />
            
            <motion.form 
              onSubmit={handleCreateSettlement}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border border-gray-100 z-10 flex flex-col gap-4 text-gray-800"
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto sm:hidden" />
              
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black uppercase tracking-tighter text-gray-900">
                  {t('chatroom.settlement_request', '1/N 정산 요청')}
                </h3>
                <button 
                  type="button"
                  onClick={() => setIsSettlementModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-all text-gray-500"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              {/* Title input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  {t('chat.settlement_title_label', '정산 목적 *')}
                </label>
                <input 
                  type="text" 
                  required
                  value={settlementTitle}
                  onChange={(e) => setSettlementTitle(e.target.value)}
                  placeholder={t('chat.settlement_title_placeholder', '예: 1차 회식비, 모임 대관료')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-primary/20 transition-all"
                />
              </div>

              {/* Total Amount Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  {t('chat.settlement_amount_label', '총 금액 (원) *')}
                </label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={settlementTotalAmount}
                  onChange={(e) => setSettlementTotalAmount(e.target.value)}
                  placeholder={t('chat.settlement_amount_placeholder', '예: 50000')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-primary/20 transition-all"
                />
                {/* 1/N 계산 실시간 안내 문구 */}
                {settlementTotalAmount && room?.participants && (
                  <div className="text-[11px] font-bold text-primary px-1">
                    {t('chat.settlement_calc_info', {
                      capacity: room.participants.length,
                      perPerson: Math.round((parseInt(settlementTotalAmount) || 0) / room.participants.length).toLocaleString()
                    })}
                  </div>
                )}
              </div>

              {/* Bank Name Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  {t('chat.settlement_bank_label', '받으실 은행 *')}
                </label>
                <input 
                  type="text" 
                  required
                  value={settlementBankName}
                  onChange={(e) => setSettlementBankName(e.target.value)}
                  placeholder={t('chat.settlement_bank_placeholder', '예: 카카오뱅크, 신한은행')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-primary/20 transition-all"
                />
              </div>

              {/* Account Number Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  {t('chat.settlement_account_label', '계좌 번호 *')}
                </label>
                <input 
                  type="text" 
                  required
                  value={settlementAccountNumber}
                  onChange={(e) => setSettlementAccountNumber(e.target.value)}
                  placeholder={t('chat.settlement_account_placeholder', '예: 3333-01-234567')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-primary/20 transition-all"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-4 bg-primary text-white text-sm font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span className="material-symbols-outlined text-lg">payments</span>
                <span>{t('chat.propose_settlement_btn', '1/N 정산 요청 뿌리기')}</span>
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Woc Polls: Proposal popup modal */}
      <AnimatePresence>
        {isPollModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setIsPollModalOpen(false)} />
            
            <motion.form 
              onSubmit={handleCreatePoll}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border border-gray-100 z-10 flex flex-col gap-4 text-gray-800 dark:bg-zinc-900 dark:border-zinc-800 text-left"
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto sm:hidden" />
              
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black uppercase tracking-tighter text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[24px] text-pink-500">how_to_vote</span>
                  <span>{t('poll.create_title', '새 톡방 투표 제안하기')}</span>
                </h3>
                <button 
                  type="button"
                  onClick={() => setIsPollModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-all text-gray-500 dark:bg-zinc-800 dark:text-zinc-400"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              {/* Title input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  {t('poll.title_label', '투표 주제 *')}
                </label>
                <input 
                  type="text" 
                  required
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  placeholder={t('poll.title_placeholder', '예: 오늘 점심 뭐 먹을까요?')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-primary/20 transition-all dark:bg-zinc-800/50 dark:border-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* Options Input */}
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  {t('poll.options_label', '투표 항목 (최소 2개) *')}
                </label>
                
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input 
                      type="text" 
                      required={idx < 2}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...pollOptions];
                        newOpts[idx] = e.target.value;
                        setPollOptions(newOpts);
                      }}
                      placeholder={t('poll.option_placeholder', '항목 {num}').replace('{num}', String(idx + 1))}
                      className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-[13px] font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-primary/20 transition-all dark:bg-zinc-800/50 dark:border-zinc-800 dark:text-zinc-100"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newOpts = pollOptions.filter((_, oIdx) => oIdx !== idx);
                          setPollOptions(newOpts);
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>
                ))}

                {pollOptions.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions([...pollOptions, ''])}
                    className="w-full py-2 bg-gray-50 hover:bg-gray-100/80 text-primary border border-dashed border-primary/20 rounded-2xl text-[12px] font-black transition-all flex items-center justify-center gap-1 mt-1 dark:bg-zinc-800/20 dark:border-zinc-800"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>{t('poll.add_option', '항목 추가')}</span>
                  </button>
                )}
              </div>

              {/* Allow Multiple Option Toggle */}
              <div className="flex items-center justify-between py-1 border-t border-gray-100/50 dark:border-zinc-800 mt-1">
                <div className="flex flex-col">
                  <span className="text-[12px] font-extrabold text-gray-700 dark:text-zinc-300">{t('poll.allow_multiple_label', '복수 선택 허용')}</span>
                  <span className="text-[10px] text-gray-400 font-medium">{t('poll.allow_multiple_desc', '멤버들이 2개 이상의 문항에 투표할 수 있도록 합니다.')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPollAllowMultiple(!pollAllowMultiple)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 ${
                    pollAllowMultiple ? 'bg-primary' : 'bg-gray-200 dark:bg-zinc-800'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-all duration-300 transform ${
                    pollAllowMultiple ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-4 bg-primary text-white text-sm font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span className="material-symbols-outlined text-lg">how_to_vote</span>
                <span>{t('poll.propose_poll_btn', '투표 올리기')}</span>
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* FAB for Manage Order (Seller Only) */}
      {isSeller && (
        <button
          onClick={() => setIsManageModalOpen(true)}
          className="fixed bottom-24 right-4 z-40 px-4 py-3 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-xl shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
          <span className="text-xs font-black uppercase tracking-wider">{t('chatroom.todo_button', 'TODO')}</span>
        </button>
      )}

      {/* Premium Glassmorphism Bottom Sheet / Modal for User Invitation */}
      {isInviteModalOpen && room && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsInviteModalOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border border-white/20 z-10 flex flex-col gap-4 text-gray-800 animate-in slide-in-from-bottom sm:zoom-in duration-300 max-h-[85vh] sm:max-h-[80vh]">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto sm:hidden" />
            
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-tighter text-gray-900">{t('chatroom.invite_title', 'Invite Members')}</h3>
              <button 
                onClick={() => setIsInviteModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-all text-gray-500"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* User Search inside Modal */}
            <div className="flex flex-col gap-1.5 flex-1 min-h-0">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-300 text-[18px]">search</span>
                <input 
                  type="text"
                  value={inviteSearchQuery}
                  onChange={(e) => setInviteSearchQuery(e.target.value)}
                  placeholder={t('chatroom.search_placeholder', 'Search by name...')}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-slate-100 rounded-2xl text-xs font-medium placeholder:text-gray-300 focus:ring-1 focus:ring-primary/10 focus:border-primary/20 transition-all"
                />
              </div>

              {/* Users Multi-select List */}
              <div className="flex-1 overflow-y-auto no-scrollbar border border-slate-50 rounded-2xl p-2 bg-gray-50/30 space-y-1 mt-2">
                {allInviteUsers
                  .filter(u => {
                    const q = inviteSearchQuery.trim().toLowerCase();
                    if (!q) return true;
                    return (u.nickname || '').toLowerCase().includes(q) || 
                           (u.nativeNickname || '').toLowerCase().includes(q) || 
                           (u.email || '').toLowerCase().includes(q);
                  })
                  .map(u => {
                    const isChecked = selectedInviteUserIds.has(u.id);
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          const next = new Set(selectedInviteUserIds);
                          if (next.has(u.id)) next.delete(u.id);
                          else next.add(u.id);
                          setSelectedInviteUserIds(next);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${isChecked ? 'bg-primary/5 ring-1 ring-primary/10' : 'hover:bg-gray-50/50'}`}
                      >
                        <div className="shrink-0 relative">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 ring-1 ring-gray-100 flex items-center justify-center">
                            {u.photoURL ? (
                              <img src={u.photoURL} alt={u.nickname} className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-gray-400 text-[18px]">person</span>
                            )}
                          </div>
                          {isChecked && (
                            <div className="absolute -top-1 -right-1 bg-primary text-white w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white text-[10px]">
                              <span className="material-symbols-outlined text-[10px] font-black">check</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5">
                            <h4 className="text-[13px] font-bold text-gray-800 truncate">{u.nickname}</h4>
                            {u.nativeNickname && (
                              <span className="text-[10px] text-gray-400 font-normal">{u.nativeNickname}</span>
                            )}
                          </div>
                          <p className="text-[9px] text-gray-400 font-medium truncate">{u.email || 'No email'}</p>
                        </div>
                        <div className="shrink-0">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            className="w-4 h-4 rounded text-primary focus:ring-primary/20 accent-primary"
                          />
                        </div>
                      </button>
                    );
                  })}
                {allInviteUsers.length === 0 && (
                  <div className="py-8 text-center text-gray-400 text-xs font-semibold">
                    {t('chatroom.no_users_to_invite', '초대할 수 있는 사용자가 없습니다.')}
                  </div>
                )}
              </div>
            </div>

            {/* Invite Button */}
            <button
              disabled={selectedInviteUserIds.size === 0 || isInviting}
              onClick={handleInviteUsers}
              className="w-full py-4 bg-primary text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isInviting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  <span>{t('chatroom.invite_button', 'Invite')} ({selectedInviteUserIds.size})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
      {/* Hamburger Sidebar Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-xs"
            />
            
            {/* Drawer Content */}
            <motion.div 
              initial={{ x: 280 }}
              animate={{ x: 0 }}
              exit={{ x: 280 }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="relative w-[240px] sm:w-[280px] h-full bg-white shadow-lg border-l border-gray-100/50 flex flex-col z-10 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="px-4.5 py-2.5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
                <span className="text-[14px] font-black text-gray-800 uppercase tracking-widest leading-none">
                  {t('chatroom.drawer_menu', '채팅방 서랍')}
                </span>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white hover:bg-gray-100 text-gray-500 shadow-xs border border-gray-100 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {/* 1. Members List Section (No Box Wrapping) */}
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-gray-700 font-extrabold text-[12px] uppercase tracking-wider pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">group</span>
                      <span>{t('chatroom.members', '대화 상대')}</span>
                      <span className="text-[10px] text-gray-400 font-black">({allParticipantsList.length})</span>
                    </div>
                    {/* Add Participant Shortcut */}
                    <button 
                      onClick={() => {
                        setIsSidebarOpen(false);
                        setIsInviteModalOpen(true);
                      }}
                      className="text-[10px] font-black text-primary hover:underline flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-[13px]">person_add</span>
                      <span>{t('chatroom.invite', '초대')}</span>
                    </button>
                  </div>
                  
                  {/* List of members with minimal avatar status badge (No Sub-Boxes, No Online/Offline Texts) */}
                  <div className="space-y-1.5">
                    {allParticipantsList.map(member => (
                      <div 
                        key={member.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50/50 rounded-xl transition-all border border-transparent"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Profile Avatar with relative status dot inside */}
                          <div className="w-8.5 h-8.5 rounded-full bg-gray-100 border border-gray-200/50 shrink-0 relative">
                            {member.photoURL ? (
                              <img src={member.photoURL} alt={member.nickname} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 font-black text-[12px] bg-primary/5 rounded-full uppercase">{member.nickname.charAt(0)}</div>
                            )}
                            {/* Live Badge dot placed inside/on avatar border */}
                            <span 
                              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                member.isOnline ? 'bg-green-500 ring-1 ring-green-100/50' : 'bg-gray-300'
                              }`} 
                              title={member.isOnline ? t('chatroom.online', 'Online') : t('chatroom.offline', 'Offline')}
                            />
                          </div>
                          
                          {/* Name + Me Badge (flex-col items-start for vertical Hangeul nickname mapping) */}
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[12.5px] font-bold text-gray-800 truncate leading-none">{member.nickname}</span>
                              {member.isMe && (
                                <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] font-black rounded-sm leading-none shrink-0 scale-90">{t('common.me', '나')}</span>
                              )}
                              
                              {/* 4단계: 실시간 리액티브 기여 뱃지 이식 */}
                              {(() => {
                                const stats = memberStats[member.id];
                                if (!stats) return null;
                                return (
                                  <div className="flex items-center gap-1 shrink-0 scale-85 origin-left">
                                    {/* 🗣️ 수다왕 뱃지 */}
                                    {stats.textCount >= 5 && (
                                      <div className="relative group/badge">
                                        <span className="text-[14px] cursor-help select-none">🗣️</span>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/badge:block z-[9999] bg-zinc-900 text-white text-[9.5px] font-bold rounded-lg px-2.5 py-1.5 shadow-md pointer-events-none whitespace-nowrap leading-tight transition-all">
                                          {t('badge.chat_king.desc', { count: stats.textCount })}
                                        </div>
                                      </div>
                                    )}
                                    {/* 🎉 분위기 요정 뱃지 */}
                                    {stats.stickerCount >= 2 && (
                                      <div className="relative group/badge">
                                        <span className="text-[14px] cursor-help select-none">🎉</span>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/badge:block z-[9999] bg-zinc-900 text-white text-[9.5px] font-bold rounded-lg px-2.5 py-1.5 shadow-md pointer-events-none whitespace-nowrap leading-tight transition-all">
                                          {t('badge.mood_maker.desc', { count: stats.stickerCount })}
                                        </div>
                                      </div>
                                    )}
                                    {/* 💸 성실 송금러 뱃지 */}
                                    {stats.paidCount >= 1 && (
                                      <div className="relative group/badge">
                                        <span className="text-[14px] cursor-help select-none">💸</span>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/badge:block z-[9999] bg-zinc-900 text-white text-[9.5px] font-bold rounded-lg px-2.5 py-1.5 shadow-md pointer-events-none whitespace-nowrap leading-tight transition-all">
                                          {t('badge.fast_payer.desc', { count: stats.paidCount })}
                                        </div>
                                      </div>
                                    )}
                                    {/* 🤝 모임 오거나이저 뱃지 */}
                                    {stats.meetupCount >= 1 && (
                                      <div className="relative group/badge">
                                        <span className="text-[14px] cursor-help select-none">🤝</span>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/badge:block z-[9999] bg-zinc-900 text-white text-[9.5px] font-bold rounded-lg px-2.5 py-1.5 shadow-md pointer-events-none whitespace-nowrap leading-tight transition-all">
                                          {t('badge.organizer.desc', { count: stats.meetupCount })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                            {member.nativeNickname && member.nativeNickname !== member.nickname && (
                              <span className="text-[10.5px] text-gray-400 font-black mt-1 truncate leading-none">
                                {member.nativeNickname}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Theme Palette Section (Sticky to Bottom, Horizontal Scroller, 15 Brand Colors) */}
              <div className="shrink-0 p-3.5 pb-4 border-t border-gray-100 bg-white space-y-1.5 z-10 shadow-sm">
                <div className="flex items-center gap-1.5 text-gray-700 font-extrabold text-[12px] uppercase tracking-wider px-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">palette</span>
                  <span>{t('chatroom.theme_palette', '배경 테마 설정')}</span>
                </div>
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1.5 px-1 scroll-smooth">
                  {[
                    "#b2c7da", // 기본 카톡 연하늘
                    "#f6ecf0", // 소프트 핑크
                    "#fcf0e7", // 부드러운 살구
                    "#faf5e6", // 소프트 옐로우
                    "#eef7f2", // 민트 그린
                    "#e6f4f8", // 소프트 아쿠아
                    "#f0eff5", // 연라벤더
                    "#e8ecef", // 소프트 실버
                    "#eef2f3", // 연그레이
                    "#eafaf1", // 소프트 그린
                    "#fbf2eb", // 부드러운 오렌지
                    "#fef9e7", // 파스텔 레몬
                    "#f4ecf7", // 파스텔 퍼플
                    "#ebf5fb", // 파스텔 윈드블루
                    "#eaecee"  // 매트 그레이
                  ].map(hexColor => (
                    <button 
                      key={hexColor}
                      onClick={() => handleBgColorChange(hexColor)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all border shadow-xs hover:scale-115 active:scale-90 shrink-0 relative ${
                        chatBgColor === hexColor ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: hexColor }}
                      title={hexColor === '#b2c7da' ? t('chatroom.default_theme', '기본 테마') : undefined}
                    >
                      {hexColor === '#b2c7da' && chatBgColor !== hexColor && (
                        <span className="text-[7px] font-black text-gray-500/80 scale-80 uppercase leading-none select-none tracking-tighter">DEF</span>
                      )}
                      {chatBgColor === hexColor && (
                        <span className="material-symbols-outlined text-[11px] text-primary font-black bg-white rounded-full p-0.5 shadow-sm">check</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* 4단계: 감정 이모티콘 팡팡 이펙트 오버레이 */}
      <EmojiParticleCanvas ref={particleCanvasRef} />
    </div>
  );
}
