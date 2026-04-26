"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Group, RentalSettings } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { toast } from "sonner";

interface GroupRentalEditorProps {
  group: Group;
}

const GroupRentalEditor: React.FC<GroupRentalEditorProps> = ({ group }) => {
  const [settings, setSettings] = useState<RentalSettings>(
    group.rentalSettings || {
      frequency: "hourly",
      currency: "KRW",
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

  const updateBankDetail = (field: keyof Required<RentalSettings>["bankDetails"], value: string) => {
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

  const handleSave = async () => {
    try {
      setIsUpdating(true);
      await groupService.updateGroupMetadata(group.id, {
        rentalSettings: settings,
      });
      toast.success("Rental 설정이 저장되었습니다.");
    } catch (error) {
      console.error("Error saving rental settings:", error);
      toast.error("설정 저장 중 오류가 발생했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-[var(--on-background)] font-body antialiased selection:bg-[var(--primary)]/10 selection:text-[var(--primary)] bg-[#F3F4F6] min-h-screen pb-32"
    >
      {/* TopAppBar */}
      <header className="bg-[#F3F4F6] docked full-width top-0 z-50 sticky">
        <div className="flex items-center justify-between w-full px-6 py-8 max-w-4xl mx-auto">
          <div className="flex flex-col gap-1">
            <h1 className="font-headline font-extrabold text-3xl tracking-tight text-[#242C51]">Rental Settings</h1>
            <p className="font-body text-[var(--on-surface-variant)] text-sm">Configure default methods for your rental business.</p>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="max-w-4xl mx-auto px-6 pb-20 space-y-6">
        
        {/* Booking Method Section */}
        <section className="bg-[var(--surface-container-lowest)] rounded-xl p-6 shadow-sm border border-[var(--outline-variant)]/10">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[var(--primary)]" data-icon="calendar_month">calendar_month</span>
            <h3 className="font-headline font-bold text-lg text-[var(--on-surface)]">Booking Method</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="font-label font-bold text-[11px] uppercase tracking-wider text-[var(--on-surface-variant)] block">Frequency</label>
              <div className="relative">
                <select 
                  value={settings.frequency}
                  onChange={(e) => setSettings({ ...settings, frequency: e.target.value as any })}
                  className="w-full bg-slate-50 appearance-none border border-[var(--outline-variant)]/20 rounded-lg px-4 py-3 font-body text-[13px] font-medium text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-shadow"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)] pointer-events-none text-sm" data-icon="expand_more">expand_more</span>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section (Reconstructed from Stay Settings) */}
        <section className="bg-[var(--surface-container-lowest)] rounded-xl shadow-sm p-6 border border-[var(--outline-variant)]/10">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[var(--primary)]" data-icon="payments">payments</span>
            <h3 className="font-headline font-bold text-lg text-[var(--on-surface)]">Pricing</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 md:col-span-1">
              <label className="font-label font-bold text-[11px] uppercase tracking-wider text-[var(--on-surface-variant)] block">Currency</label>
              <div className="relative">
                <select 
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full bg-slate-50 appearance-none border border-[var(--outline-variant)]/20 rounded-lg px-4 py-3 font-body text-[13px] font-medium text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-shadow"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="KRW">KRW (₩)</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)] pointer-events-none text-sm" data-icon="expand_more">expand_more</span>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="font-label font-bold text-[11px] uppercase tracking-wider text-[var(--on-surface-variant)] block">Base Amount</label>
              <input 
                value={settings.baseAmount}
                onChange={(e) => setSettings({ ...settings, baseAmount: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-[var(--outline-variant)]/20 rounded-lg px-4 py-3 font-body text-[13px] font-medium text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-shadow" 
                placeholder="0.00" 
                type="number"
              />
            </div>
          </div>
        </section>

        {/* Payment Method Section */}
        <section className="bg-[var(--surface-container-lowest)] rounded-xl p-6 shadow-sm border border-[var(--outline-variant)]/10">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[var(--primary)]" data-icon="account_balance">account_balance</span>
            <h3 className="font-headline font-bold text-lg text-[var(--on-surface)]">Payment Method</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bank Transfer (Enabled) */}
            <label className="relative cursor-pointer group">
              <input 
                checked={settings.paymentMethod === "bank_transfer"}
                onChange={() => setSettings({ ...settings, paymentMethod: "bank_transfer" })}
                className="peer sr-only" 
                name="payment_method" 
                type="radio" 
                value="bank_transfer"
              />
              <div className="w-full p-4 border-2 border-[var(--outline-variant)]/20 rounded-xl peer-checked:border-[var(--primary)] peer-checked:bg-[var(--primary)]/5 hover:bg-slate-50 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[var(--on-surface)]" data-icon="account_balance_wallet">account_balance_wallet</span>
                    <span className="font-headline font-bold text-sm text-[var(--on-surface)]">Bank Transfer</span>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-[var(--outline-variant)] peer-checked:border-[var(--primary)] flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] scale-0 peer-checked:scale-100 transition-transform"></div>
                  </div>
                </div>
                <p className="font-body text-[13px] text-[var(--on-surface-variant)] mt-1">Direct transfer to your verified bank account.</p>
                <div className="mt-3 inline-block px-2 py-1 bg-[var(--tertiary-container)]/30 rounded-full font-label font-bold text-[10px] text-[var(--tertiary)] uppercase tracking-wide">
                  Default
                </div>
              </div>
            </label>
            {/* Credit Card (Disabled) */}
            <label className="relative cursor-not-allowed opacity-60">
              <input disabled className="peer sr-only" name="payment_method" type="radio" value="credit_card"/>
              <div className="w-full p-4 border-2 border-[var(--outline-variant)]/10 bg-slate-100 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[var(--on-surface-variant)]" data-icon="credit_card">credit_card</span>
                    <span className="font-headline font-bold text-sm text-[var(--on-surface-variant)]">Credit Card</span>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-[var(--outline-variant)]/50"></div>
                </div>
                <p className="font-body text-[13px] text-[var(--on-surface-variant)] mt-1">Accept major credit and debit cards.</p>
                <div className="mt-3 inline-block px-2 py-1 bg-[var(--surface-variant)] rounded-full font-label font-bold text-[10px] text-[var(--on-surface-variant)] uppercase tracking-wide">
                  Coming Soon
                </div>
              </div>
            </label>
          </div>
        </section>

        {/* Section 4: Bank Account Details (Reconstructed from Stay Settings) */}
        {settings.paymentMethod === "bank_transfer" && (
          <section className="bg-[var(--surface-container-lowest)] rounded-xl shadow-sm p-6 border border-[var(--outline-variant)]/10">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-[var(--primary)]" data-icon="receipt_long">receipt_long</span>
              <h3 className="font-headline font-bold text-lg text-[var(--on-surface)]">Bank Account Details</h3>
            </div>
            <div className="space-y-8">
              {/* Domestic Transfer */}
              <div className="bg-slate-50 rounded-lg p-5 border border-[var(--outline-variant)]/10">
                <h4 className="font-headline font-bold text-sm text-[var(--on-surface)] mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--secondary)]"></span>
                  Domestic Transfer
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-label font-bold text-[11px] uppercase tracking-wider text-[var(--on-surface-variant)] block">Bank Name</label>
                    <input 
                      value={settings.bankDetails?.bankName || ""}
                      onChange={(e) => updateBankDetail("bankName", e.target.value)}
                      className="w-full bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)]/20 rounded-md px-3 py-2 font-body text-[13px] text-[var(--on-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-shadow" 
                      placeholder="e.g., Chase Bank" 
                      type="text"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label font-bold text-[11px] uppercase tracking-wider text-[var(--on-surface-variant)] block">Account Owner Name</label>
                    <input 
                      value={settings.bankDetails?.ownerName || ""}
                      onChange={(e) => updateBankDetail("ownerName", e.target.value)}
                      className="w-full bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)]/20 rounded-md px-3 py-2 font-body text-[13px] text-[var(--on-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-shadow" 
                      placeholder="Full Legal Name" 
                      type="text"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-label font-bold text-[11px] uppercase tracking-wider text-[var(--on-surface-variant)] block">Account Number</label>
                    <input 
                      value={settings.bankDetails?.accountNumber || ""}
                      onChange={(e) => updateBankDetail("accountNumber", e.target.value)}
                      className="w-full bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)]/20 rounded-md px-3 py-2 font-body text-[13px] text-[var(--on-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-shadow" 
                      placeholder="Routing & Account No." 
                      type="text"
                    />
                  </div>
                </div>
              </div>
              {/* Overseas Transfer */}
              <div className="bg-slate-50 rounded-lg p-5 border border-[var(--outline-variant)]/10">
                <h4 className="font-headline font-bold text-sm text-[var(--on-surface)] mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--tertiary)]"></span>
                  Overseas Transfer (Wise)
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="font-label font-bold text-[11px] uppercase tracking-wider text-[var(--on-surface-variant)] block">IBAN / SWIFT Code</label>
                    <input 
                      value={settings.bankDetails?.swiftCode || ""}
                      onChange={(e) => updateBankDetail("swiftCode", e.target.value)}
                      className="w-full bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)]/20 rounded-md px-3 py-2 font-body text-[13px] text-[var(--on-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-shadow" 
                      placeholder="Enter valid SWIFT/BIC" 
                      type="text"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label font-bold text-[11px] uppercase tracking-wider text-[var(--on-surface-variant)] block">Additional Account Details</label>
                    <textarea 
                      value={settings.bankDetails?.additionalDetails || ""}
                      onChange={(e) => updateBankDetail("additionalDetails", e.target.value)}
                      className="w-full bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)]/20 rounded-md px-3 py-2 font-body text-[13px] text-[var(--on-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-shadow resize-none" 
                      placeholder="Sort code, branch address, etc." 
                      rows={3}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Save Action */}
        <div className="pt-8">
          <button 
            onClick={handleSave}
            disabled={isUpdating}
            className="w-full bg-[var(--primary)] text-[var(--on-primary)] py-4 rounded-xl font-headline font-bold text-base hover:bg-[var(--primary-dim)] transition-all shadow-lg shadow-[var(--primary)]/25 active:scale-[0.98] duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? "Saving..." : "Save Rental Settings"}
          </button>
        </div>
      </main>
    </motion.div>
  );
};

export default GroupRentalEditor;

