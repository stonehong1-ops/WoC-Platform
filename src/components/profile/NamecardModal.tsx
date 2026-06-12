// 사용자 프로필 정보를 디자인 명세와 100% 일치하는 바텀시트(Bottom Sheet) 형태로 보여주는 Namecard 컴포넌트
'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateCareerDuration } from '@/utils/date';
import { toast } from 'sonner';

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
  allowPhoneCalls?: boolean;
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
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setIsClosing(false);

    const stateKey = `namecard_modal_${Date.now()}`;
    window.history.pushState({ stateKey }, '');

    const handlePopstate = (e: PopStateEvent) => {
      setIsClosing(true);
      setTimeout(() => {
        onClose();
        setIsClosing(false);
      }, 300);
    };

    window.addEventListener('popstate', handlePopstate);

    return () => {
      window.removeEventListener('popstate', handlePopstate);
      if (window.history.state?.stateKey === stateKey) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;
  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300); // transition duration
  };

  const handleCallClick = () => {
    if (user.allowPhoneCalls === false) {
      toast.error(t('myinfo.phone_private_toast'));
      return;
    }
    if (onCall) {
      onCall(user.phone || user.phoneNumber!);
    }
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
            {/* Profile Visual Section - shrink-0 부여로 이미지 찌그러짐 원천 봉쇄, 모바일에서는 h-72으로 확대 */}
            <div className="relative w-full overflow-hidden shrink-0 h-72 sm:h-96">
              {user.photoURL ? (
                <img 
                  alt={`${displayName} Professional Portrait`} 
                  className="w-full h-full object-cover object-center grayscale-[10%] brightness-95" 
                  src={user.photoURL}
                />
              ) : (
                <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-[64px] text-on-surface-variant/30">
                    person
                  </span>
                </div>
              )}
              {/* Gradient overlay for better text readability */}
              <div className="absolute bottom-0 left-0 w-full h-36 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-20 pointer-events-none"></div>

              {/* Name Overlay */}
              <div className="absolute bottom-6 left-6 sm:left-8 z-30 drop-shadow-md">
                <h1 className="text-[28px] font-black text-white tracking-tight flex items-baseline gap-2" style={{ textShadow: '0px 2px 8px rgba(0,0,0,0.8)' }}>
                  {displayName}
                  {subName && <span className="text-[16px] font-bold text-white/90 tracking-wide font-normal" style={{ textShadow: '0px 2px 6px rgba(0,0,0,0.8)' }}>{subName}</span>}
                </h1>
                <div className="flex flex-col gap-0.5 mt-1">
                  <div className="min-h-[14px]">
                    {user.email ? (
                      <p className="text-[12px] text-white/80 font-medium tracking-wide" style={{ textShadow: '0px 1px 4px rgba(0,0,0,0.8)' }}>{user.email}</p>
                    ) : (
                      <p className="text-[12px] text-transparent select-none">placeholder@email.com</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Canvas */}
            <div className="px-6 sm:px-8 pt-6 relative z-10 pb-6 flex flex-col">

              {/* Bio Card */}
              {user.bio && (
                <div className="bg-surface-container-low rounded-xl p-3 mb-4 border border-surface-container-highest/50 shrink-0">
                  <p className="text-[12px] text-on-surface italic leading-relaxed">
                    "{user.bio}"
                  </p>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 mb-4 shrink-0">
                <div className="bg-secondary-container/30 p-[10px] rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-[8px] uppercase tracking-wider font-bold text-on-secondary-container/60 mb-0.5">Role</span>
                  <span className="text-[13px] font-bold text-on-secondary-container">
                    {user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : (user.roles?.[0] || 'Member')}
                  </span>
                </div>
                <div className="bg-primary-container/10 p-[10px] rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-[8px] uppercase tracking-wider font-bold text-primary/60 mb-0.5">Career</span>
                  <span className="text-[13px] font-bold text-primary">
                    {user.career 
                      ? calculateCareerDuration(user.career, t) 
                      : t('my.not_linked')}
                  </span>
                </div>
                <div className="bg-tertiary-fixed/30 p-[10px] rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-[8px] uppercase tracking-wider font-bold text-on-tertiary-fixed-variant/60 mb-0.5">Partner</span>
                  <span className="text-[13px] font-bold text-on-tertiary-fixed-variant">
                    {user.partnerStatus === 'has' 
                      ? t('myinfo.partnership_has') 
                      : user.partnerStatus === 'searching' 
                        ? t('myinfo.partnership_searching') 
                        : t('myinfo.partnership_none')}
                  </span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex justify-around items-center py-3 border-y border-outline-variant/20 mb-4 shrink-0">
                <div 
                  className={`flex flex-col items-center gap-1 group transition-opacity ${user.socialLinks?.facebook ? 'cursor-pointer' : 'opacity-30'}`}
                  onClick={() => user.socialLinks?.facebook && window.open(user.socialLinks.facebook, '_blank')}
                >
                  <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center group-hover:bg-primary/10 transition-colors active:scale-95">
                    <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary transition-colors">face_nod</span>
                  </div>
                  <span className="text-[9px] font-medium text-on-surface-variant">Facebook</span>
                </div>
                <div 
                  className={`flex flex-col items-center gap-1 group transition-opacity ${user.socialLinks?.instagram ? 'cursor-pointer' : 'opacity-30'}`}
                  onClick={() => user.socialLinks?.instagram && window.open(user.socialLinks.instagram, '_blank')}
                >
                  <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center group-hover:bg-primary/10 transition-colors active:scale-95">
                    <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary transition-colors">photo_camera</span>
                  </div>
                  <span className="text-[9px] font-medium text-on-surface-variant">Instagram</span>
                </div>
                <div 
                  className={`flex flex-col items-center gap-1 group transition-opacity ${user.socialLinks?.whatsapp ? 'cursor-pointer' : 'opacity-30'}`}
                  onClick={() => user.socialLinks?.whatsapp && window.open(user.socialLinks.whatsapp, '_blank')}
                >
                  <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center group-hover:bg-primary/10 transition-colors active:scale-95">
                    <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary transition-colors">chat</span>
                  </div>
                  <span className="text-[9px] font-medium text-on-surface-variant">WhatsApp</span>
                </div>
              </div>

              {/* Action Cluster */}
              <div className="flex gap-3 shrink-0 pb-2 pb-safe">
                <button 
                  onClick={() => onChat?.(user.uid)}
                  className="flex-1 h-10 rounded-xl bg-primary text-white text-[14px] font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                  Chat
                </button>
                {/* phone 혹은 phoneNumber가 존재할 때 정상 노출되도록 철저히 가드 */}
                {(user.phone || user.phoneNumber) && onCall && (
                  <button 
                    onClick={handleCallClick}
                    className="w-10 h-10 rounded-xl border-2 border-outline-variant bg-transparent text-on-surface flex items-center justify-center active:bg-surface-container-high active:scale-[0.98] transition-all shrink-0"
                  >
                    <span className="material-symbols-outlined text-[18px]">call</span>
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
