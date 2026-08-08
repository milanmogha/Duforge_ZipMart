import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { DeliveryBoyAPI } from '../services/api';
import { FontAwesome } from '@expo/vector-icons';

const DeliveredOrdersScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [deliveredOrders, setDeliveredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDeliveredOrders();
  }, []);

  const fetchDeliveredOrders = async () => {
    try {
      setLoading(true);
      const orders = await DeliveryBoyAPI.getDeliveredOrders();
      setDeliveredOrders(orders || []);
    } catch (error: any) {
      console.error('Error fetching delivered orders:', error.message || error);
      Alert.alert('Error', 'Failed to fetch delivered orders.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
    >
      <Text style={styles.cardTitle}>{item.customerName}</Text>
      <Text style={styles.cardSubtitle}>{item.shopName}</Text>
      <Text style={styles.status}>Status: {item.deliveryStatus}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Delivered Orders</Text>
        <TouchableOpacity onPress={fetchDeliveredOrders}>
          <FontAwesome name="refresh" size={24} color="#0066FF" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#0066FF" style={styles.loader} />
      ) : (
        <FlatList
          data={deliveredOrders}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9', padding: 20, paddingTop: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  loader: { marginTop: 20 },
  listContainer: { paddingBottom: 20 },
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
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  cardSubtitle: { fontSize: 16, color: '#666', marginTop: 5 },
  status: { fontSize: 16, fontWeight: '600', color: '#0066FF', marginTop: 10 },
});

export default DeliveredOrdersScreen;
