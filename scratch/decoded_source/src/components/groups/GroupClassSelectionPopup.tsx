import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ClassRegistration, GroupClass } from '@/types/group';
import { classRegistrationService } from '@/lib/firebase/classRegistrationService';
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
  // Use state to track selected classes for optimistic UI updates
  const [selectedIds, setSelectedIds] = useState<string[]>(registration.selectedClassIds || []);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  // Filter the available classes based on what's included in the pass/bundle
  const availableClasses = allClasses.filter(cls => includedClassIds.includes(cls.id));

  const handleToggle = async (classId: string) => {
    if (!canEdit) return;

    let newSelectedIds = [...selectedIds];
    if (newSelectedIds.includes(classId)) {
      newSelectedIds = newSelectedIds.filter(id => id !== classId);
    } else {
      newSelectedIds.push(classId);
    }

    setSelectedIds(newSelectedIds);
    setIsSaving(true);

    try {
      await classRegistrationService.updateRegistration(registration.id, {
        selectedClassIds: newSelectedIds
      });
      // Assuming parent components subscribe to Firestore and will update naturally,
      // but we optimistically update our local state above anyway.
    } catch (error) {
      console.error("Failed to update selected classes:", error);
      toast.error("Failed to save selection.");
      // Revert optimistic update
      setSelectedIds(selectedIds);
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant/20">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Selected Classes</h3>
            <p className="text-sm font-semibold text-primary">
              Selected {selectedIds.length} / {includedClassIds.length}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {availableClasses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-on-surface-variant">No available classes to select.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {availableClasses.map(cls => {
                const isSelected = selectedIds.includes(cls.id);
                return (
                  <div 
                    key={cls.id}
                    onClick={() => handleToggle(cls.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${canEdit ? 'cursor-pointer hover:border-primary/50' : ''} ${isSelected ? 'border-primary bg-primary/5' : 'border-outline-variant/20 bg-surface'}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-on-surface leading-tight mb-1">{cls.title}</span>
                      <span className="text-xs text-on-surface-variant">
                        {cls.schedule?.[0]?.date} • {cls.schedule?.[0]?.timeSlot}
                      </span>
                    </div>
                    
                    <div className={`flex items-center justify-center w-6 h-6 rounded-md border transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-outline'}`}>
                      {isSelected && (
                        <span className="material-symbols-outlined text-white text-[16px] font-bold">check</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant/20 bg-surface-container-lowest">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl active:scale-[0.98] transition-transform"
          >
            Done
          </button>
        </div>

        {/* Loading overlay */}
        {isSaving && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
