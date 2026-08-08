import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import AddButton from "./AddButton";
import { primaryImage, discountedPrice, inr } from "@/lib/format";

// Dense grocery tile. `wide` makes it fill a grid cell; default is a rail card.
export default function ProductCard({
  product,
  wide = false,
}: {
  product: any;
  wide?: boolean;
}) {
  const disc = product.discount || 0;
  const dp = discountedPrice(product.price, disc);
  const uri = primaryImage(product);

  const cartProduct = {
    _id: product._id,
    name: product.name,
    category: product.category,
    images: product.images,
    price: product.price,
    discount: disc,
    shopkeeperId: product.shopkeeperId,
  };

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/product/[id]", params: { id: product._id } })
      }
      className={`${wide ? "flex-1" : "w-40 mr-3"} rounded-2xl border border-line bg-white p-2.5`}
    >
      <View className="h-28 items-center justify-center overflow-hidden rounded-xl bg-surface">
        {disc > 0 && (
          <View className="absolute left-1 top-1 z-10 rounded-md bg-brand-500 px-1.5 py-0.5">
            <Text className="text-[10px] font-extrabold text-white">{disc}% OFF</Text>
          </View>
        )}
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: "85%", height: "85%" }}
            contentFit="contain"
          />
        ) : (
          <Text className="text-4xl">🛒</Text>
        )}
      </View>

      <Text numberOfLines={2} className="mt-2 h-9 text-[13px] font-semibold leading-4 text-ink">
        {product.name}
      </Text>

      <View className="mt-1.5 flex-row items-center justify-between">
        <View>
          <Text className="text-[13px] font-extrabold text-ink">{inr(dp)}</Text>
          {disc > 0 && (
            <Text className="text-[11px] text-muted line-through">
              {inr(product.price)}
            </Text>
          )}
        </View>
        <AddButton product={cartProduct} />
      </View>
    </Pressable>
  );
}
