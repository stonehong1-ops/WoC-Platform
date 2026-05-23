// 사용자 프로필 정보를 디자인 명세와 100% 일치하는 바텀시트(Bottom Sheet) 형태로 보여주는 Namecard 컴포넌트
'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateCareerDuration } from '@/utils/date';

export interface NamecardUser {
  uid: string;
  name: string;
  nativeName?: string;
  email?: string;
  photoURL?: string | null;
  roles?: string[];
  career?: string;
  partnerStatus?: string;
  bio?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
  };
  phone?: string;
  phoneNumber?: string;
  role?: string;
}

interface NamecardModalProps {
  user: NamecardUser;
  isOpen: boolean;
  onClose: () => void;
  onChat?: (userId: string) => void;
  onCall?: (phone: string) => void;
}

export default function NamecardModal({ user, isOpen, onClose, onChat, onCall }: NamecardModalProps) {
  const { t } = useLanguage();
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  if (!mounted) return null;
  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300); // transition duration
  };

  const displayName = user.name || user.nativeName || 'User';
  const subName = user.name ? user.nativeName || '' : '';

  const modalContent = (
    <>
      <style>{`
        .glass-effect {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        .namecard-scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .namecard-scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>

      {/* Backdrop - z-index를 푸터보다 높게 9998로 상향 조정 */}
      <div 
        className={`fixed inset-0 z-[9998] bg-black/60 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />

      {/* Bottom Sheet Container - z-index를 푸터보다 높은 9999로 조치 */}
      <div className="fixed inset-x-0 bottom-0 z-[9999] flex justify-center pointer-events-none sm:p-4">
        <div 
          className={`bg-surface w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl relative flex flex-col pointer-events-auto transform transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isClosing ? 'translate-y-full opacity-90' : 'translate-y-0 opacity-100'} max-h-[75vh] sm:max-h-[85vh] h-auto`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Bottom Sheet Grab Handle */}
          <div 
            className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-12 h-1.5 bg-white/40 rounded-full cursor-pointer hover:bg-white/60 transition-colors"
            onClick={handleClose}
          />

          {/* Top Navigation Bar */}
          <header className="absolute top-0 left-0 w-full z-20 flex justify-end items-center px-lg h-14">
            <button 
              onClick={handleClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-black/10 text-white hover:bg-black/20 transition-colors active:scale-95 mt-2"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </header>

          {/* Scrollable Area */}
          <div className="overflow-y-auto max-h-[75vh] sm:max-h-[85vh] flex flex-col namecard-scrollbar-hide">
            {/* Profile Visual Section - shrink-0 부여로 이미지 찌그러짐 원천 봉쇄, 모바일에서는 h-40으로 축소 */}
            <div className="relative w-full overflow-hidden shrink-0 h-40 sm:h-64">
              {user.photoURL ? (
                <img 
                  alt={`${displayName} Professional Portrait`} 
                  className="w-full h-full object-cover grayscale-[10%] brightness-95" 
                  src={user.photoURL}
                />
              ) : (
                <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-[64px] text-on-surface-variant/30">
                    person
                  </span>
                </div>
              )}
              {/* Role Badges */}
              <div className="absolute right-4 top-16 z-30 flex flex-col gap-2 items-end">
                {user.roles && user.roles.map((role, idx) => {
                  if (idx === 0) {
                    return (
                      <span key={role} className="px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-bold glass-effect">
                        {role}
                      </span>
                    );
                  }
                  return (
                    <span key={role} className="px-3 py-1 rounded-full border border-outline-variant bg-surface-container-low/80 text-on-surface-variant text-[10px] font-bold glass-effect">
                      {role}
                    </span>
                  );
                })}
              </div>
              <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-surface to-transparent"></div>
            </div>

            {/* Content Canvas */}
            <div className="px-6 sm:px-8 -mt-6 relative z-10 pb-6 flex flex-col">
              {/* Hero Info */}
              <div className="flex flex-col gap-1 mb-5 shrink-0">
                <h1 className="text-[26px] font-black text-on-surface tracking-tight">{displayName}</h1>
                <div className="flex flex-col mt-2 gap-1">
                  {subName && <p className="text-[13px] font-bold text-on-surface-variant/80 tracking-wide">{subName}</p>}
                  <div className="min-h-[16px]">
                    {user.email ? (
                      <p className="text-xs text-on-surface-variant/60 mt-0.5">{user.email}</p>
                    ) : (
                      <p className="text-xs text-transparent mt-0.5 select-none">placeholder@email.com</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio Card */}
              {user.bio && (
                <div className="bg-surface-container-low rounded-xl p-4 mb-5 border border-surface-container-highest/50 shrink-0">
                  <p className="font-body-sm text-body-sm text-on-surface italic leading-relaxed">
                    "{user.bio}"
                  </p>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 mb-5 shrink-0">
                <div className="bg-secondary-container/30 p-[14px] rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-on-secondary-container/60 mb-0.5">Role</span>
                  <span className="font-headline-sm text-[15px] font-bold text-on-secondary-container">
                    {user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : (user.roles?.[0] || 'Member')}
                  </span>
                </div>
                <div className="bg-primary-container/10 p-[14px] rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-primary/60 mb-0.5">Career</span>
                  <span className="font-headline-sm text-[15px] font-bold text-primary">
                    {user.career 
                      ? calculateCareerDuration(user.career, t) 
                      : t('my.not_linked')}
                  </span>
                </div>
                <div className="bg-tertiary-fixed/30 p-[14px] rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-on-tertiary-fixed-variant/60 mb-0.5">Partner</span>
                  <span className="font-headline-sm text-[15px] font-bold text-on-tertiary-fixed-variant">
                    {user.partnerStatus === 'has' 
                      ? t('myinfo.partnership_has') 
                      : user.partnerStatus === 'searching' 
                        ? t('myinfo.partnership_searching') 
                        : t('myinfo.partnership_none')}
                  </span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex justify-around items-center py-4 border-y border-outline-variant/20 mb-6 shrink-0">
                <div 
                  className={`flex flex-col items-center gap-1 group transition-opacity ${user.socialLinks?.facebook ? 'cursor-pointer' : 'opacity-30'}`}
                  onClick={() => user.socialLinks?.facebook && window.open(user.socialLinks.facebook, '_blank')}
                >
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center group-hover:bg-primary/10 transition-colors active:scale-95">
                    <span className="material-symbols-outlined text-[20px] text-outline group-hover:text-primary transition-colors">face_nod</span>
                  </div>
                  <span className="text-[10px] font-medium text-on-surface-variant">Facebook</span>
                </div>
                <div 
                  className={`flex flex-col items-center gap-1 group transition-opacity ${user.socialLinks?.instagram ? 'cursor-pointer' : 'opacity-30'}`}
                  onClick={() => user.socialLinks?.instagram && window.open(user.socialLinks.instagram, '_blank')}
                >
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center group-hover:bg-primary/10 transition-colors active:scale-95">
                    <span className="material-symbols-outlined text-[20px] text-outline group-hover:text-primary transition-colors">photo_camera</span>
                  </div>
                  <span className="text-[10px] font-medium text-on-surface-variant">Instagram</span>
                </div>
                <div 
                  className={`flex flex-col items-center gap-1 group transition-opacity ${user.socialLinks?.whatsapp ? 'cursor-pointer' : 'opacity-30'}`}
                  onClick={() => user.socialLinks?.whatsapp && window.open(user.socialLinks.whatsapp, '_blank')}
                >
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center group-hover:bg-primary/10 transition-colors active:scale-95">
                    <span className="material-symbols-outlined text-[20px] text-outline group-hover:text-primary transition-colors">chat</span>
                  </div>
                  <span className="text-[10px] font-medium text-on-surface-variant">WhatsApp</span>
                </div>
              </div>

              {/* Action Cluster */}
              <div className="flex gap-4 shrink-0 pb-4 pb-safe">
                <button 
                  onClick={() => onChat?.(user.uid)}
                  className="flex-1 h-12 rounded-xl bg-primary text-white font-action-text text-action-text flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                  Chat
                </button>
                {/* phone 혹은 phoneNumber가 존재할 때 정상 노출되도록 철저히 가드 */}
                {(user.phone || user.phoneNumber) && onCall && (
                  <button 
                    onClick={() => onCall(user.phone || user.phoneNumber!)}
                    className="w-12 h-12 rounded-xl border-2 border-outline-variant bg-transparent text-on-surface flex items-center justify-center active:bg-surface-container-high active:scale-[0.98] transition-all shrink-0"
                  >
                    <span className="material-symbols-outlined text-[20px]">call</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
