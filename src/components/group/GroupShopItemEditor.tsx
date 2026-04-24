"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Group, ShopItem } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { storageService } from "@/lib/firebase/storageService";
import { toast } from "sonner";

interface GroupShopItemEditorProps {
  group: Group;
  onClose: () => void;
  item?: ShopItem;
}

const GroupShopItemEditor: React.FC<GroupShopItemEditorProps> = ({ group, onClose, item }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!item;
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: item?.title || "",
    description: item?.description || "",
    category: item?.category || "",
    currency: item?.currency || "USD",
    price: item?.price || 0,
  });
  
  const [newImages, setNewImages] = useState<File[]>([]);
  const [displayImageUrls, setDisplayImageUrls] = useState<string[]>(item?.images || []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    const fieldMap: Record<string, string> = {
      'item-title': 'title',
      'item-description': 'description',
      'category': 'category',
      'currency': 'currency',
      'price': 'price'
    };
    const field = fieldMap[id] || id;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (displayImageUrls.length + selectedFiles.length > 5) {
        toast.error("You can upload up to 5 images.");
        return;
      }
      
      setNewImages(prev => [...prev, ...selectedFiles]);
      const previewUrls = selectedFiles.map(file => URL.createObjectURL(file));
      setDisplayImageUrls(prev => [...prev, ...previewUrls]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const urlToRemove = displayImageUrls[index];
    if (urlToRemove.startsWith('blob:')) {
      const blobIndex = displayImageUrls.slice(0, index).filter(url => url.startsWith('blob:')).length;
      setNewImages(prev => prev.filter((_, i) => i !== blobIndex));
      URL.revokeObjectURL(urlToRemove);
    }
    setDisplayImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.category || formData.price < 0) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSaving(true);
    try {
      const uploadedUrls = await Promise.all(
        newImages.map((file, index) => 
          storageService.uploadFile(file, `groups/${group.id}/shop/${Date.now()}_${index}`)
        )
      );

      const existingUrls = displayImageUrls.filter(url => !url.startsWith('blob:'));
      const finalImageUrls = [...existingUrls, ...uploadedUrls];

      const currentItems = group.shopItems || [];
      let updatedShopItems: ShopItem[];

      if (isEditing && item) {
        updatedShopItems = currentItems.map(si => 
          si.id === item.id ? {
            ...si,
            title: formData.title,
            description: formData.description,
            category: formData.category,
            currency: formData.currency,
            price: Number(formData.price),
            images: finalImageUrls,
          } : si
        );
      } else {
        const newItem: ShopItem = {
          id: Math.random().toString(36).substring(2, 9),
          title: formData.title,
          description: formData.description,
          category: formData.category,
          currency: formData.currency,
          price: Number(formData.price),
          images: finalImageUrls,
          status: 'Active',
          createdAt: Date.now(),
        };
        updatedShopItems = [...currentItems, newItem];
      }

      await groupService.updateGroupMetadata(group.id, {
        shopItems: updatedShopItems
      } as any);

      toast.success(isEditing ? "Item updated successfully." : "Item added successfully.");
      onClose();
    } catch (error) {
      console.error("Error saving shop item:", error);
      toast.error("An error occurred while saving the item.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[110] bg-[#F1F5F9] flex flex-col overflow-y-auto no-scrollbar font-body text-[#242c51]"
    >
      {/* TopAppBar */}
      <header className="bg-white/90 backdrop-blur-3xl sticky top-0 z-50 border-b border-slate-100 flex justify-between items-center w-full px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="text-on-surface hover:bg-slate-50 transition-all duration-200 active:scale-[0.99] p-2 -ml-2 rounded-full"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <h1 className="font-headline font-extrabold text-[1.5rem] tracking-tight text-slate-900">{isEditing ? "Edit Item" : "Add Item"}</h1>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary text-white font-headline font-bold tracking-tight hover:bg-primary/90 transition-all duration-200 active:scale-[0.99] px-5 py-2 rounded-lg shadow-sm disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </header>

      {/* Main Canvas */}
      <main className="max-w-3xl mx-auto p-6 space-y-8 mt-4 w-full">
        {/* Basic Info Section */}
        <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-6 outline outline-1 outline-outline-variant/10">
          <div>
            <label className="block font-body text-[13px] font-medium text-on-surface-variant mb-2" htmlFor="item-title">Item Title</label>
            <input 
              className="w-full bg-surface-container-low border-0 rounded-lg px-4 py-3 text-on-surface font-body text-[16px] focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-outline-variant" 
              id="item-title" 
              placeholder="e.g. Wireless Noise-Cancelling Headphones" 
              type="text"
              value={formData.title}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label className="block font-body text-[13px] font-medium text-on-surface-variant mb-2" htmlFor="item-description">Item Description</label>
            <textarea 
              className="w-full bg-surface-container-low border-0 rounded-lg px-4 py-3 text-on-surface font-body text-[16px] focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-outline-variant resize-y" 
              id="item-description" 
              placeholder="Describe the item in detail..." 
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
            ></textarea>
          </div>
        </section>

        {/* Images Section */}
        <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-4 outline outline-1 outline-outline-variant/10">
          <div className="flex justify-between items-center">
            <label className="block font-body text-[13px] font-medium text-on-surface-variant">Item Images (Up to 5)</label>
            <span className="font-body text-[11px] text-outline-variant uppercase font-bold tracking-wider">{displayImageUrls.length} / 5</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {displayImageUrls.map((url, index) => (
              <div key={index} className="aspect-square relative group rounded-lg overflow-hidden border border-slate-200">
                <img src={url} alt={`preview ${index}`} className="w-full h-full object-cover" />
                <button 
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}
            
            {displayImageUrls.length < 5 && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square bg-surface-container border-2 border-dashed border-outline-variant/40 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-surface-variant transition-colors group cursor-pointer active:scale-95 duration-200"
              >
                <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors text-3xl">add_photo_alternate</span>
                <span className="font-label text-[11px] font-bold uppercase tracking-wider text-outline-variant group-hover:text-primary transition-colors text-center px-1">Upload</span>
              </button>
            )}

            {/* Placeholder slots */}
            {Array.from({ length: Math.max(0, 5 - displayImageUrls.length - (displayImageUrls.length < 5 ? 1 : 0)) }).map((_, i) => (
              <div key={`placeholder-${i}`} className={`aspect-square bg-surface-container-low border border-dashed border-outline-variant/20 rounded-lg opacity-50 ${i === 2 ? 'hidden sm:block' : i === 3 ? 'hidden md:block' : ''}`}></div>
            ))}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              multiple 
              onChange={handleImageChange}
            />
          </div>
        </section>

        {/* Categorization */}
        <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-6 outline outline-1 outline-outline-variant/10">
          <div>
            <label className="block font-body text-[13px] font-medium text-on-surface-variant mb-2" htmlFor="category">Category</label>
            <div className="relative">
              <select 
                className="w-full bg-surface-container-low border-0 rounded-lg px-4 py-3 text-on-surface font-body text-[16px] focus:ring-2 focus:ring-primary/50 transition-all appearance-none pr-10" 
                id="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option disabled value="">Select Category</option>
                <option value="Electronics">Electronics</option>
                <option value="Audio">Audio</option>
                <option value="Accessories">Accessories</option>
                <option value="Clothes">Clothes</option>
                <option value="Other">Other</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">expand_more</span>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-6 outline outline-1 outline-outline-variant/10 mb-8">
          <h3 className="font-headline font-bold text-[14px] uppercase tracking-wide text-on-surface">Pricing</h3>
          <div className="space-y-6">
            <div>
              <label className="block font-body text-[11px] font-bold text-outline-variant uppercase tracking-wider mb-2" htmlFor="currency">Currency</label>
              <div className="relative">
                <select 
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface font-body text-[16px] focus:ring-2 focus:ring-primary/50 transition-all appearance-none pr-10" 
                  id="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="KRW">KRW - South Korean Won</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">expand_more</span>
              </div>
            </div>
            <div>
              <label className="block font-body text-[11px] font-bold text-outline-variant uppercase tracking-wider mb-2" htmlFor="price">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface font-body text-[16px] font-semibold">
                  {formData.currency === 'KRW' ? '₩' : formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : ''}
                </span>
                <input 
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg pl-8 pr-4 py-3 text-on-surface font-body text-[16px] focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-outline-variant" 
                  id="price" 
                  placeholder="0.00" 
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </motion.div>
  );
};

export default GroupShopItemEditor;
