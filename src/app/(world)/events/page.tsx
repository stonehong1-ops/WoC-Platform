'use client';

import React from 'react';

export default function EventsPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .calendar-grid { 
          display: grid; 
          grid-template-columns: repeat(7, minmax(0, 1fr));
          width: 100%;
        }
        
        /* Fix for multi-day event bars thickness and alignment */
        .event-bar {
          height: 20px;
          font-size: 8px;
          font-weight: 700;
          display: flex;
          align-items: center;
          padding: 0 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          z-index: 10;
        }

        .segmented-control input:checked + label {
          background-color: white;
          color: #1A73E8;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
      `}} />

      <main className="max-w-7xl mx-auto px-4 pt-6 pb-24 bg-[#f9f9f9]">
        {/* Section: Event Today (Horizontal Scroll) */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline text-lg font-extrabold tracking-tight text-[#2d3435]">Event Today</h2>
            <button className="text-[#1A73E8] font-bold text-sm flex items-center gap-1 group">
              See all 
              <span className="material-symbols-outlined text-sm font-bold transition-transform group-hover:translate-x-1">arrow_forward</span>
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
            {/* Event Card 1 */}
            <div className="flex-none w-72 p-5 bg-white border border-[#ebeeef] rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold tracking-widest uppercase text-[#1A73E8] bg-[#d8e2ff]/30 px-2 py-0.5 rounded">CONFERENCE</span>
                <span className="material-symbols-outlined text-[#596061] text-base cursor-pointer">more_horiz</span>
              </div>
              <h3 className="font-headline font-bold text-lg leading-tight mb-3">Global Tech Summit 2024</h3>
              <div className="flex flex-col gap-2 text-[#596061] text-sm">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">location_on</span>
                  <span>San Francisco, USA</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-[#2d3435]">
                  <span className="material-symbols-outlined text-base">calendar_today</span>
                  <span>Oct 14, 2024</span>
                </div>
              </div>
            </div>

            {/* Event Card 2 */}
            <div className="flex-none w-72 p-5 bg-white border border-[#ebeeef] rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold tracking-widest uppercase text-[#9f403d] bg-[#fe8983]/20 px-2 py-0.5 rounded">WORKSHOP</span>
                <span className="material-symbols-outlined text-[#596061] text-base cursor-pointer">more_horiz</span>
              </div>
              <h3 className="font-headline font-bold text-lg leading-tight mb-3">UI/UX Design Intensive</h3>
              <div className="flex flex-col gap-2 text-[#596061] text-sm">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">location_on</span>
                  <span>Berlin, Germany</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-[#2d3435]">
                  <span className="material-symbols-outlined text-base">calendar_today</span>
                  <span>Oct 14, 2024</span>
                </div>
              </div>
            </div>

            {/* Event Card 3 */}
            <div className="flex-none w-72 p-5 bg-white border border-[#ebeeef] rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold tracking-widest uppercase text-[#5b5f64] bg-[#dfe3e8]/50 px-2 py-0.5 rounded">NETWORKING</span>
                <span className="material-symbols-outlined text-[#596061] text-base cursor-pointer">more_horiz</span>
              </div>
              <h3 className="font-headline font-bold text-lg leading-tight mb-3">Startup Founders Mixer</h3>
              <div className="flex flex-col gap-2 text-[#596061] text-sm">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">location_on</span>
                  <span>London, UK</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-[#2d3435]">
                  <span className="material-symbols-outlined text-base">calendar_today</span>
                  <span>Oct 14, 2024</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Monthly Calendar View */}
        <section className="bg-white border border-[#ebeeef] rounded-lg shadow-sm overflow-hidden">
          {/* Calendar Header Controls */}
          <div className="flex items-center justify-between p-3 border-b border-[#ebeeef]">
            {/* Left: < Oct, 2024 > */}
            <div className="flex items-center gap-2">
              <button className="flex items-center justify-center p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                <span className="material-symbols-outlined text-xl text-[#596061]">chevron_left</span>
              </button>
              <div className="flex items-center gap-1">
                <h1 className="font-headline text-sm font-extrabold text-[#2d3435]">Oct,</h1>
                <span className="font-headline text-sm font-medium text-[#596061]">2024</span>
              </div>
              <button className="flex items-center justify-center p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                <span className="material-symbols-outlined text-xl text-[#596061]">chevron_right</span>
              </button>
            </div>
            {/* Right: M / W / D */}
            <div className="flex items-center bg-[#f2f4f4] p-1 rounded-lg segmented-control">
              <input checked className="hidden" id="view-month" name="view" type="radio" readOnly />
              <label className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer text-[#596061] transition-all" htmlFor="view-month">M</label>
              <div className="w-px h-3 bg-[#acb3b4]/30 mx-0.5"></div>
              <input className="hidden" id="view-week" name="view" type="radio" />
              <label className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer text-[#596061] transition-all" htmlFor="view-week">W</label>
              <div className="w-px h-3 bg-[#acb3b4]/30 mx-0.5"></div>
              <input className="hidden" id="view-day" name="view" type="radio" />
              <label className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer text-[#596061] transition-all" htmlFor="view-day">D</label>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="calendar-grid bg-white border-b border-[#ebeeef] text-center">
            <div className="py-2.5 border-r border-[#ebeeef]"><span className="text-[10px] font-bold text-[#596061] uppercase tracking-widest">Mon</span></div>
            <div className="py-2.5 border-r border-[#ebeeef]"><span className="text-[10px] font-bold text-[#596061] uppercase tracking-widest">Tue</span></div>
            <div className="py-2.5 border-r border-[#ebeeef]"><span className="text-[10px] font-bold text-[#596061] uppercase tracking-widest">Wed</span></div>
            <div className="py-2.5 border-r border-[#ebeeef]"><span className="text-[10px] font-bold text-[#596061] uppercase tracking-widest">Thu</span></div>
            <div className="py-2.5 border-r border-[#ebeeef]"><span className="text-[10px] font-bold text-[#596061] uppercase tracking-widest">Fri</span></div>
            <div className="py-2.5 border-r border-[#ebeeef]"><span className="text-[10px] font-bold text-[#596061] uppercase tracking-widest">Sat</span></div>
            <div className="py-2.5"><span className="text-[10px] font-bold text-[#596061] uppercase tracking-widest">Sun</span></div>
          </div>

          {/* Calendar Days Grid */}
          <div className="calendar-grid auto-rows-min relative">
            {/* Week 1 */}
            <div className="min-h-[120px] p-2 border-b border-r border-[#ebeeef] flex flex-col items-end">
              <span className="text-xs font-bold text-[#757c7d]">30</span>
            </div>
            <div className="min-h-[120px] p-2 border-b border-r border-[#ebeeef] flex flex-col items-end relative">
              <span className="text-xs font-bold text-[#2d3435]">1</span>
              <div className="absolute top-8 left-0 w-[400%] px-1 z-20">
                <div className="event-bar bg-[#1A73E8] text-white rounded shadow-sm">
                  <span>Product Design Sprints • 🇺🇸</span>
                </div>
              </div>
              <div className="w-full mt-6 space-y-1">
                <div className="event-bar invisible">Spacer</div>
                <div className="event-bar bg-[#d8e2ff] text-[#1A73E8] rounded px-1.5 border border-[#1A73E8]/10">
                  <span>1:1 Review <span className="opacity-70 font-normal ml-1">Remote</span></span>
                </div>
              </div>
            </div>
            <div className="min-h-[120px] p-2 border-b border-r border-[#ebeeef] flex flex-col items-end relative">
              <span className="text-xs font-bold text-[#2d3435]">2</span>
            </div>
            <div className="min-h-[120px] p-2 border-b border-r border-[#ebeeef] flex flex-col items-end relative">
              <span className="text-xs font-bold text-[#2d3435]">3</span>
              <div className="absolute top-14 left-0 w-[200%] px-1 z-20">
                <div className="event-bar bg-[#5b5f64] text-white rounded shadow-sm">
                  <span>Marketing Campaign • 🇬🇧</span>
                </div>
              </div>
            </div>
            <div className="min-h-[120px] p-2 border-b border-r border-[#ebeeef] flex flex-col items-end relative">
              <span className="text-xs font-bold text-[#2d3435]">4</span>
            </div>
            <div className="min-h-[120px] p-2 border-b border-r border-[#ebeeef] flex flex-col items-end relative">
              <span className="text-xs font-bold text-[#2d3435]">5</span>
            </div>
            <div className="min-h-[120px] p-2 border-b border-[#ebeeef] flex flex-col items-end relative">
              <span className="text-xs font-bold text-[#2d3435]">6</span>
            </div>

            {/* Week 2 */}
            <div className="min-h-[120px] p-2 border-b border-r border-[#ebeeef] flex flex-col items-end relative">
              <span className="text-xs font-bold text-[#2d3435]">7</span>
              <div className="absolute top-8 left-0 w-[600%] px-1 z-20">
                <div className="event-bar bg-[#003d85] text-white rounded shadow-sm">
                  <span>Intl Tech Expo • 🇩🇪</span>
                </div>
              </div>
              <div className="w-full mt-6 space-y-1">
                <div className="event-bar invisible">Spacer</div>
                <div className="absolute top-14 left-0 w-[200%] px-1 z-20">
                  <div className="event-bar bg-[#9f403d] text-white rounded shadow-sm">
                    <span>Critical Maint. • 🌍</span>
                  </div>
                </div>
                <div className="event-bar invisible">Spacer</div>
                <div className="event-bar bg-[#e4e9ea] text-[#596061] rounded">
                  <span>Standup</span>
                </div>
              </div>
            </div>
            <div className="min-h-[120px] p-2 border-b border-r border-[#ebeeef] flex flex-col items-end relative">
              <span className="text-xs font-bold text-[#2d3435]">8</span>
            </div>
            <div className="min-h-[120px] p-2 border-b border-r border-[#ebeeef] flex flex-col items-end relative">
              <span className="text-xs font-bold text-[#2d3435]">9</span>
            </div>
            <div className="min-h-[120px] p-2 border-b border-r border-[#ebeeef] flex flex-col items-end relative">
              <span className="text-xs font-bold text-[#2d3435]">10</span>
            </div>
            <div className="min-h-[120px] p-2 border-b border-r border-[#ebeeef] flex flex-col items-end relative">
              <span className="text-xs font-bold text-[#2d3435]">11</span>
            </div>
            <div className="min-h-[120px] p-2 border-b border-r border-[#ebeeef] flex flex-col items-end relative">
              <span className="text-xs font-bold text-[#2d3435]">12</span>
            </div>
            <div className="min-h-[120px] p-2 border-b border-[#ebeeef] flex flex-col items-end relative">
              <span className="text-xs font-bold text-[#2d3435]">13</span>
            </div>

            {/* Week 3 */}
            <div className="min-h-[120px] p-2 border-b border-r border-[#ebeeef] flex flex-col items-end relative">
              <span className="text-xs font-bold text-[#2d3435]">14</span>
            </div>
            <div className="min-h-[120px] p-2 border-b border-r border-[#ebeeef] flex flex-col items-end relative">
              <span className="text-xs font-bold text-[#2d3435]">15</span>
            </div>
            <div className="min-h-[120px] p-2 border-b border-r border-[#ebeeef] bg-[#1A73E8]/5 flex flex-col items-end relative">
              <span className="text-xs font-bold text-[#1A73E8] bg-white ring-2 ring-[#1A73E8] rounded-full h-5 w-5 flex items-center justify-center -mr-1">16</span>
              <div className="w-full mt-3 space-y-1">
                <div className="event-bar bg-[#fe8983]/20 text-[#9f403d] rounded border border-[#9f403d]/10">
                  <span>Launch v2.0</span>
                </div>
                <div className="event-bar bg-[#d8e2ff] text-[#1A73E8] rounded border border-[#1A73E8]/10">
                  <span>QA Session</span>
                </div>
              </div>
            </div>
            <div className="min-h-[120px] p-2 border-b border-r border-[#ebeeef] flex flex-col items-end relative">
              <span className="text-xs font-bold text-[#2d3435]">17</span>
              <div className="absolute top-11 left-0 w-[400%] px-1 z-20">
                <div className="event-bar bg-[#5c5f62] text-white rounded shadow-sm">
                  <span>Strategy Retreat • 🇯🇵</span>
                </div>
              </div>
            </div>
            <div className="min-h-[120px] p-2 border-b border-r border-[#ebeeef] flex flex-col items-end relative">
              <span className="text-xs font-bold text-[#2d3435]">18</span>
            </div>
            <div className="min-h-[120px] p-2 border-b border-r border-[#ebeeef] flex flex-col items-end relative">
              <span className="text-xs font-bold text-[#2d3435]">19</span>
            </div>
            <div className="min-h-[120px] p-2 border-b border-[#ebeeef] flex flex-col items-end relative">
              <span className="text-xs font-bold text-[#2d3435]">20</span>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
