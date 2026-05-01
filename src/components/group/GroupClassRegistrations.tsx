import React, { useState, useEffect, useMemo } from 'react';
import { classRegistrationService } from '@/lib/firebase/classRegistrationService';
import { ClassRegistration, Group, GroupClass } from '@/types/group';
import { GroupClassSelectionPopup } from './GroupClassSelectionPopup';
import { format, isSameMonth } from 'date-fns';
import { safeDate } from '@/lib/utils/safeData';
import UserBadge from '@/components/common/UserBadge';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/AuthProvider';

interface GroupClassRegistrationsProps {
  group: Group;
  validClassIds: string[];
  allClasses?: GroupClass[];
  allPasses?: any[];
  allDiscounts?: any[];
}

export function GroupClassRegistrations({ group, validClassIds, allClasses = [], allPasses = [], allDiscounts = [] }: GroupClassRegistrationsProps) {
  const [registrations, setRegistrations] = useState<ClassRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  // Selection Popup state (for Checkboxes)
  const [selectedPopupReg, setSelectedPopupReg] = useState<ClassRegistration | null>(null);
  const [popupIncludedIds, setPopupIncludedIds] = useState<string[]>([]);

  // Action Menu state
  const [actionReg, setActionReg] = useState<ClassRegistration | null>(null);

  useEffect(() => {
    if (!group?.id) return;
    
    setIsLoading(true);
    const unsubscribe = classRegistrationService.subscribeToGroupRegistrations(group.id, (data) => {
      setRegistrations(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [group?.id]);

  // Filter and group registrations
  const groupedRegistrations = useMemo(() => {
    // 1. Filter by valid classes running in this month
    const filtered = registrations.filter(reg => validClassIds.includes(reg.classId));

    // 2. Group by user
    const grouped = new Map<string, {
      userId: string;
      applicantName: string;
      userAvatar: string;
      joinedAt: Date | null;
      items: ClassRegistration[];
    }>();

    filtered.forEach(reg => {
      // Use userId as key, or applicantName + contactNumber if no userId
      const key = reg.userId || `${reg.applicantName}-${reg.contactNumber}`;
      
      if (!grouped.has(key)) {
        // Try to find member in group to get 'joinedAt'
        const member = group.members?.find(m => m.id === reg.userId);
        let joinedAtDate = null;
        if (member?.joinedAt) {
           joinedAtDate = safeDate(member.joinedAt);
        }

        grouped.set(key, {
          userId: reg.userId,
          applicantName: reg.applicantName || 'Unknown User',
          userAvatar: reg.userAvatar || member?.avatar || '',
          joinedAt: joinedAtDate,
          items: []
        });
      }
      grouped.get(key)!.items.push(reg);
    });

    return Array.from(grouped.values());
  }, [registrations, validClassIds, group.members]);

  const getResolvedItemType = (type?: string, classId?: string) => {
    if (classId) {
      if (allPasses?.some(p => p.id === classId)) return 'monthlyPass';
      if (allDiscounts?.some(d => d.id === classId)) return 'discount';
    }
    return type || 'class';
  };

  const getItemTypeDetails = (type?: string, classId?: string) => {
    const resolvedType = getResolvedItemType(type, classId);
    switch (resolvedType) {
      case 'discount':
        return { label: 'BUNDLE', bgClass: 'bg-secondary-container text-on-secondary-container' };
      case 'monthlyPass':
        return { label: 'PASS', bgClass: 'bg-tertiary-container text-on-tertiary-container' };
      case 'class':
      default:
        return { label: 'CLASS', bgClass: 'bg-primary-container text-on-primary-container' };
    }
  };

  const handleTogglePayment = async (item: ClassRegistration) => {
    try {
      const newStatus = item.status === 'PAYMENT_COMPLETED' ? 'PAYMENT_PENDING' : 'PAYMENT_COMPLETED';
      await classRegistrationService.updateRegistration(item.id, { status: newStatus });
      toast.success(`Payment marked as ${newStatus === 'PAYMENT_COMPLETED' ? 'Paid' : 'Pending'}`);
    } catch (error) {
      toast.error('Failed to update payment status');
    }
  };

  const handleUpdateAmount = async (item: ClassRegistration, value: string) => {
    const amount = parseInt(value, 10);
    const validAmount = isNaN(amount) ? 0 : amount;
    if (item.paymentAmount === validAmount) return;
    
    try {
      await classRegistrationService.updateRegistration(item.id, { paymentAmount: validAmount });
      toast.success('Amount saved');
    } catch (error) {
      toast.error('Failed to update amount');
    }
  };

  const handleUpdateMemo = async (item: ClassRegistration, value: string) => {
    if (item.adminMemo === value || (!item.adminMemo && !value)) return;
    try {
      await classRegistrationService.updateRegistration(item.id, { adminMemo: value });
      toast.success('Memo saved');
    } catch (error) {
      toast.error('Failed to update memo');
    }
  };

  // Removed old handleOpenPopup

  const handleTitleClick = (item: ClassRegistration) => {
    // Open action menu for ALL items
    setActionReg(item);
  };

  const handleEditPass = () => {
    if (!actionReg) return;
    let includedIds: string[] = [];
    const resolvedType = getResolvedItemType(actionReg.itemType, actionReg.classId);
    if (resolvedType === 'monthlyPass') {
      const pass = allPasses?.find(p => p.id === actionReg.classId);
      if (pass && pass.includedClassIds) includedIds = pass.includedClassIds;
    }
    
    setPopupIncludedIds(includedIds);
    setSelectedPopupReg(actionReg);
    setActionReg(null); // Close action menu
  };

  const handleDelete = async (item: ClassRegistration) => {
    if (!user) return;
    
    const isItemOwner = user.uid === item.userId;
    const isGroupAdmin = user.uid === group.ownerId || group.members?.some(m => m.id === user.uid && m.role === 'admin');
    
    if (!isItemOwner && !isGroupAdmin) {
      toast.error('You do not have permission to delete this registration.');
      return;
    }

    const userInput = window.prompt("⚠️ WARNING: Deleted records cannot be recovered.\n\nTo confirm deletion, type 'DELETE' exactly in the field below.");
    if (userInput !== 'DELETE') {
      if (userInput !== null) {
        toast.error('Text did not match. Deletion cancelled.');
      }
      return;
    }

    try {
      await classRegistrationService.deleteRegistration(item.id);
      toast.success('Registration deleted successfully');
      setActionReg(null);
    } catch (error) {
      toast.error('Failed to delete registration');
    }
  };

  return (
    <div className="w-full">
      {/* Registration List */}
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
              </div>
            ) : groupedRegistrations.length === 0 ? (
              <div className="text-center py-12 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">inbox</span>
                <p className="text-on-surface-variant">No registrations found for this month.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedRegistrations.map((userGroup, idx) => (
                  <div key={userGroup.userId || idx} className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/20 hover:shadow-md transition-shadow duration-300">
                    <div className="mb-4">
                      <UserBadge 
                        uid={userGroup.userId}
                        nickname={userGroup.applicantName}
                        photoURL={userGroup.userAvatar}
                        avatarSize="w-12 h-12 ring-2 ring-primary-container/20"
                        nameClassName="font-title-md text-title-md text-on-surface"
                        subText={
                          <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                            Member since {userGroup.joinedAt ? format(userGroup.joinedAt, 'MMM yyyy') : 'Unknown'}
                          </p>
                        }
                      />
                    </div>
                    
                    <div className="bg-surface-container-low rounded-lg p-2 space-y-2">
                      {userGroup.items.map(item => {
                        const typeInfo = getItemTypeDetails(item.itemType, item.classId);
                        const appliedDate = safeDate(item.appliedAt) || new Date();
                        
                        return (
                          <div key={item.id} className="flex flex-col p-3 rounded-lg bg-white border border-outline-variant/20 shadow-sm gap-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${typeInfo.bgClass}`}>
                                  {typeInfo.label}
                                </span>
                                <button 
                                  onClick={() => handleTitleClick(item)}
                                  className="font-body-md text-sm text-on-surface font-semibold hover:text-primary transition-colors text-left"
                                >
                                  {item.classTitle}
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-label-sm text-xs text-on-surface-variant">
                                  {format(appliedDate, 'MMM dd')}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/20">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-on-surface-variant">Payment Status</label>
                                <button 
                                  onClick={() => handleTogglePayment(item)}
                                  className={`px-3 py-1 text-xs font-bold rounded-full transition-colors active:scale-95 ${item.status === 'PAYMENT_COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-variant text-on-surface-variant hover:bg-outline-variant/20'}`}
                                >
                                  {item.status === 'PAYMENT_COMPLETED' ? 'Paid' : 'Pending'}
                                </button>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <label className="text-xs font-bold text-on-surface-variant whitespace-nowrap">Amount (₩)</label>
                                <input 
                                   type="number" 
                                   className="w-1/2 text-right text-sm p-1.5 border border-outline-variant rounded bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50" 
                                   defaultValue={item.paymentAmount || ''} 
                                   onBlur={(e) => handleUpdateAmount(item, e.target.value)}
                                   placeholder="0"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-on-surface-variant">Memo</label>
                                <input 
                                  type="text" 
                                  className="w-full text-sm p-1.5 border border-outline-variant rounded bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50" 
                                  defaultValue={item.adminMemo || ''} 
                                  onBlur={(e) => handleUpdateMemo(item, e.target.value)}
                                  placeholder="Add notes (e.g. Bank transfer, Late fee)..."
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Action Modal */}
            {actionReg && (() => {
              const resolvedActionType = getResolvedItemType(actionReg.itemType, actionReg.classId);
              return (
              <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 sm:p-4 backdrop-blur-sm transition-opacity">
                <div className="bg-surface sm:rounded-xl rounded-t-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in duration-200 pb-safe">
                  <div className="px-5 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest">
                    <h3 className="font-title-md text-on-surface truncate pr-4">{actionReg.classTitle}</h3>
                    <button 
                      onClick={() => setActionReg(null)}
                      className="text-on-surface-variant hover:text-on-surface p-1 rounded-full transition-colors active:scale-95 bg-surface-variant/50 hover:bg-surface-variant"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>
                  
                  <div className="p-2 flex flex-col gap-1 bg-surface-container-lowest">
                    {resolvedActionType === 'monthlyPass' && (
                      <button 
                        onClick={handleEditPass}
                        className="w-full text-left px-4 py-3.5 hover:bg-surface-variant/50 transition-colors font-body-md text-on-surface flex items-center gap-3 rounded-lg active:scale-[0.98]"
                      >
                        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">edit</span>
                        수강 목록 수정
                      </button>
                    )}
                    


                    <button 
                      onClick={() => handleDelete(actionReg)}
                      className="w-full text-left px-4 py-3.5 hover:bg-error-container/50 text-error transition-colors font-body-md flex items-center gap-3 rounded-lg active:scale-[0.98]"
                    >
                      <span className="material-symbols-outlined text-error text-[20px]">delete</span>
                      내역 삭제
                    </button>
                  </div>
                </div>
              </div>
            );
            })()}

            {/* Class Selection Popup */}
            {selectedPopupReg && (
              <GroupClassSelectionPopup
                isOpen={!!selectedPopupReg}
                onClose={() => setSelectedPopupReg(null)}
                registration={selectedPopupReg}
                allClasses={allClasses}
                includedClassIds={popupIncludedIds}
                canEdit={user?.uid === selectedPopupReg.userId || user?.uid === group.ownerId || group.members?.some(m => m.id === user?.uid && m.role === 'admin')}
              />
            )}
    </div>
  );
}
