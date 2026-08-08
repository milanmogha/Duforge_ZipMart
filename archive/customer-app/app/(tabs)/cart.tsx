import { View, Text, ScrollView, Pressable } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Header from "@/components/Header";
import { Row, EmptyState } from "@/components/ui";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { primaryImage, discountedPrice, inr } from "@/lib/format";

export default function Cart() {
  const { items, total, updateQuantity } = useCart();
  const { isAuthenticated } = useAuth();

  const checkout = () => {
    if (!items.length) return;
    router.push(isAuthenticated ? "/checkout" : "/(auth)/phone");
  };

  if (!items.length) {
    return (
      <View className="flex-1 bg-white">
        <Header title="Cart" back />
        <EmptyState
          emoji="🛒"
          title="Your cart is empty"
          subtitle="Add items to get them delivered in minutes."
          actionLabel="Start shopping"
          onAction={() => router.push("/")}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <Header title="Cart" back />
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 160 }}>
        <View className="mb-3 flex-row items-center rounded-2xl border border-line bg-white p-3">
          <Text className="mr-3 text-2xl">🛵</Text>
          <View>
            <Text className="font-extrabold text-ink">Delivery in 10 minutes</Text>
            <Text className="text-xs text-muted">
              Shipment of {items.length} item{items.length > 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {items.map(({ product, quantity }) => {
          const dp = discountedPrice(product.price, product.discount);
          const uri = primaryImage(product);
          return (
            <View
              key={product._id}
              className="mb-2 flex-row items-center rounded-2xl border border-line bg-white p-2.5"
            >
              <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-surface">
                {uri ? (
                  <Image
                    source={{ uri }}
                    style={{ width: "85%", height: "85%" }}
                    contentFit="contain"
                  />
                ) : (
                  <Text>🛒</Text>
                )}
              </View>
              <View className="flex-1 px-3">
                <Text numberOfLines={1} className="font-semibold text-ink">
                  {product.name}
                </Text>
                <Text className="text-xs text-muted">{product.category}</Text>
                <Text className="font-extrabold text-ink">{inr(dp)}</Text>
              </View>
              <View className="flex-row items-center rounded-lg bg-brand-500">
                <Pressable
                  onPress={() => updateQuantity(product._id, quantity - 1)}
                  className="px-3 py-1.5"
                >
                  <Text className="font-black text-white">−</Text>
                </Pressable>
                <Text className="font-black text-white">{quantity}</Text>
                <Pressable
                  onPress={() => updateQuantity(product._id, quantity + 1)}
                  className="px-3 py-1.5"
                >
                  <Text className="font-black text-white">+</Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        <View className="mt-2 rounded-2xl border border-line bg-white p-4">
          <Text className="mb-2 font-extrabold text-ink">Bill details</Text>
          <Row label="Item total" value={inr(total, 2)} />
          <Text className="mt-2 text-xs text-muted">
            Delivery & platform fees are calculated at checkout.
          </Text>
        </View>
      </ScrollView>

      <SafeAreaView
        edges={["bottom"]}
        className="absolute inset-x-0 bottom-0 border-t border-line bg-white"
      >
        <Pressable
          onPress={checkout}
          className="m-3 flex-row items-center justify-between rounded-2xl bg-brand-500 px-4 py-3.5"
        >
          <Text className="text-base font-extrabold text-white">
            {inr(total)}
          </Text>
          <Text className="text-base font-extrabold text-white">
            Proceed to Checkout ›
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
