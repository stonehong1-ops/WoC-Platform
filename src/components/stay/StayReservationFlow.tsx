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
  const [showCancellationPolicy, setShowCancellationPolicy] = useState(false);
  
  const [createdBookingId, setCreatedBookingId] = useState('');
  const [createdOrderNumber, setCreatedOrderNumber] = useState('');
  const [group, setGroup] = useState<Group | null>(null);

  useEffect(() => {
    if (stay?.groupId) {
      groupService.getGroup(stay.groupId).then(setGroup).catch(console.error);
    }
  }, [stay?.groupId]);

  const getBankDetails = () => {
    if (group?.bankDetails?.accountNumber) return {
      bankName: group.bankDetails.bankName,
      accountNumber: group.bankDetails.accountNumber,
      holderName: group.bankDetails.accountHolder
    };
    if (group?.staySettings?.bankDetails?.accountNumber) return {
      bankName: group.staySettings.bankDetails.bankName,
      accountNumber: group.staySettings.bankDetails.accountNumber,
      holderName: group.staySettings.bankDetails.ownerName
    };
    if (group?.classPaymentSettings?.bankDetails?.accountNumber) return {
      bankName: group.classPaymentSettings.bankDetails.bankName,
      accountNumber: group.classPaymentSettings.bankDetails.accountNumber,
      holderName: group.classPaymentSettings.bankDetails.accountHolder
    };
    return undefined;
  };
  const bankDetails = getBankDetails();
  const bd = bankDetails as { bankName?: string; accountNumber?: string; holderName?: string; } | undefined;

  useEffect(() => {
    if (profile || user) {
      setApplicantName(profile?.nativeNickname || profile?.nickname || user?.displayName || '');
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
      stayImageUrl: stay.images?.[0] || '',
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
        holderName: bd?.holderName || '',
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

    return `${booking.id}|${orderNum}`;
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
          'payment.depositorName': profile?.nativeNickname || profile?.nickname || user.displayName || applicantName,
          'payment.depositDate': new Date().toISOString().split('T')[0]
        });
      }
      await stayBookingService.updateBookingStatus(createdBookingId, 'PAID', user.uid, 'Payment reported by user');

      const hostId = stay.host?.userId || 'adminstone';

      // 1. Send SMS at this reported payment stage
      if (buyerPhone) {
        let formattedPhone = buyerPhone.replace(/[^0-9]/g, '');
        if (!formattedPhone.startsWith('0') && formattedPhone.length >= 9) {
          formattedPhone = '0' + formattedPhone;
        }
        
        if (formattedPhone.startsWith('0') && formattedPhone.length >= 10) {
          const smsContent = `${t('checkout.sms_payment_reported', {
            title: stay.title,
            checkIn: formatDate(checkIn, 'shortMonthDay'),
            checkOut: formatDate(addDays(checkOut, -1), 'shortMonthDay'),
            amount: grandTotal.toLocaleString()
          })} (${t('stay.checkout_date_label', '{date} 퇴실').replace('{date}', formatDate(checkOut, 'shortMonthDay'))})`;
            
          try {
            const smsResult = await sendSmsViaSolapi(formattedPhone, smsContent);
            await stayBookingService.addSmsLog(createdBookingId, {
              type: 'paid',
              sentAt: new Date().toISOString(),
              sentBy: user.uid,
              to: formattedPhone,
              message: smsContent,
              status: smsResult.success ? 'SUCCESS' : 'FAILED',
              errorMessage: smsResult.error || undefined
            });
          } catch (smsErr) {
            console.error('Failed to send payment report SMS:', smsErr);
          }
        }
      }

      // 2. Send Chat Notification Card to Host
      if (hostId && user) {
        const roomId = await chatService.getOrCreatePrivateRoom([user.uid, hostId], user.uid, 'business');
        
        // 2-1. Initial Stay Detail Card Message in chat room
        try {
          const bookingMsg = `🏨 [STAY BOOKING]\n` +
            `Stay: ${stay.title}\n` +
            `Dates: ${formatDate(checkIn, 'shortMonthDay')} - ${formatDate(addDays(checkOut, -1), 'shortMonthDay')} (Check-out: ${formatDate(checkOut, 'shortMonthDay')})\n` +
            `Nights: ${nights}\n` +
            `Guests: ${guests}\n` +
            `Amount: ${sym}${fmt(grandTotal)}\n` +
            `Applicant: ${applicantName}\n` +
            `Image: ${stay.images?.[0] || ''}`;

          await chatService.sendMessage({
            roomId,
            senderId: user.uid,
            senderName: profile?.nativeNickname || profile?.nickname || user.displayName || applicantName,
            text: bookingMsg,
            type: 'text'
          });
        } catch (cardErr) {
          console.error('Failed to send stay detail card:', cardErr);
        }

        // 2-2. Payment Reported Approval Card in chat room
        const msg = `💸 ${t('stay.chat_payment_prefix', '[PAYMENT REPORTED]')}\n${t('stay.chat_order_no', 'Booking No')}: ${createdOrderNumber}\n${t('stay.chat_depositor', 'Depositor')}: ${profile?.nativeNickname || profile?.nickname || user.displayName || applicantName}\n${t('stay.chat_payment_msg', 'I have transferred the payment. Please confirm!')}`;
        
        await chatService.sendMessage({
          roomId,
          senderId: user.uid,
          senderName: profile?.nativeNickname || profile?.nickname || user.displayName || applicantName,
          text: msg,
          type: 'text',
          metadata: {
            actionType: 'booking_approval',
            bookingId: createdBookingId,
            status: 'PAYMENT_REPORTED',
            domain: 'stay',
            sellerId: hostId,
            buyerId: user.uid,
            itemName: stay.title
          }
        });

        // 2-3. Seller's automated review reply
        await chatService.sendMessage({
          roomId,
          senderId: hostId,
          senderName: 'Host',
          text: t('stay.host_automated_review_reply', '입금 확인 후 답변드리겠습니다. I will review and reply.'),
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
      buttonText={t('stay.confirm_booking', 'Apply Reservation')}
      isSubmitDisabled={!agreedToTerms}
      bankDetails={bd ? {
        bankName: bd.bankName || '',
        accountNumber: bd.accountNumber || '',
        accountHolder: bd.holderName || ''
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
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">{t('common.stay', 'STAY')}</p>
          <p className="text-sm font-bold text-on-surface truncate">{stay.title}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="text-[10px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full font-bold">
              {formatDate(checkIn, 'shortMonthDay')} - {formatDate(addDays(checkOut, -1), 'shortMonthDay')}
            </span>
            <span className="text-[10px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full font-bold">
              {nights} {t('stay.nights_unit', 'Nights')} · {t('stay.checkout_date_label', '{date} 퇴실').replace('{date}', formatDate(checkOut, 'shortMonthDay'))}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-2">
        {/* Guests Selection */}
        <div className="flex items-center justify-between px-1">
          <label className="text-xs font-bold text-on-surface-variant">{t('stay.num_guests', 'Number of Guests')}</label>
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
           <div className="flex justify-between"><span className="text-on-surface-variant">{t('stay.base_rate_calc', 'Base Room Rate')} ({nights} {t('stay.nights_unit', 'Nights')})</span><span>{sym}{fmt(baseTotal)}</span></div>
           {weekendSurcharge > 0 && <div className="flex justify-between"><span className="text-on-surface-variant">{t('stay.weekend_surcharge_calc', 'Weekend Surcharge')}</span><span>+{sym}{fmt(weekendSurcharge)}</span></div>}
           {extraPersonTotal > 0 && <div className="flex justify-between"><span className="text-on-surface-variant">{t('stay.extra_person_fee_calc', 'Extra Guest Fee')}</span><span>+{sym}{fmt(extraPersonTotal)}</span></div>}
           {cleaningFee > 0 && <div className="flex justify-between"><span className="text-on-surface-variant">{t('stay.cleaning_fee_calc', 'Cleaning Fee')}</span><span>+{sym}{fmt(cleaningFee)}</span></div>}
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

        {/* Cancellation Policy Accordion */}
        <div className="border border-surface-container rounded-2xl overflow-hidden bg-surface-container-lowest mt-1">
          <button
            type="button"
            onClick={() => setShowCancellationPolicy(!showCancellationPolicy)}
            className="w-full flex items-center justify-between p-3.5 hover:bg-surface-container transition-colors text-xs font-bold text-on-surface"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-rounded text-sm text-[#596061]">info</span>
              <span>{t('stay.cancellation_policy_title', '취소 및 환불 정책 보기')}</span>
            </div>
            <span className={`material-symbols-rounded text-sm transition-transform duration-200 ${showCancellationPolicy ? 'rotate-180' : ''}`}>
              keyboard_arrow_down
            </span>
          </button>
          
          {showCancellationPolicy && (
            <div className="px-4 pb-4 pt-1 text-[11px] leading-relaxed text-[#596061] border-t border-surface-container/30 bg-surface-container-lowest divide-y divide-surface-container/40 animate-in fade-in duration-200">
              <div className="flex justify-between py-2">
                <span className="font-semibold">{t('stay.cancellation_policy_15d', '입주 15일 전')}</span>
                <span className="font-bold text-primary">{t('stay.refund_90', '90% 환불')}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-semibold">{t('stay.cancellation_policy_14_8d', '입주 14~8일 전')}</span>
                <span className="font-bold text-[#e0a800]">{t('stay.refund_70', '70% 환불')}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-semibold">{t('stay.cancellation_policy_7_1d', '입주 7~1일 전')}</span>
                <span className="font-bold text-orange-500">{t('stay.refund_50', '50% 환불')}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-semibold">{t('stay.cancellation_policy_today', '입주 당일')}</span>
                <span className="font-bold text-red-500">{t('stay.refund_none', '환불 불가')}</span>
              </div>
            </div>
          )}
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
