'use client';

import React, { useState } from 'react';
import { Style, Media, STYLE_STATUS, StyleStatus } from '../types';
import { useSyncFitLanguage } from '../SyncFitLanguageContext';
import DigitalShowroom from './DigitalShowroom';

export type TabType = 'scm' | 'tools' | 'specs';

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
  const [activeDetailTab, setActiveDetailTab] = useState<TabType>('scm');
  
  const currentTab = forcedTab || activeDetailTab;

  // SCM Calculator states
  const [factoryCost, setFactoryCost] = useState(style.scmPrice.factoryCostRmb);
  const [exchangeRate, setExchangeRate] = useState(style.scmPrice.exchangeRate);
  const [duty, setDuty] = useState(style.scmPrice.duty);
  const [shipping, setShipping] = useState(style.scmPrice.shipping);
  const [margin, setMargin] = useState(style.scmPrice.margin);

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

  return (
    <aside className="w-full h-full bg-white border-l border-outline-variant flex flex-col shrink-0 overflow-hidden">
      {/* 모바일 닫기 헤더 */}
      {onClose && (
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
          <h3 className="text-[13px] font-bold tracking-tight">도구 패널</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Stitch 3분할 탭바 (0px 편차 마크업) */}
      {!forcedTab && (
        <div className="flex border-b border-outline-variant shrink-0">
          {(['scm', 'tools', 'specs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveDetailTab(tab)}
              className={`flex-1 py-4 font-label-md text-label-md font-bold text-center border-b-2 transition-all cursor-pointer ${
                currentTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* 탭 세부 스크롤 바디 */}
      <div className="flex-1 overflow-y-auto p-md space-y-lg">
        
        {/* SCM 탭 */}
        {currentTab === 'scm' && (
          <div className="space-y-lg animate-fade-in">
            {/* Supply Chain Status */}
            <div>
              <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-md">Supply Chain Status</h4>
              <div className="space-y-sm">
                <div className="p-sm bg-surface-container-low rounded-lg border border-outline-variant">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-body-sm font-medium">Main Fabric Vendor</span>
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">ACTIVE</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">NorthTex Global Logistics</p>
                </div>
                
                <div className="p-sm bg-surface-container-low rounded-lg border border-outline-variant">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-body-sm font-medium">Zipper Hardware</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      style.status === STYLE_STATUS.DESIGN ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {style.status === STYLE_STATUS.DESIGN ? 'DELAYED' : 'ACTIVE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">YKK International (Guangzhou Branch)</p>
                </div>
              </div>
            </div>

            {/* SCM Calculator */}
            <div className="bg-slate-50 p-md rounded-2xl border border-slate-200 space-y-md">
              <h5 className="font-bold text-[13px] text-slate-800 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">calculate</span>
                {tx('syncfit.scm.calc')}
              </h5>
              
              <div className="space-y-sm text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-500">{tx('syncfit.scm.factoryCost')}</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={factoryCost}
                      onChange={(e) => handleScmChange('factoryCost', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-outline-variant rounded-lg py-2 px-3 font-mono focus:ring-1 focus:ring-primary focus:border-primary text-right pr-6 outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-slate-500">{tx('syncfit.scm.shipping')}</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={shipping}
                        onChange={(e) => handleScmChange('shipping', parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-outline-variant rounded-lg py-2 px-3 font-mono focus:ring-1 focus:ring-primary focus:border-primary text-right pr-6 outline-none"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">m</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-slate-500">{tx('syncfit.scm.duty')}</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={duty}
                        onChange={(e) => handleScmChange('duty', parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-outline-variant rounded-lg py-2 px-3 font-mono focus:ring-1 focus:ring-primary focus:border-primary text-right pr-6 outline-none"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-500">{tx('syncfit.scm.exchangeRate')}</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={exchangeRate}
                      onChange={(e) => handleScmChange('exchangeRate', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-outline-variant rounded-lg py-2 px-3 font-mono focus:ring-1 focus:ring-primary focus:border-primary text-right pr-6 outline-none"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  </div>
                </div>
              </div>

              {/* SCM Result Card */}
              <div className="bg-primary text-on-primary p-md rounded-2xl shadow-md space-y-3 mt-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-primary/70">{tx('syncfit.scm.supplyPrice')}</span>
                <div className="flex justify-between items-baseline">
                  <h4 className="text-3xl font-black font-mono">₩ {supplyPrice.toLocaleString()}</h4>
                  <span className="text-xs text-white/80">실시간 연동가</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tools 탭 */}
        {currentTab === 'tools' && (
          <div className="space-y-lg animate-fade-in">
            {/* AI Insights Card */}
            <div className="p-md bg-primary-container/10 border border-primary/20 rounded-xl">
              <div className="flex items-center gap-sm mb-sm text-primary">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                <span className="font-bold text-xs">{tx('syncfit.scm.ai_insights')}</span>
              </div>
              <p className="text-[12px] text-primary leading-relaxed">
                Optimization suggested: Switching to Guangzhou Factory B could reduce manufacturing lead times by 12% without compromising tensile strength ratings.
              </p>
            </div>

            {/* Virtual Stage Showroom */}
            <DigitalShowroom
              style={style}
              userRole={userRole}
              onConfirmProduction={onConfirmProduction}
            />
          </div>
        )}

        {/* Specs 탭 */}
        {currentTab === 'specs' && (
          <div className="space-y-lg animate-fade-in">
            {/* Production Timeline */}
            <div>
              <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-md">Production Timeline</h4>
              <div className="relative pl-6 space-y-md before:content-[''] before:absolute before:left-2 before:top-1 before:bottom-1 before:w-0.5 before:bg-outline-variant">
                <div className="relative">
                  <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-primary"></div>
                  <p className="text-body-sm font-bold">Design Finalization</p>
                  <p className="text-[11px] text-on-surface-variant">Completed June 12</p>
                </div>
                <div className="relative">
                  <div className={`absolute -left-5 top-1 w-2.5 h-2.5 rounded-full ${
                    style.status !== STYLE_STATUS.DESIGN ? 'bg-primary' : 'bg-outline-variant'
                  }`}></div>
                  <p className="text-body-sm font-bold">Material Sourcing</p>
                  <p className="text-[11px] text-on-surface-variant">
                    {style.status !== STYLE_STATUS.DESIGN ? 'Completed - 100%' : 'In Progress - 65%'}
                  </p>
                </div>
                <div className="relative">
                  <div className={`absolute -left-5 top-1 w-2.5 h-2.5 rounded-full ${
                    style.status === STYLE_STATUS.SAMPLE_REVIEW || style.status === STYLE_STATUS.PROD_CONFIRM || style.status === STYLE_STATUS.PROD_ACTIVE ? 'bg-primary' : 'bg-outline-variant'
                  }`}></div>
                  <p className="text-body-sm font-bold">Sample Run #1</p>
                  <p className="text-[11px] text-on-surface-variant">
                    {style.status === STYLE_STATUS.SAMPLE_REVIEW || style.status === STYLE_STATUS.PROD_CONFIRM || style.status === STYLE_STATUS.PROD_ACTIVE ? 'Review Finished' : 'Scheduled'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tech Pack Upload Dropzone */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.1em]">{tx('syncfit.menu.techpack')}</span>
              <div 
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'application/pdf';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const id = onUploadMedia(file, 'techpack');
                      onSendMessage(`[작업지시서 교체] ${file.name}`, undefined, id);
                    }
                  };
                  input.click();
                }}
                className="border border-dashed border-outline-variant rounded-xl p-6 text-center cursor-pointer hover:bg-slate-50 transition-all"
              >
                <span className="material-symbols-outlined text-[32px] text-slate-400 mb-1">upload_file</span>
                <p className="text-xs font-semibold text-slate-500">{tx('syncfit.common.upload')}</p>
                <p className="text-[10px] text-slate-400 mt-1">PDF Version: {style.techPackVersion}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
