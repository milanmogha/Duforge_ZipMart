import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage"; // For fetching shopkeeper ID
import api, { addProduct } from "../services/api"; // Import your API

// Example categories list
const categoriesList = [
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
  "Paan Corner",
  "Others",
];

const AddProduct: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const productToEdit = route.params?.product;

  // Local state for product fields (Removed shopkeeperId from the user input)
  const [formState, setFormState] = useState({
    name: "",
    category: categoriesList[0],
    price: "",
    stock: "",
    discount: "0",
    details: "",
  });

  // We'll store the actual shopkeeperId in a separate state
  const [shopkeeperId, setShopkeeperId] = useState<string>("");

  // Array to hold up to 5 image URIs
  const [images, setImages] = useState<(string | null)[]>([null, null, null, null, null]);

  // Fetch shopkeeper ID from AsyncStorage (or decode from token) when component mounts
  useEffect(() => {
    const getShopkeeperId = async () => {
      try {
        const storedId = await AsyncStorage.getItem("shopkeeperId");
        if (storedId) {
          setShopkeeperId(storedId);
        } else {
          console.log("No shopkeeperId found in AsyncStorage.");
        }
      } catch (error) {
        console.error("Error retrieving shopkeeperId:", error);
      }
    };
    getShopkeeperId();
  }, []);

  // Optional: Simple GET request to confirm connectivity
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/products/all");
        console.log("GET success:", response.data);
      } catch (error) {
        console.log("GET error:", error);
      }
    };
    fetchData();
  }, []);

  // If editing an existing product, prefill the form
  useEffect(() => {
    if (productToEdit) {
      setFormState({
        name: productToEdit.name,
        category: productToEdit.category,
        price: productToEdit.price.toString(),
        stock: productToEdit.stock.toString(),
        discount: productToEdit.discount?.toString() || "0",
        details: productToEdit.details,
      });
      // If productToEdit has images, you could prefill the images array here
    }
  }, [productToEdit]);

  const handleInputChange = (field: keyof typeof formState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const pickImage = async (index: number) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Permission to access gallery denied.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const pickedUri = result.assets[0].uri;
        setImages((prev) => {
          const newImages = [...prev];
          newImages[index] = pickedUri;
          return newImages;
        });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleAddProduct = async () => {
    // Validate required fields
    if (!formState.name || !formState.price || !formState.stock) {
      Alert.alert("Validation Error", "Name, Price, and Stock are required.");
      return;
    }
    // Also ensure we have a shopkeeperId
    if (!shopkeeperId) {
      Alert.alert("Error", "No shopkeeper ID found. Please log in again.");
      return;
    }

    try {
      // Create a new FormData instance
      const data = new FormData();
      data.append("name", formState.name);
      data.append("category", formState.category);
      data.append("price", String(parseFloat(formState.price)));
      data.append("stock", String(parseInt(formState.stock, 10)));
      data.append("discount", String(parseFloat(formState.discount)));
      data.append("details", formState.details);
      // Append the shopkeeperId automatically
      data.append("shopkeeperId", shopkeeperId);

      // Append each selected image using the field names "image1", "image2", etc.
      images.forEach((img, index) => {
        if (img) {
          data.append(`image${index + 1}`, {
            uri: img,
            type: "image/*", // Accept any image type
            name: `image_${index + 1}.${img.split('.').pop() || "jpg"}`,
          } as any);
        }
      });

      // Call the API function to add the product
      const responseData = await addProduct(data);
      console.log("Add product response:", responseData);
      Alert.alert("Success", responseData.message || "Product added successfully!");
      navigation.navigate("Products");
    } catch (error: any) {
      console.error("Failed to add product:", error.response || error);
      Alert.alert("Error", "Failed to submit product. Please try again.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {productToEdit ? "Edit Product" : "Add Product"}
      </Text>

      <Text style={styles.label}>Product Name</Text>
      <TextInput
        style={styles.input}
        value={formState.name}
        onChangeText={(text) => handleInputChange("name", text)}
        placeholder="Enter product name"
      />

      <Text style={styles.label}>Category</Text>
      <Picker
        selectedValue={formState.category}
        onValueChange={(itemValue) => handleInputChange("category", itemValue.toString())}
        style={styles.picker}
      >
        {categoriesList.map((cat) => (
          <Picker.Item key={cat} label={cat} value={cat} />
        ))}
      </Picker>

      <Text style={styles.label}>Price</Text>
      <TextInput
        style={styles.input}
        value={formState.price}
        onChangeText={(text) => handleInputChange("price", text)}
        placeholder="Enter price"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Stock</Text>
      <TextInput
        style={styles.input}
        value={formState.stock}
        onChangeText={(text) => handleInputChange("stock", text)}
        placeholder="Enter stock quantity"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Discount</Text>
      <TextInput
        style={styles.input}
        value={formState.discount}
        onChangeText={(text) => handleInputChange("discount", text)}
        placeholder="Enter discount (optional)"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Details</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={formState.details}
        onChangeText={(text) => handleInputChange("details", text)}
        placeholder="Enter product details"
        multiline
      />

      {/* We removed the "Shopkeeper ID" input field from the UI */}

      <Text style={styles.label}>Select Images (up to 5)</Text>
      {images.map((uri, index) => (
        <View key={index} style={styles.imageContainer}>
          {uri && <Image source={{ uri }} style={styles.selectedImage} />}
          <TouchableOpacity
            style={styles.imageButton}
            onPress={() => pickImage(index)}
          >
            <Text style={styles.imageButtonText}>Pick Image {index + 1}</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.submitButton} onPress={handleAddProduct}>
        <Text style={styles.submitButtonText}>
          {productToEdit ? "Update Product" : "Add Product"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddProduct;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F9FAFB",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    fontFamily: "Lucida Grande",
    color: "#4ac76f",
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: "Lucida Grande",
    color: "#374151",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontFamily: "Lucida Grande",
  },
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
  },
  picker: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 15,
  },
  imageContainer: {
    marginBottom: 15,
    alignItems: "center",
  },
  selectedImage: {
    width: 100,
    height: 100,
    marginBottom: 5,
    borderRadius: 8,
  },
  imageButton: {
    backgroundColor: "#4ac76f",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  imageButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Lucida Grande",
  },
  submitButton: {
    backgroundColor: "#4ac76f",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Lucida Grande",
  },
});
