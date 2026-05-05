'use client';

import React from 'react';
import { REGIONS } from '@/lib/constants/socialData';

export default function SocialRegisterForm() {
  return (
    <div className="space-y-6">
      {/* Event Title */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Event Title</label>
        <input 
          type="text" 
          placeholder="e.g. Milonga El Bulín"
          className="w-full bg-glass border border-glass-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Region & Place Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Region</label>
          <select className="w-full bg-glass border border-glass-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Venue</label>
          <input 
            type="text" 
            placeholder="e.g. Turn Hapjeong"
            className="w-full bg-glass border border-glass-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Date & Time */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Date & Time</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input 
              type="date" 
              className="w-full bg-glass border border-glass-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            />
          </div>
          <div className="relative w-32">
            <input 
              type="time" 
              className="w-full bg-glass border border-glass-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer px-4"
            />
          </div>
        </div>
      </div>

      {/* DJ & Organizer */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">DJ</label>
          <input 
            type="text" 
            placeholder="Details"
            className="w-full bg-glass border border-glass-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Organizer</label>
          <input 
            type="text" 
            placeholder="Name"
            className="w-full bg-glass border border-glass-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Additional Info / Description */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Description</label>
        <textarea 
          placeholder="Enter a detailed description of the event..."
          className="w-full bg-glass border border-glass-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 h-32 resize-none"
        />
      </div>

      {/* Helper Text */}
      <p className="text-[10px] text-muted-foreground text-center px-4">
        Your submission will be reviewed by an admin before it appears on the Social page.
      </p>
    </div>
  );
}
