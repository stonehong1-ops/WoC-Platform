"use client";

import React from "react";
import { motion } from "framer-motion";

// ── HEADER COMPONENT ──
interface AdminHeaderProps {
  title: string;
  onClose?: () => void;
  isInline?: boolean;
}

export function AdminHeader({ title, onClose, isInline }: AdminHeaderProps) {
  if (isInline) return null;

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-outline/5">
      <div className="max-w-[896px] mx-auto px-4 py-4 flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          {onClose && (
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-primary/5 transition-all"
            >
              <span className="material-symbols-outlined text-primary">arrow_back</span>
            </button>
          )}
          <h1 className="text-base font-bold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>
            {title}
          </h1>
        </div>
      </div>
    </header>
  );
}

// ── CARD COMPONENT (SECTION CONTAINER) ──
interface AdminCardProps {
  icon: string;
  iconColorClass?: string; // e.g. text-primary bg-primary/10
  title: string;
  description?: string;
  rightElement?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminCard({
  icon,
  iconColorClass = "text-primary bg-primary/10",
  title,
  description,
  rightElement,
  children,
}: AdminCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.03)] border border-white/20 overflow-hidden mb-6">
      <div className="px-6 pt-6 pb-4 border-b border-outline/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColorClass}`}>
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
            </div>
            <div>
              <h3 className="text-[16px] leading-[1.6] font-semibold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>
                {title}
              </h3>
              {description && (
                <p className="text-[12px] leading-[1.2] font-medium text-on-surface-variant" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {description}
                </p>
              )}
            </div>
          </div>
          {rightElement && <div>{rightElement}</div>}
        </div>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

// ── INPUT FIELD COMPONENT ──
interface AdminInputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function AdminInputField({ label, className = "", ...props }: AdminInputFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider block" style={{ fontFamily: "'Inter', sans-serif" }}>
        {label}
      </label>
      <input
        className={`w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[16px] font-medium placeholder:text-on-surface-variant/30 transition-all outline-none ${className}`}
        style={{ fontFamily: "'Inter', sans-serif" }}
        {...props}
      />
    </div>
  );
}

// ── SELECT FIELD COMPONENT ──
interface AdminSelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
}

export function AdminSelectField({ label, options, className = "", ...props }: AdminSelectFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider block" style={{ fontFamily: "'Inter', sans-serif" }}>
        {label}
      </label>
      <div className="relative">
        <select
          className={`w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[16px] font-medium appearance-none outline-none transition-all ${className}`}
          style={{ fontFamily: "'Inter', sans-serif" }}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
        </div>
      </div>
    </div>
  );
}

// ── TEXTAREA FIELD COMPONENT ──
interface AdminTextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export function AdminTextAreaField({ label, className = "", ...props }: AdminTextAreaFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider block" style={{ fontFamily: "'Inter', sans-serif" }}>
        {label}
      </label>
      <textarea
        className={`w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3 text-on-surface text-[14px] font-medium placeholder:text-on-surface-variant/30 transition-all outline-none ${className}`}
        style={{ fontFamily: "'Inter', sans-serif" }}
        {...props}
      />
    </div>
  );
}

// ── TOGGLE COMPONENT ──
interface AdminToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function AdminToggle({ enabled, onChange }: AdminToggleProps) {
  return (
    <div
      onClick={() => onChange(!enabled)}
      className={`w-10 h-5 rounded-full relative cursor-pointer shadow-inner transition-colors ${
        enabled ? "bg-primary" : "bg-surface-container-highest"
      }`}
    >
      <motion.div
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm"
      />
    </div>
  );
}
