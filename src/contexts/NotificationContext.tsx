'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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
    }, (error) => {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading }}>
      {children}
    </NotificationContext.Provider>
  );
};
