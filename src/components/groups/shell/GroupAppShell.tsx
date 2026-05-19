// 그룹 App-in-App Shell 전체 레이아웃 컨테이너 — antigravity.txt 디자인 0픽셀 적용
'use client';

import React, { useState, useMemo } from 'react';
import { Group, Member } from '@/types/group';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePalette } from './usePalette';
import GroupShellHeader from './GroupShellHeader';
import GroupShellNav from './GroupShellNav';
import GroupShellMore from './GroupShellMore';
import GroupShellFooter from './GroupShellFooter';
import { FUNCTION_TAB_MAP, ADMIN_FUNCTION_IDS, FIXED_IDS } from '@/constants/groupTabs';


type TabType = string;

interface GroupAppShellProps {
  group: Group;
  activeTab: TabType;
  onTabClick: (tab: any) => void;
  onExit: () => void;
  isAdmin: boolean;
  isFullMember: boolean;
  members: Member[];
  liveSessionCount: number;
  newPostCount: number;
  paletteColors: string[];
  currentColor: string;
  onColorChange: (color: string) => void;
  children: React.ReactNode;
}

export default function GroupAppShell({
  group,
  activeTab,
  onTabClick,
  onExit,
  isAdmin,
  isFullMember,
  members,
  liveSessionCount,
  newPostCount,
  paletteColors,
  currentColor,
  onColorChange,
  children,
}: GroupAppShellProps) {

  const { t } = useLanguage();
  const paletteVars = usePalette(group.headerThemeColor);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // 탭 목록 계산 — 기존 FUNCTION_TAB_MAP 로직 재사용
  const { navTabs, moreMenuItems, adminMenuItems } = useMemo(() => {
    const rawSelectedFns = group.selectedFunctions || [];
    const selectedFns = [...rawSelectedFns];

    if (selectedFns.includes('class-setting') && !selectedFns.includes('class')) {
      selectedFns.push('class');
    }
    if (selectedFns.includes('class') && !selectedFns.includes('class-setting')) {
      selectedFns.push('class-setting');
    }

    const addedTabIds = new Set<string>();
    const dashboardTab = { id: 'home', key: 'group.tab.dashboard', icon: 'dashboard' };
    addedTabIds.add('home');

    const coreTabs: { id: string; key: string; icon: string }[] = [];
    const menuOrder = group.menuOrder || [];

    if (menuOrder.length > 0) {
      menuOrder.forEach((item: any) => {
        if (item.type === 'divider') return;
        if (FIXED_IDS.has(item.id)) return;
        const mapping = FUNCTION_TAB_MAP[item.id];
        if (mapping && !addedTabIds.has(mapping.id)) {
          addedTabIds.add(mapping.id);
          coreTabs.push({ id: mapping.id, key: mapping.key, icon: mapping.icon });
        }
      });
      selectedFns.forEach((fnId: string) => {
        if (FIXED_IDS.has(fnId)) return;
        const mapping = FUNCTION_TAB_MAP[fnId];
        if (mapping && !addedTabIds.has(mapping.id)) {
          addedTabIds.add(mapping.id);
          coreTabs.push({ id: mapping.id, key: mapping.key, icon: mapping.icon });
        }
      });
    } else if (selectedFns.length > 0) {
      selectedFns.forEach((fnId: string) => {
        if (FIXED_IDS.has(fnId)) return;
        const mapping = FUNCTION_TAB_MAP[fnId];
        if (mapping && !addedTabIds.has(mapping.id)) {
          addedTabIds.add(mapping.id);
          coreTabs.push({ id: mapping.id, key: mapping.key, icon: mapping.icon });
        }
      });
    } else {
      const defaultFns = ['live', 'feed', 'calendar', 'notice', 'members'];
      defaultFns.forEach(fnId => {
        const mapping = FUNCTION_TAB_MAP[fnId];
        if (mapping && !addedTabIds.has(mapping.id)) {
          addedTabIds.add(mapping.id);
          coreTabs.push({ id: mapping.id, key: mapping.key, icon: mapping.icon });
        }
      });
    }

    const aboutTab = { id: 'about', key: 'group.tab.about', icon: 'info' };
    const adminTabs: { id: string; key: string; icon: string }[] = [];
    if (isAdmin) {
      // 기본 Dashboard Settings 추가
      adminTabs.push({ id: 'settings', key: 'group.tab.settings', icon: 'settings' });

      ADMIN_FUNCTION_IDS.forEach(fnId => {
        const isMandatory = fnId === 'brand-setting' || fnId === 'roles-permissions';
        if (isMandatory || selectedFns.includes(fnId) || (fnId === 'class-setting' && selectedFns.includes('class'))) {
          const mapping = FUNCTION_TAB_MAP[fnId];
          if (mapping) {
            adminTabs.push({ id: mapping.id, key: mapping.key, icon: mapping.icon });
          }
        }
      });
    }

    // Nav: Dashboard + coreTabs 상위 4개 = 5슬롯 + 더보기
    const allCoreTabs = [...coreTabs, aboutTab];
    const navVisible = [dashboardTab, ...allCoreTabs.slice(0, 4)];
    const moreItems = allCoreTabs.slice(4);

    return {
      navTabs: navVisible,
      moreMenuItems: moreItems,
      adminMenuItems: adminTabs,
    };
  }, [group.selectedFunctions, group.menuOrder, isAdmin]);

  const handleMoreTabClick = (tab: TabType) => {
    setIsMoreOpen(false);
    onTabClick(tab);
  };

  return (
    <div className="group-app-shell" style={paletteVars as React.CSSProperties}>
      <style jsx global>{`
        /* ===== GROUP APP SHELL — antigravity.txt 1:1 ===== */
        .group-app-shell {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          background: var(--background);
          position: relative;
        }

        /* FIXED HEADER WRAPPER — 뷰포트 기준 고정 */
        .group-app-shell .sticky-header-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          max-width: 1280px;
          margin: 0 auto;
          z-index: 100;
          background: var(--background);
        }

        /* HEADER */
        .group-app-shell .header {
          padding: 16px 36px 12px;
          position: relative;
          z-index: 2;
        }
        .group-app-shell .header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }
        .group-app-shell .group-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .group-app-shell .group-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: white;
          border: 1px solid rgba(255,255,255,0.18);
          overflow: hidden;
          flex-shrink: 0;
        }
        .group-app-shell .group-title {
          color: white;
          font-size: 26px;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 6px;
          letter-spacing: -0.5px;
        }
        .group-app-shell .group-sub {
          color: rgba(255,255,255,0.72);
          font-size: 14px;
          font-weight: 500;
        }

        /* LEAVE — 원본: height:58px, font-size:18px */
        .group-app-shell .leave-wrap { position: relative; }
        .group-app-shell .leave-btn {
          height: 48px;
          padding: 0 18px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(18px);
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }
        .group-app-shell .leave-dropdown {
          position: absolute;
          top: 56px;
          right: 0;
          width: 260px;
          background: white;
          border-radius: 20px;
          padding: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18);
          z-index: 100;
        }
        .group-app-shell .dropdown-section { padding: 10px 6px; }
        .group-app-shell .dropdown-label {
          color: #7c7c84;
          font-size: 13px;
          margin-bottom: 12px;
          font-weight: 600;
        }
        .group-app-shell .club-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 10px;
          border-radius: 14px;
          transition: 0.2s;
          cursor: pointer;
        }
        .group-app-shell .club-item:hover { background: #f5f5f7; }
        .group-app-shell .club-dot {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: white;
          font-weight: 700;
          flex-shrink: 0;
        }
        .group-app-shell .club-name { flex: 1; font-weight: 600; }
        .group-app-shell .divider {
          height: 1px;
          background: #efeff2;
          margin: 10px 0;
        }
        .group-app-shell .leave-club {
          color: #d50000;
          font-weight: 700;
        }

        /* NAV */
        .group-app-shell .shell-nav {
          margin: 0 32px;
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          display: flex;
          padding: 8px;
          gap: 8px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.06);
        }
        .group-app-shell .nav-item {
          flex: 1;
          height: 72px;
          border-radius: 18px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #4a4a55;
          font-weight: 600;
          transition: 0.2s;
          cursor: pointer;
          border: none;
          background: transparent;
          font-family: inherit;
        }
        .group-app-shell .nav-item.active {
          background: var(--palette-soft);
          color: var(--palette-main);
        }
        .group-app-shell .nav-icon { font-size: 22px; }
        .group-app-shell .nav-label { font-size: 12px; font-weight: 600; }

        /* CONTENT */
        .group-app-shell .shell-content {
          padding: 0;
        }

        /* MORE DROPDOWN */
        .group-app-shell .more-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          width: 210px;
          margin-top: 8px;
          background: white;
          border-radius: 20px;
          padding: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.12);
          z-index: 100; /* 드롭다운을 확실히 위로 띄움 */
          max-height: 60vh;
          overflow-y: auto;
        }
        .group-app-shell .menu-title {
          font-size: 13px;
          color: #8a8a92;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .group-app-shell .menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 8px;
          border-radius: 12px;
          transition: 0.2s;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
        }
        .group-app-shell .menu-item:hover { background: #f6f6f8; }
        .group-app-shell .menu-item-active {
          background: var(--palette-soft) !important;
          color: var(--palette-main);
        }
        .group-app-shell .palette-row {
          display: flex;
          gap: 8px;
          margin-top: 10px;
          overflow-x: auto;
          flex-wrap: nowrap;
          padding-bottom: 4px;
          -webkit-overflow-scrolling: touch;
        }
        .group-app-shell .palette-row::-webkit-scrollbar {
          height: 0px; /* 스크롤바 감추기 */
        }
        .group-app-shell .palette-color {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
          cursor: pointer;
          transition: 0.2s;
        }
        .group-app-shell .palette-color:hover { transform: scale(1.15); }
        .group-app-shell .palette-color.active {
          box-shadow:
            0 0 0 3px white,
            0 0 0 5px var(--palette-main);
        }

        /* FOOTER / PRESENCE BAR — 원본: height:74px, border-radius:28px */
        .group-app-shell .presence-bar {
          position: fixed;
          left: 28px;
          right: 28px;
          bottom: 28px;
          height: 74px;
          border-radius: 28px;
          color: white;
          display: flex;
          align-items: center;
          padding: 0 28px;
          gap: 28px;
          font-weight: 600;
          box-shadow: 0 20px 40px rgba(163,0,0,0.25);
          z-index: 50;
        }
        .group-app-shell .presence-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #00ff88;
          flex-shrink: 0;
        }
        .group-app-shell .presence-group {
          display: flex;
          align-items: center;
          gap: 12px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .group-app-shell .avatars { display: flex; align-items: center; }
        .group-app-shell .mini-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: white;
          margin-left: -8px;
          border: 2px solid rgba(255,255,255,0.3);
          overflow: hidden;
          flex-shrink: 0;
        }
        .group-app-shell .mini-avatar:first-child { margin-left: 0; }

        /* RESPONSIVE — 모바일 */
        @media (max-width: 768px) {
          /* 헤더 축소 */
          .group-app-shell .header { padding: 10px 16px 8px; }
          .group-app-shell .group-info { gap: 10px; }
          .group-app-shell .group-icon { width: 36px; height: 36px; font-size: 16px; }
          .group-app-shell .group-title { font-size: 16px; margin-bottom: 2px; letter-spacing: -0.3px; }
          .group-app-shell .group-sub { font-size: 11px; }

          /* Leave 버튼 축소 */
          .group-app-shell .leave-btn {
            height: 34px; padding: 0 12px; border-radius: 12px;
            gap: 6px; font-size: 13px;
          }
          .group-app-shell .leave-dropdown {
            top: 44px; width: calc(100vw - 32px); right: -8px;
            border-radius: 20px; padding: 10px;
          }
          .group-app-shell .dropdown-label { font-size: 11px; margin-bottom: 8px; }
          .group-app-shell .club-item { gap: 8px; padding: 8px 6px; border-radius: 10px; }
          .group-app-shell .club-dot { width: 30px; height: 30px; font-size: 13px; }
          .group-app-shell .club-name { font-size: 13px; }

          /* 네비 축소 */
          .group-app-shell .shell-nav {
            margin: 0 12px; border-radius: 18px;
            padding: 6px; gap: 4px;
          }
          .group-app-shell .nav-item {
            height: 52px; border-radius: 14px; gap: 4px;
          }
          .group-app-shell .nav-icon { font-size: 18px; }
          .group-app-shell .nav-label { font-size: 10px; }

          /* 콘텐츠 여백 축소 - 모바일에서 완전히 상단 여백 제거 */
          .group-app-shell .shell-content { padding: 0; }

          /* More 드롭다운 */
          .group-app-shell .more-dropdown {
            right: 12px; width: 190px; left: auto;
            border-radius: 20px; padding: 12px;
            max-height: 60vh;
          }
          .group-app-shell .menu-title { font-size: 12px; margin-bottom: 6px; }
          .group-app-shell .menu-item { gap: 8px; padding: 8px 6px; border-radius: 10px; font-size: 12px; }
          .group-app-shell .palette-row { gap: 6px; margin-top: 8px; }
          .group-app-shell .palette-color { width: 24px; height: 24px; }

          /* 푸터 축소 */
          .group-app-shell .presence-bar {
            left: 8px; right: 8px; bottom: 8px;
            height: 44px; border-radius: 16px;
            padding: 0 14px; gap: 12px; font-size: 11px;
          }
          .group-app-shell .presence-dot { width: 7px; height: 7px; }
          .group-app-shell .presence-group { gap: 6px; }
          .group-app-shell .mini-avatar { width: 24px; height: 24px; margin-left: -6px; }
        }

        /* 태블릿 */
        @media (min-width: 769px) and (max-width: 1100px) {
          .group-app-shell .group-title { font-size: 22px; }
          .group-app-shell .header { padding: 14px 24px 10px; }
          .group-app-shell .shell-nav { margin: 0 24px; }
          .group-app-shell .nav-item { height: 60px; }
          .group-app-shell .shell-content { padding: 0; }
          .group-app-shell .more-dropdown { right: 24px; width: 210px; left: auto; }
          .group-app-shell .presence-bar {
            left: 16px; right: 16px; bottom: 16px;
            height: 56px; border-radius: 22px;
            padding: 0 20px; gap: 20px; font-size: 13px;
          }
        }
      `}</style>

      {/* Sticky Header + Nav Wrapper */}
      <div className="sticky-header-wrapper">
        {/* Header */}
        <GroupShellHeader group={group} onExit={onExit} />

        {/* Nav + More (relative wrapper for More positioning) */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <GroupShellNav
            tabs={navTabs}
            activeTab={activeTab}
            onTabClick={onTabClick}
            onMoreClick={() => setIsMoreOpen(!isMoreOpen)}
            isMoreOpen={isMoreOpen}
          />
          <GroupShellMore
            isOpen={isMoreOpen}
            onClose={() => setIsMoreOpen(false)}
            menuItems={moreMenuItems}
            adminItems={adminMenuItems}
            isAdmin={isAdmin}
            activeTab={activeTab}
            onMenuClick={handleMoreTabClick}
            paletteColors={paletteColors}
            currentColor={currentColor}
            onColorChange={onColorChange}
          />
        </div>
      </div>

      {/* Content */}
      <div className="shell-content">
        {children}
      </div>

      {/* Footer */}
      <GroupShellFooter
        members={members}
        liveSessionCount={liveSessionCount}
        newPostCount={newPostCount}
      />
    </div>
  );
}
