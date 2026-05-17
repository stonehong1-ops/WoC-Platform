'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigation } from '@/components/providers/NavigationProvider';
import UniversalFeed from './UniversalFeed';

export default function HelpDeskView() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const { setGlobalNavHidden } = useNavigation();

  useEffect(() => {
    setGlobalNavHidden(true);
    return () => setGlobalNavHidden(false);
  }, [setGlobalNavHidden]);

  const context = {
    scope: 'helpdesk',
    scopeId: 'helpdesk',
    title: t('help_desk.title'),
  };

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 flex items-center px-4 border-b border-slate-100 shrink-0">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-full transition-colors mr-2"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <div className="flex flex-col">
          <h1 className="font-headline font-bold text-[18px] leading-tight text-on-surface uppercase">
            {t('help_desk.title')}
          </h1>
          <p className="text-[11px] text-on-surface-variant font-medium">
            {t('help_desk.desc')}
          </p>
        </div>
      </header>

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50/30">
        <div className="max-w-[600px] mx-auto min-h-full bg-white shadow-sm border-x border-slate-100 pb-20">
          {/* Welcome Card */}
          <div className="p-6 bg-gradient-to-br from-primary/5 to-tertiary/5 border-b border-slate-100">
            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white text-sm text-on-surface-variant leading-relaxed italic flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-[20px] mt-0.5 shrink-0">support_agent</span>
              <span>{t('help_desk.welcome')}</span>
            </div>
          </div>

          <UniversalFeed
            context={context}
            currentUser={user}
            profile={profile}
          />
        </div>
      </div>
    </div>
  );
}
