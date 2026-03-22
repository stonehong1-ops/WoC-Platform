import './globals.css';
import type { Metadata } from 'next';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';
import FooterMenu from '@/components/common/FooterMenu';
import Header from '@/components/common/Header';
import ProfileSetupOverlay from '@/components/auth/ProfileSetupOverlay';

export const metadata: Metadata = {
  title: 'WoC - World of Community',
  description: 'Global Tango Community Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <ReactQueryProvider>
          <div className="gradient-bg" />
          <Header />
          <main className="max-w-2xl mx-auto min-h-screen pt-14">
            {children}
          </main>
          <FooterMenu />
          
          {/* First Entry Profile Setup */}
          <ProfileSetupOverlay />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
