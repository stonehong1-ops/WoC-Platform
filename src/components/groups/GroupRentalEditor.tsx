// 그룹 대관 설정을 통합 제어하고 대관 공간 및 스케줄 그리드를 관리하는 관리자 컴포넌트
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Group, RentalSettings } from "@/types/group";
import { RentalSpace } from "@/types/rental";
import { groupService } from "@/lib/firebase/groupService";
import { rentalService } from "@/lib/firebase/rentalService";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import CreateRentalSpace from "@/components/rental/CreateRentalSpace";
import ImageWithFallback from "@/components/common/ImageWithFallback";
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
  { id: "spaces", label: "Spaces" },
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
  const [activeTab, setActiveTab] = useState<typeof TABS[number]["id"]>("spaces");
  
  const [groupSpaces, setGroupSpaces] = useState<RentalSpace[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSpace, setEditingSpace] = useState<RentalSpace | undefined>(undefined);

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

  // Subscribe to spaces for this group
  useEffect(() => {
    if (!group?.id) return;
    const q = query(collection(db, 'rental_spaces'), where('groupId', '==', group.id));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as RentalSpace);
      setGroupSpaces(list);
    });
    return () => unsub();
  }, [group?.id]);

  const handleCellClick = (day: number, hour: number) => {
    setSelectedCell({ day, hour });
  };

  const handleSaveSettings = async () => {
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

  const handleDeleteSpace = async (spaceId: string) => {
    if (!confirm(t('common.confirm_delete', '정말 삭제하시겠습니까?'))) return;
    try {
      await rentalService.deleteSpace(spaceId);
      toast.success(t('common.deleted', '삭제되었습니다.'));
    } catch (err) {
      console.error("Failed to delete space:", err);
      toast.error(t('common.delete_failed', '삭제 실패했습니다.'));
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
      {/* Title Header */}
      <div className={`px-4 pb-2 flex items-center justify-between gap-4 ${isInline ? 'pt-1' : 'pt-6'}`}>
        <div>
          <span className="text-[11px] font-bold tracking-wider text-primary uppercase block">Rental Space Manager</span>
          <h1 className="font-headline text-[22px] font-black text-on-surface leading-tight">
            {group.name} {t('group.tab.rental_admin') || 'Space & Rate Editor'}
          </h1>
        </div>
        {activeTab === 'spaces' && (
          <button
            type="button"
            onClick={() => {
              setEditingSpace(undefined);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#007AFF] text-white rounded-xl text-xs font-bold active:scale-95 transition-transform shadow-sm shrink-0"
          >
            <span className="material-symbols-rounded text-sm">add</span>
            <span>{t('rental.add_space', '공간 추가')}</span>
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex px-4 gap-2 border-b border-outline/10 mb-4 overflow-x-auto no-scrollbar">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
                isActive
                  ? "border-[#007AFF] text-[#007AFF]"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.id === 'spaces' ? `${tab.label} (${groupSpaces.length})` : tab.label}
            </button>
          );
        })}
      </div>

      <div className="px-4 pb-20">
        {/* SPACES TAB */}
        {activeTab === "spaces" && (
          <div className="space-y-4">
            {groupSpaces.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <span className="material-symbols-rounded text-4xl text-slate-300 mb-2">roofing</span>
                <p className="text-sm font-bold text-slate-600 mb-1">
                  {t('rental.no_spaces', '등록된 대관 공간이 없습니다.')}
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  {t('rental.add_space_desc', '새로운 대관 연습실/스튜디오를 등록하세요.')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSpace(undefined);
                    setShowCreateModal(true);
                  }}
                  className="px-4 py-2.5 bg-[#007AFF] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                >
                  <span className="material-symbols-rounded text-sm">add</span>
                  <span>{t('rental.register_first_space', '첫 번째 공간 등록하기')}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {groupSpaces.map(space => {
                  const mainImage = space.images?.[0] || '';
                  return (
                    <div key={space.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="relative h-40 bg-slate-100 w-full">
                          <ImageWithFallback
                            src={mainImage}
                            alt={space.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-md text-[10px] font-bold">
                            {space.category}
                          </span>
                        </div>
                        <div className="p-4 space-y-1">
                          <h3 className="font-bold text-slate-800 text-base truncate">{space.title}</h3>
                          {space.studioName && (
                            <p className="text-xs text-slate-400 font-medium truncate">{space.studioName}</p>
                          )}
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-xs text-slate-500 font-medium">{space.location}</span>
                            <span className="text-sm font-black text-[#007AFF]">
                              ₩{space.pricePerHour?.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">/ hour</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSpace(space);
                            setShowCreateModal(true);
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors"
                        >
                          {t('common.edit', '수정')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSpace(space.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                        >
                          {t('common.delete', '삭제')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Price Palette Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-headline font-bold text-[16px] text-on-surface">
                  {t('group.rental.palette.title') || "Hourly Price Tiers (Palette)"}
                </h2>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-[#007AFF] text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-transform"
                >
                  {isUpdating ? t('common.saving', '저장 중...') : t('common.save', '저장하기')}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {COLORS.map(c => {
                  const val = settings.pricePalette[c.id as PaletteColor] || 0;
                  return (
                    <div key={c.id} className="p-3 bg-surface-container-lowest border border-outline/10 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3 h-3 rounded-full ${c.bgClass}`} />
                        <span className="text-xs font-bold text-on-surface">{c.label} Tier</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-on-surface-variant font-medium">₩</span>
                        <input
                          type="number"
                          value={val}
                          onChange={(e) => {
                            const newPrice = Number(e.target.value);
                            setSettings(prev => ({
                              ...prev,
                              pricePalette: {
                                ...prev.pricePalette,
                                [c.id]: newPrice
                              }
                            }));
                          }}
                          className="w-full bg-transparent font-bold text-sm text-on-surface border-b border-outline/20 focus:border-primary focus:outline-none py-0.5"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Schedule Grid */}
            <div className="space-y-3">
              <h2 className="font-headline font-bold text-[16px] text-on-surface">
                {t('group.rental.schedule_grid.title') || "Weekly Price Schedule Grid"}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {t('group.rental.schedule_grid.desc') || "Click any hour slot to set its price tier from Tier 1 to Tier 7."}
              </p>

              <div className="bg-surface-container-lowest border border-outline/10 rounded-2xl p-4 overflow-x-auto">
                <div className="min-w-[600px] space-y-2">
                  <div className="grid grid-cols-25 text-center text-[10px] font-bold text-on-surface-variant pb-1 border-b border-outline/10">
                    <div>Day</div>
                    {Array.from({ length: 24 }).map((_, h) => (
                      <div key={h}>{h}</div>
                    ))}
                  </div>
                  {DAYS.map((dayLabel, dayIndex) => (
                    <div key={dayLabel} className="grid grid-cols-25 items-center text-center gap-1">
                      <div className="text-xs font-bold text-on-surface">{dayLabel}</div>
                      {Array.from({ length: 24 }).map((_, hour) => {
                        const tierId = settings.timeGrid[dayIndex]?.[hour] || 'tier1';
                        const colorDef = COLORS.find(c => c.id === tierId) || COLORS[0];
                        return (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => handleCellClick(dayIndex, hour)}
                            className={`h-7 rounded-md transition-transform active:scale-95 ${colorDef.bgClass} flex items-center justify-center text-[9px] font-black border border-black/5`}
                          >
                            {colorDef.label}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REQUESTS TAB */}
        {activeTab === "requests" && (
          <div className="text-center py-12 text-slate-400 text-xs font-bold">
            {t('group.rental.no_requests', '접수된 예약 문의 내역이 없습니다.')}
          </div>
        )}
      </div>

      {/* Create / Edit Space Modal */}
      {showCreateModal && (
        <CreateRentalSpace
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          spaceToEdit={editingSpace}
          initialGroupId={group.id}
          initialGroupName={group.name}
          onSuccess={() => {
            setShowCreateModal(false);
            toast.success(t('common.saved', '저장되었습니다.'));
          }}
        />
      )}

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
