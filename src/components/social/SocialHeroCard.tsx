"use client";
 
import React, { useState } from 'react';
import { Social } from '@/types/social';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCommunityName } from '@/app/social/constants/seoulRegions';
import { isVideoUrl } from '@/lib/utils/socialUtils';
import { getSafeStorageUrl } from '@/lib/utils/storageUtils';

export function DualText({ text, subText, primaryClassName, secondaryClassName, containerClassName }: { text: string; subText?: string; primaryClassName?: string; secondaryClassName?: string; containerClassName?: string }) {
  const { language } = useLanguage();
  if (!text) return null;
  
  const resolved = formatCommunityName(subText || text, language);

  return (
    <div className={`flex items-baseline min-w-0 ${containerClassName || ''}`}>
      <span className={primaryClassName}>{resolved}</span>
    </div>
  );
}

export function SocialCardImage({ imageUrl, title }: { imageUrl?: string; title?: string }) {
  const [imageError, setImageError] = useState(false);
  const firstLetter = (title || '').trim().charAt(0).toUpperCase() || '?';

  if (!imageUrl || imageUrl.trim() === '' || imageError) {
    return (
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#EEF2F3] via-white to-[#DDE4E5] flex items-center justify-center overflow-hidden">
        {/* Large Decorative Letter - Editorial Style */}
        <span className="absolute -bottom-8 -right-8 text-[20rem] font-black text-primary/[0.03] select-none pointer-events-none italic leading-none">
          {firstLetter}
        </span>
        
        {/* Centered Graphic Element */}
        <div className="relative z-10 flex flex-col items-center opacity-20 transform -translate-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary/30 flex items-center justify-center mb-4">
             <span className="material-symbols-outlined text-2xl text-primary/50">auto_awesome</span>
          </div>
          <span className="text-[10px] font-black tracking-[0.5em] text-primary/40 uppercase ml-2">Heritage</span>
        </div>
        
        {/* Subtle Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
      </div>
    );
  }

  if (isVideoUrl(imageUrl)) {
    return (
      <video
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 md:group-hover:scale-110"
        src={imageUrl}
        muted
        autoPlay
        loop
        playsInline
      />
    );
  }

  return (
    <img 
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 md:group-hover:scale-110" 
      src={getSafeStorageUrl(imageUrl)} 
      alt={title || 'Event poster'} 
      onError={() => setImageError(true)}
    />
  );
}

import { getDjDisplay } from '@/lib/utils/socialUtils';
import PosterOverlay from './poster/PosterOverlay';

export function getSocialDisplayTitle(social: Social) {
  return {
    primary:   social.title,
    secondary: social.titleNative,
  };
}

export default function SocialHeroCard({ social, date }: { social: Social, date?: Date }) {
  const { language } = useLanguage();
  const displayTitle = getSocialDisplayTitle(social);
  const djName = getDjDisplay(social, date, language);
  const hasPoster = social.posterLayoutId && social.posterLayoutId !== "none";

  return (
    <>
      <SocialCardImage imageUrl={hasPoster ? social.imageUrl : (social.posterExportUrl || social.imageUrl)} title={social.title} />
      
      {hasPoster ? (
        /* Live poster layout overlay — DJ changes auto-reflected */
        <PosterOverlay social={social} />
      ) : (
        /* Default overlay */
        <>
          {/* Top Left Venue Badge */}
          <div className="absolute top-4 left-4 z-20 flex items-center bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full pointer-events-none border border-white/10 shadow-sm max-w-[calc(100%-4rem)]">
            <span className="material-symbols-outlined text-[12px] text-white/90 mr-1 shrink-0">location_on</span>
            <DualText 
              text={social.venueName} 
              subText={social.venueNameNative}
              primaryClassName="text-white/90 text-[10px] font-bold tracking-wide uppercase truncate" 
              secondaryClassName="text-white/60 text-[9px] font-medium truncate ml-1" 
              containerClassName="items-center truncate min-w-0"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6 pointer-events-none">
            <div className="space-y-1 w-full text-left">
              <DualText 
                text={displayTitle.primary} 
                subText={displayTitle.secondary}
                primaryClassName="text-white text-base md:text-lg font-bold font-headline leading-tight truncate drop-shadow-md" 
                secondaryClassName="text-white/60 text-[10px] md:text-[11px] font-normal truncate shrink-0 drop-shadow-md ml-1.5" 
                containerClassName="w-full"
              />
              <DualText 
                text={social.organizerName} 
                subText={social.organizerNameNative}
                primaryClassName="text-white/80 text-xs md:text-sm font-medium truncate" 
                secondaryClassName="text-white/40 text-[9px] md:text-[10px] font-normal truncate ml-1.5" 
                containerClassName="w-full"
              />
              {djName && djName.toUpperCase() !== 'TBD' && djName.toUpperCase() !== 'TBA' && djName.trim() !== '' && (
                <p className="text-white/90 text-xs md:text-sm font-bold truncate">
                  DJ {djName}
                </p>
              )}
              <p className="text-white/70 text-[10px] md:text-xs mt-1">{social.startTime} - {social.endTime}</p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
