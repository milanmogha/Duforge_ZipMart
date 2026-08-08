import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Socket } from "socket.io-client";
import MapView, { Marker, Region } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getOrderDetails } from "../services/api";

const GOOGLE_MAPS_API_KEY = "AIzaSyBsN_Z9IAY3R9zacVCc8SUEFugDEMxc3wA";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface OrderItem {
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
    discount: number;
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  deliveryStatus: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  deliveryAddress: string;
  items: OrderItem[];
  shopCoords?: Coordinates;          // Shop location
  deliveryCoords?: Coordinates;      // Customer location
  deliveryBoyLocation?: Coordinates; // Last known delivery boy location
  shopId?: string;
  invoiceAvailable?: boolean;
}

interface OrderDetailsParams {
  orderId?: string;
}

interface ShopOrderDetailsProps {
  socket: Socket | null;
}

const isValidCoordinate = (coord: any): coord is Coordinates => {
  return (
    coord &&
    typeof coord.latitude === "number" &&
    typeof coord.longitude === "number" &&
    !isNaN(coord.latitude) &&
    !isNaN(coord.longitude)
  );
};

const OrderDetails: React.FC<ShopOrderDetailsProps> = ({ socket }) => {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params as OrderDetailsParams;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<Coordinates | null>(null);
  const [etaText, setEtaText] = useState<string>("");

  // -------------------- 1) Load Last Known Delivery Boy Location --------------------
  useEffect(() => {
    const loadLastLocation = async () => {
      try {
        const stored = await AsyncStorage.getItem("deliveryBoyLastLocation");
        if (stored) {
          const parsed: Coordinates = JSON.parse(stored);
          if (isValidCoordinate(parsed)) {
            console.log("Loaded last known location:", parsed);
            setDeliveryBoyLocation(parsed);
          }
        }
      } catch (err) {
        console.error("Error loading last location", err);
      }
    };
    loadLastLocation();
  }, []);

  // -------------------- 2) Fetch Order Details --------------------
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!orderId) {
          setError("No order ID provided.");
          setLoading(false);
          return;
        }
        const orderData = await getOrderDetails(orderId);
        console.log("Fetched order data:", orderData);
        setOrder(orderData);
        if (orderData.deliveryBoyLocation && isValidCoordinate(orderData.deliveryBoyLocation)) {
          setDeliveryBoyLocation(orderData.deliveryBoyLocation);
        }
      } catch (err: any) {
        const errMsg = err.response?.data?.message || "Failed to fetch order details.";
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  // -------------------- 3) Listen for Socket Updates --------------------
  useEffect(() => {
    if (!socket || !orderId) return;
    socket.on("location-update", (data: any) => {
      if (data.orderId === orderId && data.deliveryBoyLocation && isValidCoordinate(data.deliveryBoyLocation)) {
        console.log("Received new location:", data.deliveryBoyLocation);
        setDeliveryBoyLocation(data.deliveryBoyLocation);
        AsyncStorage.setItem("deliveryBoyLastLocation", JSON.stringify(data.deliveryBoyLocation))
          .catch(err => console.error("Error saving location:", err));
      }
    });
    socket.on("order-updated", (data: any) => {
      if (data._id === orderId) {
        setOrder(data);
      } else if (data.order && data.order._id === orderId) {
        setOrder(data.order);
      }
    });
    return () => {
      socket.off("location-update");
      socket.off("order-updated");
    };
  }, [socket, orderId]);

  // -------------------- 4) Determine Tracking Parameters --------------------
  // For "Accepted": track from delivery boy (rider) to shop; for "InTransit": track from delivery boy to customer.
  let originCoords: Coordinates | null = null;
  let destinationCoords: { lat: number; lng: number } | null = null;
  if (order?.deliveryStatus === "Accepted" && deliveryBoyLocation && order.shopCoords) {
    originCoords = deliveryBoyLocation;
    destinationCoords = {
      lat: order.shopCoords.latitude,
      lng: order.shopCoords.longitude,
    };
  } else if (order?.deliveryStatus === "InTransit" && deliveryBoyLocation && order.deliveryCoords) {
    originCoords = deliveryBoyLocation;
    destinationCoords = {
      lat: order.deliveryCoords.latitude,
      lng: order.deliveryCoords.longitude,
    };
  }
  console.log("Origin:", originCoords, "Destination:", destinationCoords);

  // Define fallback map region using deliveryBoyLocation if available, else shopCoords.
  const mapRegion: Region = {
    latitude: deliveryBoyLocation?.latitude || order?.shopCoords?.latitude || 37.7749,
    longitude: deliveryBoyLocation?.longitude || order?.shopCoords?.longitude || -122.4194,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // -------------------- 5) Invoice Generation --------------------
  const generateInvoiceHTML = (order: Order) => {
    const invoiceDate = new Date(order.orderDate).toLocaleDateString();
    const itemsRows = order.items
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.product.name}</td>
            <td>₹${item.product.price.toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td>₹${item.price.toFixed(2)}</td>
          </tr>
        `
      )
      .join("");
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tax Invoice</title>
          <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .invoice-container { width: 794px; min-height: 1123px; border: 1px solid black; padding: 20px; background: white; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid black; padding-bottom: 10px; }
              .header img { width: 80px; }
              .header h2 { font-size: 20px; margin: 0; }
              .section { display: flex; justify-content: space-between; padding: 5px 0; }
              .bold { font-weight: bold; }
              .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              .table th, .table td { border: 1px solid black; padding: 5px; text-align: center; }
              .total-section { font-size: 14px; font-weight: bold; padding: 10px 0; }
              .footer { display: flex; justify-content: space-between; margin-top: 20px; }
          </style>
      </head>
      <body>
          <div class="invoice-container">
              <div class="header">
                  <img src="../../assets/favicon.png" alt="Logo">
                  <h2>Tax Invoice</h2>
              </div>
              <div class="section">
                  <div>
                      <p><span class="bold">Sold By (Shop):</span> ${order.shopName}</p>
                      <p>Phone: ${order.phone}</p>
                      <p>Address: ${order.location}</p>
                  </div>
                  <div>
                      <p><span class="bold">Order ID:</span> ${order._id}</p>
                      <p><span class="bold">Date:</span> ${invoiceDate}</p>
                  </div>
              </div>
              <div class="section">
                  <p><span class="bold">GST Number:</span> ${order.gstNumber}</p>
              </div>
              <div class="section">
                  <div>
                      <p><span class="bold">Name:</span> ${order.customerName}</p>
                      <p><span class="bold">Phone:</span> ${order.customerPhone}</p>
                      <p><span class="bold">Address:</span> ${order.deliveryAddress}</p>
                  </div>
              </div>
              <table class="table">
                  <thead>
                      <tr>
                          <th>Sl. No</th>
                          <th>Item Description</th>
                          <th>MRP (Rs)</th>
                          <th>Quantity</th>
                          <th>Total (Rs)</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${itemsRows}
                  </tbody>
              </table>
              <p class="total-section">Total Amount: ₹${order.totalAmount.toFixed(2)}</p>
              <div class="footer">
                  <div>
                      <p><span class="bold">Company Full Name</span></p>
                      <p><span class="bold">GSTIN:</span> XXXXXXXX</p>
                      <p><span class="bold">CIN:</span> XXXXXXXXXXX</p>
                  </div>
                  <div>
                      <p><span class="bold">FSSAI License Number:</span> XXXXXXXX</p>
                      <p><span class="bold">PAN:</span> XXXXXXXX</p>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `;
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    try {
      const { uri } = await Print.printToFileAsync({
        html: generateInvoiceHTML(order),
        base64: false,
      });
      const newFilePath = `${FileSystem.documentDirectory}Invoice_${order._id}.pdf`;
      await FileSystem.moveAsync({ from: uri, to: newFilePath });
      Alert.alert("Invoice Generated", "Invoice saved successfully.");
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newFilePath);
      } else {
        Alert.alert("Sharing Not Available", "Find the invoice in your documents.");
      }
    } catch (err) {
      console.error("PDF generation error:", err);
      Alert.alert("Error", "Could not generate PDF invoice.");
    }
  };

  // -------------------- Render --------------------
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }
  if (error || !order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || "Order not found."}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back to Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Back to Orders</Text>
      </TouchableOpacity>
      <Text style={styles.header}>Order Details</Text>

      {/* Order Summary */}
      <View style={styles.card}>
        <Text style={styles.subtitle}>Order Summary</Text>
        <Text style={styles.infoText}>Order ID: {order._id}</Text>
        <Text style={styles.infoText}>Customer Name: {order.customerName}</Text>
        <Text style={styles.infoText}>Customer Phone: {order.customerPhone}</Text>
        <Text style={styles.infoText}>Delivery Status: {order.deliveryStatus}</Text>
        <Text style={styles.infoText}>Payment Method: {order.paymentMethod}</Text>
        <Text style={styles.infoText}>Payment Status: {order.paymentStatus}</Text>
        <Text style={styles.infoText}>Delivery Address: {order.deliveryAddress}</Text>
        <Text style={styles.infoText}>Total Amount: ₹{order.totalAmount}</Text>
        {order.invoiceAvailable && (
          <TouchableOpacity style={styles.invoiceButton} onPress={handleDownloadInvoice}>
            <Text style={styles.buttonText}>Download Invoice</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Items List */}
      <View style={styles.card}>
        <Text style={styles.subtitle}>Items</Text>
        {order.items.map((item, index) => {
          const base64Uri =
            item.product.images?.image1 &&
            `data:${item.product.images.image1.contentType};base64,${item.product.images.image1.data}`;
          return (
            <View key={index} style={styles.itemContainer}>
              <View style={styles.itemLeft}>
                {base64Uri ? (
                  <Image source={{ uri: base64Uri }} style={styles.itemImage} />
                ) : (
                  <View style={styles.itemPlaceholder} />
                )}
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.itemName}>{item.product.name}</Text>
                  <Text style={styles.itemCategory}>Category: {item.product.category}</Text>
                  <Text style={styles.itemDetails}>Unit Price: ₹{item.product.price.toFixed(2)}</Text>
                  <Text style={styles.itemDetails}>Quantity: {item.quantity}</Text>
                </View>
              </View>
              <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
            </View>
          );
        })}
      </View>

      {/* Tracking Map */}
      {isValidCoordinate(deliveryBoyLocation) && destinationCoords && (
        <View style={styles.mapContainer}>
          <Text style={styles.subtitle}>Track Your Order</Text>
          <MapView
            style={styles.map}
            region={{
              ...mapRegion,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            {deliveryBoyLocation && (
              <MapViewDirections
                origin={String(`${deliveryBoyLocation.latitude},${deliveryBoyLocation.longitude}`)}
                destination={String(`${destinationCoords.lat},${destinationCoords.lng}`)}
                apikey={GOOGLE_MAPS_API_KEY}
                strokeWidth={3}
                strokeColor="#2563eb"
                onReady={(result) => {
                  console.log(`Distance: ${result.distance} km, Duration: ${result.duration} min.`);
                  if (result.duration) {
                    const mins = Math.round(result.duration);
                    setEtaText(mins > 60 ? `${(mins / 60).toFixed(1)} hr(s)` : `${mins} min(s)`);
                  }
                }}
                onError={(errorMessage) => {
                  console.error("Directions error:", errorMessage);
                }}
              />
            )}
            <Marker
              coordinate={{
                latitude: deliveryBoyLocation.latitude,
                longitude: deliveryBoyLocation.longitude,
              }}
              title="Delivery Boy"
              pinColor="red"
            />
            {order.deliveryStatus === "Accepted" && order.shopCoords && (
              <Marker
                coordinate={order.shopCoords}
                title="Shop"
                pinColor="blue"
              />
            )}
            {order.deliveryStatus === "InTransit" && order.deliveryCoords && (
              <Marker
                coordinate={order.deliveryCoords}
                title="Customer"
                pinColor="green"
              />
            )}
          </MapView>
          {etaText ? (
            <Text style={styles.etaText}>
              Estimated Delivery Time: <Text style={styles.etaValue}>{etaText}</Text>
            </Text>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
};

export default OrderDetails;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6", padding: 20 },
  backButton: { marginBottom: 10 },
  backButtonText: { color: "#2563eb", fontSize: 16 },
  header: { fontSize: 22, fontWeight: "bold", color: "#2563eb", marginBottom: 10 },
  card: { backgroundColor: "white", padding: 15, borderRadius: 8, marginBottom: 10 },
  subtitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#333" },
  infoText: { fontSize: 16, marginBottom: 5 },
  buttonText: { color: "white", fontWeight: "bold" },
  invoiceButton: { backgroundColor: "#2563eb", padding: 10, borderRadius: 6, marginTop: 10 },
  itemContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderColor: "#e0e0e0", paddingVertical: 10 },
  itemLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  itemImage: { width: 50, height: 50, borderRadius: 6, backgroundColor: "#CCC" },
  itemPlaceholder: { width: 50, height: 50, borderRadius: 6, backgroundColor: "#DDD" },
  itemName: { fontSize: 16, fontWeight: "600" },
  itemCategory: { fontSize: 14, color: "#555", marginTop: 2 },
  itemDetails: { fontSize: 14, color: "#555" },
  itemPrice: { fontSize: 16, fontWeight: "bold" },
  mapContainer: { marginVertical: 10 },
  map: { width: "100%", height: 300, borderRadius: 8 },
  etaText: { fontSize: 16, color: "#444", marginTop: 5 },
  etaValue: { fontWeight: "700" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16, color: "red", marginBottom: 10 },
});
