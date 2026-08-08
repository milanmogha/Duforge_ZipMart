import { View, Text, ScrollView } from "react-native";
import Header from "@/components/Header";
import CartBar from "@/components/CartBar";
import CategoryTile from "@/components/CategoryTile";
import { CATEGORY_GROUPS } from "@/constants/categories";

export default function Categories() {
  return (
    <View className="flex-1 bg-white">
      <Header title="Shop by category" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 120 }}
      >
        {CATEGORY_GROUPS.map((group) => (
          <View key={group.title} className="mt-5">
            <Text className="mb-3 px-1 text-base font-extrabold text-ink">
              {group.title}
            </Text>
            <View className="flex-row flex-wrap justify-between">
              {group.items.map((c) => (
                <CategoryTile key={c.name} category={c} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <CartBar />
    </View>
  );
}
