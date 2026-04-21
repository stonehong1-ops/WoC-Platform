
'use client';

import React, { useState, useEffect } from 'react';
import { Community } from '@/types/community';
import { communityService } from '@/lib/firebase/communityService';
import { useAuth } from '@/components/providers/AuthProvider';
import SpaceHome from './SpaceHome';

interface SpaceDetailProps {
  community: Community;
  isModal?: boolean;
}

export default function SpaceDetail({ community: initialCommunity }: SpaceDetailProps) {
  const [community, setCommunity] = useState<Community>(initialCommunity);
  
  // Real-time Community Subscription
  useEffect(() => {
    const unsubCommunity = communityService.subscribeCommunity(initialCommunity.id, (data) => {
      if (data) setCommunity(prev => ({ ...prev, ...data }));
    });
    
    return () => {
      unsubCommunity();
    };
  }, [initialCommunity.id]);

  return <SpaceHome community={community} />;
}
