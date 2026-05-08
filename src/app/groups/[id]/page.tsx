'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { groupService } from '@/lib/firebase/groupService';
import { Group } from '@/types/group';
import GroupDetail from '@/components/groups/GroupDetail';

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const groupId = params.id as string;
    if (!groupId) return;

    groupService.getGroup(groupId).then((g) => {
      if (g) {
        setGroup(g);
      } else {
        router.push('/groups');
      }
      setLoading(false);
    }).catch((e) => {
      console.error(e);
      setLoading(false);
    });
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <div className="h-screen w-full bg-zinc-950 text-white overflow-hidden flex flex-col">
      <GroupDetail group={group} isModal={false} />
    </div>
  );
}
