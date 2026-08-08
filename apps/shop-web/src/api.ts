import axios from "axios";
import { API_BASE_URL } from "@zipmart/shared";

const api = axios.create({
  baseURL: API_BASE_URL, // Backend base URL
  timeout: 10000, // Request timeout set to 10 seconds
});

// Attach token to every request via interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("shopkeeperToken");
    console.log("Token sent in request:", token); // Debugging log
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Fetch all orders for the logged-in shopkeeper
 * @param shopId - The ID of the shop for which orders are fetched
 * @returns A promise resolving to the list of shop orders
 */
export const getShopOrders = async (shopId: string): Promise<any> => {
  if (!shopId) {
    throw new Error("Shop ID is required to fetch orders.");
  }
  try {
    const response = await api.get(`/orders/shop/${shopId}`);
    return response.data;
  } catch (error: any) {
    console.error(
      "Error fetching shop orders:",
      error.response?.data?.message || error.message
    ); // Debugging log
    throw error.response?.data || { message: "Failed to fetch shop orders" };
  }
};

/**
 * Fetch details for a specific order
 * @param orderId - The ID of the order
 * @returns A promise resolving to the details of the specific order
 */
export const getOrderDetails = async (orderId: string): Promise<any> => {
  if (!orderId) {
    throw new Error("Order ID is required to fetch order details.");
  }
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
 * @param orderId - The ID of the order
 * @param status - The new delivery status
 * @returns A promise resolving to the updated order details
 */
export const updateOrderDeliveryStatus = async (
  orderId: string,
  status: string
): Promise<any> => {
  if (!orderId || !status) {
    throw new Error(
      "Order ID and status are required to update delivery status."
    );
  }
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
 * @param shopId - The ID of the shop
 * @returns A promise resolving to the details of the shop
 */
export const getShopDetails = async (shopId: string): Promise<any> => {
  if (!shopId) {
    throw new Error("Shop ID is required to fetch shop details.");
  }
  try {
    const response = await api.get(`/shops/${shopId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching shop details:", error.message);
    throw error.response?.data || { message: "Failed to fetch shop details" };
  }
};

export default api;
