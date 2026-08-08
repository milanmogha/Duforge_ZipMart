import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useLocalSearchParams } from "expo-router";
import Header from "@/components/Header";
import { Card, Row, Loading } from "@/components/ui";
import { getOrderById, cancelOrder, submitRating } from "@/lib/api";
import { inr } from "@/lib/format";

const invoiceHtml = (o: any) => {
  const rows = (o.items || [])
    .map(
      (it: any, i: number) =>
        `<tr><td>${i + 1}</td><td>${it.product?.name ?? ""}</td><td>₹${(
          it.product?.price ?? 0
        ).toFixed(2)}</td><td>${it.quantity}</td><td>₹${(it.price ?? 0).toFixed(
          2
        )}</td></tr>`
    )
    .join("");
  return `<html><head><meta charset="utf-8"><style>body{font-family:Arial;padding:24px}h1{color:#0C831F}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f3f4f6}</style></head><body>
  <h1>ZipMart</h1><h3>Tax Invoice</h3>
  <p><b>Order ID:</b> ${o._id}<br/><b>Date:</b> ${new Date(
    o.orderDate
  ).toLocaleString()}<br/><b>Customer:</b> ${o.customerName ?? ""}<br/><b>Address:</b> ${
    o.deliveryAddress ?? ""
  }</p>
  <table><thead><tr><th>#</th><th>Item</th><th>MRP</th><th>Qty</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
  <h3 style="text-align:right">Total: ₹${(o.totalAmount ?? 0).toFixed(2)}</h3>
  <p style="text-align:center">Thank you for shopping with ZipMart!</p></body></html>`;
};

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [riderLoc, setRiderLoc] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    getOrderById(id)
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false));
    AsyncStorage.getItem("deliveryBoyLastLocation")
      .then((v) => v && setRiderLoc(JSON.parse(v)))
      .catch(() => {});
  }, [id]);

  if (loading) return <Loading />;
  if (!order)
    return (
      <View className="flex-1 bg-white">
        <Header title="Order" back />
        <Text className="mt-10 text-center text-muted">Order not found.</Text>
      </View>
    );

  const status = order.deliveryStatus;
  const canCancel = status === "Pending" || status === "Accepted";
  const canRate = status === "Delivered";
  const trackable =
    (status === "Accepted" || status === "InTransit") &&
    (riderLoc || order.shopCoords || order.deliveryCoords);
  const center =
    riderLoc || order.shopCoords || order.deliveryCoords || null;

  const downloadInvoice = async () => {
    try {
      const { uri } = await Print.printToFileAsync({ html: invoiceHtml(order) });
      if (await Sharing.isAvailableAsync())
        await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
      else Alert.alert("Saved", "Invoice generated in your documents.");
    } catch {
      Alert.alert("Error", "Could not generate the invoice.");
    }
  };

  const doCancel = () =>
    Alert.alert("Cancel order", "Are you sure?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, cancel",
        style: "destructive",
        onPress: async () => {
          try {
            setOrder(await cancelOrder(order._id));
            Alert.alert("Order cancelled.");
          } catch (e: any) {
            Alert.alert("Error", e?.message ?? "Failed to cancel.");
          }
        },
      },
    ]);

  const sendRating = async () => {
    if (rating <= 0) return Alert.alert("Please pick a star rating.");
    try {
      await submitRating({ orderId: order._id, rating, comment: "" });
      Alert.alert("Thanks!", "Your rating was submitted.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to submit rating.");
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <Header title="Order details" back />
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
        <Card>
          <Row label="Order ID" value={`#${order._id}`} />
          <Row label="Status" value={status || "—"} bold />
          <Row label="Payment" value={order.paymentMethod || "—"} />
          <Row label="Placed" value={new Date(order.orderDate).toLocaleString()} />
          <Row label="Address" value={order.deliveryAddress || "—"} />
          <View className="my-2 h-px bg-line" />
          <Row label="Total" value={inr(order.totalAmount, 2)} bold />
          {canCancel ? (
            <Pressable
              onPress={doCancel}
              className="mt-3 rounded-xl border border-danger py-2.5"
            >
              <Text className="text-center font-extrabold text-danger">
                Cancel order
              </Text>
            </Pressable>
          ) : null}
        </Card>

        <Card title="Items">
          {(order.items || []).map((it: any, i: number) => (
            <View
              key={i}
              className="flex-row items-center justify-between border-b border-line py-2"
            >
              <View className="flex-1 pr-3">
                <Text className="font-semibold text-ink">
                  {it.product?.name}
                </Text>
                <Text className="text-xs text-muted">Qty: {it.quantity}</Text>
              </View>
              <Text className="font-extrabold text-ink">{inr(it.price)}</Text>
            </View>
          ))}
          {status === "Delivered" ? (
            <Pressable
              onPress={downloadInvoice}
              className="mt-3 rounded-xl bg-brand-500 py-2.5"
            >
              <Text className="text-center font-extrabold text-white">
                Download invoice
              </Text>
            </Pressable>
          ) : null}
        </Card>

        {trackable && center ? (
          <Card title="Track your order">
            <View className="overflow-hidden rounded-xl" style={{ height: 200 }}>
              <MapView
                style={{ flex: 1 }}
                region={{ ...center, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
              >
                {riderLoc ? (
                  <Marker coordinate={riderLoc} title="Rider" pinColor="red" />
                ) : null}
                {order.shopCoords ? (
                  <Marker coordinate={order.shopCoords} title="Store" pinColor="blue" />
                ) : null}
                {order.deliveryCoords ? (
                  <Marker
                    coordinate={order.deliveryCoords}
                    title="You"
                    pinColor="green"
                  />
                ) : null}
              </MapView>
            </View>
          </Card>
        ) : null}

        {canRate ? (
          <Card title="Rate your order">
            <View className="flex-row">
              {[1, 2, 3, 4, 5].map((s) => (
                <Pressable key={s} onPress={() => setRating(s)} className="pr-1">
                  <Text className="text-3xl">{s <= rating ? "⭐" : "☆"}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={sendRating}
              className="mt-3 rounded-xl bg-brand-500 py-2.5"
            >
              <Text className="text-center font-extrabold text-white">
                Submit rating
              </Text>
            </Pressable>
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}
