"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { groupService } from "@/lib/firebase/groupService";
import { Group } from "@/types/group";
import { FUNCTION_SECTIONS, FunctionCard } from "@/components/groups/functionBuilderData";
import StepIndicator from "@/components/groups/StepIndicator";

export default function GroupFunctionReviewPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    groupService.getGroup(groupId).then((g) => {
      setGroup(g);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [groupId]);

  // Resolve selected function IDs to full card data
  const selectedCards: FunctionCard[] = React.useMemo(() => {
    if (!group?.selectedFunctions) return [];
    const allCards = FUNCTION_SECTIONS.flatMap((s) => s.cards);
    return group.selectedFunctions
      .map((id) => allCards.find((c) => c.id === id))
      .filter(Boolean) as FunctionCard[];
  }, [group?.selectedFunctions]);

  const totalCost = React.useMemo(() => {
    let cost = 0;
    selectedCards.forEach((card) => {
      const match = card.price.match(/\$(\d+)/);
      if (match) cost += parseInt(match[1], 10);
    });
    return cost;
  }, [selectedCards]);

  const handleNext = () => {
    router.push(`/groups/${groupId}/next`);
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!group || selectedCards.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background flex-col gap-4">
        <span className="material-symbols-outlined text-6xl text-outline-variant">info</span>
        <p className="text-on-surface text-lg font-semibold">No functions selected</p>
        <button onClick={handleBack} className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Step Header */}
      <StepIndicator currentStep={2} groupName={group.name} onBack={handleBack} />

      {/* Main Content */}
      <main className="flex-1 px-5 md:px-16 pt-8 pb-40 max-w-2xl mx-auto w-full">
        {/* Title */}
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

        {/* Function List */}
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
              <span className="text-[14px] font-bold text-primary">{card.price}</span>
            </div>
          ))}
        </div>

        {/* Summary */}
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

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-t border-surface-variant/20 px-5 md:px-16 py-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={handleBack}
            className="flex-1 py-3.5 px-6 border border-surface-variant text-on-surface font-semibold rounded-xl hover:bg-surface-container-high/50 transition-all bg-transparent flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Go back
          </button>
          <button
            onClick={handleNext}
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
