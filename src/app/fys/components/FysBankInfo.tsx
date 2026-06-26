import React from "react";

export default function FysBankInfo() {
  return (
    <div className="w-full px-4 py-6 bg-gray-50 border-t border-gray-100 space-y-4">
      <div className="flex items-center gap-1.5 pb-1">
        <span className="material-symbols-rounded text-blue-600">account_balance</span>
        <h2 className="text-sm font-bold text-gray-900">
          입금 계좌 안내 / Bank Transfer Info
        </h2>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3.5 shadow-sm">
        <div className="space-y-1">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
            한국어 안내 (KO)
          </p>
          <div className="text-sm font-bold text-gray-800 space-y-0.5">
            <p>카카오뱅크 3333-14-3159646</p>
            <p className="text-blue-600">예금주: 홍병석</p>
          </div>
          <p className="text-xs text-gray-500 leading-normal pt-1">
            ※ 입금자명은 신청서에 입력한 입금자명과 정확히 동일하게 보내주세요.
          </p>
        </div>

        <div className="border-t border-gray-100 pt-3 space-y-1">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
            English (EN)
          </p>
          <div className="text-sm font-bold text-gray-800 space-y-0.5">
            <p>KakaoBank 3333-14-3159646</p>
            <p className="text-blue-600">Recipient: Hong Byeongseok</p>
          </div>
          <p className="text-xs text-gray-500 leading-normal pt-1">
            ※ Please make the bank transfer using the exact same depositor name entered in the registration form.
          </p>
        </div>
      </div>
    </div>
  );
}
