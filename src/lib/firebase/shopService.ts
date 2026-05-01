import { db } from './clientApp';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  Timestamp,
  getDoc,
  getDocs,
  where,
  deleteDoc,
  setDoc,
  increment,
  runTransaction
} from 'firebase/firestore';
import { Product, ProductLike, ShopBanner, ShopOrder, OrderStatus } from '@/types/shop';

const PRODUCTS_COLLECTION = 'products';
const LIKES_COLLECTION = 'product_likes';
const BANNERS_COLLECTION = 'shop_banners';
const ORDERS_COLLECTION = 'shop_orders';

// Helper: Remove undefined/null fields (recursive for nested objects/arrays)
function cleanData(obj: any): any {
  if (obj === undefined || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(item => cleanData(item));
  if (obj instanceof Timestamp) return obj; // Preserve Firestore Timestamps
  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined && obj[key] !== null) {
        result[key] = cleanData(obj[key]);
      }
    }
    return result;
  }
  return obj;
}

export const shopService = {
  // ===== PRODUCTS =====

  // Subscribe to products for a specific group (Admin view)
  subscribeGroupProducts: (groupId: string, callback: (products: Product[]) => void) => {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      callback(products);
    }, (error) => {
      console.error("Error subscribing to group products:", error);
    });
  },

  // Subscribe to all products (public storefront)
  subscribeProducts: (category: string | null, callback: (products: Product[]) => void) => {
    let q = query(
      collection(db, PRODUCTS_COLLECTION), 
      where('status', '==', 'Active'),
      orderBy('createdAt', 'desc')
    );
    
    if (category && category !== 'All') {
      q = query(
        collection(db, PRODUCTS_COLLECTION),
        where('status', '==', 'Active'),
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );
    }
    
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      callback(products);
    }, (error) => {
      console.error('Index may still be building, falling back:', error);
      // Fallback: query without composite index, filter client-side
      const fallbackQ = query(
        collection(db, PRODUCTS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      onSnapshot(fallbackQ, (snapshot) => {
        let products = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        // Client-side filter
        products = products.filter(p => p.status === 'Active');
        if (category && category !== 'All') {
          products = products.filter(p => p.category === category);
        }
        callback(products);
      });
    });
  },

  // Add a new product
  addProduct: async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'viewsCount'>) => {
    try {
      const cleaned = cleanData(data);
      const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
        ...cleaned,
        likesCount: 0,
        viewsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding product:", error);
      throw error;
    }
  },

  // Update a product
  updateProduct: async (productId: string, updates: Partial<Product>) => {
    try {
      const cleaned = cleanData(updates);
      const ref = doc(db, PRODUCTS_COLLECTION, productId);
      await updateDoc(ref, {
        ...cleaned,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },

  // Delete a product
  deleteProduct: async (productId: string) => {
    try {
      await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId));
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  },

  // Toggle product status
  toggleProductStatus: async (productId: string, newStatus: 'Active' | 'Stopped') => {
    try {
      const ref = doc(db, PRODUCTS_COLLECTION, productId);
      await updateDoc(ref, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error toggling product status:", error);
      throw error;
    }
  },

  // ===== ORDERS =====

  // Subscribe to orders for a specific group (Admin view)
  subscribeGroupOrders: (groupId: string, callback: (orders: ShopOrder[]) => void) => {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ShopOrder[];
      callback(orders);
    }, (error) => {
      console.error("Error subscribing to group orders:", error);
    });
  },

  // Update order status (Admin action)
  updateOrderStatus: async (orderId: string, newStatus: OrderStatus, extras?: Record<string, any>) => {
    try {
      const ref = doc(db, ORDERS_COLLECTION, orderId);
      const updateData: any = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };
      
      // Validation for Shipping
      if (newStatus === 'SHIPPING' && (!extras || !extras.trackingNumber)) {
        throw new Error("운송장 번호가 필요합니다.");
      }

      // Add timestamp for specific status transitions
      if (newStatus === 'CONFIRMED') updateData.confirmedAt = serverTimestamp();
      if (newStatus === 'IN_PRODUCTION') updateData.productionStartAt = serverTimestamp();
      if (newStatus === 'SHIPPING') {
        updateData.shippedAt = serverTimestamp();
        updateData.shippingCarrier = extras?.shippingCarrier || 'Unknown';
        updateData.trackingNumber = extras?.trackingNumber;
      }
      if (newStatus === 'COMPLETED') updateData.completedAt = serverTimestamp();
      
      if (extras) {
        // Only merge if not already handled specifically
        const cleanedExtras = cleanData(extras);
        Object.keys(cleanedExtras).forEach(key => {
          if (!(key in updateData)) {
            updateData[key] = cleanedExtras[key];
          }
        });
      }
      
      await updateDoc(ref, updateData);
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  },

  // Create order (Customer action)
  createOrder: async (data: Omit<ShopOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const cleaned = cleanData(data);
      
      // Use provided deadline or set to 1 hour from now
      let paymentDeadline = cleaned.paymentDeadline;
      if (!paymentDeadline) {
        const deadline = new Date();
        deadline.setHours(deadline.getHours() + 1);
        paymentDeadline = Timestamp.fromDate(deadline);
      }

      const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
        ...cleaned,
        paymentDeadline,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  // ===== LIKES (WISHLIST) =====

  // Toggle like (찜 토글) — atomic transaction
  toggleLike: async (userId: string, productId: string): Promise<boolean> => {
    const likeId = `${userId}_${productId}`;
    const likeRef = doc(db, LIKES_COLLECTION, likeId);
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);

    try {
      const likeSnap = await getDoc(likeRef);
      
      if (likeSnap.exists()) {
        // Un-like: 찜 해제
        await deleteDoc(likeRef);
        await updateDoc(productRef, { likesCount: increment(-1) });
        return false; // now unliked
      } else {
        // Like: 찜 추가
        await setDoc(likeRef, {
          userId,
          productId,
          createdAt: serverTimestamp()
        });
        await updateDoc(productRef, { likesCount: increment(1) });
        return true; // now liked
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  },

  // Subscribe to user's liked products (내 찜 목록 실시간 구독)
  subscribeMyLikes: (userId: string, callback: (likes: ProductLike[]) => void) => {
    const q = query(
      collection(db, LIKES_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const likes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProductLike[];
      callback(likes);
    }, (error) => {
      console.error('Error subscribing to likes:', error);
    });
  },

  // Clear all likes for a user (찜통 비우기)
  clearAllLikes: async (userId: string) => {
    try {
      const q = query(
        collection(db, LIKES_COLLECTION),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      
      // Batch delete all likes and decrement counts
      const deletePromises = snapshot.docs.map(async (likeDoc) => {
        const likeData = likeDoc.data();
        await deleteDoc(likeDoc.ref);
        // Decrement likesCount on the product
        const productRef = doc(db, PRODUCTS_COLLECTION, likeData.productId);
        await updateDoc(productRef, { likesCount: increment(-1) }).catch(() => {});
      });
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error clearing all likes:', error);
      throw error;
    }
  },

  // ===== SINGLE PRODUCT =====

  // Get a single product by ID (상세 조회)
  getProduct: async (productId: string): Promise<Product | null> => {
    try {
      const ref = doc(db, PRODUCTS_COLLECTION, productId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Product;
    } catch (error) {
      console.error('Error getting product:', error);
      return null;
    }
  },

  // Subscribe to all active products (전체 상품 실시간 구독)
  subscribeAllProducts: (callback: (products: Product[]) => void) => {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('status', '==', 'Active'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      callback(products);
    }, (error) => {
      console.error('Error subscribing to all products:', error);
    });
  },

  // Increment view count
  incrementViews: async (productId: string) => {
    try {
      const ref = doc(db, PRODUCTS_COLLECTION, productId);
      await updateDoc(ref, { viewsCount: increment(1) });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  },

  // ===== BANNERS =====

  // Subscribe to active banners (활성 배너 구독)
  subscribeBanners: (callback: (banners: ShopBanner[]) => void) => {
    const q = query(
      collection(db, BANNERS_COLLECTION),
      where('isActive', '==', true),
      orderBy('order', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const banners = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ShopBanner[];
      callback(banners);
    }, (error) => {
      console.error('Error subscribing to banners:', error);
    });
  },

  // Subscribe to user's orders (Customer view)
  subscribeUserOrders: (userId: string, callback: (orders: ShopOrder[]) => void) => {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('buyerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ShopOrder[];
      callback(orders);
    }, (error) => {
      console.error("Error subscribing to user orders:", error);
    });
  },
};
