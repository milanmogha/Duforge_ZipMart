import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";

// Define the structure of the Product object using a TypeScript interface
interface Product {
  name: string; // Name of the product
  category: string; // Category to which the product belongs
  price: number; // Price of the product
  stock: number; // Number of items in stock
  details: string; // Details or description of the product
  discount: number; // Discount percentage on the product
  images: {
    image1?: { data: string; contentType: string }; // Optional image data
  };
}

// Define the props expected by the ProductCard component
interface ProductCardProps {
  product: Product; // Product object containing details to display
  onEdit: () => void; // Callback function for handling edit action
  onDelete: () => void; // Callback function for handling delete action
}

// Get device width for responsive design
const deviceWidth = Dimensions.get("window").width;

// React functional component to display a single product card
const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
}) => {
  /**
   * Function to render the product image.
   * If an image is available, it converts the data to a Base64 URL.
   * If no image is available, it falls back to a placeholder image.
   */
  const renderImage = (image?: { data: string; contentType: string }) => {
    if (image && image.data) {
      return `data:${image.contentType};base64,${image.data}`;
    }
    return require("../assets/placeholder-image.png"); // Path to placeholder image
  };

  /**
   * Function to calculate and render the product price.
   * If a discount is available, it calculates the discounted price
   * and shows both the original and discounted prices.
   * If no discount is applied, it shows only the original price.
   */
  const renderPrice = (price: number, discount: number) => {
    const discountedPrice = price - (price * discount) / 100;

    if (discount > 0) {
      return (
        <View style={styles.priceContainer}>
          <Text style={styles.discountedPrice}>₹{discountedPrice.toFixed(2)}</Text>
          <Text style={styles.originalPrice}>₹{price.toFixed(2)}</Text>
        </View>
      );
    }

    return <Text style={styles.price}>₹{price.toFixed(2)}</Text>;
  };

  return (
    <View style={styles.card}>
      {/* Render the product image */}
      <Image
        source={{ uri: renderImage(product.images.image1) }}
        style={styles.image}
        resizeMode="cover"
        accessible={true}
        accessibilityLabel={product.name}
      />

      {/* Display product details such as name, category, and price */}
      <View style={styles.detailsContainer}>
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
          {product.name}
        </Text>
        <Text style={styles.category}>Category: {product.category}</Text>
        {renderPrice(product.price, product.discount)}
      </View>

      {/* Render action buttons for editing and deleting the product */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProductCard;

/** React Native Styles */
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    width: deviceWidth * 0.45, // Approximately similar to w-64 in Tailwind
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // For Android shadow
    padding: 10,
    margin: 8,
    justifyContent: "space-between",
  },
  image: {
    width: "100%",
    height: 120, // Similar to h-60 in Tailwind
    borderRadius: 6,
    backgroundColor: "#E5E7EB", // Placeholder background color
  },
  detailsContainer: {
    marginTop: 8,
    flexGrow: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  discountedPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#10B981", // Green color
    marginRight: 4,
  },
  originalPrice: {
    fontSize: 12,
    color: "#6B7280",
    textDecorationLine: "line-through",
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#10B981",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  editButton: {
    backgroundColor: "#F59E0B", // Yellow color
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  deleteButton: {
    backgroundColor: "#EF4444", // Red color
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
