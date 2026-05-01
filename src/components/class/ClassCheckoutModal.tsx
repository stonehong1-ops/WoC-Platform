'use client';

import React, { useState } from 'react';
import { GroupClass } from '@/types/group';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/AuthProvider';
import { classRegistrationService } from '@/lib/firebase/classRegistrationService';

interface ClassCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cls: (GroupClass & { groupId: string; groupName: string }) | null;
}

const ClassCheckoutModal: React.FC<ClassCheckoutModalProps> = ({ isOpen, onClose, cls }) => {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'Leader' | 'Follower' | 'Solo'>('Solo');
  const { user, profile } = useAuth();

  if (!isOpen || !cls) return null;

  const handleRegister = async () => {
    if (!user || !profile) {
      toast.error("Please sign in first.");
      return;
    }

    setLoading(true);
    try {
      await classRegistrationService.addRegistration({
        classId: cls.id,
        groupId: cls.groupId,
        userId: user.uid,
        classTitle: cls.title,
        applicantName: profile.nickname || profile.nativeNickname || 'Unknown',
        userAvatar: profile.photoURL || undefined,
        role: role === 'Solo' ? undefined : role,
        status: 'PAYMENT_PENDING',
        amount: cls.amount || 0,
        currency: cls.currency || 'KRW',
        itemType: 'class',
        groupName: cls.groupName,
        contactNumber: profile.phoneNumber || undefined,
      });
      
      toast.success("Class registration completed!");
      onClose();
    } catch (error) {
      console.error("클래스 신청 오류:", error);
      toast.error("Class registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline/10">
          <h2 className="font-headline font-extrabold text-xl text-on-surface">Class Registration</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {/* Class Summary */}
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-surface-variant">
              {(cls.imageUrl || (cls as any).image) ? (
                <img src={cls.imageUrl || (cls as any).image} alt={cls.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-outline/50 text-2xl">image</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-primary mb-1">{cls.groupName}</p>
              <h3 className="font-headline font-bold text-base leading-tight mb-2 text-on-surface">{cls.title}</h3>
              <p className="text-xs text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                {cls.schedule?.[0]?.date || 'TBA'} {cls.schedule?.[0]?.timeSlot || ''}
              </p>
            </div>
          </div>

          {/* Registration Options */}
          <div>
            <h4 className="font-bold text-sm text-on-surface mb-3">Select Role</h4>
            <div className="grid grid-cols-3 gap-2">
              {['Leader', 'Follower', 'Solo'].map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r as any)}
                  className={`py-3 rounded-xl border font-bold text-sm transition-all ${role === r ? 'border-primary bg-primary/10 text-primary' : 'border-outline/20 text-on-surface-variant hover:bg-surface-variant/50'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-surface-container-lowest border border-outline/20 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-sm text-on-surface border-b border-outline/10 pb-2">Payment Info</h4>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Amount</span>
              <span className="font-medium text-on-surface">{(cls.amount || 0).toLocaleString()} {cls.currency || 'KRW'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Discount</span>
              <span className="font-medium text-rose-500">- 0 {cls.currency || 'KRW'}</span>
            </div>
            <div className="flex justify-between items-end pt-2 border-t border-outline/10">
              <span className="font-bold text-on-surface">Total</span>
              <span className="font-headline font-black text-xl text-primary">{(cls.amount || 0).toLocaleString()} {cls.currency || 'KRW'}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-outline/10 bg-surface">
          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
            Register & Pay
          </button>
        </div>

      </div>
    </div>
  );
};

export default ClassCheckoutModal;
