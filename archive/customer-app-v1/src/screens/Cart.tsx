import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { useCart } from "../context/CartContext";
import Toast from "react-native-toast-message";
import BottomNavbar from "./BottomNavbar";

type RootStackParamList = {
  Checkout: undefined;
  Explore: undefined;
};

const Cart: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  // Grab cart data & actions from context
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    totalDiscountedPrice,
    clearCart,
  } = useCart();

  const [searchQuery, setSearchQuery] = useState("");

  // 1) Go to Checkout (confirm with Alert)
  const handleCheckout = () => {
    Alert.alert("Proceed to Checkout", "Are you sure you want to proceed?", [
      { text: "Cancel", style: "cancel" },
      { text: "Yes", onPress: () => navigation.navigate("Checkout") },
    ]);
  };

  // 2) Decrease item quantity or remove item if it’s at 1
  const handleDecreaseQuantity = async (productId: string, quantity: number) => {
    if (quantity > 1) {
      await updateQuantity(productId, quantity - 1);
    } else {
      await removeFromCart(productId);
    }
  };

  // 3) Increase item quantity
  const handleIncreaseQuantity = async (productId: string, quantity: number) => {
    await updateQuantity(productId, quantity + 1);
  };

  // 4) Remove item from cart
  const handleRemoveItem = async (productId: string) => {
    await removeFromCart(productId);
  };

  // 5) Helper to derive product image from item
  const renderProductImage = (product: any) => {
    const image = product.images?.image1;
    if (!image) {
      return "https://via.placeholder.com/150";
    }
    if (typeof image === "string") {
      return image;
    }
    if (image.data) {
      // If the data is already a base64-encoded URI with a prefix
      if (image.data.startsWith("data:")) {
        return image.data;
      }
      // Otherwise build a data URI from contentType + base64 data
      if (image.contentType) {
        return `data:${image.contentType};base64,${image.data.trim()}`;
      }
    }
    return "https://via.placeholder.com/150";
  };

  // 6) Filter items by search query on product name
  const filteredCartItems = cartItems.filter((item) =>
    item.product.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search for products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Cart Items List */}
      <FlatList
        data={filteredCartItems}
        keyExtractor={(item) => item.product._id}
        contentContainerStyle={styles.cartList}
        // Show empty cart UI if no items
        ListEmptyComponent={
          <View style={styles.emptyCart}>
            <Image
              source={require("../assets/empty-cart.png")}
              style={styles.emptyImage}
            />
            <Text style={styles.emptyText}>Your cart is empty!</Text>
            <Text style={styles.subText}>Start adding items now.</Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => navigation.navigate("Explore")}
            >
              <Text style={styles.exploreText}>Explore Products</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const discount = item.product.discount || 0;
          const discountedPrice =
            item.product.price - (item.product.price * discount) / 100;

          return (
            <View style={styles.cartItem}>
              {/* Product Image */}
              <Image
                source={{ uri: renderProductImage(item.product) }}
                style={styles.cartItemImage}
              />

              {/* Item Details */}
              <View style={styles.cartItemDetails}>
                <Text style={styles.productName}>{item.product.name}</Text>
                <Text style={styles.productCategory}>
                  {item.product.category}
                </Text>
                <Text style={styles.productPrice}>
                  ₹{discountedPrice.toFixed(2)}
                </Text>
                {/* 
                  Optional: If your product has shop info
                  e.g. item.product.shopkeeperId
                */}
              </View>

              {/* Quantity Actions */}
              <View style={styles.cartItemActions}>
                <View style={styles.quantityControl}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() =>
                      handleDecreaseQuantity(item.product._id, item.quantity)
                    }
                  >
                    <Text style={styles.buttonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() =>
                      handleIncreaseQuantity(item.product._id, item.quantity)
                    }
                  >
                    <Text style={styles.buttonText}>+</Text>
                  </TouchableOpacity>
                </View>

                {/* Remove */}
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveItem(item.product._id)}
                >
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Checkout Button */}
      {filteredCartItems.length > 0 && (
        <View>
          <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            <Text style={styles.checkoutPrice}>
              ₹{(totalDiscountedPrice || 0).toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Navbar */}
      <BottomNavbar activePage="cart" />

      {/* Toast for feedback */}
      <Toast />
    </View>
  );
};

export default Cart;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingBottom: 80,
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    fontFamily: "Lucida Grande",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "#fff",
  },
  searchInput: {
    width: "100%",
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
  },
  cartList: {
    padding: 16,
  },
  emptyCart: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 50,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  subText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 10,
  },
  exploreButton: {
    backgroundColor: "#4ac76f",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  exploreText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  cartItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  cartItemDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4ac76f",
  },
  cartItemActions: {
    alignItems: "center",
    justifyContent: "center",
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#4ac76f",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
  quantityText: {
    marginHorizontal: 8,
    fontSize: 16,
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#e53935",
    borderRadius: 5,
  },
  removeText: {
    color: "#fff",
    fontSize: 14,
  },
  checkoutButton: {
    marginLeft: 10,
    marginRight: 10,
    backgroundColor: "#4ac76f",
    padding: 14,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  checkoutText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  checkoutPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
});
