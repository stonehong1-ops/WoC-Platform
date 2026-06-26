import React from "react";

interface FysSubmitBarProps {
  selectedCount: number;
  totalPrice: number;
  onSubmit: () => void;
  submitting: boolean;
  disabled: boolean;
}

export default function FysSubmitBar({
  selectedCount,
  totalPrice,
  onSubmit,
  submitting,
  disabled,
}: FysSubmitBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 py-3.5 px-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex justify-between items-center max-w-[430px] mx-auto">
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-400 font-bold">
          선택 {selectedCount}개 / Selected {selectedCount}
        </span>
        <span className="text-lg font-black text-blue-600">
          {totalPrice.toLocaleString()}원
        </span>
      </div>
      <button
        onClick={onSubmit}
        disabled={disabled || submitting}
        className={`px-6 py-3 rounded-xl text-sm font-black text-white shadow-md transition-all active:scale-[0.98] ${
          disabled || submitting
            ? "bg-gray-300 cursor-not-allowed shadow-none"
            : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
        }`}
      >
        {submitting ? "제출 중..." : "신청하기 / Register"}
      </button>
    </div>
  );
}
