import React from "react";
import { FYS_CLASSES } from "../data/classes";
import { FysClass } from "../types";
import FysClassCard from "./FysClassCard";

interface FysProgramListProps {
  selectedClassIds: string[];
  onToggleClass: (id: string) => void;
}

export default function FysProgramList({
  selectedClassIds,
  onToggleClass,
}: FysProgramListProps) {
  // 날짜별로 클래스 정렬 및 그룹화
  const groupedClasses: { [date: string]: FysClass[] } = {};
  FYS_CLASSES.forEach((cls) => {
    if (!groupedClasses[cls.date]) {
      groupedClasses[cls.date] = [];
    }
    groupedClasses[cls.date].push(cls);
  });

  const sortedDates = Object.keys(groupedClasses).sort();

  return (
    <div className="w-full px-4 py-6 space-y-8 bg-white">
      <div className="border-b border-gray-100 pb-2">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
          <span className="material-symbols-rounded text-blue-600">calendar_month</span>
          프로그램 선택 / Select Program
        </h2>
        <p className="text-[11px] text-gray-400 mt-0.5">
          신청하실 워크숍 클래스 및 그랜드 밀롱가를 선택해 주세요.
        </p>
      </div>

      <div className="space-y-6">
        {sortedDates.map((date) => {
          const classes = groupedClasses[date];
          const firstCls = classes[0];
          // 날짜 텍스트 파싱 (예: 2026-09-01 -> 9/1)
          const [,, day] = date.split("-");
          const monthInt = parseInt(date.split("-")[1]);
          const dayInt = parseInt(day);
          const dateTitleKo = `${monthInt}/${dayInt}(${firstCls.dayKo})`;
          const dateTitleEn = `${monthInt}/${dayInt} (${firstCls.dayEn})`;

          return (
            <div key={date} className="space-y-3">
              {/* Date Header */}
              <div className="flex items-baseline gap-2 border-b border-gray-100 pb-1">
                <span className="text-sm font-bold text-gray-800">{dateTitleKo}</span>
                <span className="text-[10px] text-gray-400 font-medium">{dateTitleEn}</span>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 gap-2.5">
                {classes.map((cls) => (
                  <FysClassCard
                    key={cls.id}
                    cls={cls}
                    selected={selectedClassIds.includes(cls.id)}
                    onToggle={onToggleClass}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
