"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Pic } from '@/types/pic';
import { picService } from '@/services/picService';
import SafeZoneEditor from '@/components/admin/pics/SafeZoneEditor';
import { toast } from 'sonner';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/clientApp';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import ImportPackModal from '@/components/admin/pics/ImportPackModal';
import { useLanguage } from '@/contexts/LanguageContext';

const MOODS = ['All', 'Romantic', 'Vibrant', 'Chill', 'Energetic', 'Moody', 'Elegant'];
const ACTIVITIES = ['All', 'Social', 'Dining', 'Explore', 'Relax', 'Party', 'Learn'];

const DEFAULT_PIC: Partial<Pic> = {
  title: '',
  slug: '',
  imageUrl: '',
  mood: 'Cinematic',
  activity: 'General',
  season: 'All',
  tags: [],
  orientation: 'portrait',
  brightness: 50,
  contrastSafe: true,
  featured: false,
  premium: false,
  sortOrder: 0,
  typographySafeZone: { top: 10, left: 10, width: 80, height: 80 }
};

export default function AdminPicsPage() {
  const { t } = useLanguage();
  const [pics, setPics] = useState<Pic[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const [activeMood, setActiveMood] = useState('All');
  const [activeActivity, setActiveActivity] = useState('All');

  const [selectedPic, setSelectedPic] = useState<Partial<Pic> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showImportModal, setShowImportModal] = useState(false);

  const observerTarget = useRef(null);

  const fetchPics = async (isLoadMore = false, currentLastDoc: any = null) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await picService.getPicsPaginated({
        limitCount: 20,
        lastDoc: isLoadMore ? currentLastDoc : null,
        filters: {
          mood: activeMood !== 'All' ? activeMood : undefined,
          activity: activeActivity !== 'All' ? activeActivity : undefined,
        }
      });

      const validPics = response.pics.filter(p => p.imageUrl);

      setPics(prev => isLoadMore ? [...prev, ...validPics] : validPics);
      setLastDoc(response.lastDoc);
      setHasMore(response.hasMore);

    } catch (error) {
      console.error("Failed to load pics", error);
      toast.error(t('pics.no_assets_found'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPics([]);
    setLastDoc(null);
    setHasMore(true);
    fetchPics(false, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMood, activeActivity]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchPics(true, lastDoc);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, lastDoc, activeMood, activeActivity]);

  const handleSave = async () => {
    if (!selectedPic?.title || !selectedPic?.imageUrl) {
      toast.error(t('pics.admin.required_fields'));
      return;
    }

    setSaving(true);
    try {
      if (selectedPic.id) {
        // Update
        const { id, createdAt, updatedAt, ...updates } = selectedPic as Pic;
        await picService.updatePic(id, updates);
        toast.success(t('pics.admin.save_success'));
      } else {
        // Create
        await picService.createPic(selectedPic as any);
        toast.success(t('pics.admin.save_success'));
      }
      setIsEditing(false);
      setSelectedPic(null);
      // Refresh current list from scratch
      setPics([]);
      setLastDoc(null);
      setHasMore(true);
      fetchPics(false, null);
    } catch (e) {
      console.error(e);
      toast.error(t('pics.admin.save_fail'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('pics.admin.delete_confirm'))) return;
    try {
      await picService.deletePic(id);
      toast.success(t('pics.admin.delete_success'));
      if (selectedPic?.id === id) {
        setIsEditing(false);
        setSelectedPic(null);
      }
      setPics(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
      toast.error(t('pics.admin.delete_fail'));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('pics.admin.upload_image_only'));
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `Pics/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
      const storageRef = ref(storage, fileName);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error('Upload failed:', error);
          toast.error(t('pics.admin.upload_fail'));
          setIsUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setSelectedPic((prev) => prev ? { ...prev, imageUrl: downloadURL } : prev);
          toast.success(t('pics.admin.upload_success'));
          setIsUploading(false);
          setUploadProgress(0);
        }
      );
    } catch (err) {
      console.error(err);
      toast.error(t('pics.admin.upload_start_error'));
      setIsUploading(false);
    }
  };

  return (
    <main className="flex h-screen bg-surface overflow-hidden">
      {/* Sidebar / List */}
      <div className={`flex-1 border-r border-surface-container flex flex-col ${isEditing ? 'hidden md:flex md:max-w-md' : 'flex'}`}>
        <div className="p-6 border-b border-surface-container shrink-0 flex items-center justify-between bg-surface-container-lowest">
          <div>
            <h1 className="text-xl font-bold font-headline">{t('pics.admin.title')}</h1>
            <p className="text-sm text-on-surface-variant">{t('pics.admin.desc')}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowImportModal(true)}
              className="px-4 h-10 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center hover:bg-surface-container-highest transition-colors shadow-sm gap-2 font-bold text-sm"
            >
              <span className="material-symbols-outlined !text-[18px]">view_cozy</span>
              {t('pics.admin.import_pack')}
            </button>
            <button 
              onClick={() => { setSelectedPic({ ...DEFAULT_PIC }); setIsEditing(true); }}
              className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-surface-container bg-surface flex flex-col gap-3 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider shrink-0 w-14">{t('pics.filter.mood')}</span>
            {MOODS.map(mood => (
              <button
                key={mood}
                onClick={() => setActiveMood(mood)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all ${activeMood === mood ? 'bg-primary text-white shadow-sm' : 'bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container'}`}
              >
                {mood === 'All' ? t('pics.mood.All') : t(`pics.mood.${mood}`)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider shrink-0 w-14">{t('pics.filter.activity')}</span>
            {ACTIVITIES.map(activity => (
              <button
                key={activity}
                onClick={() => setActiveActivity(activity)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all ${activeActivity === activity ? 'bg-primary text-white shadow-sm' : 'bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container'}`}
              >
                {activity === 'All' ? t('pics.activity.All') : t(`pics.activity.${activity}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && pics.length === 0 ? (
            <div className="flex justify-center p-8 text-outline">{t('pics.loading_assets')}...</div>
          ) : pics.length === 0 ? (
            <div className="text-center p-8 text-outline-variant">
              <span className="material-symbols-outlined !text-[48px] mb-2 opacity-50">wallpaper</span>
              <p>{t('pics.admin.no_assets')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {pics.map(pic => (
                  <div 
                    key={pic.id}
                    onClick={() => { setSelectedPic(pic); setIsEditing(true); }}
                    className={`group relative rounded-xl overflow-hidden aspect-[3/4] cursor-pointer border-2 transition-all ${selectedPic?.id === pic.id ? 'border-primary shadow-lg scale-[0.98]' : 'border-transparent hover:border-outline-variant/30'}`}
                  >
                    <img src={pic.imageUrl} alt={pic.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                      <p className="text-white font-bold text-sm truncate">{pic.title}</p>
                      <div className="flex gap-1 mt-1">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/20 text-white backdrop-blur-sm uppercase">{pic.mood !== 'All' ? t(`pics.mood.${pic.mood}`) : t('pics.mood.All')}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/20 text-white backdrop-blur-sm uppercase">{pic.activity !== 'All' ? t(`pics.activity.${pic.activity}`) : t('pics.activity.All')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {hasMore && (
                <div ref={observerTarget} className="flex justify-center p-4">
                  {loadingMore && <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Editor Panel */}
      {isEditing && selectedPic && (
        <div className="flex-1 flex flex-col bg-surface-container-lowest h-full overflow-hidden animate-in slide-in-from-right-8 duration-300 z-10 border-l border-surface-container shadow-2xl md:shadow-none">
          <div className="h-14 px-4 flex items-center justify-between border-b border-surface-container shrink-0">
            <h2 className="font-bold font-headline">{selectedPic.id ? t('pics.admin.edit_asset') : t('pics.admin.new_pic')}</h2>
            <button 
              onClick={() => setIsEditing(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-8">
              
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-surface-container pb-2">{t('pics.admin.basic_info')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-outline">{t('pics.admin.title_label')}</label>
                    <input 
                      type="text" 
                      value={selectedPic.title}
                      onChange={e => setSelectedPic({ ...selectedPic, title: e.target.value })}
                      className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm focus:border-primary outline-none"
                      placeholder="e.g. Cinematic Sunset"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-outline">{t('pics.admin.slug_label')}</label>
                    <input 
                      type="text" 
                      value={selectedPic.slug}
                      onChange={e => setSelectedPic({ ...selectedPic, slug: e.target.value })}
                      className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm focus:border-primary outline-none"
                      placeholder="e.g. cinematic-sunset"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-outline">{t('pics.admin.image_label')}</label>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <button 
                        type="button"
                        disabled={isUploading}
                        className="text-[10px] font-bold px-3 py-1.5 bg-primary/10 text-primary rounded-full flex items-center gap-1 hover:bg-primary/20 transition-colors disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined !text-[14px]">cloud_upload</span>
                        {isUploading ? `${t('pics.admin.saving')} ${uploadProgress}%` : t('pics.admin.upload_file')}
                      </button>
                    </div>
                  </div>
                  
                  {isUploading && (
                    <div className="h-1 w-full bg-surface-container rounded-full overflow-hidden mt-1 mb-2">
                      <div 
                        className="h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}

                  <input 
                    type="text" 
                    value={selectedPic.imageUrl}
                    onChange={e => setSelectedPic({ ...selectedPic, imageUrl: e.target.value })}
                    className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm focus:border-primary outline-none mt-2"
                    placeholder={t('pics.admin.paste_url_placeholder')}
                  />
                  {selectedPic.imageUrl && (
                    <div className="mt-2 aspect-[3/4] max-h-[400px] w-auto mx-auto bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/20 relative">
                      <img src={selectedPic.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-surface-container pb-2">{t('pics.admin.metadata')}</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-outline">{t('pics.filter.mood')}</label>
                    <select
                      value={selectedPic.mood}
                      onChange={e => setSelectedPic({ ...selectedPic, mood: e.target.value })}
                      className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm focus:border-primary outline-none"
                    >
                      {MOODS.filter(m => m !== 'All').map(mood => (
                        <option key={mood} value={mood}>{t(`pics.mood.${mood}`)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-outline">{t('pics.filter.activity')}</label>
                    <select
                      value={selectedPic.activity}
                      onChange={e => setSelectedPic({ ...selectedPic, activity: e.target.value })}
                      className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm focus:border-primary outline-none"
                    >
                      {ACTIVITIES.filter(a => a !== 'All').map(activity => (
                        <option key={activity} value={activity}>{t(`pics.activity.${activity}`)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Safe Zone Editor */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-surface-container pb-2">{t('pics.admin.visual_composition')}</h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <SafeZoneEditor 
                    pic={selectedPic}
                    onUpdate={(zone) => setSelectedPic({ ...selectedPic, typographySafeZone: zone })}
                  />
                  
                  <div className="space-y-6">
                    <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
                      <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined !text-[18px] text-primary">info</span>
                        {t('pics.admin.why_safe_zones')}
                      </h4>
                      <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                        {t('pics.admin.why_safe_zones_desc')}
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-outline">{t('pics.admin.brightness')}</label>
                          <span className="text-xs font-mono bg-surface-container px-2 rounded">{selectedPic.brightness}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" max="100" 
                          value={selectedPic.brightness}
                          onChange={e => setSelectedPic({ ...selectedPic, brightness: Number(e.target.value) })}
                          className="w-full accent-primary"
                        />
                      </div>

                      <div className="mt-6 flex items-center justify-between p-3 bg-surface-container rounded-lg">
                        <label className="text-xs font-bold text-on-surface">{t('pics.admin.contrast_safe')}</label>
                        <input 
                          type="checkbox" 
                          checked={selectedPic.contrastSafe}
                          onChange={e => setSelectedPic({ ...selectedPic, contrastSafe: e.target.checked })}
                          className="w-4 h-4 accent-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="p-4 border-t border-surface-container bg-surface-container-lowest flex justify-between items-center shrink-0">
            {selectedPic.id ? (
              <button 
                onClick={() => handleDelete(selectedPic.id as string)}
                className="px-4 py-2 text-error text-sm font-bold hover:bg-error/10 rounded-lg transition-colors"
              >
                {t('pics.admin.delete_pic')}
              </button>
            ) : <div />}
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                {t('pics.cancel')}
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50"
              >
                {saving ? t('pics.admin.saving') : t('pics.admin.save_pic')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <ImportPackModal 
          onClose={() => setShowImportModal(false)}
          onComplete={() => {
            setShowImportModal(false);
            setPics([]);
            setLastDoc(null);
            setHasMore(true);
            fetchPics(false, null);
          }}
        />
      )}
    </main>
  );
}

