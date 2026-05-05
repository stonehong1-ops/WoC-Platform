import React, { useState, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { rentalService } from '@/lib/firebase/rentalService';
import { plazaService } from '@/lib/firebase/plazaService';
import UniversalCompose from '@/components/common/UniversalCompose';

interface CreateRentalSpaceProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateRentalSpace({ isOpen, onClose, onSuccess }: CreateRentalSpaceProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [title, setTitle] = useState('');
  const [studioName, setStudioName] = useState('');
  const [category, setCategory] = useState('댄스 스튜디오');
  const [pricePerHour, setPricePerHour] = useState('');
  const [minHours, setMinHours] = useState('1');
  const [capacity, setCapacity] = useState('');
  const [size, setSize] = useState('Medium');
  const [location, setLocation] = useState('Seoul, Korea');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [facilities, setFacilities] = useState<string[]>([]);
  const [newFacility, setNewFacility] = useState('');
  const [rules, setRules] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['댄스 스튜디오', '연습실', '파티룸', '갤러리', '공연장', '기타'];
  const sizes = ['Small', 'Medium', 'Large', 'Extra Large'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const addFacility = () => {
    if (newFacility.trim() && !facilities.includes(newFacility.trim())) {
      setFacilities([...facilities, newFacility.trim()]);
      setNewFacility('');
    }
  };

  const removeFacility = (f: string) => {
    setFacilities(facilities.filter(item => item !== f));
  };

  const handleSubmit = async () => {
    if (!user || !title || !pricePerHour || !mediaFile) {
      alert("필수 항목을 모두 입력하고 사진을 등록해주세요.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      const imageUrl = await plazaService.uploadMedia(mediaFile, (p) => setUploadProgress(Math.round(p)));

      await rentalService.addSpace({
        title,
        description,
        location,
        address,
        images: [imageUrl],
        category,
        pricePerHour: parseInt(pricePerHour),
        minHours: parseInt(minHours),
        capacity: capacity ? parseInt(capacity) : undefined,
        size,
        studioName,
        facilities,
        rules,
        hostId: user.uid,
        regularClasses: []
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating rental space:", error);
      alert("공간 등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UniversalCompose
      id="rental"
      isOpen={isOpen}
      onClose={onClose}
      title="공간 등록"
      label="Rental Space"
      submitLabel={isSubmitting ? `등록 중 ${uploadProgress}%` : "공간 공유하기"}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      {/* Photo Upload Area */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="relative h-64 w-full rounded-3xl bg-gray-50 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-primary/20 transition-all"
      >
        {previewUrl ? (
          <img src={previewUrl} className="w-full h-full object-cover" alt="preview" />
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-gray-300 text-[32px]">camera</span>
            </div>
            <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest">공간 사진 추가</span>
          </>
        )}
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      </div>

      {/* Core Info */}
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">공간 이름</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) 강남역 도보 5분 댄스 스튜디오"
            className="w-full text-[24px] font-black tracking-tighter border-none focus:ring-0 placeholder:text-gray-200 p-0"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">스튜디오명 / 브랜드</label>
          <input
            value={studioName}
            onChange={(e) => setStudioName(e.target.value)}
            placeholder="예) 원밀리언 댄스"
            className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/10"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">카테고리</label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {categories.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  category === c 
                    ? 'bg-primary text-white shadow-md' 
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">시간당 요금 (₩)</label>
            <input
              type="number"
              value={pricePerHour}
              onChange={(e) => setPricePerHour(e.target.value)}
              placeholder="0"
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/10"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">최소 예약 시간</label>
            <input
              type="number"
              value={minHours}
              onChange={(e) => setMinHours(e.target.value)}
              placeholder="1"
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/10"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">수용 인원</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="최대 인원수"
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">공간 사이즈</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/10"
            >
              {sizes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">위치 및 주소</label>
          <div className="grid grid-cols-2 gap-4">
            <div className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold flex items-center gap-2">
               <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
               <span className="truncate">{location}</span>
            </div>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="상세 주소"
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/10"
            />
          </div>
        </div>
      </div>

      {/* Facilities */}
      <div className="space-y-4">
         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">편의 시설</label>
         <div className="flex gap-2">
            <input
              value={newFacility}
              onChange={(e) => setNewFacility(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFacility())}
              placeholder="예) 전신거울, 오디오, 와이파이"
              className="flex-1 bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/10"
            />
            <button
              type="button"
              onClick={addFacility}
              className="bg-primary text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-all"
            >
              <span className="material-symbols-rounded">add</span>
            </button>
         </div>
         <div className="flex flex-wrap gap-2">
            {facilities.map(f => (
              <span key={f} className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">
                {f}
                <button onClick={() => removeFacility(f)} className="material-symbols-rounded text-sm hover:text-red-500">close</button>
              </span>
            ))}
         </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">공간 설명</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="공간의 특징과 장점을 상세히 적어주세요..."
          className="w-full min-h-[120px] bg-gray-50 border-none rounded-[28px] px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-primary/10 resize-none"
        />
      </div>

      {/* Rules */}
      <div className="space-y-2 pb-4">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">이용 규칙</label>
        <textarea
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          placeholder="이용자가 지켜야 할 매너와 주의사항을 입력해주세요..."
          className="w-full min-h-[100px] bg-gray-50 border-none rounded-[28px] px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-primary/10 resize-none"
        />
      </div>
    </UniversalCompose>
  );
}
