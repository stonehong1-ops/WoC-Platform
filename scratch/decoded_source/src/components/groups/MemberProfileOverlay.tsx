"use client";

import React from "react";
import { Member } from "@/types/group";
import { motion } from "framer-motion";

interface MemberProfileOverlayProps {
  member: Member;
  onClose: () => void;
}

export default function MemberProfileOverlay({ member, onClose }: MemberProfileOverlayProps) {
  const getRoleBadges = () => {
    const badges: { label: string; colorClass: string }[] = [];
    if (member.role === 'admin') {
      badges.push({ label: 'Admin', colorClass: 'bg-primary/10 text-primary border-primary/20' });
    }
    if (member.role === 'staff') {
      badges.push({ label: 'Staff', colorClass: 'bg-secondary/10 text-secondary border-secondary/20' });
    }
    if (member.role === 'moderator') {
      badges.push({ label: 'Moderator', colorClass: 'bg-secondary/10 text-secondary border-secondary/20' });
    }
    badges.push({ label: 'Member', colorClass: 'bg-primary/10 text-primary border-primary/20' });
    return badges;
  };

  return (
    <motion.div
      className="fixed inset-0 z-[110] bg-white text-on-surface overflow-y-auto"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      <style jsx global>{`
        .glass-panel-profile {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.8);
        }
        .text-shadow-sm {
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>

      {/* Top AppBar Navigation */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-white/10 shadow-sm flex justify-between items-center px-5 h-16">
        <button
          onClick={onClose}
          className="active:scale-95 duration-200 hover:opacity-80 transition-opacity"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h1 className="text-[24px] leading-[1.3] font-semibold text-primary" style={{ fontFamily: "'Inter', sans-serif" }}>Profile</h1>
        <button className="active:scale-95 duration-200 hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined text-primary">more_vert</span>
        </button>
      </header>

      {/* Fullscreen Immersive Profile Overlay */}
      <main className="relative min-h-screen pt-16 pb-32">
        {/* Hero Section: Cinematic Backdrop */}
        <section className="relative h-[400px] md:h-[530px] w-full overflow-hidden">
          <div className="absolute inset-0 scale-105">
            {(member.avatar || member.photoURL) ? (
              <img className="w-full h-full object-cover" src={member.avatar || member.photoURL} alt={member.name} />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 via-secondary/20 to-tertiary/10 flex items-center justify-center">
                <span className="text-[120px] font-bold text-primary/20" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {(member.name || 'U').substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent"></div>
          </div>
          {/* Profile Info Overlay */}
          <div className="absolute bottom-0 left-0 w-full px-5 md:px-16 pb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="flex gap-2">
                {getRoleBadges().map((badge, idx) => (
                  <span key={idx} className={`${badge.colorClass} px-3 py-1 rounded-full text-[12px] leading-[1.2] font-semibold border`} style={{ fontFamily: "'Inter', sans-serif" }}>
                    {badge.label}
                  </span>
                ))}
              </div>
              <h2 className="text-[48px] leading-[1.1] tracking-[-0.02em] font-bold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>{member.name}</h2>
            </div>
            <div className="flex gap-4">
              <button className="glass-panel-profile px-8 py-4 rounded-xl text-primary font-semibold hover:bg-white transition-all shadow-sm flex items-center gap-2 group">
                <span className="material-symbols-outlined transition-transform group-hover:scale-110">mail</span>
                Message
              </button>
              <button className="bg-primary text-on-primary px-8 py-4 rounded-xl font-semibold shadow-[0_10px_20px_rgba(0,88,188,0.2)] hover:scale-[1.02] transition-transform active:scale-[0.98]">
                Connect
              </button>
            </div>
          </div>
        </section>

        {/* Content Grid: Bento Layout */}
        <section className="max-w-[1440px] mx-auto px-5 md:px-16 -mt-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column: Mutual Context & Links */}
            <div className="md:col-span-4 space-y-6">
              {/* Member Info */}
              <div className="glass-panel-profile p-8 rounded-2xl shadow-sm">
                <h3 className="text-[24px] leading-[1.3] font-semibold mb-6 flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <span className="material-symbols-outlined text-secondary">groups</span>
                  Member Info
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low border border-white/50">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">badge</span>
                    </div>
                    <div>
                      <p className="text-[14px] leading-[1.4] tracking-[0.01em] font-medium text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>Role</p>
                      <p className="text-xs text-on-surface-variant">{member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : 'Member'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low border border-white/50">
                    <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined">event_available</span>
                    </div>
                    <div>
                      <p className="text-[14px] leading-[1.4] tracking-[0.01em] font-medium text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>Joined</p>
                      <p className="text-xs text-on-surface-variant">
                        {member.joinedAt
                          ? new Date(typeof member.joinedAt === 'number' ? member.joinedAt : member.joinedAt?.toDate?.() || member.joinedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                          : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low border border-white/50">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">verified</span>
                    </div>
                    <div>
                      <p className="text-[14px] leading-[1.4] tracking-[0.01em] font-medium text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>Status</p>
                      <p className="text-xs text-on-surface-variant">{member.status === 'active' ? 'Active Member' : member.status || 'Active'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Activity */}
            <div className="md:col-span-8 space-y-6">
              {/* Activity Feed (Glass List) */}
              <div className="glass-panel-profile rounded-2xl p-8 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-[24px] leading-[1.3] font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>Activity</h3>
                </div>
                <div className="space-y-0">
                  {/* Placeholder activity items */}
                  <div className="flex gap-6 py-6 border-b border-black/5 last:border-0 hover:bg-white/40 transition-colors -mx-4 px-4 rounded-xl group">
                    <div className="mt-1">
                      <span className="material-symbols-outlined text-primary">person_add</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <p className="text-[14px] leading-[1.4] tracking-[0.01em] font-medium text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>Joined the community</p>
                        <span className="text-xs text-on-surface-variant">
                          {member.joinedAt
                            ? new Date(typeof member.joinedAt === 'number' ? member.joinedAt : member.joinedAt?.toDate?.() || member.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : ''}
                        </span>
                      </div>
                      <p className="text-on-surface-variant text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>Became a member of this group.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Navigation Bar (Floating Pill) */}
      <footer className="fixed bottom-8 left-1/2 -translate-x-1/2 rounded-full w-auto min-w-[280px] bg-surface-container-highest/40 backdrop-blur-2xl border border-white/10 shadow-[0_0_20px_rgba(0,88,188,0.1)] flex justify-around items-center px-4 py-2 z-50">
        <button className="text-on-surface-variant p-3 hover:scale-110 transition-transform" onClick={onClose}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <button className="text-on-surface-variant p-3 hover:scale-110 transition-transform">
          <span className="material-symbols-outlined">chat</span>
        </button>
        <button className="bg-primary text-on-primary rounded-full p-3 shadow-[0_0_15px_rgba(0,88,188,0.3)] scale-110">
          <span className="material-symbols-outlined">person_add</span>
        </button>
        <button className="text-on-surface-variant p-3 hover:scale-110 transition-transform">
          <span className="material-symbols-outlined">share</span>
        </button>
        <button className="text-primary font-bold p-3 hover:scale-110 transition-transform">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
        </button>
      </footer>
    </motion.div>
  );
}
