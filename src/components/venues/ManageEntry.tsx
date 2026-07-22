"use client";

import React, { useState, useRef, useEffect } from 'react';
import { db } from '@/lib/firebase/clientApp';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
  height: '240px',
  borderRadius: '16px',
};

const CIRCLE_PATH = 0;
const TOTAL_STEPS = 3;

export default function ManageEntry({ isOpen, onClose, isLoaded, initialData, mode = 'edit' }: ManageEntryProps) {
  const { location } = useLocation();
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1);
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
        categories: initialData.types || (initialData.category ? [initialData.category] : []),
        address: initialData.address,
        detailAddress: (initialData as any).detailAddress || '',
        city: initialData.city,
        country: (initialData as any).country || '',
        zone: (initialData as any).zone || '',
        latitude: initialData.coordinates.latitude,
        longitude: initialData.coordinates.longitude,
        images: [],
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
    setStep(1);
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
        const firstPlaceId = predictions[0].place_id;
        const detailsService = new google.maps.places.PlacesService(document.createElement('div'));
        
        detailsService.getDetails({ placeId: firstPlaceId }, (place, status) => {
          if (status === 'OK' && place) {
            updateWithPlace(place);
          }
        });
      } else {
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

  const handleHeaderBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    } else {
      if (formData.name.trim() || formData.address.trim() || formData.categories.length > 0) {
        if (confirm(t('venues.cancel_confirm') || '작성 중인 정보가 있습니다. 취소하시겠습니까?')) {
          onClose();
        }
      } else {
        onClose();
      }
    }
  };

  const handleNextOrSave = () => {
    if (step === 1) {
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
      setStep(2);
    } else if (step === 2) {
      if (!formData.address.trim()) {
        alert(t('venues.location_search') + '를 진행해 주세요.');
        return;
      }
      setStep(3);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
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
      alert(t('venues.alert_save_failed', { error: error.message || 'Unknown error.' }));
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
          className="fixed inset-0 z-[100000] bg-white overflow-y-auto"
          style={{ paddingTop: 'calc(56px + env(safe-area-inset-top, 0px))' }}
        >
          <style dangerouslySetInnerHTML={{ __html: `.material-symbols-rounded { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }` }} />

          {/* 소셜/클래스 100% 표준 헤더 (X버튼 전면 제거, 좌측 뒤로가기로 조작) */}
          <header 
            className="fixed top-0 left-0 w-full flex-shrink-0 bg-white border-b border-slate-100 px-4 flex items-center justify-between z-50"
            style={{ 
              zIndex: 100010,
              paddingTop: 'env(safe-area-inset-top, 0px)',
              height: 'calc(56px + env(safe-area-inset-top, 0px))'
            }}
          >
            <button 
              type="button" 
              onClick={handleHeaderBack} 
              className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform text-slate-700"
            >
              <span className="material-symbols-rounded text-2xl">arrow_back</span>
            </button>
            <h1 className="text-[16px] font-bold text-slate-800">
              {mode === 'geo' ? t('venues.geo_tuning') : initialData ? t('venues.edit_venue') : t('venues.register_venue')}
            </h1>
            <div className="w-10" />
          </header>

          {/* 메인 컨테이너 영역 */}
          <div className="max-w-2xl mx-auto px-4 pt-4 pb-28 space-y-6">
            
            {/* 스텝 진행률 표시 바 (Step Indicator Bar) */}
            <div className="flex items-center justify-between border border-slate-100 bg-slate-50/80 backdrop-blur rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-700">
                  {language === 'KR' ? `${step} / ${TOTAL_STEPS} 단계` : `Step ${step} of ${TOTAL_STEPS}`}
                </span>
                <span className="text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-0.5 rounded-full">
                  {step === 1
                    ? (language === 'KR' ? '장소명 & 카테고리' : 'Name & Category')
                    : step === 2
                    ? (language === 'KR' ? '위치 & 지적 정보' : 'Location & Map')
                    : (language === 'KR' ? '사진 & 상세 정보' : 'Photos & Details')}
                </span>
              </div>
              <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#007AFF] transition-all duration-300"
                  style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                />
              </div>
            </div>

            {/* 1단계: 장소 기본정보 & 카테고리 */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Identity 카드 */}
                <div className="border border-[#e0e4e5] rounded-2xl bg-white overflow-hidden shadow-sm">
                  <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                    <span className="material-symbols-rounded text-sm text-[#007AFF]">info</span>
                    <p className="text-[14px] font-bold text-slate-800">{t('venues.identity')}</p>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {t('venues.place_name_required')} <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '')})} 
                        placeholder={t('venues.place_name_placeholder')} 
                        className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3.5 text-slate-800 font-bold focus:bg-white focus:border-[#007AFF] transition-all text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {t('venues.korean_name_optional')}
                      </label>
                      <input 
                        type="text" 
                        value={formData.nameKo} 
                        onChange={(e) => setFormData({...formData, nameKo: e.target.value})} 
                        placeholder={t('venues.korean_name_placeholder')} 
                        className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3.5 text-slate-800 font-bold focus:bg-white focus:border-[#007AFF] transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Category 카드 */}
                <div className="border border-[#e0e4e5] rounded-2xl bg-white overflow-hidden shadow-sm">
                  <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center justify-between rounded-t-[15px]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-rounded text-sm text-[#007AFF]">category</span>
                      <p className="text-[14px] font-bold text-slate-800">{t('venues.category')}</p>
                    </div>
                    <span className="text-[10px] font-bold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-0.5 rounded-full">
                      {t('venues.multi_selection_enabled')}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-2.5">
                      {categoriesList.map((cat) => {
                        const isSelected = formData.categories.includes(cat.id);
                        return (
                          <button 
                            key={cat.id} 
                            type="button" 
                            onClick={() => toggleCategory(cat.id)} 
                            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all ${
                              isSelected 
                                ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-md scale-[1.02]' 
                                : 'bg-[#f8f9fa] text-slate-700 border-[#e0e4e5] hover:bg-slate-100'
                            }`}
                          >
                            <span className="material-symbols-rounded text-[22px] mb-1.5" style={{ fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}>
                              {cat.icon}
                            </span>
                            <span className="text-xs font-bold truncate w-full text-center">
                              {t('venues.cat_' + cat.id.toLowerCase())}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2단계: 위치 & 지적 정보 */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border border-[#e0e4e5] rounded-2xl bg-white overflow-hidden shadow-sm">
                  <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                    <span className="material-symbols-rounded text-sm text-[#007AFF]">location_on</span>
                    <p className="text-[14px] font-bold text-slate-800">{t('venues.location_search')}</p>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="relative w-full">
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
                            className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl pl-11 pr-4 py-3.5 text-slate-800 font-bold focus:bg-white focus:border-[#007AFF] transition-all text-sm"
                          />
                        </Autocomplete>
                      ) : <div className="w-full bg-slate-100 h-12 rounded-xl animate-pulse"></div>}
                      <span className="material-symbols-rounded absolute left-3.5 top-1/2 -translate-y-1/2 text-[#007AFF] text-xl">search</span>
                    </div>

                    <div className="h-60 w-full bg-slate-50 rounded-xl overflow-hidden relative border border-[#e0e4e5]">
                      {isLoaded ? (
                        <GoogleMap 
                          mapContainerStyle={mapContainerStyle} 
                          center={{ lat: formData.latitude, lng: formData.longitude }} 
                          zoom={17} 
                          onLoad={(m) => setMap(m)} 
                          options={{ disableDefaultUI: true, zoomControl: false, mapId: "425069951fef97d91810ab94", gestureHandling: 'greedy' }}
                        >
                          <Marker 
                            position={{ lat: formData.latitude, lng: formData.longitude }} 
                            draggable={true} 
                            onDragEnd={(e) => { if (e.latLng) { setFormData(prev => ({ ...prev, latitude: e.latLng!.lat(), longitude: e.latLng!.lng() })); } }} 
                            icon={{ path: CIRCLE_PATH, fillColor: "#007AFF", fillOpacity: 1, strokeWeight: 4, strokeColor: "#ffffff", scale: 10 }}
                          />
                        </GoogleMap>
                      ) : <div className="w-full h-full flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#007AFF]"></div></div>}
                    </div>

                    <div className="bg-[#f8f9fa] rounded-xl p-3 space-y-2 border border-[#e0e4e5]">
                      <div className="grid grid-cols-2 gap-2">
                        <DetailItem label={t('venues.latitude')} value={formData.latitude.toString()} readOnly={true} />
                        <DetailItem label={t('venues.longitude')} value={formData.longitude.toString()} readOnly={true} />
                      </div>
                      <DetailItem label={t('venues.country')} value={formData.country} readOnly={true} />
                      <DetailItem label={t('venues.city')} value={formData.city} readOnly={true} />
                      <DetailItem label={t('venues.zone')} value={formData.zone} readOnly={true} />
                      <DetailItem label={t('venues.street_addr')} value={formData.address} readOnly={true} />
                      
                      {(formData.city.toUpperCase() === 'SEOUL' || (location.city || '').toUpperCase() === 'SEOUL') && (
                        <div className="flex items-center px-4 py-3 bg-white rounded-xl shadow-sm border border-[#e0e4e5]">
                          <label className="w-1/3 text-xs font-bold text-slate-700">{t('venues.seoul_area')}</label>
                          <div className="w-2/3 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, seoulArea: 'gangbuk' }))}
                              className={`py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1 ${formData.seoulArea === 'gangbuk' ? 'bg-[#007AFF] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                            >
                              <span className="material-symbols-rounded text-sm" style={{ fontVariationSettings: formData.seoulArea === 'gangbuk' ? "'FILL' 1" : "'FILL' 0" }}>south_east</span>
                              {t('venues.gangbuk').split(' ')[0]}
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, seoulArea: 'gangnam' }))}
                              className={`py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1 ${formData.seoulArea === 'gangnam' ? 'bg-[#007AFF] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                            >
                              <span className="material-symbols-rounded text-sm" style={{ fontVariationSettings: formData.seoulArea === 'gangnam' ? "'FILL' 1" : "'FILL' 0" }}>north_east</span>
                              {t('venues.gangnam').split(' ')[0]}
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center px-4 py-3 bg-white rounded-xl shadow-sm border border-[#007AFF]/30">
                        <label className="w-1/3 text-xs font-bold text-[#007AFF]">{t('venues.unit_floor')}</label>
                        <input 
                          ref={detailAddressRef}
                          type="text" 
                          value={formData.detailAddress}
                          onChange={(e) => setFormData({...formData, detailAddress: e.target.value})}
                          className="w-2/3 border-none bg-transparent focus:ring-0 text-slate-800 font-bold text-sm p-0" 
                          placeholder={t('venues.unit_floor_placeholder')} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3단계: 대표 사진 & 상세 정보 */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border border-[#e0e4e5] rounded-2xl bg-white overflow-hidden shadow-sm">
                  <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center justify-between rounded-t-[15px]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-rounded text-sm text-[#007AFF]">photo_library</span>
                      <p className="text-[14px] font-bold text-slate-800">{t('venues.venue_photos')}</p>
                    </div>
                    <span className="text-[10px] font-bold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-0.5 rounded-full">
                      {formData.images.length} / 20
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <label className="aspect-[4/5] border-2 border-dashed border-[#e0e4e5] rounded-2xl flex flex-col items-center justify-center bg-[#f8f9fa] hover:bg-slate-100 transition-all cursor-pointer group">
                        <span className="material-symbols-rounded text-slate-400 text-3xl mb-1 group-hover:scale-110 transition-transform">add_a_photo</span>
                        <span className="text-xs font-bold text-slate-500">{t('venues.add_photo') || '사진 추가'}</span>
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          onChange={(e) => { 
                            if (e.target.files) { 
                              const filesArray = Array.from(e.target.files); 
                              if (filesArray.length + formData.images.length > 20) return; 
                              setFormData(prev => ({ ...prev, images: [...prev.images, ...filesArray] })); 
                            } 
                          }} 
                          className="hidden" 
                        />
                      </label>
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative aspect-[4/5] rounded-2xl bg-slate-100 overflow-hidden shadow-sm group">
                          {idx === 0 && (
                            <div className="absolute top-2 left-2 bg-[#007AFF] text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm z-10">
                              PRIMARY
                            </div>
                          )}
                          <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" alt="" />
                          <button 
                            type="button" 
                            onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))} 
                            className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md hover:bg-red-500 transition-colors"
                          >
                            <span className="material-symbols-rounded text-base">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* 소셜/클래스 100% 동일 하단 네비게이션 버튼 바 (이전 단계 / 다음 단계 / 저장) */}
          <div 
            className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 px-4 shadow-lg flex gap-3 items-center justify-between"
            style={{
              zIndex: 100010,
              paddingTop: '16px',
              paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
              height: 'calc(76px + env(safe-area-inset-bottom, 0px))'
            }}
          >
            {step > 1 && (
              <button
                type="button"
                onClick={handleHeaderBack}
                className="flex-grow py-3.5 rounded-full border border-slate-200 text-slate-700 text-sm font-bold active:scale-95 transition-transform"
              >
                {language === 'KR' ? '이전 단계' : 'Previous'}
              </button>
            )}
            <button
              type="button"
              onClick={handleNextOrSave}
              disabled={saving}
              className="flex-grow py-3.5 rounded-full bg-[#007AFF] text-white text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
            >
              {step < TOTAL_STEPS
                ? (language === 'KR' ? '다음 단계' : 'Next Step')
                : (saving ? t('venues.wait') : t('venues.save'))}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DetailItem({ label, value, readOnly }: { label: string, value: string, readOnly?: boolean }) {
  return (
    <div className={`flex items-center px-4 py-2.5 bg-white rounded-xl border border-[#e0e4e5] ${readOnly ? 'opacity-70' : ''}`}>
      <label className="w-1/3 text-xs font-bold text-slate-600">{label}</label>
      <input 
        type="text" 
        value={value}
        readOnly={readOnly}
        tabIndex={readOnly ? -1 : 0}
        className="w-2/3 border-none bg-transparent focus:ring-0 text-slate-800 font-bold text-xs p-0" 
      />
    </div>
  );
}
