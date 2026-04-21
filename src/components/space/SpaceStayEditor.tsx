"use client";

import React from "react";
import { motion } from "framer-motion";

const SpaceStayEditor: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen font-body bg-transparent"
    >
      <main className="pt-10 pb-20 px-4 md:px-8 max-w-4xl mx-auto space-y-6 w-full">
        {/* Editor Title */}
        <div className="mb-10">
          <h1 className="font-headline font-extrabold text-3xl tracking-tight text-[#242C51]">Stay Settings</h1>
          <p className="font-body text-[#515981] text-sm mt-2">Configure pricing, criteria, and payment methods for this stay.</p>
        </div>

        {/* Section 1: Booking Criteria */}
        <section className="bg-white rounded-xl shadow-sm p-6 border border-[#a3abd7]/10">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[#0057bd]">calendar_month</span>
            <h3 className="font-headline font-bold text-lg text-[#242c51]">Booking Criteria</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-label font-bold text-[11px] uppercase tracking-wider text-[#515981] block">Frequency</label>
              <div className="relative">
                <select className="w-full bg-slate-50 appearance-none border border-[#a3abd7]/20 rounded-lg px-4 py-3 font-body text-[13px] font-medium text-[#242c51] focus:outline-none focus:ring-2 focus:ring-[#0057bd]/50 transition-shadow">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#515981] pointer-events-none text-sm">expand_more</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="font-label font-bold text-[11px] uppercase tracking-wider text-[#515981] block">Minimum Stay</label>
              <div className="relative">
                <input className="w-full bg-slate-50 appearance-none border border-[#a3abd7]/20 rounded-lg px-4 py-3 font-body text-[13px] font-medium text-[#242c51] focus:outline-none focus:ring-2 focus:ring-[#0057bd]/50 transition-shadow" placeholder="e.g., 2" type="number"/>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#515981] text-[13px] pointer-events-none font-medium">Nights</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Pricing */}
        <section className="bg-white rounded-xl shadow-sm p-6 border border-[#a3abd7]/10">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[#0057bd]">payments</span>
            <h3 className="font-headline font-bold text-lg text-[#242c51]">Pricing</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 md:col-span-1">
              <label className="font-label font-bold text-[11px] uppercase tracking-wider text-[#515981] block">Currency</label>
              <div className="relative">
                <select className="w-full bg-slate-50 appearance-none border border-[#a3abd7]/20 rounded-lg px-4 py-3 font-body text-[13px] font-medium text-[#242c51] focus:outline-none focus:ring-2 focus:ring-[#0057bd]/50 transition-shadow">
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#515981] pointer-events-none text-sm">expand_more</span>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="font-label font-bold text-[11px] uppercase tracking-wider text-[#515981] block">Base Amount</label>
              <input className="w-full bg-slate-50 border border-[#a3abd7]/20 rounded-lg px-4 py-3 font-body text-[13px] font-medium text-[#242c51] focus:outline-none focus:ring-2 focus:ring-[#0057bd]/50 transition-shadow" placeholder="0.00" type="number"/>
            </div>
          </div>
        </section>

        {/* Section 3: Payment Method */}
        <section className="bg-white rounded-xl shadow-sm p-6 border border-[#a3abd7]/10">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[#0057bd]">account_balance</span>
            <h3 className="font-headline font-bold text-lg text-[#242c51]">Payment Method</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Enabled Option */}
            <label className="relative cursor-pointer group">
              <input checked readOnly className="peer sr-only" name="payment_method" type="radio" value="bank_transfer"/>
              <div className="w-full p-4 border-2 border-[#a3abd7]/20 rounded-xl peer-checked:border-[#0057bd] peer-checked:bg-[#0057bd]/5 hover:bg-slate-50 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#242c51]">account_balance_wallet</span>
                    <span className="font-headline font-bold text-sm text-[#242c51]">Bank Transfer</span>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-[#a3abd7] peer-checked:border-[#0057bd] flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#0057bd] scale-0 peer-checked:scale-100 transition-transform"></div>
                  </div>
                </div>
                <p className="font-body text-[13px] text-[#515981] mt-1">Direct transfer to designated accounts.</p>
                <div className="mt-3 inline-block px-2 py-1 bg-[#f199f7]/20 rounded-full font-label font-bold text-[10px] text-[#893c92] uppercase tracking-wide">
                  Default
                </div>
              </div>
            </label>
            {/* Disabled Option */}
            <label className="relative cursor-not-allowed opacity-60">
              <input disabled className="peer sr-only" name="payment_method" type="radio" value="credit_card"/>
              <div className="w-full p-4 border-2 border-[#a3abd7]/10 bg-slate-100 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#515981]">credit_card</span>
                    <span className="font-headline font-bold text-sm text-[#515981]">Credit Card</span>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-[#a3abd7]/50"></div>
                </div>
                <p className="font-body text-[13px] text-[#515981] mt-1">Secure online card processing.</p>
                <div className="mt-3 inline-block px-2 py-1 bg-[#d6dbff] rounded-full font-label font-bold text-[10px] text-[#515981] uppercase tracking-wide">
                  Coming Soon
                </div>
              </div>
            </label>
          </div>
        </section>

        {/* Section 4: Bank Account Details */}
        <section className="bg-white rounded-xl shadow-sm p-6 border border-[#a3abd7]/10">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[#0057bd]">receipt_long</span>
            <h3 className="font-headline font-bold text-lg text-[#242c51]">Bank Account Details</h3>
          </div>
          <div className="space-y-8">
            {/* Domestic Transfer */}
            <div className="bg-slate-50 rounded-lg p-5 border border-[#a3abd7]/10">
              <h4 className="font-headline font-bold text-sm text-[#242c51] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3a53b7]"></span>
                Domestic Transfer
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-label font-bold text-[11px] uppercase tracking-wider text-[#515981] block">Bank Name</label>
                  <input className="w-full bg-white border border-[#a3abd7]/20 rounded-md px-3 py-2 font-body text-[13px] text-[#242c51] focus:outline-none focus:ring-1 focus:ring-[#0057bd] transition-shadow" placeholder="e.g., Chase Bank" type="text"/>
                </div>
                <div className="space-y-1">
                  <label className="font-label font-bold text-[11px] uppercase tracking-wider text-[#515981] block">Account Owner Name</label>
                  <input className="w-full bg-white border border-[#a3abd7]/20 rounded-md px-3 py-2 font-body text-[13px] text-[#242c51] focus:outline-none focus:ring-1 focus:ring-[#0057bd] transition-shadow" placeholder="Full Legal Name" type="text"/>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="font-label font-bold text-[11px] uppercase tracking-wider text-[#515981] block">Account Number</label>
                  <input className="w-full bg-white border border-[#a3abd7]/20 rounded-md px-3 py-2 font-body text-[13px] text-[#242c51] focus:outline-none focus:ring-1 focus:ring-[#0057bd] transition-shadow" placeholder="Routing & Account No." type="text"/>
                </div>
              </div>
            </div>
            {/* Overseas Transfer */}
            <div className="bg-slate-50 rounded-lg p-5 border border-[#a3abd7]/10">
              <h4 className="font-headline font-bold text-sm text-[#242c51] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#893c92]"></span>
                Overseas Transfer (Wise)
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="font-label font-bold text-[11px] uppercase tracking-wider text-[#515981] block">IBAN / SWIFT Code</label>
                  <input className="w-full bg-white border border-[#a3abd7]/20 rounded-md px-3 py-2 font-body text-[13px] text-[#242c51] focus:outline-none focus:ring-1 focus:ring-[#0057bd] transition-shadow" placeholder="Enter valid SWIFT/BIC" type="text"/>
                </div>
                <div className="space-y-1">
                  <label className="font-label font-bold text-[11px] uppercase tracking-wider text-[#515981] block">Additional Account Details</label>
                  <textarea className="w-full bg-white border border-[#a3abd7]/20 rounded-md px-3 py-2 font-body text-[13px] text-[#242c51] focus:outline-none focus:ring-1 focus:ring-[#0057bd] transition-shadow resize-none" placeholder="Sort code, branch address, etc." rows={3}></textarea>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Prominent Full-Width Action Button */}
        <div className="pt-8">
          <button className="w-full bg-[#0057bd] text-white py-4 rounded-xl font-headline font-bold text-base hover:bg-[#004ca6] transition-all shadow-lg shadow-[#0057bd]/25 active:scale-[0.98] duration-200">
            Save Stay Settings
          </button>
        </div>
      </main>
    </motion.div>
  );
};

export default SpaceStayEditor;
