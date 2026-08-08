import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { getProductsByLocation, fetchBanners } from "../services/api";
import Product from "./Product";
import BottomNavbar from "./BottomNavbar";
const searchIcon = require ("../assets/search.png");
const logo = require ("../assets/favicon.png");

type RootStackParamList = {
  HomePage: undefined;
  ProductPage: { productId: string };
  Category: { category: string };
};

type HomePageNavigationProp = StackNavigationProp<RootStackParamList, "HomePage">;

const predefinedCategories = [
  "Fruits & Vegetables",
  "Dairy, Bread & Eggs",
  "Beverages",
  "Snacks & Munchies",
  "Personal Care",
  "Home Care",
  "Baby Care",
  "Pet Care",
  "Bakery & Biscuits",
  "Masala, Oil & More",
  "Breakfast & Instant Food",
  "Tea, Coffee & Health Drinks",
  "Sweets & Chocolates",
  "Noodles & Pasta",
  "Sauces & Spreads",
  "Cleaning Essentials",
  "Pharma & Wellness",
  "Stationery & Office Supplies",
  "Toys & Games",
  "Books",
  "Sports & Fitness",
  "Home & Kitchen Appliances",
  "Clothing & Accessories",
  "Beauty & Cosmetics",
  "Meat & Seafood",
  "Organic & Gourmet",
  "Others",
];

const HomePage: React.FC = () => {
  const navigation = useNavigation<HomePageNavigationProp>();

  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isOutOfRange, setIsOutOfRange] = useState<boolean>(false);
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [searchPlaceholder, setSearchPlaceholder] = useState(predefinedCategories[0]);

  // Request user's location
  const fetchCustomerLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Enable location access to continue.");
      setIsOutOfRange(true);
      return null;
    }
    let location = await Location.getCurrentPositionAsync({});
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  };

  // Fetch products & banners on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const location = await fetchCustomerLocation();
        if (!location) return; // user denied or error
        const nearbyProducts = await getProductsByLocation(
          location.latitude,
          location.longitude
        );
        if (nearbyProducts.length > 0) {
          setProducts(nearbyProducts);
        } else {
          setIsOutOfRange(true);
        }
      } catch (error) {
        setIsOutOfRange(true);
      } finally {
        setLoading(false);
      }
    };

    const fetchBannerData = async () => {
      try {
        const data = await fetchBanners();
        setBanners(data);
      } catch (error) {
        console.error("Error fetching banners:", error);
      }
    };

    fetchProducts();
    fetchBannerData();
  }, []);

  // Auto-rotate banners
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) =>
        banners.length > 0 ? (prevIndex + 1) % banners.length : 0
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [banners]);

  // Animate search placeholder text
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % predefinedCategories.length;
      setSearchPlaceholder(`Search "${predefinedCategories[index]}"`);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Helper to build image URI
  const renderImage = (image?: { data: string; contentType: string }) =>
    image?.data
      ? `data:${image.contentType};base64,${image.data}`
      : "https://via.placeholder.com/300";

  // Filter by search
  const filteredProducts = searchQuery
    ? products.filter((product: any) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  // Group products by category
  const groupedProducts = predefinedCategories
    .map((category) => ({
      category,
      products: filteredProducts.filter(
        (product: any) =>
          product.category &&
          product.category.trim().toLowerCase() === category.trim().toLowerCase()
      ),
    }))
    .filter(({ products }) => products.length > 0);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4ac76f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={logo} style={styles.logo} />
        <Text style={styles.headerText}>ZipMart</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Image source={searchIcon} style={styles.searchIcon} />
        <TextInput
          placeholder={searchPlaceholder}
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Banner */}
      <View style={styles.bannerContainer}>
        {banners.length > 0 && (
          <Image
            source={{ uri: banners[currentBannerIndex]?.image }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        )}
      </View>

      {/* Out of Range Message */}
      {isOutOfRange && (
        <View style={styles.outOfRangeContainer}>
          <Text style={styles.outOfRangeText}>Coming Soon to Your Area!</Text>
        </View>
      )}

      {/* Products */}
      {!isOutOfRange && (
        <ScrollView style={styles.productScrollView}>
          {searchQuery && filteredProducts.length === 0 && (
            <Text style={styles.noResultsText}>
              No products found for "{searchQuery}"
            </Text>
          )}

          {groupedProducts.map(({ category, products }) => (
            <View key={category} style={styles.categoryContainer}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>{category}</Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("Category", { category })
                  }
                >
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>

              {/* Horizontal product list */}
              <FlatList
                data={products}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <Product
                    key={item._id}
                    id={item._id}
                    shopkeeperId={item.shopkeeperId}  // Pass it here 
                    name={item.name}
                    category={item.category}
                    price={item.price}
                    discount={item.discount}
                    image={renderImage(item.images?.image1)}
                  />
                )}
                keyExtractor={(item) => item._id}
              />
            </View>
          ))}

          <View style={styles.footer} />
        </ScrollView>
      )}

      {/* Bottom Navigation */}
      <BottomNavbar activePage="shop" />
    </View>
  );
};

export default HomePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    elevation: 4,
    paddingTop: 30,
  },
  logo: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4ac76f",
    fontFamily: "Lucida Grande",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e5e7eb",
    marginHorizontal: 16,
    padding: 8,
    borderRadius: 10,
    marginTop: 10,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  bannerContainer: {
    margin: 16,
    alignItems: "center",
  },
  bannerImage: {
    width: "100%",
    height: 150,
    borderRadius: 12,
  },
  outOfRangeContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  outOfRangeText: {
    fontSize: 16,
    color: "red",
  },
  productScrollView: {
    flex: 1,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  seeAllText: {
    fontSize: 14,
    color: "#2563EB",
  },
  noResultsText: {
    textAlign: "center",
    fontSize: 16,
    color: "#333",
  },
  footer: {
    marginBottom: 50,
  },
});
