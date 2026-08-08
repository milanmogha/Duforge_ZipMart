import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { io } from "socket.io-client";
import { getCustomerOrders } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  configureExpoNotifications,
  showLocalNotification,
} from "../services/NotificationService";

type OrderItem = {
  product: {
    _id: string;
    name: string;
    category: string;
    images?: {
      image1?: {
        data: string;
        contentType: string;
      };
    };
    price: number;
  };
  quantity: number;
  price: number;
};

type OrderView = {
  id: string;
  amount: number;
  deliveryStatus: string;
  date: string;
  time: string;
  items: OrderItem[];
};

type RootStackParamList = {
  OrderDetails: { orderId: string };
  SignIn: undefined;
};

const { width } = Dimensions.get("window");

const Orders: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { logout } = useAuth();
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    configureExpoNotifications();

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const ordersData = await getCustomerOrders();
        const transformedOrders: OrderView[] = ordersData.map((o: any) => ({
          id: o._id,
          amount: o.totalAmount,
          deliveryStatus: o.deliveryStatus,
          date: new Date(o.orderDate).toLocaleDateString(),
          time: new Date(o.orderDate).toLocaleTimeString(),
          items: o.items || [],
        }));
        setOrders(transformedOrders);
      } catch (err: any) {
        if (err.response && err.response.status === 401) {
          setError("Session expired. Please log in again.");
          await logout();
          navigation.navigate("SignIn");
        } else {
          setError("Failed to fetch orders.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    const socket = io("http://10.0.2.2:8000");

    socket.on("order-updated", (updatedOrder: any) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === updatedOrder._id
            ? {
                ...order,
                deliveryStatus: updatedOrder.deliveryStatus,
                amount: updatedOrder.totalAmount,
              }
            : order
        )
      );

      const status = updatedOrder.deliveryStatus?.toLowerCase();
      const orderId = updatedOrder._id;

      if (status === "accepted") {
        showLocalNotification(
          "Order Accepted",
          `Order ${orderId} has been accepted.`
        );
      } else if (status === "intransit") {
        showLocalNotification(
          "Order In Transit",
          `Order ${orderId} is on the way.`
        );
      } else if (status === "delivered") {
        showLocalNotification(
          "Order Delivered",
          `Order ${orderId} has been delivered.`
        );
      } else if (status === "rejected") {
        showLocalNotification(
          "Order Rejected",
          `Order ${orderId} has been rejected.`
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [logout, navigation]);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Delivered":
        return styles.statusDelivered;
      case "Cancelled":
        return styles.statusCancelled;
      case "Pending":
        return styles.statusPending;
      case "InTransit":
        return styles.statusInTransit;
      case "Rejected":
        return styles.statusRejected;
      default:
        return styles.statusDefault;
    }
  };

  const handleOrderClick = (orderId: string) => {
    navigation.navigate("OrderDetails", { orderId });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>My Orders</Text>
      {orders.length > 0 ? (
        <FlatList
          data={orders}
          keyExtractor={(order) => order.id}
          contentContainerStyle={styles.flatListContent}
          renderItem={({ item: order }) => (
            <TouchableOpacity
              style={styles.orderCard}
              onPress={() => handleOrderClick(order.id)}
            >
              <View style={styles.orderContent}>
                <View style={styles.imageContainer}>
                  {order.items.length > 0 &&
                  order.items[0]?.product?.images?.image1?.data ? (
                    <Image
                      source={{
                        uri: `data:${order.items[0].product.images.image1.contentType};base64,${order.items[0].product.images.image1.data}`,
                      }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Text style={styles.imagePlaceholderText}>N/A</Text>
                    </View>
                  )}
                </View>
                <View style={styles.orderTextContainer}>
                  <Text style={styles.orderId}>Order ID: {order.id}</Text>
                  <Text style={styles.orderDate}>
                    Placed {order.date}, {order.time}
                  </Text>
                </View>
              </View>
              <View style={styles.orderPriceStatus}>
                <Text style={styles.orderAmount}>₹{order.amount}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    getStatusStyles(order.deliveryStatus),
                  ]}
                >
                  <Text style={styles.statusText}>{order.deliveryStatus}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.noOrdersContainer}>
          <Text style={styles.noOrdersText}>No orders found</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Orders;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: "5%",
    paddingTop: 30,
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: "5%",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 15,
    alignSelf: "center",
  },
  flatListContent: {
    paddingBottom: 20,
  },
  orderCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  orderContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  imageContainer: {
    width: width * 0.14,
    height: width * 0.14,
    borderRadius: (width * 0.14) / 2,
    overflow: "hidden",
    marginRight: 12,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: "#777",
  },
  orderTextContainer: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: "#4b5563",
  },
  orderPriceStatus: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2563eb",
  },
  statusBadge: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  noOrdersContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noOrdersText: {
    fontSize: 18,
    color: "#6b7280",
  },
  statusDelivered: { backgroundColor: "#D1FAE5" },
  statusCancelled: { backgroundColor: "#FEE2E2" },
  statusPending: { backgroundColor: "#FEF3C7" },
  statusInTransit: { backgroundColor: "#DBEAFE" },
  statusRejected: { backgroundColor: "#E5E7EB" },
  statusDefault: { backgroundColor: "#E5E7EB" },
});
