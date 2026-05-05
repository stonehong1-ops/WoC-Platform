"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleMap, Marker, Autocomplete } from "@react-google-maps/api";
import { Group } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { storageService } from "@/lib/firebase/storageService";

interface GroupContactEditorProps {
  group: Group;
  isLoaded: boolean;
  onClose: () => void;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapId: "425069951fef97d91810ab94", // Premium Map ID
};

export default function GroupContactEditor({ group, isLoaded, onClose }: GroupContactEditorProps) {
  const [formData, setFormData] = useState({
    representative: group.representative || { name: "", phone: "", avatar: "" },
    address: group.address || "",
    detailedAddress: group.detailedAddress || "",
    publicTransport: group.publicTransport || "",
    coordinates: group.coordinates || { latitude: 37.5665, longitude: 126.9780 },
    socialLinks: group.socialLinks || {
      facebook: "",
      instagram: "",
      twitter: "",
      website: ""
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const latitude = place.geometry.location.lat();
        const longitude = place.geometry.location.lng();
        const address = place.formatted_address || "";

        setFormData(prev => ({
          ...prev,
          coordinates: { latitude, longitude },
          address: address
        }));

        if (map) {
          map.panTo({ lat: latitude, lng: longitude });
          map.setZoom(17);
        }
      }
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const path = `groups/${group.id}/representative_${Date.now()}`;
      const downloadURL = await storageService.uploadFile(file, path);
      setFormData(prev => ({
        ...prev,
        representative: { ...prev.representative, avatar: downloadURL }
      }));
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await groupService.updateGroupMetadata(group.id, {
        representative: formData.representative,
        address: formData.address,
        detailedAddress: formData.detailedAddress,
        publicTransport: formData.publicTransport,
        coordinates: formData.coordinates,
        socialLinks: formData.socialLinks
      });
      onClose();
    } catch (error) {
      console.error("Error saving contact info:", error);
      alert("Failed to save information.");
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
        <div className="absolute top-[20%] left-[-5%] w-[40%] h-[40%] bg-[#0057bd]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/5 blur-[100px] rounded-full animate-pulse" />
      </div>

      {/* Top Bar - Glassmorphism */}
      <header className="sticky top-0 z-50 bg-[#0a0f1d]/60 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between w-full">
          <div className="flex items-center gap-5">
            <button 
              onClick={onClose}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all group"
            >
              <span className="material-symbols-outlined group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            </button>
            <div>
              <h1 className="text-lg font-headline font-black text-white tracking-tight">Contact Settings</h1>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Location & Networks</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || isUploading}
            className={`px-10 py-3 rounded-2xl font-headline font-black text-sm transition-all active:scale-95 flex items-center gap-2 ${
              isSaving || isUploading
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

      <main className="max-w-4xl mx-auto w-full px-6 py-12 relative z-10 space-y-16 mb-20">
        
        {/* Intro Section */}
        <section className="space-y-4 ml-6">
          <h2 className="text-4xl font-headline font-black text-white tracking-tight leading-tight">Establish your<br/>presence</h2>
          <p className="text-white/40 font-medium max-w-xl">커뮤니티의 물리적 위치와 주요 연락처 정보를 설정하여 멤버들이 쉽게 찾아오고 소통할 수 있게 합니다.</p>
        </section>

        {/* Representative Section */}
        <section className="space-y-10">
          <h3 className="text-xl font-headline font-black text-white flex items-center gap-4 ml-6">
            <span className="w-2 h-7 bg-[#0057bd] rounded-full"></span>
            Representative Identity
          </h3>
          <div className="bg-white/[0.03] backdrop-blur-xl p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl ml-6">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <div className="w-36 h-36 rounded-full bg-[#0a0f1d] flex items-center justify-center overflow-hidden border-2 border-dashed border-white/10 group-hover:border-[#0057bd] transition-all shadow-inner relative">
                  {formData.representative.avatar ? (
                    <img src={formData.representative.avatar} alt="Avatar" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  ) : (
                    <span className="material-symbols-outlined text-7xl text-white/10">account_circle</span>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-[#0a0f1d]/80 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-[#0057bd] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-[#0057bd] text-white p-3 rounded-2xl shadow-2xl border-4 border-[#121829] group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                </div>
                <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </div>
              
              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">Full Representative Name</label>
                  <input
                    className="w-full bg-white/5 border border-white/5 focus:bg-white/10 focus:border-[#0057bd]/40 outline-none rounded-2xl px-6 py-4 font-headline font-bold text-white transition-all shadow-inner"
                    type="text"
                    value={formData.representative.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      representative: { ...prev.representative, name: e.target.value }
                    }))}
                    placeholder="이름 입력"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">Direct Contact Line</label>
                  <input
                    className="w-full bg-white/5 border border-white/5 focus:bg-white/10 focus:border-[#0057bd]/40 outline-none rounded-2xl px-6 py-4 font-headline font-bold text-white transition-all shadow-inner"
                    type="tel"
                    value={formData.representative.phone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      representative: { ...prev.representative, phone: e.target.value }
                    }))}
                    placeholder="+82 10-0000-0000"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="space-y-10">
          <h3 className="text-xl font-headline font-black text-white flex items-center gap-4 ml-6">
            <span className="w-2 h-7 bg-[#0057bd] rounded-full"></span>
            Physical Location
          </h3>
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl ml-6">
            <div className="h-[450px] w-full relative bg-[#0a0f1d]">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={{ lat: formData.coordinates.latitude, lng: formData.coordinates.longitude }}
                  zoom={16}
                  onLoad={onMapLoad}
                  options={mapOptions}
                >
                  <Marker 
                    position={{ lat: formData.coordinates.latitude, lng: formData.coordinates.longitude }}
                  />
                </GoogleMap>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-pulse flex flex-col items-center gap-4 text-white/20">
                    <span className="material-symbols-outlined text-6xl">map</span>
                    <span className="font-black uppercase tracking-[0.3em] text-[10px]">Synchronizing Maps...</span>
                  </div>
                </div>
              )}
              
              {/* Floating Address Search */}
              <div className="absolute top-8 left-8 right-8 z-10">
                {isLoaded && (
                  <Autocomplete
                    onLoad={(ref) => (autocompleteRef.current = ref)}
                    onPlaceChanged={onPlaceChanged}
                  >
                    <div className="relative group max-w-2xl mx-auto">
                      <input
                        className="w-full bg-[#0a0f1d]/80 backdrop-blur-3xl border border-white/10 focus:ring-8 focus:ring-[#0057bd]/10 focus:border-[#0057bd]/40 outline-none rounded-[2rem] pl-16 pr-8 py-5 font-headline font-bold text-white transition-all shadow-2xl"
                        placeholder="커뮤니티 주소를 검색하세요..."
                        type="text"
                      />
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#0057bd] flex items-center justify-center shadow-lg shadow-blue-900/40">
                        <span className="material-symbols-outlined text-white text-sm">search</span>
                      </div>
                    </div>
                  </Autocomplete>
                )}
              </div>
            </div>
            
            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">Verified Address</label>
                  <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 flex items-center gap-4 opacity-50">
                    <span className="material-symbols-outlined text-[#0057bd] text-xl">verified</span>
                    <span className="font-headline font-bold text-white text-sm truncate">
                      {formData.address || "지도를 통해 주소를 검색하세요"}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">Building Detail / Suite</label>
                  <input
                    className="w-full bg-white/5 border border-white/5 focus:bg-white/10 focus:border-[#0057bd]/40 outline-none rounded-2xl px-6 py-4 font-headline font-bold text-white transition-all"
                    type="text"
                    value={formData.detailedAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, detailedAddress: e.target.value }))}
                    placeholder="층수, 호수 또는 주요 랜드마크"
                  />
                </div>
              </div>
              
              <div className="space-y-3 flex flex-col">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">Public Transit Guide</label>
                <textarea
                  className="flex-1 min-h-[160px] bg-white/5 border border-white/5 focus:bg-white/10 focus:border-[#0057bd]/40 outline-none rounded-2xl px-6 py-5 font-medium text-white transition-all resize-none leading-relaxed shadow-inner"
                  value={formData.publicTransport}
                  onChange={(e) => setFormData(prev => ({ ...prev, publicTransport: e.target.value }))}
                  placeholder="대중교통(버스, 지하철) 이용 방법이나 주차 정보를 입력하세요..."
                />
              </div>
            </div>
          </div>
        </section>

        {/* Social Network Section */}
        <section className="space-y-10">
          <h3 className="text-xl font-headline font-black text-white flex items-center gap-4 ml-6">
            <span className="w-2 h-7 bg-[#0057bd] rounded-full"></span>
            Social Ecosystem
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ml-6">
            {[
              { id: 'instagram', label: 'Instagram', icon: 'photo_camera', color: '#E4405F', placeholder: '@username' },
              { id: 'facebook', label: 'Facebook', icon: 'public', color: '#1877F2', placeholder: 'facebook.com/page' },
              { id: 'twitter', label: 'X (Twitter)', icon: 'close', color: '#FFFFFF', placeholder: '@username' },
              { id: 'website', label: 'Official Site', icon: 'language', color: '#0057bd', placeholder: 'https://...' }
            ].map((sns) => (
              <div key={sns.id} className="p-8 bg-white/[0.03] backdrop-blur-lg rounded-[2.5rem] border border-white/5 flex items-center gap-6 group hover:border-[#0057bd]/30 hover:bg-white/[0.05] transition-all shadow-xl">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-6" style={{ backgroundColor: `${sns.color}15` }}>
                  <span className="material-symbols-outlined text-2xl" style={{ color: sns.color }}>{sns.icon}</span>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">{sns.label}</label>
                  <input
                    className="w-full bg-transparent outline-none font-headline font-black text-white placeholder:text-white/10 text-lg"
                    type="text"
                    value={formData.socialLinks[sns.id as keyof typeof formData.socialLinks] || ""}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, [sns.id]: e.target.value }
                    }))}
                    placeholder={sns.placeholder}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </motion.div>
  );
}
