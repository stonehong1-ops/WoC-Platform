'use client';

import LiveFeed from '@/components/live/LiveFeed';
import LivePortalHome from '@/components/live/LivePortalHome';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Suspense } from 'react';

const GalleryContent = () => {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');
  const { user } = useAuth();

  // view 파라미터가 없으면 실사용형 라이브 포털 홈 화면을 보여줍니다.
  if (!view) {
    return <LivePortalHome />;
  }

  return (
    <div className="fixed inset-0 z-[40] w-full bg-black overflow-hidden flex flex-col">
      <LiveFeed 
        userId={(view === 'my' || view === 'hosted') ? user?.uid : undefined} 
        viewMode={view === 'hosted' ? 'hosted' : (view === 'my' ? 'joined' : undefined)}
      />
    </div>
  );
};

const GalleryPage = () => {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-[40] w-full bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <GalleryContent />
    </Suspense>
  );
};

export default GalleryPage;
