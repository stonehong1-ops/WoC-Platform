'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Clock, Disc, Users } from 'lucide-react';
import { SocialEvent } from '@/lib/constants/socialData';
import { cn } from '@/lib/utils';

interface SocialCardProps {
  event: SocialEvent;
  variant?: 'horizontal' | 'vertical' | 'large' | 'line';
}

export default function SocialCard({ event, variant = 'horizontal' }: SocialCardProps) {
  const isLarge = variant === 'large';
  const isLine = variant === 'line';
  
  if (isLine) {
    return (
      <Link 
        href={`/social/${event.id || 'default'}`}
        className="flex items-center justify-between gap-4 py-2.5 px-1 border-b border-glass-border hover:bg-glass transition-colors group"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-xs font-bold text-primary truncate shrink-0 w-24">
            {event.place}
          </span>
          <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
            {event.title}
          </h4>
        </div>
        <div className="text-[10px] text-muted-foreground whitespace-nowrap">
          {event.organizers[0]}
        </div>
      </Link>
    );
  }
  
  return (
    <Link 
      href={event.href}
      className={cn(
        "group block bg-glass border border-glass-border rounded-2xl overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-xl",
        variant === 'horizontal' ? "min-w-[280px] w-[280px]" : "w-full"
      )}
    >
      <div className={cn("relative", isLarge ? "aspect-[16/9]" : "aspect-[4/3]")}>
        <Image 
          src={event.imageUrl || 'https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=2070&auto=format&fit=crop'} 
          alt={event.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {event.isSpecial && (
          <div className="absolute top-3 left-3 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
            Special
          </div>
        )}
      </div>
      
      <div className="p-4 space-y-3">
        <h3 className="font-bold text-base line-clamp-1 group-hover:text-primary transition-colors">
          {event.title}
        </h3>
        
        <div className="space-y-1.5 overflow-hidden">
          {/* Priority 1: Place */}
          <div className="flex items-center gap-2 text-primary">
            <MapPin size={14} className="shrink-0" />
            <span className="text-xs font-bold truncate">{event.place}</span>
          </div>
          
          {/* Priority 2: Time */}
          <div className="flex items-center gap-2 text-foreground/80">
            <Clock size={14} className="shrink-0" />
            <span className="text-xs font-medium">{event.time}</span>
          </div>
          
          {/* Priority 3: DJ */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Disc size={14} className="shrink-0" />
            <span className="text-xs truncate">DJ: {event.djs.join(', ')}</span>
          </div>
          
          {/* Priority 4: Organizer */}
          <div className="flex items-center gap-2 text-muted-foreground/70">
            <Users size={14} className="shrink-0" />
            <span className="text-xs truncate">{event.organizers.join(' & ')}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
