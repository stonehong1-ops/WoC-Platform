"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Pic } from '@/types/pic';

interface SafeZoneEditorProps {
  pic: Partial<Pic>;
  onUpdate: (safeZone: Pic['typographySafeZone']) => void;
}

export default function SafeZoneEditor({ pic, onUpdate }: SafeZoneEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | 'resize-t' | 'resize-b' | 'resize-l' | 'resize-r' | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  const [safeZone, setSafeZone] = useState<Pic['typographySafeZone']>(
    pic.typographySafeZone || { top: 10, left: 10, width: 80, height: 80 }
  );

  useEffect(() => {
    if (pic.typographySafeZone) {
      setSafeZone(pic.typographySafeZone);
    }
  }, [pic.typographySafeZone]);

  const handlePointerDown = (e: React.PointerEvent, type: typeof dragType) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragType(type);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current || !dragType) return;

    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate deltas in percentage
    const dx = ((e.clientX - startPos.x) / rect.width) * 100;
    const dy = ((e.clientY - startPos.y) / rect.height) * 100;

    let newZone = { ...safeZone };

    if (dragType === 'move') {
      newZone.left = Math.max(0, Math.min(100 - newZone.width, newZone.left + dx));
      newZone.top = Math.max(0, Math.min(100 - newZone.height, newZone.top + dy));
    } else {
      // Handle resizing
      if (dragType.includes('l')) {
        const newLeft = Math.max(0, Math.min(newZone.left + newZone.width - 5, newZone.left + dx));
        newZone.width += newZone.left - newLeft;
        newZone.left = newLeft;
      }
      if (dragType.includes('r')) {
        newZone.width = Math.max(5, Math.min(100 - newZone.left, newZone.width + dx));
      }
      if (dragType.includes('t')) {
        const newTop = Math.max(0, Math.min(newZone.top + newZone.height - 5, newZone.top + dy));
        newZone.height += newZone.top - newTop;
        newZone.top = newTop;
      }
      if (dragType.includes('b')) {
        newZone.height = Math.max(5, Math.min(100 - newZone.top, newZone.height + dy));
      }
    }

    setSafeZone(newZone);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setIsDragging(false);
      setDragType(null);
      onUpdate(safeZone);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-on-surface">Typography Safe Zone</h3>
        <div className="text-[10px] text-outline font-mono bg-surface-container-low px-2 py-1 rounded">
          x: {Math.round(safeZone.left)}% | y: {Math.round(safeZone.top)}% | w: {Math.round(safeZone.width)}% | h: {Math.round(safeZone.height)}%
        </div>
      </div>
      
      <div 
        className="relative w-full aspect-[3/4] bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/30 select-none shadow-inner"
        ref={containerRef}
      >
        {pic.imageUrl ? (
          <img 
            src={pic.imageUrl} 
            alt="Pic" 
            className="w-full h-full object-cover select-none pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-outline text-sm">
            No image available
          </div>
        )}

        {/* Overlay Darken */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

        {/* Safe Zone Bounding Box */}
        <div 
          className="absolute border-2 border-primary bg-primary/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] box-border"
          style={{
            top: `${safeZone.top}%`,
            left: `${safeZone.left}%`,
            width: `${safeZone.width}%`,
            height: `${safeZone.height}%`,
          }}
          onPointerDown={(e) => handlePointerDown(e, 'move')}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Inner guidelines */}
          <div className="absolute inset-0 pointer-events-none border border-white/30 border-dashed m-4"></div>
          
          {/* Resizers */}
          {/* Top Left */}
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-primary rounded-full cursor-nwse-resize" onPointerDown={(e) => handlePointerDown(e, 'resize-tl')} />
          {/* Top Right */}
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-primary rounded-full cursor-nesw-resize" onPointerDown={(e) => handlePointerDown(e, 'resize-tr')} />
          {/* Bottom Left */}
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-primary rounded-full cursor-nesw-resize" onPointerDown={(e) => handlePointerDown(e, 'resize-bl')} />
          {/* Bottom Right */}
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-primary rounded-full cursor-nwse-resize" onPointerDown={(e) => handlePointerDown(e, 'resize-br')} />
          
          {/* Edges */}
          <div className="absolute top-0 left-0 right-0 h-2 -translate-y-1/2 cursor-ns-resize" onPointerDown={(e) => handlePointerDown(e, 'resize-t')} />
          <div className="absolute bottom-0 left-0 right-0 h-2 translate-y-1/2 cursor-ns-resize" onPointerDown={(e) => handlePointerDown(e, 'resize-b')} />
          <div className="absolute left-0 top-0 bottom-0 w-2 -translate-x-1/2 cursor-ew-resize" onPointerDown={(e) => handlePointerDown(e, 'resize-l')} />
          <div className="absolute right-0 top-0 bottom-0 w-2 translate-x-1/2 cursor-ew-resize" onPointerDown={(e) => handlePointerDown(e, 'resize-r')} />
        </div>
      </div>
      <p className="text-xs text-outline-variant italic">
        * Drag the box or edges to define the area where text (titles, event details) can be safely placed without clashing with the subject.
      </p>
    </div>
  );
}
