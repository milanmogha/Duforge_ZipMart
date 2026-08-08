import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import Header from "@/components/Header";
import { EmptyState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

export default function Account() {
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-white">
        <Header title="Account" />
        <EmptyState
          emoji="👋"
          title="Welcome to ZipMart"
          subtitle="Log in to track orders and manage your account."
          actionLabel="Log in / Sign up"
          onAction={() => router.push("/(auth)/phone")}
        />
      </View>
    );
  }

  const items = [
    { icon: "📦", label: "My Orders", onPress: () => router.push("/orders") },
    {
      icon: "💬",
      label: "Customer Support",
      onPress: () => router.push("/support"),
    },
    {
      icon: "ℹ️",
      label: "About ZipMart",
      onPress: () =>
        Alert.alert("ZipMart", "Instant grocery delivery, in minutes."),
    },
  ];

  const confirmLogout = () =>
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);

  return (
    <View className="flex-1 bg-surface">
      <Header title="Account" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="mb-4 flex-row items-center rounded-2xl border border-line bg-white p-4">
          <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-brand-50">
            <Text className="text-xl">👤</Text>
          </View>
          <View>
            <Text className="font-extrabold text-ink">
              {user?.name || "ZipMart Customer"}
            </Text>
            <Text className="text-sm text-muted">{user?.phone || ""}</Text>
          </View>
        </View>

        <View className="overflow-hidden rounded-2xl border border-line bg-white">
          {items.map((it, idx) => (
            <Pressable
              key={it.label}
              onPress={it.onPress}
              className={`flex-row items-center px-4 py-4 ${
                idx > 0 ? "border-t border-line" : ""
              }`}
            >
              <Text className="mr-3 text-lg">{it.icon}</Text>
              <Text className="flex-1 font-semibold text-ink">{it.label}</Text>
              <Text className="text-muted">›</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={confirmLogout}
          className="mt-5 rounded-2xl border border-danger py-3.5"
        >
          <Text className="text-center font-extrabold text-danger">Log out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
