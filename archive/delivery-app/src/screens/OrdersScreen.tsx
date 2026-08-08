import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Animated,
} from 'react-native';
import * as Location from 'expo-location';
import { DeliveryBoyAPI } from '../services/api';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';

const socket = io('http://192.168.6.135:8000');

const OrdersScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [acceptedOrders, setAcceptedOrders] = useState<any[]>([]);
  const [transitOrders, setTransitOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [activeTab, setActiveTab] = useState('Orders');
  const cardAnimation = new Animated.Value(1);

  // Refs to hold the current accepted and in-transit orders
  const acceptedOrdersRef = useRef<any[]>(acceptedOrders);
  const transitOrdersRef = useRef<any[]>(transitOrders);

  // Update refs when states change
  useEffect(() => {
    acceptedOrdersRef.current = acceptedOrders;
  }, [acceptedOrders]);

  useEffect(() => {
    transitOrdersRef.current = transitOrders;
  }, [transitOrders]);

  useEffect(() => {
    fetchOrders();
    initializeSocket();
    startLocationUpdates();

    return () => {
      socket.disconnect();
      stopLocationUpdates();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission not granted.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      const pendingResponse = await DeliveryBoyAPI.getOrdersInRange(
        position.coords.latitude,
        position.coords.longitude
      );
      setPendingOrders(pendingResponse.data || []);

      const acceptedResponse = await DeliveryBoyAPI.getAcceptedOrders();
      setAcceptedOrders(acceptedResponse.data || []);

      const transitResponse = await DeliveryBoyAPI.getTransitOrders();
      setTransitOrders(transitResponse || []);
      
    } catch (error: any) {
      console.error('Fetch Orders Error:', error.message || error);
      Alert.alert('Error', 'Failed to fetch orders.');
    } finally {
      setLoading(false);
    }
  };

  const initializeSocket = () => {
    socket.on('connect', () => console.log('Socket connected:', socket.id));

    socket.on('orders-updated', (updatedOrders) => {
      if (Array.isArray(updatedOrders)) {
        setPendingOrders(updatedOrders);
      }
    });

    socket.on('new-order', (newOrder) => {
      if (newOrder) {
        Alert.alert('New Order', 'A new order has been placed!');
        setPendingOrders((prev) => [newOrder, ...prev]);
      }
    });

    socket.on('disconnect', () => console.log('Socket disconnected.'));
  };

  const startLocationUpdates = async () => {
    await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 30000,
        distanceInterval: 50,
      },
      (updatedLocation) => {
        // Only update location if there's at least one accepted or in-transit order.
        if (
          acceptedOrdersRef.current.length > 0 ||
          transitOrdersRef.current.length > 0
        ) {
          setLocation({
            latitude: updatedLocation.coords.latitude,
            longitude: updatedLocation.coords.longitude,
          });
          // Optionally, you can send this updated location to your backend here.
        }
      }
    );
  };

  const stopLocationUpdates = () => {
    console.log('Location updates stopped');
  };

  const handleNavigateToDetail = (order: any) => {
    console.log('Navigating to order:', order);

    if (['Accepted', 'InTransit'].includes(order.deliveryStatus)) {
      navigation.navigate('OrderDetail', { orderId: order._id });
    } else {
      Alert.alert('Restricted', 'You can only view details of accepted or in-transit orders.');
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const response = await DeliveryBoyAPI.acceptOrder(orderId);
      if (response) {
        const acceptedOrder = pendingOrders.find((o) => o._id === orderId);
        if (acceptedOrder) {
          acceptedOrder.deliveryStatus = 'Accepted';
          setAcceptedOrders((prev) => [...prev, acceptedOrder]);
          setPendingOrders((prev) => prev.filter((o) => o._id !== orderId));
          // Emit the accepted order update so the customer web receives it.
          socket.emit("order-updated", acceptedOrder);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to accept the order.');
    }
  };
  

  const handleRejectOrder = async (orderId: string) => {
    try {
      await DeliveryBoyAPI.rejectOrder(orderId);
      fetchOrders();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to reject the order.');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <Animated.View style={[styles.card, { transform: [{ scale: cardAnimation }] }]}>
      <TouchableOpacity
        onPress={() => handleNavigateToDetail(item)}
        onPressIn={() => Animated.spring(cardAnimation, { toValue: 0.95, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(cardAnimation, { toValue: 1, useNativeDriver: true }).start()}
      >
        <Text style={styles.cardTitle}>{item.customerName}</Text>
        <Text style={styles.cardSubtitle}>{item.shopName}</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.status}>{item.deliveryStatus}</Text>
        </View>
        {item.deliveryStatus === 'Pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={() => handleAcceptOrder(item._id)}
            >
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={() => handleRejectOrder(item._id)}
            >
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const navigateTo = (screen: string) => {
    setActiveTab(screen);
    if (screen !== 'Orders') {
      navigation.navigate(screen);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <TouchableOpacity onPress={fetchOrders}>
          <FontAwesome name="refresh" size={24} color="#0066FF" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#0066FF" style={styles.loader} />
      ) : (
        <FlatList
          data={[...transitOrders, ...acceptedOrders, ...pendingOrders]}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
      {/* Bottom Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'Home' && styles.activeNavItem]}
          onPress={() => navigateTo('Home')}
        >
          <FontAwesome name="home" size={24} style={activeTab === 'Home' ? styles.activeIcon : styles.icon} />
          <Text style={activeTab === 'Home' ? styles.activeTabText : styles.tabText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'Orders' && styles.activeNavItem]}
          onPress={() => navigateTo('Orders')}
        >
          <FontAwesome name="clipboard" size={24} style={activeTab === 'Orders' ? styles.activeIcon : styles.icon} />
          <Text style={activeTab === 'Orders' ? styles.activeTabText : styles.tabText}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'Earnings' && styles.activeNavItem]}
          onPress={() => navigateTo('Earnings')}
        >
          <FontAwesome name="money" size={24} style={activeTab === 'Earnings' ? styles.activeIcon : styles.icon} />
          <Text style={activeTab === 'Earnings' ? styles.activeTabText : styles.tabText}>Earnings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'Profile' && styles.activeNavItem]}
          onPress={() => navigateTo('Profile')}
        >
          <FontAwesome name="user" size={24} style={activeTab === 'Profile' ? styles.activeIcon : styles.icon} />
          <Text style={activeTab === 'Profile' ? styles.activeTabText : styles.tabText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 80, // extra bottom padding so list isn't hidden behind nav bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  statusContainer: {
    marginVertical: 10,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 15,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 20,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeNavItem: {
    backgroundColor: '#E8F5E9',
  },
  icon: {
    color: '#757575',
    marginBottom: 5,
  },
  activeIcon: {
    color: '#4ac76f',
    marginBottom: 5,
  },
  tabText: {
    fontSize: 12,
    color: '#757575',
  },
  activeTabText: {
    fontSize: 12,
    color: '#4ac76f',
    fontWeight: 'bold',
  },
});

export default OrdersScreen;
