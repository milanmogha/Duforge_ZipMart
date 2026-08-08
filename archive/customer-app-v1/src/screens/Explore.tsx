import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import ButtonNavbar from "./BottomNavbar";

// Define your route params for navigation
type RootStackParamList = {
  Category: { category: string };
  // other routes can be added here
};

type NavigationProp = StackNavigationProp<RootStackParamList, "Category">;

const groupedCategories = [
  {
    title: "Grocery & Kitchen",
    items: [
      { name: "Fruits & Vegetables", image: require("../assets/fruits.png"), color: "#E9F5E9" },
      { name: "Masala, Oil & More", image: require("../assets/oil.png"), color: "#FEF2E6" },
      { name: "Meat & Fish", image: require("../assets/meat.png"), color: "#FFECEC" },
      { name: "Bakery & Snacks", image: require("../assets/bakery.png"), color: "#F4E9FF" },
      { name: "Dairy, Bread & Eggs", image: require("../assets/dairy.png"), color: "#FEF8E6" },
      { name: "Atta & Dal", image: require("../assets/flour.png"), color: "#EAF6FF" },
    ],
  },
  {
    title: "Snacks & Drinks",
    items: [
      { name: "Snacks & Munchies", image: require("../assets/snacks&munchies.png"), color: "#FFF0E6" },
      { name: "Beverages", image: require("../assets/beverages.png"), color: "#FFF5E1" },
      { name: "Tea, Coffee & Health Drinks", image: require("../assets/tea.png"), color: "#F8E8E8" },
    ],
  },
  {
    title: "Body & Personal Care",
    items: [
      { name: "Home Care", image: require("../assets/homecare.png"), color: "#F4FAE1" },
      { name: "Baby Care", image: require("../assets/baby.png"), color: "#E1F7F6" },
      { name: "Pet Care", image: require("../assets/pet.png"), color: "#FEF8E6" },
      { name: "Personal Care", image: require("../assets/personalcare.png"), color: "#E8F0FE" },
      { name: "Beauty & Cosmetics", image: require("../assets/beauty.png"), color: "#F0E1FA" },
    ],
  },
  {
    title: "Household Essentials",
    items: [
      { name: "Cleaning Essentials", image: require("../assets/cleaning.png"), color: "#FFFBF2" },
      { name: "Home & Kitchen Appliances", image: require("../assets/kitchen.png"), color: "#FDF2F8" },
      { name: "Clothing & Accessories", image: require("../assets/clothing.png"), color: "#F2F9E1" },
    ],
  },
  {
    title: "Food",
    items: [
      { name: "Breakfast & Instant Food", image: require("../assets/instantfood.png"), color: "#EDEFF5" },
    ],
  },
  {
    title: "Others",
    items: [
      { name: "Others", image: require("../assets/pan.png"), color: "#FFF6E5" },
    ],
  },
];

const Explore: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {groupedCategories.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.groupContainer}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.gridContainer}>
              {group.items.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.categoryButton, { backgroundColor: item.color }]}
                  onPress={() =>
                    navigation.navigate("Category", { category: item.name })
                  }
                >
                  <Image source={item.image} style={styles.categoryImage} />
                  <Text style={styles.categoryName}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <ButtonNavbar activePage="explore" />
    </View>
  );
};

export default Explore;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  scrollContainer: {
    paddingBottom: 60,
  },
  groupContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryButton: {
    width: "48%",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  categoryImage: {
    width: 80,
    height: 80,
    marginBottom: 8,
    resizeMode: "contain",
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
    textAlign: "center",
  },
});
