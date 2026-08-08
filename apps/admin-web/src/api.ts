import axios, { AxiosInstance, AxiosResponse } from "axios";
import { API_BASE_URL } from "@zipmart/shared";

// Create Axios instance with a base URL
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL, // Base URL for all API requests
  timeout: 10000, // Timeout for requests (10 seconds)
});

// Intercept requests to include token in headers if available
api.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem("adminToken");
    const shopkeeperToken = localStorage.getItem("shopkeeperToken");

    // Include the correct token based on user type
    if (adminToken) {
      config.headers["Authorization"] = `Bearer ${adminToken}`;
    } else if (shopkeeperToken) {
      config.headers["Authorization"] = `Bearer ${shopkeeperToken}`;
    }
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

export const getAllProducts = async (): Promise<any[]> => {
  try {
    const response = await api.get("/products/all");
    return response.data;
  } catch (error: any) {
    console.error(
      "Error fetching all products:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Failed to fetch products" };
  }
};
// Intercept responses for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized! Redirecting to login...");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("shopkeeperToken");
      window.location.href = "/login";
    }
    if (error.response?.status === 403) {
      console.error("Forbidden! You do not have access to this resource.");
      alert("You do not have access to this resource.");
    }
    if (error.response?.status >= 500) {
      console.error("Server error! Please try again later.");
      alert("Server error! Please try again later.");
    }
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------
// Interfaces for consistent data typing
// ---------------------------------------------------------------------

export interface OrderItem {
  product: {
    _id: string;
    name: string;
    category: string;
    price: number;
    discount?: number; // Added discount property (optional)
    images?: {
      image1?: {
        data: string;
        contentType: string;
      };
    };
  };
  quantity: number;
  price: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}
export interface Order {
  _id: string;
  customerId?: { _id: string; name?: string } | string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items?: OrderItem[];
  rating?: number;
  reviewComment?: string;
  // Additional fields for admin order details
  invoiceAvailable?: boolean;
  shopId?: string;
  shopName?: string;
  shopPhone?: string;
  shopAddress?: string;
  shopGstNumber?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  deliveryAddress?: string;
  deliveryStatus?: string;
  customerName?: string;
  customerPhone?: string;
  shopCoords?: {
    latitude: number;
    longitude: number;
  };
  customerCoords?: {
    latitude: number;
    longitude: number;
  };
  orderDate?: string;
  updatedAt?: string;  
  gstNumber: string;
  location: string;
  deliveryCoords?: Coordinates;
  deliveryBoyEarning?: number;
}

export interface Coupon {
  _id: string;
  code: string;
  discountType: "flat" | "percentage";
  discountValue: number;
  usageLimit: number;
  usageCount: number;
  expirationDate: string;
  expirationTime: string;
  isActive: boolean;
}

// ---------------------------------------------------------------------
// Banner APIs
// ---------------------------------------------------------------------
export const fetchBanners = async (): Promise<any[]> => {
  try {
    const response = await api.get("/banners");
    return response.data;
  } catch (error) {
    console.error("Error fetching banners:", error);
    throw error;
  }
};

export const addBanner = async (formData: FormData): Promise<any> => {
  try {
    const response = await api.post("/banners", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error adding banner:", error);
    throw error;
  }
};

export const deleteBanner = async (id: string): Promise<any> => {
  try {
    const response = await api.delete(`/banners/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting banner:", error);
    throw error;
  }
};

// ---------------------------------------------------------------------
// Order APIs
// ---------------------------------------------------------------------
export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const response = await api.get("/orders/all");
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to fetch all orders" };
  }
};

export const getOrderById = async (orderId: string): Promise<Order> => {
  try {
    const response: AxiosResponse<Order> = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Failed to fetch order details" };
  }
};

/*Admin can fetch delivered orders for a specific delivery boy using:
*   GET /orders/delivered?deliveryBoyId=xxx
*/
export const getDeliveredOrdersForDeliveryBoy = async (deliveryBoyId: string): Promise<Order[]> => {
 try {
   // Note we call /orders/delivered with ?deliveryBoyId
   const response = await api.get<Order[]>(`/orders/delivered?deliveryBoyId=${deliveryBoyId}`);
   return response.data;
 } catch (error: any) {
   throw error.response?.data || { message: "Failed to fetch delivered orders" };
 }
};

// ---------------------------------------------------------------------
// Rating APIs
// ---------------------------------------------------------------------
export const getRatingByOrderId = async (
  orderId: string
): Promise<{ rating?: number; reviewComment?: string }> => {
  try {
    const response = await api.get(`/ratings/order/${orderId}`);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return { rating: 0, reviewComment: "" }; // Default values if no rating exists
    }
    console.error("Error in getRatingByOrderId:", error);
    throw error;
  }
};

// ---------------------------------------------------------------------
// Coupon APIs
// ---------------------------------------------------------------------
export const fetchCoupons = async (): Promise<Coupon[]> => {
  try {
    const response = await api.get("/coupons");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching coupons:", error);
    throw error.response?.data || { message: "Failed to fetch coupons" };
  }
};

export const createCoupon = async (data: {
  code: string;
  expirationDate: string;
  expirationTime: string;
}): Promise<any> => {
  try {
    const expirationDateTime = new Date(
      `${data.expirationDate}T${data.expirationTime}`
    ).toISOString();
    const response = await api.post("/coupons", {
      ...data,
      expirationDate: expirationDateTime,
    });
    return response.data;
  } catch (error: any) {
    console.error(
      "Error creating coupon:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Failed to create coupon" };
  }
};

export const deleteCoupon = async (id: string): Promise<any> => {
  try {
    const response = await api.delete(`/coupons/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(
      "Error deleting coupon:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Failed to delete coupon" };
  }
};

// ---------------------------------------------------------------------
// Banner2 APIs
// ---------------------------------------------------------------------
export const fetchBanner2s = async (): Promise<any[]> => {
  try {
    const response = await api.get("/banner2");
    return response.data;
  } catch (error) {
    console.error("Error fetching banner2s:", error);
    throw error;
  }
};

export const addBanner2 = async (formData: FormData): Promise<any> => {
  try {
    const response = await api.post("/banner2", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error adding banner2:", error);
    throw error;
  }
};

export const deleteBanner2 = async (id: string): Promise<any> => {
  try {
    const response = await api.delete(`/banner2/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting banner2:", error);
    throw error;
  }
};

// ---------------------------------------------------------------------
// Banner3 APIs
// ---------------------------------------------------------------------
export const fetchBanner3s = async (): Promise<any[]> => {
  try {
    const response = await api.get("/banner3");
    return response.data;
  } catch (error) {
    console.error("Error fetching banner3s:", error);
    throw error;
  }
};

export const addBanner3 = async (formData: FormData): Promise<any> => {
  try {
    const response = await api.post("/banner3", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error adding banner3:", error);
    throw error;
  }
};

export const deleteBanner3 = async (id: string): Promise<any> => {
  try {
    const response = await api.delete(`/banner3/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting banner3:", error);
    throw error;
  }
};

export default api;