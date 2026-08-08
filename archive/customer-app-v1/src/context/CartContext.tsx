import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --------------------------------------------------------
// Interfaces
// --------------------------------------------------------
interface CartProduct {
  _id: string;
  name: string;
  category: string;
  images?: {
    image1?: {
      data: string;
      contentType: string;
    };
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

// Context Interface
interface CartContextType {
  cartItems: CartItem[];
  totalDiscountedPrice: number;
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
  const [state, dispatch] = useReducer(cartReducer, {
    cartItems: [],
    totalDiscountedPrice: 0,
  });

  // Fetch cart from AsyncStorage
  const fetchCart = async () => {
    try {
      const storedCart = await AsyncStorage.getItem("cart");
      if (storedCart) {
        const parsedCart: CartState = JSON.parse(storedCart);

        // Recalculate total price
        const totalDiscountedPrice = parsedCart.cartItems.reduce((total, item) => {
          const discountedPrice =
            item.product.price - (item.product.price * (item.product.discount || 0)) / 100;
          return total + discountedPrice * item.quantity;
        }, 0);

        dispatch({
          type: "SET_CART",
          payload: { cartItems: parsedCart.cartItems, totalDiscountedPrice },
        });
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  // Add item to cart
  const addToCart = async (product: CartProduct, quantity: number) => {
    try {
      const newCartItems = [...state.cartItems];
      const existingIndex = newCartItems.findIndex((item) => item.product._id === product._id);

      if (existingIndex !== -1) {
        newCartItems[existingIndex].quantity += quantity;
      } else {
        newCartItems.push({ product, quantity });
      }

      const totalDiscountedPrice = newCartItems.reduce((total, item) => {
        const discountedPrice =
          item.product.price - (item.product.price * (item.product.discount || 0)) / 100;
        return total + discountedPrice * item.quantity;
      }, 0);

      const newCart = { cartItems: newCartItems, totalDiscountedPrice };

      await AsyncStorage.setItem("cart", JSON.stringify(newCart));
      dispatch({ type: "SET_CART", payload: newCart });
    } catch (error) {
      console.error("Error adding item to cart:", error);
    }
  };

  // Update item quantity
  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      const updatedCartItems = state.cartItems.map((item) =>
        item.product._id === productId ? { ...item, quantity } : item
      );

      const totalDiscountedPrice = updatedCartItems.reduce((total, item) => {
        const discountedPrice =
          item.product.price - (item.product.price * (item.product.discount || 0)) / 100;
        return total + discountedPrice * item.quantity;
      }, 0);

      const updatedCart = { cartItems: updatedCartItems, totalDiscountedPrice };

      await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));
      dispatch({ type: "SET_CART", payload: updatedCart });
    } catch (error) {
      console.error("Error updating cart quantity:", error);
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId: string) => {
    try {
      const updatedCartItems = state.cartItems.filter((item) => item.product._id !== productId);

      const totalDiscountedPrice = updatedCartItems.reduce((total, item) => {
        const discountedPrice =
          item.product.price - (item.product.price * (item.product.discount || 0)) / 100;
        return total + discountedPrice * item.quantity;
      }, 0);

      const updatedCart = { cartItems: updatedCartItems, totalDiscountedPrice };

      await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));
      dispatch({ type: "SET_CART", payload: updatedCart });
    } catch (error) {
      console.error("Error removing item from cart:", error);
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      await AsyncStorage.removeItem("cart");
      dispatch({ type: "CLEAR_CART" });
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartItems: state.cartItems,
        totalDiscountedPrice: state.totalDiscountedPrice,
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
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
