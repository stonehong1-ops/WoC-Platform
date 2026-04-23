import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import GroupShopItemEditor from "./GroupShopItemEditor";
import { Group, ShopItem } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import { toast } from "sonner";

interface GroupShopEditorProps {
  group: Group;
}

const GroupShopEditor: React.FC<GroupShopEditorProps> = ({ group }) => {
  const [activeSegment, setActiveSegment] = useState<"Selling" | "Stopped">("Selling");
  const [activeSubEditor, setActiveSubEditor] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ShopItem | undefined>(undefined);
  const [isUpdating, setIsUpdating] = useState(false);

  // Use shopItems from group prop, default to empty array
  const shopItems: ShopItem[] = group.shopItems || [];

  const filteredItems = shopItems.filter(item => 
    activeSegment === "Selling" ? item.status === "Active" : item.status === "Stopped"
  );

  const handleToggleStatus = async (item: ShopItem) => {
    if (isUpdating) return;
    setIsUpdating(true);
    
    const newStatus = item.status === "Active" ? "Stopped" : "Active";
    const promise = (async () => {
      const updatedShopItems = shopItems.map(si => 
        si.id === item.id ? { ...si, status: newStatus } : si
      );
      
      await groupService.updateGroupMetadata(group.id, {
        shopItems: updatedShopItems
      } as any);
    })();

    toast.promise(promise, {
      loading: "Updating status...",
      success: newStatus === "Active" ? "Item is now on sale." : "Item sale stopped.",
      error: "Failed to update status."
    });

    try {
      await promise;
    } catch (error) {
      console.error("Error updating item status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    toast.custom((t) => (
      <div className="bg-white border border-[var(--outline-variant)]/30 rounded-[28px] p-6 shadow-2xl backdrop-blur-xl max-w-md w-full">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-red-500 text-2xl font-black">delete_forever</span>
          </div>
          <div className="flex-1">
            <h4 className="font-headline font-black text-lg text-[var(--on-surface)] mb-1">Confirm Delete</h4>
            <p className="text-[var(--on-surface-variant)] text-sm font-medium leading-relaxed">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => toast.dismiss(t)}
                className="flex-1 px-4 py-3 rounded-xl bg-[var(--surface-container-highest)] font-headline font-black text-[11px] uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-high)] transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  toast.dismiss(t);
                  executeDelete(itemId);
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500 font-headline font-black text-[11px] uppercase tracking-widest text-white hover:bg-red-600 shadow-lg shadow-red-200 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const executeDelete = async (itemId: string) => {
    setIsUpdating(true);
    const promise = (async () => {
      const updatedShopItems = shopItems.filter(si => si.id !== itemId);
      await groupService.updateGroupMetadata(group.id, {
        shopItems: updatedShopItems
      } as any);
    })();

    toast.promise(promise, {
      loading: "Deleting...",
      success: "Item deleted.",
      error: "Failed to delete item."
    });

    try {
      await promise;
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen font-body bg-transparent pb-32"
    >
      {/* Header */}
      <header className="px-6 py-12 md:py-16 max-w-4xl mx-auto w-full">
        <h1 className="font-headline font-black text-3xl md:text-4xl tracking-tight text-[var(--on-surface)] uppercase">Shop Setting</h1>
        <p className="text-[var(--on-surface-variant)] text-base mt-2 font-medium">Manage your group's items and sales with premium tools.</p>
      </header>

      <main className="max-w-4xl mx-auto px-6 flex flex-col gap-10 w-full">
        {/* Top Action Section */}
        <section className="flex flex-col gap-6">
          {/* Segmented Control */}
          <div className="bg-[var(--surface-container-low)]/50 p-1.5 rounded-[24px] flex items-center shadow-inner border border-white/20 backdrop-blur-md">
            <button 
              onClick={() => setActiveSegment("Selling")}
              className={`flex-1 py-3 px-6 rounded-[20px] font-headline font-black text-sm transition-all text-center ${
                activeSegment === "Selling" 
                  ? "bg-white text-[var(--primary)] shadow-md" 
                  : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
              }`}
            >
              On Sale
            </button>
            <button 
              onClick={() => setActiveSegment("Stopped")}
              className={`flex-1 py-3 px-6 rounded-[20px] font-headline font-black text-sm transition-all text-center ${
                activeSegment === "Stopped" 
                  ? "bg-white text-[var(--primary)] shadow-md" 
                  : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
              }`}
            >
              Stopped
            </button>
          </div>

          {/* Primary Action Button */}
          <button 
            onClick={() => {
              setEditingItem(undefined);
              setActiveSubEditor("shop-item-editor");
            }}
            className="w-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-white font-headline font-black py-5 px-8 rounded-[28px] shadow-2xl shadow-[var(--primary)]/20 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined font-bold">add</span>
            <span className="uppercase tracking-widest text-sm">Add New Item</span>
          </button>
        </section>

        <AnimatePresence>
          {activeSubEditor === "shop-item-editor" && (
            <GroupShopItemEditor 
              group={group} 
              onClose={() => setActiveSubEditor(null)} 
              item={editingItem}
            />
          )}
        </AnimatePresence>

        {/* Item List */}
        <section className="flex flex-col gap-6">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.article 
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white/70 backdrop-blur-md rounded-[32px] p-6 shadow-[var(--shadow-premium)] border border-white/80 flex flex-col md:flex-row gap-6 transition-all hover:shadow-2xl hover:bg-white/90 ${item.status === "Stopped" ? "opacity-75 grayscale-[0.5]" : ""}`}
              >
                <div className={`w-full md:w-32 h-40 md:h-32 rounded-[24px] overflow-hidden flex-shrink-0 border border-white shadow-inner bg-slate-100`}>
                  <ImageWithFallback 
                    alt={item.title} 
                    className="w-full h-full object-cover" 
                    src={item.images?.[0] || ""} 
                    fallbackType="gallery"
                  />
                </div>
                
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block ${
                        item.status === "Active" 
                          ? "text-[var(--primary)] bg-[var(--primary)]/10" 
                          : "text-[var(--on-surface-variant)] bg-[var(--surface-container-high)]"
                      }`}>
                        {item.category}
                      </span>
                      <span className={`text-[11px] font-black uppercase tracking-widest ${item.status === "Active" ? "text-green-600" : "text-[var(--on-surface-variant)]"}`}>
                        {item.status === "Active" ? "On Sale" : "Stopped"}
                      </span>
                    </div>
                    <h3 className={`font-headline font-black text-xl leading-tight ${item.status === "Active" ? "text-[var(--on-surface)]" : "text-[var(--on-surface-variant)]"}`}>
                      {item.title}
                    </h3>
                    <p className={`text-sm font-medium mt-1.5 leading-relaxed ${item.status === "Active" ? "text-[var(--on-surface-variant)]" : "text-[var(--outline)]"}`}>
                      {item.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--outline-variant)]/30">
                    <span className={`font-headline font-black text-2xl ${item.status === "Active" ? "text-[var(--primary)]" : "text-[var(--on-surface-variant)]"}`}>
                      {item.currency === 'KRW' ? '₩' : item.currency === 'USD' ? '$' : ''}{item.price.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => {
                          setEditingItem(item);
                          setActiveSubEditor("shop-item-editor");
                        }}
                        className="p-2.5 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-all active:scale-90"
                      >
                        <span className="material-symbols-outlined text-xl">edit</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2.5 rounded-xl bg-[var(--error-container)]/10 text-[var(--error)] hover:bg-[var(--error-container)] transition-all active:scale-90"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                      {/* Toggle */}
                      <div 
                        onClick={() => handleToggleStatus(item)}
                        className={`w-14 h-7 rounded-full relative transition-all duration-300 shadow-inner cursor-pointer p-1 ${
                          item.status === "Active" ? "bg-[var(--primary)]" : "bg-[var(--outline-variant)]"
                        } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 transform ${
                          item.status === "Active" ? "translate-x-7" : "translate-x-0"
                        }`}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
          
          {filteredItems.length === 0 && (
            <div className="py-24 text-center bg-white/40 rounded-[40px] border-2 border-dashed border-[var(--outline-variant)]/30">
              <span className="material-symbols-outlined text-5xl text-[var(--outline-variant)] mb-4">shopping_bag</span>
              <p className="text-[var(--on-surface-variant)] font-bold text-lg">No items in this category.</p>
              <p className="text-[var(--outline)] text-sm mt-1">Add a new shop item to start selling.</p>
            </div>
          )}
        </section>
      </main>
    </motion.div>

  );
};

export default GroupShopEditor;
