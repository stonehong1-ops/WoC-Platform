'use client';

import React, { useState } from 'react';
import { GroupClass } from '@/types/group';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/AuthProvider';
import { classRegistrationService } from '@/lib/firebase/classRegistrationService';
import BottomSheet from '@/components/common/BottomSheet';

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

  const footer = (
    <div className="p-4 bg-surface">
      <button
        onClick={handleRegister}
        disabled={loading}
        className="w-full bg-primary text-on-primary font-medium py-3.5 rounded-full hover:bg-primary/90 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
      >
        {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
        Register & Pay
      </button>
    </div>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Class Registration" footer={footer}>
      <div className="flex flex-col gap-6 py-2">
        {/* Class Summary */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-surface-variant">
            {(cls.imageUrl || (cls as any).image) ? (
              <img src={cls.imageUrl || (cls as any).image} alt={cls.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-outline/50">image</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-primary mb-0.5">{cls.groupName}</p>
            <h3 className="text-base font-medium text-on-surface leading-tight mb-1">{cls.title}</h3>
            <p className="text-sm text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
              {cls.schedule?.[0]?.date || 'TBA'} {cls.schedule?.[0]?.timeSlot || ''}
            </p>
          </div>
        </div>

        {/* Registration Options */}
        <div>
          <h4 className="font-medium text-sm text-on-surface mb-3">Select Role</h4>
          <div className="flex gap-2">
            {['Leader', 'Follower', 'Solo'].map(r => (
              <button
                key={r}
                onClick={() => setRole(r as any)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  role === r 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-outline-variant text-on-surface-variant hover:bg-surface-variant/50'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-on-surface-variant">Amount</span>
            <span className="text-on-surface">{(cls.amount || 0).toLocaleString()} {cls.currency || 'KRW'}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-on-surface-variant">Discount</span>
            <span className="text-error">- 0 {cls.currency || 'KRW'}</span>
          </div>
          <div className="h-px bg-outline-variant/20 w-full my-2" />
          <div className="flex justify-between items-end">
            <span className="font-medium text-on-surface">Total</span>
            <span className="font-bold text-lg text-primary">{(cls.amount || 0).toLocaleString()} {cls.currency || 'KRW'}</span>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};

export default ClassCheckoutModal;
