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
            <h3 className="text-xl font-bold text-slate-800 mb-2">Welcome!</h3>
            <p className="text-slate-600 mb-6">
              You have successfully joined the <span className="font-bold text-blue-600">{groupName}</span> group.
            </p>
            <button 
              onClick={onConfirm}
              className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
            >
              Go to Group
            </button>
          </div>
        );
      case 'approval':
        return (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">pending_actions</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Application Submitted</h3>
            <p className="text-slate-600 mb-6 px-4">
              Your application to <span className="font-bold text-blue-600">{groupName}</span> has been submitted.<br/>
              Admin <span className="font-bold text-slate-800">{adminName}</span> will review and approve it shortly.
            </p>
            <button 
              onClick={onClose}
              className="w-full bg-slate-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-900 transition-all"
            >
              Confirm
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
            <h3 className="text-xl font-bold text-slate-800 mb-2">Private Group</h3>
            <p className="text-slate-600 mb-6 px-4">
              <span className="font-bold text-blue-600">{groupName}</span> is a private group accessible only by invitation.<br/>
              Please contact admin <span className="font-bold text-slate-800">{adminName}</span> for inquiries.
            </p>
            <button 
              onClick={() => {
                // TODO: Implement chat logic
                onClose();
              }}
              className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">chat</span>
              Chat with Admin
            </button>
            <button 
              onClick={onClose}
              className="w-full mt-3 text-slate-400 font-medium py-2 hover:text-slate-600 transition-all"
            >
              Close
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
