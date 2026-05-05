'use client';

import React, { useState } from 'react';
import { EventProgram } from '@/types/event';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  programs: EventProgram[];
  onChange: (programs: EventProgram[]) => void;
}

export default function ProgramEditor({ programs, onChange }: Props) {
  const { t } = useLanguage();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addProgram = (type: 'class' | 'milonga') => {
    const prefix = type === 'class' ? 'C' : 'M';
    const count = programs.filter(p => p.type === type).length + 1;
    const newP: EventProgram = {
      id: `${prefix}${count}`,
      title: '',
      type,
      dates: [],
      startTime: type === 'class' ? '14:00' : '21:00',
      endTime: type === 'class' ? '15:20' : '01:00',
      maxParticipants: type === 'class' ? 15 : 0,
      capacityUnit: type === 'class' ? 'couple' : 'person',
    };
    onChange([...programs, newP]);
    setExpandedId(newP.id);
  };

  const updateProgram = (id: string, partial: Partial<EventProgram>) => {
    onChange(programs.map(p => p.id === id ? { ...p, ...partial } : p));
  };

  const removeProgram = (id: string) => {
    onChange(programs.filter(p => p.id !== id));
  };

  const addDateToProgram = (id: string, date: string) => {
    const p = programs.find(x => x.id === id);
    if (!p || p.dates.includes(date)) return;
    updateProgram(id, { dates: [...p.dates, date].sort() });
  };

  const removeDateFromProgram = (id: string, date: string) => {
    const p = programs.find(x => x.id === id);
    if (!p) return;
    updateProgram(id, { dates: p.dates.filter(d => d !== date) });
  };

  return (
    <div className="border border-[#e0e4e5] rounded-2xl bg-white">
      <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center justify-between rounded-t-[15px]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-rounded text-sm text-primary">calendar_month</span>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('event.programs_label')}</p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => addProgram('class')}
            className="text-[10px] font-bold text-primary flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors">
            <span className="material-symbols-rounded text-[14px]">add</span>{t('event.add_class')}
          </button>
          <button onClick={() => addProgram('milonga')}
            className="text-[10px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full hover:bg-amber-100 transition-colors">
            <span className="material-symbols-rounded text-[14px]">add</span>{t('event.add_milonga')}
          </button>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {programs.length === 0 && (
          <div className="text-center py-8 text-[#acb3b4]">
            <span className="material-symbols-rounded text-3xl mb-1 opacity-50">event_note</span>
            <p className="text-xs font-bold">{t('event.no_programs')}</p>
            <p className="text-[10px] mt-1">{t('event.add_programs_hint')}</p>
          </div>
        )}
        {programs.map(p => {
          const isExpanded = expandedId === p.id;
          const isClass = p.type === 'class';
          return (
            <div key={p.id} className={`border rounded-xl overflow-hidden transition-all ${isClass ? 'border-[#e0e4e5]' : 'border-amber-200'}`}>
              {/* Header */}
              <button onClick={() => setExpandedId(isExpanded ? null : p.id)}
                className={`w-full flex items-center justify-between px-4 py-3 ${isClass ? 'bg-[#f8f9fa]' : 'bg-amber-50'}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isClass ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'}`}>{p.id}</span>
                  <span className="text-sm font-bold text-[#2d3435] truncate max-w-[180px]">{p.title || (isClass ? t('event.untitled_class') : t('event.untitled_milonga'))}</span>
                  <span className="text-[10px] text-[#acb3b4] font-medium">{p.dates.length} {t('event.dates_count')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); removeProgram(p.id); }}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-[#acb3b4] hover:text-red-500 transition-colors">
                    <span className="material-symbols-rounded text-[16px]">delete</span>
                  </button>
                  <span className="material-symbols-rounded text-[#acb3b4] text-[18px]">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                </div>
              </button>
              {/* Body */}
              {isExpanded && (
                <div className="p-4 space-y-3 border-t border-[#e0e4e5]">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1">{t('event.id_label')}</label>
                      <input value={p.id} onChange={e => updateProgram(p.id, { id: e.target.value })}
                        className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1">{t('event.category_label')}</label>
                      <input value={p.category || ''} onChange={e => updateProgram(p.id, { category: e.target.value })}
                        className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20" placeholder={t('event.category_placeholder')} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1">{t('event.title_en_label')}</label>
                    <input value={p.title} onChange={e => updateProgram(p.id, { title: e.target.value })}
                      className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Tango Salon Fundamentals" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1">{t('event.title_native_label')}</label>
                    <input value={p.titleNative || ''} onChange={e => updateProgram(p.id, { titleNative: e.target.value })}
                      className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20" placeholder={t('event.title_native_placeholder')} />
                  </div>
                  {/* Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1">{t('event.start_time_label')}</label>
                      <input type="time" value={p.startTime} onChange={e => updateProgram(p.id, { startTime: e.target.value })}
                        className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1">{t('event.end_time_label')}</label>
                      <input type="time" value={p.endTime} onChange={e => updateProgram(p.id, { endTime: e.target.value })}
                        className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>
                  {/* Type-specific */}
                  {isClass ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1">{t('event.instructor_label')}</label>
                        <input value={p.instructor || ''} onChange={e => updateProgram(p.id, { instructor: e.target.value })}
                          className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20" placeholder={t('event.instructor_placeholder')} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1">{t('event.level_label')}</label>
                        <select value={p.level || 'all'} onChange={e => updateProgram(p.id, { level: e.target.value })}
                          className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                          <option value="all">{t('event.level_all')}</option>
                          <option value="beginner">{t('event.level_beginner')}</option>
                          <option value="intermediate">{t('event.level_intermediate')}</option>
                          <option value="adv">{t('event.level_advanced')}</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1">{t('event.dj_label')}</label>
                      <input value={p.djName || ''} onChange={e => updateProgram(p.id, { djName: e.target.value })}
                        className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20" placeholder={t('event.dj_placeholder')} />
                    </div>
                  )}
                  {/* Capacity */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1">{t('event.max_participants_label')}</label>
                      <input type="number" min="0" value={p.maxParticipants} onChange={e => updateProgram(p.id, { maxParticipants: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1">{t('event.price_per_program_label')}</label>
                      <input type="number" min="0" value={p.price || ''} onChange={e => updateProgram(p.id, { price: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20" placeholder="0" />
                    </div>
                  </div>
                  {/* Dates */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1.5">{t('event.schedule_dates_label')}</label>
                    <div className="flex items-center gap-2 mb-2">
                      <input type="date" id={`date-${p.id}`}
                        className="flex-1 px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20" />
                      <button onClick={() => {
                        const input = document.getElementById(`date-${p.id}`) as HTMLInputElement;
                        if (input?.value) { addDateToProgram(p.id, input.value); input.value = ''; }
                      }} className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors">
                        {t('event.add_btn')}
                      </button>
                    </div>
                    {p.dates.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {p.dates.map(d => (
                          <span key={d} className="flex items-center gap-1 bg-[#f8f9fa] border border-[#e0e4e5] px-2.5 py-1 rounded-full text-[11px] font-bold text-[#2d3435]">
                            {d}
                            <button onClick={() => removeDateFromProgram(p.id, d)} className="text-[#acb3b4] hover:text-red-500 transition-colors">
                              <span className="material-symbols-rounded text-[12px]">close</span>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
