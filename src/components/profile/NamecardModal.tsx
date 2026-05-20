// 사용자 프로필 정보를 디자인 명세와 100% 일치하는 센터 모달로 보여주는 Namecard 컴포넌트
'use client';

import React, { useEffect, useState } from 'react';

export interface NamecardUser {
  uid: string;
  name: string;
  nativeName?: string;
  email?: string;
  photoURL?: string;
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
}

interface NamecardModalProps {
  user: NamecardUser;
  isOpen: boolean;
  onClose: () => void;
  onChat?: (userId: string) => void;
  onCall?: (phone: string) => void;
}

export default function NamecardModal({ user, isOpen, onClose, onChat, onCall }: NamecardModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300); // transition duration
  };

  const displayName = user.nativeName || user.name || 'User';
  const subName = user.nativeName ? user.name : '';

  return (
    <>
      <style>{`
        .glass-effect {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        .modal-constrained {
            max-height: 66.67vh;
        }
        .namecard-scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .namecard-scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>

      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-[300] bg-black/60 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />

      {/* Centered Modal Container */}
      <div className="fixed inset-0 z-[301] flex items-center justify-center p-4 pointer-events-none">
        <div 
          className={`bg-surface w-[90%] max-w-lg rounded-[32px] overflow-hidden shadow-2xl relative modal-constrained flex flex-col pointer-events-auto transform transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Navigation Bar */}
          <header className="absolute top-0 left-0 w-full z-20 flex justify-end items-center px-lg h-14">
            <button 
              onClick={handleClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-black/10 text-white hover:bg-black/20 transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </header>

          {/* Scrollable Area */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col namecard-scrollbar-hide">
            {/* Profile Visual Section */}
            <div className="relative h-44 w-full overflow-hidden shrink-0">
              {user.photoURL ? (
                <img 
                  alt={`${displayName} Professional Portrait`} 
                  className="w-full h-full object-cover grayscale-[20%] brightness-95" 
                  src={user.photoURL}
                />
              ) : (
                <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-[56px] text-on-surface-variant/30">
                    person
                  </span>
                </div>
              )}
              <div className="absolute right-4 top-14 z-30 flex flex-col gap-2 items-end">
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
              <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-surface to-transparent"></div>
            </div>

            {/* Content Canvas */}
            <div className="px-modal-padding -mt-10 relative z-10 pb-lg flex-1 flex flex-col">
              {/* Hero Info */}
              <div className="flex flex-col gap-xs mb-md shrink-0">
                <h1 className="font-display-name text-display-name text-on-surface">{displayName}</h1>
                <div className="flex flex-col -mt-1">
                  {subName && <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">{subName}</p>}
                  {user.email && <p className="font-body-sm text-body-sm text-on-surface-variant">{user.email}</p>}
                </div>
              </div>

              {/* Bio Card */}
              {user.bio && (
                <div className="bg-surface-container-low rounded-xl p-md mb-md border border-surface-container-highest/50 shrink-0">
                  <p className="font-body-sm text-body-sm text-on-surface italic leading-relaxed">
                    "{user.bio}"
                  </p>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-xs mb-md shrink-0">
                <div className="bg-[#d0e1fb]/30 p-sm rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-[#54647a]/60 mb-0.5">Role</span>
                  <span className="font-headline-sm text-[16px] text-[#54647a]">{user.roles?.[0] || 'Member'}</span>
                </div>
                <div className="bg-[#2170e4]/10 p-sm rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-[#0058be]/60 mb-0.5">Career</span>
                  <span className="font-headline-sm text-[16px] text-[#0058be]">{user.career || 'N/A'}</span>
                </div>
                <div className="bg-[#ffdcc6]/30 p-sm rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-[#723600]/60 mb-0.5">Partner</span>
                  <span className="font-headline-sm text-[16px] text-[#723600]">{user.partnerStatus || '-'}</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex justify-around items-center py-md border-y border-outline-variant/30 mb-md shrink-0">
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
              <div className="flex gap-md mt-auto shrink-0">
                <button 
                  onClick={() => onChat?.(user.uid)}
                  className="flex-1 h-12 rounded-xl bg-[#0058be] text-white font-action-text text-action-text flex items-center justify-center gap-2 shadow-lg shadow-[#0058be]/20 active:scale-[0.98] transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                  Chat
                </button>
                {user.phone && onCall && (
                  <button 
                    onClick={() => onCall(user.phone!)}
                    className="w-12 h-12 rounded-xl border-2 border-[#c2c6d6] bg-transparent text-[#191c1e] flex items-center justify-center active:bg-surface-container-high active:scale-[0.98] transition-all"
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
}
