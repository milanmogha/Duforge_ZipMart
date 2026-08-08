import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { discountedPrice } from "@/lib/format";

export type CartProduct = {
  _id: string;
  name: string;
  category?: string;
  images?: any;
  price: number;
  discount?: number;
  shopkeeperId?: string;
};

export type CartItem = { product: CartProduct; quantity: number };

type State = { items: CartItem[]; total: number };

type Action =
  | { type: "SET"; items: CartItem[] }
  | { type: "ADD"; product: CartProduct; quantity: number }
  | { type: "QTY"; id: string; quantity: number }
  | { type: "REMOVE"; id: string }
  | { type: "CLEAR" };

const computeTotal = (items: CartItem[]) =>
  items.reduce(
    (sum, i) =>
      sum + discountedPrice(i.product.price, i.product.discount) * i.quantity,
    0
  );

const reducer = (state: State, action: Action): State => {
  let items: CartItem[];
  switch (action.type) {
    case "SET":
      items = action.items;
      break;
    case "ADD": {
      const existing = state.items.find(
        (i) => i.product._id === action.product._id
      );
      items = existing
        ? state.items.map((i) =>
            i.product._id === action.product._id
              ? { ...i, quantity: i.quantity + action.quantity }
              : i
          )
        : [...state.items, { product: action.product, quantity: action.quantity }];
      break;
    }
    case "QTY":
      items = state.items
        .map((i) =>
          i.product._id === action.id ? { ...i, quantity: action.quantity } : i
        )
        .filter((i) => i.quantity > 0);
      break;
    case "REMOVE":
      items = state.items.filter((i) => i.product._id !== action.id);
      break;
    case "CLEAR":
      items = [];
      break;
    default:
      return state;
  }
  return { items, total: computeTotal(items) };
};

type CartContextValue = {
  items: CartItem[];
  total: number;
  count: number;
  addToCart: (product: CartProduct, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  qtyOf: (id: string) => number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, { items: [], total: 0 });

  // Load once on mount.
  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem("cart");
      if (raw) dispatch({ type: "SET", items: JSON.parse(raw) });
    })();
  }, []);

  // Persist on every change.
  useEffect(() => {
    AsyncStorage.setItem("cart", JSON.stringify(state.items));
  }, [state.items]);

  const value: CartContextValue = {
    items: state.items,
    total: state.total,
    count: state.items.reduce((n, i) => n + i.quantity, 0),
    addToCart: (product, quantity = 1) =>
      dispatch({ type: "ADD", product, quantity }),
    updateQuantity: (id, quantity) => dispatch({ type: "QTY", id, quantity }),
    removeFromCart: (id) => dispatch({ type: "REMOVE", id }),
    clearCart: () => dispatch({ type: "CLEAR" }),
    qtyOf: (id) => state.items.find((i) => i.product._id === id)?.quantity ?? 0,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
