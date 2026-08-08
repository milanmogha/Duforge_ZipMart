import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Permissions from 'expo-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import { DeliveryBoyAPI } from '../services/api'; 
async function registerForPushNotificationsAsync() {
  let token;
  const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    Alert.alert('Permission not granted to show notifications');
    return;
  }
  token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

const DeliveryBoyInitialization = () => {
  useEffect(() => {
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        // Store token locally
        await AsyncStorage.setItem('expoPushToken', token);
        // Send token to the backend to register the device
        try {
          await DeliveryBoyAPI.registerDevice({ token });
        } catch (error) {
          console.error('Error registering device token:', error);
        }
      }
    })();
  }, []);

  return null;
};

export default DeliveryBoyInitialization;