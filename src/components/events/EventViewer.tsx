"use client";

import React, { useState, useEffect, useRef } from "react";
import { Capacitor } from '@capacitor/core';
import { Event } from "@/types/event";
import { useAuth } from "@/components/providers/AuthProvider";
import { eventService } from "@/lib/firebase/eventService";
import { chatService } from "@/lib/firebase/chatService";
import { useModalNavigation } from "@/hooks/useModalNavigation";
import { useBackButtonClose } from '@/hooks/useBackButtonClose';
import ChatRoom from "@/components/chat/ChatRoom";
import UniversalFeed from "@/components/feed/UniversalFeed";
import EventHomeTab from "./EventHomeTab";
import EventProgramTab from "./EventProgramTab";
import EventRegisterTab from "./EventRegisterTab";
import LiveFeed from "@/components/live/LiveFeed";
import EditEvent from "./EditEvent";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigation } from "@/components/providers/NavigationProvider";
import ReportModal from "@/components/common/ReportModal";
import MediaViewerPopup from "@/components/feed/MediaViewerPopup";

interface EventViewerProps {
  event: Event;
  onClose: () => void;
}

type TabId = "home" | "program" | "feed" | "live" | "register";

const ADMIN_UIDS = ["7iaZAmaYY9dNNEShmJmROI8XrtH2"];

export default function EventViewer({ event: initialEvent, onClose }: EventViewerProps) {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const { setGlobalNavHidden } = useNavigation();
  const [event, setEvent] = useState<Event>(initialEvent);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [showEdit, setShowEdit] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useBackButtonClose(true, onClose);

  useEffect(() => {
    setGlobalNavHidden(true);
    return () => setGlobalNavHidden(false);
  }, [setGlobalNavHidden]);

  useEffect(() => {
    const unsub = eventService.subscribeEvent(initialEvent.id, (data) => {
      if (data) setEvent(data);
    });
    return () => unsub();
  }, [initialEvent.id]);

  // Image carousel
  const [currentImg, setCurrentImg] = useState(0);
  const touchStartX = useRef(0);
  const images = event.imageUrl ? [event.imageUrl] : [];

  // UI state
  const [isScrolled, setIsScrolled] = useState(false);
  const [isTabStuck, setIsTabStuck] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabAnchorRef = useRef<HTMLDivElement>(null);

  const {
    value: chatId,
    openModal: openChat,
    closeModal: handleCloseChat,
  } = useModalNavigation("chatId");
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Permission: Host, Staff, or Admin can edit
  const canEdit = user && (
    user.uid === event.hostId ||
    event.staffIds?.includes(user.uid) ||
    ADMIN_UIDS.includes(user.uid) ||
    user.email === "stonehong1@gmail.com" ||
    profile?.isAdmin ||
    profile?.systemRole === "admin"
  );

  // Scroll listener
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      setIsScrolled(el.scrollTop > 60);
      if (tabAnchorRef.current) {
        const rect = tabAnchorRef.current.getBoundingClientRect();
        setIsTabStuck(rect.top <= 56);
      }
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentImg < images.length - 1) setCurrentImg(p => p + 1);
      if (diff < 0 && currentImg > 0) setCurrentImg(p => p - 1);
    }
  };

  const handleChatWithHost = async () => {
    if (!user) return alert(t('event.login_first'));
    const hostId = event.hostId;
    if (user.uid === hostId) return alert(t('event.no_self_chat'));
    if (!confirm(t('event.confirm_chat'))) return;
    try {
      const roomId = await chatService.getOrCreatePrivateRoom([user.uid, hostId], user.uid, "business");
      await chatService.sendMessage({
        roomId, senderId: user.uid, senderName: user.displayName || "User",
        senderPhoto: user.photoURL || undefined,
        text: `${t('event.inquiry_prefix')}\n${t('event.inquiry_title')}: ${event.title}\n${t('event.inquiry_link')}: ${window.location.origin}/events?id=${event.id}`,
        type: "text",
      });
      openChat(roomId);
    } catch (err) { console.error(err); alert(t('event.chat_failed')); }
  };

  const handleDelete = async () => {
    if (!confirm(t('event.confirm_delete'))) return;
    try {
      await eventService.deleteEvent(event.id);
      onClose();
    } catch (err) { console.error(err); alert(t('event.delete_failed')); }
  };

  const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: "home", label: t('event.tab_home'), icon: "home" },
    { id: "program", label: t('event.tab_program'), icon: "calendar_month" },
    { id: "feed", label: t('event.tab_feed'), icon: "rss_feed" },
    { id: "live", label: t('event.tab_live'), icon: "live_tv" },
    { id: "register", label: t('event.tab_register'), icon: "how_to_reg" },
  ];

  // Tab bar component (reused in both inline and fixed positions)
  const TabBar = () => (
    <div className="flex bg-white border-b border-[#e0e4e5]">
      {TABS.map(tab => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold tracking-wide transition-all border-b-2 ${
            activeTab === tab.id ? "text-primary border-primary" : "text-[#acb3b4] border-transparent"
          }`}>
          <span className="material-symbols-rounded text-base" style={{ fontVariationSettings: activeTab === tab.id ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <style dangerouslySetInnerHTML={{ __html: `.detail-scrollbar::-webkit-scrollbar{display:none}.detail-scrollbar{-ms-overflow-style:none;scrollbar-width:none}` }} />

      {/* Header */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pb-3 transition-all duration-300 ${isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-gradient-to-b from-black/30 to-transparent"}`}
        style={{
          paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
          height: 'calc(56px + env(safe-area-inset-top, 0px))'
        }}
      >
        <button onClick={onClose} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? "bg-slate-100 text-[#2d3435]" : "bg-black/20 backdrop-blur-sm text-white"}`}>
          <span className="material-symbols-rounded text-xl">arrow_back</span>
        </button>
        <div className={`flex flex-col items-center max-w-[200px] transition-all duration-300 ${isScrolled ? "opacity-100 translate-y-0 text-[#2d3435]" : "opacity-0 -translate-y-2 text-white pointer-events-none"}`}>
          <div className="text-base font-bold truncate w-full text-center">
            {language === 'KR' && event.titleNative ? event.titleNative : event.title}
          </div>
          {event.titleNative && language !== 'KR' && <div className={`text-[10px] font-bold truncate w-full text-center ${isScrolled ? "text-[#acb3b4]" : "text-white/90"}`}>{event.titleNative}</div>}
        </div>
        <div className="flex items-center gap-1">
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? "bg-slate-100 text-[#2d3435]" : "bg-black/20 backdrop-blur-sm text-white"}`}
            >
              <span className="material-symbols-rounded text-xl">more_vert</span>
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 z-[120] bg-white border border-slate-100 shadow-xl rounded-2xl py-1 w-36 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <button 
                  onClick={() => {
                    setShowMenu(false);
                    if (navigator.share) {
                      navigator.share({ title: event.title, url: window.location.href }).catch(console.error);
                    } else {
                      navigator.clipboard?.writeText(window.location.href);
                      alert(t('event.link_copied') || '링크가 복사되었습니다.');
                    }
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-rounded text-base text-slate-400">share</span>
                  {t('common.share') || '공유하기'}
                </button>
                {canEdit && (
                  <>
                    <button 
                      onClick={() => { setShowMenu(false); setShowEdit(true); }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-rounded text-base text-slate-400">edit</span>
                      {t('common.edit') || '수정'}
                    </button>
                    <button 
                      onClick={() => { setShowMenu(false); handleDelete(); }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-rounded text-base text-red-400">delete</span>
                      {t('common.delete') || '삭제'}
                    </button>
                  </>
                )}
                <button 
                  onClick={() => { setShowMenu(false); setIsReportModalOpen(true); }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-rounded text-base text-slate-400">report</span>
                  {t('common.report') || '신고'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Tab Bar — appears when scrolled past anchor */}
      {isTabStuck && (
        <div 
          className="fixed left-0 right-0 z-40"
          style={{ top: 'calc(56px + env(safe-area-inset-top, 0px))' }}
        >
          <TabBar />
        </div>
      )}

      {/* Scrollable Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto detail-scrollbar pb-[80px]">
        {/* Image */}
        <div className={`relative w-full ${images.length === 0 ? 'aspect-[16/9] bg-slate-900' : 'bg-black'}`}>
          {images.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <span className="material-symbols-rounded text-4xl mb-1">local_activity</span>
              <span className="text-[9px] font-black tracking-wider uppercase">{t('event.no_image') || 'IMAGE NOT AVAILABLE'}</span>
            </div>
          )}
          {images.length > 0 && (
            <div className="relative w-full" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onClick={() => setIsMediaViewerOpen(true)}>
              <div className="flex w-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${currentImg * 100}%)` }}>
                {images.map((img, i) => (
                  <div key={i} className="w-full flex-shrink-0 flex items-center justify-center">
                    <img src={img} alt={`${event.title} ${i + 1}`} className="w-full h-auto max-h-[75vh] object-contain" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="px-4 pt-4 pb-4 border-b border-[#f2f4f4]">
          {event.subtitle && <p className="text-xs font-bold text-primary mb-1 italic">"{event.subtitle}"</p>}
          <p className="text-sm text-[#596061] whitespace-pre-wrap leading-relaxed line-clamp-4">
            {event.description || t('event.no_description')}
          </p>
        </div>

        {/* Tab Anchor — inline tab bar (hidden when stuck) */}
        <div ref={tabAnchorRef}>
          {!isTabStuck && <TabBar />}
          {isTabStuck && <div style={{ height: 44 }} />}
        </div>

        {/* Tab Content */}
        {activeTab === "home" && <EventHomeTab event={event} onChatWithHost={handleChatWithHost} canEdit={!!canEdit} />}
        {activeTab === "program" && <EventProgramTab event={event} />}
        {activeTab === "feed" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <UniversalFeed 
              context={{ scope: 'event', scopeId: event.id, tag: event.tag }} 
              currentUser={user} 
              profile={profile} 
            />
          </div>
        )}
        {activeTab === "live" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <LiveFeed 
              entityType="event" 
              entityId={event.id} 
            />
          </div>
        )}
        {activeTab === "register" && <EventRegisterTab event={event} />}
      </div>

      {/* Full Screen Image Viewer */}
      <MediaViewerPopup
        isOpen={isMediaViewerOpen}
        onClose={() => setIsMediaViewerOpen(false)}
        media={images.map(url => ({ url, type: 'image' }))}
        initialIndex={currentImg}
      />

      {/* Edit Event */}
      {showEdit && (
        <EditEvent eventData={event} onClose={() => setShowEdit(false)} onSuccess={() => setShowEdit(false)} />
      )}

      {/* Chat Room */}
      {chatId && (
        <div className="fixed inset-0 z-[200] bg-white animate-in slide-in-from-bottom duration-300">
          <ChatRoom roomId={chatId} onBack={handleCloseChat} />
        </div>
      )}

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetId={event.id}
        targetType="event"
        targetOwnerUid={event.hostId || ""}
        targetSnapshot={`${event.title}\n${event.description || ""}`}
        targetTitle={event.title}
      />
    </div>
  );
}
