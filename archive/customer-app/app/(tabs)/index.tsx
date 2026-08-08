import { useEffect, useState } from "react";
import { View, Text, ScrollView, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Location from "expo-location";
import { getProductsByLocation, fetchBanners } from "@/lib/api";
import { CATEGORIES, CATEGORY_NAMES } from "@/constants/categories";
import ProductCard from "@/components/ProductCard";
import CategoryTile from "@/components/CategoryTile";
import SearchBar from "@/components/SearchBar";
import Banner from "@/components/Banner";
import CartBar from "@/components/CartBar";
import { Loading, EmptyState } from "@/components/ui";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [outOfRange, setOutOfRange] = useState(false);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("your area");

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setOutOfRange(true);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        Location.reverseGeocodeAsync(loc.coords)
          .then((g) => g[0]?.city && setCity(g[0].city))
          .catch(() => {});
        const nearby = await getProductsByLocation(
          loc.coords.latitude,
          loc.coords.longitude
        );
        if (nearby?.length) setProducts(nearby);
        else setOutOfRange(true);
      } catch {
        setOutOfRange(true);
      } finally {
        setLoading(false);
      }
    })();
    fetchBanners().then(setBanners).catch(() => {});
  }, []);

  const filtered = query
    ? products.filter((p) =>
        p.name?.toLowerCase().includes(query.toLowerCase())
      )
    : products;

  const groups = CATEGORY_NAMES.map((name) => ({
    name,
    items: filtered.filter(
      (p) => p.category?.trim().toLowerCase() === name.toLowerCase()
    ),
  })).filter((g) => g.items.length);

  if (loading) return <Loading label="Finding stores near you…" />;

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="bg-brand-500">
        <View className="px-4 pb-3 pt-1">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-xs font-semibold text-brand-100">
                Delivery in
              </Text>
              <Text className="text-xl font-black text-white">10 minutes</Text>
              <Text numberOfLines={1} className="text-xs text-brand-100">
                📍 {city}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/account")}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
            >
              <Text className="text-lg">👤</Text>
            </Pressable>
          </View>
          <View className="mt-3">
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholderItems={CATEGORY_NAMES}
            />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {outOfRange ? (
          <View className="mt-24">
            <EmptyState
              emoji="🛵"
              title="Coming soon to your area!"
              subtitle="We're not delivering here yet — but we're expanding fast."
            />
          </View>
        ) : (
          <>
            <Banner banners={banners} />

            <View className="mt-4 flex-row flex-wrap px-3">
              {CATEGORIES.slice(0, 8).map((c) => (
                <CategoryTile key={c.name} category={c} />
              ))}
            </View>

            {query && filtered.length === 0 ? (
              <Text className="mt-8 text-center text-muted">
                No products found for “{query}”.
              </Text>
            ) : null}

            {groups.map((g) => (
              <View key={g.name} className="mt-5">
                <View className="mb-2 flex-row items-center justify-between px-4">
                  <Text className="text-base font-extrabold text-ink">
                    {g.name}
                  </Text>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/category/[name]",
                        params: { name: g.name },
                      })
                    }
                  >
                    <Text className="text-sm font-bold text-brand-600">
                      See all ›
                    </Text>
                  </Pressable>
                </View>
                <FlatList
                  horizontal
                  data={g.items}
                  keyExtractor={(i) => i._id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                  renderItem={({ item }) => <ProductCard product={item} />}
                />
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <CartBar />
    </View>
  );
}
