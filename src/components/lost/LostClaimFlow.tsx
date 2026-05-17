'use client';

import React, { useState } from 'react';
import UnifiedCheckoutModal from '@/components/common/UnifiedCheckoutModal';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { chatService } from '@/lib/firebase/chatService';
import { lostFoundService } from '@/lib/firebase/lostFoundService';
import { LostFoundItem } from '@/types/lostFound';
import { useRouter } from 'next/navigation';

interface LostClaimFlowProps {
  item: LostFoundItem;
  onClose: () => void;
}

export default function LostClaimFlow({ item, onClose }: LostClaimFlowProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [contactNumber, setContactNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const isLost = item.type === 'LOST';

  const handleCheckout = async () => {
    if (!user) throw new Error('User not authenticated');
    
    // Create a chat room with the author
    const roomId = await chatService.getOrCreatePrivateRoom(
      [user.uid, item.authorId],
      user.uid,
      'personal'
    );

    return roomId; // Returning roomId so onComplete can use it
  };

  const handleReportPayment = async (roomId: string) => {
    // Navigate to chat room after "payment" or confirmation
    router.push(`/chat/${roomId}`);
    onClose();
  };

  return (
    <UnifiedCheckoutModal
      isOpen={true}
      onClose={onClose}
      onCheckout={handleCheckout}
      onReportPayment={handleReportPayment}
      title={isLost ? t('lost.contact', 'Contact Finder') : t('lost.contact', 'Contact Owner')} 
      subtitle={item.title}
      totalAmount={item.reward || 0}
      currency="KRW"
      buttonText={isLost ? t('lost.contact', 'Contact Finder') : t('lost.contact', 'Contact Owner')}
    >
      <div className="space-y-4 pt-4 px-1">
        <div>
          <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
            {t('lost.contact_number_label')}
          </label>
          <input
            type="tel"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            className="w-full px-4 py-3 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            placeholder={t('lost.contact_number_placeholder')}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
            {t('lost.message_label')}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-3 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
            placeholder={t('lost.message_placeholder')}
            rows={3}
          />
        </div>
      </div>
    </UnifiedCheckoutModal>
  );
}
