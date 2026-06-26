'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Style, TimelineMessage, StyleStatus, STYLE_STATUS, Media } from '../types';
import { mockVendors, mockFactories } from '../mockData';
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
}

export default function CollaborationFeed({
  activeStyle,
  messages,
  mediaList,
  onSendMessage,
  onUploadMedia,
  onUpdateStatus,
  onBackToList,
  onHamburgerClick
}: CollaborationFeedProps) {
  const { tx, language } = useSyncFitLanguage();
  const [inputText, setInputText] = useState('');
  const [showOriginalMap, setShowOriginalMap] = useState<Record<string, boolean>>({});
  
  // 숨겨진 input 엘리먼트 참조
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter messages for active style and sort oldest on top (latest at bottom)
  const styleMessages = messages
    .filter((m) => m.styleId === activeStyle?.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [styleMessages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleStatusChange = (newStatus: StyleStatus) => {
    if (!activeStyle) return;
    const oldStatusLabel = tx(`syncfit.status.${activeStyle.status}`);
    const newStatusLabel = tx(`syncfit.status.${newStatus}`);
    
    onUpdateStatus(newStatus);
    onSendMessage(
      `[상태 변경] ${oldStatusLabel} ➔ ${newStatusLabel}`,
      newStatus
    );
  };

  const toggleOriginal = (msgId: string) => {
    setShowOriginalMap((prev) => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  // 파일 첨부 핸들러
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
    } else if (file.name.endsWith('.docx') || file.name.endsWith('.xlsx')) {
      mediaType = 'techpack';
    }

    // 파일 로컬 업로드 처리 후 ID 수신
    const generatedId = onUploadMedia(file, mediaType);
    
    // 첨부 완료 메시지 실시간 전송
    onSendMessage(`[파일 첨부] ${file.name}`, undefined, generatedId);
    
    // input 리셋
    if (e.target) {
      e.target.value = '';
    }
  };

  if (!activeStyle) {
    return (
      <div className="w-full md:w-[420px] md:max-w-[420px] flex-shrink-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-8 text-[14px] border-r border-slate-200">
        <span className="material-symbols-rounded text-[48px] text-slate-300 mb-3">
          apparel
        </span>
        스타일을 선택하여 작업을 시작해 주세요.
      </div>
    );
  }

  const activeVendor = mockVendors.find((v) => v.id === activeStyle.vendorId)?.name.split(' ').pop() || activeStyle.vendorId;
  const activeFactory = mockFactories.find((f) => f.id === activeStyle.factoryId)?.name.split(' ').pop() || activeStyle.factoryId;

  return (
    <div className="w-full flex flex-col h-full bg-[#EAEFF5] border-r border-slate-200 flex-shrink-0">
      {/* 1. UX 개선 스타일 상단 고정 헤더 */}
      <div className="bg-white border-b border-slate-200 p-3.5 sticky top-0 z-10 shadow-sm flex-shrink-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* 모바일용 뒤로가기 버튼 */}
              {onBackToList && (
                <button
                  onClick={onBackToList}
                  className="flex items-center justify-center p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <span className="material-symbols-outlined text-[20px] font-black">arrow_back</span>
                </button>
              )}
              <span className="text-[15px] font-black text-slate-900 tracking-tight">
                {activeStyle.id}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider bg-blue-50 text-blue-600 border border-blue-100`}
              >
                {tx(`syncfit.status.${activeStyle.status}`)}
              </span>
            </div>

            {/* 모바일 삼선 햄버거 메뉴 버튼 */}
            {onHamburgerClick && (
              <button
                onClick={onHamburgerClick}
                className="flex items-center justify-center p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 bg-slate-50 border border-slate-200"
                aria-label="Open Workspace Menu"
              >
                <span className="material-symbols-outlined text-[18px] font-black">menu</span>
              </button>
            )}
          </div>
          <h3 className="text-[13px] font-bold text-slate-700 truncate">
            {activeStyle.name}
          </h3>
          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-2">
            <div>
              <span className="mr-1">{tx('syncfit.filter.vendor')}</span>
              <span className="text-slate-600">{activeVendor}</span>
            </div>
            <div className="w-px h-2.5 bg-slate-200" />
            <div>
              <span className="mr-1">{tx('syncfit.filter.factory')}</span>
              <span className="text-slate-600">{activeFactory}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 실시간 최신순 타임라인 피드 (모바일 메신저 스타일) */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5">
        {styleMessages.length === 0 ? (
          <div className="text-center py-12 text-[12px] text-slate-400 font-medium">
            작성된 협업 메시지가 없습니다.
          </div>
        ) : (
          styleMessages.map((msg) => {
            const userLang = language;
            const msgLang = msg.sender.lang;
            const isDifferentLang =
              (userLang === 'KO' && msgLang === 'CN') ||
              (userLang === 'CN' && msgLang === 'KR');

            const hasTranslation =
              msg.translations &&
              ((userLang === 'KO' && msg.translations.KR) ||
                (userLang === 'CN' && msg.translations.CN));

            const showOriginal = showOriginalMap[msg.id];

            let displayContent = msg.content;
            if (isDifferentLang && hasTranslation && !showOriginal) {
              displayContent =
                userLang === 'KO'
                  ? msg.translations?.KR || msg.content
                  : msg.translations?.CN || msg.content;
            }

            const isSystemLog = msg.logUpdate !== undefined;

            if (isSystemLog) {
              return (
                <div
                  key={msg.id}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-400/20 rounded-lg max-w-[90%] mx-auto text-[10px] font-black text-slate-600/90 shadow-sm animate-fade-in"
                >
                  <span className="material-symbols-outlined text-[12px]">
                    published_with_changes
                  </span>
                  <span>{displayContent}</span>
                </div>
              );
            }

            const isMine = msg.sender.role === 'designer' || msg.sender.role === 'admin';
            
            // 첨부 미디어 렌더링 결정
            const attachedMedia = msg.mediaId ? mediaList.find(m => m.id === msg.mediaId) : null;

            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 max-w-[85%] ${
                  isMine ? 'self-start' : 'self-end items-end'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                  <span>{msg.sender.name}</span>
                  <span className="px-1 py-0.5 rounded bg-slate-200 text-slate-500 scale-90 text-[8px] uppercase">
                    {msg.sender.role}
                  </span>
                  <span className="font-normal text-[9px] text-slate-400">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-2xl shadow-sm text-[13px] leading-relaxed border ${
                    isMine
                      ? 'bg-white text-slate-800 border-slate-100 rounded-tl-none'
                      : 'bg-blue-600 text-white border-blue-500 rounded-tr-none'
                  }`}
                >
                  <div className="break-words">{displayContent}</div>
                  
                  {/* 동적 인라인 미디어 뷰어 */}
                  {attachedMedia && (
                    <div className="mt-2">
                      {attachedMedia.type === 'video' ? (
                        <div className="rounded-lg overflow-hidden border border-slate-200/20 max-w-[240px]">
                          <video src={attachedMedia.url} controls className="w-full h-auto max-h-[160px] object-cover" />
                        </div>
                      ) : attachedMedia.type === 'techpack' ? (
                        <a
                          href={attachedMedia.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded-lg bg-slate-100/10 border border-slate-200/20 text-[11px] font-black text-slate-400 hover:text-white"
                        >
                          <span className="material-symbols-outlined text-[16px] text-red-400">picture_as_pdf</span>
                          <span className="truncate max-w-[150px]">{attachedMedia.fileName}</span>
                        </a>
                      ) : (
                        <div className="rounded-lg overflow-hidden border border-slate-200/20 max-w-[200px] shadow-md bg-black">
                          <img src={attachedMedia.url} alt="attached preview" className="w-full h-auto max-h-[160px] object-contain" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Translation Helpers */}
                  {isDifferentLang && hasTranslation && (
                    <div className="mt-2 pt-1.5 border-t border-slate-200/20 flex items-center justify-between gap-4 text-[9px]">
                      <span
                        className={`${
                          isMine ? 'text-blue-500' : 'text-blue-200'
                        } font-black`}
                      >
                        {showOriginal ? '' : `💡 ${tx('syncfit.feed.translated')}`}
                      </span>
                      <button
                        onClick={() => toggleOriginal(msg.id)}
                        className={`underline hover:no-underline font-bold ${
                          isMine
                            ? 'text-slate-400 hover:text-slate-600'
                            : 'text-blue-100 hover:text-white'
                        }`}
                      >
                        {showOriginal ? '번역 보기' : tx('syncfit.feed.original')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. 입력창 및 상태 컨트롤 패널 */}
      <div className="bg-white border-t border-slate-200 p-3.5 flex flex-col gap-2.5 flex-shrink-0">
        {/* 숨겨진 파일 선택 Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*,application/pdf,.docx,.xlsx"
          className="hidden"
        />

        {/* Status Dropdown & File Upload Buttons */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <span className="material-symbols-outlined text-[15px]">sync_alt</span>
            <span>상태:</span>
            <select
              value={activeStyle.status}
              onChange={(e) => handleStatusChange(e.target.value as StyleStatus)}
              className="h-7 px-1.5 rounded-lg border border-slate-200 text-[11px] bg-slate-50 hover:bg-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer font-bold"
            >
              {Object.entries(STYLE_STATUS).map(([key, value]) => (
                <option key={value} value={value}>
                  {tx(`syncfit.status.${value}`)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleFileClick}
            className="h-7 px-2.5 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-500 hover:bg-slate-50 flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[13px]">attach_file</span>
            {tx('syncfit.common.add_file')}
          </button>
        </div>

        {/* Message Input Form */}
        <form onSubmit={handleSend} className="flex gap-1.5">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={tx('syncfit.feed.placeholder')}
            className="flex-1 h-9 px-3 rounded-xl border border-slate-200 text-[12px] focus:outline-none focus:border-blue-500 bg-slate-50/50 focus:bg-white transition-all"
          />
          <button
            type="submit"
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-bold shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">send</span>
            {tx('syncfit.feed.send')}
          </button>
        </form>
      </div>
    </div>
  );
}
