"use client";

import React, { useState } from "react";
import { Group } from "@/types/group";

interface GroupMenuStructureProps {
  group: Group;
  onClose?: () => void;
  onNext?: () => void;
}

const GroupMenuStructure = ({ group, onClose, onNext }: GroupMenuStructureProps) => {
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = () => {
    setIsApplying(true);
    // Simulate application process
    setTimeout(() => {
      setIsApplying(false);
      if (onNext) onNext();
      else if (onClose) onClose();
    }, 300);
  };

  return (
    <div className="bg-background text-on-surface font-body-md min-h-full flex flex-col w-full relative">
      <main className="flex-grow pt-8 pb-32 px-margin-mobile max-w-md mx-auto w-full">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-headline-md text-on-surface text-xl md:text-2xl font-bold">Organize Menu</h2>
            <p className="text-on-surface-variant text-label-md mt-1">Drag handles to reorder your menu.</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-high text-primary rounded-full text-label-sm font-bold active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Add Divider
          </button>
        </div>

        <div className="space-y-1.5">
          {/* Fixed Dashboard Item */}
          <div className="bg-surface-container-lowest border border-surface-variant/50 py-2.5 px-3 rounded-xl flex items-center gap-3">
            <div className="w-6 flex justify-center">
              <span className="material-symbols-outlined text-outline-variant text-xl">lock</span>
            </div>
            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
            </div>
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                <span className="font-bold text-on-surface text-sm">Dashboard</span>
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Fixed</span>
              </div>
            </div>
          </div>

          {/* Example Divider */}
          <div className="flex items-center gap-3 py-1 group">
            <div className="w-6 flex justify-center cursor-grab active:cursor-grabbing">
              <span className="material-symbols-outlined text-outline-variant/60 text-lg">drag_indicator</span>
            </div>
            <div className="flex-grow h-[1px] bg-surface-variant/50"></div>
            <button className="text-outline-variant hover:text-error transition-colors">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Draggable List Items */}
          <div className="space-y-1.5">
            {/* Item: Calendar */}
            <div className="bg-surface-container-lowest border border-surface-variant/50 py-2.5 px-3 rounded-xl flex items-center gap-3 shadow-sm">
              <div className="w-6 flex justify-center cursor-grab active:cursor-grabbing">
                <span className="material-symbols-outlined text-outline-variant">drag_indicator</span>
              </div>
              <div className="w-9 h-9 bg-surface-container rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">calendar_today</span>
              </div>
              <div className="flex-grow font-bold text-on-surface text-sm">Calendar</div>
            </div>

            {/* Item: Feed */}
            <div className="bg-surface-container-lowest border border-surface-variant/50 py-2.5 px-3 rounded-xl flex items-center gap-3 shadow-sm">
              <div className="w-6 flex justify-center cursor-grab active:cursor-grabbing">
                <span className="material-symbols-outlined text-outline-variant">drag_indicator</span>
              </div>
              <div className="w-9 h-9 bg-surface-container rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">rss_feed</span>
              </div>
              <div className="flex-grow font-bold text-on-surface text-sm">Feed</div>
            </div>

            {/* Item: Live Stream */}
            <div className="bg-surface-container-lowest border border-surface-variant/50 py-2.5 px-3 rounded-xl flex items-center gap-3 shadow-sm">
              <div className="w-6 flex justify-center cursor-grab active:cursor-grabbing">
                <span className="material-symbols-outlined text-outline-variant">drag_indicator</span>
              </div>
              <div className="w-9 h-9 bg-surface-container rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">sensors</span>
              </div>
              <div className="flex-grow font-bold text-on-surface text-sm">Live Stream</div>
            </div>

            {/* Example Divider 2 */}
            <div className="flex items-center gap-3 py-1 group">
              <div className="w-6 flex justify-center cursor-grab active:cursor-grabbing">
                <span className="material-symbols-outlined text-outline-variant/60 text-lg">drag_indicator</span>
              </div>
              <div className="flex-grow h-[1px] bg-surface-variant/50"></div>
              <button className="text-outline-variant hover:text-error transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Item: Classes */}
            <div className="bg-surface-container-lowest border border-surface-variant/50 py-2.5 px-3 rounded-xl flex items-center gap-3 shadow-sm">
              <div className="w-6 flex justify-center cursor-grab active:cursor-grabbing">
                <span className="material-symbols-outlined text-outline-variant">drag_indicator</span>
              </div>
              <div className="w-9 h-9 bg-surface-container rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">school</span>
              </div>
              <div className="flex-grow font-bold text-on-surface text-sm">Classes</div>
            </div>

            {/* Item: Notice */}
            <div className="bg-surface-container-lowest border border-surface-variant/50 py-2.5 px-3 rounded-xl flex items-center gap-3 shadow-sm">
              <div className="w-6 flex justify-center cursor-grab active:cursor-grabbing">
                <span className="material-symbols-outlined text-outline-variant">drag_indicator</span>
              </div>
              <div className="w-9 h-9 bg-surface-container rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">campaign</span>
              </div>
              <div className="flex-grow font-bold text-on-surface text-sm">Notice</div>
            </div>

            {/* Item: Q&A */}
            <div className="bg-surface-container-lowest border border-surface-variant/50 py-2.5 px-3 rounded-xl flex items-center gap-3 shadow-sm">
              <div className="w-6 flex justify-center cursor-grab active:cursor-grabbing">
                <span className="material-symbols-outlined text-outline-variant">drag_indicator</span>
              </div>
              <div className="w-9 h-9 bg-surface-container rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">quiz</span>
              </div>
              <div className="flex-grow font-bold text-on-surface text-sm">Q&amp;A</div>
            </div>

            {/* Item: Chat */}
            <div className="bg-surface-container-lowest border border-surface-variant/50 py-2.5 px-3 rounded-xl flex items-center gap-3 shadow-sm">
              <div className="w-6 flex justify-center cursor-grab active:cursor-grabbing">
                <span className="material-symbols-outlined text-outline-variant">drag_indicator</span>
              </div>
              <div className="w-9 h-9 bg-surface-container rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chat_bubble</span>
              </div>
              <div className="flex-grow font-bold text-on-surface text-sm">Chat</div>
            </div>

            {/* Item: Gallery */}
            <div className="bg-surface-container-lowest border border-surface-variant/50 py-2.5 px-3 rounded-xl flex items-center gap-3 shadow-sm">
              <div className="w-6 flex justify-center cursor-grab active:cursor-grabbing">
                <span className="material-symbols-outlined text-outline-variant">drag_indicator</span>
              </div>
              <div className="w-9 h-9 bg-surface-container rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">photo_library</span>
              </div>
              <div className="flex-grow font-bold text-on-surface text-sm">Gallery</div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-surface-variant z-10 flex justify-center">
        <div className="max-w-md w-full">
          <button 
            onClick={handleApply}
            className="w-full bg-primary text-on-primary h-14 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-primary-container transition-colors active:scale-95 duration-100"
          >
            <span>{isApplying ? "Applying..." : "Apply Structure"}</span>
            <span className="material-symbols-outlined">check_circle</span>
          </button>
        </div>
      </div>
      
      {/* Mobile Screen Bottom Nav Spacer */}
      <div className="md:hidden">
        <div className="h-28"></div>
      </div>
    </div>
  );
};

export default GroupMenuStructure;
