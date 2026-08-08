import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { useCart } from "@/context/CartContext";
import { inr } from "@/lib/format";

// Floating "view cart" bar. Sits at the bottom of the content area (above the
// tab bar). Hidden when the cart is empty.
export default function CartBar() {
  const { count, total } = useCart();
  if (count === 0) return null;

  return (
    <View className="absolute inset-x-0 bottom-0 p-3">
      <Pressable
        onPress={() => router.push("/cart")}
        className="flex-row items-center justify-between rounded-2xl bg-brand-500 px-4 py-3"
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <View>
          <Text className="text-xs font-semibold text-brand-100">
            {count} item{count > 1 ? "s" : ""}
          </Text>
          <Text className="text-base font-extrabold text-white">{inr(total)}</Text>
        </View>
        <Text className="text-base font-extrabold text-white">View Cart ›</Text>
      </Pressable>
    </View>
  );
}
