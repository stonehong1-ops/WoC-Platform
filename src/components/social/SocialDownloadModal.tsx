"use client";

import React, { useRef, useState } from "react";
import { Social } from "@/types/social";
import { getDjDisplay } from "@/lib/utils/socialUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { DualText } from "./SocialHeroCard";
import html2canvas from "html2canvas-pro";

interface SocialDownloadModalProps {
  social: Social;
  onClose: () => void;
}

export default function SocialDownloadModal({ social, onClose }: SocialDownloadModalProps) {
  const { t, language } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const djName = getDjDisplay(social, undefined, language);
  
  // Format DJ Name with dual name if possible
  // Note: SocialDj only has djName, but the main social has djName and djNameNative as fallback
  let djMain = djName;
  let djSub = (djName === social.djName) ? social.djNameNative : undefined;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 3, // High quality
        backgroundColor: "#000000",
      });
      const link = document.createElement("a");
      link.download = `WoC_${social.title.replace(/\s+/g, "_")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Failed to generate image:", err);
      alert("Failed to download image. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm flex flex-col gap-4">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <span className="material-symbols-rounded">close</span>
        </button>

        {/* The Card to Capture */}
        <div 
          ref={cardRef}
          className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden bg-black shadow-2xl"
        >
          {/* Background Image */}
          {social.imageUrl ? (
            <div className="absolute inset-0">
              <img 
                src={social.imageUrl} 
                alt="" 
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-black" />
          )}

          {/* Content */}
          <div className="relative h-full flex flex-col justify-end p-8 text-white">
            <div className="space-y-4">
              {/* Social Name */}
              <div className="space-y-1">
                <DualText 
                  text={social.title}
                  subText={social.titleNative}
                  primaryClassName="text-3xl font-black leading-tight tracking-tight drop-shadow-lg"
                  secondaryClassName="text-sm font-medium text-white/60 ml-2"
                  containerClassName="items-baseline flex-wrap"
                />
              </div>

              {/* Info Grid */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                {/* Venue */}
                <div className="flex items-start gap-3">
                  <span className="material-symbols-rounded text-primary text-xl mt-0.5">location_on</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-0.5">Location</p>
                    <DualText 
                      text={social.venueName}
                      subText={social.venueNameNative}
                      primaryClassName="text-sm font-bold truncate"
                      secondaryClassName="text-[11px] text-white/50 ml-1.5"
                    />
                  </div>
                </div>

                {/* Organizer */}
                <div className="flex items-start gap-3">
                  <span className="material-symbols-rounded text-primary text-xl mt-0.5">account_circle</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-0.5">Organizer</p>
                    <DualText 
                      text={social.organizerName}
                      subText={social.organizerNameNative}
                      primaryClassName="text-sm font-bold truncate"
                      secondaryClassName="text-[11px] text-white/50 ml-1.5"
                    />
                  </div>
                </div>

                {/* DJ */}
                {djName && djName !== 'TBD' && djName !== 'TBA' && (
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-rounded text-primary text-xl mt-0.5">album</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-0.5">DJ</p>
                      <DualText 
                        text={djMain}
                        subText={djSub}
                        primaryClassName="text-sm font-bold truncate"
                        secondaryClassName="text-[11px] text-white/50 ml-1.5"
                      />
                    </div>
                  </div>
                )}

                {/* Date & Time */}
                <div className="flex items-start gap-3">
                  <span className="material-symbols-rounded text-primary text-xl mt-0.5">calendar_today</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-0.5">Date & Time</p>
                    <div className="flex flex-col">
                      <p className="text-sm font-bold">
                        {social.type === 'regular' 
                          ? `${[t('common.sun'), t('common.mon'), t('common.tue'), t('common.wed'), t('common.thu'), t('common.fri'), t('common.sat')][social.dayOfWeek || 0]} ${t('social.every_week')}`
                          : social.date?.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-white/70 font-medium">{social.startTime} - {social.endTime}</p>
                    </div>
                  </div>
                </div>

                {/* Price */}
                {social.price && (
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-rounded text-primary text-xl mt-0.5">payments</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-0.5">Entrance Fee</p>
                      <p className="text-sm font-bold">{social.price}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Logo / Footer */}
            <div className="mt-8 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[14px] font-black tracking-tighter text-white">WORLD OF COMMUNITY</span>
                <span className="text-[8px] font-medium tracking-[0.3em] text-primary uppercase">www.woc.today</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                <span className="material-symbols-rounded text-primary text-xl">auto_awesome</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isDownloading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generating Image...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-rounded">download</span>
              <span>Download Social Card</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
