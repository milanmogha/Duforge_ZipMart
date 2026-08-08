import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 🔹 Update Base URL for Emulator/Real Device
const API_BASE_URL = "http://localhost:8000/api"; // Adjust IP if using a device

/**
 * Create an Axios instance with a base URL and default timeout.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10-second timeout
});

/**
 * Axios request interceptor to attach token from AsyncStorage to the headers.
 */
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("shopkeeperToken");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error("Error retrieving token from AsyncStorage:", error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);
/**
 * Function to add a new product via multipart/form-data.
 * This function accepts any image type using "image/*" as MIME.
 * @param productData - A FormData object containing product fields and image(s).
 * @returns The response data from the server if successful.
 */
export const addProduct = async (productData: FormData): Promise<any> => {
  try {
    const response = await api.post("/products/add", productData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error: any) {
    console.error(
      "Error adding product:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Failed to add product" };
  }
};

/**
 * Fetch all orders for the logged-in shopkeeper
 */
export const getShopOrders = async (shopId: string): Promise<any> => {
  if (!shopId) throw new Error("Shop ID is required to fetch orders.");
  try {
    const response = await api.get(`/orders/shop/${shopId}`);
    return response.data;
  } catch (error: any) {
    console.error(
      "Error fetching shop orders:",
      error.response?.data?.message || error.message
    );
    throw error.response?.data || { message: "Failed to fetch shop orders" };
  }
};

/**
 * Fetch details for a specific order
 */
export const getOrderDetails = async (orderId: string): Promise<any> => {
  if (!orderId) throw new Error("Order ID is required to fetch order details.");
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching order details:", error.message);
    throw error.response?.data || { message: "Failed to fetch order details" };
  }
};

/**
 * Update the delivery status of a specific order
 */
export const updateOrderDeliveryStatus = async (
  orderId: string,
  status: string
): Promise<any> => {
  if (!orderId || !status)
    throw new Error(
      "Order ID and status are required to update delivery status."
    );
  try {
    const response = await api.patch(`/orders/${orderId}/delivery-status`, {
      deliveryStatus: status,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error updating order delivery status:", error.message);
    throw (
      error.response?.data || { message: "Failed to update delivery status" }
    );
  }
};

/**
 * Fetch details of a shop
 */
export const getShopDetails = async (shopId: string): Promise<any> => {
  if (!shopId) throw new Error("Shop ID is required to fetch shop details.");
  try {
    const response = await api.get(`/shops/${shopId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching shop details:", error.message);
    throw error.response?.data || { message: "Failed to fetch shop details" };
  }
};

/**
 * Send OTP to the shopkeeper's email for verification
 */
export const sendOtp = async (email: string): Promise<any> => {
  if (!email) throw new Error("Email is required to send OTP.");
  try {
    const response = await api.post(
      "/shop/send-otp",
      { email },
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Error sending OTP:",
      error.response?.data?.message || error.message
    );
    throw error.response?.data || { message: "Failed to send OTP" };
  }
};

/**
 * Updates the delivery boy's location for the specified order.
 * @param orderId - The ID of the order being tracked.
 * @param latitude - The new latitude of the delivery boy.
 * @param longitude - The new longitude of the delivery boy.
 * @returns A promise resolving to the updated order data.
 */
export const updateDeliveryBoyLocation = async (
  orderId: string,
  latitude: number,
  longitude: number
): Promise<any> => {
  try {
    const response = await api.patch(`/orders/${orderId}/location`, {
      latitude,
      longitude,
    });
    return response.data;
  } catch (error: any) {
    console.error(
      "Error updating delivery boy location:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Failed to update location" };
  }
};

export default api;
