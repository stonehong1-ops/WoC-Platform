'use client';

import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { chatService } from '@/lib/firebase/chatService';
import { ChatMessage } from '@/types/chat';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { safeDate } from '@/lib/utils/safeDate';
import { toast } from 'sonner';

interface MeetupCardProps {
  message: ChatMessage;
}

// 개별 참석자 아바타 실시간 바인딩 컴포넌트
function AttendeeAvatar({ uid }: { uid: string }) {
  const [profile, setProfile] = useState<{ nickname?: string; photoUrl?: string } | null>(null);

  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      try {
        const uDoc = await getDoc(doc(db, 'users', uid));
        if (uDoc.exists() && active) {
          setProfile(uDoc.data());
        }
      } catch (e) {
        console.error("Error loading attendee profile:", e);
      }
    };
    fetchProfile();
    return () => { active = false; };
  }, [uid]);

  const name = profile?.nickname || '...';
  const img = profile?.photoUrl;

  return (
    <div 
      className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden shrink-0 shadow-sm relative group cursor-pointer"
      title={name}
    >
      {img ? (
        <img src={img} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-[10px] font-black uppercase">
          {name.charAt(0)}
        </div>
      )}
    </div>
  );
}

export default function MeetupCard({ message }: MeetupCardProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const metadata = message.metadata || {};
  const dateStr = metadata.date || '';
  const location = metadata.location || '';
  const maxCapacity = metadata.maxCapacity || 0;
  const attendees = metadata.attendees || [];
  const description = metadata.description || '';
  const isConfirmed = metadata.isConfirmed || false;

  const isOwn = message.senderId === user?.uid;
  const isAttending = user ? attendees.includes(user.uid) : false;
  const isFull = maxCapacity > 0 && attendees.length >= maxCapacity;

  const handleToggleAttendance = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await chatService.toggleMeetupAttendance(message.id, user.uid);
      toast.success(isAttending ? t('chat.meetup_left_toast', '약속 참여가 취소되었습니다.') : t('chat.meetup_joined_toast', '약속 참여 신청이 완료되었습니다!'));
    } catch (err: any) {
      if (err.message === 'Meetup is full') {
        toast.error(t('chat.meetup_full_toast', '정원이 마감되어 신청할 수 없습니다.'));
      } else {
        toast.error(t('chat.meetup_action_failed', '처리에 실패했습니다. 다시 시도해 주세요.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSchedule = async () => {
    setLoading(true);
    try {
      await chatService.confirmMeetupSchedule(message.id);
      toast.success(t('chat.meetup_confirmed_toast', '약속 일정이 최종 확정되었습니다!'));
    } catch (err) {
      toast.error(t('chat.meetup_action_failed', '처리에 실패했습니다. 다시 시도해 주세요.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[340px] bg-white/90 border border-gray-100 rounded-3xl p-5 shadow-md relative overflow-hidden transition-all duration-300 hover:shadow-lg my-2">
      {/* Confirmed Accent Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${isConfirmed ? 'bg-green-500' : 'bg-primary'}`} />

      {/* Top Section: Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-[20px] ${isConfirmed ? 'text-green-500' : 'text-primary'}`}>
            {isConfirmed ? 'task_alt' : 'calendar_today'}
          </span>
          <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">
            {isConfirmed ? t('chat.meetup_confirmed', '확정된 대화 약속') : t('chat.meetup_proposal', '약속 조율 중')}
          </span>
        </div>
        {maxCapacity > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100/50 rounded-full text-gray-500">
            {attendees.length} / {maxCapacity} {t('chat.people_unit', '명')}
          </span>
        )}
      </div>

      {/* Meetup Title & Description */}
      <div className="mb-4">
        <h4 className="text-[15px] font-extrabold text-gray-800 mb-1 leading-snug">
          {message.text}
        </h4>
        {description && (
          <p className="text-[12px] font-medium text-gray-500 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Meetup Details: Date & Location */}
      <div className="bg-gray-50/50 rounded-2xl p-3.5 space-y-2.5 border border-gray-100/30 mb-5">
        <div className="flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[16px] text-gray-400 mt-0.5">schedule</span>
          <div className="flex flex-col">
            <span className="text-[12px] font-bold text-gray-700">
              {dateStr ? new Date(dateStr).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' }) : t('chat.no_date', '일정 미지정')}
            </span>
          </div>
        </div>

        {location && (
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[16px] text-gray-400 mt-0.5">location_on</span>
            <span className="text-[12px] font-bold text-gray-700 leading-tight">
              {location}
            </span>
          </div>
        )}
      </div>

      {/* Attendees Stack */}
      {attendees.length > 0 && (
        <div className="mb-5">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2.5">
            {t('chat.attendees', '참석자 목록')}
          </div>
          <div className="flex -space-x-2.5 overflow-hidden pb-1">
            {attendees.map((uid) => (
              <AttendeeAvatar key={uid} uid={uid} />
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        {/* Attendee Toggle Button */}
        {!isConfirmed && (
          <button
            onClick={handleToggleAttendance}
            disabled={loading || (!isAttending && isFull)}
            className={`w-full py-3 rounded-2xl text-[13px] font-black transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm ${
              isAttending 
                ? 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-100'
                : (isFull 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-100'
                    : 'bg-primary text-white hover:bg-primary-dark hover:shadow-md')
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isAttending ? 'logout' : 'login'}
            </span>
            {isAttending 
              ? t('chat.leave_meetup', '참석 취소') 
              : (isFull ? t('chat.meetup_full', '정원 마감') : t('chat.join_meetup', '참석하기'))}
          </button>
        )}

        {/* Creator Confirmation Panel */}
        {isOwn && !isConfirmed && (
          <button
            onClick={handleConfirmSchedule}
            disabled={loading}
            className="w-full py-3 bg-green-500 text-white rounded-2xl text-[13px] font-black hover:bg-green-600 hover:shadow-md transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            {t('chat.confirm_meetup', '일정 최종 확정하기')}
          </button>
        )}

        {/* Confirmed Banner */}
        {isConfirmed && (
          <div className="w-full py-3 bg-green-50/50 border border-green-100 rounded-2xl text-[12px] font-bold text-green-600 flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            {t('chat.meetup_confirmed_desc', '확정되어 캘린더에 연동되었습니다.')}
          </div>
        )}
      </div>
    </div>
  );
}
