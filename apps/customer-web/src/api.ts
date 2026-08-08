import axios from "axios";
import { API_BASE_URL } from "@zipmart/shared";

// Define local type aliases for Axios types
type AxiosInstance = ReturnType<typeof axios.create>;
type AxiosRequestConfig = any;
type AxiosResponse<T = any> = {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: AxiosRequestConfig;
  request?: any;
};
type AxiosError = any;

// ---------------------------------------------------------------------
// User Interfaces
// ---------------------------------------------------------------------
export interface UserRegistrationData {
  name: string;
  email: string;
  password: string;
}

export interface UserLoginData {
  email?: string;
  password?: string;
  token?: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;   
  phone?: string;   
  role: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    role: string;
  };
}

// ---------------------------------------------------------------------
// Rating Interfaces
// ---------------------------------------------------------------------
export interface RatingData {
  orderId: string;
  rating: number;
  comment: string;
}

export interface RatingResponse {
  message: string;
}

// ---------------------------------------------------------------------
// Cart Interfaces
// ---------------------------------------------------------------------
export interface CartProductImage {
  data: string;
  contentType: string;
}

export interface CartProduct {
  _id: string;
  name: string;
  category: string;
  images: {
    image1: CartProductImage;
  };
  price: number;
  discount?: number;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

export interface CartResponse {
  user: string;
  items: CartItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------
// Razorpay Interfaces
// ---------------------------------------------------------------------
export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id: string | null;
  status: string;
  attempts: number;
  created_at: number;
}

export interface RazorpayPaymentVerificationData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount: number;
}

export interface PaymentVerificationResponse {
  message: string;
  payment: Payment;
}

export interface Payment {
  _id: string;
  orderId: string | null;
  paymentMethod: string;
  status: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------
// Order Interfaces
// ---------------------------------------------------------------------
export interface OrderItem {
  product: string;
  quantity: number;
  price: number;
}

export interface DeliveryCoords {
  latitude: number;
  longitude: number;
}

/**
 * UPDATED: We add `discountAmount` and `finalAmount` so the front-end
 * can pass these values to the server safely.
 */
export interface OrderData {
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod: string;
  couponCode?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryCoords?: DeliveryCoords;
  platformFee?: number;
  deliveryFee?: number;
  discountAmount?: number; // new
  finalAmount?: number; // new
}

export interface Order {
  _id: string;
  customer: string;
  customerName?: string;
  customerPhone?: string;
  deliveryCoords?: DeliveryCoords;
  deliveryStatus?: string;
  invoiceAvailable?: boolean;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  deliveryAddress: string;
  orderStatus: string;
  orderDate: string;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MultipleOrdersResponse {
  message: string;
  orders: Order[];
}

export interface OrderResponse {
  message: string;
  order: Order;
}

export interface OtpResponse {
  message: string;
  verified?: boolean;
}

// ---------------------------------------------------------------------
// Create an Axios instance with the base URL
// ---------------------------------------------------------------------
const API: AxiosInstance = axios.create({
  baseURL: API_BASE_URL, // Replace with your backend URL
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------------------------------------------------------------------
// Request interceptor to add token if available
// ---------------------------------------------------------------------
API.interceptors.request.use(
  (config: AxiosRequestConfig): AxiosRequestConfig => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ---------------------------------------------------------------------
// Response interceptor
// ---------------------------------------------------------------------
API.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error.response?.data || { message: error.message });
  }
);

// ---------------------------------------------------------------------
// Passwordless Email OTP Login
// ---------------------------------------------------------------------

/** Ask the backend to email a 6-digit login code. */
export const sendLoginOtp = async (
  email: string
): Promise<{ message: string }> => {
  try {
    const response = await API.post<{ message: string }>(
      "/users/otp/login/send",
      { email }
    );
    return response.data;
  } catch (error: any) {
    console.error("Send login OTP error:", error);
    // The response interceptor already unwrapped this to the payload
    throw { message: error?.message || "Failed to send OTP." };
  }
};

/** Exchange the emailed code for a JWT. Registers the user on first sign-in. */
export const verifyLoginOtp = async (
  email: string,
  otp: string
): Promise<AuthResponse> => {
  try {
    const response = await API.post<AuthResponse>("/users/otp/login/verify", {
      email,
      otp,
    });
    return response.data;
  } catch (error: any) {
    console.error("Verify login OTP error:", error);
    throw { message: error?.message || "Failed to verify OTP." };
  }
};

// ---------------------------------------------------------------------
// New: Get User Details API
// ---------------------------------------------------------------------
export const getUserDetails = async (): Promise<User> => {
  try {
    const response = await API.get<{ user: User }>("/users/me");
    return response.data.user;
  } catch (error: any) {
    console.error(
      "Error fetching user details:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Failed to fetch user details." };
  }
};

// ---------------------------------------------------------------------
// Invoice APIs
// ---------------------------------------------------------------------
export const generateInvoice = async (orderId: string): Promise<any> => {
  try {
    const response = await API.post<any>(`/invoices/generate/${orderId}`);
    return response.data;
  } catch (error: any) {
    console.error(
      "Error generating invoice:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Failed to generate invoice" };
  }
};

export const downloadInvoice = async (orderId: string): Promise<void> => {
  try {
    const response = await API.get<Blob>(`/invoices/download/${orderId}`, {
      responseType: "blob" as any,
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoice_${orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Failed to download invoice:", error);
    throw error;
  }
};

// ---------------------------------------------------------------------
// Cart APIs
// ---------------------------------------------------------------------
export const getCart = async (): Promise<CartResponse> => {
  try {
    const response = await API.get<CartResponse>("/cart");
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to fetch cart" };
  }
};

export const addToCart = async (
  productId: string,
  quantity: number
): Promise<CartResponse> => {
  try {
    const response = await API.post<CartResponse>("/cart/add", {
      productId,
      quantity,
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to add to cart" };
  }
};

export const removeFromCart = async (
  productId: string
): Promise<{ message: string; cart: CartResponse }> => {
  try {
    const response = await API.post<{ message: string; cart: CartResponse }>(
      "/cart/remove",
      { productId }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to remove from cart" };
  }
};

export const updateCart = async (
  productId: string,
  quantity: number
): Promise<CartResponse> => {
  try {
    const response = await API.put<CartResponse>("/cart/update", {
      productId,
      quantity,
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to update cart" };
  }
};

export const clearCart = async (): Promise<{ message: string }> => {
  try {
    const response = await API.delete<{ message: string }>("/cart/clear");
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to clear cart" };
  }
};

export const updateCartQuantity = async (
  productId: string,
  quantity: number
): Promise<CartResponse> => {
  try {
    const response = await API.put<CartResponse>("/cart/update", {
      productId,
      quantity,
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to update cart quantity" };
  }
};

// ---------------------------------------------------------------------
// Razorpay Payment APIs
// ---------------------------------------------------------------------
export const createRazorpayOrder = async (
  amount: number
): Promise<RazorpayOrderResponse> => {
  if (amount <= 0) {
    throw new Error(
      "Invalid amount. Please ensure the amount is greater than 0."
    );
  }
  try {
    // Backend converts rupees to paise
    const response = await API.post<RazorpayOrderResponse>(
      "/payments/create-order",
      { amount }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Error creating Razorpay order:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message || "Failed to create Razorpay order"
    );
  }
};

export const verifyPayment = async (data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount: number;
}): Promise<any> => {
  if (
    !data.razorpay_order_id ||
    !data.razorpay_payment_id ||
    !data.razorpay_signature
  ) {
    throw new Error("Missing payment verification details.");
  }
  try {
    const response = await API.post("/payments/verify", data);
    return response.data;
  } catch (error: any) {
    console.error(
      "Error verifying payment:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message || "Failed to verify payment"
    );
  }
};

// ---------------------------------------------------------------------
// Product APIs
// ---------------------------------------------------------------------
export const getProductById = async (id: string): Promise<any> => {
  try {
    const response = await API.get<any>(`/products/${id}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to fetch product";
  }
};

export const getProductsByLocation = async (
  latitude: number,
  longitude: number
): Promise<any[]> => {
  try {
    const response = await API.get<any[]>(
      `/products/location?latitude=${latitude}&longitude=${longitude}`
    );
    return response.data;
  } catch (error: any) {
    throw (
      error.response?.data?.message || "Failed to fetch products by location"
    );
  }
};

export const getAllProducts = async (): Promise<any[]> => {
  try {
    const response = await API.get<any[]>("/products/all");
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to fetch products";
  }
};

export const getProductsByShopkeeper = async (
  shopkeeperId: string
): Promise<any[]> => {
  try {
    const response = await API.get<any[]>(`/products/shop/${shopkeeperId}`);
    return response.data;
  } catch (error: any) {
    throw (
      error.response?.data?.message || "Failed to fetch shopkeeper's products"
    );
  }
};

export const getProductsByCategory = async (
  category: string
): Promise<any[]> => {
  try {
    const response = await API.get<any[]>(`/products/category/${category}`);
    return response.data;
  } catch (error: any) {
    throw (
      error.response?.data?.message || "Failed to fetch products by category"
    );
  }
};

// ---------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------
export const createOrder = async (
  orderData: OrderData
): Promise<MultipleOrdersResponse> => {
  try {
    // orderData now includes discountAmount & finalAmount if applicable
    const response = await API.post<MultipleOrdersResponse>(
      "/orders/create",
      orderData
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Error creating order:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Failed to create order" };
  }
};

export const getCustomerOrders = async (): Promise<Order[]> => {
  try {
    const response = await API.get<Order[]>("/orders/customer");
    return response.data;
  } catch (error: any) {
    throw (
      error.response?.data || { message: "Failed to fetch customer orders" }
    );
  }
};

export const getOrderById = async (orderId: string): Promise<Order> => {
  try {
    const response = await API.get<Order>(`/orders/${orderId}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to fetch order details" };
  }
};

export const cancelOrderAPI = async (orderId: string): Promise<Order> => {
  try {
    const response = await API.patch<Order>(`/orders/${orderId}/cancel`);
    return response.data;
  } catch (error: any) {
    console.error("API Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Failed to cancel order" };
  }
};

export const updateOrderAPI = async (
  orderId: string,
  updateData: Partial<OrderData>
): Promise<Order> => {
  try {
    const response = await API.patch<Order>(`/orders/${orderId}`, updateData);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to update order" };
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status: string
): Promise<Order> => {
  try {
    const response = await API.patch<Order>(`/orders/${orderId}/status`, {
      deliveryStatus: status,
    });
    if (status === "Delivered") {
      await generateInvoice(orderId);
    }
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to update order status" };
  }
};

// ---------------------------------------------------------------------
// Banner APIs
// ---------------------------------------------------------------------
export const fetchBanners = async (): Promise<any[]> => {
  try {
    const response = await API.get<any[]>("/banners");
    return response.data;
  } catch (error: any) {
    console.error(
      "Error fetching banners:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Failed to fetch banners" };
  }
};

// ---------------------------------------------------------------------
// Rating APIs
// ---------------------------------------------------------------------
export const submitRatingAPI = async (
  ratingData: RatingData
): Promise<RatingResponse> => {
  try {
    const response = await API.post<RatingResponse>(
      "ratings/submit",
      ratingData,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to Submit rating" };
  }
};

export const getRatingsByProductId = async (
  productId: string
): Promise<any[]> => {
  try {
    const response = await API.get<any[]>(`/ratings/product/${productId}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to fetch ratings";
  }
};

// ---------------------------------------------------------------------
// Shop APIs
// ---------------------------------------------------------------------
export const getShopById = async (id: string): Promise<any> => {
  try {
    const response = await API.get<any>(`/shop/${id}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to fetch shop details";
  }
};

// ---------------------------------------------------------------------
// Apply Coupon API
// ---------------------------------------------------------------------
export const applyCoupon = async (couponCode: string, totalAmount: number) => {
  try {
    const response = await API.post("/coupons/apply", {
      code: couponCode,
      totalAmount,
    });
    return response.data;
  } catch (error: any) {
    console.error(
      "Error applying coupon:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Update Delivery Boy's Live Location
 */
export const updateDeliveryBoyLocation = async (
  orderId: string,
  latitude: number,
  longitude: number
): Promise<any> => {
  try {
    const response = await API.patch(`/orders/${orderId}/location`, {
      latitude,
      longitude,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error updating delivery boy location:", error);
    throw error.response?.data || { message: "Failed to update location" };
  }
};

// ---------------------------------------------------------------------
// Banner2 APIs
// ---------------------------------------------------------------------
export const fetchBanner2 = async (): Promise<any[]> => {
  try {
    const response = await API.get<any[]>("/banner2");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching banner2s:", error);
    throw error;
  }
};

// ---------------------------------------------------------------------
// Banner3 APIs
// ---------------------------------------------------------------------
export const fetchBanner3 = async (): Promise<any[]> => {
  try {
    const response = await API.get<any[]>("/banner3");
    return response.data;
  } catch (error: any) {
    console.error(
      "Error fetching banner3:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Failed to fetch banner3" };
  }
};

// ---------------------------------------------------------------------
// Distance Calculation using Directions API
// ---------------------------------------------------------------------
const GOOGLE_MAPS_API_KEY = "AIzaSyBsN_Z9IAY3R9zacVCc8SUEFugDEMxc3wA";

/**
 * Calculates the driving distance (in kilometers) between two points via the
 * Google Directions API.
 * For browser-based requests, we prepend a public CORS proxy.
 * In production, consider implementing this call server-side.
 */
export const getDrivingDistanceInKm = async (
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<number> => {
  try {
    // Use an alternative public proxy (or run your own)
    const CORS_PROXY = "https://thingproxy.freeboard.io/fetch/"; // Change as needed.
    const url = `${CORS_PROXY}https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&key=${GOOGLE_MAPS_API_KEY}`;
    // Provide a generic type (any) so TypeScript allows accessing 'routes'
    const response = await axios.get<any>(url);
    if (
      response.data &&
      response.data.routes &&
      response.data.routes.length > 0
    ) {
      const route = response.data.routes[0];
      const leg = route.legs[0];
      const distanceInMeters = leg.distance.value;
      return distanceInMeters / 1000;
    } else {
      console.warn("No routes found by Directions API.");
      return 0;
    }
  } catch (error: any) {
    console.error("Error fetching driving distance:", error);
    return 0;
  }
};

export default API;
