'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Style, TimelineMessage, StyleStatus, STYLE_STATUS, Media } from '../types';
import { useSyncFitLanguage } from '../SyncFitLanguageContext';

interface CollaborationFeedProps {
  activeStyle: Style | null;
  messages: TimelineMessage[];
  mediaList: Media[];
  onSendMessage: (content: string, statusUpdate?: StyleStatus, mediaId?: string) => void;
  onUploadMedia: (file: File, type: Media['type']) => string;
  onUpdateStatus: (status: StyleStatus) => void;
  onBackToList?: () => void;
  onHamburgerClick?: () => void;
  currentUser: { name: string; role: string; lang: string } | null;
}

export default function CollaborationFeed({
  activeStyle,
  messages,
  mediaList,
  onSendMessage,
  onUploadMedia,
  onUpdateStatus,
  onBackToList,
  onHamburgerClick,
  currentUser
}: CollaborationFeedProps) {
  const { tx, language, setLanguage } = useSyncFitLanguage();
  const [inputText, setInputText] = useState('');
  const [activeLangMap, setActiveLangMap] = useState<Record<string, 'KO' | 'CN'>>({});
  const [showOriginalMap, setShowOriginalMap] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const styleMessages = messages
    .filter((m) => m.styleId === activeStyle?.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [styleMessages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeStyle) return;

    let mediaType: Media['type'] = 'image';
    if (file.type.startsWith('video/')) {
      mediaType = 'video';
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      mediaType = 'techpack';
    }

    const generatedId = onUploadMedia(file, mediaType);
    onSendMessage(`[파일 첨부] ${file.name}`, undefined, generatedId);
    
    if (e.target) {
      e.target.value = '';
    }
  };

  if (!activeStyle) {
    return (
      <section className="flex-1 flex flex-col bg-background relative border-r border-outline-variant items-center justify-center text-slate-400 p-8">
        <span className="material-symbols-outlined text-[48px] text-slate-300 mb-3">chat_bubble</span>
        스타일을 선택하여 실시간 협업 피드를 시작하세요.
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col bg-background relative border-r border-outline-variant h-full overflow-hidden">
      {/* GNB 헤더 (디자이너 스크린 100% 준용) */}
      <div className="px-lg py-sm border-b border-outline-variant flex justify-between items-center glass-effect sticky top-0 z-10">
        <div className="flex items-center gap-sm">
          {onBackToList && (
            <button 
              onClick={onBackToList}
              className="p-1 hover:bg-slate-100 rounded-lg md:hidden flex items-center justify-center mr-1"
            >
              <span className="material-symbols-outlined text-[20px] text-primary">arrow_back</span>
            </button>
          )}
          <div>
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">{activeStyle.name}</h2>
            <p className="text-xs text-on-surface-variant flex items-center gap-xs mt-0.5">
              <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
              {activeStyle.id} • 실시간 공급망 동기화 중
            </p>
          </div>
        </div>
        
        <div className="flex gap-sm">
          {/* 번역 간편 전환 버튼 */}
          <button 
            onClick={() => setLanguage(language === 'KO' ? 'CN' : 'KO')}
            className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">language</span>
          </button>
          {onHamburgerClick && (
            <button 
              onClick={onHamburgerClick}
              className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
          )}
        </div>
      </div>

      {/* 실시간 메시지 목록 스크롤 피드 */}
      <div className="flex-1 overflow-y-auto p-lg space-y-lg">
        {styleMessages.length === 0 ? (
          <div className="text-center py-12 text-[12px] text-on-surface-variant font-medium">
            작성된 협업 메시지가 없습니다.
          </div>
        ) : (
          styleMessages.map((msg) => {
            const isMine = currentUser && msg.sender.name === currentUser.name;
            const isSystemLog = msg.logUpdate !== undefined;

            if (isSystemLog) {
              return (
                <div key={msg.id} className="flex justify-center my-2 animate-fade-in">
                  <span className="px-4 py-1.5 bg-secondary-container text-on-secondary-fixed-variant text-[12px] font-bold rounded-full uppercase tracking-widest">
                    시스템: 상태가 '{tx(`syncfit.status.${msg.logUpdate?.nextStatus}`)}'로 변경되었습니다
                  </span>
                </div>
              );
            }

            const userLang = activeLangMap[msg.id] || language;
            const hasTranslation = msg.translations && msg.translations.KR && msg.translations.CN;
            
            let displayContent = msg.content;
            if (hasTranslation) {
              displayContent = userLang === 'KO' ? msg.translations?.KR || msg.content : msg.translations?.CN || msg.content;
            }

            const attachedMedia = msg.mediaId ? mediaList.find(m => m.id === msg.mediaId) : null;

            return (
              <div 
                key={msg.id} 
                className={`flex gap-md items-start max-w-2xl ${
                  isMine ? 'flex-row-reverse ml-auto' : ''
                } animate-fade-in`}
              >
                {/* 아바타 */}
                <img 
                  alt="User avatar" 
                  className="w-8 h-8 rounded-full object-cover border border-outline-variant" 
                  src={
                    msg.sender.role === 'designer'
                      ? "https://lh3.googleusercontent.com/aida-public/AB6AXuAi0lPC1MxVbGAaINCIlD7lRVpq8x7XLkDxcJkb_Aj0TL9QGGfO6BJw0p7PsKWijPPwpzOnaYprCwoblhV_n5mtreg275RhWMQ55owWLmZUYSbgtxH8QIB1ceAGW4xGOyAAQ3q7HKXBSbMMhtlEBniSkv2xw0ht5SMQJoXvuvnGtVty45nnaPEJzOCfUykRUTcsdtgFJZYWpVabEaqLSZBXxvLvG2IQ6YsDTtEdfrzvrIAmrTkQZYtZ28mb3cKyi3XabfeaNlyTKv0"
                      : "https://lh3.googleusercontent.com/aida-public/AB6AXuCQSrU1hc4Uqs5j6KL08vsRtiCdUVmIoPB68my4PNRCI9vDF32uLfLmwItFWI1zMwOwuP-t2Ww1Z9PwpwZwIrxRlSinbIluFffEPgpRWeqFfZEOEJ8SU8kS6Qe8oWdNFTmwBoCzz_PzFCKMfB_QpuP6cnVr9qKcDZ81X1fKm0-5t4NZyudMYyAswkROud0irNzrWtO8rC0rr0eBD8OCL9AWnAs7UuHe06l4xRZbJpn-yXi-TXPFRGZD5lKTRrNov-r_yIe_DB_kseo"
                  }
                />

                {/* 말풍선 본문 (Stitch 0px 편차 마크업) */}
                <div 
                  className={`p-md rounded-bl-xl border shadow-sm ${
                    isMine 
                      ? 'bg-primary text-white border-transparent rounded-l-xl' 
                      : 'bg-white border-outline-variant rounded-r-xl text-on-surface'
                  }`}
                >
                  <div className="flex justify-between gap-xl mb-1 items-center">
                    <span className={`font-label-sm ${isMine ? 'text-white/80' : 'text-primary font-bold'}`}>
                      {msg.sender.name} ({msg.sender.role.toUpperCase()})
                    </span>
                    <span className={`text-[10px] ${isMine ? 'text-white/60' : 'text-on-surface-variant'} uppercase tracking-wider`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <p className="text-body-md mt-1 break-words">{displayContent}</p>

                  {/* 자동 번역 간편 클릭 칩 (마크업 귀속) */}
                  {hasTranslation && (
                    <div className="mt-2.5 pt-2 border-t border-outline-variant/30">
                      <div className="flex gap-1.5 mb-1">
                        <button 
                          onClick={() => setActiveLangMap(prev => ({ ...prev, [msg.id]: 'KO' }))}
                          className={`text-[10px] px-2 py-0.5 rounded transition-all active:scale-95 font-bold ${
                            userLang === 'KO' 
                              ? 'bg-primary-container text-on-primary-container' 
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          한국어
                        </button>
                        <button 
                          onClick={() => setActiveLangMap(prev => ({ ...prev, [msg.id]: 'CN' }))}
                          className={`text-[10px] px-2 py-0.5 rounded transition-all active:scale-95 font-bold ${
                            userLang === 'CN' 
                              ? 'bg-primary-container text-on-primary-container' 
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          중국어
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 인라인 첨부 파일 (Stitch 마크업 귀속) */}
                  {attachedMedia && (
                    <div className="mt-md border-t border-outline-variant pt-md">
                      {attachedMedia.type === 'video' ? (
                        <div className="rounded-lg overflow-hidden border border-outline-variant/30 max-w-[240px]">
                          <video src={attachedMedia.url} controls className="w-full h-auto max-h-[160px] object-cover" />
                        </div>
                      ) : attachedMedia.type === 'techpack' ? (
                        <a
                          href={attachedMedia.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-sm bg-surface-container-lowest p-sm rounded-lg border border-outline-variant hover:opacity-90"
                        >
                          <span className="material-symbols-outlined text-primary">description</span>
                          <span className="text-body-sm font-medium text-primary truncate max-w-[150px]">{attachedMedia.fileName}</span>
                        </a>
                      ) : (
                        <div className="rounded-lg overflow-hidden border border-outline-variant/30 max-w-[200px] shadow-sm">
                          <img src={attachedMedia.url} alt="attached preview" className="w-full h-auto max-h-[160px] object-contain" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 하단 입력바 (Stitch 원본 마크업 100% 준용) */}
      <div className="p-lg bg-white border-t border-outline-variant shrink-0">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*,application/pdf"
          className="hidden"
        />

        {/* 상태 변경 컨트롤과 번역 활성화 라벨 */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative inline-block">
            <select
              value={activeStyle.status}
              onChange={(e) => onUpdateStatus(e.target.value as StyleStatus)}
              className="appearance-none bg-slate-100 border border-slate-200 rounded-full pl-3 pr-8 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer focus:outline-none"
            >
              {Object.entries(STYLE_STATUS).map(([key, value]) => (
                <option key={value} value={value}>
                  {tx(`syncfit.status.${value}`)}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[16px]">expand_more</span>
          </div>

          <div className="flex-1" />
          <span className="text-[10px] text-slate-400 font-semibold">자동 번역 활성화됨</span>
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-md bg-surface-container-low rounded-xl px-md py-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <button 
            type="button"
            onClick={handleFileClick}
            className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined">add_circle</span>
          </button>
          
          <input 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-body-md py-2 outline-none text-on-surface placeholder-on-surface-variant/40" 
            placeholder="Type a message..." 
            type="text"
          />
          
          <button 
            type="submit"
            className="text-primary hover:scale-110 transition-all flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
          </button>
        </form>
      </div>
    </section>
  );
}
