'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { db } from '@/lib/firebase/clientApp';
import { collection, onSnapshot } from 'firebase/firestore';

export function useBlockedUsers() {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBlockedUsers([]);
      setLoading(false);
      return;
    }

    const blockedRef = collection(db, 'users', user.uid, 'blockedUsers');
    const unsubscribe = onSnapshot(blockedRef, (snapshot) => {
      const uids = snapshot.docs.map(doc => doc.id);
      setBlockedUsers(uids);
      setLoading(false);
    }, (error) => {
      console.error("Failed to fetch blocked users:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { blockedUsers, loading };
}
