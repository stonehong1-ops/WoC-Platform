// 그룹 상점 아이템을 3단계 마법사 방식으로 등록하고 편집하는 모달 컴포넌트.
"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Group } from "@/types/group";
import { Product } from "@/types/shop";
import { shopService } from "@/lib/firebase/shopService";
import { storageService } from "@/lib/firebase/storageService";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBackButtonClose } from "@/hooks/useBackButtonClose";

interface GroupShopItemEditorProps {
  group: Group;
  onClose: () => void;
  item?: Product;
}

const TOTAL_STEPS = 3;

const GroupShopItemEditor: React.FC<GroupShopItemEditorProps> = ({ group, onClose, item }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!item;
  const { t, language } = useLanguage();
  
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState({
    title: item?.title || "",
    description: item?.description || "",
    category: item?.category || "Shoes",
    currency: item?.currency || "KRW",
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

  // 뒤로가기 통합 조작 - Step > 1이면 이전 스텝, Step === 1이면 이탈 안내 후 닫기
  const handleStep1Back = useCallback(() => {
    const isDirty = formData.title || formData.description || images.length > 0 || formData.price > 0;
    if (isDirty) {
      if (confirm(t('common.confirm_discard') || '작성 중인 내용이 있습니다. 정말 나가시겠습니까?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [formData, images.length, t, onClose]);

  const handleHeaderBack = useCallback(() => {
    if (step > 1) {
      setStep(prev => prev - 1);
    } else {
      handleStep1Back();
    }
  }, [step, handleStep1Back]);

  useBackButtonClose(step === 3, () => setStep(2));
  useBackButtonClose(step === 2, () => setStep(1));
  useBackButtonClose(step === 1, handleStep1Back);

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
        toast.error(t('shop.editor.msg_limit_photos') || 'You can only upload up to 5 photos.');
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
    if (!confirm(t('shop.editor.msg_confirm_delete') || 'Are you sure you want to delete this product?')) return;
    setIsSaving(true);
    try {
      await shopService.deleteProduct(item.id);
      toast.success(t('shop.editor.msg_success_delete') || 'Product deleted successfully.');
      onClose();
    } catch {
      toast.error(t('shop.editor.msg_error_delete') || 'Failed to delete product.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.title.trim() || !formData.category || Number(formData.price) < 0) {
      toast.error(t('shop.editor.msg_fill_required') || 'Please fill in all required fields.');
      return;
    }

    setIsSaving(true);
    try {
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
        name: formData.title,
        description: formData.description,
        category: formData.category,
        currency: formData.currency,
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
        brand: formData.brand || '',
        imageUrl: finalImages[0] || '',
        images: finalImages,
        options: optionsArray,
        stock: Number(formData.stock),
        status: formData.status as 'Active' | 'Stopped',
        deliveryType: 'both' as const,
      };

      if (isEditing && item) {
        await shopService.updateProduct(item.id, productData);
        toast.success(t('shop.editor.msg_success_update') || 'Product updated successfully.');
      } else {
        await shopService.addProduct(productData as any);
        toast.success(t('shop.editor.msg_success_add') || 'Product added successfully.');
      }

      onClose();
    } catch (error) {
      console.error("Error saving shop item:", error);
      toast.error(t('shop.editor.msg_error_save') || 'Failed to save product.');
    } finally {
      setIsSaving(false);
      setUploadProgress(null);
    }
  };

  const isStep1Valid = formData.title.trim().length > 0;
  const isStep2Valid = Number(formData.price) > 0;

  const handleNextOrSave = () => {
    if (step === 1) {
      if (!isStep1Valid) {
        toast.error(t('shop.msg_enter_title') || 'Please enter product title.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!isStep2Valid) {
        toast.error(t('shop.msg_enter_price') || 'Please enter a valid price.');
        return;
      }
      setStep(3);
    } else {
      handleSave();
    }
  };

  if (!mounted) return null;

  const modalTitle = isEditing
    ? (language === 'KR' ? '그룹 상품 수정' : 'Edit Group Product')
    : (language === 'KR' ? '그룹 상품 등록' : 'Add Group Product');

  const stepCategoryTitle = step === 1
    ? (language === 'KR' ? '사진 & 기본 정보' : 'Photos & Basic Info')
    : step === 2
    ? (language === 'KR' ? '가격 & 수량/옵션' : 'Pricing & Stock')
    : (language === 'KR' ? '상세 스토리 & 완료' : 'Story & Submit');

  return createPortal(
    <div className="fixed inset-0 z-[100010] bg-[#FAF8FF] text-slate-800 font-body antialiased flex flex-col animate-in fade-in duration-200 notranslate">
      {/* 1. Standard Header (우측 X버튼 없이 대칭 여백 유지) */}
      <header
        className="fixed top-0 left-0 w-full flex-shrink-0 bg-white border-b border-slate-100 px-4 flex items-center justify-between z-[100010]"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          height: 'calc(56px + env(safe-area-inset-top, 0px))'
        }}
      >
        <button
          type="button"
          onClick={handleHeaderBack}
          className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform text-slate-700"
        >
          <span className="material-symbols-rounded text-2xl">arrow_back</span>
        </button>
        <h1 className="text-[16px] font-bold text-slate-800 truncate">
          {modalTitle}
        </h1>
        <div className="w-10" />
      </header>

      {/* Header Spacer */}
      <div
        className="w-full flex-shrink-0"
        style={{ height: 'calc(56px + env(safe-area-inset-top, 0px))' }}
      />

      {/* 2. Step Indicator Bar */}
      <div className="max-w-2xl mx-auto w-full px-4 mt-3 flex-shrink-0">
        <div className="flex items-center justify-between border border-slate-100 bg-slate-50/80 backdrop-blur rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700">
              {language === 'KR' ? `${step} / ${TOTAL_STEPS} 단계` : `Step ${step} of ${TOTAL_STEPS}`}
            </span>
            <span className="text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-0.5 rounded-full">
              {stepCategoryTitle}
            </span>
          </div>
          <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#007AFF] transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Form Content (Scrollable) */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-4 overflow-y-auto pb-28 space-y-6">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Sale Status Toggle Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">toggle_on</span>
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {t('shop.editor.status_sale') || '판매 상태 설정'}
                </p>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">{formData.status === 'Active' ? '판매 진행 중' : '판매 일시 중단'}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{t('shop.editor.status_sale_desc') || '공개 상태를 설정합니다.'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status: prev.status === 'Active' ? 'Stopped' : 'Active' }))}
                  className={`w-11 h-6 rounded-full relative shadow-inner transition-colors duration-300 ${
                    formData.status === 'Active' ? 'bg-[#007AFF]' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300 flex items-center justify-center ${
                    formData.status === 'Active' ? 'translate-x-5' : 'translate-x-[2px]'
                  }`}>
                    {formData.status === 'Active' && <span className="material-symbols-rounded text-[12px] text-[#007AFF] font-bold">check</span>}
                  </div>
                </button>
              </div>
            </div>

            {/* Photos Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">photo_library</span>
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {language === 'KR' ? '상품 사진' : 'Product Photos'} ({images.length + existingImages.length}/5)
                </p>
              </div>
              <div className="p-4">
                <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0 w-24 h-28 border-2 border-dashed border-[#e0e4e5] rounded-2xl flex flex-col items-center justify-center gap-1 hover:border-[#007AFF] hover:bg-blue-50/50 transition-colors"
                  >
                    <span className="material-symbols-rounded text-2xl text-[#007AFF]">add_a_photo</span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {language === 'KR' ? '사진 추가' : 'Add Photo'}
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />

                  {existingImages.map((url, i) => (
                    <div key={`exist-${i}`} className="relative flex-shrink-0 w-24 h-28 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <img src={url} alt="Existing" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <div className="absolute top-1.5 left-1.5 bg-[#FF9500] text-white text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded shadow-sm z-10">
                          PRIMARY
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeExistingImage(i)}
                        className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
                      >
                        <span className="material-symbols-rounded text-[14px]">close</span>
                      </button>
                    </div>
                  ))}

                  {images.map((file, i) => {
                    const isMainPhoto = (existingImages.length === 0 && i === 0);
                    return (
                      <div key={`new-${i}`} className="relative flex-shrink-0 w-24 h-28 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <img src={URL.createObjectURL(file)} alt="New preview" className="w-full h-full object-cover" />
                        {isMainPhoto && (
                          <div className="absolute top-1.5 left-1.5 bg-[#FF9500] text-white text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded shadow-sm z-10">
                            PRIMARY
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
                        >
                          <span className="material-symbols-rounded text-[14px]">close</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Basic Details Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">info</span>
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {language === 'KR' ? '기본 정보' : 'Basic Information'}
                </p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t('shop.editor.label_title') || '상품명'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="item-title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="예: 탠무브 아카데미 연습용 스튜디오 슈즈"
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm font-bold focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t('shop.editor.label_category') || '카테고리'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3 py-3 text-sm font-bold focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-all"
                  >
                    <option value="Shoes">Shoes (신발)</option>
                    <option value="Dresses">Dresses (의류)</option>
                    <option value="Accessories">Accessories (액세서리)</option>
                    <option value="Bikes">Bikes (자전거)</option>
                    <option value="Yoga Wear">Yoga Wear (요가복)</option>
                    <option value="Equipments">Equipments (장비)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t('shop.editor.label_brand') || '브랜드명'}
                  </label>
                  <input
                    type="text"
                    id="item-brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    placeholder="예: Tangolera / NeoTango"
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm font-bold focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Price Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">payments</span>
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {language === 'KR' ? '가격 및 할인 설정' : 'Pricing & Discount'}
                </p>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex gap-3">
                  <div className="w-[100px] shrink-0">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {t('shop.currency') || '통화'}
                    </label>

                    <select
                      id="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3 py-3 text-sm font-bold focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-all"
                    >
                      <option value="KRW">KRW (₩)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {t('shop.editor.label_price') || '정가'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="price"
                      required
                      min="0"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm font-bold text-right focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t('shop.editor.label_discount_price') || '할인 판매가'}
                  </label>
                  <input
                    type="number"
                    id="discount-price"
                    min="0"
                    value={formData.discountPrice}
                    onChange={handleInputChange}
                    placeholder="미입력 시 정가 적용"
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm font-bold text-red-500 text-right focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Stock & Options Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">inventory</span>
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {language === 'KR' ? '재고 및 선택 옵션' : 'Stock & Options'}
                </p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t('shop.editor.label_stock') || '재고 수량'}
                  </label>
                  <input
                    type="number"
                    id="stock"
                    min="0"
                    value={formData.stock}
                    onChange={handleInputChange}
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm font-bold focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t('shop.editor.label_options') || '선택 옵션 (쉼표 구분)'}
                  </label>
                  <input
                    type="text"
                    id="options"
                    value={formData.optionsInput}
                    onChange={handleInputChange}
                    placeholder="예: 230mm, 235mm, 240mm"
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm font-bold focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Story Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">description</span>
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {language === 'KR' ? '상품 상세 스토리' : 'Product Story'}
                </p>
              </div>
              <div className="p-4">
                <textarea
                  id="item-description"
                  rows={6}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="상품의 소재, 착용감, 상태 등을 자유롭게 소개해 보세요."
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm font-bold focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-all resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Registration Summary Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm p-4 space-y-3">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {language === 'KR' ? '등록 내용 요약 프리뷰' : 'Registration Summary'}
              </p>
              <div className="flex items-center gap-3 bg-[#f8f9fa] p-3 rounded-xl border border-[#e0e4e5]">
                {existingImages[0] || images[0] ? (
                  <img
                    src={existingImages[0] || (images[0] ? URL.createObjectURL(images[0]) : '')}
                    alt="Preview"
                    className="w-14 h-14 object-cover rounded-lg border border-slate-200"
                  />
                ) : (
                  <div className="w-14 h-14 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                    <span className="material-symbols-rounded">image</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 truncate">{formData.title || '상품 제목 미입력'}</h4>
                  <p className="text-xs font-bold text-[#007AFF] mt-0.5">
                    {formData.currency === 'KRW' ? '₩' : '$'}{Number(formData.price).toLocaleString()}
                    {formData.discountPrice ? ` (할인가: ${Number(formData.discountPrice).toLocaleString()})` : ''}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                    {formData.category} · 재고 {formData.stock}개
                  </p>
                </div>
              </div>
            </div>

            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="w-full py-3.5 text-red-500 font-bold text-sm rounded-xl border border-red-200 hover:bg-red-50 active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {t('shop.editor.button_delete') || '상품 삭제하기'}
              </button>
            )}
          </div>
        )}
      </main>

      {/* 4. Fixed Bottom Navigation Bar (노치 및 홈 바 Safe Area 자동 적용) */}
      <footer
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 flex gap-3 items-center justify-between z-[100010] shadow-lg"
        style={{
          paddingTop: '16px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          height: 'calc(76px + env(safe-area-inset-bottom, 0px))'
        }}
      >
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep(prev => prev - 1)}
            disabled={isSaving}
            className="flex-1 py-3.5 rounded-full border border-slate-200 text-slate-700 text-sm font-bold active:scale-95 transition-all disabled:opacity-50"
          >
            {language === 'KR' ? '이전 단계' : 'Previous'}
          </button>
        )}
        <button
          type="button"
          onClick={handleNextOrSave}
          disabled={isSaving || (step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
          className="flex-1 py-3.5 rounded-full bg-[#007AFF] text-white text-sm font-bold active:scale-95 transition-all disabled:opacity-50 shadow-sm"
        >
          {isSaving ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{uploadProgress !== null ? `${uploadProgress}%` : (t('common.saving') || '저장 중...')}</span>
            </div>
          ) : (
            step < TOTAL_STEPS
              ? (language === 'KR' ? '다음 단계' : 'Next Step')
              : (isEditing ? '수정 완료' : '등록 완료')
          )}
        </button>
      </footer>
    </div>,
    document.body
  );
};

export default GroupShopItemEditor;
