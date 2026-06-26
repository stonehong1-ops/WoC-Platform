import React, { useState } from "react";
import { FysRegistration } from "../types";
import { FYS_CLASSES } from "../data/classes";
import { useLanguage } from "@/contexts/LanguageContext";
import { deleteFysRegistration } from "../lib/fysFirestore";

interface FysRegistrationResultProps {
  registration: FysRegistration;
  onCancelSuccess?: () => void;
}

export default function FysRegistrationResult({ registration, onCancelSuccess }: FysRegistrationResultProps) {
  const { t } = useLanguage();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCancel = async () => {
    const confirmed = window.confirm(t("fys.cancel_confirm"));
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteFysRegistration(registration.id);
      alert(t("fys.cancel_success"));
      if (onCancelSuccess) {
        onCancelSuccess();
      }
    } catch (err: any) {
      console.error(err);
      alert(t("fys.cancel_failed"));
    } finally {
      setIsDeleting(false);
    }
  };

  // 선택한 클래스 목록 매칭
  const selectedClasses = FYS_CLASSES.filter((c) =>
    registration.selectedClassIds.includes(c.id)
  );

  // 결제 상태 라벨 및 디자인 매핑
  const statusConfig = {
    pending: {
      labelKo: "입금대기",
      labelEn: "Pending Deposit",
      style: "bg-amber-50 text-amber-700 border-amber-200",
    },
    confirmed: {
      labelKo: "입금확인",
      labelEn: "Confirmed",
      style: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    cancelRequested: {
      labelKo: "취소요청",
      labelEn: "Cancel Requested",
      style: "bg-red-50 text-red-700 border-red-200",
    },
    refunded: {
      labelKo: "환불완료",
      labelEn: "Refunded",
      style: "bg-gray-100 text-gray-600 border-gray-300",
    },
    replaced: {
      labelKo: "교체완료",
      labelEn: "Replaced",
      style: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
  };

  const status = statusConfig[registration.paymentStatus] || statusConfig.pending;

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
      {/* Header & Status */}
      <div className="p-5 bg-gray-50/50 flex justify-between items-center gap-4">
        <div className="space-y-0.5">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            신청 상태 / Status
          </p>
          <h3 className="text-base font-bold text-gray-900">
            {registration.nickname} 님의 신청서
          </h3>
        </div>
        <span
          className={`px-3 py-1.5 rounded-full border text-xs font-bold flex flex-col items-center ${status.style}`}
        >
          <span>{status.labelKo}</span>
          <span className="text-[9px] font-medium opacity-80 uppercase leading-none mt-0.5">
            {status.labelEn}
          </span>
        </span>
      </div>

      {/* Info Breakdown */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-gray-400 font-medium">입금자명 / Depositor</p>
            <p className="font-bold text-gray-800 mt-0.5">
              {registration.depositorName}
            </p>
          </div>
          <div>
            <p className="text-gray-400 font-medium">입금예정일 / Deposit Date</p>
            <p className="font-bold text-gray-800 mt-0.5">
              {registration.depositDate}
            </p>
          </div>
          <div>
            <p className="text-gray-400 font-medium">역할 / Role</p>
            <p className="font-bold text-gray-800 mt-0.5 capitalize flex items-center gap-1">
              <span className="material-symbols-rounded text-sm text-gray-400">
                {registration.role === "leader" ? "face" : "face_3"}
              </span>
              {registration.role === "leader"
                ? "Leader (남/리더)"
                : "Follower (여/팔로워)"}
            </p>
          </div>
          {registration.phone && (
            <div>
              <p className="text-gray-400 font-medium">연락처 / Phone</p>
              <p className="font-bold text-gray-800 mt-0.5">
                {registration.phone}
              </p>
            </div>
          )}
        </div>

        {registration.memo && (
          <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 text-xs">
            <p className="text-gray-400 font-medium mb-1">메모 / Message</p>
            <p className="text-gray-700 leading-normal whitespace-pre-wrap">
              {registration.memo}
            </p>
          </div>
        )}
      </div>

      {/* Selected Program List */}
      <div className="p-5 space-y-3">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          선택 프로그램 / Selected Classes ({selectedClasses.length})
        </p>
        <div className="space-y-2.5">
          {selectedClasses.map((cls) => {
            const [,, day] = cls.date.split("-");
            const monthInt = parseInt(cls.date.split("-")[1]);
            const dayInt = parseInt(day);
            const dateStr = `${monthInt}/${dayInt}(${cls.dayKo})`;
            
            return (
              <div
                key={cls.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/30 border border-gray-100/80"
              >
                <div className="text-center bg-white border border-gray-100 px-2 py-1.5 rounded-lg shrink-0 w-12 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 leading-none">
                    {cls.dayEn.toUpperCase()}
                  </p>
                  <p className="text-sm font-black text-gray-800 leading-none mt-1">
                    {dayInt}
                  </p>
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                      {cls.category}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {cls.start} – {cls.end}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-800 truncate leading-snug">
                    {cls.titleKo}
                  </h4>
                  <p className="text-[10px] text-gray-400 truncate leading-normal">
                    {cls.titleEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Applied Pricing Snapshot */}
      <div className="p-5 bg-gray-50/30 space-y-3">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          금액 상세 내역 / Pricing Breakdown
        </p>
        <div className="space-y-2 text-xs text-gray-600">
          {registration.pricingSnapshot?.detail?.map((item, idx) => (
            <div key={idx} className="flex justify-between py-1 border-b border-dashed border-gray-100 last:border-b-0">
              <span className="font-medium text-gray-600">{item.labelKo}</span>
              <span className="font-bold text-gray-700">{item.amount.toLocaleString()}원</span>
            </div>
          ))}
          <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
            <span className="font-bold text-gray-800 text-xs">최종 입금액 / Total</span>
            <span className="font-black text-blue-600 text-base">
              {registration.calculatedAmount.toLocaleString()}원
            </span>
          </div>
        </div>
      </div>

      {/* Admin Comment */}
      {registration.adminPaymentMemo && (
        <div className="p-5 bg-blue-50/30 border-t border-blue-100 text-xs space-y-1.5">
          <p className="font-bold text-blue-900 flex items-center gap-1">
            <span className="material-symbols-rounded text-sm">notifications</span>
            관리자 확인 메모 / Admin Memo
          </p>
          <p className="text-blue-800 bg-white/60 p-3 rounded-lg border border-blue-100/50 leading-relaxed font-semibold">
            {registration.adminPaymentMemo}
          </p>
        </div>
      )}

      {/* Cancel Action */}
      <div className="p-5 bg-gray-50/30 flex justify-end border-t border-gray-100">
        <button
          onClick={handleCancel}
          disabled={isDeleting}
          className="w-full sm:w-auto px-5 py-3 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-95"
        >
          <span className="material-symbols-rounded text-sm">delete</span>
          {isDeleting ? "취소 중... / Cancelling..." : `${t("fys.cancel_button")} / Cancel`}
        </button>
      </div>
    </div>
  );
}
