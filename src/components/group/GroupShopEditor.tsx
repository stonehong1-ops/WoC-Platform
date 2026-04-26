import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
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

  const shopItems: ShopItem[] = group.shopItems || [];

  const filteredItems = shopItems.filter(item => 
    activeSegment === "Selling" ? item.status === "Active" : item.status === "Stopped"
  );

  const handleToggleStatus = async (item: ShopItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the editor when toggling
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

  const handleEditItem = (item: ShopItem) => {
    setEditingItem(item);
    setActiveSubEditor("shop-item-editor");
  };

  return (
    <div className="bg-[#F1F5F9] text-[#242c51] antialiased pb-20 min-h-[max(884px,100dvh)] font-['Inter']">
      {/* TopAppBar */}
      <header className="border-b border-slate-100 px-6 py-5 sticky top-0 z-50 bg-slate-50">
        <div className="max-w-3xl mx-auto flex items-center relative">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">Shop Settings</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Top Action Section */}
        <section className="space-y-4">
          {/* Segmented Control */}
          <div className="bg-slate-200/50 p-1 rounded-xl flex items-center justify-between shadow-inner">
            <button 
              onClick={() => setActiveSegment("Selling")}
              className={`flex-1 py-2 px-4 rounded-lg font-['Plus_Jakarta_Sans'] font-bold text-sm transition-all text-center ${
                activeSegment === "Selling" 
                  ? "bg-[#ffffff] text-[#0057bd] shadow-sm" 
                  : "text-slate-500 font-semibold hover:text-slate-700"
              }`}
            >
              Selling
            </button>
            <button 
              onClick={() => setActiveSegment("Stopped")}
              className={`flex-1 py-2 px-4 rounded-lg font-['Plus_Jakarta_Sans'] font-bold text-sm transition-all text-center ${
                activeSegment === "Stopped" 
                  ? "bg-[#ffffff] text-[#0057bd] shadow-sm" 
                  : "text-slate-500 font-semibold hover:text-slate-700"
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
            className="w-full bg-[#0057bd] text-white font-['Plus_Jakarta_Sans'] font-bold py-3.5 px-6 rounded-xl shadow-md shadow-[#0057bd]/20 flex items-center justify-center gap-2 hover:bg-[#004ca6] transition-colors active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Item
          </button>
        </section>

        {/* Item List */}
        <section className="space-y-4">
          {filteredItems.map((item) => (
            <article 
              key={item.id}
              onClick={() => handleEditItem(item)}
              className={`bg-[#ffffff] rounded-xl p-4 shadow-sm border border-[#a3abd7]/10 flex gap-4 active:scale-[0.99] transition-transform cursor-pointer ${
                item.status === 'Stopped' ? 'opacity-75' : ''
              }`}
            >
              <div className={`w-24 h-24 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 ${item.status === 'Stopped' ? 'grayscale' : ''}`}>
                {item.images?.[0] ? (
                  <ImageWithFallback 
                    alt={item.title} 
                    className="w-full h-full object-cover" 
                    src={item.images[0]} 
                    fallbackType="gallery"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <span className="material-symbols-outlined text-4xl">shopping_bag</span>
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1 ${
                    item.status === 'Active' 
                      ? 'text-[#0057bd] bg-[#6e9fff]/20' 
                      : 'text-slate-500 bg-slate-200'
                  }`}>
                    {item.category || "Uncategorized"}
                  </span>
                  <h3 className={`font-['Plus_Jakarta_Sans'] font-extrabold text-base leading-tight ${
                    item.status === 'Active' ? 'text-[#242c51]' : 'text-slate-500'
                  }`}>
                    {item.title}
                  </h3>
                  <p className={`text-xs font-medium mt-0.5 line-clamp-1 ${
                    item.status === 'Active' ? 'text-[#515981]' : 'text-slate-400'
                  }`}>
                    {item.description}
                  </p>
                </div>
                <div className="flex items-end justify-between mt-2">
                  <div className="flex items-center gap-2">
                    {item.discountPrice ? (
                      <>
                        <span className={`font-['Plus_Jakarta_Sans'] font-bold text-lg ${
                          item.status === 'Active' ? 'text-red-600' : 'text-slate-400'
                        }`}>
                          {item.currency === 'KRW' ? '₩' : item.currency === 'USD' ? '$' : item.currency === 'EUR' ? '€' : ''}{item.discountPrice.toLocaleString()}
                        </span>
                        <span className="font-['Plus_Jakarta_Sans'] font-medium text-xs text-slate-400 line-through">
                          {item.currency === 'KRW' ? '₩' : item.currency === 'USD' ? '$' : item.currency === 'EUR' ? '€' : ''}{item.price?.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <span className={`font-['Plus_Jakarta_Sans'] font-bold text-lg ${
                        item.status === 'Active' ? 'text-[#0057bd]' : 'text-slate-400'
                      }`}>
                        {item.currency === 'KRW' ? '₩' : item.currency === 'USD' ? '$' : item.currency === 'EUR' ? '€' : ''}{item.price?.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${
                      item.status === 'Active' ? 'text-green-600' : 'text-slate-400'
                    }`}>
                      {item.status === 'Active' ? 'Active' : 'Stopped'}
                    </span>
                    {/* Toggle */}
                    <div 
                      onClick={(e) => handleToggleStatus(item, e)}
                      className={`w-10 h-5 rounded-full relative cursor-pointer shadow-inner transition-colors ${
                        item.status === 'Active' ? 'bg-[#0057bd]' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                        item.status === 'Active' ? 'right-0.5' : 'left-0.5'
                      }`}></div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
          
          {filteredItems.length === 0 && (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">inventory_2</span>
              <p className="text-slate-500 font-medium text-sm">
                {activeSegment === "Selling" 
                  ? "No items on sale." 
                  : "No stopped items."}
              </p>
            </div>
          )}
        </section>
      </main>

      <AnimatePresence>
        {activeSubEditor === "shop-item-editor" && (
          <GroupShopItemEditor 
            group={group} 
            onClose={() => setActiveSubEditor(null)} 
            item={editingItem}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupShopEditor;

