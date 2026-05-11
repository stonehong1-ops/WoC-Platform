"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Group } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { FUNCTION_SECTIONS } from "./functionBuilderData";
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

const GroupFunctionBuilder = ({ group, onClose }: GroupFunctionBuilderProps) => {
  const router = useRouter();
  const [selectedSet, setSelectedSet] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Collect all mandatory function IDs
  const mandatoryIds = useMemo(() => {
    const ids = new Set<string>();
    FUNCTION_SECTIONS.forEach((section) => {
      section.cards.forEach((card) => {
        if (card.mandatory) ids.add(card.id);
      });
    });
    return ids;
  }, []);

  // Restore from Firestore on mount + always include mandatory
  useEffect(() => {
    const initial = new Set(mandatoryIds);
    if (group.selectedFunctions && group.selectedFunctions.length > 0) {
      group.selectedFunctions.forEach((id: string) => initial.add(id));
    }
    setSelectedSet(initial);
  }, [group.selectedFunctions, mandatoryIds]);

  const toggleFunction = (id: string) => {
    // Prevent toggling mandatory functions
    if (mandatoryIds.has(id)) return;
    setSelectedSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleApply = async () => {
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
      // Navigate to Step 2: Review
      router.push(`/groups/${group.id}/review`);
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

  return (
    <div className="bg-background text-on-surface min-h-screen">
      <style jsx global>{`
        .glass-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.5); }
        .function-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
        @media (max-width: 640px) {
          .function-grid { grid-template-columns: 1fr; gap: 16px; }
        }
      `}</style>

      {/* Step Header */}
      <StepIndicator currentStep={1} groupName={group.name} onBack={onClose} />

      {/* Main Content */}
      <main className="pt-10 pb-40 px-5 md:px-16 max-w-[1440px] mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Header Text */}
        <div className="mb-8">
          <h2 className="text-[18px] md:text-[20px] leading-[1.2] tracking-[-0.02em] font-bold mb-2 text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>WoC Group Function Builder</h2>
          <p className="text-[14px] leading-[1.6] text-on-surface-variant max-w-3xl">Architect your community ecosystem. Select and configure advanced modules to power your collective's unique workflow.</p>
        </div>

        {/* Sections */}
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

      {/* Floating Cart Summary */}
      {selectedCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-inverse-surface/95 backdrop-blur-xl border-t border-white/10 px-5 md:px-16 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">{selectedCount}</div>
            <div>
              <p className="text-inverse-on-surface font-semibold text-sm">Functions Selected</p>
              <p className="text-inverse-on-surface/60 text-xs">Estimated: <span className="font-bold text-inverse-primary">${totalCost}/mo</span></p>
            </div>
          </div>
          <button
            onClick={handleApply}
            disabled={isSaving}
            className="px-8 py-3 rounded-full bg-primary text-on-primary font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Apply Changes"}
          </button>
        </div>
      )}
    </div>
  );
};

export default GroupFunctionBuilder;
