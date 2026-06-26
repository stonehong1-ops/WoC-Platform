import React, { useState } from "react";

interface FysAdminLoginProps {
  onLogin: (key: string) => void;
}

export default function FysAdminLogin({ onLogin }: FysAdminLoginProps) {
  const [key, setKey] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      alert("관리자 키를 입력해 주세요.");
      return;
    }
    onLogin(key.trim());
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl border border-gray-200 shadow-md space-y-6 mt-10">
      <div className="text-center space-y-1">
        <span className="material-symbols-rounded text-4xl text-blue-600">admin_panel_settings</span>
        <h2 className="text-xl font-bold text-gray-900">
          FYS 관리자 로그인
        </h2>
        <p className="text-xs text-gray-500">
          Fausto & Stephanie Workshop Admin Console
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-700">
            관리자 보안 키
          </label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="보안 키(Admin Key)를 입력하세요"
            className="w-full p-3 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-[0.98]"
        >
          인증하기
        </button>
      </form>
    </div>
  );
}
