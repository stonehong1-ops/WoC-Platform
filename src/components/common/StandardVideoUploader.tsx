'use client';

import React, { useState, useRef } from 'react';
import { storageService } from '@/lib/firebase/storageService';
import { useLanguage } from '@/contexts/LanguageContext';
import { generateVideoPosterBlob } from '@/lib/utils/videoPosterGenerator';
import { toast } from 'sonner';

export interface StandardVideoUploaderProps {
  maxDurationSeconds?: number; // default: 15 for social/events, 60 for feed
  maxSizeMB?: number;          // default: 50MB
  storageFolderPath: string;
  value?: string;              // video URL
  coverUrl?: string;           // cover image URL
  onChange: (videoUrl: string, coverUrl?: string) => void;
  aspectRatio?: '4/5' | '16/9' | '1/1' | 'auto';
  label?: string;
  placeholder?: string;
  className?: string;
}

export const StandardVideoUploader: React.FC<StandardVideoUploaderProps> = ({
  maxDurationSeconds = 15,
  maxSizeMB = 50,
  storageFolderPath,
  value = '',
  coverUrl = '',
  onChange,
  aspectRatio = '4/5',
  label,
  placeholder,
  className = '',
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const getAspectCls = () => {
    switch (aspectRatio) {
      case '4/5': return 'aspect-[4/5]';
      case '16/9': return 'aspect-video';
      case '1/1': return 'aspect-square';
      default: return 'min-h-[200px]';
    }
  };

  // Extract thumbnail image using canvas.toBlob()
  const captureCoverFrame = async (file: File): Promise<File | null> => {
    const blob = await generateVideoPosterBlob(file);
    if (!blob) return null;
    return new File([blob], `cover_${Date.now()}.jpg`, { type: 'image/jpeg' });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. File Size Pre-validation
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(t('common.video_file_too_large', `동영상 용량은 ${maxSizeMB}MB 이하만 지원됩니다.`));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Video Duration Pre-validation
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    const blobUrl = URL.createObjectURL(file);
    tempVideo.src = blobUrl;

    const checkDuration = new Promise<boolean>((resolve) => {
      tempVideo.onloadedmetadata = () => {
        URL.revokeObjectURL(blobUrl);
        if (tempVideo.duration > maxDurationSeconds) {
          toast.error(t('common.video_duration_exceeded', `동영상 재생시간은 최대 ${maxDurationSeconds}초까지만 등록 가능합니다.`));
          resolve(false);
        } else {
          resolve(true);
        }
      };
      tempVideo.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        toast.error(t('common.video_format_invalid', '유효하지 않은 동영상 파일입니다.'));
        resolve(false);
      };
    });

    const isValidDuration = await checkDuration;
    if (!isValidDuration) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setUploadProgress(5);

    try {
      // 3. Upload Video
      const videoPath = `${storageFolderPath}/${Date.now()}_${file.name}`;
      const videoUrl = await storageService.uploadFile(file, videoPath, (p) => {
        setUploadProgress(Math.max(10, Math.round(p * 0.85)));
      });

      // 4. Capture & Upload Cover Thumbnail
      let generatedCoverUrl = coverUrl;
      try {
        const coverFile = await captureCoverFrame(file);
        if (coverFile) {
          const coverPath = `${storageFolderPath}/covers/cover_${Date.now()}.jpg`;
          generatedCoverUrl = await storageService.uploadFile(coverFile, coverPath);
        }
      } catch (coverErr) {
        console.warn('Cover frame extraction skipped:', coverErr);
      }

      setUploadProgress(100);
      onChange(videoUrl, generatedCoverUrl);
    } catch (err) {
      console.error('Video upload error:', err);
      toast.error(t('common.video_upload_failed', '동영상 업로드에 실패했습니다. 다시 시도해 주세요.'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange('', '');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[11px] font-medium text-[#acb3b4]">
            최대 {maxDurationSeconds}초 / {maxSizeMB}MB
          </span>
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className={`relative w-full ${getAspectCls()} rounded-2xl overflow-hidden border border-[#e0e4e5] bg-[#f8f9fa] flex items-center justify-center group shadow-sm transition-all`}>
        {value ? (
          <>
            <video
              src={value}
              poster={coverUrl}
              controls
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 z-20">
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 bg-black/60 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                title="동영상 삭제"
              >
                <span className="material-symbols-rounded text-base block">delete</span>
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full h-full flex flex-col items-center justify-center p-4 text-center hover:bg-[#f2f4f4] transition-colors group"
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-primary">
                  {uploadProgress}%
                </span>
                <span className="text-[11px] font-medium text-[#acb3b4]">
                  동영상 업로드 및 썸네일 생성 중...
                </span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-white border border-[#e0e4e5] flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-2 shadow-sm">
                  <span className="material-symbols-rounded text-2xl">videocam</span>
                </div>
                <span className="text-xs font-bold text-slate-700">
                  {placeholder || t('common.click_to_upload_video', '클릭하여 동영상 업로드')}
                </span>
                <span className="text-[11px] font-medium text-[#acb3b4] mt-0.5">
                  MP4, MOV, WEBM (최대 {maxDurationSeconds}초 / {maxSizeMB}MB)
                </span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
