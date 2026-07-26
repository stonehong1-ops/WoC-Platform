"use client";

import React from "react";

export interface DetailHeaderProps {
  title: string;
  titleNative?: string;
  onClose: () => void;
  isScrolled: boolean;
  rightActions?: React.ReactNode;
  backIcon?: string;
}

export default function DetailHeader({
  title,
  titleNative,
  onClose,
  isScrolled,
  rightActions,
  backIcon = "arrow_back",
}: DetailHeaderProps) {
  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pb-3 transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : ""
      }`}
      style={{
        paddingTop: "calc(12px + env(safe-area-inset-top, 0px))",
        height: "calc(56px + env(safe-area-inset-top, 0px))",
      }}
    >
      <button
        onClick={onClose}
        aria-label="Back"
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          isScrolled
            ? "bg-slate-100 text-[#2d3435] hover:bg-slate-200"
            : "bg-black/20 backdrop-blur-sm text-white hover:bg-black/30"
        }`}
      >
        <span className="material-symbols-rounded text-xl">{backIcon}</span>
      </button>

      <div
        className={`flex flex-col items-center max-w-[200px] transition-all duration-300 ${
          isScrolled
            ? "opacity-100 translate-y-0 text-[#2d3435]"
            : "opacity-0 -translate-y-2 text-white pointer-events-none"
        }`}
      >
        <div className="text-base font-bold truncate w-full text-center">
          {title}
        </div>
        {titleNative && (
          <div
            className={`text-[10px] font-bold truncate w-full text-center ${
              isScrolled ? "text-[#acb3b4]" : "text-white/90"
            }`}
          >
            {titleNative}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {rightActions}
      </div>
    </div>
  );
}
