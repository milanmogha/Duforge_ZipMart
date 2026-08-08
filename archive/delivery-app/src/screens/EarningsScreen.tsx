import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { DeliveryBoyAPI } from '../services/api';

// Replace with your actual Google Maps API key.
const GOOGLE_MAPS_API_KEY = 'AIzaSyBsN_Z9IAY3R9zacVCc8SUEFugDEMxc3wA';

interface OrderHistoryItem {
  id: string;
  distance: string;
  earning: string;
}

const EarningsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [totalEarnings, setTotalEarnings] = useState<string>('0');
  const [earningsHistory, setEarningsHistory] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState('Earnings');

  useEffect(() => {
    fetchEarningsHistory();
  }, []);

  // Helper function to get driving distance (in km) via Google Maps Directions API.
  // Expects two objects with latitude and longitude.
  const getDrivingDistance = async (shopCoords: { latitude: number; longitude: number }, customerCoords: { latitude: number; longitude: number }): Promise<number | null> => {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${shopCoords.latitude},${shopCoords.longitude}&destination=${customerCoords.latitude},${customerCoords.longitude}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (
        data.routes &&
        data.routes.length > 0 &&
        data.routes[0].legs &&
        data.routes[0].legs.length > 0 &&
        data.routes[0].legs[0].distance
      ) {
        // distance.value is in meters
        const distanceInMeters = data.routes[0].legs[0].distance.value;
        const distanceInKm = distanceInMeters / 1000;
        return distanceInKm;
      } else {
        console.error('No valid route data returned');
      }
    } catch (error) {
      console.error('Error fetching driving distance:', error);
    }
    return null;
  };

  /**
   * Fetch delivered orders from backend and compute past earning per order.
   *
   * For each order, if the deliveryBoyEarning field (computed on the backend) is nonzero,
   * it uses that value. Otherwise, it calculates the shortest driving distance (via Google Maps)
   * from the shop to the delivery address and then computes the earning as distance * 8.
   *
   * The computed earnings (along with driving distance) are stored in the earningsHistory state,
   * and the totalEarnings state is updated.
   */
  const fetchEarningsHistory = async () => {
    try {
      setLoading(true);
      // Fetch delivered orders (past orders)
      const deliveredOrders = await DeliveryBoyAPI.getDeliveredOrders();
      let total = 0;
      const historyPromises = deliveredOrders.map(async (order: any) => {
        let computedDistance = 0;
        let computedEarning = 0;

        // We assume that delivered orders include coordinates.
        // If not, you might have to refetch order details with coordinates.
        const shopCoords = order.shopCoords || (order.shopId && order.shopId.locationCoordinates);
        const customerCoords = order.customerCoords || order.deliveryCoords;

        // If the order already has a stored earning, use it.
        if (order.deliveryBoyEarning && order.deliveryBoyEarning > 0) {
          computedEarning = order.deliveryBoyEarning;
          computedDistance = computedEarning / 8;
        } else if (shopCoords && customerCoords) {
          const distance = await getDrivingDistance(shopCoords, customerCoords);
          if (distance !== null) {
            computedDistance = distance;
            computedEarning = distance * 8;
            // Optionally, here you can trigger an API call to update the order's earning in the backend.
            // For example: await DeliveryBoyAPI.updateOrderEarning(order._id, computedEarning);
          } else {
            computedDistance = 0;
            computedEarning = 0;
          }
        } else {
          console.error('Missing shop or customer coordinates for order:', order._id);
        }
        total += computedEarning;
        return {
          id: order._id || Math.random().toString(),
          distance: computedDistance.toFixed(2),
          earning: computedEarning.toFixed(2),
        };
      });

      const history = await Promise.all(historyPromises);
      setTotalEarnings(total.toFixed(2));
      setEarningsHistory(history);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching earnings history:', error);
      Alert.alert('Error', 'Unable to fetch past earnings.');
      setLoading(false);
    }
  };

  const navigateTo = (screen: string) => {
    setActiveTab(screen);
    if (screen !== 'Earnings') {
      navigation.navigate(screen);
    }
  };

  const renderHistoryItem = ({ item }: { item: OrderHistoryItem }) => (
    <View style={styles.historyItem}>
      <Text style={styles.historyText}>Order ID: {item.id}</Text>
      <Text style={styles.historyText}>Driving Distance: {item.distance} km</Text>
      <Text style={styles.historyText}>Earning: ₹{item.earning}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4ac76f" />
        <Text style={styles.loaderText}>Fetching Earnings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Earnings Summary</Text>

      {/* Total Earnings Card */}
      <View style={styles.earningsBox}>
        <Text style={styles.earningsLabel}>Total Earnings</Text>
        <Text style={styles.earningsAmount}>₹{totalEarnings}</Text>
      </View>

      {/* Earnings History Header */}
      <Text style={styles.historyHeader}>Past Orders Earnings</Text>

      {/* Earnings History List */}
      <FlatList
        data={earningsHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderHistoryItem}
        contentContainerStyle={styles.historyList}
        ListEmptyComponent={<Text style={styles.historyText}>No delivered orders found.</Text>}
      />

      {/* Bottom Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={[styles.navItem, activeTab === 'Home' && styles.activeNavItem]} onPress={() => navigateTo('Home')}>
          <FontAwesome name="home" size={24} style={activeTab === 'Home' ? styles.activeIcon : styles.icon} />
          <Text style={activeTab === 'Home' ? styles.activeTabText : styles.tabText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, activeTab === 'Orders' && styles.activeNavItem]} onPress={() => navigateTo('Orders')}>
          <FontAwesome name="clipboard" size={24} style={activeTab === 'Orders' ? styles.activeIcon : styles.icon} />
          <Text style={activeTab === 'Orders' ? styles.activeTabText : styles.tabText}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, activeTab === 'Earnings' && styles.activeNavItem]} onPress={() => navigateTo('Earnings')}>
          <FontAwesome name="money" size={24} style={activeTab === 'Earnings' ? styles.activeIcon : styles.icon} />
          <Text style={activeTab === 'Earnings' ? styles.activeTabText : styles.tabText}>Earnings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, activeTab === 'Profile' && styles.activeNavItem]} onPress={() => navigateTo('Profile')}>
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
    backgroundColor: '#f3f4f6',
    paddingTop: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingBottom: 70, // extra space for the nav bar
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    fontFamily: 'Lucida Grande',
    color: '#333',
  },
  earningsBox: {
    width: '100%',
    backgroundColor: '#4ac76f',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 15,
  },
  earningsLabel: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Lucida Grande',
  },
  earningsAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
    fontFamily: 'Lucida Grande',
  },
  historyHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    alignSelf: 'flex-start',
    fontFamily: 'Lucida Grande',
  },
  historyList: {
    width: '100%',
    paddingBottom: 20,
  },
  historyItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  historyText: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'Lucida Grande',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
    fontFamily: 'Lucida Grande',
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

export default EarningsScreen;
