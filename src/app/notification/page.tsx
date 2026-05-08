'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { notificationService } from '@/lib/firebase/notificationService';
import { Notification } from '@/types/notification';
import { useLanguage } from '@/contexts/LanguageContext';
import { classRegistrationService } from '@/lib/firebase/classRegistrationService';
import { toast } from 'sonner';

export default function NotificationPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const tabs = [
    { id: 'All', label: t('notification.tabs.all') },
    { id: 'Social', label: t('notification.tabs.social') },
    { id: 'Events', label: t('notification.tabs.events') },
    { id: 'System', label: t('notification.tabs.system') }
  ];
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNoti, setSelectedNoti] = useState<Notification | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const getTime = (date: any) => {
    if (!date) return 0;
    if (typeof date.toMillis === 'function') return date.toMillis();
    if (typeof date === 'number') return date;
    if (date instanceof Date) return date.getTime();
    try {
      return new Date(date).getTime() || 0;
    } catch (e) {
      return 0;
    }
  };

  useEffect(() => {
    let unsubNoti: (() => void) | null = null;
    if (user) {
      unsubNoti = notificationService.subscribeToUserNotifications(
        user.uid,
        (data) => {
          const sorted = [...data].sort((a, b) => {
             const timeA = getTime(a.createdAt);
             const timeB = getTime(b.createdAt);
             return timeB - timeA;
          });
          setNotifications(sorted);
        }
      );
    }
    return () => {
      if (unsubNoti) unsubNoti();
    };
  }, [user]);

  const filteredNotis = notifications.filter((n) => {
    if (activeTab === 'All') return true;
    const category = (n.category || '').toUpperCase();
    if (activeTab === 'Social') return ['SOCIAL', 'FEED', 'GROUP', 'FRIEND', 'LIKE', 'COMMENT'].includes(category);
    if (activeTab === 'Events') return ['CLASS', 'STAY', 'SHOP', 'EVENT'].includes(category);
    if (activeTab === 'System') return ['SYSTEM', 'ADMIN', 'NOTICE'].includes(category);
    return true;
  });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const todayNotis = filteredNotis.filter(n => getTime(n.createdAt) >= startOfToday);
  const olderNotis = filteredNotis.filter(n => getTime(n.createdAt) < startOfToday);

  const handleNotiClick = async (noti: Notification) => {
    if (!noti.isRead) {
      await notificationService.markAsRead(noti.id);
    }
    
    // Intercept CLASS_APPLY notifications to show inline confirmation modal
    if (noti.type === 'CLASS_APPLY' || noti.category === 'CLASS') {
      if (noti.referenceId && !noti.isCompleted) {
        setSelectedNoti(noti);
        return;
      }
    }

    if (noti.actionUrl) {
      // Normalize legacy actionUrl paths (/group/ → /groups/)
      let url = noti.actionUrl;
      if (url.startsWith('/group/') && !url.startsWith('/groups/')) {
        url = url.replace('/group/', '/groups/');
      }
      router.push(url);
    }
  };

  const handleConfirmPayment = async (targetNoti?: Notification) => {
    const noti = targetNoti || selectedNoti;
    if (!noti?.referenceId) return;
    setIsProcessing(true);
    try {
      await classRegistrationService.updateRegistration(noti.referenceId, {
        status: 'PAYMENT_COMPLETED'
      });
      // Mark notification as completed (and other admins' related todos)
      await notificationService.markTodosAsCompletedByReference(noti.referenceId);
      toast.success(t('notification.payment_confirmed'));
      setSelectedNoti(null);
    } catch (error) {
      console.error("Failed to confirm payment:", error);
      toast.error("Failed to confirm payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectPayment = async (targetNoti?: Notification) => {
    const noti = targetNoti || selectedNoti;
    if (!noti?.referenceId) return;
    if (!confirm(t('notification.payment_confirmation_msg'))) return;
    setIsProcessing(true);
    try {
      await classRegistrationService.updateRegistration(noti.referenceId, {
        status: 'CANCELED'
      });
      // Mark notification as completed/read
      await notificationService.markTodosAsCompletedByReference(noti.referenceId);
      toast.success(t('notification.payment_rejected'));
      setSelectedNoti(null);
    } catch (error) {
      console.error("Failed to reject application:", error);
      toast.error("Failed to reject application");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = filteredNotis.filter(n => !n.isRead).map(n => n.id);
    for (const id of unreadIds) {
      await notificationService.markAsRead(id);
    }
  };

  const formatTimeAgo = (date: any) => {
    if (!date) return t('notification.time.recently');
    const time = getTime(date);
    if (time === 0) return t('notification.time.recently');
    
    const diffInMins = Math.floor((Date.now() - time) / 60000);
    if (diffInMins < 1) return t('notification.time.just_now');
    if (diffInMins < 60) return t('notification.time.m_ago', { count: diffInMins });
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return t('notification.time.h_ago', { count: diffInHours });
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return t('notification.time.yesterday');
    return t('notification.time.d_ago', { count: diffInDays });
  };

  const renderIcon = (noti: Notification) => {
    const category = (noti.category || '').toUpperCase();
    if (noti.imageUrl) {
      return (
        <div className="relative shrink-0">
          <img
            alt={noti.groupName || noti.fromUserName || "Icon"}
            className={`w-12 h-12 rounded-full object-cover border-2 ${noti.isRead ? 'border-transparent' : 'border-[#d8e2ff]'}`}
            src={noti.imageUrl}
          />
          {!noti.isRead && (
             <div className="absolute -bottom-1 -right-1 bg-[#0058ba] text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                   {['SOCIAL', 'FEED', 'LIKE', 'COMMENT', 'FRIEND'].includes(category) ? 'thumb_up' : 'notifications'}
                </span>
             </div>
          )}
        </div>
      );
    }
    
    // Default icons based on category
    let iconName = 'notifications';
    let bgColor = 'bg-[#f2f4f7]';
    let textColor = 'text-[#595c5f]';
    
    if (['CLASS', 'STAY', 'SHOP', 'EVENT'].includes(category)) {
       iconName = 'event_available';
    } else if (category === 'GROUP') {
       iconName = 'groups';
       bgColor = 'bg-[#d8e2ff]';
       textColor = 'text-[#0058ba]';
    } else if (noti.baseType === 'TODO') {
       iconName = 'assignment_late';
       bgColor = 'bg-orange-100';
       textColor = 'text-orange-800';
    }
    
    return (
      <div className="relative shrink-0">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgColor} ${textColor}`}>
          <span className="material-symbols-outlined text-[24px]">{iconName}</span>
        </div>
      </div>
    );
  };

  const renderNotification = (noti: Notification) => {
    const isActionable = (noti.type === 'CLASS_APPLY') && noti.referenceId && !noti.isCompleted;
    const isCompleted = (noti.type === 'CLASS_APPLY') && noti.isCompleted;

    return (
      <div 
        key={noti.id}
        onClick={() => handleNotiClick(noti)}
        className={`group relative flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
          noti.isRead 
            ? 'bg-transparent border-transparent hover:bg-[#f2f4f4]' 
            : 'bg-[#d8e2ff]/20 border-transparent hover:border-[#d8e2ff]'
        }`}
      >
        {renderIcon(noti)}
        <div className="flex-1 min-w-0">
          {noti.groupName && (
             <span className="text-[10px] font-bold uppercase tracking-widest text-[#0058ba] mb-1 block">
               {noti.groupName}
             </span>
          )}
          <div className="text-sm text-[#2d3435] leading-relaxed">
            <span className="font-bold text-[#2d3435] block mb-0.5">{noti.title}</span>
            <span className={noti.isRead ? "text-[#596061]" : "text-[#2d3435]"}>{noti.message}</span>
          </div>
          <p className="text-xs text-[#596061] mt-1.5 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            {formatTimeAgo(noti.createdAt)}
          </p>

          {/* Inline Action Buttons for CLASS_APPLY */}
          {isActionable && (
            <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleConfirmPayment(noti)}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-[12px] font-bold shadow-sm shadow-blue-200 active:scale-[0.97] transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                {t('notification.confirm_payment')}
              </button>
              <button
                onClick={() => handleRejectPayment(noti)}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[12px] font-bold hover:bg-slate-200 active:scale-[0.97] transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                {t('notification.reject')}
              </button>
            </div>
          )}

          {/* Completed Badge */}
          {isCompleted && (
            <div className="flex items-center gap-1.5 mt-2.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-bold">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Completed
              </span>
            </div>
          )}
        </div>
        {!noti.isRead && (
          <div className="shrink-0 flex items-center">
            <div className="w-2.5 h-2.5 bg-[#0058ba] rounded-full"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <main className="max-w-2xl mx-auto h-[calc(100vh-124px)] flex flex-col overflow-hidden bg-[#FAF8FF]">
      {/* Tab Control (Fixed) */}
      <div className="px-4 py-4 w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 border-b border-slate-100/50 bg-[#FAF8FF]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-[12px] font-bold tracking-wide transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#1E293B] text-white shadow-sm'
                : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 no-scrollbar pb-20">
      {filteredNotis.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <span className="material-symbols-outlined text-outline text-5xl text-slate-300">notifications</span>
            <p className="text-[1.125rem] font-bold text-slate-700">{t('notification.empty_title')}</p>
            <p className="text-sm text-slate-500">{t('notification.empty_desc')}</p>
         </div>
      ) : (
        <>
          {/* Today Section */}
          {todayNotis.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#596061]">{t('notification.section_today')}</h2>
                <button 
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-semibold text-[#0058ba] hover:underline"
                >
                  {t('notification.mark_all_read')}
                </button>
              </div>
              <div className="space-y-1 mb-10">
                {todayNotis.map(renderNotification)}
              </div>
            </>
          )}

          {/* Older Section */}
          {olderNotis.length > 0 && (
            <div className="mt-2">
              {todayNotis.length === 0 && (
                <div className="flex items-center justify-end mb-4 px-2">
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-semibold text-[#0058ba] hover:underline"
                  >
                    {t('notification.mark_all_read')}
                  </button>
                </div>
              )}
              <div className="space-y-1">
                {olderNotis.map(renderNotification)}
              </div>
            </div>
          )}

          {/* End of List */}
          <div className="mt-12 text-center">
            <span className="inline-block p-2 rounded-full bg-[#ebeeef] mb-3">
              <span className="material-symbols-outlined text-[#757c7d]">check_circle</span>
            </span>
            <p className="text-xs font-medium text-[#596061]">{t('notification.end_of_list')}</p>
          </div>
        </>
      )}
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>

      {/* Confirmation Modal */}
      {selectedNoti && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => !isProcessing && setSelectedNoti(null)}
          ></div>
          <div className="relative w-full max-w-sm bg-white rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-4 duration-300">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8 sm:hidden"></div>
            
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-blue-600 text-3xl">payments</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">{t('notification.payment_confirmation_title')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{selectedNoti.message}</p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => handleConfirmPayment()}
                disabled={isProcessing}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isProcessing ? '...' : t('notification.confirm_payment')}
              </button>
              <button 
                onClick={() => handleRejectPayment()}
                disabled={isProcessing}
                className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isProcessing ? '...' : t('notification.reject')}
              </button>
              <button 
                onClick={() => setSelectedNoti(null)}
                disabled={isProcessing}
                className="w-full py-4 text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors"
              >
                {t('common.close') || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

