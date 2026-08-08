import { useEffect, useState } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { imageUri } from "@/lib/format";

export default function Banner({ banners }: { banners: any[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setI((p) => (p + 1) % banners.length), 3000);
    return () => clearInterval(t);
  }, [banners]);

  if (!banners.length) return null;

  return (
    <View className="mx-4 mt-3 h-40 overflow-hidden rounded-2xl bg-surface">
      <Image
        source={{ uri: imageUri(banners[i]?.image) }}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
      />
      <View className="absolute bottom-2 flex-row self-center">
        {banners.map((_, d) => (
          <View
            key={d}
            className={`mx-0.5 h-1.5 rounded-full ${
              d === i ? "w-4 bg-white" : "w-1.5 bg-white/60"
            }`}
          />
        ))}
      </View>
    </View>
  );
}
