import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { router } from "expo-router";
import Header from "@/components/Header";
import { Card, Field, Row } from "@/components/ui";
import { useCart } from "@/context/CartContext";
import {
  createOrder,
  applyCoupon,
  getShopById,
  drivingDistanceKm,
  reverseGeocode,
} from "@/lib/api";
import { discountedPrice, inr } from "@/lib/format";
import { colors } from "@/lib/theme";

export default function Checkout() {
  const { items, clearCart } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loc, setLoc] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [address, setAddress] = useState("");
  const [loadingLoc, setLoadingLoc] = useState(true);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [distance, setDistance] = useState(0);
  const [method, setMethod] = useState<"COD" | "Razorpay">("Razorpay");
  const [placing, setPlacing] = useState(false);

  const subtotal = items.reduce(
    (s, i) =>
      s + discountedPrice(i.product.price, i.product.discount) * i.quantity,
    0
  );
  const platformFee = subtotal < 1000 ? 5 : 0;
  const deliveryFee = subtotal < 1000 ? +(distance * 8).toFixed(2) : 0;
  const finalAmount = +(
    Math.max(subtotal - discount, 0) +
    platformFee +
    deliveryFee
  ).toFixed(2);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLoadingLoc(false);
        return;
      }
      const p = await Location.getCurrentPositionAsync({});
      const point = {
        latitude: p.coords.latitude,
        longitude: p.coords.longitude,
      };
      setLoc(point);
      reverseGeocode(point.latitude, point.longitude).then(setAddress);
      setLoadingLoc(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!loc || !items.length) return;
      const shopId = items[0].product.shopkeeperId;
      if (!shopId) return;
      const shop = await getShopById(shopId).catch(() => null);
      const c = shop?.locationCoordinates;
      if (c)
        setDistance(
          await drivingDistanceKm(c.latitude, c.longitude, loc.latitude, loc.longitude)
        );
    })();
  }, [loc, items]);

  const useCoupon = async () => {
    if (!coupon.trim()) return;
    if (subtotal < 1000) return Alert.alert("Coupons apply on orders ≥ ₹1000.");
    try {
      const { discount: d } = await applyCoupon(coupon, subtotal);
      setDiscount(+d.toFixed(2));
      Alert.alert("Coupon applied!");
    } catch {
      Alert.alert("Invalid coupon.");
    }
  };

  const setPin = (c: { latitude: number; longitude: number }) => {
    setLoc(c);
    reverseGeocode(c.latitude, c.longitude).then(setAddress);
  };

  const place = async () => {
    if (!name.trim() || !phone.trim() || !loc)
      return Alert.alert("Please complete your details and pick a location.");
    const orderData = {
      items: items.map((i) => ({
        product: i.product._id,
        quantity: i.quantity,
        price: +discountedPrice(i.product.price, i.product.discount).toFixed(2),
      })),
      totalAmount: +(subtotal - discount).toFixed(2),
      discountAmount: discount,
      deliveryAddress: address,
      paymentMethod: method === "COD" ? "Cash On Delivery" : "Razorpay",
      couponCode: coupon || undefined,
      customerName: name,
      customerPhone: phone,
      deliveryCoords: loc,
      platformFee,
      deliveryFee,
      finalAmount,
    };
    setPlacing(true);
    try {
      if (method === "COD") {
        await createOrder(orderData);
        clearCart();
        Alert.alert("Order placed!", "Your order is on its way.");
        router.replace("/orders");
      } else {
        router.push({
          pathname: "/payment",
          params: { order: JSON.stringify(orderData) },
        });
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to place order.");
    } finally {
      setPlacing(false);
    }
  };

  const region: Region | undefined = loc
    ? { ...loc, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : undefined;

  return (
    <View className="flex-1 bg-surface">
      <Header title="Checkout" back />
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 150 }}>
        <Card title="Delivery details">
          <Field placeholder="Full name" value={name} onChangeText={setName} />
          <Field
            placeholder="Phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </Card>

        <Card title="Delivery location">
          {loadingLoc ? (
            <ActivityIndicator color={colors.brand} />
          ) : region ? (
            <View className="mb-2 overflow-hidden rounded-xl" style={{ height: 180 }}>
              <MapView
                style={{ flex: 1 }}
                region={region}
                onPress={(e) => setPin(e.nativeEvent.coordinate)}
              >
                {loc ? (
                  <Marker
                    coordinate={loc}
                    draggable
                    onDragEnd={(e) => setPin(e.nativeEvent.coordinate)}
                  />
                ) : null}
              </MapView>
            </View>
          ) : (
            <Text className="mb-2 text-sm text-muted">
              Location unavailable — enter your address below.
            </Text>
          )}
          <Field
            placeholder="Flat / building / area"
            value={address}
            onChangeText={setAddress}
          />
        </Card>

        <Card title="Apply coupon">
          <View className="flex-row">
            <View className="flex-1">
              <Field
                placeholder="Coupon code"
                value={coupon}
                onChangeText={setCoupon}
                autoCapitalize="characters"
              />
            </View>
            <Pressable
              onPress={useCoupon}
              className="ml-2 mb-2 items-center justify-center rounded-xl bg-brand-500 px-4"
            >
              <Text className="font-extrabold text-white">Apply</Text>
            </Pressable>
          </View>
        </Card>

        <Card title="Bill details">
          <Row label="Item total" value={inr(subtotal, 2)} />
          {discount > 0 ? (
            <Row label="Coupon discount" value={`-${inr(discount, 2)}`} />
          ) : null}
          {subtotal < 1000 ? (
            <>
              <Row label="Platform fee" value={inr(platformFee, 2)} />
              <Row
                label={`Delivery (${distance.toFixed(1)} km)`}
                value={inr(deliveryFee, 2)}
              />
            </>
          ) : null}
          <View className="my-2 h-px bg-line" />
          <Row label="To pay" value={inr(finalAmount, 2)} bold />
        </Card>

        <Card title="Payment method">
          <View className="flex-row" style={{ gap: 8 }}>
            {(["Razorpay", "COD"] as const).map((opt) => (
              <Pressable
                key={opt}
                onPress={() => setMethod(opt)}
                className={`flex-1 items-center rounded-xl border py-3 ${
                  method === opt
                    ? "border-brand-500 bg-brand-50"
                    : "border-line bg-white"
                }`}
              >
                <Text
                  className={`font-bold ${
                    method === opt ? "text-brand-600" : "text-ink"
                  }`}
                >
                  {opt === "COD" ? "Cash on Delivery" : "Pay online"}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>
      </ScrollView>

      <SafeAreaView
        edges={["bottom"]}
        className="absolute inset-x-0 bottom-0 border-t border-line bg-white"
      >
        <Pressable
          onPress={place}
          disabled={placing}
          className="m-3 items-center justify-center rounded-2xl bg-brand-500 py-3.5"
        >
          {placing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-extrabold text-white">
              {method === "COD" ? "Place Order" : `Pay ${inr(finalAmount)}`}
            </Text>
          )}
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
