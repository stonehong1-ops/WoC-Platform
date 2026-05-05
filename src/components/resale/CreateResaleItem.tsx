import React, { useState, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { resaleService } from '@/lib/firebase/resaleService';
import { plazaService } from '@/lib/firebase/plazaService';
import { ItemCondition, TradeMethod } from '@/types/resale';
import UniversalCompose from '@/components/common/UniversalCompose';
import { useLanguage } from '@/contexts/LanguageContext';

interface CreateResaleItemProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateResaleItem({ isOpen, onClose, onSuccess }: CreateResaleItemProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('Seoul, Korea');
  const [category, setCategory] = useState('Others');
  const [condition, setCondition] = useState<ItemCondition>('A');
  const [tradeMethod, setTradeMethod] = useState<TradeMethod>('both');
  const [canNegotiate, setCanNegotiate] = useState(false);
  const [description, setDescription] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['Shoes', 'Apparel', 'Accessories', 'Equipment', 'Others'];
  const conditions: { val: ItemCondition; label: string }[] = [
    { val: 'S', label: 'New' },
    { val: 'A', label: 'Like New' },
    { val: 'B', label: 'Good' },
    { val: 'C', label: 'Well-used' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!user || !title || !price || !mediaFile) {
      alert(t('resale.msg_fill_required'));
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      const imageUrl = await plazaService.uploadMedia(mediaFile, (p) => setUploadProgress(Math.round(p)));

      await resaleService.registerItem({
        title,
        description,
        price: parseInt(price),
        location,
        category,
        imageUrl,
        sellerId: user.uid,
        sellerName: user.displayName || 'Anonymous',
        condition,
        tradeMethod,
        canNegotiate,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating resale item:", error);
      alert(t('resale.msg_post_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UniversalCompose
      id="resale"
      isOpen={isOpen}
      onClose={onClose}
      title={t('resale.create_title')}
      label={t('resale.create_label')}
      submitLabel={isSubmitting ? `${t('resale.posting')} ${uploadProgress}%` : t('resale.submit_btn')}
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
            <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest">{t('resale.add_photo')}</span>
          </>
        )}
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      </div>

      {/* Core Info */}
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('resale.what_sharing')}</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('resale.title_placeholder')}
            className="w-full text-[24px] font-black tracking-tighter border-none focus:ring-0 placeholder:text-gray-200 p-0"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('resale.category')}</label>
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
                {t(`resale.cat_${c.toLowerCase()}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('resale.price')}</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/10"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('resale.location')}</label>
            <div className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold flex items-center gap-2">
               <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
               <span className="truncate">{location === 'Seoul, Gangnam-gu' || location === 'Gangnam' || location === 'Seoul, Korea' ? t('resale.seoul_korea') : location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Condition Selector */}
      <div className="space-y-4">
         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('resale.condition')}</label>
         <div className="grid grid-cols-4 gap-2">
            {conditions.map(c => (
              <button
                key={c.val}
                type="button"
                onClick={() => setCondition(c.val)}
                className={`py-3 rounded-2xl text-[12px] font-black transition-all ${
                  condition === c.val ? 'bg-primary text-white scale-105' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
              >
                <div className="text-lg leading-tight uppercase">{c.val}</div>
                <div className="text-[8px] opacity-70 uppercase tracking-tighter">{t(`resale.cond_${c.val.toLowerCase()}`)}</div>
              </button>
            ))}
         </div>
      </div>

      {/* Trade Options */}
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('resale.trade_method')}</label>
          <select 
            value={tradeMethod}
            onChange={(e) => setTradeMethod(e.target.value as TradeMethod)}
            className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/10"
          >
            <option value="direct">{t('resale.trade_direct')}</option>
            <option value="delivery">{t('resale.trade_delivery')}</option>
            <option value="both">{t('resale.trade_both')}</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('resale.price_offer')}</label>
          <button 
            type="button"
            onClick={() => setCanNegotiate(!canNegotiate)}
            className={`w-full py-3.5 rounded-2xl text-xs font-bold transition-all border-2 ${
              canNegotiate ? 'border-primary text-primary bg-primary/5' : 'border-gray-100 text-gray-400 bg-gray-50'
            }`}
          >
            {canNegotiate ? t('resale.negotiation_ok') : t('resale.fixed_price')}
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2 pb-4">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('resale.story')}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('resale.story_placeholder')}
          className="w-full min-h-[120px] bg-gray-50 border-none rounded-[28px] px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-primary/10 resize-none"
        />
      </div>
    </UniversalCompose>
  );
}
