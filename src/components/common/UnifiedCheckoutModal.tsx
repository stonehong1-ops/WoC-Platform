import React, { useState, useEffect, useCallback } from 'react';
import BottomSheet from '@/components/common/BottomSheet';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';

type Step = 'summary' | 'payment' | 'complete';

interface UnifiedCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  
  // Step 1: Summary UI
  children: React.ReactNode;
  
  totalAmount: number;
  currency?: string;
  
  // Action for Step 1
  // Expected to create the booking and return a unique order ID or string representing the order
  onCheckout: () => Promise<string | void>;
  isProcessing?: boolean;
  buttonText?: string;

  // Step 2: Payment Instructions
  bankDetails?: { bankName: string; accountHolder: string; accountNumber: string };
  
  // Action for Step 2
  onReportPayment?: (orderId: string) => Promise<void>;
  
  // Action for Step 3
  onComplete?: () => void;

  // Existing booking pre-fill for Step 2 direct entry
  initialStep?: Step;
  initialBookingId?: string;
  initialOrderNumber?: string;
  initialCreatedAt?: any;
}

const fmt = (n: number) => n.toLocaleString();

const getCreatedAtMs = (createdAt: any): number => {
  if (!createdAt) return Date.now();
  if (typeof createdAt.toDate === 'function') {
    return createdAt.toDate().getTime();
  }
  if (createdAt.seconds) {
    return createdAt.seconds * 1000;
  }
  if (typeof createdAt === 'number') {
    return createdAt;
  }
  if (createdAt instanceof Date) {
    return createdAt.getTime();
  }
  try {
    return new Date(createdAt).getTime();
  } catch (e) {
    return Date.now();
  }
};

const formatAppliedTime = (createdAt: any, isKorean: boolean) => {
  const ms = getCreatedAtMs(createdAt);
  const date = new Date(ms);
  if (isKorean) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}월 ${day}일 ${hours}:${minutes}분`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
};

export default function UnifiedCheckoutModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  totalAmount,
  currency = 'KRW',
  onCheckout,
  isProcessing = false,
  buttonText = 'Book Now',
  bankDetails,
  onReportPayment,
  onComplete,
  initialStep,
  initialBookingId,
  initialOrderNumber,
  initialCreatedAt
}: UnifiedCheckoutModalProps) {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  
  const [step, setStep] = useState<Step>('summary');
  const [localProcessing, setLocalProcessing] = useState(false);
  const [bookingId, setBookingId] = useState<string>('');
  const [displayOrderNumber, setDisplayOrderNumber] = useState<string>('');
  const [countdown, setCountdown] = useState(3600); // 60 min
  const [copied, setCopied] = useState('');

  const sym = currency === 'KRW' ? '₩' : currency === 'USD' ? '$' : currency + ' ';

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (initialStep) setStep(initialStep);
      if (initialBookingId) setBookingId(initialBookingId);
      if (initialOrderNumber) setDisplayOrderNumber(initialOrderNumber);
      
      if (initialCreatedAt) {
        const createdAtMs = getCreatedAtMs(initialCreatedAt);
        const elapsedSeconds = Math.floor((Date.now() - createdAtMs) / 1000);
        const remainingSeconds = Math.max(0, 3600 - elapsedSeconds);
        setCountdown(remainingSeconds);
      } else {
        setCountdown(3600);
      }
    } else {
      setTimeout(() => {
        setStep('summary');
        setBookingId('');
        setDisplayOrderNumber('');
        setCountdown(3600);
      }, 300); // delay to prevent UI flicker
    }
  }, [isOpen, initialStep, initialBookingId, initialOrderNumber, initialCreatedAt]);

  // Countdown timer for payment step
  useEffect(() => {
    if (step !== 'payment') return;
    const tInterval = setInterval(() => setCountdown(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(tInterval);
  }, [step]);

  const mm = String(Math.floor(countdown / 60)).padStart(2, '0');
  const ss = String(countdown % 60).padStart(2, '0');

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(''), 1500);
    });
  }, []);

  const handleCheckoutClick = async () => {
    if (isProcessing || localProcessing || !user) return;
    setLocalProcessing(true);
    try {
      const result = await onCheckout();
      if (result) {
        if (result.includes('|')) {
          const [bId, oNum] = result.split('|');
          setBookingId(bId);
          setDisplayOrderNumber(oNum);
        } else {
          setBookingId(result);
          setDisplayOrderNumber(result);
        }
      } else {
        // Fallback for order ID if not returned, just use timestamp for display
        const fallback = `ORD-${Date.now().toString().slice(-6)}`;
        setBookingId(fallback);
        setDisplayOrderNumber(fallback);
      }
      setStep('payment');
    } catch (err) {
      console.error(err);
    } finally {
      setLocalProcessing(false);
    }
  };

  const handleReportPayment = async () => {
    setLocalProcessing(true);
    try {
      if (onReportPayment) {
        await onReportPayment(bookingId);
      }
      setStep('complete');
    } catch (err) {
      console.error(err);
      alert('Failed to report payment.');
    } finally {
      setLocalProcessing(false);
    }
  };

  // ━━━ STEP 1: SUMMARY ━━━
  if (step === 'summary') {
    const footerContent = (
      <div className="p-5 bg-white dark:bg-neutral-900 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-none pb-[calc(env(safe-area-inset-bottom)+20px)] sm:pb-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total</span>
          <span className="text-xl font-bold text-neutral-900 dark:text-white">
            {sym}{fmt(totalAmount)}
          </span>
        </div>
        
        <button
          onClick={handleCheckoutClick}
          disabled={isProcessing || localProcessing || !user}
          className="w-full h-12 flex items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-lg transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          {isProcessing || localProcessing ? (
            <span className="animate-pulse">Processing...</span>
          ) : user ? (
            buttonText
          ) : (
            'Login to Book'
          )}
        </button>
      </div>
    );

    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} title={title} footer={footerContent}>
        <div className="flex flex-col bg-white dark:bg-neutral-900">
          {subtitle && (
            <div className="px-5 py-2 text-sm text-neutral-500 dark:text-neutral-400">
              {subtitle}
            </div>
          )}
          <div className="px-5 py-4">
            {children}
          </div>
        </div>
      </BottomSheet>
    );
  }

  // ━━━ STEP 2: PAYMENT INSTRUCTIONS ━━━
  if (step === 'payment') {
    const footerContent = (
      <div className="p-5 bg-white dark:bg-neutral-900 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-none pb-[calc(env(safe-area-inset-bottom)+20px)] sm:pb-5">
        <button
          onClick={handleReportPayment}
          disabled={localProcessing}
          className="w-full h-12 flex items-center justify-center rounded-xl bg-[#0057bd] text-white font-semibold text-lg shadow-lg shadow-[#0057bd]/20 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100"
        >
          {localProcessing ? (
            <span className="animate-pulse">Processing...</span>
          ) : (
            t('shop.btn_transferred', "I've Transferred the Payment")
          )}
        </button>
      </div>
    );

    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} title={t('shop.payment_instructions', 'Payment Instructions')} footer={footerContent}>
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 bg-white dark:bg-neutral-900">
          {/* Timer */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-[#fff7ed] dark:bg-orange-950 border border-[#fed7aa] dark:border-orange-800 rounded-2xl px-5 py-3">
              <span className="material-symbols-outlined text-lg text-orange-500">timer</span>
              <span className="text-2xl font-black text-orange-600 dark:text-orange-400 font-mono tracking-wider">{mm}:{ss}</span>
            </div>
            <p className="text-xs text-[#596061] dark:text-neutral-400 mt-2 leading-relaxed">
              {countdown === 0 ? (
                language === 'KR' ? (
                  <>
                    <span className="font-bold text-orange-600">{formatAppliedTime(initialCreatedAt, true)}</span>에 신청하셨습니다.<br/>
                    입금 후 <span className="font-bold text-[#0057bd]">송금을 완료했습니다</span> 버튼을 클릭해주십시오.
                  </>
                ) : (
                  <>
                    Requested on <span className="font-bold text-orange-600">{formatAppliedTime(initialCreatedAt, false)}</span>.<br/>
                    Please click the <span className="font-bold text-[#0057bd]">I've Transferred</span> button after payment.
                  </>
                )
              ) : (
                <>
                  {t('shop.transfer_within_1h', 'Please transfer within 1 hour.')}<br/>
                  <span className="text-[#acb3b4] dark:text-neutral-500">{t('shop.order_expire_notice', 'Order may expire if not paid in time.')}</span>
                </>
              )}
            </p>
          </div>

          {/* Order Number */}
          <div className="bg-[#f8f9fa] dark:bg-neutral-800 rounded-2xl p-4 border border-[#e0e4e5] dark:border-neutral-700">
            <p className="text-[10px] font-bold text-[#acb3b4] dark:text-neutral-500 uppercase tracking-widest mb-1">{t('shop.order_number', 'Order Number')}</p>
            <div className="flex items-center justify-between">
              <p className="text-base font-black text-[#2d3435] dark:text-white font-mono">{displayOrderNumber}</p>
            </div>
          </div>

          {/* Bank Details */}
          <div className="border border-[#e0e4e5] dark:border-neutral-700 rounded-2xl overflow-hidden">
            <div className="bg-[#f8f9fa] dark:bg-neutral-800/50 px-4 py-2.5 border-b border-[#e0e4e5] dark:border-neutral-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-[#0057bd] dark:text-blue-400">account_balance</span>
              <p className="text-[10px] font-black text-[#0057bd] dark:text-blue-400 uppercase tracking-widest">{t('shop.bank_transfer_details', 'Bank Transfer Details')}</p>
            </div>
            <div className="p-4 space-y-3 dark:bg-neutral-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#acb3b4] dark:text-neutral-500 uppercase font-bold">{t('shop.bank', 'Bank')}</p>
                  <p className="text-sm font-bold text-[#2d3435] dark:text-white">{bankDetails?.bankName || t('shop.not_available', 'N/A')}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#acb3b4] dark:text-neutral-500 uppercase font-bold">{t('shop.account_number', 'Account Number')}</p>
                  <p className="text-base font-black text-[#2d3435] dark:text-white font-mono tracking-wide">{bankDetails?.accountNumber || t('shop.not_available', 'N/A')}</p>
                </div>
                <button onClick={() => copyToClipboard(bankDetails?.accountNumber || '', 'account')}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors ${copied === 'account' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-[#0057bd] text-white'}`}>
                  {copied === 'account' ? t('shop.copied', '✓ Copied') : t('shop.copy', 'Copy')}
                </button>
              </div>
              <div>
                <p className="text-[10px] text-[#acb3b4] dark:text-neutral-500 uppercase font-bold">{t('shop.account_holder', 'Account Holder')}</p>
                <p className="text-sm font-bold text-[#2d3435] dark:text-white">{bankDetails?.accountHolder || t('shop.not_available', 'N/A')}</p>
              </div>
              <div className="bg-[#f0f4ff] dark:bg-blue-900/10 rounded-xl p-3 flex items-center justify-between mt-2">
                <div>
                  <p className="text-[10px] text-[#0057bd] dark:text-blue-400 uppercase font-bold">{t('shop.transfer_amount', 'Transfer Amount')}</p>
                  <p className="text-xl font-black text-[#0057bd] dark:text-blue-400">{sym}{fmt(totalAmount)}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </BottomSheet>
    );
  }

  // ━━━ STEP 3: COMPLETE ━━━
  const handleCompleteClose = () => {
    if (onComplete) onComplete();
    onClose();
  };

  const completeFooter = (
    <div className="p-5 bg-white dark:bg-neutral-900 pb-[calc(env(safe-area-inset-bottom)+20px)] sm:pb-5">
      <button
        onClick={handleCompleteClose}
        className="w-full h-12 flex items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-lg transition-transform active:scale-[0.98]"
      >
        {t('common.done', 'Done')}
      </button>
    </div>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={handleCompleteClose} title="" footer={completeFooter}>
      <div className="flex flex-col items-center justify-center py-10 px-6 bg-white dark:bg-neutral-900">
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
          <span className="material-symbols-outlined text-4xl text-emerald-600 dark:text-emerald-400" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        </div>
        <h2 className="text-xl font-black text-[#2d3435] dark:text-white mb-2 text-center">
          {t('shop.order_placed', 'Request Completed!')}
        </h2>
        <p className="text-sm text-[#596061] dark:text-neutral-400 text-center leading-relaxed mb-4">
          Order <span className="font-mono font-bold text-[#2d3435] dark:text-white">{displayOrderNumber}</span> has been reported.
        </p>
        <p className="text-xs text-[#acb3b4] dark:text-neutral-500 text-center leading-relaxed">
          {t('shop.order_placed_desc2', "You'll receive a notification when the seller confirms your payment.")}
        </p>
      </div>
    </BottomSheet>
  );
}
