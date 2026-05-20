import React, { useState, useEffect, useMemo } from 'react';
import { classRegistrationService } from '@/lib/firebase/classRegistrationService';
import { ClassRegistration, Group, GroupClass } from '@/types/group';
import { GroupClassSelectionPopup } from './GroupClassSelectionPopup';
import { safeDate } from '@/lib/utils/safeDate';
import UserBadge from '@/components/common/UserBadge';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { notificationUtils } from '@/lib/utils/notificationUtils';

interface GroupClassRegistrationsProps {
  group: Group;
  validClassIds: string[];
  allClasses?: GroupClass[];
  allDiscounts?: any[];
}

export function GroupClassRegistrations({ group, validClassIds, allClasses = [], allDiscounts = [] }: GroupClassRegistrationsProps) {
  const [registrations, setRegistrations] = useState<ClassRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { t, formatDate } = useLanguage();  
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
      if (allDiscounts?.some(d => d.id === classId)) return 'discount';
    }
    return type || 'class';
  };

  const getItemTypeDetails = (type?: string, classId?: string) => {
    const resolvedType = getResolvedItemType(type, classId);
    switch (resolvedType) {
      case 'discount':
        return { label: 'BUNDLE', bgClass: 'bg-secondary-container text-on-secondary-container' };
      case 'class':
      default:
        return { label: 'CLASS', bgClass: 'bg-primary-container text-on-primary-container' };
    }
  };

  const handleTogglePayment = async (item: ClassRegistration) => {
    try {
      let newStatus: ClassRegistration['status'] = 'PAYMENT_PENDING';
      
      if (item.status === 'PAYMENT_PENDING' || item.status === 'PAYMENT_REPORTED') {
        newStatus = 'PAYMENT_COMPLETED';
      } else if (item.status === 'PAYMENT_COMPLETED') {
        newStatus = 'PAYMENT_PENDING';
      }

      await classRegistrationService.updateRegistration(item.id, { status: newStatus });
      
      if (newStatus === 'PAYMENT_COMPLETED') {
        toast.success(t('group.class.toast.payment_confirmed') || 'Payment confirmed successfully');
        
        // Trigger payment completed / approved chat notification to buyer (e-step)
        if (user && item.userId) {
          notificationUtils.sendClassApprovedNotification({
            user,
            buyerId: item.userId,
            orderNumber: item.orderNumber || '',
            classTitle: item.classTitle,
            t
          }).catch(err => console.error("Failed to send approval chat:", err));
        }
      } else {
        toast.success(t('group.class.toast.payment_pending') || 'Payment marked as pending');
      }
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
    if (resolvedType === 'discount') {
      const discount = allDiscounts?.find(d => d.id === actionReg.classId);
      if (discount && discount.includedClassIds) includedIds = discount.includedClassIds;
    }
    
    setPopupIncludedIds(includedIds);
    setSelectedPopupReg(actionReg);
    setActionReg(null); // Close action menu
  };

  const handleDelete = async (item: ClassRegistration) => {
    if (!user) return;
    
    const isItemOwner = user.uid === item.userId;
    const isGroupAdmin = user.uid === group.ownerId || group.members?.some(m => m.id === user.uid && (m.role === 'admin' || m.role === 'owner'));
    
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
                            Member since {userGroup.joinedAt ? formatDate(userGroup.joinedAt, 'monthYear') : 'Unknown'}
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
                                  {formatDate(appliedDate, 'shortMonthDay')}
                                </span>
                              </div>
                            </div>
                                                      <div className="flex flex-col gap-3 pt-3 border-t border-outline-variant/20">
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Status</label>
                                  <div className="flex items-center gap-2">
                                    {item.status === 'PAYMENT_REPORTED' && (
                                      <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                                    )}
                                    <span className={`text-xs font-bold ${
                                      item.status === 'PAYMENT_COMPLETED' ? 'text-emerald-600' : 
                                      item.status === 'PAYMENT_REPORTED' ? 'text-primary' : 
                                      'text-on-surface-variant'
                                    }`}>
                                      {item.status === 'PAYMENT_COMPLETED' ? 'PAID' : 
                                       item.status === 'PAYMENT_REPORTED' ? 'PAYMENT REPORTED' : 
                                       'PENDING'}
                                    </span>
                                  </div>
                                </div>

                                <button 
                                  onClick={() => handleTogglePayment(item)}
                                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all active:scale-95 shadow-sm ${
                                    item.status === 'PAYMENT_COMPLETED' 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                      : item.status === 'PAYMENT_REPORTED'
                                      ? 'bg-primary text-white shadow-primary/20 hover:bg-primary/90 ring-4 ring-primary/10'
                                      : 'bg-surface-variant text-on-surface-variant hover:bg-outline-variant/20 border border-outline-variant/30'
                                  }`}
                                >
                                  {item.status === 'PAYMENT_COMPLETED' ? 'Undo Paid' : 
                                   item.status === 'PAYMENT_REPORTED' ? 'Confirm Payment' : 
                                   'Mark as Paid'}
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Amount (₩)</label>
                                  <input 
                                     type="number" 
                                     className="w-full text-sm p-2 border border-outline-variant rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                                     defaultValue={item.paymentAmount || item.amount || ''} 
                                     onBlur={(e) => handleUpdateAmount(item, e.target.value)}
                                     placeholder="0"
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Contact</label>
                                  <div className="text-sm p-2 border border-outline-variant rounded-lg bg-surface-container-low text-on-surface-variant truncate">
                                    {item.contactNumber || '-'}
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Admin Memo</label>
                                <input 
                                  type="text" 
                                  className="w-full text-sm p-2 border border-outline-variant rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                                  defaultValue={item.adminMemo || ''} 
                                  onBlur={(e) => handleUpdateMemo(item, e.target.value)}
                                  placeholder="Add notes..."
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
                    {resolvedActionType === 'discount' && (
                      <button 
                        onClick={handleEditPass}
                        className="w-full text-left px-4 py-3.5 hover:bg-surface-variant/50 transition-colors font-body-md text-on-surface flex items-center gap-3 rounded-lg active:scale-[0.98]"
                      >
                        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">edit</span>
                        {t('group.class.actions.edit_list') || 'Edit class list'}
                      </button>
                    )}
                    


                    <button 
                      onClick={() => handleDelete(actionReg)}
                      className="w-full text-left px-4 py-3.5 hover:bg-error-container/50 text-error transition-colors font-body-md flex items-center gap-3 rounded-lg active:scale-[0.98]"
                    >
                      <span className="material-symbols-outlined text-error text-[20px]">delete</span>
                      {t('group.class.actions.delete_record') || 'Delete record'}
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
                canEdit={user?.uid === selectedPopupReg.userId || user?.uid === group.ownerId || group.members?.some(m => m.id === user?.uid && (m.role === 'admin' || m.role === 'owner'))}
              />
            )}
    </div>
  );
}
