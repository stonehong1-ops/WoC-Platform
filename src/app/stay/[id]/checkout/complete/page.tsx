'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { stayBookingService } from '@/lib/firebase/stayBookingService';
import { chatService } from '@/lib/firebase/chatService';
import { useAuth } from '@/components/providers/AuthProvider';
import { StayBooking } from '@/types/stay';
import { useLanguage } from '@/contexts/LanguageContext';
import { safeDate } from '@/lib/utils/safeDate';

function CompleteContent() {
  const router = useRouter();
  const params = useParams();
  const stayId = params.id as string;
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const { user } = useAuth();
  const { t } = useLanguage();
  const [booking, setBooking] = useState<StayBooking | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [paymentReported, setPaymentReported] = useState(false);

  const handlePaymentReport = async () => {
    if (!bookingId || !user || !booking || isReporting) return;
    setIsReporting(true);
    try {
      // 1. Update booking status to PAID
      await stayBookingService.updateBookingStatus(bookingId, 'PAID', user.uid, '입금 완료 보고');

      // 2. Send chat notification to host
      try {
        const hostId = booking.hostId || 'adminstone'; // Use stored hostId or fallback
        const roomId = await chatService.getOrCreatePrivateRoom(
          [user.uid, hostId], user.uid, 'business'
        );
        const checkOutDate = safeDate(booking.checkOut) || new Date();
        const lastNightDate = new Date(checkOutDate.getTime() - 24 * 60 * 60 * 1000);
        const msg = `💸 [STAY PAYMENT]\n` +
          `Stay: ${booking.stayTitle}\n` +
          `Dates: ${formatDate(booking.checkIn)} - ${formatDate(lastNightDate)} (Check-out: ${formatDate(booking.checkOut)})\n` +
          `Amount: ${booking.pricing.grandTotal.toLocaleString()} ${booking.pricing.currency}\n` +
          `I have transferred the payment. Please confirm!`;
        await chatService.sendMessage({
          roomId,
          senderId: user.uid,
          senderName: user.displayName || booking.applicantName || 'Guest',
          text: msg,
          type: 'text'
        });
      } catch (chatErr) {
        console.error('Stay payment chat notification failed:', chatErr);
      }

      setPaymentReported(true);
    } catch (err) {
      console.error('Failed to report payment:', err);
      alert('Failed to report payment. Please try again.');
    } finally {
      setIsReporting(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      stayBookingService.getBookingById(bookingId).then((data) => {
        setBooking(data);
      });
    }
  }, [bookingId]);

  const formatDate = (val: any) => {
    if (!val) return '';
    let d: Date;
    if (val.toDate) {
      d = val.toDate();
    } else if (val.seconds) {
      d = new Date(val.seconds * 1000);
    } else {
      d = new Date(val);
    }
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center animate-in fade-in duration-500 px-6">
      {/* Success Icon (Shop pattern) */}
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
        <span className="material-symbols-rounded text-4xl text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
      </div>

      <h2 className="text-xl font-black text-[#2d3435] mb-2">{t('stay.complete.applied')}</h2>
      <p className="text-sm text-[#596061] text-center leading-relaxed mb-2">
        {t('stay.complete.success_desc')}
      </p>
      <p className="text-xs text-[#acb3b4] text-center leading-relaxed mb-8">
        {t('stay.complete.sms_history_desc')}
      </p>

      {/* Summary Card (Shop pattern) */}
      {booking && (
        <div className="w-full max-w-sm bg-[#f8f9fa] rounded-2xl p-4 border border-[#e0e4e5] mb-4">
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-[#acb3b4] uppercase tracking-widest">{t('common.stay', 'Stay')}</span>
              <span className="text-sm font-bold text-[#2d3435] truncate max-w-[200px]">{booking.stayTitle}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-[#acb3b4] uppercase tracking-widest">{t('stay.checkout.checkin_checkout', 'Dates')}</span>
              <span className="text-xs font-bold text-[#596061] text-right">
                {(() => {
                  const checkOutDate = safeDate(booking.checkOut) || new Date();
                  const lastNightDate = new Date(checkOutDate.getTime() - 24 * 60 * 60 * 1000);
                  return `${formatDate(booking.checkIn)} - ${formatDate(lastNightDate)} (${booking.nights}${t('stay.nights_unit', '박')} · ${t('stay.checkout_date_label', '{date} 퇴실').replace('{date}', formatDate(booking.checkOut))})`;
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-[#acb3b4] uppercase tracking-widest">{t('stay.checkout.num_guests', 'Guests')}</span>
              <span className="text-xs font-bold text-[#596061]">{booking.guests} {t('stay.guests_unit_pp', 'Guest(s)')}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[#e0e4e5]">
              <span className="text-[10px] font-bold text-[#acb3b4] uppercase tracking-widest">{t('stay.checkout.total_amount', 'Total')}</span>
              <span className="text-base font-black text-primary">{booking.pricing.grandTotal.toLocaleString()} {booking.pricing.currency}</span>
            </div>
          </div>
        </div>
      )}

      {bookingId && (
        <p className="text-[10px] text-[#acb3b4] mb-6">Booking ID: {bookingId}</p>
      )}

      {/* Actions (Shop pattern — single primary action) */}
      <div className="w-full max-w-sm space-y-3">
        {booking && !paymentReported && booking.status === 'APPLIED' && (
          <button 
            onClick={handlePaymentReport}
            disabled={isReporting}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#f2f4f4] hover:bg-[#e8eaec] rounded-2xl transition-colors active:scale-[0.98] disabled:opacity-50"
          >
            <span className="material-symbols-rounded text-lg text-[#596061]">payments</span>
            <span className="text-sm font-bold text-[#2d3435]">
              {isReporting ? t('stay.complete.reporting', 'Reporting...') : t('stay.complete.payment_transferred', "I've Transferred the Payment")}
            </span>
          </button>
        )}
        {paymentReported && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <span className="material-symbols-rounded text-emerald-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span className="text-xs font-bold text-[#2d3435]">{t('stay.complete.reported_success')}</span>
          </div>
        )}
        <button
          onClick={() => router.push(`/stay`)}
          className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
        >
          {t('stay.complete.go_to_stays')}
        </button>
      </div>
    </div>
  );
}

export default function BookingCompletePage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-xs font-bold text-[#acb3b4]">{t('common.loading', 'Loading...')}</span>
        </div>
      </div>
    }>
      <CompleteContent />
    </Suspense>
  );
}
