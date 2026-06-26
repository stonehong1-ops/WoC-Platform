'use client';

import React, { useState } from 'react';
import { Style } from '../types';
import { useSyncFitLanguage } from '../SyncFitLanguageContext';

interface StyleListProps {
  styles: Style[];
  activeStyleId: string;
  onSelectStyle: (id: string) => void;
  unreadCounts: Record<string, number>;
  onAddStyleClick: () => void;
}

export default function StyleList({ 
  styles, 
  activeStyleId, 
  onSelectStyle,
  unreadCounts = {},
  onAddStyleClick
}: StyleListProps) {
  const { tx } = useSyncFitLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStyles = styles.filter(style => {
    return style.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           style.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <aside className="w-full h-full flex flex-col border-r border-outline-variant bg-surface-container-lowest shrink-0 z-10">
      {/* Search Bar */}
      <div className="p-md border-b border-outline-variant bg-surface-container-low/50 flex flex-col gap-2">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-body-md text-on-surface placeholder-on-surface-variant/50" 
            placeholder={tx('syncfit.search.placeholder')} 
            type="text"
          />
        </div>
        
        {/* 새 스타일 추가 버튼 (Stitch 원본 양식 귀속) */}
        <button 
          onClick={onAddStyleClick}
          className="w-full py-2 bg-primary text-on-primary rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-primary-container transition-all active:scale-95 shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          {tx('syncfit.button.add_product')}
        </button>
      </div>

      {/* Style List Scroll Area */}
      <div className="flex-1 overflow-y-auto p-sm space-y-sm">
        {filteredStyles.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-on-surface-variant font-medium">
            조건에 맞는 스타일이 없습니다.
          </div>
        ) : (
          filteredStyles.map((style) => {
            const isActive = style.id === activeStyleId;
            const unread = unreadCounts[style.id] || 0;
            
            // 이미지 주소 매핑 (Unsplash 가상 이미지)
            const styleImage = style.id === 'ST-24001'
              ? "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=100"
              : style.id === 'ST-24002'
              ? "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&q=80&w=100"
              : style.id === 'ST-24003'
              ? "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=100"
              : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100";

            return (
              <div 
                key={style.id}
                onClick={() => onSelectStyle(style.id)}
                className={`p-md rounded-xl cursor-pointer shadow-sm transition-all border ${
                  isActive 
                    ? 'bg-secondary-container text-on-secondary-container border-transparent' 
                    : 'bg-white hover:bg-surface-container border border-outline-variant text-on-surface'
                }`}
              >
                <div className="flex gap-md items-center">
                  <img className="w-12 h-12 rounded-lg object-cover" src={styleImage} alt={style.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center gap-1.5">
                      <h3 className="font-label-md font-bold truncate text-[13px]">{style.name}</h3>
                      {unread > 0 && (
                        <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isActive ? 'opacity-85' : 'text-on-surface-variant'}`}>
                      {style.id} • {tx(`syncfit.status.${style.status}`)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
