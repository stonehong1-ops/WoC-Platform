"use client";

import React, { useState, useRef } from 'react';
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
  borderRadius: '24px',
  marginTop: '12px'
};

export default function ManageEntry({ isOpen, onClose, isLoaded }: ManageEntryProps) {
  const { location } = useLocation();
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nativeName: '',
    categories: [] as string[],
    address: '',
    detailAddress: '',
    description: '',
    latitude: 37.5575,
    longitude: 126.9244,
    images: [] as File[],
    city: '',
    country: ''
  });

  const [saving, setSaving] = useState(false);
  const categoriesList = ['Studio', 'Academy', 'Club', 'Shop', 'Service', 'Other'];

  const onLoad = (auto: google.maps.places.Autocomplete) => {
    setAutocomplete(auto);
  };

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

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:zoom-in duration-500">
        <div className="relative p-8 max-h-[90vh] overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-on-surface tracking-tighter uppercase">Register Venue</h2>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-on-surface-variant/[0.08] text-on-surface-variant hover:bg-on-surface-variant/[0.12] transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-on-surface-variant ml-1 tracking-widest block">Images (Max 20)</label>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                <label className="flex-shrink-0 w-24 h-24 rounded-3xl border-2 border-dashed border-on-surface/10 flex flex-col items-center justify-center cursor-pointer hover:bg-on-surface/[0.02] transition-all">
                  <span className="material-symbols-outlined text-on-surface/20">add_a_photo</span>
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative flex-shrink-0 w-24 h-24 rounded-3xl bg-on-surface/[0.05] overflow-hidden">
                    <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" alt="" />
                    <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-on-surface-variant ml-1 tracking-widest block">Space Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-on-surface-variant/[0.04] border-none rounded-2xl p-4 text-[14px] font-bold focus:ring-1 focus:ring-primary/30" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-on-surface-variant ml-1 tracking-widest block">Native Name</label>
                <input type="text" value={formData.nativeName} onChange={(e) => setFormData({...formData, nativeName: e.target.value})} className="w-full bg-on-surface-variant/[0.04] border-none rounded-2xl p-4 text-[14px] font-bold focus:ring-1 focus:ring-primary/30" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-on-surface-variant ml-1 tracking-widest block">Categories</label>
              <div className="flex flex-wrap gap-1.5">
                {categoriesList.map((cat) => (
                  <button key={cat} type="button" onClick={() => toggleCategory(cat)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.categories.includes(cat) ? 'bg-primary text-white shadow-md' : 'bg-on-surface-variant/[0.04] text-on-surface-variant hover:bg-on-surface-variant/[0.08]'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-on-surface-variant ml-1 tracking-widest block">Search Address & Adjust Pin</label>
                {isLoaded ? (
                  <>
                    <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
                      <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Start typing address..." className="w-full bg-on-surface-variant/[0.06] border-none rounded-2xl p-4 text-[14px] font-bold focus:ring-1 focus:ring-primary/30 border-2 border-primary/20" required />
                    </Autocomplete>
                    
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={{ lat: formData.latitude, lng: formData.longitude }}
                      zoom={17}
                      options={{ 
                        disableDefaultUI: true, 
                        zoomControl: false,
                        styles: [
                          { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
                          { elementType: "labels.icon", stylers: [{ visibility: "off" }] }
                        ]
                      }}
                    >
                      <Marker
                        position={{ lat: formData.latitude, lng: formData.longitude }}
                        draggable={true}
                        onDragEnd={onMarkerDragEnd}
                      />
                    </GoogleMap>
                  </>
                ) : (
                  <div className="w-full h-[280px] bg-[#e8eff0] rounded-2xl flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#005BC0]"></div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-on-surface-variant ml-1 tracking-widest block">Detail Address (Unit/Floor)</label>
                  <input type="text" value={formData.detailAddress} onChange={(e) => setFormData({...formData, detailAddress: e.target.value})} className="w-full bg-on-surface-variant/[0.04] border-none rounded-2xl p-4 text-[14px] font-bold focus:ring-1 focus:ring-primary/30" placeholder="e.g. 5th Floor, Suite 501" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 opacity-40">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-on-surface-variant ml-1 tracking-widest block">Latitude / Auto</label>
                <input type="number" readOnly value={formData.latitude} className="w-full bg-transparent border-none p-0 text-[12px] font-mono font-bold outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-on-surface-variant ml-1 tracking-widest block">Longitude / Auto</label>
                <input type="number" readOnly value={formData.longitude} className="w-full bg-transparent border-none p-0 text-[12px] font-mono font-bold outline-none" />
              </div>
            </div>

            <div className="pt-4">
              <button type="submit" disabled={saving} className="w-full py-5 bg-on-surface text-white rounded-[24px] text-[14px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all disabled:opacity-50">
                {saving ? 'Saving...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
