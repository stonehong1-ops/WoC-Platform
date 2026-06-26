import React from "react";

interface FysPriceSummaryProps {
  total: number;
  pricingType: "superEarlyBird" | "earlyBird" | "regular" | "dayPack" | "mixed";
  classSubtotal: number;
  milongaSubtotal: number;
  detail: Array<{
    labelKo: string;
    labelEn: string;
    amount: number;
    classIds?: string[];
  }>;
}

export default function FysPriceSummary({
  total,
  pricingType,
  classSubtotal,
  milongaSubtotal,
  detail,
}: FysPriceSummaryProps) {
  if (total === 0) return null;

  return (
    <div className="w-full px-4 py-6 bg-gray-50/50 border-t border-b border-gray-100 space-y-4">
      <div className="flex items-center gap-1.5 border-b border-gray-200/60 pb-2">
        <span className="material-symbols-rounded text-blue-600">receipt_long</span>
        <h2 className="text-base font-bold text-gray-900">
          선택 내역 및 계산 금액 / Payment Detail
        </h2>
      </div>

      <div className="space-y-2 text-xs">
        {/* Detail Breakdown */}
        {detail.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between items-start gap-4 py-1.5 border-b border-dashed border-gray-200/50 last:border-b-0"
          >
            <div className="space-y-0.5">
              <p className="font-semibold text-gray-700">{item.labelKo}</p>
              <p className="text-[10px] text-gray-400 font-medium">{item.labelEn}</p>
            </div>
            <span className="font-bold text-gray-800 shrink-0">
              {item.amount.toLocaleString()}원
            </span>
          </div>
        ))}
      </div>

      {/* Subtotals & Total */}
      <div className="bg-white p-4 rounded-xl border border-gray-200/60 space-y-2 mt-4 shadow-sm">
        <div className="flex justify-between text-xs text-gray-500">
          <span>클래스 소계 / Class Subtotal</span>
          <span>{classSubtotal.toLocaleString()}원</span>
        </div>
        {milongaSubtotal > 0 && (
          <div className="flex justify-between text-xs text-gray-500 pb-1.5 border-b border-gray-100">
            <span>밀롱가 소계 / Milonga Subtotal</span>
            <span>{milongaSubtotal.toLocaleString()}원</span>
          </div>
        )}
        <div className="flex justify-between items-baseline pt-1.5">
          <span className="text-sm font-bold text-gray-900">
            최종 입금액 / Total Amount
          </span>
          <span className="text-lg font-black text-blue-600">
            {total.toLocaleString()}원
          </span>
        </div>
        <div className="text-[10px] text-right text-gray-400 font-medium mt-1">
          {pricingType === "superEarlyBird" && "⚡ 수퍼얼리버드 특가 적용됨 / Super Early Bird Applied"}
          {pricingType === "earlyBird" && "✨ 얼리버드 할인가 적용됨 / Early Bird Applied"}
          {pricingType === "dayPack" && "🎁 Day Pack 할인가 적용됨 / Day Pack Applied"}
          {pricingType === "regular" && "일반 요금 적용됨 / Regular Price"}
          {pricingType === "mixed" && "Day Pack + 일반 혼합 요금 적용됨 / Mixed Price"}
        </div>
      </div>
    </div>
  );
}
