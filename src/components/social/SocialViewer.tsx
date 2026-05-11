"use client";

import React, { useState, useEffect, useRef } from "react";
import { Social } from "@/types/social";
import { useAuth } from "@/components/providers/AuthProvider";
import { socialService } from "@/lib/firebase/socialService";
import { chatService } from "@/lib/firebase/chatService";
import { userService } from "@/lib/firebase/userService";
import { useModalNavigation } from "@/hooks/useModalNavigation";
import ChatRoom from "@/components/chat/ChatRoom";
import UniversalFeed from "@/components/feed/UniversalFeed";
import LiveFeed from "@/components/live/LiveFeed";
import SocialHomeTab from "./SocialHomeTab";
import SocialReservationTab from "./SocialReservationTab";
import EditSocialEvent from "./EditSocialEvent";
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigation } from "@/components/providers/NavigationProvider";

interface SocialViewerProps {
  social: Social;
  onClose: () => void;
}

type TabId = "home" | "live" | "feed" | "reservation";

const ADMIN_UIDS = ["7iaZAmaYY9dNNEShmJmROI8XrtH2"];

export default function SocialViewer({ social: initialSocial, onClose }: SocialViewerProps) {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const { setGlobalNavHidden } = useNavigation();
  const [social, setSocial] = useState<Social>(initialSocial);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const { isOpen: showEditModal, openModal: openEditModal, closeModal: closeEditModal } = useModalNavigation("editMode");

  // Hide global navigation on mount, restore on unmount
  useEffect(() => {
    setGlobalNavHidden(true);
    return () => setGlobalNavHidden(false);
  }, [setGlobalNavHidden]);

  useEffect(() => {
    const unsub = socialService.subscribeSocial(initialSocial.id, (data) => {
      if (data) setSocial(data);
    });
    return () => unsub();
  }, [initialSocial.id]);

  // Claim ownership state
  const [isClaiming, setIsClaiming] = useState(false);
  const isUnclaimed = ADMIN_UIDS.includes(social.organizerId || "");

  // Image carousel
  const [currentImg, setCurrentImg] = useState(0);
  const touchStartX = useRef(0);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (social.imageUrl) {
      setImages([social.imageUrl]);
    } else {
      setImages([]);
    }
  }, [social.imageUrl]);

  // UI state
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isTabStuck, setIsTabStuck] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabAnchorRef = useRef<HTMLDivElement>(null);

  const {
    value: chatId,
    openModal: openChat,
    closeModal: handleCloseChat,
  } = useModalNavigation("chatId");
  const {
    value: imageModal,
    openModal: openImageModal,
    closeModal: closeImageModal,
  } = useModalNavigation("imageModal");

  const showImageModal = imageModal === "true";

  // Permission: Org, Staff, or Admin can edit
  const canEdit = user && (
    user.uid === social.organizerId ||
    social.staffIds?.includes(user.uid) ||
    ADMIN_UIDS.includes(user.uid) ||
    user.email === "stonehong1@gmail.com"
  );

  // Likes
  useEffect(() => {
    if (!user) return;
    const unsub = socialService.subscribeMyLikes(user.uid, (likes) => {
      setIsLiked(likes.some(l => l.id === social.id));
    });
    return () => unsub();
  }, [user, social.id]);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return alert(t('social.login_first'));
    try { await socialService.toggleLike(user.uid, social.id); } catch (err) { console.error(err); }
  };

  // Scroll listener — detect when tab should become fixed
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

  const handleChatWithOrganizer = async () => {
    if (!user) return alert(t('social.login_first'));
    const organizerId = social.organizerId || "adminstone";
    if (user.uid === organizerId) return alert(t('social.no_self_chat'));
    if (!confirm(t('social.confirm_chat'))) return;
    try {
      const roomId = await chatService.getOrCreatePrivateRoom([user.uid, organizerId], user.uid, "business");
      const displayDate = social.type === "regular"
        ? `${t('social.every_week')} ${[t('common.sun'), t('common.mon'), t('common.tue'), t('common.wed'), t('common.thu'), t('common.fri'), t('common.sat')][social.dayOfWeek || 0]}`
        : "TBA";
      await chatService.sendMessage({
        roomId, senderId: user.uid, senderName: user.displayName || "User",
        senderPhoto: user.photoURL || undefined,
        text: `${t('social.inquiry_prefix')}\n${t('social.inquiry_title_label')}: ${social.title}\n${t('social.inquiry_date_label')}: ${displayDate}\n${t('social.inquiry_link_label')}: ${window.location.origin}/social?id=${social.id}`,
        type: "text",
      });
      openChat(roomId);
    } catch (err) { console.error(err); alert(t('social.chat_failed')); }
  };

  const handleDelete = async () => {
    if (!confirm(t('social.confirm_delete'))) return;
    try {
      await socialService.deleteSocial(social.id);
      onClose();
    } catch (err) { console.error(err); alert(t('social.delete_failed')); }
  };

  const titleStr = social.titleNative || social.title;
  const brandStr = social.organizerNameNative || social.organizerName || t('social.organizer_fallback');

  const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: "home", label: t('social.tab_home'), icon: "home" },
    { id: "live", label: t('social.tab_live'), icon: "play_circle" },
    { id: "feed", label: t('social.tab_feed'), icon: "forum" },
    { id: "reservation", label: t('social.tab_booking'), icon: "event_seat" },
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
      <div className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 transition-all duration-300 ${isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-gradient-to-b from-black/30 to-transparent"}`}>
        <button onClick={onClose} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? "bg-slate-100 text-[#2d3435]" : "bg-black/20 backdrop-blur-sm text-white"}`}>
          <span className="material-symbols-rounded text-xl">arrow_back</span>
        </button>
        <div className={`flex flex-col items-center max-w-[160px] transition-colors ${isScrolled ? "text-[#2d3435]" : "text-white drop-shadow-md"}`}>
          <div className="text-base font-bold truncate w-full text-center">{social.title}</div>
          {social.titleNative && <div className={`text-[10px] font-bold truncate w-full text-center ${isScrolled ? "text-[#acb3b4]" : "text-white/90 drop-shadow-md"}`}>{social.titleNative}</div>}
        </div>
        <div className="flex items-center gap-1">
          {canEdit && (
            <>
              <button onClick={() => openEditModal('true')}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? "bg-slate-100 text-[#2d3435]" : "bg-black/20 backdrop-blur-sm text-white"}`}>
                <span className="material-symbols-rounded text-xl">edit</span>
              </button>
              <button onClick={handleDelete}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? "bg-slate-100 text-red-500" : "bg-black/20 backdrop-blur-sm text-white"}`}>
                <span className="material-symbols-rounded text-xl">delete</span>
              </button>
            </>
          )}
          <button onClick={() => navigator.share ? navigator.share({ title: titleStr, url: window.location.href }).catch(console.error) : alert(t('social.share_not_supported'))}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? "bg-slate-100 text-[#2d3435]" : "bg-black/20 backdrop-blur-sm text-white"}`}>
            <span className="material-symbols-rounded text-xl">share</span>
          </button>
        </div>
      </div>

      {/* Fixed Tab Bar — appears when scrolled past anchor */}
      {isTabStuck && (
        <div className="fixed top-[56px] left-0 right-0 z-40">
          <TabBar />
        </div>
      )}

      {/* Scrollable Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto detail-scrollbar pb-[80px]">
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden bg-[#f2f4f4]">
          {images.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#c4cacc]">
              <span className="material-symbols-rounded text-5xl mb-1">local_activity</span>
              <span className="text-[10px] font-bold tracking-wider uppercase">{t('social.no_image')}</span>
            </div>
          )}
          {images.length > 0 && (
            <div className="relative h-full" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onClick={() => openImageModal("true")}>
              <div className="flex h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${currentImg * 100}%)` }}>
                {images.map((img, i) => (
                  <div key={i} className="w-full flex-shrink-0 h-full">
                    <img src={img} alt={`${titleStr} ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>

        <div className="px-4 pt-4 pb-4 border-b border-[#f2f4f4]">
          <p className="text-sm text-[#596061] whitespace-pre-wrap leading-relaxed line-clamp-none">
            {(social as any).description || t('social.no_description')}
          </p>
        </div>

        {/* Tab Anchor — inline tab bar (hidden when stuck) */}
        <div ref={tabAnchorRef}>
          {!isTabStuck && <TabBar />}
          {isTabStuck && <div style={{ height: 44 }} />}
        </div>

        {/* Tab Content */}
        {activeTab === "home" && (
          <SocialHomeTab 
            social={social} 
            onChatWithOrganizer={handleChatWithOrganizer} 
            canEdit={!!canEdit} 
            onShowImages={(imgs, idx) => {
              setImages(imgs);
              setCurrentImg(idx);
              openImageModal("true");
            }}
            isUnclaimed={isUnclaimed}
            isClaiming={isClaiming}
            onClaim={async () => {
              if (!user) return;
              if (!confirm(t('social.claim_confirm'))) return;
              setIsClaiming(true);
              try {
                await socialService.claimSocial(social.id, {
                  uid: user.uid,
                  displayName: user.displayName || "User",
                  nativeNickname: (profile as any)?.nativeNickname || "",
                }, user.uid);
                alert(t('social.claim_success'));
                onClose();
              } catch (err) { console.error(err); alert(t('social.claim_failed')); }
              finally { setIsClaiming(false); }
            }}
          />
        )}
        {activeTab === "live" && (
          <div className="w-full h-[calc(100vh-100px)]">
            <LiveFeed entityType="social" entityId={social.id} />
          </div>
        )}
        {activeTab === "feed" && (
          <div className="px-4 pb-8 pt-2">
            <UniversalFeed context={{ scope: "social", scopeId: social.id }} currentUser={user} profile={profile} />
          </div>
        )}
        {activeTab === "reservation" && <SocialReservationTab social={social} />}
      </div>



      {/* Full Screen Image Viewer */}
      {showImageModal && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-in fade-in duration-200">
          <div className="absolute top-0 left-0 right-0 z-10 flex justify-end p-4">
            <button onClick={closeImageModal} className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center">
              <span className="material-symbols-rounded text-2xl">close</span>
            </button>
          </div>
          <div className="flex-1 w-full h-full flex items-center justify-center" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div className="flex w-full transition-transform duration-300 ease-out h-full items-center" style={{ transform: `translateX(-${currentImg * 100}%)` }}>
              {images.map((img, i) => (
                <div key={i} className="w-full flex-shrink-0 flex items-center justify-center px-4">
                  <img src={img} alt={`Fullscreen ${i + 1}`} className="w-full max-h-[80vh] object-contain" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat Room */}
      {chatId && (
        <div className="fixed inset-0 z-[200] bg-white animate-in slide-in-from-bottom duration-300">
          <ChatRoom roomId={chatId} onBack={handleCloseChat} />
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EditSocialEvent
          socialData={social}
          onClose={closeEditModal}
          onSuccess={closeEditModal}
        />
      )}


    </div>
  );
}
