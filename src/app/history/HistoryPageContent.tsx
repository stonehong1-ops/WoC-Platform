"use client";

import React from 'react';
import ChatRoom from '@/components/chat/ChatRoom';
import { GroupClassSelectionPopup } from '@/components/groups/GroupClassSelectionPopup';
import { useHistoryData } from './hooks/useHistoryData';
import {
  TABS,
  getStatusLabel,
  formatOrderId,
  formatFullDate,
  formatNotiDate
} from './helpers/historyHelpers';
import BottomSheet from '@/components/common/BottomSheet';

export function HistoryPageContent() {
  const {
    t,
    language,
    user,
    profile,
    activeTab,
    setActiveTab,
    selectedDetail,
    groupDetails,
    isScrolled,
    setIsScrolled,
    isSelectionPopupOpen,
    setIsSelectionPopupOpen,
    chatRoomId,
    handleCloseChat,
    filteredItems,
    groupedItems,
    handleCopyAccount,
    handleOpenDetail,
    handleCloseDetail,
    handleChatWithSeller,
    updateHistoryItemMemo,
    cancelHistoryItem
  } = useHistoryData();

  const isSystemAdmin = !!(profile?.systemRole === 'admin' || profile?.isAdmin);
  const isGroupOwner = !!(user && groupDetails?.ownerId === user.uid);
  const isApplicant = !!(user && selectedDetail?.raw?.userId === user.uid);
  const hasEditPermission = !!(selectedDetail && selectedDetail.type === 'Class' && (isSystemAdmin || isGroupOwner || isApplicant));

  const isBundle = !!(selectedDetail && (
    selectedDetail.raw?.itemType === 'discount' || 
    (selectedDetail.domain === 'class_legacy' && (selectedDetail.raw?.includedClassIds || selectedDetail.raw?.includedClasses))
  ));

  const [isEditSheetOpen, setIsEditSheetOpen] = React.useState(false);
  const [isManageMenuOpen, setIsManageMenuOpen] = React.useState(false);
  const [tempMemo, setTempMemo] = React.useState('');
  const [tempPartnerName, setTempPartnerName] = React.useState('');
  const [isSavingMemo, setIsSavingMemo] = React.useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);

  React.useEffect(() => {
    if (selectedDetail) {
      setTempMemo(selectedDetail.raw?.memo || selectedDetail.raw?.notes || selectedDetail.raw?.applicantMemo || '');
      setTempPartnerName(selectedDetail.raw?.partnerName || '');
    }
  }, [selectedDetail]);

  const handleSaveMemo = async () => {
    if (!selectedDetail) return;
    setIsSavingMemo(true);
    try {
      await updateHistoryItemMemo(selectedDetail.id, selectedDetail.source, tempMemo, isBundle ? tempPartnerName : undefined);
      setIsEditSheetOpen(false);
    } catch (e) {
      // Handled inside hook
    } finally {
      setIsSavingMemo(false);
    }
  };

  const handleCancelClick = async () => {
    if (!selectedDetail) return;
    try {
      await cancelHistoryItem(selectedDetail.id, selectedDetail.source);
      setShowCancelConfirm(false);
      setIsEditSheetOpen(false);
    } catch (e) {
      // Handled inside hook
    }
  };

  // Find class/bundle specific details
  let itemInfo: any = null;
  if (selectedDetail && groupDetails) {
    const raw = selectedDetail.raw;
    const itemType = raw.itemType || selectedDetail.domain;
    const classId = raw.classId || raw.itemId;

    if (itemType === 'discount') {
      itemInfo = groupDetails.discounts?.find((d: any) => d.id === classId);
    } else {
      itemInfo = groupDetails.classes?.find((c: any) => c.id === classId);
    }
  }

  // Fallback to payload for newer bookings without groupDetails
  if (!itemInfo && selectedDetail?.raw?.payload) {
    itemInfo = selectedDetail.raw.payload;
  }

  // Use group payment settings or class specific
  let bankInfo = itemInfo?.bankName && itemInfo?.accountNumber
    ? { bankName: itemInfo.bankName, accountNumber: itemInfo.accountNumber, accountHolder: itemInfo.accountHolder }
    : groupDetails?.classPaymentSettings?.bankDetails;

  // Fallback for Stay Bookings
  if (selectedDetail?.type === 'Stay' && selectedDetail?.raw?.payment) {
    const pay = selectedDetail.raw.payment;
    if (pay.bankName && pay.accountNumber) {
      bankInfo = {
        bankName: pay.bankName,
        accountNumber: pay.accountNumber,
        accountHolder: pay.holderName || pay.depositorName || ''
      };
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8FF] text-on-background pb-24 font-['Inter']">

      {/* Scrollable Tab Bar - Standardized (Sticky at the top, just below global header) */}
      {!selectedDetail && (
        <div className="w-full bg-[#FAF8FF] overflow-x-auto no-scrollbar sticky top-0 z-40 border-b border-slate-100/50">
          <div className="flex items-center gap-1.5 px-6 py-3 min-w-max">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-bold tracking-wide transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-[#1E293B] text-white shadow-sm'
                    : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
                }`}
              >
                {t(`history.tab_${tab.toLowerCase().replace(' ', '_')}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      {!selectedDetail && (
        <main className="py-6 max-w-[896px] mx-auto px-6 flex flex-col gap-4">
          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <span className="material-symbols-outlined text-outline text-5xl">receipt_long</span>
              <p className="text-[1.125rem] font-bold leading-[1.5rem] font-['Plus_Jakarta_Sans'] text-on-surface">
                {activeTab === 'All' ? t('history.no_history') : t('history.no_tab_history', { tab: t(`history.tab_${activeTab.toLowerCase().replace(' ', '_')}`) })}
              </p>
              <p className="text-[0.875rem] font-medium leading-[1.25rem] font-['Inter'] text-on-surface-variant">
                {activeTab === 'Class'
                  ? t('history.class_empty_desc')
                  : t('history.coming_soon')}
              </p>
            </div>
          )}

          {groupedItems.map(group => (
            <div key={group.date} className="flex flex-col gap-4">
              <div className="flex items-center gap-4 py-2 mt-2 first:mt-0">
                <h3 className="font-['Plus_Jakarta_Sans'] text-[1rem] font-bold text-on-surface-variant min-w-max">
                  {group.date}
                </h3>
                <div className="h-px bg-outline-variant/30 flex-1"></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {group.items.map(item => {
                  const displayId = formatOrderId(item.domain, item.id, item.raw?.orderNumber);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOpenDetail(item as any)}
                      className={`group cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-500 ${item.status === 'PAYMENT_COMPLETED' || item.status === 'DELIVERED' || item.status === 'SELLER_CONFIRMED' ? 'opacity-75' : ''}`}
                    >
                      <div className="relative aspect-square rounded-xl bg-[#f2f4f4] overflow-hidden mb-3 shadow-sm border border-slate-100">
                        {/* Fallback View */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-[#c4cacc]">
                          <span className="material-symbols-outlined text-4xl mb-1">
                            {item.type === 'Class' ? 'sports_gymnastics' : item.type === 'Shop' ? 'local_mall' : item.type === 'Stay' ? 'bed' : 'receipt_long'}
                          </span>
                          <span className="text-[10px] font-bold tracking-wider uppercase">{item.type}</span>
                        </div>

                        {/* Actual Image */}
                        {item.imageUrl && (
                          <img
                            alt={item.title}
                            className="absolute inset-0 z-10 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 bg-[#f2f4f4]"
                            src={item.imageUrl}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}

                        {/* Status Badge */}
                        <span className={`absolute z-20 top-3 left-3 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm backdrop-blur-sm bg-white/90 ${
                          (item.status === 'PAYMENT_COMPLETED' || item.status === 'SELLER_CONFIRMED' || item.status === 'DELIVERED') ? 'text-emerald-600' :
                          (item.status === 'BANK_TRANSFERRED' || item.status === 'WAITING_CONFIRMATION') ? 'text-orange-600' : 'text-slate-600'
                        }`}>
                          {(item.status === 'PAYMENT_COMPLETED' || item.status === 'SELLER_CONFIRMED' || item.status === 'DELIVERED') && (
                            <span className="material-symbols-outlined text-[10px]">check_circle</span>
                          )}
                          {getStatusLabel(item.status, t)}
                        </span>
                      </div>
                      <div className="px-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter font-['Inter'] truncate">
                          {item.groupName || item.type} • {displayId}
                        </p>
                        <h4 className="text-[13px] font-semibold text-slate-800 font-['Plus_Jakarta_Sans'] truncate mt-0.5">
                          {item.title}
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[13px] font-black text-slate-800 font-['Inter']">
                            {item.currency === 'KRW' ? '₩' : (item.currency === 'USD' ? '$' : '')}{item.amount?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </main>
      )}

      {/* Detail Overlay - Full Screen (Shop Style) */}
      {selectedDetail && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
          <style dangerouslySetInnerHTML={{ __html: `
            .detail-scrollbar::-webkit-scrollbar { display: none; }
            .detail-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}} />

          {/* ━━━ Header ━━━ */}
          <div className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-gradient-to-b from-black/30 to-transparent'} max-w-md mx-auto`}>
            {hasEditPermission ? (
              <button 
                onClick={() => setIsManageMenuOpen(true)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${isScrolled ? 'bg-slate-100 text-[#2d3435]' : 'bg-black/20 backdrop-blur-sm text-white'}`}
              >
                <span className="material-symbols-outlined text-xl">more_vert</span>
              </button>
            ) : (
              <div className="w-10"></div>
            )} {/* Placeholder to balance the flex-between */}
          </div>

          {/* ━━━ Scrollable Content ━━━ */}
          <div
            className="flex-1 overflow-y-auto detail-scrollbar pb-[100px] max-w-md mx-auto w-full"
            onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 60)}
          >
            {/* 1) Image Carousel / Hero */}
            <div className="relative aspect-square overflow-hidden bg-[#f2f4f4]">
              {/* Fallback */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[#c4cacc]">
                <span className="material-symbols-outlined text-5xl mb-1">receipt_long</span>
                <span className="text-[10px] font-bold tracking-wider uppercase">{selectedDetail.type || 'Order'}</span>
              </div>

              {/* Actual Image */}
              {selectedDetail.imageUrl && (
                <div className="relative w-full h-full">
                  <img
                    alt={selectedDetail.title}
                    className="absolute inset-0 z-10 w-full h-full object-cover bg-[#f2f4f4]"
                    src={selectedDetail.imageUrl}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              {/* Status badge */}
              <span className={`absolute z-20 top-16 left-4 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm backdrop-blur-sm ${
                (selectedDetail.status === 'PAYMENT_COMPLETED' || selectedDetail.status === 'SELLER_CONFIRMED' || selectedDetail.status === 'DELIVERED') ? 'bg-emerald-500 text-white' :
                (selectedDetail.status === 'BANK_TRANSFERRED' || selectedDetail.status === 'WAITING_CONFIRMATION') ? 'bg-orange-500 text-white' : 'bg-white/90 text-slate-800'
              }`}>
                {(selectedDetail.status === 'PAYMENT_COMPLETED' || selectedDetail.status === 'SELLER_CONFIRMED' || selectedDetail.status === 'DELIVERED') && (
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                )}
                {getStatusLabel(selectedDetail.status, t)}
              </span>
            </div>

            {/* 2) Title & Stats */}
            <div className="px-4 pt-5 pb-4 flex justify-between items-start border-b border-[#f2f4f4]">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-[10px] font-black text-[#acb3b4] uppercase tracking-widest leading-none mb-1.5">{selectedDetail.dateLabel} · {formatOrderId(selectedDetail.domain, selectedDetail.id, selectedDetail.raw?.orderNumber)}</p>
                <h1 className="text-xl font-black text-[#2d3435] leading-tight font-['Plus_Jakarta_Sans']">{selectedDetail.title}</h1>
              </div>
            </div>

            {/* 3) Status Timeline */}
            <div className="mx-4 my-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
              <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-blue-500">schedule</span>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{t('history.timeline')}</p>
              </div>
              <div className="px-4 py-5">
                <div className="relative border-l-2 border-slate-200 ml-2 space-y-6">
                  {/* Step 1: Application Submitted */}
                  <div className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1 ring-4 ring-white"></div>
                    <div className="flex flex-col">
                      <span className="font-['Inter'] text-[13px] font-bold text-[#2d3435]">{t('history.step_submitted')}</span>
                      <span className="font-['Inter'] text-[11px] text-[#596061] mt-0.5">{formatFullDate(selectedDetail.appliedAt, language)}</span>
                    </div>
                  </div>

                  {/* Step 2: Processing in Chat */}
                  <div className="relative pl-6">
                    <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1 ring-4 ring-white transition-colors ${(selectedDetail.status !== 'PAYMENT_PENDING' && selectedDetail.status !== 'PENDING' && selectedDetail.status !== 'SUBMITTED') ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
                    <div className="flex flex-col">
                      <span className={`font-['Inter'] text-[13px] font-bold ${(selectedDetail.status !== 'PAYMENT_PENDING' && selectedDetail.status !== 'PENDING' && selectedDetail.status !== 'SUBMITTED') ? 'text-[#2d3435]' : 'text-slate-400'}`}>
                        {t('history.step_processing') || 'Processing'}
                      </span>
                      <span className="font-['Inter'] text-[11px] text-[#596061] mt-0.5">
                        {t('history.processing_desc') || 'Updates will be provided via Chat.'}
                      </span>
                    </div>
                  </div>

                  {/* Step 3: Registration Complete */}
                  <div className="relative pl-6">
                    <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1 ring-4 ring-white transition-colors ${(selectedDetail.status === 'PAYMENT_COMPLETED' || selectedDetail.status === 'CONFIRMED' || selectedDetail.status === 'SELLER_CONFIRMED' || selectedDetail.status === 'DELIVERED') ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
                    <div className="flex flex-col">
                      <span className={`font-['Inter'] text-[13px] font-bold ${(selectedDetail.status === 'PAYMENT_COMPLETED' || selectedDetail.status === 'CONFIRMED' || selectedDetail.status === 'SELLER_CONFIRMED' || selectedDetail.status === 'DELIVERED') ? 'text-[#2d3435]' : 'text-slate-400'}`}>{t('history.step_complete')}</span>
                      {((selectedDetail.status === 'PAYMENT_COMPLETED' || selectedDetail.status === 'CONFIRMED' || selectedDetail.status === 'SELLER_CONFIRMED' || selectedDetail.status === 'DELIVERED') && selectedDetail.confirmedAt) ? (
                        <span className="font-['Inter'] text-[11px] text-[#596061] mt-0.5">{formatFullDate(selectedDetail.confirmedAt, language)}</span>
                      ) : (
                        <span className="font-['Inter'] text-[11px] text-slate-400 mt-0.5">{t('history.pending_admin')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4) Information Grid */}
            <div className="mx-4 my-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
              <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-blue-500">info</span>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{selectedDetail.raw?.itemType === 'discount' ? t('history.info_bundle') : t('history.info_class')}</p>
              </div>
              <div className="px-4 py-4 flex flex-col gap-4">
                {selectedDetail.type === 'Stay' && (() => {
                  const checkInVal = selectedDetail.raw?.checkIn;
                  const checkOutVal = selectedDetail.raw?.checkOut;
                  let stayStartLabel = '';
                  let stayEndLabel = '';
                  let checkOutLabel = '';

                  if (checkInVal) {
                    const dStart = checkInVal.toDate ? checkInVal.toDate() : new Date(checkInVal);
                    stayStartLabel = dStart.toLocaleDateString(language === 'KR' ? 'ko-KR' : 'en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                  }

                  if (checkOutVal) {
                    const dOut = checkOutVal.toDate ? checkOutVal.toDate() : new Date(checkOutVal);
                    checkOutLabel = dOut.toLocaleDateString(language === 'KR' ? 'ko-KR' : 'en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                    const dEnd = new Date(dOut.getTime() - 24 * 60 * 60 * 1000);
                    stayEndLabel = dEnd.toLocaleDateString(language === 'KR' ? 'ko-KR' : 'en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                  }

                  return (
                    <>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f2f4f4] flex items-center justify-center shrink-0 text-[#596061]">
                          <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                        </div>
                        <div className="pt-0.5">
                          <p className="font-['Inter'] text-[10px] font-black uppercase tracking-wider text-[#acb3b4] mb-0.5">{t('stay.check_in', 'Check-in')} - {t('stay.check_out', 'Check-out')}</p>
                          <p className="font-['Inter'] text-[13px] font-bold text-[#2d3435]">
                            {stayStartLabel} ~ {stayEndLabel}
                            <span className="text-xs text-[#596061] font-medium ml-2">
                              ({selectedDetail.raw?.nights} {t('stay.nights_unit', 'Nights')} · {checkOutLabel} 퇴실)
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f2f4f4] flex items-center justify-center shrink-0 text-[#596061]">
                          <span className="material-symbols-outlined text-[16px]">group</span>
                        </div>
                        <div className="pt-0.5">
                          <p className="font-['Inter'] text-[10px] font-black uppercase tracking-wider text-[#acb3b4] mb-0.5">{t('stay.guests_label', 'Guests')}</p>
                          <p className="font-['Inter'] text-[13px] font-bold text-[#2d3435]">
                            {selectedDetail.raw?.guests} {t('stay.guests_unit_pp', 'Guest(s)')}
                          </p>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {selectedDetail.type === 'Class' && itemInfo && (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#f2f4f4] flex items-center justify-center shrink-0 text-[#596061]">
                        <span className="material-symbols-outlined text-[16px]">person</span>
                      </div>
                      <div className="pt-0.5">
                        <p className="font-['Inter'] text-[10px] font-black uppercase tracking-wider text-[#acb3b4] mb-0.5">{t('history.instructor')}</p>
                        <p className="font-['Inter'] text-[13px] font-bold text-[#2d3435]">
                          {itemInfo.instructors?.map((i: any) => i.name).join(', ') || 'TBD'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#f2f4f4] flex items-center justify-center shrink-0 text-[#596061]">
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                      </div>
                      <div className="pt-0.5">
                        <p className="font-['Inter'] text-[10px] font-black uppercase tracking-wider text-[#acb3b4] mb-0.5">{t('history.venue')}</p>
                        <p className="font-['Inter'] text-[13px] font-bold text-[#2d3435]">{selectedDetail.groupName || 'Freestyle Studio'}</p>
                      </div>
                    </div>
                    {itemInfo.schedule && itemInfo.schedule.length > 0 && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f2f4f4] flex items-center justify-center shrink-0 text-[#596061]">
                          <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                        </div>
                        <div className="pt-0.5">
                          <p className="font-['Inter'] text-[10px] font-black uppercase tracking-wider text-[#acb3b4] mb-0.5">{t('history.schedule')} ({itemInfo.schedule.length} {t('history.sessions')})</p>
                          <ul className="font-['Inter'] text-[13px] font-medium text-[#596061] mt-1 space-y-1">
                            {itemInfo.schedule.map((s: any, i: number) => (
                              <li key={i}>{s.date} <span className="font-mono text-xs">{s.timeSlot}</span></li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    {(selectedDetail.raw?.memo || selectedDetail.raw?.notes) && (
                      <div className="flex items-start gap-3 mt-4 pt-4 border-t border-slate-100/50">
                        <div className="w-8 h-8 rounded-full bg-[#f2f4f4] flex items-center justify-center shrink-0 text-[#596061]">
                          <span className="material-symbols-outlined text-[16px]">notes</span>
                        </div>
                        <div className="pt-0.5">
                          <p className="font-['Inter'] text-[10px] font-black uppercase tracking-wider text-[#acb3b4] mb-0.5">{language === 'KR' ? '신청자 메모' : 'Applicant Memo'}</p>
                          <p className="font-['Inter'] text-[13px] font-bold text-[#2d3435] whitespace-pre-wrap">{selectedDetail.raw?.memo || selectedDetail.raw?.notes}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {selectedDetail.raw?.itemType === 'discount' && itemInfo && (
                  <div className="flex items-start gap-3 w-full">
                    <div className="w-8 h-8 rounded-full bg-[#f2f4f4] flex items-center justify-center shrink-0 text-[#596061]">
                      <span className="material-symbols-outlined text-[16px]">list_alt</span>
                    </div>
                    <div className="pt-0.5 flex-1 min-w-0">
                      <p className="font-['Inter'] text-[10px] font-black uppercase tracking-wider text-[#acb3b4] mb-2">{t('history.included_classes')}</p>

                      <div className="flex flex-col gap-2 mb-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                        {(itemInfo.includedClassIds && itemInfo.includedClassIds.length > 0 ? itemInfo.includedClassIds : (groupDetails?.classes?.map((c: any) => c.id) || [])).map((cId: string, idx: number) => {
                          const cls = groupDetails?.classes?.find((c: any) => c.id === cId);
                          if (!cls) return null;
                          const isParticipating = selectedDetail.raw?.selectedClassIds?.includes(cId);
                          const partnerName = selectedDetail.raw?.participatingClassPartners?.[cId];

                          return (
                            <div key={idx} className="flex flex-col gap-1 p-2.5 rounded-xl bg-white border border-slate-100/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                              <div className="flex items-center gap-2">
                                <span className={`material-symbols-outlined text-[16px] shrink-0 ${isParticipating ? 'text-emerald-500 font-bold' : 'text-slate-300'}`}>
                                  {isParticipating ? 'check_circle' : 'circle'}
                                </span>
                                <span className={`text-[12.5px] font-semibold truncate ${isParticipating ? 'text-slate-800' : 'text-slate-400'}`}>
                                  {cls.title}
                                </span>
                              </div>
                              {isParticipating && partnerName && (
                                <div className="pl-6 flex items-center gap-1.5 mt-0.5">
                                  <span className="material-symbols-outlined text-slate-400 text-[12px]">group</span>
                                  <span className="text-[11px] font-medium text-slate-500">
                                    {t('group.class.popup.partner_label')}: {partnerName}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* 수업/파트너 변경 버튼 */}
                      <button
                        onClick={() => setIsSelectionPopupOpen(true)}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-xl bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px] text-slate-600">edit_note</span>
                        <span className="text-[11.5px] font-bold text-slate-700">
                          {t('history.change_class_partners')}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {!itemInfo && (
                  <p className="font-['Inter'] text-[13px] text-slate-500">{t('history.loading')}</p>
                )}
              </div>
            </div>

            {/* 5) Payment & Bank Transfer */}
            <div className="px-4 py-4 border-b border-[#f2f4f4]">
              <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-3">{t('history.payment_details')}</p>

              <div className="space-y-2.5 mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-['Inter'] text-[13px] font-medium text-[#596061]">{t('history.method')}</span>
                  <span className="font-['Inter'] text-[13px] font-bold text-[#2d3435]">{t('history.bank_transfer')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-['Inter'] text-[13px] font-medium text-[#596061]">{t('history.total_amount')}</span>
                  <span className="font-['Plus_Jakarta_Sans'] text-[16px] font-black text-blue-600">
                    {selectedDetail.currency === 'KRW' ? '₩' : (selectedDetail.currency === 'USD' ? '$' : '')}{selectedDetail.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {bankInfo && (
                <div className="bg-[#f0f4ff] rounded-xl p-4 border border-[#d8e2ff]">
                  <h4 className="font-['Plus_Jakarta_Sans'] text-[12px] font-bold text-blue-800 mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">account_balance</span>
                    {t('history.transfer_info')}
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    <div className="flex justify-between items-center">
                      <span className="font-['Inter'] text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('history.bank')}</span>
                      <span className="font-['Inter'] text-[13px] font-bold text-slate-800">{bankInfo.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-['Inter'] text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('history.account_number')}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-['Inter'] text-[13px] font-bold text-slate-800 font-mono tracking-tight">{bankInfo.accountNumber}</span>
                        <button
                          onClick={() => handleCopyAccount(bankInfo.accountNumber)}
                          className="text-blue-600 hover:text-blue-800 active:scale-95 transition-all w-6 h-6 flex items-center justify-center rounded bg-white border border-blue-100 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[13px]">content_copy</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-['Inter'] text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('history.account_holder')}</span>
                      <span className="font-['Inter'] text-[13px] font-bold text-slate-800">{bankInfo.accountHolder}</span>
                    </div>
                  </div>
                  {(selectedDetail.status === 'PAYMENT_PENDING' || selectedDetail.status === 'PENDING' || selectedDetail.status === 'SUBMITTED') && (
                    <p className="font-['Inter'] text-[11px] font-bold text-blue-600 mt-3 text-center bg-white/60 py-1.5 rounded-lg border border-blue-100/50">
                      {t('history.transfer_prompt')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Chat Action */}
            <div className="px-4 py-4">
              <button
                onClick={handleChatWithSeller}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#f2f4f4] hover:bg-[#e8eaec] rounded-2xl transition-colors active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-lg text-[#596061]">chat</span>
                <span className="text-sm font-bold text-[#2d3435]">{t('shop.chat_with_seller', 'Chat with Seller')}</span>
              </button>
              <p className="text-[10px] text-[#acb3b4] text-center mt-1.5">{selectedDetail.groupName} · {t('shop.product_info_auto_sent', 'Product info will be sent automatically')}</p>
            </div>
          </div>

          {/* ━━━ Fixed Bottom Bar ━━━ */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 px-4 py-2.5 flex items-center gap-3 max-w-md mx-auto pb-safe">
            <div className="flex-1 min-w-0">
              <p className="text-lg font-black text-[#2d3435] font-['Plus_Jakarta_Sans'] leading-tight">
                {selectedDetail.currency === 'KRW' ? '₩' : (selectedDetail.currency === 'USD' ? '$' : '')}{selectedDetail.amount.toLocaleString()}
              </p>
              <p className="text-[10px] text-[#acb3b4] truncate">{getStatusLabel(selectedDetail.status, t)}</p>
            </div>
            <button
              onClick={handleCloseDetail}
              className="flex-shrink-0 bg-[#2d3435] text-white px-7 py-3 rounded-xl font-black text-sm tracking-wide active:scale-95 transition-transform"
            >
              {t('history.close') || 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Class/Partner Selection Popup for Students */}
      {isSelectionPopupOpen && selectedDetail && (
        <GroupClassSelectionPopup
          isOpen={isSelectionPopupOpen}
          onClose={() => setIsSelectionPopupOpen(false)}
          registration={selectedDetail.raw}
          allClasses={groupDetails?.classes || []}
          includedClassIds={itemInfo?.includedClassIds && itemInfo.includedClassIds.length > 0 ? itemInfo.includedClassIds : (groupDetails?.classes?.map((c: any) => c.id) || [])}
          canEdit={true}
        />
      )}

      {/* Chat Room Modal */}
      {chatRoomId && (
        <div className="fixed inset-0 z-[200] bg-white animate-in slide-in-from-right duration-300">
          <ChatRoom roomId={chatRoomId as string} onBack={handleCloseChat} />
        </div>
      )}

      {/* 점 세 개 관리 메뉴 팝업 (바텀 오버레이 형식) */}
      {isManageMenuOpen && selectedDetail && (
        <>
          <div 
            className="fixed inset-0 z-[10000] bg-black/40 animate-in fade-in duration-150" 
            onClick={() => setIsManageMenuOpen(false)} 
          />
          <div 
            className="fixed bottom-0 left-0 right-0 z-[10001] bg-white rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-200 pb-safe max-w-md mx-auto"
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-2" />
            <div className="px-2 pb-4">
              <button 
                onClick={() => { 
                  setIsManageMenuOpen(false); 
                  setIsEditSheetOpen(true); 
                }}
                className="flex items-center gap-4 w-full px-5 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[22px] text-[#2d3435]">edit</span>
                <span className="text-[15px] font-bold text-[#2d3435]">{t('history.edit_application') || '신청 정보 수정'}</span>
              </button>
              {selectedDetail.status !== 'CANCELED' && (
                <button 
                  onClick={() => { 
                    setIsManageMenuOpen(false); 
                    setShowCancelConfirm(true); 
                  }}
                  className="flex items-center gap-4 w-full px-5 py-3.5 rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[22px] text-red-500">cancel</span>
                  <span className="text-[15px] font-bold text-red-500">{t('history.cancel_application') || '신청 취소 (삭제)'}</span>
                </button>
              )}
              <div className="h-px bg-gray-100 mx-4 my-1" />
              <button 
                onClick={() => setIsManageMenuOpen(false)}
                className="flex items-center justify-center w-full py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-center text-sm font-black text-slate-500"
              >
                {t('history.cancel') || '취소'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* 수정/편집 전용 BottomSheet 제어반 */}
      <BottomSheet
        isOpen={isEditSheetOpen}
        onClose={() => setIsEditSheetOpen(false)}
        title={language === 'KR' ? '신청 내역 편집' : 'Edit Application'}
        height="auto"
      >
        <div className="px-6 py-4 pb-10 space-y-6 max-w-md mx-auto">
          <p className="text-xs font-semibold text-slate-400">
            {isBundle
              ? (language === 'KR' ? '신청 정보에 남길 메모 및 파트너명을 입력하거나 일정을 관리합니다.' : 'You can edit notes, partner name or manage options for this application.')
              : (language === 'KR' ? '신청 정보에 남길 메모를 입력합니다.' : 'You can enter a memo for this application.')
            }
          </p>

          {/* 메모 입력창 */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              {language === 'KR' ? '신청자 메모' : 'Applicant Memo'}
            </label>
            <textarea
              value={tempMemo}
              onChange={(e) => setTempMemo(e.target.value)}
              placeholder={language === 'KR' ? '전달할 특이사항이나 메모를 입력하세요.' : 'Enter any notes or special requests.'}
              className="w-full h-24 text-sm p-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium text-slate-700 resize-none"
            />
          </div>

          {/* 번들 전용 파트너명 입력창 */}
          {isBundle && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                {t('history.partner_name') || '대표 파트너명'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tempPartnerName}
                  onChange={(e) => setTempPartnerName(e.target.value)}
                  placeholder={t('history.partner_placeholder') || '대표 파트너의 이름을 입력하세요.'}
                  className="w-full text-sm py-2.5 pl-9 pr-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium text-slate-700"
                />
                <span className="material-symbols-outlined text-slate-400 text-[18px] absolute left-3 top-1/2 -translate-y-1/2">
                  group
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {/* 번들 전용 수업/파트너 변경 단추 */}
            {isBundle && (
              <button
                onClick={() => {
                  setIsEditSheetOpen(false);
                  setIsSelectionPopupOpen(true);
                }}
                className="w-full py-4 bg-blue-50/50 hover:bg-blue-50 active:scale-[0.99] border border-blue-100 rounded-2xl flex items-center justify-between px-5 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-blue-500 text-lg">edit_note</span>
                  <span className="text-sm font-bold text-slate-800">{t('history.change_class_partners') || '참여 수업 / 파트너 변경'}</span>
                </div>
                <span className="material-symbols-outlined text-blue-400 text-sm">chevron_right</span>
              </button>
            )}

            {/* 저장/닫기 단추 */}
            <div className="flex gap-3 pt-3">
              <button
                onClick={() => setIsEditSheetOpen(false)}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 active:scale-[0.99] rounded-xl text-center text-sm font-black text-slate-500 transition-all"
              >
                {language === 'KR' ? '취소' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveMemo}
                disabled={isSavingMemo}
                className="flex-1 py-3.5 bg-[#1E293B] hover:bg-slate-800 text-white font-bold text-sm rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSavingMemo && <span className="material-symbols-outlined animate-spin text-sm">sync</span>}
                {t('history.save_changes') || '변경 사항 저장'}
              </button>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* 다이렉트 취소 확인 컨펌 다이얼로그 */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-red-500 text-[26px]">warning</span>
              </div>
              <h2 className="text-base font-black text-[#2d3435] mb-2">{language === 'KR' ? '정말 신청을 취소하시겠습니까?' : 'Are you sure you want to cancel?'}</h2>
              <p className="text-xs text-[#596061] font-semibold leading-relaxed">
                {language === 'KR' ? '이 작업은 취소 즉시 새로고침 없이 프로덕션 데이터에 실시간으로 반영됩니다.' : 'This will immediately cancel the application on the production server.'}
              </p>
            </div>
            <div className="px-6 pb-6 pt-2 flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-3.5 rounded-xl border border-[#e0e4e5] text-xs font-bold text-[#596061] hover:bg-[#f8f9fa] active:scale-95 transition-all"
              >
                {language === 'KR' ? '아니오' : 'No'}
              </button>
              <button
                onClick={handleCancelClick}
                className="flex-1 py-3.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center shadow-sm"
              >
                {language === 'KR' ? '예, 취소합니다' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
