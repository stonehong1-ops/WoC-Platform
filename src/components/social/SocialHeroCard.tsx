import React, { useState } from 'react';
import { Social } from '@/types/social';

export function DualText({ text, subText, primaryClassName, secondaryClassName, containerClassName }: { text: string; subText?: string; primaryClassName?: string; secondaryClassName?: string; containerClassName?: string }) {
  if (!text) return null;
  
  let main = text;
  let sub = subText;

  if (!sub) {
    const hasKorean = /[가-힣]/.test(text);
    const hasEnglish = /[a-zA-Z]/.test(text);
    
    if (hasKorean && hasEnglish) {
      main = text.replace(/[가-힣()]+/g, '').replace(/\s+/g, ' ').trim();
      const subMatch = text.match(/[가-힣]+/g);
      sub = subMatch ? subMatch.join(' ') : '';
    }
  }
  
  if (main && sub && main.trim().toLowerCase() === sub.trim().toLowerCase()) {
    sub = undefined;
  }
  
  if (sub) {
    return (
      <div className={`flex items-baseline gap-1.5 min-w-0 ${containerClassName || ''}`}>
        <span className={primaryClassName}>{main || text}</span>
        <span className={secondaryClassName}>{sub}</span>
      </div>
    );
  }
  
  return <span className={primaryClassName}>{main || text}</span>;
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

  return (
    <img 
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
      src={imageUrl} 
      alt={title || 'Event poster'} 
      onError={() => setImageError(true)}
    />
  );
}

export function getSocialDisplayTitle(social: Social) {
  let primary = social.titleEn || social.title;
  let secondary = social.titleNative;

  if (social.titleEn && !social.titleNative) {
    if (social.title && social.title !== social.titleEn) {
       secondary = social.title;
    }
  }

  return { primary, secondary };
}

export default function SocialHeroCard({ social }: { social: Social }) {
  const displayTitle = getSocialDisplayTitle(social);
  return (
    <>
      <SocialCardImage imageUrl={social.imageUrl} title={social.title} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6 pointer-events-none">
        <div className="space-y-1 w-full text-left">
          <DualText 
            text={displayTitle.primary} 
            subText={displayTitle.secondary}
            primaryClassName="text-white text-xl md:text-3xl font-bold font-headline leading-tight truncate drop-shadow-md" 
            secondaryClassName="text-white/70 text-xs md:text-sm font-medium truncate shrink-0 drop-shadow-md" 
            containerClassName="w-full"
          />
          <DualText 
            text={social.organizerName} 
            subText={social.organizerNameNative}
            primaryClassName="text-white/80 text-sm md:text-base font-medium block truncate" 
            secondaryClassName="text-white/50 text-[10px] md:text-xs block truncate mt-0.5" 
          />
          <DualText 
            text={social.venueName} 
            subText={social.venueNameNative}
            primaryClassName="text-white/70 text-xs md:text-sm block truncate mt-1" 
            secondaryClassName="text-white/40 text-[9px] md:text-[10px] block truncate" 
          />
          <p className="text-white/70 text-xs md:text-sm mt-1">{social.startTime} - {social.endTime}</p>
        </div>
      </div>
    </>
  );
}
