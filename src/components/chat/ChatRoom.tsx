'use client';

import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '@/lib/firebase/chatService';
import type { ChatRoom, ChatMessage, MessageType } from '@/types/chat';
import { useAuth } from '@/components/providers/AuthProvider';
import { format, isToday, isYesterday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { safeDate } from '@/lib/utils/safeData';
import VoiceBubble from './VoiceBubble';
import GroupMembersPopup from './GroupMembersPopup';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { useHistoryBack } from '@/hooks/useHistoryBack';
import UserProfileClickable from '../common/UserProfileClickable';
import UserAvatar from '../common/UserAvatar';
import UserName from '../common/UserName';
import UserBadge from '../common/UserBadge';

interface ChatRoomProps {
  roomId: string;
  onBack: () => void;
}

export default function ChatRoom({ roomId, onBack }: ChatRoomProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [menuMsgId, setMenuMsgId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [isGroupMembersOpen, setIsGroupMembersOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{url: string, type: 'image' | 'video'} | null>(null);
  const closeSelectedMedia = () => setSelectedMedia(null);
  const { handleClose: handleMediaClose } = useHistoryBack(!!selectedMedia, closeSelectedMedia);
  const [messageLimit, setMessageLimit] = useState(50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    if (room.type === 'private' || room.type === 'personal' || room.type === 'business') {
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
    
    await chatService.sendMessage({
      roomId,
      senderId: user.uid,
      senderName: user.displayName || 'Anonymous',
      text,
      type: 'text',
      replyTo: replyTo?.id
    });
    setReplyTo(null);
  };

  // 4. File Upload Logic
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const type: MessageType = file.type.startsWith('image/') ? 'image' : 'video';
      const path = `chat/${roomId}/${Date.now()}_${file.name}`;
      const url = await chatService.uploadChatMedia(file, path, (p) => setUploadProgress(Math.round(p)));

      await chatService.sendMessage({
        roomId,
        senderId: user.uid,
        senderName: user.displayName || 'Anonymous',
        text: type === 'image' ? 'Sent a photo' : 'Sent a video',
        type,
        mediaUrl: url
      });
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
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

        setIsUploading(true);
        const url = await chatService.uploadChatMedia(audioBlob, `chat/${roomId}/voice_${Date.now()}.webm`);
        await chatService.sendMessage({
          roomId,
          senderId: user?.uid || '',
          senderName: user?.displayName || 'Anonymous',
          text: 'Sent a voice message',
          type: 'voice',
          mediaUrl: url
        });
        setIsUploading(false);
      };

      recorder.start();
      setIsRecording(true);
      setRecordDuration(0);
      timerRef.current = setInterval(() => setRecordDuration(p => p + 1), 1000);
    } catch (err) {
      alert("Mic permission needed");
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
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return format(date, 'HH:mm');
  };

  const renderMessageText = (msg: ChatMessage) => {
    const text = msg.text;
    
    // Helper to extract value by key (supports English and Korean labels)
    const getVal = (lines: string[], keys: string[]) => {
      const line = lines.find(l => keys.some(k => l.includes(k)));
      return line ? line.split(':').slice(1).join(':').trim() : null;
    };

    // 1. Order Placed Card
    if (text.includes('[ORDER PLACED]') || text.includes('[새 주문 알림]')) {
      const lines = text.split('\n');
      const orderNo = getVal(lines, ['Order No', '주문번호']);
      const product = getVal(lines, ['Product', '상품명']);
      const option = getVal(lines, ['Option', '옵션']);
      const amount = getVal(lines, ['Amount', '결제금액']);
      const image = getVal(lines, ['Image', '이미지']);
      
      return (
        <div className="flex flex-col gap-3 min-w-[240px]">
          <div className="flex items-center gap-2 pb-2 border-b border-white/20">
            <span className="material-symbols-outlined text-lg">package_2</span>
            <span className="font-black uppercase tracking-widest text-[10px]">Order Placed</span>
          </div>
          <div className="flex gap-3">
            {image && (
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white/10">
                <img src={image} className="w-full h-full object-cover" alt="" />
              </div>
            )}
            <div className="flex-1 space-y-1 min-w-0">
              <p className="text-[10px] opacity-60 font-bold uppercase tracking-tighter truncate">No: {orderNo}</p>
              <p className="text-sm font-black leading-tight truncate">{product}</p>
              <p className="text-[11px] font-bold opacity-80 truncate">{option}</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase">Total</span>
            <span className="text-base font-black">{amount}</span>
          </div>
        </div>
      );
    }

    // 2. Payment Reported Card
    if (text.includes('[PAYMENT REPORTED]') || text.includes('[입금 완료 보고]')) {
      const lines = text.split('\n');
      const orderNo = getVal(lines, ['Order No', '주문번호']);
      const depositor = getVal(lines, ['Depositor', '입금자명']);

      return (
        <div className="flex flex-col gap-3 min-w-[240px]">
          <div className="flex items-center gap-2 pb-2 border-b border-white/20">
            <span className="material-symbols-outlined text-lg">payments</span>
            <span className="font-black uppercase tracking-widest text-[10px]">Payment Reported</span>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] opacity-60 font-bold uppercase tracking-tighter">No: {orderNo}</p>
            <p className="text-sm font-bold leading-tight">Transfer reported by <span className="font-black text-white underline underline-offset-4">{depositor}</span>.</p>
          </div>
          <div className="text-[10px] bg-white/10 px-3 py-1.5 rounded-full font-bold uppercase self-start">Pending Confirmation</div>
        </div>
      );
    }

    // 3. Product Inquiry Card
    if (text.includes('[PRODUCT INQUIRY]') || text.includes('[상품 문의]')) {
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
            <span className="font-black uppercase tracking-widest text-[10px] text-primary">Product Inquiry</span>
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
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">View Product</span>
              <span className="material-symbols-outlined text-sm text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all">arrow_forward_ios</span>
            </a>
          )}
        </div>
      );
    }

    // 4. Stay Booking Card
    if (text.includes('[STAY BOOKING]') || text.includes('[숙소 예약]')) {
      const lines = text.split('\n');
      const stayName = getVal(lines, ['Stay', '숙소']);
      const dates = getVal(lines, ['Dates', '일정']);
      const nights = getVal(lines, ['Nights', '박']);
      const guests = getVal(lines, ['Guests', '인원']);
      const amount = getVal(lines, ['Amount', '금액']);
      const applicant = getVal(lines, ['Applicant', '예약자']);
      const image = getVal(lines, ['Image', '이미지']);

      return (
        <div className="flex flex-col gap-3 min-w-[240px]">
          <div className="flex items-center gap-2 pb-2 border-b border-primary/10">
            <span className="material-symbols-outlined text-lg text-primary">hotel</span>
            <span className="font-black uppercase tracking-widest text-[10px] text-primary">Stay Booking</span>
          </div>
          <div className="flex gap-3">
            {image && (
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                <img src={image} className="w-full h-full object-cover" alt="" />
              </div>
            )}
            <div className="flex-1 space-y-1 min-w-0 flex flex-col justify-center">
              <p className="text-sm font-black text-gray-900 leading-tight line-clamp-2">{stayName}</p>
              <p className="text-[11px] text-gray-500 font-bold">{dates} · {nights} nights</p>
              <p className="text-[11px] text-gray-400">{guests} guests · {applicant}</p>
              <p className="text-base font-black text-primary">{amount}</p>
            </div>
          </div>
          <div className="text-[10px] bg-primary/5 border border-primary/10 text-primary px-3 py-1.5 rounded-full font-bold uppercase self-start">Reservation Applied</div>
        </div>
      );
    }

    // 5. Stay Payment Reported Card
    if (text.includes('[STAY PAYMENT]') || text.includes('[숙소 입금]')) {
      const lines = text.split('\n');
      const stayName = getVal(lines, ['Stay', '숙소']);
      const dates = getVal(lines, ['Dates', '일정']);

      return (
        <div className="flex flex-col gap-3 min-w-[240px] bg-gradient-to-br from-teal-600 to-teal-800 text-white p-4 -m-3 rounded-2xl">
          <div className="flex items-center gap-2 pb-2 border-b border-white/20">
            <span className="material-symbols-outlined text-lg">payments</span>
            <span className="font-black uppercase tracking-widest text-[10px]">Stay Payment</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold leading-tight">{stayName}</p>
            {dates && <p className="text-[11px] opacity-70">{dates}</p>}
            <p className="text-sm font-bold leading-tight mt-1">Transfer reported. Please confirm!</p>
          </div>
          <div className="text-[10px] bg-white/10 px-3 py-1.5 rounded-full font-bold uppercase self-start">Pending Confirmation</div>
        </div>
      );
    }

    // 6. Rental Inquiry Card
    if (text.includes('[RENTAL INQUIRY]') || text.includes('[대관 문의]')) {
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
            <span className="font-black uppercase tracking-widest text-[10px] text-primary">Rental Inquiry</span>
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            {space && <p className="text-sm font-black text-gray-900 leading-tight">{space}</p>}
            <div className="bg-white/50 rounded-xl p-3 border border-gray-100 space-y-1">
              <p className="text-[11px] text-gray-600"><span className="font-bold text-gray-400 w-12 inline-block">Date</span> {date}</p>
              <p className="text-[11px] text-gray-600"><span className="font-bold text-gray-400 w-12 inline-block">Time</span> {time}</p>
              <p className="text-[11px] text-gray-600"><span className="font-bold text-gray-400 w-12 inline-block">Guests</span> {headcount}</p>
              <p className="text-[11px] text-gray-600"><span className="font-bold text-gray-400 w-12 inline-block">Purpose</span> {purpose}</p>
            </div>
            {message && (
              <p className="text-[12px] text-gray-800 bg-gray-50 p-3 rounded-xl mt-2 break-all whitespace-pre-wrap">{message}</p>
            )}
          </div>
          <div className="text-[10px] bg-primary/5 border border-primary/10 text-primary px-3 py-1.5 rounded-full font-bold uppercase self-start">Negotiation Pending</div>
        </div>
      );
    }

    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i !== text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden font-manrope">
      {/* Header */}
      {room?.type === 'private' || room?.type === 'personal' || room?.type === 'business' ? (
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-xl z-20 sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="md:hidden w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all text-gray-500">
              <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
            </button>
            <UserBadge
              uid={room.participants.find(p => p !== user?.uid) || ''}
              nickname={otherUser?.nickname || otherUser?.displayName || 'Unknown'}
              nativeNickname={otherUser?.nativeNickname}
              photoURL={otherUser?.photoURL}
              avatarSize="w-12 h-12 ring-2 ring-white shadow-sm"
              nameClassName="text-[18px] font-black text-gray-900 uppercase tracking-tighter line-clamp-1 hover:text-primary transition-colors"
              nativeClassName="text-[12px] font-medium text-gray-500 normal-case tracking-normal ml-1.5"
              subText={
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{otherUser?.location || 'Seoul, Korea'}</span>
                </div>
              }
            />
          </div>
          <div className="flex items-center gap-1">
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 transition-all">
              <span className="material-symbols-outlined text-[22px]">call</span>
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 transition-all">
              <span className="material-symbols-outlined text-[22px]">videocam</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-white z-20 sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="md:hidden w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all text-gray-500">
              <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
            </button>
            <div className="flex flex-col">
              <h2 className="text-[18px] font-black text-gray-900 uppercase tracking-tighter line-clamp-1">{room?.name || 'Room Chat'}</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{room?.participants ? `${room.participants.length} Members` : 'Live Syncing'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsGroupMembersOpen(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all text-gray-500"
            >
              <span className="material-symbols-outlined text-[20px]">group</span>
            </button>
            <div className="w-10 h-10" />
          </div>
        </div>
      )}

      {/* Messages List */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar bg-[#fcfcfc]"
      >
        {messages.map((msg, idx) => {
          const isOwn = msg.senderId === user?.uid;
          const prevTimestamp = idx > 0 ? messages[idx-1]?.timestamp?.toDate?.()?.toDateString() : null;
          const currentTimestamp = msg.timestamp?.toDate?.()?.toDateString();
          const showDate = idx === 0 || prevTimestamp !== currentTimestamp;

          return (
            <React.Fragment key={msg.id}>
              {showDate && currentTimestamp && (
                <div className="flex justify-center my-10">
                  <div className="px-5 py-1.5 bg-gray-100/50 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {(() => {
                      const d = safeDate(msg.timestamp);
                      if (!d) return 'Today';
                      if (isToday(d)) return 'Today';
                      if (isYesterday(d)) return 'Yesterday';
                      return format(d, 'MMMM d, yyyy');
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
                    />
                  </div>
                )}

                <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {/* Bubble */}
                  <div 
                    onClick={() => setMenuMsgId(menuMsgId === msg.id ? null : msg.id)}
                    className={`relative text-[14px] font-medium leading-relaxed shadow-sm transition-all duration-300 ${
                      msg.type === 'image' || msg.type === 'video'
                        ? `rounded-[20px] overflow-hidden ${isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'} bg-transparent`
                        : `px-5 py-3.5 rounded-3xl ${
                            isOwn 
                              ? 'bg-primary text-white rounded-tr-sm' 
                              : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm hover:border-primary/20'
                          }`
                    } ${menuMsgId === msg.id ? 'scale-[1.02] shadow-xl' : ''}`}
                  >
                    {/* Reply Context */}
                    {msg.replyTo && (
                      <div className={`mb-3 p-2 rounded-xl text-[11px] border-l-4 ${
                        (msg.type === 'image' || msg.type === 'video')
                          ? 'bg-gray-100 border-gray-300 text-gray-800 mx-2 mt-2'
                          : isOwn ? 'bg-white/10 border-white/30' : 'bg-gray-50 border-primary/30'
                      }`}>
                        <div className="font-black uppercase tracking-tighter mb-0.5 opacity-60">Replied to Message</div>
                        <div className="line-clamp-1 opacity-80">{messages.find(m => m.id === msg.replyTo)?.text || 'Message not found'}</div>
                      </div>
                    )}

                    {msg.type === 'voice' ? (
                      <VoiceBubble url={msg.mediaUrl!} isOwn={isOwn} timestamp={formatTime(msg.timestamp)} />
                    ) : msg.type === 'image' ? (
                      <div className="relative group bg-gray-100 flex items-center justify-center min-h-[100px] min-w-[100px]" onClick={(e) => { e.stopPropagation(); setSelectedMedia({ url: msg.mediaUrl!, type: 'image' }); }}>
                        <img src={msg.mediaUrl} className="max-w-full max-h-[300px] object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in block" />
                      </div>
                    ) : msg.type === 'video' ? (
                      <div className="relative group cursor-pointer bg-gray-100 flex items-center justify-center min-h-[100px] min-w-[100px]" onClick={(e) => { e.stopPropagation(); setSelectedMedia({ url: msg.mediaUrl!, type: 'video' }); }}>
                        <video src={msg.mediaUrl} className="max-w-full max-h-[300px] object-cover block" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined text-white text-4xl">play_circle</span>
                        </div>
                      </div>
                    ) : (
                      <p>{renderMessageText(msg)}</p>
                    )}

                    {/* Reactions */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className="absolute -bottom-3 left-2 flex gap-1">
                        {Object.entries(msg.reactions).map(([uid, emoji]) => (
                          <div key={uid} className="bg-white px-1.5 py-0.5 rounded-full shadow-sm text-[12px] border border-gray-50 animate-in zoom-in">
                            {emoji}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Meta (Time/Read) */}
                  <div className="flex flex-col gap-0.5 items-center justify-end pb-1">
                    {isOwn && (
                      <span className={`text-[10px] font-bold uppercase shrink-0 ${msg.readBy && msg.readBy.length > 0 ? 'text-primary' : 'text-gray-300'}`}>
                        {msg.readBy && msg.readBy.length > 0 ? 'Read' : 'Sent'}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-gray-300 uppercase shrink-0">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Message Menu (Context Actions) */}
                <AnimatePresence>
                  {menuMsgId === msg.id && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className={`flex gap-1 mt-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      {REACTION_EMOJIS.map(emoji => (
                        <button 
                          key={emoji}
                          onClick={() => {
                            chatService.toggleReaction(msg.id, user?.uid || '', emoji);
                            setMenuMsgId(null);
                          }}
                          className="w-8 h-8 rounded-full bg-white border border-gray-50 shadow-sm flex items-center justify-center hover:scale-125 transition-all text-[16px]"
                        >
                          {emoji}
                        </button>
                      ))}
                      <div className="w-px h-8 bg-gray-100 mx-1" />
                      <button 
                        onClick={() => { setReplyTo(msg); setMenuMsgId(null); }}
                        className="w-8 h-8 rounded-full bg-white border border-gray-50 shadow-sm flex items-center justify-center hover:bg-primary hover:text-white transition-all text-gray-400"
                      >
                        <span className="material-symbols-outlined text-[16px]">reply</span>
                      </button>
                      {isOwn && (
                        <button 
                          onClick={() => { chatService.updateMessage(msg.id, { isDeleted: true, text: 'Deleted message' }); setMenuMsgId(null); }}
                          className="w-8 h-8 rounded-full bg-white border border-gray-50 shadow-sm flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-gray-400"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}
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
            {otherUser?.displayName || 'Someone'} is typing...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-gray-50 relative z-30">
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
                <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Replying to {replyTo.senderName}</span>
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

        <div className="flex items-end gap-1 bg-[#f8f9fa] p-1.5 sm:p-2 rounded-[32px] border border-gray-200/50 focus-within:border-primary/20 focus-within:bg-white transition-all">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*,video/*"
          />
          <button 
            disabled={isRecording}
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full flex items-center justify-center text-gray-400 hover:text-primary transition-colors disabled:opacity-20"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[24px]">add_photo_alternate</span>
          </button>

          <textarea 
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
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
            disabled={isRecording}
            placeholder={isRecording ? "Recording..." : "Type your message..."}
            rows={1}
            className="flex-1 min-w-0 min-h-[40px] sm:min-h-[48px] max-h-[120px] bg-transparent border-none focus:ring-0 text-[14px] sm:text-[15px] leading-[20px] sm:leading-[24px] font-medium placeholder:text-gray-300 text-gray-900 resize-none py-2.5 sm:py-3 px-1 sm:px-2 no-scrollbar disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <div className="flex items-center gap-0.5 shrink-0">
            {isRecording ? (
              <div className="flex items-center gap-2 px-2 sm:px-4 animate-in fade-in zoom-in">
                <span className="text-[13px] sm:text-[14px] font-black text-red-500 animate-pulse">{Math.floor(recordDuration/60)}:{(recordDuration%60).toString().padStart(2, '0')}</span>
                <button 
                  onClick={stopRecording}
                  className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30"
                >
                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">stop</span>
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={startRecording}
                  className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px] sm:text-[24px]">mic</span>
                </button>
                <button 
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full flex items-center justify-center transition-all ${
                    inputText.trim() ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-100 text-gray-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] sm:text-[22px]">send</span>
                </button>
              </>
            )}
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
                Uploading {uploadProgress}%
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center"
            onClick={handleMediaClose}
          >
            <button 
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-[110]"
              onClick={(e) => { e.stopPropagation(); handleMediaClose(); }}
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="max-w-[90vw] max-h-[90vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedMedia.type === 'image' ? (
                <img src={selectedMedia.url} className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" />
              ) : (
                <video src={selectedMedia.url} controls autoPlay className="max-w-full max-h-[90vh] rounded-xl shadow-2xl" />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
