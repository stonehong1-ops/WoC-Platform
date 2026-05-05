'use client';

import React, { useState } from 'react';
import { EventProgram } from '@/types/event';

interface Props {
  programs: EventProgram[];
  onChange: (programs: EventProgram[]) => void;
}

export default function ProgramEditor({ programs, onChange }: Props) {
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
          <p className="text-[10px] font-black text-primary uppercase tracking-widest">Programs</p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => addProgram('class')}
            className="text-[10px] font-bold text-primary flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors">
            <span className="material-symbols-rounded text-[14px]">add</span>Class
          </button>
          <button onClick={() => addProgram('milonga')}
            className="text-[10px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full hover:bg-amber-100 transition-colors">
            <span className="material-symbols-rounded text-[14px]">add</span>Milonga
          </button>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {programs.length === 0 && (
          <div className="text-center py-8 text-[#acb3b4]">
            <span className="material-symbols-rounded text-3xl mb-1 opacity-50">event_note</span>
            <p className="text-xs font-bold">No programs yet</p>
            <p className="text-[10px] mt-1">Add classes or milongas above</p>
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
                  <span className="text-sm font-bold text-[#2d3435] truncate max-w-[180px]">{p.title || (isClass ? 'Untitled Class' : 'Untitled Milonga')}</span>
                  <span className="text-[10px] text-[#acb3b4] font-medium">{p.dates.length} dates</span>
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
                      <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1">ID</label>
                      <input value={p.id} onChange={e => updateProgram(p.id, { id: e.target.value })}
                        className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1">Category</label>
                      <input value={p.category || ''} onChange={e => updateProgram(p.id, { category: e.target.value })}
                        className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Group Class" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1">Title (EN)</label>
                    <input value={p.title} onChange={e => updateProgram(p.id, { title: e.target.value })}
                      className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Tango Salon Fundamentals" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1">Title (Native)</label>
                    <input value={p.titleNative || ''} onChange={e => updateProgram(p.id, { titleNative: e.target.value })}
                      className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. 탱고 살롱 기초" />
                  </div>
                  {/* Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1">Start Time</label>
                      <input type="time" value={p.startTime} onChange={e => updateProgram(p.id, { startTime: e.target.value })}
                        className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1">End Time</label>
                      <input type="time" value={p.endTime} onChange={e => updateProgram(p.id, { endTime: e.target.value })}
                        className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>
                  {/* Type-specific */}
                  {isClass ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1">Instructor</label>
                        <input value={p.instructor || ''} onChange={e => updateProgram(p.id, { instructor: e.target.value })}
                          className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20" placeholder="Instructor name" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1">Level</label>
                        <select value={p.level || 'all'} onChange={e => updateProgram(p.id, { level: e.target.value })}
                          className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                          <option value="all">All Level</option>
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="adv">Advanced</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1">DJ</label>
                      <input value={p.djName || ''} onChange={e => updateProgram(p.id, { djName: e.target.value })}
                        className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20" placeholder="DJ name" />
                    </div>
                  )}
                  {/* Capacity */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1">Max Participants (0=∞)</label>
                      <input type="number" min="0" value={p.maxParticipants} onChange={e => updateProgram(p.id, { maxParticipants: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1">Price (per program)</label>
                      <input type="number" min="0" value={p.price || ''} onChange={e => updateProgram(p.id, { price: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20" placeholder="0" />
                    </div>
                  </div>
                  {/* Dates */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1.5">Schedule Dates</label>
                    <div className="flex items-center gap-2 mb-2">
                      <input type="date" id={`date-${p.id}`}
                        className="flex-1 px-3 py-2 border border-[#e0e4e5] rounded-lg bg-[#f8f9fa] text-sm font-bold text-[#2d3435] outline-none focus:ring-2 focus:ring-primary/20" />
                      <button onClick={() => {
                        const input = document.getElementById(`date-${p.id}`) as HTMLInputElement;
                        if (input?.value) { addDateToProgram(p.id, input.value); input.value = ''; }
                      }} className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors">
                        Add
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
