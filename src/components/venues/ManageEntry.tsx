"use client";

import React, { useState, useRef, useEffect } from 'react';
import { db } from '@/lib/firebase/clientApp';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { useLocation } from '@/components/providers/LocationProvider';
import { GoogleMap, Autocomplete, Marker } from '@react-google-maps/api';
import { venueService } from '@/lib/firebase/venueService';
import { Venue } from '@/types/venue';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface ManageEntryProps {
  isOpen: boolean;
  onClose: () => void;
  isLoaded: boolean;
  initialData?: Venue | null;
  mode?: 'edit' | 'geo';
}

const mapContainerStyle = {
  width: '100%',
  height: '220px',
  borderRadius: '16px',
};

const CIRCLE_PATH = 0;

export default function ManageEntry({ isOpen, onClose, isLoaded, initialData, mode = 'edit' }: ManageEntryProps) {
  const { location } = useLocation();
  const { t } = useLanguage();
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const detailAddressRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    nameKo: '',
    categories: [] as string[],
    address: '',
    detailAddress: '',
    city: '',
    country: '',
    zone: '',
    latitude: 37.5575,
    longitude: 126.9244,
    images: [] as File[],
    seoulArea: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        nameKo: initialData.nameKo || '',
        categories: initialData.types || [initialData.category],
        address: initialData.address,
        detailAddress: (initialData as any).detailAddress || '',
        city: initialData.city,
        country: (initialData as any).country || '',
        zone: (initialData as any).zone || '',
        latitude: initialData.coordinates.latitude,
        longitude: initialData.coordinates.longitude,
        images: [], // Images are tricky, usually we handle them separately or keep existing ones
        seoulArea: initialData.seoulArea || '',
      });
    } else {
      setFormData({
        name: '',
        nameKo: '',
        categories: [],
        address: '',
        detailAddress: '',
        city: '',
        country: '',
        zone: '',
        latitude: 37.5575,
        longitude: 126.9244,
        images: [],
        seoulArea: '',
      });
    }
  }, [initialData, isOpen]);


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

    let detectedSeoulArea = '';
    const isSeoulCity = (city || '').toUpperCase() === 'SEOUL' || (city || '').includes('서울') || (place.formatted_address || '').includes('서울');
    if (isSeoulCity) {
      const gangbukDistricts = ['마포구', '서대문구', '은평구', '종로구', '중구', '용산구', '성동구', '광진구', '동대문구', '중랑구', '성북구', '강북구', '도봉구', '노원구', '마포', '신촌', '홍대'];
      const gangnamDistricts = ['강남구', '서초구', '송파구', '강동구', '동작구', '관악구', '영등포구', '구로구', '금천구', '강서구', '양천구', '압구정', '역삼', '청담'];
      
      const combinedText = `${zone} ${place.formatted_address || ''} ${place.name || ''}`;
      const isGangbuk = gangbukDistricts.some(d => combinedText.includes(d));
      const isGangnam = gangnamDistricts.some(d => combinedText.includes(d));
      
      if (isGangbuk) {
        detectedSeoulArea = 'gangbuk';
      } else if (isGangnam) {
        detectedSeoulArea = 'gangnam';
      }
    }

    setFormData(prev => ({
      ...prev,
      address: place.formatted_address || '',
      name: prev.name || place.name || '',
      latitude: lat,
      longitude: lng,
      city: city || prev.city,
      country: country || prev.country,
      zone: zone || prev.zone,
      seoulArea: detectedSeoulArea || prev.seoulArea
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
    if (!formData.name.trim()) {
      alert(t('venues.alert_place_name'));
      return;
    }
    if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(formData.name)) {
      alert(t('venues.alert_english_only'));
      return;
    }
    if (formData.categories.length === 0) {
      alert(t('venues.alert_category'));
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: formData.name,
        nameKo: formData.nameKo,
        types: formData.categories,
        category: formData.categories[0], 
        address: formData.address,
        detailAddress: formData.detailAddress,
        city: (location.city || '').toUpperCase(),
        country: (formData.country || '').toUpperCase(),
        zone: formData.zone,
        coordinates: { latitude: Number(formData.latitude), longitude: Number(formData.longitude) },
        status: 'active',
      };

      const isSeoul = payload.city === 'SEOUL' || (formData.city || '').toUpperCase() === 'SEOUL' || (location.city || '').toUpperCase() === 'SEOUL';
      if (isSeoul && formData.seoulArea) {
        payload.seoulArea = formData.seoulArea;
      }


      if (initialData?.id) {
        await venueService.updateVenue(initialData.id, payload);
        alert(t('venues.alert_update_success'));
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, "venues"), payload);
        alert(t('venues.alert_save_success'));
      }
      onClose();
    } catch (error: any) {
      console.error("Error saving venue:", error);
      alert(t('venues.alert_save_failed', { error: error.message || 'Unknown error. check console.' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[2000] bg-white flex flex-col overflow-hidden"
        >
          {/* Header */}
          <header className="flex-none bg-white flex justify-between items-center w-full px-6 h-16 border-b border-[#dde4e5]">
            <button onClick={onClose} className="p-2 hover:bg-[#e8eff0] transition-colors rounded-full">
              <span className="material-symbols-rounded text-[#161D1E]">close</span>
            </button>
            <h1 className="font-headline text-[13px] font-black text-[#2D3435] uppercase tracking-widest">
              {mode === 'geo' ? t('venues.geo_tuning') : initialData ? t('venues.edit_venue') : t('venues.register_venue')}
            </h1>
            <button 
              onClick={handleSubmit} 
              disabled={saving} 
              className="px-5 py-2 bg-[#005BC0] text-white font-black rounded-xl active:scale-95 transition-all text-[11px] uppercase tracking-widest disabled:opacity-50"
            >
              {saving ? t('venues.wait') : t('venues.save')}
            </button>
          </header>

          {/* Body */}
          <main className="flex-grow overflow-y-auto no-scrollbar pb-32 max-w-5xl mx-auto w-full px-6 pt-10">
            
            {/* Identity */}
            {mode === 'edit' && (
              <section className="mb-10">
                <h2 className="font-headline text-[13px] font-black text-[#2D3435] uppercase tracking-[0.15em] mb-6">{t('venues.identity')}</h2>
                <div className="space-y-5">
                  <div className="group">
                    <label className="block text-[10px] font-bold text-[#596061] mb-2 tracking-widest uppercase">{t('venues.place_name_required')}</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '')})} placeholder={t('venues.place_name_placeholder')} className="w-full bg-[#e8eff0] border-none rounded-xl px-5 py-4 text-[#2D3435] font-bold focus:bg-white focus:ring-2 focus:ring-[#005BC0]/20 transition-all placeholder:text-[#596061]/30 text-[15px]"/>
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-bold text-[#596061] mb-2 tracking-widest uppercase">{t('venues.korean_name_optional')}</label>
                    <input type="text" value={formData.nameKo} onChange={(e) => setFormData({...formData, nameKo: e.target.value})} placeholder={t('venues.korean_name_placeholder')} className="w-full bg-[#e8eff0] border-none rounded-xl px-5 py-4 text-[#2D3435] font-bold focus:bg-white focus:ring-2 focus:ring-[#005BC0]/20 transition-all placeholder:text-[#596061]/30 text-[15px]"/>
                  </div>
                </div>
              </section>
            )}

            {/* Category */}
            {mode === 'edit' && (
              <section className="mb-10">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-headline text-[13px] font-black text-[#2D3435] uppercase tracking-[0.15em]">{t('venues.category')}</h2>
                  <span className="text-[10px] font-bold text-[#005BC0] uppercase tracking-widest bg-[#005BC0]/5 px-3 py-1 rounded-full">{t('venues.multi_selection_enabled')}</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {categoriesList.map((cat) => (
                    <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)} className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${formData.categories.includes(cat.id) ? 'bg-[#005BC0] text-white shadow-lg scale-105 z-10' : 'bg-[#eef5f6] text-[#596061]'}`}>
                      <span className="material-symbols-rounded text-[20px] mb-2" style={{ fontVariationSettings: formData.categories.includes(cat.id) ? "'FILL' 1" : "'FILL' 0" }}>{cat.icon}</span>
                      <span className="text-[9px] font-black uppercase tracking-tight">{t('venues.cat_' + cat.id.toLowerCase())}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Search */}
            <section className="mb-10">
              <h2 className="font-headline text-[13px] font-black text-[#2D3435] uppercase tracking-[0.15em] mb-6">{t('venues.location_search')}</h2>
              <div className="relative mb-5 w-full">
                {isLoaded ? (
                  <Autocomplete 
                    onLoad={(auto) => setAutocomplete(auto)} 
                    onPlaceChanged={onPlaceChanged}
                    options={{
                      bounds: {
                        north: Number(formData.latitude) + 0.1,
                        south: Number(formData.latitude) - 0.1,
                        east: Number(formData.longitude) + 0.1,
                        west: Number(formData.longitude) - 0.1,
                      },
                      componentRestrictions: { country: "kr" }
                    }}
                  >
                    <input 
                      type="text" 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleManualSearch(); } }}
                      placeholder={t('venues.search_placeholder')}
                      className="w-full bg-[#e8eff0] border-none rounded-2xl pl-12 pr-4 py-4 text-[#2D3435] font-bold focus:bg-white focus:ring-2 focus:ring-[#005BC0]/20 shadow-sm transition-all text-[15px]"
                    />
                  </Autocomplete>
                ) : <div className="w-full bg-[#e8eff0] h-14 rounded-2xl animate-pulse"></div>}
                <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-[#005BC0] text-[20px]">search</span>
              </div>
              
              <div className="h-60 w-full bg-[#f4fbfb] rounded-[2rem] overflow-hidden relative border border-[#dde4e5] mb-6">
                {isLoaded ? (
                  <GoogleMap mapContainerStyle={mapContainerStyle} center={{ lat: formData.latitude, lng: formData.longitude }} zoom={17} onLoad={(m) => setMap(m)} options={{ disableDefaultUI: true, zoomControl: false, mapId: "425069951fef97d91810ab94", gestureHandling: 'greedy' }}>
                    <Marker position={{ lat: formData.latitude, lng: formData.longitude }} draggable={true} onDragEnd={(e) => { if (e.latLng) { setFormData(prev => ({ ...prev, latitude: e.latLng!.lat(), longitude: e.latLng!.lng() })); } }} icon={{ path: CIRCLE_PATH, fillColor: "#005BC0", fillOpacity: 1, strokeWeight: 4, strokeColor: "#ffffff", scale: 10 }}/>
                  </GoogleMap>
                ) : <div className="w-full h-full flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#005BC0]"></div></div>}
              </div>

              <div className="bg-[#f4fbfb] rounded-3xl p-2.5 space-y-1.5 border border-[#e8eff0]">
                <div className="grid grid-cols-2 gap-1.5">
                  <DetailItem label={t('venues.latitude')} value={formData.latitude.toString()} readOnly={true} />
                  <DetailItem label={t('venues.longitude')} value={formData.longitude.toString()} readOnly={true} />
                </div>
                <DetailItem label={t('venues.country')} value={formData.country} readOnly={true} />
                <DetailItem label={t('venues.city')} value={formData.city} readOnly={true} />
                <DetailItem label={t('venues.zone')} value={formData.zone} readOnly={true} />
                <DetailItem label={t('venues.street_addr')} value={formData.address} readOnly={true} />
                
                {(formData.city.toUpperCase() === 'SEOUL' || (location.city || '').toUpperCase() === 'SEOUL') && (
                  <div className="flex items-center px-5 py-3 bg-white rounded-2xl shadow-sm border border-[#005BC0]/20 animate-fade-in">
                    <label className="w-1/3 text-[9px] font-black text-[#005BC0] uppercase tracking-widest">{t('venues.seoul_area')}</label>
                    <div className="w-2/3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, seoulArea: 'gangbuk' }))}
                        className={`py-2 px-3 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${formData.seoulArea === 'gangbuk' ? 'bg-[#005BC0] text-white shadow-sm scale-[1.02]' : 'bg-[#eef5f6] text-[#596061] hover:bg-[#e8eff0]'}`}
                      >
                        <span className="material-symbols-rounded text-sm" style={{ fontVariationSettings: formData.seoulArea === 'gangbuk' ? "'FILL' 1" : "'FILL' 0" }}>south_east</span>
                        {t('venues.gangbuk').split(' ')[0]}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, seoulArea: 'gangnam' }))}
                        className={`py-2 px-3 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${formData.seoulArea === 'gangnam' ? 'bg-[#005BC0] text-white shadow-sm scale-[1.02]' : 'bg-[#eef5f6] text-[#596061] hover:bg-[#e8eff0]'}`}
                      >
                        <span className="material-symbols-rounded text-sm" style={{ fontVariationSettings: formData.seoulArea === 'gangnam' ? "'FILL' 1" : "'FILL' 0" }}>north_east</span>
                        {t('venues.gangnam').split(' ')[0]}
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center px-5 py-4 bg-white rounded-2xl shadow-sm border-2 border-[#005BC0]/20">
                  <label className="w-1/3 text-[9px] font-black text-[#005BC0] uppercase tracking-widest">{t('venues.unit_floor')}</label>
                  <input 
                    ref={detailAddressRef}
                    type="text" 
                    value={formData.detailAddress}
                    onChange={(e) => setFormData({...formData, detailAddress: e.target.value})}
                    className="w-2/3 border-none bg-transparent focus:ring-0 text-[#2D3435] font-bold text-[14px] p-0" 
                    placeholder={t('venues.unit_floor_placeholder')} 
                  />
                </div>
              </div>
            </section>

            {/* Photos */}
            {mode === 'edit' && (
              <section className="mb-0">
                <div className="flex justify-between items-end mb-6">
                  <h2 className="font-headline text-[13px] font-black text-[#2D3435] uppercase tracking-[0.15em]">{t('venues.venue_photos')}</h2>
                  <span className="text-[10px] font-black text-[#005BC0] bg-[#005BC0]/5 px-3 py-1 rounded-full uppercase tracking-widest">{formData.images.length} / 20</span>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 -mx-6 px-6">
                  <label className="flex-shrink-0 w-48 h-48 border-2 border-dashed border-[#c2c6d5] rounded-[2rem] flex flex-col items-center justify-center bg-white hover:bg-[#eaf2ff] transition-all cursor-pointer group">
                    <span className="material-symbols-rounded text-[#727784] text-[40px] mb-2 group-hover:scale-110 transition-all">add_a_photo</span>
                    <input type="file" multiple accept="image/*" onChange={(e) => { if (e.target.files) { const filesArray = Array.from(e.target.files); if (filesArray.length + formData.images.length > 20) return; setFormData(prev => ({ ...prev, images: [...prev.images, ...filesArray] })); } }} className="hidden" />
                  </label>
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative flex-shrink-0 w-48 h-48 rounded-[2rem] bg-[#e2e9ea] overflow-hidden shadow-md">
                      <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" alt="" />
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))} className="absolute top-3 right-3 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-lg hover:bg-[#ba1a1a] transition-colors"><span className="material-symbols-rounded text-[18px]">close</span></button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>
        </motion.div>
      )}
    </AnimatePresence>
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
