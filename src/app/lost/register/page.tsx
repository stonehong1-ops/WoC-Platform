'use client';

import React, { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { lostFoundService } from '@/lib/firebase/lostFoundService';
import { storageService } from '@/lib/firebase/storageService';
import { LostFoundType, LostFoundItem } from '@/types/lostFound';
import { useLanguage } from '@/contexts/LanguageContext';

const TOTAL_STEPS = 2;
const MAX_PHOTOS = 5;

function RegisterPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { setGlobalNavHidden } = useNavigation();
  const { t, language } = useLanguage();

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const [step, setStep] = useState(1);
  const [type, setType] = useState<LostFoundType>('LOST');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [currency, setCurrency] = useState('KRW');
  const [reward, setReward] = useState<string>('');
  
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CURRENCIES = ['KRW', 'USD', 'EUR', 'JPY', 'CNY'];

  const handleRewardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setReward(val);
  };

  const formatNumber = (val: string) => {
    if (!val) return '';
    return parseInt(val, 10).toLocaleString();
  };

  // Hide global navigation
  useEffect(() => {
    setGlobalNavHidden(true);
    return () => setGlobalNavHidden(false);
  }, [setGlobalNavHidden]);

  // Load existing item if editing
  useEffect(() => {
    if (!editId) return;
    const fetchItem = async () => {
      const unsub = lostFoundService.subscribeItem(editId, (data) => {
        if (data) {
          if (data.authorId !== user?.uid) {
            alert(t('lost.register.msg_no_permission', '수정 권한이 없습니다.'));
            router.back();
            return;
          }
          setType(data.type);
          setTitle(data.title);
          setDescription(data.description || '');
          setLocation(data.location || '');
          setDate(data.date || getTodayString());
          setCurrency(data.currency || 'KRW');
          setReward(data.reward ? data.reward.toString() : '');
          setExistingImages(data.images || []);
        }
        unsub();
      });
    };
    fetchItem();
  }, [editId, user, t, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (images.length + existingImages.length + selectedFiles.length > MAX_PHOTOS) {
        alert(t('lost.register.msg_limit_photos', '최대 5장까지 사진을 선택할 수 있습니다.'));
        return;
      }
      setImages(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };
  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleHeaderBack = useCallback(() => {
    if (step > 1) {
      setStep(1);
    } else {
      const hasDraft = Boolean(title.trim() || images.length > 0 || existingImages.length > 0);
      if (hasDraft) {
        if (confirm(t('common.confirm_discard', '작성 중인 내용이 사라집니다. 나가시겠습니까?'))) {
          router.back();
        }
      } else {
        router.back();
      }
    }
  }, [step, title, images.length, existingImages.length, t, router]);

  const isStep1Valid = title.trim().length > 0;
  const isStep2Valid = location.trim().length > 0 && date.trim().length > 0;

  const handleSubmit = async () => {
    if (!user) {
      alert(t('lost.register.msg_login_required', '로그인이 필요합니다.'));
      return;
    }
    if (!title.trim() || !location.trim() || !date.trim()) {
      alert(t('lost.register.msg_fill_required', '필수 항목을 모두 입력해 주세요.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedUrls: string[] = [];
      if (images.length > 0) {
        setUploadProgress(0);
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const path = `lost_found/${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const url = await storageService.uploadFile(file, path, (progress) => {
            const overall = Math.round(((i * 100) + progress) / images.length);
            setUploadProgress(overall);
          });
          uploadedUrls.push(url);
        }
        setUploadProgress(null);
      }

      const finalImages = [...existingImages, ...uploadedUrls];

      const itemData: Partial<LostFoundItem> = {
        type,
        title,
        description,
        location,
        date,
        reward: reward ? parseInt(reward, 10) : 0,
        currency,
        images: finalImages,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhoto: user.photoURL || '',
        status: 'SEARCHING',
      };

      if (editId) {
        await lostFoundService.updateItem(editId, itemData);
        router.back();
      } else {
        const newId = await lostFoundService.addItem(itemData as Omit<LostFoundItem, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'viewsCount'>);
        router.replace('/create-success?type=lost&id=' + newId);
      }
    } catch (err) {
      console.error(err);
      alert(t('lost.register.msg_error_occurred', '등록 처리 중 오류가 발생했습니다.'));
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const headerTitle = editId
    ? (t('lost.edit_title') || '분실물 수정')
    : (t('lost.create_title') || '새 분실물');

  const stepCategoryTitle = step === 1
    ? (language === 'KR' ? '분류, 사진 및 제목' : 'Type, Photos & Title')
    : (language === 'KR' ? '발생 장소 및 세부정보' : 'Location & Details');

  return (
    <main className="max-w-md mx-auto min-h-screen bg-[#FAF8FF] text-slate-800 font-body antialiased flex flex-col relative notranslate">
      {/* Header */}
      <header 
        className="fixed top-0 left-0 right-0 max-w-md mx-auto w-full flex-shrink-0 bg-white border-b border-slate-100 px-4 flex items-center justify-between z-[100010]"
        style={{
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
        <h1 className="text-[16px] font-bold text-slate-800 truncate">
          {headerTitle}
        </h1>
        <div className="w-10" />
      </header>

      {/* Header Spacer */}
      <div 
        className="w-full flex-shrink-0"
        style={{ height: 'calc(56px + env(safe-area-inset-top, 0px))' }} 
      />

      {/* Step Indicator Bar */}
      <div className="w-full px-4 mt-3 flex-shrink-0">
        <div className="flex items-center justify-between border border-slate-100 bg-slate-50/80 backdrop-blur rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700">
              {language === 'KR' ? `${step} / ${TOTAL_STEPS} 단계` : `Step ${step} of ${TOTAL_STEPS}`}
            </span>
            <span className="text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-0.5 rounded-full">
              {stepCategoryTitle}
            </span>
          </div>
          <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#007AFF] transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 w-full px-4 py-4 overflow-y-auto pb-28 space-y-6">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Type Selector (LOST vs FOUND) */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm p-4 space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                {t('lost.register.label_type', '게시글 분류')} <span className="text-red-500">*</span>
              </label>
              <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setType('LOST')}
                  className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    type === 'LOST' 
                      ? 'bg-white shadow-sm text-red-500 font-extrabold' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className="material-symbols-rounded text-lg">search_off</span>
                  <span>{t('lost.register.type_lost', '분실했어요 (찾아요)')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('FOUND')}
                  className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    type === 'FOUND' 
                      ? 'bg-white shadow-sm text-[#007AFF] font-extrabold' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className="material-symbols-rounded text-lg">wb_incandescent</span>
                  <span>{t('lost.register.type_found', '습득했어요 (주웠어요)')}</span>
                </button>
              </div>
            </div>

            {/* Photos Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-sm text-[#007AFF]">photo_camera</span>
                  <p className="text-[14px] font-bold text-[#007AFF]">
                    {t('lost.register.photos_title', '물품 사진')}
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {images.length + existingImages.length} / {MAX_PHOTOS}
                </span>
              </div>
              <div className="p-4">
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 items-center">
                  {images.length + existingImages.length < MAX_PHOTOS && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="shrink-0 w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center hover:border-[#007AFF]/40 hover:bg-[#007AFF]/5 transition-all"
                    >
                      <span className="material-symbols-rounded text-slate-400 mb-1">add_a_photo</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase">ADD</span>
                    </button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                  />

                  {existingImages.map((url, i) => (
                    <div key={`existing-${i}`} className="shrink-0 relative w-24 h-24 rounded-2xl overflow-hidden shadow-sm border border-slate-100 group">
                      <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 backdrop-blur rounded-full text-white flex items-center justify-center"
                      >
                        <span className="material-symbols-rounded text-[14px]">close</span>
                      </button>
                    </div>
                  ))}

                  {images.map((file, i) => (
                    <div key={`new-${i}`} className="shrink-0 relative w-24 h-24 rounded-2xl overflow-hidden shadow-sm border border-slate-100 group">
                      <img src={URL.createObjectURL(file)} alt="Upload preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 backdrop-blur rounded-full text-white flex items-center justify-center"
                      >
                        <span className="material-symbols-rounded text-[14px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Title Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm p-4 space-y-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('lost.register.label_title', '물품 제목')} <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={t('lost.register.placeholder_title', '예: 홍대 연습실에서 검은색 에어팟 프로 잃어버렸습니다')}
                className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-3 text-sm font-bold focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 placeholder:text-[#acb3b4] placeholder:font-normal text-slate-800"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Location & Date Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#e0e4e5] pb-3 mb-1">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">location_on</span>
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {language === 'KR' ? '발생 장소 및 일시' : 'Location & Date'}
                </p>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t('lost.register.label_location', '발생 장소')} <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder={t('lost.register.placeholder_location', '예: 서울 마포구 동교동 밀롱가 엘불린')}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 placeholder:text-[#acb3b4] placeholder:font-normal text-slate-800"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t('lost.register.label_date', '발생 날짜')} <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 placeholder:text-[#acb3b4] placeholder:font-normal text-slate-800"
                />
              </div>
            </div>

            {/* Reward & Details Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#e0e4e5] pb-3 mb-1">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">description</span>
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {language === 'KR' ? '사례금 및 상세 내용' : 'Reward & Description'}
                </p>
              </div>

              {/* Reward & Currency */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t('lost.register.label_reward', '사례금 (선택)')}
                </label>
                <div className="flex w-full items-center gap-3">
                  <div className="relative w-[100px] shrink-0">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 placeholder:text-[#acb3b4] placeholder:font-normal"
                    >
                      {CURRENCIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    value={formatNumber(reward)}
                    onChange={handleRewardChange}
                    placeholder="0"
                    className="flex-1 min-w-0 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-bold text-right text-slate-800 focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 placeholder:text-[#acb3b4] placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t('lost.register.label_description', '상세 설명')}
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={t('lost.register.placeholder_description', '물품의 특징, 상태, 보관 위치 또는 연락 방법 등에 대해 자유롭게 작성해 주세요.')}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 placeholder:text-[#acb3b4] placeholder:font-normal text-slate-800 resize-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Bar */}
      <footer 
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto w-full bg-white border-t border-slate-100 px-4 flex items-center justify-between z-[100010] shadow-lg"
        style={{
          paddingTop: '16px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          height: 'calc(76px + env(safe-area-inset-bottom, 0px))'
        }}
      >
        {step === 1 ? (
          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!isStep1Valid}
            className="w-full py-3.5 rounded-full bg-[#007AFF] text-white text-sm font-bold active:scale-95 transition-all disabled:opacity-50 shadow-sm"
          >
            {language === 'KR' ? '다음 단계 (2/2)' : 'Next Step (2/2)'}
          </button>
        ) : (
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-grow py-3.5 rounded-full border border-slate-200 text-slate-700 text-sm font-bold active:scale-95 transition-transform"
            >
              {language === 'KR' ? '이전 단계' : 'Previous'}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !isStep2Valid}
              className="flex-grow py-3.5 rounded-full bg-[#007AFF] text-white text-sm font-bold active:scale-95 transition-all disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{uploadProgress !== null ? `${t('common.uploading', '업로드 중')} ${uploadProgress}%` : (editId ? t('lost.register.status_updating', '수정 중...') : t('lost.register.status_registering', '등록 중...'))}</span>
                </div>
              ) : (
                <span>{editId ? t('lost.register.button_update', '수정하기') : t('lost.register.button_register', '등록하기')}</span>
              )}
            </button>
          </div>
        )}
      </footer>
    </main>
  );
}

export default function LostFoundRegisterPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto min-h-screen bg-[#FAF8FF] flex items-center justify-center">
        <span className="material-symbols-rounded animate-spin text-slate-300 text-4xl">progress_activity</span>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}
