"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Member } from "@/types/group";
import { useLanguage } from "@/contexts/LanguageContext";

interface GroupMembersProps {
  members: Member[];
  memberCount: number;
  onMemberClick?: (member: Member) => void;
  onClose: () => void;
}

type FilterCategory = 'all' | 'owner' | 'staff' | 'instructor' | 'member';

export default function GroupMembers({ members, memberCount, onMemberClick, onClose }: GroupMembersProps) {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeMembers = useMemo(() => {
    return members.filter(m => m.status === 'active' || !m.status);
  }, [members]);

  const filteredMembers = useMemo(() => {
    let result = activeMembers;

    if (activeFilter === 'owner') {
      result = result.filter(m => m.role === 'admin' || m.role === 'owner');
    } else if (activeFilter === 'staff') {
      result = result.filter(m => m.role === 'staff' || m.role === 'moderator');
    } else if (activeFilter === 'instructor') {
      result = result.filter(m => m.role === 'instructor');
    } else if (activeFilter === 'member') {
      result = result.filter(m => !m.role || m.role === 'member');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => m.name?.toLowerCase().includes(q) || (m as any).nickname?.toLowerCase().includes(q));
    }

    return result;
  }, [activeMembers, activeFilter, searchQuery]);

  const getRoleBadge = (member: Member) => {
    if (member.role === 'admin' || member.role === 'owner') return { label: 'OWNER', color: '#0057bd', icon: 'stars' };
    if (member.role === 'staff' || member.role === 'moderator') return { label: 'STAFF', color: '#893c92', icon: 'shield_person' };
    if (member.role === 'instructor') return { label: 'INSTRUCTOR', color: '#e65100', icon: 'school' };
    return { label: 'MEMBER', color: '#3a53b7', icon: 'group' };
  };

  const filters: { id: FilterCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: 'grid_view' },
    { id: 'owner', label: 'Owner', icon: 'stars' },
    { id: 'staff', label: 'Staff', icon: 'shield_person' },
    { id: 'instructor', label: 'Instructor', icon: 'school' },
    { id: 'member', label: 'Member', icon: 'group' }
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
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all shrink-0"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-lg font-headline font-black tracking-tight">Member Directory</h1>
              <p className="text-xs text-white/40">Manage and view all {memberCount || activeMembers.length} community members.</p>
            </div>
          </div>
          
          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40">search</span>
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all font-medium text-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <span className="material-symbols-outlined text-[12px] text-white/70">close</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-screen-xl mx-auto px-6 py-12 w-full flex-1 flex flex-col">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-12">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
                activeFilter === filter.id
                  ? 'bg-white text-[#0a0f1d] shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{filter.icon}</span>
              {filter.label}
            </button>
          ))}
        </div>

        {/* Member Grid */}
        <AnimatePresence mode="popLayout">
          {filteredMembers.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filteredMembers.map((member, idx) => {
                const badge = getRoleBadge(member);
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, delay: Math.min(idx * 0.05, 0.5) }}
                    key={member.id}
                    onClick={() => onMemberClick?.(member)}
                    className="group bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-3xl p-5 flex items-center gap-4 cursor-pointer transition-all active:scale-95 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-full overflow-hidden border border-white/20 bg-white/10 flex items-center justify-center">
                        {(member.avatar || member.photoURL) ? (
                          <img className="w-full h-full object-cover" src={member.avatar || member.photoURL} alt={member.name} />
                        ) : (
                          <span className="font-bold text-white/70 text-lg">
                            {(member.name || (member as any).nickname || 'U').substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div 
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0a0f1d]"
                        style={{ backgroundColor: badge.color }}
                      >
                        <span className="material-symbols-outlined text-[10px] text-white">{badge.icon}</span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-headline font-bold text-base text-white truncate group-hover:text-white/90 transition-colors">
                        {member.name || (member as any).nickname}
                      </h4>
                      <p 
                        className="text-[10px] font-black uppercase tracking-widest mt-1"
                        style={{ color: badge.color }}
                      >
                        {badge.label}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/5 min-h-[300px]"
            >
              <span className="material-symbols-outlined text-6xl text-white/10 mb-4 block">group_off</span>
              <h3 className="text-xl font-headline font-black text-white/70 mb-2">No members found</h3>
              <p className="text-white/40 text-sm max-w-md">
                {searchQuery 
                  ? `We couldn't find any members matching "${searchQuery}". Try adjusting your search or filter.`
                  : `There are currently no members in the ${activeFilter} category.`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}

