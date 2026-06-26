import React, { useState } from "react";

interface FysCheckFormProps {
  onSearch: (nickname: string) => void;
  loading: boolean;
}

export default function FysCheckForm({ onSearch, loading }: FysCheckFormProps) {
  const [nickname, setNickname] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      alert("닉네임을 입력해 주세요. / Please enter a nickname.");
      return;
    }
    onSearch(nickname.trim());
  };

  return (
    <div className="w-full bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
          <span className="material-symbols-rounded text-blue-600">search</span>
          신청내역 조회 / Lookup Registration
        </h2>
        <p className="text-[11px] text-gray-400">
          신청서에 작성하신 닉네임을 입력해 주세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-700">
            닉네임 / Nickname
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="예: 스톤"
            className="w-full p-3 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-[0.98] disabled:bg-gray-300 disabled:shadow-none"
        >
          {loading ? "조회 중..." : "조회하기 / Search"}
        </button>
      </form>

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/50 text-[11px] text-gray-500 space-y-1.5 leading-normal">
        <p className="font-semibold text-gray-600">📌 안내 / Note</p>
        <p>• 닉네임으로 신청내역을 다시 확인할 수 있습니다. 신청 후 닉네임을 꼭 기억해주세요.</p>
        <p className="border-t border-gray-200/50 pt-1.5">
          • You can check your registration using your nickname. Please remember the nickname you entered.
        </p>
      </div>
    </div>
  );
}
