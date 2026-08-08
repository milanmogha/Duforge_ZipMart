import { useEffect, useState } from "react";
import { View, Text, TextInput } from "react-native";

export default function SearchBar({
  value,
  onChangeText,
  placeholderItems,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholderItems?: string[];
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!placeholderItems?.length) return;
    const t = setInterval(
      () => setIdx((i) => (i + 1) % placeholderItems.length),
      1800
    );
    return () => clearInterval(t);
  }, [placeholderItems]);

  const placeholder = placeholderItems?.length
    ? `Search "${placeholderItems[idx]}"`
    : "Search for groceries…";

  return (
    <View className="h-11 flex-row items-center rounded-xl border border-line bg-white px-3">
      <Text className="mr-2 text-muted">🔍</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        className="flex-1 text-[15px] text-ink"
      />
    </View>
  );
}
