// 그룹 상점 아이템을 등록하고 편집하는 모달 컴포넌트.
"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Group } from "@/types/group";
import { Product } from "@/types/shop";
import { shopService } from "@/lib/firebase/shopService";
import { storageService } from "@/lib/firebase/storageService";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface GroupShopItemEditorProps {
  group: Group;
  onClose: () => void;
  item?: Product;
}

const GroupShopItemEditor: React.FC<GroupShopItemEditorProps> = ({ group, onClose, item }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!item;
  const { t } = useLanguage();
  
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
  
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(item?.images || []);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

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
      if (images.length + existingImages.length + selectedFiles.length > 5) {
        toast.error(t('shop.editor.msg_limit_photos'));
        return;
      }
      setImages(prev => [...prev, ...selectedFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDelete = async () => {
    if (!isEditing || !item) return;
    if (!confirm(t('shop.editor.msg_confirm_delete'))) return;
    setIsSaving(true);
    try {
      await shopService.deleteProduct(item.id);
      toast.success(t('shop.editor.msg_success_delete'));
      onClose();
    } catch {
      toast.error(t('shop.editor.msg_error_delete'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.title.trim() || !formData.category || formData.price < 0) {
      toast.error(t('shop.editor.msg_fill_required'));
      return;
    }

    setIsSaving(true);
    try {
      // 1. Upload new images sequentially with cumulative progress tracking
      const uploadedUrls: string[] = [];
      if (images.length > 0) {
        setUploadProgress(0);
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const path = `groups/${group.id}/shop/${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const url = await storageService.uploadFile(file, path, (progress) => {
            const overall = Math.round(((i * 100) + progress) / images.length);
            setUploadProgress(overall);
          });
          uploadedUrls.push(url);
        }
        setUploadProgress(null);
      }

      const finalImages = [...existingImages, ...uploadedUrls];
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
        images: finalImages,
        options: optionsArray,
        stock: Number(formData.stock),
        status: formData.status as 'Active' | 'Stopped',
        deliveryType: 'both' as const,
      };

      if (isEditing && item) {
        await shopService.updateProduct(item.id, productData);
        toast.success(t('shop.editor.msg_success_update'));
      } else {
        await shopService.addProduct(productData as any);
        toast.success(t('shop.editor.msg_success_add'));
      }

      onClose();
    } catch (error) {
      console.error("Error saving shop item:", error);
      toast.error(t('shop.editor.msg_error_save'));
    } finally {
      setIsSaving(false);
      setUploadProgress(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[110] bg-white flex items-center justify-center"
    >
      <main className="max-w-md w-full h-[100dvh] bg-white flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 h-14 flex items-center justify-between z-50">
          <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform text-slate-700">
            <span className="material-symbols-rounded text-2xl">arrow_back</span>
          </button>
          <h1 className="text-[14px] font-black uppercase tracking-widest text-slate-800">
            {isEditing ? t('shop.editor.title_edit') : t('shop.editor.title_add')}
          </h1>
          <div className="w-10" />
        </div>

        <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
          {/* Form Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 mt-4 space-y-6 pb-6 text-left no-scrollbar">
            
            {/* Sale Status Toggle */}
            <div className="bg-[#f8f9fa] rounded-xl p-4 border border-[#e0e4e5] flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-[#596061] uppercase tracking-wider">{t('shop.editor.status_sale')}</h3>
                <p className="text-[11px] text-[#8e9697] mt-0.5">{t('shop.editor.status_sale_desc')}</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, status: prev.status === 'Active' ? 'Stopped' : 'Active' }))}
                className={`w-14 h-7 rounded-full relative shadow-inner transition-colors duration-300 ${
                  formData.status === 'Active' ? 'bg-primary' : 'bg-slate-300'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300 flex items-center justify-center ${
                  formData.status === 'Active' ? 'translate-x-[26px]' : 'translate-x-[2px]'
                }`}>
                  {formData.status === 'Active' && <span className="material-symbols-rounded text-[12px] text-primary font-bold">check</span>}
                </div>
              </button>
            </div>

            {/* Images Upload Section */}
            <div>
              <label className="block text-xs font-bold text-[#596061] mb-2 uppercase tracking-wider">
                {t('shop.editor.label_photos', { count: images.length + existingImages.length })}
              </label>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-[#acb3b4] rounded-xl text-[#596061] bg-[#f8f9fa] active:scale-95 transition-transform">
                  <span className="material-symbols-rounded text-2xl mb-1">add_a_photo</span>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                
                {existingImages.map((url, i) => (
                  <div key={`existing-${i}`} className="w-20 h-20 flex-shrink-0 relative rounded-xl overflow-hidden border border-slate-100">
                    <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full text-white flex items-center justify-center z-10">
                      <span className="material-symbols-rounded text-[14px]">close</span>
                    </button>
                    {i === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] font-bold text-center py-0.5 uppercase tracking-wider">
                        {t('shop.main_photo')}
                      </div>
                    )}
                  </div>
                ))}

                {images.map((file, i) => {
                  const isMainPhoto = (existingImages.length === 0 && i === 0);
                  return (
                    <div key={`new-${i}`} className="w-20 h-20 flex-shrink-0 relative rounded-xl overflow-hidden border border-slate-100">
                      <img src={URL.createObjectURL(file)} alt="Upload preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full text-white flex items-center justify-center z-10">
                        <span className="material-symbols-rounded text-[14px]">close</span>
                      </button>
                      {isMainPhoto && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] font-bold text-center py-0.5 uppercase tracking-wider">
                          {t('shop.main_photo')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">{t('shop.editor.label_title')} <span className="text-red-400">*</span></label>
                <input required type="text" id="item-title" value={formData.title} onChange={handleInputChange} placeholder={t('shop.editor.placeholder_title')}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">{t('shop.editor.label_description')}</label>
                <textarea rows={4} id="item-description" value={formData.description} onChange={handleInputChange} placeholder={t('shop.editor.placeholder_description')}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none" />
              </div>

              {/* Brand */}
              <div>
                <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">{t('shop.editor.label_brand')}</label>
                <input type="text" id="item-brand" value={formData.brand} onChange={handleInputChange} placeholder={t('shop.editor.placeholder_brand')}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">{t('shop.editor.label_category')} <span className="text-red-400">*</span></label>
                <div className="relative">
                  <select required id="category" value={formData.category} onChange={handleInputChange}
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none pr-10">
                    <option disabled value="">{t('shop.editor.placeholder_category')}</option>
                    <option value="Woman Shoes">{t('shop.editor.cat_woman_shoes')}</option>
                    <option value="Man Shoes">{t('shop.editor.cat_man_shoes')}</option>
                    <option value="Woman Wear">{t('shop.editor.cat_woman_wear')}</option>
                    <option value="Man Wear">{t('shop.editor.cat_man_wear')}</option>
                    <option value="Item">{t('shop.editor.cat_item')}</option>
                  </select>
                  <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-[#acb3b4] pointer-events-none">expand_more</span>
                </div>
              </div>

              {/* Options & Stock */}
              <div className="bg-[#f8f9fa] rounded-xl p-4 border border-[#e0e4e5] space-y-4">
                <h3 className="text-xs font-bold text-[#596061] uppercase tracking-wider">{t('shop.editor.label_inventory')}</h3>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-[#596061] mb-1 uppercase tracking-wider" htmlFor="options">{t('shop.editor.label_options')}</label>
                    <input type="text" id="options" value={formData.optionsInput} onChange={handleInputChange} placeholder={t('shop.editor.placeholder_options')}
                      className="w-full bg-white border border-[#e0e4e5] rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                  </div>
                  <div className="w-28">
                    <label className="block text-[10px] font-bold text-[#596061] mb-1 uppercase tracking-wider" htmlFor="stock">{t('shop.editor.label_stock')}</label>
                    <input type="number" id="stock" min="0" value={formData.stock} onChange={handleInputChange}
                      className="w-full bg-white border border-[#e0e4e5] rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="bg-[#f8f9fa] rounded-xl p-4 border border-[#e0e4e5] space-y-4">
                <h3 className="text-xs font-bold text-[#596061] uppercase tracking-wider">{t('shop.editor.label_pricing')}</h3>
                
                <div>
                  <label className="block text-[10px] font-bold text-[#596061] mb-1 uppercase tracking-wider" htmlFor="currency">{t('shop.editor.label_currency')}</label>
                  <div className="relative">
                    <select id="currency" value={formData.currency} onChange={handleInputChange}
                      className="w-full bg-white border border-[#e0e4e5] rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none pr-10">
                      <option value="USD">USD - US Dollar</option>
                      <option value="KRW">KRW - South Korean Won</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                    <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-[#acb3b4] pointer-events-none">expand_more</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-[#596061] mb-1 uppercase tracking-wider" htmlFor="price">{t('shop.editor.label_price')}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[#acb3b4] text-sm">
                        {formData.currency === 'KRW' ? '₩' : formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : ''}
                      </span>
                      <input required type="number" id="price" min="0" value={formData.price} onChange={handleInputChange}
                        className="w-full bg-white border border-[#e0e4e5] rounded-lg pl-7 pr-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-[#596061] mb-1 uppercase tracking-wider" htmlFor="discount-price">{t('shop.editor.label_discount')}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[#acb3b4] text-sm">
                        {formData.currency === 'KRW' ? '₩' : formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : ''}
                      </span>
                      <input type="number" id="discount-price" min="0" value={formData.discountPrice} onChange={handleInputChange}
                        className="w-full bg-white border border-[#e0e4e5] rounded-lg pl-7 pr-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-red-500 font-bold" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delete Button (Editing Mode only) */}
              {isEditing && (
                <button type="button" onClick={handleDelete} disabled={isSaving}
                  className="w-full py-3.5 text-red-500 font-bold text-sm rounded-xl border border-red-200 hover:bg-red-50 active:scale-[0.98] transition-transform disabled:opacity-50 mt-2">
                  {t('shop.editor.button_delete')}
                </button>
              )}
            </div>
          </div>

          {/* Submit/Save Bar */}
          <div className="flex-shrink-0 w-full p-4 border-t border-slate-100 bg-white pb-[calc(1rem+env(safe-area-inset-bottom))] z-50">
            <button type="submit" disabled={isSaving}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-50">
              {isSaving ? (
                uploadProgress !== null ? (
                  `${uploadProgress}%`
                ) : (
                  t('shop.editor.status_saving')
                )
              ) : (
                t('shop.editor.button_save')
              )}
            </button>
          </div>
        </form>
      </main>
    </motion.div>
  );
};

export default GroupShopItemEditor;
