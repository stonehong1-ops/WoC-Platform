import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';
import { db, storage } from '@/lib/firebase/clientApp';
import { venueService } from '@/lib/firebase/venueService';
import { Venue, VenueType } from '@/types/venue';

interface VenueFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Venue | null;
}

const CATEGORY_OPTIONS = [
  { id: 'Shop', icon: 'shopping_bag', label: 'Shop' },
  { id: 'Studio', icon: 'palette', label: 'Studio' },
  { id: 'Stay', icon: 'bed', label: 'Stay' },
  { id: 'Academy', icon: 'school', label: 'Academy' },
  { id: 'Club', icon: 'groups', label: 'Club' },
  { id: 'Cafe', icon: 'coffee', label: 'Cafe' },
  { id: 'Eats', icon: 'restaurant', label: 'Eats' },
  { id: 'Beauty', icon: 'content_cut', label: 'Beauty' },
];

export default function VenueForm({ isOpen, onClose, initialData }: VenueFormProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Omit<Venue, 'id' | 'createdAt'>>({
    name: '',
    nameKo: '',
    types: ['Club'],
    category: 'Club',
    address: '',
    region: 'Seoul',
    city: 'Seoul',
    district: '',
    status: 'active',
    coordinates: { latitude: 37.5665, longitude: 126.9780 },
    imageUrl: '',
    seoulArea: '',
  });


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingPhoto, setIsFetchingPhoto] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fetchedPhotoUrl, setFetchedPhotoUrl] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFetchPhoto = async () => {
    if (!formData.name && !formData.address) {
      alert('Please enter a Venue Name or Address first to search for a photo.');
      return;
    }
    
    setIsFetchingPhoto(true);
    try {
      const query = `${formData.name} ${formData.address}`.trim();
      const res = await fetch(`/api/places/photo?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (res.ok && data.photoUrl) {
        setFetchedPhotoUrl(data.photoUrl);
        setFormData(prev => ({ ...prev, imageUrl: data.photoUrl }));
        toast.success(t('toast.venue.photo_fetched'));
      } else {
        toast.error(data.error || t('toast.venue.photo_not_found'));
        setFetchedPhotoUrl(null);
      }
    } catch (error) {
      console.error(error);
      toast.error(t('toast.venue.photo_fetch_failed'));
    } finally {
      setIsFetchingPhoto(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error(t('toast.venue.file_too_large'));
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
          initialQuality: 0.8
        };

        let fileToUpload: File | Blob = file;
        try {
          fileToUpload = await imageCompression(file, options);
        } catch (err) {
          console.warn('Compression failed, using original:', err);
        }

        const fileName = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `venues/${fileName}`);
        const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(Math.round(progress));
          },
          (error) => {
            console.error('Upload error:', error);
            toast.error(t('toast.venue.upload_failed'));
            setIsUploading(false);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setFormData(prev => ({ ...prev, imageUrl: downloadURL }));
            setFetchedPhotoUrl(downloadURL);
            toast.success(t('toast.venue.upload_success'));
            setIsUploading(false);
          }
        );
      } catch (err) {
        console.error('File handling error:', err);
        toast.error(t('toast.venue.process_failed'));
        setIsUploading(false);
      }
    }
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        nameKo: initialData.nameKo || '',
        types: initialData.types || ['Club'],
        category: initialData.category,
        address: initialData.address,
        region: initialData.region,
        city: initialData.city,
        district: initialData.district,
        status: initialData.status,
        coordinates: initialData.coordinates,
        imageUrl: initialData.imageUrl || '',
        seoulArea: initialData.seoulArea || '',
      });
      if (initialData.imageUrl) {
        setFetchedPhotoUrl(initialData.imageUrl);
      }
    }
  }, [initialData, isOpen]);


  const handleSubmit = async () => {
    setIsSubmitting(true);

    const isSeoul = (formData.city || '').toLowerCase() === 'seoul' || (formData.region || '').toLowerCase() === 'seoul';
    const finalFormData = {
      ...formData,
      seoulArea: isSeoul ? formData.seoulArea || '' : '',
    };

    try {
      if (initialData?.id) {
        await venueService.updateVenue(initialData.id, finalFormData);
        onClose();
      } else {
        const newId = await venueService.addVenue(finalFormData);
        router.replace('/create-success?type=venue&id=' + (newId || ''));
      }
    } catch (error) {
      console.error('Failed to save venue:', error);
      toast.error(t('toast.venue.save_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id || !confirm('Are you sure you want to delete this venue?')) return;
    try {
      await venueService.deleteVenue(initialData.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete venue:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-[#f2f4f4] overflow-y-auto animate-slide-up no-scrollbar">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full flex-shrink-0 bg-white border-b border-slate-100 px-4 flex items-center justify-between z-[120]" style={{ height: 'calc(56px + env(safe-area-inset-top, 0px))', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <button 
          type="button"
          onClick={() => { if (formData.name || formData.address) { if (confirm(t('common.confirm_discard', '작성 중인 내용이 사라집니다. 나가시겠습니까?'))) onClose(); } else onClose(); }}
          className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform text-slate-700"
        >
          <span className="material-symbols-rounded text-2xl">arrow_back</span>
        </button>
        <h1 className="text-[16px] font-bold text-slate-800">
          {initialData ? (t('venue.edit_title') || '장소 수정') : (t('venue.register_title') || '새 장소')}
        </h1>
        <div className="w-10" />
      </header>

      <main className="px-4 pb-28" style={{ paddingTop: 'calc(56px + env(safe-area-inset-top, 0px) + 16px)' }}>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          {/* 1. Venue Name */}
          <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
              <span className="material-symbols-rounded text-sm text-[#007AFF]">edit_square</span>
              <p className="text-[14px] font-bold text-primary">Venue Name</p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="venue-name-en">Venue Name (English) <span className="text-red-500">*</span></label>
                <input 
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm font-bold focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all placeholder:text-[#acb3b4] placeholder:font-normal text-slate-800" 
                  id="venue-name-en" 
                  placeholder="e.g. Blue Coffee Roasters" 
                  required 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="venue-name-ko">Venue Name (Korean)</label>
                <input 
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm font-bold focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all placeholder:text-[#acb3b4] placeholder:font-normal text-slate-800" 
                  id="venue-name-ko" 
                  placeholder="e.g. 블루 커피 로스터스" 
                  type="text" 
                  value={formData.nameKo}
                  onChange={(e) => setFormData({ ...formData, nameKo: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 2. Venue Category */}
          <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
              <span className="material-symbols-rounded text-sm text-[#007AFF]">category</span>
              <p className="text-[14px] font-bold text-primary">Venue Category <span className="text-red-500">*</span></p>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-4 gap-2">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.id as VenueType })}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border text-center transition-all active:scale-95 ${
                      formData.category === cat.id
                        ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <span className="material-symbols-rounded text-lg mb-1">{cat.icon}</span>
                    <span className="text-[10px] font-bold">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Owner/Operator */}
          <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
              <span className="material-symbols-rounded text-sm text-[#007AFF]">person_pin</span>
              <p className="text-[14px] font-bold text-primary">Owner / Operator <span className="text-red-500">*</span></p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 px-4 py-3 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl">
                <div className="w-8 h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center overflow-hidden">
                  <span className="material-symbols-rounded text-[#007AFF] text-lg">person</span>
                </div>
                <span className="text-sm font-bold text-slate-800">Admin Mode</span>
              </div>
            </div>
          </div>

          {/* 4. Global Details (Timezone Only) */}
          <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
              <span className="material-symbols-rounded text-sm text-[#007AFF]">public</span>
              <p className="text-[14px] font-bold text-primary">Global Details</p>
            </div>
            <div className="p-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="timezone">Venue Timezone</label>
              <div className="flex items-center gap-3 w-full px-4 py-3 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl">
                <span className="material-symbols-rounded text-[#007AFF]/70 text-lg">auto_mode</span>
                <span className="text-xs font-medium text-slate-500">Auto-detected: <span className="text-slate-800 font-bold">Singapore/Beijing (UTC+08:00)</span></span>
              </div>
              <p className="text-xs text-slate-400 italic mt-1.5">Derived automatically from your pinned map location.</p>
            </div>
          </div>

          {/* 5. Location Details */}
          <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center justify-between rounded-t-[15px]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">location_on</span>
                <p className="text-[14px] font-bold text-primary">Location Details <span className="text-red-500">*</span></p>
              </div>
              <button className="text-[#007AFF] text-xs font-bold flex items-center gap-1" type="button">
                <span className="material-symbols-rounded text-sm">push_pin</span>
                Pin on map
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Address</label>
                <div className="relative flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007AFF]/20 transition-all">
                  <span className="material-symbols-rounded text-[#acb3b4] mr-2">search</span>
                  <input 
                    className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-slate-800 outline-none placeholder:text-[#acb3b4] placeholder:font-normal" 
                    placeholder="Address or phone number" 
                    type="text" 
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-[#e0e4e5] h-48">
                <img 
                  className="w-full h-full object-cover" 
                  alt="map" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8tfDbQWKDDv515KjvIZwUg8Lh4_Q-Jd_xdlIeFh7yK7IrNeAq-VSLnYgKFUc9I6TinG58w206YtxavEb0ZpKL1SbczWkHlsVClREBc4r9Eew9jTNCRXk9D7J-VwGJ5bcrpGmEplXN9RacpentTG91wQjqc4yaxqAaiKbQOXiwDE8CJ4icvMGFpxT14yC5BRWOwA3OEu65PObN5C3YzHIr0wCSpTvc8O7pBOTcWg083IMfTcsAcTdbfkF-6XKZFdEemccreB7GZ5XB"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-3">
                  <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl flex items-center justify-between w-full shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-rounded text-[#007AFF] text-lg">explore</span>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400">Coordinates</p>
                        <p className="text-xs font-mono font-bold text-slate-800">
                          {formData.coordinates.latitude.toFixed(6)}, {formData.coordinates.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-rounded text-slate-400">zoom_in</span>
                  </div>
                </div>
              </div>
              
              {/* Seoul Area Selection (Conditional) */}
              {((formData.city || '').toLowerCase() === 'seoul' || (formData.region || '').toLowerCase() === 'seoul') && (
                <div className="space-y-3 p-4 bg-[#f8f9fa] rounded-xl border border-[#e0e4e5]">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Seoul Area Category
                    </label>
                    <span className="text-[10px] font-bold text-[#007AFF] bg-[#007AFF]/10 px-2 py-0.5 rounded-full">Fast Query</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, seoulArea: 'gangbuk' }))}
                      className={`py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 ${formData.seoulArea === 'gangbuk' ? 'bg-[#007AFF] text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200'}`}
                    >
                      <span className="material-symbols-rounded text-sm" style={{ fontVariationSettings: formData.seoulArea === 'gangbuk' ? "'FILL' 1" : "'FILL' 0" }}>south_east</span>
                      Gangbuk (North)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, seoulArea: 'gangnam' }))}
                      className={`py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 ${formData.seoulArea === 'gangnam' ? 'bg-[#007AFF] text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200'}`}
                    >
                      <span className="material-symbols-rounded text-sm" style={{ fontVariationSettings: formData.seoulArea === 'gangnam' ? "'FILL' 1" : "'FILL' 0" }}>north_east</span>
                      Gangnam (South)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 6. Representative Photo */}
          <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center justify-between rounded-t-[15px]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">image</span>
                <p className="text-[14px] font-bold text-primary">Representative Photo</p>
              </div>
              <button 
                type="button"
                onClick={handleFetchPhoto}
                disabled={isFetchingPhoto}
                className="text-[#007AFF] text-xs font-bold flex items-center gap-1 disabled:opacity-50"
              >
                <span className="material-symbols-rounded text-sm">
                  {isFetchingPhoto ? 'hourglass_empty' : 'sync'}
                </span>
                {isFetchingPhoto ? 'Fetching...' : 'Fetch from Maps'}
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full py-3 bg-[#f8f9fa] text-slate-700 font-bold text-sm rounded-xl border border-[#e0e4e5] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-rounded text-xl">upload</span>
                {isUploading ? `Uploading ${uploadProgress}%` : 'Upload Custom Photo'}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload}
              />

              {fetchedPhotoUrl || isUploading ? (
                <div className="relative rounded-2xl overflow-hidden border border-[#e0e4e5] aspect-video bg-slate-50">
                  {isUploading ? (
                    <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                      <div className="relative w-16 h-16">
                        <svg className="w-full h-full -rotate-90">
                          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/20" />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 28}
                            strokeDashoffset={2 * Math.PI * 28 * (1 - uploadProgress / 100)}
                            className="text-[#007AFF] transition-all duration-300"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{uploadProgress}%</span>
                      </div>
                      <p className="text-[11px] font-bold text-white mt-3">Uploading your photo</p>
                    </div>
                  ) : null}
                  <img src={fetchedPhotoUrl || ''} alt="Venue Representative" className="w-full h-full object-cover" />
                  {!isUploading && fetchedPhotoUrl && (
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                      <div className="bg-green-500/90 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-1.5 w-fit">
                        <span className="material-symbols-rounded text-sm">check_circle</span>
                        Photo Synced
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
                  <span className="material-symbols-rounded text-slate-300 text-4xl mb-2">add_photo_alternate</span>
                  <p className="text-sm font-medium text-slate-400">No photo selected</p>
                  <p className="text-xs text-slate-400 mt-1">Fetch from Maps or upload a custom photo.</p>
                </div>
              )}
              
              {/* Optional Manual URL Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Image URL (Optional)</label>
                <div className="relative flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007AFF]/20 transition-all">
                  <span className="material-symbols-rounded text-[#acb3b4] mr-2">link</span>
                  <input 
                    className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-slate-800 outline-none placeholder:text-[#acb3b4] placeholder:font-normal" 
                    placeholder="Or enter image URL manually..." 
                    type="url" 
                    value={formData.imageUrl || ''}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Delete button for edit mode */}
          {initialData && (
            <div className="border border-red-200 rounded-2xl bg-white p-4">
              <button 
                type="button"
                onClick={handleDelete}
                className="w-full py-3.5 text-red-500 font-bold text-sm rounded-full border border-red-200 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-rounded text-lg">delete</span>
                Delete Venue
              </button>
            </div>
          )}
        </form>
      </main>

      {/* Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-[100010] bg-white border-t border-slate-100 px-4 flex gap-3 items-center justify-between shadow-lg" style={{ paddingTop: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', height: 'calc(76px + env(safe-area-inset-bottom, 0px))' }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.name}
          className="flex-1 py-3.5 rounded-full bg-[#007AFF] text-white text-sm font-bold active:scale-95 transition-all disabled:opacity-50 shadow-sm"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t('common.saving', 'Saving...')}</span>
            </div>
          ) : (
            <span>{initialData ? t('common.save', 'Save') : t('common.register', 'Register')}</span>
          )}
        </button>
      </footer>

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
