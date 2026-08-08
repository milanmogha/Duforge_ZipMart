import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import {
  getOrderById,
  cancelOrderAPI,
  submitRatingAPI,
  // If you use a generateInvoice API from backend, import it here.
} from "../services/api";

const GOOGLE_MAPS_API_KEY = "AIzaSyBsN_Z9IAY3R9zacVCc8SUEFugDEMxc3wA";

type OrderItem = {
  product: {
    _id: string;
    name: string;
    category: string;
    price: number;
    images?: {
      image1?: {
        data: string;
        contentType: string;
      };
    };
  };
  quantity: number;
  price: number;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

type Order = {
  _id: string;
  customer: string;
  customerName?: string;
  customerPhone?: string;
  deliveryStatus?: string;
  // invoiceAvailable flag is removed in favor of checking deliveryStatus.
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  deliveryAddress: string;
  orderDate: string;
  shopCoords?: Coordinates;
  deliveryCoords?: Coordinates;
  shopName?: string;
};

const OrderDetails: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params as { orderId: string };

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Rating states (if applicable)
  const [ratingValue, setRatingValue] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>("");

  // Delivery boy location state for tracking (if used)
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<Coordinates | null>(null);

  // -------------------- Fetch Order Details --------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!orderId) {
          setError("No order ID provided.");
          return;
        }
        const fetchedOrder = await getOrderById(orderId);
        setOrder(fetchedOrder);

        // Optionally load stored delivery boy location
        const stored = await AsyncStorage.getItem("deliveryBoyLastLocation");
        if (stored) {
          setDeliveryBoyLocation(JSON.parse(stored));
        }
      } catch (err: any) {
        const errMsg =
          err.response?.data?.message || err.message || "Failed to fetch order details.";
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId]);

  // -------------------- Invoice Generation Helpers --------------------
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
<html>
<head>
    <meta charset="UTF-8">
    <title>Tax Invoice</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background: #f0f0f0; }
        .header, .footer { width: 100%; margin-bottom: 20px; }
        .header table, .footer table { width: 100%; }
        .right { text-align: right; }
        .center { text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <table>
            <tr>
                <td><img src="logo.png" alt="Company Logo" height="50"></td>
                <td class="right"><h2>Tax Invoice</h2></td>
            </tr>
        </table>
    </div>
    
    <table>
        <tr>
            <td><strong>Sold By / Seller:</strong> Superwell Comtrade Pvt Ltd</td>
            <td><strong>Order ID:</strong> ${order._id}</td>
        </tr>
        <tr>
            <td>GSTIN: 09AHCS8082R1ZO</td>
            <td><strong>Invoice Date:</strong> ${invoiceDate}</td>
        </tr>
        <tr>
            <td>FSSAI License: 10018604001545</td>
            <td><strong>Place of Supply:</strong> ${order.deliveryAddress}</td>
        </tr>
    </table>
    
    <h3>Invoice To</h3>
    <p><strong>Name:</strong> ${order.customerName}</p>
    <p><strong>Address:</strong> ${order.deliveryAddress}</p>
    
    <table>
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
    
    <h3 class="right">Total Amount: ₹${order.totalAmount.toFixed(2)}</h3>
    
    <div class="footer">
        <table>
            <tr>
                <td><strong>FSSAI License Number:</strong> 10018604001545</td>
                <td class="right"><img src="signature.png" alt="Authorized Signatory" height="50"></td>
            </tr>
        </table>
    </div>
    
    <p class="center">Thank you for shopping with us! <br/> ZipMart | Phone: 123-456-7890 | Email: support@company.com</p>
</body>
</html>
    `;
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    try {
      // Generate PDF from HTML invoice
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
        Alert.alert("Sharing Not Available", "You can find the invoice in your documents.");
      }
    } catch (err) {
      console.error("PDF generation error:", err);
      Alert.alert("Error", "Could not generate PDF invoice.");
    }
  };

  // -------------------- Map Tracking (if applicable) --------------------
  const mapCenter = {
    latitude: deliveryBoyLocation?.latitude ?? order?.shopCoords?.latitude ?? 0,
    longitude: deliveryBoyLocation?.longitude ?? order?.shopCoords?.longitude ?? 0,
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
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back to Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Determine if cancellation or rating is allowed (if needed)
  const canCancel = order.deliveryStatus === "Pending" || order.deliveryStatus === "Accepted";
  const canRate = order.deliveryStatus === "Delivered";

  // For invoice download, show the button if the order is delivered
  const showInvoiceButton = order.deliveryStatus === "Delivered";

  // Determine if tracking is available (for Accepted or InTransit orders)
  const isTrackable =
    (order.deliveryStatus === "Accepted" || order.deliveryStatus === "InTransit") &&
    deliveryBoyLocation != null;

  let destination: Coordinates | null = null;
  if (order.deliveryStatus === "Accepted" && order.shopCoords) {
    destination = order.shopCoords;
  } else if (order.deliveryStatus === "InTransit" && order.deliveryCoords) {
    destination = order.deliveryCoords;
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Back to Orders</Text>
      </TouchableOpacity>

      <Text style={styles.header}>Order Details</Text>

      {/* Order Summary */}
      <View style={styles.card}>
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Order ID:</Text> {order._id}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Shop Name:</Text> {order.shopName || "N/A"}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Customer Name:</Text> {order.customerName || "N/A"}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Customer Phone:</Text> {order.customerPhone || "N/A"}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Delivery Status:</Text> {order.deliveryStatus || "N/A"}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Order Date:</Text> {new Date(order.orderDate).toLocaleString()}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Payment Method:</Text> {order.paymentMethod}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Payment Status:</Text> {order.paymentStatus}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Delivery Address:</Text> {order.deliveryAddress}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Total Amount:</Text> ₹{order.totalAmount}
        </Text>

        {canCancel && (
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={async () => {
              try {
                const cancelledOrder = await cancelOrderAPI(order._id);
                setOrder(cancelledOrder);
                Alert.alert("Success", "Order cancelled successfully!");
              } catch (err: any) {
                Alert.alert("Error", err.message || "Failed to cancel order.");
              }
            }}
          >
            <Text style={styles.buttonText}>Cancel Order</Text>
          </TouchableOpacity>
        )}

       
      </View>

      {/* Items List */}
      <View style={styles.card}>
        <Text style={styles.subHeader}>Items</Text>
        {order.items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text style={styles.itemDetails}>Category: {item.product.category}</Text>
              <Text style={styles.itemDetails}>Quantity: {item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>₹{item.price}</Text>
          </View>
        ))}
        {showInvoiceButton && (
          <TouchableOpacity style={[styles.button, styles.invoiceButton]} onPress={handleDownloadInvoice}>
            <Text style={styles.buttonText}>Download Invoice</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tracking Map (if applicable) */}
      {isTrackable && destination && (
        <View style={styles.mapContainer}>
          <Text style={styles.subHeader}>Track Your Order</Text>
          <MapView
            style={styles.map}
            region={{
              ...mapCenter,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            {deliveryBoyLocation && (
              <Marker coordinate={deliveryBoyLocation} title="Delivery Boy" pinColor="red" />
            )}
            {order.shopCoords && (
              <Marker coordinate={order.shopCoords} title="Shop" pinColor="blue" />
            )}
            {order.deliveryCoords && (
              <Marker coordinate={order.deliveryCoords} title="Customer" pinColor="green" />
            )}
            <MapViewDirections
              origin={deliveryBoyLocation}
              destination={destination}
              apikey={GOOGLE_MAPS_API_KEY}
              strokeWidth={3}
              strokeColor="#2563eb"
              onReady={(result) => {
                console.log(`Distance: ${result.distance} km, Duration: ${result.duration} min.`);
              }}
              onError={(errorMessage) => {
                console.error("Directions error:", errorMessage);
              }}
            />
          </MapView>
        </View>
      )}

      {/* Rating Section (if applicable) */}
      {canRate && (
        <View style={styles.card}>
          <Text style={styles.subHeader}>Rate Your Order</Text>
          <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRatingValue(star)}>
                <FontAwesome
                  name="star"
                  size={24}
                  color={star <= ratingValue ? "#ffcc00" : "#ccc"}
                />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={async () => {
              if (ratingValue <= 0) {
                Alert.alert("Error", "Please select a rating.");
                return;
              }
              try {
                await submitRatingAPI({
                  orderId: order._id,
                  rating: ratingValue,
                  comment: reviewComment,
                });
                Alert.alert("Success", "Rating submitted successfully!");
              } catch (err: any) {
                Alert.alert("Error", err.message || "Failed to submit rating.");
              }
            }}
          >
            <Text style={styles.buttonText}>Submit Rating</Text>
          </TouchableOpacity>
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
  cardText: { fontSize: 16, marginBottom: 5 },
  bold: { fontWeight: "bold" },
  subHeader: { fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#333" },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
    paddingVertical: 10,
  },
  itemName: { fontSize: 16, fontWeight: "600" },
  itemDetails: { fontSize: 14, color: "#555" },
  itemPrice: { fontSize: 16, fontWeight: "bold" },
  button: { padding: 10, borderRadius: 6, alignItems: "center", marginTop: 10 },
  cancelButton: { backgroundColor: "red" },
  invoiceButton: { backgroundColor: "#2563eb" },
  submitButton: { backgroundColor: "#2563eb" },
  buttonText: { color: "white", fontWeight: "bold" },
  mapContainer: { marginVertical: 10 },
  map: { width: "100%", height: 200, borderRadius: 8 },
  starContainer: { flexDirection: "row", marginBottom: 10 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16, color: "red", marginBottom: 10 },
});
