"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Group } from "@/types/group";
import GroupBasicEditor from "./GroupBasicEditor";
import GroupGalleryEditor from "./GroupGalleryEditor";
import GroupMembershipEditor from "./GroupMembershipEditor";
import GroupContactEditor from "./GroupContactEditor";

interface GroupProfileSetupProps {
  group: Group;
  isLoaded: boolean;
}

export default function GroupProfileSetup({ group, isLoaded }: GroupProfileSetupProps) {
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
      id: 'gallery', 
      title: "2. Gallery Setting", 
      subtitle: "Photos, Videos, Layout", 
      icon: "photo_library",
      color: "#f59e0b",
      bgColor: "#fff7ed",
      description: "그룹의 생생한 순간들을 공유할 갤러리를 설정하세요. 고품질 이미지와 영상은 멤버들의 참여를 이끌어냅니다."
    },
  ];

  // Calculate progress based on existing group data
  const calculateProgress = () => {
    let completed = 0;
    if (group.name && group.logo && group.coverImage) completed++;
    if (group.gallery && group.gallery.length > 0) completed++;
    return Math.round((completed / 2) * 100);
  };

  const progress = calculateProgress();
  const completedCount = Math.round((progress / 100) * 2);

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black font-headline tracking-tight text-[#242c51]">
            Profile Setting
          </h1>
          <p className="text-[#515981] font-medium">
            그룹의 기본 정보를 설정하고 브랜딩을 완성하세요.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="hidden md:flex items-center gap-2 px-6 py-2 rounded-full bg-white text-[#0057bd] font-bold text-sm transition-all active:scale-95 border border-[#0057bd]/10 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            Preview
          </button>
          <button className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#242c51]/10 text-[#242c51]/40 font-bold text-sm cursor-not-allowed" disabled>
            Go Live
          </button>
        </div>
      </header>

      <section className="p-0 md:p-10 max-w-7xl mx-auto w-full">
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
            <p className="text-xs font-bold text-[#515981]/60 uppercase tracking-widest text-right">{completedCount} of 2 steps finished</p>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
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
      </AnimatePresence>
    </div>
  );
}
