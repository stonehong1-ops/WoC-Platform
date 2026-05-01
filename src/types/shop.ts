import { Timestamp } from 'firebase/firestore';

// ===== Product =====
export type ProductStatus = 'Active' | 'Stopped' | 'SoldOut';

export interface Product {
  id: string;
  groupId: string;
  groupName: string;
  brand: string;
  title: string;
  name?: string; // legacy compat
  description: string;
  category: string;
  currency: string;
  price: number;
  discountPrice?: number;
  images: string[];
  imageUrl?: string; // legacy compat (single image)
  options: string[]; // sizes or variants
  stock: number;
  status: ProductStatus;
  deliveryType: 'shipping' | 'pickup' | 'both';
  shippingFee?: number;
  sellerId?: string;
  sellerName?: string;
  isFeatured?: boolean;
  eventTag?: string;        // "FREE PENDANT", "BUY 1 GET 1" etc.
  likesCount: number;
  viewsCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Product Detail — custom options
  customOptions?: CustomOptionDef[];
  productionDays?: number;         // legacy single value
  productionDaysMin?: number;      // production range min
  productionDaysMax?: number;      // production range max
  deliveryDays?: number;
  freeExchangeCount?: number;
  sellerPaysShipping?: boolean;    // seller covers shipping fee
  repurchaseCouponAmount?: number; // 0 or undefined = no coupon
  returnPolicy?: string;
  sizeGuide?: string;              // max 40 chars, admin input
  coupons?: ProductCoupon[];
}

// ===== Product Like (Wishlist) =====
export interface ProductLike {
  id: string;             // 문서 ID: {userId}_{productId}
  userId: string;
  productId: string;
  createdAt: Timestamp;
}

// ===== Shop Banner =====
export interface ShopBanner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  ctaText?: string;       // "SHOP NOW"
  productId?: string;
  isActive: boolean;
  order: number;
  createdAt: Timestamp;
}

// ===== Order =====
export type OrderStatus =
  | 'PENDING'             // 입금 대기 (1시간 이내)
  | 'PAYMENT_REPORTED'    // 입금 보고 (legacy compat)
  | 'CONFIRMED'           // 입금 확인 (판매자 확인)
  | 'IN_PRODUCTION'       // 제작중
  | 'READY_PICKUP'        // 매장수령 가능
  | 'SHIPPING'            // 배송중
  | 'COMPLETED'           // 완료
  | 'EXPIRED'             // 1시간 초과 자동 만료
  | 'CANCELLED';          // 취소

export interface OrderItem {
  productId: string;
  title: string;
  image: string;
  option: string;          // selected size
  quantity: number;
  price: number;
  selectedOptions?: Record<string, any>;  // custom options { width, heel, outsole }
  optionExtra?: number;    // extra price from custom options
}

export interface ShopOrder {
  id: string;
  orderNumber: string;     // "WOC-20260430-0001"
  groupId: string;
  groupName: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string; // Added to track seller for notifications and chat
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  paymentMethod: 'bank_transfer';

  // Payment info
  depositorName?: string;
  depositDate?: string;

  // Bank info (snapshot from group.bankDetails at order time)
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;

  // Fulfillment
  fulfillmentType: 'pickup' | 'delivery';
  deliveryType?: 'shipping' | 'pickup';  // legacy compat
  shippingAddress?: string;
  trackingNumber?: string;

  // Production
  productionDaysMin?: number;
  productionDaysMax?: number;

  // Status
  status: OrderStatus;
  cancelReason?: string;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  paymentDeadline?: Timestamp;  // createdAt + 1hr
  confirmedAt?: Timestamp;
  productionStartAt?: Timestamp;
  completedAt?: Timestamp;
  shippedAt?: Timestamp;
}

// ===== Shop Settings (stored in group document) =====
export interface ShopSettings {
  shopName?: string;
  shopDescription?: string;
  shopBanner?: string;
  businessHours?: string;
  deliveryType: 'shipping' | 'pickup' | 'both';
  defaultShippingFee: number;
  freeShippingThreshold?: number;
  pickupAddress?: string;
  pickupGuide?: string;
  returnPolicy?: string;
  currency?: string;
}

// ===== Custom Option Definitions (Product Detail) =====
export interface CustomOptionDef {
  key: string;            // e.g. 'width', 'instep', 'heel_height_cm'
  label: string;          // UI label: '발볼', '발등'
  type: 'enum' | 'number' | 'boolean' | 'multi_enum';
  values?: string[];      // enum: ['REGULAR', 'WIDE', 'EXTRA_WIDE']
  labels?: string[];      // UI display: ['레귤러', '와이드', '엑스트라 와이드']
  min?: number;
  max?: number;
  step?: number;
  unit?: string;          // 'cm'
  extraPrice?: number[];  // per-value surcharge
  required?: boolean;
}

export interface ProductCoupon {
  code: string;
  label: string;           // "5,000원 할인"
  discountAmount?: number;
  discountRate?: number;
  minOrderAmount?: number;
}
