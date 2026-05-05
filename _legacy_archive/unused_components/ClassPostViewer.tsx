'use client';

import React, { useRef, useState } from 'react';
import { Group, GroupClass, MonthlyPass } from '@/types/group';

interface ClassPostViewerProps {
  group: Group;
  classes: GroupClass[];
  monthlyPasses?: MonthlyPass[];
  ownerName?: string | null;
  onClose: () => void;
}

const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
const DAY_LABELS: Record<string, string> = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday',
  FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday',
};
const DAY_COLORS: Record<string, string> = {
  MON: '#0057bd', TUE: '#7c3aed', WED: '#059669', THU: '#d97706',
  FRI: '#dc2626', SAT: '#0891b2', SUN: '#be185d',
};

function getDayOfWeek(dateStr: string): string {
  if (!dateStr) return '';
  const cleanDate = dateStr.replace(/\./g, '-');
  const d = new Date(cleanDate);
  if (isNaN(d.getTime())) return '';
  return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()];
}

function formatScheduleDates(schedule: { week: number; date: string }[]): string {
  if (!schedule || schedule.length === 0) return '';
  const days = schedule.map(s => {
    if (!s.date) return '';
    const cleanDate = s.date.replace(/\./g, '-');
    const d = new Date(cleanDate);
    return isNaN(d.getTime()) ? '' : String(d.getDate());
  }).filter(Boolean);
  return days.join(', ');
}

function formatTime(timeStr?: string): string {
  if (!timeStr) return '';
  return timeStr;
}

export default function ClassPostViewer({ group, classes, monthlyPasses, ownerName, onClose }: ClassPostViewerProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Group classes by day of week
  const classesByDay = new Map<string, GroupClass[]>();
  DAY_ORDER.forEach(day => classesByDay.set(day, []));

  classes.forEach(cls => {
    if (cls.schedule && cls.schedule.length > 0) {
      const days = new Set<string>();
      cls.schedule.forEach(s => {
        const day = getDayOfWeek(s.date);
        if (day) days.add(day);
      });
      
      days.forEach(day => {
        if (classesByDay.has(day)) {
          classesByDay.get(day)!.push(cls);
        }
      });
    }
  });

  // Get bank details (classPaymentSettings > bankDetails fallback)
  const bank = group.classPaymentSettings?.bankDetails || group.bankDetails;

  // Month display
  const d = new Date();
  if (d.getDate() >= 15) d.setMonth(d.getMonth() + 1);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthDisplay = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

  const handleDownload = async () => {
    if (!captureRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const { default: html2canvas } = await import('html2canvas-pro');
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `${monthDisplay.replace(' ', '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f2f4f4] flex-shrink-0">
        <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#f2f4f4] transition-colors">
          <span className="material-symbols-outlined text-xl text-[#596061]">close</span>
        </button>
        <h2 className="text-sm font-black text-[#2d3435]">Class Schedule</h2>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#f0f4ff] transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-xl text-[#0057bd]">
            {isDownloading ? 'progress_activity' : 'download'}
          </span>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Capture Area */}
        <div ref={captureRef} className="bg-white px-5 py-6">
          
          {/* Title Banner */}
          <div className="bg-gradient-to-r from-[#0057bd] to-[#3b82f6] rounded-2xl p-5 mb-6 text-center">
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-[0.2em] mb-1">CLASS INFORMATION</p>
            <h1 className="text-xl font-black text-white mb-1">{group.name}</h1>
            <p className="text-sm font-bold text-blue-100">{monthDisplay}</p>
          </div>

          {/* Monthly Pass Info */}
          {monthlyPasses && monthlyPasses.length > 0 && (
            <div className="mb-6 bg-[#f0f4ff] border border-[#0057bd]/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[#0057bd] text-lg">local_activity</span>
                <h3 className="text-sm font-black text-[#0057bd]">Monthly Pass</h3>
              </div>
              <div className="space-y-3">
                {monthlyPasses.map(pass => (
                  <div key={pass.id} className="bg-white rounded-xl p-3 shadow-sm border border-[#0057bd]/10">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-bold text-[#2d3435]">{pass.title}</p>
                      <p className="text-sm font-black text-[#0057bd] ml-2 whitespace-nowrap">
                        {pass.amount.toLocaleString()} {pass.currency}
                      </p>
                    </div>
                    {pass.description && (
                      <p className="text-xs text-[#596061] leading-relaxed whitespace-pre-wrap">{pass.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Day-by-Day Schedule */}
          <div className="space-y-4">
            {DAY_ORDER.map(day => {
              const dayClasses = classesByDay.get(day) || [];
              if (dayClasses.length === 0) return null;

              const color = DAY_COLORS[day];

              return (
                <div key={day} className="border border-[#e0e4e5] rounded-2xl overflow-hidden">
                  {/* Day Header */}
                  <div className="px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: `${color}10` }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <p className="text-xs font-black uppercase tracking-[0.15em]" style={{ color }}>{DAY_LABELS[day]}</p>
                    <span className="text-[10px] font-bold text-[#acb3b4] ml-auto">{dayClasses.length} class{dayClasses.length > 1 ? 'es' : ''}</span>
                  </div>

                  {/* Classes */}
                  <div className="divide-y divide-[#f2f4f4]">
                    {dayClasses.map(cls => {
                      const schedDates = formatScheduleDates(cls.schedule);
                      const instructors = cls.instructors || [];
                      const startDate = cls.schedule?.[0]?.date;
                      let startDisplay = '';
                      if (startDate) {
                        const cleanDate = startDate.replace(/\./g, '-');
                        const dd = new Date(cleanDate);
                        if (!isNaN(dd.getTime())) {
                          startDisplay = `${dd.getMonth() + 1}/${dd.getDate()}`;
                        }
                      }
                      const timeDisplay = cls.startTime ? `${cls.startTime}${cls.endTime ? '~' + cls.endTime : ''}` : (cls.schedule?.[0]?.timeSlot || '');

                      return (
                        <div key={cls.id} className="p-3 flex gap-3">
                          {/* Class Image */}
                          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#e0e4e5]">
                            {cls.imageUrl ? (
                              <img src={cls.imageUrl} alt={cls.title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center'); e.currentTarget.parentElement!.innerHTML = '<span class="material-symbols-outlined text-[#acb3b4] text-lg">school</span>'; }} />
                            ) : group.coverImage ? (
                              <img src={group.coverImage} alt={cls.title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center'); e.currentTarget.parentElement!.innerHTML = '<span class="material-symbols-outlined text-[#acb3b4] text-lg">school</span>'; }} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-[#acb3b4] text-lg">school</span>
                              </div>
                            )}
                          </div>

                          {/* Class Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#2d3435] truncate">{cls.title}</p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                              {startDisplay && (
                                <span className="text-[11px] font-bold" style={{ color }}>Start: {startDisplay}</span>
                              )}
                              {timeDisplay && (
                                <span className="text-[11px] text-[#596061]">{timeDisplay}</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                <span className="text-[11px] font-black text-[#2d3435]">{cls.amount.toLocaleString()} {cls.currency}</span>
                            </div>
                            {schedDates && (
                              <p className="text-[10px] text-[#acb3b4] mt-0.5">
                                Schedule: <span className="font-bold text-[#596061]">{schedDates}</span>
                              </p>
                            )}
                          </div>

                          {/* Instructors */}
                          {instructors.length > 0 && (
                            <div className="flex flex-row gap-2 flex-shrink-0 items-center justify-end ml-1">
                              {instructors.slice(0, 2).map((instructor, idx) => (
                                <div key={idx} className="flex flex-col items-center w-8">
                                  <div className="w-7 h-7 rounded-full overflow-hidden bg-[#e0e4e5] border border-[#f2f4f4]">
                                    {instructor.avatar ? (
                                      <img src={instructor.avatar} alt={instructor.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center', 'text-[9px]', 'font-bold', 'text-[#596061]', 'bg-[#f8f9fa]'); e.currentTarget.parentElement!.innerHTML = instructor.name.substring(0, 2).toUpperCase(); }} />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-[#596061] bg-[#f8f9fa]">
                                        {instructor.name.substring(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-[8px] font-bold text-[#596061] mt-0.5 text-center truncate w-full">{instructor.name}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bank Account Section */}
          {bank && (
            <div className="mt-6 border border-[#e0e4e5] rounded-2xl overflow-hidden">
              <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#0057bd]">account_balance</span>
                <p className="text-[10px] font-black text-[#0057bd] uppercase tracking-[0.15em]">Class Payment Account</p>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#acb3b4] uppercase font-bold">Bank</span>
                  <span className="text-sm font-bold text-[#2d3435]">{bank.bankName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#acb3b4] uppercase font-bold">Account</span>
                  <span className="text-sm font-black text-[#2d3435] font-mono tracking-wide">{bank.accountNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#acb3b4] uppercase font-bold">Holder</span>
                  <span className="text-sm font-bold text-[#2d3435]">{bank.accountHolder}</span>
                </div>
              </div>
            </div>
          )}

          {/* Contact Section */}
          <div className="mt-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
            <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-[#596061]">support_agent</span>
              <p className="text-[10px] font-black text-[#596061] uppercase tracking-[0.15em]">Contact</p>
            </div>
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f0f4ff] flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-sm text-[#0057bd]">person</span>
              </div>
              <div>
                <p className="text-sm font-bold text-[#2d3435]">{group.representative?.name || ownerName || 'Stone Hong'}</p>
                <p className="text-[11px] text-[#acb3b4] font-medium mt-0.5">
                  <span className="text-[#0057bd] font-bold">{group.representative?.phone || '010-9031-1557'}</span> (Admin)
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-[9px] text-[#acb3b4]">© {new Date().getFullYear()} {group.name} · woc.today</p>
          </div>
        </div>
      </div>

      {/* Bottom Download Button */}
      <div className="border-t border-[#f2f4f4] px-5 py-4 flex-shrink-0">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full bg-[#0057bd] text-white py-4 rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-[#0057bd]/20 active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">{isDownloading ? 'progress_activity' : 'download'}</span>
          {isDownloading ? 'Generating Image...' : 'Download as Image'}
        </button>
      </div>
    </div>
  );
}
