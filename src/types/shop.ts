import { Timestamp } from 'firebase/firestore';

export type ProductStatus = 'active' | 'sold_out' | 'discontinued';

export interface Product {
  id: string;
  brand: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  sellerId: string;
  sellerName: string;
  isFeatured?: boolean;
  status: ProductStatus;
  likesCount: number;
  createdAt: Timestamp;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
  quantity: number;
  addedAt: Timestamp;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  price: number;
  quantity: number;
  shippingAddress: string;
  createdAt: Timestamp;
}
