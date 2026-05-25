'use client';

import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { chatService } from '@/lib/firebase/chatService';
import { ChatMessage } from '@/types/chat';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface SettlementCardProps {
  message: ChatMessage;
}

// 개별 입금자 프로필 아바타 & 수납 배지 실시간 바인딩 컴포넌트
function PayerAvatar({ uid, isPaid }: { uid: string; isPaid: boolean }) {
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
        console.error("Error loading payer profile:", e);
      }
    };
    fetchProfile();
    return () => { active = false; };
  }, [uid]);

  const name = profile?.nickname || '...';
  const img = profile?.photoUrl;

  return (
    <div className="relative shrink-0" title={`${name} (${isPaid ? '입금 완료' : '미입금'})`}>
      <div 
        className={`w-9 h-9 rounded-full border-2 bg-gray-200 overflow-hidden shadow-sm transition-all duration-300 ${
          isPaid ? 'border-green-500 scale-105' : 'border-gray-200 opacity-60'
        }`}
      >
        {img ? (
          <img src={img} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-amber-50 text-amber-600 text-[10px] font-black uppercase">
            {name.charAt(0)}
          </div>
        )}
      </div>
      
      {/* Paid Check Overlay Badge */}
      {isPaid && (
        <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-green-500 text-white border border-white flex items-center justify-center shadow-xs">
          <span className="material-symbols-outlined text-[10px] font-black">check</span>
        </span>
      )}
    </div>
  );
}

export default function SettlementCard({ message }: SettlementCardProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const metadata = message.metadata || {};
  const settlementId = metadata.settlementId || '';
  const title = metadata.title || '';
  const totalAmount = metadata.totalAmount || 0;
  const perPersonAmount = metadata.perPersonAmount || 0;
  const bankName = metadata.bankName || '';
  const accountNumber = metadata.accountNumber || '';
  const attendees: string[] = metadata.attendees || [];
  const paidUsers: string[] = metadata.paidUsers || [];

  const isOwn = message.senderId === user?.uid;
  const isPaid = user ? paidUsers.includes(user.uid) : false;

  const handleTogglePayment = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await chatService.toggleSettlementPayment(message.id, user.uid);
      toast.success(
        isPaid 
          ? t('chat.settlement_unpaid_toast', '송금 완료 체크를 해제했습니다.') 
          : t('chat.settlement_paid_toast', '입금 완료가 확인자에게 전송되었습니다!')
      );
    } catch (err) {
      toast.error(t('chat.settlement_action_failed', '처리에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(`${bankName} ${accountNumber}`);
      toast.success(t('chat.account_copied_toast', '계좌번호가 복사되었습니다!'));
    } catch (err) {
      console.error('Failed to copy account:', err);
    }
  };

  return (
    <div className="w-full max-w-[340px] bg-gradient-to-b from-amber-50/30 to-white/95 border border-amber-100/40 rounded-3xl p-5.5 shadow-md relative overflow-hidden transition-all duration-300 hover:shadow-lg my-2.5">
      {/* Golden/Amber Accent Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-yellow-500" />

      {/* Top Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-amber-500 shrink-0">payments</span>
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-500">
            {t('chatroom.settlement_request', '1/N 정산 요청')}
          </span>
        </div>
        <span className="text-[10px] font-black px-2 py-0.5 bg-amber-50 border border-amber-100/50 rounded-full text-amber-600">
          {paidUsers.length} / {attendees.length} {t('chat.paid_unit', '명 송금')}
        </span>
      </div>

      {/* Settlement Title */}
      <div className="mb-4">
        <h4 className="text-[15px] font-extrabold text-gray-800 mb-1.5 leading-snug">
          {title}
        </h4>
        <div className="flex items-baseline gap-1">
          <span className="text-[20px] font-black text-amber-500 tracking-tight">
            {perPersonAmount.toLocaleString()}
          </span>
          <span className="text-[12px] font-extrabold text-gray-400">{t('chat.currency_unit', '원')}</span>
          <span className="text-[10.5px] font-bold text-gray-400 ml-1.5">
            (총 {totalAmount.toLocaleString()}원)
          </span>
        </div>
      </div>

      {/* Remittance Detail: Bank Info with Copy Action */}
      <button 
        onClick={handleCopyAccount}
        className="w-full bg-white hover:bg-amber-50/30 active:scale-98 text-left rounded-2xl p-3.5 flex items-center justify-between border border-amber-100/30 mb-5 shadow-xs transition-all"
        title={t('chat.click_to_copy_account', '클릭 시 계좌번호 자동 복사')}
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="material-symbols-outlined text-[18px] text-amber-500 shrink-0 mt-0.5">account_balance</span>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">
              {bankName}
            </span>
            <span className="text-[13px] font-extrabold text-gray-700 truncate leading-none">
              {accountNumber}
            </span>
          </div>
        </div>
        <span className="text-[10px] font-black text-amber-600 bg-amber-50/50 px-2 py-1 rounded-lg shrink-0 scale-90">
          {t('chat.copy', '복사')}
        </span>
      </button>

      {/* 7번 기능: 실시간 입금/수납 아바타 현황 트래커 */}
      {attendees.length > 0 && (
        <div className="mb-5 bg-gray-50/30 border border-gray-100/50 p-3 rounded-2xl">
          <div className="text-[9.5px] font-black text-gray-400 uppercase tracking-wider mb-2.5 px-0.5">
            {t('chat.settlement_tracker', '실시간 송금 수납 트래커')}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {attendees.map((uid) => (
              <PayerAvatar key={uid} uid={uid} isPaid={paidUsers.includes(uid)} />
            ))}
          </div>
        </div>
      )}

      {/* Action Remittance Status Buttons */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleTogglePayment}
          disabled={loading}
          className={`w-full py-3 rounded-2xl text-[13px] font-black transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm border ${
            isPaid 
              ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
              : 'bg-amber-500 border-amber-500 text-white hover:bg-amber-600 hover:shadow-md'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {isPaid ? 'verified' : 'send_money'}
          </span>
          {isPaid 
            ? t('chat.settlement_paid_done', '입금 완료됨 ✅') 
            : t('chat.settlement_paid_action', '송금 완료 체크하기')}
        </button>
      </div>
    </div>
  );
}
