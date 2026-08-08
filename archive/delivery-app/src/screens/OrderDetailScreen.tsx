import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { DeliveryBoyAPI } from '../services/api';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import io from 'socket.io-client';
import { useIsFocused } from '@react-navigation/native';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface Item {
  name: string;
  category: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  shopName: string;
  deliveryStatus: string;
  shopCoords: Coordinates;
  customerCoords: Coordinates;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  deliveryAddress: string;
  items: Item[];
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyBsN_Z9IAY3R9zacVCc8SUEFugDEMxc3wA';
const SOCKET_IO_SERVER_URL = 'http://192.168.6.135:8000';

const OrderDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinates[]>([]);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const mapRef = useRef<MapView>(null);
  const socketRef = useRef<any>(null);
  const isFocused = useIsFocused();

  // Fetch order details and initialize socket when component mounts
  useEffect(() => {
    fetchOrderDetails();
    initializeSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [orderId, isFocused]);

  // Always show route towards customer
  useEffect(() => {
    if (currentLocation && order) {
      const destination = order.customerCoords;
      if (destination) fetchDirections(currentLocation, destination);
    }
  }, [currentLocation, order]);

  const initializeSocket = () => {
    socketRef.current = io(SOCKET_IO_SERVER_URL);

    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.IO server');
      socketRef.current.emit('join-order-room', orderId);
    });

    socketRef.current.on('location-update', (update: any) => {
      if (update.orderId === orderId) {
        console.log('Received location update:', update.deliveryBoyLocation);
      }
    });

    socketRef.current.on('order-updated', (update: any) => {
      if (update.order.id === orderId) {
        console.log('Order status updated:', update.order.deliveryStatus);
        setOrder((prevOrder) =>
          prevOrder ? { ...prevOrder, deliveryStatus: update.order.deliveryStatus } : prevOrder
        );
        Alert.alert('Order Updated', `Delivery Status: ${update.order.deliveryStatus}`);
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });
  };

  const fetchOrderDetails = async () => {
    try {
      const response = await DeliveryBoyAPI.getOrderDetails(orderId);
      setOrder(response);
    } catch (error: any) {
      console.error('Failed to fetch order details:', error);
      Alert.alert('Error', error.message || 'Failed to fetch order details.');
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermissionAndTrack = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Location permission is required for tracking.');
      Alert.alert('Permission Denied', 'Location permission is required to track your delivery.');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setCurrentLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    // Send initial location update
    sendLocationUpdate(location.coords.latitude, location.coords.longitude);

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
      (location) => {
        const { latitude, longitude } = location.coords;
        setCurrentLocation({ latitude, longitude });
        sendLocationUpdate(latitude, longitude);
      }
    );
  };

  // Only update location if order status is Accepted or InTransit.
  const sendLocationUpdate = async (latitude: number, longitude: number) => {
    if (!order || (order.deliveryStatus !== 'Accepted' && order.deliveryStatus !== 'InTransit')) {
      return;
    }
    try {
      await DeliveryBoyAPI.updateDeliveryBoyLocation(orderId, latitude, longitude);
      console.log('Location updated successfully:', { latitude, longitude });
    } catch (error: any) {
      console.error('Failed to update location:', error.message || error);
    }
  };

  // Only request live location if order is Accepted or InTransit.
  useEffect(() => {
    if (isFocused && order && (order.deliveryStatus === 'Accepted' || order.deliveryStatus === 'InTransit')) {
      requestLocationPermissionAndTrack();
    }
  }, [isFocused, order]);

  const fetchDirections = async (origin: Coordinates, destination: Coordinates) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRouteCoordinates(points);

        mapRef.current?.fitToCoordinates(points, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      } else {
        console.error('No routes found');
      }
    } catch (error) {
      console.error('Failed to fetch directions:', error);
    }
  };

  // Decodes polyline using the Google Encoded Polyline Algorithm Format.
  const decodePolyline = (encoded: string): Coordinates[] => {
    let index = 0;
    const coordinates: Coordinates[] = [];
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      shift = 0;
      result = 0;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += deltaLng;

      coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return coordinates;
  };

  const handleActionWithConfirmation = (message: string, action: () => Promise<void>) => {
    Alert.alert('Confirmation', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await action();
          } catch (error) {
            console.error('Action failed:', error);
            Alert.alert('Error', 'Action failed. Please try again.');
          }
        },
      },
    ]);
  };

  const updateDeliveryStatus = async (status: string) => {
    try {
      await DeliveryBoyAPI.updateOrderDeliveryStatus(orderId, status);
      setOrder((prevOrder) => (prevOrder ? { ...prevOrder, deliveryStatus: status } : prevOrder));
      Alert.alert('Success', `Order marked as ${status}`);
    } catch (error: any) {
      console.error('Failed to update delivery status:', error);
      Alert.alert('Error', error.message || 'Failed to update delivery status.');
    }
  };

  const updatePaymentStatus = async () => {
    try {
      await DeliveryBoyAPI.updatePaymentStatus(orderId, 'Paid');
      setOrder((prevOrder) => (prevOrder ? { ...prevOrder, paymentStatus: 'Paid' } : prevOrder));
      Alert.alert('Success', 'Payment marked as Paid');
    } catch (error: any) {
      console.error('Failed to update payment status:', error);
      Alert.alert('Error', error.message || 'Failed to update payment status.');
    }
  };

  // Only require currentLocation if order is not delivered
  const shouldShowLoader = loading || !order || (order.deliveryStatus !== 'Delivered' && !currentLocation);
  if (shouldShowLoader) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#555" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {order.deliveryStatus !== 'Delivered' && (
        <View style={isFullScreen ? styles.mapFullScreen : styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={isFullScreen ? styles.mapFullScreenStyle : styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: currentLocation!.latitude,
              longitude: currentLocation!.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            <Marker coordinate={currentLocation!} title="You (Delivery Boy)">
              <MaterialIcons name="motorcycle" size={30} color="#1E90FF" />
            </Marker>
            {order.shopCoords && (
              <Marker coordinate={order.shopCoords} title="Shop">
                <MaterialIcons name="storefront" size={30} color="#FF6347" />
              </Marker>
            )}
            {order.customerCoords && (
              <Marker coordinate={order.customerCoords} title="Customer">
                <MaterialIcons name="place" size={30} color="#32CD32" />
              </Marker>
            )}
            {routeCoordinates.length > 0 && (
              <Polyline coordinates={routeCoordinates} strokeColor="#00BFFF" strokeWidth={4} />
            )}
          </MapView>
          <TouchableOpacity
            style={styles.fullScreenButton}
            onPress={() => setIsFullScreen(!isFullScreen)}
          >
            <Text style={styles.fullScreenText}>
              {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.detailsContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <Text style={styles.detail}>Order ID: {order._id}</Text>
          <Text style={styles.detail}>Customer Name: {order.customerName}</Text>
          <Text style={styles.detail}>Customer Phone: {order.customerPhone}</Text>
          <Text style={styles.detail}>Shop Name: {order.shopName}</Text>
          <Text style={styles.detail}>Delivery Status: {order.deliveryStatus}</Text>
          <Text style={styles.detail}>Payment Method: {order.paymentMethod}</Text>
          <Text style={styles.detail}>Payment Status: {order.paymentStatus}</Text>
          <Text style={styles.detail}>Delivery Address: {order.deliveryAddress}</Text>
          <Text style={styles.detail}>Total Amount: ₹{order.totalAmount.toFixed(2)}</Text>
        </View>

        {order.deliveryStatus === 'Accepted' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() =>
                handleActionWithConfirmation(
                  'Are you sure you want to reject this order?',
                  () => updateDeliveryStatus('Rejected')
                )
              }
            >
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() =>
                handleActionWithConfirmation(
                  'Are you sure you want to mark this order as In Transit?',
                  () => updateDeliveryStatus('InTransit')
                )
              }
            >
              <Text style={styles.buttonText}>Mark as Picked</Text>
            </TouchableOpacity>
          </View>
        )}

        {order.deliveryStatus === 'InTransit' && (
          <TouchableOpacity
            style={styles.deliveredButton}
            onPress={() =>
              handleActionWithConfirmation(
                'Are you sure you want to mark this order as Delivered?',
                () => updateDeliveryStatus('Delivered')
              )
            }
          >
            <Text style={styles.buttonText}>Mark as Delivered</Text>
          </TouchableOpacity>
        )}

        {(order.deliveryStatus === 'InTransit' || order.deliveryStatus === 'Delivered') &&
          order.paymentMethod === 'Cash On Delivery' &&
          order.paymentStatus !== 'Paid' && (
            <TouchableOpacity
              style={styles.paidButton}
              onPress={() =>
                handleActionWithConfirmation(
                  'Are you sure you want to mark this payment as Paid?',
                  updatePaymentStatus
                )
              }
            >
              <Text style={styles.buttonText}>Mark as Paid</Text>
            </TouchableOpacity>
          )}
          <View style={styles.footer}>
          </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fc' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapContainer: {
    height: 400,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
  },
  map: { flex: 1 },
  mapFullScreen: { flex: 1 },
  mapFullScreenStyle: { ...StyleSheet.absoluteFillObject },
  fullScreenButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  fullScreenText: { color: '#007AFF', fontWeight: 'bold' },
  detailsContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 10,
    elevation: 3,
  },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  detail: { fontSize: 16, marginBottom: 8, color: '#555' },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  acceptButton: {
    flex: 1,
    marginRight: 5,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    flex: 1,
    marginLeft: 5,
    backgroundColor: '#F44336',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deliveredButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  paidButton: {
    backgroundColor: '#FFA500',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  footer:{
    paddingBottom: 50,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default OrderDetailScreen;