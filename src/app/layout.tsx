import './globals.css';
import type { Metadata } from 'next';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';
import FooterMenu from '@/components/common/FooterMenu';
import Header from '@/components/common/Header';
import ComposeOverlay from '@/components/feed/ComposeOverlay';

export const metadata: Metadata = {
  title: 'WoC - World of Community',
  description: 'The Next Generation Large Scale World of Community Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <ReactQueryProvider>
          <div className="gradient-bg" />
          <Header />
          <main className="min-h-screen pt-[56px] pb-[64px]">
            {children}
          </main>
          <FooterMenu />
          <ComposeOverlay />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
