'use client';

import React, { useState, useEffect, Suspense } from 'react';
import '@/styles/groupstayeditor.css';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { stayService } from '@/lib/firebase/stayService';
import { stayBookingService } from '@/lib/firebase/stayBookingService';
import { chatService } from '@/lib/firebase/chatService';
import { groupService } from '@/lib/firebase/groupService';
import { Stay, StayBookingStatus } from '@/types/stay';
import { Group } from '@/types/group';
import { sendSmsViaSolapi } from '@/app/actions/smsActions';

import { format, addDays } from 'date-fns';

function CheckoutContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const stayId = params.id as string;
  const { user, profile } = useAuth();
  
  const [stay, setStay] = useState<Stay | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [applicantName, setApplicantName] = useState('');
  const [countryCode, setCountryCode] = useState('+82');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [depositorName, setDepositorName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [nights, setNights] = useState(1);
  const [guests, setGuests] = useState(1);

  useEffect(() => {
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const g = searchParams.get('guests');
    
    const d1 = start ? new Date(start) : new Date(Date.now() + 86400000);
    const d2 = end ? new Date(end) : new Date(Date.now() + 86400000 * 3);
    setCheckIn(d1);
    setCheckOut(d2);
    setNights(Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))));
    setGuests(g ? parseInt(g, 10) : 1);
  }, [searchParams]);

  useEffect(() => {
    if (!stayId) return;
    const unsub = stayService.subscribeStay(stayId, async (data) => {
      setStay(data);
      if (data && data.groupId) {
        try {
          const g = await groupService.getGroup(data.groupId);
          setGroup(g);
        } catch (err) {
          console.error("Failed to fetch group", err);
        }
      }
      setIsLoading(false);
    });
    return () => unsub();
  }, [stayId]);

  useEffect(() => {
    if (profile || user) {
      const name = profile?.nickname || user?.displayName || '';
      setApplicantName(name);
      setDepositorName(name);
      
      const rawPhone = profile?.phoneNumber || '';
      if (rawPhone.startsWith('+82')) {
        setCountryCode('+82');
        setPhoneNumber(rawPhone.replace('+82', '').trim());
      } else if (rawPhone.startsWith('+')) {
        const parts = rawPhone.split(' ');
        if (parts.length > 1) {
          setCountryCode(parts[0]);
          setPhoneNumber(parts.slice(1).join(''));
        } else {
          setPhoneNumber(rawPhone);
        }
      } else {
        setPhoneNumber(rawPhone);
      }
    }
  }, [profile, user]);

  if (isLoading || !checkIn || !checkOut) {
    return (
      <div className="bg-surface font-sans text-on-surface min-h-[max(884px,100dvh)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="font-body-md text-on-surface-variant">Loading checkout...</span>
        </div>
      </div>
    );
  }

  if (!stay) {
    return (
      <div className="bg-surface font-sans text-on-surface min-h-[max(884px,100dvh)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl opacity-30">bed</span>
          <p className="font-body-md">스테이를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  // Calculate Prices
  const baseRate = stay.pricing?.baseRate || 0;
  const baseTotal = baseRate * nights;
  const cleaningFee = stay.pricing?.cleaningFee || 0;
  
  // 2024-2025 Korean Holidays (YYYY-MM-DD)
  const KOREAN_HOLIDAYS = [
    '2024-01-01', '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12',
    '2024-03-01', '2024-04-10', '2024-05-05', '2024-05-06', '2024-05-15',
    '2024-06-06', '2024-08-15', '2024-09-16', '2024-09-17', '2024-09-18',
    '2024-10-03', '2024-10-09', '2024-12-25',
    '2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30', '2025-03-01',
    '2025-03-03', '2025-05-05', '2025-05-06', '2025-06-06', '2025-08-15',
    '2025-10-03', '2025-10-05', '2025-10-06', '2025-10-07', '2025-10-09',
    '2025-12-25'
  ];

  let weekendNights = 0;
  let curr = new Date(checkIn);
  while (curr < checkOut) {
    const day = curr.getDay();
    const tomorrow = addDays(curr, 1);
    if (day === 5 || day === 6 || KOREAN_HOLIDAYS.includes(format(tomorrow, 'yyyy-MM-dd'))) { 
      weekendNights++;
    }
    curr.setDate(curr.getDate() + 1);
  }
  const weekendSurcharge = weekendNights * (stay.pricing?.weekendSurcharge || 0);

  const baseGuests = stay.pricing?.baseGuests ?? 1;
  const extraPersonFeePerNight = stay.pricing?.extraPersonFee || 0;
  const extraGuests = Math.max(0, guests - baseGuests);
  const extraPersonTotal = extraGuests * extraPersonFeePerNight * nights;

  const grandTotal = baseTotal + cleaningFee + weekendSurcharge + extraPersonTotal;

  const handleSubmit = async () => {
    if (!user) {
      alert("Please sign in first.");
      return;
    }
    if (!applicantName || !phoneNumber || !depositorName) {
      alert("Please fill in your name, contact number, and depositor name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const combinedContact = `${countryCode} ${phoneNumber}`;
      
      const booking = await stayBookingService.addBooking({
        stayId: stay.id,
        groupId: stay.groupId || 'freestyle-tango',
        stayTitle: stay.title,
        userId: user.uid,
        applicantName,
        userAvatar: profile?.photoURL || user.photoURL || '',
        contactNumber: combinedContact,
        checkIn,
        checkOut,
        nights,
        guests,
        pricing: {
          currency: stay.pricing?.currency || 'KRW',
          baseTotal,
          cleaningFee,
          weekendSurcharge,
          extraPersonFee: extraPersonTotal,
          grandTotal
        },
        payment: {
          method: 'bank_domestic',
          bankName: bankName,
          accountNumber: accountNumber,
          holderName: accountHolder,
          depositorName,
          depositDate: new Date().toISOString().split('T')[0] // today
        },
        status: 'APPLIED' as StayBookingStatus,
      });

      // Send SMS
      if (phoneNumber) {
        let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
        if (countryCode === '+82' && !formattedPhone.startsWith('0')) {
          formattedPhone = '0' + formattedPhone;
        }
        
        if (formattedPhone.startsWith('0') && formattedPhone.length >= 10) {
          // It's likely a domestic phone number, proceed
          const smsContent = `[WoC] 예약이 접수되었습니다.\n숙소: ${stay.title}\n일정: ${formatDate(checkIn)} - ${formatDate(checkOut)}\n예약자: ${applicantName}\n금액: ${grandTotal.toLocaleString()}원\n\n호스트의 확인 후 최종 확정됩니다.`;
          const smsResult = await sendSmsViaSolapi(
            formattedPhone,
            smsContent
          );
          
          await stayBookingService.addSmsLog(booking.id, {
            type: 'applied',
            sentAt: new Date().toISOString(),
            sentBy: user.uid,
            to: formattedPhone,
            message: smsContent,
            status: smsResult.success ? 'SUCCESS' : 'FAILED',
            errorMessage: smsResult.error || undefined
          });
        }
      }

      // ── Chat Notification to Host (Shop 패턴 동일 적용) ──
      try {
        const hostId = stay.host?.userId || 'adminstone';
        const roomId = await chatService.getOrCreatePrivateRoom(
          [user.uid, hostId], user.uid, 'business'
        );

        // 1. Stay Booking Info Message
        const stayBookingMsg = `🏨 [STAY BOOKING]\n` +
          `Stay: ${stay.title}\n` +
          `Dates: ${formatDate(checkIn)} - ${formatDate(checkOut)}\n` +
          `Nights: ${nights}\n` +
          `Guests: ${guests}\n` +
          `Amount: ${grandTotal.toLocaleString()} ${stay.pricing?.currency || 'KRW'}\n` +
          `Applicant: ${applicantName}\n` +
          `Image: ${stay.images?.[0] || ''}`;

        await chatService.sendMessage({
          roomId,
          senderId: user.uid,
          senderName: user.displayName || applicantName,
          text: stayBookingMsg,
          type: 'text'
        });
      } catch (chatErr) {
        console.error('Stay booking chat notification failed:', chatErr);
        // Don't block the flow if chat fails
      }

      router.push(`/stay/${stayId}/checkout/complete?bookingId=${booking.id}`);
    } catch (error: any) {
      console.error(error);
      alert("Booking request failed. " + (error.message || ''));
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getBankDetails = () => {
    if (group?.classPaymentSettings?.bankDetails) return group.classPaymentSettings.bankDetails;
    if (group?.staySettings?.bankDetails) return group.staySettings.bankDetails;
    if ((group as any)?.bankDetails) return (group as any).bankDetails;
    const stayBank = stay.payment?.methods?.find(m => m.type === 'bank_domestic') || stay.payment?.methods?.[0];
    if (stayBank) return stayBank;
    return null;
  };

  const rawBankMethod = getBankDetails();
  const bankName = rawBankMethod?.bankName || '';
  const accountNumber = rawBankMethod?.accountNumber || '';
  // Handle different naming conventions in Group vs Stay models
  const accountHolder = (rawBankMethod as any)?.ownerName || (rawBankMethod as any)?.accountHolder || (rawBankMethod as any)?.holderName || '';

  return (
    <div className="font-body-md text-on-surface bg-background min-h-[max(884px,100dvh)] relative">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 shadow-sm fixed top-0 z-50 w-full">
        <div className="flex items-center justify-between px-4 h-16 max-w-[896px] mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="active:scale-95 duration-200 p-2 hover:bg-slate-50 rounded-full transition-colors">
              <span className="material-symbols-outlined text-slate-500">arrow_back</span>
            </button>
            <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-on-surface">Confirm Reservation</h1>
          </div>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="pt-20 pb-[200px] px-4 max-w-[896px] mx-auto space-y-6">
        {/* Reservation Summary Section */}
        <section className="bg-surface-container-lowest rounded-xxl p-6 custom-shadow">
          <div className="flex flex-col">
            <div className="flex flex-col py-1">
              <div>
                <span className="inline-block px-2 py-1 bg-primary-fixed text-on-primary-fixed text-[10px] font-bold uppercase tracking-wider rounded mb-2">Selected Stay</span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">{stay.title}</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <p className="text-label-sm text-outline uppercase">Dates</p>
                  <p className="font-title-md text-on-surface">{formatDate(checkIn)} - {formatDate(checkOut)}</p>
                  <p className="text-label-sm text-on-surface-variant">{checkIn.getFullYear()} · {nights} nights</p>
                </div>
                <div>
                  <p className="text-label-sm text-outline uppercase">Guests</p>
                  <p className="font-title-md text-on-surface">{guests} Guests</p>
                  <p className="text-label-sm text-on-surface-variant">Entire home</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Guest Information Section (New Form Fields) */}
        <section className="bg-surface-container-lowest rounded-xxl p-6 custom-shadow">
          <h3 className="font-title-md text-on-surface mb-4">Guest Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-label-sm text-outline uppercase mb-2">Number of Guests</label>
              <div className="flex items-center gap-4 bg-surface-container-low rounded-xl p-2 w-fit border border-outline-variant">
                <button 
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  disabled={guests <= 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface hover:bg-surface-container-highest disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <span className="font-title-lg w-8 text-center">{guests}</span>
                <button 
                  onClick={() => setGuests(Math.min(4, guests + 1))}
                  disabled={guests >= 4}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface hover:bg-surface-container-highest disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
              <p className="text-body-sm text-on-surface-variant mt-2">Maximum 4 guests allowed.</p>
            </div>
            <div className="pt-2 border-t border-surface-variant/50"></div>
            <div>
              <label className="block text-label-sm text-outline uppercase mb-1">Applicant Name *</label>
              <input 
                type="text" 
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-label-sm text-outline uppercase mb-1">Contact Number (For SMS) *</label>
              <div className="flex gap-2">
                <select 
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-[120px] bg-surface-container-low border border-outline-variant rounded-xl px-2 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="+82">+82 (KR)</option>
                  <option value="+1">+1 (US/CA)</option>
                  <option value="+81">+81 (JP)</option>
                  <option value="+86">+86 (CN)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+33">+33 (FR)</option>
                  <option value="+49">+49 (DE)</option>
                  <option value="+61">+61 (AU)</option>
                  <option value="+886">+886 (TW)</option>
                  <option value="+852">+852 (HK)</option>
                </select>
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9-]/g, ''))}
                  className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. 010-1234-5678"
                />
              </div>
            </div>
            <div>
              <label className="block text-label-sm text-outline uppercase mb-1">Depositor Name *</label>
              <input 
                type="text" 
                value={depositorName}
                onChange={(e) => setDepositorName(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Name of person transferring funds"
              />
            </div>
          </div>
        </section>

        {/* Price Breakdown Section */}
        <section className="bg-surface-container-lowest rounded-xxl p-6 custom-shadow">
          <h3 className="font-title-md text-on-surface mb-4">Price Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-on-surface-variant">Base rate ({nights} nights)</p>
              <p className="font-semibold">{baseTotal.toLocaleString()} {stay.pricing?.currency || 'KRW'}</p>
            </div>
            {weekendSurcharge > 0 && (
              <div className="flex justify-between items-center">
                <p className="text-on-surface-variant">Weekend Surcharge ({weekendNights} nights)</p>
                <p className="font-semibold">{weekendSurcharge.toLocaleString()} {stay.pricing?.currency || 'KRW'}</p>
              </div>
            )}
            {extraPersonTotal > 0 && (
              <div className="flex justify-between items-center">
                <p className="text-on-surface-variant">Extra Person Fee ({extraGuests} extra guests)</p>
                <p className="font-semibold">{extraPersonTotal.toLocaleString()} {stay.pricing?.currency || 'KRW'}</p>
              </div>
            )}
            {cleaningFee > 0 && (
              <div className="flex justify-between items-center">
                <p className="text-on-surface-variant">Cleaning fee</p>
                <p className="font-semibold">{cleaningFee.toLocaleString()} {stay.pricing?.currency || 'KRW'}</p>
              </div>
            )}
            <div className="flex justify-between items-center pt-4 border-t border-surface-variant">
              <p className="font-bold text-lg">Total Amount</p>
              <p className="font-extrabold text-2xl text-primary-container">{grandTotal.toLocaleString()} {stay.pricing?.currency || 'KRW'}</p>
            </div>
          </div>
        </section>

        {/* Payment Info Section */}
        <section className="bg-surface-container-lowest rounded-xxl p-6 custom-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-title-md text-on-surface">Payment Information</h3>
            <span className="text-[10px] font-bold bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full uppercase">Bank Transfer</span>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4 relative group hover:bg-surface-container transition-colors">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-label-xs text-outline uppercase mb-1">Bank Name</p>
                <p className="font-semibold">{bankName || 'Unknown Bank'}</p>
              </div>
              <div>
                <p className="text-label-xs text-outline uppercase mb-1">Account Number</p>
                <p className="font-semibold">{accountNumber || 'Unknown Account'}</p>
              </div>
              <div>
                <p className="text-label-xs text-outline uppercase mb-1">Holder Name</p>
                <p className="font-semibold">{accountHolder || 'Unknown Holder'}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                if (accountNumber) {
                  navigator.clipboard.writeText(accountNumber);
                  alert("Account number copied!");
                }
              }}
              className="absolute top-4 right-4 text-primary p-2 hover:bg-primary-fixed rounded-lg transition-all active:scale-90"
            >
              <span className="material-symbols-outlined">content_copy</span>
            </button>
          </div>
          <p className="text-label-sm text-on-surface-variant mt-3 flex items-center gap-2 italic">
            <span className="material-symbols-outlined text-[16px]">info</span>
            Please complete the transfer within {stay.payment?.transferDeadlineHours || 2} hours to secure your booking.
          </p>
        </section>

        {/* Important Notes Section */}
        <section className="bg-surface-container-lowest rounded-xxl p-6 custom-shadow grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary-container">key</span>
              <h3 className="font-title-md text-on-surface">Check-in / Out</h3>
            </div>
            <ul className="space-y-2 text-on-surface-variant text-body-md">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant mt-1.5 shrink-0"></span>
                Check-in: After {stay.checkInTime || '15:00'}
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant mt-1.5 shrink-0"></span>
                Check-out: Before {stay.checkOutTime || '11:00'}
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant mt-1.5 shrink-0"></span>
                {stay.checkInMethod || 'Self check-in with door code'}
              </li>
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-error">event_busy</span>
              <h3 className="font-title-md text-on-surface">Cancellation Policy</h3>
            </div>
            <ul className="space-y-2 text-on-surface-variant text-body-md">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant mt-1.5 shrink-0"></span>
                {stay.cancellation?.policyText || 'Full refund for cancellations made within 48 hours of booking.'}
              </li>
            </ul>
          </div>
        </section>
      </main>

      {/* Sticky Bottom Action Button */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-50">
        <div className="max-w-[896px] mx-auto flex flex-col items-center">
          <label className="flex items-center gap-3 mb-4 cursor-pointer self-start w-full bg-surface-container-low p-3 rounded-xl border border-outline-variant hover:bg-surface-container transition-colors">
            <div className="relative flex items-center shrink-0">
              <input 
                type="checkbox" 
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="peer w-6 h-6 cursor-pointer appearance-none rounded-md border-2 border-outline checked:border-primary checked:bg-primary transition-all"
              />
              <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-[18px] opacity-0 peer-checked:opacity-100 pointer-events-none">check</span>
            </div>
            <span className="text-body-md text-on-surface leading-snug">
              I have read and agree to the <span className="underline font-semibold text-primary">House Rules</span> and <span className="underline font-semibold text-primary">Terms of Service</span>.
            </span>
          </label>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !agreedToTerms}
            className="w-full bg-primary-container disabled:bg-surface-container-highest disabled:text-on-surface/30 disabled:active:scale-100 text-white font-headline-lg py-4 rounded-xxl shadow-lg hover:bg-primary hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {isSubmitting ? 'Processing...' : 'Confirm & Submit'}
            {!isSubmitting && <span className="material-symbols-outlined">send</span>}
          </button>
        </div>
      </footer>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      
      <style jsx global>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .custom-shadow {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }
      `}</style>
      <Suspense fallback={
        <div className="bg-surface font-sans text-on-surface min-h-[max(884px,100dvh)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="font-body-md text-on-surface-variant">Loading checkout...</span>
          </div>
        </div>
      }>
        <CheckoutContent />
      </Suspense>
    </>
  );
}
