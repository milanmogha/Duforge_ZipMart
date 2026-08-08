import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.6.135:8000/api',
  timeout: 5000,
});

const addAuthorizationHeader = async () => {
  const token = await AsyncStorage.getItem('token');
  if (!token) {
    throw new Error('Authorization token missing');
  }
  return { Authorization: `Bearer ${token}` };
};

const DeliveryBoyAPI = {
  signup: async (data: FormData) => {
    try {
      const response = await api.post('/deliveryboy/signup', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response;
    } catch (error: any) {
      console.error('Signup API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  login: async (data: { email: string; password: string }) => {
    try {
      const response = await api.post('/deliveryboy/login', data);
      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
      }
      return response;
    } catch (error: any) {
      console.error('Login API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  getOrdersInRange: async (lat: number, lng: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Authorization token missing');
      const response = await api.get(`/orders/in-range?lat=${lat}&lng=${lng}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response;
    } catch (error: any) {
      console.error('Get Orders In Range API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  getAcceptedOrders: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Authorization token missing');
      const response = await api.get(`/orders/accepted`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response;
    } catch (error: any) {
      console.error('Get Accepted Orders API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  acceptOrder: async (orderId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Authorization token missing');
      const response = await api.patch(`/orders/${orderId}/accept`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200) {
        console.log('Order accepted successfully:', response.data);
        return response.data;
      } else {
        console.error('Unexpected response:', response);
        throw new Error('Unexpected response from server.');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to accept order';
      console.error('Accept Order API Error:', errorMessage);
      throw { message: errorMessage };
    }
  },

  rejectOrder: async (orderId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Authorization token missing');
      const response = await api.patch(`/orders/${orderId}/reject`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      console.error('Reject Order API Error:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Failed to reject order' };
    }
  },

  pickOrder: async (orderId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Authorization token missing');
      const response = await api.patch(`/orders/${orderId}/pick`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      console.error('Pick Order API Error:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Failed to pick order' };
    }
  },

  getOrderDetails: async (orderId: string) => {
    try {
      const headers = await addAuthorizationHeader();
  
      // API call to fetch order details
      const response = await api.get(`/orders/${orderId}`, { headers });
  
      const { shopCoords, customerCoords } = response.data;
  
      // Validate coordinates
      if (!shopCoords || !customerCoords) {
        console.error("Invalid response: Missing shop or customer coordinates", response.data);
        throw new Error("Missing shop or customer coordinates in response");
      }
  
      if (
        typeof shopCoords.latitude !== "number" ||
        typeof shopCoords.longitude !== "number" ||
        typeof customerCoords.latitude !== "number" ||
        typeof customerCoords.longitude !== "number"
      ) {
        console.error("Invalid response: Invalid coordinate values", response.data);
        throw new Error("Invalid coordinate values in response");
      }
  
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to fetch order details";
      console.error("Get Order Details API Error:", error.response?.data || error.message);
      throw { message: errorMessage, status: error.response?.status || 500 };
    }
  },

  getTransitOrders: async () => {
    try {
      const headers = await addAuthorizationHeader();
      const response = await api.get(`/orders/in-transit`, { headers });
      console.log('Transit Orders Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Get Transit Orders API Error:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Failed to fetch in-transit orders' };
    }
  },


  updateOrderDeliveryStatus: async (orderId: string, deliveryStatus: string) => {
    try {
      const headers = await addAuthorizationHeader();
      const response = await api.patch(
        `/orders/${orderId}/delivery-status`,
        { deliveryStatus },
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Update Order Delivery Status API Error:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Failed to update order status' };
    }
  },

  registerDevice: async (data: { token: string }) => {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Authorization token missing');
    return api.post('/deliveryboy/register-device', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  updateDeliveryBoyLocation: async (orderId: string, latitude: number, longitude: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Authorization token missing');

      const response = await api.patch(`/orders/${orderId}/location`, { latitude, longitude }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    } catch (error: any) {
      console.error('Update Delivery Boy Location API Error:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Failed to update location' };
    }
  },

   /**
   * Update Payment Status
   */
   updatePaymentStatus: async (orderId: string, paymentStatus: string) => {
    try {
      const headers = await addAuthorizationHeader();
      const response = await api.patch(
        `/orders/${orderId}/payment-status`,
        { paymentStatus },
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Update Payment Status API Error:', error.response?.data || error.message);
      throw error.response?.data || error.message;
    }
  },
  sendOtp: async (data: { email: string }) => {
    try {
      const response = await api.post('/deliveryboy/send-otp', data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },
  
  verifyOtp: async (data: { email: string; otp: string }) => {
    try {
      const response = await api.post('/deliveryboy/verify-otp', data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  sendForgotPasswordOtp: async (data: { email: string }) => {
    try {
      const response = await api.post('/deliveryboy/forgot-password/otp/send', data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  resetPassword: async (data: { email: string; newPassword: string; confirmPassword: string }) => {
    try {
      const response = await api.post('/deliveryboy/forgot-password/reset', data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getProfile: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Authorization token missing');
      const response = await api.get('/deliveryboy/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      console.error('Get Profile API Error:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Failed to fetch profile' };
    }
  },
  
    // Get all delivered orders for the logged-in delivery boy
    getDeliveredOrders: async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('Authorization token missing');
        const response = await api.get(`/orders/delivered`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
      } catch (error: any) {
        console.error('Get Delivered Orders API Error:', error.response?.data || error.message);
        throw error;
      }
    },
  
};

export { DeliveryBoyAPI };
export default api;
