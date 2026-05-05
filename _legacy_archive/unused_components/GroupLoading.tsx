"use client";

import React from "react";

export default function GroupLoading() {
  return (
    <div className="bg-background h-full min-h-[100dvh] flex items-center justify-center font-['Inter'] w-full">
      {/* Mobile Container */}
      <div
        className="relative w-full max-w-[480px] h-full min-h-[100dvh] mx-auto overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD7b-hi47G9vJejD6b4nJNMtArausChJbKzkxf5J5iGG6Dfij5ouHLb6neSbT4smKiYcAPJboNN6czxcv_pMo7PybkH6yhs27vuvX3isqdPEgpmGb1KuyocG1UWuobv4qQQhPrZewkxgvdvgb8Q-SRvfrlZcRg_oG3bUIyE1HoJAeps1_TwyI2i13UgIoFNevyFupJL1xDVXaRpL1ATKSgLUJZQHQsEyZIL7NTqRRVcCo4mBOMq6qPMadSGdCGRm4FUUcMZWXqcG7s')",
        }}
      >
        {/* Glassmorphism Loading Overlay */}
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          {/* Loading Spinner Container */}
          <div className="flex flex-col items-center justify-center space-y-6">
            {/* Metaphorical Entering Room Animation */}
            <div className="w-16 h-20 flex relative overflow-hidden border-2 border-primary/50 rounded-sm bg-white/20">
              <div className="w-1/2 h-full bg-primary origin-left animate-[doorLeft_2.5s_ease-in-out_infinite]"></div>
              <div className="w-1/2 h-full bg-primary origin-right animate-[doorRight_2.5s_ease-in-out_infinite]"></div>
            </div>

            {/* Loading Text */}
            <div className="text-center font-['Inter'] flex flex-col items-center px-4">
              <p className="text-2xl text-on-surface font-extrabold tracking-tight">
                Opening the doors...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
