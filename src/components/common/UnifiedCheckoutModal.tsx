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
  isEditMode?: boolean;
  
  // Step 1: Summary UI
  children: React.ReactNode;
  
  totalAmount: number;
  currency?: string;
  
  // Action for Step 1
  // Expected to create the booking and return a unique order ID or string representing the order
  onCheckout: () => Promise<string | void>;
  isProcessing?: boolean;
  buttonText?: string;
  isSubmitDisabled?: boolean;

  // Step 2: Payment Instructions
  bankDetails?: { bankName: string; accountHolder: string; accountNumber: string };
  
  // Action for Step 2
  onReportPayment?: (orderId: string, memo?: string) => Promise<void>;
  
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
  initialCreatedAt,
  isSubmitDisabled = false,
  isEditMode = false
}: UnifiedCheckoutModalProps) {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  
  const [step, setStep] = useState<Step>('summary');
  const [localProcessing, setLocalProcessing] = useState(false);
  const [bookingId, setBookingId] = useState<string>('');
  const [displayOrderNumber, setDisplayOrderNumber] = useState<string>('');
  const [countdown, setCountdown] = useState(3600); // 60 min
  const [copied, setCopied] = useState('');
  const [paymentMemo, setPaymentMemo] = useState('');

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
        setPaymentMemo('');
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
      if (isEditMode) {
        onClose();
        return;
      }
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
        await onReportPayment(bookingId, paymentMemo || undefined);
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
      <div className="p-5 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[calc(env(safe-area-inset-bottom)+20px)] sm:pb-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-neutral-500">{language === 'KR' ? '총 금액' : 'Total'}</span>
          <span className="text-xl font-bold text-neutral-900">
            {sym}{fmt(totalAmount)}
          </span>
        </div>
        
        <button
          onClick={handleCheckoutClick}
          disabled={isProcessing || localProcessing || !user || isSubmitDisabled}
          className="w-full h-12 flex items-center justify-center rounded-xl bg-black text-white font-semibold text-lg transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          {isProcessing || localProcessing ? (
            <span className="animate-pulse">{language === 'KR' ? '처리 중...' : 'Processing...'}</span>
          ) : user ? (
            isEditMode ? (language === 'KR' ? '수정 완료' : 'Save Changes') : buttonText
          ) : (
            language === 'KR' ? '로그인 후 신청하기' : 'Login to Book'
          )}
        </button>
      </div>
    );

    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} title={title} footer={footerContent}>
        <div className="flex flex-col bg-white">
          {subtitle && (
            <div className="px-5 py-2 text-sm text-neutral-500">
              {subtitle}
            </div>
          )}
          <div className="flex-1 overflow-y-auto max-h-[60vh] sm:max-h-[75vh] md:max-h-none px-5 py-4">
            {children}
          </div>
        </div>
      </BottomSheet>
    );
  }

  // ━━━ STEP 2: PAYMENT INSTRUCTIONS ━━━
  if (step === 'payment') {
    const footerContent = (
      <div className="p-5 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[calc(env(safe-area-inset-bottom)+20px)] sm:pb-5">
        <button
          onClick={handleReportPayment}
          disabled={localProcessing}
          className="w-full h-12 flex items-center justify-center rounded-xl bg-[#0057bd] text-white font-semibold text-lg shadow-lg shadow-[#0057bd]/20 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100"
        >
          {localProcessing ? (
            <span className="animate-pulse">{language === 'KR' ? '처리 중...' : 'Processing...'}</span>
          ) : (
            t('shop.btn_transferred', "I've Transferred the Payment")
          )}
        </button>
      </div>
    );

    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} title={t('shop.payment_instructions', 'Payment Instructions')} footer={footerContent}>
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 bg-white">
          {/* Timer */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-[#fff7ed] border border-[#fed7aa] rounded-2xl px-5 py-3">
              <span className="material-symbols-outlined text-lg text-orange-500">timer</span>
              <span className="text-2xl font-black text-orange-600 font-mono tracking-wider">{mm}:{ss}</span>
            </div>
            <p className="text-xs text-[#596061] mt-2 leading-relaxed">
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
                  <span className="text-[#acb3b4]">{t('shop.order_expire_notice', 'Order may expire if not paid in time.')}</span>
                </>
              )}
            </p>
          </div>

          {/* Order Number */}
          <div className="bg-[#f8f9fa] rounded-2xl p-4 border border-[#e0e4e5]">
            <p className="text-[10px] font-bold text-[#acb3b4] uppercase tracking-widest mb-1">{t('shop.order_number', 'Order Number')}</p>
            <div className="flex items-center justify-between">
              <p className="text-base font-black text-[#2d3435] font-mono">{displayOrderNumber}</p>
            </div>
          </div>

          {/* Bank Details */}
          <div className="border border-[#e0e4e5] rounded-2xl overflow-hidden">
            <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-[#0057bd]">account_balance</span>
              <p className="text-[10px] font-black text-[#0057bd] uppercase tracking-widest">{t('shop.bank_transfer_details', 'Bank Transfer Details')}</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#acb3b4] uppercase font-bold">{t('shop.bank', 'Bank')}</p>
                  <p className="text-sm font-bold text-[#2d3435]">{bankDetails?.bankName || t('shop.not_available', 'N/A')}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#acb3b4] uppercase font-bold">{t('shop.account_number', 'Account Number')}</p>
                  <p className="text-base font-black text-[#2d3435] font-mono tracking-wide">{bankDetails?.accountNumber || t('shop.not_available', 'N/A')}</p>
                </div>
                <button onClick={() => copyToClipboard(bankDetails?.accountNumber || '', 'account')}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors ${copied === 'account' ? 'bg-emerald-100 text-emerald-700' : 'bg-[#0057bd] text-white'}`}>
                  {copied === 'account' ? t('shop.copied', '✓ Copied') : t('shop.copy', 'Copy')}
                </button>
              </div>
              <div>
                <p className="text-[10px] text-[#acb3b4] uppercase font-bold">{t('shop.account_holder', 'Account Holder')}</p>
                <p className="text-sm font-bold text-[#2d3435]">{bankDetails?.accountHolder || t('shop.not_available', 'N/A')}</p>
              </div>
              <div className="bg-[#f0f4ff] rounded-xl p-3 flex items-center justify-between mt-2">
                <div>
                  <p className="text-[10px] text-[#0057bd] uppercase font-bold">{t('shop.transfer_amount', 'Transfer Amount')}</p>
                  <p className="text-xl font-black text-[#0057bd]">{sym}{fmt(totalAmount)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Memo */}
          <div className="bg-[#f8f9fa] rounded-2xl p-4 border border-[#e0e4e5]">
            <p className="text-[10px] font-bold text-[#acb3b4] uppercase tracking-widest mb-2">
              {language === 'KR' ? '메모' : 'Memo'} <span className="normal-case tracking-normal text-[#acb3b4]">({language === 'KR' ? '선택' : 'Optional'})</span>
            </p>
            <textarea
              value={paymentMemo}
              onChange={(e) => setPaymentMemo(e.target.value)}
              placeholder={language === 'KR' ? '입금자명, 멤버쉽등 사유 등 입금확인 가능정보' : 'Depositor name, membership info, or payment reference'}
              maxLength={200}
              rows={2}
              className="w-full bg-white border border-[#e0e4e5] rounded-xl px-3 py-2.5 text-sm text-[#2d3435] placeholder:text-[#acb3b4] focus:outline-none focus:ring-2 focus:ring-[#0057bd]/30 focus:border-[#0057bd] resize-none"
            />
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
    <div className="p-5 bg-white pb-[calc(env(safe-area-inset-bottom)+20px)] sm:pb-5">
      <button
        onClick={handleCompleteClose}
        className="w-full h-12 flex items-center justify-center rounded-xl bg-black text-white font-semibold text-lg transition-transform active:scale-[0.98]"
      >
        {t('common.done', language === 'KR' ? '완료' : 'Done')}
      </button>
    </div>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={handleCompleteClose} title="" footer={completeFooter}>
      <div className="flex flex-col items-center justify-center py-10 px-6 bg-white">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
          <span className="material-symbols-outlined text-4xl text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        </div>
        <h2 className="text-xl font-black text-[#2d3435] mb-2 text-center">
          {t('shop.order_placed', language === 'KR' ? '신청이 완료되었습니다!' : 'Request Completed!')}
        </h2>
        <p className="text-sm text-[#596061] text-center leading-relaxed mb-4">
          {language === 'KR' ? (
            <>신청서 <span className="font-mono font-bold text-[#2d3435]">{displayOrderNumber}</span>번이 정상적으로 접수되었습니다.</>
          ) : (
            <>Order <span className="font-mono font-bold text-[#2d3435]">{displayOrderNumber}</span> has been reported.</>
          )}
        </p>
        <p className="text-xs text-[#acb3b4] text-center leading-relaxed">
          {t('shop.order_placed_desc2', "You'll receive a notification when the seller confirms your payment.")}
        </p>
      </div>
    </BottomSheet>
  );
}
