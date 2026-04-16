"use client";

import React, { useState } from 'react';
import { db } from '@/lib/firebase/clientApp';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useLocation } from '@/components/providers/LocationProvider';
import { GoogleMap, Autocomplete, Marker } from '@react-google-maps/api';

interface ManageEntryProps {
  isOpen: boolean;
  onClose: () => void;
  isLoaded: boolean;
}

const mapContainerStyle = {
  width: '100%',
  height: '220px',
  borderRadius: '16px',
};

const CIRCLE_PATH = 0;
const PRIMARY_BLUE = "#005BC0";
const TEXT_DARK = "#2D3435";
const TEXT_SUBTLE = "#596061";

export default function ManageEntry({ isOpen, onClose, isLoaded }: ManageEntryProps) {
  const { location } = useLocation();
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    nativeName: '',
    categories: [] as string[],
    address: '',
    detailAddress: '',
    city: '',
    country: '',
    zone: '',
    latitude: 37.5575,
    longitude: 126.9244,
    images: [] as File[],
  });

  const [saving, setSaving] = useState(false);

  const categoriesList = [
    { id: 'Studio', label: 'Studio', icon: 'workspaces' },
    { id: 'Academy', label: 'Academy', icon: 'school' },
    { id: 'Club', label: 'Club', icon: 'groups' },
    { id: 'Shop', label: 'Shop', icon: 'shopping_bag' },
    { id: 'Cafe', label: 'Cafe', icon: 'coffee' },
    { id: 'Eats', label: 'Eats', icon: 'restaurant' },
    { id: 'Beauty', label: 'Beauty', icon: 'content_cut' },
    { id: 'Stay', label: 'Stay', icon: 'bed' },
    { id: 'Other', label: 'Other', icon: 'more_horiz' },
  ];

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      
      let city = '';
      let country = '';

      place.address_components?.forEach(comp => {
        if (comp.types.includes('locality')) city = comp.long_name;
        if (comp.types.includes('country')) country = comp.long_name;
      });

      setFormData(prev => ({
        ...prev,
        address: place.formatted_address || '',
        latitude: lat,
        longitude: lng,
        city: city || prev.city,
        country: country || prev.country
      }));
      map?.panTo({ lat, lng });
    }
  };

  const handleSubmit = async () => {
    if (formData.categories.length === 0) {
      alert('Please select at least one category.');
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, "venues"), {
        name: formData.name,
        nativeName: formData.nativeName,
        categories: formData.categories,
        category: formData.categories[0], 
        address: formData.address,
        detailAddress: formData.detailAddress,
        city: (formData.city || location?.city || '').toUpperCase(),
        country: (formData.country || location?.country || '').toUpperCase(),
        zone: formData.zone,
        coordinates: {
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude)
        },
        status: 'active',
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (error) {
      console.error("Error saving venue:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-white flex flex-col overflow-hidden animate-in fade-in duration-300">
      {/* Fixed Header (Shell) */}
      <header className="fixed top-0 left-0 right-0 z-[2001] bg-white flex justify-between items-center w-full px-6 h-16 border-b border-[#dde4e5]">
        <div className="flex items-center">
          <button onClick={onClose} className="p-2 hover:bg-[#e8eff0] transition-colors rounded-full">
            <span className="material-symbols-outlined text-[#161D1E]">close</span>
          </button>
        </div>
        <h1 className="font-headline text-[17px] font-bold text-[#161D1E] tracking-tight">Register Venue</h1>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-[#e8eff0] transition-colors rounded-full">
            <span className="material-symbols-outlined text-[#161D1E]">delete</span>
          </button>
          <button 
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 bg-[#005BC0] text-white font-bold rounded-xl active:scale-95 transition-all text-[14px] disabled:opacity-50"
          >
            {saving ? '...' : 'Save'}
          </button>
        </div>
      </header>

      {/* Pure Body Content */}
      <main className="flex-grow overflow-y-auto no-scrollbar pt-20 pb-20 max-w-2xl mx-auto w-full px-6">
        
        {/* 1. Identity */}
        <section className="mb-8">
          <h2 className="font-headline text-[13px] font-black text-[#2D3435] uppercase tracking-wider mb-5">Identity</h2>
          <div className="space-y-4">
            <div className="group">
              <label className="block text-[10px] font-bold text-[#596061] mb-1.5 tracking-widest uppercase">Place Name (Required)</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Blue Horizon Studio"
                className="w-full bg-[#dde4e5] border-none rounded-xl px-4 py-3.5 text-[#2D3435] font-bold focus:bg-white focus:ring-2 focus:ring-[#005BC0]/30 transition-all placeholder:text-[#596061]/40 text-[14px]"
              />
            </div>
            <div className="group">
              <label className="block text-[10px] font-bold text-[#596061] mb-1.5 tracking-widest uppercase">Native Name (Optional)</label>
              <input 
                type="text" 
                value={formData.nativeName}
                onChange={(e) => setFormData({...formData, nativeName: e.target.value})}
                placeholder="예: 블루 호라이즌 스튜디오"
                className="w-full bg-[#dde4e5] border-none rounded-xl px-4 py-3.5 text-[#2D3435] font-bold focus:bg-white focus:ring-2 focus:ring-[#005BC0]/30 transition-all placeholder:text-[#596061]/40 text-[14px]"
              />
            </div>
          </div>
        </section>

        {/* 2. Category */}
        <section className="mb-8">
          <h2 className="font-headline text-[13px] font-black text-[#2D3435] uppercase tracking-wider mb-5">Category</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {categoriesList.map((cat) => (
              <button 
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl transition-all ${
                  formData.categories.includes(cat.id)
                  ? 'bg-[#005BC0] text-white shadow-lg scale-105 z-10'
                  : 'bg-[#e2e9ea] text-[#596061] hover:bg-[#dde4e5]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] mb-2" style={{ fontVariationSettings: formData.categories.includes(cat.id) ? "'FILL' 1" : "'FILL' 0" }}>{cat.icon}</span>
                <span className="text-[9px] font-black uppercase tracking-tighter">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 3. Location & Hierarchy */}
        <section className="mb-8">
          <h2 className="font-headline text-[13px] font-black text-[#2D3435] uppercase tracking-wider mb-5">Location</h2>
          <div className="relative mb-4">
            {isLoaded ? (
              <Autocomplete onLoad={(auto) => setAutocomplete(auto)} onPlaceChanged={onPlaceChanged}>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Search address..."
                  className="w-full bg-[#dde4e5] border-none rounded-xl pl-12 pr-4 py-3.5 text-[#2D3435] font-bold focus:bg-white focus:ring-2 focus:ring-[#005BC0]/30 transition-all text-[14px]"
                />
              </Autocomplete>
            ) : (
              <div className="w-full bg-[#dde4e5] h-12 rounded-xl animate-pulse"></div>
            )}
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#005BC0]">my_location</span>
          </div>
          
          <div className="h-56 w-full bg-[#f4fbfb] rounded-2xl overflow-hidden relative border border-[#dde4e5] mb-5">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={{ lat: formData.latitude, lng: formData.longitude }}
                zoom={17}
                onLoad={(m) => setMap(m)}
                options={{ 
                  disableDefaultUI: true, 
                  zoomControl: false,
                  mapId: "425069951fef97d91810ab94"
                }}
              >
                <Marker
                  position={{ lat: formData.latitude, lng: formData.longitude }}
                  draggable={true}
                  onDragEnd={(e) => {
                    if (e.latLng) {
                      setFormData(prev => ({ ...prev, latitude: e.latLng!.lat(), longitude: e.latLng!.lng() }));
                    }
                  }}
                  icon={{ path: CIRCLE_PATH, fillColor: "#005BC0", fillOpacity: 1, strokeWeight: 4, strokeColor: "#ffffff", scale: 9 }}
                />
              </GoogleMap>
            ) : (
              <div className="w-full h-full bg-[#e8eff0] flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#005BC0]"></div>
              </div>
            )}
          </div>

          {/* Location Hierarchy: Country > City > Zone > Unit/Floor */}
          <div className="bg-[#eef5f6] rounded-2xl p-2 space-y-1">
            <DetailItem label="COUNTRY" placeholder="Required" value={formData.country} onChange={(val) => setFormData({...formData, country: val})} />
            <DetailItem label="CITY" placeholder="Required" value={formData.city} onChange={(val) => setFormData({...formData, city: val})} />
            <DetailItem label="ZONE" placeholder="Optional" value={formData.zone} onChange={(val) => setFormData({...formData, zone: val})} />
            <DetailItem label="UNIT / FLOOR" placeholder="e.g. 2F, Suite 204" value={formData.detailAddress} onChange={(val) => setFormData({...formData, detailAddress: val})} />
          </div>
        </section>

        {/* 4. Photos (Common Component Section) */}
        <section className="mb-0">
          <div className="flex justify-between items-end mb-5">
            <h2 className="font-headline text-[13px] font-black text-[#2D3435] uppercase tracking-wider">Venue Photos</h2>
            <span className="text-[10px] font-black text-[#005BC0] bg-[#005BC0]/10 px-2.5 py-1 rounded-md uppercase tracking-widest">
              ({formData.images.length}/20)
            </span>
          </div>
          <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
            <label className="flex-shrink-0 w-44 h-44 border-2 border-dashed border-[#c2c6d5] rounded-2xl flex flex-col items-center justify-center bg-white hover:bg-[#eef5f6] transition-colors cursor-pointer group">
              <span className="material-symbols-outlined text-[#727784] text-[36px] mb-2 group-hover:scale-110 transition-transform">add_a_photo</span>
              <p className="text-[9px] font-black text-[#c2c6d5] uppercase tracking-widest">Upload</p>
              <input type="file" multiple accept="image/*" onChange={(e) => {
                if (e.target.files) {
                  const filesArray = Array.from(e.target.files);
                  if (filesArray.length + formData.images.length > 20) {
                    alert('Max 20 images allowed.');
                    return;
                  }
                  setFormData(prev => ({ ...prev, images: [...prev.images, ...filesArray] }));
                }
              }} className="hidden" />
            </label>
            
            {formData.images.map((img, idx) => (
              <div key={idx} className="relative flex-shrink-0 w-44 h-44 rounded-2xl bg-[#e2e9ea] overflow-hidden shadow-sm">
                <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" alt="" />
                <button 
                  type="button" 
                  onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md hover:bg-black/60 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function DetailItem({ label, placeholder, value, onChange }: { label: string, placeholder: string, value: string, onChange: (val: string) => void }) {
  return (
    <div className="flex items-center px-4 py-3.5 bg-white rounded-xl shadow-sm">
      <label className="w-1/3 text-[9px] font-black text-[#596061] uppercase tracking-widest">{label}</label>
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-2/3 border-none bg-transparent focus:ring-0 text-[#2D3435] font-bold text-[13px] p-0" 
        placeholder={placeholder} 
      />
    </div>
  );
}
