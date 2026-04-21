"use client";

import React from "react";
import { motion } from "framer-motion";

interface SpaceMembershipEditorProps {
  onClose: () => void;
}

const SpaceMembershipEditor: React.FC<SpaceMembershipEditorProps> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[100] bg-[#f7f5ff] flex flex-col overflow-y-auto no-scrollbar font-body"
    >
      {/* TopAppBar */}
      <header className="sticky top-0 z-50 bg-[#f7f5ff] shadow-[0_32px_32px_rgba(36,44,81,0.06)]">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#d6dbff]/30 transition-colors active:scale-95 duration-200 ease-out text-[#0057bd]"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="font-headline font-bold tracking-tight text-[#0057bd] text-xl">Membership Policy</h1>
          </div>
          <button 
            onClick={onClose}
            className="bg-[#0057bd] text-white px-8 py-2.5 rounded-xl font-bold tracking-tight hover:bg-[#004ca6] hover:shadow-lg transition-all active:scale-95 duration-200"
          >
            Save
          </button>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Section 1: Join Strategy */}
          <section className="lg:col-span-7">
            <header className="mb-8">
              <h2 className="text-3xl font-extrabold text-[#242c51] tracking-tight mb-2 font-headline">Join Strategy</h2>
              <p className="text-[#515981] text-lg">Define how new members enter your community space.</p>
            </header>
            
            <div className="space-y-4">
              {/* Option 1: Open Community */}
              <label className="block cursor-pointer group">
                <input defaultChecked name="join_strategy" type="radio" className="peer hidden" />
                <div className="p-6 rounded-xl bg-white border-2 border-transparent transition-all hover:bg-[#efefff] flex items-start gap-5 peer-checked:border-[#0057bd] peer-checked:shadow-[0_10px_25px_-5px_rgba(0,87,189,0.1)]">
                  <div className="mt-1 w-6 h-6 rounded-full border-2 border-[#a3abd7] flex items-center justify-center transition-colors shrink-0 peer-checked:bg-[#0057bd] peer-checked:border-[#0057bd] relative after:content-[''] after:hidden peer-checked:after:block after:w-2 after:h-2 after:bg-white after:rounded-full">
                    {/* The structure above is a bit complex for pure CSS peer-checked on a child, 
                        so let's use a simplified approach that matches the user's HTML intent */}
                    <div className="w-2 h-2 bg-white rounded-full opacity-0 transition-opacity peer-checked:group-[]:opacity-100"></div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-xl text-[#242c51]">Open Community</h3>
                      <span className="material-symbols-outlined text-[#0057bd]">public</span>
                    </div>
                    <p className="text-[#515981] leading-relaxed">Anyone can join instantly without any prior approval. Best for large public interest groups or discovery-based communities.</p>
                  </div>
                </div>
              </label>

              {/* Option 2: Admin Approval */}
              <label className="block cursor-pointer group">
                <input name="join_strategy" type="radio" className="peer hidden" />
                <div className="p-6 rounded-xl bg-white border-2 border-transparent transition-all hover:bg-[#efefff] flex items-start gap-5 peer-checked:border-[#0057bd] peer-checked:shadow-[0_10px_25px_-5px_rgba(0,87,189,0.1)]">
                  <div className="mt-1 w-6 h-6 rounded-full border-2 border-[#a3abd7] flex items-center justify-center transition-colors shrink-0 peer-checked:bg-[#0057bd] peer-checked:border-[#0057bd]">
                    <div className="w-2 h-2 bg-white rounded-full opacity-0 transition-opacity peer-checked:group-[]:opacity-100"></div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-xl text-[#242c51]">Admin Approval</h3>
                      <span className="material-symbols-outlined text-[#0057bd]">verified_user</span>
                    </div>
                    <p className="text-[#515981] leading-relaxed">Users must request to join. Moderators or Admins will review their profile before granting access. Ideal for semi-private professional groups.</p>
                  </div>
                </div>
              </label>

              {/* Option 3: Manager Selection */}
              <label className="block cursor-pointer group">
                <input name="join_strategy" type="radio" className="peer hidden" />
                <div className="p-6 rounded-xl bg-white border-2 border-transparent transition-all hover:bg-[#efefff] flex items-start gap-5 peer-checked:border-[#0057bd] peer-checked:shadow-[0_10px_25px_-5px_rgba(0,87,189,0.1)]">
                  <div className="mt-1 w-6 h-6 rounded-full border-2 border-[#a3abd7] flex items-center justify-center transition-colors shrink-0 peer-checked:bg-[#0057bd] peer-checked:border-[#0057bd]">
                    <div className="w-2 h-2 bg-white rounded-full opacity-0 transition-opacity peer-checked:group-[]:opacity-100"></div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-xl text-[#242c51]">Manager Selection</h3>
                      <span className="material-symbols-outlined text-[#0057bd]">lock_person</span>
                    </div>
                    <p className="text-[#515981] leading-relaxed">Invite only. New members can only be added by community managers. Maximum security for sensitive or high-value inner circles.</p>
                  </div>
                </div>
              </label>
            </div>
          </section>

          {/* Section 2: Onboarding Flow */}
          <aside className="lg:col-span-5">
            <div className="bg-[#efefff] p-8 rounded-[2rem] relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-[#0057bd]/10 rounded-2xl flex items-center justify-center text-[#0057bd] mb-4">
                    <span className="material-symbols-outlined text-3xl">rocket_launch</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input defaultChecked className="sr-only peer" type="checkbox" />
                    <div className="w-14 h-7 bg-[#a3abd7]/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#0057bd]"></div>
                  </label>
                </div>
                <h3 className="text-2xl font-bold text-[#242c51] mb-2 font-headline">Onboarding Flow</h3>
                <p className="text-[#515981] leading-relaxed mb-6">Enable a guided welcome experience for new members. This includes a welcome message, rules acknowledgment, and profile setup.</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm font-semibold text-[#0057bd]">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Welcome Message
                  </div>
                  <div className="flex items-center gap-3 text-sm font-semibold text-[#0057bd]">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Rule Acceptance
                  </div>
                  <div className="flex items-center gap-3 text-sm font-semibold text-[#0057bd]">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Initial Survey
                  </div>
                </div>
              </div>
              {/* Decorative Element */}
              <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-[#0057bd]/5 rounded-full blur-3xl"></div>
            </div>
          </aside>
        </div>
      </main>

      <style jsx>{`
        input:checked + div {
          border-color: #0057bd;
          background-color: #ffffff;
          box-shadow: 0 10px 25px -5px rgba(0, 87, 189, 0.1);
        }
        input:checked + div .mt-1 {
          background-color: #0057bd;
          border-color: #0057bd;
        }
        input:checked + div .mt-1::after {
          content: '';
          display: block;
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
        }
      `}</style>
    </motion.div>
  );
};

export default SpaceMembershipEditor;
