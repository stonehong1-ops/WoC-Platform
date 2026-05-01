'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { shopService } from '@/lib/firebase/shopService';
import { chatService } from '@/lib/firebase/chatService';
import { Product, ShopOrder } from '@/types/shop';
import { Timestamp } from 'firebase/firestore';
import ImageWithFallback from '@/components/common/ImageWithFallback';

type Step = 'summary' | 'payment' | 'complete';

interface PurchaseFlowProps {
  product: Product;
  selectedSize: string;
  selectedOptions: Record<string, any>;
  extraPrice: number;
  fulfillmentType: 'pickup' | 'delivery';
  bankDetails?: { bankName: string; accountHolder: string; accountNumber: string };
  groupId: string;
  groupName: string;
  onClose: () => void;
  onComplete: () => void;
}

const fmt = (n: number) => n.toLocaleString();

export default function PurchaseFlow({
  product, selectedSize, selectedOptions, extraPrice,
  fulfillmentType, bankDetails, groupId, groupName,
  onClose, onComplete
}: PurchaseFlowProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('summary');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderId, setOrderId] = useState<string>('');
  const [copied, setCopied] = useState('');
  const [countdown, setCountdown] = useState(3600); // 60 min
  const { profile } = useAuth();
  const [buyerPhone, setBuyerPhone] = useState('');

  useEffect(() => {
    if (profile?.phoneNumber) {
      setBuyerPhone(profile.phoneNumber);
    }
  }, [profile]);

  const basePrice = product.discountPrice || product.price;
  const itemPrice = basePrice + extraPrice;
  const shippingFee = fulfillmentType === 'delivery' ? (product.sellerPaysShipping ? 0 : (product.shippingFee || 0)) : 0;
  const totalAmount = itemPrice + shippingFee;
  const currency = product.currency || 'KRW';
  const sym = currency === 'KRW' ? '₩' : currency === 'USD' ? '$' : currency + ' ';

  // Countdown timer for payment step
  useEffect(() => {
    if (step !== 'payment') return;
    const t = setInterval(() => setCountdown(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [step]);

  const mm = String(Math.floor(countdown / 60)).padStart(2, '0');
  const ss = String(countdown % 60).padStart(2, '0');

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(''), 1500);
    });
  }, []);

  const [showChatConfirm, setShowChatConfirm] = useState(false);

  // Generate order number
  const genOrderNumber = () => {
    const d = new Date();
    const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    const rand = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
    return `WOC-${date}-${rand}`;
  };

  // Submit order
  const handleConfirmOrder = async () => {
    if (!user || isSubmitting) return;
    if (!buyerPhone.trim()) {
      alert("Please enter a contact number so the seller can reach you.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Update profile phone number if it's missing
      if (profile && !profile.phoneNumber) {
        const { db } = await import('@/lib/firebase/clientApp');
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'users', user.uid), { phoneNumber: buyerPhone });
      }

      const num = genOrderNumber();
      setOrderNumber(num);

      const now = Timestamp.now();
      const deadline = new Timestamp(now.seconds + 3600, now.nanoseconds);

      const orderData: Omit<ShopOrder, 'id' | 'createdAt' | 'updatedAt'> = {
        orderNumber: num,
        groupId,
        groupName,
        buyerId: user.uid,
        buyerName: user.displayName || 'User',
        buyerPhone: buyerPhone,
        sellerId: product.sellerId || 'adminstone', // Unified fallback with chat notifications
        items: [{
          productId: product.id,
          title: product.title,
          image: product.images?.[0] || product.imageUrl || '',
          option: selectedSize,
          quantity: 1,
          price: itemPrice,
          selectedOptions: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined,
          optionExtra: extraPrice > 0 ? extraPrice : undefined,
        }],
        totalAmount,
        currency,
        paymentMethod: 'bank_transfer',
        bankName: bankDetails?.bankName,
        bankAccount: bankDetails?.accountNumber,
        bankHolder: bankDetails?.accountHolder,
        fulfillmentType,
        productionDaysMin: product.productionDaysMin,
        productionDaysMax: product.productionDaysMax,
        status: 'PENDING',
        paymentDeadline: deadline,
      };

      const createdId = await shopService.createOrder(orderData);
      setOrderId(createdId);

      // Automated Chat Notification to Seller
      try {
        const sellerId = product.sellerId || 'adminstone';
        if (sellerId) {
          const roomId = await chatService.getOrCreatePrivateRoom([user.uid, sellerId], user.uid, 'business');
          
          // 1. Initial Product Info Message
          const productInfoMsg = `🛍️ [PRODUCT INQUIRY]\n` +
            `Brand: ${product.brand}\n` +
            `Title: ${product.title}\n` +
            `Price: ${sym}${fmt(itemPrice)}\n` +
            `Image: ${product.images?.[0] || product.imageUrl || ''}\n` +
            `Link: ${window.location.origin}/shop?productId=${product.id}`;

          await chatService.sendMessage({
            roomId,
            senderId: user.uid,
            senderName: user.displayName || 'User',
            text: productInfoMsg,
            type: 'text'
          });

          // 2. Order Placed Message
          const orderMsg = `📦 [ORDER PLACED]\n` +
            `Order No: ${num}\n` +
            `Product: ${product.title}\n` +
            `Option: ${selectedSize || 'None'}\n` +
            `Amount: ${sym}${fmt(totalAmount)}\n` +
            `Image: ${product.images?.[0] || product.imageUrl || ''}`;

          await chatService.sendMessage({
            roomId,
            senderId: user.uid,
            senderName: user.displayName || 'User',
            text: orderMsg,
            type: 'text'
          });
        }
      } catch (chatErr) {
        console.error('Failed to send order chat notification:', chatErr);
        // Don't block the UI if chat fails, order is already created
      }

      setStep('payment');
    } catch (err) {
      console.error('Order creation failed:', err);
      alert('Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
      setShowChatConfirm(false);
    }
  };

  // ━━━ STEP 1: ORDER SUMMARY ━━━
  if (step === 'summary') {
    return (
      <div className="fixed inset-0 z-[200] flex items-end justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative w-full max-w-md bg-white rounded-t-3xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}>
          
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-[#e0e4e5]" />
          </div>

          {/* Header */}
          <div className="px-5 pt-2 pb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-[#2d3435]">Order Summary</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f2f4f4] flex items-center justify-center">
              <span className="material-symbols-outlined text-sm text-[#596061]">close</span>
            </button>
          </div>

          {/* Product */}
          <div className="px-5 pb-4">
            <div className="flex gap-3 p-3 bg-[#f8f9fa] rounded-2xl border border-[#e0e4e5]">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                {(product.images?.[0] || product.imageUrl) && (
                  <ImageWithFallback src={product.images?.[0] || product.imageUrl || ''} alt={product.title} className="w-full h-full object-cover" fallbackType="gallery" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-[#acb3b4] uppercase">{product.brand}</p>
                <p className="text-sm font-bold text-[#2d3435] truncate">{product.title}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedSize && <span className="text-[10px] bg-[#e8eaec] text-[#596061] px-2 py-0.5 rounded-full font-bold">Size: {selectedSize}</span>}
                  {Object.entries(selectedOptions).map(([k, v]) => (
                    <span key={k} className="text-[10px] bg-[#e8eaec] text-[#596061] px-2 py-0.5 rounded-full font-bold">{k}: {String(v)}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Fulfillment */}
          <div className="px-5 pb-4">
            <div className="flex items-center gap-2 p-3 bg-[#f0f4ff] rounded-xl border border-[#dbeafe]">
              <span className="material-symbols-outlined text-sm text-[#0057bd]">
                {fulfillmentType === 'pickup' ? 'store' : 'local_shipping'}
              </span>
              <span className="text-xs font-bold text-[#2d3435]">
                {fulfillmentType === 'pickup' ? 'Store Pickup' : 'Delivery'}
              </span>
              {fulfillmentType === 'delivery' && product.sellerPaysShipping && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold ml-auto">Free Shipping</span>
              )}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="px-5 pb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#596061]">Item Price</span>
              <span className="text-[#2d3435] font-bold">{sym}{fmt(basePrice)}</span>
            </div>
            {extraPrice > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#596061]">Custom Options</span>
                <span className="text-[#2d3435] font-bold">+{sym}{fmt(extraPrice)}</span>
              </div>
            )}
            {fulfillmentType === 'delivery' && (
              <div className="flex justify-between text-sm">
                <span className="text-[#596061]">Shipping</span>
                <span className={`font-bold ${shippingFee === 0 ? 'text-emerald-600' : 'text-[#2d3435]'}`}>
                  {shippingFee === 0 ? 'Free' : `${sym}${fmt(shippingFee)}`}
                </span>
              </div>
            )}
            <div className="border-t border-[#e0e4e5] pt-2 flex justify-between">
              <span className="text-sm font-bold text-[#2d3435]">Total</span>
              <span className="text-xl font-black text-[#0057bd]">{sym}{fmt(totalAmount)}</span>
            </div>
          </div>

          {/* Production Info */}
          {(product.productionDaysMin || product.productionDaysMax) && (
            <div className="px-5 pb-4">
              <div className="flex items-center gap-2 p-3 bg-[#fef9ee] rounded-xl border border-[#fde68a]">
                <span className="material-symbols-outlined text-sm text-amber-600">schedule</span>
                <span className="text-xs text-amber-800">
                  Production: {product.productionDaysMin || '?'}–{product.productionDaysMax || '?'} days
                </span>
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div className="px-5 pb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#596061]">Contact Number <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm text-[#2d3435] focus:outline-none focus:border-[#0057bd] focus:ring-1 focus:ring-[#0057bd] transition-all"
              />
              <p className="text-[10px] text-[#acb3b4]">Seller will contact you at this number regarding your order.</p>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="px-5 pb-6 pt-2">
            <button
              onClick={handleConfirmOrder}
              disabled={isSubmitting}
              className="w-full bg-[#0057bd] text-white py-4 rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-[#0057bd]/20 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : `Confirm · ${sym}${fmt(totalAmount)}`}
            </button>
            <p className="text-[10px] text-[#acb3b4] text-center mt-2">
              By confirming, you agree to transfer the amount within 1 hour.
            </p>
          </div>


        </div>
      </div>
    );
  }

  // ━━━ STEP 2: PAYMENT INSTRUCTIONS ━━━
  if (step === 'payment') {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#f2f4f4]">
          <div className="w-10" />
          <h2 className="text-sm font-black text-[#2d3435]">Payment Instructions</h2>
          <button onClick={() => { setStep('complete'); }} className="w-10 h-10 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-xl text-[#596061]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
          {/* Timer */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-[#fff7ed] border border-[#fed7aa] rounded-2xl px-5 py-3">
              <span className="material-symbols-outlined text-lg text-orange-500">timer</span>
              <span className="text-2xl font-black text-orange-600 font-mono tracking-wider">{mm}:{ss}</span>
            </div>
            <p className="text-xs text-[#596061] mt-2">
              Please transfer within 1 hour.<br/>
              <span className="text-[#acb3b4]">Order may expire if not paid in time.</span>
            </p>
          </div>

          {/* Order Number */}
          <div className="bg-[#f8f9fa] rounded-2xl p-4 border border-[#e0e4e5]">
            <p className="text-[10px] font-bold text-[#acb3b4] uppercase tracking-widest mb-1">Order Number</p>
            <div className="flex items-center justify-between">
              <p className="text-base font-black text-[#2d3435] font-mono">{orderNumber}</p>
              <button onClick={() => copyToClipboard(orderNumber, 'order')}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors ${copied === 'order' ? 'bg-emerald-100 text-emerald-700' : 'bg-[#e8eaec] text-[#596061]'}`}>
                {copied === 'order' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Bank Details */}
          <div className="border border-[#e0e4e5] rounded-2xl overflow-hidden">
            <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-[#0057bd]">account_balance</span>
              <p className="text-[10px] font-black text-[#0057bd] uppercase tracking-widest">Bank Transfer Details</p>
            </div>
            <div className="p-4 space-y-3">
              {/* Bank Name */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#acb3b4] uppercase font-bold">Bank</p>
                  <p className="text-sm font-bold text-[#2d3435]">{bankDetails?.bankName || 'N/A'}</p>
                </div>
              </div>
              {/* Account Number */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#acb3b4] uppercase font-bold">Account Number</p>
                  <p className="text-base font-black text-[#2d3435] font-mono tracking-wide">{bankDetails?.accountNumber || 'N/A'}</p>
                </div>
                <button onClick={() => copyToClipboard(bankDetails?.accountNumber || '', 'account')}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors ${copied === 'account' ? 'bg-emerald-100 text-emerald-700' : 'bg-[#0057bd] text-white'}`}>
                  {copied === 'account' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              {/* Account Holder */}
              <div>
                <p className="text-[10px] text-[#acb3b4] uppercase font-bold">Account Holder</p>
                <p className="text-sm font-bold text-[#2d3435]">{bankDetails?.accountHolder || 'N/A'}</p>
              </div>
              {/* Amount */}
              <div className="bg-[#f0f4ff] rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#0057bd] uppercase font-bold">Transfer Amount</p>
                  <p className="text-xl font-black text-[#0057bd]">{sym}{fmt(totalAmount)}</p>
                </div>
                <button onClick={() => copyToClipboard(String(totalAmount), 'amount')}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors ${copied === 'amount' ? 'bg-emerald-100 text-emerald-700' : 'bg-[#0057bd] text-white'}`}>
                  {copied === 'amount' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="border border-[#e0e4e5] rounded-2xl overflow-hidden">
            <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-[#596061]">info</span>
              <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest">How It Works</p>
            </div>
            <div className="p-4 space-y-4">
              {[
                { num: '1', icon: 'payments', title: 'Transfer the amount', desc: 'Send the exact amount to the bank account above within 1 hour.' },
                { num: '2', icon: 'verified', title: 'Seller confirms payment', desc: 'The seller will verify your transfer and confirm the order.' },
                { num: '3', icon: 'precision_manufacturing', title: 'Production begins', desc: `Your item will be crafted in ${product.productionDaysMin || '?'}–${product.productionDaysMax || '?'} days.` },
                { num: '4', icon: fulfillmentType === 'pickup' ? 'store' : 'local_shipping', title: fulfillmentType === 'pickup' ? 'Pick up at store' : 'Delivery to you', desc: fulfillmentType === 'pickup' ? 'You\'ll be notified when ready for pickup.' : `Delivered within ${product.deliveryDays || '?'} days after production.` },
              ].map(s => (
                <div key={s.num} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#0057bd] text-white flex items-center justify-center text-xs font-black flex-shrink-0">{s.num}</div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#2d3435]">{s.title}</p>
                    <p className="text-[11px] text-[#596061] leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="flex gap-2 p-3 bg-[#fef2f2] rounded-xl border border-red-100">
            <span className="material-symbols-outlined text-sm text-red-400 flex-shrink-0 mt-0.5">warning</span>
            <p className="text-[11px] text-red-600 leading-relaxed">
              If payment is not completed within 1 hour, the order will be automatically cancelled.
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-[#f2f4f4] px-5 py-4">
          <button
            onClick={async () => {
              if (orderId) {
                try {
                  await shopService.updateOrderStatus(orderId, 'PAYMENT_REPORTED', {
                    depositorName: user?.displayName || 'User',
                    depositDate: new Date().toISOString().split('T')[0]
                  });

                  // Notify via Chat
                  const sellerId = product.sellerId || 'adminstone';
                  if (sellerId && user) {
                    const roomId = await chatService.getOrCreatePrivateRoom([user.uid, sellerId], user.uid, 'business');
                    const msg = `💸 [PAYMENT REPORTED]\nOrder No: ${orderNumber}\nDepositor: ${user.displayName || 'User'}\nI have transferred the payment. Please confirm!`;
                    await chatService.sendMessage({
                      roomId,
                      senderId: user.uid,
                      senderName: user.displayName || 'User',
                      text: msg,
                      type: 'text'
                    });
                  }
                } catch (err) {
                  console.error('Failed to report payment:', err);
                }
              }
              setStep('complete');
            }}
            className="w-full bg-[#0057bd] text-white py-4 rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-[#0057bd]/20 active:scale-[0.98] transition-transform"
          >
            I've Transferred the Payment
          </button>
        </div>
      </div>
    );
  }

  // ━━━ STEP 3: ORDER COMPLETE ━━━
  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center animate-in fade-in duration-500 px-6">
      {/* Success Icon */}
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
        <span className="material-symbols-outlined text-4xl text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
      </div>

      <h2 className="text-xl font-black text-[#2d3435] mb-2">Order Placed!</h2>
      <p className="text-sm text-[#596061] text-center leading-relaxed mb-2">
        Your order <span className="font-mono font-bold text-[#2d3435]">{orderNumber}</span> has been placed.
      </p>
      <p className="text-xs text-[#acb3b4] text-center leading-relaxed mb-8">
        You'll receive a notification when the seller confirms your payment.
        <br />Track your order in <span className="font-bold">My {'>'} Orders</span>.
      </p>

      {/* Summary Card */}
      <div className="w-full max-w-sm bg-[#f8f9fa] rounded-2xl p-4 border border-[#e0e4e5] mb-8">
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
            {(product.images?.[0] || product.imageUrl) && (
              <ImageWithFallback src={product.images?.[0] || product.imageUrl || ''} alt={product.title} className="w-full h-full object-cover" fallbackType="gallery" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#2d3435] truncate">{product.title}</p>
            <p className="text-xs text-[#596061]">{selectedSize && `Size ${selectedSize}`} · {sym}{fmt(totalAmount)}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={onComplete}
          className="w-full bg-[#0057bd] text-white py-4 rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-[#0057bd]/20 active:scale-[0.98] transition-transform"
        >
          Go to Shop Home
        </button>
        <button
          onClick={onClose}
          className="w-full bg-[#f2f4f4] text-[#596061] py-3.5 rounded-2xl font-bold text-sm active:scale-[0.98] transition-transform"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
