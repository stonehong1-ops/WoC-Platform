'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { lostFoundService } from '@/lib/firebase/lostFoundService';
import { storageService } from '@/lib/firebase/storageService';
import { LostFoundType, LostFoundItem } from '@/types/lostFound';
import { useLanguage } from '@/contexts/LanguageContext';

function RegisterPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { setGlobalNavHidden } = useNavigation();
  const { t } = useLanguage();

  const [type, setType] = useState<LostFoundType>('LOST');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [reward, setReward] = useState<number | ''>('');
  
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing item if editing
  useEffect(() => {
    if (!editId) return;
    const fetchItem = async () => {
      const unsub = lostFoundService.subscribeItem(editId, (data) => {
        if (data) {
          if (data.authorId !== user?.uid) {
            alert(t('lost.register.msg_no_permission'));
            router.back();
            return;
          }
          setType(data.type);
          setTitle(data.title);
          setDescription(data.description || '');
          setLocation(data.location);
          setDate(data.date);
          setReward(data.reward || '');
          setExistingImages(data.images || []);
        }
        unsub();
      });
    };
    fetchItem();
  }, [editId, user, t]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (images.length + existingImages.length + selectedFiles.length > 5) {
        alert(t('lost.register.msg_limit_photos'));
        return;
      }
      setImages(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };
  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert(t('lost.register.msg_login_required'));
      return;
    }
    if (!title.trim() || !location.trim() || !date.trim()) {
      alert(t('lost.register.msg_fill_required'));
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload new images with cumulative progress tracking
      const uploadedUrls: string[] = [];
      if (images.length > 0) {
        setUploadProgress(0);
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const path = `lost_found/${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const url = await storageService.uploadFile(file, path, (progress) => {
            const overall = Math.round(((i * 100) + progress) / images.length);
            setUploadProgress(overall);
          });
          uploadedUrls.push(url);
        }
        setUploadProgress(null);
      }

      const finalImages = [...existingImages, ...uploadedUrls];

      const itemData: Partial<LostFoundItem> = {
        type,
        title,
        description,
        location,
        date,
        reward: reward === '' ? 0 : Number(reward),
        images: finalImages,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhoto: user.photoURL || undefined,
        status: 'SEARCHING',
      };

      if (editId) {
        await lostFoundService.updateItem(editId, itemData);
        alert(t('lost.register.msg_success_update'));
        router.back();
      } else {
        await lostFoundService.addItem(itemData as Omit<LostFoundItem, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'viewsCount'>);
        alert(t('lost.register.msg_success_register'));
        router.back();
      }
    } catch (err) {
      console.error(err);
      alert(t('lost.register.msg_error_occurred'));
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <main className="max-w-md mx-auto h-[100dvh] bg-white flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 h-14 flex items-center justify-between z-50">
        <button type="button" onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform text-slate-700">
          <span className="material-symbols-rounded text-2xl">arrow_back</span>
        </button>
        <h1 className="text-[14px] font-black uppercase tracking-widest text-slate-800">
          {editId ? t('lost.register.title_edit') : t('lost.register.title_register')}
        </h1>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
        {/* Form Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 mt-4 space-y-6 pb-6 text-left no-scrollbar">
          
          {/* Type Toggle */}
          <div className="flex bg-[#f2f4f4] rounded-xl p-1">
            <button type="button" onClick={() => setType('LOST')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${type === 'LOST' ? 'bg-white shadow-sm text-red-500' : 'text-[#596061]'}`}>
              {t('lost.register.type_lost')}
            </button>
            <button type="button" onClick={() => setType('FOUND')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${type === 'FOUND' ? 'bg-white shadow-sm text-primary' : 'text-[#596061]'}`}>
              {t('lost.register.type_found')}
            </button>
          </div>

          {/* Images */}
          <div>
            <label className="block text-xs font-bold text-[#596061] mb-2 uppercase tracking-wider">
              {t('lost.register.upload_photos', { count: images.length + existingImages.length })}
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
                  <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full text-white flex items-center justify-center">
                    <span className="material-symbols-rounded text-[14px]">close</span>
                  </button>
                </div>
              ))}

              {images.map((file, i) => (
                <div key={`new-${i}`} className="w-20 h-20 flex-shrink-0 relative rounded-xl overflow-hidden border border-slate-100">
                  <img src={URL.createObjectURL(file)} alt="Upload preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full text-white flex items-center justify-center">
                    <span className="material-symbols-rounded text-[14px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">{t('lost.register.label_title')} <span className="text-red-400">*</span></label>
              <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('lost.register.placeholder_title')}
                className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">{t('lost.register.label_location')} <span className="text-red-400">*</span></label>
                <input required type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder={t('lost.register.placeholder_location')}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">{t('lost.register.label_date')} <span className="text-red-400">*</span></label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">{t('lost.register.label_reward')}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#acb3b4]">₩</span>
                <input type="number" value={reward} onChange={e => setReward(e.target.value ? Number(e.target.value) : '')} placeholder={t('lost.register.placeholder_reward')}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl pl-9 pr-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">{t('lost.register.label_description')}</label>
              <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)} placeholder={t('lost.register.placeholder_description')}
                className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex-shrink-0 w-full p-4 border-t border-slate-100 bg-white pb-[calc(1rem+env(safe-area-inset-bottom))] z-50">
          <button type="submit" disabled={isSubmitting}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-50">
            {isSubmitting ? (
              uploadProgress !== null ? (
                `${uploadProgress}%`
              ) : (
                editId ? t('lost.register.status_updating') : t('lost.register.status_registering')
              )
            ) : (
              editId ? t('lost.register.button_update') : t('lost.register.button_register')
            )}
          </button>
        </div>
      </form>
    </main>
  );
}

export default function LostFoundRegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <RegisterPageContent />
    </Suspense>
  );
}
