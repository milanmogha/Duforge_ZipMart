import React, { createContext, useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import Toast from 'react-native-toast-message';

const socket = io('http://192.168.6.135:8000');

const NotificationContext = createContext<any>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('new-order', (data) => {
      console.log('New order received:', data);
      Toast.show({
        type: 'success',
        text1: 'New Order Received',
        text2: `Order from ${data.customerName}`,
        position: 'top',
        visibilityTime: 5000,
      });
    });

    socket.on('order-updated', (data) => {
      console.log('Order updated:', data);
      Toast.show({
        type: 'info',
        text1: 'Order Updated',
        text2: `Order status changed to ${data.deliveryStatus}`,
        position: 'top',
        visibilityTime: 5000,
      });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications }}>
      {children}
      <Toast />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
