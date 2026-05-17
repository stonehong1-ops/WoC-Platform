'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useNotification } from '@/contexts/NotificationContext';
import { notificationService } from '@/lib/firebase/notificationService';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHistoryBack } from '@/hooks/useHistoryBack';

export default function NotificationTray() {
  const { isNotiTrayOpen, closeNotiTray } = useNavigation();
  const { notifications, loading } = useNotification();
  const { formatRelativeTime } = useLanguage();
  const router = useRouter();
  const { handleClose } = useHistoryBack(isNotiTrayOpen, closeNotiTray);
  const displayNotis = notifications;

  const handleNotificationClick = async (noti: any) => {
    if (!noti.isRead) {
      await notificationService.markAsRead(noti.id);
    }
    // Only mark as read, do not navigate anywhere.
  };

  return (
    <AnimatePresence>
      {isNotiTrayOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm bg-background z-[70] shadow-2xl flex flex-col"
          >
            <div className="px-5 py-4 border-b border-outline-variant/30 flex items-center justify-between">
              <h2 className="text-[18px] font-black tracking-tight text-on-background">Notifications</h2>
              <button 
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-variant/50 text-on-surface hover:bg-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Tabs removed */}

            <div className="flex-1 overflow-y-auto bg-surface-variant/10 p-4 space-y-3">
              {loading ? (
                <div className="text-center py-10 text-on-surface/50 text-sm">Loading...</div>
              ) : displayNotis.length === 0 ? (
                <div className="text-center py-10 text-on-surface/50 text-sm flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-[32px] opacity-20">notifications_off</span>
                  No notifications found.
                </div>
              ) : (
                displayNotis.map(noti => (
                  <div 
                    key={noti.id}
                    onClick={() => handleNotificationClick(noti)}
                    className={`cursor-pointer border-b last:border-b-0 p-3 rounded-xl transition-all ${
                      !noti.isRead 
                        ? 'bg-white border-primary/20 shadow-sm' 
                        : 'bg-white border-outline-variant/30 opacity-60'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                        noti.category === 'CLASS' ? 'bg-blue-100 text-blue-700' :
                        noti.category === 'STAY' ? 'bg-green-100 text-green-700' :
                        noti.category === 'SHOP' ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {noti.category || 'SYSTEM'}
                      </span>
                      <span className="text-[10px] text-on-surface/40">
                        {noti.createdAt?.seconds ? formatRelativeTime(noti.createdAt.seconds * 1000) : 'Just now'}
                      </span>
                    </div>
                    <h3 className={`text-[14px] leading-snug mt-1.5 ${!noti.isRead ? 'font-bold text-on-background' : 'font-medium text-on-surface'}`}>
                      {noti.title}
                    </h3>
                    <p className="text-[12px] text-on-surface/60 mt-1 line-clamp-2">
                      {noti.message}
                    </p>
                    
                    {/* Action text removed */}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
