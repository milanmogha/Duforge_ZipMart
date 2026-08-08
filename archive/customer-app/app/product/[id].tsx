import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { getProductById, getShopById, getRatingsByProduct } from "@/lib/api";
import { imageUri, discountedPrice, inr } from "@/lib/format";
import AddButton from "@/components/AddButton";
import Header from "@/components/Header";
import { Loading } from "@/components/ui";

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [active, setActive] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const p = await getProductById(id);
        setProduct(p);
        const first = imageUri(
          p?.images?.image1 ?? p?.images?.[Object.keys(p?.images || {})[0]]
        );
        setActive(first);
        if (p?.shopkeeperId)
          getShopById(p.shopkeeperId).then(setShop).catch(() => {});
        getRatingsByProduct(id).then(setRatings).catch(() => {});
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <Loading />;
  if (!product)
    return (
      <View className="flex-1 bg-white">
        <Header title="Product" back />
        <Text className="mt-10 text-center text-muted">Product not found.</Text>
      </View>
    );

  const disc = product.discount || 0;
  const dp = discountedPrice(product.price, disc);
  const thumbs = Object.values(product.images || {})
    .map((im: any) => imageUri(im))
    .filter(Boolean) as string[];
  const avg = ratings.length
    ? (ratings.reduce((a, r) => a + r.rating, 0) / ratings.length).toFixed(1)
    : null;

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
    <View className="flex-1 bg-white">
      <Header title={product.category || "Product"} back />
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View className="h-72 items-center justify-center bg-surface">
          {active ? (
            <Image
              source={{ uri: active }}
              style={{ width: "75%", height: "90%" }}
              contentFit="contain"
            />
          ) : (
            <Text className="text-6xl">🛒</Text>
          )}
          {disc > 0 ? (
            <View className="absolute left-3 top-3 rounded-lg bg-brand-500 px-2 py-1">
              <Text className="text-xs font-extrabold text-white">
                {disc}% OFF
              </Text>
            </View>
          ) : null}
        </View>

        {thumbs.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ padding: 12, gap: 8 }}
          >
            {thumbs.map((u, i) => (
              <Pressable
                key={i}
                onPress={() => setActive(u)}
                className={`h-16 w-16 items-center justify-center rounded-xl border bg-surface ${
                  active === u ? "border-brand-500" : "border-line"
                }`}
              >
                <Image
                  source={{ uri: u }}
                  style={{ width: "80%", height: "80%" }}
                  contentFit="contain"
                />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View className="px-4 pt-3">
          <Text className="text-xl font-black text-ink">{product.name}</Text>
          <Text className="mt-0.5 text-sm text-muted">{product.category}</Text>

          <View className="mt-3 flex-row items-center">
            <Text className="text-2xl font-black text-ink">{inr(dp)}</Text>
            {disc > 0 ? (
              <Text className="ml-2 text-base text-muted line-through">
                {inr(product.price)}
              </Text>
            ) : null}
            {avg ? (
              <View className="ml-auto rounded-lg bg-brand-50 px-2 py-1">
                <Text className="text-xs font-bold text-brand-600">⭐ {avg}</Text>
              </View>
            ) : null}
          </View>

          {product.details ? (
            <Text className="mt-4 text-sm leading-5 text-ink">
              {product.details}
            </Text>
          ) : null}

          {shop ? (
            <View className="mt-5 rounded-2xl border border-line bg-surface p-4">
              <Text className="font-extrabold text-ink">Sold by</Text>
              <Text className="mt-1 text-sm text-ink">{shop.shopName}</Text>
              {shop.location ? (
                <Text className="text-xs text-muted">{shop.location}</Text>
              ) : null}
            </View>
          ) : null}

          {ratings.length > 0 ? (
            <View className="mt-5">
              <Text className="mb-2 font-extrabold text-ink">
                Ratings & reviews
              </Text>
              {ratings.slice(0, 5).map((r, i) => (
                <View key={i} className="mb-2 rounded-xl border border-line p-3">
                  <Text className="text-sm font-bold text-brand-600">
                    ⭐ {r.rating}/5
                  </Text>
                  {r.review || r.comment ? (
                    <Text className="mt-1 text-sm text-ink">
                      {r.review || r.comment}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <SafeAreaView
        edges={["bottom"]}
        className="absolute inset-x-0 bottom-0 border-t border-line bg-white"
      >
        <View className="flex-row items-center justify-between px-4 py-3">
          <View>
            <Text className="text-lg font-black text-ink">{inr(dp)}</Text>
            {disc > 0 ? (
              <Text className="text-xs text-muted line-through">
                {inr(product.price)}
              </Text>
            ) : null}
          </View>
          <AddButton product={cartProduct} big />
        </View>
      </SafeAreaView>
    </View>
  );
}
