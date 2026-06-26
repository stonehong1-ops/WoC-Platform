import React from "react";

export default function FysPolicyNotice() {
  return (
    <div className="w-full px-4 py-6 bg-white space-y-4">
      <div className="flex items-center gap-1.5 pb-1">
        <span className="material-symbols-rounded text-blue-600">gavel</span>
        <h2 className="text-sm font-bold text-gray-900">
          취소 및 환불 정책 / Cancellation Policy
        </h2>
      </div>

      <div className="text-xs text-gray-600 space-y-3 leading-relaxed">
        <div className="bg-red-50/50 border border-red-100 p-3 rounded-xl space-y-1.5">
          <p className="font-semibold text-red-800">🇰🇷 한국어 정책</p>
          <p>
            • 취소 및 환불은 <strong className="text-red-700">2026년 7월 31일</strong>까지만 가능합니다.<br />
            • 2026년 8월 1일부터는 환불이 불가하며, 동일한 역할/성별 신청자로 교체만 가능합니다.
          </p>
        </div>

        <div className="bg-red-50/50 border border-red-100 p-3 rounded-xl space-y-1.5">
          <p className="font-semibold text-red-800">🇺🇸 English Policy</p>
          <p>
            • Cancellation and refund are available until <strong className="text-red-700">July 31, 2026</strong>.<br />
            • From August 1, 2026, refunds are not available. Replacement is only allowed with the same role/gender.
          </p>
        </div>
      </div>
    </div>
  );
}
