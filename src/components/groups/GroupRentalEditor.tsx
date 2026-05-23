// 그룹 대관 설정을 통합 제어하고 스케줄 그리드를 관리하는 관리자 컴포넌트
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Group, RentalSettings } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface GroupRentalEditorProps {
  group: Group;
  onClose?: () => void;
  isInline?: boolean;
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

const GroupRentalEditor: React.FC<GroupRentalEditorProps> = ({ group, onClose, isInline }) => {
  const router = useRouter();
  const { t } = useLanguage();
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

    // Firestore 데이터 정규화 가드 (요일별 항상 온전한 크기 24의 String[] 배열 보장)
    const normalizedGrid: Record<number, string[]> = {};
    for (let day = 0; day <= 6; day++) {
      const rawDayData = existing.timeGrid?.[day] || existing.timeGrid?.[day.toString()];
      if (Array.isArray(rawDayData)) {
        normalizedGrid[day] = Array(24).fill("tier1").map((v, i) => rawDayData[i] || "tier1");
      } else if (rawDayData && typeof rawDayData === "object") {
        normalizedGrid[day] = Array(24).fill("tier1").map((v, i) => rawDayData[i] || rawDayData[i.toString()] || "tier1");
      } else {
        normalizedGrid[day] = Array(24).fill("tier1");
      }
    }

    return {
      currency: existing.currency || "KRW",
      rentalInfo: existing.rentalInfo || "",
      pricePalette: { ...defaultPalette, ...existing.pricePalette },
      timeGrid: normalizedGrid,
    };
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{day: number, hour: number} | null>(null);

  const handleCellClick = (day: number, hour: number) => {
    setSelectedCell({ day, hour });
  };

  const handleSave = async () => {
    if (!window.confirm(t('group.rental.actions.save_confirm') || "Are you sure you want to save?")) return;
    
    try {
      setIsUpdating(true);
      await groupService.updateGroupMetadata(group.id, {
        rentalSettings: settings,
      });
      toast.success(t('group.rental.actions.success_msg') || "Changes have been applied.");
    } catch (error) {
      console.error("Error saving rental settings:", error);
      toast.error(t('group.rental.actions.error_msg') || "An error occurred while saving settings.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={isInline
        ? "w-full text-on-surface font-body antialiased bg-background flex flex-col no-scrollbar"
        : "fixed inset-0 z-[100] text-on-surface font-body antialiased bg-background flex flex-col overflow-y-auto no-scrollbar pb-32"
      }
    >
      {/* Title Header with Stitch Spec */}
      <div className={`px-4 pb-2 flex items-center gap-4 ${isInline ? 'pt-1' : 'pt-6'}`}>
        {!isInline && (
          <button 
            onClick={onClose || (() => router.push(`/groups/${group.id}`))}
            className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-primary/5 transition-all"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        )}
        <div>
          <h1 className="font-headline font-black text-[24px] text-on-surface tracking-tight leading-none mb-1">
            {t('group.rental.title') || "Rental Manager"}
          </h1>
          <p className="text-[13px] text-on-surface-variant">
            {t('group.rental.subtitle') || "Manage rental venues, pricing palette, and time slots."}
          </p>
        </div>
      </div>

      {/* Premium Segmented Tabbar inside Content Area */}
      <div className="px-4 pt-4 pb-2">
        <div className="rounded-2xl bg-surface-container-low border border-outline/5 p-1 flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-[14px] font-bold rounded-xl transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {t(`group.rental.${tab.id}`) || tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full flex-1 pb-32 pt-4">
        {activeTab === "settings" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="w-full"
          >
            {/* General Info Card */}
            <section className="px-4 mb-6">
              <div className="bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.03)] border border-white/20 overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-outline/5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[20px]">info</span>
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-on-surface leading-tight mb-1">
                      {t('group.rental.general_info.title') || "General Info"}
                    </h3>
                    <p className="text-[12px] text-on-surface-variant leading-none">
                      {t('group.rental.general_info.desc') || "Set currency and provide guidelines for your space."}
                    </p>
                  </div>
                </div>
                
                <div className="p-6 space-y-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">
                      {t('group.rental.general_info.currency_label') || "Currency"}
                    </label>
                    <div className="relative">
                      <select 
                        value={settings.currency}
                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[16px] font-medium appearance-none transition-all"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="JPY">JPY (¥)</option>
                        <option value="KRW">KRW (₩)</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">expand_more</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">
                      {t('group.rental.general_info.rules_label') || "Rental Info & Rules"}
                    </label>
                    <textarea 
                      value={settings.rentalInfo || ""}
                      onChange={(e) => setSettings({ ...settings, rentalInfo: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[16px] font-medium transition-all resize-none min-h-[120px]" 
                      placeholder={t('group.rental.general_info.rules_placeholder') || "Enter facility rules, parking info, access instructions..."} 
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Pricing Palette Card */}
            <section className="px-4 mb-6">
              <div className="bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.03)] border border-white/20 overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-outline/5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[20px]">payments</span>
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-on-surface leading-tight mb-1">
                      {t('group.rental.pricing_palette.title') || "Pricing Palette"}
                    </h3>
                    <p className="text-[12px] text-on-surface-variant leading-none">
                      {t('group.rental.pricing_palette.desc') || "Set hourly rates for each color tier."}
                    </p>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start w-full gap-2 overflow-x-auto no-scrollbar pb-2">
                    {COLORS.map(c => (
                      <div key={c.id} className="flex flex-col items-center min-w-[55px] flex-1">
                        <div className={`w-8 h-8 rounded-full mb-2 ${c.bgClass} shadow-sm border border-black/5 flex-shrink-0`}></div>
                        <input 
                          type="number"
                          value={settings.pricePalette[c.id as PaletteColor]}
                          onChange={(e) => setSettings(prev => ({...prev, pricePalette: {...prev.pricePalette, [c.id]: parseFloat(e.target.value) || 0}}))}
                          className="w-full text-center bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-lg py-1.5 px-1 font-label font-bold text-[12px] text-on-surface shadow-inner"
                          style={{ MozAppearance: 'textfield' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Time Grid Card */}
            <section className="px-4 mb-6">
              <div className="bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.03)] border border-white/20 overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-outline/5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-on-surface leading-tight mb-1">
                      {t('group.rental.time_grid.title') || "Time Grid"}
                    </h3>
                    <p className="text-[12px] text-on-surface-variant leading-none">
                      {t('group.rental.time_grid.desc') || "Tap a time slot to select a pricing tier from the toolbar below."}
                    </p>
                  </div>
                </div>
                
                <div className="p-6 overflow-x-auto no-scrollbar">
                  <div className="min-w-[640px] flex flex-col select-none touch-none">
                    {/* Header Row */}
                    <div className="flex mb-3 border-b border-outline/5 pb-2">
                      <div className="w-12 shrink-0"></div>
                      {DAYS.map((d, idx) => (
                        <div key={d} className={`flex-1 text-center font-label font-bold text-[11px] uppercase tracking-wider ${idx >= 5 ? 'text-primary' : 'text-on-surface-variant'}`}>
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* Grid Rows (0-23) */}
                    <div className="flex flex-col gap-1">
                      {Array.from({length: 24}).map((_, hour) => (
                        <div key={hour} className="flex h-7 items-center">
                          <div className="w-12 shrink-0 flex items-center justify-start font-label text-[11px] font-bold text-on-surface-variant opacity-70">
                            {hour.toString().padStart(2, '0')}:00
                          </div>
                          {DAYS.map((_, day) => {
                            const cellColor = settings.timeGrid[day]?.[hour] || "tier1";
                            const colorObj = COLORS.find(c => c.id === cellColor) || COLORS[0];
                            const isSelected = selectedCell?.day === day && selectedCell?.hour === hour;
                            return (
                              <div 
                                key={`${day}-${hour}`} 
                                className="flex-1 px-[2px] h-full cursor-pointer"
                                onClick={() => handleCellClick(day, hour)}
                              >
                                <div className={`w-full h-full flex items-center justify-center rounded-md transition-all ${colorObj?.bgClass} opacity-90 shadow-sm ${isSelected ? 'ring-2 ring-primary ring-offset-1 scale-105 z-10 relative' : 'border border-black/5 hover:opacity-100'}`}>
                                  <span className={`text-[9px] font-black tracking-tighter ${colorObj.textClass}`}>
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
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="px-4 pb-12 flex gap-3">
              <button 
                onClick={() => {
                  if (window.confirm(t('group.rental.actions.cancel_confirm') || "Are you sure you want to cancel your changes?")) {
                    if (onClose) {
                      onClose();
                    } else {
                      router.push(`/groups/${group.id}`);
                    }
                  }
                }}
                disabled={isUpdating}
                className="flex-1 bg-surface-container-high text-on-surface py-4 rounded-xl font-headline font-bold text-[16px] hover:bg-surface-container-highest transition-all duration-200 disabled:opacity-50"
              >
                {t('group.rental.actions.cancel') || "Cancel"}
              </button>
              <button 
                onClick={handleSave}
                disabled={isUpdating}
                className="flex-[2] bg-primary text-on-primary py-4 rounded-2xl font-headline font-bold text-[16px] hover:opacity-90 transition-all shadow-[0_10px_20px_rgba(0,88,188,0.15)] duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (t('group.rental.actions.saving') || "Saving...") : (t('group.rental.actions.save') || "Save Settings")}
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === "requests" && (
          <section className="px-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.03)] border border-white/20 p-12 flex flex-col items-center justify-center text-center"
            >
              <span className="material-symbols-outlined text-6xl text-outline/35 mb-4">inbox</span>
              <h3 className="font-headline font-bold text-xl text-on-surface mb-2">{t('group.rental.requests.empty_title') || "No Rental Requests"}</h3>
              <p className="font-body text-on-surface-variant">{t('group.rental.requests.empty_desc') || "When members request a rental, it will appear here."}</p>
            </motion.div>
          </section>
        )}
      </main>

      {/* Bottom Toolbar for Color Selection */}
      <AnimatePresence>
        {selectedCell && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-outline/5 z-[100] px-4 py-4 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.06)]"
          >
            <div className="flex items-center justify-between mb-4 max-w-4xl mx-auto w-full">
              <h3 className="font-headline font-bold text-[14px] text-on-surface">
                {(t('group.rental.time_grid.color_set_title') || "Set color for {{day}} {{hour}}:00")
                  .replace('{{day}}', DAYS[selectedCell.day])
                  .replace('{{hour}}', selectedCell.hour.toString().padStart(2, '0'))}
              </h3>
              <button onClick={() => setSelectedCell(null)} className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="flex justify-between items-end w-full max-w-4xl mx-auto px-2 gap-1.5 h-[65px] overflow-x-auto no-scrollbar">
              {COLORS.map(c => {
                const isActive = settings.timeGrid[selectedCell.day]?.[selectedCell.hour] === c.id;
                return (
                  <div key={c.id} className="flex flex-col items-center gap-1.5 flex-1 min-w-[45px]">
                    <button
                      onClick={() => {
                        setSettings(prev => {
                          const currentDayGrid = prev.timeGrid[selectedCell.day];
                          const normalizedDayGrid = Array.isArray(currentDayGrid) 
                            ? currentDayGrid 
                            : Array(24).fill("tier1").map((v, i) => {
                                if (currentDayGrid && typeof currentDayGrid === "object") {
                                  return (currentDayGrid as any)[i] || (currentDayGrid as any)[i.toString()] || "tier1";
                                }
                                return "tier1";
                              });
                          return {
                            ...prev,
                            timeGrid: {
                              ...prev.timeGrid,
                              [selectedCell.day]: normalizedDayGrid.map((color, i) => i === selectedCell.hour ? c.id : color)
                            }
                          };
                        });
                      }}
                      className={`w-9 h-9 rounded-full transition-all duration-200 shrink-0 ${c.bgClass} ${isActive ? 'ring-2 ring-primary ring-offset-2 scale-110 shadow-md' : 'hover:scale-105 shadow-sm border border-black/5'}`}
                    />
                    <span className="text-[10px] font-black text-on-surface-variant tracking-tighter">
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
    </motion.div>
  );
};

export default GroupRentalEditor;
