'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { stayBookingService } from '@/lib/firebase/stayBookingService';
import { stayService } from '@/lib/firebase/stayService';
import { chatService } from '@/lib/firebase/chatService';
import { Stay, StayBookingStatus, StayBooking } from '@/types/stay';
import ImageWithFallback from '@/components/common/ImageWithFallback';
import { useLanguage } from '@/contexts/LanguageContext';
import UnifiedCheckoutModal from '@/components/common/UnifiedCheckoutModal';
import { sendSmsViaSolapi } from '@/app/actions/smsActions';
import { addDays } from 'date-fns';
import { groupService } from '@/lib/firebase/groupService';
import { Group } from '@/types/group';
import { genOrderNumber, ensureProfilePhoneNumber } from '@/lib/utils/orderUtils';
import { isWeekendOrHolidayStay } from '@/lib/utils/dateUtils';

interface StayReservationFlowProps {
  stay: Stay;
  checkIn: Date;
  checkOut: Date;
  onClose: () => void;
  onComplete: () => void;
}

const fmt = (n: number) => n.toLocaleString();

export default function StayReservationFlow({
  stay, checkIn, checkOut, onClose, onComplete
}: StayReservationFlowProps) {
  const { user, profile } = useAuth();
  const { t, formatDate } = useLanguage();
  
  const [applicantName, setApplicantName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [guests, setGuests] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [createdBookingId, setCreatedBookingId] = useState('');
  const [createdOrderNumber, setCreatedOrderNumber] = useState('');
  const [group, setGroup] = useState<Group | null>(null);

  useEffect(() => {
    if (stay?.groupId) {
      groupService.getGroup(stay.groupId).then(setGroup).catch(console.error);
    }
  }, [stay?.groupId]);

  const getBankDetails = () => {
    if (group?.staySettings?.bankDetails?.accountNumber) return group.staySettings.bankDetails;
    if (group?.classPaymentSettings?.bankDetails?.accountNumber) return group.classPaymentSettings.bankDetails;
    const stayBank = stay.payment?.methods?.find((m: any) => m.type === 'bank_domestic') || stay.payment?.methods?.[0];
    if (stayBank) return stayBank;
    return undefined;
  };
  const bankDetails = getBankDetails();
  const bd = bankDetails as { bankName?: string; accountNumber?: string; holderName?: string; ownerName?: string; accountHolder?: string; } | undefined;

  useEffect(() => {
    if (profile || user) {
      setApplicantName(profile?.nickname || user?.displayName || '');
      if (profile?.phoneNumber) {
        setBuyerPhone(profile.phoneNumber);
      }
    }
  }, [profile, user]);

  // Calculate nights and dates
  const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
  
  const baseRate = stay.pricing?.baseRate || 0;
  const baseTotal = baseRate * nights;
  const cleaningFee = stay.pricing?.cleaningFee || 0;
  
  let weekendNights = 0;
  let curr = new Date(checkIn);
  while (curr < checkOut) {
    const tomorrow = addDays(curr, 1);
    if (isWeekendOrHolidayStay(curr, tomorrow, formatDate)) { 
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
  const currency = stay.pricing?.currency || 'KRW';
  const sym = currency === 'KRW' ? '₩' : currency === 'USD' ? '$' : currency + ' ';



  const handleCheckout = async (): Promise<string | void> => {
    if (!user) throw new Error('Not logged in');
    if (!applicantName.trim() || !buyerPhone.trim()) {
      alert(t('checkout.missing_fields', 'Please fill in all required fields.'));
      throw new Error('Missing fields');
    }
    if (!agreedToTerms) {
      alert(t('stay.agree_terms', 'Please agree to the House Rules.'));
      throw new Error('Terms not agreed');
    }

    await ensureProfilePhoneNumber(user, profile, buyerPhone);

    const orderNum = genOrderNumber('STAY');
    setCreatedOrderNumber(orderNum);

    const booking = await stayBookingService.addBooking({
      stayId: stay.id,
      groupId: stay.groupId || 'freestyle-tango',
      hostId: stay.host?.userId || 'adminstone',
      stayTitle: stay.title,
      userId: user.uid,
      applicantName,
      userAvatar: profile?.photoURL || user.photoURL || '',
      contactNumber: buyerPhone,
      checkIn,
      checkOut,
      nights,
      guests,
      pricing: {
        currency,
        baseTotal,
        cleaningFee,
        weekendSurcharge,
        extraPersonFee: extraPersonTotal,
        grandTotal
      },
      payment: {
        method: 'bank_domestic',
        bankName: bd?.bankName || '',
        accountNumber: bd?.accountNumber || '',
        holderName: bd?.holderName || bd?.ownerName || bd?.accountHolder || '',
        depositDate: formatDate(new Date(), 'iso')
      },
      status: 'APPLIED' as StayBookingStatus,
    });

    setCreatedBookingId(booking.id);

    try {
      await stayService.setStayInProgressStatus(user.uid, stay.id);
    } catch (e) {
      console.error('Failed to update stay to in_progress:', e);
    }

    // Send SMS
    if (buyerPhone) {
      let formattedPhone = buyerPhone.replace(/[^0-9]/g, '');
      if (!formattedPhone.startsWith('0') && formattedPhone.length >= 9) {
        formattedPhone = '0' + formattedPhone;
      }
      
      if (formattedPhone.startsWith('0') && formattedPhone.length >= 10) {
        const smsContent = t('checkout.sms_content', '[WoC] 예약이 접수되었습니다.\n숙소: {title}\n일정: {checkIn} - {checkOut}\n예약자: {name}\n금액: {amount}원\n\n호스트의 확인 후 최종 확정됩니다.')
          .replace('{title}', stay.title)
          .replace('{checkIn}', formatDate(checkIn, 'shortMonthDay'))
          .replace('{checkOut}', formatDate(checkOut, 'shortMonthDay'))
          .replace('{name}', applicantName)
          .replace('{amount}', grandTotal.toLocaleString());
          
        const smsResult = await sendSmsViaSolapi(formattedPhone, smsContent);
        
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

    // Chat Notification to Host
    try {
      const hostId = stay.host?.userId || 'adminstone';
      if (hostId) {
        const roomId = await chatService.getOrCreatePrivateRoom([user.uid, hostId], user.uid, 'business');
        const msg = `🏨 [STAY BOOKING]\n` +
          `Stay: ${stay.title}\n` +
          `Dates: ${formatDate(checkIn, 'shortMonthDay')} - ${formatDate(checkOut, 'shortMonthDay')}\n` +
          `Nights: ${nights}\n` +
          `Guests: ${guests}\n` +
          `Amount: ${sym}${fmt(grandTotal)}\n` +
          `Applicant: ${applicantName}\n` +
          `Image: ${stay.images?.[0] || ''}`;

        await chatService.sendMessage({
          roomId,
          senderId: user.uid,
          senderName: user.displayName || applicantName,
          text: msg,
          type: 'text'
        });
      }
    } catch (chatErr) {
      console.error('Stay booking chat notification failed:', chatErr);
    }

    return orderNum;
  };

  const handleReportPayment = async (reportedOrderId: string) => {
    if (!createdBookingId || !user) return;
    try {
      const { getDoc, updateDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/clientApp');
      const bookingRef = doc(db, 'stay_bookings', createdBookingId);
      const snap = await getDoc(bookingRef);
      if (snap.exists()) {
        const data = snap.data() as StayBooking;
        await updateDoc(bookingRef, {
          'payment.depositorName': user.displayName || applicantName,
          'payment.depositDate': new Date().toISOString().split('T')[0]
        });
      }
      await stayBookingService.updateBookingStatus(createdBookingId, 'PAID', user.uid, 'Payment reported by user');

      const hostId = stay.host?.userId || 'adminstone';
      if (hostId && user) {
        const roomId = await chatService.getOrCreatePrivateRoom([user.uid, hostId], user.uid, 'business');
        const msg = `💸 ${t('stay.chat_payment_prefix', '[PAYMENT REPORTED]')}\n${t('stay.chat_order_no', 'Booking No')}: ${createdOrderNumber}\n${t('stay.chat_depositor', 'Depositor')}: ${user.displayName || applicantName}\n${t('stay.chat_payment_msg', 'I have transferred the payment. Please confirm!')}`;
        await chatService.sendMessage({
          roomId,
          senderId: user.uid,
          senderName: user.displayName || applicantName,
          text: msg,
          type: 'text'
        });
      }
    } catch (err) {
      console.error('Failed to report payment:', err);
      throw err;
    }
  };

  return (
    <UnifiedCheckoutModal
      isOpen={true}
      onClose={onClose}
      title={t('stay.reservation_summary', 'Reservation Summary')}
      totalAmount={grandTotal}
      currency={currency}
      buttonText={t('stay.confirm_booking', 'Confirm Booking')}
      bankDetails={bd ? {
        bankName: bd.bankName || '',
        accountNumber: bd.accountNumber || '',
        accountHolder: bd.holderName || bd.ownerName || bd.accountHolder || ''
      } : undefined}
      onCheckout={handleCheckout}
      onReportPayment={handleReportPayment}
      onComplete={onComplete}
    >
      <div className="flex gap-3 p-3 bg-surface-container-lowest rounded-2xl border border-surface-container mb-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container">
          {stay.images?.[0] && (
            <ImageWithFallback src={stay.images[0]} alt={stay.title} className="w-full h-full object-cover" fallbackType="gallery" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">STAY</p>
          <p className="text-sm font-bold text-on-surface truncate">{stay.title}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="text-[10px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full font-bold">
              {formatDate(checkIn, 'shortMonthDay')} - {formatDate(checkOut, 'shortMonthDay')}
            </span>
            <span className="text-[10px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full font-bold">
              {nights} Nights
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-2">
        {/* Guests Selection */}
        <div className="flex items-center justify-between px-1">
          <label className="text-xs font-bold text-on-surface-variant">Number of Guests</label>
          <div className="flex items-center gap-4 bg-surface-container-lowest rounded-xl p-1.5 border border-surface-container">
            <button 
              onClick={() => setGuests(Math.max(1, guests - 1))}
              disabled={guests <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface shadow-sm disabled:opacity-30 transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-sm">remove</span>
            </button>
            <span className="font-black text-sm w-4 text-center">{guests}</span>
            <button 
              onClick={() => setGuests(Math.min(stay.maxGuests || 4, guests + 1))}
              disabled={guests >= (stay.maxGuests || 4)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface shadow-sm disabled:opacity-30 transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
          </div>
        </div>

        {/* Breakdown preview */}
        <div className="bg-surface-container-lowest rounded-xl p-3 border border-surface-container text-xs space-y-1">
           <div className="flex justify-between"><span className="text-on-surface-variant">Base ({nights} nights)</span><span>{sym}{fmt(baseTotal)}</span></div>
           {weekendSurcharge > 0 && <div className="flex justify-between"><span className="text-on-surface-variant">Weekend Surcharge</span><span>+{sym}{fmt(weekendSurcharge)}</span></div>}
           {extraPersonTotal > 0 && <div className="flex justify-between"><span className="text-on-surface-variant">Extra Guests</span><span>+{sym}{fmt(extraPersonTotal)}</span></div>}
           {cleaningFee > 0 && <div className="flex justify-between"><span className="text-on-surface-variant">Cleaning Fee</span><span>+{sym}{fmt(cleaningFee)}</span></div>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-on-surface-variant">{t('checkout.applicant_name', 'Applicant Name')} <span className="text-error">*</span></label>
          <input
            type="text"
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            className="w-full bg-surface-container-lowest border border-surface-container rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-on-surface-variant">{t('checkout.contact_number', 'Contact Number')} <span className="text-error">*</span></label>
          <input
            type="tel"
            value={buyerPhone}
            onChange={(e) => setBuyerPhone(e.target.value)}
            placeholder="010-0000-0000"
            className="w-full bg-surface-container-lowest border border-surface-container rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
          />
        </div>

        {/* Terms */}
        <label className="flex items-start gap-3 cursor-pointer bg-surface-container-lowest p-3 rounded-2xl border border-surface-container hover:bg-surface-container transition-colors mt-2">
          <div className="relative flex items-center shrink-0 mt-0.5">
            <input 
              type="checkbox" 
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="peer w-5 h-5 cursor-pointer appearance-none rounded-md border-2 border-outline checked:border-primary checked:bg-primary transition-all"
            />
            <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-[14px] opacity-0 peer-checked:opacity-100 pointer-events-none">check</span>
          </div>
          <span className="text-[11px] text-on-surface-variant leading-snug">
            {t('stay.agree_text', 'I have read and agree to the House Rules and Reservation Terms.')}
          </span>
        </label>
      </div>
    </UnifiedCheckoutModal>
  );
}
