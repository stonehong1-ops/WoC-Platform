'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { db } from '@/lib/firebase/clientApp';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Notification } from '@/types/notification';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: true,
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    // Restore cached notifications immediately (0ms loading)
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(`woc_user_notifications_${user.uid}`);
      if (cached) {
        try {
          setNotifications(JSON.parse(cached));
          setLoading(false);
        } catch (e) {
          console.error('Failed to parse cached notifications:', e);
        }
      } else {
        setLoading(true);
      }
    }

    const q = query(
      collection(db, 'notifications'),
      where('targetUserId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notis = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      setNotifications(notis);
      setLoading(false);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`woc_user_notifications_${user.uid}`, JSON.stringify(notis));
      }
    }, (error) => {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const contextValue = useMemo(() => ({
    notifications,
    unreadCount,
    loading
  }), [notifications, unreadCount, loading]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};
