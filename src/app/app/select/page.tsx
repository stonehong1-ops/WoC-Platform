import React from 'react';
import { Metadata } from 'next';
import { useLanguage } from '@/contexts/LanguageContext';

export const metadata: Metadata = {
  title: 'Tango World / 탱고월드',
  description: 'Meet.Dance.Belong',
  openGraph: {
    title: 'Tango World / 탱고월드',
    description: 'Meet.Dance.Belong',
    url: 'https://www.woc.today/app',
    siteName: 'www.woc.today/app',
    type: 'website',
    images: [
      {
        url: 'https://www.woc.today/images/tango-world-app-share-v2.jpg?v=20260724_2',
        width: 1200,
        height: 630,
        alt: 'Tango World',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tango World / 탱고월드',
    description: 'Meet.Dance.Belong',
    images: ['https://www.woc.today/images/tango-world-app-share-v2.jpg?v=20260724_2'],
  },
};

import AppSelectContent from './AppSelectContent';

export default function AppSelectPage() {
  return <AppSelectContent />;
}
