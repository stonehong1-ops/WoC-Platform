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
  arrayUnion,
  arrayRemove,
  Timestamp,
  getDoc,
  where,
  deleteDoc
} from 'firebase/firestore';
import { Product, CartItem, Order } from '@/types/shop';

const PRODUCTS_COLLECTION = 'products';
const CART_COLLECTION = 'cart_items';
const ORDERS_COLLECTION = 'orders';

export const shopService = {
  // 1. Subscribe to real-time products
  subscribeProducts: (category: string | null, callback: (products: Product[]) => void) => {
    let q = query(
      collection(db, PRODUCTS_COLLECTION), 
      orderBy('createdAt', 'desc')
    );
    
    if (category && category !== 'All') {
      q = query(q, where('category', '==', category));
    }
    
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      callback(products);
    });
  },

  // 2. Register Product (Selling)
  registerProduct: async (productData: Omit<Product, 'id' | 'createdAt' | 'likesCount' | 'status'>) => {
    try {
      const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
        ...productData,
        status: 'active',
        likesCount: 0,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error registering product:", error);
      throw error;
    }
  },

  // 3. Cart Logic
  addToCart: async (userId: string, product: Product) => {
    try {
      // Check if already in cart
      const cartRef = collection(db, CART_COLLECTION);
      const q = query(cartRef, where('userId', '==', userId), where('productId', '==', product.id));
      const snapshot = await getDoc(doc(db, CART_COLLECTION, `${userId}_${product.id}`)); // Or use query
      
      await addDoc(collection(db, CART_COLLECTION), {
        userId,
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        productImage: product.imageUrl,
        quantity: 1,
        addedAt: serverTimestamp()
      });
    } catch (error) {
       console.error("Error adding to cart:", error);
    }
  },

  // 4. Create Order
  createOrder: async (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>) => {
    try {
      const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
        ...orderData,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }
};
