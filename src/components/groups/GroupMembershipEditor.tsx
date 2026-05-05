"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Group } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";

interface GroupMembershipEditorProps {
  group: Group;
  onClose: () => void;
}

const GroupMembershipEditor: React.FC<GroupMembershipEditorProps> = ({ group, onClose }) => {
  const [joinStrategy, setJoinStrategy] = useState<'open' | 'approval' | 'invite'>(
    group.membershipPolicy?.joinStrategy || 'open'
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await groupService.updateGroupMetadata(group.id, {
        membershipPolicy: {
          joinStrategy,
        }
      });
      onClose();
    } catch (error) {
      console.error("Error saving membership policy:", error);
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const strategies = [
    {
      id: 'open',
      title: 'Open Group (공개 그룹)',
      icon: 'public',
      desc: '누구나 즉시 가입할 수 있는 개방형 커뮤니티입니다. 대규모 공지나 정보 공유 목적에 적합합니다.',
    },
    {
      id: 'approval',
      title: 'Admin Approval (승인제)',
      icon: 'verified_user',
      desc: '가입 신청 후 관리자의 승인이 필요합니다. 커뮤니티의 성격에 맞는 멤버를 선별할 때 유용합니다.',
    },
    {
      id: 'invite',
      title: 'Manager Selection (초대제)',
      icon: 'lock_person',
      desc: '관리자가 직접 초대한 멤버만 가입할 수 있습니다. 보안이 중요하거나 소수 정예 모임에 최적화되어 있습니다.',
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#0a0f1d] flex flex-col overflow-y-auto no-scrollbar font-body text-white"
    >
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#0057bd]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[100px] rounded-full" />
      </div>

      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-[#0a0f1d]/80 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-90"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-lg font-headline font-black tracking-tight text-white">Membership Policy</h1>
              <p className="text-xs text-white/40">커뮤니티 가입 방식 설정</p>
            </div>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`px-8 py-2.5 rounded-xl font-headline font-black transition-all active:scale-95 shadow-2xl ${
              isSaving
                ? "bg-white/10 text-white/30 cursor-not-allowed"
                : "bg-white text-black hover:bg-[#0057bd] hover:text-white"
            }`}
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>저장 중...</span>
              </div>
            ) : '정책 저장'}
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-6 py-12 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          <header>
            <h2 className="text-4xl font-headline font-black text-white tracking-tighter mb-4 leading-none">
              Join Strategy
            </h2>
            <p className="text-white/60 text-lg leading-relaxed">
              새로운 멤버가 커뮤니티에 합류하는 방식을 정의하세요. <br/>
              운영 목적에 따라 가입 문턱을 조절할 수 있습니다.
            </p>
          </header>
          
          <div className="space-y-4">
            {strategies.map((strategy, index) => (
              <motion.label
                key={strategy.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="block cursor-pointer group"
              >
                <input 
                  name="join_strategy" 
                  type="radio" 
                  className="peer hidden" 
                  checked={joinStrategy === strategy.id}
                  onChange={() => setJoinStrategy(strategy.id as any)}
                />
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 transition-all duration-300 hover:bg-white/10 flex items-start gap-6 peer-checked:border-[#0057bd] peer-checked:bg-[#0057bd]/10 peer-checked:shadow-[0_0_30px_rgba(0,87,189,0.2)]">
                  <div className="mt-1 w-6 h-6 rounded-full border-2 border-white/20 flex items-center justify-center transition-all duration-300 shrink-0 peer-checked:border-[#0057bd] peer-checked:bg-[#0057bd]">
                    <div className={`w-2 h-2 bg-white rounded-full transition-all duration-300 ${joinStrategy === strategy.id ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}></div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-headline font-bold text-xl transition-colors ${joinStrategy === strategy.id ? 'text-white' : 'text-white/80'}`}>
                        {strategy.title}
                      </h3>
                      <span className={`material-symbols-outlined transition-all ${joinStrategy === strategy.id ? 'text-[#0057bd] scale-110' : 'text-white/20'}`}>
                        {strategy.icon}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed transition-colors ${joinStrategy === strategy.id ? 'text-white/70' : 'text-white/40'}`}>
                      {strategy.desc}
                    </p>
                  </div>
                </div>
              </motion.label>
            ))}
          </div>

          <footer className="pt-8 border-t border-white/5">
            <div className="p-6 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center">
              <span className="material-symbols-outlined text-[#0057bd] mb-3 block">info</span>
              <p className="text-white/40 text-sm">
                정책 변경 시 기존 대기 중인 가입 신청자들에게는 <br/>
                새로운 정책이 소급 적용되지 않을 수 있습니다.
              </p>
            </div>
          </footer>
        </motion.div>
      </main>
    </motion.div>
  );
};

export default GroupMembershipEditor;
