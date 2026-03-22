'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UniversalComposeProps {
  id: string; // Unique ID for the event trigger (e.g., 'social')
  title: string;
  submitLabel?: string;
  onSubmit: () => void;
  children: React.ReactNode;
}

export default function UniversalCompose({ 
  id, 
  title, 
  submitLabel = '등록', 
  onSubmit, 
  children 
}: UniversalComposeProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = (e: any) => {
      // Open only if the ID matches or no ID is provided in the event
      if (!e.detail || e.detail.id === id) {
        setIsOpen(true);
      }
    };
    
    window.addEventListener('woc:compose:open', handleOpen);
    return () => window.removeEventListener('woc:compose:open', handleOpen);
  }, [id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in overflow-hidden">
      <div 
        className="absolute inset-0" 
        onClick={() => setIsOpen(false)} 
      />
      
      <div className="relative bg-background w-full max-w-lg h-[92vh] sm:h-auto sm:max-h-[85vh] sm:rounded-3xl border-t sm:border border-glass-border shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-glass-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={24} />
          </button>
          <h2 className="font-bold text-lg">{title}</h2>
          <button 
            onClick={() => {
              onSubmit();
              setIsOpen(false);
            }}
            className="px-4 py-1.5 bg-primary text-white text-sm font-bold rounded-full hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            {submitLabel}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar pb-24">
          {children}
        </div>
      </div>
    </div>
  );
}
