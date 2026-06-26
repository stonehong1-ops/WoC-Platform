"use client";

import React, { useState, useEffect } from "react";
import FysHero from "./components/FysHero";
import FysNotice from "./components/FysNotice";
import FysProgramList from "./components/FysProgramList";
import FysPriceSummary from "./components/FysPriceSummary";
import FysApplicantForm from "./components/FysApplicantForm";
import FysBankInfo from "./components/FysBankInfo";
import FysPolicyNotice from "./components/FysPolicyNotice";
import FysSubmitBar from "./components/FysSubmitBar";
import FysComplete from "./components/FysComplete";
import { FysApplicantInput, FysRole } from "./types";
import { calculateFysPrice } from "./lib/calculateFysPrice";
import { submitFysRegistration } from "./lib/fysFirestore";

export default function FysPage() {
  // 오늘 날짜 구하는 함수 (KST 로컬 타임존용)
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 폼 입력 상태
  const [input, setInput] = useState<FysApplicantInput>({
    nickname: "",
    depositorName: "",
    depositDate: "",
    role: "leader",
    phone: "",
    memo: "",
  });

  // 컴포넌트 마운트 시 오늘 날짜로 입금일자 기본 세팅
  useEffect(() => {
    setInput((prev) => ({
      ...prev,
      depositDate: getTodayString(),
    }));
  }, []);

  // 선택한 클래스 ID 리스트
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  
  // 에러 메시지
  const [errors, setErrors] = useState<Partial<Record<keyof FysApplicantInput, string>>>({});
  
  // 진행 상태
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // 실시간 계산 결과
  const [priceData, setPriceData] = useState<{
    total: number;
    pricingType: "superEarlyBird" | "earlyBird" | "regular" | "dayPack" | "mixed";
    classSubtotal: number;
    milongaSubtotal: number;
    detail: any[];
  }>({
    total: 0,
    pricingType: "regular",
    classSubtotal: 0,
    milongaSubtotal: 0,
    detail: [],
  });

  // 포스터 모달 상태
  const [posterModal, setPosterModal] = useState<{
    isOpen: boolean;
    lang: "ko" | "en";
  }>({
    isOpen: false,
    lang: "ko",
  });

  // 선택된 클래스가 변경되거나 시간 업데이트 시 요금 재계산
  useEffect(() => {
    const pricing = calculateFysPrice({
      selectedClassIds,
      now: new Date(),
    });
    setPriceData(pricing);
  }, [selectedClassIds]);

  const handleToggleClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  };

  const handleInputChange = (updates: Partial<FysApplicantInput>) => {
    setInput((prev) => ({ ...prev, ...updates }));
    // 에러 상태 리셋
    if (Object.keys(errors).length > 0) {
      const fieldNames = Object.keys(updates) as Array<keyof FysApplicantInput>;
      setErrors((prev) => {
        const next = { ...prev };
        fieldNames.forEach((field) => {
          delete next[field];
        });
        return next;
      });
    }
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof FysApplicantInput, string>> = {};
    if (!input.nickname.trim()) {
      nextErrors.nickname = "닉네임을 입력해 주세요. / Nickname is required.";
    }
    if (!input.depositorName.trim()) {
      nextErrors.depositorName = "입금자명을 입력해 주세요. / Depositor Name is required.";
    }
    if (!input.depositDate.trim()) {
      nextErrors.depositDate = "입금 예정일자를 선택해 주세요. / Deposit Date is required.";
    }
    if (!input.phone?.trim()) {
      nextErrors.phone = "연락처를 입력해 주세요. / Phone number is required.";
    }
    if (!input.role) {
      nextErrors.role = "역할을 선택해 주세요. / Role is required.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (selectedClassIds.length === 0) {
      alert("최소 1개 이상의 클래스 또는 밀롱가를 선택해 주세요.\nPlease select at least one class or milonga.");
      return;
    }

    if (!validate()) {
      alert("필수 입력 항목을 채워주세요.\nPlease fill out all required fields.");
      const element = document.getElementById("applicant-form-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setSubmitting(true);
    try {
      await submitFysRegistration(input, selectedClassIds);
      setCompleted(true);
    } catch (err: any) {
      console.error(err);
      alert(`신청 도중 오류가 발생했습니다: ${err.message || err}\nAn error occurred during submission.`);
    } finally {
      setSubmitting(false);
    }
  };

  if (completed) {
    return (
      <div className="w-full bg-white min-h-screen">
        <FysComplete nickname={input.nickname} depositorName={input.depositorName} />
      </div>
    );
  }

  return (
    <div className="w-full bg-white min-h-screen pb-32 text-gray-800 font-sans max-w-[430px] mx-auto shadow-sm relative">
      <FysHero onOpenPoster={(lang) => setPosterModal({ isOpen: true, lang })} />
      <FysNotice />
      <FysProgramList
        selectedClassIds={selectedClassIds}
        onToggleClass={handleToggleClass}
      />
      <FysPriceSummary
        total={priceData.total}
        pricingType={priceData.pricingType}
        classSubtotal={priceData.classSubtotal}
        milongaSubtotal={priceData.milongaSubtotal}
        detail={priceData.detail}
      />
      <div id="applicant-form-section">
        <FysApplicantForm
          input={input}
          onChange={handleInputChange}
          errors={errors}
        />
      </div>
      <FysBankInfo />
      <FysPolicyNotice />

      {/* Footer Text */}
      <div className="px-6 py-6 text-center text-[10px] text-gray-400 bg-gray-50 border-t border-gray-100">
        <p>남·녀 15명을 기준으로 인원수 조정을 위해 취소 요청이 있을 수 있습니다.</p>
        <p className="mt-1">
          Registration may be adjusted or canceled to balance the target number of 15 leaders and 15 followers.
        </p>
      </div>

      {/* Sticky Bottom Submit Bar */}
      <FysSubmitBar
        selectedCount={selectedClassIds.length}
        totalPrice={priceData.total}
        onSubmit={handleSubmit}
        submitting={submitting}
        disabled={selectedClassIds.length === 0}
      />

      {/* Poster Image Modal */}
      {posterModal.isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPosterModal({ isOpen: false, lang: "ko" })}
        >
          <div className="relative max-w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden p-1 shadow-2xl">
            <button
              onClick={() => setPosterModal({ isOpen: false, lang: "ko" })}
              className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-rounded text-lg">close</span>
            </button>
            <img
              src={posterModal.lang === "ko" ? "/fys/poster_ko.png" : "/fys/poster_en.png"}
              alt="Seoul Workshop Poster"
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
