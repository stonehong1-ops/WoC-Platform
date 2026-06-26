import React from "react";
import { FysClass } from "../types";

interface FysClassCardProps {
  cls: FysClass;
  selected: boolean;
  onToggle: (id: string) => void;
}

export default function FysClassCard({ cls, selected, onToggle }: FysClassCardProps) {
  const isGrandMilonga = cls.isGrandMilonga;
  
  return (
    <div
      onClick={() => onToggle(cls.id)}
      className={`cursor-pointer transition-all duration-200 border p-4 rounded-xl relative select-none flex flex-col justify-between ${
        selected
          ? isGrandMilonga
            ? "border-red-500 bg-red-50/30 ring-1 ring-red-500"
            : "border-blue-500 bg-blue-50/20 ring-1 ring-blue-500"
          : isGrandMilonga
          ? "border-red-200 bg-white hover:border-red-300"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="space-y-1 flex-1">
          {/* Category Badges */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isGrandMilonga
                  ? "bg-red-100 text-red-700"
                  : cls.category === "Special"
                  ? "bg-amber-100 text-amber-700"
                  : cls.category === "Milonga"
                  ? "bg-emerald-100 text-emerald-700"
                  : cls.category === "Vals"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {cls.category}
            </span>
            
            {cls.partnerOnly && (
              <span className="text-[10px] font-semibold bg-amber-500 text-white px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <span className="material-symbols-rounded text-xs">group</span>
                파트너 전용 / Partner Only
              </span>
            )}
          </div>

          {/* Titles */}
          <div className="pt-1.5">
            <h3 className={`font-bold text-gray-900 leading-snug ${isGrandMilonga ? "text-base text-red-700" : "text-sm"}`}>
              {cls.titleKo}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 leading-normal">
              {cls.titleEn}
            </p>
          </div>
        </div>

        {/* Checkbox Icon */}
        <div className="pt-0.5">
          {selected ? (
            <span className={`material-symbols-rounded text-xl ${isGrandMilonga ? "text-red-600" : "text-blue-600"}`}>
              check_circle
            </span>
          ) : (
            <span className="material-symbols-rounded text-xl text-gray-300">
              radio_button_unchecked
            </span>
          )}
        </div>
      </div>

      {/* Time & Duration */}
      <div className="mt-4 pt-2 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className="material-symbols-rounded text-sm">schedule</span>
          <span>{cls.start} – {cls.end}</span>
        </div>
        <span className="text-[10px] text-gray-400 font-medium">
          {isGrandMilonga ? "300 min" : "80 min"}
        </span>
      </div>
    </div>
  );
}
