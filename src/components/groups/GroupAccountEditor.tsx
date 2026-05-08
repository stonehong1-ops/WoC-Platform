"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Group } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { useLanguage } from "@/contexts/LanguageContext";

interface GroupAccountEditorProps {
  group: Group;
  onClose: () => void;
}

export default function GroupAccountEditor({ group, onClose }: GroupAccountEditorProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    bankDetails: group.bankDetails || {
      bankName: "",
      accountHolder: "",
      accountNumber: ""
    }
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await groupService.updateGroupMetadata(group.id, {
        bankDetails: formData.bankDetails
      });
      onClose();
    } catch (error) {
      console.error("Error saving account info:", error);
      alert(t("group.account.error"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[100] bg-[#0a0f1d] flex flex-col overflow-y-auto no-scrollbar"
    >
      {/* Premium Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[-5%] w-[40%] h-[40%] bg-[#8b5cf6]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-[#0057bd]/5 blur-[100px] rounded-full animate-pulse" />
      </div>

      {/* Top Bar - Glassmorphism */}
      <header className="sticky top-0 z-50 bg-[#0a0f1d]/60 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between w-full">
          <div className="flex items-center gap-5">
            <button 
              onClick={onClose}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all group"
            >
              <span className="material-symbols-outlined group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            </button>
            <div>
              <h1 className="text-lg font-headline font-black text-white tracking-tight">{t("group.account.title")}</h1>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{t("group.account.subtitle")}</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-10 py-3 rounded-2xl font-headline font-black text-sm transition-all active:scale-95 flex items-center gap-2 ${
              isSaving
                ? "bg-white/5 text-white/20 cursor-not-allowed"
                : "bg-white text-[#0a0f1d] hover:bg-[#8b5cf6] hover:text-white shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>{t("group.account.saving")}</span>
              </>
            ) : (
              t("group.account.save")
            )}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 py-12 relative z-10 space-y-16 mb-20">
        
        {/* Intro Section */}
        <section className="space-y-4 ml-6">
          <h2 className="text-4xl font-headline font-black text-white tracking-tight leading-tight whitespace-pre-line">{t("group.account.identity.title")}</h2>
          <p className="text-white/40 font-medium max-w-xl">{t("group.account.identity.desc")}</p>
        </section>

        {/* Bank Account Section */}
        <section className="space-y-10">
          <h3 className="text-xl font-headline font-black text-white flex items-center gap-4 ml-6">
            <span className="w-2 h-7 bg-[#8b5cf6] rounded-full"></span>
            {t("group.account.details.title")}
          </h3>
          <div className="bg-white/[0.03] backdrop-blur-xl p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl ml-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">{t("group.account.bank_name.label")}</label>
                <div className="relative">
                  <select
                    className="w-full bg-white/5 border border-white/5 focus:bg-white/10 focus:border-[#8b5cf6]/40 outline-none rounded-2xl px-6 py-4 font-headline font-bold text-white transition-all shadow-inner appearance-none cursor-pointer"
                    value={formData.bankDetails.bankName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      bankDetails: { ...prev.bankDetails, bankName: e.target.value }
                    }))}
                  >
                    <option value="" disabled className="bg-[#0a0f1d] text-white/50">{t("group.account.bank_name.placeholder")}</option>
                    <optgroup label={t("group.account.bank_name.major")} className="bg-[#0a0f1d] text-white/70 font-bold">
                      <option value="KB국민은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.kb", "KB Kookmin Bank")}</option>
                      <option value="신한은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.shinhan", "Shinhan Bank")}</option>
                      <option value="하나은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.hana", "Hana Bank")}</option>
                      <option value="우리은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.woori", "Woori Bank")}</option>
                      <option value="NH농협은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.nh", "NH Nonghyup Bank")}</option>
                      <option value="IBK기업은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.ibk", "IBK Industrial Bank")}</option>
                      <option value="카카오뱅크" className="bg-[#0a0f1d] text-white font-normal">{t("bank.kakao", "KakaoBank")}</option>
                      <option value="토스뱅크" className="bg-[#0a0f1d] text-white font-normal">{t("bank.toss", "Toss Bank")}</option>
                      <option value="케이뱅크" className="bg-[#0a0f1d] text-white font-normal">{t("bank.kbank", "K Bank")}</option>
                    </optgroup>
                    <optgroup label={t("group.account.bank_name.regional")} className="bg-[#0a0f1d] text-white/70 font-bold">
                      <option value="iM뱅크" className="bg-[#0a0f1d] text-white font-normal">{t("bank.im", "iM Bank (formerly DGB)")}</option>
                      <option value="부산은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.busan", "Busan Bank")}</option>
                      <option value="경남은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.kyongnam", "Kyongnam Bank")}</option>
                      <option value="광주은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.kwangju", "Kwangju Bank")}</option>
                      <option value="전북은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.jeonbuk", "Jeonbuk Bank")}</option>
                      <option value="제주은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.jeju", "Jeju Bank")}</option>
                    </optgroup>
                    <optgroup label={t("group.account.bank_name.foreign")} className="bg-[#0a0f1d] text-white/70 font-bold">
                      <option value="SC제일은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.sc", "SC First Bank")}</option>
                      <option value="한국씨티은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.citi", "Citibank Korea")}</option>
                      <option value="수협은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.suhyup", "Suhyup Bank")}</option>
                    </optgroup>
                    <optgroup label={t("group.account.bank_name.special")} className="bg-[#0a0f1d] text-white/70 font-bold">
                      <option value="우체국" className="bg-[#0a0f1d] text-white font-normal">{t("bank.post", "Post Office")}</option>
                      <option value="새마을금고" className="bg-[#0a0f1d] text-white font-normal">{t("bank.mg", "MG Community Credit Cooperatives")}</option>
                      <option value="신협" className="bg-[#0a0f1d] text-white font-normal">{t("bank.shinhyup", "Shinhyup")}</option>
                      <option value="저축은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.savings", "Savings Bank")}</option>
                      <option value="산림조합" className="bg-[#0a0f1d] text-white font-normal">{t("bank.forest", "Forestry Cooperative")}</option>
                    </optgroup>
                  </select>
                  <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">expand_more</span>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">{t("group.account.account_number.label")}</label>
                <input
                  className="w-full bg-white/5 border border-white/5 focus:bg-white/10 focus:border-[#8b5cf6]/40 outline-none rounded-2xl px-6 py-4 font-headline font-bold text-white transition-all shadow-inner"
                  type="text"
                  value={formData.bankDetails.accountNumber}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails, accountNumber: e.target.value }
                  }))}
                  placeholder={t("group.account.account_number.placeholder")}
                />
              </div>
              <div className="space-y-3 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">{t("group.account.account_holder.label")}</label>
                <input
                  className="w-full bg-white/5 border border-white/5 focus:bg-white/10 focus:border-[#8b5cf6]/40 outline-none rounded-2xl px-6 py-4 font-headline font-bold text-white transition-all shadow-inner"
                  type="text"
                  value={formData.bankDetails.accountHolder}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails, accountHolder: e.target.value }
                  }))}
                  placeholder={t("group.account.account_holder.placeholder")}
                />
              </div>
            </div>

            <div className="p-6 bg-[#8b5cf6]/10 rounded-2xl border border-[#8b5cf6]/20 flex gap-4">
               <span className="material-symbols-outlined text-[#8b5cf6]">info</span>
               <p className="text-sm text-white/70 leading-relaxed font-medium">
                 {t("group.account.notice")}
               </p>
            </div>
          </div>
        </section>

      </main>
    </motion.div>
  );
}
