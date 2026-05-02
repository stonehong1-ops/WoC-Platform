'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { chatService } from '@/lib/firebase/chatService';
import { shopService } from '@/lib/firebase/shopService';
import { groupService } from '@/lib/firebase/groupService';
import { Product, CustomOptionDef } from '@/types/shop';
import PurchaseFlow from './PurchaseFlow';
import ChatRoom from '@/components/chat/ChatRoom';

interface ProductDetailProps {
  product: Product;
  isLiked: boolean;
  onClose: () => void;
  onToggleLike: (e: React.MouseEvent, product: Product) => void;
  onChat?: (product: Product) => void;
}

export default function ProductDetail({ product, isLiked, onClose, onToggleLike, onChat }: ProductDetailProps) {
  const { user } = useAuth();
  const router = useRouter();

  // Image carousel
  const [currentImg, setCurrentImg] = useState(0);
  const touchStartX = useRef(0);
  const images = (product.images?.length ? product.images : (product.imageUrl ? [product.imageUrl] : []));

  // Options state
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({});

  // UI state
  const [isScrolled, setIsScrolled] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showOptionInfo, setShowOptionInfo] = useState(false);
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('pickup');
  const [showPurchase, setShowPurchase] = useState(false);
  const [bankDetails, setBankDetails] = useState<{bankName:string;accountHolder:string;accountNumber:string} | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // New States
  const [showImageModal, setShowImageModal] = useState(false);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);

  // Scarcity: stable random viewer count per session
  const [viewerCount] = useState(() => Math.floor(Math.random() * 18) + 5);

  // Increment views on mount
  useEffect(() => {
    shopService.incrementViews(product.id);
  }, [product.id]);

  // Fetch bank details from group
  useEffect(() => {
    if (!product.groupId) return;
    groupService.getGroup(product.groupId).then(g => {
      if (g?.bankDetails) setBankDetails(g.bankDetails);
    }).catch(() => {});
  }, [product.groupId]);

  // Scroll listener for header
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => setIsScrolled(el.scrollTop > 60);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  // Touch handlers for carousel
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentImg < images.length - 1) setCurrentImg(p => p + 1);
      if (diff < 0 && currentImg > 0) setCurrentImg(p => p - 1);
    }
  };

  // Default custom options for shoe categories
  const effectiveCustomOptions = useMemo((): CustomOptionDef[] => {
    if (product.customOptions && product.customOptions.length > 0) return product.customOptions;
    const cat = (product.category || '').toLowerCase();
    if (cat.includes('m_shoes') || cat === 'man shoes') {
      return [
        { key: 'width', label: 'Width', type: 'enum', values: ['REGULAR','WIDE'], labels: ['Regular','Wide'] },
        { key: 'heel_height', label: 'Heel Height', type: 'enum', values: ['2.5cm','3cm','3.5cm','4cm'], labels: ['2.5cm','3cm','3.5cm','4cm'] },
        { key: 'outsole', label: 'Outsole', type: 'enum', values: ['LEATHER','RUBBER','SUEDE'], labels: ['Leather','Rubber','Suede'] },
      ];
    }
    if (cat.includes('shoes') || cat.includes('w_shoes') || cat === 'woman shoes') {
      return [
        { key: 'width', label: 'Width', type: 'enum', values: ['REGULAR','WIDE','EXTRA_WIDE'], labels: ['Regular','Wide','Extra Wide'] },
        { key: 'heel_height', label: 'Heel Height', type: 'enum', values: ['5cm','6cm','7cm','8cm','9cm'], labels: ['5cm','6cm','7cm','8cm','9cm'] },
        { key: 'outsole', label: 'Outsole', type: 'enum', values: ['STANDARD','SUEDE'], labels: ['Standard','Suede'] },
      ];
    }
    return [];
  }, [product.customOptions, product.category]);

  // Extra price from custom options
  const extraPrice = useMemo(() => {
    let extra = 0;
    effectiveCustomOptions.forEach(opt => {
      const val = selectedOptions[opt.key];
      if (val == null || !opt.extraPrice || !opt.values) return;
      if (opt.type === 'enum') {
        const idx = opt.values.indexOf(val);
        if (idx >= 0 && opt.extraPrice[idx]) extra += opt.extraPrice[idx];
      } else if (opt.type === 'multi_enum' && Array.isArray(val)) {
        val.forEach((v: string) => {
          const idx = opt.values!.indexOf(v);
          if (idx >= 0 && opt.extraPrice![idx]) extra += opt.extraPrice![idx];
        });
      }
    });
    return extra;
  }, [selectedOptions, effectiveCustomOptions]);

  const basePrice = product.discountPrice || product.price;
  const finalPrice = basePrice + extraPrice;
  const discountPercent = product.discountPrice ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const hasCustomOptions = effectiveCustomOptions.length > 0;

  // Handle option change
  const handleOptionChange = (key: string, value: any) => {
    setSelectedOptions(prev => ({ ...prev, [key]: value }));
  };
  const handleMultiToggle = (key: string, value: string) => {
    setSelectedOptions(prev => {
      const arr: string[] = prev[key] || [];
      return { ...prev, [key]: arr.includes(value) ? arr.filter((v: string) => v !== value) : [...arr, value] };
    });
  };

  // Chat with Seller
  const handleChatWithSeller = async () => {
    if (!user) return alert('Please login first');
    const sellerId = product.sellerId || 'adminstone';
    if (user.uid === sellerId) return alert('You cannot chat with yourself');

    const confirmed = window.confirm('이제 판매자와 대화방이 열리고 이 상품에 대한 문의가 진행됩니다. 계속하시겠습니까?');
    if (!confirmed) return;

    try {
      // 1. Mark as pending in wishlist
      await shopService.setProductPendingStatus(user.uid, product.id);

      // 2. Get or create Business room
      const roomId = await chatService.getOrCreatePrivateRoom([user.uid, sellerId], user.uid, 'business');

      // 3. Send initial product info message
      const productInfo = `[상품 문의]\n상품명: ${product.title || product.name}\n가격: ₩${finalPrice.toLocaleString()}\n브랜드: ${product.brand}\n바로가기: ${window.location.origin}/shop?productId=${product.id}`;
      
      await chatService.sendMessage({
        roomId,
        senderId: user.uid,
        senderName: user.displayName || 'User',
        senderPhoto: user.photoURL || undefined,
        text: productInfo,
        type: 'text'
      });

      // 4. Open full popup chat
      setChatRoomId(roomId);
    } catch (err) {
      console.error("Failed to start chat:", err);
      alert('Failed to start chat. Please try again.');
    }
  };

  // Purchase action
  const handlePurchase = () => {
    if (!user) return alert('Please login first');
    if (product.options?.length > 0 && !selectedSize) return alert('Please select a size');
    setShowPurchase(true);
  };

  // Render a custom option
  const renderCustomOption = (opt: CustomOptionDef) => {
    const val = selectedOptions[opt.key];
    switch (opt.type) {
      case 'enum':
        return (
          <div key={opt.key} className="mb-4">
            <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2">{opt.label} {opt.required && <span className="text-red-400">*</span>}</p>
            <div className="flex flex-wrap gap-2">
              {(opt.values || []).map((v, i) => {
                const label = opt.labels?.[i] || v;
                const extra = opt.extraPrice?.[i] || 0;
                const isSelected = val === v;
                return (
                  <button key={v} onClick={() => handleOptionChange(opt.key, v)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${isSelected ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-[#2d3435] border-[#e0e4e5] hover:border-[#acb3b4]'}`}>
                    {label}{extra > 0 && <span className="ml-1 text-[10px] opacity-70">+₩{extra.toLocaleString()}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 'number':
        return (
          <div key={opt.key} className="mb-4">
            <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2">{opt.label} {opt.unit && `(${opt.unit})`}</p>
            <div className="flex items-center gap-3">
              <button onClick={() => handleOptionChange(opt.key, Math.max(opt.min || 0, (val || opt.min || 0) - (opt.step || 1)))}
                className="w-9 h-9 rounded-full bg-[#f2f4f4] flex items-center justify-center text-[#596061] active:scale-90">
                <span className="material-symbols-rounded text-lg">remove</span>
              </button>
              <span className="text-base font-black text-[#2d3435] min-w-[50px] text-center">{val ?? opt.min ?? 0}{opt.unit}</span>
              <button onClick={() => handleOptionChange(opt.key, Math.min(opt.max || 99, (val || opt.min || 0) + (opt.step || 1)))}
                className="w-9 h-9 rounded-full bg-[#f2f4f4] flex items-center justify-center text-[#596061] active:scale-90">
                <span className="material-symbols-rounded text-lg">add</span>
              </button>
            </div>
          </div>
        );
      case 'boolean':
        return (
          <div key={opt.key} className="mb-4 flex items-center justify-between">
            <p className="text-xs font-bold text-[#2d3435]">{opt.label}</p>
            <button onClick={() => handleOptionChange(opt.key, !val)}
              className={`w-11 h-6 rounded-full relative transition-colors ${val ? 'bg-primary' : 'bg-[#e0e4e5]'}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${val ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
            </button>
          </div>
        );
      case 'multi_enum':
        return (
          <div key={opt.key} className="mb-4">
            <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2">{opt.label}</p>
            <div className="flex flex-wrap gap-2">
              {(opt.values || []).map((v, i) => {
                const label = opt.labels?.[i] || v;
                const extra = opt.extraPrice?.[i] || 0;
                const checked = (val || []).includes(v);
                return (
                  <button key={v} onClick={() => handleMultiToggle(opt.key, v)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 active:scale-95 ${checked ? 'bg-primary/10 text-primary border-primary/30' : 'bg-white text-[#2d3435] border-[#e0e4e5]'}`}>
                    <span className="material-symbols-rounded text-sm" style={{ fontVariationSettings: checked ? "'FILL' 1" : "'FILL' 0" }}>check_circle</span>
                    {label}{extra > 0 && <span className="text-[10px] opacity-70">+₩{extra.toLocaleString()}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <style dangerouslySetInnerHTML={{ __html: `
        .detail-scrollbar::-webkit-scrollbar { display: none; }
        .detail-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* ━━━ Header ━━━ */}
      <div className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-gradient-to-b from-black/30 to-transparent'}`}>
        <button onClick={onClose} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'bg-slate-100 text-[#2d3435]' : 'bg-black/20 backdrop-blur-sm text-white'}`}>
          <span className="material-symbols-rounded text-xl">arrow_back</span>
        </button>
        <div className={`text-base font-bold truncate max-w-[180px] transition-opacity ${isScrolled ? 'opacity-100 text-[#2d3435]' : 'opacity-0'}`}>{product.title || product.name}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: product.title || product.name,
                url: window.location.href,
              }).catch(console.error);
            } else {
              alert('Share not supported on this browser');
            }
          }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'bg-slate-100' : 'bg-black/20 backdrop-blur-sm'} ${isScrolled ? 'text-[#2d3435]' : 'text-white'}`}>
            <span className="material-symbols-rounded text-xl">share</span>
          </button>
        </div>
      </div>

      {/* ━━━ Scrollable Content ━━━ */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto detail-scrollbar pb-[80px]">

        {/* 1) Image Carousel */}
        <div className="relative aspect-square overflow-hidden bg-[#f2f4f4]">
          {/* Fallback */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#c4cacc]">
            <span className="material-symbols-rounded text-5xl mb-1">local_mall</span>
            <span className="text-[10px] font-bold tracking-wider uppercase">No Image</span>
          </div>
          {/* Images */}
          {images.length > 0 && (
            <div className="relative h-full" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onClick={() => setShowImageModal(true)}>
              <div className="flex h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${currentImg * 100}%)` }}>
                {images.map((img, i) => (
                  <div key={i} className="w-full flex-shrink-0 h-full">
                    <img src={img} alt={`${product.title} ${i + 1}`} className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                ))}
              </div>
              {/* Left/Right Arrows */}
              {images.length > 1 && currentImg > 0 && (
                <button onClick={(e) => { e.stopPropagation(); setCurrentImg(p => p - 1); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 z-10">
                  <span className="material-symbols-rounded text-lg">chevron_left</span>
                </button>
              )}
              {images.length > 1 && currentImg < images.length - 1 && (
                <button onClick={(e) => { e.stopPropagation(); setCurrentImg(p => p + 1); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 z-10">
                  <span className="material-symbols-rounded text-lg">chevron_right</span>
                </button>
              )}
              {/* Overlay bottom left: Counter + Dots */}
              <div className="absolute bottom-4 left-4 flex flex-col items-start z-10" onClick={(e) => e.stopPropagation()}>
                {images.length > 1 && (
                  <>
                    <span className="bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">{currentImg + 1}/{images.length}</span>
                    <div className="flex gap-1.5 items-center pl-1">
                      {images.map((_, i) => (
                        <button key={i} onClick={(e) => { e.stopPropagation(); setCurrentImg(i); }}
                          className={`rounded-full transition-all ${i === currentImg ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Stats - Floating on the bottom right */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20" onClick={(e) => e.stopPropagation()}>
                <button onClick={(e) => { e.stopPropagation(); onToggleLike(e, product); }} className="px-3 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center gap-1.5 text-white transition-transform active:scale-95">
                  <span className="material-symbols-rounded text-[18px]" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0", color: isLiked ? '#ef4444' : 'white' }}>favorite</span>
                  <span className="text-[11px] font-bold">{product.likesCount || 0}</span>
                </button>
                <button onClick={(e) => e.stopPropagation()} className="px-3 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center gap-1.5 text-white transition-transform active:scale-95">
                  <span className="material-symbols-rounded text-[18px]">chat_bubble</span>
                  <span className="text-[11px] font-bold">0</span>
                </button>
              </div>
            </div>
          )}
          {/* Sale badge */}
          {discountPercent > 0 && (
            <span className="absolute top-16 left-4 z-20 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full">-{discountPercent}%</span>
          )}
        </div>

        {/* 2) Title & Stats */}
        <div className="px-4 pt-5 pb-4 flex justify-between items-start border-b border-[#f2f4f4]">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-[10px] font-black text-[#acb3b4] uppercase tracking-widest leading-none mb-1.5">{product.brand}</p>
            <h1 className="text-xl font-black text-[#2d3435] leading-tight font-headline">{product.title || product.name}</h1>
          </div>
        </div>

        {/* 2) Scarcity Bar — 제일 위로 */}
        <div className="flex items-center gap-4 px-4 py-3 bg-[#fff8f0] border-b border-[#ffe8cc]">
          {product.stock <= 5 && product.stock > 0 && (
            <div className="flex items-center gap-1 text-[#e67700]">
              <span className="material-symbols-rounded text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              <span className="text-xs font-bold">Only {product.stock} left</span>
            </div>
          )}
          {product.stock > 5 && (
            <div className="flex items-center gap-1 text-[#596061]">
              <span className="material-symbols-rounded text-sm">inventory_2</span>
              <span className="text-xs font-medium">In Stock</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-[#e67700]">
            <span className="material-symbols-rounded text-sm">visibility</span>
            <span className="text-xs font-bold">{viewerCount} viewing now</span>
          </div>
        </div>

        {/* 3) Size & Custom Options — boxed */}
        <div className="mx-4 my-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
          <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
            <span className="material-symbols-rounded text-sm text-primary">tune</span>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Fit & Options</p>
            {hasCustomOptions && (
              <button onClick={() => setShowOptionInfo(true)} className="ml-auto w-6 h-6 rounded-full flex items-center justify-center hover:bg-[#e8eaec] transition-colors active:scale-90">
                <span className="material-symbols-rounded text-sm text-[#596061]">info</span>
              </button>
            )}
          </div>
          <div className="px-4 py-4">
            {/* Size selection */}
            {product.options && product.options.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2">
                  Size <span className="text-red-400">*</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.options.map(size => (
                    <button key={size} onClick={() => setSelectedSize(size)}
                      className={`min-w-[48px] px-3 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${selectedSize === size ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-[#2d3435] border-[#e0e4e5] hover:border-[#acb3b4]'}`}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Options (dynamic) */}
            {hasCustomOptions ? (
              <div>
                {effectiveCustomOptions.map(opt => renderCustomOption(opt))}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-[#f8f9fa] rounded-xl">
                <span className="material-symbols-rounded text-lg text-[#acb3b4]">info</span>
                <div>
                  <p className="text-xs font-semibold text-[#596061]">No customization available for this product</p>
                  <p className="text-[10px] text-[#acb3b4] mt-0.5">Contact seller for special requests</p>
                </div>
              </div>
            )}

            {/* Size Guide */}
            <div className="mt-3 pt-3 border-t border-[#f2f4f4]">
              <button onClick={() => setShowSizeGuide(!showSizeGuide)} className="flex items-center gap-1 text-xs font-bold text-primary">
                <span className="material-symbols-rounded text-sm">straighten</span>Size Guide
                <span className="material-symbols-rounded text-sm">{showSizeGuide ? 'expand_less' : 'expand_more'}</span>
              </button>
              {showSizeGuide && (
                <div className="mt-2 p-3 bg-[#f2f4f4] rounded-xl text-xs text-[#596061]">
                  {product.sizeGuide || 'Contact the seller for detailed size information.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Option Info Popup */}
        {showOptionInfo && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center px-6" onClick={() => setShowOptionInfo(false)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-hidden" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-primary text-lg">tune</span>
                  <h3 className="text-sm font-black text-[#2d3435]">Option Details</h3>
                </div>
                <button onClick={() => setShowOptionInfo(false)} className="w-8 h-8 rounded-full bg-[#f2f4f4] flex items-center justify-center active:scale-90 transition-transform">
                  <span className="material-symbols-rounded text-sm text-[#596061]">close</span>
                </button>
              </div>

              {/* Content */}
              <div className="px-5 pb-5 max-h-[60vh] overflow-y-auto space-y-3">
                {/* Size info */}
                {product.options && product.options.length > 0 && (
                  <div className="p-3.5 bg-[#f8f9fa] rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-rounded text-xs text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>straighten</span>
                      <p className="text-[10px] font-black text-[#2d3435] uppercase tracking-widest">Size</p>
                    </div>
                    <p className="text-xs text-[#596061] leading-relaxed">Available sizes for this product.</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {product.options.map(s => (
                        <span key={s} className="text-[10px] font-bold bg-white border border-[#e0e4e5] text-[#2d3435] px-2.5 py-1 rounded-lg">{s}</span>
                      ))}
                    </div>
                    {product.sizeGuide && (
                      <p className="text-[10px] text-[#acb3b4] mt-2 italic">💡 {product.sizeGuide}</p>
                    )}
                  </div>
                )}

                {/* Custom option details */}
                {effectiveCustomOptions.map(opt => (
                  <div key={opt.key} className="p-3.5 bg-[#f8f9fa] rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-rounded text-xs text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {opt.key === 'width' ? 'width' : opt.key.includes('heel') ? 'height' : opt.key === 'outsole' ? 'layers' : 'settings'}
                      </span>
                      <p className="text-[10px] font-black text-[#2d3435] uppercase tracking-widest">{opt.label}</p>
                      {opt.required && <span className="text-[9px] bg-red-50 text-red-500 font-black px-1.5 py-0.5 rounded-full">Required</span>}
                    </div>
                    <p className="text-xs text-[#596061] leading-relaxed">
                      {opt.key === 'width' && 'Choose the width that fits your foot shape. Wide options provide extra room in the toe box.'}
                      {opt.key.includes('heel') && 'Select your preferred heel height. Higher heels offer a more elegant silhouette for performance.'}
                      {opt.key === 'outsole' && 'The outsole material affects grip and slide. Suede is popular for indoor dance floors.'}
                      {!['width', 'outsole'].includes(opt.key) && !opt.key.includes('heel') && `Configure your ${opt.label.toLowerCase()} preference.`}
                    </p>
                    {(opt.type === 'enum' || opt.type === 'multi_enum') && opt.values && (
                      <div className="mt-2 space-y-1">
                        {opt.values.map((v, i) => {
                          const label = opt.labels?.[i] || v;
                          const extra = opt.extraPrice?.[i] || 0;
                          return (
                            <div key={v} className="flex items-center justify-between text-xs">
                              <span className="text-[#2d3435] font-semibold">{label}</span>
                              {extra > 0 ? (
                                <span className="text-primary font-bold">+₩{extra.toLocaleString()}</span>
                              ) : (
                                <span className="text-[#acb3b4] text-[10px]">Included</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {opt.type === 'number' && (
                      <p className="text-[10px] text-[#acb3b4] mt-1.5">
                        Range: {opt.min ?? 0}{opt.unit} – {opt.max ?? '∞'}{opt.unit} (step: {opt.step ?? 1}{opt.unit})
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


        {/* 5) Price & Coupon */}
        <div className="px-4 py-4 border-b border-[#f2f4f4]">
          <div className="flex items-end gap-2">
            {discountPercent > 0 && <span className="text-xl font-black text-red-500">{discountPercent}%</span>}
            <span className="text-2xl font-black text-[#2d3435] font-headline">₩{basePrice.toLocaleString()}</span>
            {product.discountPrice && (
              <span className="text-sm text-[#acb3b4] line-through mb-0.5">₩{product.price.toLocaleString()}</span>
            )}
          </div>
          {extraPrice > 0 && (
            <p className="text-xs text-primary font-semibold mt-1">+ Options ₩{extraPrice.toLocaleString()} → Total ₩{finalPrice.toLocaleString()}</p>
          )}

          {/* Coupons */}
          {product.coupons && product.coupons.length > 0 && (
            <div className="mt-3 space-y-2">
              {product.coupons.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-[#f0f4ff] border border-[#d8e2ff] rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-rounded text-primary text-lg">confirmation_number</span>
                    <span className="text-xs font-bold text-primary">{c.label}</span>
                  </div>
                  <button className="text-[10px] font-black text-white bg-primary px-3 py-1 rounded-full active:scale-95">Get</button>
                </div>
              ))}
              <p className="text-[10px] text-[#acb3b4]">Available for same brand purchases</p>
            </div>
          )}

          {/* Repurchase Coupon */}
          <div className="mt-3 flex items-center gap-2 p-2.5 bg-[#f0f4ff] border border-[#d8e2ff] rounded-xl">
            <span className="material-symbols-rounded text-primary text-sm">confirmation_number</span>
            {product.repurchaseCouponAmount && product.repurchaseCouponAmount > 0 ? (
              <span className="text-[11px] text-primary font-bold">₩{product.repurchaseCouponAmount.toLocaleString()} repurchase coupon issued · My {'>'} Coupons</span>
            ) : (
              <span className="text-[11px] text-[#acb3b4] font-medium">No purchase coupon</span>
            )}
          </div>

          {/* Payment method note */}
          <div className="mt-2 flex items-center gap-2 p-2.5 bg-[#f8f9fa] rounded-xl">
            <span className="material-symbols-rounded text-sm text-[#596061]">account_balance</span>
            <span className="text-[11px] text-[#596061] font-medium">Payment: Bank Transfer</span>
          </div>
        </div>

        {/* 6) Fulfillment & Delivery */}
        <div className="px-4 py-4 border-b border-[#f2f4f4]">
          {/* Pickup / Delivery radio */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setFulfillment('pickup')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-bold transition-all ${fulfillment === 'pickup' ? 'bg-primary/5 border-primary text-primary' : 'bg-white border-[#e0e4e5] text-[#596061]'}`}>
              <span className="material-symbols-rounded text-base" style={{ fontVariationSettings: fulfillment === 'pickup' ? "'FILL' 1" : "'FILL' 0" }}>radio_button_checked</span>
              <span className="material-symbols-rounded text-base">storefront</span>Store Pickup
            </button>
            <button onClick={() => setFulfillment('delivery')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-bold transition-all ${fulfillment === 'delivery' ? 'bg-primary/5 border-primary text-primary' : 'bg-white border-[#e0e4e5] text-[#596061]'}`}>
              <span className="material-symbols-rounded text-base" style={{ fontVariationSettings: fulfillment === 'delivery' ? "'FILL' 1" : "'FILL' 0" }}>radio_button_checked</span>
              <span className="material-symbols-rounded text-base">local_shipping</span>Delivery
            </button>
          </div>

          <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-3">Production & Delivery</p>
          <div className="space-y-2.5">
            {/* Production period */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#f0f4ff] flex items-center justify-center">
                <span className="material-symbols-rounded text-primary text-sm">construction</span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#2d3435]">Production</p>
                <p className="text-[11px] text-[#596061]">
                  {product.productionDaysMin && product.productionDaysMax
                    ? `${product.productionDaysMin}~${product.productionDaysMax} days`
                    : product.productionDays
                      ? `Approx. ${product.productionDays} days`
                      : '7~14 days (estimated)'}
                </p>
              </div>
            </div>

            {/* Fulfillment detail based on radio */}
            {fulfillment === 'pickup' ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#edf7ed] flex items-center justify-center">
                  <span className="material-symbols-rounded text-green-600 text-sm">storefront</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#2d3435]">Store Pickup</p>
                  <p className="text-[11px] text-[#596061]">Available after production · No shipping fee</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f0f4ff] flex items-center justify-center">
                  <span className="material-symbols-rounded text-primary text-sm">local_shipping</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#2d3435]">Delivery</p>
                  <p className="text-[11px] text-[#596061]">
                    {product.deliveryDays ? `${product.deliveryDays} days after production` : '2~5 days after production'}
                    {product.sellerPaysShipping
                      ? ' · Shipping paid by seller'
                      : product.shippingFee
                        ? ` · Shipping ₩${product.shippingFee.toLocaleString()}`
                        : ' · Free Shipping'}
                  </p>
                </div>
              </div>
            )}

            {/* Free exchange */}
            {(product.freeExchangeCount ?? 0) > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#fff3f0] flex items-center justify-center">
                  <span className="material-symbols-rounded text-[#e67700] text-sm">swap_horiz</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#2d3435]">Free Exchange ({product.freeExchangeCount}x)</p>
                  <p className="text-[11px] text-[#596061]">Exchange if it doesn&apos;t fit</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 7) Description */}
        <div className="px-4 py-4 border-b border-[#f2f4f4]">
          <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2">Description</p>
          <p className={`text-sm text-[#596061] leading-relaxed whitespace-pre-line ${!showFullDesc ? 'line-clamp-4' : ''}`}>
            {product.description || 'No description available.'}
          </p>
          {product.description && product.description.length > 120 && (
            <button onClick={() => setShowFullDesc(!showFullDesc)} className="text-xs font-bold text-primary mt-2 flex items-center gap-0.5">
              {showFullDesc ? 'Less' : 'More'}
              <span className="material-symbols-rounded text-sm">{showFullDesc ? 'expand_less' : 'expand_more'}</span>
            </button>
          )}
        </div>

        <div className="px-4 py-4">
          <button
            onClick={handleChatWithSeller}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#f2f4f4] hover:bg-[#e8eaec] rounded-2xl transition-colors active:scale-[0.98]"
          >
            <span className="material-symbols-rounded text-lg text-[#596061]">chat</span>
            <span className="text-sm font-bold text-[#2d3435]">Chat with Seller</span>
          </button>
          <p className="text-[10px] text-[#acb3b4] text-center mt-1.5">{product.brand} · Product info will be sent automatically</p>
        </div>
      </div>

      {/* ━━━ Fixed Bottom Bar (compact) ━━━ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 px-4 py-2.5 flex items-center gap-3 max-w-md mx-auto">
        <div className="flex-1 min-w-0">
          <p className="text-lg font-black text-[#2d3435] font-headline leading-tight">₩{finalPrice.toLocaleString()}</p>
          {(discountPercent > 0 || extraPrice > 0) && (
            <p className="text-[10px] text-[#acb3b4] truncate">
              {discountPercent > 0 && `List ₩${product.price.toLocaleString()}`}
              {extraPrice > 0 && ` · Options +₩${extraPrice.toLocaleString()}`}
            </p>
          )}
        </div>
        <button onClick={(e) => onToggleLike(e, product)}
          className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-colors active:scale-90 ${isLiked ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-[#e0e4e5] text-[#596061]'}`}>
          <span className="material-symbols-rounded text-xl" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
        </button>
        <button onClick={handlePurchase}
          className="flex-shrink-0 bg-primary text-white px-7 py-3 rounded-xl font-black text-sm tracking-wide shadow-lg shadow-primary/20 active:scale-95 transition-transform">
          Purchase
        </button>
      </div>

      {/* ━━━ Purchase Flow ━━━ */}
      {showPurchase && (
        <PurchaseFlow
          product={product}
          selectedSize={selectedSize}
          selectedOptions={selectedOptions}
          extraPrice={extraPrice}
          fulfillmentType={fulfillment}
          bankDetails={bankDetails}
          groupId={product.groupId}
          groupName={product.groupName}
          onClose={() => setShowPurchase(false)}
          onComplete={() => { setShowPurchase(false); onClose(); }}
        />
      )}

      {/* ━━━ Full Screen Image Viewer ━━━ */}
      {showImageModal && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-in fade-in duration-200">
          <div className="absolute top-0 left-0 right-0 z-10 flex justify-end p-4">
            <button onClick={() => setShowImageModal(false)} className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center">
              <span className="material-symbols-rounded text-2xl">close</span>
            </button>
          </div>
          <div className="flex-1 w-full h-full flex items-center justify-center" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div className="flex w-full transition-transform duration-300 ease-out h-full items-center" style={{ transform: `translateX(-${currentImg * 100}%)` }}>
              {images.map((img, i) => (
                <div key={i} className="w-full flex-shrink-0 flex items-center justify-center px-4">
                  <img src={img} alt={`Fullscreen ${i + 1}`} className="w-full max-h-[80vh] object-contain" />
                </div>
              ))}
            </div>
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2">
              {images.map((_, i) => (
                <div key={i} className={`rounded-full transition-all ${i === currentImg ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40'}`} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ━━━ Full Screen Chat Room ━━━ */}
      {chatRoomId && (
        <div className="fixed inset-0 z-[200] bg-white animate-in slide-in-from-bottom duration-300">
          <ChatRoom
            roomId={chatRoomId}
            onBack={() => setChatRoomId(null)}
          />
        </div>
      )}
    </div>
  );
}
