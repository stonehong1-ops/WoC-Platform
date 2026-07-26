'use client';

import React, { useState } from 'react';
import { socialService } from '@/lib/firebase/socialService';
import { StandardImageUploader } from '@/components/common/StandardImageUploader';
import { StandardVideoUploader } from '@/components/common/StandardVideoUploader';
import { isVideoUrl } from '@/lib/utils/socialUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBackButtonClose } from '@/hooks/useBackButtonClose';
import { toast } from 'sonner';

interface QuickMediaChangeBottomSheetProps {
  socialId: string;
  currentMediaUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newMediaUrl: string) => void;
}

export const QuickMediaChangeBottomSheet: React.FC<QuickMediaChangeBottomSheetProps> = ({
  socialId,
  currentMediaUrl = '',
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  useBackButtonClose(isOpen, onClose);

  const [mediaTab, setMediaTab] = useState<'image' | 'video'>(
    currentMediaUrl && isVideoUrl(currentMediaUrl) ? 'video' : 'image'
  );
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string>(currentMediaUrl);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!selectedMediaUrl) {
      toast.error(t('common.select_media_first', '변경할 포스터 사진이나 동영상을 업로드해 주세요.'));
      return;
    }

    setIsSaving(true);
    try {
      await socialService.updateSocial(socialId, {
        imageUrl: selectedMediaUrl,
        posterExportUrl: selectedMediaUrl,
      });
      toast.success(t('social.poster_update_success', '포스터 미디어가 성공적으로 변경되었습니다.'));
      if (onSuccess) onSuccess(selectedMediaUrl);
      onClose();
    } catch (err) {
      console.error('Quick media update failed:', err);
      toast.error(t('social.poster_update_failed', '포스터 업데이트 중 오류가 발생했습니다.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl p-5 z-10 flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Handle Bar */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-rounded text-xl">photo_camera</span>
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">
                {t('social.quick_media_change_title', '소셜 포스터/동영상 퀵 교체')}
              </h3>
              <p className="text-xs font-medium text-slate-400">
                1주일에 한 번씩 포스터만 5초 만에 빠르게 업데이트하세요.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-95 transition-all"
          >
            <span className="material-symbols-rounded text-lg">close</span>
          </button>
        </div>

        {/* Media Segmented Tabs */}
        <div className="my-4 flex items-center bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setMediaTab('image')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              mediaTab === 'image' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="material-symbols-rounded text-base">image</span>
            <span>포스터 이미지</span>
          </button>
          <button
            type="button"
            onClick={() => setMediaTab('video')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              mediaTab === 'video' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="material-symbols-rounded text-base">videocam</span>
            <span>15초 홍보 비디오</span>
          </button>
        </div>

        {/* Uploader Box */}
        <div className="max-w-[260px] mx-auto w-full mb-5">
          {mediaTab === 'image' ? (
            <StandardImageUploader
              mode="single"
              aspectRatio="4/5"
              storageFolderPath="socials"
              value={!isVideoUrl(selectedMediaUrl) ? selectedMediaUrl : ''}
              onChange={(url) => {
                if (typeof url === 'string') {
                  setSelectedMediaUrl(url);
                }
              }}
              label="새 포스터 이미지"
              placeholder="클릭하여 새 포스터 업로드"
            />
          ) : (
            <StandardVideoUploader
              maxDurationSeconds={15}
              maxSizeMB={50}
              aspectRatio="4/5"
              storageFolderPath="socials/videos"
              value={isVideoUrl(selectedMediaUrl) ? selectedMediaUrl : ''}
              onChange={(videoUrl) => {
                if (videoUrl) {
                  setSelectedMediaUrl(videoUrl);
                }
              }}
              label="새 15초 홍보 동영상"
              placeholder="클릭하여 15초 동영상 업로드"
            />
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 active:scale-95 transition-all"
          >
            {t('common.cancel', '취소')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !selectedMediaUrl}
            className="flex-[2] py-3 bg-primary text-white font-bold text-xs rounded-xl shadow-md hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-rounded text-base">check_circle</span>
            <span>{isSaving ? '저장 중...' : '새 포스터로 적용하기'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
