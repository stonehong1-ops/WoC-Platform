'use client';

import React, { useState, useRef } from 'react';
import { Style, Media, STYLE_STATUS, StyleStatus } from '../types';
import { useSyncFitLanguage } from '../SyncFitLanguageContext';
import DigitalShowroom from './DigitalShowroom';

export type TabType = 'techpack' | 'filemanager' | 'showroom' | 'scm';

interface StyleDetailPanelProps {
  style: Style;
  userRole: string; // 'admin' | 'designer' | 'factory_staff' | 'vendor_staff'
  mediaList: Media[];
  onConfirmProduction: () => void;
  onUploadMedia: (file: File, type: Media['type']) => string;
  onSendMessage: (content: string, statusUpdate?: StyleStatus, mediaId?: string) => void;
  onUpdateSCM: (updatedScm: Style['scmPrice']) => void;
  forcedTab?: TabType;
  onClose?: () => void;
}

export default function StyleDetailPanel({
  style,
  userRole,
  mediaList,
  onConfirmProduction,
  onUploadMedia,
  onSendMessage,
  onUpdateSCM,
  forcedTab,
  onClose
}: StyleDetailPanelProps) {
  const { tx } = useSyncFitLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<TabType>('techpack');
  
  const currentTab = forcedTab || activeDetailTab;
  
  // SCM Calculator states
  const [factoryCost, setFactoryCost] = useState(style.scmPrice.factoryCostRmb);
  const [exchangeRate, setExchangeRate] = useState(style.scmPrice.exchangeRate);
  const [duty, setDuty] = useState(style.scmPrice.duty);
  const [shipping, setShipping] = useState(style.scmPrice.shipping);
  const [margin, setMargin] = useState(style.scmPrice.margin);

  // Lightbox modal states
  const [lightboxMedia, setLightboxMedia] = useState<Media | null>(null);

  // Filter media for this style
  const styleMedia = mediaList.filter((m) => m.styleId === style.id);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let mediaType: Media['type'] = 'techpack';
    if (file.type.startsWith('image/')) {
      mediaType = 'image';
    } else if (file.type.startsWith('video/')) {
      mediaType = 'video';
    }

    const generatedId = onUploadMedia(file, mediaType);
    onSendMessage(`[자료실 업로드] ${file.name}`, undefined, generatedId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    let mediaType: Media['type'] = 'techpack';
    if (file.type.startsWith('image/')) {
      mediaType = 'image';
    } else if (file.type.startsWith('video/')) {
      mediaType = 'video';
    }

    const generatedId = onUploadMedia(file, mediaType);
    onSendMessage(`[자료실 업로드] ${file.name}`, undefined, generatedId);
  };

  // Calculate final Supply Price
  const supplyPrice = Math.round((factoryCost * exchangeRate) + duty + shipping + margin);

  const handleScmChange = (field: string, val: number) => {
    const updated = {
      factoryCostRmb: field === 'factoryCost' ? val : factoryCost,
      exchangeRate: field === 'exchangeRate' ? val : exchangeRate,
      duty: field === 'duty' ? val : duty,
      shipping: field === 'shipping' ? val : shipping,
      margin: field === 'margin' ? val : margin
    };

    if (field === 'factoryCost') setFactoryCost(val);
    else if (field === 'exchangeRate') setExchangeRate(val);
    else if (field === 'duty') setDuty(val);
    else if (field === 'shipping') setShipping(val);
    else if (field === 'margin') setMargin(val);

    onUpdateSCM(updated);
  };

  const handleDownload = async (e: React.MouseEvent, url: string, fileName: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (err) {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex-1 h-full bg-white overflow-hidden flex flex-col">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,video/*,application/pdf,.docx,.xlsx"
        className="hidden"
      />
      
      {onClose && (
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
          <h3 className="text-[13px] font-black tracking-tight flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-blue-400">
              {currentTab === 'techpack' ? 'folder_open' : currentTab === 'filemanager' ? 'inventory_2' : currentTab === 'showroom' ? 'palette' : 'calculate'}
            </span>
            {currentTab === 'techpack' ? '작업지시서' : currentTab === 'filemanager' ? '파일관리' : currentTab === 'showroom' ? '가상쇼룸' : 'SCM 계산기'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* 4대 통합 탭 네비게이션 */}
      {!forcedTab && (
        <div className="flex bg-slate-100/60 p-1.5 border-b border-slate-200 gap-1 flex-shrink-0 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setActiveDetailTab('techpack')}
            className={`flex-1 py-2 rounded-lg text-[12px] font-black transition-all flex items-center justify-center gap-1.5 ${
              activeDetailTab === 'techpack'
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:bg-white/40 hover:text-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">folder_open</span>
            작업지시서
          </button>

          <button
            onClick={() => setActiveDetailTab('filemanager')}
            className={`flex-1 py-2 rounded-lg text-[12px] font-black transition-all flex items-center justify-center gap-1.5 ${
              activeDetailTab === 'filemanager'
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:bg-white/40 hover:text-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">inventory_2</span>
            파일관리
          </button>

          <button
            onClick={() => setActiveDetailTab('showroom')}
            className={`flex-1 py-2 rounded-lg text-[12px] font-black transition-all flex items-center justify-center gap-1.5 ${
              activeDetailTab === 'showroom'
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:bg-white/40 hover:text-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">palette</span>
            가상쇼룸
          </button>

          <button
            onClick={() => setActiveDetailTab('scm')}
            className={`flex-1 py-2 rounded-lg text-[12px] font-black transition-all flex items-center justify-center gap-1.5 ${
              activeDetailTab === 'scm'
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:bg-white/40 hover:text-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">calculate</span>
            SCM 계산기
          </button>
        </div>
      )}

      {/* 탭 내용 분기 렌더링 영역 (전체 스크롤 처리) */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-slate-200">
        
        {/* 탭 1: 작업지시서 (Tech Pack) */}
        {currentTab === 'techpack' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200 h-full">
            {(() => {
              const latestTechPack = [...styleMedia]
                .reverse()
                .find(m => m.type === 'techpack' || m.type === 'image');

              if (!latestTechPack) {
                return (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-[13px] border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <span className="material-symbols-outlined text-[48px] text-slate-300 mb-3">upload_file</span>
                    <span>등록된 메인 작업지시서가 없습니다.</span>
                    <button
                      onClick={() => setActiveDetailTab('filemanager')}
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[12px] rounded-lg shadow transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">cloud_upload</span>
                      자료실에서 파일 등록하기
                    </button>
                  </div>
                );
              }

              return (
                <div className="flex flex-col gap-3 h-full">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-shrink-0">
                    <div className="flex items-center gap-2 text-[13px] font-black text-slate-800">
                      <span className="material-symbols-outlined text-[17px] text-blue-600 font-bold">description</span>
                      메인 작업지시서 시안 뷰어 (클릭 시 원본 풀스크린)
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-bold text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">sync</span>
                      작업지시서 교체/업로드
                    </button>
                  </div>

                  {/* 뷰포트 전체 공간을 활용하는 큼직한 메인 뷰어 (클릭 시 팝업) */}
                  <div
                    onClick={() => setLightboxMedia(latestTechPack)}
                    className="w-full flex-1 flex justify-center items-center bg-slate-950 rounded-2xl border border-slate-200/60 overflow-y-auto cursor-pointer hover:opacity-95 transition-opacity min-h-[480px] p-3 shadow-inner relative group"
                  >
                    {latestTechPack.type === 'techpack' ? (
                      <iframe
                        src={latestTechPack.url}
                        className="w-full h-[550px] border-0 rounded-xl bg-white pointer-events-none"
                      />
                    ) : (
                      <img
                        src={latestTechPack.url}
                        alt="Main Tech Pack"
                        className="w-full h-auto max-h-[600px] object-contain rounded-xl"
                      />
                    )}

                    {/* 오버레이 힌트 */}
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded-2xl">
                      <span className="material-symbols-outlined text-[42px] text-white font-bold bg-blue-600 p-4 rounded-full shadow-lg">
                        zoom_in
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* 탭 2: 파일관리 (Tech Pack 관리 및 업로드) */}
        {currentTab === 'filemanager' && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            <div className="flex flex-col gap-3">
              <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-blue-600 font-bold">cloud_upload</span>
                신규 파일 등록 및 드롭존
              </h3>

              {/* Drag and Drop Upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-slate-50 flex flex-col items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[28px] text-slate-400">upload_file</span>
                <span className="text-[12px] font-bold text-slate-500">{tx('syncfit.common.upload')}</span>
                <span className="text-[10px] text-slate-400 font-medium">PDF, DOCX, XLSX (Max 20MB)</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-blue-600 font-bold">folder_shared</span>
                파일관리
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {styleMedia.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      if (m.type === 'techpack') {
                        window.open(m.url, '_blank');
                      } else {
                        setLightboxMedia(m);
                      }
                    }}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50 cursor-pointer transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-100">
                        {m.type === 'techpack' ? (
                          <span className="material-symbols-outlined text-[20px] text-red-500">picture_as_pdf</span>
                        ) : m.type === 'video' ? (
                          <span className="material-symbols-outlined text-[20px] text-blue-500">movie</span>
                        ) : (
                          <img src={m.url} alt="thumbnail" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[12px] font-bold text-slate-700 truncate">{m.fileName}</span>
                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {new Date(m.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDownload(e, m.url, m.fileName)}
                      className="material-symbols-outlined text-[16px] text-slate-400 p-1 hover:text-slate-600 flex items-center justify-center cursor-pointer focus:outline-none"
                    >
                      download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 탭 2: Color & Showroom */}
        {currentTab === 'showroom' && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            {/* 디지털 컬러북 스와치 정보 */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-blue-600 font-bold">palette</span>
                {tx('syncfit.right.colorbook')}
              </h3>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">원단명 및 질감 사양</span>
                  <span className="text-[13px] font-bold text-slate-700">{style.colorBook.fabricName}</span>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">디지털 컬러칩 (Hex 매칭)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {style.colorBook.colors.map((c) => (
                      <div key={c.name} className="flex flex-col bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm gap-1.5">
                        <div
                          className="w-full h-8 rounded-md border border-slate-200/50 shadow-inner"
                          style={{ backgroundColor: c.hex }}
                        />
                        <div className="flex flex-col text-[10px]">
                          <span className="font-bold text-slate-700 truncate">{c.name}</span>
                          <span className="font-mono text-slate-400 font-bold mt-0.5">{c.hex}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 가상 품평 쇼룸 */}
            <DigitalShowroom
              style={style}
              userRole={userRole}
              onConfirmProduction={onConfirmProduction}
            />
          </div>
        )}

        {/* 탭 3: SCM & QR Log */}
        {currentTab === 'scm' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in duration-200">
            
            {/* 원가 계산기 시뮬레이터 */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-blue-600 font-bold">calculate</span>
                {tx('syncfit.right.scm')}
              </h3>

              <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/40 flex flex-col gap-3.5 shadow-inner">
                <div className="text-[11px] font-black text-slate-700 border-b border-slate-200 pb-1">
                  📊 {tx('syncfit.scm.calc')}
                </div>

                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-4 text-[12px] font-bold">
                    <span className="text-slate-500">{tx('syncfit.scm.factoryCost')} (¥)</span>
                    <input
                      type="number"
                      value={factoryCost}
                      onChange={(e) => handleScmChange('factoryCost', parseFloat(e.target.value) || 0)}
                      className="w-24 h-7 px-2 rounded border border-slate-200 text-right text-[12px] focus:outline-none focus:border-blue-500 bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 text-[12px] font-bold">
                    <span className="text-slate-500">{tx('syncfit.scm.exchangeRate')} (원)</span>
                    <input
                      type="number"
                      value={exchangeRate}
                      onChange={(e) => handleScmChange('exchangeRate', parseFloat(e.target.value) || 0)}
                      className="w-24 h-7 px-2 rounded border border-slate-200 text-right text-[12px] focus:outline-none focus:border-blue-500 bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 text-[12px] font-bold">
                    <span className="text-slate-500">{tx('syncfit.scm.duty')} (원)</span>
                    <input
                      type="number"
                      value={duty}
                      onChange={(e) => handleScmChange('duty', parseFloat(e.target.value) || 0)}
                      className="w-24 h-7 px-2 rounded border border-slate-200 text-right text-[12px] focus:outline-none focus:border-blue-500 bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 text-[12px] font-bold">
                    <span className="text-slate-500">{tx('syncfit.scm.shipping')} (원)</span>
                    <input
                      type="number"
                      value={shipping}
                      onChange={(e) => handleScmChange('shipping', parseFloat(e.target.value) || 0)}
                      className="w-24 h-7 px-2 rounded border border-slate-200 text-right text-[12px] focus:outline-none focus:border-blue-500 bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 text-[12px] font-bold">
                    <span className="text-slate-500">{tx('syncfit.scm.margin')} (원)</span>
                    <input
                      type="number"
                      value={margin}
                      onChange={(e) => handleScmChange('margin', parseFloat(e.target.value) || 0)}
                      className="w-24 h-7 px-2 rounded border border-slate-200 text-right text-[12px] focus:outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div className="bg-blue-600 text-white rounded-xl p-3 flex flex-col items-center justify-center gap-1 shadow-md mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                    {tx('syncfit.scm.supplyPrice')}
                  </span>
                  <span className="text-[16px] font-black tracking-tight">
                    ₩ {supplyPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* QR 로그 */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-blue-600 font-bold">qr_code_2</span>
                {tx('syncfit.right.qr')}
              </h3>

              <div className="flex flex-col gap-3.5 p-4 bg-slate-50/40 rounded-xl border border-slate-100 shadow-inner">
                {style.qrLogs.map((log, index) => (
                  <div key={index} className="flex gap-2.5">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
                        {index + 1}
                      </div>
                      {index < style.qrLogs.length - 1 && (
                        <div className="w-0.5 h-8 bg-slate-200 my-0.5" />
                      )}
                    </div>
                    <div className="flex flex-col text-[11px] font-medium leading-tight">
                      <div className="text-slate-800 font-bold">
                        {tx('syncfit.qr.stage')}: <span className="text-blue-600">{log.stage}</span>
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        {tx('syncfit.qr.location')}: {log.location}
                      </div>
                      <div className="text-slate-400 text-[9px] mt-0.5">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxMedia && (
        <div
          onClick={() => setLightboxMedia(null)}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center gap-3"
          >
            <button
              onClick={() => setLightboxMedia(null)}
              className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold transition-all focus:outline-none"
              aria-label="Close"
            >
              ✕
            </button>
            
            {lightboxMedia.type === 'video' ? (
              <video
                src={lightboxMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-[75vh] rounded-lg shadow-2xl"
              />
            ) : lightboxMedia.type === 'techpack' ? (
              <div className="w-full flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
                <iframe
                  src={lightboxMedia.url}
                  className="w-full h-[60vh] rounded-lg bg-white shadow-2xl border-0"
                  style={{ width: '100%', minWidth: '320px', maxWidth: '800px' }}
                />
                <a
                  href={lightboxMedia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[12px] rounded-lg shadow transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  새 창에서 열기
                </a>
              </div>
            ) : (
              <img
                src={lightboxMedia.url}
                alt={lightboxMedia.fileName}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
              />
            )}
            
            <span className="text-white text-[12px] font-bold tracking-wide">
              {lightboxMedia.fileName}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
