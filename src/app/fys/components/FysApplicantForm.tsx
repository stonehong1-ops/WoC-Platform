import React from "react";
import { FysApplicantInput, FysRole } from "../types";
import { useLanguage } from "@/contexts/LanguageContext";

interface FysApplicantFormProps {
  input: FysApplicantInput;
  onChange: (updates: Partial<FysApplicantInput>) => void;
  errors: Partial<Record<keyof FysApplicantInput, string>>;
}

export default function FysApplicantForm({
  input,
  onChange,
  errors,
}: FysApplicantFormProps) {
  const { t } = useLanguage();
  return (
    <div className="w-full px-4 py-6 bg-white space-y-6">
      <div className="border-b border-gray-100 pb-2">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
          <span className="material-symbols-rounded text-blue-600">person_add</span>
          신청자 정보 입력 / Applicant Form
        </h2>
        <p className="text-[11px] text-gray-400 mt-0.5">
          입금 정보 확인 및 신청 조회를 위해 정확한 정보를 입력해 주세요.
        </p>
      </div>

      <div className="space-y-4">
        {/* Role Selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-700">
            역할 / Role <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onChange({ role: "leader" })}
              className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                input.role === "leader"
                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <span className="material-symbols-rounded text-lg">face</span>
              Leader (남성/리더)
            </button>
            <button
              type="button"
              onClick={() => onChange({ role: "follower" })}
              className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                input.role === "follower"
                  ? "border-purple-500 bg-purple-50 text-purple-700 shadow-sm"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <span className="material-symbols-rounded text-lg">face_3</span>
              Follower (여성/팔로워)
            </button>
          </div>
          {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
        </div>

        {/* Nickname */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-700">
            닉네임 / Nickname <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={input.nickname}
            onChange={(e) => onChange({ nickname: e.target.value })}
            placeholder="예: 스톤 (영문 또는 한글)"
            className={`w-full p-3 text-sm border rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              errors.nickname ? "border-red-500" : "border-gray-200"
            }`}
          />
          <p className="text-[10px] text-gray-400 mt-0.5">
            ※ 신청내역 조회 시 닉네임만으로 조회하므로 닉네임을 꼭 기억해 주세요.
          </p>
          {errors.nickname && (
            <p className="text-xs text-red-500 mt-1">{errors.nickname}</p>
          )}
        </div>

        {/* Depositor Name */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-700">
            입금자명 / Depositor Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={input.depositorName}
            onChange={(e) => onChange({ depositorName: e.target.value })}
            placeholder="실제 송금하시는 분의 성함"
            className={`w-full p-3 text-sm border rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              errors.depositorName ? "border-red-500" : "border-gray-200"
            }`}
          />
          {errors.depositorName && (
            <p className="text-xs text-red-500 mt-1">{errors.depositorName}</p>
          )}
        </div>

        {/* Deposit Date */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-700">
            입금일자 / Deposit Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={input.depositDate}
            onChange={(e) => onChange({ depositDate: e.target.value })}
            className={`w-full p-3 text-sm border rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              errors.depositDate ? "border-red-500" : "border-gray-200"
            }`}
          />
          {errors.depositDate && (
            <p className="text-xs text-red-500 mt-1">{errors.depositDate}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-700">
            연락처 / Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={input.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="예: 010-1234-5678"
            className={`w-full p-3 text-sm border rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              errors.phone ? "border-red-500" : "border-gray-200"
            }`}
          />
          {errors.phone && (
            <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Memo */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-700">
            {t("fys.form.memoLabel")}
          </label>
          <textarea
            value={input.memo || ""}
            onChange={(e) => onChange({ memo: e.target.value })}
            placeholder={t("fys.form.memoPlaceholder")}
            rows={3}
            className="w-full p-3 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
