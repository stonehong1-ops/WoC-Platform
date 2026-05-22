'use client';
// 그룹 페이지 데이터 로딩 중에 표시할 0픽셀 편차 고성능 정적 레이아웃 스켈레톤 컴포넌트

import React from 'react';
import { usePalette } from './usePalette';

export default function GroupShellSkeleton() {
  const paletteVars = usePalette(undefined); // 기본 테마 컬러로 설정 (#1a1c23)

  return (
    <div className="group-app-shell" style={paletteVars as React.CSSProperties}>
      <style jsx global>{`
        /* ===== GROUP APP SHELL SKELETON — 0px 편차 매핑 ===== */
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
          border: 1px solid rgba(255,255,255,0.18);
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

        /* LEAVE 버튼 형태 */
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
          border: none;
          background: transparent;
        }
        .group-app-shell .nav-icon { font-size: 22px; }
        .group-app-shell .nav-label { font-size: 12px; font-weight: 600; }

        /* FOOTER / PRESENCE BAR */
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
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          z-index: 50;
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
          background: rgba(255,255,255,0.2);
          margin-left: -8px;
          border: 2px solid rgba(255,255,255,0.3);
          flex-shrink: 0;
        }
        .group-app-shell .mini-avatar:first-child { margin-left: 0; }

        /* SHIMMER EFFECT */
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.13) 25%,
            rgba(255, 255, 255, 0.28) 37%,
            rgba(255, 255, 255, 0.13) 63%
          );
          background-size: 400% 100%;
          animation: shimmer-pulse 1.4s ease infinite;
        }
        .skeleton-shimmer-dark {
          background: linear-gradient(
            90deg,
            rgba(226, 232, 240, 0.4) 25%,
            rgba(241, 245, 249, 0.7) 37%,
            rgba(226, 232, 240, 0.4) 63%
          );
          background-size: 400% 100%;
          animation: shimmer-pulse 1.4s ease infinite;
        }

        @keyframes shimmer-pulse {
          0% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* RESPONSIVE — 모바일 */
        @media (max-width: 768px) {
          .group-app-shell .header { padding: 10px 16px 8px; }
          .group-app-shell .group-info { gap: 10px; }
          .group-app-shell .group-icon { width: 36px; height: 36px; }
          .group-app-shell .group-title { font-size: 16px; margin-bottom: 2px; letter-spacing: -0.3px; }
          .group-app-shell .group-sub { font-size: 11px; }

          .group-app-shell .leave-btn {
            height: 34px; padding: 0 12px; border-radius: 12px;
            gap: 6px; font-size: 13px;
          }

          .group-app-shell .shell-nav {
            margin: 0 12px; border-radius: 18px;
            padding: 6px; gap: 4px;
          }
          .group-app-shell .nav-item {
            height: 52px; border-radius: 14px; gap: 4px;
          }
          .group-app-shell .nav-icon { font-size: 18px; }
          .group-app-shell .nav-label { font-size: 10px; }

          .group-app-shell .presence-bar {
            left: 8px; right: 8px; bottom: 8px;
            height: 44px; border-radius: 16px;
            padding: 0 14px; gap: 12px; font-size: 11px;
          }
          .group-app-shell .mini-avatar { width: 24px; height: 24px; margin-left: -6px; }
        }

        /* 태블릿 */
        @media (min-width: 769px) and (max-width: 1100px) {
          .group-app-shell .group-title { font-size: 22px; }
          .group-app-shell .header { padding: 14px 24px 10px; }
          .group-app-shell .shell-nav { margin: 0 24px; }
          .group-app-shell .nav-item { height: 60px; }
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
        <div className="header" style={{ background: 'var(--palette-gradient)' }}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', borderRadius: 'inherit' }}>
            <div style={{
              position: 'absolute',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              top: '-220px',
              right: '-100px',
              filter: 'blur(10px)'
            }} />
          </div>

          <div className="header-top">
            {/* 그룹 정보 스켈레톤 */}
            <div className="group-info">
              <div className="group-icon skeleton-shimmer"></div>
              <div>
                <div className="w-32 h-6 md:w-48 md:h-7 skeleton-shimmer rounded-md mb-2"></div>
                <div className="w-20 h-4 skeleton-shimmer rounded-md"></div>
              </div>
            </div>

            {/* Leave/Switch 버튼 스켈레톤 */}
            <div className="leave-wrap">
              <div className="leave-btn skeleton-shimmer" style={{ width: '100px' }}></div>
            </div>
          </div>
        </div>

        {/* Nav 탭 슬롯 6개 모방 스켈레톤 */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="shell-nav">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="nav-item">
                <div className="w-5 h-5 bg-[#e4e4e7] rounded-full animate-pulse mb-1.5"></div>
                <div className="w-10 h-3 bg-[#e4e4e7] rounded-md animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area Skeleton */}
      <main className="pt-[120px] md:pt-[176px] pb-12 px-4 md:px-0 max-w-7xl mx-auto space-y-6 mt-6">
        {/* 1. Moments Tray Skeleton */}
        <div className="w-full bg-white rounded-3xl p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="w-24 h-5 bg-slate-200 rounded-md mb-4 animate-pulse"></div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-slate-200 rounded-full animate-pulse border-2 border-white shadow-sm"></div>
                <div className="w-12 h-3 bg-slate-100 rounded-md animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Feed Post Skeleton */}
        <div className="w-full bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse"></div>
              <div>
                <div className="w-24 h-4 bg-slate-200 rounded-md mb-1.5 animate-pulse"></div>
                <div className="w-16 h-3 bg-slate-100 rounded-md animate-pulse"></div>
              </div>
            </div>
            <div className="w-6 h-6 bg-slate-100 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="w-full h-4 bg-slate-200 rounded-md animate-pulse"></div>
            <div className="w-11/12 h-4 bg-slate-200 rounded-md animate-pulse"></div>
            <div className="w-3/4 h-4 bg-slate-200 rounded-md animate-pulse"></div>
          </div>
          <div className="w-full h-[280px] bg-slate-100 rounded-2xl animate-pulse"></div>
        </div>
      </main>

      {/* Footer / Presence Bar Skeleton */}
      <div className="presence-bar" style={{ background: 'var(--palette-gradient)' }}>
        {/* Section 1: Members */}
        <div className="presence-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0px', paddingRight: '4px', width: '50px' }}>
          <div className="w-10 h-4 skeleton-shimmer rounded-md"></div>
          <div className="w-8 h-2 skeleton-shimmer rounded-md mt-1.5"></div>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />

        {/* Section 2: Active Users */}
        <div className="presence-group">
          <div className="avatars">
            {[1, 2, 3].map((i) => (
              <div key={i} className="mini-avatar skeleton-shimmer"></div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />

        {/* Section 3: Event Ticker */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', paddingLeft: '4px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
          <div className="w-1/2 h-4 skeleton-shimmer rounded-md"></div>
        </div>
      </div>
    </div>
  );
}
