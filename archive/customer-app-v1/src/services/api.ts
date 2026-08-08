import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import type { AxiosInstance } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  token?: string; // For Google token
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
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
    // Add other images if necessary
  };
  price: number;
  discount?: number;
  // Replace or add any relevant shop ID field here if needed
  // e.g. shop: string;
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
  id: string;           // Unique Razorpay order ID
  amount: number;       // Amount in the smallest unit (e.g., paise)
  paymentUrl?: string;
}

export interface RazorpayPaymentVerificationData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount: number;
}

export interface PaymentVerificationResponse {
  message: string;
  payment: {
    _id: string;
    orderId: string;
    paymentMethod: string;
    status: string;
    amount: number;
    createdAt: string;
    updatedAt: string;
  };
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

export interface OrderData {
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod: string;
  couponCode?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryCoords?: DeliveryCoords;
  // Add platformFee or deliveryFee if you’d like to store them:
  platformFee?: number;
  deliveryFee?: number;
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

// OTP response
export interface OtpResponse {
  message: string;
  verified?: boolean;
}

// ---------------------------------------------------------------------
// Create an Axios instance with the base URL
// ---------------------------------------------------------------------
const API: AxiosInstance = axios.create({
  baseURL: "http://10.0.2.2:8000/api", // Replace with actual backend URL
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem("authToken");
    config.headers = config.headers ?? {};
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

API.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error.response?.data || { message: error.message });
  }
);


// ---------------------------------------------------------------------
// User Authentication APIs
// ---------------------------------------------------------------------
export const registerUser = async (
  userData: UserRegistrationData
): Promise<void> => {
  try {
    await API.post("/users/register", userData);
  } catch (error: any) {
    console.error("Registration Error:", error.response?.data || error.message);
    throw error.response?.data || error.message || "Error during registration.";
  }
};

export const loginUser = async (
  credentials: UserLoginData
): Promise<AuthResponse> => {
  try {
    const response = await API.post<AuthResponse>("/users/login", credentials);
    return response.data;
  } catch (error: any) {
    console.error("Login Error:", error.response?.data || error.message);
    throw error.response?.data || error.message || "Error during login.";
  }
};

export const loginWithGoogle = async (
  idToken: string
): Promise<AuthResponse> => {
  try {
    const response = await API.post("/users/google-login", { idToken });
    return response.data;
  } catch (error: any) {
    console.error("Google Login Error:", error.response?.data || error.message);
    throw error.response?.data || error.message || "Error during Google login.";
  }
};

export const sendOtp = async (email: string): Promise<string> => {
  try {
    const response = await API.post("/users/otp/send", { email });
    return response.data.message;
  } catch (error: any) {
    console.error("Send OTP Error:", error.response?.data || error.message);
    throw (
      error.response?.data?.message || error.message || "Error sending OTP."
    );
  }
};

export const verifyOtp = async (
  email: string,
  otp: string
): Promise<boolean> => {
  try {
    await API.post("/users/otp/verify", { email, otp });
    return true;
  } catch (error: any) {
    console.error("Verify OTP Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Error verifying OTP.");
  }
};

export const sendForgotPasswordOtp = async (email: string): Promise<void> => {
  try {
    await API.post("/users/forgot-password/otp/send", { email });
  } catch (error: any) {
    console.error(
      "Error sending forgot password OTP:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Failed to send OTP." };
  }
};

export const resetPassword = async (data: {
  email: string;
  otp: string;
  newPassword: string;
}): Promise<void> => {
  try {
    await API.post("/users/forgot-password/reset", data);
  } catch (error: any) {
    console.error(
      "Error resetting password:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Failed to reset password." };
  }
};

// ---------------------------------------------------------------------
// Cart APIs
// ---------------------------------------------------------------------
export const getCart = async (): Promise<CartResponse> => {
  try {
    const response: AxiosResponse<CartResponse> = await API.get("/cart");
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
    const response: AxiosResponse<CartResponse> = await API.post("/cart/add", {
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
    const response: AxiosResponse<{ message: string; cart: CartResponse }> =
      await API.post("/cart/remove", { productId });
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
    const response: AxiosResponse<CartResponse> = await API.put(
      "/cart/update",
      {
        productId,
        quantity,
      }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to update cart" };
  }
};

export const clearCart = async (): Promise<{ message: string }> => {
  try {
    const response: AxiosResponse<{ message: string }> = await API.delete(
      "/cart/clear"
    );
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
    const response: AxiosResponse<CartResponse> = await API.put(
      "/cart/update",
      {
        productId,
        quantity,
      }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to update cart quantity" };
  }
};

// ---------------------------------------------------------------------
// Razorpay Payment APIs
// ---------------------------------------------------------------------
export const createNativeRazorpayOrder = async (
  amount: number
): Promise<RazorpayOrderResponse> => {
  if (amount <= 0) {
    throw new Error("Invalid amount. Please ensure the amount is greater than 0.");
  }
  try {
    const response: AxiosResponse<RazorpayOrderResponse> = await API.post(
      "/payments/native/create-order",
      { amount }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Error creating native Razorpay order:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message || "Failed to create native Razorpay order"
    );
  }
};

export const verifyPayment = async (
  data: RazorpayPaymentVerificationData
): Promise<PaymentVerificationResponse> => {
  if (
    !data.razorpay_order_id ||
    !data.razorpay_payment_id ||
    !data.razorpay_signature
  ) {
    throw new Error("Missing payment verification details.");
  }

  try {
    const response: AxiosResponse<PaymentVerificationResponse> = await API.post(
      "/payments/verify",
      data
    );
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
export const getProductById = async (id: string): Promise<any | null> => {
  try {
    const response = await API.get(`/products/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching product:", error.message);
    if (!error.response) {
      console.error("Network error. Check API URL or internet connection.");
      return null;
    }
    return error.response?.data?.message || "Failed to fetch product";
  }
};

export const getProductsByLocation = async (
  latitude: number,
  longitude: number
): Promise<any[]> => {
  try {
    const response = await API.get(
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
    const response = await API.get("/products/all");
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to fetch products";
  }
};

export const getProductsByShopkeeper = async (
  shopkeeperId: string
): Promise<any[]> => {
  try {
    const response = await API.get(`/products/shop/${shopkeeperId}`);
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
    const response = await API.get(`/products/category/${category}`);
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
    const response: AxiosResponse<MultipleOrdersResponse> = await API.post(
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
    const response: AxiosResponse<Order[]> = await API.get("/orders/customer");
    return response.data;
  } catch (error: any) {
    throw (
      error.response?.data || { message: "Failed to fetch customer orders" }
    );
  }
};

export const getOrderById = async (orderId: string): Promise<Order> => {
  try {
    const response: AxiosResponse<Order> = await API.get(`/orders/${orderId}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to fetch order details" };
  }
};

export const cancelOrderAPI = async (orderId: string): Promise<Order> => {
  try {
    const response: AxiosResponse<Order> = await API.patch(
      `/orders/${orderId}/cancel`
    );
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
    const response: AxiosResponse<Order> = await API.patch(
      `/orders/${orderId}`,
      updateData
    );
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
    const response: AxiosResponse<Order> = await API.patch(
      `/orders/${orderId}/status`,
      {
        deliveryStatus: status,
      }
    );
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
    const response = await API.get("/banners");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching banners:", error);
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
    const response: AxiosResponse<RatingResponse> = await API.post(
      "/ratings/submit",
      ratingData
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to submit rating" };
  }
};

export const getRatingsByProductId = async (
  productId: string
): Promise<any[]> => {
  try {
    const response = await API.get(`/ratings/product/${productId}`);
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
    const response = await API.get(`/shop/${id}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to fetch shop details";
  }
};

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

/**
 * Generates an invoice on the server for the given order.
 * @param orderId - The ID of the order.
 * @returns The generated invoice object.
 */
export const generateInvoice = async (orderId: string): Promise<any> => {
  try {
    const response: AxiosResponse<any> = await API.post(
      `/invoices/generate/${orderId}`
    );
    // The backend response returns { message, invoice }
    return response.data.invoice;
  } catch (error: any) {
    console.error(
      "Error generating invoice:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Failed to generate invoice" };
  }
};

/**
 * Returns the download URL for the invoice PDF.
 * (In a mobile app you can open the URL via Linking)
 * @param orderId - The ID of the order.
 * @returns A URL string for downloading the invoice.
 */
export const getInvoiceDownloadURL = (orderId: string): string => {
  // Use the same base URL as defined in your Axios instance.
  return `http://10.0.2.2:8000/api/invoices/download/${orderId}`;
};

// ---------------------------------------------------------------------
// Distance Calculation using Directions API
// ---------------------------------------------------------------------

// Use your real Google Maps Directions API key here:
const GOOGLE_MAPS_API_KEY = "AIzaSyBsN_Z9IAY3R9zacVCc8SUEFugDEMxc3wA";

/**
 * Calculates the driving distance (in kilometers) between two points via the
 * Google Directions API. Traffic is excluded by default (we just get the default route).
 */
export const getDrivingDistanceInKm = async (
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<number> => {
  try {
    // Example request to Directions API:
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await axios.get(url);

    if (
      response.data &&
      response.data.routes &&
      response.data.routes.length > 0
    ) {
      const route = response.data.routes[0];
      const leg = route.legs[0];
      const distanceInMeters = leg.distance.value; // e.g. 1234 meters
      const distanceInKm = distanceInMeters / 1000;
      return distanceInKm;
    } else {
      console.warn("No routes found by Directions API.");
      return 0;
    }
  } catch (error: any) {
    console.error("Error fetching driving distance:", error);
    // Fallback: 0 or throw an error
    return 0;
  }
};

export default API;
