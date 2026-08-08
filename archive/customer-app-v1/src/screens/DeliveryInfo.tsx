import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useNavigation } from "@react-navigation/native";
import { RouteProp, useRoute } from "@react-navigation/native";

// Define expected route parameters
type RouteParams = {
  cartItems?: any[];
  totalPrice?: number;
};

const DeliveryInfo: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const { cartItems = [], totalPrice = 0 } = route.params || {};

  const center = { latitude: 40.7128, longitude: -74.006 }; // Example coordinates

  return (
    <View style={styles.container}>
      {/* Map Section */}
      <View style={styles.mapContainer}>
        <MapView style={styles.map} initialRegion={{ ...center, latitudeDelta: 0.01, longitudeDelta: 0.01 }}>
          <Marker coordinate={center} />
        </MapView>
      </View>

      {/* Delivery Info Section */}
      <View style={styles.infoContainer}>
        {/* Estimated Time */}
        <View style={styles.card}>
          <Text style={styles.boldText}>Estimated Time: <Text style={styles.highlightText}>5 min</Text></Text>
        </View>

        {/* Delivery Partner Info */}
        <View style={styles.card}>
          <Text style={styles.boldText}>Delivery Partner:</Text>
          <Text style={styles.partnerName}>John Doe</Text>
          <Text style={styles.rating}>⭐ 4.8</Text>
        </View>

        {/* Bill Summary */}
        <View style={styles.card}>
          <Text style={styles.billHeader}>Bill Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billText}>Item Total</Text>
            <Text style={styles.billText}>₹{totalPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billText}>Platform Fee</Text>
            <Text style={styles.billText}>₹30</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billText}>Delivery Fee</Text>
            <Text style={styles.billText}>₹30</Text>
          </View>
          <View style={styles.billRowTotal}>
            <Text style={styles.totalText}>Total Payable</Text>
            <Text style={styles.totalText}>₹{(totalPrice + 30 + 30).toFixed(2)}</Text>
          </View>
        </View>

        {/* Back to Home Button */}
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Landing" as never)}>
          <Text style={styles.buttonText}>Back To Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/** Styles */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "#f3f4f6",
  },
  mapContainer: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  boldText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
  },
  highlightText: {
    color: "#2563eb",
  },
  partnerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  rating: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "right",
  },
  billHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 5,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  billText: {
    fontSize: 16,
    color: "#4b5563",
  },
  billRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    borderTopWidth: 1,
    paddingTop: 10,
    borderColor: "#ddd",
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default DeliveryInfo;
