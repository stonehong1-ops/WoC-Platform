import React from "react";
import Link from "next/link";

interface FysCompleteProps {
  nickname: string;
  depositorName: string;
}

export default function FysComplete({ nickname, depositorName }: FysCompleteProps) {
  return (
    <div className="w-full min-h-[80vh] px-6 py-12 bg-white flex flex-col justify-center items-center text-center space-y-6 max-w-[430px] mx-auto">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
        <span className="material-symbols-rounded text-4xl">check_circle</span>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">
          신청이 완료되었습니다!
        </h2>
        <p className="text-sm font-semibold text-purple-600">
          Registration Submitted!
        </p>
      </div>

      <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 text-left text-xs space-y-3 w-full max-w-sm">
        <div>
          <p className="font-bold text-gray-700">🇰🇷 한국어 안내</p>
          <p className="text-gray-600 leading-relaxed mt-1">
            • 닉네임 <strong>[{nickname}]</strong>으로 신청내역을 다시 확인할 수 있습니다. 신청 후 닉네임을 꼭 기억해 주세요.<br />
            • 입금 확인 후 관리자가 결제 상태를 업데이트합니다.
          </p>
        </div>

        <div className="border-t border-gray-200/50 pt-3">
          <p className="font-bold text-gray-700">🇺🇸 English Guide</p>
          <p className="text-gray-600 leading-relaxed mt-1">
            • You can check your registration later using your nickname <strong>[{nickname}]</strong>. Please remember the nickname you entered.<br />
            • The admin will update the payment status after checking the deposit.
          </p>
        </div>
      </div>

      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-left text-xs space-y-2.5 w-full max-w-sm">
        <p className="font-bold text-blue-900 flex items-center gap-1">
          <span className="material-symbols-rounded text-sm">contact_support</span>
          문의 / Contact
        </p>
        <div className="text-gray-700 space-y-1">
          <p>• 스톤 / Stone: 010-7209-2468</p>
          <p>• 셈로즈 / Semrose (통역/Interpreter): 010-4686-4041</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full max-w-sm pt-4">
        <Link
          href="/fys/check"
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-[0.98]"
        >
          신청내역 확인하기 / View My Registration
        </Link>
        <Link
          href="/fys"
          onClick={() => window.location.reload()}
          className="w-full py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded-xl text-sm transition-all"
        >
          새로운 신청 등록 / Register New Applicant
        </Link>
      </div>
    </div>
  );
}
