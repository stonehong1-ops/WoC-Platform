"use client";

import React from "react";
import { motion } from "framer-motion";

interface GroupRoleEditorProps {
  onClose: () => void;
}

const GroupRoleEditor: React.FC<GroupRoleEditorProps> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[100] bg-[#f7f5ff] flex flex-col overflow-y-auto no-scrollbar font-body"
    >
      {/* TopAppBar */}
      <header className="bg-[#f7f5ff] shadow-[0_32px_32px_rgba(36,44,81,0.06)] sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="active:scale-95 duration-200 ease-out p-2 rounded-full hover:bg-[#d6dbff]/30 text-[#0057bd]"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="font-headline font-bold tracking-tight text-[#0057bd] text-xl">Member Roles & Staff</h1>
          </div>
          <button 
            onClick={onClose}
            className="bg-gradient-to-br from-[#0057bd] to-[#6e9fff] text-white px-6 py-2 rounded-xl font-semibold shadow-lg active:scale-95 duration-200 ease-out"
          >
            Save
          </button>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Section 1: Role Definitions */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="font-headline text-2xl font-extrabold tracking-tight text-[#242c51]">Role Definitions</h2>
              <p className="text-[#515981] text-sm">Define the core hierarchy and access levels for your group.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Owner Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#0057bd] group hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-[#0057bd]/10 p-3 rounded-lg">
                    <span className="material-symbols-outlined text-[#0057bd]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="bg-[#0057bd]/10 text-[#0057bd] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Owner</span>
                  </div>
                </div>
                <h3 className="font-headline font-bold text-lg mb-2 text-[#242c51]">Owner</h3>
                <p className="text-[#515981] text-sm leading-relaxed mb-6">Full administrative access. Can manage billing, group settings, and delete the group.</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2 text-[#0057bd] font-semibold text-xs">
                    <span>1 Member</span>
                  </div>
                  <button className="flex items-center gap-1 bg-[#0057bd] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md active:scale-95 duration-200 ease-out">
                    <span className="material-symbols-outlined text-sm">person_add_alt</span>
                    Add Owner
                  </button>
                </div>
              </div>

              {/* Staff Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#893c92] group hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-[#f199f7]/20 p-3 rounded-lg">
                    <span className="material-symbols-outlined text-[#893c92]" style={{ fontVariationSettings: "'FILL' 1" }}>shield_person</span>
                  </div>
                  <span className="bg-[#893c92]/10 text-[#893c92] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Staff</span>
                </div>
                <h3 className="font-headline font-bold text-lg mb-2 text-[#242c51]">Staff</h3>
                <p className="text-[#515981] text-sm leading-relaxed mb-4">Moderation and group management. Can view analytics and manage most member activities.</p>
                <div className="flex items-center gap-2 text-[#893c92] font-semibold text-xs">
                  <span>8 Members</span>
                </div>
              </div>

              {/* Member Card */}
              <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#3a53b7] group hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="bg-[#c7cfff]/20 p-3 rounded-lg">
                    <span className="material-symbols-outlined text-[#3a53b7]" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-headline font-bold text-lg text-[#242c51]">Member</h3>
                    <span className="bg-[#3a53b7]/10 text-[#3a53b7] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Standard</span>
                  </div>
                  <p className="text-[#515981] text-sm leading-relaxed">Default role for all new joins. Can participate in discussions, post content, and join public groups.</p>
                </div>
                <div className="flex-shrink-0 bg-[#efefff] px-4 py-2 rounded-lg">
                  <span className="text-[#242c51] font-bold text-xl">1,248</span>
                  <span className="text-[#515981] text-xs block">Active Members</span>
                </div>
              </div>
            </div>

            {/* Staff Permissions */}
            <div className="mt-8 bg-[#efefff] rounded-2xl p-8">
              <div className="flex flex-col gap-2 mb-8">
                <h2 className="font-headline text-2xl font-extrabold tracking-tight text-[#242c51]">Staff Permissions</h2>
                <p className="text-[#515981] text-sm">Granular control over what your staff members can see and do.</p>
              </div>
              <div className="group-y-4">
                {/* Toggle 1 */}
                {[
                  { icon: "post_add", label: "Manage posts", desc: "Edit, delete, or pin any group post", checked: true },
                  { icon: "person_search", label: "Manage members", desc: "Invite, kick, or ban members from the group", checked: true },
                  { icon: "analytics", label: "View analytics", desc: "Access engagement dashboards and reports", checked: false },
                ].map((perm, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#0057bd]/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#0057bd] text-xl">{perm.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-[#242c51]">{perm.label}</h4>
                        <p className="text-xs text-[#515981]">{perm.desc}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input defaultChecked={perm.checked} className="sr-only peer" type="checkbox" />
                      <div className="w-11 h-6 bg-[#a3abd7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0057bd]"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Staff List */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl p-6 shadow-[0_8px_24px_rgba(36,44,81,0.04)] sticky top-28">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-headline font-bold text-xl text-[#242c51]">Staff List</h2>
                <button className="p-2 bg-[#0057bd]/10 rounded-lg hover:bg-[#0057bd]/20 transition-colors">
                  <span className="material-symbols-outlined text-[#0057bd]">person_add</span>
                </button>
              </div>
              <div className="group-y-6">
                {[
                  { name: "Sarah Jenkins", role: "Group Lead", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCl30bOWbj8eu5-5mksyArDh9zEdWo8VmV5_xHkvDg9-nCe9Fo3CfoUyER8UzM8Dr35FK0jFxhGaEUpuJT2Wd4rBxPfRJsGpd_sh8Y6p2MQyMBhMy6WXHDSYvUMPmqxbq5y_F-wU2ucel_EPeF-7g07WuJuA-6AhoD1qa_wlD_D3yUgRuTz0plwWETzDkCWeOmr94-oaDK3vyEj4KK1Y0Vju2vHOSz4Wgvfiwo3xUHbB6t8Kct70p5tECR5odLCS3qIhuu_YI_I3XA" },
                  { name: "Marcus Thorne", role: "Content Moderator", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAOai7AAk1qyjW4YN1qiGchlt4V5yRf6XXdQ5_9BBRKkHN3L0Ldx_NuCsUOwyfGeQJ-pxgkw3f6BTkj-Gg0-Td7e0P88EGl1CRQLM3Ugq3aV5rhbSJ8AHIbPR66ryGo-iKKJb24JEvWOSHpyCR2_f8aFYPxVJROo0b0-6TXt6RUsskBb8_bOGW5rcDldc1Lxql_7C4S_KxwCYOSENPz1HGWOYb3CNZDmBekJ0_ZDrMPChFXhnVUVj6hpOCMCPnrDjr1cVfBXcE18L4" },
                  { name: "Elena Rodriguez", role: "Events Manager", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnGrzgOyEbcgxvJcxBzYOr9JyN70qLZocWA-dXUxr7NbyOWVRFmNpjqVy8ySmDxG3BX1SJb5zW_GAmBBBcdOydTPHCqVUe5F8lGo7JVmk2tFE7xwoaZIHKj8RcnlhsLVJSzK5h1tohYMxqbjBDGp4_oN85CqWtbHyMY8VktcKhtF6nkySQNMZGJWNJv2IzFOhvjBpBa4229eGiOImNRsRm1i8LxqGlYzxnlXmiGDJb13ht2oss6rxPYDziRKfd8jD3dpDSFuQpQFE" },
                  { name: "David Kim", role: "Support Specialist", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAzsJVzkJLzdH2x3KNGIqCuDWYns31SVCdhZtj0Xs705ZGwofkPxhloynQkEQIThrHb9KLiSYXc76GXT8vcQ-WKHCnZHdyvv5N9k-q0hYsJWbH5ZQT-hqHuTBQGiXzqx1J3GW3lpI1dNbLSdpiAs29nu5_VYWl31Xu5i-9dguQ6S_yPc8Ovk_eRT02Ifj0sR6QZt4oAsnLy_tHLtpg3S5G8ExSWbrHuSQaj-2WkiwBZeE6Qnar2cWgO_47NgsN2nz_H_CoPRE7fDIs" },
                ].map((staff, idx) => (
                  <div key={idx} className="flex items-center gap-4 group">
                    <img alt={staff.name} className="w-12 h-12 rounded-full object-cover" src={staff.img} />
                    <div className="flex-grow">
                      <h4 className="font-bold text-sm text-[#242c51]">{staff.name}</h4>
                      <p className="text-xs text-[#515981]">{staff.role}</p>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <span className="material-symbols-outlined text-sm">person_remove</span>
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-10 p-4 rounded-xl bg-[#0057bd]/5 border border-[#0057bd]/10">
                <p className="text-xs text-[#515981] mb-3 leading-relaxed">Need more help? You can invite external consultants to temporary staff roles using high-level access keys.</p>
                <button className="w-full py-2 bg-white text-[#0057bd] font-bold text-xs rounded-lg border border-[#0057bd]/20 hover:bg-[#0057bd]/10 transition-colors">
                  Generate Staff Invite Link
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
