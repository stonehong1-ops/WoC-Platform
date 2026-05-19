// 그룹 App-in-App Shell의 플로팅 필(pill) 네비게이션 (최대 5슬롯)
'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

type TabType = string;

interface NavTab {
  id: TabType;
  key: string;
  icon: string;
}

interface GroupShellNavProps {
  tabs: NavTab[];
  activeTab: TabType;
  onTabClick: (tab: TabType) => void;
  onMoreClick: () => void;
  isMoreOpen: boolean;
}

export default function GroupShellNav({ tabs, activeTab, onTabClick, onMoreClick, isMoreOpen }: GroupShellNavProps) {
  const { t } = useLanguage();

  // 상위 컴포넌트(GroupAppShell)에서 슬라이싱된 탭을 모두 표시
  const visibleTabs = tabs;

  return (
    <div className="shell-nav">
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabClick(tab.id as any)}
        >
          <span className="material-symbols-outlined nav-icon"
            style={activeTab === tab.id ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            {tab.icon}
          </span>
          <div className="nav-label">
            {t(tab.key) || (tab.key.includes('.') ? tab.key.split('.').pop() : tab.key)}
          </div>
        </button>
      ))}

      {/* More 버튼 — 항상 마지막 */}
      <button
        className={`nav-item ${isMoreOpen ? 'active' : ''}`}
        onClick={onMoreClick}
      >
        <span className="material-symbols-outlined nav-icon">
          {isMoreOpen ? 'close' : 'menu'}
        </span>
        <div className="nav-label">더 보기</div>
      </button>
    </div>
  );
}
