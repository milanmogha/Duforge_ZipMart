import axios, { AxiosInstance } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL, GOOGLE_MAPS_KEY } from "./theme";

// ---------------------------------------------------------------------------
// Axios instance — attaches the stored JWT to every request.
// ---------------------------------------------------------------------------
const API: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (r) => r,
  (error) => Promise.reject(error.response?.data || { message: error.message })
);

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export const getProductsByLocation = async (latitude: number, longitude: number) =>
  (await API.get(`/products/location?latitude=${latitude}&longitude=${longitude}`)).data as any[];

export const getProductById = async (id: string) =>
  (await API.get(`/products/${id}`)).data;

export const getProductsByCategory = async (category: string) =>
  (await API.get(`/products/category/${encodeURIComponent(category)}`)).data as any[];

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------
export const fetchBanners = async () =>
  (await API.get("/banners")).data as any[];

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
export const createOrder = async (orderData: any) =>
  (await API.post("/orders/create", orderData)).data;

export const getCustomerOrders = async () =>
  (await API.get("/orders/customer")).data as any[];

export const getOrderById = async (orderId: string) =>
  (await API.get(`/orders/${orderId}`)).data;

export const cancelOrder = async (orderId: string) =>
  (await API.patch(`/orders/${orderId}/cancel`)).data;

// ---------------------------------------------------------------------------
// Payments (Razorpay via hosted checkout page in a WebView)
// ---------------------------------------------------------------------------
export const createRazorpayOrder = async (amount: number) =>
  (await API.post("/payments/native/create-order", { amount })).data as {
    id: string;
    amount: number;
    paymentUrl?: string;
  };

export const verifyPayment = async (payload: any) =>
  (await API.post("/payments/verify-payment", payload)).data;

// ---------------------------------------------------------------------------
// Coupons, shop, ratings
// ---------------------------------------------------------------------------
export const applyCoupon = async (code: string, totalAmount: number) =>
  (await API.post("/coupons/apply", { code, totalAmount })).data as { discount: number };

export const getShopById = async (id: string) =>
  (await API.get(`/shop/${id}`)).data;

export const getRatingsByProduct = async (productId: string) =>
  (await API.get(`/ratings/product/${productId}`)).data as any[];

export const submitRating = async (payload: {
  orderId: string;
  rating: number;
  comment: string;
}) => (await API.post("/ratings/submit", payload)).data;

// ---------------------------------------------------------------------------
// Google Maps helpers (reverse geocode + driving distance)
// ---------------------------------------------------------------------------
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const { data } = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_KEY}`
    );
    return data.results?.[0]?.formatted_address ?? "Address not found";
  } catch {
    return "Address not found";
  }
};

export const drivingDistanceKm = async (
  oLat: number,
  oLng: number,
  dLat: number,
  dLng: number
): Promise<number> => {
  try {
    const { data } = await axios.get(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${oLat},${oLng}&destination=${dLat},${dLng}&key=${GOOGLE_MAPS_KEY}`
    );
    const meters = data.routes?.[0]?.legs?.[0]?.distance?.value ?? 0;
    return meters / 1000;
  } catch {
    return 0;
  }
};

export default API;
