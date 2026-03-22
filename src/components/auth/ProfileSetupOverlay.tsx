'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, MapPin, Phone, Globe, ChevronRight } from 'lucide-react';

export default function ProfileSetupOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    nickname_en: '',
    nickname_ko: '',
    main_region: '서울',
    phone: ''
  });

  useEffect(() => {
    setMounted(true);
    const savedProfile = localStorage.getItem('woc_user_profile');
    if (!savedProfile) {
      setIsOpen(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nickname_en || !formData.nickname_ko) {
      alert('닉네임을 입력해주세요.');
      return;
    }
    localStorage.setItem('woc_user_profile', JSON.stringify({
      ...formData,
      setupAt: new Date().toISOString()
    }));
    setIsOpen(false);
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in transition-opacity" />
      
      {/* Modal Content */}
      <div className="relative bg-background w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[85vh] sm:rounded-3xl border-t sm:border border-glass-border shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="px-8 py-8 text-center space-y-2">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">반가워요!</h2>
          <p className="text-muted-foreground text-sm">
            WoC 플랫폼 시작을 위해<br />기본 프로필을 설정해주세요.
          </p>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-hide">
          <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Nickname EN */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 ml-1">
                <Globe size={14} /> 영문 닉네임 (Unique ID)
              </label>
              <input 
                required
                type="text" 
                placeholder="예: stone_tangogo"
                value={formData.nickname_en}
                onChange={(e) => setFormData({...formData, nickname_en: e.target.value.toLowerCase()})}
                className="w-full bg-glass border border-glass-border rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
              />
            </div>

            {/* Nickname KO */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 ml-1">
                <User size={14} /> 한글 닉네임
              </label>
              <input 
                required
                type="text" 
                placeholder="예: 스톤홍"
                value={formData.nickname_ko}
                onChange={(e) => setFormData({...formData, nickname_ko: e.target.value})}
                className="w-full bg-glass border border-glass-border rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Region */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 ml-1">
                <MapPin size={14} /> 주 활동 지역
              </label>
              <select 
                value={formData.main_region}
                onChange={(e) => setFormData({...formData, main_region: e.target.value})}
                className="w-full bg-glass border border-glass-border rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
              >
                {['서울', '경기/인천', '부산/경남', '대구/경북', '광주/전라', '대전/충청', '강원', '제주'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 ml-1">
                <Phone size={14} /> 전화번호
              </label>
              <input 
                type="tel" 
                placeholder="예: 010-1234-5678"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-glass border border-glass-border rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
              />
            </div>
          </form>
        </div>

        {/* Action Button */}
        <div className="p-8 pt-4 bg-background/50 backdrop-blur-sm sticky bottom-0">
          <button 
            type="submit"
            form="profile-form"
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-primary/25"
          >
            시작하기 <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
