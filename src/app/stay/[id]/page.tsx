'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import StayDetail from '@/components/stay/StayDetail';
import { useAuth } from '@/components/providers/AuthProvider';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { stayService } from '@/lib/firebase/stayService';

export default function StayDetailPage() {
  const params = useParams();
  const stayId = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const { setGlobalNavHidden } = useNavigation();
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    setGlobalNavHidden(true);
    return () => setGlobalNavHidden(false);
  }, [setGlobalNavHidden]);

  useEffect(() => {
    if (user && stayId) {
      const unsub = stayService.subscribeMyLikes(user.uid, (likes) => {
        setIsLiked(likes.some(l => l.stayId === stayId));
      });
      return () => unsub();
    }
  }, [user, stayId]);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await stayService.toggleLike(user.uid, stayId);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <StayDetail
      stayId={stayId}
      onClose={() => router.push('/stay')}
      isLiked={isLiked}
      onToggleLike={handleToggleLike}
    />
  );
}
