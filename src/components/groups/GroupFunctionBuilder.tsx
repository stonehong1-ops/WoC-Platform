"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Group } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { FUNCTION_SECTIONS, FunctionCard } from "./functionBuilderData";
import StepIndicator from "./StepIndicator";

interface GroupFunctionBuilderProps {
  group: Group;
  onClose?: () => void;
}

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  INSTALLED: { bg: "bg-primary text-white", text: "INSTALLED" },
  ACTIVE: { bg: "bg-secondary-container/10 text-on-secondary-fixed-variant", text: "ACTIVE" },
  ALPHA: { bg: "bg-tertiary-container/10 text-on-tertiary-fixed-variant", text: "ALPHA" },
  MIGRATE: { bg: "bg-outline-variant/30 text-on-surface-variant", text: "MIGRATE" },
};

// Admin function IDs hidden from user review (these are admin-only settings)
const ADMIN_HIDDEN_IDS = new Set(['brand-setting', 'roles-permissions', 'class-setting', 'stay-setting', 'shop-setting', 'rental-setting']);

type MenuItem = {
  id: string;
  type: "item" | "divider";
  icon?: string;
  label?: string;
};

// Map admin-setting IDs to user-facing menu labels
const SETTING_TO_USER: Record<string, { label: string; icon: string }> = {
  'class-setting': { label: 'Class', icon: 'school' },
  'stay-setting': { label: 'Stay', icon: 'bed' },
  'shop-setting': { label: 'Shop', icon: 'storefront' },
  'rental-setting': { label: 'Rental', icon: 'key' },
};

const GroupFunctionBuilder = ({ group, onClose }: GroupFunctionBuilderProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedSet, setSelectedSet] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  
  // Step 3 state
  const [items, setItems] = useState<MenuItem[]>([]);
  const dragItemIndex = useRef<number | null>(null);
  const dragOverItemIndex = useRef<number | null>(null);

  // ==========================================
  // STEP 1 LOGIC
  // ==========================================
  const mandatoryIds = useMemo(() => {
    const ids = new Set<string>();
    FUNCTION_SECTIONS.forEach((section) => {
      section.cards.forEach((card) => {
        if (card.mandatory) ids.add(card.id);
      });
    });
    return ids;
  }, []);

  useEffect(() => {
    const initial = new Set(mandatoryIds);
    if (group.selectedFunctions && group.selectedFunctions.length > 0) {
      group.selectedFunctions.forEach((id: string) => initial.add(id));
    }
    setSelectedSet(initial);
  }, [group.selectedFunctions, mandatoryIds]);

  const toggleFunction = (id: string) => {
    if (mandatoryIds.has(id)) return;
    setSelectedSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApplyStep1 = async () => {
    if (selectedSet.size === 0) {
      toast.error("Please select at least one function.");
      return;
    }
    setIsSaving(true);
    try {
      await groupService.updateGroupMetadata(group.id, {
        selectedFunctions: Array.from(selectedSet),
      });
      toast.success("Functions saved! Proceeding to review...");
      setStep(2);
    } catch (error) {
      console.error("Error saving functions:", error);
      toast.error("Failed to save functions.");
    } finally {
      setIsSaving(false);
    }
  };

  const totalCost = useMemo(() => {
    let cost = 0;
    FUNCTION_SECTIONS.forEach((section) => {
      section.cards.forEach((card) => {
        if (selectedSet.has(card.id)) {
          const match = card.price.match(/\$(\d+)/);
          if (match) cost += parseInt(match[1], 10);
        }
      });
    });
    return cost;
  }, [selectedSet]);

  const selectedCount = selectedSet.size;

  // ==========================================
  // STEP 2 LOGIC
  // ==========================================
  const selectedCards: FunctionCard[] = useMemo(() => {
    const allCards = FUNCTION_SECTIONS.flatMap((s) => s.cards);
    return Array.from(selectedSet)
      .map((id) => allCards.find((c) => c.id === id))
      .filter((c): c is FunctionCard => c != null && !ADMIN_HIDDEN_IDS.has(c.id));
  }, [selectedSet]);

  const handleNextStep2 = () => {
    setStep(3);
  };

  const handleBackStep2 = () => {
    setStep(1);
  };

  // ==========================================
  // STEP 3 LOGIC
  // ==========================================
  useEffect(() => {
    if (step !== 3) return;

    const allCards = FUNCTION_SECTIONS.flatMap((s) => s.cards);
    const selectedFunctionsArray = Array.from(selectedSet);

    if (group.menuOrder && group.menuOrder.length > 0) {
      const excludedIds = new Set(['dashboard', 'about', 'roles-permissions', 'brand-setting']);
      let syncedItems = group.menuOrder.filter(item => 
        item.type === "divider" || (selectedFunctionsArray.includes(item.id) && !excludedIds.has(item.id))
      );

      syncedItems = syncedItems.map(item => {
        if (item.type === "item") {
          const userOverride = SETTING_TO_USER[item.id];
          if (userOverride) {
            return { ...item, icon: userOverride.icon, label: userOverride.label };
          }
          const card = allCards.find(c => c.id === item.id);
          if (card) {
            return { ...item, icon: card.icon, label: card.title };
          }
        }
        return item;
      });

      const existingItemIds = new Set(syncedItems.filter(i => i.type === "item").map(i => i.id));
      const newFunctionIds = selectedFunctionsArray.filter(id => !existingItemIds.has(id) && !excludedIds.has(id));

      if (newFunctionIds.length > 0) {
        let lastSectionId = "";
        const lastItem = syncedItems.filter(i => i.type === "item").pop();
        if (lastItem) {
          const sec = FUNCTION_SECTIONS.find(s => s.cards.some(c => c.id === lastItem.id));
          if (sec) lastSectionId = sec.id;
        }

        newFunctionIds.forEach((funcId) => {
          const card = allCards.find((c) => c.id === funcId);
          if (!card) return;

          const section = FUNCTION_SECTIONS.find((s) => s.cards.some((c) => c.id === funcId));
          if (section && section.id !== lastSectionId && syncedItems.length > 0) {
            syncedItems.push({ id: `div-${Date.now()}-${Math.random()}`, type: "divider" });
            lastSectionId = section.id;
          } else if (!lastSectionId && section) {
            lastSectionId = section.id;
          }

          const userOverrideNew = SETTING_TO_USER[card.id];
          syncedItems.push({
            id: card.id,
            type: "item",
            icon: userOverrideNew?.icon || card.icon,
            label: userOverrideNew?.label || card.title,
          });
        });
      }

      setItems(syncedItems);
      return;
    }

    const menuItems: MenuItem[] = [];
    const excludedIds = new Set(['dashboard', 'about', 'roles-permissions', 'brand-setting']);
    let lastSectionId = "";

    selectedFunctionsArray.forEach((funcId) => {
      if (excludedIds.has(funcId)) return;
      
      const card = allCards.find((c) => c.id === funcId);
      if (!card) return;

      const section = FUNCTION_SECTIONS.find((s) => s.cards.some((c) => c.id === funcId));
      if (section && section.id !== lastSectionId && menuItems.length > 0) {
        menuItems.push({ id: `div-${Date.now()}-${Math.random()}`, type: "divider" });
        lastSectionId = section.id;
      } else if (!lastSectionId && section) {
        lastSectionId = section.id;
      }

      const userOverride = SETTING_TO_USER[card.id];
      menuItems.push({
        id: card.id,
        type: "item",
        icon: userOverride?.icon || card.icon,
        label: userOverride?.label || card.title,
      });
    });

    setItems(menuItems);
  }, [step, selectedSet, group.menuOrder]);

  const onDragStart = (e: React.DragEvent, index: number) => {
    dragItemIndex.current = index;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const onDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragItemIndex.current === null) return;
    if (dragItemIndex.current === index) return;

    dragOverItemIndex.current = index;

    const newItems = [...items];
    const dragItem = newItems[dragItemIndex.current];
    newItems.splice(dragItemIndex.current, 1);
    newItems.splice(dragOverItemIndex.current, 0, dragItem);

    dragItemIndex.current = index;
    setItems(newItems);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDragEnd = () => {
    dragItemIndex.current = null;
    dragOverItemIndex.current = null;
  };

  const handleAddDivider = () => {
    setItems([...items, { id: `div-${Date.now()}`, type: "divider" }]);
  };

  const handleRemoveDivider = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleApplyStep3 = async () => {
    setIsSaving(true);
    try {
      await groupService.updateGroupMetadata(group.id, {
        menuOrder: items,
      });
      toast.success("Menu structure saved successfully!");
      if (onClose) onClose();
    } catch (error) {
      console.error("Error saving menu structure:", error);
      toast.error("Failed to save menu structure.");
    } finally {
      setIsSaving(false);
    }
  };


  // ==========================================
  // RENDER STEP 1
  // ==========================================
  if (step === 1) {
    return (
      <div className="flex flex-col w-full h-full pb-8">
        <style jsx global>{`
          .glass-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.5); }
          .function-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
          @media (max-width: 640px) {
            .function-grid { grid-template-columns: 1fr; gap: 16px; }
          }
        `}</style>

        <StepIndicator currentStep={1} groupName={group.name} onBack={onClose} />

        <main className="pt-10 pb-40 px-4 max-w-[1440px] mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div className="mb-8">
            <h2 className="text-[18px] md:text-[20px] leading-[1.2] tracking-[-0.02em] font-bold mb-2 text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>WoC Group Function Builder</h2>
            <p className="text-[14px] leading-[1.6] text-on-surface-variant max-w-3xl">Architect your community ecosystem. Select and configure advanced modules to power your collective's unique workflow.</p>
          </div>

          {FUNCTION_SECTIONS.map((section) => (
            <section key={section.id} className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <div className={`h-6 w-1 ${section.accentColor} rounded-full`}></div>
                <h3 className="text-[18px] md:text-[20px] leading-[1.2] tracking-[-0.01em] font-bold" style={{ fontFamily: "'Inter', sans-serif" }}>{section.title} <span className="font-medium text-on-surface-variant ml-2 opacity-60 text-[14px] md:text-[16px]">{section.subtitle}</span></h3>
              </div>
              <div className="function-grid">
                {section.cards.map((card) => {
                  const isMandatory = card.mandatory === true;
                  const isSelected = selectedSet.has(card.id);
                  return (
                    <div
                      key={card.id}
                      className={`p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between ${
                        isMandatory
                          ? 'bg-primary text-on-primary border border-primary/80 shadow-lg shadow-primary/20'
                          : isSelected
                            ? 'glass-card bg-primary/5 border-primary/20'
                            : 'glass-card'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className={`material-symbols-outlined text-3xl ${isMandatory ? 'text-on-primary' : 'text-primary'}`}>{card.icon}</span>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                            isMandatory
                              ? 'bg-white/20 text-white'
                              : isSelected
                                ? STATUS_BADGE.INSTALLED.bg
                                : STATUS_BADGE[card.status].bg
                          }`}>
                            {isMandatory ? 'REQUIRED' : isSelected ? 'INSTALLED' : card.status}
                          </span>
                        </div>
                        <h4 className={`text-[18px] font-semibold mb-1 ${isMandatory ? 'text-on-primary' : ''}`} style={{ fontFamily: "'Inter', sans-serif" }}>{card.title} <span className={isMandatory ? 'text-on-primary/60 font-normal' : 'text-on-surface-variant/50 font-normal'}>{card.subtitle}</span></h4>
                        <p className={`text-[14px] leading-[1.4] mb-4 leading-snug ${isMandatory ? 'text-on-primary/70' : 'text-on-surface-variant/70'}`}>{card.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        {card.price !== 'Free' && (
                          <span className={`text-[14px] font-bold ${isMandatory ? 'text-on-primary/80' : 'text-primary'}`}>{card.price}</span>
                        )}
                        {isMandatory ? (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20">
                            <span className="material-symbols-outlined text-[20px] text-on-primary">lock</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleFunction(card.id)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-surface-container-high text-primary group-hover:bg-primary group-hover:text-white'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[20px]">{isSelected ? 'check' : 'add'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </main>

        {selectedCount > 0 && (
          <div className="sticky bottom-0 z-50 bg-inverse-surface/95 backdrop-blur-xl border-t border-white/10 px-4 py-4 flex items-center justify-between mt-auto">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">{selectedCount}</div>
              <div>
                <p className="text-inverse-on-surface font-semibold text-sm">Functions Selected</p>
                <p className="text-inverse-on-surface/60 text-xs">Estimated: <span className="font-bold text-inverse-primary">${totalCost}/mo</span></p>
              </div>
            </div>
            <button
              onClick={handleApplyStep1}
              disabled={isSaving}
              className="px-8 py-3 rounded-full bg-primary text-on-primary font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Apply Changes"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER STEP 2
  // ==========================================
  if (step === 2) {
    if (selectedCards.length === 0) {
      return (
        <div className="flex w-full h-full min-h-[400px] items-center justify-center flex-col gap-4">
          <span className="material-symbols-outlined text-6xl text-outline-variant">info</span>
          <p className="text-on-surface text-lg font-semibold">No functions selected</p>
          <button onClick={handleBackStep2} className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold">Go Back</button>
        </div>
      );
    }

    return (
      <div className="flex flex-col w-full h-full pb-8" style={{ fontFamily: "'Inter', sans-serif" }}>
        <StepIndicator currentStep={2} groupName={group.name} onBack={handleBackStep2} />

        <main className="flex-1 px-4 pt-8 pb-40 max-w-2xl mx-auto w-full">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[24px] md:text-[28px] leading-[1.2] tracking-[-0.02em] font-bold text-on-surface">Review Selection</h2>
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="text-[13px] font-semibold">{selectedCards.length} Active</span>
              </div>
            </div>
            <p className="text-[14px] text-on-surface-variant">Confirm your selected modules and pricing before organizing.</p>
          </div>

          <div className="flex flex-col gap-3 mb-8">
            {selectedCards.map((card) => (
              <div key={card.id} className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl border border-surface-variant/30 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[20px]">{card.icon}</span>
                  </div>
                  <div>
                    <span className="text-[15px] text-on-surface font-semibold">{card.title}</span>
                    <p className="text-[12px] text-on-surface-variant">{card.subtitle}</p>
                  </div>
                </div>
                {card.price !== 'Free' && (
                  <span className="text-[14px] font-bold text-primary">{card.price}</span>
                )}
              </div>
            ))}
          </div>

          <div className="bg-surface-container rounded-2xl p-5 mb-6 border border-surface-variant/20">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[12px] text-on-surface-variant font-medium uppercase tracking-wider mb-1">Total Estimated</p>
                <p className="text-[28px] leading-[1.2] font-bold text-on-surface">${totalCost}<span className="text-[16px] font-normal text-on-surface-variant"> / month</span></p>
              </div>
              <p className="text-[12px] text-on-surface-variant">Starting next billing cycle</p>
            </div>
          </div>
        </main>

        <div className="sticky bottom-0 z-50 bg-surface/90 backdrop-blur-xl border-t border-surface-variant/20 px-4 py-4 mt-auto">
          <div className="max-w-2xl mx-auto flex gap-3">
            <button
              onClick={handleBackStep2}
              className="flex-1 py-3.5 px-6 border border-surface-variant text-on-surface font-semibold rounded-xl hover:bg-surface-container-high/50 transition-all bg-transparent flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Go back
            </button>
            <button
              onClick={handleNextStep2}
              className="flex-[2] py-3.5 px-6 bg-primary text-on-primary font-bold rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              I agree and keep going
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER STEP 3
  // ==========================================
  if (step === 3) {
    if (items.length === 0) {
      return (
        <div className="flex w-full h-full min-h-[400px] items-center justify-center flex-col gap-4">
          <span className="material-symbols-outlined text-6xl text-outline-variant">info</span>
          <p className="text-on-surface text-lg font-semibold">No menu items to organize</p>
          <button onClick={() => setStep(2)} className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold">Go Back</button>
        </div>
      );
    }

    return (
      <div className="flex flex-col w-full h-full pb-8" style={{ fontFamily: "'Inter', sans-serif" }}>
        <style dangerouslySetInnerHTML={{__html: `
          .drag-handle { cursor: grab; }
          .drag-handle:active { cursor: grabbing; }
        `}} />

        <StepIndicator currentStep={3} groupName={group.name} onBack={() => setStep(2)} />

        <main className="flex-1 pt-8 pb-40 px-4 max-w-lg mx-auto w-full">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-[22px] md:text-[24px] leading-[1.3] font-bold text-on-surface">Organize Menu</h2>
              <p className="text-on-surface-variant text-[14px] mt-1">Drag handles to reorder your menu.</p>
            </div>
            <button 
              onClick={handleAddDivider}
              className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-high text-primary rounded-full text-[13px] font-bold active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Add Divider
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="bg-surface-container-lowest border border-surface-variant/50 py-2.5 px-4 rounded-xl flex items-center gap-3">
              <div className="w-6 flex justify-center">
                <span className="material-symbols-outlined text-outline-variant text-xl">lock</span>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-on-surface text-[15px]">Dashboard</span>
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Fixed</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              {items.map((item, index) => {
                if (item.type === "divider") {
                  return (
                    <div 
                      key={item.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, index)}
                      onDragEnter={(e) => onDragEnter(e, index)}
                      onDragOver={onDragOver}
                      onDragEnd={onDragEnd}
                      className="flex items-center gap-3 py-1.5 group"
                    >
                      <div className="w-6 flex justify-center drag-handle">
                        <span className="material-symbols-outlined text-outline-variant/60 text-lg">drag_indicator</span>
                      </div>
                      <div className="flex-grow h-[1px] bg-surface-variant/50"></div>
                      <button 
                        onClick={() => handleRemoveDivider(item.id)}
                        className="text-outline-variant hover:text-error transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div 
                    key={item.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, index)}
                    onDragEnter={(e) => onDragEnter(e, index)}
                    onDragOver={onDragOver}
                    onDragEnd={onDragEnd}
                    className="bg-surface-container-lowest border border-surface-variant/50 py-2.5 px-4 rounded-xl flex items-center gap-3 shadow-sm cursor-grab active:cursor-grabbing"
                  >
                    <div className="w-6 flex justify-center drag-handle">
                      <span className="material-symbols-outlined text-outline-variant">drag_indicator</span>
                    </div>
                    <div className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant">{item.icon}</span>
                    </div>
                    <div className="flex-grow font-bold text-on-surface text-[15px]">{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        <div className="sticky bottom-0 z-50 bg-surface/90 backdrop-blur-xl border-t border-surface-variant/20 px-4 py-4 mt-auto">
          <div className="max-w-lg mx-auto">
            <button 
              onClick={handleApplyStep3}
              disabled={isSaving}
              className="w-full bg-primary text-on-primary h-14 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <span>{isSaving ? "Saving..." : "Apply Structure"}</span>
              <span className="material-symbols-outlined">check_circle</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GroupFunctionBuilder;
