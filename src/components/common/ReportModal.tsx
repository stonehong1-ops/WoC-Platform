"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/contexts/LanguageContext";
import { db } from "@/lib/firebase/clientApp";
import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: "post" | "event" | "profile" | "comment" | "chat";
  targetOwnerUid: string;
  targetSnapshot: string;
  targetTitle?: string;
}

export default function ReportModal({
  isOpen,
  onClose,
  targetId,
  targetType,
  targetOwnerUid,
  targetSnapshot,
  targetTitle,
}: ReportModalProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isCSAEConfirmed, setIsCSAEConfirmed] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setDetails("");
      setIsCSAEConfirmed(false);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const REASONS = [
    { id: "csae", labelKey: "report.reason.csae", isCritical: true },
    { id: "sexual", labelKey: "report.reason.sexual" },
    { id: "harassment", labelKey: "report.reason.harassment" },
    { id: "hate", labelKey: "report.reason.hate" },
    { id: "impersonation", labelKey: "report.reason.impersonation" },
    { id: "spam", labelKey: "report.reason.spam" },
    { id: "other", labelKey: "report.reason.other" },
  ];

  const getReasonLabel = (reasonId: string) => {
    switch (reasonId) {
      case "csae": return "Child safety or CSAE";
      case "sexual": return "Sexual content";
      case "harassment": return "Harassment or threats";
      case "hate": return "Hate speech";
      case "impersonation": return "Impersonation";
      case "spam": return "Spam or fraud";
      default: return "Other";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(language === "KR" ? "로그인 후 이용할 수 있습니다." : "Please log in to report.");
      return;
    }
    if (!reason) {
      toast.error(language === "KR" ? "신고 사유를 선택해 주세요." : "Please select a reason.");
      return;
    }
    if (reason === "csae" && !isCSAEConfirmed) {
      toast.error(language === "KR" ? "아동 안전 신고 긴급 연락 안내를 확인해 주세요." : "Please confirm the Child Safety Emergency notice.");
      return;
    }

    setIsSubmitting(true);
    try {
      const reporterUid = user.uid;
      const keyId = `${reporterUid}_${targetType}_${targetId}`;
      const keyDocRef = doc(db, "activeReportKeys", keyId);
      const reportDocRef = doc(collection(db, "reports"));

      await runTransaction(db, async (transaction) => {
        const keySnap = await transaction.get(keyDocRef);
        if (keySnap.exists()) {
          throw new Error("duplicate");
        }

        // Create Report
        transaction.set(reportDocRef, {
          id: reportDocRef.id,
          reporterUid,
          reporterEmail: user.email || "",
          targetType,
          targetId,
          targetOwnerUid: targetOwnerUid || "",
          targetSnapshot: targetSnapshot || "",
          targetTitle: targetTitle || "",
          reasonCode: reason,
          reasonLabel: getReasonLabel(reason),
          details,
          childSafetyPriority: reason === "csae",
          status: "pending",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          reviewedAt: null,
          reviewedBy: null,
          actionTaken: "",
          externalReport: {
            required: false,
            authorityType: "",
            referenceNumber: "",
            reportedAt: null,
            reportedBy: ""
          }
        });

        // Create Active Key to prevent duplicates
        transaction.set(keyDocRef, {
          reporterUid,
          targetType,
          targetId,
          createdAt: serverTimestamp()
        });
      });

      toast.success(t("report.success"));
      onClose();
    } catch (error: any) {
      if (error.message === "duplicate") {
        toast.error(t("report.duplicate"));
      } else {
        console.error("Failed to submit report:", error);
        toast.error(language === "KR" ? "신고 제출에 실패했습니다. 다시 시도해 주세요." : "Submission failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto p-4" style={{ zIndex: 100001 }}>
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-md rounded-[28px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 max-h-[90vh]">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <span className="material-symbols-rounded text-red-500">flag</span>
            {t("report.title")}
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center active:scale-95 transition-all text-slate-600"
          >
            <span className="material-symbols-rounded text-lg">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 select-none">
          {/* CSAE warning if selected */}
          {reason === "csae" && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3 text-xs text-red-950 font-medium">
              <p className="font-black text-red-800 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">warning</span>
                {t("report.immediate_danger")}
              </p>
              <div className="flex gap-2">
                <a 
                  href="tel:112"
                  className="px-3 py-2 bg-red-650 hover:bg-red-700 text-white rounded-xl font-black transition-all active:scale-95 flex-1 text-center"
                >
                  {t("report.immediate_danger_yes")}
                </a>
                <button
                  type="button"
                  onClick={() => setIsCSAEConfirmed(true)}
                  className={`px-3 py-2 border rounded-xl font-black transition-all active:scale-95 flex-1 ${
                    isCSAEConfirmed 
                      ? "bg-red-600 text-white border-transparent"
                      : "bg-white border-red-200 text-red-700 hover:bg-red-50"
                  }`}
                >
                  {t("report.immediate_danger_no")}
                </button>
              </div>
              <p className="text-[10px] text-red-800 leading-relaxed opacity-95">
                {t("report.child_safety_notice")}
              </p>
            </div>
          )}

          {/* Reasons list */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 block mb-1">
              {t("report.reason_label")}
            </label>
            {REASONS.map((opt) => (
              <div 
                key={opt.id}
                onClick={() => {
                  setReason(opt.id);
                  if (opt.id !== "csae") {
                    setIsCSAEConfirmed(false);
                  }
                }}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                  reason === opt.id 
                    ? opt.isCritical 
                      ? "border-red-500 bg-red-50/30" 
                      : "border-primary bg-primary/5"
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="reportReason"
                    checked={reason === opt.id}
                    onChange={() => {}}
                    className="mt-0.5 accent-red-500 shrink-0"
                  />
                  <div>
                    <p className={`text-xs font-black leading-snug ${opt.isCritical ? "text-red-750" : "text-slate-800"}`}>
                      {t(opt.labelKey)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comments Textarea */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 block">
              {language === "KR" ? "상세 설명 (선택)" : "Details (Optional)"}
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t("report.details_placeholder")}
              rows={3}
              className="w-full p-3 bg-slate-50 rounded-2xl text-xs border-2 border-transparent focus:border-slate-200 outline-none resize-none placeholder:text-slate-400 font-bold"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-black transition-all active:scale-95"
            >
              {language === "KR" ? "취소" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-3 text-white rounded-full text-xs font-black transition-all active:scale-95 ${
                reason === "csae"
                  ? "bg-red-500 hover:bg-red-600 shadow-md shadow-red-200"
                  : "bg-primary hover:bg-primary/95 shadow-md shadow-primary/20"
              } ${isSubmitting ? "opacity-50 pointer-events-none" : ""}`}
            >
              {isSubmitting ? (language === "KR" ? "제출 중..." : "Submitting...") : t("report.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
