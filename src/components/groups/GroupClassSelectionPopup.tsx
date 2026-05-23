// 번들 및 패스 등록 건에 대한 참여 클래스 목록 및 파트너명을 풀스크린에서 일괄 수정 및 저장하는 모달 컴포넌트
'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ClassRegistration, GroupClass } from '@/types/group';
import { classRegistrationService } from '@/lib/firebase/classRegistrationService';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface GroupClassSelectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  registration: ClassRegistration;
  allClasses: GroupClass[];
  includedClassIds: string[]; // The classes that are valid to be selected
  canEdit: boolean; // Whether the current user is allowed to edit the checkboxes
}

export const GroupClassSelectionPopup: React.FC<GroupClassSelectionPopupProps> = ({
  isOpen,
  onClose,
  registration,
  allClasses,
  includedClassIds,
  canEdit
}) => {
  const { t } = useLanguage();
  // Track selected class IDs locally before saving
  const [selectedIds, setSelectedIds] = useState<string[]>(registration.selectedClassIds || []);
  // Track partner names locally before saving
  const [partners, setPartners] = useState<Record<string, string>>(registration.participatingClassPartners || {});
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  // Filter the available classes based on what's included in the pass/bundle
  const availableClasses = allClasses.filter(cls => includedClassIds.includes(cls.id));

  // Toggle selection locally
  const handleToggle = (classId: string) => {
    if (!canEdit) {
      toast.error(t('group.class.popup.read_only_warning'));
      return;
    }

    setSelectedIds(prev => 
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  // Handle partner name changes locally
  const handlePartnerChange = (classId: string, value: string) => {
    if (!canEdit) return;
    setPartners(prev => ({
      ...prev,
      [classId]: value
    }));
  };

  // Perform bulk save to Firestore
  const handleSave = async () => {
    if (!canEdit) {
      toast.error(t('group.class.popup.read_only_warning'));
      return;
    }
    
    setIsSaving(true);
    try {
      // Clean up partners record to only keep names for currently selected classes
      const cleanedPartners: Record<string, string> = {};
      selectedIds.forEach(id => {
        if (partners[id]?.trim()) {
          cleanedPartners[id] = partners[id].trim();
        }
      });

      await classRegistrationService.updateRegistration(registration.id, {
        selectedClassIds: selectedIds,
        participatingClassPartners: cleanedPartners
      });

      toast.success(t('group.class.popup.save_success'));
      onClose();
    } catch (error) {
      console.error("Failed to update selected classes & partners:", error);
      toast.error(t('group.class.popup.save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex flex-col bg-[#FAF8FF] overflow-hidden animate-in slide-in-from-bottom duration-300">
      <style dangerouslySetInnerHTML={{ __html: `
        .popup-scrollbar::-webkit-scrollbar { display: none; }
        .popup-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* ━━━ Header (Fixed Sticky) ━━━ */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 max-w-2xl mx-auto w-full flex items-center justify-between px-6 py-4">
        <div>
          <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-black text-slate-800 tracking-tight">
            {t('group.class.popup.title')}
          </h3>
          <p className="text-xs font-bold text-primary mt-1">
            {t('group.class.popup.selected', { selected: selectedIds.length, total: includedClassIds.length })}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 flex items-center justify-center transition-all active:scale-90"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* ━━━ Scrollable Body ━━━ */}
      <div className="flex-1 overflow-y-auto popup-scrollbar pt-24 pb-28 px-6 max-w-2xl mx-auto w-full">
        {availableClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-100 shadow-sm gap-3">
            <span className="material-symbols-outlined text-slate-300 text-5xl">inbox</span>
            <p className="text-sm font-semibold text-slate-400">
              {t('group.class.popup.no_classes')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {availableClasses.map(cls => {
              const isSelected = selectedIds.includes(cls.id);
              return (
                <div 
                  key={cls.id}
                  className={`p-5 rounded-2xl border transition-all duration-300 bg-white ${
                    isSelected 
                      ? 'border-primary/40 shadow-md ring-2 ring-primary/5' 
                      : 'border-slate-100 hover:border-slate-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleToggle(cls.id)}
                    >
                      <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-800 leading-snug block hover:text-primary transition-colors">
                        {cls.title}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 block mt-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        {cls.schedule?.[0]?.date || 'TBD'} • {cls.schedule?.[0]?.timeSlot || 'TBD'}
                      </span>
                    </div>
                    
                    <div 
                      onClick={() => handleToggle(cls.id)}
                      className={`flex items-center justify-center w-6 h-6 rounded-lg border-2 transition-all duration-300 cursor-pointer active:scale-90 shrink-0 ${
                        isSelected 
                          ? 'bg-primary border-primary shadow-sm shadow-primary/20' 
                          : 'border-slate-300 hover:border-slate-400 bg-white'
                      }`}
                    >
                      {isSelected && (
                        <span className="material-symbols-outlined text-white text-[15px] font-black">check</span>
                      )}
                    </div>
                  </div>

                  {/* Partner Name Input (Shown and enabled only when class is selected) */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-slate-100/70 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                        {t('group.class.popup.partner_label')}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          disabled={!canEdit || isSaving}
                          value={partners[cls.id] || ''}
                          onChange={(e) => handlePartnerChange(cls.id, e.target.value)}
                          placeholder={t('group.class.popup.partner_placeholder')}
                          className="w-full text-sm py-2.5 pl-9 pr-4 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium text-slate-700 disabled:opacity-50"
                        />
                        <span className="material-symbols-outlined text-slate-400 text-[18px] absolute left-3 top-1/2 -translate-y-1/2">
                          group
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ━━━ Footer (Fixed Sticky Bottom) ━━━ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 px-6 py-4 flex items-center gap-4 max-w-2xl mx-auto w-full pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
        <button 
          onClick={onClose}
          disabled={isSaving}
          className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-sm rounded-xl active:scale-95 transition-all text-center disabled:opacity-50"
        >
          {t('history.close') || 'Close'}
        </button>
        <button 
          onClick={handleSave}
          disabled={isSaving || !canEdit}
          className="flex-1 py-3.5 bg-[#1E293B] hover:bg-slate-800 text-white font-bold text-sm rounded-xl active:scale-95 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving && <span className="material-symbols-outlined animate-spin text-sm">sync</span>}
          {t('group.class.popup.save')}
        </button>
      </div>

      {/* Loading Overlay */}
      {isSaving && (
        <div className="absolute inset-0 z-[120] bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-white p-5 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center gap-3">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
            <span className="text-xs font-bold text-slate-500">Saving changes...</span>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
