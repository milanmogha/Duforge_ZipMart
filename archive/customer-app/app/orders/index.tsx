import { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { Image } from "expo-image";
import { io } from "socket.io-client";
import { router } from "expo-router";
import Header from "@/components/Header";
import { Loading, EmptyState } from "@/components/ui";
import { getCustomerOrders } from "@/lib/api";
import { SOCKET_URL } from "@/lib/theme";
import { primaryImage, inr } from "@/lib/format";
import { registerForNotifications, notify } from "@/lib/notifications";

// literal class strings so the NativeWind compiler picks them up
const STATUS_CLASSES: Record<string, string> = {
  Delivered: "bg-brand-100 text-brand-700",
  Cancelled: "bg-rose-100 text-rose-600",
  Rejected: "bg-gray-200 text-gray-600",
  Pending: "bg-amber-100 text-amber-700",
  Accepted: "bg-blue-100 text-blue-700",
  InTransit: "bg-blue-100 text-blue-700",
};

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    registerForNotifications();
    getCustomerOrders()
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));

    const socket = io(SOCKET_URL);
    socket.on("order-updated", (u: any) => {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === u._id
            ? { ...o, deliveryStatus: u.deliveryStatus, totalAmount: u.totalAmount }
            : o
        )
      );
      const s = u.deliveryStatus?.toLowerCase();
      if (s === "accepted") notify("Order accepted", "Your order has been accepted.");
      else if (s === "intransit") notify("On the way", "Your order is on the way.");
      else if (s === "delivered") notify("Delivered", "Your order has arrived. Enjoy!");
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) return <Loading label="Loading your orders…" />;

  return (
    <View className="flex-1 bg-surface">
      <Header title="My Orders" back />
      {orders.length ? (
        <FlatList
          data={orders}
          keyExtractor={(o) => o._id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item: o }) => {
            const uri = primaryImage(o.items?.[0]?.product);
            const cls = STATUS_CLASSES[o.deliveryStatus] || "bg-gray-200 text-gray-600";
            const [bg, fg] = cls.split(" ");
            return (
              <Pressable
                onPress={() =>
                  router.push({ pathname: "/orders/[id]", params: { id: o._id } })
                }
                className="mb-3 flex-row items-center rounded-2xl border border-line bg-white p-3"
              >
                <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-surface">
                  {uri ? (
                    <Image
                      source={{ uri }}
                      style={{ width: "85%", height: "85%" }}
                      contentFit="contain"
                    />
                  ) : (
                    <Text>📦</Text>
                  )}
                </View>
                <View className="flex-1 px-3">
                  <Text numberOfLines={1} className="text-xs text-muted">
                    #{o._id}
                  </Text>
                  <Text className="font-extrabold text-ink">
                    {inr(o.totalAmount)}
                  </Text>
                  <Text className="text-xs text-muted">
                    {o.orderDate ? new Date(o.orderDate).toLocaleString() : ""}
                  </Text>
                </View>
                <View className={`rounded-full px-2.5 py-1 ${bg}`}>
                  <Text className={`text-[11px] font-bold ${fg}`}>
                    {o.deliveryStatus}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      ) : (
        <EmptyState
          emoji="📦"
          title="No orders yet"
          subtitle="Your orders will show up here."
          actionLabel="Start shopping"
          onAction={() => router.push("/")}
        />
      )}
    </View>
  );
}
