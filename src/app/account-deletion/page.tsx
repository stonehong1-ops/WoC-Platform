'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/components/providers/AuthProvider';
import { db } from '@/lib/firebase/clientApp';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export default function AccountDeletionPage() {
  const { t, language } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmitRequest = async () => {
    if (!user) return;
    
    const confirmDelete = window.confirm(
      language === 'KR' 
        ? '정말로 Tango World / WoC 계정 및 모든 데이터를 완전히 삭제하시겠습니까? 이 작업은 즉시 실행되며 복구할 수 없습니다.' 
        : 'Are you sure you want to completely delete your Tango World / WoC account and all data? This action is immediate and irreversible.'
    );
    if (!confirmDelete) return;

    setIsLoading(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Deletion failed');
      }

      await signOut();
      toast.success(
        language === 'KR' 
          ? '계정과 데이터가 성공적으로 완전히 삭제되었습니다. 3초 후 메인 페이지로 이동합니다.' 
          : 'Your account and data have been successfully deleted. Redirecting in 3 seconds.'
      );
      setIsSubmitted(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (err: any) {
      console.error(err);
      toast.error(language === 'KR' ? '탈퇴 처리 중 오류가 발생했습니다: ' + err.message : 'Failed to delete account: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Google Play 필수 규격에 정렬된 mailto 양식
  const mailtoSubject = '[Tango World / WoC] Account or Data Deletion Request';
  const mailtoBody = `Hello, I request deletion for Tango World / WoC.

Request type:
- Delete my account
- Delete specific user data

Registered phone number or email:
Display name / nickname:
Additional details:`;

  const mailtoUrl = `mailto:stonehong1@gmail.com?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`;

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-on-surface min-h-[90vh] flex flex-col justify-center">
      {/* 1. 메인 공통 타이틀 */}
      <div className="text-center mb-12">
        <h1 className="text-2xl md:text-3xl font-black mb-3 font-headline uppercase tracking-tight text-gray-950">
          Tango World / WoC Account & Data Deletion Request
        </h1>
        <p className="text-xs md:text-sm font-semibold text-gray-500 font-body">
          {t('deletion.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* 왼쪽 섹션: 인앱 액션 및 신청 폼 */}
        <div className="space-y-6">
          {user ? (
            /* 로그인 상태 */
            <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-black text-gray-900 mb-2 font-headline uppercase tracking-wide">
                {t('deletion.logged_in_title')}
              </h3>
              <div className="p-4 bg-white rounded-2xl border border-gray-100 mb-6">
                <p className="text-xs font-bold text-gray-800">
                  Nickname: <span className="font-extrabold text-blue-600">{profile?.nickname || 'User'}</span>
                </p>
                <p className="text-xs font-bold text-gray-800 mt-1">
                  Contact: <span className="text-gray-600">{user.phoneNumber || user.email || 'No contact info'}</span>
                </p>
              </div>

              {isSubmitted ? (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-extrabold text-emerald-950 leading-relaxed">
                  {t('deletion.success_alert')}
                </div>
              ) : (
                <button
                  disabled={isLoading}
                  onClick={handleSubmitRequest}
                  className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md disabled:opacity-50 text-[13px] active:scale-[0.98] font-body"
                >
                  {isLoading ? 'Processing...' : (language === 'KR' ? '계정 및 데이터 삭제 신청 (Request Deletion)' : 'Request account and data deletion')}
                </button>
              )}
            </div>
          ) : (
            /* 비로그인 상태 (구글 리뷰어 등 로그인 없이 외부 접속 시 바로 보이는 폼) */
            <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2 font-headline uppercase tracking-wide">
                <span className="material-symbols-outlined text-[18px] text-blue-600">mail</span>
                {language === 'KR' ? '로그인 없이 삭제 요청 (Request without Login)' : 'Request without Login'}
              </h3>
              <p className="text-xs font-semibold text-gray-500 leading-relaxed mb-6 font-body">
                {t('deletion.logged_out_desc')}
              </p>

              <a
                href={mailtoUrl}
                className="block w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-center font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md text-[13px] active:scale-[0.98] font-body"
              >
                {t('deletion.send_email_btn')}
              </a>
            </div>
          )}

          {/* 한국어 가이드 배너 */}
          <div className="bg-red-50/50 border border-red-100 rounded-3xl p-6">
            <h4 className="text-xs font-extrabold text-red-950 mb-2 flex items-center gap-1.5 font-headline">
              <span className="material-symbols-outlined text-[16px] text-red-600">info</span>
              {t('deletion.warning_title')}
            </h4>
            <p className="text-[11px] font-semibold text-red-900/80 leading-relaxed font-body">
              {t('deletion.warning_1')}
            </p>
          </div>
        </div>

        {/* 오른쪽 섹션: 구글 플레이 심사 대응 필수 영문 정책 고정 노출 (Required English Copies) */}
        <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 shadow-md border border-slate-800">
          <h3 className="text-xs font-black tracking-widest text-blue-400 uppercase mb-4 font-headline flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-blue-400">security</span>
            Google Play Data Safety Notice
          </h3>
          
          <div className="space-y-4 text-xs font-medium leading-relaxed text-slate-300 font-body">
            <p className="font-extrabold text-slate-100">
              Tango World / WoC users can request deletion of their app account and associated user data.
            </p>

            <p className="p-3 bg-slate-850 rounded-xl border border-slate-800 text-blue-200 font-bold">
              You can request deletion of your Tango World account or specific user data.
            </p>

            <div>
              <p className="font-bold text-slate-200 mb-1">To request deletion, send an email to:</p>
              <a href={mailtoUrl} className="text-blue-400 underline font-extrabold break-all">
                stonehong1@gmail.com
              </a>
            </div>

            <div>
              <p className="font-bold text-slate-200 mb-1">Please include in your request:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>Phone number used for login</li>
                <li>Display name or profile name, if available</li>
                <li>Request type: Delete my account OR Delete specific user data</li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-slate-200 mb-1">Data that may be deleted:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>Firebase Authentication account</li>
                <li>Phone login identifier</li>
                <li>User profile (Nickname, career, social links, gender)</li>
                <li>User-generated community/profile data where applicable</li>
              </ul>
            </div>

            <p className="text-[11px] text-slate-500 font-medium">
              * Some data may be retained if required for legal compliance, security, fraud prevention, abuse prevention, or necessary operational reasons. Deletion requests are processed within 30 days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
