'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ChildSafetyPage() {
  const { t, language } = useLanguage();
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-on-surface min-h-[90vh]">
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

      {/* Title */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-black mb-3 uppercase tracking-tight font-headline text-gray-950">
          Child Safety Policy & CSAE Prevention
        </h1>
        <p className="text-sm font-semibold text-gray-500 max-w-xl mx-auto">
          World of Community strictly prohibits Child Sexual Abuse Material (CSAM) and Child Sexual Abuse and Exploitation (CSAE).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* English Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
            1. Zero Tolerance Policy
          </h2>
          <p className="leading-relaxed text-on-surface/80 text-sm">
            World of Community has zero tolerance for Child Sexual Abuse and Exploitation (CSAE). 
            We are committed to providing a safe, respectful, and protected environment for all individuals.
            Any content, behavior, or activity that threatens the safety of minors is strictly prohibited.
          </p>

          <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
            2. Explicit Prohibitions
          </h2>
          <p className="leading-relaxed text-on-surface/80 text-sm">
            World of Community explicitly prohibits the creation, sharing, transmission, promotion, or facilitation of any content related to the following:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-on-surface/80 text-sm">
            <li>Child Sexual Abuse Material (CSAM)</li>
            <li>Grooming behaviors or any attempts to establish an inappropriate relationship with a minor</li>
            <li>Sexual exploitation of minors</li>
            <li>Child trafficking</li>
            <li>Sexual extortion of minors</li>
            <li>Any activity facilitating or encouraging CSAE</li>
          </ul>

          <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
            3. In-App Reporting & Content Removal
          </h2>
          <p className="leading-relaxed text-on-surface/80 text-sm">
            Users can report abusive content directly inside the app. If you encounter any content violating child safety guidelines, click the "Report" button on user profiles, community posts, or chat screens. 
            Confirmed CSAM is removed promptly and permanently from our platform.
          </p>

          <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
            4. Compliance & Reporting to Authorities
          </h2>
          <p className="leading-relaxed text-on-surface/80 text-sm">
            World of Community complies with applicable child safety laws. Confirmed CSAM may be reported to the National Center for Missing & Exploited Children (NCMEC) and/or applicable local law enforcement where legally required.
          </p>

          <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
            5. Child Safety Contact
          </h2>
          <p className="leading-relaxed text-on-surface/80 text-sm font-semibold">
            Child Safety Contact
            <br />
            Email: <a href="mailto:stonehong1@gmail.com" className="text-primary underline font-bold">stonehong1@gmail.com</a>
          </p>
        </section>

        {/* Korean Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
            1. 무관용 정책 (Zero Tolerance)
          </h2>
          <p className="leading-relaxed text-on-surface/80 text-sm">
            World of Community는 아동 성적 학대 및 착취(CSAE)에 대해 어떠한 관용도 베풀지 않습니다 (Zero Tolerance).
            우리는 모든 구성원들에게 안전하고 존중받으며 보호받는 환경을 제공하기 위해 최선을 다하고 있습니다.
            미성년자의 안전을 위협하는 모든 콘텐츠, 행동 또는 활동은 엄격히 금지됩니다.
          </p>

          <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
            2. 명시적 금지 사항
          </h2>
          <p className="leading-relaxed text-on-surface/80 text-sm">
            World of Community는 다음 항목과 관련된 콘텐츠의 생성, 공유, 전송, 홍보 또는 조장하는 모든 행위를 명시적으로 금지합니다:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-on-surface/80 text-sm">
            <li>아동 성적 학대물 (CSAM)</li>
            <li>미성년자와 부적절한 관계를 형성하려는 시도를 포함한 온라인 그루밍 (Grooming)</li>
            <li>미성년자 성착취 (Sexual exploitation of minors)</li>
            <li>아동 인신매매 (Child trafficking)</li>
            <li>미성년자 대상 성적 강요 및 협박 (Sexual extortion)</li>
            <li>아동 성적 학대 및 착취(CSAE)를 촉진하거나 유도하는 모든 활동</li>
          </ul>

          <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
            3. 인앱 신고 기능 및 콘텐츠 삭제
          </h2>
          <p className="leading-relaxed text-on-surface/80 text-sm">
            이용자는 앱 내에서 즉시 이러한 유해 콘텐츠를 신고할 수 있습니다. 아동 안전 가이드라인을 위반하는 콘텐츠나 행동을 발견하면 사용자 프로필, 커뮤니티 게시물, 채팅 화면의 "신고" 버튼을 클릭해 주십시오. 
            확인된 아동 성적 학대물(CSAM)은 즉시 지체 없이 당사 플랫폼에서 영구 삭제됩니다.
          </p>

          <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
            4. 법률 준수 및 수사기관 보고
          </h2>
          <p className="leading-relaxed text-on-surface/80 text-sm">
            World of Community는 관련 아동 안전 법률을 완벽하게 준수합니다. 확인된 CSAM은 법적 요구에 의거하여 미국 실종아동방지센터(NCMEC) 및/또는 해당 지역 사법당국에 즉각 보고될 수 있습니다.
          </p>

          <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
            5. 아동 안전 담당 연락처
          </h2>
          <p className="leading-relaxed text-on-surface/80 text-sm font-semibold">
            아동 안전 담당 연락처 (Child Safety Contact)
            <br />
            이메일: <a href="mailto:stonehong1@gmail.com" className="text-primary underline font-bold">stonehong1@gmail.com</a>
          </p>
        </section>
      </div>

      <div className="mt-16 pt-8 border-t border-on-surface/10 text-sm text-on-surface/50 text-right">
        Last updated: July 2026
      </div>
    </div>
  );
}
