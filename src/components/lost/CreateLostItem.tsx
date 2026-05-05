'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { lostFoundService } from '@/lib/firebase/lostFoundService';
import { plazaService } from '@/lib/firebase/plazaService';
import { LostFoundType } from '@/types/lostFound';
import UniversalCompose from '@/components/common/UniversalCompose';
import { useLanguage } from '@/contexts/LanguageContext';

interface CreateLostItemProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateLostItem({ isOpen, onClose, onSuccess }: CreateLostItemProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [type, setType] = useState<LostFoundType>('LOST');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Personal Gear');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { key: 'Personal Gear', label: t('lost.type_gear') },
    { key: 'Electronics', label: t('lost.type_electronics') },
    { key: 'Hobby Gear', label: t('lost.type_hobby') },
    { key: 'Clothing', label: t('lost.type_clothing') },
    { key: 'Others', label: t('lost.type_others') }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!user || !title || !location || !mediaFile) return;

    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      const imageUrl = await plazaService.uploadMedia(mediaFile, (p) => setUploadProgress(Math.round(p)));

      const today = new Date().toISOString().split('T')[0];

      await lostFoundService.addItem({
        type,
        status: 'SEARCHING',
        title,
        description,
        location,
        category,
        date: today,
        images: [imageUrl],
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhoto: user.photoURL || undefined,
        reward: 0,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating lost report:", error);
      alert(t('lost.msg_fail_post'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UniversalCompose
      id="lost-found"
      title={t('lost.report_case')}
      label={t('lost.guardian_network')}
      submitLabel={t('lost.publish_report')}
      submittingLabel={`${t('lost.broadcasting')} ${uploadProgress}%`}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div className="space-y-8">
        {/* Category Toggle (Lost vs Found) */}
        <div className="flex p-1 bg-gray-100 rounded-full">
          <button
            type="button"
            onClick={() => setType('LOST')}
            className={`flex-1 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
              type === 'LOST' ? 'bg-[#9f403d] text-white shadow-lg' : 'text-gray-400'
            }`}
          >
            {t('lost.lost_item')}
          </button>
          <button
            type="button"
            onClick={() => setType('FOUND')}
            className={`flex-1 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
              type === 'FOUND' ? 'bg-[#1A73E8] text-white shadow-lg' : 'text-gray-400'
            }`}
          >
            {t('lost.found_item')}
          </button>
        </div>

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
                <span className="material-symbols-outlined text-gray-300 text-[32px]">manage_search</span>
              </div>
              <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest text-center px-6">
                {type === 'LOST' ? t('lost.upload_photo_ref') : t('lost.upload_photo_found')}
              </span>
            </>
          )}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>

        {/* Core Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-left block">{t('lost.case_title')}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'LOST' ? t('lost.ex_lost_title') : t('lost.ex_found_title')}
              className="w-full text-[24px] font-black tracking-tighter border-none focus:ring-0 placeholder:text-gray-200 p-0"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-left block">{t('lost.type')}</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/10"
              >
                {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-left block">{t('lost.location')}</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('lost.ex_location')}
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/10"
                required
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2 pb-4 text-left">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">{t('lost.detailed_story')}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('lost.story_placeholder')}
            className="w-full min-h-[120px] bg-gray-50 border-none rounded-[28px] px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-primary/10 resize-none"
          />
        </div>
      </div>
    </UniversalCompose>
  );
}
