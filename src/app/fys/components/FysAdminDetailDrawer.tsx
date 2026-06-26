import React, { useState, useEffect } from "react";
import { FysRegistration, FysPaymentStatus } from "../types";
import { FYS_CLASSES } from "../data/classes";

interface FysAdminDetailDrawerProps {
  registration: FysRegistration | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<FysRegistration>) => Promise<void>;
}

export default function FysAdminDetailDrawer({
  registration,
  onClose,
  onSave,
}: FysAdminDetailDrawerProps) {
  const [status, setStatus] = useState<FysPaymentStatus>("pending");
  const [paymentMemo, setPaymentMemo] = useState("");
  const [internalMemo, setInternalMemo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (registration) {
      setStatus(registration.paymentStatus);
      setPaymentMemo(registration.adminPaymentMemo || "");
      setInternalMemo(registration.adminInternalMemo || "");
    }
  }, [registration]);

  if (!registration) return null;

  const selectedClasses = FYS_CLASSES.filter((c) =>
    registration.selectedClassIds.includes(c.id)
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(registration.id, {
        paymentStatus: status,
        adminPaymentMemo: paymentMemo.trim(),
        adminInternalMemo: internalMemo.trim(),
      });
      alert("성공적으로 저장되었습니다.");
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(`저장 중 에러가 발생했습니다: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex justify-end">
      {/* Backdrop click closes drawer */}
      <div className="flex-1" onClick={onClose} />
      
      {/* Drawer Body */}
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-slide-in">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {registration.nickname} 님의 상세 내역
            </h3>
            <p className="text-[10px] text-gray-400 font-medium">
              ID: {registration.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-colors"
          >
            <span className="material-symbols-rounded text-lg">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-gray-700">
          {/* User Details */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200/50">
            <div>
              <p className="text-gray-400 font-semibold">입금자명</p>
              <p className="font-bold text-gray-800 text-sm mt-0.5">{registration.depositorName}</p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold">입금예정일</p>
              <p className="font-bold text-gray-800 text-sm mt-0.5">{registration.depositDate}</p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold">성별/역할</p>
              <p className="font-bold text-gray-800 text-sm mt-0.5">
                {registration.role === "leader" ? "Leader (남)" : "Follower (여)"}
              </p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold">연락처</p>
              <p className="font-bold text-gray-800 text-sm mt-0.5">{registration.phone || "-"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-400 font-semibold">제출일시</p>
              <p className="font-bold text-gray-800 mt-0.5">
                {registration.createdAt?.toDate().toLocaleString("ko-KR")}
              </p>
            </div>
            {registration.memo && (
              <div className="col-span-2">
                <p className="text-gray-400 font-semibold">사용자 메모</p>
                <p className="text-gray-700 leading-normal mt-1 whitespace-pre-wrap bg-white p-2.5 rounded-lg border border-gray-100 shadow-inner">
                  {registration.memo}
                </p>
              </div>
            )}
          </div>

          {/* Edit State */}
          <div className="space-y-4 pt-2">
            {/* Payment Status Dropdown */}
            <div className="space-y-1.5">
              <label className="block font-bold text-gray-800 text-xs">
                입금/예약 상태 변경
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FysPaymentStatus)}
                className="w-full p-3 border border-gray-200 rounded-xl bg-white text-gray-800 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending">입금대기 (Pending)</option>
                <option value="confirmed">입금확인 (Confirmed)</option>
                <option value="cancelRequested">취소요청 (Cancel Requested)</option>
                <option value="refunded">환불완료 (Refunded)</option>
                <option value="replaced">교체완료 (Replaced)</option>
              </select>
            </div>

            {/* Admin Payment Memo */}
            <div className="space-y-1.5">
              <label className="block font-bold text-gray-800 text-xs">
                입금 확인 메모 (사용자 화면 노출)
              </label>
              <input
                type="text"
                value={paymentMemo}
                onChange={(e) => setPaymentMemo(e.target.value)}
                placeholder="예: 7/12 64,000원 입금 확인"
                className="w-full p-3 border border-gray-200 rounded-xl bg-white text-gray-800 text-xs font-semibold focus:outline-none"
              />
            </div>

            {/* Admin Internal Memo */}
            <div className="space-y-1.5">
              <label className="block font-bold text-gray-800 text-xs">
                내부 메모 (관리자 전용)
              </label>
              <textarea
                value={internalMemo}
                onChange={(e) => setInternalMemo(e.target.value)}
                placeholder="관리자들만 확인할 수 있는 내용"
                rows={3}
                className="w-full p-3 border border-gray-200 rounded-xl bg-white text-gray-800 text-xs font-medium focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Selected Classes Summary */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">
              선택한 클래스 ({selectedClasses.length})
            </p>
            <div className="space-y-1.5">
              {selectedClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg flex justify-between items-center"
                >
                  <span className="font-bold text-gray-800">
                    {cls.date.substring(5)} ({cls.dayKo}) {cls.start}
                  </span>
                  <span className="text-gray-500 font-semibold">{cls.titleKo}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50/50 flex gap-3.5">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 hover:bg-gray-100 text-gray-600 font-bold rounded-xl text-xs transition-all"
          >
            닫기
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-xl text-xs transition-all shadow-md"
          >
            {saving ? "저장 중..." : "설정 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
