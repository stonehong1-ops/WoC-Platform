"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Social } from "@/types/social";
import { extractPosterData, getUpcomingDateStr } from "./poster/posterTypes";
import { POSTER_LAYOUTS } from "./poster/PosterLayouts";
import { socialService } from "@/lib/firebase/socialService";
import { storageService } from "@/lib/firebase/storageService";
import { galleryService } from "@/lib/firebase/galleryService";
import { userService } from "@/lib/firebase/userService";
import { picService } from "@/services/picService";
import html2canvas from "html2canvas-pro";

interface Props {
  social: Social;
  onClose: () => void;
}

export default function SocialPosterEditor({ social, onClose }: Props) {
  const savedLayout = social.posterLayoutId || "classic";
  const savedYOffset = (social as any).posterYOffset || 0;
  const savedBlur = (social as any).posterBlur || 0;
  const savedDjPhotoUrl = (social as any).djPhotoUrl || "";

  // djs 배열이 있으면 현재 시점 기준 다음 해당 요일 DJ를 초기값으로 사용
  const savedDjName = (() => {
    if (
      social.type === "regular" &&
      social.djs && Array.isArray(social.djs) && social.djs.length > 0 &&
      social.dayOfWeek !== undefined
    ) {
      const upcomingDate = getUpcomingDateStr(social.dayOfWeek, social.endTime);
      const matched = social.djs.find(dj => dj && dj.date === upcomingDate);
      if (matched && matched.djName) return matched.djName;
      return "미정"; // djs 배열 있지만 해당 날짜 미등록
    }
    return social.djName || "";
  })();
  
  // 2D Floating Position Coordinates (default X: 50%, Y: 85%)
  const savedDjPosX = (social as any).posterDjPosX !== undefined ? (social as any).posterDjPosX : 50;
  const savedDjPosY = (social as any).posterDjPosY !== undefined ? (social as any).posterDjPosY : 85;

  // DJ Avatar Diameter Size (default: 48px, range: 32px to 96px)
  const savedDjSize = (social as any).posterDjSize !== undefined ? (social as any).posterDjSize : 48;

  const [selectedId, setSelectedId] = useState(savedLayout);
  const [yOffset, setYOffset] = useState<number>(savedYOffset);
  const [blur, setBlur] = useState<number>(savedBlur);
  const [djName, setDjName] = useState(savedDjName);
  const [djPhotoUrl, setDjPhotoUrl] = useState(savedDjPhotoUrl);
  const [imageUrl, setImageUrl] = useState(social.imageUrl || "");
  
  // 2D Coordinates & Size states
  const [djPosX, setDjPosX] = useState<number>(savedDjPosX);
  const [djPosY, setDjPosY] = useState<number>(savedDjPosY);
  const [djSize, setDjSize] = useState<number>(savedDjSize);

  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState(savedLayout); 
  const previewRef = useRef<HTMLDivElement>(null);

  // Tabs for controls: 'template' | 'style' | 'dj' | 'pics'
  const [activeControlTab, setActiveControlTab] = useState<'template' | 'style' | 'dj' | 'pics'>('template');
  
  // Pics Integration State
  const [picsImages, setPicsImages] = useState<string[]>([]);
  const [loadingPics, setLoadingPics] = useState(false);
  const [visiblePicsCount, setVisiblePicsCount] = useState(30);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 1. DJ Auto Photo Scan: scan users collection when djName is typed (with debounce)
  useEffect(() => {
    if (!djName || djName.trim().length < 2) {
      setDjPhotoUrl("");
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const users = await userService.getAllUsers();
        const matched = users.find(u => 
          (u.nickname && u.nickname.toLowerCase() === djName.trim().toLowerCase()) ||
          (u.nativeNickname && u.nativeNickname.toLowerCase() === djName.trim().toLowerCase())
        );
        if (matched && matched.photoURL) {
          setDjPhotoUrl(matched.photoURL);
        } else {
          setDjPhotoUrl(""); // Reset if not found to fall back to default icon
        }
      } catch (err) {
        console.error("DJ photo auto-scanning failed:", err);
      }
    }, 600);
    return () => clearTimeout(delayDebounce);
  }, [djName]);

  // 2. Pics Background Loader (WoC Pics Service Integration)
  useEffect(() => {
    if (activeControlTab === 'pics') {
      setLoadingPics(true);
      picService.getPics()
        .then((pics) => {
          const urls = pics.map(p => p.imageUrl).filter(Boolean);
          setPicsImages(Array.from(new Set(urls)));
          setLoadingPics(false);
        })
        .catch((err) => {
          console.error("Failed to fetch pics:", err);
          setLoadingPics(false);
        });
    }
  }, [activeControlTab]);

  // 3. Intersection Observer for Infinite Scroll in Pics Tab
  useEffect(() => {
    if (activeControlTab !== 'pics' || picsImages.length <= visiblePicsCount) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisiblePicsCount((prev) => prev + 30);
      }
    }, {
      root: null,
      rootMargin: "100px",
      threshold: 0.1
    });

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [activeControlTab, picsImages, visiblePicsCount]);

  const posterData = useMemo(() => extractPosterData({
    ...social,
    imageUrl,
    djName,
    djPhotoUrl
  } as any, 'editor'), [social, imageUrl, djName, djPhotoUrl]);

  const selected = POSTER_LAYOUTS.find((l) => l.id === selectedId) || POSTER_LAYOUTS[0];
  const isDirty = selectedId !== savedId || yOffset !== savedYOffset || blur !== savedBlur || djName !== savedDjName || djPhotoUrl !== savedDjPhotoUrl || imageUrl !== social.imageUrl || djPosX !== savedDjPosX || djPosY !== savedDjPosY || djSize !== savedDjSize;

  const proxiedImageUrl = useMemo(() => {
    if (!imageUrl) return "";
    return `/api/proxy/image?url=${encodeURIComponent(imageUrl)}`;
  }, [imageUrl]);

  const proxiedDjPhotoUrl = useMemo(() => {
    if (!djPhotoUrl) return "";
    return `/api/proxy/image?url=${encodeURIComponent(djPhotoUrl)}`;
  }, [djPhotoUrl]);

  // Design Trick: clear djName inside proxy poster data to prevent template double-render
  // This allows our independent 2D Floating Badge to render perfectly anywhere
  const proxiedPosterData = useMemo(() => ({
    ...posterData,
    djName: "", 
    imageUrl: proxiedImageUrl,
    djPhotoUrl: proxiedDjPhotoUrl
  }), [posterData, proxiedImageUrl, proxiedDjPhotoUrl]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let posterExportUrl = social.posterExportUrl || "";
      const container = document.getElementById(`poster-editor-export-container-${social.id}`);
      const previewContainer = previewRef.current;
      
      if (container && previewContainer && selectedId !== "none") {
        const pw = previewContainer.offsetWidth;
        const ph = previewContainer.offsetHeight;
        container.style.width = `${pw}px`;
        container.style.height = `${ph}px`;

        const images = Array.from(container.querySelectorAll('img'));
        await Promise.all(
          images.map((img) => {
            if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
            return new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            });
          })
        );
        
        await document.fonts.ready;
        await new Promise(r => requestAnimationFrame(r));
        await new Promise(r => requestAnimationFrame(r));
        await new Promise(res => setTimeout(res, 500)); 

        const scaleFactor = 1080 / pw;

        const canvas = await html2canvas(container, {
          scale: scaleFactor,
          backgroundColor: "#000000",
          useCORS: true,
          allowTaint: false, 
          windowWidth: pw,
          windowHeight: ph,
          logging: false,
          removeContainer: false,
          imageTimeout: 15000, 
        });

        const blob = await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), "image/png"));
        if (blob) {
          const file = new File([blob], `poster_${social.id}_${Date.now()}.png`, { type: "image/png" });
          posterExportUrl = await storageService.uploadFile(file, `socials/posters/${file.name}`);
        }
      }

      await socialService.updateSocial(social.id, { 
        posterLayoutId: selectedId,
        posterExportUrl,
        imageUrl,
        djName,
        djPhotoUrl,
        posterYOffset: yOffset,
        posterBlur: blur,
        posterDjPosX: djPosX,
        posterDjPosY: djPosY,
        posterDjSize: djSize
      } as any);

      setSavedId(selectedId);
      onClose(); 
    } catch (err) {
      console.error(err);
      alert("Failed to save poster layout");
    } finally {
      setIsSaving(false);
    }
  };

  const Comp = selected.Component;

  // Proportional font sizing for the floating DJ Badge based on avatar size
  const badgeFontScale = useMemo(() => {
    if (djSize >= 72) return { sub: "text-[7px]", main: "text-[13px]" };
    if (djSize >= 56) return { sub: "text-[6.5px]", main: "text-xs" };
    if (djSize >= 44) return { sub: "text-[6px]", main: "text-[11px]" };
    return { sub: "text-[5.5px]", main: "text-[9px]" };
  }, [djSize]);

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-white/10 bg-zinc-950">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform">
          <span className="material-symbols-rounded text-white text-xl">close</span>
        </button>
        <span className="text-white font-black text-[13px] tracking-widest">POSTER STUDIO</span>
        <button
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className={`h-10 px-5 rounded-full flex items-center justify-center gap-1.5 text-xs font-black tracking-wider uppercase transition-all ${
            isDirty
              ? "bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-500/20"
              : "bg-white/10 text-white/40"
          } disabled:opacity-40`}
        >
          <span className="material-symbols-rounded text-base">{isSaving ? "hourglass_top" : isDirty ? "save" : "check_circle"}</span>
          {isSaving ? "Saving..." : isDirty ? "Save" : "Saved"}
        </button>
      </div>

      {/* Poster Preview Window */}
      <div className="flex-1 flex items-center justify-center overflow-hidden px-6 py-4 bg-zinc-900/40">
        <div
          ref={previewRef}
          className="relative w-full max-w-[340px] bg-black overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-all"
          style={{ aspectRatio: "4/5" }}
        >
          {/* Background Image with Dynamic Blur */}
          {imageUrl ? (
            <img
              src={proxiedImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-all duration-300"
              style={{ filter: `blur(${blur}px) brightness(0.85)` }}
              crossOrigin="anonymous"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-950 to-black" />
          )}

          {/* Layout Overlay with Y-Offset Transform */}
          <div 
            className="absolute inset-0 transition-transform duration-200 ease-out"
            style={{ transform: `translateY(${yOffset}px)` }}
          >
            <Comp d={proxiedPosterData} />
          </div>

          {/* DYNAMIC 2D FLOATING DJ BADGE (PROPORTIONAL SIZING) */}
          {selectedId !== "none" && djName && (
            <div 
              className="absolute flex flex-col items-center gap-1 bg-black/80 backdrop-blur-md rounded-2xl border border-white/25 shadow-2xl pointer-events-none z-30 transition-all select-none text-center animate-in zoom-in-95 duration-200"
              style={{ 
                left: `${djPosX}%`, 
                top: `${djPosY}%`, 
                transform: "translate(-50%, -50%)",
                padding: `${djSize >= 56 ? '8px 12px' : '6px 8px'}`
              }}
            >
              {djPhotoUrl ? (
                <div 
                  className="rounded-full overflow-hidden border border-white/40 shrink-0 bg-zinc-900 shadow-inner"
                  style={{ width: `${djSize}px`, height: `${djSize}px` }}
                >
                  <img src={proxiedDjPhotoUrl} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />
                </div>
              ) : (
                <div 
                  className="rounded-full bg-zinc-800 flex items-center justify-center border border-white/20 shrink-0"
                  style={{ width: `${djSize}px`, height: `${djSize}px` }}
                >
                  <span className="material-symbols-rounded text-white" style={{ fontSize: `${djSize * 0.45}px` }}>headphones</span>
                </div>
              )}
              <div className="flex flex-col items-center justify-center leading-none mt-1">
                <span className={`${badgeFontScale.sub} tracking-[0.2em] text-zinc-400 font-black uppercase mb-0.5`}>DJ</span>
                <span className={`${badgeFontScale.main} font-black text-white tracking-tight`}>{djName}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden high-res container for capture */}
      <div 
        id={`poster-editor-export-container-${social.id}`}
        className="fixed top-0 left-0 pointer-events-none opacity-100"
        style={{ width: '360px', height: '450px', overflow: 'hidden', backgroundColor: '#000', transform: 'translateX(-200vw)', zIndex: 999999 }}
      >
        {imageUrl && (
          <img 
            src={proxiedImageUrl} 
            className="absolute inset-0 w-full h-full object-cover" 
            style={{ filter: `blur(${blur}px) brightness(0.85)` }}
            crossOrigin="anonymous"
            loading="eager"
            decoding="sync"
            alt="poster-bg"
          />
        )}
        {selectedId !== "none" && (
          <div style={{ transform: `translateY(${yOffset}px)`, width: '100%', height: '100%', position: 'absolute' }}>
            <Comp d={proxiedPosterData} />
          </div>
        )}
        {selectedId !== "none" && djName && (
          <div 
            className="absolute flex flex-col items-center gap-1 bg-black/80 rounded-2xl border border-white/25 shadow-2xl z-30 text-center"
            style={{ 
              left: `${djPosX}%`, 
              top: `${djPosY}%`, 
              transform: "translate(-50%, -50%)",
              padding: `${djSize >= 56 ? '8px 12px' : '6px 8px'}`
            }}
          >
            {djPhotoUrl ? (
              <div 
                className="rounded-full overflow-hidden border border-white/40 shrink-0 bg-zinc-900 shadow-inner"
                style={{ width: `${djSize}px`, height: `${djSize}px` }}
              >
                <img 
                  src={proxiedDjPhotoUrl} 
                  className="w-full h-full object-cover shrink-0 aspect-square" 
                  alt="" 
                  crossOrigin="anonymous" 
                />
              </div>
            ) : (
              <div 
                className="rounded-full bg-zinc-800 flex items-center justify-center border border-white/20 shrink-0"
                style={{ width: `${djSize}px`, height: `${djSize}px` }}
              >
                <span className="material-symbols-rounded text-white" style={{ fontSize: `${djSize * 0.45}px` }}>headphones</span>
              </div>
            )}
            <div className="flex flex-col items-center justify-center leading-none mt-1">
              <span className={`${badgeFontScale.sub} tracking-[0.2em] text-zinc-400 font-black uppercase mb-0.5`}>DJ</span>
              <span className={`${badgeFontScale.main} font-black text-white tracking-tight`}>{djName}</span>
            </div>
          </div>
        )}
      </div>

      {/* CONTROL BOARD PANEL */}
      <div className="shrink-0 bg-zinc-950 border-t border-white/10 pb-safe">
        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5 bg-zinc-900/60">
          {[
            { id: 'template', label: 'Layout', icon: 'dashboard' },
            { id: 'style', label: 'Style', icon: 'tune' },
            { id: 'dj', label: 'DJ / Info', icon: 'headphones' },
            { id: 'pics', label: 'Pics', icon: 'photo_library' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveControlTab(tab.id as any)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeControlTab === tab.id
                  ? 'text-blue-500 border-blue-500 bg-blue-500/5'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              <span className="material-symbols-outlined text-lg mb-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Panel */}
        <div className="p-4 min-h-[160px] max-h-[220px] overflow-y-auto bg-zinc-950">
          
          {/* TAB 1: Layout Template Selector */}
          {activeControlTab === 'template' && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
              {POSTER_LAYOUTS.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => setSelectedId(layout.id)}
                  className={`flex flex-col items-center gap-1.5 transition-all shrink-0 ${
                    selectedId === layout.id ? "scale-105 opacity-100" : "opacity-45 hover:opacity-60"
                  }`}
                >
                  <div
                    className={`w-[52px] h-[65px] rounded-xl overflow-hidden border-2 transition-all relative bg-zinc-900 ${
                      selectedId === layout.id ? "border-blue-500 shadow-lg shadow-blue-500/20" : "border-zinc-800"
                    }`}
                  >
                    {imageUrl && (
                      <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center p-1 bg-zinc-950/20">
                      <span className="text-[8px] font-bold text-white/80 scale-90 truncate max-w-full uppercase">{layout.name}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* TAB 2: Style Controllers (Blur & Y-Offset) */}
          {activeControlTab === 'style' && (
            <div className="space-y-4 px-2">
              {/* Y-Offset Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Overlay Position (Y-Offset)</label>
                  <span className="text-[10px] font-bold text-blue-500">{yOffset}px</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-zinc-600 text-sm">vertical_align_top</span>
                  <input
                    type="range"
                    min="-80"
                    max="80"
                    value={yOffset}
                    onChange={(e) => setYOffset(parseInt(e.target.value))}
                    className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="material-symbols-outlined text-zinc-600 text-sm">vertical_align_bottom</span>
                </div>
              </div>

              {/* Blur Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Background Blur Strength</label>
                  <span className="text-[10px] font-bold text-blue-500">{blur}px</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-zinc-600 text-sm">photo</span>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="0.5"
                    value={blur}
                    onChange={(e) => setBlur(parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="material-symbols-outlined text-zinc-600 text-sm">blur_on</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DJ Details & 2D Free Position Slider */}
          {activeControlTab === 'dj' && (
            <div className="space-y-4 px-1">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">DJ Nickname</label>
                <div className="relative">
                  <input
                    type="text"
                    value={djName}
                    onChange={(e) => setDjName(e.target.value)}
                    placeholder="Enter DJ Nickname to Auto-Link photo..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-3 pr-10 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-rounded text-zinc-500 text-lg">
                    {djPhotoUrl ? "check_circle" : "sync"}
                  </span>
                </div>
                <p className="text-[8px] text-zinc-500 font-bold">
                  {djPhotoUrl 
                    ? "✓ DJ 프로필 사진을 성공적으로 자동 조회 및 연동하였습니다." 
                    : "※ 이름 입력 시 가입된 DJ 유저의 프로필 사진을 자동으로 찾아 매핑합니다."
                  }
                </p>
              </div>

              {/* 3D Sliders: Size, X-Pos, Y-Pos */}
              <div className="border-t border-white/5 pt-3 space-y-3">
                {/* Avatar Diameter Size Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-black text-zinc-400 uppercase tracking-wider">
                    <span>DJ 사진 크기 (지름)</span>
                    <span className="text-blue-500 font-bold">{djSize}px (~ {Math.round(djSize / 3.78) / 10}cm)</span>
                  </div>
                  <input
                    type="range"
                    min="32"
                    max="96"
                    value={djSize}
                    onChange={(e) => setDjSize(parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* X & Y position coordinates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-black text-zinc-400 uppercase tracking-wider">
                      <span>가로 위치 (X-Pos)</span>
                      <span className="text-blue-500">{djPosX}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={djPosX}
                      onChange={(e) => setDjPosX(parseInt(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-black text-zinc-400 uppercase tracking-wider">
                      <span>세로 위치 (Y-Pos)</span>
                      <span className="text-blue-500">{djPosY}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={djPosY}
                      onChange={(e) => setDjPosY(parseInt(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Pics Gallery Background Binder */}
          {activeControlTab === 'pics' && (
            <div className="space-y-2">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Pics 갤러리 고화질 스냅 연동</p>
              {loadingPics ? (
                <div className="flex justify-center items-center py-6">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : picsImages.length === 0 ? (
                <p className="text-center text-[11px] text-zinc-600 py-6">No gallery photos found in Pics.</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {picsImages.slice(0, visiblePicsCount).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setImageUrl(img)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-transform active:scale-95 shrink-0 ${
                          imageUrl === img ? "border-blue-500" : "border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        <img src={img} className="w-full h-full object-cover" alt="" />
                        {imageUrl === img && (
                          <div className="absolute inset-0 bg-blue-500/15 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-base">check_circle</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Infinite Scroll Sensor */}
                  {picsImages.length > visiblePicsCount && (
                    <div ref={loadMoreRef} className="flex justify-center py-4">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* Mini schematic for template picker thumbnails */
function MiniSchema({ layoutId }: { layoutId: string }) {
  const b = "bg-white/60 rounded-[1px]"; // block style
  switch (layoutId) {
    case "none":
      return null;
    case "classic":
      return (
        <div className="absolute inset-0 p-1.5">
          <div className={`${b} w-[60%] h-[6px] mb-[2px]`} />
          <div className={`${b} w-[40%] h-[4px] absolute top-1.5 right-1.5`} />
          <div className={`${b} w-[50%] h-[5px] absolute bottom-[28px] left-1.5`} />
          <div className="absolute bottom-0 left-0 right-0 h-[22px] bg-white/20 rounded-b" />
        </div>
      );
    case "center":
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[3px] p-2">
          <div className={`${b} w-[70%] h-[6px]`} />
          <div className={`${b} w-[50%] h-[3px]`} />
          <div className={`${b} w-[40%] h-[3px] mt-1`} />
        </div>
      );
    case "bottom":
      return (
        <div className="absolute bottom-0 left-0 right-0 p-1.5 space-y-[2px]">
          <div className={`${b} w-[70%] h-[6px]`} />
          <div className={`${b} w-[50%] h-[3px]`} />
          <div className={`${b} w-[60%] h-[3px]`} />
          <div className={`${b} w-[90%] h-[3px] mt-1`} />
        </div>
      );
    case "minimal":
      return (
        <div className="absolute inset-0 p-1.5">
          <div className={`${b} w-[50%] h-[3px]`} />
          <div className={`${b} w-[65%] h-[5px] absolute bottom-2 left-1.5`} />
        </div>
      );
    case "leftpanel":
      return <div className="absolute top-0 left-0 bottom-0 w-[42%] bg-white/20 rounded-l" />;
    case "rightpanel":
      return <div className="absolute top-0 right-0 bottom-0 w-[42%] bg-white/20 rounded-r" />;
    case "ticket":
      return (
        <div className="absolute inset-0 p-1.5">
          <div className={`${b} w-[70%] h-[5px] mx-auto mt-2`} />
          <div className="absolute bottom-0 left-0 right-0 h-[24px] bg-white/20 rounded-b border-t border-dashed border-white/40" />
        </div>
      );
    case "magazine":
      return (
        <div className="absolute inset-0 p-1.5">
          <div className={`${b} w-[30%] h-[3px]`} />
          <div className={`${b} w-[80%] h-[8px] mt-4`} />
          <div className={`${b} w-[50%] h-[3px] absolute bottom-2 left-1.5`} />
          <div className={`${b} w-[40%] h-[3px] absolute bottom-2 right-1.5`} />
        </div>
      );
    case "elegant":
      return <div className="absolute inset-[4px] border border-white/40 flex flex-col items-center justify-center gap-[3px]"><div className={`${b} w-[60%] h-[5px]`} /><div className={`${b} w-[40%] h-[3px]`} /></div>;
    case "boldtype":
      return (
        <div className="absolute inset-0 flex items-center p-1.5">
          <div className={`${b} w-[90%] h-[14px]`} />
        </div>
      );
    case "corners":
      return (
        <div className="absolute inset-0 p-1.5">
          <div className={`${b} w-[50%] h-[5px]`} />
          <div className={`${b} w-[25%] h-[4px] absolute top-1.5 right-1.5`} />
          <div className={`${b} w-[35%] h-[4px] absolute bottom-1.5 left-1.5`} />
          <div className={`${b} w-[30%] h-[3px] absolute bottom-1.5 right-1.5`} />
        </div>
      );
    case "cinematic":
      return (<><div className="absolute top-0 left-0 right-0 h-[18%] bg-white/20 rounded-t" /><div className="absolute bottom-0 left-0 right-0 h-[14%] bg-white/20 rounded-b" /></>);
    case "diagonal":
      return <div className="absolute top-[30%] -left-1 -right-1 h-[16px] bg-white/25" style={{ transform: "rotate(-5deg)" }} />;
    case "neon":
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[3px]">
          <div className="w-[60%] h-[6px] rounded-[1px] bg-pink-400/60" />
          <div className="w-[40%] h-[3px] rounded-[1px] bg-blue-400/50" />
        </div>
      );
    case "gradientwash":
      return (
        <div className="absolute inset-0 p-1.5 bg-gradient-to-br from-white/15 via-transparent to-white/10">
          <div className={`${b} w-[70%] h-[6px] mt-1`} />
          <div className={`${b} w-[45%] h-[3px] mt-6`} />
        </div>
      );
    case "vertical":
      return <div className="absolute top-2 bottom-2 left-1.5 w-[6px] bg-white/40 rounded-[1px]" />;
    case "compact":
      return <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[40%] bg-white/20 rounded-md" />;
    case "split":
      return <div className="absolute top-0 left-0 right-0 h-[35%] bg-white/20 rounded-t" />;
    case "frame":
      return <div className="absolute inset-[3px] border-2 border-white/40" />;
    default:
      return null;
  }
}
