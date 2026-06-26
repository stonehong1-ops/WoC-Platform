"use client";

import React, { useState } from "react";
import Link from "next/link";
import FysCheckForm from "../components/FysCheckForm";
import FysRegistrationResult from "../components/FysRegistrationResult";
import { FysRegistration } from "../types";
import { getFysRegistrationsByNickname } from "../lib/fysFirestore";

export default function FysCheckPage() {
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [registrations, setRegistrations] = useState<FysRegistration[]>([]);
  const [nicknameInput, setNicknameInput] = useState("");

  const handleSearch = async (nickname: string) => {
    setLoading(true);
    setNicknameInput(nickname);
    try {
      const results = await getFysRegistrationsByNickname(nickname);
      setRegistrations(results);
      setSearched(true);
    } catch (err: any) {
      console.error(err);
      alert(`조회 도중 오류가 발생했습니다: ${err.message || err}\nAn error occurred during lookup.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white min-h-screen pb-20 text-gray-800 font-sans max-w-[430px] mx-auto shadow-sm px-4 pt-6 space-y-6">
      {/* Go Back Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <Link
          href="/fys"
          className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <span className="material-symbols-rounded text-sm">arrow_back</span>
          신청 페이지로 / Go Back
        </Link>
        <span className="text-[10px] bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full font-bold uppercase">
          조회 서비스 / Lookup
        </span>
      </div>

      <FysCheckForm onSearch={handleSearch} loading={loading} />

      {/* Results Section */}
      {searched && (
        <div className="space-y-6">
          <div className="border-b border-gray-100 pb-1 flex justify-between items-baseline">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">
              검색 결과 / Search Results ({registrations.length})
            </h3>
            {registrations.length > 0 && (
              <span className="text-[10px] text-gray-400 font-medium">
                * 최근 신청 항목 순으로 표시됩니다.
              </span>
            )}
          </div>

          {registrations.length > 0 ? (
            <div className="space-y-6">
              {registrations.map((reg) => (
                <FysRegistrationResult
                  key={reg.id}
                  registration={reg}
                  onCancelSuccess={() => {
                    setRegistrations((prev) => prev.filter((r) => r.id !== reg.id));
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
              <span className="material-symbols-rounded text-3xl text-gray-300">
                error
              </span>
              <p className="text-xs font-bold text-gray-500">
                &apos;{nicknameInput}&apos; 닉네임으로 등록된 신청 내역이 없습니다.
              </p>
              <p className="text-[10px] text-gray-400">
                No registrations found for the nickname &apos;{nicknameInput}&apos;.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
