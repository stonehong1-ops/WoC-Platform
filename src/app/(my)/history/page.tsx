"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { classRegistrationService } from '@/lib/firebase/classRegistrationService';
import { groupService } from '@/lib/firebase/groupService';
import { notificationService } from '@/lib/firebase/notificationService';
import { ClassRegistration, Group } from '@/types/group';
import { Notification } from '@/types/notification';

import { useLanguage } from '@/contexts/LanguageContext';

const TABS = ['Needs Action', 'All', 'Class', 'Social', 'Shop', 'Stay'];


type StatusKey = 'PAYMENT_PENDING' | 'PAYMENT_REPORTED' | 'PAYMENT_COMPLETED' | 'CANCELED' | string;

function getStatusLabel(status: StatusKey, t: any): string {
  switch (status) {
    case 'PAYMENT_PENDING':   return t('history.status_pending');
    case 'PAYMENT_REPORTED':  return t('history.status_confirming');
    case 'PAYMENT_COMPLETED': return t('history.status_paid');
    default: return status.toUpperCase();
  }
}


function getStatusBadgeClass(status: StatusKey): string {
  switch (status) {
    case 'PAYMENT_PENDING':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'PAYMENT_REPORTED':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'PAYMENT_COMPLETED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    default:
      return 'bg-surface-container text-on-surface-variant border-outline-variant';
  }
}

function formatDate(reg: ClassRegistration, t: any, language: string): string {
  if (!reg.appliedAt) return t('history.date_recently');
  const d = reg.appliedAt.toDate ? reg.appliedAt.toDate() : new Date(reg.appliedAt as any);
  const locale = language === 'KR' ? 'ko-KR' : 'en-US';
  return d.toLocaleDateString(locale, { month: 'short', day: '2-digit', year: 'numeric' });
}


function formatFullDate(date: any, language: string): string {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  const locale = language === 'KR' ? 'ko-KR' : 'en-US';
  return d.toLocaleDateString(locale, { month: 'short', day: '2-digit', year: 'numeric' }) + ' • ' + d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatNotiDate(date: any, t: any, language: string): string {
  if (!date) return t('history.date_recently');
  const d = date.toDate ? date.toDate() : new Date(date);
  const locale = language === 'KR' ? 'ko-KR' : 'en-US';
  return d.toLocaleDateString(locale, { month: 'short', day: '2-digit', year: 'numeric' });
}


function HistoryContent() {
  const { t, language } = useLanguage();
  const { user, profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  
  const [activeTab, setActiveTab] = useState('Needs Action');
  const [uidRegistrations, setUidRegistrations] = useState<ClassRegistration[]>([]);
  const [phoneRegistrations, setPhoneRegistrations] = useState<ClassRegistration[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Derived state from URL for Detail Overlay
  const view = searchParams.get('view');
  const selectedId = searchParams.get('id');
  
  const [selectedDetail, setSelectedDetail] = useState<ClassRegistration | null>(null);
  const [groupDetails, setGroupDetails] = useState<Group | null>(null);

  // Sync selectedDetail with URL 'id'
  useEffect(() => {
    if (view === 'detail' && selectedId) {
      const found = registrations.find(r => r.id === selectedId);
      if (found) {
        setSelectedDetail(found);
      }
    } else {
      setSelectedDetail(null);
    }
  }, [view, selectedId, uidRegistrations, phoneRegistrations]);

  const registrations = React.useMemo(() => {
    const map = new Map<string, ClassRegistration>();
    uidRegistrations.forEach(r => map.set(r.id, r));
    phoneRegistrations.forEach(r => map.set(r.id, r));
    return Array.from(map.values()).sort((a, b) => {
      const timeA = a.appliedAt?.toMillis?.() || 0;
      const timeB = b.appliedAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
  }, [uidRegistrations, phoneRegistrations]);

  // Payment modal state (Local State + popstate)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTargetId, setPaymentTargetId] = useState<string | null>(null);
  const [depositorName, setDepositorName] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);

  // Handle Device Back Button for Payment Modal
  useEffect(() => {
    if (paymentModalOpen) {
      // Add a dummy entry to history so 'back' can close the modal
      window.history.pushState({ modal: 'payment' }, '');
      
      const handlePopState = () => {
        setPaymentModalOpen(false);
      };
      
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [paymentModalOpen]);

  useEffect(() => {
    if (!user) return;
    const unsubUid = classRegistrationService.subscribeToUserRegistrations(
      user.uid,
      (data) => setUidRegistrations(data)
    );

    let unsubPhone: (() => void) | null = null;
    let unsubPhone010: (() => void) | null = null;

    if (profile?.phoneNumber) {
      unsubPhone = classRegistrationService.subscribeToPhoneRegistrations(
        profile.phoneNumber,
        (data) => setPhoneRegistrations(prev => {
          const map = new Map([...prev.map(r => [r.id, r] as [string, ClassRegistration]), ...data.map(r => [r.id, r] as [string, ClassRegistration])]);
          return Array.from(map.values());
        })
      );
      
      // Also check 010 format if it's +82
      if (profile.phoneNumber.startsWith('+82')) {
        const localPhone = '0' + profile.phoneNumber.slice(3);
        unsubPhone010 = classRegistrationService.subscribeToPhoneRegistrations(
          localPhone,
          (data) => setPhoneRegistrations(prev => {
            const map = new Map([...prev.map(r => [r.id, r] as [string, ClassRegistration]), ...data.map(r => [r.id, r] as [string, ClassRegistration])]);
            return Array.from(map.values());
          })
        );
      }
    } else if (user.phoneNumber) {
      unsubPhone = classRegistrationService.subscribeToPhoneRegistrations(
        user.phoneNumber,
        (data) => setPhoneRegistrations(prev => {
          const map = new Map([...prev.map(r => [r.id, r] as [string, ClassRegistration]), ...data.map(r => [r.id, r] as [string, ClassRegistration])]);
          return Array.from(map.values());
        })
      );
      if (user.phoneNumber.startsWith('+82')) {
        const localPhone = '0' + user.phoneNumber.slice(3);
        unsubPhone010 = classRegistrationService.subscribeToPhoneRegistrations(
          localPhone,
          (data) => setPhoneRegistrations(prev => {
            const map = new Map([...prev.map(r => [r.id, r] as [string, ClassRegistration]), ...data.map(r => [r.id, r] as [string, ClassRegistration])]);
            return Array.from(map.values());
          })
        );
      }
    }

    let unsubNoti: (() => void) | null = null;
    
    if (user) {
      unsubNoti = notificationService.subscribeToUserNotifications(
        user.uid,
        (data) => setNotifications(data)
      );
    }

    return () => {
      unsubUid();
      if (unsubPhone) unsubPhone();
      if (unsubPhone010) unsubPhone010();
      if (unsubNoti) unsubNoti();
    };
  }, [user, profile?.phoneNumber]);

  useEffect(() => {
    if (selectedDetail?.groupId) {
      groupService.getGroup(selectedDetail.groupId).then(g => setGroupDetails(g));
    } else {
      setGroupDetails(null);
    }
  }, [selectedDetail]);

  const classItems = registrations.map(reg => ({
    ...reg,
    type: 'Class' as const,
    dateLabel: formatDate(reg, t, language),
    status: reg.status as StatusKey,
  }));


  const allItems = [...classItems];

  const filteredItems = activeTab === 'All'
    ? allItems
    : activeTab === 'Class'
      ? classItems
      : [];

  const todoNotis = notifications.filter(n => n.baseType === 'TODO' && !n.isCompleted);
  const infoNotis = notifications.filter(n => n.baseType === 'INFO' || (n.baseType === 'TODO' && n.isCompleted));

  const handlePaymentSubmit = async () => {
    const trimmedName = depositorName.trim();
    if (!trimmedName || !depositDate) {
      toast.error(t('history.toast_error_input'));
      return;
    }

    if (!paymentTargetId) return;
    try {
      await classRegistrationService.updateRegistration(paymentTargetId, {
        status: 'PAYMENT_REPORTED',
        depositorName: trimmedName,
        depositDate
      });
      toast.success(t('history.toast_success_report'), { description: t('history.toast_success_desc') });

      setPaymentModalOpen(false);
      setDepositorName('');
      
      // Update selected detail if it's currently open
      if (selectedDetail?.id === paymentTargetId) {
        setSelectedDetail({
          ...selectedDetail,
          status: 'PAYMENT_REPORTED',
          depositorName: trimmedName,
          depositDate
        });
      }
    } catch {
      toast.error(t('history.toast_error_process'));
    }

  };

  const handleCopyAccount = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(t('history.toast_copy_account'));
    });

  };

  // Find class/bundle/pass specific details
  let itemInfo: any = null;
  if (selectedDetail && groupDetails) {
    if (selectedDetail.itemType === 'discount') {
      itemInfo = groupDetails.discounts?.find(d => d.id === selectedDetail.classId);
    } else if (selectedDetail.itemType === 'monthlyPass') {
      itemInfo = groupDetails.monthlyPasses?.find(p => p.id === selectedDetail.classId);
    } else {
      itemInfo = groupDetails.classes?.find(c => c.id === selectedDetail.classId);
    }
  }

  // Use group payment settings or class specific
  const bankInfo = itemInfo?.bankName && itemInfo?.accountNumber 
    ? { bankName: itemInfo.bankName, accountNumber: itemInfo.accountNumber, accountHolder: itemInfo.accountHolder } 
    : groupDetails?.classPaymentSettings?.bankDetails;

  const handleOpenDetail = (item: ClassRegistration) => {
    // URL-based open
    router.push(`/history?view=detail&id=${item.id}`, { scroll: false });
  };

  const handleCloseDetail = () => {
    // URL contains ?view=detail&id=...
    // We want to remove these parameters. Using router.back() is best if we came from the list.
    // If entered directly via link, we replace to /history.
    if (view === 'detail') {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.replace('/history', { scroll: false });
      }
    }
  };

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
                    ? tab === 'Needs Action' ? 'bg-[#FF3B30] text-white shadow-sm' : 'bg-[#1E293B] text-white shadow-sm'
                    : tab === 'Needs Action' ? 'bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 hover:bg-[#FF3B30]/20' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
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
          {activeTab === 'Needs Action' && (
            <>
              {todoNotis.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                  <span className="material-symbols-outlined text-outline text-5xl">
                    {activeTab === 'Needs Action' ? 'task_alt' : 'notifications'}
                  </span>
                  <p className="text-[1.125rem] font-bold leading-[1.5rem] font-['Plus_Jakarta_Sans'] text-on-surface">
                    {activeTab === 'Needs Action' ? t('history.no_pending') : t('history.no_alerts')}
                  </p>
                  <p className="text-[0.875rem] font-medium leading-[1.25rem] font-['Inter'] text-on-surface-variant">
                    {activeTab === 'Needs Action' ? t('history.caught_up') : t('history.update_notify')}
                  </p>

                </div>
              )}
              {todoNotis.map(noti => (
                <article
                  key={noti.id}
                  className={`bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 hover:border-outline-variant transition-colors flex flex-col overflow-hidden cursor-pointer ${noti.isRead ? 'opacity-75' : ''}`}
                  onClick={() => {
                    if (!noti.isRead) {
                      notificationService.markAsRead(noti.id);
                    }
                    if (noti.referenceId) {
                      // Attempt to open detail if it's a registration
                      const foundReg = registrations.find(r => r.id === noti.referenceId);
                      if (foundReg) {
                        handleOpenDetail(foundReg);
                      } else {
                        // If not found in registrations, maybe another type. For now just toast
                        if (noti.actionUrl) {
                          router.push(noti.actionUrl);
                        }
                      }
                    } else if (noti.actionUrl) {
                       router.push(noti.actionUrl);
                    }
                  }}
                >
                  <div className="p-4 flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">
                        {noti.baseType === 'TODO' ? 'assignment_late' : 'info'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                      {noti.groupName && (
                        <span className="text-[0.75rem] font-semibold leading-[1rem] font-['Inter'] text-on-surface-variant uppercase tracking-wide">
                          {noti.groupName}
                        </span>
                      )}
                      <h2 className="text-[1.125rem] font-bold leading-[1.5rem] font-['Plus_Jakarta_Sans'] text-on-surface">
                        {noti.title}
                      </h2>
                      <p className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface-variant">
                        {noti.message}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1.5 text-on-surface-variant text-[0.75rem] font-semibold leading-[1rem] font-['Inter']">
                          <span className="material-symbols-outlined text-[16px]">schedule</span>
                          <span>{formatNotiDate(noti.createdAt, t, language)}</span>

                        </div>
                        {noti.baseType === 'TODO' && !noti.isCompleted && (
                          <span className="font-['Inter'] text-[10px] font-bold leading-[1rem] px-2.5 py-1 rounded-full whitespace-nowrap uppercase tracking-wide bg-orange-100 text-orange-800 border border-orange-200">
                            {t('history.action_required')}

                          </span>
                        )}
                        {noti.isCompleted && (
                          <span className="font-['Inter'] text-[10px] font-bold leading-[1rem] px-2.5 py-1 rounded-full whitespace-nowrap uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">check</span> {t('history.completed')}

                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </>
          )}

          {activeTab !== 'Needs Action' && filteredItems.length === 0 && (
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

          {activeTab !== 'Needs Action' && filteredItems.map(item => (
            <article
              key={item.id}
              className={`bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 hover:border-outline-variant transition-colors flex flex-col overflow-hidden cursor-pointer ${item.status === 'PAYMENT_COMPLETED' ? 'opacity-75' : ''}`}
              onClick={() => handleOpenDetail(item as any)}
            >
              <div className="p-4 flex justify-between items-start gap-4">
                <div className="flex flex-col gap-1.5">
                  {item.groupName && (
                    <span className="text-[0.75rem] font-semibold leading-[1rem] font-['Inter'] text-on-surface-variant uppercase tracking-wide">
                      {item.groupName}
                    </span>
                  )}
                  <h2 className="text-[1.125rem] font-bold leading-[1.5rem] font-['Plus_Jakarta_Sans'] text-on-surface">
                    {item.classTitle}
                  </h2>
                  <div className="flex items-center gap-1.5 text-on-surface-variant text-[0.75rem] font-semibold leading-[1rem] font-['Inter']">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    <span>{item.dateLabel}</span>
                  </div>
                </div>

                <span className={`font-['Inter'] text-[10px] font-bold leading-[1rem] px-2.5 py-1 rounded-full whitespace-nowrap uppercase tracking-wide flex items-center gap-1 ${getStatusBadgeClass(item.status)}`}>
                  {item.status === 'PAYMENT_COMPLETED' && (
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  )}
                  {getStatusLabel(item.status, t)}

                </span>
              </div>

              {item.status === 'PAYMENT_PENDING' && (
                <div className="bg-surface-container-low/50 px-4 py-3 border-t border-outline-variant/30 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPaymentTargetId(item.id);
                      setPaymentModalOpen(true);
                    }}
                    className="bg-primary text-on-primary hover:bg-[#0b5ac0] font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">credit_card</span>
                    {t('history.confirm_payment')}

                  </button>
                </div>
              )}

              {item.status === 'PAYMENT_REPORTED' && (
                <div className="bg-surface-container-low/50 px-4 py-3 border-t border-outline-variant/30 flex justify-end">
                  <span className="text-[0.75rem] font-semibold leading-[1rem] font-['Inter'] text-orange-600 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">hourglass_top</span>
                    {t('history.verifying')}

                  </span>
                </div>
              )}
            </article>
          ))}
        </main>
      )}

      {/* Detail Overlay - Full Popup */}
      {selectedDetail && (
        <div className="fixed inset-0 bg-[#FAF8FF] z-[100] overflow-y-auto animate-in slide-in-from-right duration-300">
          <header className="bg-white/80 backdrop-blur-xl fixed top-0 left-0 w-full z-[101] flex justify-between items-center px-4 h-16 border-b border-slate-100">
            <button 
              onClick={handleCloseDetail}
              className="text-[#0057bd] hover:bg-slate-100 transition-colors active:scale-95 duration-200 p-2 rounded-full flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="text-[#0057bd] font-['Plus_Jakarta_Sans'] uppercase italic font-black tracking-tight text-[1.125rem]">
              {t('history.app_details')}

            </h1>
            <div className="w-10"></div> {/* Spacer for balance */}
          </header>

          <main className="max-w-[896px] mx-auto pt-24 pb-32 px-6 flex flex-col gap-4">
            
            {/* Summary Card */}
            <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-high relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-24 h-24 bg-surface-container-highest rounded-bl-full -z-10 opacity-50"></div>
              <div className="flex justify-between items-start mb-4">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-['Inter'] text-[10px] font-bold leading-[1rem] tracking-wide uppercase border ${getStatusBadgeClass(selectedDetail.status)}`}>
                  {selectedDetail.status === 'PAYMENT_COMPLETED' ? (
                     <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  ) : selectedDetail.status === 'PAYMENT_REPORTED' ? (
                     <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
                  ) : (
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>pending</span>
                  )}
                  {getStatusLabel(selectedDetail.status, t)}

                </div>
                <span className="text-on-surface-variant font-['Inter'] text-[0.75rem] font-semibold leading-[1rem]">{formatDate(selectedDetail, t, language)}</span>

              </div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-[1.5rem] font-bold leading-[2rem] tracking-[-0.025em] text-on-surface mb-1">{selectedDetail.classTitle}</h2>
              <p className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface-variant">{t('history.app_id')}: #{selectedDetail.id.slice(0,8).toUpperCase()}</p>

            </section>

            {/* Status Timeline */}
            <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-high">
              <h3 className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface mb-4 border-b border-surface-container pb-2">{t('history.timeline')}</h3>

              <div className="relative border-l-2 border-surface-container ml-3 space-y-6 pb-2">
                
                {/* Step 1: Application Submitted */}
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5 ring-4 ring-surface-container-lowest"></div>
                  <div className="flex flex-col">
                    <span className="font-['Inter'] text-[0.875rem] font-bold text-on-surface">{t('history.step_submitted')}</span>

                    <span className="font-['Inter'] text-[0.75rem] text-on-surface-variant mt-0.5">{formatFullDate(selectedDetail.appliedAt, language)}</span>
                  </div>
                </div>

                {/* Step 2: Payment Reported */}
                <div className="relative pl-6">
                  <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1.5 ring-4 ring-surface-container-lowest transition-colors ${selectedDetail.status !== 'PAYMENT_PENDING' ? 'bg-primary' : 'bg-surface-container border-2 border-outline-variant'}`}></div>
                  <div className="flex flex-col">
                    <span className={`font-['Inter'] text-[0.875rem] font-bold ${selectedDetail.status !== 'PAYMENT_PENDING' ? 'text-on-surface' : 'text-outline-variant'}`}>{t('history.step_reported')}</span>

                    {selectedDetail.status !== 'PAYMENT_PENDING' ? (
                      <span className="font-['Inter'] text-[0.75rem] text-on-surface-variant mt-0.5">
                        {selectedDetail.depositDate} • {t('history.depositor_name')}: {selectedDetail.depositorName}

                      </span>
                    ) : (
                      <span className="font-['Inter'] text-[0.75rem] text-outline-variant mt-0.5">{t('history.waiting_payment')}</span>

                    )}
                  </div>
                </div>

                {/* Step 3: Registration Complete */}
                <div className="relative pl-6">
                  <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1.5 ring-4 ring-surface-container-lowest transition-colors ${selectedDetail.status === 'PAYMENT_COMPLETED' ? 'bg-primary' : 'bg-surface-container border-2 border-outline-variant'}`}></div>
                  <div className="flex flex-col">
                    <span className={`font-['Inter'] text-[0.875rem] font-bold ${selectedDetail.status === 'PAYMENT_COMPLETED' ? 'text-on-surface' : 'text-outline-variant'}`}>{t('history.step_complete')}</span>

                    {selectedDetail.status === 'PAYMENT_COMPLETED' && selectedDetail.confirmedAt ? (
                      <span className="font-['Inter'] text-[0.75rem] text-on-surface-variant mt-0.5">{formatFullDate(selectedDetail.confirmedAt, language)}</span>
                    ) : (
                      <span className="font-['Inter'] text-[0.75rem] text-outline-variant mt-0.5">{t('history.pending_admin')}</span>

                    )}
                  </div>
                </div>

              </div>
            </section>

            {/* Information Grid */}
            <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-high">
              <h3 className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface mb-4 border-b border-surface-container pb-2">
                {selectedDetail.itemType === 'discount' ? t('history.info_bundle') : selectedDetail.itemType === 'monthlyPass' ? t('history.info_pass') : t('history.info_class')}

              </h3>
              <div className="flex flex-col gap-4">
                
                {selectedDetail.itemType === 'class' && itemInfo && (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 text-primary">
                        <span className="material-symbols-outlined">person</span>
                      </div>
                      <div>
                        <p className="font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] text-on-surface-variant mb-0.5">{t('history.instructor')}</p>

                        <p className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface">
                          {itemInfo.instructors?.map((i: any) => i.name).join(', ') || 'TBD'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 text-primary">
                        <span className="material-symbols-outlined">location_on</span>
                      </div>
                      <div>
                        <p className="font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] text-on-surface-variant mb-0.5">{t('history.venue')}</p>

                        <p className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface">{selectedDetail.groupName || 'Freestyle Studio'}</p>
                      </div>
                    </div>
                    {itemInfo.schedule && itemInfo.schedule.length > 0 && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 text-primary">
                          <span className="material-symbols-outlined">calendar_month</span>
                        </div>
                        <div>
                          <p className="font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] text-on-surface-variant mb-0.5">{t('history.schedule')} ({itemInfo.schedule.length} {t('history.sessions')})</p>

                          <ul className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface list-disc list-inside marker:text-surface-variant">
                            {itemInfo.schedule.map((s: any, i: number) => (
                              <li key={i}>{s.date} {s.timeSlot}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {(selectedDetail.itemType === 'discount' || selectedDetail.itemType === 'monthlyPass') && itemInfo && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 text-primary">
                      <span className="material-symbols-outlined">list_alt</span>
                    </div>
                    <div>
                      <p className="font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] text-on-surface-variant mb-0.5">{t('history.included_classes')}</p>

                      <ul className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface list-disc list-inside marker:text-surface-variant">
                        {itemInfo.includedClassIds?.map((cId: string, idx: number) => {
                          const cls = groupDetails?.classes?.find(c => c.id === cId);
                          return <li key={idx}>{cls?.title || 'Unknown Class'}</li>;
                        })}
                      </ul>
                    </div>
                  </div>
                )}
                
                {!itemInfo && (
                  <p className="font-['Inter'] text-[0.875rem] text-on-surface-variant">{t('history.loading')}</p>

                )}

              </div>
            </section>

            {/* Payment Details */}
            <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-high">
              <h3 className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface mb-4 border-b border-surface-container pb-2">{t('history.payment_details')}</h3>

              <div className="flex justify-between items-center mb-3">
                <span className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface-variant">{t('history.method')}</span>
                <span className="font-['Inter'] text-[0.875rem] font-semibold leading-[1.25rem] text-on-surface">{t('history.bank_transfer')}</span>

              </div>
              <div className="flex justify-between items-center">
                <span className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface-variant">{t('history.total_amount')}</span>

                <span className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-primary">
                  {selectedDetail.amount.toLocaleString()} {selectedDetail.currency}
                </span>
              </div>
            </section>

            {/* Bank Transfer Info Card */}
            {bankInfo && (
              <section className="bg-surface-container-low rounded-xl p-4 border border-surface-variant relative">
                <div className="absolute top-4 right-4 text-primary opacity-20">
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
                </div>
                <h4 className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">info</span>
                  {t('history.transfer_info')}

                </h4>
                <div className="bg-surface-container-lowest rounded-lg p-3 border border-surface-container-high">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex justify-between">
                      <span className="font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] text-on-surface-variant">{t('history.bank')}</span>

                      <span className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface">{bankInfo.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] text-on-surface-variant">{t('history.account_number')}</span>

                      <div className="flex items-center gap-2">
                        <span className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface font-mono">{bankInfo.accountNumber}</span>
                        <button 
                          onClick={() => handleCopyAccount(bankInfo.accountNumber)}
                          aria-label="Copy account number" 
                          className="text-primary hover:text-primary-container transition-colors focus:outline-none"
                        >
                          <span className="material-symbols-outlined text-[16px]">content_copy</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] text-on-surface-variant">{t('history.account_holder')}</span>

                      <span className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface">{bankInfo.accountHolder}</span>
                    </div>
                  </div>
                </div>
                {selectedDetail.status === 'PAYMENT_PENDING' && (
                  <p className="font-['Inter'] text-[10px] font-bold leading-[1rem] text-on-surface-variant mt-3 text-center">
                    {t('history.transfer_prompt')}

                  </p>
                )}
              </section>
            )}
          </main>

          {/* Bottom Action Area */}
          {selectedDetail.status === 'PAYMENT_PENDING' && (
            <div className="fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur-md border-t border-surface-container z-40 pb-safe pt-4 px-6 max-w-[896px] left-1/2 -translate-x-1/2">
              <div className="mb-4">
                <button 
                  onClick={() => {
                    setPaymentTargetId(selectedDetail.id);
                    setPaymentModalOpen(true);
                  }}
                  className="w-full bg-primary-container text-on-primary-container font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] py-4 rounded-xl shadow-[0_4px_14px_rgba(0,87,189,0.2)] hover:bg-primary transition-colors active:scale-[0.98] duration-200 flex items-center justify-center gap-2"
                >
                  {t('history.confirm_payment')}

                  <span className="material-symbols-outlined">check_circle</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-[24px] p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-[1.125rem] font-bold leading-[1.5rem] font-['Plus_Jakarta_Sans'] text-on-surface mb-1">
              {t('history.modal_title')}

            </h3>
            <p className="text-[0.75rem] font-medium leading-[1rem] font-['Inter'] text-on-surface-variant mb-6">
              {t('history.modal_desc')}

            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[0.75rem] font-bold text-on-surface mb-1">{t('history.depositor_name')}</label>

                <input
                  type="text"
                  value={depositorName}
                  onChange={(e) => setDepositorName(e.target.value)}
                  placeholder={t('history.name_placeholder')}

                  className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-[0.875rem] font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[0.75rem] font-bold text-on-surface mb-1">{t('history.deposit_date')}</label>

                <input
                  type="date"
                  value={depositDate}
                  onChange={(e) => setDepositDate(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-[0.875rem] font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setPaymentModalOpen(false); setDepositorName(''); }}
                className="flex-1 py-3 bg-surface-container text-on-surface-variant font-bold text-[0.875rem] rounded-xl hover:bg-surface-container-high transition-colors"
              >
                {t('history.cancel')}

              </button>
              <button
                onClick={handlePaymentSubmit}
                className="flex-1 py-3 bg-primary text-on-primary font-bold text-[0.875rem] rounded-xl hover:bg-[#0b5ac0] transition-colors shadow-lg shadow-primary/20"
              >
                {t('history.confirm')}

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

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}
