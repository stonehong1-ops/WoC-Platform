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
          Tango World strictly prohibits Child Sexual Abuse Material (CSAM) and Child Sexual Abuse and Exploitation (CSAE).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* English Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
            1. Child Safety Policy
          </h2>
          <p className="leading-relaxed text-on-surface/80 text-sm">
            Tango World has zero tolerance for any form of exploitation, harm, or abuse directed toward children. 
            We are committed to providing a safe, respectful, and protected environment for all individuals.
            Any content, behavior, or activity that threatens the safety of minors is strictly prohibited.
          </p>

          <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
            2. Explicit Prohibition of Child Sexual Abuse and Exploitation (CSAE)
          </h2>
          <p className="leading-relaxed text-on-surface/80 text-sm">
            Tango World explicitly prohibits the creation, sharing, transmission, promotion, or facilitation of 
            Child Sexual Abuse Material (CSAM) and Child Sexual Abuse and Exploitation (CSAE). 
            This zero-tolerance policy applies to:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-on-surface/80 text-sm">
            <li>Any materials depicting the sexual abuse, exploitation, or inappropriate representation of children.</li>
            <li>Online grooming behavior, including any attempts to establish a relationship with a minor for the purpose of sexual exploitation or abuse.</li>
            <li>Any sexual solicitation of minors or facilitation of sexual contact with minors.</li>
            <li>The distribution, hosting, or linking to CSAM/CSAE on or through the Tango World application.</li>
          </ul>

          <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
            3. Enforcement and Reporting to Authorities
          </h2>
          <p className="leading-relaxed text-on-surface/80 text-sm">
            Tango World actively monitors and investigates reported violations. Upon detection or receipt of a report of CSAE or CSAM, we will:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-on-surface/80 text-sm">
            <li>Immediately and permanently terminate the offending user account.</li>
            <li>Immediately delete and purge all associated violating content.</li>
            <li>Report the details of the incident, including user account information and IP addresses, to the National Center for Missing & Exploited Children (NCMEC) and relevant international law enforcement agencies in accordance with applicable laws.</li>
          </ul>

          <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
            4. In-App Reporting Mechanism
          </h2>
          <p className="leading-relaxed text-on-surface/80 text-sm">
            Tango World provides easy-to-use in-app reporting tools. Users can immediately report any suspicious behavior, violating content, or potential threats to child safety by clicking the "Report" button on user profiles, chat messages, or community posts. All reports related to minor safety are treated with the highest priority and escalated directly to our safety team.
          </p>

          <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
            5. Child Safety Contact Information
          </h2>
          <p className="leading-relaxed text-on-surface/80 text-sm">
            If you have questions, feedback, or need to report a child safety concern directly, please contact our dedicated Child Safety Representative:
            <br />
            <strong>Representative Email:</strong> <a href="mailto:stonehong1@gmail.com" className="text-primary underline">stonehong1@gmail.com</a>
          </p>
        </section>

        {/* Korean Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
            1. 아동 안전 정책 (Child Safety Policy)
          </h2>
          <p className="leading-relaxed text-on-surface/80 text-sm">
            Tango World는 아동을 대상으로 하는 모든 형태의 착취, 위해 또는 학대에 대해 무관용 원칙을 적용합니다. 
            우리는 모든 구성원들에게 안전하고 존중받으며 보호받는 환경을 제공하기 위해 최선을 다하고 있습니다.
            미성년자의 안전을 위협하는 모든 콘텐츠, 행동 또는 활동은 엄격히 금지됩니다.
          </p>

          <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
            2. 아동 성적 학대 및 착취(CSAE)의 명시적 금지
          </h2>
          <p className="leading-relaxed text-on-surface/80 text-sm">
            Tango World는 아동 성적 학대물(CSAM) 및 아동 성적 학대 및 착취(CSAE) 콘텐츠의 생성, 공유, 전송, 홍보 또는 조장하는 모든 행위를 명시적으로 금지합니다. 
            이 무관용 정책은 다음에 적용됩니다:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-on-surface/80 text-sm">
            <li>아동의 성적 학대, 착취 또는 부적절한 묘사가 포함된 모든 자료.</li>
            <li>성적 착취 또는 학대의 목적으로 미성년자와 관계를 맺으려는 시도를 포함한 온라인 그루밍 행위.</li>
            <li>미성년자에 대한 성적 권유 또는 미성년자와의 성적 접촉 유도를 조장하는 행위.</li>
            <li>Tango World 애플리케이션 내 또는 애플리케이션을 통해 CSAM/CSAE를 배포, 호스팅 또는 링크로 연결하는 행위.</li>
          </ul>

          <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
            3. 규정 집행 및 사법 기관 신고 조치
          </h2>
          <p className="leading-relaxed text-on-surface/80 text-sm">
            Tango World는 신고된 위반 사항을 적극적으로 모니터링하고 조사합니다. CSAE 또는 CSAM의 위반을 발견하거나 신고를 접수하는 즉시 당사는 다음 조치를 취합니다:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-on-surface/80 text-sm">
            <li>해당 위반자의 계정을 즉시 영구 정지합니다.</li>
            <li>해당하는 모든 위반 콘텐츠를 즉시 영구 삭제합니다.</li>
            <li>관련 법률에 따라 위반자 계정 정보 및 IP 주소를 포함한 세부 정보를 실종아동방지센터(NCMEC) 및 관련 사법/수사 기관에 즉각 신고합니다.</li>
          </ul>

          <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
            4. 신고 기능 (In-App Reporting)
          </h2>
          <p className="leading-relaxed text-on-surface/80 text-sm">
            Tango World는 이용하기 쉬운 신고 도구를 제공합니다. 이용자는 사용자 프로필, 채팅 메시지 또는 커뮤니티 게시물에 있는 "신고" 버튼을 클릭하여 의심스러운 행동, 위반 콘텐츠 또는 아동 안전을 위협하는 요소를 즉시 신고할 수 있습니다. 미성년자 안전과 관련된 모든 신고는 최우선 순위로 처리되며 당사 안전 팀으로 직접 에스컬레이션됩니다.
          </p>

          <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
            5. 아동 안전 담당 연락처
          </h2>
          <p className="leading-relaxed text-on-surface/80 text-sm">
            아동 안전 정책에 대한 문의사항이 있거나 아동 안전 문제를 직접 신고하려면 전담 아동 안전 담당자에게 문의하시기 바랍니다:
            <br />
            <strong>담당자 이메일:</strong> <a href="mailto:stonehong1@gmail.com" className="text-primary underline">stonehong1@gmail.com</a>
          </p>
        </section>
      </div>

      <div className="mt-16 pt-8 border-t border-on-surface/10 text-sm text-on-surface/50 text-right">
        Last updated: July 2026
      </div>
    </div>
  );
}
