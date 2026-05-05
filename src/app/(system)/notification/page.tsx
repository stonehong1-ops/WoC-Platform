'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { notificationService } from '@/lib/firebase/notificationService';
import { Notification } from '@/types/notification';

export default function NotificationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const tabs = ['All', 'Social', 'Events', 'System'];
  
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
    if (noti.actionUrl) {
      router.push(noti.actionUrl);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = filteredNotis.filter(n => !n.isRead).map(n => n.id);
    for (const id of unreadIds) {
      await notificationService.markAsRead(id);
    }
  };

  const formatTimeAgo = (date: any) => {
    if (!date) return 'Recently';
    const time = getTime(date);
    if (time === 0) return 'Recently';
    
    const diffInMins = Math.floor((Date.now() - time) / 60000);
    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays}d ago`;
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
    <main className="max-w-2xl mx-auto h-[calc(100vh-124px)] flex flex-col overflow-hidden bg-[#FAF8FF]">
      {/* Tab Control (Fixed) */}
      <div className="px-4 py-4 w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 border-b border-slate-100/50 bg-[#FAF8FF]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-[12px] font-bold tracking-wide transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-[#1E293B] text-white shadow-sm'
                : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 no-scrollbar pb-20">
      {filteredNotis.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <span className="material-symbols-outlined text-outline text-5xl text-slate-300">notifications</span>
            <p className="text-[1.125rem] font-bold text-slate-700">No notifications yet</p>
            <p className="text-sm text-slate-500">When you receive updates, they will appear here.</p>
         </div>
      ) : (
        <>
          {/* Today Section */}
          {todayNotis.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#596061]">Today</h2>
                <button 
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-semibold text-[#0058ba] hover:underline"
                >
                  Mark all as read
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
                    Mark all as read
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
            <p className="text-xs font-medium text-[#596061]">You've reached the end of your notifications.</p>
          </div>
        </>
      )}
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}

