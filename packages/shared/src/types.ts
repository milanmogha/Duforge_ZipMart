/**
 * Domain types shared by the ZipMart clients.
 *
 * These mirror the Mongoose schemas in `apps/backend/models`. When a schema
 * changes, change it here too — the four web apps read these definitions.
 */

/** Mongo ObjectId as serialised over JSON. */
export type ObjectId = string;

/** A reference field is either the raw id or the populated document. */
export type Ref<T> = ObjectId | T;

// ---------------------------------------------------------------------------
// Enums — keep in sync with the `enum` arrays in the Mongoose schemas
// ---------------------------------------------------------------------------

export const DELIVERY_STATUSES = [
  "Pending",
  "Accepted",
  "InTransit",
  "Delivered",
  "Cancelled",
  "Rejected",
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const PAYMENT_METHODS = ["Cash On Delivery", "Razorpay"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["Pending", "Paid", "Failed"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export interface Coordinates {
  latitude: number | null;
  longitude: number | null;
}

export interface Product {
  _id: ObjectId;
  name: string;
  category: string;
  price: number;
  stock: number;
  /** Percentage off, 0 when none. */
  discount: number;
  details?: string;
  images?: string[];
  shopkeeperId?: Ref<Shop>;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  product: Ref<Product>;
  quantity: number;
  /** Unit price captured at checkout time, not the live product price. */
  price: number;
}

export interface Order {
  _id: ObjectId;
  customer: Ref<User>;
  customerName: string;
  customerPhone: string;
  deliveryCoords: Coordinates;
  deliveryBoyLocation: Coordinates;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryAddress: string;
  shopId: Ref<Shop>;
  shopName: string;
  orderDate: string;
  couponCode: string | null;
  deliveryStatus: DeliveryStatus;
  deliveryBoy: Ref<DeliveryBoy> | null;
  deliveryBoyEarning: number;
  platformFee: number;
  deliveryFee: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  _id: ObjectId;
  name: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Shop {
  _id: ObjectId;
  name?: string;
  shopName?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeliveryBoy {
  _id: ObjectId;
  name?: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// API envelopes
// ---------------------------------------------------------------------------

export interface ApiError {
  message: string;
  error?: string;
}
