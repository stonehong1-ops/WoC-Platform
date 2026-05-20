import { useState } from 'react';
import { 
  collection, 
  doc, 
  serverTimestamp, 
  writeBatch, 
  getDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { BaseBooking, UnifiedCheckoutData } from '@/types/booking';
import { notificationService } from '@/lib/firebase/notificationService';
import { chatService } from '@/lib/firebase/chatService';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

const COLLECTION_NAME = 'bookings';

// Helper to clean undefined/null deeply
function cleanData(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanData);
  
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const cleaned = cleanData(obj[key]);
    if (cleaned !== undefined && cleaned !== null) {
      result[key] = cleaned;
    }
  }
  return result;
}

export function useBookingEngine() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 1. Create a new booking
   */
  const createBooking = async (data: UnifiedCheckoutData) => {
    if (!user) {
      throw new Error("User must be logged in to create a booking.");
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const batch = writeBatch(db);
      const bookingRef = doc(collection(db, COLLECTION_NAME));
      
      let prefix = 'BK';
      if (data.domain.startsWith('class')) prefix = 'CL';
      else if (data.domain === 'shop') prefix = 'SH';
      else if (data.domain === 'stay') prefix = 'ST';
      else if (data.domain === 'rental') prefix = 'RT';
      else if (data.domain === 'resale') prefix = 'RS';
      else if (data.domain === 'events') prefix = 'EV';

      const year = new Date().getFullYear();
      const sequence = Array.from({length: 6}, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');
      const orderNumber = `${prefix}-${year}-${sequence}`;

      const bookingDoc: Partial<BaseBooking> & { orderNumber?: string } = {
        ...cleanData(data),
        id: bookingRef.id,
        orderNumber,
        buyerId: user.uid,
        buyerName: user.displayName || 'Unknown User',
        status: 'SUBMITTED',
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      batch.set(bookingRef, bookingDoc);

      await batch.commit();

      // Automated Chat Notification to Host (Seller/Organizer)
      try {
        const hostId = data.hostId || 'adminstone';
        if (hostId) {
          const roomId = await chatService.getOrCreatePrivateRoom([user.uid, hostId], user.uid, 'business');
          
          const sym = data.currency === 'USD' ? '$' : data.currency === 'KRW' ? '₩' : data.currency + ' ';
          const totalFmt = data.totalAmount.toLocaleString();
          
          // Order Placed Message
          const orderMsg = `📦 ${t('shop.chat_order_prefix', '[ORDER PLACED]')}\n` +
            `${t('shop.chat_order_no', 'Order No')}: ${orderNumber}\n` +
            `${t('shop.chat_product_name', 'Item')}: ${data.itemName}\n` +
            `${t('shop.chat_amount', 'Amount')}: ${sym}${totalFmt}\n` +
            (data.itemImageUrl ? `Image: ${data.itemImageUrl}` : '');

          await chatService.sendMessage({
            roomId,
            senderId: user.uid,
            senderName: user.displayName || t('common.user', 'User'),
            text: orderMsg,
            type: 'text',
            metadata: {
              actionType: 'booking_approval',
              bookingId: bookingRef.id,
              status: 'SUBMITTED',
              domain: data.domain || 'class',
              sellerId: hostId,
              buyerId: user.uid
            }
          });
        }
      } catch (chatErr) {
        console.error('Failed to send booking chat notification:', chatErr);
      }

      return `${bookingRef.id}|${orderNumber}`;
    } catch (err: any) {
      console.error("Failed to create booking:", err);
      setError(err.message || 'Failed to create booking');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 1.5 Report Payment (User action after creating PENDING booking)
   */
  const reportPayment = async (bookingId: string, memo?: string) => {
    if (!user) {
      throw new Error("User must be logged in to report payment.");
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const batch = writeBatch(db);
      const bookingRef = doc(db, COLLECTION_NAME, bookingId);
      const snap = await getDoc(bookingRef);
      
      if (!snap.exists()) {
        throw new Error("Booking not found");
      }
      
      const bookingData = snap.data() as BaseBooking & { orderNumber?: string };

      batch.update(bookingRef, {
        status: 'BANK_TRANSFERRED',
        updatedAt: serverTimestamp(),
        ...(memo ? { paymentMemo: memo } : {})
      });

      // 1. Host Notification (No functions)
      if (bookingData.hostId) {
        await notificationService.createNotification(
          {
            targetUserId: bookingData.hostId,
            category: 'BOOKING',
            type: 'BOOKING_REQUEST',
            title: 'New Booking Request',
            message: `${bookingData.buyerName} requested to join '${bookingData.itemName}'. Please review in chat.`,
            actionUrl: `/history`, 
            referenceId: bookingId,
          },
          batch
        );
      }

      // 2. User Info
      await notificationService.createNotification({
        targetUserId: user.uid,
        category: 'BOOKING',
        type: 'BOOKING_CREATED',
        title: 'Request Submitted',
        message: `Your request for '${bookingData.itemName}' is submitted and waiting for host confirmation.`,
        actionUrl: `/history`,
        referenceId: bookingId,
      }, batch);

      await batch.commit();

      // Automated Chat Notification for Payment Reported
      try {
        const hostId = bookingData.hostId || 'adminstone';
        if (hostId) {
          const roomId = await chatService.getOrCreatePrivateRoom([user.uid, hostId], user.uid, 'business');
          const orderNumDisplay = bookingData.orderNumber || bookingData.id;
          const msg = `💸 ${t('shop.chat_payment_prefix', '[PAYMENT REPORTED]')}\n` +
            `${t('shop.chat_order_no', 'Order No')}: ${orderNumDisplay}\n` +
            `${t('shop.chat_product_name', 'Item')}: ${bookingData.itemName}\n` +
            `${t('shop.chat_depositor', 'Depositor')}: ${user.displayName || t('common.user', 'User')}` +
            (memo ? `\nMemo: ${memo}` : '');
          
          // 1. Buyer's payment report message
          await chatService.sendMessage({
            roomId,
            senderId: user.uid,
            senderName: user.displayName || t('common.user', 'User'),
            text: msg,
            type: 'text',
            metadata: {
              actionType: 'booking_approval',
              bookingId: bookingId,
              status: 'BANK_TRANSFERRED',
              domain: bookingData.domain || 'class',
              sellerId: hostId,
              buyerId: user.uid,
              itemName: bookingData.itemName
            }
          });

          // 2. Seller's automated review reply
          await chatService.sendMessage({
            roomId,
            senderId: hostId,
            senderName: 'Host',
            text: '입금 확인 후 답변드리겠습니다. I will review and reply.',
            type: 'text'
          });
        }
      } catch (chatErr) {
        console.error('Failed to send payment reported chat notification:', chatErr);
      }

    } catch (err: any) {
      console.error("Failed to report payment:", err);
      setError(err.message || 'Failed to report payment');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 2. Confirm a booking (Host action)
   */
  const confirmBooking = async (bookingId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const batch = writeBatch(db);
      const bookingRef = doc(db, COLLECTION_NAME, bookingId);
      const snap = await getDoc(bookingRef);
      
      if (!snap.exists()) {
        throw new Error("Booking not found");
      }
      
      const bookingData = snap.data() as BaseBooking;

      batch.update(bookingRef, {
        status: 'SELLER_CONFIRMED',
        confirmedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Notify User
      await notificationService.createNotification({
        targetUserId: bookingData.buyerId,
        category: 'BOOKING',
        type: 'BOOKING_CONFIRMED',
        title: 'Booking Confirmed',
        message: `Your booking for '${bookingData.itemName}' has been confirmed!`,
        actionUrl: `/history`,
        referenceId: bookingId,
      }, batch);

      await batch.commit();

      // Automated Chat Notification for Confirmation
      try {
        const hostId = bookingData.hostId || 'adminstone';
        if (hostId) {
          const roomId = await chatService.getOrCreatePrivateRoom([bookingData.buyerId, hostId], bookingData.buyerId, 'business');
          const msg = `✅ [BOOKING CONFIRMED]\n입금 확인 되었습니다. 감사합니다. I confirmed your bank transfer. Thank you.`;
          
          // Send message as host
          await chatService.sendMessage({
            roomId,
            senderId: hostId,
            senderName: 'Host', // In real app, might want host's name
            text: msg,
            type: 'text'
          });
        }
      } catch (chatErr) {
        console.error('Failed to send booking confirmation chat notification:', chatErr);
      }

    } catch (err: any) {
      console.error("Failed to confirm booking:", err);
      setError(err.message || 'Failed to confirm booking');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 3. Start Chat (Inquire action)
   */
  const startInquiryChat = (hostId: string, itemData: { id: string, name: string, imageUrl?: string, price?: number }) => {
    // Generate a rich card message payload
    const richCardPayload = encodeURIComponent(JSON.stringify({
      type: 'item_inquiry',
      itemId: itemData.id,
      itemName: itemData.name,
      imageUrl: itemData.imageUrl,
      price: itemData.price
    }));
    
    // Navigate to chat with hostId and payload
    router.push(`/chat/${hostId}?payload=${richCardPayload}`);
  };

  /**
   * 4. Handle Chat-based Booking Action (Approve / Reject)
   */
  const handleBookingAction = async (bookingId: string, action: 'SELLER_CONFIRMED' | 'SELLER_REJECTED', messageId: string, roomId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const batch = writeBatch(db);
      const bookingRef = doc(db, COLLECTION_NAME, bookingId);
      const snap = await getDoc(bookingRef);
      
      if (!snap.exists()) {
        throw new Error("Booking not found");
      }
      
      const bookingData = snap.data() as BaseBooking;

      batch.update(bookingRef, {
        status: action,
        ...(action === 'SELLER_CONFIRMED' ? { confirmedAt: serverTimestamp() } : {}),
        updatedAt: serverTimestamp()
      });

      // Update the chat message metadata so buttons disappear
      const msgRef = doc(db, 'chat_messages', messageId);
      batch.update(msgRef, {
        'metadata.status': action
      });

      await batch.commit();

      // Send the appropriate reply message
      const hostId = bookingData.hostId || 'adminstone';
      let replyText = '';
      if (action === 'SELLER_CONFIRMED') {
        replyText = `✅ [BOOKING CONFIRMED]\n입금 확인 되었습니다. 감사합니다. I confirmed your bank transfer. Thank you.`;
      } else {
        replyText = `❌ [ORDER CANCELLED]\n죄송합니다. 요청을 취소합니다. I am sorry for canceling your request.`;
      }

      await chatService.sendMessage({
        roomId,
        senderId: hostId,
        senderName: user?.displayName || 'Host',
        text: replyText,
        type: 'text'
      });

    } catch (err: any) {
      console.error("Failed to handle booking action:", err);
      setError(err.message || 'Failed to handle booking action');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 2.5 Cancel a booking (Host/Seller action)
   */
  const cancelBooking = async (bookingId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const batch = writeBatch(db);
      const bookingRef = doc(db, COLLECTION_NAME, bookingId);
      const snap = await getDoc(bookingRef);
      
      if (!snap.exists()) {
        throw new Error("Booking not found");
      }
      
      const bookingData = snap.data() as BaseBooking;

      batch.update(bookingRef, {
        status: 'CANCELLED',
        updatedAt: serverTimestamp()
      });

      // Notify User
      await notificationService.createNotification({
        targetUserId: bookingData.buyerId,
        category: 'BOOKING',
        type: 'BOOKING_CANCELLED',
        title: 'Booking Cancelled',
        message: `Your booking for '${bookingData.itemName}' has been cancelled by the host.`,
        actionUrl: `/history`,
        referenceId: bookingId,
      }, batch);

      await batch.commit();

      // Automated Chat Notification for Cancellation
      try {
        const hostId = bookingData.hostId || 'adminstone';
        if (hostId) {
          const roomId = await chatService.getOrCreatePrivateRoom([bookingData.buyerId, hostId], bookingData.buyerId, 'business');
          const msg = `❌ [ORDER CANCELLED]\n죄송합니다. 요청을 취소합니다. I am sorry for canceling your request.`;
          
          await chatService.sendMessage({
            roomId,
            senderId: hostId,
            senderName: 'Host',
            text: msg,
            type: 'text'
          });
        }
      } catch (chatErr) {
        console.error('Failed to send booking cancellation chat notification:', chatErr);
      }

    } catch (err: any) {
      console.error("Failed to cancel booking:", err);
      setError(err.message || 'Failed to cancel booking');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createBooking,
    reportPayment,
    confirmBooking,
    cancelBooking,
    startInquiryChat,
    handleBookingAction,
    isLoading,
    error
  };
}
