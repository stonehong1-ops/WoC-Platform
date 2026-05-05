'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useNotification } from '@/contexts/NotificationContext';
import { notificationService } from '@/lib/firebase/notificationService';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationTray() {
  const { isNotiTrayOpen, closeNotiTray } = useNavigation();
  const { notifications, loading } = useNotification();
  const [activeTab, setActiveTab] = useState<'INFO' | 'TODO'>('TODO');
  const router = useRouter();

  const infoNotis = notifications.filter(n => n.baseType === 'INFO' || (n.type !== 'GROUP_INVITE' && !n.baseType));
  const todoNotis = notifications.filter(n => n.baseType === 'TODO' || n.type === 'GROUP_INVITE');

  const displayNotis = activeTab === 'INFO' ? infoNotis : todoNotis;

  const handleNotificationClick = async (noti: any) => {
    if (!noti.isRead) {
      await notificationService.markAsRead(noti.id);
    }
    
    if (noti.actionUrl) {
      closeNotiTray();
      router.push(noti.actionUrl);
    }
  };

  return (
    <AnimatePresence>
      {isNotiTrayOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeNotiTray}
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
                onClick={closeNotiTray}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-variant/50 text-on-surface hover:bg-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex border-b border-outline-variant/30 px-2">
              <button
                onClick={() => setActiveTab('TODO')}
                className={`flex-1 py-3 text-[13px] font-bold transition-colors border-b-2 ${activeTab === 'TODO' ? 'border-primary text-primary' : 'border-transparent text-on-surface/50'}`}
              >
                Todo
                {todoNotis.filter(n => !n.isCompleted).length > 0 && (
                  <span className="ml-1.5 bg-error text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {todoNotis.filter(n => !n.isCompleted).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('INFO')}
                className={`flex-1 py-3 text-[13px] font-bold transition-colors border-b-2 ${activeTab === 'INFO' ? 'border-primary text-primary' : 'border-transparent text-on-surface/50'}`}
              >
                Info
                {infoNotis.filter(n => !n.isRead).length > 0 && (
                  <span className="ml-1.5 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {infoNotis.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-surface-variant/10 p-4 space-y-3">
              {loading ? (
                <div className="text-center py-10 text-on-surface/50 text-sm">Loading...</div>
              ) : displayNotis.length === 0 ? (
                <div className="text-center py-10 text-on-surface/50 text-sm flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-[32px] opacity-20">notifications_off</span>
                  No {activeTab.toLowerCase()}s found.
                </div>
              ) : (
                displayNotis.map(noti => (
                  <div 
                    key={noti.id}
                    onClick={() => handleNotificationClick(noti)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      activeTab === 'TODO' && noti.isCompleted 
                        ? 'opacity-60 bg-surface-variant/30 border-transparent' 
                        : !noti.isRead 
                          ? 'bg-white border-primary/20 shadow-sm' 
                          : 'bg-white border-outline-variant/30'
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
                        {noti.createdAt?.seconds ? formatDistanceToNow(noti.createdAt.seconds * 1000, { addSuffix: true }) : 'Just now'}
                      </span>
                    </div>
                    <h3 className={`text-[14px] leading-snug mt-1.5 ${!noti.isRead || (activeTab === 'TODO' && !noti.isCompleted) ? 'font-bold text-on-background' : 'font-medium text-on-surface'}`}>
                      {noti.title}
                    </h3>
                    <p className="text-[12px] text-on-surface/60 mt-1 line-clamp-2">
                      {noti.message}
                    </p>
                    
                    {activeTab === 'TODO' && (
                      <div className="mt-3 flex items-center justify-between">
                        {noti.isCompleted ? (
                          <span className="text-[11px] font-bold text-green-600 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            COMPLETED
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-primary flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md">
                            ACTION REQUIRED
                            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                          </span>
                        )}
                      </div>
                    )}
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
