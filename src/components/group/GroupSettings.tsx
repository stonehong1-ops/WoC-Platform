"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Group } from "@/types/group";
import GroupMembershipEditor from "./GroupMembershipEditor";
import GroupBoardEditor from "./GroupBoardEditor";
import GroupRoleEditor from "./GroupRoleEditor";

const GroupSettings = ({ group }: { group: Group }) => {
  const [activePopup, setActivePopup] = useState<string | null>(null);

  const settingsSteps = [
    {
      id: "membership",
      icon: "security",
      status: "COMPLETED",
      statusColor: "bg-emerald-100 text-emerald-700",
      title: "1. Membership Policy",
      desc: "Define join strategies (Open, Approval, or Invite-only) for your group.",
      accent: "border-emerald-100 group-hover:border-emerald-200",
      iconBg: "bg-emerald-50 text-emerald-600",
    },
    {
      id: "boards",
      icon: "dashboard_customize",
      status: "NEEDS EDIT",
      statusColor: "bg-orange-100 text-orange-700",
      title: "2. Board Settings",
      desc: "Manage your boards. Create up to 10 boards including mandatory notices.",
      accent: "border-orange-100 group-hover:border-orange-200",
      iconBg: "bg-orange-50 text-orange-600",
    },
    {
      id: "roles",
      icon: "group_add",
      status: "COMPLETED",
      statusColor: "bg-emerald-100 text-emerald-700",
      title: "3. Roles & Staff",
      desc: "Define member roles and granular staff permissions.",
      accent: "border-emerald-100 group-hover:border-emerald-200",
      iconBg: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="flex-1 flex flex-col relative bg-[#fcfdff] font-body selection:bg-blue-500/10 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md flex justify-between items-center px-6 py-4 w-full border-b border-[#F0F2F9]">
        <div className="flex items-center gap-4">
          <h1 className="font-headline font-bold tracking-tight text-[#242c51] text-xl">Group Setting</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="hidden md:flex items-center gap-2 px-6 py-2 rounded-full bg-white text-[#242c51] font-bold text-sm transition-all active:scale-95 border border-gray-100 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">history</span>
            Audit Logs
          </button>
          <button className="flex items-center gap-2 px-8 py-2 rounded-full bg-[#E2E4F0] text-[#939BB4] font-bold text-sm cursor-not-allowed">
            Go Live
          </button>
        </div>
      </header>

      <section className="px-6 md:px-10 max-w-6xl mx-auto w-full pt-10 pb-32">
        {/* Title Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <h2 className="font-headline font-bold text-4xl md:text-5xl text-[#242c51] mb-5 leading-tight tracking-tight">Setup your group policy</h2>
            <p className="text-[#515981] text-lg leading-relaxed opacity-80">Complete the mandatory configurations below to define how your group interacts and operates.</p>
          </div>
          
          {/* Progress Indicator */}
          <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100 flex-shrink-0 min-w-[240px]">
            <div className="flex items-center gap-4 mb-3">
              <span className="text-3xl font-black text-[#3B82F6] font-headline">66%</span>
              <div className="flex-1 h-3 bg-gray-50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] transition-all duration-1000" 
                  style={{ width: '66.6%' }}
                ></div>
              </div>
            </div>
            <p className="text-[10px] font-bold text-[#515981]/60 uppercase tracking-[0.1em]">2 of 3 steps completed</p>
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
                  Edit Configuration
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
                  <p className="text-lg font-bold">Need help with group settings?</p>
                  <p className="text-white/60 text-sm">Read our documentation or contact our support team.</p>
               </div>
             </div>
             <button className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all border border-white/10 backdrop-blur-md">
               View Guide
             </button>
           </div>
        </div>
      </section>

      {/* Editor Overlays */}
      <AnimatePresence>
        {activePopup === "membership" && (
          <GroupMembershipEditor onClose={() => setActivePopup(null)} />
        )}
        {activePopup === "boards" && (
          <GroupBoardEditor onClose={() => setActivePopup(null)} />
        )}
        {activePopup === "roles" && (
          <GroupRoleEditor onClose={() => setActivePopup(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupSettings;
