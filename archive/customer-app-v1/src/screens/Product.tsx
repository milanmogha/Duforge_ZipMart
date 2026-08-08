import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useCart } from "../context/CartContext";

// Define navigation stack param types if needed
type RootStackParamList = {
  ProductPage: { productId: string };
  Category: { category: string };
  HomePage: undefined;
};

type ProductNavigationProp = StackNavigationProp<RootStackParamList, "ProductPage">;

// Make sure you actually pass `shopkeeperId` from the parent
interface ProductProps {
  id: string;
  shopkeeperId: string; // Must be provided from backend
  image?: string;
  name: string;
  category: string;
  price: number;
  discount: number;
}

const Product: React.FC<ProductProps> = ({
  id,
  shopkeeperId,
  image,
  name,
  category,
  price,
  discount,
}) => {
  const { addToCart } = useCart();
  const navigation = useNavigation<ProductNavigationProp>();

  const validPrice = typeof price === "number" ? price : 0;
  const discountedPrice =
    discount > 0 ? validPrice - (validPrice * discount) / 100 : validPrice;

  // Add the product (including shopkeeperId) to the cart
  const handleAddToCart = () => {
    const productObject = {
      _id: id,
      shopkeeperId: shopkeeperId, // Ensure we include the shop ID
      name,
      category,
      images: {
        image1: {
          data: image || "",
          contentType: "image/png",
        },
      },
      price: validPrice,
      discount,
    };
    addToCart(productObject, 1);
  };

  // Navigate to product details page
  const handlePress = () => {
    if (!id) {
      console.warn("Product id is missing");
      return;
    }
    navigation.navigate("ProductPage", { productId: id });
  };

  return (
    <TouchableOpacity
      style={styles.productContainer}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {discount > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discount}% OFF</Text>
        </View>
      )}

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: image || "https://via.placeholder.com/150" }}
          style={styles.productImage}
        />
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.productName} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.priceContainer}>
          {discount > 0 ? (
            <>
              <Text style={styles.discountedPrice}>
                ₹{discountedPrice.toFixed(2)}
              </Text>
              <Text style={styles.originalPrice}>
                ₹{validPrice.toFixed(2)}
              </Text>
            </>
          ) : (
            <Text style={styles.discountedPrice}>
              ₹{validPrice.toFixed(2)}
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
        <Text style={styles.addToCartText}>Add to Cart</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default Product;

const styles = StyleSheet.create({
  productContainer: {
    width: 160,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    margin: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#e53935",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
    zIndex: 10,
  },
  discountText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 100,
    marginBottom: 10,
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  detailsContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  discountedPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  originalPrice: {
    fontSize: 12,
    color: "#9E9E9E",
    textDecorationLine: "line-through",
  },
  addToCartButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 8,
  },
  addToCartText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});
