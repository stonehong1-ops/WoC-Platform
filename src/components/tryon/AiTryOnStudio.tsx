'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { db, storage } from '@/lib/firebase/clientApp';
import { collection, doc, setDoc, onSnapshot, query, orderBy, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { shopService } from '@/lib/firebase/shopService';
import { Product } from '@/types/shop';
import TryOnGallery from './TryOnGallery';
import TryOnOptions from './TryOnOptions';

export interface TryOnResult {
  resultId: string;
  productId: string;
  productTitle: string;
  productImageUrl: string;
  userPhotoUrl: string;
  faceReferenceUrls?: string[];
  generatedImageUrl: string;
  storagePath: string;
  options: Record<string, string>;
  model: string;
  createdAt: string;
}

export interface TryOnPhoto {
  photoId: string;
  url: string;
  storagePath: string;
  type: 'body';
  createdAt: string;
}

export interface IdentityRef {
  photoId: string;
  url: string;
  storagePath: string;
  type: 'face';
  selected?: boolean;
  createdAt: string;
}

interface AiTryOnStudioProps {
  initialProductId?: string | null;
}

export default function AiTryOnStudio({ initialProductId }: AiTryOnStudioProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  // Photo states
  const [myPhotos, setMyPhotos] = useState<TryOnPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<TryOnPhoto | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Face reference states
  const [faceRefs, setFaceRefs] = useState<IdentityRef[]>([]);
  const [isUploadingFaceRef, setIsUploadingFaceRef] = useState(false);

  // Product states
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);

  // Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<TryOnResult[]>([]);

  // Options
  const [options, setOptions] = useState({
    locationPreset: 'studio',
    moodPreset: 'minimal',
    frameType: 'full_body',
    posePreset: 'front_standing',
  });

  // Load user photos from Firestore
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'users', user.uid, 'aiTryonPhotos'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const photos: TryOnPhoto[] = snap.docs.map(d => ({ photoId: d.id, ...d.data(), type: 'body' } as TryOnPhoto));
      setMyPhotos(photos);
    });
    return () => unsub();
  }, [user?.uid]);

  // Load face references from Firestore
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'users', user.uid, 'aiIdentityRefs'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const refs: IdentityRef[] = snap.docs.map(d => ({ photoId: d.id, ...d.data(), type: 'face' } as IdentityRef));
      setFaceRefs(refs);
    });
    return () => unsub();
  }, [user?.uid]);

  // Load results from Firestore
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'users', user.uid, 'aiTryonResults'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const res: TryOnResult[] = snap.docs.map(d => ({ resultId: d.id, ...d.data() } as TryOnResult));
      setResults(res);
    });
    return () => unsub();
  }, [user?.uid]);

  // Load all active products
  useEffect(() => {
    const unsub = shopService.subscribeAllProducts((products) => {
      setAllProducts(products);
    });
    return () => unsub();
  }, []);

  // Auto-select product from URL param
  useEffect(() => {
    if (initialProductId && allProducts.length > 0 && !selectedProduct) {
      const found = allProducts.find(p => p.id === initialProductId);
      if (found) setSelectedProduct(found);
    }
  }, [initialProductId, allProducts, selectedProduct]);

  // Upload body photo handler
  const handlePhotoUpload = useCallback(async (file: File) => {
    if (!user?.uid) return;
    setIsUploadingPhoto(true);
    try {
      const photoId = `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const ext = file.name.split('.').pop() || 'jpg';
      const storagePath = `ai-tryon/${user.uid}/photos/${photoId}.${ext}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const photoData: TryOnPhoto = {
        photoId,
        url,
        storagePath,
        type: 'body',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', user.uid, 'aiTryonPhotos', photoId), photoData);
      setSelectedPhoto(photoData);
    } catch (error) {
      console.error('Photo upload failed:', error);
      alert(t('ai_tryon.upload_failed', 'Upload failed. Please try again.'));
    } finally {
      setIsUploadingPhoto(false);
    }
  }, [user?.uid, t]);

  // Upload face reference handler
  const handleFaceRefUpload = useCallback(async (files: FileList) => {
    if (!user?.uid) return;
    const remaining = 10 - faceRefs.length;
    if (remaining <= 0) return;
    setIsUploadingFaceRef(true);
    try {
      const filesToUpload = Array.from(files).slice(0, remaining);
      for (const file of filesToUpload) {
        const photoId = `face-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const ext = file.name.split('.').pop() || 'jpg';
        const storagePath = `ai-tryon/${user.uid}/identity-refs/${photoId}.${ext}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        const refData: IdentityRef = {
          photoId,
          url,
          storagePath,
          type: 'face',
          selected: true,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', user.uid, 'aiIdentityRefs', photoId), refData);
      }
    } catch (error) {
      console.error('Face ref upload failed:', error);
      alert(t('ai_tryon.upload_failed', 'Upload failed. Please try again.'));
    } finally {
      setIsUploadingFaceRef(false);
    }
  }, [user?.uid, faceRefs.length, t]);

  // Toggle face ref selection
  const handleToggleFaceRef = useCallback(async (refItem: IdentityRef) => {
    if (!user?.uid) return;
    await setDoc(doc(db, 'users', user.uid, 'aiIdentityRefs', refItem.photoId), {
      ...refItem,
      selected: !refItem.selected,
    });
  }, [user?.uid]);

  // Delete body photo handler
  const handleDeletePhoto = useCallback(async (photo: TryOnPhoto) => {
    if (!user?.uid) return;
    if (!confirm(t('ai_tryon.delete_confirm', 'Delete this photo?'))) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'aiTryonPhotos', photo.photoId));
      try { await deleteObject(ref(storage, photo.storagePath)); } catch { /* ignore storage errors */ }
      if (selectedPhoto?.photoId === photo.photoId) setSelectedPhoto(null);
    } catch (error) {
      console.error('Photo delete failed:', error);
    }
  }, [user?.uid, selectedPhoto, t]);

  // Delete face ref handler
  const handleDeleteFaceRef = useCallback(async (refItem: IdentityRef) => {
    if (!user?.uid) return;
    if (!confirm(t('ai_tryon.delete_confirm', 'Delete this photo?'))) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'aiIdentityRefs', refItem.photoId));
      try { await deleteObject(ref(storage, refItem.storagePath)); } catch { /* ignore */ }
    } catch (error) {
      console.error('Face ref delete failed:', error);
    }
  }, [user?.uid, t]);

  // Generate handler
  const handleGenerate = useCallback(async () => {
    if (!user?.uid || !selectedPhoto || !selectedProduct) return;
    setIsGenerating(true);
    try {
      const productImage = selectedProduct.images?.[0] || selectedProduct.imageUrl || '';
      const selectedFaceRefs = faceRefs.filter(r => r.selected).map(r => r.url);

      const response = await fetch('/api/ai-tryon/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productImageUrl: productImage,
          userPhotoUrl: selectedPhoto.url,
          faceReferenceUrls: selectedFaceRefs.length > 0 ? selectedFaceRefs : undefined,
          options,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Generation failed');
      }

      // Save generated images to Storage + Firestore
      const genImg = result.generatedImages[0];
      if (genImg) {
        const resultId = `result-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const byteString = atob(genImg.base64);
        const byteArray = new Uint8Array(byteString.length);
        for (let j = 0; j < byteString.length; j++) {
          byteArray[j] = byteString.charCodeAt(j);
        }
        const ext = genImg.mimeType.includes('png') ? 'png' : 'jpg';
        const blob = new Blob([byteArray], { type: genImg.mimeType });
        const storagePath = `ai-tryon/${user.uid}/results/${resultId}.${ext}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);

        const resultData: TryOnResult = {
          resultId,
          productId: selectedProduct.id,
          productTitle: selectedProduct.title || selectedProduct.name || '',
          productImageUrl: productImage,
          userPhotoUrl: selectedPhoto.url,
          faceReferenceUrls: selectedFaceRefs.length > 0 ? selectedFaceRefs : undefined,
          generatedImageUrl: downloadURL,
          storagePath,
          options,
          model: result.model,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', user.uid, 'aiTryonResults', resultId), resultData);
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      const msg = error instanceof Error ? error.message : '';
      alert(t('ai_tryon.generate_failed', 'Generation failed.') + (msg ? '\n' + msg : ''));
    } finally {
      setIsGenerating(false);
    }
  }, [user?.uid, selectedPhoto, selectedProduct, faceRefs, options, t]);

  // Delete result handler
  const handleDeleteResult = useCallback(async (result: TryOnResult) => {
    if (!user?.uid) return;
    if (!confirm(t('ai_tryon.confirm_delete', 'Delete this image?'))) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'aiTryonResults', result.resultId));
      try { await deleteObject(ref(storage, result.storagePath)); } catch { /* ignore */ }
    } catch (error) {
      console.error('Delete result failed:', error);
    }
  }, [user?.uid, t]);

  // Download handler
  const handleDownload = useCallback((result: TryOnResult) => {
    const link = document.createElement('a');
    link.href = result.generatedImageUrl;
    link.download = `tryon-${result.resultId}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Filtered products
  const filteredProducts = productSearch.trim()
    ? allProducts.filter(p =>
        (p.title || p.name || '').toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.groupName || '').toLowerCase().includes(productSearch.toLowerCase())
      )
    : allProducts;

  const canGenerate = !!selectedPhoto && !!selectedProduct && !isGenerating;
  const selectedFaceRefCount = faceRefs.filter(r => r.selected).length;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <span className="material-symbols-outlined text-5xl text-outline mb-4">lock</span>
        <p className="text-on-surface-variant font-bold">{t('my.sign_in_required', 'Sign in required')}</p>
        <button onClick={() => router.push('/')} className="mt-4 px-6 py-2 bg-primary text-white rounded-full text-sm font-bold">
          {t('my.go_home', 'Go Home')}
        </button>
      </div>
    );
  }

  const [faceRefOpen, setFaceRefOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="space-y-4">

          {/* ━━━ Section 1: 얼굴 참조 사진 (아코디언) ━━━ */}
          <div className="rounded-2xl bg-surface-container-lowest border border-surface-container overflow-hidden">
            <button
              onClick={() => setFaceRefOpen(!faceRefOpen)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">face</span>
                <span className="text-xs font-black text-outline uppercase tracking-widest">
                  {t('ai_tryon.face_refs', 'Face Reference Photos')}
                </span>
                {faceRefs.length > 0 && (
                  <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                    {selectedFaceRefCount}/{faceRefs.length}
                  </span>
                )}
                <span className="text-[9px] font-bold text-outline bg-surface-container px-2 py-0.5 rounded-full">
                  {t('ai_tryon.optional', 'Optional')}
                </span>
              </div>
              <span className={`material-symbols-outlined text-[18px] text-outline transition-transform duration-200 ${faceRefOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>

            {faceRefOpen && (
              <div className="px-5 pb-5 border-t border-surface-container">
                {/* Face Ref Upload */}
                <label className={`mt-3 flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl transition-all ${
                  faceRefs.length >= 10
                    ? 'border-surface-container-high bg-surface-container cursor-not-allowed opacity-50'
                    : 'border-surface-container-high cursor-pointer hover:border-primary/40 hover:bg-primary/5 group'
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) handleFaceRefUpload(e.target.files);
                    }}
                    disabled={isUploadingFaceRef || faceRefs.length >= 10}
                  />
                  {isUploadingFaceRef ? (
                    <div className="flex items-center gap-2 text-primary">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-xs font-bold">{t('ai_tryon.uploading', 'Uploading...')}</span>
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xl text-outline group-hover:text-primary transition-colors mb-0.5">add_photo_alternate</span>
                      <span className="text-[10px] font-bold text-on-surface-variant group-hover:text-primary transition-colors">
                        {t('ai_tryon.upload_face_ref', 'Add Face Photo')} ({faceRefs.length}/10)
                      </span>
                    </>
                  )}
                </label>

                {/* Face Ref Thumbnails */}
                {faceRefs.length > 0 ? (
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {faceRefs.map(refItem => (
                      <div
                        key={refItem.photoId}
                        className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all group/face ${
                          refItem.selected
                            ? 'border-primary ring-1 ring-primary/20'
                            : 'border-transparent opacity-50 hover:opacity-80'
                        }`}
                        onClick={() => handleToggleFaceRef(refItem)}
                      >
                        <img src={refItem.url} alt="" className="w-full h-full object-cover" />
                        {refItem.selected && (
                          <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-white !text-[10px]">check</span>
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteFaceRef(refItem); }}
                          className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover/face:opacity-100 hover:bg-error/80 transition-all"
                        >
                          <span className="material-symbols-outlined text-white !text-[8px]">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-center text-[10px] text-outline/60 py-2">
                    {t('ai_tryon.no_face_refs', 'No face references')}
                  </p>
                )}

                {/* Recommendation tip */}
                {faceRefs.length > 0 && faceRefs.length < 5 && (
                  <div className="mt-3 p-2.5 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-[9px] text-blue-700 font-bold leading-normal">
                      {language === 'KR'
                        ? `💡 권장 5~10장. 정면, 45° 좌우, 웃는 얼굴, 무표정 사진을 함께 넣으면 좋습니다. (현재 ${faceRefs.length}장)`
                        : `💡 Recommended 5-10 photos. Include front, 45° angles, smiling, and neutral expressions. (Current: ${faceRefs.length})`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ━━━ Section 2: 착장 원본 사진 ━━━ */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container">
            <h3 className="text-xs font-black text-outline uppercase tracking-widest mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">person</span>
              {t('ai_tryon.body_photo', 'Original Try-On Photo')}
            </h3>

            {/* Upload Button */}
            <label className="mt-3 flex flex-col items-center justify-center p-5 border-2 border-dashed border-surface-container-high rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file);
                }}
                disabled={isUploadingPhoto}
              />
              {isUploadingPhoto ? (
                <div className="flex items-center gap-2 text-primary">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-xs font-bold">{t('ai_tryon.uploading', 'Uploading...')}</span>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-2xl text-outline group-hover:text-primary transition-colors mb-1">add_a_photo</span>
                  <span className="text-[11px] font-bold text-on-surface-variant group-hover:text-primary transition-colors">{t('ai_tryon.upload_new', 'Upload new photo')}</span>
                </>
              )}
            </label>

            {/* Previous Photos */}
            {myPhotos.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-2">{t('ai_tryon.select_previous', 'Previous photos')}</p>
                <div className="grid grid-cols-4 gap-2">
                  {myPhotos.map(photo => (
                    <div
                      key={photo.photoId}
                      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all group/thumb ${
                        selectedPhoto?.photoId === photo.photoId
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-transparent hover:border-primary/30'
                      }`}
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <img src={photo.url} alt="" className="w-full h-full object-cover" />
                      {selectedPhoto?.photoId === photo.photoId && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-white !text-[12px]">check</span>
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo); }}
                        className="absolute bottom-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 hover:bg-error/80 transition-all"
                      >
                        <span className="material-symbols-outlined text-white !text-[10px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Photo Preview */}
            {selectedPhoto && (
              <div className="mt-4 rounded-xl overflow-hidden border border-primary/20">
                <img src={selectedPhoto.url} alt="" className="w-full aspect-[3/4] object-cover" />
              </div>
            )}
          </div>

          {/* ━━━ Section 3: 상품 선택 ━━━ */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container">
            <h3 className="text-xs font-black text-outline uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">checkroom</span>
              {t('ai_tryon.select_product', 'Select Product')}
            </h3>

            {selectedProduct ? (
              <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                <img
                  src={selectedProduct.images?.[0] || selectedProduct.imageUrl || ''}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover bg-surface-container"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">{selectedProduct.title || selectedProduct.name}</p>
                  <p className="text-[10px] text-on-surface-variant font-medium">{selectedProduct.brand} · {selectedProduct.groupName}</p>
                </div>
                <button onClick={() => { setSelectedProduct(null); setShowProductPicker(true); }}
                  className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-error/10 transition-colors">
                  <span className="material-symbols-outlined text-[16px] text-outline">swap_horiz</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowProductPicker(!showProductPicker)}
                className="w-full p-4 border-2 border-dashed border-surface-container-high rounded-xl text-center hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <span className="material-symbols-outlined text-2xl text-outline mb-1">storefront</span>
                <p className="text-[11px] font-bold text-on-surface-variant">{t('ai_tryon.tap_to_select', 'Tap to select a product')}</p>
              </button>
            )}

            {/* Product Picker */}
            {showProductPicker && (
              <div className="mt-3 space-y-2">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-outline">search</span>
                  <input
                    type="text"
                    placeholder={t('ai_tryon.search_product', 'Search products...')}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-surface-container border border-surface-container-high rounded-lg outline-none focus:border-primary text-on-surface"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1 scrollbar-thin">
                  {filteredProducts.slice(0, 20).map(product => (
                    <button
                      key={product.id}
                      onClick={() => { setSelectedProduct(product); setShowProductPicker(false); setProductSearch(''); }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-container transition-colors text-left"
                    >
                      <img
                        src={product.images?.[0] || product.imageUrl || ''}
                        alt=""
                        className="w-10 h-10 rounded-md object-cover bg-surface-container shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-on-surface truncate">{product.title || product.name}</p>
                        <p className="text-[10px] text-on-surface-variant">{product.brand} · {product.groupName}</p>
                      </div>
                    </button>
                  ))}
                  {filteredProducts.length === 0 && (
                    <p className="text-center text-xs text-outline py-4">{t('ai_tryon.no_products', 'No products found')}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ━━━ Section 4: 옵션 + 생성 버튼 ━━━ */}
          <TryOnOptions
            options={options}
            onOptionChange={(key, value) => setOptions(prev => ({ ...prev, [key]: value }))}
            isGenerating={isGenerating}
            canGenerate={canGenerate}
            onGenerate={handleGenerate}
          />

          {/* ━━━ Section 5: 결과 갤러리 ━━━ */}
          <TryOnGallery
            results={results}
            onDownload={handleDownload}
            onDelete={handleDeleteResult}
          />

        </div>
      </div>
    </div>
  );
}
