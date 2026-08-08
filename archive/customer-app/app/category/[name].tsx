import { useEffect, useState } from "react";
import { View, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getProductsByCategory } from "@/lib/api";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";
import CartBar from "@/components/CartBar";
import { Loading, EmptyState } from "@/components/ui";

export default function CategoryScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProductsByCategory(name)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [name]);

  const filtered = query
    ? items.filter((p) => p.name?.toLowerCase().includes(query.toLowerCase()))
    : items;

  if (loading) return <Loading label={`Loading ${name}…`} />;

  return (
    <View className="flex-1 bg-surface">
      <Header title={name} back />
      <View className="bg-white px-3 pb-3">
        <SearchBar value={query} onChangeText={setQuery} />
      </View>

      {filtered.length ? (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i._id}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: 12, gap: 12 }}
          contentContainerStyle={{ paddingVertical: 12, paddingBottom: 120, gap: 12 }}
          renderItem={({ item }) => <ProductCard product={item} wide />}
        />
      ) : (
        <EmptyState
          emoji="🗂️"
          title="Nothing here yet"
          subtitle={`No products in ${name} right now.`}
        />
      )}
      <CartBar />
    </View>
  );
}
