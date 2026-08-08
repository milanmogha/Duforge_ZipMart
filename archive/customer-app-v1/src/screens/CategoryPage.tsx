import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import ButtonNavbar from "./BottomNavbar";
import Product from "./Product";

const CategoryPage: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  // Expect the parameter as "category" (sent from HomePage/Explore)
  const { category } = route.params as { category: string };

  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProductsByCategory = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `http://10.0.2.2:8000/api/products/category/${category}`
        );
        setProducts(response.data);
        setFilteredProducts(response.data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductsByCategory();
  }, [category]);

  // Filter products based on search query
  useEffect(() => {
    setFilteredProducts(
      products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, products]);

  // Navigate to product details using "ProductPage" route
  const handleProductClick = (product: any) => {
    navigation.navigate(
      "ProductPage" as never,
      { productId: product._id } as never
    );
  };

  // Helper to render image URL from product data
  const renderImage = (image?: { data: string; contentType: string }) =>
    image?.data
      ? `data:${image.contentType};base64,${image.data}`
      : "https://via.placeholder.com/300";

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>{category}</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Loading Indicator */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <>
          {/* Product List */}
          {filteredProducts.length > 0 ? (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item._id}
              numColumns={2}
              contentContainerStyle={styles.productList}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleProductClick(item)}>
                  <Product
                    id={item._id}
                    {...item}
                    image={renderImage(item.images?.image1)}
                  />
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.noProductsContainer}>
              <Text style={styles.noProductsText}>
                No products found in this category.
              </Text>
            </View>
          )}
        </>
      )}

      {/* Bottom Navigation */}
      <ButtonNavbar activePage="explore" />
    </View>
  );
};

export default CategoryPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingBottom: 60, // Ensures content doesn't overlap with BottomNavbar
  },
  header: {
    padding: 20,
    backgroundColor: "white",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
    textTransform: "capitalize",
    marginBottom: 10,
  },
  searchInput: {
    width: "100%",
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6b7280",
  },
  productList: {
    padding: 10,
  },
  noProductsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noProductsText: {
    fontSize: 16,
    color: "#6b7280",
  },
});
