'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { rentalService } from '@/lib/firebase/rentalService';
import { storageService } from '@/lib/firebase/storageService';
import { RentalSpace } from '@/types/rental';
import { useLanguage } from '@/contexts/LanguageContext';

const CATEGORIES = ['Dance Studio', 'Party Room', 'Practice Room'];

function RegisterPageContent() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { setGlobalNavHidden } = useNavigation();

  useEffect(() => {
    setGlobalNavHidden(true);
    return () => setGlobalNavHidden(false);
  }, [setGlobalNavHidden]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [pricePerHour, setPricePerHour] = useState<number | ''>('');
  const [minHours, setMinHours] = useState<number | ''>(1);
  const [facilitiesInput, setFacilitiesInput] = useState('');
  const [rules, setRules] = useState('');
  
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing item if editing
  useEffect(() => {
    if (!editId) return;
    const fetchItem = async () => {
      try {
        const data = await rentalService.getSpace(editId);
        if (data) {
          if (data.hostId !== user?.uid) {
            alert(t('rental.register.msg_no_permission'));
            router.back();
            return;
          }
          setTitle(data.title);
          setDescription(data.description || '');
          setLocation(data.location);
          setAddress(data.address);
          setCategory(data.category);
          setPricePerHour(data.pricePerHour || '');
          setMinHours(data.minHours || 1);
          setFacilitiesInput(data.facilities?.join(', ') || '');
          setRules(data.rules || '');
          setExistingImages(data.images || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchItem();
  }, [editId, user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (images.length + existingImages.length + selectedFiles.length > 5) {
        alert(t('rental.register.msg_limit_photos'));
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

  const handleSubmit = async () => {
    if (!user) {
      alert(t('rental.register.msg_login_required'));
      return;
    }
    if (!title.trim() || !location.trim() || !address.trim() || pricePerHour === '' || minHours === '') {
      alert(t('rental.register.msg_fill_required'));
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload new images
      const uploadedUrls: string[] = [];
      if (images.length > 0) {
        setUploadProgress(0);
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const path = `rental/${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const url = await storageService.uploadFile(file, path, (progress) => {
            const overall = Math.round(((i * 100) + progress) / images.length);
            setUploadProgress(overall);
          });
          uploadedUrls.push(url);
        }
        setUploadProgress(null);
      }

      const finalImages = [...existingImages, ...uploadedUrls];
      const facilities = facilitiesInput.split(',').map(s => s.trim()).filter(Boolean);

      const spaceData: Partial<RentalSpace> = {
        title,
        description,
        location,
        address,
        category,
        pricePerHour: Number(pricePerHour),
        minHours: Number(minHours),
        facilities,
        rules,
        images: finalImages,
        hostId: user.uid,
        regularClasses: [], // MVP for now
      };

      if (editId) {
        await rentalService.updateSpace(editId, spaceData);
        router.back();
      } else {
        const newId = await rentalService.addSpace(spaceData as Omit<RentalSpace, 'id' | 'createdAt' | 'updatedAt' | 'likesCount'>);
        router.replace('/create-success?type=rental&id=' + newId);
      }
    } catch (err) {
      console.error(err);
      alert(t('rental.register.msg_error_occurred'));
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
        <h1 className="text-[16px] font-bold text-slate-800">
          {editId ? t('rental.register.button_update') : t('rental.register.button_register')}
        </h1>
        <button type="button" onClick={handleSubmit} disabled={isSubmitting}
          className="px-5 py-2 rounded-full bg-[#007AFF] text-white text-[14px] font-bold disabled:opacity-50 active:scale-95 transition-all">
          {isSubmitting ? (uploadProgress !== null ? `${uploadProgress}%` : (editId ? t('rental.register.status_updating') : t('rental.register.status_registering'))) : (editId ? t('rental.register.button_update') : t('rental.register.button_register'))}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 mt-4 space-y-6 pb-6 no-scrollbar">
        
        {/* Category Toggle */}
        <div className="flex bg-[#f2f4f4] rounded-xl p-1">
          {CATEGORIES.map(c => {
            let key = '';
            if (c === 'Dance Studio') key = 'rental.register.category_dance_studio';
            else if (c === 'Party Room') key = 'rental.register.category_party_room';
            else if (c === 'Practice Room') key = 'rental.register.category_practice_room';
            return (
              <button key={c} type="button" onClick={() => setCategory(c)}
                className={`flex-1 py-2.5 text-[14px] font-bold rounded-lg transition-all ${category === c ? 'bg-white shadow-sm text-primary' : 'text-[#596061]'}`}>
                {t(key)}
              </button>
            );
          })}
        </div>

        {/* Images */}
        <div>
          <label className="block text-[14px] font-bold text-[#596061] mb-2">
            {t('rental.register.upload_photos').replace('{count}', (images.length + existingImages.length).toString())}
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
            <label className="block text-[14px] font-bold text-[#596061] mb-1.5">{t('rental.register.label_title')} <span className="text-red-400">*</span></label>
            <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('rental.register.placeholder_title')}
              className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-[16px] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[14px] font-bold text-[#596061] mb-1.5">{t('rental.register.label_location')} <span className="text-red-400">*</span></label>
              <input required type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder={t('rental.register.placeholder_location')}
                className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-[16px] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
            </div>
            <div className="flex-1">
              <label className="block text-[14px] font-bold text-[#596061] mb-1.5">{t('rental.register.label_address')} <span className="text-red-400">*</span></label>
              <input required type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder={t('rental.register.placeholder_address')}
                className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-[16px] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[14px] font-bold text-[#596061] mb-1.5">{t('rental.register.label_price')} <span className="text-red-400">*</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#acb3b4]">₩</span>
                <input required type="number" min="0" value={pricePerHour} onChange={e => setPricePerHour(e.target.value ? Number(e.target.value) : '')} placeholder="10000"
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl pl-9 pr-4 py-3 text-[16px] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-[14px] font-bold text-[#596061] mb-1.5">{t('rental.register.label_min_hours')} <span className="text-red-400">*</span></label>
              <div className="relative">
                <input required type="number" min="1" value={minHours} onChange={e => setMinHours(e.target.value ? Number(e.target.value) : '')} placeholder="1"
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-[16px] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-right pr-12" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#acb3b4]">hrs</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[14px] font-bold text-[#596061] mb-1.5">{t('rental.register.label_facilities')}</label>
            <input type="text" value={facilitiesInput} onChange={e => setFacilitiesInput(e.target.value)} placeholder={t('rental.register.placeholder_facilities')}
              className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-[16px] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
          </div>

          <div>
            <label className="block text-[14px] font-bold text-[#596061] mb-1.5">{t('rental.register.label_description')}</label>
            <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)} placeholder={t('rental.register.placeholder_description')}
              className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-[16px] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none" />
          </div>

          <div>
            <label className="block text-[14px] font-bold text-[#596061] mb-1.5">{t('rental.register.label_rules')}</label>
            <textarea rows={4} value={rules} onChange={e => setRules(e.target.value)} placeholder={t('rental.register.placeholder_rules')}
              className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-[16px] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none" />
          </div>
        </div>

      </div>
    </main>
  );
}

function FallbackLoading() {
  const { t } = useLanguage();
  return <div className="flex items-center justify-center min-h-screen">{t('rental.register.loading')}</div>;
}

export default function RentalRegisterPage() {
  return (
    <Suspense fallback={<FallbackLoading />}>
      <RegisterPageContent />
    </Suspense>
  );
}
