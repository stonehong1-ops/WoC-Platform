import React, { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLocation } from '@/components/providers/LocationProvider';
import { eventService } from '@/lib/firebase/eventService';
import { EventCategory } from '@/types/event';
import { Timestamp } from 'firebase/firestore';
import UniversalCompose from '@/components/common/UniversalCompose';
import { useLanguage } from '@/contexts/LanguageContext';

interface CreateEventProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateEvent({ isOpen, onClose, onSuccess }: CreateEventProps) {
  const { user } = useAuth();
  const { location } = useLocation();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [title, setTitle] = useState('');
  const [titleNative, setTitleNative] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('SOCIAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locationName, setLocationName] = useState('');

  const handleSubmit = async () => {
    if (!user || !title || !startDate) {
      alert(t('event.msg_fill_required'));
      return;
    }

    setIsSubmitting(true);
    try {
      const startObj = new Date(startDate);
      startObj.setHours(0, 0, 0, 0);
      
      const endObj = endDate ? new Date(endDate) : new Date(startDate);
      endObj.setHours(0, 0, 0, 0);
      
      await eventService.createEvent({
        title,
        titleNative,
        description,
        category,
        location: locationName || `${location?.city || 'Globe'}, ${location?.country || ''}`,
        startDate: Timestamp.fromDate(startObj),
        endDate: Timestamp.fromDate(endObj),
        hostId: user.uid,
        hostName: user.displayName || 'Anonymous',
        hostPhoto: user.photoURL || '',
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating event:", error);
      alert(t('event.msg_post_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: { key: EventCategory; labelKey: string }[] = [
    { key: 'CONFERENCE', labelKey: 'event.cat_conference' },
    { key: 'WORKSHOP', labelKey: 'event.cat_workshop' },
    { key: 'NETWORKING', labelKey: 'event.cat_networking' },
    { key: 'PARTY', labelKey: 'event.cat_party' },
    { key: 'SOCIAL', labelKey: 'event.cat_social' }
  ];

  return (
    <UniversalCompose
      id="event"
      isOpen={isOpen}
      onClose={onClose}
      title={t('event.modal_title')}
      label={t('event.modal_label')}
      submitLabel={isSubmitting ? t('event.launching') : t('event.publish')}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      {/* Title Input */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('event.title_label')}</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('event.title_placeholder')}
          className="w-full text-[24px] font-black tracking-tighter border-none focus:ring-0 placeholder:text-gray-200 p-0"
          autoFocus
          required
        />
      </div>

      {/* Native Name Input */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('event.native_title_label')}</label>
        <input
          value={titleNative}
          onChange={(e) => setTitleNative(e.target.value)}
          placeholder={t('event.native_title_placeholder')}
          className="w-full text-[16px] font-bold tracking-tight border-none focus:ring-0 placeholder:text-gray-200 p-0"
        />
      </div>

      {/* Category Selector */}
      <div className="space-y-4">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-center block">{t('event.category_label')}</label>
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategory(cat.key)}
              className={`px-4 py-2 rounded-full text-[11px] font-black transition-all tracking-tight ${
                category === cat.key 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              {t(cat.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 pt-4">
        {/* Date Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('event.start_date_label')}</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all"
            required
          />
        </div>
        {/* End Date Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('event.end_date_label')}</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all"
            placeholder={t('event.optional_placeholder')}
          />
        </div>
      </div>

      {/* Location Input */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('event.location_label')}</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-300 text-[20px]">location_on</span>
          <input
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder={t('event.location_placeholder')}
            className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('event.description_label')}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('event.description_placeholder')}
          className="w-full min-h-[140px] px-5 py-4 bg-gray-50 border-none rounded-3xl text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all resize-none"
        />
      </div>
    </UniversalCompose>
  );
}
