'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-on-surface">
      <h1 className="text-3xl font-black mb-8">{t('privacy.title')}</h1>
      
      <p className="mb-6 text-on-surface/70 leading-relaxed">
        {t('privacy.last_updated')}
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-primary">
          {t('privacy.overview_title')}
        </h2>
        <p className="leading-relaxed text-on-surface/80">
          {t('privacy.overview_content')}
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-primary">
          {t('privacy.collection_title')}
        </h2>
        <p className="mb-4 leading-relaxed text-on-surface/80">
          {t('privacy.collection_content')}
        </p>
        <ul className="list-disc pl-5 space-y-2 text-on-surface/80">
          <li><strong>{t('privacy.collection_personal').split(':')[0]}:</strong> {t('privacy.collection_personal').split(':').slice(1).join(':')}</li>
          <li><strong>{t('privacy.collection_usage').split(':')[0]}:</strong> {t('privacy.collection_usage').split(':').slice(1).join(':')}</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-primary">
          {t('privacy.social_title')}
        </h2>
        <p className="leading-relaxed text-on-surface/80">
          {t('privacy.social_content')}
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-primary">
          {t('privacy.deletion_title')}
        </h2>
        <p className="leading-relaxed text-on-surface/80">
          {t('privacy.deletion_content').replace('Helpdesk', '').replace('고객센터', '')}
          <a href="/helpdesk" className="text-primary underline font-bold hover:text-primary-dark transition-colors ml-1">
            {t('help_desk.title') || 'Helpdesk'}
          </a>
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-primary">
          {t('privacy.contact_title')}
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
