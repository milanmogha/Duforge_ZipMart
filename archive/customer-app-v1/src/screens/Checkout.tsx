import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { useCart } from "../context/CartContext";
import {
  createOrder,
  applyCoupon,
  getShopById,
  getDrivingDistanceInKm,
} from "../services/api";
import axios from "axios";

type RootStackParamList = {
  Orders: undefined;
  Payment: { orderData: any };
};

const GOOGLE_MAPS_API_KEY = "AIzaSyBsN_Z9IAY3R9zacVCc8SUEFugDEMxc3wA";

const Checkout: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const { cartItems, clearCart } = useCart();

  // customer info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // map & address
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [formattedAddress, setFormattedAddress] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(true);

  // coupon
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);

  // fees & totals
  const [totalAmount, setTotalAmount] = useState(0);
  const [deliveryDistance, setDeliveryDistance] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [platformCharge, setPlatformCharge] = useState(0);
  const [deliveryBoyEarning, setDeliveryBoyEarning] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  const [paymentMethodOption, setPaymentMethodOption] =
    useState<"COD" | "Razorpay">("Razorpay");

  // 1) cart subtotal
  useEffect(() => {
    const sum = cartItems.reduce((acc, itm) => {
      const d = itm.product.discount || 0;
      const price = itm.product.price - (itm.product.price * d) / 100;
      return acc + price * itm.quantity;
    }, 0);
    setTotalAmount(parseFloat(sum.toFixed(2)));
  }, [cartItems]);

  // 2) recalc fees & final whenever subtotal, coupon or distance change
  useEffect(() => {
    const pf = totalAmount < 1000 ? 5 : 0;
    const df = totalAmount < 1000 ? deliveryDistance * 8 : 0;
    setPlatformCharge(pf);
    setDeliveryCharge(parseFloat(df.toFixed(2)));

    const earn = parseFloat((deliveryDistance * 8).toFixed(2));
    setDeliveryBoyEarning(earn);

    const sub = Math.max(totalAmount - couponDiscount, 0);
    const fin = sub + pf + df;
    setFinalAmount(parseFloat(fin.toFixed(2)));
  }, [totalAmount, couponDiscount, deliveryDistance]);

  // 3) fetch user location + address
  useEffect(() => {
    (async () => {
      const { status } =
        await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Allow location access."
        );
        setLoadingLocation(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const point = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setSelectedLocation(point);
      const addr = await reverseGeocode(
        point.latitude,
        point.longitude
      );
      setFormattedAddress(addr);
      setLoadingLocation(false);
    })();
  }, []);

  // 4) compute driving distance whenever location or cart changes
  useEffect(() => {
    (async () => {
      if (!selectedLocation || cartItems.length === 0)
        return;
      const shopId = cartItems[0].product.shopkeeperId;
      if (!shopId) return;

      const shop = await getShopById(shopId);
      if (!shop?.locationCoordinates) return;

      const km = await getDrivingDistanceInKm(
        shop.locationCoordinates.latitude,
        shop.locationCoordinates.longitude,
        selectedLocation.latitude,
        selectedLocation.longitude
      );
      setDeliveryDistance(km);
    })();
  }, [selectedLocation, cartItems]);

  // helper to reverse-geocode
  const reverseGeocode = async (
    lat: number,
    lng: number
  ) => {
    try {
      const res = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      return (
        res.data.results?.[0]?.formatted_address ??
        "Address not found"
      );
    } catch {
      return "Address not found";
    }
  };

  // 5) coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      return Alert.alert("Error", "Enter a coupon code.");
    }
    if (totalAmount < 1000) {
      return Alert.alert(
        "Error",
        "Coupons only valid on ≥ ₹1000."
      );
    }
    try {
      const { discount } = await applyCoupon(
        couponCode,
        totalAmount
      );
      setCouponDiscount(parseFloat(discount.toFixed(2)));
      Alert.alert("Success", "Coupon applied!");
    } catch {
      Alert.alert("Error", "Failed to apply coupon.");
    }
  };

  // 6) place order
  const handleCreateOrder = async () => {
    if (
      !customerName.trim() ||
      !customerPhone.trim() ||
      !selectedLocation
    ) {
      return Alert.alert("Error", "Complete all fields.");
    }
    const orderData = {
      items: cartItems.map((itm) => ({
        product: itm.product._id,
        quantity: itm.quantity,
        price: parseFloat(
          (
            itm.product.price -
            (itm.product.price *
              (itm.product.discount || 0)) /
              100
          ).toFixed(2)
        ),
      })),
      totalAmount: parseFloat(
        (totalAmount - couponDiscount).toFixed(2)
      ),
      discountAmount: couponDiscount,
      deliveryAddress: formattedAddress,
      paymentMethod:
        paymentMethodOption === "COD"
          ? "Cash On Delivery"
          : "Razorpay",
      couponCode: couponCode || undefined,
      customerName,
      customerPhone,
      deliveryCoords: selectedLocation,
      platformFee: platformCharge,
      deliveryFee: deliveryCharge,
      deliveryBoyEarning,
      finalAmount,
    };

    try {
      if (paymentMethodOption === "COD") {
        await createOrder(orderData);
        Alert.alert("Success", "Order placed!");
        clearCart();
        navigation.navigate("Orders");
      } else {
        navigation.navigate("Payment", { orderData });
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create order.");
    }
  };

  // Always prefix base64 images properly
  const getImageUri = (prod: any) => {
    const img = prod.images?.image1;
    if (img?.data && img.contentType) {
      return img.data.startsWith("data:")
        ? img.data
        : `data:${img.contentType};base64,${img.data}`;
    }
    return "https://via.placeholder.com/150";
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.summaryItem}>
      <Image
        source={{ uri: getImageUri(item.product) }}
        style={styles.summaryImage}
      />
      <View>
        <Text style={styles.summaryName}>
          {item.product.name}
        </Text>
        <Text style={styles.summaryPrice}>
          ₹
          {(
            item.product.price -
            (item.product.price *
              (item.product.discount || 0)) /
              100
          ).toFixed(2)}{" "}
          x {item.quantity}
        </Text>
      </View>
    </View>
  );

  const region: Region | undefined = selectedLocation
    ? {
        ...selectedLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : undefined;

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
    >
      <Text style={styles.header}>Checkout</Text>

      {/* Customer */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Customer Details
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={customerName}
          onChangeText={setCustomerName}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone"
          keyboardType="phone-pad"
          value={customerPhone}
          onChangeText={setCustomerPhone}
        />
      </View>

      {/* Location */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Delivery Location
        </Text>
        {loadingLocation ? (
          <ActivityIndicator
            size="large"
            color="#2563eb"
          />
        ) : (
          <MapView
            style={styles.map}
            region={region}
            onPress={(e) => {
              const {
                latitude,
                longitude,
              } = e.nativeEvent.coordinate;
              setSelectedLocation({
                latitude,
                longitude,
              });
              reverseGeocode(
                latitude,
                longitude
              ).then(setFormattedAddress);
            }}
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                draggable
                onDragEnd={(e) => {
                  const {
                    latitude,
                    longitude,
                  } = e.nativeEvent.coordinate;
                  setSelectedLocation({
                    latitude,
                    longitude,
                  });
                  reverseGeocode(
                    latitude,
                    longitude
                  ).then(setFormattedAddress);
                }}
              />
            )}
          </MapView>
        )}
        <TextInput
          style={[styles.input, { marginTop: 8 }]}
          placeholder="Flat, building, etc."
          value={formattedAddress}
          onChangeText={setFormattedAddress}
        />
      </View>

      {/* Coupon */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Apply Coupon
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Code"
          value={couponCode}
          onChangeText={setCouponCode}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleApplyCoupon}
        >
          <Text style={styles.buttonText}>Apply</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Order Summary
        </Text>
        <FlatList
          data={cartItems}
          keyExtractor={(i) => i.product._id}
          renderItem={renderItem}
          scrollEnabled={false}
        />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Subtotal:
          </Text>
          <Text style={styles.summaryValue}>
            ₹{totalAmount.toFixed(2)}
          </Text>
        </View>
        {couponDiscount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Discount:
            </Text>
            <Text style={styles.summaryValue}>
              -₹{couponDiscount.toFixed(2)}
            </Text>
          </View>
        )}
        {totalAmount < 1000 && (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Platform Fee:
              </Text>
              <Text style={styles.summaryValue}>
                ₹{platformCharge.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Delivery Fee:
              </Text>
              <Text style={styles.summaryValue}>
                ₹{deliveryCharge.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Rider Earning:
              </Text>
              <Text style={styles.summaryValue}>
                ₹{deliveryBoyEarning.toFixed(2)}
              </Text>
            </View>
          </>
        )}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Total:
          </Text>
          <Text style={styles.summaryValue}>
            ₹{finalAmount.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Payment */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Payment Method
        </Text>
        <View style={styles.paymentOptions}>
          {(["COD", "Razorpay"] as const).map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.paymentButton,
                paymentMethodOption === opt &&
                  styles.selectedPayment,
              ]}
              onPress={() => setPaymentMethodOption(opt)}
            >
              <Text
                style={[
                  styles.paymentText,
                  paymentMethodOption === opt &&
                    styles.selectedPaymentText,
                ]}
              >
                {opt === "COD"
                  ? "Cash On Delivery"
                  : "Razorpay"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Place */}
      <TouchableOpacity
        style={styles.placeOrderButton}
        onPress={handleCreateOrder}
      >
        <Text style={styles.placeOrderButtonText}>
          {paymentMethodOption === "COD"
            ? "Place Order"
            : `Pay ₹${finalAmount.toFixed(2)}`}
        </Text>
      </TouchableOpacity>

      {/* Back */}
      <TouchableOpacity
        style={styles.bottomBackButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.bottomBackButtonText}>
          Back
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default Checkout;

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    backgroundColor: "#f3f4f6",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#374151",
    textAlign: "center",
    marginVertical: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderBottomWidth: 1,
    paddingVertical: 6,
    marginBottom: 12,
  },
  map: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 12,
  },
  summaryName: {
    fontSize: 16,
    fontWeight: "500",
  },
  summaryPrice: {
    fontSize: 14,
    color: "#6b7280",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  paymentOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  paymentButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 5,
  },
  selectedPayment: {
    backgroundColor: "#2563eb",
  },
  paymentText: {
    color: "#2563eb",
    fontWeight: "600",
  },
  selectedPaymentText: {
    color: "#fff",
  },
  placeOrderButton: {
    backgroundColor: "#22c55e",
    padding: 14,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  placeOrderButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  bottomBackButton: {
    marginTop: 16,
    alignItems: "center",
  },
  bottomBackButtonText: {
    color: "#7091e6",
    fontWeight: "600",
  },
});
