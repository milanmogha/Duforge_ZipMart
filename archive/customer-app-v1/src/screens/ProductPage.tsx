import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useCart } from "../context/CartContext";

interface ProductDetails {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  discount: number;
  details: string;
  images: { [key: string]: { data: string; contentType: string } };
  shopkeeperId: string; // <-- note this field
}

interface ShopDetails {
  _id: string;
  shopName: string;
  ownerName: string;
  location: string;
  phone: string;
  email: string;
}

const API_BASE = "http://10.0.2.2:8000/api";

const ProductPage: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  // Expect "productId" as parameter in the route
  const { productId } = route.params as { productId?: string };
  const { addToCart } = useCart();

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [shop, setShop] = useState<ShopDetails | null>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [activeImage, setActiveImage] = useState<string>("");

  useEffect(() => {
    if (!productId) {
      setError("Product ID is missing.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch product details
        const productRes = await fetch(`${API_BASE}/products/${productId}`);
        if (!productRes.ok) {
          throw new Error("Failed to fetch product details.");
        }
        const productData: ProductDetails = await productRes.json();
        if (!productData) {
          throw new Error("Product not found.");
        }
        setProduct(productData);

        // Set active image from product images
        if (productData.images) {
          const keys = Object.keys(productData.images);
          if (keys.length > 0) {
            const firstImg = productData.images[keys[0]];
            if (firstImg?.data) {
              setActiveImage(
                `data:${firstImg.contentType};base64,${firstImg.data}`
              );
            }
          }
        }

        // Fetch shop details if available
        if (productData.shopkeeperId) {
          const shopRes = await fetch(
            `${API_BASE}/shop/${productData.shopkeeperId}`
          );
          if (shopRes.ok) {
            const shopData = await shopRes.json();
            setShop(shopData);
          }
        }

        // Fetch ratings for the product
        const ratingsRes = await fetch(
          `${API_BASE}/ratings/product/${productId}`
        );
        if (ratingsRes.ok) {
          const ratingsData = await ratingsRes.json();
          setRatings(ratingsData);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load product.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!product) {
    return <Text style={styles.errorText}>Product not found.</Text>;
  }

  // Prepare image URLs from product.images
  const imageUrls = Object.keys(product.images || {}).map((key) => {
    const img = product.images[key];
    return img?.data
      ? `data:${img.contentType};base64,${img.data}`
      : "https://via.placeholder.com/300";
  });

  const avgRating = ratings.length
    ? (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(
        1
      )
    : "No ratings yet";

  // 1) Add the product to cart, including shopkeeperId
  const handleAddToCart = () => {
    if (!product) return;
    addToCart(
      {
        _id: product._id,
        shopkeeperId: product.shopkeeperId, // <-- ensure shop ID is passed
        name: product.name,
        category: product.category,
        images: product.images,
        price: product.price,
        discount: product.discount,
      },
      1
    );
    Alert.alert("Success", "Product added to cart!");
  };

  return (
    <ScrollView style={styles.container}>
      {/* Product Images */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: activeImage || imageUrls[0] }}
          style={styles.mainImage}
          resizeMode="contain"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.thumbnailContainer}
      >
        {imageUrls.map((url, index) => (
          <TouchableOpacity key={index} onPress={() => setActiveImage(url)}>
            <Image
              source={{ uri: url }}
              style={[
                styles.thumbnail,
                activeImage === url ? styles.activeThumbnail : {},
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productCategory}>{product.category}</Text>

        <View style={styles.priceContainer}>
          <Text style={styles.discountedPrice}>
            ₹
            {product.discount > 0
              ? (
                  product.price -
                  (product.price * product.discount) / 100
                ).toFixed(2)
              : product.price.toFixed(2)}
          </Text>
          {product.discount > 0 && (
            <Text style={styles.originalPrice}>
              ₹{product.price.toFixed(2)}
            </Text>
          )}
        </View>

        <Text style={styles.productDetails}>{product.details}</Text>

        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
        >
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>

      {/* Additional Info (Shop + Ratings) */}
      <View style={styles.additionalInfoContainer}>
        {shop && (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Shop Information</Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Shop Name: </Text>
              {shop.shopName}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Owner: </Text>
              {shop.ownerName}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Location: </Text>
              {shop.location}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Contact: </Text>
              {shop.phone} | {shop.email}
            </Text>
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Ratings & Reviews</Text>
          <Text style={styles.infoText}>Average Rating: {avgRating}</Text>
          {ratings.length > 0 ? (
            ratings.map((r, idx) => (
              <View key={idx} style={styles.ratingBox}>
                <Text style={styles.ratingText}>Rating: {r.rating} / 5</Text>
                {r.review && (
                  <Text style={styles.ratingReview}>Review: {r.review}</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.infoText}>No reviews yet.</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default ProductPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    textAlign: "center",
    color: "red",
    fontSize: 16,
    marginTop: 20,
  },
  imageContainer: {
    marginTop: 20,
    width: "100%",
    height: 500,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  mainImage: {
    width: "90%",
    height: "90%",
  },
  thumbnailContainer: {
    flexDirection: "row",
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  thumbnail: {
    width: 60,
    height: 60,
    marginRight: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  activeThumbnail: {
    borderColor: "#4F46E5",
    borderWidth: 2,
  },
  detailsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  productName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  productCategory: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  discountedPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  originalPrice: {
    fontSize: 14,
    color: "#9E9E9E",
    textDecorationLine: "line-through",
    marginLeft: 10,
  },
  productDetails: {
    fontSize: 16,
    color: "#444",
    textAlign: "center",
    marginVertical: 10,
  },
  addToCartButton: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  addToCartText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  additionalInfoContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#111827",
  },
  infoText: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 5,
  },
  infoLabel: {
    fontWeight: "bold",
  },
  ratingBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  ratingReview: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 5,
  },
});
