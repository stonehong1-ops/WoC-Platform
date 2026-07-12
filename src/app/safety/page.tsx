'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SafetyPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-on-surface">
      <h1 className="text-3xl font-black mb-8">{t('safety.title')}</h1>
      
      <p className="mb-6 text-on-surface/70 leading-relaxed">
        {t('safety.last_updated')}
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-primary">
          {t('safety.offline_title')}
        </h2>
        <p className="leading-relaxed text-on-surface/80">
          {t('safety.offline_content')}
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-primary">
          {t('safety.finance_title')}
        </h2>
        <p className="leading-relaxed text-on-surface/80">
          {t('safety.finance_content')}
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-primary">
          {t('safety.report_title')}
        </h2>
        <p className="leading-relaxed text-on-surface/80">
          {t('safety.report_content')}
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-primary">
          {t('privacy.contact_title') || 'Contact Us'}
        </h2>
        <p className="leading-relaxed text-on-surface/80">
          {t('privacy.contact_content')}
          <br />
          Email: <a href="mailto:stonehong1@gmail.com" className="text-primary underline">stonehong1@gmail.com</a>
        </p>
      </section>
    </div>
  );
}
