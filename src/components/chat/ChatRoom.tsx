'use client';

import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '@/lib/firebase/chatService';
import type { ChatRoom, ChatMessage } from '@/types/chat';
import { useAuth } from '@/components/providers/AuthProvider';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatRoomProps {
  roomId: string;
  onBack?: () => void;
}

export default function ChatRoom({ roomId, onBack }: ChatRoomProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Subscribe to Room Data & Messages
  useEffect(() => {
    if (!roomId || !user) return;

    // Reset unread counts
    chatService.resetUnreadCount(roomId, user.uid);

    const unsubMessages = chatService.subscribeMessages(roomId, (newMessages) => {
      setMessages(newMessages);
      scrollToBottom();
    });

    return () => unsubMessages();
  }, [roomId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user || !inputText.trim() || isSending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await chatService.sendMessage({
        roomId,
        senderId: user.uid,
        senderName: user.displayName || 'Me',
        senderPhoto: user.photoURL || '',
        text: textToSend,
        type: 'text'
      });
      scrollToBottom();
    } catch (error) {
      console.error("Failed to send:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] relative font-manrope">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-50 p-4 flex items-center gap-3 sticky top-0 z-30">
        {onBack && (
          <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all">
            <span className="material-symbols-outlined text-[20px] text-gray-500">arrow_back</span>
          </button>
        )}
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 ring-1 ring-gray-100">
          <img src="https://lh3.googleusercontent.com/a/default-user" alt="Room" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] font-black text-gray-900 uppercase tracking-tighter">Chat Room</h3>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Society Active</p>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === user?.uid;
          const showAvatar = idx === 0 || messages[idx-1].senderId !== msg.senderId;
          const time = msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : '';

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
              <div className={`flex max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                {!isMe && showAvatar && (
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 mb-6 shrink-0 shadow-sm">
                    <img src={msg.senderPhoto || "https://lh3.googleusercontent.com/a/default-user"} alt="avatar" className="w-full h-full object-cover" />
                  </div>
                )}
                {!isMe && !showAvatar && <div className="w-8" />}

                <div className="flex flex-col gap-1">
                  {!isMe && showAvatar && (
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">{msg.senderName}</span>
                  )}
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`px-4 py-3 rounded-[20px] text-[14px] font-medium leading-relaxed shadow-sm ${
                      isMe 
                      ? 'bg-primary text-white rounded-br-none' 
                      : 'bg-white text-gray-800 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </motion.div>
                </div>
                <span className="text-[9px] text-gray-300 font-bold mb-1 uppercase tracking-tighter">{time}</span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-white border-t border-gray-50 sticky bottom-0 z-30">
        <form onSubmit={handleSendMessage} className="flex gap-3 items-center bg-[#f8f9fa] rounded-[24px] p-2 pl-4 border border-transparent focus-within:border-primary/20 transition-all">
          <button type="button" className="text-gray-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-2xl">add_circle</span>
          </button>
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-[14px] font-medium placeholder:text-gray-300"
          />
          <button 
            type="submit"
            disabled={!inputText.trim() || isSending}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              inputText.trim() ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-100' : 'bg-gray-100 text-gray-300 scale-90'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{isSending ? 'sync' : 'send'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
