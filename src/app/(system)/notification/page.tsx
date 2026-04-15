'use client';

import React from 'react';

export default function NotificationPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-6 mb-20 min-h-screen">
      {/* Segmented Tab Control */}
      <div className="flex items-center space-x-1 p-1 bg-[#f2f4f4] rounded-xl mb-8 overflow-x-auto no-scrollbar">
        <button className="flex-1 py-2 px-4 text-sm font-semibold rounded-lg bg-white text-[#0058ba] shadow-sm transition-all whitespace-nowrap">
          All
        </button>
        <button className="flex-1 py-2 px-4 text-sm font-medium rounded-lg text-[#596061] hover:bg-[#ebeeef] transition-all whitespace-nowrap">
          Social
        </button>
        <button className="flex-1 py-2 px-4 text-sm font-medium rounded-lg text-[#596061] hover:bg-[#ebeeef] transition-all whitespace-nowrap">
          Events
        </button>
        <button className="flex-1 py-2 px-4 text-sm font-medium rounded-lg text-[#596061] hover:bg-[#ebeeef] transition-all whitespace-nowrap">
          Chat
        </button>
      </div>

      {/* Section Header: Today */}
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#596061]">Today</h2>
        <button className="text-xs font-semibold text-[#0058ba] hover:underline">Mark all as read</button>
      </div>

      {/* Notification List */}
      <div className="space-y-1">
        {/* Unread Notification Item */}
        <div className="group relative flex items-start gap-4 p-4 rounded-2xl bg-[#d8e2ff]/20 border border-transparent hover:border-[#d8e2ff] transition-all cursor-pointer">
          <div className="relative shrink-0">
            <img
              alt="Stone Hong"
              className="w-12 h-12 rounded-full object-cover border-2 border-[#d8e2ff]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWVKrTzgmv4pAbpT-5PGoj4JsKYIaUOGBigJyqCHeDO3yh24CETW0r4t8pSZx-_93YOYwT0N6wkk10Gjg8yl4w0Cv18Jd-YWLROZuTMc16FDJ2K4iI0bUrlx2h-6wRezYxmpTyUa3Q5YWvkhYW04CmpgmWmJm5mqiIM9v8-BqSnAuRaOesK8EMWonMvSxvkaLHtr-VOej9-vg5q28scZdCH8WtG6R9IozNB90Faqvu4J2jOsfnIWOO6plydH2Z-Wg7Rck7cwhNdVrc"
            />
            <div className="absolute -bottom-1 -right-1 bg-[#0058ba] text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                alternate_email
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#2d3435] leading-relaxed">
              <span className="font-bold text-[#2d3435]">Stone Hong</span> mentioned you in a social post:{' '}
              <span className="italic text-[#596061]">"The team did an incredible job on the Tango Minimalist launch..."</span>
            </p>
            <p className="text-xs text-[#596061] mt-1.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              2m ago
            </p>
          </div>
          <div className="shrink-0 flex items-center">
            <div className="w-2.5 h-2.5 bg-[#0058ba] rounded-full"></div>
          </div>
        </div>

        {/* Unread Chat Notification */}
        <div className="group relative flex items-start gap-4 p-4 rounded-2xl bg-[#d8e2ff]/20 border border-transparent hover:border-[#d8e2ff] transition-all cursor-pointer">
          <div className="relative shrink-0">
            <img
              alt="Sarah Jenkins"
              className="w-12 h-12 rounded-full object-cover border-2 border-[#d8e2ff]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCh5wmak2nyU9Ly7m54Wpx2agZsgXSuVxqqVojA_8lEZj0RJHmCC0CiQdBWAwO_8F7UJmJ85_WPOwNWNrw9r0J1fYY9FNp9OMSEb8GceK1l8fGabTZmnjOj5-Q6YF8ORUOGOWGxnwvOD1KcG_As27fMIq1NcCwXooqUmHN8ATuYj--A8YxXCPCGV1r-ajEHSmFKq7M-rCBsjEPhEXRwDiWPKtyowzenSuxktFVefDn2DeZcjUNx-HwNKKk-m18slOGbG7ZTwLeb6D12"
            />
            <div className="absolute -bottom-1 -right-1 bg-[#0058ba] text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                chat_bubble
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#2d3435] leading-relaxed">
              <span className="font-bold text-[#2d3435]">Sarah Jenkins</span> sent you a message:{' '}
              <span className="text-[#596061]">"Are we still on for the 4 PM design sync?"</span>
            </p>
            <p className="text-xs text-[#596061] mt-1.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              15m ago
            </p>
          </div>
          <div className="shrink-0 flex items-center">
            <div className="w-2.5 h-2.5 bg-[#0058ba] rounded-full"></div>
          </div>
        </div>

        {/* Event Notification (Read) */}
        <div className="group relative flex items-start gap-4 p-4 rounded-2xl bg-transparent border border-transparent hover:bg-[#f2f4f4] transition-all cursor-pointer">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full bg-[#f2f4f7] flex items-center justify-center text-[#595c5f]">
              <span className="material-symbols-outlined text-[24px]">event_available</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#2d3435] leading-relaxed">
              Your event <span className="font-semibold text-[#0058ba]">Quarterly Review</span> starts in 30 minutes.
            </p>
            <p className="text-xs text-[#596061] mt-1.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              1h ago
            </p>
          </div>
        </div>
      </div>

      {/* Section Header: Yesterday */}
      <div className="flex items-center justify-between mb-4 px-2 mt-10">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#596061]">Yesterday</h2>
      </div>

      <div className="space-y-1">
        {/* Social Notification (Read) */}
        <div className="group relative flex items-start gap-4 p-4 rounded-2xl bg-transparent border border-transparent hover:bg-[#f2f4f4] transition-all cursor-pointer">
          <div className="relative shrink-0">
            <img
              alt="Alex Rivera"
              className="w-12 h-12 rounded-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmo_0ruPeytEQ-bO_7SN0Xlq9EJSWjYm2jjUn5wlNfjt4_siR5sY8QQH3mwLezgKL-fnQzfsxVNIk0bFc5jrwmahDv9VrsiWZAuoJA9YvBNEI8Jf_LmawsqOku8B1DhE0ZnnqektkAMcr5cqxyC4dTyFq3GXiImbdDtcn0OnzgkSR3BYpqXvSJBoA1N245Qj15ntOcrJ91zj4fzv8AGg10ucNNGiAQR88IZHh0p154tlpxJ3TE__QW150j6GP5SsXeFSkgiLrWwbBM"
            />
            <div className="absolute -bottom-1 -right-1 bg-[#5b5f64] text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                thumb_up
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#2d3435] leading-relaxed">
              <span className="font-bold text-[#2d3435]">Alex Rivera</span> and 4 others liked your recent case study.
            </p>
            <p className="text-xs text-[#596061] mt-1.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              Yesterday at 4:32 PM
            </p>
          </div>
        </div>

        {/* Group Event */}
        <div className="group relative flex items-start gap-4 p-4 rounded-2xl bg-transparent border border-transparent hover:bg-[#f2f4f4] transition-all cursor-pointer">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full bg-[#d8e2ff] flex items-center justify-center text-[#0058ba]">
              <span className="material-symbols-outlined text-[24px]">groups</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#2d3435] leading-relaxed">
              New community post: <span className="font-semibold">"Best practices for minimalist design tokens"</span> was published in{' '}
              <span className="font-bold">UI Collective</span>.
            </p>
            <p className="text-xs text-[#596061] mt-1.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              Yesterday at 9:15 AM
            </p>
          </div>
        </div>
      </div>

      {/* End of List */}
      <div className="mt-12 text-center">
        <span className="inline-block p-2 rounded-full bg-[#ebeeef] mb-3">
          <span className="material-symbols-outlined text-[#757c7d]">check_circle</span>
        </span>
        <p className="text-xs font-medium text-[#596061]">You've reached the end of your notifications.</p>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}
