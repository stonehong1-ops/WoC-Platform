import React from "react";
import { FysRegistration } from "../types";

interface FysProfitTabProps {
  registrations: FysRegistration[];
}

// 고정 비용 항목 (유로 금액이 있는 항목은 euro 필드 포함)
const COST_ITEMS: { label: string; amount: number; euro?: number }[] = [
  { label: "클래스비", amount: 6480000, euro: 4320 },
  { label: "공연비 1회", amount: 1080000, euro: 720 },
  { label: "통역비", amount: 600000 },
  { label: "준비비/기타", amount: 1000000 },
  { label: "대관비", amount: 2000000 },
  { label: "거주비", amount: 800000 },
  { label: "베이비시터", amount: 1000000 },
  { label: "항공료 50% 부담", amount: 2000000 },
];

const TOTAL_COST = COST_ITEMS.reduce((sum, item) => sum + item.amount, 0);

export default function FysProfitTab({ registrations }: FysProfitTabProps) {
  // 유효 신청서만 (취소/환불 제외)
  const activeRegs = registrations.filter(
    (r) =>
      r.paymentStatus === "pending" ||
      r.paymentStatus === "confirmed" ||
      r.paymentStatus === "replaced"
  );

  const totalRevenue = activeRegs.reduce((sum, r) => sum + (r.calculatedAmount || 0), 0);
  const profitRate = TOTAL_COST > 0 ? (totalRevenue / TOTAL_COST) * 100 : 0;
  const netProfit = totalRevenue - TOTAL_COST;
  const barWidth = Math.min(profitRate, 100);

  return (
    <div className="space-y-3">
      {/* 달성률 바 차트 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-sm font-bold text-gray-700">비용 달성률</span>
          <span className={`text-xl font-black ${profitRate >= 100 ? "text-emerald-600" : "text-blue-600"}`}>
            {profitRate.toFixed(1)}%
          </span>
        </div>

        {/* 바 차트 */}
        <div className="relative w-full h-10 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${
              profitRate >= 100
                ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                : profitRate >= 70
                ? "bg-gradient-to-r from-blue-500 to-blue-400"
                : profitRate >= 40
                ? "bg-gradient-to-r from-amber-500 to-amber-400"
                : "bg-gradient-to-r from-red-500 to-red-400"
            }`}
            style={{ width: `${barWidth}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow-sm">
              {totalRevenue.toLocaleString()}원 / {TOTAL_COST.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 요약 수치 */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="text-center py-2.5 bg-gray-50 rounded-lg">
            <p className="text-[10px] text-gray-400 font-bold">총비용</p>
            <p className="text-sm font-black text-gray-900">{(TOTAL_COST / 10000).toLocaleString()}만</p>
          </div>
          <div className="text-center py-2.5 bg-blue-50 rounded-lg">
            <p className="text-[10px] text-blue-400 font-bold">현 수익</p>
            <p className="text-sm font-black text-blue-700">{(totalRevenue / 10000).toFixed(1)}만</p>
          </div>
          <div className={`text-center py-2.5 rounded-lg ${netProfit >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
            <p className={`text-[10px] font-bold ${netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {netProfit >= 0 ? "순이익" : "부족분"}
            </p>
            <p className={`text-sm font-black ${netProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
              {netProfit >= 0 ? "" : "-"}{(Math.abs(netProfit) / 10000).toFixed(1)}만
            </p>
          </div>
        </div>
      </div>

      {/* 비용 항목 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
              <th className="px-4 py-3 text-xs">항목</th>
              <th className="px-4 py-3 text-xs text-right">금액</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {COST_ITEMS.map((item) => (
              <tr key={item.label}>
                <td className="px-4 py-3 text-sm font-medium">{item.label}</td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold">{item.amount.toLocaleString()}원</span>
                  {item.euro && (
                    <span className="block text-[11px] text-gray-400 font-medium">
                      €{item.euro.toLocaleString()}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-black">
              <td className="px-4 py-3 text-sm text-gray-900">총비용</td>
              <td className="px-4 py-3 text-right text-sm text-gray-900">
                {TOTAL_COST.toLocaleString()}원
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 신청자 수 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 font-medium">유효 신청자</span>
          <span className="font-bold text-gray-900">{activeRegs.length}명</span>
        </div>
      </div>
    </div>
  );
}
