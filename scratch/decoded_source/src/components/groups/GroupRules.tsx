"use client";

import React, { useState } from "react";

const SECTIONS = [
  { id: "philosophy", icon: "auto_awesome", title: "Community Philosophy", content: "Our community is built on the principles of mutual respect, continuous learning, and shared growth. We believe that every member brings unique value and perspective to our collective journey.\n\nWe are committed to creating a safe and inclusive space where all members can express themselves freely while respecting the boundaries and dignity of others." },
  { id: "behavior", icon: "favorite", title: "Code of Conduct", content: "• Treat all members with respect and dignity\n• No harassment, discrimination, or bullying of any kind\n• Maintain a positive and supportive atmosphere\n• Resolve conflicts through open communication\n• Respect personal boundaries and privacy\n• Use appropriate language in all communications" },
  { id: "safety", icon: "shield", title: "Safety Guidelines", content: "• Follow all venue safety rules and emergency procedures\n• Report any safety concerns to administrators immediately\n• Keep emergency exits clear at all times\n• No alcohol or substances during official activities\n• First aid kit is available at the front desk\n• Emergency contacts are posted in all rooms" },
  { id: "participation", icon: "groups", title: "Participation Rules", content: "• Regular attendance is encouraged but not mandatory\n• RSVP for events at least 24 hours in advance\n• Cancel reservations if you cannot attend\n• Arrive on time for scheduled activities\n• Active participation in community discussions is welcomed\n• Volunteer opportunities are available for engaged members" },
  { id: "moderation", icon: "gavel", title: "Moderation Policy", content: "Violations of community rules will be handled through the following process:\n\n1. First offense: Private warning from an administrator\n2. Second offense: Temporary suspension (7 days)\n3. Third offense: Permanent removal from the community\n\nSevere violations (harassment, threats, illegal activity) may result in immediate removal without prior warning." },
];

export default function GroupRules() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 to-tertiary-container/20 rounded-2xl p-6 text-center">
        <span className="material-symbols-outlined text-[40px] text-primary mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
        <h2 className="text-[22px] font-bold text-on-surface">Community Rules</h2>
        <p className="text-[13px] text-on-surface-variant mt-1">Last updated: May 1, 2026 · v2.3</p>
      </div>

      {/* Section Navigation */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {SECTIONS.map((s) => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all ${activeSection === s.id ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container text-on-surface-variant"}`}>
            <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
            {s.title}
          </button>
        ))}
      </div>

      {/* Active Section Content */}
      {SECTIONS.map((s) => s.id === activeSection && (
        <div key={s.id} className="bg-surface-container rounded-2xl p-5 border border-outline/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[22px]">{s.icon}</span>
            </div>
            <h3 className="text-[18px] font-bold text-on-surface">{s.title}</h3>
          </div>
          <div className="text-[14px] text-on-surface-variant/80 leading-relaxed whitespace-pre-line">{s.content}</div>
        </div>
      ))}

      {/* Acknowledgement */}
      <div className="bg-surface-container rounded-2xl p-5 border border-outline/5">
        <label className="flex items-start gap-3 cursor-pointer" onClick={() => setAcknowledged(!acknowledged)}>
          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${acknowledged ? "bg-primary border-primary" : "border-outline/30"}`}>
            {acknowledged && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
          </div>
          <div>
            <p className="text-[14px] font-semibold text-on-surface">I have read and agree to the community rules</p>
            <p className="text-[12px] text-on-surface-variant mt-0.5">By checking this box, you acknowledge that you have read and understood all community rules and guidelines.</p>
          </div>
        </label>
      </div>
    </div>
  );
}
