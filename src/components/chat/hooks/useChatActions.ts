import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { chatService } from '@/lib/firebase/chatService';
import { userService } from '@/lib/firebase/userService';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import type { ChatRoom, ChatMessage, MessageType } from '@/types/chat';

export interface UseChatActionsProps {
  roomId: string;
  room: ChatRoom | null;
  otherUsers: any[];
  allInviteUsers: any[];
  setAllInviteUsers: (users: any[]) => void;
  selectedInviteUserIds: Set<string>;
  setSelectedInviteUserIds: (ids: Set<string>) => void;
  triggerEmotionEffect: (text: string) => void;
}

export function useChatActions({
  roomId,
  room,
  otherUsers,
  allInviteUsers,
  setAllInviteUsers,
  selectedInviteUserIds,
  setSelectedInviteUserIds,
  triggerEmotionEffect
}: UseChatActionsProps) {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  // Input & Reply States
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [isSilentMode, setIsSilentMode] = useState(false);
  const [showSilentOption, setShowSilentOption] = useState(false);

  // Invite states
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');

  // Media upload & voice states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewMedia, setPreviewMedia] = useState<{ file: File | Blob, url: string, type: 'image' | 'video' | 'voice' } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);

  // Translation states
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());

  // Features Modal/Drawer States
  const [isMeetupModalOpen, setIsMeetupModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [isStickerDrawerOpen, setIsStickerDrawerOpen] = useState(false);
  const [isFeatureDrawerOpen, setIsFeatureDrawerOpen] = useState(false);

  // Meetup fields
  const [meetupTitle, setMeetupTitle] = useState('');
  const [meetupDate, setMeetupDate] = useState('');
  const [meetupLocation, setMeetupLocation] = useState('');
  const [meetupMaxCapacity, setMeetupMaxCapacity] = useState('5');
  const [meetupDescription, setMeetupDescription] = useState('');

  // Settlement fields
  const [settlementTitle, setSettlementTitle] = useState('');
  const [settlementTotalAmount, setSettlementTotalAmount] = useState('');
  const [settlementBankName, setSettlementBankName] = useState('');
  const [settlementAccountNumber, setSettlementAccountNumber] = useState('');

  // Poll fields
  const [pollTitle, setPollTitle] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false);

  // Mention states
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Invite user effect
  useEffect(() => {
    if (inviteSearchQuery && room) {
      userService.getAllUsers().then(users => {
        const activeParticipants = new Set(room.participants || []);
        const filtered = users.filter(u => 
          !activeParticipants.has(u.id) &&
          (u.nickname || (u as any).displayName || '').toLowerCase().includes(inviteSearchQuery.toLowerCase())
        );
        setAllInviteUsers(filtered);
      }).catch(console.error);
    }
  }, [inviteSearchQuery, room]);

  const handleInviteUsers = async () => {
    if (!user || !room || selectedInviteUserIds.size === 0 || isInviting) return;
    setIsInviting(true);
    try {
      const inviteeIds = Array.from(selectedInviteUserIds);
      
      if (room.participants.length === 2) {
        const allNewParticipants = Array.from(new Set([...room.participants, ...inviteeIds]));
        const newRoomId = await chatService.createGeneralGroupChatRoom(allNewParticipants, user.uid);
        
        setSelectedInviteUserIds(new Set());
        router.push(`/chat?roomId=${newRoomId}`);
        toast.success(t('chatroom.group_created_toast', '새로운 단체 대화방이 생성되었습니다!'));
      } else {
        await chatService.inviteUser(room.id, inviteeIds);
        for (const invitedId of inviteeIds) {
          await chatService.sendGroupSystemMessage(room.id, invitedId, 'join');
        }
        setSelectedInviteUserIds(new Set());
        toast.success(t('chatroom.users_invited_toast', '사용자가 초대되었습니다!'));
      }
    } catch (err) {
      console.error("Failed to invite users:", err);
      toast.error(t('common.error', '사용자 초대에 실패했습니다.'));
    } finally {
      setIsInviting(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !user || !profile?.isRegistered) return;
    const text = inputText;
    setInputText('');
    
    triggerEmotionEffect(text);
    
    await chatService.sendMessage({
      roomId,
      senderId: user.uid,
      senderName: profile?.nickname || user.displayName || 'User',
      text,
      type: 'text',
      replyTo: replyTo?.id,
      metadata: isSilentMode ? { isSilent: true } : undefined
    });
    setReplyTo(null);
    setIsSilentMode(false);
  };

  const handleTranslate = async (msgId: string, text: string) => {
    if (translations[msgId]) {
      const newTrans = { ...translations };
      delete newTrans[msgId];
      setTranslations(newTrans);
      return;
    }

    setTranslatingIds(prev => new Set(prev).add(msgId));
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

  const handleFileUpload = async (files: FileList | File[] | File) => {
    if (!user) return;

    // files가 단일 File 객체인 경우
    if (files instanceof File) {
      const type: MessageType = files.type.startsWith('image/') ? 'image' : 'video';
      const url = URL.createObjectURL(files);
      setPreviewMedia({ file: files, url, type });
      return;
    }

    // FileList 또는 File[] 인 경우
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    if (fileList.length === 1) {
      const file = fileList[0];
      const type: MessageType = file.type.startsWith('image/') ? 'image' : 'video';
      const url = URL.createObjectURL(file);
      setPreviewMedia({ file, url, type });
    } else {
      // 복수 개인 경우 백그라운드 순차 발송
      setIsUploading(true);
      setUploadProgress(0);

      const toastId = toast.loading(t('chat.uploading_multiple', '여러 장의 사진을 업로드하는 중입니다...'));

      try {
        let completed = 0;
        for (const file of fileList) {
          const type: MessageType = file.type.startsWith('image/') ? 'image' : 'video';
          const extension = file.name.split('.').pop() || 'bin';
          const path = `chat/${roomId}/${Date.now()}_media_${completed}.${extension}`;

          const url = await chatService.uploadChatMedia(file, path, (p) => {
            const currentProgress = Math.round(((completed + p / 100) / fileList.length) * 100);
            setUploadProgress(currentProgress);
          });

          const defaultText = type === 'image' ? t('chatroom.sent_photo') : t('chatroom.sent_video');
          await chatService.sendMessage({
            roomId,
            senderId: user.uid,
            senderName: profile?.nickname || user.displayName || 'User',
            text: defaultText,
            type,
            mediaUrl: url
          });

          completed++;
        }
        toast.success(t('chat.upload_multiple_success', '모든 파일 전송 완료!'), { id: toastId });
      } catch (err) {
        console.error("Multi-upload failed:", err);
        toast.error(t('common.error', '업로드에 실패했습니다.'), { id: toastId });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
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
        senderName: profile?.nickname || user.displayName || 'User',
        text: defaultText,
        type,
        mediaUrl: url
      });
      setPreviewMedia(null);
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error(t('common.error', '업로드에 실패했습니다.'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const cancelMediaPreview = () => {
    if (previewMedia?.url) URL.revokeObjectURL(previewMedia.url);
    setPreviewMedia(null);
  };

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

  const handleCreateMeetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetupTitle.trim() || !user) return;

    try {
      await chatService.sendMessage({
        roomId,
        senderId: user.uid,
        senderName: profile?.nickname || user.displayName || 'User',
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

  const handleCreateSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementTitle.trim() || !settlementTotalAmount || !settlementBankName || !settlementAccountNumber || !user || !room) return;

    try {
      const total = parseInt(settlementTotalAmount) || 0;
      const numParticipants = room.participants?.length || 1;
      const perPerson = Math.round(total / numParticipants);

      await chatService.sendSettlementMessage(roomId, user.uid, profile?.nickname || user.displayName || 'User', {
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
        senderName: profile?.nickname || user.displayName || 'User',
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

  return {
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
    setPreviewMedia,
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
    handleCreatePoll,
  };
}
