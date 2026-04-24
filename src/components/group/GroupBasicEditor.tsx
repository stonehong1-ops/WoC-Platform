"use client";
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Group } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { storageService } from "@/lib/firebase/storageService";

interface GroupBasicEditorProps {
  group: Group;
  onClose: () => void;
}

export default function GroupBasicEditor({ group, onClose }: GroupBasicEditorProps) {
  const [formData, setFormData] = useState({
    name: group.name || "",
    nativeName: group.nativeName || "",
    slug: group.slug || "",
    coverImage: group.coverImage || "",
    coverImageDescription: group.coverImageDescription || "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'coverImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    try {
      const path = `groups/${group.id}/${field}_${Date.now()}`;
      const downloadURL = await storageService.uploadFile(file, path);
      setFormData(prev => ({ ...prev, [field]: downloadURL }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      alert("이름과 슬러그는 필수 항목입니다.");
      return;
    }

    setIsSaving(true);
    try {
      await groupService.updateGroupMetadata(group.id, {
        name: formData.name,
        nativeName: formData.nativeName,
        slug: formData.slug,
        coverImage: formData.coverImage,
        coverImageDescription: formData.coverImageDescription,
      });
      onClose();
    } catch (error) {
      console.error("Error saving basic info:", error);
      alert("정보 저장 중 오류가 발생했습니다.");
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
              <h1 className="text-lg font-headline font-black text-white tracking-tight">Identity & Branding</h1>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Group Core Configuration</p>
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
                <span>SAVING...</span>
              </>
            ) : (
              "SAVE CHANGES"
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
              Branding Assets
            </h2>
            <p className="text-white/40 font-medium ml-6">커뮤니티의 첫인상을 결정하는 시각적 요소를 설정하세요.</p>
          </div>

          <div className="space-y-8 ml-6">
            {/* Cover Image Upload */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a3abd7]/40 ml-1">Hero Section Image</label>
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
                      <span className="text-white font-headline font-black text-xs tracking-widest">CHANGE COVER</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4 text-white/20">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                      <span className="material-symbols-outlined text-5xl">panorama</span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-black tracking-widest text-white/40">UPLOAD HERO IMAGE</p>
                      <p className="text-[10px] font-bold opacity-50 mt-1">Recommended: 1920x820px</p>
                    </div>
                  </div>
                )}
                {uploadingField === 'coverImage' && (
                  <div className="absolute inset-0 bg-[#0a0f1d]/80 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-3 border-[#0057bd] border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] font-black tracking-widest text-[#0057bd]">UPLOADING...</span>
                    </div>
                  </div>
                )}
              </div>
              <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'coverImage')} />
            </div>

            {/* Cover Image Description */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a3abd7]/40 ml-1">Primary Catchphrase (Hero Slogan)</label>
              <div className="relative group">
                <input
                  type="text"
                  value={formData.coverImageDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, coverImageDescription: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 focus:bg-white/10 focus:border-[#0057bd]/40 outline-none rounded-3xl px-8 py-5 font-headline font-black text-white text-lg transition-all shadow-inner"
                  placeholder="커뮤니티를 대표하는 강력한 문구를 입력하세요"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-focus-within:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-white/20 text-sm">edit</span>
                </div>
              </div>
              <p className="text-[11px] text-white/30 font-medium ml-2 italic">대시보드 메인 상단에 표시되어 방문자의 시선을 사로잡습니다.</p>
            </div>
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent ml-6" />

        {/* Identity Section */}
        <section className="space-y-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-headline font-black text-white flex items-center gap-4">
              <span className="w-2 h-10 bg-[#0057bd] rounded-full"></span>
              Core Identity
            </h2>
            <p className="text-white/40 font-medium ml-6">공식 명칭과 고유 식별 정보를 관리합니다.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 ml-6">
            {/* Group Name */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a3abd7]/40 ml-1">Global Display Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 focus:bg-white/10 focus:border-[#0057bd]/40 outline-none rounded-3xl px-8 py-5 font-headline font-black text-white text-lg transition-all"
                placeholder="예: Freestyle Tango"
              />
            </div>

            {/* Native Name */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a3abd7]/40 ml-1">Local Identity Name</label>
              <input
                type="text"
                value={formData.nativeName}
                onChange={(e) => setFormData(prev => ({ ...prev, nativeName: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 focus:bg-white/10 focus:border-[#0057bd]/40 outline-none rounded-3xl px-8 py-5 font-headline font-black text-white text-lg transition-all"
                placeholder="자국어 이름을 입력하세요"
              />
            </div>

            {/* Slug */}
            <div className="space-y-4 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a3abd7]/40 ml-1">Unique URL Identifier (Slug)</label>
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
                  <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">Permanent</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="pb-10" />
      </main>
    </motion.div>
  );
}
