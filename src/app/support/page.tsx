'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SupportPage() {
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
          Support Center
        </h1>
        <p className="text-sm font-semibold text-gray-500 max-w-xl mx-auto">
          We are here to help. Explore guides or contact our support team.
        </p>
      </div>

      {/* 2-Column Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        
        {/* English Version */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black text-gray-900 border-b pb-2">English</h2>
          
          <div>
            <h3 className="text-lg font-bold text-primary mb-2">1. Contact & Support Info</h3>
            <p className="text-sm leading-relaxed text-on-surface/80">
              For any account issues, login failures, or general inquiries, please email our support team directly.
              <br />
              <strong>Support Email:</strong> <a href="mailto:stonehong1@gmail.com" className="text-primary underline">stonehong1@gmail.com</a>
              <br />
              <span className="text-[11px] text-gray-500 font-semibold block mt-1">
                ※ Response Time: We usually respond within 2–3 business days.
              </span>
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-primary mb-2">2. Login & Account Creation</h3>
            <p className="text-sm leading-relaxed text-on-surface/80">
              Currently, Tango World / WoC supports secure <strong>Phone Number Authentication</strong>. Enter your phone number with your country code, receive the 6-digit OTP code, and enter it to log in. No password setup is required.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-primary mb-2">3. Safety, Blocking & Reporting</h3>
            <p className="text-sm leading-relaxed text-on-surface/80">
              User safety is our top priority. If you encounter any inappropriate behavior or content:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5 text-sm text-on-surface/80">
              <li><strong>Block:</strong> Tap on the user's profile and click "Block". This immediately stops all mutual interactions and posts visibility.</li>
              <li><strong>Report:</strong> Click the "Report" button on any posts, comments, or chat messages. Our moderation team reviews reports 24/7.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-primary mb-2">4. Essential Legal Policies</h3>
            <div className="flex flex-col gap-2 mt-2">
              <a href="/privacy" className="text-sm text-primary underline font-bold hover:text-primary-dark transition-colors">
                • Privacy Policy
              </a>
              <a href="/child-safety" className="text-sm text-primary underline font-bold hover:text-primary-dark transition-colors">
                • Child Safety Standards (CSAM/CSAE Prevention)
              </a>
              <a href="/account-deletion" className="text-sm text-primary underline font-bold hover:text-primary-dark transition-colors">
                • Account & Data Deletion Page
              </a>
            </div>
          </div>
        </section>

        {/* Korean Version */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black text-gray-900 border-b pb-2">한국어 (Korean)</h2>

          <div>
            <h3 className="text-lg font-bold text-primary mb-2">1. 고객 지원 및 문의</h3>
            <p className="text-sm leading-relaxed text-on-surface/80">
              계정 문제, 로그인 오류 또는 일반 문의사항이 있으시면 언제든지 이메일로 연락해 주시기 바랍니다.
              <br />
              <strong>지원 담당 이메일:</strong> <a href="mailto:stonehong1@gmail.com" className="text-primary underline">stonehong1@gmail.com</a>
              <br />
              <span className="text-[11px] text-gray-500 font-semibold block mt-1">
                ※ 답변 소요 시간: 보통 영업일 기준 2~3일 이내에 답변을 드립니다.
              </span>
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-primary mb-2">2. 로그인 및 계정 문의 안내</h3>
            <p className="text-sm leading-relaxed text-on-surface/80">
              Tango World / WoC는 안전한 <strong>전화번호 인증 로그인</strong>을 단일 수단으로 지원합니다. 국가코드와 휴대폰 번호를 입력한 뒤 수신된 6자리 OTP 인증번호를 기입하면 안전하게 가입 및 로그인이 완료됩니다.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-primary mb-2">3. 신고 및 차단 안내</h3>
            <p className="text-sm leading-relaxed text-on-surface/80">
              이용자 보호와 아동 안전을 최우선으로 합니다. 부적절한 행위를 발견할 시 다음 도구를 이용하십시오:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5 text-sm text-on-surface/80">
              <li><strong>차단:</strong> 상대방 프로필 화면에서 "차단"을 누르면 양방향 상호작용과 게시물이 실시간으로 완전히 차단됩니다.</li>
              <li><strong>신고:</strong> 게시물, 댓글, 채팅의 우측 "신고" 버튼을 클릭하면 모니터링 팀이 즉시 확인 및 계정 제재 처리를 적용합니다.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-primary mb-2">4. 주요 정책 링크</h3>
            <div className="flex flex-col gap-2 mt-2">
              <a href="/privacy" className="text-sm text-primary underline font-bold hover:text-primary-dark transition-colors">
                • 개인정보처리방침 (Privacy Policy)
              </a>
              <a href="/child-safety" className="text-sm text-primary underline font-bold hover:text-primary-dark transition-colors">
                • 아동 안전 표준 (Child Safety Standards)
              </a>
              <a href="/account-deletion" className="text-sm text-primary underline font-bold hover:text-primary-dark transition-colors">
                • 회원 탈퇴 및 데이터 삭제 신청 페이지
              </a>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-16 pt-8 border-t border-on-surface/10 text-sm text-on-surface/50 text-right">
        Last updated: July 2026
      </div>
    </div>
  );
}
