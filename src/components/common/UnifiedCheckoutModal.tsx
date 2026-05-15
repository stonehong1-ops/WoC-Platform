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
}

const fmt = (n: number) => n.toLocaleString();

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
  onComplete
}: UnifiedCheckoutModalProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [step, setStep] = useState<Step>('summary');
  const [localProcessing, setLocalProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [countdown, setCountdown] = useState(3600); // 60 min
  const [copied, setCopied] = useState('');

  const sym = currency === 'KRW' ? '₩' : currency === 'USD' ? '$' : currency + ' ';

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('summary');
        setOrderId('');
        setCountdown(3600);
      }, 300); // delay to prevent UI flicker
    }
  }, [isOpen]);

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
        setOrderId(result);
      } else {
        // Fallback for order ID if not returned, just use timestamp for display
        setOrderId(`ORD-${Date.now().toString().slice(-6)}`);
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
        await onReportPayment(orderId);
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
            <p className="text-xs text-[#596061] dark:text-neutral-400 mt-2">
              {t('shop.transfer_within_1h', 'Please transfer within 1 hour.')}<br/>
              <span className="text-[#acb3b4] dark:text-neutral-500">{t('shop.order_expire_notice', 'Order may expire if not paid in time.')}</span>
            </p>
          </div>

          {/* Order Number */}
          <div className="bg-[#f8f9fa] dark:bg-neutral-800 rounded-2xl p-4 border border-[#e0e4e5] dark:border-neutral-700">
            <p className="text-[10px] font-bold text-[#acb3b4] dark:text-neutral-500 uppercase tracking-widest mb-1">{t('shop.order_number', 'Order Number')}</p>
            <div className="flex items-center justify-between">
              <p className="text-base font-black text-[#2d3435] dark:text-white font-mono">{orderId}</p>
              <button onClick={() => copyToClipboard(orderId, 'order')}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors ${copied === 'order' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-[#e8eaec] text-[#596061] dark:bg-neutral-700 dark:text-neutral-300'}`}>
                {copied === 'order' ? t('shop.copied', '✓ Copied') : t('shop.copy', 'Copy')}
              </button>
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
                <button onClick={() => copyToClipboard(String(totalAmount), 'amount')}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors ${copied === 'amount' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-[#0057bd] text-white'}`}>
                  {copied === 'amount' ? t('shop.copied', '✓ Copied') : t('shop.copy', 'Copy')}
                </button>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex gap-2 p-3 bg-[#fef2f2] dark:bg-red-950/30 rounded-xl border border-red-100 dark:border-red-900/50">
            <span className="material-symbols-outlined text-sm text-red-400 flex-shrink-0 mt-0.5">warning</span>
            <p className="text-[11px] text-red-600 dark:text-red-400 leading-relaxed">
              {t('shop.payment_warning', 'If payment is not completed within 1 hour, the order will be automatically cancelled.')}
            </p>
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
          Order <span className="font-mono font-bold text-[#2d3435] dark:text-white">{orderId}</span> has been reported.
        </p>
        <p className="text-xs text-[#acb3b4] dark:text-neutral-500 text-center leading-relaxed">
          {t('shop.order_placed_desc2', "You'll receive a notification when the seller confirms your payment.")}
        </p>
      </div>
    </BottomSheet>
  );
}
