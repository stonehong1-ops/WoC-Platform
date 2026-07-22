'use client';

import React, { useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import EditSocialEvent from '@/components/social/EditSocialEvent';

export default function SocialCreateModalTrigger() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const isCreateOpen = searchParams.get('createSocial') === 'true';

  useEffect(() => {
    console.log(`[SOCIAL CREATE 3] MOUNTED | pathname: ${pathname} | query: ${searchParams.toString()} | isCreateOpen: ${isCreateOpen}`);
  }, [pathname, searchParams, isCreateOpen]);

  const handleClose = () => {
    console.log('[SOCIAL CREATE 3] CLOSE CALLED');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('createSocial');
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  };

  console.log(`[SOCIAL CREATE 3] RENDER | isCreateOpen: ${isCreateOpen}`);

  if (!isCreateOpen) return null;

  console.log('[SOCIAL CREATE 4] TRIGGER RENDERING EditSocialEvent');

  return (
    <EditSocialEvent
      onClose={handleClose}
      onSuccess={(id) => {
        console.log(`[SOCIAL CREATE 4] SUCCESS CALLED | id: ${id}`);
        router.push(`/create-success?type=social&id=${id || ''}`);
      }}
    />
  );
}
