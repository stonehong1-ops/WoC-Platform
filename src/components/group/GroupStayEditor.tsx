"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Group, StaySettings } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { toast } from "sonner";

interface GroupStayEditorProps {
  group: Group;
}

const GroupStayEditor: React.FC<GroupStayEditorProps> = ({ group }) => {
  const [settings, setSettings] = useState<StaySettings>(
    group.staySettings || {
      frequency: "daily",
      minStay: 1,
      currency: "USD",
      baseAmount: 0,
      paymentMethod: "bank_transfer",
      bankDetails: {
        bankName: "",
        ownerName: "",
        accountNumber: "",
        swiftCode: "",
        additionalDetails: "",
      },
    }
  );

  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    try {
      setIsUpdating(true);
      await groupService.updateGroupMetadata(group.id, {
        staySettings: settings,
      });
      toast.success("Stay 설정이 저장되었습니다.");
    } catch (error) {
      console.error("Error saving stay settings:", error);
      toast.error("설정 저장 중 오류가 발생했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  const updateBankDetail = (field: keyof Required<StaySettings>["bankDetails"], value: string) => {
    setSettings((prev) => ({
      ...prev,
      bankDetails: {
        ...(prev.bankDetails || {
          bankName: "",
          ownerName: "",
          accountNumber: "",
          swiftCode: "",
          additionalDetails: "",
        }),
        [field]: value,
      },
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen font-body bg-transparent pb-32"
    >
      {/* Header */}
      <header className="px-6 py-12 md:py-16 max-w-4xl mx-auto w-full">
        <h1 className="font-headline font-black text-3xl md:text-4xl tracking-tight text-[var(--on-surface)]">Stay Setting</h1>
        <p className="text-[var(--on-surface-variant)] text-base mt-2 font-medium">Configure stay rates, booking criteria, and payment methods.</p>
      </header>

      <main className="max-w-4xl mx-auto px-6 flex flex-col gap-10 w-full">
        {/* Section 1: Booking Criteria */}
        <section className="bg-white/70 backdrop-blur-md rounded-[32px] p-8 shadow-[var(--shadow-premium)] border border-white/80 transition-all hover:shadow-2xl hover:bg-white/90">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[var(--primary)]">calendar_month</span>
            </div>
            <h3 className="font-headline font-black text-xl text-[var(--on-surface)]">Booking Criteria</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-3">
              <label className="font-headline font-black text-[11px] uppercase tracking-[0.15em] text-[var(--on-surface-variant)] ml-1">Unit</label>
              <div className="relative group">
                <select 
                  value={settings.frequency}
                  onChange={(e) => setSettings({ ...settings, frequency: e.target.value as any })}
                  className="w-full bg-[var(--surface-container-low)] appearance-none border border-[var(--outline-variant)]/30 rounded-2xl px-5 py-4 font-body text-[15px] font-bold text-[var(--on-surface)] focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all cursor-pointer group-hover:border-[var(--primary)]/30"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)] pointer-events-none text-xl transition-transform group-hover:translate-y-[-40%]">expand_more</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <label className="font-headline font-black text-[11px] uppercase tracking-[0.15em] text-[var(--on-surface-variant)] ml-1">Minimum Stay</label>
              <div className="relative group">
                <input 
                  value={settings.minStay}
                  onChange={(e) => setSettings({ ...settings, minStay: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[var(--surface-container-low)] appearance-none border border-[var(--outline-variant)]/30 rounded-2xl px-5 py-4 font-body text-[15px] font-bold text-[var(--on-surface)] focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all group-hover:border-[var(--primary)]/30" 
                  placeholder="e.g. 2" 
                  type="number"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)] text-[12px] pointer-events-none font-black uppercase tracking-widest">Nights</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Pricing */}
        <section className="bg-white/70 backdrop-blur-md rounded-[32px] p-8 shadow-[var(--shadow-premium)] border border-white/80 transition-all hover:shadow-2xl hover:bg-white/90">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[var(--primary)]">payments</span>
            </div>
            <h3 className="font-headline font-black text-xl text-[var(--on-surface)]">Pricing</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3 md:col-span-1">
              <label className="font-headline font-black text-[11px] uppercase tracking-[0.15em] text-[var(--on-surface-variant)] ml-1">Currency</label>
              <div className="relative group">
                <select 
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full bg-[var(--surface-container-low)] appearance-none border border-[var(--outline-variant)]/30 rounded-2xl px-5 py-4 font-body text-[15px] font-bold text-[var(--on-surface)] focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all cursor-pointer group-hover:border-[var(--primary)]/30"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="KRW">KRW (₩)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
                <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)] pointer-events-none text-xl group-hover:translate-y-[-40%] transition-transform">expand_more</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 md:col-span-2">
              <label className="font-headline font-black text-[11px] uppercase tracking-[0.15em] text-[var(--on-surface-variant)] ml-1">Base Rate</label>
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)] font-headline font-black text-lg pointer-events-none">
                  {settings.currency === 'KRW' ? '₩' : settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : settings.currency === 'JPY' ? '¥' : settings.currency === 'GBP' ? '£' : ''}
                </span>
                <input 
                  value={settings.baseAmount}
                  onChange={(e) => setSettings({ ...settings, baseAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/30 rounded-2xl pl-12 pr-5 py-4 font-body text-[15px] font-bold text-[var(--on-surface)] focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all group-hover:border-[var(--primary)]/30" 
                  placeholder="0.00" 
                  type="number"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Payment Method */}
        <section className="bg-white/70 backdrop-blur-md rounded-[32px] p-8 shadow-[var(--shadow-premium)] border border-white/80 transition-all hover:shadow-2xl hover:bg-white/90">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[var(--primary)]">account_balance</span>
            </div>
            <h3 className="font-headline font-black text-xl text-[var(--on-surface)]">Payment Method</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Enabled Option */}
            <label className="relative cursor-pointer group">
              <input 
                type="radio" 
                name="payment_method" 
                value="bank_transfer"
                checked={settings.paymentMethod === "bank_transfer"}
                onChange={() => setSettings({ ...settings, paymentMethod: "bank_transfer" })}
                className="peer sr-only" 
              />
              <div className="w-full p-6 border-2 border-[var(--outline-variant)]/30 rounded-[28px] peer-checked:border-[var(--primary)] peer-checked:bg-[var(--primary)]/[0.03] transition-all group-hover:border-[var(--primary)]/40 hover:bg-white/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--surface-container-high)] flex items-center justify-center transition-all peer-checked:bg-[var(--primary)]/10 group-hover:scale-110">
                      <span className="material-symbols-outlined text-[var(--on-surface)]">account_balance_wallet</span>
                    </div>
                    <span className="font-headline font-black text-[15px] text-[var(--on-surface)]">Bank Transfer</span>
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 border-[var(--outline-variant)] flex items-center justify-center transition-all peer-checked:border-[var(--primary)]">
                    <div className="w-3 h-3 rounded-full bg-[var(--primary)] scale-0 peer-checked:scale-100 transition-transform"></div>
                  </div>
                </div>
                <p className="font-body text-sm font-medium text-[var(--on-surface-variant)] leading-relaxed">Transfer directly to the designated account.</p>
                <div className="mt-4 inline-block px-3 py-1 bg-[var(--secondary-container)] rounded-full font-headline font-black text-[10px] text-[var(--on-secondary-container)] uppercase tracking-widest">
                  Default
                </div>
              </div>
            </label>
            {/* Disabled Option */}
            <label className="relative cursor-not-allowed opacity-50">
              <input disabled className="peer sr-only" name="payment_method" type="radio" value="credit_card"/>
              <div className="w-full p-6 border-2 border-[var(--outline-variant)]/20 bg-[var(--surface-container-low)]/50 rounded-[28px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--surface-container-high)]/50 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[var(--outline)]">credit_card</span>
                    </div>
                    <span className="font-headline font-black text-[15px] text-[var(--outline)]">Credit Card</span>
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 border-[var(--outline-variant)]/50"></div>
                </div>
                <p className="font-body text-sm font-medium text-[var(--outline)] leading-relaxed">Secure online card payment system.</p>
                <div className="mt-4 inline-block px-3 py-1 bg-[var(--surface-container-high)] rounded-full font-headline font-black text-[10px] text-[var(--outline)] uppercase tracking-widest">
                  Coming Soon
                </div>
              </div>
            </label>
          </div>
        </section>

        {/* Section 4: Bank Account Details */}
        {settings.paymentMethod === "bank_transfer" && (
          <section className="bg-white/70 backdrop-blur-md rounded-[32px] p-8 shadow-[var(--shadow-premium)] border border-white/80 transition-all hover:shadow-2xl hover:bg-white/90">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--primary)]">receipt_long</span>
              </div>
              <h3 className="font-headline font-black text-xl text-[var(--on-surface)]">Bank Account Details</h3>
            </div>
            <div className="flex flex-col gap-10">
              {/* Domestic Transfer */}
              <div className="bg-[var(--surface-container-low)]/50 rounded-[28px] p-6 md:p-8 border border-[var(--outline-variant)]/20">
                <h4 className="font-headline font-black text-sm text-[var(--on-surface)] mb-6 flex items-center gap-3 uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-[var(--primary)]"></span>
                  Domestic Transfer
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="font-headline font-black text-[11px] uppercase tracking-[0.15em] text-[var(--on-surface-variant)] ml-1">Bank Name</label>
                    <input 
                      value={settings.bankDetails?.bankName || ""}
                      onChange={(e) => updateBankDetail("bankName", e.target.value)}
                      className="w-full bg-white border border-[var(--outline-variant)]/30 rounded-xl px-4 py-3 font-body text-sm font-bold text-[var(--on-surface)] focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all" 
                      placeholder="e.g. Kookmin Bank" 
                      type="text"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-headline font-black text-[11px] uppercase tracking-[0.15em] text-[var(--on-surface-variant)] ml-1">Account Holder</label>
                    <input 
                      value={settings.bankDetails?.ownerName || ""}
                      onChange={(e) => updateBankDetail("ownerName", e.target.value)}
                      className="w-full bg-white border border-[var(--outline-variant)]/30 rounded-xl px-4 py-3 font-body text-sm font-bold text-[var(--on-surface)] focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all" 
                      placeholder="Enter full name" 
                      type="text"
                    />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="font-headline font-black text-[11px] uppercase tracking-[0.15em] text-[var(--on-surface-variant)] ml-1">Account Number</label>
                    <input 
                      value={settings.bankDetails?.accountNumber || ""}
                      onChange={(e) => updateBankDetail("accountNumber", e.target.value)}
                      className="w-full bg-white border border-[var(--outline-variant)]/30 rounded-xl px-4 py-3 font-body text-sm font-bold text-[var(--on-surface)] focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all" 
                      placeholder="Include hyphens (-)" 
                      type="text"
                    />
                  </div>
                </div>
              </div>
              {/* Overseas Transfer */}
              <div className="bg-[var(--surface-container-low)]/50 rounded-[28px] p-6 md:p-8 border border-[var(--outline-variant)]/20">
                <h4 className="font-headline font-black text-sm text-[var(--on-surface)] mb-6 flex items-center gap-3 uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-[var(--tertiary)]"></span>
                  International Transfer (SWIFT/Wise)
                </h4>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="font-headline font-black text-[11px] uppercase tracking-[0.15em] text-[var(--on-surface-variant)] ml-1">IBAN / SWIFT Code</label>
                    <input 
                      value={settings.bankDetails?.swiftCode || ""}
                      onChange={(e) => updateBankDetail("swiftCode", e.target.value)}
                      className="w-full bg-white border border-[var(--outline-variant)]/30 rounded-xl px-4 py-3 font-body text-sm font-bold text-[var(--on-surface)] focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all" 
                      placeholder="Enter SWIFT/BIC code" 
                      type="text"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-headline font-black text-[11px] uppercase tracking-[0.15em] text-[var(--on-surface-variant)] ml-1">Additional Details</label>
                    <textarea 
                      value={settings.bankDetails?.additionalDetails || ""}
                      onChange={(e) => updateBankDetail("additionalDetails", e.target.value)}
                      className="w-full bg-white border border-[var(--outline-variant)]/30 rounded-xl px-4 py-3 font-body text-sm font-bold text-[var(--on-surface)] focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all resize-none min-h-[100px]" 
                      placeholder="Branch code, branch address, and other additional info" 
                      rows={3}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Action Button */}
        <div className="pt-10">
          <button 
            onClick={handleSave}
            disabled={isUpdating}
            className="w-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-white font-headline font-black py-6 rounded-[28px] shadow-2xl shadow-[var(--primary)]/20 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? "Saving..." : "Save Stay Setting"}
          </button>
        </div>
      </main>
    </motion.div>
  );
};

export default GroupStayEditor;
