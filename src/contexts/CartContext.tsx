import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  subItems?: string[];
  originalId?: number | string;
  selectedSize?: string;
}

interface CartContextType {
  items: CartItem[];
  branchId: number | null;
  orderType: 'delivery' | 'pickup' | 'dine_in' | null;
  tableNumber: string | null;
  setBranchId: (id: number | null) => void;
  setOrderType: (type: 'delivery' | 'pickup' | 'dine_in' | null) => void;
  setTableNumber: (num: string | null) => void;
  addItem: (item: CartItem) => void;
  addOffer: (offer: any) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [branchId, setBranchId] = useState<number | null>(() => {
    const saved = localStorage.getItem('selectedBranchId');
    return saved ? Number(saved) : null;
  });

  const [orderType, setOrderType] = useState<'delivery' | 'pickup' | 'dine_in' | null>(() => {
    return localStorage.getItem('orderType') as any || null;
  });

  const [tableNumber, setTableNumber] = useState<string | null>(() => {
    return localStorage.getItem('tableNumber') || null;
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (branchId) {
      localStorage.setItem('selectedBranchId', branchId.toString());
    } else {
      localStorage.removeItem('selectedBranchId');
    }
  }, [branchId]);

  useEffect(() => {
    if (orderType) localStorage.setItem('orderType', orderType);
    else localStorage.removeItem('orderType');
  }, [orderType]);

  useEffect(() => {
    if (tableNumber) localStorage.setItem('tableNumber', tableNumber);
    else localStorage.removeItem('tableNumber');
  }, [tableNumber]);

  const addItem = (newItem: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => String(i.id) === String(newItem.id));
      if (existing) {
        return prev.map(i => String(i.id) === String(newItem.id) ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, newItem];
    });
  };

  const addOffer = (offer: any) => {
    addItem({
      id: `offer_${offer.id}`,
      name: offer.title,
      price: Number(offer.price),
      quantity: 1,
      imageUrl: offer.imageUrl,
      subItems: offer.productNames || []
    });
  };

  const removeItem = (id: string | number) => {
    setItems(prev => prev.filter(i => String(i.id) !== String(id)));
  };

  const updateQuantity = (id: string | number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev => prev.map(i => String(i.id) === String(id) ? { ...i, quantity } : i));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      items, 
      branchId, 
      setBranchId, 
      orderType, 
      setOrderType, 
      tableNumber, 
      setTableNumber, 
      addItem, 
      addOffer, 
      removeItem, 
      updateQuantity, 
      clearCart, 
      total 
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
