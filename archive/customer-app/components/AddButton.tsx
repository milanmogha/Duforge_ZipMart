import { View, Text, Pressable } from "react-native";
import { useCart, CartProduct } from "@/context/CartContext";

// The signature "ADD → stepper" control used on product cards and detail pages.
export default function AddButton({
  product,
  big = false,
}: {
  product: CartProduct;
  big?: boolean;
}) {
  const { addToCart, updateQuantity, qtyOf } = useCart();
  const qty = qtyOf(product._id);
  const pad = big ? "px-5 py-2.5" : "px-3 py-1.5";
  const txt = big ? "text-base" : "text-xs";

  if (qty === 0) {
    return (
      <Pressable
        onPress={() => addToCart(product, 1)}
        className={`rounded-lg border border-brand-500 bg-brand-50 ${pad}`}
      >
        <Text className={`font-extrabold text-brand-600 ${txt}`}>ADD</Text>
      </Pressable>
    );
  }

  return (
    <View className="flex-row items-center rounded-lg bg-brand-500">
      <Pressable
        onPress={() => updateQuantity(product._id, qty - 1)}
        className={pad}
      >
        <Text className={`font-black text-white ${txt}`}>−</Text>
      </Pressable>
      <Text className={`font-black text-white ${txt}`}>{qty}</Text>
      <Pressable
        onPress={() => updateQuantity(product._id, qty + 1)}
        className={pad}
      >
        <Text className={`font-black text-white ${txt}`}>+</Text>
      </Pressable>
    </View>
  );
}
