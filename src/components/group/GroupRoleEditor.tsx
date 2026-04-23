"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Group } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";

interface GroupRoleEditorProps {
  group: Group;
  onClose: () => void;
}

const GroupRoleEditor: React.FC<GroupRoleEditorProps> = ({ group, onClose }) => {
  const [permissions, setPermissions] = useState(group.staffPermissions || {
    managePosts: true,
    manageMembers: true,
    viewAnalytics: false
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await groupService.updateGroupMetadata(group.id, {
        staffPermissions: permissions
      });
      onClose();
    } catch (error) {
      console.error("Error saving permissions:", error);
      alert("권한 설정 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const roles = [
    {
      id: 'owner',
      title: 'Owner (소유자)',
      icon: 'stars',
      color: '#0057bd',
      desc: '그룹의 모든 권한을 가집니다. 결제 관리, 그룹 설정 및 삭제가 가능합니다.',
      count: '1 Member'
    },
    {
      id: 'staff',
      title: 'Staff (운영진)',
      icon: 'shield_person',
      color: '#893c92',
      desc: '그룹 관리 및 중재 권한을 가집니다. 멤버 관리 및 분석 데이터를 조회할 수 있습니다.',
      count: `${group.members?.filter(m => m.role === 'staff').length || 0} Members`
    },
    {
      id: 'member',
      title: 'Member (일반 멤버)',
      icon: 'group',
      color: '#3a53b7',
      desc: '기본적인 활동 권한을 가집니다. 게시글 작성 및 그룹 내 활동이 가능합니다.',
      count: `${group.memberCount || 0} Members`
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
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-[#0057bd]/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-purple-900/10 blur-[80px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0f1d]/80 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-lg font-headline font-black tracking-tight">Role & Permissions</h1>
              <p className="text-xs text-white/40">멤버 역할 및 스태프 권한 관리</p>
            </div>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`px-8 py-2.5 rounded-xl font-headline font-black transition-all active:scale-95 shadow-2xl ${
              isSaving
                ? "bg-white/10 text-white/30"
                : "bg-white text-black hover:bg-[#0057bd] hover:text-white"
            }`}
          >
            {isSaving ? '저장 중...' : '권한 저장'}
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-screen-xl mx-auto px-6 py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Roles & Permissions */}
          <div className="lg:col-span-8 space-y-12">
            <section>
              <header className="mb-8">
                <h2 className="text-3xl font-headline font-black mb-2">Role Definitions</h2>
                <p className="text-white/60">그룹 내 멤버들의 핵심 권한 체계를 정의합니다.</p>
              </header>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map((role, idx) => (
                  <motion.div
                    key={role.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all ${role.id === 'member' ? 'md:col-span-2' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/10">
                        <span className="material-symbols-outlined text-white" style={{ color: role.color }}>{role.icon}</span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 text-white/40">
                        {role.id}
                      </span>
                    </div>
                    <h3 className="text-xl font-headline font-bold mb-2">{role.title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed mb-6">{role.desc}</p>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-white/30">
                      <span className="material-symbols-outlined text-[14px]">group</span>
                      {role.count}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            <section className="p-8 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#0057bd]/10 blur-[60px] rounded-full" />
              <header className="mb-8">
                <h2 className="text-2xl font-headline font-black mb-2">Staff Permissions</h2>
                <p className="text-white/40 text-sm">운영진에게 부여할 세부 권한을 선택하세요.</p>
              </header>
              
              <div className="space-y-4">
                {[
                  { id: "managePosts", icon: "post_add", label: "게시글 관리", desc: "그룹 내 모든 포스트 수정, 삭제 및 고정 권한" },
                  { id: "manageMembers", icon: "person_search", label: "멤버 관리", desc: "멤버 초대, 추방 및 블랙리스트 관리 권한" },
                  { id: "viewAnalytics", icon: "analytics", label: "데이터 분석", desc: "활동 지표 및 리포트 대시보드 접근 권한" },
                ].map((perm) => (
                  <div key={perm.id} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-[#0057bd]/10 flex items-center justify-center border border-[#0057bd]/20">
                        <span className="material-symbols-outlined text-[#0057bd]">{perm.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{perm.label}</h4>
                        <p className="text-xs text-white/40">{perm.desc}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={permissions[perm.id as keyof typeof permissions]}
                        onChange={() => togglePermission(perm.id as keyof typeof permissions)}
                      />
                      <div className="w-12 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white/40 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0057bd] peer-checked:after:bg-white peer-checked:after:shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                    </label>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Staff List */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 sticky top-28 backdrop-blur-md">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-headline font-black">Staff List</h2>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-[#0057bd] transition-all">
                  <span className="material-symbols-outlined text-sm">person_add</span>
                </button>
              </div>
              
              <div className="space-y-6">
                {group.members?.filter(m => m.role === 'staff').map((staff) => (
                  <div key={staff.id} className="flex items-center gap-4 group">
                    <div className="relative">
                      <img alt={staff.name} className="w-12 h-12 rounded-full object-cover border border-white/10" src={staff.avatar || staff.photoURL || "/default-avatar.png"} />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#893c92] rounded-full border-2 border-[#0a0f1d] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[8px] text-white">shield</span>
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-bold text-sm text-white/90">{staff.name}</h4>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">Staff Member</p>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                      <span className="material-symbols-outlined text-sm">person_remove</span>
                    </button>
                  </div>
                ))}
                {(!group.members || group.members.filter(m => m.role === 'staff').length === 0) && (
                  <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl">
                    <span className="material-symbols-outlined text-white/10 text-4xl mb-2">person_off</span>
                    <p className="text-xs text-white/20">할당된 운영진이 없습니다.</p>
                  </div>
                )}
              </div>

              <div className="mt-10 p-5 rounded-2xl bg-[#0057bd]/5 border border-[#0057bd]/10">
                <p className="text-[11px] text-white/40 leading-relaxed mb-4">
                  그룹 운영을 도와줄 전문가나 파트너를 운영진으로 초대할 수 있습니다. 초대 링크를 생성하세요.
                </p>
                <button className="w-full py-3 bg-white/5 text-white font-headline font-black text-xs rounded-xl border border-white/10 hover:bg-white hover:text-black transition-all">
                  Staff Invite Link 생성
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
};

export default GroupRoleEditor;
