// src/context/CartContext.tsx
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import {
  getCart,
  addToCart as apiAddToCart,
  removeFromCart as apiRemoveFromCart,
  clearCart as apiClearCart,
  updateCartQuantity as apiUpdateCartQuantity,
} from "../api";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext";

// --------------------------------------------------------
// Interfaces
// --------------------------------------------------------
interface CartProductImage {
  data: string;
  contentType: string;
}

export interface CartProduct {
  shopkeeperId: any;  // now always present after normalization
  _id: string;
  name: string;
  category: string;
  images: {
    image1: CartProductImage;
  };
  price: number;
  discount?: number;
}

interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface CartState {
  cartItems: CartItem[];
  totalDiscountedPrice: number;
}

type CartAction =
  | { type: "SET_CART"; payload: CartState }
  | { type: "CLEAR_CART" };

// Expose fetchCartItems so components can manually refresh
interface CartContextType {
  cartItems: CartItem[];
  totalDiscountedPrice: number;
  fetchCartItems: () => Promise<void>;
  addToCart: (product: CartProduct, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

// --------------------------------------------------------
// Reducer
// --------------------------------------------------------
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "SET_CART":
      return action.payload;
    case "CLEAR_CART":
      return { cartItems: [], totalDiscountedPrice: 0 };
    default:
      return state;
  }
};

// --------------------------------------------------------
// Context & Provider
// --------------------------------------------------------
const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { authToken } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, {
    cartItems: [],
    totalDiscountedPrice: 0,
  });

  // Helper to normalize API items into CartItem[]
  const normalizeItems = (rawItems: any[]): CartItem[] =>
    rawItems.map((item) => ({
      product: {
        ...item.product,
        shopkeeperId: (item.product as any).shopkeeperId ?? null,
      },
      quantity: item.quantity,
    }));

  // Fetch current cart from server and update state
  const fetchCartItems = async () => {
    try {
      if (!authToken) return;
      const cart = await getCart();
      const items = normalizeItems(cart.items);
      const total = items.reduce((sum, itm) => {
        const price = itm.product.price;
        const disc = itm.product.discount || 0;
        const discounted = price - (price * disc) / 100;
        return sum + discounted * itm.quantity;
      }, 0);
      dispatch({ type: "SET_CART", payload: { cartItems: items, totalDiscountedPrice: total } });
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast.error("Failed to load cart.");
    }
  };

  const addToCart = async (product: CartProduct, quantity: number) => {
    try {
      if (!authToken) throw new Error("User not authenticated");
      await apiAddToCart(product._id, quantity);
      toast.success("Item added to cart.");
      await fetchCartItems();
    } catch (error) {
      console.error("Error adding item to cart:", error);
      toast.error("Failed to add item to cart.");
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      if (!authToken) throw new Error("User not authenticated");
      await apiUpdateCartQuantity(productId, quantity);
      await fetchCartItems();
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update cart.");
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      if (!authToken) throw new Error("User not authenticated");
      await apiRemoveFromCart(productId);
      await fetchCartItems();
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item from cart.");
    }
  };

  const clearCart = async () => {
    try {
      if (!authToken) throw new Error("User not authenticated");
      await apiClearCart();
      dispatch({ type: "CLEAR_CART" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("Failed to clear cart.");
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, [authToken]);

  return (
    <CartContext.Provider
      value={{
        cartItems: state.cartItems,
        totalDiscountedPrice: state.totalDiscountedPrice,
        fetchCartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// --------------------------------------------------------
// Hook
// --------------------------------------------------------
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
