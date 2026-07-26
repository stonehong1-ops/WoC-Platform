'use client';

import React, { useState, useRef } from 'react';
import { storageService } from '@/lib/firebase/storageService';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export interface StandardImageUploaderProps {
  mode?: 'single' | 'multiple';
  aspectRatio?: '4/5' | '16/9' | '1/1' | 'auto';
  maxCount?: number;
  maxSizeMB?: number;
  storageFolderPath: string;
  value?: string | string[];
  onChange: (urls: string | string[]) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const StandardImageUploader: React.FC<StandardImageUploaderProps> = ({
  mode = 'single',
  aspectRatio = '4/5',
  maxCount = 10,
  maxSizeMB = 20,
  storageFolderPath,
  value,
  onChange,
  label,
  placeholder,
  className = '',
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingState, setUploadingState] = useState<{ [key: string]: number }>({});
  const [isUploadingAny, setIsUploadingAny] = useState(false);

  // Normalize URLs array
  const urls: string[] = Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];

  // Aspect ratio CSS class
  const getAspectCls = () => {
    switch (aspectRatio) {
      case '4/5': return 'aspect-[4/5]';
      case '16/9': return 'aspect-video';
      case '1/1': return 'aspect-square';
      default: return 'min-h-[160px]';
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (mode === 'single' && files.length > 1) {
      toast.error(t('common.single_file_only', '한 개의 이미지만 선택 가능합니다.'));
      return;
    }

    if (mode === 'multiple' && urls.length + files.length > maxCount) {
      toast.error(t('common.max_files_exceeded', `최대 ${maxCount}개까지 업로드할 수 있습니다.`));
      return;
    }

    // Pre-validation (Size)
    for (const file of files) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(t('common.file_too_large', `${maxSizeMB}MB 이하의 이미지만 업로드 가능합니다.`));
        return;
      }
    }

    setIsUploadingAny(true);
    const newUploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const tempId = `${Date.now()}_${i}`;

      setUploadingState(prev => ({ ...prev, [tempId]: 5 }));

      try {
        const path = `${storageFolderPath}/${Date.now()}_${i}_${file.name}`;
        const downloadUrl = await storageService.uploadFile(file, path, (progress) => {
          setUploadingState(prev => ({ ...prev, [tempId]: Math.max(10, Math.round(progress)) }));
        });

        newUploadedUrls.push(downloadUrl);
        setUploadingState(prev => {
          const next = { ...prev };
          delete next[tempId];
          return next;
        });
      } catch (err) {
        console.error('Image upload failed:', err);
        toast.error(t('common.upload_failed', '이미지 업로드에 실패했습니다. 다시 시도해 주세요.'));
        setUploadingState(prev => {
          const next = { ...prev };
          delete next[tempId];
          return next;
        });
      }
    }

    setIsUploadingAny(false);

    if (newUploadedUrls.length > 0) {
      if (mode === 'single') {
        onChange(newUploadedUrls[0]);
      } else {
        onChange([...urls, ...newUploadedUrls]);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = (indexToRemove: number) => {
    if (mode === 'single') {
      onChange('');
    } else {
      const updated = urls.filter((_, idx) => idx !== indexToRemove);
      onChange(updated);
    }
  };

  const activeUploadingKeys = Object.keys(uploadingState);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
          <span>{label}</span>
          {mode === 'multiple' && (
            <span className="text-[11px] font-medium text-[#acb3b4]">
              {urls.length} / {maxCount}
            </span>
          )}
        </label>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple={mode === 'multiple'}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Single Mode View */}
      {mode === 'single' ? (
        <div className={`relative w-full ${getAspectCls()} rounded-2xl overflow-hidden border border-[#e0e4e5] bg-[#f8f9fa] flex items-center justify-center group shadow-sm transition-all`}>
          {urls[0] ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urls[0]} alt="Uploaded preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 bg-white/90 rounded-full text-slate-700 hover:bg-white shadow-md transition-all active:scale-95"
                  title="변경"
                >
                  <span className="material-symbols-rounded text-lg">edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(0)}
                  className="p-2.5 bg-white/90 rounded-full text-red-600 hover:bg-white shadow-md transition-all active:scale-95"
                  title="삭제"
                >
                  <span className="material-symbols-rounded text-lg">delete</span>
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAny}
              className="w-full h-full flex flex-col items-center justify-center p-4 text-center hover:bg-[#f2f4f4] transition-colors group"
            >
              {isUploadingAny ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-primary">
                    {uploadingState[activeUploadingKeys[0]] || 10}%
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-white border border-[#e0e4e5] flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-2 shadow-sm">
                    <span className="material-symbols-rounded text-2xl">add_photo_alternate</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    {placeholder || t('common.click_to_upload', '클릭하여 이미지 업로드')}
                  </span>
                  <span className="text-[11px] font-medium text-[#acb3b4] mt-0.5">
                    JPG, PNG, WEBP (최대 {maxSizeMB}MB)
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        /* Multiple Mode View */
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {urls.map((url, idx) => (
            <div key={url + idx} className={`relative ${getAspectCls()} rounded-xl overflow-hidden border border-[#e0e4e5] bg-[#f8f9fa] group shadow-sm`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full hover:bg-red-600 transition-colors opacity-90 group-hover:opacity-100"
              >
                <span className="material-symbols-rounded text-sm block">close</span>
              </button>
            </div>
          ))}

          {/* Uploading Progress Cards */}
          {activeUploadingKeys.map((key) => (
            <div key={key} className={`relative ${getAspectCls()} rounded-xl border border-primary/30 bg-primary/5 flex flex-col items-center justify-center p-2`}>
              <div className="relative flex items-center justify-center">
                <svg className="w-10 h-10 transform -rotate-90">
                  <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" className="text-slate-200" fill="transparent" />
                  <circle
                    cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" className="text-primary transition-all duration-150"
                    strokeDasharray={100}
                    strokeDashoffset={100 - (uploadingState[key] || 10)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <span className="absolute text-[10px] font-black text-primary">
                  {uploadingState[key] || 10}%
                </span>
              </div>
            </div>
          ))}

          {/* Add Button */}
          {urls.length + activeUploadingKeys.length < maxCount && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAny}
              className={`${getAspectCls()} rounded-xl border border-dashed border-[#e0e4e5] bg-[#f8f9fa] hover:bg-[#f2f4f4] hover:border-primary/40 transition-all flex flex-col items-center justify-center p-2 text-slate-500`}
            >
              <span className="material-symbols-rounded text-2xl mb-1 text-primary">add_a_photo</span>
              <span className="text-[11px] font-bold text-slate-600">추가</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
