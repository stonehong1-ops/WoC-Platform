"use client";

import React, { useState, useEffect } from 'react';
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

// Defensive Architecture 3 & 4: Safe constant markers and instance-based access
const CIRCLE_PATH = 0;

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

  const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setFormData(prev => ({
        ...prev,
        latitude: e.latLng!.lat(),
        longitude: e.latLng!.lng()
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (filesArray.length + formData.images.length > 20) {
        alert('You can select a maximum of 20 images.');
        return;
      }
      setFormData(prev => ({ ...prev, images: [...prev.images, ...filesArray] }));
    }
  };

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
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
        city: formData.city.toUpperCase() || location?.city?.toUpperCase() || '',
        country: formData.country.toUpperCase() || location?.country?.toUpperCase() || '',
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
      alert('Failed to register venue.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-surface flex flex-col overflow-hidden animate-in fade-in duration-300">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 right-0 z-[2001] bg-[#F4FBFB] flex justify-between items-center w-full px-6 h-16 border-b border-surface-container-highest">
        <div className="flex items-center">
          <button onClick={onClose} className="p-2 hover:bg-surface-container transition-colors rounded-full active:opacity-80">
            <span className="material-symbols-outlined text-on-surface">close</span>
          </button>
        </div>
        <h1 className="font-headline text-lg font-bold text-on-surface text-center tracking-tight">Register Venue</h1>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-surface-container transition-colors rounded-full active:opacity-80">
            <span className="material-symbols-outlined text-on-surface">delete</span>
          </button>
          <button 
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 bg-primary-container text-white font-bold rounded-xl hover:bg-primary transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto no-scrollbar pt-20 pb-10 max-w-2xl mx-auto w-full px-6">
        
        {/* Identity Section */}
        <section className="mb-10">
          <h2 className="font-headline text-on-surface text-xl font-extrabold tracking-tight mb-6">Identity</h2>
          <div className="space-y-6">
            <div className="group">
              <label className="block text-[0.7rem] font-black text-on-surface-variant mb-2 tracking-widest uppercase">Place Name (Required)</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Blue Horizon Studio"
                className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-4 text-on-surface font-semibold focus:bg-white focus:ring-2 focus:ring-surface-tint/40 transition-all placeholder:text-outline/40"
              />
            </div>
            <div className="group">
              <label className="block text-[0.7rem] font-black text-on-surface-variant mb-2 tracking-widest uppercase">Native Name (Optional)</label>
              <input 
                type="text" 
                value={formData.nativeName}
                onChange={(e) => setFormData({...formData, nativeName: e.target.value})}
                placeholder="예: 블루 호라이즌 스튜디오"
                className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-4 text-on-surface font-semibold focus:bg-white focus:ring-2 focus:ring-surface-tint/40 transition-all placeholder:text-outline/40"
              />
            </div>
          </div>
        </section>

        {/* Category Section */}
        <section className="mb-10">
          <h2 className="font-headline text-on-surface text-xl font-extrabold tracking-tight mb-6">Category</h2>
          <div className="grid grid-cols-3 gap-3">
            {categoriesList.map((cat) => (
              <button 
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all shadow-sm ${
                  formData.categories.includes(cat.id)
                  ? 'bg-surface-tint text-white shadow-md scale-105 z-10'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                <span className="material-symbols-outlined mb-2" style={{ fontVariationSettings: formData.categories.includes(cat.id) ? "'FILL' 1" : "'FILL' 0" }}>{cat.icon}</span>
                <span className="text-[0.65rem] font-bold uppercase tracking-widest">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Location Section */}
        <section className="mb-10">
          <h2 className="font-headline text-on-surface text-xl font-extrabold tracking-tight mb-6">Location</h2>
          <div className="relative mb-4">
            {isLoaded ? (
              <Autocomplete onLoad={(auto) => setAutocomplete(auto)} onPlaceChanged={onPlaceChanged}>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Search address..."
                  className="w-full bg-surface-container-highest border-none rounded-xl pl-12 pr-4 py-4 text-on-surface font-bold focus:bg-white focus:ring-2 focus:ring-surface-tint/40 transition-all"
                />
              </Autocomplete>
            ) : (
              <div className="w-full bg-surface-container-highest h-14 rounded-xl animate-pulse"></div>
            )}
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-surface-tint">my_location</span>
          </div>
          
          <div className="h-64 w-full bg-surface-container-low rounded-2xl overflow-hidden relative border border-surface-container-highest">
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
                  onDragEnd={onMarkerDragEnd}
                  icon={{
                    path: CIRCLE_PATH,
                    fillColor: "#005BC0",
                    fillOpacity: 1,
                    strokeWeight: 4,
                    strokeColor: "#ffffff",
                    scale: 10,
                  }}
                />
              </GoogleMap>
            ) : (
              <div className="w-full h-full bg-[#e8eff0] flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-surface-tint"></div>
              </div>
            )}
          </div>
        </section>

        {/* Details Section */}
        <section className="mb-10">
          <h2 className="font-headline text-on-surface text-xl font-extrabold tracking-tight mb-6">Details</h2>
          <div className="bg-surface-container-low rounded-2xl p-2 space-y-1">
            <DetailItem label="Country" placeholder="Required" value={formData.country} onChange={(val) => setFormData({...formData, country: val})} />
            <DetailItem label="City" placeholder="Required" value={formData.city} onChange={(val) => setFormData({...formData, city: val})} />
            <DetailItem label="Zone" placeholder="Optional" value={formData.zone} onChange={(val) => setFormData({...formData, zone: val})} />
            <DetailItem label="Unit / Floor" placeholder="e.g. 2F, Suite 204" value={formData.detailAddress} onChange={(val) => setFormData({...formData, detailAddress: val})} />
          </div>
        </section>

        {/* Photos Section (Common Component Design) */}
        <section className="mb-10">
          <div className="flex justify-between items-end mb-6">
            <h2 className="font-headline text-on-surface text-xl font-extrabold tracking-tight">Venue Photos</h2>
            <span className="text-[0.7rem] font-black text-surface-tint bg-surface-tint/10 px-3 py-1 rounded-full uppercase tracking-widest">
              ({formData.images.length}/20)
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
            <label className="flex-shrink-0 w-48 h-48 border-2 border-dashed border-outline-variant rounded-2xl flex flex-col items-center justify-center bg-surface-container-lowest hover:bg-surface-container-low transition-colors cursor-pointer group">
              <span className="material-symbols-outlined text-outline text-4xl mb-2 group-hover:scale-110 transition-transform">add_a_photo</span>
              <p className="text-[0.7rem] font-bold text-outline-variant uppercase tracking-widest">Upload</p>
              <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
            
            {formData.images.map((img, idx) => (
              <div key={idx} className="relative flex-shrink-0 w-48 h-48 rounded-2xl bg-surface-container-high overflow-hidden shadow-sm">
                <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" alt="" />
                <button 
                  type="button" 
                  onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
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
    <div className="flex items-center px-5 py-4 bg-surface-container-lowest rounded-xl shadow-sm">
      <label className="w-1/3 text-[0.65rem] font-black text-on-surface-variant uppercase tracking-widest">{label}</label>
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-2/3 border-none bg-transparent focus:ring-0 text-on-surface font-bold text-[14px] p-0" 
        placeholder={placeholder} 
      />
    </div>
  );
}
