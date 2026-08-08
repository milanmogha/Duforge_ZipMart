import axios from "axios";
import { API_BASE_URL } from "@zipmart/shared";

// Backend base URL — matches the sibling web apps' convention.
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Attach the delivery boy token to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("deliveryToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Central error unwrapping: throw a plain Error with a useful message.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong.";
    return Promise.reject(new Error(message));
  }
);

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface OrderItem {
  product: {
    _id: string;
    name: string;
    category: string;
    price: number;
    discount?: number;
    images?: {
      image1?: { data: string; contentType: string };
      image2?: { data: string; contentType: string };
      image3?: { data: string; contentType: string };
    };
  };
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  customerName?: string;
  customerPhone?: string;
  shopName?: string;
  deliveryStatus: string;
  deliveryAddress?: string;
  totalAmount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  deliveryCoords?: Coordinates | null;
  shopCoords?: Coordinates | null;
  customerCoords?: Coordinates | null;
  deliveryBoyLocation?: Coordinates | null;
  deliveryBoyEarning?: number;
  platformFee?: number;
  deliveryFee?: number;
  items?: OrderItem[];
  distance?: number;
  orderDate?: string;
  createdAt?: string;
}

export interface DeliveryBoyProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  deliveryBoy: DeliveryBoyProfile;
}

// ---------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------
export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/deliveryboy/login", {
    email,
    password,
  });
  return response.data;
};

export const getProfile = async (): Promise<DeliveryBoyProfile> => {
  const response = await api.get<DeliveryBoyProfile>("/deliveryboy/profile");
  return response.data;
};

// ---------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------
export const getOrdersInRange = async (
  lat: number,
  lng: number
): Promise<Order[]> => {
  const response = await api.get<Order[]>("/orders/in-range", {
    params: { lat, lng },
  });
  return response.data;
};

export const getAcceptedOrders = async (): Promise<Order[]> => {
  const response = await api.get<Order[]>("/orders/accepted");
  return response.data;
};

export const getInTransitOrders = async (): Promise<Order[]> => {
  const response = await api.get<Order[]>("/orders/in-transit");
  return response.data;
};

export const getDeliveredOrders = async (): Promise<Order[]> => {
  const response = await api.get<Order[]>("/orders/delivered");
  return response.data;
};

export const getOrderById = async (orderId: string): Promise<Order> => {
  const response = await api.get<Order>(`/orders/${orderId}`);
  return response.data;
};

export const acceptOrder = async (orderId: string): Promise<Order> => {
  const response = await api.patch<Order>(`/orders/${orderId}/accept`);
  return response.data;
};

export const rejectOrder = async (orderId: string): Promise<Order> => {
  const response = await api.patch<Order>(`/orders/${orderId}/reject`);
  return response.data;
};

export const pickOrder = async (orderId: string): Promise<Order> => {
  const response = await api.patch<Order>(`/orders/${orderId}/pick`);
  return response.data;
};

export const updateDeliveryStatus = async (
  orderId: string,
  deliveryStatus: string
): Promise<Order> => {
  const response = await api.patch<Order>(`/orders/${orderId}/delivery-status`, {
    deliveryStatus,
  });
  return response.data;
};

export const updateDeliveryBoyLocation = async (
  orderId: string,
  latitude: number,
  longitude: number
): Promise<void> => {
  await api.patch(`/orders/${orderId}/location`, { latitude, longitude });
};

export const updatePaymentStatus = async (
  orderId: string,
  paymentStatus: string
): Promise<Order> => {
  const response = await api.patch<Order>(`/orders/${orderId}/payment-status`, {
    paymentStatus,
  });
  return response.data;
};

export default api;
