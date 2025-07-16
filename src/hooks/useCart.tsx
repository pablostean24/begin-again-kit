
import { createContext, useContext, useState, useEffect } from 'react';
import type { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';

type MenuItem = Tables<'menu_items'>;

interface CartItem extends MenuItem {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user } = useAuth();

  // Generate unique cart key for each user
  const getCartKey = () => {
    if (user) {
      return `bitebright-cart-${user.id}`;
    }
    return 'bitebright-cart-guest';
  };

  // Load cart from localStorage when user changes
  useEffect(() => {
    const cartKey = getCartKey();
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
        setItems([]);
      }
    } else {
      setItems([]);
    }
  }, [user]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    const cartKey = getCartKey();
    localStorage.setItem(cartKey, JSON.stringify(items));
  }, [items, user]);

  // Clear guest cart when user logs in
  useEffect(() => {
    if (user) {
      // Remove guest cart when user logs in
      localStorage.removeItem('bitebright-cart-guest');
    }
  }, [user]);

  const addItem = (item: MenuItem) => {
    console.log('useCart - Adding item to cart:', {
      itemId: item.id,
      itemName: item.name,
      itemPrice: item.price,
      currentCartItems: items.length
    });
    
    setItems(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        console.log('useCart - Item already exists, updating quantity');
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      
      console.log('useCart - Adding new item to cart');
      const newItems = [...prev, { ...item, quantity: 1 }];
      console.log('useCart - Updated cart items:', newItems);
      return newItems;
    });
  };

  const removeItem = (itemId: string) => {
    console.log('useCart - Removing item:', itemId);
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    console.log('useCart - Updating quantity:', { itemId, quantity });
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    console.log('useCart - Clearing cart');
    setItems([]);
  };

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce((total, item) => {
    console.log('useCart - Calculating price for item:', {
      itemName: item.name,
      itemPrice: item.price,
      quantity: item.quantity,
      itemTotal: item.price * item.quantity
    });
    return total + (item.price * item.quantity);
  }, 0);

  console.log('useCart - Current cart state:', {
    totalItems,
    totalPrice,
    items: items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }))
  });

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
