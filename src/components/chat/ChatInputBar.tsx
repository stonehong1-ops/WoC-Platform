import React, { useRef, useEffect } from 'react';
import type { ChatRoom, ChatMessage } from '@/types/chat';
import { motion, AnimatePresence } from 'framer-motion';
import { chatService } from '@/lib/firebase/chatService';
import { toast } from 'sonner';
import { UserProfile } from '@/types/user';

const EMOTICONS_DAILY = [
  { id: 'sticker_daily_1', fileId: 'sticker_daily_1', labelKey: 'sticker.daily_1', label: '인사' },
  { id: 'sticker_daily_2', fileId: 'sticker_daily_2', labelKey: 'sticker.daily_2', label: '감사' },
  { id: 'sticker_daily_3', fileId: 'sticker_daily_3', labelKey: 'sticker.daily_3', label: '응원' },
  { id: 'sticker_daily_4', fileId: 'sticker_daily_4', labelKey: 'sticker.daily_4', label: '기도' },
  { id: 'sticker_daily_5', fileId: 'sticker_daily_5', labelKey: 'sticker.daily_5', label: '축하' },
  { id: 'sticker_daily_6', fileId: 'sticker_daily_6', labelKey: 'sticker.daily_6', label: '죄송' },
  { id: 'sticker_daily_7', fileId: 'sticker_daily_7', labelKey: 'sticker.daily_7', label: '사랑' },
  { id: 'sticker_daily_8', fileId: 'sticker_daily_8', labelKey: 'sticker.daily_8', label: '질문' },
  { id: 'sticker_daily_9', fileId: 'sticker_daily_9', labelKey: 'sticker.daily_9', label: '기쁨' },
  { id: 'sticker_daily_10', fileId: 'sticker_daily_10', labelKey: 'sticker.daily_10', label: '슬픔' },
  { id: 'sticker_daily_11', fileId: 'sticker_daily_11', labelKey: 'sticker.daily_11', label: '놀람' },
  { id: 'sticker_daily_12', fileId: 'sticker_daily_12', labelKey: 'sticker.daily_12', label: '화남' },
  { id: 'sticker_daily_13', fileId: 'sticker_daily_13', labelKey: 'sticker.daily_13', label: '윙크' },
  { id: 'sticker_daily_14', fileId: 'sticker_daily_14', labelKey: 'sticker.daily_14', label: '메롱' },
  { id: 'sticker_daily_15', fileId: 'sticker_daily_15', labelKey: 'sticker.daily_15', label: '졸림' },
  { id: 'sticker_daily_16', fileId: 'sticker_daily_16', labelKey: 'sticker.daily_16', label: '눈물' },
  { id: 'sticker_daily_17', fileId: 'sticker_daily_17', labelKey: 'sticker.daily_17', label: '당황' },
  { id: 'sticker_daily_18', fileId: 'sticker_daily_18', labelKey: 'sticker.daily_18', label: '삐짐' },
  { id: 'sticker_daily_19', fileId: 'sticker_daily_19', labelKey: 'sticker.daily_19', label: '부끄' },
  { id: 'sticker_daily_20', fileId: 'sticker_daily_20', labelKey: 'sticker.daily_20', label: '최고' }
];

const EMOTICONS_ANIMAL = [
  { id: 'sticker_animal_1', fileId: 'sticker_animal_1', labelKey: 'sticker.animal_1', label: '냥이 안녕' },
  { id: 'sticker_animal_2', fileId: 'sticker_animal_2', labelKey: 'sticker.animal_2', label: '냥이 감사' },
  { id: 'sticker_animal_3', fileId: 'sticker_animal_3', labelKey: 'sticker.animal_3', label: '냥이 응원' },
  { id: 'sticker_animal_4', fileId: 'sticker_animal_4', labelKey: 'sticker.animal_4', label: '냥이 하트' },
  { id: 'sticker_animal_5', fileId: 'sticker_animal_5', labelKey: 'sticker.animal_5', label: '냥이 슬픔' },
  { id: 'sticker_animal_6', fileId: 'sticker_animal_6', labelKey: 'sticker.animal_6', label: '댕댕 안녕' },
  { id: 'sticker_animal_7', fileId: 'sticker_animal_7', labelKey: 'sticker.animal_7', label: '댕댕 감사' },
  { id: 'sticker_animal_8', fileId: 'sticker_animal_8', labelKey: 'sticker.animal_8', label: '댕댕 최고' },
  { id: 'sticker_animal_9', fileId: 'sticker_animal_9', labelKey: 'sticker.animal_9', label: '댕댕 하트' },
  { id: 'sticker_animal_10', fileId: 'sticker_animal_10', labelKey: 'sticker.animal_10', label: '댕댕 슬픔' },
  { id: 'sticker_animal_11', fileId: 'sticker_animal_11', labelKey: 'sticker.animal_11', label: '곰돌 인사' },
  { id: 'sticker_animal_12', fileId: 'sticker_animal_12', labelKey: 'sticker.animal_12', label: '곰돌 응원' },
  { id: 'sticker_animal_13', fileId: 'sticker_animal_13', labelKey: 'sticker.animal_13', label: '곰돌 축하' },
  { id: 'sticker_animal_14', fileId: 'sticker_animal_14', labelKey: 'sticker.animal_14', label: '토끼 하트' },
  { id: 'sticker_animal_15', fileId: 'sticker_animal_15', labelKey: 'sticker.animal_15', label: '토끼 메롱' },
  { id: 'sticker_animal_16', fileId: 'sticker_animal_16', labelKey: 'sticker.animal_16', label: '판다 굿' },
  { id: 'sticker_animal_17', fileId: 'sticker_animal_17', labelKey: 'sticker.animal_17', label: '판다 쿨쿨' },
  { id: 'sticker_animal_18', fileId: 'sticker_animal_18', labelKey: 'sticker.animal_18', label: '햄찌 냠냠' },
  { id: 'sticker_animal_19', fileId: 'sticker_animal_19', labelKey: 'sticker.animal_19', label: '햄찌 미안' },
  { id: 'sticker_animal_20', fileId: 'sticker_animal_20', labelKey: 'sticker.animal_20', label: '아기새 럽' }
];

const EMOTICONS_NEON = [
  { id: 'sticker_reaction_1', fileId: 'sticker_reaction_1', labelKey: 'sticker.reaction_1', label: 'OK' },
  { id: 'sticker_reaction_2', fileId: 'sticker_reaction_2', labelKey: 'sticker.reaction_2', label: 'YES' },
  { id: 'sticker_reaction_3', fileId: 'sticker_reaction_3', labelKey: 'sticker.reaction_3', label: 'NO' },
  { id: 'sticker_reaction_4', fileId: 'sticker_reaction_4', labelKey: 'sticker.reaction_4', label: '대박' },
  { id: 'sticker_reaction_5', fileId: 'sticker_reaction_5', labelKey: 'sticker.reaction_5', label: '축하축하' },
  { id: 'sticker_reaction_6', fileId: 'sticker_reaction_6', labelKey: 'sticker.reaction_6', label: '화이팅' },
  { id: 'sticker_reaction_7', fileId: 'sticker_reaction_7', labelKey: 'sticker.reaction_7', label: '인정' },
  { id: 'sticker_reaction_8', fileId: 'sticker_reaction_8', labelKey: 'sticker.reaction_8', label: '깜놀' },
  { id: 'sticker_reaction_9', fileId: 'sticker_reaction_9', labelKey: 'sticker.reaction_9', label: '헐' },
  { id: 'sticker_reaction_10', fileId: 'sticker_reaction_10', labelKey: 'sticker.reaction_10', label: '쉿' },
  { id: 'sticker_reaction_11', fileId: 'sticker_reaction_11', labelKey: 'sticker.reaction_11', label: '굿모닝' },
  { id: 'sticker_reaction_12', fileId: 'sticker_reaction_12', labelKey: 'sticker.reaction_12', label: '굿나잇' },
  { id: 'sticker_reaction_13', fileId: 'sticker_reaction_13', labelKey: 'sticker.reaction_13', label: '문의하기' },
  { id: 'sticker_reaction_14', fileId: 'sticker_reaction_14', labelKey: 'sticker.reaction_14', label: '주문완료' },
  { id: 'sticker_reaction_15', fileId: 'sticker_reaction_15', labelKey: 'sticker.reaction_15', label: '예약완료' },
  { id: 'sticker_reaction_16', fileId: 'sticker_reaction_16', labelKey: 'sticker.reaction_16', label: '약속완료' },
  { id: 'sticker_reaction_17', fileId: 'sticker_reaction_17', labelKey: 'sticker.reaction_17', label: '환영해요' },
  { id: 'sticker_reaction_18', fileId: 'sticker_reaction_18', labelKey: 'sticker.reaction_18', label: '감사해요' },
  { id: 'sticker_reaction_19', fileId: 'sticker_reaction_19', labelKey: 'sticker.reaction_19', label: '최고에요' },
  { id: 'sticker_reaction_20', fileId: 'sticker_reaction_20', labelKey: 'sticker.reaction_20', label: '수고했어' }
];

export interface ChatInputBarProps {
  roomId: string;
  room: ChatRoom | null;
  user: UserProfile | any;
  inputText: string;
  setInputText: (val: string) => void;
  replyTo: ChatMessage | null;
  setReplyTo: (msg: ChatMessage | null) => void;
  isSilentMode: boolean;
  setIsSilentMode: (val: boolean) => void;
  showSilentOption: boolean;
  setShowSilentOption: (val: boolean) => void;
  isStickerDrawerOpen: boolean;
  setIsStickerDrawerOpen: (val: boolean) => void;
  isFeatureDrawerOpen: boolean;
  setIsFeatureDrawerOpen: (val: boolean) => void;
  
  previewMedia: { file: File | Blob, url: string, type: 'image' | 'video' | 'voice' } | null;
  isUploading: boolean;
  uploadProgress: number;
  confirmAndSendMedia: () => Promise<void>;
  cancelMediaPreview: () => void;
  
  isRecording: boolean;
  recordDuration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  
  isMentionOpen: boolean;
  setIsMentionOpen: (val: boolean) => void;
  mentionFilter: string;
  filteredMentionTargets: { id: string; name: string; label: string; desc: string; icon?: string; isRole?: boolean }[];
  handleInputChange: (val: string) => void;
  handleSelectMention: (targetName: string) => void;
  
  handleSend: () => Promise<void>;
  handleFileUpload: (files: FileList | File[] | File) => Promise<void>;
  
  setIsMeetupModalOpen: (val: boolean) => void;
  setIsSettlementModalOpen: (val: boolean) => void;
  setIsPollModalOpen: (val: boolean) => void;
  triggerEmotionEffect: (text: string) => void;
  
  t: (key: string, ...args: any[]) => string;
}

export default function ChatInputBar({
  roomId,
  room,
  user,
  inputText,
  setInputText,
  replyTo,
  setReplyTo,
  isSilentMode,
  setIsSilentMode,
  showSilentOption,
  setShowSilentOption,
  isStickerDrawerOpen,
  setIsStickerDrawerOpen,
  isFeatureDrawerOpen,
  setIsFeatureDrawerOpen,
  previewMedia,
  isUploading,
  uploadProgress,
  confirmAndSendMedia,
  cancelMediaPreview,
  isRecording,
  recordDuration,
  startRecording,
  stopRecording,
  isMentionOpen,
  setIsMentionOpen,
  mentionFilter,
  filteredMentionTargets,
  handleInputChange,
  handleSelectMention,
  handleSend,
  handleFileUpload,
  setIsMeetupModalOpen,
  setIsSettlementModalOpen,
  setIsPollModalOpen,
  triggerEmotionEffect,
  t
}: ChatInputBarProps) {
  const [activeStickerTab, setActiveStickerTab] = React.useState<'daily' | 'animal' | 'neon'>('daily');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleSendSticker = async (stickerId: string, stickerFileId: string) => {
    if (!user) return;
    try {
      const stickerUrl = `/stickers/${stickerFileId}.svg`;
      triggerEmotionEffect(stickerId);
      
      await chatService.sendMessage({
        roomId,
        senderId: user.uid,
        senderName: user.displayName || 'Anonymous',
        text: t('chatroom.sent_sticker', '이모티콘을 보냈습니다.'),
        type: 'sticker',
        mediaUrl: stickerUrl
      });
      setIsStickerDrawerOpen(false);
    } catch (e) {
      console.error(e);
      toast.error(t('common.error', '전송에 실패했습니다.'));
    }
  };

  const startLongPress = (e: React.MouseEvent | React.TouchEvent) => {
    if (!inputText.trim()) return;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setShowSilentOption(true);
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const getStickersByTab = () => {
    if (activeStickerTab === 'animal') return EMOTICONS_ANIMAL;
    if (activeStickerTab === 'neon') return EMOTICONS_NEON;
    return EMOTICONS_DAILY;
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-100/50 bg-white z-20 flex flex-col shrink-0 relative pb-safe-bottom">
      {/* Pended Media Preview */}
      <AnimatePresence>
        {previewMedia && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 py-4 border-b border-gray-100 bg-[#fbfbfb] flex flex-col gap-3 shrink-0 relative overflow-hidden"
          >
            <div className="flex items-center justify-between shrink-0 bg-transparent">
              <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest leading-none">
                {previewMedia.type === 'image' ? t('chatroom.preview_image', '이미지 전송 확인') : previewMedia.type === 'video' ? t('chatroom.preview_video', '동영상 전송 확인') : t('chatroom.preview_voice', '음성 메시지 전송 확인')}
              </span>
              <button 
                onClick={cancelMediaPreview}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all active:scale-90"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              {previewMedia.type === 'image' && (
                <div className="w-24 h-18 rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-200">
                  <img src={previewMedia.url} className="w-full h-full object-cover" alt="" />
                </div>
              )}
              {previewMedia.type === 'video' && (
                <div className="w-24 h-18 rounded-2xl overflow-hidden bg-gray-900 shadow-sm border border-gray-800 flex items-center justify-center relative">
                  <video src={previewMedia.url} className="w-full h-full object-cover" />
                  <span className="material-symbols-outlined text-white text-[24px] absolute">play_arrow</span>
                </div>
              )}
              {previewMedia.type === 'voice' && (
                <div className="flex-1 flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-gray-200/60 shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 animate-pulse">
                    <span className="material-symbols-outlined text-[20px] font-black">mic</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[12.5px] font-black text-gray-700 tracking-tight leading-none block mb-1">
                      {t('chat.voice_recorded', '음성 녹음 완료')}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 block tracking-widest leading-none">
                      {t('chat.ready_to_send', '전송할 준비가 되었습니다')}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex-1 flex flex-col justify-center">
                <button
                  disabled={isUploading}
                  onClick={confirmAndSendMedia}
                  className="w-full max-w-[140px] bg-primary text-white font-black text-xs py-3 rounded-2xl hover:bg-primary/95 active:scale-95 transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px] font-black">send</span>
                  <span>{isUploading ? t('chatroom.sending', '전송 중...') : t('chatroom.send_media', '전송하기')}</span>
                </button>
              </div>
            </div>
            
            {/* Progress Bar */}
            {isUploading && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pended Voice Recorder */}
      <AnimatePresence>
        {isRecording && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 60, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 border-b border-gray-100 bg-rose-50/50 flex items-center justify-between shrink-0 relative overflow-hidden"
          >
            <div className="flex items-center gap-3.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
              </span>
              <span className="text-[13px] font-black text-rose-500 uppercase tracking-widest">
                {t('chat.recording_voice', '음성 메시지 녹음 중')}... {recordDuration}s
              </span>
            </div>
            <button 
              onClick={stopRecording}
              className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px] font-black">stop</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply header wrapper */}
      {replyTo && (
        <div className="px-5 py-2.5 border-b border-gray-100 bg-[#fafafa] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <span className="material-symbols-outlined text-[16px] text-gray-400">reply</span>
            <span>
              {replyTo.senderName || 'User'}: {replyTo.text}
            </span>
          </div>
          <button 
            onClick={() => setReplyTo(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className="px-3.5 py-2.5 flex items-end gap-2 bg-white relative">
        {/* Hidden inputs */}
        <input ref={fileInputRef} type="file" multiple onChange={(e) => e.target.files && handleFileUpload(e.target.files)} className="hidden" accept="image/*,video/*" />
        <input ref={cameraInputRef} type="file" capture="environment" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} className="hidden" accept="image/*" />
        <input ref={albumInputRef} type="file" multiple onChange={(e) => e.target.files && handleFileUpload(e.target.files)} className="hidden" accept="image/*" />
        <input ref={videoInputRef} type="file" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} className="hidden" accept="video/*" />

        {/* Feature board drawer button */}
        <button 
          onClick={() => {
            setIsStickerDrawerOpen(false);
            setIsFeatureDrawerOpen(!isFeatureDrawerOpen);
          }}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            isFeatureDrawerOpen ? 'bg-primary text-white scale-102 rotate-45' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">add</span>
        </button>

        {/* Hidden File select bypass (for quick action) */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 md:flex hidden"
        >
          <span className="material-symbols-outlined text-[24px]">image</span>
        </button>

        {/* Custom Textarea Input */}
        <div className="flex-1 relative flex items-end border border-gray-100 rounded-[22px] bg-gray-50 px-3.5 py-1.5 focus-within:bg-white focus-within:border-primary/20 transition-all min-h-[40px] max-h-[140px] overflow-hidden">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={t('chatroom.placeholder_input', '메시지를 입력해 주세요...')}
            className="w-full text-[14.5px] leading-relaxed bg-transparent border-0 focus:ring-0 focus:outline-hidden p-0 resize-none max-h-[120px] overflow-y-auto no-scrollbar font-medium text-gray-800 placeholder:text-gray-300"
          />

          {/* Sticker button inside Input */}
          <button 
            onClick={() => {
              setIsFeatureDrawerOpen(false);
              setIsStickerDrawerOpen(!isStickerDrawerOpen);
            }}
            className={`w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all self-end shrink-0 ${
              isStickerDrawerOpen ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">sentiment_satisfied</span>
          </button>
        </div>

        {/* Right side buttons: Mic or Send */}
        {!inputText.trim() ? (
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#fff0f2] hover:text-[#ff3b5c] transition-all bg-gray-50 hover:shadow-xs active:scale-90"
          >
            <span className="material-symbols-outlined text-[22px]">mic</span>
          </button>
        ) : (
          <div className="relative self-end">
            <button 
              onClick={handleSend}
              onMouseDown={startLongPress}
              onMouseUp={cancelLongPress}
              onMouseLeave={cancelLongPress}
              onTouchStart={startLongPress}
              onTouchEnd={cancelLongPress}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-primary text-white hover:bg-primary/95 shadow-sm hover:shadow-md active:scale-92 transition-all"
            >
              <span className="material-symbols-outlined text-[20px] font-black">send</span>
            </button>

            {/* Silent send float options */}
            <AnimatePresence>
              {showSilentOption && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-11 right-0 bg-white shadow-xl border border-gray-100 rounded-2xl p-2 z-50 flex flex-col gap-1 min-w-[130px] overflow-hidden text-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    onClick={() => {
                      setIsSilentMode(!isSilentMode);
                      setShowSilentOption(false);
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all ${
                      isSilentMode 
                        ? 'bg-rose-50 text-rose-500 font-black' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">notifications_off</span>
                    <span>{isSilentMode ? t('chat.silent_push_active', '조용히 보내기 ON') : t('chat.silent_push', '조용히 보내기')}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Mention targets popup modal */}
        <AnimatePresence>
          {isMentionOpen && filteredMentionTargets.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute bottom-15 left-4 right-4 bg-white rounded-3xl p-3 border border-gray-100 shadow-2xl z-50 flex flex-col max-h-[220px] overflow-y-auto no-scrollbar gap-1 text-left"
            >
              <div className="px-3 py-1 border-b border-gray-50/50 mb-1 flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('mention.title', '멤버 언급')}</span>
                <span className="text-[9px] font-bold text-gray-300">@{t('mention.type_to_filter', '타이핑 검색')}</span>
              </div>
              
              {filteredMentionTargets.map((target) => (
                <button
                  key={target.id}
                  onClick={() => handleSelectMention(target.name)}
                  className="w-full px-3 py-2 rounded-2xl flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  {target.isRole ? (
                    <div className="w-8.5 h-8.5 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px] font-black">{target.icon}</span>
                    </div>
                  ) : target.icon ? (
                    <img src={target.icon} className="w-8.5 h-8.5 rounded-2xl object-cover shrink-0 ring-2 ring-white shadow-2xs" alt="" />
                  ) : (
                    <div className="w-8.5 h-8.5 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">person</span>
                    </div>
                  )}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[13px] font-black text-gray-800 leading-none mb-1">{target.label}</span>
                    <span className="text-[9.5px] font-bold text-gray-400 truncate tracking-wide leading-none">{target.desc}</span>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticker Drawer */}
      <AnimatePresence>
        {isStickerDrawerOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 320, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-t border-gray-100 overflow-hidden relative z-20 flex flex-col shrink-0"
          >
            {/* Tab header */}
            <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex gap-1.5">
                {[
                  { key: 'daily', label: t('sticker.tab_daily', '일상') },
                  { key: 'animal', label: t('sticker.tab_animal', '동물') },
                  { key: 'neon', label: t('sticker.tab_neon', '리액션') }
                ].map(tab => (
                  <button 
                    key={tab.key}
                    onClick={() => setActiveStickerTab(tab.key as any)}
                    className={`px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                      activeStickerTab === tab.key 
                        ? 'bg-primary/5 text-primary scale-102' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setIsStickerDrawerOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            
            {/* Grid */}
            <div className="flex-1 p-4 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-x-2 gap-y-4">
                {getStickersByTab().map(sticker => {
                  const stickerUrl = `/stickers/${sticker.fileId}.svg`;
                  return (
                    <button 
                      key={sticker.id}
                      onClick={() => handleSendSticker(sticker.id, sticker.fileId)}
                      className="group flex flex-col items-center gap-1.5 hover:scale-105 active:scale-95 transition-all p-1.5 rounded-2xl hover:bg-gray-50/50"
                      title={t(sticker.labelKey, sticker.label)}
                    >
                      <div className="w-14 h-14 select-none pointer-events-none">
                        <img src={stickerUrl} className="w-full h-full object-contain" alt="" />
                      </div>
                      <span className="text-[9.5px] font-bold text-gray-400 group-hover:text-gray-600 transition-colors truncate w-full text-center">{t(sticker.labelKey, sticker.label)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feature Board Drawer */}
      <AnimatePresence>
        {isFeatureDrawerOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 380, opacity: 1 }}
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
            <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-x-3 gap-y-5 w-full max-w-2xl px-2 sm:px-4 justify-items-center">
                
                {/* Feature 1: Image Album */}
                <button 
                  onClick={() => {
                    setIsFeatureDrawerOpen(false);
                    albumInputRef.current?.click();
                  }}
                  className="group flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-all w-full max-w-[80px]"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] bg-blue-50 hover:bg-blue-100 text-blue-500 flex items-center justify-center shadow-sm border border-blue-100/50 group-hover:shadow-md transition-all">
                    <span className="material-symbols-outlined text-[26px] sm:text-[28px]">image</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-black text-gray-500 group-hover:text-gray-800 transition-colors truncate">{t('chatroom.album', '앨범')}</span>
                </button>

                {/* Feature 2: Camera */}
                <button 
                  onClick={() => {
                    setIsFeatureDrawerOpen(false);
                    cameraInputRef.current?.click();
                  }}
                  className="group flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-all w-full max-w-[80px]"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center shadow-sm border border-rose-100/50 group-hover:shadow-md transition-all">
                    <span className="material-symbols-outlined text-[26px] sm:text-[28px]">photo_camera</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-black text-gray-500 group-hover:text-gray-800 transition-colors truncate">{t('chatroom.camera', '카메라')}</span>
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
                    <span className="material-symbols-outlined text-[26px] sm:text-[28px]">calendar_today</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-black text-gray-500 group-hover:text-gray-800 transition-colors truncate">{t('chatroom.schedule', '톡캘린더')}</span>
                </button>

                {/* Feature 5: Settlement */}
                <button 
                  onClick={() => {
                    setIsFeatureDrawerOpen(false);
                    setIsSettlementModalOpen(true);
                  }}
                  className="group flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-all w-full max-w-[80px]"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] bg-emerald-50 hover:bg-emerald-100 text-emerald-500 flex items-center justify-center shadow-sm border border-emerald-100/50 group-hover:shadow-md transition-all">
                    <span className="material-symbols-outlined text-[26px] sm:text-[28px]">payments</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-black text-gray-500 group-hover:text-gray-800 transition-colors truncate">{t('chatroom.remittance', '송금/정산')}</span>
                </button>

                {/* Feature 6: Polls */}
                <button 
                  onClick={() => {
                    setIsFeatureDrawerOpen(false);
                    setIsPollModalOpen(true);
                  }}
                  className="group flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-all w-full max-w-[80px]"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] bg-teal-50 hover:bg-teal-100 text-teal-500 flex items-center justify-center shadow-sm border border-teal-100/50 group-hover:shadow-md transition-all">
                    <span className="material-symbols-outlined text-[26px] sm:text-[28px]">ballot</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-black text-gray-500 group-hover:text-gray-800 transition-colors truncate">{t('chatroom.vote', '투표')}</span>
                </button>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
