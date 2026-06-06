'use client';

import CoachingRoomDetailPage from '@/app/coaching/[roomId]/page';

export default function InterceptedCoachingPage() {
  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
      <CoachingRoomDetailPage />
    </div>
  );
}
