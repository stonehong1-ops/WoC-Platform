
'use client';

import React, { useState, useEffect } from 'react';
import { Group } from '@/types/group';
import { groupService } from '@/lib/firebase/groupService';
import { useAuth } from '@/components/providers/AuthProvider';
import GroupHome from './GroupHome';

interface GroupDetailProps {
  group: Group;
  isModal?: boolean;
}

export default function GroupDetail({ group: initialGroup }: GroupDetailProps) {
  const [group, setGroup] = useState<Group>(initialGroup);
  
  // Real-time Group Subscription
  useEffect(() => {
    const unsubCommunity = groupService.subscribeGroup(initialGroup.id, (data) => {
      if (data) setGroup(prev => ({ ...prev, ...data }));
    });
    
    return () => {
      unsubCommunity();
    };
  }, [initialGroup.id]);

  return <GroupHome group={group} />;
}
