import React, { useState } from "react";
import { FysRegistration, FysPaymentStatus } from "../types";
import { updateFysRegistrationStatus } from "../lib/fysFirestore";

interface FysAdminTableProps {
  registrations: FysRegistration[];
  onSelectRegistration: (reg: FysRegistration) => void;
}

export default function FysAdminTable({ registrations, onSelectRegistration }: FysAdminTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // 유효 신청서만 (취소/환불 제외)
  const activeRegistrations = registrations.filter(
    (r) =>
      r.paymentStatus === "pending" ||
      r.paymentStatus === "confirmed" ||
      r.paymentStatus === "replaced"
  );

  // 검색 필터
  const filteredRegistrations = activeRegistrations.filter((reg) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        reg.nickname.toLowerCase().includes(q) ||
        reg.depositorName.toLowerCase().includes(q) ||
        reg.phone?.includes(q)
      );
    }
    return true;
  });

  // 신청일시 기준 정렬 (최신순)
  const sortedRegistrations = [...filteredRegistrations].sort((a, b) => {
    const aTime = a.createdAt?.toDate?.()?.getTime?.() || 0;
    const bTime = b.createdAt?.toDate?.()?.getTime?.() || 0;
    return bTime - aTime;
  });

  // 입금확인 토글
  const handleTogglePayment = async (e: React.MouseEvent, reg: FysRegistration) => {
    e.stopPropagation(); // 행 클릭(상세보기) 방지
    const newStatus: FysPaymentStatus =
      reg.paymentStatus === "confirmed" ? "pending" : "confirmed";

    setUpdatingId(reg.id);
    try {
      await updateFysRegistrationStatus(reg.id, { paymentStatus: newStatus });
      // 로컬 상태 갱신 (부모에서 전달된 registrations를 직접 변경할 수 없으므로 강제 리로드)
      reg.paymentStatus = newStatus;
      setUpdatingId(null);
    } catch (err) {
      console.error("입금확인 상태 변경 실패:", err);
      alert("상태 변경에 실패했습니다.");
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* 검색 */}
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="닉네임 / 입금자명 검색"
            className="w-full py-2.5 pl-9 pr-3 text-sm border border-gray-200 rounded-lg bg-white"
          />
          <span className="material-symbols-rounded absolute left-2.5 top-2.5 text-gray-400 text-lg">
            search
          </span>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
              <th className="px-3 py-3 text-xs">날짜</th>
              <th className="px-3 py-3 text-xs">닉네임</th>
              <th className="px-3 py-3 text-xs text-center">클래스</th>
              <th className="px-3 py-3 text-xs text-right">금액</th>
              <th className="px-2 py-3 text-xs text-center w-10">✓</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {sortedRegistrations.length > 0 ? (
              sortedRegistrations.map((reg) => (
                <tr
                  key={reg.id}
                  onClick={() => onSelectRegistration(reg)}
                  className="hover:bg-blue-50/30 active:bg-blue-50/50 cursor-pointer transition-colors"
                >
                  <td className="px-3 py-3 whitespace-nowrap text-gray-400 text-xs">
                    {reg.createdAt?.toDate?.()
                      ? `${(reg.createdAt.toDate().getMonth() + 1).toString().padStart(2, "0")}-${reg.createdAt.toDate().getDate().toString().padStart(2, "0")}`
                      : "-"}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                        reg.role === "leader" ? "bg-blue-500" : "bg-pink-500"
                      }`} />
                      <span className="font-bold text-gray-900 text-sm">{reg.nickname}</span>
                      {reg.phone && (
                        <a
                          href={`tel:${reg.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-7 h-7 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 rounded-full transition-colors flex-shrink-0"
                        >
                          <span className="material-symbols-rounded text-emerald-600 text-base">call</span>
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-gray-600 text-sm">
                    {reg.selectedClassIds?.length || 0}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-gray-900 text-sm">
                    {reg.calculatedAmount?.toLocaleString()}
                  </td>
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={(e) => handleTogglePayment(e, reg)}
                      disabled={updatingId === reg.id}
                      className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                        reg.paymentStatus === "confirmed"
                          ? "bg-emerald-500 border-emerald-500"
                          : "bg-white border-gray-300 hover:border-blue-400"
                      } ${updatingId === reg.id ? "opacity-50" : ""}`}
                    >
                      {reg.paymentStatus === "confirmed" && (
                        <span className="material-symbols-rounded text-white text-base">check</span>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400 text-sm">
                  신청 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
