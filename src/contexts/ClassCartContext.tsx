'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface CartItem {
  type: 'class' | 'discount' | 'pass';
  itemId: string;
  title: string;
  price: number;
  currency: string;
  schedule?: string;
  location?: string;
}

interface CartState {
  groupId: string | null;
  groupName: string | null;
  items: CartItem[];
}

interface ClassCartContextType {
  cart: CartState;
  addToCart: (groupId: string, groupName: string, item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  totalPrice: number;
  currency: string;
}

const ClassCartContext = createContext<ClassCartContextType | undefined>(undefined);

export const ClassCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartState>({ groupId: null, groupName: null, items: [] });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from local storage on mount
    const saved = localStorage.getItem('woc_class_cart');
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    // Save to local storage whenever cart changes
    if (isLoaded) {
      localStorage.setItem('woc_class_cart', JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  const addToCart = (groupId: string, groupName: string, item: CartItem) => {
    setCart((prev) => {
      // If cart is empty, we can add it and set the group
      if (prev.items.length === 0) {
        toast.success(`Added to cart.`);
        return { groupId, groupName, items: [item] };
      }

      // If cart has items, check if the group matches
      if (prev.groupId !== groupId) {
        if (window.confirm("You can only add classes from the same group. Clear the current cart and add this item?")) {
          toast.success(`Added to cart.`);
          return { groupId, groupName, items: [item] };
        }
        return prev;
      }

      // Group matches, check if item already exists
      if (prev.items.some(i => i.itemId === item.itemId)) {
        toast.info("This item is already in your cart.");
        return prev;
      }

      toast.success(`Added to cart.`);
      return { ...prev, items: [...prev.items, item] };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const newItems = prev.items.filter(i => i.itemId !== itemId);
      if (newItems.length === 0) {
        return { groupId: null, groupName: null, items: [] };
      }
      return { ...prev, items: newItems };
    });
  };

  const clearCart = () => {
    setCart({ groupId: null, groupName: null, items: [] });
  };

  const totalPrice = cart.items.reduce((sum, item) => sum + item.price, 0);
  const currency = cart.items.length > 0 ? cart.items[0].currency : 'KRW';

  return (
    <ClassCartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, totalPrice, currency }}>
      {children}
    </ClassCartContext.Provider>
  );
};

export const useClassCart = () => {
  const context = useContext(ClassCartContext);
  if (context === undefined) {
    throw new Error('useClassCart must be used within a ClassCartProvider');
  }
  return context;
};
