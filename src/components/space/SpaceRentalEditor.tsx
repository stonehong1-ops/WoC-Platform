"use client";

import React from "react";
import { motion } from "framer-motion";

const SpaceRentalEditor: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen font-body bg-transparent"
    >
      {/* Header */}
      <header className="px-6 py-8 max-w-4xl mx-auto w-full">
        <div className="flex flex-col gap-1">
          <h1 className="font-headline font-extrabold text-3xl tracking-tight text-[#242C51]">Rental Settings</h1>
          <p className="font-body text-[#515981] text-sm">Configure default methods for your rental business.</p>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="max-w-4xl mx-auto px-6 pb-20 space-y-6 w-full">
        {/* Booking Method Section */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-[#a3abd7]/10">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[#0057bd]">calendar_month</span>
            <h3 className="font-headline font-bold text-lg text-[#242c51]">Booking Method</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="font-label font-bold text-[11px] uppercase tracking-wider text-[#515981] block">Frequency</label>
              <div className="relative">
                <select className="w-full bg-slate-50 appearance-none border border-[#a3abd7]/20 rounded-lg px-4 py-3 font-body text-[13px] font-medium text-[#242c51] focus:outline-none focus:ring-2 focus:ring-[#0057bd]/50 transition-shadow">
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#515981] pointer-events-none text-sm">expand_more</span>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Method Section */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-[#a3abd7]/10">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[#0057bd]">account_balance</span>
            <h3 className="font-headline font-bold text-lg text-[#242c51]">Payment Method</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bank Transfer (Enabled) */}
            <label className="relative cursor-pointer group">
              <input checked readOnly className="peer sr-only" name="payment-method" type="radio" value="bank_transfer"/>
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
                <p className="font-body text-[13px] text-[#515981] mt-1">Direct transfer to your verified bank account.</p>
                <div className="mt-3 inline-block px-2 py-1 bg-[#f199f7]/20 rounded-full font-label font-bold text-[10px] text-[#893c92] uppercase tracking-wide">
                  Default
                </div>
              </div>
            </label>
            {/* Credit Card (Disabled) */}
            <label className="relative cursor-not-allowed opacity-60">
              <input disabled className="peer sr-only" name="payment-method" type="radio" value="credit_card"/>
              <div className="w-full p-4 border-2 border-[#a3abd7]/10 bg-slate-100 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#515981]">credit_card</span>
                    <span className="font-headline font-bold text-sm text-[#515981]">Credit Card</span>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-[#a3abd7]/50"></div>
                </div>
                <p className="font-body text-[13px] text-[#515981] mt-1">Accept major credit and debit cards.</p>
                <div className="mt-3 inline-block px-2 py-1 bg-[#d6dbff] rounded-full font-label font-bold text-[10px] text-[#515981] uppercase tracking-wide">
                  Coming Soon
                </div>
              </div>
            </label>
          </div>
        </section>

        {/* Save Action */}
        <div className="pt-8">
          <button className="w-full bg-[#0057bd] text-white py-4 rounded-xl font-headline font-bold text-base hover:bg-[#004ca6] transition-all shadow-lg shadow-[#0057bd]/25 active:scale-[0.98] duration-200">
            Save Rental Settings
          </button>
        </div>
      </main>
    </motion.div>
  );
};

export default SpaceRentalEditor;
