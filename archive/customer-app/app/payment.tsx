import { useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, router } from "expo-router";
import { createRazorpayOrder, verifyPayment, createOrder } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { colors } from "@/lib/theme";

const Center = ({ label }: { label: string }) => (
  <View className="flex-1 items-center justify-center bg-white px-8">
    <ActivityIndicator size="large" color={colors.brand} />
    <Text className="mt-3 text-center text-muted">{label}</Text>
  </View>
);

export default function Payment() {
  const { order } = useLocalSearchParams<{ order: string }>();
  const orderData = order ? JSON.parse(order) : null;
  const { clearCart } = useCart();
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const handled = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        if (!orderData || orderData.finalAmount <= 0) {
          Alert.alert("Invalid payment data.");
          router.back();
          return;
        }
        const r = await createRazorpayOrder(orderData.finalAmount);
        setUrl(r.paymentUrl ?? null);
      } catch {
        Alert.alert("Error", "Could not start the payment session.");
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onMessage = async (e: any) => {
    if (handled.current) return;
    handled.current = true;
    try {
      const d = JSON.parse(e.nativeEvent.data);
      if (
        !d.razorpay_order_id ||
        !d.razorpay_payment_id ||
        !d.razorpay_signature
      )
        throw new Error("Missing payment details");
      setFinalizing(true);
      await verifyPayment({ ...d, amount: orderData.finalAmount });
      await createOrder(orderData);
      clearCart();
      Alert.alert("Success", "Payment complete — your order is confirmed!");
      router.replace("/orders");
    } catch {
      Alert.alert(
        "Error",
        "Payment succeeded but the order couldn't be finalized. Please contact support."
      );
      router.back();
    }
  };

  if (loading) return <Center label="Starting secure payment…" />;
  if (finalizing) return <Center label="Finalizing your order…" />;
  if (!url) return <Center label="Unable to load the payment page." />;

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ uri: url }}
      onMessage={onMessage}
      startInLoadingState
      javaScriptEnabled
      style={{ flex: 1 }}
    />
  );
}
