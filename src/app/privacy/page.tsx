'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PrivacyPage() {
  const { language } = useLanguage();
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 text-on-surface min-h-[90vh]">
      {/* Back Button */}
      <div className="mb-8">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {language === 'KR' ? '뒤로가기' : 'Back'}
        </button>
      </div>

      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-black mb-3 uppercase tracking-tight font-headline text-gray-950">
          Privacy Policy
        </h1>
        <p className="text-sm font-semibold text-gray-500 max-w-xl mx-auto">
          Tango World / WoC is committed to protecting your privacy and personal data.
        </p>
      </div>

      {/* 2-Column Policy Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* English Version */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black text-gray-900 border-b pb-2">English Version</h2>
          
          <div>
            <h3 className="text-lg font-bold text-primary mb-2">1. Overview</h3>
            <p className="text-sm leading-relaxed text-on-surface/80">
              Tango World / WoC operates the community integrated platform (www.woc.today). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-primary mb-2">2. Information Collection and Use</h3>
            <p className="text-sm leading-relaxed text-on-surface/80">
              We collect several different types of information for various purposes to provide and improve our Service to you.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5 text-sm text-on-surface/80">
              <li><strong>Personal Data:</strong> Phone number (used for secure Firebase Authentication), email address, nickname, profile information, and user-generated content.</li>
              <li><strong>Usage Data:</strong> We may collect information about how the Service is accessed and used to maintain system security and optimize performance.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-primary mb-2">3. Blocking and Reporting Mechanisms (UGC Safety)</h3>
            <p className="text-sm leading-relaxed text-on-surface/80">
              To ensure a safe environment, users have access to real-time blocking and reporting tools. You can immediately block any user or report any content (posts, comments, chat) that violates our community standards or child safety policies.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-primary mb-2">4. Account and Data Deletion</h3>
            <p className="text-sm leading-relaxed text-on-surface/80">
              You have the right to request the complete deletion of your account and all associated personal data. 
              Logged-in users can request immediate account deletion in-app via the <strong>Profile &gt; Delete Account</strong> menu, which will trigger the server-side API to purge all authentication records and Firestore user data. 
              Alternatively, you can request account deletion by emailing our support team at <a href="mailto:stonehong1@gmail.com" className="text-primary underline">stonehong1@gmail.com</a>.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-primary mb-2">5. Contact Information</h3>
            <p className="text-sm leading-relaxed text-on-surface/80">
              If you have any questions or concerns about this Privacy Policy, please contact us:
              <br />
              <strong>Representative Email:</strong> <a href="mailto:stonehong1@gmail.com" className="text-primary underline">stonehong1@gmail.com</a>
            </p>
          </div>
        </section>

        {/* Korean Version */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black text-gray-900 border-b pb-2">한국어 버전 (Korean)</h2>

          <div>
            <h3 className="text-lg font-bold text-primary mb-2">1. 개인정보 처리방침 개요</h3>
            <p className="text-sm leading-relaxed text-on-surface/80">
              Tango World / WoC는 이용자의 개인정보 및 데이터를 보호하기 위해 최선을 다하고 있습니다. 본 방침은 당사 서비스(www.woc.today) 이용 시 수집되는 개인정보 항목, 이용 목적, 그리고 데이터 관리에 관한 규정을 안내합니다.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-primary mb-2">2. 개인정보 수집 및 이용 목적</h3>
            <p className="text-sm leading-relaxed text-on-surface/80">
              당사는 이용자에게 원활하고 안전한 서비스를 제공하기 위해 최소한의 범위 내에서 개인정보를 수집하고 있습니다.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5 text-sm text-on-surface/80">
              <li><strong>수집 항목:</strong> 전화번호 (안전한 Firebase 휴대폰 본인 인증용), 이메일 주소, 닉네임, 프로필 사진 및 정보, 사용자 작성 게시물 및 댓글.</li>
              <li><strong>이용 목적:</strong> 안전한 본인 인증 및 세션 유지, 서비스 품질 최적화, 보안 위반 행위 모니터링 및 방어.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-primary mb-2">3. 사용자 차단 및 신고 기능 (UGC 안전망)</h3>
            <p className="text-sm leading-relaxed text-on-surface/80">
              이용자는 서비스 내 프로필, 게시물, 댓글, 채팅 등 모든 상호작용 영역에서 부적절한 사용자나 콘텐츠를 즉시 신고할 수 있으며, 상대방을 차단하여 양방향 데이터 노출을 실시간으로 차단할 수 있습니다.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-primary mb-2">4. 회원 탈퇴 및 데이터 영구 소거</h3>
            <p className="text-sm leading-relaxed text-on-surface/80">
              이용자는 언제든지 본인의 개인정보 및 계정 삭제를 요청할 권리가 있습니다. 
              로그인한 사용자는 앱 내 <strong>프로필 &gt; 계정 및 데이터 탈퇴</strong> 메뉴를 통해 직접 계정 삭제 API를 호출하여 Firebase Auth 정보 및 연관된 모든 실데이터를 물리적으로 즉각 완전 소거할 수 있습니다. 
              비로그인 상태에서는 고객 지원 담당자 메일(<a href="mailto:stonehong1@gmail.com" className="text-primary underline">stonehong1@gmail.com</a>)을 통해 서면으로 탈퇴를 요청할 수 있습니다.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-primary mb-2">5. 개인정보 보호 담당 연락처</h3>
            <p className="text-sm leading-relaxed text-on-surface/80">
              개인정보 보호정책에 관한 피드백이나 문의사항이 있으실 경우 아래 담당 연락처로 문의하시기 바랍니다:
              <br />
              <strong>담당자 이메일:</strong> <a href="mailto:stonehong1@gmail.com" className="text-primary underline">stonehong1@gmail.com</a>
            </p>
          </div>
        </section>
      </div>

      <div className="mt-16 pt-8 border-t border-on-surface/10 text-sm text-on-surface/50 text-right">
        Last updated: July 2026
      </div>
    </div>
  );
}
