'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { stayBookingService } from '@/lib/firebase/stayBookingService';
import { chatService } from '@/lib/firebase/chatService';
import { useAuth } from '@/components/providers/AuthProvider';
import { StayBooking } from '@/types/stay';

function CompleteContent() {
  const router = useRouter();
  const params = useParams();
  const stayId = params.id as string;
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const { user } = useAuth();
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
        const hostId = 'adminstone'; // Unified host identity
        const roomId = await chatService.getOrCreatePrivateRoom(
          [user.uid, hostId], user.uid, 'business'
        );
        const msg = `💸 [STAY PAYMENT]\n` +
          `Stay: ${booking.stayTitle}\n` +
          `Dates: ${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}\n` +
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
    <div className="bg-surface-container-lowest rounded-xxl p-8 max-w-md w-full text-center shadow-lg border border-outline-variant/30">
      <div className="w-20 h-20 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="material-symbols-outlined text-4xl">check_circle</span>
      </div>
      
      <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-on-surface mb-2">
        Reservation Applied!
      </h1>
      <p className="text-on-surface-variant text-body-md mb-8">
        Your booking request has been successfully submitted. We have also sent a confirmation SMS to your registered phone number.
      </p>

      {booking && (
        <div className="bg-surface-container-low p-4 rounded-xl mb-6 text-left space-y-3">
          <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
            <span className="text-outline text-label-md uppercase">Stay</span>
            <span className="font-semibold text-on-surface">{booking.stayTitle}</span>
          </div>
          <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
            <span className="text-outline text-label-md uppercase">Dates</span>
            <span className="font-semibold text-on-surface">
              {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
            <span className="text-outline text-label-md uppercase">Guests</span>
            <span className="font-semibold text-on-surface">{booking.guests} guest(s)</span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-outline text-label-md uppercase">Total Price</span>
            <span className="font-bold text-primary text-title-md">{booking.pricing.grandTotal.toLocaleString()} {booking.pricing.currency}</span>
          </div>
        </div>
      )}

      {bookingId && (
        <p className="text-label-sm text-outline mb-6">Booking ID: {bookingId}</p>
      )}

      <div className="space-y-3">
        {booking && !paymentReported && booking.status === 'APPLIED' && (
          <button 
            onClick={handlePaymentReport}
            disabled={isReporting}
            className="w-full bg-tertiary-container text-on-tertiary-container font-headline-md py-4 rounded-xl transition-all active:scale-[0.98] hover:opacity-90 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-xl">payments</span>
            {isReporting ? 'Reporting...' : "I've Transferred the Payment"}
          </button>
        )}
        {paymentReported && (
          <div className="bg-tertiary-container/30 border border-tertiary-container rounded-xl p-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-lg">check_circle</span>
            <span className="text-body-sm text-on-surface font-semibold">Payment reported! The host will confirm shortly.</span>
          </div>
        )}
        <button 
          onClick={() => router.push(`/stay/${stayId}`)}
          className="w-full bg-primary text-on-primary font-headline-md py-4 rounded-xl transition-all active:scale-[0.98] hover:bg-primary/90 shadow-md"
        >
          Back to Stay
        </button>
        <button 
          onClick={() => router.push(`/home`)}
          className="w-full bg-surface-container-high text-on-surface font-headline-md py-4 rounded-xl transition-all active:scale-[0.98] hover:bg-surface-container-highest"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}

export default function BookingCompletePage() {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      
      <style jsx global>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>
      
      <div className="font-body-md text-on-surface bg-background min-h-[max(884px,100dvh)] relative flex flex-col items-center justify-center p-4">
        <Suspense fallback={
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="font-body-md text-on-surface-variant">Loading...</span>
          </div>
        }>
          <CompleteContent />
        </Suspense>
      </div>
    </>
  );
}
