"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Group, ServiceItem } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { storageService } from "@/lib/firebase/storageService";
import { useRef } from "react";

interface GroupHomeConfigProps {
  group: Group;
  onClose: () => void;
  onSave?: () => void;
}

export default function GroupHomeConfig({ group, onClose, onSave }: GroupHomeConfigProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: group.name || "",
    nativeName: group.nativeName || "",
    slug: group.slug || "",
    story: group.story || "",
    coverImage: group.coverImage || "",
    logo: group.logo || "",
    services: group.services && group.services.length > 0 ? group.services : [
      {
        title: "The core services of this group",
        description: "Record detailed descriptions here. Emoticons and emojis can be used.",
        icon: "star",
        color: "#0057bd"
      }
    ]
  });

  const [uploadingType, setUploadingType] = useState<"cover" | "logo" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [newService, setNewService] = useState<ServiceItem>({
    title: "",
    description: "",
    icon: "bolt",
    color: "#893c92"
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await groupService.updateGroupMetadata(group.id, formData);
      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save group config:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addService = () => {
    if (!newService.title.trim()) return;
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, newService]
    }));
    setNewService({ title: "", description: "", icon: "bolt", color: "#893c92" });
    setIsBottomSheetOpen(false);
  };

  const removeService = (index: number) => {
    if (formData.services.length <= 1) {
      alert("At least one core service is required to maintain brand presence.");
      return; 
    }
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const updateService = (index: number, field: keyof ServiceItem, value: string) => {
    const updated = [...formData.services];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, services: updated }));
  };

  const triggerUpload = (type: "cover" | "logo") => {
    setUploadingType(type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingType) return;

    setLoading(true);
    try {
      const path = `groups/${group.id}/branding/${uploadingType}_${Date.now()}_${file.name}`;
      const url = await storageService.uploadFile(file, path);
      
      setFormData(prev => ({
        ...prev,
        [uploadingType === "cover" ? "coverImage" : "logo"]: url
      }));
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Image upload failed. Please try again.");
    } finally {
      setLoading(false);
      setUploadingType(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-[#f7f5ff] overflow-y-auto font-body"
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
      {/* TopAppBar */}
      <header className="w-full sticky top-0 z-50 bg-[#f7f5ff]/90 backdrop-blur-xl border-b border-[#efefff] flex justify-between items-center px-8 h-24">
        <div className="flex items-center gap-6">
          <button
            onClick={onClose}
            className="text-[#515981] hover:bg-white p-3 rounded-2xl transition-all shadow-sm active:scale-90"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <div>
            <h1 className="font-headline font-black text-2xl text-[#242c51] tracking-tight italic uppercase">Home Config</h1>
            <p className="text-[#a3abd7] text-[10px] font-black uppercase tracking-[0.2em] mt-0.5 opacity-60">Digital Presence Management</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-[#0057bd] text-white px-10 py-4 rounded-[1.25rem] font-headline font-black text-sm uppercase tracking-widest shadow-xl shadow-[#0057bd]/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-8 pt-20 space-y-24 pb-48">
        {/* Section 1: Brand Identity */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4 sticky top-32">
            <h2 className="font-headline text-3xl font-black text-[#242c51] tracking-tight">Brand Identity</h2>
            <p className="text-[#515981] text-lg mt-3 leading-relaxed font-medium opacity-70">Define your community&apos;s name and access path.</p>
          </div>
          <div className="lg:col-span-8 bg-white p-12 rounded-[3rem] shadow-xl shadow-blue-900/5 space-y-12 border border-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-[#a3abd7] uppercase tracking-[0.3em] ml-1">Global Brand Name</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#f8faff] border border-[#efefff] focus:ring-2 focus:ring-[#0057bd] rounded-2xl px-7 py-6 text-[#242c51] font-black text-xl placeholder:opacity-20"
                  placeholder="e.g. Kinetic Sky"
                  type="text"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-[#a3abd7] uppercase tracking-[0.3em] ml-1">Localized Brand Name</label>
                <input
                  value={formData.nativeName}
                  onChange={(e) => setFormData({ ...formData, nativeName: e.target.value })}
                  className="w-full bg-[#f8faff] border border-[#efefff] focus:ring-2 focus:ring-[#0057bd] rounded-2xl px-7 py-6 text-[#242c51] font-bold text-xl placeholder:opacity-20"
                  placeholder="키네틱 스카이"
                  type="text"
                />
              </div>
            </div>
            
            <div className="space-y-4 pt-10 border-t border-[#f7f5ff]">
              <label className="text-[10px] font-black text-[#a3abd7] uppercase tracking-[0.3em] ml-1">Unique URL Path</label>
              <div className="flex items-center bg-[#f8faff] border border-[#efefff] rounded-2xl px-7 overflow-hidden focus-within:ring-2 focus-within:ring-[#0057bd] transition-all">
                <span className="text-[#515981] opacity-30 font-black py-6 text-sm tracking-widest">woc.today/group/</span>
                <input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="flex-1 bg-transparent border-none focus:ring-0 py-6 text-[#242c51] font-black text-sm tracking-tight"
                  placeholder="brandname"
                  type="text"
                />
              </div>
              <p className="text-[10px] text-[#a3abd7] font-black mt-3 ml-1 italic tracking-wider opacity-60">* This unique slug defines your group&apos;s permanent direct link.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-[#f7f5ff]">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-[#a3abd7] uppercase tracking-[0.3em] ml-1">Group Logo</label>
                <div 
                  onClick={() => triggerUpload("logo")}
                  className="relative aspect-square w-32 bg-[#f8faff] border-2 border-dashed border-[#efefff] rounded-3xl overflow-hidden group/logo cursor-pointer hover:border-[#0057bd]/30 transition-all"
                >
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#a3abd7] text-3xl">add_photo_alternate</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Update</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="text-[10px] font-black text-[#a3abd7] uppercase tracking-[0.3em] ml-1">Cover Narrative Image</label>
                <div 
                  onClick={() => triggerUpload("cover")}
                  className="relative aspect-video bg-[#f8faff] border-2 border-dashed border-[#efefff] rounded-3xl overflow-hidden group/cover cursor-pointer hover:border-[#0057bd]/30 transition-all"
                >
                  {formData.coverImage ? (
                    <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#a3abd7] text-3xl">landscape</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-[10px] font-black uppercase tracking-widest text-center px-4">Change Visual Narrative</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-[#efefff] to-transparent max-w-2xl mx-auto" />

        {/* Section 2: Brand Story */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4 sticky top-32">
            <h2 className="font-headline text-3xl font-black text-[#242c51] tracking-tight">Brand Story</h2>
            <p className="text-[#515981] text-lg mt-3 leading-relaxed font-medium opacity-70">The heart of your community, shared with the world.</p>
          </div>
          <div className="lg:col-span-8 bg-white p-12 rounded-[3rem] shadow-xl shadow-blue-900/5 border border-white">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-[#a3abd7] uppercase tracking-[0.3em] ml-1">The Narrative</label>
              <textarea
                value={formData.story}
                onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                className="w-full bg-[#f8faff] border border-[#efefff] focus:ring-2 focus:ring-[#0057bd] rounded-2xl px-8 py-7 text-[#242c51] placeholder:opacity-20 resize-none font-body text-lg leading-relaxed font-medium min-h-[300px]"
                placeholder="Tell your story... What inspires your community?"
              ></textarea>
            </div>
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-[#efefff] to-transparent max-w-2xl mx-auto" />

        {/* Section 3: Key Services */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4 sticky top-32">
            <h2 className="font-headline text-3xl font-black text-[#242c51] tracking-tight">Key Services</h2>
            <p className="text-[#515981] text-lg mt-3 leading-relaxed font-medium opacity-70">Highlight the defining programs and features of your community.</p>
          </div>
          <div className="lg:col-span-8 space-y-10">
            <div className="grid grid-cols-1 gap-8">
              {formData.services.map((service, index) => (
                <motion.div
                  layout
                  key={index}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-10 rounded-[3rem] shadow-md border border-[#efefff] space-y-8 relative group hover:shadow-2xl transition-all"
                >
                  <div className="flex items-start justify-between gap-8">
                    <div className="flex items-center gap-8 flex-1">
                      <div className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-inner" style={{ backgroundColor: `${service.color}10`, color: service.color }}>
                        <span className="material-symbols-outlined text-4xl">{service.icon}</span>
                      </div>
                      <div className="flex-1 space-y-3">
                        <label className="text-[10px] font-black text-[#a3abd7] uppercase tracking-[0.3em]">Service Headline</label>
                        <input
                          value={service.title}
                          onChange={(e) => updateService(index, "title", e.target.value)}
                          className="w-full bg-[#f8faff] border-none focus:ring-2 focus:ring-[#0057bd] rounded-xl px-6 py-4 text-[#242c51] font-black text-xl placeholder:opacity-20"
                          type="text"
                          placeholder="e.g. Weekly Milonga Experience"
                        />
                      </div>
                    </div>
                    {formData.services.length > 1 && (
                      <button 
                        onClick={() => removeService(index)}
                        className="text-[#fb5151] p-4 hover:bg-[#fb5151]/10 rounded-2xl transition-all active:scale-90"
                      >
                        <span className="material-symbols-outlined text-2xl font-bold">delete</span>
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[#a3abd7] uppercase tracking-[0.3em]">Service Description</label>
                    <textarea
                      value={service.description}
                      onChange={(e) => updateService(index, "description", e.target.value)}
                      className="w-full bg-[#f8faff] border-none focus:ring-2 focus:ring-[#0057bd] rounded-xl px-6 py-5 text-[#242c51] text-lg leading-relaxed font-medium resize-none placeholder:opacity-20"
                      rows={4}
                      placeholder="Detail the service. Emojis and formatting are encouraged!"
                    ></textarea>
                  </div>
                </motion.div>
              ))}

              <button
                onClick={() => setIsBottomSheetOpen(true)}
                className="w-full py-20 border-4 border-dashed border-[#0057bd]/10 rounded-[3.5rem] flex flex-col items-center justify-center gap-6 text-[#0057bd] font-black group hover:bg-[#0057bd]/5 hover:border-[#0057bd]/30 transition-all active:scale-[0.99]"
              >
                <div className="w-20 h-20 rounded-full bg-[#0057bd]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-5xl">add</span>
                </div>
                <span className="text-xl uppercase tracking-[0.3em]">Add New Core Service</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Sheet for Adding Service */}
      <AnimatePresence>
        {isBottomSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBottomSheetOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[110]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[120] bg-white rounded-t-[4rem] p-16 pb-20 max-w-3xl mx-auto shadow-2xl border-t border-white/20"
            >
              <div className="w-20 h-2 bg-[#efefff] rounded-full mx-auto mb-12" />
              <div className="flex items-center gap-8 mb-12">
                <div className="w-16 h-16 rounded-[1.5rem] bg-[#0057bd]/10 text-[#0057bd] flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-4xl">bolt</span>
                </div>
                <div>
                  <h3 className="font-headline text-3xl font-black text-[#242c51] tracking-tight italic uppercase">New Service</h3>
                  <p className="text-[#a3abd7] text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-60">Add a core feature to your home page</p>
                </div>
              </div>
              
              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-[#a3abd7] uppercase tracking-[0.3em] ml-1">Service Headline</label>
                  <input
                    value={newService.title}
                    onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                    className="w-full bg-[#f8faff] border border-[#efefff] focus:ring-2 focus:ring-[#0057bd] rounded-2xl px-8 py-6 text-[#242c51] font-black text-xl placeholder:opacity-20"
                    placeholder="e.g. Masterclass Series"
                    autoFocus
                  />
                </div>
                
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-[#a3abd7] uppercase tracking-[0.3em] ml-1">Service Narrative</label>
                  <textarea
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    className="w-full bg-[#f8faff] border border-[#efefff] focus:ring-2 focus:ring-[#0057bd] rounded-2xl px-8 py-6 text-[#242c51] font-medium text-lg leading-relaxed placeholder:opacity-20 resize-none"
                    placeholder="Explain the service details..."
                    rows={5}
                  />
                </div>

                <div className="flex gap-6 pt-10">
                  <button
                    onClick={() => setIsBottomSheetOpen(false)}
                    className="flex-1 py-6 rounded-[2rem] text-[#515981] font-black uppercase tracking-[0.3em] text-xs hover:bg-[#f8faff] transition-all"
                  >
                    Discard
                  </button>
                  <button
                    onClick={addService}
                    className="flex-[2] py-6 rounded-[2rem] bg-[#0057bd] text-white font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-[#0057bd]/30 hover:opacity-90 active:scale-95 transition-all"
                  >
                    Publish to Home
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
