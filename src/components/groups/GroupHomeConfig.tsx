"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Group, ServiceItem } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { storageService } from "@/lib/firebase/storageService";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRef } from "react";
import { toast } from "sonner";

interface GroupHomeConfigProps {
  group: Group;
  onClose: () => void;
  onSave?: () => void;
}

export default function GroupHomeConfig({ group, onClose, onSave }: GroupHomeConfigProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: group.name || "",
    nativeName: group.nativeName || "",
    slug: group.slug || "",
    story: group.story || "",
    coverImage: group.coverImage || "",
    logo: group.logo || "",
    bankDetails: group.bankDetails || { bankName: "", accountHolder: "", accountNumber: "" },
    businessRegistrationNumber: group.businessRegistrationNumber || "",
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
      toast.success("Brand settings saved successfully!");
      if (onSave) onSave();
    } catch (error) {
      console.error("Failed to save group config:", error);
      toast.error("Failed to save settings. Please try again.");
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
      toast.error("At least one core service is required.");
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
      toast.success(`${uploadingType === "cover" ? "Cover" : "Logo"} uploaded!`);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Image upload failed. Please try again.");
    } finally {
      setLoading(false);
      setUploadingType(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-background text-on-surface min-h-screen pb-32">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      {/* Section Header */}
      <div className="px-5 pt-6 pb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-[24px] leading-[1.3] font-semibold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>Brand Settings</h2>
            <p className="text-[14px] leading-[1.4] tracking-[0.01em] font-medium text-on-surface-variant mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>Manage your community&apos;s identity and presence</p>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-primary text-on-primary px-6 py-3 rounded-full text-[14px] leading-[1.4] tracking-[0.01em] font-medium shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">check</span>
                Save
              </>
            )}
          </button>
        </div>
      </div>

      {/* Section 1: Brand Identity */}
      <section className="px-5 mb-8">
        <div className="bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.03)] border border-white/20 overflow-hidden">
          {/* Section Title */}
          <div className="px-6 pt-6 pb-4 border-b border-outline/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
              </div>
              <div>
                <h3 className="text-[16px] leading-[1.6] font-semibold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>Brand Identity</h3>
                <p className="text-[12px] leading-[1.2] font-medium text-on-surface-variant" style={{ fontFamily: "'Inter', sans-serif" }}>Name and access path</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Names Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Global Brand Name</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[16px] font-medium placeholder:text-on-surface-variant/30"
                  placeholder="e.g. Kinetic Sky"
                  type="text"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Localized Name</label>
                <input
                  value={formData.nativeName}
                  onChange={(e) => setFormData({ ...formData, nativeName: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[16px] font-medium placeholder:text-on-surface-variant/30"
                  placeholder={t('group.homeConfig.placeholder.nativeName', 'e.g. 키네틱 스카이')}
                  type="text"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Unique URL Path</label>
              <div className="flex items-center bg-surface-container-low border border-outline/10 rounded-xl px-4 overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
                <span className="text-on-surface-variant/40 text-[14px] font-medium py-3.5 whitespace-nowrap" style={{ fontFamily: "'Inter', sans-serif" }}>woc.today/groups/</span>
                <input
                  value={formData.slug}
                  readOnly
                  className="flex-1 bg-transparent border-none focus:ring-0 py-3.5 text-on-surface-variant/70 text-[14px] font-medium cursor-not-allowed"
                  placeholder="brandname"
                  type="text"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>
              <p className="text-[11px] text-on-surface-variant/60 font-medium ml-1" style={{ fontFamily: "'Inter', sans-serif" }}>This slug defines your group&apos;s permanent direct link.</p>
            </div>

            {/* Logo & Cover */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Logo</label>
                <div 
                  onClick={() => triggerUpload("logo")}
                  className="relative aspect-square w-full max-w-[120px] bg-surface-container-low border-2 border-dashed border-outline/15 rounded-2xl overflow-hidden group/logo cursor-pointer hover:border-primary/30 transition-all"
                >
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <span className="material-symbols-outlined text-on-surface-variant/30 text-[28px]">add_photo_alternate</span>
                      <span className="text-[10px] text-on-surface-variant/40 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Upload</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                    <span className="material-symbols-outlined text-white text-[20px]">edit</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Cover Image</label>
                <div 
                  onClick={() => triggerUpload("cover")}
                  className="relative aspect-video bg-surface-container-low border-2 border-dashed border-outline/15 rounded-2xl overflow-hidden group/cover cursor-pointer hover:border-primary/30 transition-all"
                >
                  {formData.coverImage ? (
                    <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <span className="material-symbols-outlined text-on-surface-variant/30 text-[28px]">landscape</span>
                      <span className="text-[10px] text-on-surface-variant/40 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Upload</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                    <span className="material-symbols-outlined text-white text-[20px]">edit</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Brand Story */}
      <section className="px-5 mb-8">
        <div className="bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.03)] border border-white/20 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-outline/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-[20px]">auto_stories</span>
              </div>
              <div>
                <h3 className="text-[16px] leading-[1.6] font-semibold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>Brand Story</h3>
                <p className="text-[12px] leading-[1.2] font-medium text-on-surface-variant" style={{ fontFamily: "'Inter', sans-serif" }}>The heart of your community</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <textarea
              value={formData.story}
              onChange={(e) => setFormData({ ...formData, story: e.target.value })}
              className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-4 text-on-surface text-[16px] leading-relaxed font-normal resize-none placeholder:text-on-surface-variant/30 min-h-[200px]"
              placeholder="Tell your story... What inspires your community?"
              style={{ fontFamily: "'Inter', sans-serif" }}
            ></textarea>
          </div>
        </div>
      </section>

      {/* Section 3: Core Services */}
      <section className="px-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary text-[20px]">widgets</span>
            </div>
            <div>
              <h3 className="text-[16px] leading-[1.6] font-semibold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>Core Services</h3>
              <p className="text-[12px] leading-[1.2] font-medium text-on-surface-variant" style={{ fontFamily: "'Inter', sans-serif" }}>Highlight your key features</p>
            </div>
          </div>
          <button
            onClick={() => setIsBottomSheetOpen(true)}
            className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        </div>

        <div className="space-y-4">
          {formData.services.map((service, index) => (
            <motion.div
              layout
              key={index}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.03)] border border-white/20 overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${service.color}15`, color: service.color }}>
                    <span className="material-symbols-outlined text-[24px]">{service.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      value={service.title}
                      onChange={(e) => updateService(index, "title", e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-0 p-0 text-on-surface text-[16px] font-semibold placeholder:text-on-surface-variant/30"
                      type="text"
                      placeholder="Service name..."
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    />
                  </div>
                  {formData.services.length > 1 && (
                    <button 
                      onClick={() => removeService(index)}
                      className="text-error/60 hover:text-error p-2 hover:bg-error/5 rounded-xl transition-all active:scale-90 shrink-0"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  )}
                </div>
                <textarea
                  value={service.description}
                  onChange={(e) => updateService(index, "description", e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3 text-on-surface text-[14px] leading-relaxed font-normal resize-none placeholder:text-on-surface-variant/30"
                  rows={3}
                  placeholder="Describe this service..."
                  style={{ fontFamily: "'Inter', sans-serif" }}
                ></textarea>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Section 4: Payment & Business Info */}
      <section className="px-5 mb-8">
        <div className="bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.03)] border border-white/20 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-outline/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-error text-[20px]">account_balance</span>
              </div>
              <div>
                <h3 className="text-[16px] leading-[1.6] font-semibold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>Payment & Business</h3>
                <p className="text-[12px] leading-[1.2] font-medium text-on-surface-variant" style={{ fontFamily: "'Inter', sans-serif" }}>Financial and official details</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Bank Name</label>
                <input
                  value={formData.bankDetails.bankName}
                  onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, bankName: e.target.value } })}
                  className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[16px] font-medium placeholder:text-on-surface-variant/30"
                  placeholder="e.g. KakaoBank"
                  type="text"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Account Holder</label>
                <input
                  value={formData.bankDetails.accountHolder}
                  onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, accountHolder: e.target.value } })}
                  className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[16px] font-medium placeholder:text-on-surface-variant/30"
                  placeholder="e.g. John Doe"
                  type="text"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Account Number</label>
              <input
                value={formData.bankDetails.accountNumber}
                onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, accountNumber: e.target.value } })}
                className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[16px] font-medium placeholder:text-on-surface-variant/30"
                placeholder="e.g. 3333-01-2345678"
                type="text"
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Business Registration No.</label>
              <input
                value={formData.businessRegistrationNumber}
                onChange={(e) => setFormData({ ...formData, businessRegistrationNumber: e.target.value })}
                className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[16px] font-medium placeholder:text-on-surface-variant/30"
                placeholder="e.g. 123-45-67890"
                type="text"
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Floating Save Button (Mobile) */}
      <div className="fixed bottom-6 left-5 right-5 z-40 md:hidden">
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-primary text-on-primary py-4 rounded-2xl text-[16px] font-semibold shadow-[0_10px_20px_rgba(0,88,188,0.2)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
              Saving...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">check</span>
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Bottom Sheet for Adding Service */}
      <AnimatePresence>
        {isBottomSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBottomSheetOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[120] bg-white rounded-t-3xl p-6 pb-10 max-w-lg mx-auto shadow-2xl border-t border-outline/5"
            >
              <div className="w-10 h-1 bg-outline/15 rounded-full mx-auto mb-6" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">bolt</span>
                </div>
                <div>
                  <h3 className="text-[18px] font-semibold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>New Service</h3>
                  <p className="text-[12px] text-on-surface-variant font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Add a core feature to your home page</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Service Name</label>
                  <input
                    value={newService.title}
                    onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[16px] font-medium placeholder:text-on-surface-variant/30"
                    placeholder="e.g. Masterclass Series"
                    autoFocus
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Description</label>
                  <textarea
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[14px] leading-relaxed font-normal placeholder:text-on-surface-variant/30 resize-none"
                    placeholder="Describe the service..."
                    rows={4}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsBottomSheetOpen(false)}
                    className="flex-1 py-3.5 rounded-xl text-on-surface-variant text-[14px] font-medium hover:bg-surface-container-low transition-all"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addService}
                    className="flex-[2] py-3.5 rounded-xl bg-primary text-on-primary text-[14px] font-medium shadow-sm hover:opacity-90 active:scale-95 transition-all"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Add Service
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
