"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/AuthProvider';
import { classRegistrationService } from '@/lib/firebase/classRegistrationService';
import { groupService } from '@/lib/firebase/groupService';
import { ClassRegistration, Group } from '@/types/group';

const TABS = ['All', 'Class', 'Social', 'Shop', 'Stay', 'Service', 'Events'];

type StatusKey = 'PAYMENT_PENDING' | 'PAYMENT_REPORTED' | 'PAYMENT_COMPLETED' | 'CANCELED' | string;

function getStatusLabel(status: StatusKey): string {
  switch (status) {
    case 'PAYMENT_PENDING':   return 'PAYMENT PENDING';
    case 'PAYMENT_REPORTED':  return 'CONFIRMING...';
    case 'PAYMENT_COMPLETED': return 'PAID';
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

function formatDate(reg: ClassRegistration): string {
  if (!reg.appliedAt) return 'Recently';
  const d = reg.appliedAt.toDate ? reg.appliedAt.toDate() : new Date(reg.appliedAt as any);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function formatFullDate(date: any): string {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + ' • ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function HistoryPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('All');
  const [uidRegistrations, setUidRegistrations] = useState<ClassRegistration[]>([]);
  const [phoneRegistrations, setPhoneRegistrations] = useState<ClassRegistration[]>([]);

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

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTargetId, setPaymentTargetId] = useState<string | null>(null);
  const [depositorName, setDepositorName] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);

  // Detail view state
  const [selectedDetail, setSelectedDetail] = useState<ClassRegistration | null>(null);
  const [groupDetails, setGroupDetails] = useState<Group | null>(null);

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

    return () => {
      unsubUid();
      if (unsubPhone) unsubPhone();
      if (unsubPhone010) unsubPhone010();
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
    dateLabel: formatDate(reg),
    status: reg.status as StatusKey,
  }));

  const allItems = [...classItems];

  const filteredItems = activeTab === 'All'
    ? allItems
    : activeTab === 'Class'
      ? classItems
      : [];

  const handlePaymentSubmit = async () => {
    const trimmedName = depositorName.trim();
    if (!trimmedName || !depositDate) {
      toast.error("입금자명과 입금일을 정확히 입력해주세요.");
      return;
    }
    if (!paymentTargetId) return;
    try {
      await classRegistrationService.updateRegistration(paymentTargetId, {
        status: 'PAYMENT_REPORTED',
        depositorName: trimmedName,
        depositDate
      });
      toast.success("입금 완료 처리가 접수되었습니다.", { description: "관리자 확인 후 최종 완료됩니다." });
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
      toast.error("처리 중 오류가 발생했습니다.");
    }
  };

  const handleCopyAccount = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("계좌번호가 복사되었습니다.");
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

  return (
    <div className="min-h-screen bg-background text-on-background pb-24 font-['Inter']">

      {/* Scrollable Tab Bar */}
      {!selectedDetail && (
        <div className="w-full bg-surface/90 backdrop-blur-xl border-b border-slate-100 overflow-x-auto sticky top-0 z-30 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex items-center gap-2 px-4 py-3 min-w-max">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-[0.75rem] font-semibold leading-[1rem] transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-primary-container text-on-primary-container shadow-sm border border-transparent'
                    : 'border border-outline-variant text-on-surface hover:bg-surface-variant'
                }`}
              >
                {tab}
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
                {activeTab === 'All' ? 'No activity history yet.' : `No ${activeTab} history yet.`}
              </p>
              <p className="text-[0.875rem] font-medium leading-[1.25rem] font-['Inter'] text-on-surface-variant">
                {activeTab === 'Class'
                  ? 'When you register for a class, it will appear here.'
                  : 'This section is coming soon.'}
              </p>
            </div>
          )}

          {filteredItems.map(item => (
            <article
              key={item.id}
              className={`bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 hover:border-outline-variant transition-colors flex flex-col overflow-hidden cursor-pointer ${item.status === 'PAYMENT_COMPLETED' ? 'opacity-75' : ''}`}
              onClick={() => setSelectedDetail(item as any)}
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
                  {getStatusLabel(item.status)}
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
                    Confirm Payment
                  </button>
                </div>
              )}

              {item.status === 'PAYMENT_REPORTED' && (
                <div className="bg-surface-container-low/50 px-4 py-3 border-t border-outline-variant/30 flex justify-end">
                  <span className="text-[0.75rem] font-semibold leading-[1rem] font-['Inter'] text-orange-600 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">hourglass_top</span>
                    Verifying with admin...
                  </span>
                </div>
              )}
            </article>
          ))}
        </main>
      )}

      {/* Detail Overlay */}
      {selectedDetail && (
        <div className="fixed inset-0 bg-surface z-40 overflow-y-auto">
          <header className="bg-surface/80 backdrop-blur-xl docked full-width top-0 border-b border-slate-200 shadow-sm fixed left-0 w-full z-50 flex justify-between items-center px-6 h-16 max-w-[896px] left-1/2 -translate-x-1/2">
            <button 
              onClick={() => setSelectedDetail(null)}
              className="text-[#0057bd] hover:bg-slate-100 transition-colors active:scale-95 duration-200 p-2 -ml-2 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-container"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h1 className="text-[#0057bd] font-['Plus_Jakarta_Sans'] uppercase italic font-bold tracking-tight text-[1.125rem] leading-[1.5rem]">
              Application Details
            </h1>
            <button className="text-[#0057bd] hover:bg-slate-100 transition-colors active:scale-95 duration-200 p-2 -mr-2 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-container">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
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
                  {getStatusLabel(selectedDetail.status)}
                </div>
                <span className="text-on-surface-variant font-['Inter'] text-[0.75rem] font-semibold leading-[1rem]">{formatDate(selectedDetail)}</span>
              </div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-[1.5rem] font-bold leading-[2rem] tracking-[-0.025em] text-on-surface mb-1">{selectedDetail.classTitle}</h2>
              <p className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface-variant">Application ID: #{selectedDetail.id.slice(0,8).toUpperCase()}</p>
            </section>

            {/* Status Timeline */}
            <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-high">
              <h3 className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface mb-4 border-b border-surface-container pb-2">Status Timeline</h3>
              <div className="relative border-l-2 border-surface-container ml-3 space-y-6 pb-2">
                
                {/* Step 1: Application Submitted */}
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5 ring-4 ring-surface-container-lowest"></div>
                  <div className="flex flex-col">
                    <span className="font-['Inter'] text-[0.875rem] font-bold text-on-surface">Application Submitted</span>
                    <span className="font-['Inter'] text-[0.75rem] text-on-surface-variant mt-0.5">{formatFullDate(selectedDetail.appliedAt)}</span>
                  </div>
                </div>

                {/* Step 2: Payment Reported */}
                <div className="relative pl-6">
                  <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1.5 ring-4 ring-surface-container-lowest transition-colors ${selectedDetail.status !== 'PAYMENT_PENDING' ? 'bg-primary' : 'bg-surface-container border-2 border-outline-variant'}`}></div>
                  <div className="flex flex-col">
                    <span className={`font-['Inter'] text-[0.875rem] font-bold ${selectedDetail.status !== 'PAYMENT_PENDING' ? 'text-on-surface' : 'text-outline-variant'}`}>Payment Reported</span>
                    {selectedDetail.status !== 'PAYMENT_PENDING' ? (
                      <span className="font-['Inter'] text-[0.75rem] text-on-surface-variant mt-0.5">
                        {selectedDetail.depositDate} • Depositor: {selectedDetail.depositorName}
                      </span>
                    ) : (
                      <span className="font-['Inter'] text-[0.75rem] text-outline-variant mt-0.5">Waiting for payment</span>
                    )}
                  </div>
                </div>

                {/* Step 3: Registration Complete */}
                <div className="relative pl-6">
                  <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1.5 ring-4 ring-surface-container-lowest transition-colors ${selectedDetail.status === 'PAYMENT_COMPLETED' ? 'bg-primary' : 'bg-surface-container border-2 border-outline-variant'}`}></div>
                  <div className="flex flex-col">
                    <span className={`font-['Inter'] text-[0.875rem] font-bold ${selectedDetail.status === 'PAYMENT_COMPLETED' ? 'text-on-surface' : 'text-outline-variant'}`}>Registration Complete</span>
                    {selectedDetail.status === 'PAYMENT_COMPLETED' && selectedDetail.confirmedAt ? (
                      <span className="font-['Inter'] text-[0.75rem] text-on-surface-variant mt-0.5">{formatFullDate(selectedDetail.confirmedAt)}</span>
                    ) : (
                      <span className="font-['Inter'] text-[0.75rem] text-outline-variant mt-0.5">Pending admin confirmation</span>
                    )}
                  </div>
                </div>

              </div>
            </section>

            {/* Information Grid */}
            <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-high">
              <h3 className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface mb-4 border-b border-surface-container pb-2">
                {selectedDetail.itemType === 'discount' ? 'Bundle Information' : selectedDetail.itemType === 'monthlyPass' ? 'Pass Information' : 'Class Information'}
              </h3>
              <div className="flex flex-col gap-4">
                
                {selectedDetail.itemType === 'class' && itemInfo && (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 text-primary">
                        <span className="material-symbols-outlined">person</span>
                      </div>
                      <div>
                        <p className="font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] text-on-surface-variant mb-0.5">Instructor</p>
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
                        <p className="font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] text-on-surface-variant mb-0.5">Venue</p>
                        <p className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface">{selectedDetail.groupName || 'Freestyle Studio'}</p>
                      </div>
                    </div>
                    {itemInfo.schedule && itemInfo.schedule.length > 0 && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 text-primary">
                          <span className="material-symbols-outlined">calendar_month</span>
                        </div>
                        <div>
                          <p className="font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] text-on-surface-variant mb-0.5">Schedule ({itemInfo.schedule.length} Sessions)</p>
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
                      <p className="font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] text-on-surface-variant mb-0.5">Included Classes</p>
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
                  <p className="font-['Inter'] text-[0.875rem] text-on-surface-variant">Loading details...</p>
                )}

              </div>
            </section>

            {/* Payment Details */}
            <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-high">
              <h3 className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface mb-4 border-b border-surface-container pb-2">Payment Details</h3>
              <div className="flex justify-between items-center mb-3">
                <span className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface-variant">Method</span>
                <span className="font-['Inter'] text-[0.875rem] font-semibold leading-[1.25rem] text-on-surface">Bank Transfer</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface-variant">Total Amount</span>
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
                  Transfer Information
                </h4>
                <div className="bg-surface-container-lowest rounded-lg p-3 border border-surface-container-high">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex justify-between">
                      <span className="font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] text-on-surface-variant">Bank</span>
                      <span className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface">{bankInfo.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] text-on-surface-variant">Account Number</span>
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
                      <span className="font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] text-on-surface-variant">Account Holder</span>
                      <span className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface">{bankInfo.accountHolder}</span>
                    </div>
                  </div>
                </div>
                {selectedDetail.status === 'PAYMENT_PENDING' && (
                  <p className="font-['Inter'] text-[10px] font-bold leading-[1rem] text-on-surface-variant mt-3 text-center">
                    Please complete the transfer to secure your spot.
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
                  Confirm Payment
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
              입금 완료 보고
            </h3>
            <p className="text-[0.75rem] font-medium leading-[1rem] font-['Inter'] text-on-surface-variant mb-6">
              입금하신 분의 성함과 입금일을 입력해주세요.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[0.75rem] font-bold text-on-surface mb-1">입금자명</label>
                <input
                  type="text"
                  value={depositorName}
                  onChange={(e) => setDepositorName(e.target.value)}
                  placeholder="예: 홍길동"
                  className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-[0.875rem] font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[0.75rem] font-bold text-on-surface mb-1">입금일</label>
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
                취소
              </button>
              <button
                onClick={handlePaymentSubmit}
                className="flex-1 py-3 bg-primary text-on-primary font-bold text-[0.875rem] rounded-xl hover:bg-[#0b5ac0] transition-colors shadow-lg shadow-primary/20"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
