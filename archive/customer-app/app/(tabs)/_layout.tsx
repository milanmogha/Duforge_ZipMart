import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useCart } from "@/context/CartContext";
import { colors } from "@/lib/theme";

const Icon = ({ e, focused }: { e: string; focused: boolean }) => (
  <Text style={{ fontSize: 21, opacity: focused ? 1 : 0.45 }}>{e}</Text>
);

export default function TabsLayout() {
  const { count } = useCart();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 60,
          paddingTop: 6,
          paddingBottom: 8,
          borderTopColor: colors.line,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <Icon e="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Categories",
          tabBarIcon: ({ focused }) => <Icon e="🗂️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarBadge: count || undefined,
          tabBarBadgeStyle: { backgroundColor: colors.brand, fontSize: 10 },
          tabBarIcon: ({ focused }) => <Icon e="🛒" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ focused }) => <Icon e="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
