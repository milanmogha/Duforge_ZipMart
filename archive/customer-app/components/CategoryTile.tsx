import { Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Category } from "@/constants/categories";

export default function CategoryTile({
  category,
  wide = false,
}: {
  category: Category;
  wide?: boolean;
}) {
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/category/[name]",
          params: { name: category.name },
        })
      }
      className={`${wide ? "flex-1" : "w-[22%]"} mb-3 items-center`}
    >
      <Text className="mb-1 h-16 w-16 rounded-2xl bg-brand-50 text-center text-3xl leading-[64px]">
        {category.emoji}
      </Text>
      <Text
        numberOfLines={2}
        className="text-center text-[11px] font-medium leading-3 text-ink"
      >
        {category.name}
      </Text>
    </Pressable>
  );
}
