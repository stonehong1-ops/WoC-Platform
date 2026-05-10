"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { groupService } from "@/lib/firebase/groupService";
import { Group } from "@/types/group";
import { FUNCTION_SECTIONS, FunctionCard } from "@/components/groups/functionBuilderData";

type MenuItem = {
  id: string;
  type: "item" | "divider";
  icon?: string;
  label?: string;
};

export default function OrganizeMenuPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load group data from Firestore
  useEffect(() => {
    if (!groupId) return;
    groupService.getGroup(groupId).then((g) => {
      setGroup(g);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [groupId]);

  // Build menu items from selected functions (or restore saved menuOrder)
  useEffect(() => {
    if (!group) return;

    // If there's already a saved menuOrder, use it
    if (group.menuOrder && group.menuOrder.length > 0) {
      setItems(group.menuOrder);
      return;
    }

    // Otherwise, build from selectedFunctions
    if (group.selectedFunctions && group.selectedFunctions.length > 0) {
      const allCards = FUNCTION_SECTIONS.flatMap((s) => s.cards);
      const menuItems: MenuItem[] = [];

      // Group selected functions by section for initial organization
      let lastSectionId = "";
      group.selectedFunctions.forEach((funcId) => {
        const card = allCards.find((c) => c.id === funcId);
        if (!card) return;

        // Find which section this card belongs to
        const section = FUNCTION_SECTIONS.find((s) => s.cards.some((c) => c.id === funcId));
        if (section && section.id !== lastSectionId && menuItems.length > 0) {
          menuItems.push({ id: `div-${Date.now()}-${Math.random()}`, type: "divider" });
          lastSectionId = section.id;
        } else if (!lastSectionId && section) {
          lastSectionId = section.id;
        }

        menuItems.push({
          id: card.id,
          type: "item",
          icon: card.icon,
          label: card.title,
        });
      });

      setItems(menuItems);
    }
  }, [group]);

  const dragItemIndex = useRef<number | null>(null);
  const dragOverItemIndex = useRef<number | null>(null);

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

  const handleApplyStructure = async () => {
    setIsSaving(true);
    try {
      await groupService.updateGroupMetadata(groupId, {
        menuOrder: items,
      });
      toast.success("Menu structure saved successfully!");
      // Navigate back to group home
      router.push(`/groups/${groupId}`);
    } catch (error) {
      console.error("Error saving menu structure:", error);
      toast.error("Failed to save menu structure.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!group || items.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background flex-col gap-4">
        <span className="material-symbols-outlined text-6xl text-outline-variant">info</span>
        <p className="text-on-surface text-lg font-semibold">No menu items to organize</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen flex flex-col">
      <style dangerouslySetInnerHTML={{__html: `
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
        .drag-handle {
            cursor: grab;
        }
        .drag-handle:active {
            cursor: grabbing;
        }
        
        /* Fallbacks for typographic classes missing in tailwind.config.ts */
        .text-label-md { font-size: 14px; line-height: 1.4; letter-spacing: 0.01em; }
        .font-headline-md { font-size: 24px; line-height: 1.3; font-weight: 600; }
      `}} />

      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-margin-mobile h-16 bg-surface/80 backdrop-blur-xl border-b border-surface-variant">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl">hub</span>
          <h1 className="text-label-md font-bold text-on-surface">Menu Structure</h1>
        </div>
        <button onClick={() => router.back()} className="text-primary font-bold text-label-md">Back</button>
      </header>

      <main className="flex-grow pt-20 pb-32 px-margin-mobile max-w-md mx-auto w-full">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-headline-md text-on-surface">Organize Menu</h2>
            <p className="text-on-surface-variant text-label-md mt-1">Drag handles to reorder your menu.</p>
          </div>
          <button 
            onClick={handleAddDivider}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-high text-primary rounded-full text-label-sm font-bold active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Add Divider
          </button>
        </div>

        <div className="space-y-1.5">
          {/* Fixed Dashboard Item */}
          <div className="bg-surface-container-lowest border border-surface-variant/50 py-2.5 px-4 rounded-xl flex items-center gap-3">
            <div className="w-6 flex justify-center">
              <span className="material-symbols-outlined text-outline-variant text-xl">lock</span>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
            </div>
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                <span className="font-bold text-on-surface">Dashboard</span>
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Fixed</span>
              </div>
            </div>
          </div>

          {/* Draggable List Items */}
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
                  <div className="flex-grow font-bold text-on-surface">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Bottom Action Button */}
      <div className="fixed bottom-0 w-full p-6 bg-white/80 backdrop-blur-md border-t border-surface-variant">
        <button 
          onClick={handleApplyStructure}
          disabled={isSaving}
          className="w-full bg-primary text-on-primary h-14 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-primary-container transition-colors active:scale-95 duration-100 disabled:opacity-50"
        >
          <span>{isSaving ? "Saving..." : "Apply Structure"}</span>
          <span className="material-symbols-outlined">check_circle</span>
        </button>
      </div>

      {/* Mobile Screen Bottom Nav Spacer */}
      <div className="md:hidden">
        <div className="h-28"></div>
      </div>
    </div>
  );
}
