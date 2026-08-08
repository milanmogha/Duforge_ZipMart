import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { Socket } from "socket.io-client";
import { getShopOrders } from "../services/api";

interface ShopkeeperOrdersProps {
  socket: Socket | null;
}

type OrderItem = {
  product: {
    _id: string;
    name: string;
  };
  quantity: number;
  price: number;
};

type Order = {
  _id: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  deliveryStatus: string;
  items: OrderItem[];
};

const ShopkeeperOrders: React.FC<ShopkeeperOrdersProps> = ({ socket }) => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Orders");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const shopkeeperId = await AsyncStorage.getItem("shopkeeperId");
        if (!shopkeeperId) {
          setError("Shopkeeper ID is missing. Please log in again.");
          setLoading(false);
          return;
        }
        const ordersData = await getShopOrders(shopkeeperId);
        setOrders(ordersData);
        setFilteredOrders(ordersData);
      } catch (err: any) {
        setError("Failed to load orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    if (socket) {
      socket.on("order-added", (newOrder: Order) => {
        setOrders((prevOrders) => [newOrder, ...prevOrders]);
      });

      socket.on("order-updated", (updatedOrder: Order) => {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === updatedOrder._id ? updatedOrder : order
          )
        );
      });

      socket.on("order-deleted", (deletedOrderId: string) => {
        setOrders((prevOrders) =>
          prevOrders.filter((order) => order._id !== deletedOrderId)
        );
      });
    }

    return () => {
      if (socket) {
        socket.off("order-added");
        socket.off("order-updated");
        socket.off("order-deleted");
      }
    };
  }, [socket]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders);
    } else {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = orders.filter(
        (order) =>
          order._id.toLowerCase().includes(lowerCaseQuery) ||
          order.customerName.toLowerCase().includes(lowerCaseQuery) ||
          order.customerPhone.includes(searchQuery) ||
          order.deliveryStatus.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredOrders(filtered);
    }
  }, [searchQuery, orders]);

  const navigateTo = (screen: string) => {
    setActiveTab(screen);
    if (screen !== "Orders") {
      navigation.navigate(screen as never);
    }
  };

  const handleOrderPress = (orderId: string) => {
    navigation.navigate("OrderDetails" as never, { orderId } as never);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ac76f" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity style={styles.orderCard} onPress={() => handleOrderPress(item._id)}>
      <View style={{ flex: 1 }}>
        <Text style={styles.orderTitle} numberOfLines={1}>
          Order ID: {item._id}
        </Text>
        <Text style={styles.orderSubtitle}>
          Customer: {item.customerName} ({item.customerPhone})
        </Text>
        <Text style={styles.orderStatus}>
          Status: <Text style={styles.statusText}>{item.deliveryStatus}</Text>
        </Text>
      </View>
      <Text style={styles.orderAmount}>₹{item.totalAmount}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Shopkeeper Orders</Text>

      <TextInput
        style={styles.searchBar}
        placeholder="Search orders..."
        value={searchQuery}
        onChangeText={(text) => setSearchQuery(text)}
      />

      {filteredOrders.length > 0 ? (
        <FlatList
          data={filteredOrders}
          keyExtractor={(order) => order._id}
          renderItem={renderOrder}
        />
      ) : (
        <Text style={styles.noOrdersText}>No orders available.</Text>
      )}

      {/* Bottom Navigation Bar */}
      <View style={styles.navBar}>
        {[
          { name: "Dashboard", icon: "home", label: "Home" },
          { name: "Orders", icon: "clipboard", label: "Orders" },
          { name: "Products", icon: "shopping-cart", label: "Products" },
          { name: "AddProduct", icon: "plus-circle", label: "Add Product" },
          { name: "Profile", icon: "user", label: "Profile" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={[styles.navItem, activeTab === tab.name && styles.activeNavItem]}
            onPress={() => navigateTo(tab.name)}
          >
            <FontAwesome name={tab.icon} size={24} style={activeTab === tab.name ? styles.activeIcon : styles.icon} />
            <Text style={activeTab === tab.name ? styles.activeTabText : styles.tabText}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.footer}></View>
    </View>
  );
};

export default ShopkeeperOrders;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Lucida Grande",
    textAlign: "center",
    marginBottom: 16,
    color: "#333",
  },
  searchBar: {
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    fontFamily: "Lucida Grande",
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Lucida Grande",
    color: "#333",
  },
  orderSubtitle: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Lucida Grande",
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Lucida Grande",
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4ac76f",
    fontFamily: "Lucida Grande",
  },
  navBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    justifyContent: "space-around",
    alignItems: "center",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  footer:{
    paddingBottom: 70,
  },
  
  icon: { color: "#757575" },
  activeIcon: { color: "#4ac76f" },
  tabText: { fontSize: 12, fontFamily: "Lucida Grande", color: "#757575" },
  activeTabText: { fontSize: 12, fontFamily: "Lucida Grande", color: "#4ac76f", fontWeight: "bold" }
});

