"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Group, RentalSettings } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { toast } from "sonner";

interface GroupRentalEditorProps {
  group: Group;
}

const COLORS = [
  { id: "tier1", label: "T1", hex: "#FEE2E2", bgClass: "bg-red-100", borderClass: "border-red-100", textClass: "text-red-900" },
  { id: "tier2", label: "T2", hex: "#FECACA", bgClass: "bg-red-200", borderClass: "border-red-200", textClass: "text-red-900" },
  { id: "tier3", label: "T3", hex: "#FCA5A5", bgClass: "bg-red-300", borderClass: "border-red-300", textClass: "text-red-900" },
  { id: "tier4", label: "T4", hex: "#F87171", bgClass: "bg-red-400", borderClass: "border-red-400", textClass: "text-white" },
  { id: "tier5", label: "T5", hex: "#EF4444", bgClass: "bg-red-500", borderClass: "border-red-500", textClass: "text-white" },
  { id: "tier6", label: "T6", hex: "#DC2626", bgClass: "bg-red-600", borderClass: "border-red-600", textClass: "text-white" },
  { id: "tier7", label: "T7", hex: "#B91C1C", bgClass: "bg-red-700", borderClass: "border-red-700", textClass: "text-white" },
] as const;

type PaletteColor = typeof COLORS[number]["id"];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TABS = [
  { id: "settings", label: "Settings" },
  { id: "requests", label: "Requests" }
] as const;

const defaultPalette = {
  tier7: 40000,
  tier6: 35000,
  tier5: 30000,
  tier4: 25000,
  tier3: 20000,
  tier2: 15000,
  tier1: 10000,
};

const generateDefaultTimeGrid = () => {
  const grid: Record<number, string[]> = {};
  for (let day = 0; day <= 6; day++) {
    const isWeekend = day === 5 || day === 6;
    grid[day] = Array(24).fill("tier1").map((_, hour) => {
      if (!isWeekend) {
        if (hour >= 0 && hour < 6) return "tier1";
        if (hour >= 6 && hour < 12) return "tier3";
        if (hour >= 12 && hour < 18) return "tier4";
        return "tier5";
      } else {
        if (hour >= 0 && hour < 6) return "tier3";
        if (hour >= 6 && hour < 12) return "tier5";
        if (hour >= 12 && hour < 18) return "tier6";
        return "tier7";
      }
    });
  }
  return grid;
};

const GroupRentalEditor: React.FC<GroupRentalEditorProps> = ({ group }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]["id"]>("settings");
  
  const [settings, setSettings] = useState<RentalSettings>(() => {
    const existing = group.rentalSettings as any;
    if (!existing || !existing.pricePalette || existing.pricePalette.tier1 === undefined) {
      return {
        currency: existing?.currency || "KRW",
        rentalInfo: existing?.rentalInfo || "",
        pricePalette: defaultPalette,
        timeGrid: generateDefaultTimeGrid(),
      };
    }
    return existing as RentalSettings;
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{day: number, hour: number} | null>(null);

  const handleCellClick = (day: number, hour: number) => {
    setSelectedCell({ day, hour });
  };

  const handleSave = async () => {
    if (!window.confirm("저장하시겠습니까?")) return;
    
    try {
      setIsUpdating(true);
      await groupService.updateGroupMetadata(group.id, {
        rentalSettings: settings,
      });
      toast.success("변경내용이 반영되었습니다");
    } catch (error) {
      console.error("Error saving rental settings:", error);
      toast.error("An error occurred while saving settings.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="text-[var(--on-background)] font-body antialiased bg-white min-h-screen pb-32">
      {/* Header & Tabs */}
      <header className="bg-white sticky top-0 z-30 border-b border-[var(--outline-variant)]/20">
        <div className="px-6 py-6 max-w-4xl mx-auto">
          <h1 className="font-headline font-extrabold text-2xl tracking-tight text-[#242C51] mb-6">Rental Manager</h1>
          
          <div className="flex items-center gap-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative pb-3 font-headline font-bold text-[15px] transition-colors ${
                  activeTab === tab.id ? "text-[var(--primary)]" : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="rental-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--primary)] rounded-t-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-20">
        {activeTab === "settings" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-8"
          >
            {/* General Info - Clean Layout */}
            <section className="space-y-4">
              <div>
                <h3 className="font-headline font-bold text-lg text-[var(--on-surface)] mb-1">General Info</h3>
                <p className="font-body text-[13px] text-[var(--on-surface-variant)]">Set currency and provide guidelines for your space.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-1">
                  <label className="font-label font-bold text-[11px] uppercase tracking-wider text-[var(--on-surface-variant)] block">Currency</label>
                  <div className="relative">
                    <select 
                      value={settings.currency}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      className="w-full bg-slate-50 appearance-none border border-[var(--outline-variant)]/20 rounded-xl px-4 py-3 font-body text-[14px] font-medium text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-shadow"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                      <option value="KRW">KRW (₩)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)] pointer-events-none text-sm" data-icon="expand_more">expand_more</span>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="font-label font-bold text-[11px] uppercase tracking-wider text-[var(--on-surface-variant)] block">Rental Info & Rules</label>
                  <textarea 
                    value={settings.rentalInfo || ""}
                    onChange={(e) => setSettings({ ...settings, rentalInfo: e.target.value })}
                    className="w-full bg-slate-50 border border-[var(--outline-variant)]/20 rounded-xl px-4 py-3 font-body text-[14px] text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-shadow resize-none min-h-[100px]" 
                    placeholder="Enter facility rules, parking info, access instructions..." 
                  ></textarea>
                </div>
              </div>
            </section>

            <hr className="border-[var(--outline-variant)]/10" />

            {/* Pricing Palette */}
            <section className="space-y-4">
              <div className="flex flex-col gap-1">
                <h3 className="font-headline font-bold text-lg text-[var(--on-surface)]">Pricing Palette</h3>
                <p className="font-body text-[13px] text-[var(--on-surface-variant)]">Set hourly rates for each color tier.</p>
              </div>
              
              <div className="flex justify-between items-start w-full gap-1">
                {COLORS.map(c => (
                  <div key={c.id} className="flex flex-col items-center flex-1 overflow-hidden">
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full mb-1 sm:mb-2 ${c.bgClass} shadow-sm border border-black/5`}></div>
                    <input 
                      type="number"
                      value={settings.pricePalette[c.id as PaletteColor]}
                      onChange={(e) => setSettings(prev => ({...prev, pricePalette: {...prev.pricePalette, [c.id]: parseFloat(e.target.value) || 0}}))}
                      className="w-full text-center bg-slate-50 border border-[var(--outline-variant)]/30 font-label font-bold text-[9px] sm:text-[11px] text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)]/50 focus:ring-1 focus:ring-[var(--primary)]/50 rounded py-1 px-0.5 shadow-inner"
                      style={{ MozAppearance: 'textfield' }}
                    />
                  </div>
                ))}
              </div>
            </section>

            <hr className="border-[var(--outline-variant)]/10" />

            {/* Time Grid Section - Clean, Box-less */}
            <section className="space-y-4">
              <div className="flex flex-col gap-1">
                <h3 className="font-headline font-bold text-lg text-[var(--on-surface)]">Time Grid</h3>
                <p className="font-body text-[13px] text-[var(--on-surface-variant)]">
                  Tap a time slot to select a pricing tier from the toolbar below.
                </p>
              </div>

              <div className="w-full flex flex-col select-none touch-none">
                {/* Header Row */}
                <div className="flex mb-1.5 border-b border-[var(--outline-variant)]/20 pb-1.5">
                  <div className="w-8 sm:w-10 shrink-0"></div>
                  {DAYS.map((d, idx) => (
                    <div key={d} className={`flex-1 text-center font-label font-bold text-[9px] sm:text-[10px] uppercase ${idx >= 5 ? 'text-[var(--primary)]' : 'text-[var(--on-surface-variant)]'}`}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Grid Rows (0-23) */}
                <div className="flex flex-col gap-0.5 sm:gap-1">
                  {Array.from({length: 24}).map((_, hour) => (
                    <div key={hour} className="flex h-5 sm:h-7 items-center">
                      <div className="w-8 sm:w-10 shrink-0 flex items-center justify-start font-label text-[9px] sm:text-[10px] text-[var(--on-surface-variant)] opacity-70">
                        {hour.toString().padStart(2, '0')}
                      </div>
                      {DAYS.map((_, day) => {
                        const cellColor = settings.timeGrid[day]?.[hour] || "tier1";
                        const colorObj = COLORS.find(c => c.id === cellColor) || COLORS[0];
                        const isSelected = selectedCell?.day === day && selectedCell?.hour === hour;
                        return (
                          <div 
                            key={`${day}-${hour}`} 
                            className="flex-1 px-[1px] h-full cursor-pointer"
                            onClick={() => handleCellClick(day, hour)}
                          >
                            <div className={`w-full h-full flex items-center justify-center rounded-sm transition-all ${colorObj?.bgClass} opacity-90 shadow-sm ${isSelected ? 'border-2 border-black scale-110 z-10 relative' : 'border border-black/5'}`}>
                              <span className={`text-[7px] sm:text-[9px] font-bold tracking-tighter ${colorObj.textClass}`}>
                                {settings.pricePalette[cellColor as PaletteColor]?.toLocaleString() || ""}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="pt-8 flex gap-3">
              <button 
                onClick={() => {
                  if (window.confirm("변경사항을 취소하시겠습니까?")) {
                    router.push(`/groups/${group.id}`);
                  }
                }}
                disabled={isUpdating}
                className="flex-1 bg-slate-100 text-[var(--on-surface-variant)] py-4 rounded-xl font-headline font-bold text-base hover:bg-slate-200 transition-all active:scale-[0.98] duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isUpdating}
                className="flex-[2] bg-[#242C51] text-white py-4 rounded-xl font-headline font-bold text-base hover:bg-black transition-all shadow-lg active:scale-[0.98] duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === "requests" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <span className="material-symbols-outlined text-6xl text-[var(--outline-variant)] mb-4" data-icon="inbox">inbox</span>
            <h3 className="font-headline font-bold text-xl text-[var(--on-surface)] mb-2">No Rental Requests</h3>
            <p className="font-body text-[var(--on-surface-variant)]">When members request a rental, it will appear here.</p>
          </motion.div>
        )}
      </main>

      {/* Bottom Toolbar for Color Selection */}
      <AnimatePresence>
        {selectedCell && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--outline-variant)]/20 z-[100] px-4 py-4 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
          >
            <div className="flex items-center justify-between mb-4 max-w-4xl mx-auto w-full">
              <h3 className="font-headline font-bold text-sm text-[var(--on-surface)]">
                Set color for {DAYS[selectedCell.day]} {selectedCell.hour.toString().padStart(2, '0')}:00
              </h3>
              <button onClick={() => setSelectedCell(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[var(--on-surface-variant)] hover:bg-slate-200 transition-colors">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="flex justify-between items-end w-full max-w-4xl mx-auto px-2 h-[60px]">
              {COLORS.map(c => {
                const isActive = settings.timeGrid[selectedCell.day]?.[selectedCell.hour] === c.id;
                return (
                  <div key={c.id} className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => {
                        setSettings(prev => ({
                          ...prev,
                          timeGrid: {
                            ...prev.timeGrid,
                            [selectedCell.day]: prev.timeGrid[selectedCell.day].map((color, i) => i === selectedCell.hour ? c.id : color)
                          }
                        }));
                      }}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-transform flex-shrink-0 ${c.bgClass} ${isActive ? 'ring-2 ring-offset-2 ring-black scale-110' : 'hover:scale-105 shadow-sm'}`}
                    />
                    <span className="text-[9px] sm:text-[10px] font-bold text-[var(--on-surface-variant)] tracking-tighter">
                      {settings.pricePalette[c.id as PaletteColor]?.toLocaleString() || ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <style dangerouslySetInnerHTML={{__html: `
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
      `}} />
    </div>
  );
};

export default GroupRentalEditor;



