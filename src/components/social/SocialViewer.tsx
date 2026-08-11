"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Capacitor } from '@capacitor/core';
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
import SocialPosterEditor from "./SocialPosterEditor";
import PosterOverlay from "./poster/PosterOverlay";
import { extractPosterData } from "./poster/posterTypes";
import { POSTER_LAYOUTS } from "./poster/PosterLayouts";
import { useLanguage } from '@/contexts/LanguageContext';
import { isVideoUrl } from '@/lib/utils/socialUtils';
import { QuickMediaChangeBottomSheet } from './QuickMediaChangeBottomSheet';
import MediaViewerPopup from '@/components/feed/MediaViewerPopup';

interface SocialViewerProps {
  social: Social;
  onClose: () => void;
  targetDate?: Date;
  /**
   * 이 Social 이 열리는 장소의 등록 사진. Social 에 사진이 하나도 없을 때만 쓴다.
   * 목록에서는 이미 이렇게 보여주고 있어서, 없으면 같은 Social 이 목록에선 사진이
   * 있고 상세로 들어가면 빈 자리가 된다.
   */
  venueImageUrl?: string;
}

type TabId = "home" | "live" | "feed" | "reservation";

const ADMIN_UIDS = ["7iaZAmaYY9dNNEShmJmROI8XrtH2"];

export default function SocialViewer({ social: initialSocial, onClose, targetDate, venueImageUrl }: SocialViewerProps) {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [social, setSocial] = useState<Social>(initialSocial);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);



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
    const hasPoster = social.posterLayoutId && social.posterLayoutId !== 'none';
    if (hasPoster) {
      // Live poster mode: use original image as background, overlay renders DJ live
      setImages(social.imageUrl ? [social.imageUrl] : []);
    } else if (social.imageUrls && social.imageUrls.length > 0) {
      setImages(social.imageUrls);
    } else if (social.posterExportUrl) {
      setImages([social.posterExportUrl]);
    } else if (social.imageUrl) {
      setImages([social.imageUrl]);
    } else if (venueImageUrl) {
      // Social 자체 사진이 하나도 없을 때만 장소 사진으로 내려간다.
      // 목록과 같은 기준이라 상세로 들어와도 보이던 사진이 사라지지 않는다.
      setImages([venueImageUrl]);
    } else {
      setImages([]);
    }
  }, [social.imageUrl, social.posterExportUrl, social.posterLayoutId, social.imageUrls, venueImageUrl]);

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
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const [showPosterEditor, setShowPosterEditor] = useState(false);
  const [showQuickMediaSheet, setShowQuickMediaSheet] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const targetDateStr = useMemo(() => {
    if (!targetDate) return undefined;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}`;
  }, [targetDate]);

  const posterData = useMemo(() => extractPosterData(social, targetDateStr), [social, targetDateStr]);

  // Fetch the pre-generated poster image
  const fetchPosterBlob = async (): Promise<Blob | null> => {
    const urlToFetch = social.posterExportUrl || social.imageUrl;
    if (!urlToFetch) return null;
    try {
      const proxyUrl = `/api/proxy/image?url=${encodeURIComponent(urlToFetch)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Proxy fetch failed");
      return await response.blob();
    } catch (e) {
      console.error("Failed to fetch poster blob", e);
      return null;
    }
  };

  // Permission: Org, Staff, or Admin can edit
  const canEdit = user && (
    user.uid === social.organizerId ||
    social.staffIds?.includes(user.uid) ||
    ADMIN_UIDS.includes(user.uid) ||
    user.email === "stonehong1@gmail.com" ||
    profile?.isAdmin ||
    profile?.systemRole === "admin"
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
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: `.detail-scrollbar::-webkit-scrollbar{display:none}.detail-scrollbar{-ms-overflow-style:none;scrollbar-width:none}` }} />

      {/* Header */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pb-3 transition-all duration-300 ${isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : ""}`}
        style={{
          paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
          height: 'calc(56px + env(safe-area-inset-top, 0px))'
        }}
      >
        <button onClick={onClose} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? "bg-slate-100 text-[#2d3435]" : "bg-black/20 backdrop-blur-sm text-white"}`}>
          <span className="material-symbols-rounded text-xl">arrow_back</span>
        </button>
        <div className={`flex flex-col items-center max-w-[160px] transition-all duration-300 ${isScrolled ? "opacity-100 translate-y-0 text-[#2d3435]" : "opacity-0 -translate-y-2 text-white pointer-events-none"}`}>
          <div className="text-base font-bold truncate w-full text-center">{social.title}</div>
          {social.titleNative && <div className={`text-[10px] font-bold truncate w-full text-center ${isScrolled ? "text-[#acb3b4]" : "text-white/90"}`}>{social.titleNative}</div>}
        </div>
        <button onClick={() => setShowMenu(true)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? "bg-slate-100 text-[#2d3435]" : "bg-black/20 backdrop-blur-sm text-white"}`}>
          <span className="material-symbols-rounded text-xl">more_vert</span>
        </button>
      </div>

      {/* Fixed Tab Bar — appears when scrolled past anchor */}
      {isTabStuck && (
        <div 
          className="fixed left-0 right-0 z-40"
          style={{ top: Capacitor.isNativePlatform() ? 'calc(56px + env(safe-area-inset-top))' : '56px' }}
        >
          <TabBar />
        </div>
      )}

      {/* Scrollable Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto detail-scrollbar pb-[80px]">
        {/* Image */}
        <div ref={heroRef} className={`relative overflow-hidden ${
          (images.length === 0) 
            ? "w-full aspect-[4/5] bg-slate-100" 
            : (social.posterLayoutId && social.posterLayoutId !== "none") 
              ? "aspect-[4/5] bg-[#f2f4f4]" 
              : "w-full bg-black"
        }`}>
          {images.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-100">
              <span className="material-symbols-rounded text-5xl mb-1 text-slate-300">local_activity</span>
              <span className="text-[12px] font-bold tracking-wider uppercase text-slate-400">{t('social.no_image')}</span>
            </div>
          )}
          {images.length > 0 && (
            <div className="relative w-full" style={{ height: (social.posterLayoutId && social.posterLayoutId !== "none") ? "100%" : "auto" }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onClick={() => setIsMediaViewerOpen(true)}>
              <div className="flex w-full transition-transform duration-300 ease-out" style={{ height: (social.posterLayoutId && social.posterLayoutId !== "none") ? "100%" : "auto", transform: `translateX(-${currentImg * 100}%)` }}>
                {images.map((img, i) => (
                  <div key={i} className="w-full flex-shrink-0 flex items-center justify-center" style={{ height: (social.posterLayoutId && social.posterLayoutId !== "none") ? "100%" : "auto" }}>
                    {isVideoUrl(img) ? (
                      <video 
                        src={img} 
                        className={`w-full ${(social.posterLayoutId && social.posterLayoutId !== "none") ? "h-full object-cover" : "h-auto max-h-[75vh] object-contain"}`}
                        muted 
                        autoPlay 
                        loop 
                        playsInline 
                      />
                    ) : (
                      <img src={img} alt={`${titleStr} ${i + 1}`} className={`w-full ${(social.posterLayoutId && social.posterLayoutId !== "none") ? "h-full object-cover" : "h-auto max-h-[75vh] object-contain"}`} />
                    )}
                  </div>
                ))}
              </div>
              {/* 히어로 이미지 우측 하단 수직 배치 액션 버튼 (카메라 퀵교체 & 공유) */}
              <div className="absolute bottom-3 right-3 z-30 flex flex-col items-center gap-2">
                {/* 1. 포스터/동영상 퀵 교체 카메라 버튼 (권한이 있거나 작성자인 경우) */}
                {canEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowQuickMediaSheet(true);
                    }}
                    className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/80 active:scale-95 transition-all shadow-md group"
                    title={t('social.quick_media_change_title', '포스터/동영상 5초 퀵 교체')}
                  >
                    <span className="material-symbols-rounded text-xl group-hover:scale-110 transition-transform">photo_camera</span>
                  </button>
                )}

                {/* 2. 공유 버튼 */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (navigator.share) {
                      navigator.share({ title: titleStr, url: window.location.href }).catch(() => {});
                    } else {
                      navigator.clipboard?.writeText(window.location.href);
                      alert(t('social.link_copied'));
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/80 active:scale-95 transition-all shadow-md group"
                  title={t('social.menu_share_link', '공유하기')}
                >
                  <span className="material-symbols-rounded text-xl group-hover:scale-110 transition-transform">share</span>
                </button>
              </div>

              {/* 히어로 이미지 좌측 하단 3줄 설명 (진한 배경 박스 제거 및 텍스트 음영 가독성 최적화) */}
              <div className="absolute bottom-3 left-4 right-[65px] z-30 text-left bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 rounded-xl backdrop-blur-[2px]">
                <p 
                  className={`text-xs font-semibold text-white/95 leading-snug drop-shadow-md ${isDescExpanded ? '' : 'line-clamp-3'}`}
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                >
                  {(social as any).description || t('social.no_description')}
                </p>
                {((social as any).description || "").length > 60 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDescExpanded(!isDescExpanded);
                    }} 
                    className="text-[11px] font-black text-amber-300 hover:text-amber-200 mt-1 flex items-center gap-0.5"
                  >
                    {isDescExpanded ? (
                      <>
                        <span>{t('common.show_less')}</span>
                        <span className="material-symbols-rounded text-xs">expand_less</span>
                      </>
                    ) : (
                      <>
                        <span>... {t('common.show_more')}</span>
                        <span className="material-symbols-rounded text-xs">expand_more</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
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
            targetDate={targetDate}
            onChatWithOrganizer={handleChatWithOrganizer}  
            canEdit={!!canEdit} 
            onShowImages={(imgs, idx) => {
              setImages(imgs);
              setCurrentImg(idx);
              setIsMediaViewerOpen(true);
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
      <MediaViewerPopup
        isOpen={isMediaViewerOpen}
        onClose={() => setIsMediaViewerOpen(false)}
        media={images.map(url => ({ url, type: isVideoUrl(url) ? 'video' : 'image' }))}
        initialIndex={currentImg}
      />

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
          onClose={() => setShowEditModal(false)}
          onSuccess={() => setShowEditModal(false)}
        />
      )}

      {/* Bottom Sheet Menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-[200] bg-black/40 animate-in fade-in duration-150" onClick={() => setShowMenu(false)} />
          <div 
            className="fixed bottom-0 left-0 right-0 z-[201] bg-white rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-200"
            style={{ paddingBottom: Capacitor.isNativePlatform() ? 'env(safe-area-inset-bottom)' : '0px' }}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-2" />
            <div className="px-2 pb-4">
              {canEdit && (
                <>
                  <button onClick={() => { setShowMenu(false); setShowEditModal(true); }}
                    className="flex items-center gap-4 w-full px-5 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors">
                    <span className="material-symbols-rounded text-[22px] text-[#2d3435]">edit</span>
                    <span className="text-[15px] font-medium text-[#2d3435]">{t('social.menu_edit')}</span>
                  </button>
                  <button onClick={() => { setShowMenu(false); handleDelete(); }}
                    className="flex items-center gap-4 w-full px-5 py-3.5 rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors">
                    <span className="material-symbols-rounded text-[22px] text-red-500">delete</span>
                    <span className="text-[15px] font-medium text-red-500">{t('social.menu_delete')}</span>
                  </button>
                  <div className="h-px bg-gray-100 mx-4 my-1" />
                </>
              )}
              <button onClick={async () => {
                  setShowMenu(false);
                  setIsExporting(true);
                  try {
                    const blob = await fetchPosterBlob();
                    if (!blob) { alert(t('social.no_image_available')); return; }
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.download = `${social.title.replace(/\s+/g, "_")}_poster.png`;
                    link.href = url;
                    link.click();
                    URL.revokeObjectURL(url);
                  } catch (err) { console.error(err); alert(t('social.download_failed')); }
                  finally { setIsExporting(false); }
                }}
                className="flex items-center gap-4 w-full px-5 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors">
                <span className="material-symbols-rounded text-[22px] text-[#2d3435]">download</span>
                <span className="text-[15px] font-medium text-[#2d3435]">{t('social.menu_download_poster')}</span>
              </button>
              <button onClick={async () => {
                  setShowMenu(false);
                  setIsExporting(true);
                  try {
                    const blob = await fetchPosterBlob();
                    if (blob && navigator.canShare) {
                      const file = new File([blob], `${social.title.replace(/\s+/g, "_")}_poster.png`, { type: "image/png" });
                      const shareData = { title: titleStr, text: `${titleStr}`, files: [file] };
                      if (navigator.canShare(shareData)) {
                        await navigator.share(shareData);
                      } else {
                        // Fallback: share link only
                        await navigator.share({ title: titleStr, url: window.location.href });
                      }
                    } else if (navigator.share) {
                      await navigator.share({ title: titleStr, url: window.location.href });
                    } else {
                      navigator.clipboard?.writeText(window.location.href);
                      alert(t('social.link_copied'));
                    }
                  } catch (err) {
                    if ((err as Error).name !== "AbortError") console.error(err);
                  } finally { setIsExporting(false); }
                }}
                className="flex items-center gap-4 w-full px-5 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors">
                <span className="material-symbols-rounded text-[22px] text-[#2d3435]">share</span>
                <span className="text-[15px] font-medium text-[#2d3435]">{t('social.menu_share_poster')}</span>
              </button>
              <button onClick={() => {
                  setShowMenu(false);
                  if (navigator.share) {
                    navigator.share({ title: titleStr, url: window.location.href }).catch(() => {});
                  } else {
                    navigator.clipboard?.writeText(window.location.href);
                    alert(t('social.link_copied'));
                  }
                }}
                className="flex items-center gap-4 w-full px-5 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors">
                <span className="material-symbols-rounded text-[22px] text-[#2d3435]">link</span>
                <span className="text-[15px] font-medium text-[#2d3435]">{t('social.menu_share_link')}</span>
              </button>
              <div className="h-px bg-gray-100 mx-4 my-1" />
              <button onClick={() => { setShowMenu(false); setShowPosterEditor(true); }}
                className="flex items-center gap-4 w-full px-5 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors">
                <span className="material-symbols-rounded text-[22px] text-primary">auto_fix_high</span>
                <span className="text-[15px] font-medium text-primary">{t('social.menu_poster_editor')}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Export loading overlay */}
      {isExporting && (
        <div className="fixed inset-0 z-[300] bg-black/60 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-white text-sm font-medium">{t('social.exporting')}</span>
          </div>
        </div>
      )}

      {/* Poster Editor */}
      {showPosterEditor && (
        <SocialPosterEditor 
          social={social} 
          onClose={() => setShowPosterEditor(false)} 
        />
      )}

      {/* 5초 퀵 미디어(포스터/동영상) 교체 바텀시트 */}
      {showQuickMediaSheet && (
        <QuickMediaChangeBottomSheet
          socialId={social.id}
          currentMediaUrl={social.imageUrl || social.posterExportUrl}
          isOpen={showQuickMediaSheet}
          onClose={() => setShowQuickMediaSheet(false)}
          onSuccess={(newUrl) => {
            setSocial(prev => ({ ...prev, imageUrl: newUrl, posterExportUrl: newUrl }));
          }}
        />
      )}

    </div>
  );
}
