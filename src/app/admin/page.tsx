'use client';

import React from 'react';

export default function AdminPage() {
  return (
    <main className="premium-container" style={{ padding: '4rem 2rem', minHeight: '100vh' }}>
      <header style={{ marginBottom: '3rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>게시글 등록 및 실시간 데이터 관리 (PC 최적화 모드)</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
        {/* Sidebar for PC */}
        <aside className="glass-card" style={{ height: 'fit-content' }}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ padding: '0.8rem 0', borderBottom: '1px solid var(--glass-border)', color: 'var(--accent)', fontWeight: 'bold' }}>새 게시글 등록</li>
            <li style={{ padding: '0.8rem 0', borderBottom: '1px solid var(--glass-border)' }}>사용자 관리</li>
            <li style={{ padding: '0.8rem 0', borderBottom: '1px solid var(--glass-border)' }}>통계 분석</li>
            <li style={{ padding: '0.8rem 0' }}>시스템 설정</li>
          </ul>
        </aside>

        {/* Content Area */}
        <section className="glass-card">
          <h2 style={{ marginBottom: '2rem' }}>상세 정보 입력</h2>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>제목</label>
              <input type="text" placeholder="제목을 입력하세요" style={{ 
                width: '100%', 
                padding: '1rem', 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid var(--glass-border)', 
                borderRadius: '8px',
                color: 'white'
              }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>내용</label>
              <textarea rows={10} placeholder="상세 내용을 입력하세요..." style={{ 
                width: '100%', 
                padding: '1rem', 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid var(--glass-border)', 
                borderRadius: '8px',
                color: 'white',
                resize: 'vertical'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button style={{ 
                padding: '0.8rem 2rem', 
                borderRadius: '8px', 
                border: '1px solid var(--glass-border)', 
                background: 'transparent', 
                color: 'white',
                cursor: 'pointer'
              }}>취소</button>
              <button className="btn-primary" style={{ padding: '0.8rem 2rem' }}>등록하기</button>
            </div>
          </form>
        </section>
      </div>

      <style jsx>{`
        @media (max-width: 1023px) {
          div {
            grid-template-columns: 1fr !important;
          }
          aside {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}
