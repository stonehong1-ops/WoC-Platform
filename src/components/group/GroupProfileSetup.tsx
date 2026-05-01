"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Group } from "@/types/group";
import GroupBasicEditor from "./GroupBasicEditor";
import GroupGalleryEditor from "./GroupGalleryEditor";
import GroupMembershipEditor from "./GroupMembershipEditor";
import GroupContactEditor from "./GroupContactEditor";
import GroupBoardEditor from "./GroupBoardEditor";
import GroupAccountEditor from "./GroupAccountEditor";

interface GroupProfileSetupProps {
  group: Group;
  isLoaded: boolean;
  onBack?: () => void;
}

export default function GroupProfileSetup({ group, isLoaded, onBack }: GroupProfileSetupProps) {
  const [activePopup, setActivePopup] = useState<string | null>(null);

  const steps = [
    { 
      id: 'basic', 
      title: "1. Basic Info", 
      subtitle: "Logo, Cover, Name, Slug", 
      icon: "badge",
      color: "#0057bd",
      bgColor: "#efefff",
      description: "그룹의 기본적인 정체성을 설정하세요. 로고와 커버 이미지는 그룹의 첫인상을 결정합니다."
    },
    { 
      id: 'membership', 
      title: "2. Membership", 
      subtitle: "Policy, Join Strategy", 
      icon: "card_membership",
      color: "#10b981",
      bgColor: "#ecfdf5",
      description: "멤버 가입 정책과 가입 절차를 설정하세요. 명확한 정책은 건강한 커뮤니티의 시작입니다."
    },
    { 
      id: 'contact', 
      title: "3. Contact Info", 
      subtitle: "Address, Phone, SNS", 
      icon: "contact_support",
      color: "#6366f1",
      bgColor: "#eef2ff",
      description: "그룹의 연락처와 소셜 채널을 등록하세요. 멤버들이 그룹과 소통할 수 있는 창구를 마련합니다."
    },
    { 
      id: 'gallery', 
      title: "4. Gallery Setting", 
      subtitle: "Photos, Videos, Layout", 
      icon: "photo_library",
      color: "#f59e0b",
      bgColor: "#fff7ed",
      description: "그룹의 생생한 순간들을 공유할 갤러리를 설정하세요. 고품질 이미지와 영상은 참여를 이끌어냅니다."
    },
    { 
      id: 'boards', 
      title: "5. Board Setup", 
      subtitle: "Categories, Permissions", 
      icon: "dashboard_customize",
      color: "#ec4899",
      bgColor: "#fdf2f8",
      description: "그룹 멤버들이 활동할 게시판 카테고리를 설정하세요. 활동 목적에 맞는 게시판 구성이 필요합니다."
    },
    { 
      id: 'account', 
      title: "6. Account Settings", 
      subtitle: "Bank Name, Account, Holder", 
      icon: "account_balance",
      color: "#8b5cf6",
      bgColor: "#f3e8ff",
      description: "그룹의 결제 대금을 정산받을 계좌 정보를 등록하세요. 서비스 활성화를 위한 필수 정보입니다."
    },
  ];

  // Calculate progress based on existing group data
  const calculateProgress = () => {
    let completed = 0;
    if (group.name && group.logo && group.coverImage) completed++;
    if (group.membershipPolicy) completed++;
    if (group.representative?.name || group.address) completed++;
    if (group.gallery && group.gallery.length > 0) completed++;
    if (group.boards && group.boards.length > 0) completed++;
    if (group.bankDetails?.bankName && group.bankDetails?.accountNumber) completed++;
    return Math.round((completed / 6) * 100);
  };

  const progress = calculateProgress();
  const completedCount = Math.round((progress / 100) * 6);

  return (
    <div className="flex flex-col min-h-screen bg-white relative">
      {/* Premium Sticky Header */}
      <header className="flex-none h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Space Manager</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => alert('Coming soon')}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-500"
          >
            <span className="material-symbols-outlined">search</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        <section className="p-6 md:p-10 max-w-7xl mx-auto w-full">
          {/* Intro */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="font-headline font-bold text-4xl md:text-5xl text-[#242c51] mb-4 leading-tight">Setup your business profile</h2>
              <p className="text-[#515981] text-lg max-w-lg">플랫폼을 공개하고 멤버를 모집하기 위해 아래 필수 설정을 완료해주세요.</p>
            </div>
            
            {/* Progress Indicator */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#a3abd7]/10 flex-shrink-0">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-3xl font-black text-[#0057bd] font-headline">{progress}%</span>
                <div className="flex-1 h-3 bg-[#efefff] rounded-full overflow-hidden min-w-[120px]">
                  <div 
                    className="h-full bg-gradient-to-r from-[#0057bd] to-[#5391ff] transition-all duration-1000" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-xs font-bold text-[#515981]/60 uppercase tracking-widest text-right">{completedCount} of 6 steps finished</p>
            </div>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-6 items-start">
            {steps.map((step, index) => (
              <motion.div 
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-sm flex flex-col h-full border border-gray-100 hover:border-[#0057bd]/20 transition-all group"
              >
                <div className="mb-auto">
                  <div className="flex items-center justify-between mb-6">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: step.bgColor, color: step.color }}
                    >
                      <span className="material-symbols-outlined text-[28px]">{step.icon}</span>
                    </div>
                  </div>
                  <h3 className="font-headline font-bold text-xl text-[#242c51] mb-2 tracking-tight">{step.title}</h3>
                  <p className="text-sm text-[#515981] leading-relaxed">{step.description}</p>
                </div>
                <div className="mt-8 pt-6 border-t border-gray-50">
                  <button 
                    onClick={() => setActivePopup(step.id)}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-sm"
                    style={{ backgroundColor: step.bgColor, color: step.color }}
                  >
                    Edit Settings
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Premium Footer */}
      <footer className="flex-none bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between sticky bottom-0 z-30">
        <div className="flex -space-x-2">
          <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200"></div>
          <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-300"></div>
          <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-400 flex items-center justify-center text-[10px] font-bold text-white uppercase">
            +{Math.max(0, (group.memberCount || 0) - 2)}
          </div>
        </div>
        <button className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
          Save Changes
        </button>
      </footer>

      {/* Editor Popups Overlay */}
      <AnimatePresence>
        {activePopup === 'basic' && (
          <GroupBasicEditor group={group} onClose={() => setActivePopup(null)} />
        )}
        {activePopup === 'gallery' && (
          <GroupGalleryEditor group={group} onClose={() => setActivePopup(null)} />
        )}
        {activePopup === 'membership' && (
          <GroupMembershipEditor group={group} onClose={() => setActivePopup(null)} />
        )}
        {activePopup === 'contact' && (
          <GroupContactEditor group={group} isLoaded={isLoaded} onClose={() => setActivePopup(null)} />
        )}
        {activePopup === 'boards' && (
          <GroupBoardEditor group={group} onClose={() => setActivePopup(null)} />
        )}
        {activePopup === 'account' && (
          <GroupAccountEditor group={group} onClose={() => setActivePopup(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
