'use client';

import StayDetailPage from '@/app/(nation)/stay/[id]/page';

export default function InterceptedStayPage() {
  return (
    <div className="fixed inset-0 z-[100] bg-white">
      <StayDetailPage />
    </div>
  );
}
