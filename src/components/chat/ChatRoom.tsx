'use client';

import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '@/lib/firebase/chatService';
import type { ChatRoom, ChatMessage, MessageType } from '@/types/chat';
import { useAuth } from '@/components/providers/AuthProvider';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import VoiceBubble from './VoiceBubble';
import { motion, AnimatePresence } from 'framer-motion';

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
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const REACTION_EMOJIS = ['👍', '❤️', '🥰', '😂', '😮', '😢', '😡'];

  // 1. Subscribe to Messages & Room Info
  useEffect(() => {
    if (!user || !roomId) return;

    const unsubMessages = chatService.subscribeMessages(roomId, (newMsgs) => {
      setMessages(newMsgs);
      // Mark as read logic
      chatService.resetUnreadCount(roomId, user.uid);
    });

    // Simple poll for room info (or could use subscription)
    const fetchRoom = async () => {
      // Logic to get room info if needed
    };
    fetchRoom();

    return () => unsubMessages();
  }, [roomId, user]);

  // 2. Scroll to Bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  const renderMessageText = (text: string) => {
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
      <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-white z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="md:hidden w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all text-gray-500">
            <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
          </button>
          <div className="flex flex-col">
            <h2 className="text-[18px] font-black text-gray-900 uppercase tracking-tighter">Room Chat</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Syncing</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all text-gray-500">
            <span className="material-symbols-outlined text-[20px]">group</span>
          </button>
          <button className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all text-gray-500">
            <span className="material-symbols-outlined text-[20px]">more_vert</span>
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar bg-[#fcfcfc]"
      >
        {messages.map((msg, idx) => {
          const isOwn = msg.senderId === user?.uid;
          const showDate = idx === 0 || 
            (messages[idx-1].timestamp?.toDate?.()?.toDateString() !== msg.timestamp?.toDate?.()?.toDateString());

          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-10">
                  <div className="px-5 py-1.5 bg-gray-100/50 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {msg.timestamp ? format(msg.timestamp.toDate(), 'MMMM d, yyyy', { locale: ko }) : 'Today'}
                  </div>
                </div>
              )}

              <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} group max-w-[85%] ${isOwn ? 'ml-auto' : ''}`}>
                {/* Sender Name */}
                {!isOwn && (
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-2 ml-1">
                    {msg.senderName}
                  </span>
                )}

                <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {/* Bubble */}
                  <div 
                    onClick={() => setMenuMsgId(menuMsgId === msg.id ? null : msg.id)}
                    className={`relative px-5 py-3.5 rounded-3xl text-[14px] font-medium leading-relaxed shadow-sm transition-all duration-300 ${
                      isOwn 
                        ? 'bg-primary text-white rounded-tr-sm' 
                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm hover:border-primary/20'
                    } ${menuMsgId === msg.id ? 'scale-[1.02] shadow-xl' : ''}`}
                  >
                    {/* Reply Context */}
                    {msg.replyTo && (
                      <div className={`mb-3 p-2 rounded-xl text-[11px] border-l-4 ${isOwn ? 'bg-white/10 border-white/30' : 'bg-gray-50 border-primary/30'}`}>
                        <div className="font-black uppercase tracking-tighter mb-0.5 opacity-60">Replied to Message</div>
                        <div className="line-clamp-1 opacity-80">{messages.find(m => m.id === msg.replyTo)?.text || 'Message not found'}</div>
                      </div>
                    )}

                    {msg.type === 'voice' ? (
                      <VoiceBubble url={msg.mediaUrl!} isOwn={isOwn} timestamp={formatTime(msg.timestamp)} />
                    ) : msg.type === 'image' ? (
                      <div className="overflow-hidden rounded-2xl -m-2">
                        <img src={msg.mediaUrl} className="max-w-full max-h-[300px] object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in" />
                      </div>
                    ) : (
                      <p>{renderMessageText(msg.text)}</p>
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
                  <div className="flex flex-col gap-0.5 items-center">
                    {/* Read Count logic is simplified here */}
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

        <div className="flex items-end gap-3 bg-[#f8f9fa] p-2 rounded-[32px] border border-gray-200/50 focus-within:border-primary/20 focus-within:bg-white transition-all">
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
            className="w-12 h-12 rounded-full flex items-center justify-center text-gray-400 hover:text-primary transition-colors disabled:opacity-20"
          >
            <span className="material-symbols-outlined text-[24px]">add_photo_alternate</span>
          </button>

          <textarea 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isRecording}
            placeholder={isRecording ? "Recording audio..." : "Type your message..."}
            className="flex-1 min-h-[48px] max-h-[120px] bg-transparent border-none focus:ring-0 text-[15px] font-medium placeholder:text-gray-300 resize-none py-3 px-1 no-scrollbar disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <div className="flex items-center gap-1 pr-2">
            {isRecording ? (
              <div className="flex items-center gap-3 px-4 animate-in fade-in zoom-in">
                <span className="text-[14px] font-black text-red-500 animate-pulse">{Math.floor(recordDuration/60)}:{(recordDuration%60).toString().padStart(2, '0')}</span>
                <button 
                  onClick={stopRecording}
                  className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30"
                >
                  <span className="material-symbols-outlined text-[20px]">stop</span>
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={startRecording}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[24px]">mic</span>
                </button>
                <button 
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    inputText.trim() ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-100 text-gray-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">send</span>
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
    </div>
  );
}
