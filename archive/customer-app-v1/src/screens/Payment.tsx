import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackNavigationProp } from "@react-navigation/stack";
import { useCart } from "../context/CartContext";

type RootStackParamList = {
  Orders: undefined;
  Payment: { orderData: any };
};

const API_BASE = "http://10.0.2.2:8000/api";

export default function Payment() {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, "Payment">>();
  const route = useRoute();
  const { clearCart } = useCart();

  const webviewRef = useRef<WebView>(null);
  const handled = useRef(false);          // guarantees single run

  /* ------------------------------------------------------------------ */
  /*  data passed from Checkout screen                                   */
  /* ------------------------------------------------------------------ */
  const { orderData } = route.params as { orderData: any };
  const { items, finalAmount } = orderData;      // finalAmount is in rupees

  /* ------------------------------------------------------------------ */
  /*  local state                                                        */
  /* ------------------------------------------------------------------ */
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);

  const getHeaders = async () => {
    const token = await AsyncStorage.getItem("authToken");
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  };

  /* ------------------------------------------------------------------ */
  /*  1) request Razorpay order when screen mounts                       */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    (async () => {
      try {
        if (!items?.length || finalAmount <= 0) {
          Alert.alert("Error", "Invalid payment data. Returning.");
          navigation.goBack();
          return;
        }
        const headers = await getHeaders();
        const { data } = await axios.post(
          `${API_BASE}/payments/native/create-order`,
          { amount: finalAmount },   // rupees
          { headers }
        );

        setPaymentUrl(data.paymentUrl);     // HTML we will load in WebView
      } catch (err) {
        console.error("Payment init failed:", err);
        Alert.alert("Error", "Could not start payment session.");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------------------ */
  /*  2) handle message coming from Razorpay success handler             */
  /* ------------------------------------------------------------------ */
  const onWebViewMessage = async (event: any) => {
    if (handled.current) return;            // already processed once
    handled.current = true;

    try {
      const data = JSON.parse(event.nativeEvent.data);
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = data as {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      };

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new Error("Missing payment details from Razorpay");
      }

      setFinalizing(true);                  // swap to “Finalizing…” screen
      webviewRef.current?.stopLoading?.();

      const headers = await getHeaders();

      /* 3) verify payment on backend  */
      await axios.post(
        `${API_BASE}/payments/verify-payment`,
        {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          amount: finalAmount,              // rupees
        },
        { headers }
      );

      /* 4) create order record */
      await axios.post(`${API_BASE}/orders/create`, orderData, { headers });

      /* 5) success UI */
      Alert.alert("Success", "Payment & order complete!");
      clearCart();
      navigation.replace("Orders");
    } catch (err) {
      console.error("Post‑payment error:", err);
      Alert.alert(
        "Error",
        "Payment succeeded but we couldn’t finalize your order. Please contact support."
      );
      navigation.goBack();
    }
  };

  /* ------------------------------------------------------------------ */
  /*  3) render states                                                   */
  /* ------------------------------------------------------------------ */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Initializing payment…</Text>
      </View>
    );
  }

  if (finalizing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text>Finalizing your order…</Text>
      </View>
    );
  }

  if (!paymentUrl) {
    return (
      <View style={styles.center}>
        <Text>Unable to load payment page.</Text>
      </View>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  4) live WebView                                                    */
  /* ------------------------------------------------------------------ */
  return (
    <WebView
      ref={webviewRef}
      originWhitelist={["*"]}
      source={{ uri: paymentUrl }}
      startInLoadingState
      style={styles.webview}
      javaScriptEnabled
      onMessage={onWebViewMessage}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f3f4f6",
  },
  webview: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
