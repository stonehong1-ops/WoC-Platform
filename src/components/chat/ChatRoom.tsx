'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBookingEngine } from '@/hooks/useBookingEngine';
import { chatService } from '@/lib/firebase/chatService';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { toast } from 'sonner';

// Custom Hooks
import { useChatMessages } from './hooks/useChatMessages';
import { useChatMembers } from './hooks/useChatMembers';
import { useChatActions } from './hooks/useChatActions';

// Sub Components
import ChatHeader from './ChatHeader';
import ChatMessageList from './ChatMessageList';
import ChatInputBar from './ChatInputBar';
import EmojiParticleCanvas, { EmojiParticleCanvasRef } from './EmojiParticleCanvas';
import GroupMembersPopup from './GroupMembersPopup';
import UserBadge from '../common/UserBadge';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatRoomProps {
  roomId: string;
  onBack: () => void;
}

export default function ChatRoom({ roomId, onBack }: ChatRoomProps) {
  const { user } = useAuth();
  const { t, formatDate } = useLanguage();
  const { handleBookingAction, cancelBooking } = useBookingEngine();
  const router = useRouter();

  // Sub UI Open States
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGroupMembersOpen, setIsGroupMembersOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ msgId: string, url: string, type: 'image' | 'video', isOwn: boolean } | null>(null);
  
  // Notice collapsible states
  const [isNoticeCollapsed, setIsNoticeCollapsed] = useState(false);
  const [isNoticeDetailOpen, setIsNoticeDetailOpen] = useState(false);
  const [currentNoticeIdx, setCurrentNoticeIdx] = useState(0);
  const [newNoticeText, setNewNoticeText] = useState('');
  const [isAddingNotice, setIsAddingNotice] = useState(false);

  // Background color customization states
  const [chatBgColor, setChatBgColor] = useState('#b2c7da');
  const [bgOpacity, setBgOpacity] = useState(100);

  // Invitation dialog user data
  const [allInviteUsers, setAllInviteUsers] = useState<any[]>([]);
  const [selectedInviteUserIds, setSelectedInviteUserIds] = useState<Set<string>>(new Set());

  // Message scroll & input visibility
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef<number>(0);
  const prevScrollHeightRef = useRef<number>(0);
  const [isInputVisible, setIsInputVisible] = useState(true);
  const [menuMsgId, setMenuMsgId] = useState<string | null>(null);

  // Emoji effect canvas
  const particleCanvasRef = useRef<EmojiParticleCanvasRef | null>(null);

  const triggerEmotionEffect = (text: string) => {
    if (!text || !particleCanvasRef.current) return;
    const clean = text.toLowerCase();
    
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

  // 1. Members and stats hook
  const {
    room,
    otherUser,
    otherUsers,
    isOtherTyping,
    isAccessBlocked,
    allMembers,
    memberStats,
    allParticipantsList
  } = useChatMembers({
    roomId,
    user,
    messages: [], // Initial/Temporary placeholder, will load via useChatMessages
    t
  });

  // 2. Messages pagination hook
  const {
    messages,
    setMessages,
    displayMessages,
    messageLimit,
    setMessageLimit,
    isLoadingMore,
    setIsLoadingMore,
    pendingMessages,
    loadMoreMessages
  } = useChatMessages({
    roomId,
    userId: user?.uid,
    room
  });

  // Re-inject real messages array to useChatMembers to correctly evaluate stats
  const resolvedMembersHook = useChatMembers({
    roomId,
    user,
    messages,
    t
  });

  // Real-time reactive emoji effect detector for incoming new messages
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

  // 3. Actions hook
  const {
    inputText,
    setInputText,
    replyTo,
    setReplyTo,
    isSilentMode,
    setIsSilentMode,
    showSilentOption,
    setShowSilentOption,
    isInviting,
    inviteSearchQuery,
    setInviteSearchQuery,
    isUploading,
    uploadProgress,
    previewMedia,
    isRecording,
    recordDuration,
    translations,
    translatingIds,
    isMeetupModalOpen,
    setIsMeetupModalOpen,
    isSettlementModalOpen,
    setIsSettlementModalOpen,
    isPollModalOpen,
    setIsPollModalOpen,
    isStickerDrawerOpen,
    setIsStickerDrawerOpen,
    isFeatureDrawerOpen,
    setIsFeatureDrawerOpen,
    meetupTitle,
    setMeetupTitle,
    meetupDate,
    setMeetupDate,
    meetupLocation,
    setMeetupLocation,
    meetupMaxCapacity,
    setMeetupMaxCapacity,
    meetupDescription,
    setMeetupDescription,
    settlementTitle,
    setSettlementTitle,
    settlementTotalAmount,
    setSettlementTotalAmount,
    settlementBankName,
    setSettlementBankName,
    settlementAccountNumber,
    setSettlementAccountNumber,
    pollTitle,
    setPollTitle,
    pollOptions,
    setPollOptions,
    pollAllowMultiple,
    setPollAllowMultiple,
    isMentionOpen,
    setIsMentionOpen,
    mentionFilter,
    handleInputChange,
    handleSelectMention,
    handleInviteUsers,
    handleSend,
    handleTranslate,
    handleFileUpload,
    confirmAndSendMedia,
    cancelMediaPreview,
    startRecording,
    stopRecording,
    handleCreateMeetup,
    handleCreateSettlement,
    handleCreatePoll
  } = useChatActions({
    roomId,
    room,
    otherUsers,
    allInviteUsers,
    setAllInviteUsers,
    selectedInviteUserIds,
    setSelectedInviteUserIds,
    triggerEmotionEffect
  });

  // Dynamic mention targets
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

  // Load custom background color from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && roomId) {
      const savedColor = localStorage.getItem(`woc_chat_bg_color_${roomId}`);
      if (savedColor) {
        setChatBgColor(savedColor);
      } else {
        setChatBgColor('#b2c7da');
      }
    }
  }, [roomId]);

  const handleBgColorChange = (color: string) => {
    setChatBgColor(color);
    if (typeof window !== 'undefined' && roomId) {
      localStorage.setItem(`woc_chat_bg_color_${roomId}`, color);
    }
  };

  // Scroll Sync
  useEffect(() => {
    if (scrollRef.current) {
      if (isLoadingMore) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevScrollHeightRef.current;
        setIsLoadingMore(false);
      } else {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const currentScrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    if (currentScrollTop === 0 && messages.length >= messageLimit) {
      prevScrollHeightRef.current = scrollHeight;
      loadMoreMessages();
    }

    const isAtBottom = currentScrollTop + clientHeight >= scrollHeight - 80;
    
    if (isAtBottom) {
      setIsInputVisible(true);
    } else {
      const lastScrollTop = lastScrollTopRef.current;
      if (Math.abs(currentScrollTop - lastScrollTop) > 5) {
        if (currentScrollTop > lastScrollTop) {
          setIsInputVisible(true);
        } else {
          setIsInputVisible(false);
        }
      }
    }
    
    lastScrollTopRef.current = currentScrollTop;
  };

  const handleQuickAction = async () => {
    if (!latestOrder) return;
    if (isSeller) {
      try {
        await handleBookingAction(latestOrder.id, 'SELLER_CONFIRMED', latestOrder.msgId, roomId);
        toast.success(t('chat.payment_approved_toast', '입금 확인 처리가 완료되었습니다!'));
      } catch (err) {
        console.error(err);
        toast.error(t('common.error', '처리에 실패했습니다.'));
      }
    } else {
      if (latestOrder.domain === 'class') {
        router.push(`/history?tab=class`);
      } else {
        router.push(`/history?tab=shop`);
      }
    }
  };

  // Close media details popup
  const handleMediaClose = () => setSelectedMedia(null);

  // Invite handler trigger
  const triggerInvite = () => {
    setIsInviteModalOpen(true);
  };

  // Add Notice inside sidebar/management
  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeText.trim() || !room) return;
    setIsAddingNotice(true);
    try {
      const currentNotices = (room as any).notices || (room.notice ? [room.notice] : []);
      const updatedNotices = [newNoticeText.trim(), ...currentNotices].slice(0, 5); // Limit 5 notices
      
      const roomRef = doc(db, 'chat_rooms', roomId);
      await updateDoc(roomRef, {
        notices: updatedNotices,
        notice: newNoticeText.trim() // Legacy compatibility
      });
      
      setNewNoticeText('');
      setIsNoticeCollapsed(false);
      toast.success(t('chat.notice_updated_toast', '톡방 공지사항이 갱신되었습니다!'));
    } catch (err) {
      console.error(err);
      toast.error(t('common.error', '공지 갱신에 실패했습니다.'));
    } finally {
      setIsAddingNotice(false);
    }
  };

  // Exit/Leave room
  const handleLeaveRoom = async () => {
    if (!user || !room) return;
    if (!confirm(t('chat.leave_confirm_msg', '대화방에서 나가시겠습니까? 나가면 대화 내역이 모두 삭제됩니다.'))) return;
    
    try {
      const updatedParticipants = room.participants.filter(p => p !== user.uid);
      
      if (updatedParticipants.length === 0) {
        // Delete empty room (or keep as archive, depending on business rule)
      } else {
        const roomRef = doc(db, 'chat_rooms', roomId);
        await updateDoc(roomRef, {
          participants: updatedParticipants
        });
        await chatService.sendGroupSystemMessage(roomId, user.uid, 'leave');
      }
      
      toast.success(t('chat.left_room_toast', '대화방에서 나왔습니다.'));
      onBack();
    } catch (err) {
      console.error(err);
      toast.error(t('common.error', '대화방 퇴장에 실패했습니다.'));
    }
  };

  // Find the latest pending order metadata
  const getLatestPendingOrder = () => {
    const resolvedIds = new Set<string>();
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.metadata && (msg.metadata.actionType === 'booking_approval' || msg.metadata.orderId)) {
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

  const notices: string[] = (room as any)?.notices || (room?.notice ? [room.notice] : []);
  const latestOrder = getLatestPendingOrder();
  const isSeller = latestOrder && user && latestOrder.sellerId === user.uid;

  const getStatusTranslation = (status: string) => {
    if (status === 'PAYMENT_REPORTED') return t('history.status_bank_transferred', '송금 완료');
    if (status === 'WAITING_CONFIRMATION') return t('history.status_confirming', '입금 확인중');
    const key = `history.status_${status.toLowerCase()}`;
    return t(key, status);
  };

  const getDomainTranslation = (domain: string) => {
    if (domain === 'class' || domain.startsWith('class_')) return t('common.class_domain', '수업/모임');
    if (domain === 'shop' || domain.startsWith('shop_')) return t('common.shop_domain', '마켓');
    if (domain === 'stay' || domain.startsWith('stay_')) return t('common.stay', '숙소');
    if (domain === 'rental' || domain.startsWith('rental_')) return t('nav.rental', '대관');
    return domain;
  };

  // Block Screen for group permission locks
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
      {/* 1. Header */}
      <ChatHeader
        room={room}
        user={user}
        otherUser={otherUser}
        otherUsers={otherUsers}
        t={t}
        onBack={onBack}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* 2. Messages List Section */}
      <div 
        className="flex-1 flex flex-col min-h-0 relative transition-all"
        style={{ backgroundColor: chatBgColor }}
      >
        <ChatMessageList
          roomId={roomId}
          room={room}
          user={user}
          messages={messages}
          displayMessages={displayMessages}
          allMembers={allMembers}
          otherUser={otherUser}
          otherUsers={otherUsers}
          translations={translations}
          translatingIds={translatingIds}
          t={t}
          formatDate={formatDate}
          handleTranslate={handleTranslate}
          scrollRef={scrollRef}
          handleScroll={handleScroll}
          isLoadingMore={isLoadingMore}
          messageLimit={messageLimit}
          isNoticeCollapsed={isNoticeCollapsed}
          setIsNoticeCollapsed={setIsNoticeCollapsed}
          isNoticeDetailOpen={isNoticeDetailOpen}
          setIsNoticeDetailOpen={setIsNoticeDetailOpen}
          currentNoticeIdx={currentNoticeIdx}
          setCurrentNoticeIdx={setCurrentNoticeIdx}
          menuMsgId={menuMsgId}
          setMenuMsgId={setMenuMsgId}
          setReplyTo={setReplyTo}
          setSelectedMedia={setSelectedMedia as any}
          handleBookingAction={handleBookingAction as any}
          cancelBooking={cancelBooking}
        />

        {/* Live Typing Status */}
        {isOtherTyping && (
          <div className="absolute bottom-2.5 left-4 z-10 flex items-center gap-1.5 px-3 py-1 bg-white/80 backdrop-blur-xs rounded-full border border-gray-100 shadow-2xs">
            <span className="flex gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:0.4s]" />
            </span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
              {t('chatroom.typing', '상대방이 입력 중')}
            </span>
          </div>
        )}
      </div>

      {/* Quick Trade / Order approval board */}
      {latestOrder && (
        <div className="px-5 py-3 border-t border-gray-100 bg-[#f9fafc] flex items-center justify-between gap-3 shrink-0 relative z-20">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[20px] text-primary shrink-0">pending_actions</span>
            <div className="min-w-0 flex flex-col">
              <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider leading-none mb-0.5">
                {getDomainTranslation(latestOrder.domain)} {t('chat.label_pending_transaction', '거래 대기')}
              </span>
              <span className="text-xs font-bold text-gray-700 leading-tight truncate">
                {latestOrder.itemName} ({getStatusTranslation(latestOrder.status)})
              </span>
            </div>
          </div>
          <button 
            onClick={handleQuickAction}
            className="px-4 py-2 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary/95 transition-all shadow-sm"
          >
            {isSeller ? t('chat.approve_payment_btn', '입금 확인') : t('chat.view_status_btn', '상태 보기')}
          </button>
        </div>
      )}

      {/* 3. Input Bar Section */}
      {isInputVisible && (
        <ChatInputBar
          roomId={roomId}
          room={room}
          user={user}
          inputText={inputText}
          setInputText={setInputText}
          replyTo={replyTo}
          setReplyTo={setReplyTo}
          isSilentMode={isSilentMode}
          setIsSilentMode={setIsSilentMode}
          showSilentOption={showSilentOption}
          setShowSilentOption={setShowSilentOption}
          isStickerDrawerOpen={isStickerDrawerOpen}
          setIsStickerDrawerOpen={setIsStickerDrawerOpen}
          isFeatureDrawerOpen={isFeatureDrawerOpen}
          setIsFeatureDrawerOpen={setIsFeatureDrawerOpen}
          previewMedia={previewMedia}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          confirmAndSendMedia={confirmAndSendMedia}
          cancelMediaPreview={cancelMediaPreview}
          isRecording={isRecording}
          recordDuration={recordDuration}
          startRecording={startRecording}
          stopRecording={stopRecording}
          isMentionOpen={isMentionOpen}
          setIsMentionOpen={setIsMentionOpen}
          mentionFilter={mentionFilter}
          filteredMentionTargets={filteredMentionTargets}
          handleInputChange={handleInputChange}
          handleSelectMention={handleSelectMention}
          handleSend={handleSend}
          handleFileUpload={handleFileUpload}
          setIsMeetupModalOpen={setIsMeetupModalOpen}
          setIsSettlementModalOpen={setIsSettlementModalOpen}
          setIsPollModalOpen={setIsPollModalOpen}
          triggerEmotionEffect={triggerEmotionEffect}
          t={t}
        />
      )}

      {/* 4. Side drawer / menu popup */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
            
            {/* Content Drawer */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="relative w-full max-w-[280px] h-full bg-white shadow-2xl flex flex-col z-10 text-gray-800 text-left"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                <span className="text-base font-black uppercase tracking-tight">{t('CHAT.SIDEBAR_TITLE', '대화방 설정')}</span>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
                {/* 1. Announcement Setup form (Admins only) */}
                {room?.admins?.includes(user?.uid || '') && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('CHAT.SIDEBAR_NOTICE_TITLE', '공지사항 관리')}</span>
                    <form onSubmit={handleAddNotice} className="flex gap-2">
                      <input 
                        type="text" 
                        value={newNoticeText}
                        onChange={(e) => setNewNoticeText(e.target.value)}
                        placeholder={t('chat.new_notice_placeholder', '새 공지 등록 (최대 5개)...')}
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold placeholder:text-gray-300 focus:bg-white transition-all"
                      />
                      <button 
                        type="submit"
                        disabled={isAddingNotice}
                        className="px-3.5 py-2 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary/95 active:scale-95 transition-all shadow-xs"
                      >
                        {isAddingNotice ? '...' : t('common.register', '등록')}
                      </button>
                    </form>
                  </div>
                )}

                {/* 2. Group Settings / Participants */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('CHAT.SIDEBAR_MEMBERS_TITLE', '참여자 목록')}</span>
                    {/* Invite Button directly in the header of members list */}
                    {user && (
                      <button 
                        onClick={() => {
                          setIsSidebarOpen(false);
                          triggerInvite();
                        }}
                        className="px-2.5 py-1 bg-primary/5 hover:bg-primary/10 text-primary text-[10.5px] font-extrabold rounded-lg flex items-center gap-1 transition-all active:scale-95 border border-primary/10"
                      >
                        <span className="material-symbols-outlined text-[13px] font-black">person_add</span>
                        <span>{t('chatroom.invite', '초대')}</span>
                      </button>
                    )}
                  </div>
                  
                  {/* Real-time Member List directly visible in sidebar (no separate modal popup button needed) */}
                  <div className="max-h-[280px] overflow-y-auto no-scrollbar space-y-2.5 pr-0.5">
                    {allParticipantsList.map((participant) => (
                      <div key={participant.id} className="flex items-center gap-3 py-2 px-2.5 hover:bg-gray-50/80 border border-transparent hover:border-gray-100/50 rounded-2xl transition-all">
                        {participant.photoURL ? (
                          <img 
                            src={participant.photoURL} 
                            className="w-7.5 h-7.5 rounded-xl object-cover ring-2 ring-white shadow-3xs shrink-0" 
                            alt="" 
                          />
                        ) : (
                          <div className="w-7.5 h-7.5 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center shrink-0 border border-gray-100">
                            <span className="material-symbols-outlined text-[15px]">person</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col text-left">
                          <span className="text-[11px] font-black text-gray-800 leading-tight truncate flex items-center gap-1">
                            {participant.nickname}
                            {participant.isMe && (
                              <span className="text-[9px] font-extrabold text-[#0057bd] bg-[#0057bd]/10 px-1 py-0.5 rounded-md scale-90 origin-left">
                                {t('chat.label_me', '나')}
                              </span>
                            )}
                          </span>
                          {participant.nativeNickname && (
                            <span className="text-[8.5px] font-bold text-gray-400 truncate leading-none mt-0.5">
                              {participant.nativeNickname}
                            </span>
                          )}
                        </div>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${participant.isOnline ? 'bg-green-500 shadow-[0_0_6px_#22c55e]' : 'bg-slate-300'}`} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Opacity Control */}
                <div className="space-y-3 border-t border-gray-100/50 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('CHAT.SIDEBAR_OPACITY_TITLE', '대화방 불투명도 스케일')}</span>
                    <span className="text-[10px] font-black text-primary">{bgOpacity}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="30" 
                    max="100" 
                    value={bgOpacity}
                    onChange={(e) => setBgOpacity(parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* 4. Theme Setting Section (Moved to the bottom, horizontal scrollable) */}
                <div className="space-y-2.5 border-t border-gray-100/50 pt-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('CHAT.SIDEBAR_THEME_TITLE', '배경 테마 설정')}</span>
                  <div className="flex items-center gap-3 overflow-x-auto no-scrollbar whitespace-nowrap py-2 px-1 scroll-smooth">
                    {[
                      "#b2c7da", // 카톡 블루 기본
                      "#fadbd8", // 파스텔 핑크
                      "#d5f5e3", // 파스텔 그린
                      "#fef9e7", // 파스텔 옐로우
                      "#ebdef0", // 파스텔 퍼플
                      "#eb5757", // 스칼렛 레드
                      "#0057bd", // 딥 오션블루
                      "#2ecc71", // 에메랄드 그린
                      "#17202a", // 차콜 블랙
                      "#f2f4f4"  // 화이트 그레이
                    ].map(hexColor => (
                      <button 
                        key={hexColor}
                        onClick={() => handleBgColorChange(hexColor)}
                        className={`w-8.5 h-8.5 rounded-full flex-shrink-0 flex items-center justify-center transition-all border shadow-xs hover:scale-110 active:scale-90 relative ${
                          chatBgColor === hexColor ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: hexColor }}
                      >
                        {chatBgColor === hexColor && (
                          <span className="material-symbols-outlined text-[12px] text-primary font-black bg-white rounded-full p-0.5 shadow-sm">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Leave Action */}
              <div className="p-5 border-t border-gray-100 shrink-0">
                <button 
                  onClick={handleLeaveRoom}
                  className="w-full py-3 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-100 active:scale-98 transition-all text-xs font-black"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>{t('chat.leave_room_btn', '대화방 나가기')}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Group Members Popup Details Modal */}
      {isGroupMembersOpen && (
        <GroupMembersPopup
          roomId={roomId}
          onClose={() => setIsGroupMembersOpen(false)}
        />
      )}

      {/* 5-b. Invite members Modal */}
      <AnimatePresence>
        {isInviteModalOpen && room && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs" onClick={() => setIsInviteModalOpen(false)}>
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border border-gray-100 z-10 flex flex-col gap-4 text-gray-800 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto sm:hidden" />
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black uppercase tracking-tighter text-gray-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[22px]">person_add</span>
                  {t('chatroom.invite_members', '신규 참여자 초대')}
                </h3>
                <button 
                  onClick={() => setIsInviteModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Search user */}
              <input 
                type="text" 
                value={inviteSearchQuery}
                onChange={(e) => setInviteSearchQuery(e.target.value)}
                placeholder={t('chatroom.search_invite_placeholder', '초대할 사용자의 닉네임 검색...')}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-primary/20 transition-all"
              />

              {/* User List */}
              <div className="max-h-[220px] overflow-y-auto no-scrollbar space-y-2 py-1">
                {allInviteUsers.length > 0 ? (
                  allInviteUsers.map((inviteUser) => {
                    const isSelected = selectedInviteUserIds.has(inviteUser.id);
                    return (
                      <button
                        key={inviteUser.id}
                        onClick={() => {
                          const next = new Set(selectedInviteUserIds);
                          if (isSelected) {
                            next.delete(inviteUser.id);
                          } else {
                            next.add(inviteUser.id);
                          }
                          setSelectedInviteUserIds(next);
                        }}
                        className={`w-full p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                          isSelected 
                            ? 'bg-primary/5 border-primary/20 shadow-2xs scale-[1.01]' 
                            : 'bg-gray-50/50 border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        {inviteUser.photoURL ? (
                          <img src={inviteUser.photoURL} className="w-8.5 h-8.5 rounded-2xl object-cover ring-2 ring-white shadow-2xs" alt="" />
                        ) : (
                          <div className="w-8.5 h-8.5 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[20px]">person</span>
                          </div>
                        )}
                        <div className="flex-1 text-left min-w-0">
                          <span className="text-[13px] font-black text-gray-800 leading-none block mb-1">{inviteUser.nickname || inviteUser.displayName || 'User'}</span>
                          {inviteUser.nativeNickname && (
                            <span className="text-[9.5px] font-bold text-gray-400 block leading-none truncate">{inviteUser.nativeNickname}</span>
                          )}
                        </div>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300 bg-white'
                        }`}>
                          {isSelected && <span className="material-symbols-outlined text-[12px] font-black">check</span>}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-400 font-bold text-xs">
                    {inviteSearchQuery ? t('chatroom.no_invite_results', '검색 결과가 없습니다.') : t('chatroom.type_to_search_invite', '닉네임을 검색해 보세요.')}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                disabled={selectedInviteUserIds.size === 0 || isInviting}
                onClick={handleInviteUsers}
                className="w-full py-4 bg-primary text-white text-sm font-black rounded-2xl hover:bg-primary/95 active:scale-95 transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 mt-2 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none"
              >
                <span className="material-symbols-outlined text-[18px] font-black">person_add</span>
                <span>{isInviting ? t('chatroom.inviting', '초대 중...') : t('chatroom.invite_btn_count', { count: selectedInviteUserIds.size })}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Media Viewer details modal */}
      <AnimatePresence>
        {selectedMedia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95" onClick={handleMediaClose}>
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleMediaClose();
                }}
                className="w-10 h-10 rounded-full bg-black bg-opacity-50 text-white flex items-center justify-center hover:bg-opacity-70 transition-all"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            
            <div className="max-w-full max-h-full p-4 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              {selectedMedia.type === 'image' ? (
                <img src={selectedMedia.url} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" alt="" />
              ) : (
                <video src={selectedMedia.url} controls autoPlay className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Notice Detail Full Modal */}
      <AnimatePresence>
        {isNoticeDetailOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs" onClick={() => setIsNoticeDetailOpen(false)}>
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border border-gray-100 z-10 flex flex-col gap-4 text-gray-800 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto sm:hidden" />
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black uppercase tracking-tighter text-gray-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-blue-500 text-[22px]">campaign</span>
                  {t('chat.notice_detail_title', '톡방 전체 공지사항')}
                </h3>
                <button 
                  onClick={() => setIsNoticeDetailOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-4 py-2 border-y border-gray-100">
                {notices.map((notice, idx) => (
                  <div key={idx} className="flex gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 relative">
                    <span className="text-[12px] font-black text-primary bg-primary/10 w-6 h-6 rounded-full flex items-center justify-center shrink-0">{idx + 1}</span>
                    <p className="text-sm font-semibold text-gray-700 leading-relaxed whitespace-pre-wrap flex-1">{notice}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. Woc Meetups: Proposal popup modal */}
      <AnimatePresence>
        {isMeetupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs" onClick={() => setIsMeetupModalOpen(false)}>
            <motion.form 
              onSubmit={handleCreateMeetup}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border border-gray-100 z-10 flex flex-col gap-4 text-gray-800 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto sm:hidden" />
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black uppercase tracking-tighter text-gray-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-purple-500 text-[22px]">calendar_today</span>
                  {t('chat.propose_meetup_title', '새로운 대화 약속 제안')}
                </h3>
                <button type="button" onClick={() => setIsMeetupModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <div className="flex flex-col gap-3.5 max-h-[380px] overflow-y-auto no-scrollbar py-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-gray-400">{t('chat.meetup_title_label', '약속 이름 *')}</label>
                  <input type="text" required value={meetupTitle} onChange={(e) => setMeetupTitle(e.target.value)} placeholder={t('chat.meetup_title_placeholder', '예: 토요일 저녁 다이닝 모임')} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-primary/20 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-gray-400">{t('chat.meetup_date_label', '일시 *')}</label>
                    <input type="datetime-local" required value={meetupDate} onChange={(e) => setMeetupDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-800 focus:bg-white focus:border-primary/20 transition-all" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-gray-400">{t('chat.meetup_capacity_label', '최대 정원 (선택)')}</label>
                    <input type="number" min="2" max="100" value={meetupMaxCapacity} onChange={(e) => setMeetupMaxCapacity(e.target.value)} placeholder="5" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-800 focus:bg-white focus:border-primary/20 transition-all" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-gray-400">{t('chat.meetup_location_label', '장소 (선택)')}</label>
                  <input type="text" value={meetupLocation} onChange={(e) => setMeetupLocation(e.target.value)} placeholder={t('chat.meetup_location_placeholder', '예: 홍대 근처 이탈리안 레스토랑')} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-primary/20 transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-gray-400">{t('chat.meetup_desc_label', '세부 설명 (선택)')}</label>
                  <textarea value={meetupDescription} onChange={(e) => setMeetupDescription(e.target.value)} placeholder={t('chat.meetup_desc_placeholder', '준비물이나 가벼운 안내사항을 남겨주세요.')} rows={2} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-primary/20 transition-all resize-none" />
                </div>
              </div>
              <button type="submit" className="w-full py-4.5 bg-primary text-white text-sm font-black rounded-2xl hover:bg-primary/95 active:scale-95 transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 mt-2">
                <span className="material-symbols-outlined text-[18px] font-black">check</span>
                <span>{t('chat.propose_meetup_btn', '새로운 대화 약속 만들기')}</span>
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* 9. Woc Settlements: Proposal popup modal */}
      <AnimatePresence>
        {isSettlementModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs" onClick={() => setIsSettlementModalOpen(false)}>
            <motion.form 
              onSubmit={handleCreateSettlement}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border border-gray-100 z-10 flex flex-col gap-4 text-gray-800 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto sm:hidden" />
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black uppercase tracking-tighter text-gray-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-500 text-[22px]">payments</span>
                  {t('chat.propose_settlement_title', '1/N 정산 요청 뿌리기')}
                </h3>
                <button type="button" onClick={() => setIsSettlementModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <div className="flex flex-col gap-3.5 max-h-[380px] overflow-y-auto no-scrollbar py-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-gray-400">{t('chat.settlement_title_label', '정산 활동 이름 *')}</label>
                  <input type="text" required value={settlementTitle} onChange={(e) => setSettlementTitle(e.target.value)} placeholder={t('chat.settlement_title_placeholder', '예: 2차 다이닝 회비 정산')} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-primary/20 transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-gray-400">{t('chat.settlement_amount_label', '총 정산 금액 (원) *')}</label>
                  <input type="number" required value={settlementTotalAmount} onChange={(e) => setSettlementTotalAmount(e.target.value)} placeholder={t('chat.settlement_amount_placeholder', '예: 50000')} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-primary/20 transition-all" />
                  {settlementTotalAmount && room?.participants && (
                    <div className="text-[11px] font-bold text-primary px-1">
                      {t('chat.settlement_calc_info', {
                        capacity: room.participants.length,
                        perPerson: Math.round((parseInt(settlementTotalAmount) || 0) / room.participants.length).toLocaleString()
                      })}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-gray-400">{t('chat.settlement_bank_label', '받으실 은행 *')}</label>
                  <input type="text" required value={settlementBankName} onChange={(e) => setSettlementBankName(e.target.value)} placeholder={t('chat.settlement_bank_placeholder', '예: 카카오뱅크, 신한은행')} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-primary/20 transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-gray-400">{t('chat.settlement_account_label', '계좌번호 *')}</label>
                  <input type="text" required value={settlementAccountNumber} onChange={(e) => setSettlementAccountNumber(e.target.value)} placeholder={t('chat.settlement_account_placeholder', '예: 3333-01-2345678')} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-primary/20 transition-all" />
                </div>
              </div>
              <button type="submit" className="w-full py-4.5 bg-[#00b96b] text-white text-sm font-black rounded-2xl hover:bg-[#00a35c] active:scale-95 transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5 mt-2">
                <span className="material-symbols-outlined text-[18px] font-black">send</span>
                <span>{t('chat.propose_settlement_btn', '1/N 정산 요청 뿌리기')}</span>
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* 10. Woc Polls: Proposal popup modal */}
      <AnimatePresence>
        {isPollModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs" onClick={() => setIsPollModalOpen(false)}>
            <motion.form 
              onSubmit={handleCreatePoll}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border border-gray-100 z-10 flex flex-col gap-4 text-gray-800 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto sm:hidden" />
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black uppercase tracking-tighter text-gray-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-teal-500 text-[22px]">ballot</span>
                  {t('chat.create_poll_title', '톡방 투표 만들기')}
                </h3>
                <button type="button" onClick={() => setIsPollModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <div className="flex flex-col gap-3.5 max-h-[380px] overflow-y-auto no-scrollbar py-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-gray-400">{t('poll.title_label', '투표 주제 *')}</label>
                  <input type="text" required value={pollTitle} onChange={(e) => setPollTitle(e.target.value)} placeholder={t('poll.title_placeholder', '예: 이번 주 정기 모임 요일 결정')} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-primary/20 transition-all" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-gray-400">{t('poll.options_label', '투표 항목 *')}</label>
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        type="text" 
                        required={idx < 2}
                        value={opt} 
                        onChange={(e) => {
                          const nextOpts = [...pollOptions];
                          nextOpts[idx] = e.target.value;
                          setPollOptions(nextOpts);
                        }} 
                        placeholder={t('poll.option_placeholder', { num: idx + 1 })} 
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-primary/20 transition-all" 
                      />
                      {pollOptions.length > 2 && (
                        <button 
                          type="button"
                          onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                          className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 active:scale-95 transition-all"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 10 && (
                    <button 
                      type="button" 
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="w-full py-3 bg-gray-50 border border-gray-100 border-dashed rounded-2xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      <span>{t('poll.add_option_btn', '항목 추가하기')}</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-2xl mt-1.5">
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black text-gray-700 leading-none mb-0.5">{t('poll.allow_multiple_label', '복수 선택 허용')}</span>
                    <span className="text-[9.5px] font-bold text-gray-400 leading-none">{t('poll.allow_multiple_desc', '참여자가 여러 개의 항목을 투표할 수 있게 합니다')}</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={pollAllowMultiple}
                    onChange={(e) => setPollAllowMultiple(e.target.checked)}
                    className="w-5 h-5 rounded-md border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-4.5 bg-[#00a699] text-white text-sm font-black rounded-2xl hover:bg-[#009287] active:scale-95 transition-all shadow-md shadow-teal-500/10 flex items-center justify-center gap-1.5 mt-2">
                <span className="material-symbols-outlined text-[18px] font-black">check</span>
                <span>{t('poll.create_poll_btn', '톡방 투표 등록하기')}</span>
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Emoji confetti overlay effect (congrats, love, cheer, thanks) */}
      <EmojiParticleCanvas ref={particleCanvasRef} />
    </div>
  );
}
