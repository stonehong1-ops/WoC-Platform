"use client";

import React, { useState } from 'react';

type ModalType = 'about' | 'archive' | 'editorial' | 'contact' | null;

export default function LandingFooter() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const modalContent = {
    about: {
      title: "ABOUT",
      subtitle: "Redefining how we connect.",
      descEn: "World of Community is a global collective of passionate minds, building the future of shared culture and micro-economies.",
      descKo: "(우리가 연결되는 방식을 재정의합니다. WoC는 공유 문화와 미니 경제권의 미래를 구축하는 열정적인 사람들의 글로벌 집합체입니다.)"
    },
    archive: {
      title: "ARCHIVE",
      subtitle: "A curated collection of our journey.",
      descEn: "Explore past events, milestones, and the unforgettable moments that shaped our society.",
      descKo: "(우리 여정의 엄선된 기록. 과거의 이벤트, 이정표, 그리고 우리 소사이어티를 형성한 잊지 못할 순간들을 탐색해 보세요.)"
    },
    editorial: {
      title: "EDITORIAL",
      subtitle: "Voices from the inside.",
      descEn: "Insightful stories, interviews, and unique perspectives straight from the heart of our community.",
      descKo: "(내부의 목소리. 우리 커뮤니티의 중심에서 전해지는 통찰력 있는 이야기, 인터뷰, 그리고 독특한 관점들입니다.)"
    },
    contact: {
      title: "CONTACT",
      subtitle: "Get in touch with us.",
      descEn: "We're always open to new ideas, collaborations, and conversations.",
      descKo: "(우리와 소통하세요. 우리는 항상 새로운 아이디어, 협업, 그리고 대화에 열려 있습니다.)"
    }
  };

  return (
    <>
      {/* Footer */}
      <footer className="py-16 px-6 bg-white text-black border-t border-gray-100">
        <div className="max-w-4xl mx-auto flex flex-col gap-10">
          <div className="space-y-2">
            <p className="text-[11px] font-bold tracking-widest uppercase">WORLD OF COMMUNITY_</p>
            <p className="text-[10px] font-medium tracking-widest uppercase text-gray-400">Digital Archive © 2026. All Rights Reserved.</p>
          </div>
          <nav className="flex flex-col gap-y-6 text-[10px] font-bold tracking-widest uppercase items-start">
            <button onClick={() => setActiveModal('about')} className="hover:text-gray-400 h-10 flex items-center text-left uppercase transition-colors">About</button>
            <button onClick={() => setActiveModal('archive')} className="hover:text-gray-400 h-10 flex items-center text-left uppercase transition-colors">Archive</button>
            <button onClick={() => setActiveModal('editorial')} className="hover:text-gray-400 h-10 flex items-center text-left uppercase transition-colors">Editorial</button>
            <button onClick={() => setActiveModal('contact')} className="hover:text-gray-400 h-10 flex items-center text-left uppercase transition-colors">Contact</button>
          </nav>
        </div>
      </footer>

      {/* Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setActiveModal(null)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-md p-8 md:p-10 rounded-2xl shadow-2xl flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            <div className="text-center mt-2">
              <h3 className="text-sm font-black tracking-widest uppercase text-black mb-6">
                {modalContent[activeModal].title}
              </h3>
              <p className="text-lg md:text-xl serif-text font-bold italic text-black mb-4 leading-tight">
                {modalContent[activeModal].subtitle}
              </p>
              <p className="text-sm text-gray-800 mb-6 font-medium leading-relaxed">
                {modalContent[activeModal].descEn}
              </p>
              <p className="text-[13px] text-gray-500 leading-relaxed font-medium break-keep">
                {modalContent[activeModal].descKo}
              </p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
              <button 
                onClick={() => setActiveModal(null)}
                className="text-[10px] font-bold tracking-widest uppercase text-gray-400 hover:text-black transition-colors px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
