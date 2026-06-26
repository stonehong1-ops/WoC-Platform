import React from "react";
import { FysClass, FysRegistration } from "../types";
import { FYS_CLASSES } from "../data/classes";

interface FysClassBalanceTableProps {
  registrations: FysRegistration[];
}

export default function FysClassBalanceTable({ registrations }: FysClassBalanceTableProps) {
  // 유효한 신청서만 필터링 (취소 및 환불 제외)
  const activeRegistrations = registrations.filter(
    (r) =>
      r.paymentStatus === "pending" ||
      r.paymentStatus === "confirmed" ||
      r.paymentStatus === "replaced"
  );

  // 클래스별 신청 수량 계산
  const getCounts = (classId: string) => {
    let leaderCount = 0;
    let followerCount = 0;

    activeRegistrations.forEach((r) => {
      if (r.selectedClassIds.includes(classId)) {
        if (r.role === "leader") leaderCount++;
        if (r.role === "follower") followerCount++;
      }
    });

    return { leaderCount, followerCount };
  };

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
              <th className="px-3 py-3 text-xs">날짜</th>
              <th className="px-3 py-3 text-xs">클래스</th>
              <th className="px-3 py-3 text-xs text-center w-12">L</th>
              <th className="px-3 py-3 text-xs text-center w-12">F</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {FYS_CLASSES.map((cls) => {
              const { leaderCount, followerCount } = getCounts(cls.id);

              return (
                <tr key={cls.id} className="hover:bg-gray-50/50">
                  <td className="px-3 py-3 whitespace-nowrap text-gray-500 text-xs">
                    {cls.date.substring(5)} ({cls.dayKo}) {cls.start}
                  </td>
                  <td className="px-3 py-3 font-semibold text-gray-800 text-sm truncate max-w-[180px]">
                    {cls.titleKo}
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-sm">
                    <span className={leaderCount >= 15 ? "text-emerald-600" : "text-gray-900"}>
                      {leaderCount}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-sm">
                    <span className={followerCount >= 15 ? "text-emerald-600" : "text-gray-900"}>
                      {followerCount}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
