import { chatService } from '@/lib/firebase/chatService';
import { Product } from '@/types/shop';
import { ResaleItem } from '@/types/resale';
import { Stay } from '@/types/stay';

const fmt = (n: number) => n.toLocaleString();

export const notificationUtils = {
  // Shop Purchase
  sendShopPurchaseNotification: async ({
    user,
    product,
    orderNumber,
    itemPrice,
    totalAmount,
    selectedSize,
    sym,
    t
  }: {
    user: any;
    product: Product;
    orderNumber: string;
    itemPrice: number;
    totalAmount: number;
    selectedSize: string;
    sym: string;
    t: (key: string, defaultText: string) => string;
  }) => {
    try {
      const sellerId = product.sellerId || 'adminstone';
      if (!sellerId) return;

      const roomId = await chatService.getOrCreatePrivateRoom([user.uid, sellerId], user.uid, 'business');
      
      const productInfoMsg = `🛍️ ${t('shop.chat_inquiry_prefix', '[Product Inquiry]')}\n` +
        `${t('shop.chat_brand', 'Brand')}: ${product.brand}\n` +
        `${t('shop.chat_product_name', 'Title')}: ${product.title}\n` +
        `${t('shop.chat_price', 'Price')}: ${sym}${fmt(itemPrice)}\n` +
        `${t('shop.chat_image', 'Image')}: ${product.images?.[0] || product.imageUrl || ''}\n` +
        `${t('shop.chat_link', 'Link')}: ${window.location.origin}/shop?productId=${product.id}`;
      
      await chatService.sendMessage({
        roomId,
        senderId: user.uid,
        senderName: user.displayName || t('common.user', 'User'),
        text: productInfoMsg,
        type: 'text'
      });

      const orderMsg = `📦 ${t('shop.chat_order_prefix', '[ORDER PLACED]')}\n` +
        `${t('shop.chat_order_no', 'Order No')}: ${orderNumber}\n` +
        `${t('shop.chat_product_name', 'Product')}: ${product.title}\n` +
        `${t('shop.chat_option', 'Option')}: ${selectedSize || 'None'}\n` +
        `${t('shop.chat_amount', 'Amount')}: ${sym}${fmt(totalAmount)}\n` +
        `${t('shop.chat_image', 'Image')}: ${product.images?.[0] || product.imageUrl || ''}`;

      await chatService.sendMessage({
        roomId,
        senderId: user.uid,
        senderName: user.displayName || t('common.user', 'User'),
        text: orderMsg,
        type: 'text'
      });
    } catch (err) {
      console.error('Failed to send shop order notification:', err);
    }
  },

  // Resale Purchase
  sendResalePurchaseNotification: async ({
    user,
    item,
    orderNumber,
    buyerPhone,
    t
  }: {
    user: any;
    item: ResaleItem;
    orderNumber: string;
    buyerPhone: string;
    t: (key: string, defaultText: string) => string;
  }) => {
    try {
      const sellerId = item.sellerId;
      if (!sellerId || sellerId === user.uid) return;

      const roomId = await chatService.getOrCreatePrivateRoom([user.uid, sellerId], user.uid, 'business');
      
      const productInfoMsg = `🛍️ [Resale Inquiry]\n` +
        `${t('resale.chat_item_name', 'Item')}: ${item.title}\n` +
        `${t('resale.chat_price', 'Price')}: ₩${fmt(item.price)}\n` +
        `Image: ${item.imageUrl || ''}\n` +
        `Link: ${window.location.origin}/resale?productId=${item.id}`;
      
      await chatService.sendMessage({
        roomId,
        senderId: user.uid,
        senderName: user.displayName || 'User',
        text: productInfoMsg,
        type: 'text'
      });

      const orderMsg = `📦 [PURCHASE REQUEST]\n` +
        `Order No: ${orderNumber}\n` +
        `${t('resale.chat_item_name', 'Item')}: ${item.title}\n` +
        `${t('resale.contact_number', 'Contact')}: ${buyerPhone}\n` +
        `Amount: ₩${fmt(item.price)}\n` +
        `I would like to purchase this item!`;

      await chatService.sendMessage({
        roomId,
        senderId: user.uid,
        senderName: user.displayName || 'User',
        text: orderMsg,
        type: 'text'
      });
    } catch (err) {
      console.error('Failed to send resale purchase notification:', err);
    }
  },

  // Stay Reservation
  sendStayReservationNotification: async ({
    user,
    stay,
    checkIn,
    checkOut,
    nights,
    guests,
    grandTotal,
    sym,
    applicantName,
    t,
    formatDate
  }: {
    user: any;
    stay: Stay;
    checkIn: Date;
    checkOut: Date;
    nights: number;
    guests: number;
    grandTotal: number;
    sym: string;
    applicantName: string;
    t: (key: string, defaultText: string) => string;
    formatDate: (date: Date | string, formatStyle: string) => string;
  }) => {
    try {
      const hostId = stay.host?.userId || 'adminstone';
      if (!hostId) return;

      const roomId = await chatService.getOrCreatePrivateRoom([user.uid, hostId], user.uid, 'business');
      
      const msg = `🏨 [STAY BOOKING]\n` +
        `Stay: ${stay.title}\n` +
        `Dates: ${formatDate(checkIn, 'shortMonthDay')} - ${formatDate(checkOut, 'shortMonthDay')}\n` +
        `Nights: ${nights}\n` +
        `Guests: ${guests}\n` +
        `Amount: ${sym}${fmt(grandTotal)}\n` +
        `Applicant: ${applicantName}\n` +
        `Image: ${stay.images?.[0] || ''}`;

      await chatService.sendMessage({
        roomId,
        senderId: user.uid,
        senderName: user.displayName || applicantName,
        text: msg,
        type: 'text'
      });
    } catch (err) {
      console.error('Failed to send stay booking notification:', err);
    }
  },

  // Payment Reported
  sendPaymentReportedNotification: async ({
    user,
    sellerId,
    orderNumber,
    type,
    t,
    depositorName
  }: {
    user: any;
    sellerId: string;
    orderNumber: string;
    type: 'shop' | 'resale' | 'stay';
    t: (key: string, defaultText: string) => string;
    depositorName?: string;
  }) => {
    try {
      if (!sellerId || sellerId === user.uid) return;

      const roomId = await chatService.getOrCreatePrivateRoom([user.uid, sellerId], user.uid, 'business');
      
      let prefix = '';
      let msgBody = '';
      
      const depositor = depositorName || user.displayName || t('common.user', 'User');

      if (type === 'shop') {
        prefix = `💸 ${t('shop.chat_payment_prefix', '[PAYMENT REPORTED]')}`;
        msgBody = `${t('shop.chat_order_no', 'Order No')}: ${orderNumber}\n` +
                  `${t('shop.chat_depositor', 'Depositor')}: ${depositor}\n` +
                  `${t('shop.chat_payment_msg', 'I have transferred the payment. Please confirm!')}`;
      } else if (type === 'stay') {
        prefix = `💸 ${t('stay.chat_payment_prefix', '[PAYMENT REPORTED]')}`;
        msgBody = `${t('stay.chat_order_no', 'Booking No')}: ${orderNumber}\n` +
                  `${t('stay.chat_depositor', 'Depositor')}: ${depositor}\n` +
                  `${t('stay.chat_payment_msg', 'I have transferred the payment. Please confirm!')}`;
      } else if (type === 'resale') {
        prefix = `💸 [PAYMENT REPORTED]`;
        msgBody = `Order No: ${orderNumber}\n` +
                  `Depositor: ${depositor}\n` +
                  `I have transferred the payment. Please confirm!`;
      }

      await chatService.sendMessage({
        roomId,
        senderId: user.uid,
        senderName: depositor,
        text: `${prefix}\n${msgBody}`,
        type: 'text'
      });
    } catch (err) {
      console.error('Failed to send payment reported notification:', err);
    }
  }
};
