"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Group } from "@/types/group";
import { Product } from "@/types/shop";
import { shopService } from "@/lib/firebase/shopService";
import { storageService } from "@/lib/firebase/storageService";
import { toast } from "sonner";

interface GroupShopItemEditorProps {
  group: Group;
  onClose: () => void;
  item?: Product;
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
    optionsInput: item?.options?.join(", ") || "",
    stock: item?.stock || 0,
    brand: item?.brand || "",
    discountPrice: item?.discountPrice || "",
    status: item?.status || "Active",
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
      'price': 'price',
      'options': 'optionsInput',
      'stock': 'stock',
      'item-brand': 'brand',
      'discount-price': 'discountPrice',
      'status': 'status'
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

  const handleDelete = async () => {
    if (!isEditing || !item) return;
    if (!confirm("Are you sure you want to delete this item?")) return;
    setIsSaving(true);
    try {
      await shopService.deleteProduct(item.id);
      toast.success("Item deleted.");
      onClose();
    } catch {
      toast.error("Failed to delete.");
    } finally {
      setIsSaving(false);
    }
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
      const optionsArray = formData.optionsInput.split(',').map(s => s.trim()).filter(s => s);

      const productData = {
        groupId: group.id,
        groupName: group.name,
        sellerId: 'adminstone',
        title: formData.title,
        description: formData.description,
        category: formData.category,
        currency: formData.currency,
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
        brand: formData.brand || '',
        images: finalImageUrls,
        options: optionsArray,
        stock: Number(formData.stock),
        status: formData.status as 'Active' | 'Stopped',
        deliveryType: 'both' as const,
      };

      if (isEditing && item) {
        await shopService.updateProduct(item.id, productData);
      } else {
        await shopService.addProduct(productData as any);
      }

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
      className="fixed inset-0 z-[110] bg-[#F1F5F9] text-[#242c51] flex flex-col overflow-y-auto no-scrollbar antialiased min-h-screen font-['Inter']"
    >
      {/* TopAppBar */}
      <header className="bg-white/90 backdrop-blur-3xl docked full-width top-0 tonal shift via bg-slate-100 shadow-sm flex justify-between items-center w-full px-6 py-4 max-w-full sticky z-40">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="text-[#242c51] hover:bg-slate-50 transition-all duration-200 active:scale-[0.99] p-2 -ml-2 rounded-full"
          >
            <span className="material-symbols-outlined" data-icon="close">close</span>
          </button>
          <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold text-[1.5rem] tracking-tight text-slate-900">
            {isEditing ? "Edit Item" : "Add Item"}
          </h1>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#0057bd] text-white font-['Plus_Jakarta_Sans'] font-bold tracking-tight hover:bg-[#0057bd]/90 transition-all duration-200 active:scale-[0.99] px-5 py-2 rounded-lg shadow-sm disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </header>

      {/* Main Canvas */}
      <main className="max-w-3xl mx-auto p-6 space-y-8 mt-4 w-full">
        {/* Status Section */}
        <section className="bg-[#ffffff] rounded-xl shadow-sm p-6 flex justify-between items-center outline outline-1 outline-[#a3abd7]/10">
          <div>
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[14px] uppercase tracking-wide text-[#242c51]">Sale Status</h3>
            <p className="text-xs text-[#515981] mt-1 font-medium">Control whether this item is visible to buyers.</p>
          </div>
          <div 
            onClick={() => setFormData(prev => ({ ...prev, status: prev.status === 'Active' ? 'Stopped' : 'Active' }))}
            className={`w-14 h-7 rounded-full relative cursor-pointer shadow-inner transition-colors duration-300 ${
              formData.status === 'Active' ? 'bg-[#0057bd]' : 'bg-slate-300'
            }`}
          >
            <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300 flex items-center justify-center ${
              formData.status === 'Active' ? 'translate-x-[26px]' : 'translate-x-[2px]'
            }`}>
              {formData.status === 'Active' && <span className="material-symbols-outlined text-[12px] text-[#0057bd] font-bold">check</span>}
            </div>
          </div>
        </section>

        {/* Basic Info Section */}
        <section className="bg-[#ffffff] rounded-xl shadow-sm p-6 space-y-6 outline outline-1 outline-[#a3abd7]/10">
          <div>
            <label className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2" htmlFor="item-title">Item Title</label>
            <input 
              className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 transition-all placeholder:text-[#a3abd7]" 
              id="item-title" 
              placeholder="e.g. Wireless Noise-Cancelling Headphones" 
              type="text"
              value={formData.title}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2" htmlFor="item-description">Item Description</label>
            <textarea 
              className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 transition-all placeholder:text-[#a3abd7] resize-y" 
              id="item-description" 
              placeholder="Describe the item in detail..." 
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
            ></textarea>
          </div>
          <div>
            <label className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2" htmlFor="item-brand">Brand / Manufacturer (Optional)</label>
            <input 
              className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 transition-all placeholder:text-[#a3abd7]" 
              id="item-brand" 
              placeholder="e.g. Comme des Garçons, Nike..." 
              type="text"
              value={formData.brand}
              onChange={handleInputChange}
            />
          </div>
        </section>

        {/* Images Section */}
        <section className="bg-[#ffffff] rounded-xl shadow-sm p-6 space-y-4 outline outline-1 outline-[#a3abd7]/10">
          <div className="flex justify-between items-center">
            <label className="block font-['Inter'] text-[13px] font-medium text-[#515981]">Item Images (Up to 5)</label>
            <span className="font-['Inter'] text-[11px] text-[#a3abd7] uppercase font-bold tracking-wider">{displayImageUrls.length} / 5</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {/* Upload Button */}
            {displayImageUrls.length < 5 && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square bg-[#e4e7ff] border-2 border-dashed border-[#a3abd7]/40 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-[#d6dbff] transition-colors group cursor-pointer active:scale-95 duration-200"
              >
                <span className="material-symbols-outlined text-[#a3abd7] group-hover:text-[#0057bd] transition-colors text-3xl" data-icon="add_photo_alternate">add_photo_alternate</span>
                <span className="font-['Inter'] text-[11px] font-bold uppercase tracking-wider text-[#a3abd7] group-hover:text-[#0057bd] transition-colors">Upload</span>
              </button>
            )}

            {/* Uploaded Images */}
            {displayImageUrls.map((url, index) => (
              <div key={index} className="aspect-square relative group rounded-lg overflow-hidden border border-[#a3abd7]/20">
                <img src={url} alt={`preview ${index}`} className="w-full h-full object-cover" />
                <button 
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}

            {/* Placeholder slots */}
            {Array.from({ length: Math.max(0, 5 - displayImageUrls.length - (displayImageUrls.length < 5 ? 1 : 0)) }).map((_, i) => (
              <div key={`placeholder-${i}`} className={`aspect-square bg-[#F1F5F9] border border-dashed border-[#a3abd7]/20 rounded-lg opacity-50 ${(i === 2 && displayImageUrls.length === 0) ? 'hidden sm:block' : (i >= 3 && displayImageUrls.length === 0) ? 'hidden md:block' : ''}`}></div>
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
        <section className="bg-[#ffffff] rounded-xl shadow-sm p-6 space-y-6 outline outline-1 outline-[#a3abd7]/10">
          <div>
            <label className="block font-['Inter'] text-[13px] font-medium text-[#515981] mb-2" htmlFor="category">Category</label>
            <div className="relative">
              <select 
                className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 transition-all appearance-none pr-10" 
                id="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option disabled value="">Select Category</option>
                <option value="Woman Shoes">Woman Shoes (Tango Shoes, etc)</option>
                <option value="Man Shoes">Man Shoes (Tango Shoes, etc)</option>
                <option value="Woman Wear">Woman Wear (Dresses, Skirts, etc)</option>
                <option value="Man Wear">Man Wear (Suits, Pants, etc)</option>
                <option value="Item">Item / Accessories</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#a3abd7] pointer-events-none" data-icon="expand_more">expand_more</span>
            </div>
          </div>
        </section>

        {/* Options & Inventory */}
        <section className="bg-[#ffffff] rounded-xl shadow-sm p-6 space-y-6 outline outline-1 outline-[#a3abd7]/10">
          <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[14px] uppercase tracking-wide text-[#242c51]">Inventory & Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-['Inter'] text-[11px] font-bold text-[#a3abd7] uppercase tracking-wider mb-2" htmlFor="options">Sizes / Options (Comma separated)</label>
              <input 
                className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 transition-all placeholder:text-[#a3abd7]" 
                id="options" 
                placeholder="e.g. S, M, L or 250, 260" 
                type="text"
                value={formData.optionsInput}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block font-['Inter'] text-[11px] font-bold text-[#a3abd7] uppercase tracking-wider mb-2" htmlFor="stock">Stock Quantity</label>
              <input 
                className="w-full bg-[#F1F5F9] border-0 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 transition-all placeholder:text-[#a3abd7]" 
                id="stock" 
                placeholder="0" 
                type="number"
                min="0"
                value={formData.stock}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-[#ffffff] rounded-xl shadow-sm p-6 space-y-6 outline outline-1 outline-[#a3abd7]/10 mb-8">
          <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[14px] uppercase tracking-wide text-[#242c51]">Pricing</h3>
          <div className="space-y-6">
            <div>
              <label className="block font-['Inter'] text-[11px] font-bold text-[#a3abd7] uppercase tracking-wider mb-2" htmlFor="currency">Currency</label>
              <div className="relative">
                <select 
                  className="w-full bg-[#F1F5F9] border border-[#a3abd7]/20 rounded-lg px-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 transition-all appearance-none pr-10" 
                  id="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="KRW">KRW - South Korean Won</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#a3abd7] pointer-events-none" data-icon="expand_more">expand_more</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-['Inter'] text-[11px] font-bold text-[#a3abd7] uppercase tracking-wider mb-2" htmlFor="price">Original Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#242c51] font-['Inter'] text-[16px] font-semibold">
                    {formData.currency === 'KRW' ? '₩' : formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : ''}
                  </span>
                  <input 
                    className="w-full bg-[#F1F5F9] border border-[#a3abd7]/20 rounded-lg pl-8 pr-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 transition-all placeholder:text-[#a3abd7]" 
                    id="price" 
                    placeholder="0.00" 
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div>
                <label className="block font-['Inter'] text-[11px] font-bold text-[#a3abd7] uppercase tracking-wider mb-2" htmlFor="discount-price">Sale / Discount Price (Optional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#242c51] font-['Inter'] text-[16px] font-semibold">
                    {formData.currency === 'KRW' ? '₩' : formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : ''}
                  </span>
                  <input 
                    className="w-full bg-[#F1F5F9] border border-[#a3abd7]/20 rounded-lg pl-8 pr-4 py-3 text-[#242c51] font-['Inter'] text-[16px] focus:ring-2 focus:ring-[#0057bd]/50 transition-all placeholder:text-[#a3abd7] text-red-600 font-medium" 
                    id="discount-price" 
                    placeholder="0.00" 
                    type="number"
                    min="0"
                    value={formData.discountPrice}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Delete Button */}
        {isEditing && (
          <button
            onClick={handleDelete}
            disabled={isSaving}
            className="w-full py-3 text-red-500 font-bold text-sm rounded-xl border-2 border-red-200 hover:bg-red-50 active:scale-[0.99] transition-all disabled:opacity-50 mb-8"
          >
            Delete This Item
          </button>
        )}
      </main>
    </motion.div>
  );
};

export default GroupShopItemEditor;
