"use client";

import React, { useState, useMemo, useRef } from "react";
import { Social } from "@/types/social";
import { extractPosterData } from "./poster/posterTypes";
import { POSTER_LAYOUTS } from "./poster/PosterLayouts";
import { socialService } from "@/lib/firebase/socialService";
import { storageService } from "@/lib/firebase/storageService";
import html2canvas from "html2canvas-pro";

interface Props {
  social: Social;
  onClose: () => void;
}

export default function SocialPosterEditor({ social, onClose }: Props) {
  const savedLayout = social.posterLayoutId || "classic";
  const [selectedId, setSelectedId] = useState(savedLayout);
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState(savedLayout); // tracks what's saved in DB
  const previewRef = useRef<HTMLDivElement>(null);
  const posterData = useMemo(() => extractPosterData(social), [social]);
  const selected = POSTER_LAYOUTS.find((l) => l.id === selectedId) || POSTER_LAYOUTS[0];
  const isDirty = selectedId !== savedId; // unsaved changes

  const proxiedImageUrl = useMemo(() => {
    if (!social.imageUrl) return "";
    return `/api/proxy/image?url=${encodeURIComponent(social.imageUrl)}`;
  }, [social.imageUrl]);

  const proxiedPosterData = useMemo(() => ({
    ...posterData,
    imageUrl: proxiedImageUrl
  }), [posterData, proxiedImageUrl]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let posterExportUrl = social.posterExportUrl || "";
      const container = document.getElementById(`poster-editor-export-container-${social.id}`);
      const previewContainer = previewRef.current;
      
      if (container && previewContainer && selectedId !== "none") {
        // Match dimensions exactly to the preview to ensure 100% identical relative rendering
        const pw = previewContainer.offsetWidth;
        const ph = previewContainer.offsetHeight;
        container.style.width = `${pw}px`;
        container.style.height = `${ph}px`;

        // Wait for ALL images inside the container
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
        
        // Wait for fonts to load
        await document.fonts.ready;

        // Force browser to paint
        await new Promise(r => requestAnimationFrame(r));
        await new Promise(r => requestAnimationFrame(r));
        await new Promise(res => setTimeout(res, 300)); // Increased wait time for filter processing

        // Dynamically compute scale to reach a 1080px wide image
        const scaleFactor = 1080 / pw;

        const canvas = await html2canvas(container, {
          scale: scaleFactor,
          backgroundColor: "#000000",
          useCORS: true,
          allowTaint: false, // Strict mode for security
          windowWidth: pw,
          windowHeight: ph,
          logging: false,
          removeContainer: false,
          imageTimeout: 15000, // Long timeout for proxy fetches
        });

        const blob = await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), "image/png"));
        if (blob) {
          const file = new File([blob], `poster_${social.id}_${Date.now()}.png`, { type: "image/png" });
          posterExportUrl = await storageService.uploadFile(file, `socials/posters/${file.name}`);
        }
      }

      await socialService.updateSocial(social.id, { 
        posterLayoutId: selectedId,
        ...(posterExportUrl ? { posterExportUrl } : {})
      });
      setSavedId(selectedId);
      onClose(); // Auto close after save is completed successfully
    } catch (err) {
      console.error(err);
      alert("Failed to save poster layout");
    } finally {
      setIsSaving(false);
    }
  };

  const Comp = selected.Component;

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <span className="material-symbols-rounded text-white text-xl">close</span>
        </button>
        <span className="text-white font-bold text-sm tracking-wide">POSTER EDITOR</span>
        <button
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className={`h-10 px-4 rounded-full flex items-center justify-center gap-1.5 text-sm font-bold transition-all ${
            isDirty
              ? "bg-white text-black hover:bg-white/90"
              : "bg-white/10 text-white/40"
          } disabled:opacity-40`}
        >
          <span className="material-symbols-rounded text-lg">{isSaving ? "hourglass_top" : isDirty ? "save" : "check_circle"}</span>
          {isSaving ? "Saving..." : isDirty ? "Save" : "Saved"}
        </button>
      </div>

      {/* Poster Preview */}
      <div className="flex-1 flex items-center justify-center overflow-hidden px-6 py-2">
        <div
          ref={previewRef}
          className="relative w-full max-w-[360px] bg-black overflow-hidden"
          style={{ aspectRatio: "4/5" }}
        >
          {/* Background Image */}
          {social.imageUrl ? (
            <img
              src={proxiedImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />
          )}
          {/* Layout Overlay */}
          <Comp d={proxiedPosterData} />
        </div>
      </div>

      {/* Hidden high-res container for capture */}
      <div 
        id={`poster-editor-export-container-${social.id}`}
        className="fixed top-0 left-0 pointer-events-none opacity-100"
        style={{ width: '360px', height: '450px', overflow: 'hidden', backgroundColor: '#000', transform: 'translateX(-200vw)', zIndex: 999999 }}
      >
        {social.imageUrl && (
          <img 
            src={proxiedImageUrl} 
            className="absolute inset-0 w-full h-full object-cover" 
            crossOrigin="anonymous"
            loading="eager"
            decoding="sync"
            alt="poster-bg"
          />
        )}
        {selectedId !== "none" && (
          <Comp d={proxiedPosterData} />
        )}
      </div>

      {/* Template Picker */}
      <div className="shrink-0 bg-black/90 border-t border-white/10">
        <div className="px-4 py-3 overflow-x-auto">
          <div className="flex gap-3" style={{ minWidth: "max-content" }}>
            {POSTER_LAYOUTS.map((layout) => (
              <button
                key={layout.id}
                onClick={() => setSelectedId(layout.id)}
                className={`flex flex-col items-center gap-1.5 transition-all ${
                  selectedId === layout.id ? "opacity-100" : "opacity-50"
                }`}
              >
                {/* Mini preview */}
                <div
                  className={`w-[56px] h-[70px] rounded-lg overflow-hidden border-2 transition-all relative bg-gray-900 ${
                    selectedId === layout.id ? "border-primary shadow-lg shadow-primary/30" : "border-white/20"
                  }`}
                >
                  {social.imageUrl && (
                    <img src={social.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                  )}
                  {/* Schematic blocks */}
                  <MiniSchema layoutId={layout.id} />
                </div>
                <span className="text-[10px] text-white/70 font-medium">{layout.name}</span>
              </button>
            ))}
          </div>
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
