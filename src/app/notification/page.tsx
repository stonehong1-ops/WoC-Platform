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
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length > 0) {
      await notificationService.markMultipleAsRead(unreadIds);
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
    }
    
    return (
      <div className="relative shrink-0">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgColor} ${textColor}`}>
          <span className="material-symbols-outlined text-[24px]">{iconName}</span>
        </div>
      </div>
    );
  };

  const getLocalizedNotification = (noti: Notification) => {
    let title = noti.title || '';
    let message = noti.message || '';

    const getUserName = (name: string) => {
      if (name === 'Unknown User') return t('common.unknown_user', 'Unknown User');
      return name;
    };

    const titleMap: Record<string, string> = {
      'New Booking Request': t('notification.title.new_booking_request'),
      'Request Submitted': t('notification.title.request_submitted'),
      'Booking Confirmed': t('notification.title.booking_confirmed'),
      'Booking Cancelled': t('notification.title.booking_cancelled'),
      'Order Received': t('notification.title.order_received'),
      'New Order': t('notification.title.new_order'),
      'Stay Booking Requested': t('notification.title.stay_requested'),
      'New Stay Booking': t('notification.title.new_stay_booking'),
      'Social Event Reservation Received': t('notification.title.social_reserved'),
      'New Reservation Received': t('notification.title.new_reservation'),
      'New Class Application': t('notification.title.new_class_application'),
      'Class Application Received': t('notification.title.class_application_received'),
    };
    if (titleMap[title]) title = titleMap[title];

    // Resilient parsed metadata
    const userFallback = noti.fromUserName || 'A member';
    const itemFallback = noti.groupName || (noti as any).itemName || 'item';

    if (message.includes('requested to join')) {
      const match = message.match(/(.+) requested to join '(.+)'\.? Please review in chat\.?/i);
      if (match) {
        message = t('notification.msg.booking_request', { user: getUserName(match[1]), item: match[2] });
      } else {
        message = t('notification.msg.booking_request', { user: getUserName(userFallback), item: itemFallback });
      }
    } else if (message.includes('is submitted and waiting for host confirmation')) {
      const match = message.match(/Your request for '(.+)' is submitted and waiting for host confirmation\.?/i);
      if (match) {
        message = t('notification.msg.request_submitted', { item: match[1] });
      } else {
        message = t('notification.msg.request_submitted', { item: itemFallback });
      }
    } else if (message.includes('has been confirmed!')) {
      const match = message.match(/Your booking for '(.+)' has been confirmed!?/i);
      if (match) {
        message = t('notification.msg.booking_confirmed', { item: match[1] });
      } else {
        message = t('notification.msg.booking_confirmed', { item: itemFallback });
      }
    } else if (message.includes('has been cancelled')) {
      const match = message.match(/Your booking for '(.+)' has been cancelled\.?/i);
      if (match) {
        message = t('notification.msg.booking_cancelled', { item: match[1] });
      } else {
        message = t('notification.msg.booking_cancelled', { item: itemFallback });
      }
    } else if (message.includes('has been successfully received')) {
      const match1 = message.match(/Order for '(.+)' has been successfully received\.?/i);
      if (match1) {
         message = t('notification.msg.order_received', { item: match1[1] });
      } else {
        const match2 = message.match(/'(.+)' reservation has been successfully received\.?/i);
        if (match2) {
          message = t('notification.msg.social_reserved', { item: match2[1] });
        } else {
          message = t('notification.msg.order_received', { item: itemFallback });
        }
      }
    } else if (message.includes('has placed a new order for')) {
      const match = message.match(/(.+) has placed a new order for '(.+)'\.? Please check the details\.?/i);
      if (match) {
        message = t('notification.msg.new_order', { user: getUserName(match[1]), item: match[2] });
      } else {
        message = t('notification.msg.new_order', { user: getUserName(userFallback), item: itemFallback });
      }
    } else if (message.includes('has been received') && message.includes('Your booking for')) {
      const match = message.match(/Your booking for '(.+)' has been received\.?/i);
      if (match) {
        message = t('notification.msg.stay_requested', { item: match[1] });
      } else {
        message = t('notification.msg.stay_requested', { item: itemFallback });
      }
    } else if (message.includes('has applied for') && message.includes('Awaiting approval')) {
      const match = message.match(/(.+) has applied for '(.+)'\.? Awaiting approval\.?/i);
      if (match) {
        message = t('notification.msg.new_stay_booking', { user: getUserName(match[1]), item: message.includes('class') ? (noti as any).itemName : match[2] });
      } else {
        message = t('notification.msg.new_stay_booking', { user: getUserName(userFallback), item: itemFallback });
      }
    } else if (message.includes('has applied for') && message.includes('Please verify payment.')) {
      const match = message.match(/(.+) has applied for '(.+)'\.? Please verify payment\.?/i);
      if (match) {
        message = t('notification.msg.new_class_application', { user: getUserName(match[1]), item: match[2] });
      } else {
        message = t('notification.msg.new_class_application', { user: getUserName(userFallback), item: itemFallback });
      }
    } else if (message.includes('Application for') && message.includes('has been received. It will be approved after payment is verified.')) {
      const match = message.match(/Application for '(.+)' has been received\. It will be approved after payment is verified\.?/i);
      if (match) {
        message = t('notification.msg.class_application_received', { item: match[1] });
      } else {
        message = t('notification.msg.class_application_received', { item: itemFallback });
      }
    } else if (message.includes('has reserved for')) {
      const match = message.match(/(.+) has reserved for '(.+)'\.?/i);
      if (match) {
        message = t('notification.msg.new_reservation', { user: getUserName(match[1]), item: match[2] });
      } else {
        message = t('notification.msg.new_reservation', { user: getUserName(userFallback), item: itemFallback });
      }
    }

    return { title, message };
  };

  const renderNotification = (noti: Notification) => {
    const { title, message } = getLocalizedNotification(noti);

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
            <span className="font-bold text-[#2d3435] block mb-0.5">{title}</span>
            <span className={noti.isRead ? "text-[#596061]" : "text-[#2d3435]"}>{message}</span>
          </div>
          <p className="text-xs text-[#596061] mt-1.5 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            {formatTimeAgo(noti.createdAt)}
          </p>

          {/* Removed Inline Action Buttons and Completed Badge */}
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

      {/* Confirmation Modal Removed */}
    </>
  );
}

