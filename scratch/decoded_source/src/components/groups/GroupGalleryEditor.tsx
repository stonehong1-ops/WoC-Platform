"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Group, GallerySection } from "@/types/group";
import { storageService } from "@/lib/firebase/storageService";
import { groupService } from "@/lib/firebase/groupService";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface GroupGalleryEditorProps {
  group: Group;
  onClose: () => void;
  onSave?: () => void;
}

export default function GroupGalleryEditor({ group, onClose, onSave }: GroupGalleryEditorProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<GallerySection[]>(group.gallery || [
    {
      id: "1",
      title: t('group.gallery.editor.milonga') || "Milonga Highlights",
      type: "photos",
      media: []
    }
  ]);
  
  const [uploadingSectionId, setUploadingSectionId] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setLoading(true);
    try {
      await groupService.updateGroupMetadata(group.id, {
        gallery: sections
      });
      if (onSave) onSave();
      onClose();
      toast.success(t('group.gallery.editor.success_save') || "Gallery saved successfully!");
    } catch (error) {
      console.error("Failed to save gallery:", error);
      toast.error(t('group.gallery.editor.error_save') || "Failed to save changes.");
    } finally {
      setLoading(false);
    }
  };

  const addSection = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setSections([...sections, { id: newId, title: t('group.gallery.editor.new_section') || "New Gallery Section", type: "photos", media: [] }]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const updateSection = (id: string, updates: Partial<GallerySection>) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const triggerUpload = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    // Check limits before triggering upload
    if (section.type === 'photos' && section.media.length >= 10) {
      toast.error(t('group.gallery.editor.max_photos') || "Maximum 10 photos allowed per section.");
      return;
    }
    if (section.type === 'videos' && section.media.length >= 1) {
      toast.error(t('group.gallery.editor.max_videos') || "Only 1 video allowed per section.");
      return;
    }

    setUploadingSectionId(sectionId);
    if (fileInputRef.current) {
      fileInputRef.current.accept = section.type === 'photos' ? "image/*" : "video/*";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingSectionId) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('group.gallery.editor.file_too_large') || "The file is too large. Max size is 10MB.");
      return;
    }

    const section = sections.find(s => s.id === uploadingSectionId);
    if (!section) return;

    // Re-verify limits
    if (section.type === 'photos' && section.media.length >= 10) {
      toast.error(t('group.gallery.editor.max_photos_ko') || "You can only upload up to 10 photos per section.");
      return;
    }
    if (section.type === 'videos' && section.media.length >= 1) {
      toast.error(t('group.gallery.editor.max_videos_ko') || "You can only upload 1 video per section.");
      return;
    }

    // Create a temporary blob URL for immediate preview
    const blobUrl = URL.createObjectURL(file);
    
    // Optimistically add the blob URL to the section
    setSections(prev => prev.map(s => {
      if (s.id === uploadingSectionId) {
        return { ...s, media: [...s.media, blobUrl] };
      }
      return s;
    }));

    setIsOptimizing(true);
    setUploadProgress(0);
    
    try {
      const path = `groups/${group.id}/gallery/${uploadingSectionId}/${Date.now()}_${file.name}`;
      const url = await storageService.uploadFile(file, path, (progress) => {
        if (progress > 0) setIsOptimizing(false);
        setUploadProgress(Math.round(progress));
      });

      // Replace the blob URL with the final download URL
      setSections(prev => prev.map(s => {
        if (s.id === uploadingSectionId) {
          const newMedia = s.media.map(m => m === blobUrl ? url : m);
          return { ...s, media: newMedia };
        }
        return s;
      }));
      
      // Revoke the blob URL to free up memory
      URL.revokeObjectURL(blobUrl);
      
      toast.success(t('group.gallery.editor.upload_success') || "Media uploaded successfully!");
    } catch (error: any) {
      console.error("Upload failed:", error);
      // Remove the failed blob URL from the section
      setSections(prev => prev.map(s => {
        if (s.id === uploadingSectionId) {
          return { ...s, media: s.media.filter(m => m !== blobUrl) };
        }
        return s;
      }));
      toast.error(t('group.gallery.editor.upload_failed') || "Upload failed. Please try again.");
    } finally {
      setIsOptimizing(false);
      setUploadProgress(0);
      setUploadingSectionId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeMedia = (sectionId: string, index: number) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        const newMedia = [...s.media];
        newMedia.splice(index, 1);
        return { ...s, media: newMedia };
      }
      return s;
    }));
  };

  const totalMediaCount = sections.reduce((acc, s) => acc + s.media.length, 0);
  const maxAllowed = sections.length * 10; // Dynamic cap for visualization
  const storagePercentage = Math.min(Math.round((totalMediaCount / 50) * 100), 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[100] bg-[#f7f8ff] overflow-y-auto font-body"
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-[#f7f5ff]/80 backdrop-blur-xl border-b border-[#a3abd7]/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#0057bd] hover:bg-[#0057bd]/5 transition-all"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-base font-headline font-semibold text-[#242c51]">{t('group.gallery.editor.title') || "Gallery Settings"}</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className={`px-8 py-2.5 rounded-xl font-headline font-black transition-all active:scale-95 ${
              loading
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-[#0057bd] text-white hover:bg-[#004bb3] shadow-lg shadow-blue-900/10"
            }`}
          >
            {loading ? (t('group.gallery.editor.saving') || "Saving...") : (t('group.gallery.editor.save') || "Save")}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 pt-16 space-y-16 pb-48">
        {/* Cloud Storage Usage Card */}
        <section className="bg-white p-12 rounded-[3rem] shadow-2xl shadow-blue-900/5 border border-white">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="font-headline text-3xl font-black text-[#242c51] tracking-tight">{t('group.gallery.editor.repo_title') || "Media Repository"}</h2>
              <p className="text-[#a3abd7] text-sm font-black uppercase tracking-widest mt-2 opacity-80">
                {totalMediaCount} {t('group.gallery.editor.assets_managed') || "Assets Managed"}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[#0057bd] font-black text-4xl italic">{storagePercentage}%</span>
              <p className="text-[10px] font-black text-[#a3abd7] uppercase tracking-tighter mt-1">{t('group.gallery.editor.storage_quota') || "Storage Quota"}</p>
            </div>
          </div>
          <div className="h-5 w-full bg-[#f1f3ff] rounded-full overflow-hidden border border-[#efefff]">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${storagePercentage}%` }}
              transition={{ duration: 1.5, ease: "circOut" }}
              className="h-full bg-gradient-to-r from-[#0057bd] via-[#0057bd] to-[#893c92] rounded-full"
            />
          </div>
        </section>

        {/* Gallery Sections */}
        <div className="space-y-10">
          <div className="flex items-center justify-between px-4">
            <h3 className="font-headline text-2xl font-black text-[#242c51] tracking-tight italic uppercase opacity-40">{t('group.gallery.editor.layout_sections') || "Layout Sections"}</h3>
          </div>

          <div className="space-y-24">
            {sections.map((section) => (
              <motion.div
                key={section.id}
                layout
                className="bg-white rounded-[3.5rem] shadow-xl shadow-blue-900/5 border border-white overflow-hidden group/section"
              >
                <div className="p-12 space-y-12">
                  {/* Section Title */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-[#a3abd7] uppercase tracking-[0.3em] ml-1">{t('group.gallery.editor.section_identity') || "Section Identity"}</label>
                    <input
                      value={section.title}
                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                      className="w-full bg-[#f8faff] border border-[#efefff] focus:ring-2 focus:ring-[#0057bd] rounded-[1.5rem] px-8 py-6 font-headline font-black text-2xl text-[#242c51] placeholder:opacity-20 transition-all"
                      type="text"
                      placeholder={t('group.gallery.editor.section_placeholder') || "e.g. Atmosphere & Vibes"}
                    />
                  </div>

                  {/* Media Type Toggle */}
                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-[#a3abd7] uppercase tracking-[0.3em] ml-1">{t('group.gallery.editor.media_protocol') || "Media Protocol"}</label>
                    <div className="flex bg-[#f8faff] p-2.5 rounded-[2rem] w-fit border border-[#efefff]">
                      <button 
                        onClick={() => updateSection(section.id, { type: 'photos', media: [] })}
                        className={`px-12 py-5 rounded-[1.5rem] font-headline font-black text-xs uppercase tracking-widest flex items-center gap-4 transition-all ${
                          section.type === 'photos' 
                            ? "bg-white text-[#0057bd] shadow-xl shadow-blue-900/10 border border-[#efefff]" 
                            : "text-[#515981] opacity-40 hover:opacity-100"
                        }`}
                      >
                        <span className="material-symbols-outlined text-2xl">photo_library</span>
                        {t('group.gallery.editor.photos') || "Photos"}
                      </button>
                      <button 
                        onClick={() => updateSection(section.id, { type: 'videos', media: [] })}
                        className={`px-12 py-5 rounded-[1.5rem] font-headline font-black text-xs uppercase tracking-widest flex items-center gap-4 transition-all ${
                          section.type === 'videos' 
                            ? "bg-white text-[#0057bd] shadow-xl shadow-blue-900/10 border border-[#efefff]" 
                            : "text-[#515981] opacity-40 hover:opacity-100"
                        }`}
                      >
                        <span className="material-symbols-outlined text-2xl">movie</span>
                        {t('group.gallery.editor.videos') || "Videos"}
                      </button>
                    </div>
                    <p className="text-[11px] font-black text-[#fb5151] italic ml-1 opacity-70">
                      {t('group.gallery.editor.warning_switch_type') || "* Switching types will clear existing media in this section."}
                    </p>
                  </div>

                  {/* Media Grid */}
                  <div className="space-y-8">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black text-[#a3abd7] uppercase tracking-[0.3em]">
                        {section.type === 'photos' ? (t('group.gallery.editor.photo_stream') || "Photo Stream (Max 10)") : (t('group.gallery.editor.cinema_stream') || "Cinema (1 Clip Only)")}
                      </label>
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full ${
                        (section.type === 'photos' && section.media.length >= 10) || (section.type === 'videos' && section.media.length >= 1)
                          ? "bg-[#fb5151]/10 text-[#fb5151]" 
                          : "bg-[#0057bd]/10 text-[#0057bd]"
                      }`}>
                        {section.media.length} / {section.type === 'photos' ? 10 : 1} {t('group.gallery.editor.slots_occupied') || "Slots Occupied"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      {section.media.map((url, idx) => (
                        <motion.div
                          key={idx}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative aspect-square rounded-[2.5rem] overflow-hidden group border-4 border-[#f8faff] shadow-lg"
                        >
                          {section.type === 'photos' ? (
                            <img src={url} alt="Gallery" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-[#242c51] flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-6xl opacity-40">play_circle</span>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <span className="absolute bottom-6 left-6 text-white font-headline font-black text-xs uppercase tracking-widest">{t('group.gallery.editor.active_clip') || "Active Clip"}</span>
                            </div>
                          )}
                          <button 
                            onClick={() => removeMedia(section.id, idx)}
                            className="absolute top-6 right-6 bg-[#fb5151] text-white p-3 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-90 z-10 border-2 border-white/20"
                          >
                            <span className="material-symbols-outlined text-sm font-black">close</span>
                          </button>
                        </motion.div>
                      ))}

                      {/* Add Button */}
                      {((section.type === 'photos' && section.media.length < 10) || (section.type === 'videos' && section.media.length < 1)) && (
                        <button 
                          onClick={() => triggerUpload(section.id)}
                          disabled={loading}
                          className="aspect-square rounded-[2.5rem] border-4 border-dashed border-[#f1f3ff] hover:border-[#0057bd]/30 hover:bg-[#0057bd]/5 transition-all flex flex-col items-center justify-center gap-6 group/add disabled:opacity-50 relative overflow-hidden"
                        >
                          {uploadingSectionId === section.id ? (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 animate-in fade-in duration-300">
                              <div className="relative w-16 h-16">
                                <svg className="w-full h-full -rotate-90">
                                  <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    fill="transparent"
                                    className="text-slate-100"
                                  />
                                  <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    fill="transparent"
                                    strokeDasharray={2 * Math.PI * 28}
                                    strokeDashoffset={2 * Math.PI * 28 * (1 - uploadProgress / 100)}
                                    className="text-[#0057bd] transition-all duration-300 ease-out"
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-[12px] font-black text-[#0057bd]">
                                    {isOptimizing ? "..." : `${uploadProgress}%`}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] font-black text-[#0057bd] uppercase tracking-widest mt-4">
                                {isOptimizing ? (t('group.gallery.editor.optimizing') || "Optimizing...") : (t('group.gallery.editor.syncing') || "Syncing...")}
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="w-20 h-20 rounded-full bg-[#f8faff] flex items-center justify-center group-hover/add:scale-110 group-hover/add:bg-white shadow-inner transition-all">
                                <span className="material-symbols-outlined text-5xl text-[#a3abd7] group-hover/add:text-[#0057bd]">
                                  {section.type === 'photos' ? "add_a_photo" : "video_call"}
                                </span>
                              </div>
                              <span className="text-[11px] font-black text-[#a3abd7] uppercase tracking-[0.3em] group-hover/add:text-[#0057bd]">
                                {t('group.gallery.editor.add_content') || "Add Content"}
                              </span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Section Footer / Remove Button */}
                {sections.length > 1 && (
                  <button 
                    onClick={() => removeSection(section.id)}
                    className="w-full py-8 bg-[#fffafa] text-[#fb5151] font-black uppercase tracking-[0.3em] text-[10px] hover:bg-[#fb5151] hover:text-white transition-all flex items-center justify-center gap-3 border-t border-[#fb5151]/10"
                  >
                    <span className="material-symbols-outlined text-lg">delete_sweep</span>
                    {t('group.gallery.editor.terminate_section') || "Terminate Section"}
                  </button>
                )}
              </motion.div>
            ))}

            {/* Add New Section Button */}
            <button
              onClick={addSection}
              className="w-full py-24 border-4 border-dashed border-[#0057bd]/10 rounded-[4rem] flex flex-col items-center justify-center gap-8 text-[#0057bd] font-black group hover:bg-[#0057bd]/5 hover:border-[#0057bd]/40 transition-all active:scale-[0.99]"
            >
              <div className="w-24 h-24 rounded-full bg-[#0057bd]/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#0057bd]/20 transition-all shadow-lg shadow-[#0057bd]/5">
                <span className="material-symbols-outlined text-6xl">add_circle</span>
              </div>
              <div className="text-center space-y-2">
                <span className="block text-2xl italic uppercase tracking-[0.4em]">{t('group.gallery.editor.init_section') || "Initialize Section"}</span>
                <span className="block text-[10px] font-black text-[#a3abd7] uppercase tracking-widest opacity-60">{t('group.gallery.editor.expand_story') || "Expand your community story"}</span>
              </div>
            </button>
          </div>
        </div>
      </main>
    </motion.div>
  );
}

