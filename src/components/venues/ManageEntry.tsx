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
  borderRadius: '16px',
};

const CIRCLE_PATH = 0;

export default function ManageEntry({ isOpen, onClose, isLoaded }: ManageEntryProps) {
  const { location } = useLocation();
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const detailAddressRef = useRef<HTMLInputElement>(null);
  
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

  const updateWithPlace = (place: any) => {
    const geometry = place.geometry;
    if (!geometry || !geometry.location) return;

    const lat = geometry.location.lat();
    const lng = geometry.location.lng();
    
    let country = '';
    let city = '';
    let zone = '';

    place.address_components?.forEach((comp: any) => {
      const types = comp.types;
      if (types.includes('country')) country = comp.long_name;
      if (types.includes('locality') || types.includes('administrative_area_level_1')) city = comp.long_name;
      if (types.includes('sublocality_level_1') || types.includes('administrative_area_level_2')) zone = comp.long_name;
    });

    setFormData(prev => ({
      ...prev,
      address: place.formatted_address || '',
      name: prev.name || place.name || '',
      latitude: lat,
      longitude: lng,
      city: city || prev.city,
      country: country || prev.country,
      zone: zone || prev.zone
    }));
    
    map?.panTo({ lat, lng });
    map?.setZoom(17);

    setTimeout(() => {
      detailAddressRef.current?.focus();
    }, 400);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      updateWithPlace(place);
    }
  };

  const handleManualSearch = () => {
    if (!formData.address) return;
    
    const service = new google.maps.places.AutocompleteService();
    const geocoder = new google.maps.Geocoder();

    service.getPlacePredictions({ input: formData.address }, (predictions, status) => {
      if (status === 'OK' && predictions && predictions.length > 0) {
        // Automatically pick the FIRST prediction if user hits Enter
        const firstPlaceId = predictions[0].place_id;
        const detailsService = new google.maps.places.PlacesService(document.createElement('div'));
        
        detailsService.getDetails({ placeId: firstPlaceId }, (place, status) => {
          if (status === 'OK' && place) {
            updateWithPlace(place);
          }
        });
      } else {
        // Fallback to basic geocoding if no predictions
        geocoder.geocode({ address: formData.address }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            updateWithPlace(results[0]);
          }
        });
      }
    });
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
      alert('Please select category.');
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
        city: (formData.city || '').toUpperCase(),
        country: (formData.country || '').toUpperCase(),
        zone: formData.zone,
        coordinates: { latitude: Number(formData.latitude), longitude: Number(formData.longitude) },
        status: 'active',
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-white flex flex-col overflow-hidden animate-in fade-in duration-300">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[2001] bg-white flex justify-between items-center w-full px-6 h-16 border-b border-[#dde4e5]">
        <button onClick={onClose} className="p-2 hover:bg-[#e8eff0] transition-colors rounded-full"><span className="material-symbols-outlined text-[#161D1E]">close</span></button>
        <h1 className="font-headline text-[13px] font-black text-[#2D3435] uppercase tracking-widest">Register Venue</h1>
        <button onClick={handleSubmit} disabled={saving} className="px-5 py-2 bg-[#005BC0] text-white font-black rounded-xl active:scale-95 transition-all text-[11px] uppercase tracking-widest disabled:opacity-50">
          {saving ? 'WAIT' : 'SAVE'}
        </button>
      </header>

      {/* Body */}
      <main className="flex-grow overflow-y-auto no-scrollbar pt-20 pb-32 max-w-2xl mx-auto w-full px-6">
        
        {/* Identity */}
        <section className="mb-10">
          <h2 className="font-headline text-[13px] font-black text-[#2D3435] uppercase tracking-[0.15em] mb-6">Identity</h2>
          <div className="space-y-5">
            <div className="group">
              <label className="block text-[10px] font-bold text-[#596061] mb-2 tracking-widest uppercase">Place Name (Required)</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Blue Horizon Studio" className="w-full bg-[#e8eff0] border-none rounded-xl px-5 py-4 text-[#2D3435] font-bold focus:bg-white focus:ring-2 focus:ring-[#005BC0]/20 transition-all placeholder:text-[#596061]/30 text-[15px]"/>
            </div>
            <div className="group">
              <label className="block text-[10px] font-bold text-[#596061] mb-2 tracking-widest uppercase">Native Name (Optional)</label>
              <input type="text" value={formData.nativeName} onChange={(e) => setFormData({...formData, nativeName: e.target.value})} placeholder="예: 블루 호라이즌 스튜디오" className="w-full bg-[#e8eff0] border-none rounded-xl px-5 py-4 text-[#2D3435] font-bold focus:bg-white focus:ring-2 focus:ring-[#005BC0]/20 transition-all placeholder:text-[#596061]/30 text-[15px]"/>
            </div>
          </div>
        </section>

        {/* Category */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline text-[13px] font-black text-[#2D3435] uppercase tracking-[0.15em]">Category</h2>
            <span className="text-[10px] font-bold text-[#005BC0] uppercase tracking-widest bg-[#005BC0]/5 px-3 py-1 rounded-full">Multi-selection Enabled</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {categoriesList.map((cat) => (
              <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)} className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${formData.categories.includes(cat.id) ? 'bg-[#005BC0] text-white shadow-lg scale-105 z-10' : 'bg-[#eef5f6] text-[#596061]'}`}>
                <span className="material-symbols-outlined text-[20px] mb-2" style={{ fontVariationSettings: formData.categories.includes(cat.id) ? "'FILL' 1" : "'FILL' 0" }}>{cat.icon}</span>
                <span className="text-[9px] font-black uppercase tracking-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Search */}
        <section className="mb-10">
          <h2 className="font-headline text-[13px] font-black text-[#2D3435] uppercase tracking-[0.15em] mb-6">Location Search</h2>
          <div className="relative mb-5 w-full">
            {isLoaded ? (
              <Autocomplete 
                onLoad={(auto) => setAutocomplete(auto)} 
                onPlaceChanged={onPlaceChanged}
                options={{
                  location: new google.maps.LatLng(formData.latitude, formData.longitude),
                  radius: 10000,
                  componentRestrictions: { country: "kr" }
                }}
              >
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleManualSearch(); } }}
                  placeholder="Type address or place name..."
                  className="w-full bg-[#e8eff0] border-none rounded-2xl pl-12 pr-4 py-4 text-[#2D3435] font-bold focus:bg-white focus:ring-2 focus:ring-[#005BC0]/20 shadow-sm transition-all text-[15px]"
                />
              </Autocomplete>
            ) : <div className="w-full bg-[#e8eff0] h-14 rounded-2xl animate-pulse"></div>}
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#005BC0] text-[20px]">search</span>
          </div>
          
          <div className="h-60 w-full bg-[#f4fbfb] rounded-[2rem] overflow-hidden relative border border-[#dde4e5] mb-6">
            {isLoaded ? (
              <GoogleMap mapContainerStyle={mapContainerStyle} center={{ lat: formData.latitude, lng: formData.longitude }} zoom={17} onLoad={(m) => setMap(m)} options={{ disableDefaultUI: true, zoomControl: false, mapId: "425069951fef97d91810ab94", gestureHandling: 'greedy' }}>
                <Marker position={{ lat: formData.latitude, lng: formData.longitude }} draggable={true} onDragEnd={(e) => { if (e.latLng) { setFormData(prev => ({ ...prev, latitude: e.latLng!.lat(), longitude: e.latLng!.lng() })); } }} icon={{ path: CIRCLE_PATH, fillColor: "#005BC0", fillOpacity: 1, strokeWeight: 4, strokeColor: "#ffffff", scale: 10 }}/>
              </GoogleMap>
            ) : <div className="w-full h-full flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#005BC0]"></div></div>}
          </div>

          <div className="bg-[#f4fbfb] rounded-3xl p-2.5 space-y-1.5 border border-[#e8eff0]">
            <DetailItem label="COUNTRY" value={formData.country} readOnly={true} />
            <DetailItem label="CITY" value={formData.city} readOnly={true} />
            <DetailItem label="ZONE" value={formData.zone} readOnly={true} />
            
            <div className="flex items-center px-5 py-4 bg-white rounded-2xl shadow-sm border-2 border-[#005BC0]/20">
              <label className="w-1/3 text-[9px] font-black text-[#005BC0] uppercase tracking-widest">UNIT / FLOOR</label>
              <input 
                ref={detailAddressRef}
                type="text" 
                value={formData.detailAddress}
                onChange={(e) => setFormData({...formData, detailAddress: e.target.value})}
                className="w-2/3 border-none bg-transparent focus:ring-0 text-[#2D3435] font-bold text-[14px] p-0" 
                placeholder="Required (e.g. 2F, 201)" 
              />
            </div>
          </div>
        </section>

        {/* Photos */}
        <section className="mb-0">
          <div className="flex justify-between items-end mb-6">
            <h2 className="font-headline text-[13px] font-black text-[#2D3435] uppercase tracking-[0.15em]">Venue Photos</h2>
            <span className="text-[10px] font-black text-[#005BC0] bg-[#005BC0]/5 px-3 py-1 rounded-full uppercase tracking-widest">{formData.images.length} / 20</span>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 -mx-6 px-6">
            <label className="flex-shrink-0 w-48 h-48 border-2 border-dashed border-[#c2c6d5] rounded-[2rem] flex flex-col items-center justify-center bg-white hover:bg-[#eaf2ff] transition-all cursor-pointer group">
              <span className="material-symbols-outlined text-[#727784] text-[40px] mb-2 group-hover:scale-110 transition-all">add_a_photo</span>
              <input type="file" multiple accept="image/*" onChange={(e) => { if (e.target.files) { const filesArray = Array.from(e.target.files); if (filesArray.length + formData.images.length > 20) return; setFormData(prev => ({ ...prev, images: [...prev.images, ...filesArray] })); } }} className="hidden" />
            </label>
            {formData.images.map((img, idx) => (
              <div key={idx} className="relative flex-shrink-0 w-48 h-48 rounded-[2rem] bg-[#e2e9ea] overflow-hidden shadow-md">
                <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" alt="" />
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))} className="absolute top-3 right-3 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-lg hover:bg-[#ba1a1a] transition-colors"><span className="material-symbols-outlined text-[18px]">close</span></button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function DetailItem({ label, value, readOnly }: { label: string, value: string, readOnly?: boolean }) {
  return (
    <div className={`flex items-center px-5 py-4 bg-white/60 rounded-2xl shadow-sm border border-transparent ${readOnly ? 'opacity-60' : ''}`}>
      <label className="w-1/3 text-[9px] font-black text-[#596061] uppercase tracking-widest">{label}</label>
      <input 
        type="text" 
        value={value}
        readOnly={readOnly}
        tabIndex={readOnly ? -1 : 0}
        className="w-2/3 border-none bg-transparent focus:ring-0 text-[#2D3435] font-bold text-[14px] p-0" 
      />
    </div>
  );
}
