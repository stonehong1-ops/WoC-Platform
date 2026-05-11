"use client";
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Group } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { storageService } from "@/lib/firebase/storageService";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { getContrastColor } from "@/lib/utils";

interface GroupBasicEditorProps {
  group: Group;
  onClose: () => void;
}

export default function GroupBasicEditor({ group, onClose }: GroupBasicEditorProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: group.name || "",
    nativeName: group.nativeName || "",
    slug: group.slug || "",
    description: group.description || "",
    coverImage: group.coverImage || "",
    coverImageDescription: group.coverImageDescription || "",
    operatingHours: group.operatingHours?.map(h => `${h.label}${h.time ? ': ' + h.time : ''}`).join('\n') || "",
    houseRules: group.houseRules?.join('\n') || "",
    headerThemeColor: group.headerThemeColor || "#0057bd",
    aboutPhotos: group.aboutPhotos || [],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const aboutPhotosInputRef = useRef<HTMLInputElement>(null);

  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    
    if (formData.aboutPhotos.length + newFiles.length > 20) {
      toast.error("You can upload up to 20 photos in the gallery.");
      return;
    }

    setUploadingField('aboutPhotos');
    setIsOptimizing(true);
    setUploadProgress(0);
    
    try {
      const uploadedUrls: string[] = [];
      let currentProgress = 0;
      const progressPerFile = 100 / newFiles.length;

      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        if (file.size > 10 * 1024 * 1024) continue;

        const path = `groups/${group.id}/about_${Date.now()}_${i}`;
        const downloadURL = await storageService.uploadFile(file, path, (p) => {
          if (p === 100) {
            currentProgress += progressPerFile;
            setUploadProgress(Math.round(currentProgress));
          }
        });
        uploadedUrls.push(downloadURL);
      }
      
      setFormData(prev => ({ 
        ...prev, 
        aboutPhotos: [...prev.aboutPhotos, ...uploadedUrls] 
      }));
      toast.success(`${uploadedUrls.length} photos uploaded.`);
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast.error("Failed to upload some photos.");
    } finally {
      setUploadingField(null);
      setIsOptimizing(false);
      setUploadProgress(0);
    }
  };

  const removeAboutPhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      aboutPhotos: prev.aboutPhotos.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'coverImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size validation (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('group.basic.file_too_large'));
      return;
    }

    // Create a temporary blob URL for immediate preview
    const blobUrl = URL.createObjectURL(file);
    const originalImage = formData[field];
    setFormData(prev => ({ ...prev, [field]: blobUrl }));
    
    setUploadingField(field);
    setIsOptimizing(true);
    setUploadProgress(0);
    
    try {
      const path = `groups/${group.id}/${field}_${Date.now()}`;
      const downloadURL = await storageService.uploadFile(file, path, (progress) => {
        if (progress > 0) setIsOptimizing(false);
        setUploadProgress(Math.round(progress));
      });
      
      // Revoke the blob URL to free up memory
      URL.revokeObjectURL(blobUrl);
      
      setFormData(prev => ({ ...prev, [field]: downloadURL }));
      toast.success(t('group.basic.image_uploaded'));
    } catch (error) {
      console.error("Error uploading image:", error);
      // Fallback to original image on error
      setFormData(prev => ({ ...prev, [field]: originalImage }));
      toast.error(t('group.basic.upload_failed'));
    } finally {
      setUploadingField(null);
      setIsOptimizing(false);
      setUploadProgress(0);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error(t('group.basic.name_slug_required'));
      return;
    }

    setIsSaving(true);
    try {
      await groupService.updateGroupMetadata(group.id, {
        name: formData.name,
        nativeName: formData.nativeName,
        slug: formData.slug,
        description: formData.description,
        coverImage: formData.coverImage,
        coverImageDescription: formData.coverImageDescription,
        operatingHours: formData.operatingHours.split('\n').filter(line => line.trim() !== '').map(line => {
          const parts = line.split(':');
          const label = parts.shift()?.trim() || '';
          const time = parts.join(':').trim() || '';
          return { label, time };
        }),
        houseRules: formData.houseRules.split('\n').filter(line => line.trim() !== ''),
        headerThemeColor: formData.headerThemeColor,
        aboutPhotos: formData.aboutPhotos,
      });
      toast.success(t('group.basic.identity_updated'));
      onClose();
    } catch (error) {
      console.error("Error saving basic info:", error);
      toast.error(t('group.basic.save_failed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[100] bg-[#0a0f1d] flex flex-col overflow-y-auto no-scrollbar"
    >
      {/* Premium Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#0057bd]/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/5 blur-[100px] rounded-full" />
      </div>

      {/* Top Bar - Glassmorphism */}
      <header className="sticky top-0 z-50 bg-[#0a0f1d]/60 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all group"
            >
              <span className="material-symbols-outlined group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            </button>
            <div>
              <h1 className="text-lg font-headline font-black text-white tracking-tight">{t('group.basic.identity_branding')}</h1>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{t('group.basic.core_config')}</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || !!uploadingField}
            className={`px-10 py-3 rounded-2xl font-headline font-black text-sm transition-all active:scale-95 flex items-center gap-2 ${isSaving || !!uploadingField
                ? "bg-white/5 text-white/20 cursor-not-allowed"
                : "bg-white text-[#0a0f1d] hover:bg-[#0057bd] hover:text-white shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
              }`}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>{t('group.basic.saving')}</span>
              </>
            ) : (
              t('group.basic.save_changes')
            )}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 py-12 relative z-10 space-y-16">
        {/* Branding Assets */}
        <section className="space-y-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-headline font-black text-white flex items-center gap-4">
              <span className="w-2 h-10 bg-[#0057bd] rounded-full"></span>
              {t('group.basic.branding_assets')}
            </h2>
            <p className="text-white/40 font-medium ml-6">{t('group.basic.branding_assets_desc')}</p>
          </div>

          <div className="space-y-8 ml-6">
            {/* Cover Image Upload */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a3abd7]/40 ml-1">{t('group.basic.hero_image')}</label>
              <div
                onClick={() => coverInputRef.current?.click()}
                className="aspect-[21/9] rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-[#0057bd]/40 transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl"
              >
                {formData.coverImage ? (
                  <>
                    <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-[#0a0f1d]/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                        <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                      </div>
                      <span className="text-white font-headline font-black text-xs tracking-widest">{t('group.basic.change_cover')}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4 text-white/20">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                      <span className="material-symbols-outlined text-5xl">panorama</span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-black tracking-widest text-white/40">{t('group.basic.upload_hero_image')}</p>
                      <p className="text-[10px] font-bold opacity-50 mt-1">{t('group.basic.recommended_size')}</p>
                    </div>
                  </div>
                )}
                {uploadingField === 'coverImage' && (
                  <div className="absolute inset-0 bg-[#0a0f1d]/80 backdrop-blur-md flex items-center justify-center z-20 animate-in fade-in duration-300">
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative w-20 h-20">
                        {/* Circular Progress Background */}
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-white/10"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 36}
                            strokeDashoffset={2 * Math.PI * 36 * (1 - uploadProgress / 100)}
                            className="text-[#0057bd] transition-all duration-300 ease-out"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white font-black text-sm">
                            {isOptimizing ? "..." : `${uploadProgress}%`}
                          </span>
                        </div>
                      </div>
                      <div className="text-center space-y-1">
                        <span className="block text-[10px] font-black tracking-[0.2em] text-[#0057bd] uppercase">
                          {isOptimizing ? t('group.basic.optimizing') : t('group.basic.uploading_hero')}
                        </span>
                        <span className="block text-[9px] text-white/30 font-bold italic">
                          {isOptimizing ? t('group.basic.preparing_assets') : t('group.basic.syncing_cloud')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'coverImage')} />
            </div>

            {/* Cover Image Description */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a3abd7]/40 ml-1">{t('group.basic.primary_catchphrase')}</label>
              <div className="relative group">
                <input
                  type="text"
                  value={formData.coverImageDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, coverImageDescription: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 focus:bg-white/10 focus:border-[#0057bd]/40 outline-none rounded-3xl px-8 py-5 font-headline font-black text-white text-lg transition-all shadow-inner"
                  placeholder={t('group.basic.catchphrase_placeholder')}
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-focus-within:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-white/20 text-sm">edit</span>
                </div>
              </div>
            <p className="text-[11px] text-white/30 font-medium ml-2 italic">{t('group.basic.catchphrase_desc')}</p>
            </div>
            
            {/* About Photos Gallery Upload */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a3abd7]/40 ml-1">About Gallery (Max 20)</label>
                <span className="text-[10px] font-bold text-white/30">{formData.aboutPhotos.length}/20</span>
              </div>
              
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {formData.aboutPhotos.map((photo, index) => (
                  <div key={index} className="aspect-square rounded-[1.5rem] overflow-hidden relative group border border-white/10 shadow-lg">
                    <img src={photo} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-[#0a0f1d]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={() => removeAboutPhoto(index)}
                        className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30 hover:bg-red-500/40 hover:text-white transition-all hover:scale-110"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                ))}

                {formData.aboutPhotos.length < 20 && (
                  <div 
                    onClick={() => !uploadingField && aboutPhotosInputRef.current?.click()}
                    className={`aspect-square rounded-[1.5rem] bg-white/5 border border-white/10 border-dashed hover:border-[#0057bd]/40 hover:bg-white/10 transition-all flex flex-col items-center justify-center relative cursor-pointer shadow-inner ${uploadingField === 'aboutPhotos' ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    {uploadingField === 'aboutPhotos' ? (
                      <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin text-[#0057bd]" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-white/30 text-3xl mb-2">add_photo_alternate</span>
                        <span className="text-[10px] font-black tracking-widest text-white/30 uppercase">Add Photos</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={aboutPhotosInputRef} 
                className="hidden" 
                accept="image/*" 
                multiple 
                onChange={handleMultipleImageUpload} 
              />
              <p className="text-[11px] text-white/30 font-medium ml-2 italic">These photos will be featured in your group's About section.</p>
            </div>
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent ml-6" />

        {/* Header Theme Color Section */}
        <section className="space-y-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-headline font-black text-white flex items-center gap-4">
              <span className="w-2 h-10 bg-[#0057bd] rounded-full"></span>
              Header Branding
            </h2>
            <p className="text-white/40 font-medium ml-6">Select a theme color for your group's header. This will define the visual identity of your "App-in-App" space.</p>
          </div>

          <div className="ml-6 space-y-8">
            <div className="flex flex-wrap gap-4">
              {[
                "#0057bd", // WoC Blue
                "#1a1c23", // Dark
                "#2d3436", // Slate
                "#636e72", // Steel
                "#b2bec3", // Silver
                "#d63031", // Ruby
                "#e17055", // Coral
                "#fdcb6e", // Amber
                "#00b894", // Emerald
                "#00cec9", // Turquoise
                "#0984e3", // Azure
                "#6c5ce7", // Iris
                "#a29bfe", // Lavender
                "#e84393", // Fuchsia
                "#fd79a8", // Rose
              ].map((color) => (
                <button
                  key={color}
                  onClick={() => setFormData(prev => ({ ...prev, headerThemeColor: color }))}
                  className={`w-12 h-12 rounded-2xl transition-all relative group flex items-center justify-center ${formData.headerThemeColor === color ? "scale-110 shadow-[0_0_20px_rgba(255,255,255,0.2)] ring-2 ring-white" : "hover:scale-105 opacity-60 hover:opacity-100"}`}
                  style={{ backgroundColor: color }}
                >
                  {formData.headerThemeColor === color && (
                    <span 
                      className="material-symbols-outlined text-xl"
                      style={{ color: getContrastColor(color) === 'black' ? "#0a0f1d" : "#ffffff" }}
                    >
                      check
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Preview Banner */}
            <div className="relative h-20 rounded-3xl overflow-hidden shadow-2xl border border-white/5">
              <div 
                className="absolute inset-0 transition-colors duration-500" 
                style={{ backgroundColor: formData.headerThemeColor }} 
              />
              <div className="absolute inset-0 flex items-center px-8 justify-between">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded-xl transition-colors duration-500" 
                    style={{ backgroundColor: getContrastColor(formData.headerThemeColor) === 'black' ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)" }}
                  />
                  <div className="space-y-1">
                    <div 
                      className="h-4 w-32 rounded-md transition-colors duration-500" 
                      style={{ backgroundColor: getContrastColor(formData.headerThemeColor) === 'black' ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)" }}
                    />
                    <div 
                      className="h-2 w-20 rounded-md transition-colors duration-500" 
                      style={{ backgroundColor: getContrastColor(formData.headerThemeColor) === 'black' ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)" }}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg transition-colors duration-500" 
                    style={{ backgroundColor: getContrastColor(formData.headerThemeColor) === 'black' ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)" }}
                  />
                  <div 
                    className="w-8 h-8 rounded-lg transition-colors duration-500" 
                    style={{ backgroundColor: getContrastColor(formData.headerThemeColor) === 'black' ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent ml-6" />

        {/* Identity Section */}
        <section className="space-y-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-headline font-black text-white flex items-center gap-4">
              <span className="w-2 h-10 bg-[#0057bd] rounded-full"></span>
              {t('group.basic.core_identity')}
            </h2>
            <p className="text-white/40 font-medium ml-6">{t('group.basic.core_identity_desc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 ml-6">
            {/* Group Name */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a3abd7]/40 ml-1">{t('group.basic.global_display_name')}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 focus:bg-white/10 focus:border-[#0057bd]/40 outline-none rounded-3xl px-8 py-5 font-headline font-black text-white text-lg transition-all"
                placeholder={t('group.basic.global_display_name_placeholder')}
              />
            </div>

            {/* Native Name */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a3abd7]/40 ml-1">{t('group.basic.local_identity_name')}</label>
              <input
                type="text"
                value={formData.nativeName}
                onChange={(e) => setFormData(prev => ({ ...prev, nativeName: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 focus:bg-white/10 focus:border-[#0057bd]/40 outline-none rounded-3xl px-8 py-5 font-headline font-black text-white text-lg transition-all"
                placeholder={t('group.basic.local_identity_name_placeholder')}
              />
            </div>

            {/* Slug */}
            <div className="space-y-4 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a3abd7]/40 ml-1">{t('group.basic.unique_slug')}</label>
              <div className="relative overflow-hidden rounded-3xl group">
                <div className="absolute left-8 top-1/2 -translate-y-1/2 text-white/20 font-black text-lg tracking-tight z-10">
                  woc.today/
                </div>
                <input
                  type="text"
                  value={formData.slug}
                  disabled
                  className="w-full bg-white/[0.02] border border-white/5 outline-none rounded-3xl pl-32 pr-8 py-6 font-headline font-black text-white/20 transition-all cursor-not-allowed italic"
                />
                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-white/10 text-sm">lock</span>
                  <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">{t('group.basic.permanent')}</span>
                </div>
              </div>
            </div>
            
            {/* Description */}
            <div className="space-y-4 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a3abd7]/40 ml-1">{t('group.basic.about_us')}</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 focus:bg-white/10 focus:border-[#0057bd]/40 outline-none rounded-3xl px-8 py-5 font-headline font-medium text-white text-base transition-all min-h-[120px]"
                placeholder={t('group.basic.about_us_placeholder')}
              />
            </div>

            {/* Operating Hours */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a3abd7]/40 ml-1">{t('group.basic.operating_hours')}</label>
              <textarea
                value={formData.operatingHours}
                onChange={(e) => setFormData(prev => ({ ...prev, operatingHours: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 focus:bg-white/10 focus:border-[#0057bd]/40 outline-none rounded-3xl px-8 py-5 font-headline font-medium text-white text-base transition-all min-h-[120px]"
                placeholder={t('group.basic.operating_hours_placeholder')}
              />
            </div>

            {/* House Rules */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a3abd7]/40 ml-1">{t('group.basic.house_rules')}</label>
              <textarea
                value={formData.houseRules}
                onChange={(e) => setFormData(prev => ({ ...prev, houseRules: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 focus:bg-white/10 focus:border-[#0057bd]/40 outline-none rounded-3xl px-8 py-5 font-headline font-medium text-white text-base transition-all min-h-[120px]"
                placeholder={t('group.basic.house_rules_placeholder')}
              />
            </div>
          </div>
        </section>

        <div className="pb-10" />
      </main>
    </motion.div>
  );
}
