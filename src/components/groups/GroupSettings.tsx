"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Group } from "@/types/group";
import GroupMembershipEditor from "./GroupMembershipEditor";
import GroupBoardEditor from "./GroupBoardEditor";
import GroupRoleEditor from "./GroupRoleEditor";
import GroupHomeConfig from "./GroupHomeConfig";
import GroupGalleryEditor from "./GroupGalleryEditor";
import GroupBasicEditor from "./GroupBasicEditor";
import GroupContactEditor from "./GroupContactEditor";
import GroupAccountEditor from "./GroupAccountEditor";
import GroupClassEditor from "./GroupClassEditor";
import GroupRentalEditor from "./GroupRentalEditor";
import GroupShopEditor from "./GroupShopEditor";
import GroupStayEditor from "./GroupStayEditor";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface GroupSettingsProps {
  group: Group;
  onClose?: () => void;
}

const GroupSettings = ({ group, onClose }: GroupSettingsProps) => {
  const searchParams = useSearchParams();
  const [activePopup, setActivePopup] = useState<string | null>(searchParams.get("popup"));
  const { t } = useLanguage();

  React.useEffect(() => {
    const popup = searchParams.get("popup");
    if (popup) {
      setActivePopup(popup);
    }
  }, [searchParams]);

  React.useEffect(() => {
    const handlePopState = () => {
      if (activePopup) {
        setActivePopup(null);
        // Prevent browser from navigating back
        window.history.pushState(null, "", window.location.href);
      }
    };

    if (activePopup) {
      window.history.pushState(null, "", window.location.href);
      window.addEventListener("popstate", handlePopState);
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [activePopup]);

  const settingsSteps = [
    {
      id: "profile",
      icon: "badge",
      status: t("group.settings.status.core"),
      statusColor: "bg-blue-100 text-blue-700",
      title: t("group.settings.step.profile.title"),
      desc: t("group.settings.step.profile.desc"),
      accent: "border-blue-100 group-hover:border-blue-200",
      iconBg: "bg-blue-50 text-blue-600",
    },
    {
      id: "membership",
      icon: "security",
      status: t("group.settings.status.core"),
      statusColor: "bg-emerald-100 text-emerald-700",
      title: t("group.settings.step.membership.title"),
      desc: t("group.settings.step.membership.desc"),
      accent: "border-emerald-100 group-hover:border-emerald-200",
      iconBg: "bg-emerald-50 text-emerald-600",
    },
    {
      id: "boards",
      icon: "dashboard_customize",
      status: t("group.settings.status.core"),
      statusColor: "bg-orange-100 text-orange-700",
      title: t("group.settings.step.boards.title"),
      desc: t("group.settings.step.boards.desc"),
      accent: "border-orange-100 group-hover:border-orange-200",
      iconBg: "bg-orange-50 text-orange-600",
    },
    {
      id: "gallery",
      icon: "grid_view",
      status: t("group.settings.status.core"),
      statusColor: "bg-purple-100 text-purple-700",
      title: t("group.settings.step.gallery.title"),
      desc: t("group.settings.step.gallery.desc"),
      accent: "border-purple-100 group-hover:border-purple-200",
      iconBg: "bg-purple-50 text-purple-600",
    },
    {
      id: "contact",
      icon: "mail",
      status: t("group.settings.status.core"),
      statusColor: "bg-rose-100 text-rose-700",
      title: t("group.settings.step.contact.title"),
      desc: t("group.settings.step.contact.desc"),
      accent: "border-rose-100 group-hover:border-rose-200",
      iconBg: "bg-rose-50 text-rose-600",
    },
    {
      id: "account",
      icon: "account_balance",
      status: t("group.settings.status.core"),
      statusColor: "bg-teal-100 text-teal-700",
      title: t("group.settings.step.account.title"),
      desc: t("group.settings.step.account.desc"),
      accent: "border-teal-100 group-hover:border-teal-200",
      iconBg: "bg-teal-50 text-teal-600",
    },
    {
      id: "role",
      icon: "manage_accounts",
      status: t("group.settings.status.optional"),
      statusColor: "bg-gray-100 text-gray-700",
      title: t("group.settings.step.role.title"),
      desc: t("group.settings.step.role.desc"),
      accent: "border-gray-100 group-hover:border-gray-200",
      iconBg: "bg-gray-50 text-gray-600",
    },
    {
      id: "class",
      icon: "school",
      status: t("group.settings.status.optional"),
      statusColor: "bg-indigo-100 text-indigo-700",
      title: t("group.settings.step.class.title"),
      desc: t("group.settings.step.class.desc"),
      accent: "border-indigo-100 group-hover:border-indigo-200",
      iconBg: "bg-indigo-50 text-indigo-600",
    },
    {
      id: "rental",
      icon: "meeting_room",
      status: t("group.settings.status.optional"),
      statusColor: "bg-cyan-100 text-cyan-700",
      title: t("group.settings.step.rental.title"),
      desc: t("group.settings.step.rental.desc"),
      accent: "border-cyan-100 group-hover:border-cyan-200",
      iconBg: "bg-cyan-50 text-cyan-600",
    },
    {
      id: "shop",
      icon: "storefront",
      status: t("group.settings.status.optional"),
      statusColor: "bg-fuchsia-100 text-fuchsia-700",
      title: t("group.settings.step.shop.title"),
      desc: t("group.settings.step.shop.desc"),
      accent: "border-fuchsia-100 group-hover:border-fuchsia-200",
      iconBg: "bg-fuchsia-50 text-fuchsia-600",
    },
    {
      id: "stay",
      icon: "bed",
      status: t("group.settings.status.optional"),
      statusColor: "bg-lime-100 text-lime-700",
      title: t("group.settings.step.stay.title"),
      desc: t("group.settings.step.stay.desc"),
      accent: "border-lime-100 group-hover:border-lime-200",
      iconBg: "bg-lime-50 text-lime-600",
    },
  ];

  return (
    <div className="flex-1 flex flex-col relative bg-[#fcfdff] font-body selection:bg-blue-500/10 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md flex justify-between items-center px-6 py-4 w-full border-b border-[#F0F2F9]">
        <div className="flex items-center gap-4">
          {onClose && (
            <button onClick={onClose} className="hover:bg-gray-100 p-2 rounded-full transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[#242c51]">arrow_back</span>
            </button>
          )}
          <h1 className="font-headline font-semibold tracking-tight text-[#242c51] text-lg">{t("group.settings.title")}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="hidden md:flex items-center gap-2 px-6 py-2 rounded-full bg-white text-[#242c51] font-bold text-sm transition-all active:scale-95 border border-gray-100 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">history</span>
            {t("group.settings.audit_logs")}
          </button>
          <button className="flex items-center gap-2 px-8 py-2 rounded-full bg-[#E2E4F0] text-[#939BB4] font-bold text-sm cursor-not-allowed">
            {t("group.settings.go_live")}
          </button>
        </div>
      </header>

      <section className="px-6 md:px-10 max-w-6xl mx-auto w-full pt-10 pb-32">
        {/* Title Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <h2 className="font-headline font-bold text-4xl md:text-5xl text-[#242c51] mb-5 leading-tight tracking-tight">{t("group.settings.header.title")}</h2>
            <p className="text-[#515981] text-lg leading-relaxed opacity-80">{t("group.settings.header.desc")}</p>
          </div>
          
          {/* Progress Indicator */}
          <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100 flex-shrink-0 min-w-[240px]">
            <div className="flex items-center gap-4 mb-3">
              <span className="text-3xl font-black text-[#3B82F6] font-headline">0%</span>
              <div className="flex-1 h-3 bg-gray-50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] transition-all duration-1000" 
                  style={{ width: '0%' }}
                ></div>
              </div>
            </div>
            <p className="text-[10px] font-bold text-[#515981]/60 uppercase tracking-[0.1em]">{t("group.settings.progress", { completed: 0, total: 11 })}</p>
          </div>
        </div>

        {/* Configuration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {settingsSteps.map((step, idx) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`bg-white p-8 rounded-[2.5rem] border ${step.accent} shadow-sm flex flex-col h-full transition-all hover:shadow-xl hover:shadow-blue-500/5 group`}
            >
              <div className="mb-auto">
                <div className="flex items-center justify-between mb-8">
                  <div className={`w-14 h-14 rounded-2xl ${step.iconBg} flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}>
                    <span className="material-symbols-outlined text-3xl font-light">{step.icon}</span>
                  </div>
                  <span className={`${step.statusColor} px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest`}>
                    {step.status}
                  </span>
                </div>
                <h3 className="font-headline font-bold text-2xl text-[#242c51] mb-3 tracking-tight">{step.title}</h3>
                <p className="text-base text-[#515981]/80 leading-relaxed min-h-[4.5rem]">{step.desc}</p>
              </div>
              
              <div className="mt-10">
                <button 
                  onClick={() => setActivePopup(step.id)}
                  className="w-full py-4 rounded-2xl bg-gray-50 text-[#242c51] font-bold text-sm hover:bg-[#3B82F6] hover:text-white transition-all active:scale-[0.98] shadow-sm hover:shadow-lg hover:shadow-blue-500/20"
                >
                  {t("group.settings.edit_config")}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-16 p-8 rounded-[2rem] bg-gradient-to-br from-[#242c51] to-[#1a1f3d] text-white overflow-hidden relative group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-colors duration-700"></div>
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="flex items-center gap-5">
               <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                 <span className="material-symbols-outlined text-white">info</span>
               </div>
               <div>
                  <p className="text-lg font-bold">{t("group.settings.help.title")}</p>
                  <p className="text-white/60 text-sm">{t("group.settings.help.desc")}</p>
               </div>
             </div>
             <button className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all border border-white/10 backdrop-blur-md">
               {t("group.settings.help.button")}
             </button>
           </div>
        </div>
      </section>

      {/* Editor Overlays */}
      <AnimatePresence>
        {activePopup === "profile" && (
          <GroupBasicEditor group={group} onClose={() => setActivePopup(null)} />
        )}
        {activePopup === "membership" && (
          <GroupMembershipEditor group={group} onClose={() => setActivePopup(null)} />
        )}
        {activePopup === "boards" && (
          <GroupBoardEditor group={group} onClose={() => setActivePopup(null)} />
        )}
        {activePopup === "gallery" && (
          <GroupGalleryEditor group={group} onClose={() => setActivePopup(null)} />
        )}
        {activePopup === "contact" && (
          <GroupContactEditor group={group} isLoaded={true} onClose={() => setActivePopup(null)} />
        )}
        {activePopup === "account" && (
          <GroupAccountEditor group={group} onClose={() => setActivePopup(null)} />
        )}
        {activePopup === "role" && (
          <GroupRoleEditor group={group} onClose={() => setActivePopup(null)} />
        )}
        {activePopup === "class" && (
          <GroupClassEditor group={group} onClose={() => setActivePopup(null)} />
        )}
        {activePopup === "rental" && (
          <GroupRentalEditor group={group} onClose={() => setActivePopup(null)} />
        )}
        {activePopup === "shop" && (
          <GroupShopEditor group={group} onClose={() => setActivePopup(null)} />
        )}
        {activePopup === "stay" && (
          <GroupStayEditor group={group} onClose={() => setActivePopup(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupSettings;
