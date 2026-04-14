import React from 'react';
import SubHeader from '@/components/SubHeader';
import SubFooter from '@/components/SubFooter';

export default function SubPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased">
      <SubHeader />
      <main className="flex-1 pt-14">
        {children}
      </main>
      <SubFooter />
    </div>
  );
}
