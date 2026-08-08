import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import api from "../services/api";
import { FontAwesome } from "@expo/vector-icons";

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  details: string;
  discount: number;
  images?: {
    [key: string]: { data: string; contentType: string } | undefined;
  };
}

const ProductsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Products");

  const navigateTo = (screen: string) => {
    setActiveTab(screen);
    if (screen !== "Products") {
      navigation.navigate(screen as never);
    }
  };

  const getShopkeeperId = useCallback(async () => {
    try {
      return await AsyncStorage.getItem("shopkeeperId");
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(lowerCaseQuery) ||
          product.category.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    setLoading(true);
    const shopkeeperId = await getShopkeeperId();
    if (!shopkeeperId) {
      Alert.alert("Error", "Shopkeeper ID is missing. Please log in again.");
      navigation.navigate("Login" as never);
      return;
    }

    try {
      const response = await api.get(`/products/shop/${shopkeeperId}`);
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      Alert.alert("Error", "Failed to fetch products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    navigation.navigate("AddProduct" as never, { product } as never);
  };

  const handleDelete = async (productId: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this product?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await api.delete(`/products/delete/${productId}`);
            if (response.data.success) {
              setProducts((prev) => prev.filter((p) => p._id !== productId));
              Alert.alert("Success", "Product deleted successfully.");
            } else {
              throw new Error(response.data?.message || "Delete failed.");
            }
          } catch (error) {
            console.error("Error deleting product:", error);
            Alert.alert("Error", "Failed to delete product. Please try again.");
          }
        },
      },
    ]);
  };

  const renderProduct = ({ item }: { item: Product }) => {
    let imageUri: string | undefined;
    if (item.images && item.images.image1) {
      const { data, contentType } = item.images.image1;
      imageUri = `data:${contentType};base64,${data}`;
    }

    return (
      <View style={styles.card}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Text style={{ color: "#777" }}>No Image</Text>
          </View>
        )}
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardCategory}>{item.category}</Text>
        <Text style={styles.cardPrice}>Price: {item.price} | Stock: {item.stock}</Text>
        {item.discount ? <Text style={styles.cardDiscount}>Discount: {item.discount}%</Text> : null}
        <View style={styles.cardActions}>
          <TouchableOpacity style={[styles.button, { backgroundColor: "#3B82F6" }]} onPress={() => handleEdit(item)}>
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: "#EF4444" }]} onPress={() => handleDelete(item._id)}>
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const calculateNumColumns = () => {
    const screenWidth = Dimensions.get("window").width;
    if (screenWidth >= 1024) return 4;
    if (screenWidth >= 768) return 3;
    if (screenWidth >= 480) return 2;
    return 1;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Products</Text>

      {/* Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search products..."
        value={searchQuery}
        onChangeText={(text) => setSearchQuery(text)}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#7091E6" />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id}
          numColumns={calculateNumColumns()}
          columnWrapperStyle={calculateNumColumns() > 1 ? { justifyContent: "space-between" } : undefined}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
        />
      )}
          {/* Bottom Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === "Dashboard" && styles.activeNavItem]}
          onPress={() => navigateTo("Dashboard")}
        >
          <FontAwesome name="home" size={24} style={activeTab === "Dashboard" ? styles.activeIcon : styles.icon} />
          <Text style={activeTab === "Dashboard" ? styles.activeTabText : styles.tabText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === "Orders" && styles.activeNavItem]}
          onPress={() => navigateTo("Orders")}
        >
          <FontAwesome name="clipboard" size={24} style={activeTab === "Orders" ? styles.activeIcon : styles.icon} />
          <Text style={activeTab === "Orders" ? styles.activeTabText : styles.tabText}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === "Products" && styles.activeNavItem]}
          onPress={() => navigateTo("Products")}
        >
          <FontAwesome name="shopping-cart" size={24} style={activeTab === "Products" ? styles.activeIcon : styles.icon} />
          <Text style={activeTab === "Products" ? styles.activeTabText : styles.tabText}>Products</Text>
        </TouchableOpacity>
         <TouchableOpacity
                  style={[styles.navItem, activeTab === "AddProducts" && styles.activeNavItem]}
                  onPress={() => navigateTo("AddProduct")}
                >
                  <FontAwesome
                    name="plus-circle"
                    size={24}
                    style={activeTab === "AddProduct" ? styles.activeIcon : styles.icon}
                  />
                  <Text style={activeTab === "AddProduct" ? styles.activeTabText : styles.tabText}>
                    Add Product
                  </Text>
                </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, activeTab === "Profile" && styles.activeNavItem]}
          onPress={() => navigateTo("Profile")}
        >
          <FontAwesome name="user" size={24} style={activeTab === "Profile" ? styles.activeIcon : styles.icon} />
          <Text style={activeTab === "Profile" ? styles.activeTabText : styles.tabText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProductsScreen;


/** Styles merged/adapted from products.css into React Native StyleSheet */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4ac76f",
    fontFamily: "Lucida Grande ",
    textAlign: "center",
    marginBottom: 24,
  },
  searchBarContainer: {
    marginBottom: 16,
    alignItems: "center",
  },
  searchBar: {
    width: "100%",
    maxWidth: 400,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  listContent: {
    // For spacing around the grid
    paddingBottom: 30,
  },
  noProductsText: {
    textAlign: "center",
    fontSize: 16,
    color: "#555",
    marginTop: 30,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    margin: 4,
    flex: 1,
    padding: 10,
    // Shadow (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation (Android)
    elevation: 2,
  },
  cardImage: {
    width: "100%",
    height: 120,
    borderRadius: 6,
    marginBottom: 8,
  },
  cardImagePlaceholder: {
    backgroundColor: "#EEE",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  cardCategory: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 14,
    color: "#555",
  },
  cardDiscount: {
    fontSize: 14,
    color: "#D97706",
    marginTop: 4,
  },
  cardActions: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "space-between",
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "600",
  },
  /* 🔹 Bottom Navigation Styles */
  navBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  activeNavItem: {
    backgroundColor: "#E0FFE6",
    borderRadius: 8,
  },
  icon: {
    color: "#9CA3AF",
    marginBottom: 5,
  },
  activeIcon: {
    color: "#4ac76f",
    marginBottom: 5,
  },
  tabText: {
    fontSize: 13,
    fontFamily: "Lucida Grande",
    color: "#9CA3AF",
  },
  activeTabText: {
    fontSize: 13,
    fontFamily: "Lucida Grande",
    color: "#4ac76f",
    fontWeight: "bold",
  },
});
