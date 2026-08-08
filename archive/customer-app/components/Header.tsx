import React from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function Header({
  title,
  back = false,
  right,
}: {
  title: string;
  back?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <SafeAreaView edges={["top"]} className="border-b border-line bg-white">
      <View className="h-12 flex-row items-center px-3">
        {back ? (
          <Pressable onPress={() => router.back()} className="py-2 pr-2">
            <Text className="text-2xl leading-6 text-ink">‹</Text>
          </Pressable>
        ) : null}
        <Text numberOfLines={1} className="flex-1 text-lg font-extrabold text-ink">
          {title}
        </Text>
        {right}
      </View>
    </SafeAreaView>
  );
}
