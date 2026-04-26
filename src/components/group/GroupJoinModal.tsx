"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface GroupJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  adminName: string;
  adminId?: string;
  strategy: 'open' | 'approval' | 'invite' | undefined;
  onConfirm: () => void;
}

export default function GroupJoinModal({ 
  isOpen, 
  onClose, 
  groupName, 
  adminName, 
  strategy,
  onConfirm
}: GroupJoinModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const renderContent = () => {
    switch (strategy) {
      case 'open':
        return (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">celebration</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">환영합니다!</h3>
            <p className="text-slate-600 mb-6">
              <span className="font-bold text-blue-600">{groupName}</span> 그룹에 가입되었습니다.
            </p>
            <button 
              onClick={onConfirm}
              className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
            >
              바로가기
            </button>
          </div>
        );
      case 'approval':
        return (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">pending_actions</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">가입 신청 완료</h3>
            <p className="text-slate-600 mb-6 px-4">
              <span className="font-bold text-blue-600">{groupName}</span> 그룹 가입신청이 완료되었습니다.<br/>
              관리자 <span className="font-bold text-slate-800">{adminName}</span>님이 곧 승인할 예정입니다.
            </p>
            <button 
              onClick={onClose}
              className="w-full bg-slate-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-900 transition-all"
            >
              확인
            </button>
          </div>
        );
      case 'invite':
      default:
        return (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">비공개 그룹</h3>
            <p className="text-slate-600 mb-6 px-4">
              <span className="font-bold text-blue-600">{groupName}</span> 그룹은 관리자의 직접 요청만 가능한 그룹입니다.<br/>
              필요시 <span className="font-bold text-slate-800">{adminName}</span>님에게 채팅하시기 바랍니다.
            </p>
            <button 
              onClick={() => {
                // TODO: Implement chat logic
                onClose();
              }}
              className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">chat</span>
              관리자에게 채팅하기
            </button>
            <button 
              onClick={onClose}
              className="w-full mt-3 text-slate-400 font-medium py-2 hover:text-slate-600 transition-all"
            >
              닫기
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex justify-end">
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
