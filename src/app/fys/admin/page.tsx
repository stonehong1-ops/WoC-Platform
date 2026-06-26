"use client";

import React, { useState, useEffect } from "react";
import FysAdminLogin from "../components/FysAdminLogin";
import FysAdminTable from "../components/FysAdminTable";
import FysAdminDetailDrawer from "../components/FysAdminDetailDrawer";
import FysClassBalanceTable from "../components/FysClassBalanceTable";
import FysProfitTab from "../components/FysProfitTab";
import { FysRegistration } from "../types";
import { getAllFysRegistrations, updateFysRegistrationStatus } from "../lib/fysFirestore";

const ADMIN_KEY = process.env.NEXT_PUBLIC_FYS_ADMIN_KEY || "1234";

type AdminTab = "profit" | "balance" | "applicants";

export default function FysAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [registrations, setRegistrations] = useState<FysRegistration[]>([]);
  const [selectedReg, setSelectedReg] = useState<FysRegistration | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("profit");

  // 로컬스토리지 자동 로그인 처리
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem("fys_admin_auth");
      if (storedKey === ADMIN_KEY) {
        setIsAuthenticated(true);
      }
    }
  }, []);

  // 전체 데이터 로드
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllFysRegistrations();
      setRegistrations(data);
    } catch (err: any) {
      console.error("데이터 로드 실패:", err);
      alert("데이터 로드에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const handleLogin = (keyInput: string) => {
    if (keyInput === ADMIN_KEY) {
      setIsAuthenticated(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("fys_admin_auth", keyInput);
      }
    } else {
      alert("관리자 보안 키가 일치하지 않습니다.");
    }
  };

  const handleLogout = () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      setIsAuthenticated(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem("fys_admin_auth");
      }
    }
  };

  const handleSaveRegistrationUpdates = async (id: string, updates: Partial<FysRegistration>) => {
    await updateFysRegistrationStatus(id, updates);
    setRegistrations((prev) =>
      prev.map((reg) => (reg.id === id ? { ...reg, ...updates } : reg))
    );
  };

  // 통계 계산
  const activeRegs = registrations.filter(
    (r) => r.paymentStatus === "pending" || r.paymentStatus === "confirmed" || r.paymentStatus === "replaced"
  );
  const leaderCount = activeRegs.filter((r) => r.role === "leader").length;
  const followerCount = activeRegs.filter((r) => r.role === "follower").length;
  const totalAmount = activeRegs.reduce((sum, r) => sum + (r.calculatedAmount || 0), 0);

  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-screen bg-gray-100/50 flex items-center justify-center p-4">
        <FysAdminLogin onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50/50 font-sans">
      {/* 헤더 - 모바일 컴팩트 */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-sm font-bold text-gray-900">FYS 관리자</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">
              L {leaderCount} · F {followerCount} · {activeRegs.length}명 · {totalAmount.toLocaleString()}원
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="w-8 h-8 flex items-center justify-center text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all disabled:opacity-50"
            >
              <span className={`material-symbols-rounded text-base ${loading ? "animate-spin" : ""}`}>refresh</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-8 h-8 flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
            >
              <span className="material-symbols-rounded text-base">logout</span>
            </button>
          </div>
        </div>

        {/* 탭 전환 */}
        <div className="flex mt-3 gap-1 bg-gray-100 p-0.5 rounded-lg">
          <button
            onClick={() => setActiveTab("profit")}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
              activeTab === "profit"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500"
            }`}
          >
            수익률
          </button>
          <button
            onClick={() => setActiveTab("balance")}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
              activeTab === "balance"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500"
            }`}
          >
            성비현황
          </button>
          <button
            onClick={() => setActiveTab("applicants")}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
              activeTab === "applicants"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500"
            }`}
          >
            신청현황
          </button>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="p-3">
        {activeTab === "profit" && (
          <FysProfitTab registrations={registrations} />
        )}
        {activeTab === "balance" && (
          <FysClassBalanceTable registrations={registrations} />
        )}
        {activeTab === "applicants" && (
          <FysAdminTable
            registrations={registrations}
            onSelectRegistration={(reg) => setSelectedReg(reg)}
          />
        )}
      </div>

      {/* 상세보기 Drawer */}
      <FysAdminDetailDrawer
        registration={selectedReg}
        onClose={() => setSelectedReg(null)}
        onSave={handleSaveRegistrationUpdates}
      />
    </div>
  );
}
