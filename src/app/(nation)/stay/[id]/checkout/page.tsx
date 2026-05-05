'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
import SectionCard from '@/components/ui/SectionCard';
import InfoRow from '@/components/ui/InfoRow';

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
      alert("로그인이 필요합니다.");
      return;
    }
    if (!applicantName || !phoneNumber || !depositorName) {
      alert("신청자 성함, 연락처, 입금자명을 모두 입력해주세요.");
      return;
    }

    const currentBankName = bankName;
    const currentAccountNumber = accountNumber;
    const currentAccountHolder = accountHolder;

    if (!currentAccountNumber) {
      alert("결제 계좌 정보가 설정되지 않았습니다. 호스트에게 문의해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const combinedContact = `${countryCode} ${phoneNumber}`;
      
      const booking = await stayBookingService.addBooking({
        stayId: stay.id,
        groupId: stay.groupId || 'freestyle-tango',
        hostId: stay.host?.userId || 'adminstone',
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
          bankName: currentBankName,
          accountNumber: currentAccountNumber,
          holderName: currentAccountHolder,
          depositorName,
          depositDate: format(new Date(), 'yyyy-MM-dd')
        },
        status: 'APPLIED' as StayBookingStatus,
      });

      // Update wishlist status to in_progress (Shop pattern)
      try {
        await stayService.setStayInProgressStatus(user.uid, stay.id);
      } catch (e) {
        console.error('Failed to update stay to in_progress:', e);
      }

      // Send SMS
      if (phoneNumber) {
        let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
        if (countryCode === '+82' && !formattedPhone.startsWith('0')) {
          formattedPhone = '0' + formattedPhone;
        }
        
        if (formattedPhone.startsWith('0') && formattedPhone.length >= 10) {
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
      }

      router.push(`/stay/${stayId}/checkout/complete?bookingId=${booking.id}`);
    } catch (error: any) {
      console.error(error);
      alert("예약 신청에 실패했습니다. " + (error.message || ''));
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getBankDetails = () => {
    // 1. Group Stay Settings
    if (group?.staySettings?.bankDetails?.accountNumber) return group.staySettings.bankDetails;
    // 2. Group Class Payment Settings (Legacy Fallback)
    if (group?.classPaymentSettings?.bankDetails?.accountNumber) return group.classPaymentSettings.bankDetails;
    // 3. Stay Object Payment Methods
    const stayBank = stay.payment?.methods?.find(m => m.type === 'bank_domestic') || stay.payment?.methods?.[0];
    if (stayBank) return stayBank;
    return null;
  };

  const rawBankMethod = getBankDetails();
  const bankName = rawBankMethod?.bankName || '';
  const accountNumber = rawBankMethod?.accountNumber || '';
  const accountHolder = (rawBankMethod as any)?.ownerName || (rawBankMethod as any)?.accountHolder || (rawBankMethod as any)?.holderName || '';

  return (
    <div className="font-sans text-[#2d3435] bg-[#f8f9fa] min-h-screen relative">
      <header className="bg-white/80 backdrop-blur-xl border-b border-[#f2f4f4] fixed top-0 z-50 w-full">
        <div className="flex items-center justify-between px-4 h-16 max-w-[600px] mx-auto">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#f2f4f4] transition-colors">
            <span className="material-symbols-outlined text-[#596061]">arrow_back</span>
          </button>
          <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold text-lg text-[#2d3435]">Confirm Reservation</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="pt-20 pb-[200px] px-4 max-w-[600px] mx-auto space-y-4">
        {/* Reservation Summary */}
        <SectionCard icon="bed" title="Stay Summary">
          <div className="flex gap-4 p-4 bg-[#f8f9fa] rounded-2xl border border-[#e0e4e5]">
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
              {stay.images?.[0] && (
                <img src={stay.images[0]} alt={stay.title} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-[#acb3b4] uppercase tracking-widest mb-1">STAY</p>
              <h2 className="text-base font-black text-[#2d3435] truncate mb-2">{stay.title}</h2>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] bg-[#e8eaec] text-[#596061] px-2 py-0.5 rounded-full font-bold">
                  {formatDate(checkIn)} - {formatDate(checkOut)}
                </span>
                <span className="text-[10px] bg-[#e8eaec] text-[#596061] px-2 py-0.5 rounded-full font-bold">
                  {nights} Nights
                </span>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Guest Information */}
        <SectionCard icon="person" title="Guest & Contact Info">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-bold text-[#596061]">Number of Guests</label>
              <div className="flex items-center gap-4 bg-[#f2f4f4] rounded-xl p-1.5 border border-[#e0e4e5]">
                <button 
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  disabled={guests <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm disabled:opacity-30 transition-all active:scale-90"
                >
                  <span className="material-symbols-outlined text-sm">remove</span>
                </button>
                <span className="font-black text-sm w-4 text-center">{guests}</span>
                <button 
                  onClick={() => setGuests(Math.min(4, guests + 1))}
                  disabled={guests >= 4}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm disabled:opacity-30 transition-all active:scale-90"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#596061]">Applicant Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm text-[#2d3435] focus:outline-none focus:border-[#0057bd] transition-all"
                placeholder="Enter your name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#596061]">Contact Number (SMS) <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <select 
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-[110px] bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-2 py-3 text-sm text-[#2d3435] focus:outline-none"
                >
                  <option value="+82">+82 (KR)</option>
                  <option value="+1">+1 (US/CA)</option>
                  <option value="+81">+81 (JP)</option>
                  <option value="+86">+86 (CN)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+886">+886 (TW)</option>
                  <option value="+852">+852 (HK)</option>
                </select>
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9-]/g, ''))}
                  className="flex-1 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm text-[#2d3435] focus:outline-none focus:border-[#0057bd] transition-all"
                  placeholder="e.g. 010-0000-0000"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#596061]">Depositor Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={depositorName}
                onChange={(e) => setDepositorName(e.target.value)}
                className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm text-[#2d3435] focus:outline-none focus:border-[#0057bd] transition-all"
                placeholder="Name of person transferring funds"
              />
            </div>
          </div>
        </SectionCard>

        {/* Price Breakdown */}
        <SectionCard icon="receipt_long" title="Payment Details">
          <div className="space-y-3">
            <InfoRow title={`Base Rate (${nights} nights)`} right={<span className="font-bold text-[#2d3435]">{baseTotal.toLocaleString()} {stay.pricing?.currency || 'KRW'}</span>} />
            
            {weekendSurcharge > 0 && (
              <InfoRow title="Weekend Surcharge" subtitle={`${weekendNights} night(s)`} right={<span className="font-bold text-[#2d3435]">+{weekendSurcharge.toLocaleString()} {stay.pricing?.currency || 'KRW'}</span>} />
            )}
            
            {extraPersonTotal > 0 && (
              <InfoRow title="Extra Person Fee" subtitle={`${extraGuests} extra guest(s)`} right={<span className="font-bold text-[#2d3435]">+{extraPersonTotal.toLocaleString()} {stay.pricing?.currency || 'KRW'}</span>} />
            )}
            
            {cleaningFee > 0 && (
              <InfoRow title="Cleaning Fee" right={<span className="font-bold text-[#2d3435]">+{cleaningFee.toLocaleString()} {stay.pricing?.currency || 'KRW'}</span>} />
            )}

            <div className="flex justify-between items-center pt-4 border-t border-[#f2f4f4]">
              <p className="text-sm font-black text-[#2d3435]">Total Amount</p>
              <p className="text-xl font-black text-[#0057bd]">{grandTotal.toLocaleString()} {stay.pricing?.currency || 'KRW'}</p>
            </div>
          </div>
        </SectionCard>

        {/* Payment Info */}
        <SectionCard icon="account_balance" title="Bank Transfer" badge="Required">
          <div className="bg-[#f8f9fa] rounded-2xl p-4 border border-[#e0e4e5] relative group hover:bg-[#f2f4f4] transition-colors">
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-[#acb3b4] uppercase tracking-widest mb-1">Bank Name</p>
                <p className="text-sm font-bold text-[#2d3435]">{bankName || 'Unknown Bank'}</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-[#acb3b4] uppercase tracking-widest mb-1">Account Number</p>
                  <p className="text-base font-black text-[#2d3435] font-mono">{accountNumber || 'Unknown Account'}</p>
                </div>
                <button 
                  onClick={() => {
                    if (accountNumber) {
                      navigator.clipboard.writeText(accountNumber);
                      alert("Account number copied!");
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-[#0057bd] text-white flex items-center justify-center transition-all active:scale-90 shadow-md shadow-[#0057bd]/20"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#acb3b4] uppercase tracking-widest mb-1">Account Holder</p>
                <p className="text-sm font-bold text-[#2d3435]">{accountHolder || 'Unknown Holder'}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 p-3 bg-[#fff7ed] rounded-xl border border-[#fed7aa] mt-4">
            <span className="material-symbols-outlined text-sm text-orange-500 flex-shrink-0 mt-0.5">info</span>
            <p className="text-[11px] text-orange-700 leading-relaxed">
              Please transfer within <span className="font-bold underline">{stay.payment?.transferDeadlineHours || 2} hours</span> to secure your booking.
            </p>
          </div>
        </SectionCard>

        {/* Policy */}
        <SectionCard icon="policy" title="Reservation Policy">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-sm text-[#0057bd]">key</span>
                <p className="text-xs font-bold text-[#2d3435]">Check-in / Out</p>
              </div>
              <ul className="space-y-2 text-[11px] text-[#596061]">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-[#acb3b4]" />
                  Check-in: After {stay.checkInTime || '15:00'}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-[#acb3b4]" />
                  Check-out: Before {stay.checkOutTime || '11:00'}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-[#acb3b4]" />
                  {stay.checkInMethod || 'Self check-in with door code'}
                </li>
              </ul>
            </div>
            <div className="pt-4 border-t border-[#f2f4f4]">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-sm text-red-400">event_busy</span>
                <p className="text-xs font-bold text-[#2d3435]">Cancellation Policy</p>
              </div>
              <p className="text-[11px] text-[#596061] leading-relaxed">
                {stay.cancellation?.policyText || 'Full refund for cancellations made within 48 hours of booking.'}
              </p>
            </div>
          </div>
        </SectionCard>
      </main>

      {/* Sticky Bottom Button */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 backdrop-blur-xl border-t border-[#f2f4f4] z-50">
        <div className="max-w-[600px] mx-auto flex flex-col gap-4">
          <label className="flex items-start gap-3 cursor-pointer bg-[#f8f9fa] p-3 rounded-2xl border border-[#e0e4e5] hover:bg-[#f2f4f4] transition-colors">
            <div className="relative flex items-center shrink-0 mt-0.5">
              <input 
                type="checkbox" 
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="peer w-5 h-5 cursor-pointer appearance-none rounded-md border-2 border-[#e0e4e5] checked:border-[#0057bd] checked:bg-[#0057bd] transition-all"
              />
              <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-[14px] opacity-0 peer-checked:opacity-100 pointer-events-none">check</span>
            </div>
            <span className="text-[11px] text-[#596061] leading-snug">
              I have read and agree to the <span className="underline font-bold text-[#2d3435]">House Rules</span> and <span className="underline font-bold text-[#2d3435]">Reservation Terms</span>.
            </span>
          </label>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !agreedToTerms}
            className="w-full bg-[#0057bd] disabled:bg-[#e8eaec] disabled:text-[#acb3b4] text-white py-4 rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-[#0057bd]/20 hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Processing...' : `Confirm · ${grandTotal.toLocaleString()} ${stay.pricing?.currency || 'KRW'}`}
            {!isSubmitting && <span className="material-symbols-outlined text-sm">send</span>}
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
