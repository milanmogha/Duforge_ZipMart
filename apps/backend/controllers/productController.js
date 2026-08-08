import Product from "../models/Product.js";
import Shop from "../models/Shop.js";
import mongoose from "mongoose";

// Helper: Validate ObjectID
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Haversine Formula to calculate distance between coordinates (in km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ------------------------------------------------------------------
// 1) GET PRODUCTS BY LOCATION
// ------------------------------------------------------------------
export const getProductsByLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ message: "Customer location (latitude and longitude) is required" });
    }

    // Fetch all shops
    const shops = await Shop.find();

    // Filter shops within the service radius
    const nearbyShops = shops.filter((shop) => {
      const dist = calculateDistance(
        latitude,
        longitude,
        shop.locationCoordinates.latitude,
        shop.locationCoordinates.longitude
      );
      return dist <= shop.serviceRadius;
    });

    if (nearbyShops.length === 0) {
      return res.status(404).json({ message: "No shops found within your range" });
    }

    // Get products from the nearby shops
    const products = await Product.find({
      shopkeeperId: { $in: nearbyShops.map((shop) => shop._id) },
    });

    // Convert images to Base64 and include all product fields (including stock)
    const formatted = products.map((p) => {
      const images = {};
      Object.keys(p.images || {}).forEach((key) => {
        if (p.images[key]?.data) {
          images[key] = {
            contentType: p.images[key].contentType,
            data: p.images[key].data.toString("base64"),
          };
        }
      });
      return { ...p.toObject(), images };
    });

    return res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching products by location:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------------------------------------
// 2) ADD A NEW PRODUCT
// ------------------------------------------------------------------
export const addProduct = async (req, res) => {
  try {
    const { name, category, price, stock, discount, details, shopkeeperId } = req.body;

    // Validate required fields (using nullish check for numeric values)
    if (!name || !category || price == null || stock == null || !shopkeeperId) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    if (!isValidObjectId(shopkeeperId)) {
      return res.status(400).json({ message: "Invalid Shopkeeper ID" });
    }

    // Build images from multer if any
    const images = {};
    if (req.files) {
      Object.keys(req.files).forEach((key) => {
        images[key] = {
          data: req.files[key][0].buffer,
          contentType: req.files[key][0].mimetype,
        };
      });
    }

    // Create product with stock and other fields
    const newProduct = new Product({
      name,
      category,
      price,
      stock,
      discount: discount || 0,
      details,
      shopkeeperId,
      images,
    });

    await newProduct.save();

    // Return success including the product with stock field
    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error("Error adding product:", error.message);
    res.status(500).json({ message: "Failed to add product" });
  }
};

// ------------------------------------------------------------------
// 3) GET ALL PRODUCTS FOR A SPECIFIC SHOPKEEPER
// ------------------------------------------------------------------
export const getProductsByShopkeeper = async (req, res) => {
  try {
    const { shopkeeperId } = req.params;
    if (!shopkeeperId || !isValidObjectId(shopkeeperId)) {
      return res.status(400).json({ message: "Invalid Shopkeeper ID" });
    }

    const products = await Product.find({ shopkeeperId });
    const formatted = products.map((p) => {
      const images = {};
      Object.keys(p.images || {}).forEach((key) => {
        if (p.images[key]?.data) {
          images[key] = {
            contentType: p.images[key].contentType,
            data: p.images[key].data.toString("base64"),
          };
        }
      });
      return { ...p.toObject(), images };
    });

    return res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching products by shopkeeper:", error.message);
    res.status(500).json({ message: "Failed to fetch products for the shopkeeper" });
  }
};

// ------------------------------------------------------------------
// 4) UPDATE A PRODUCT
// ------------------------------------------------------------------
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, stock, discount, details } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid Product ID" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update fields if provided (using nullish coalescing to allow for 0 values)
    product.name = name ?? product.name;
    product.category = category ?? product.category;
    product.price = price ?? product.price;
    product.stock = stock ?? product.stock;
    product.discount = discount ?? product.discount;
    product.details = details ?? product.details;

    // Update images if any provided in this request
    if (req.files) {
      Object.keys(req.files).forEach((key) => {
        product.images[key] = {
          data: req.files[key][0].buffer,
          contentType: req.files[key][0].mimetype,
        };
      });
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Error updating product:", error.message);
    res.status(500).json({ message: "Failed to update product" });
  }
};

// ------------------------------------------------------------------
// 5) DELETE A PRODUCT
// ------------------------------------------------------------------
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid Product ID" });
    }

    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error.message);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

// ------------------------------------------------------------------
// 6) GET ALL PRODUCTS
// ------------------------------------------------------------------
export const getAllProducts = async (req, res) => {
  try {
    // Using lean() returns plain objects including all fields (like stock)
    const products = await Product.find({})
      .populate("shopkeeperId", "shopName email")
      .lean();
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching all products:", error.message);
    res.status(500).json({ message: "Failed to fetch all products" });
  }
};

// ------------------------------------------------------------------
// 7) GET PRODUCTS BY CATEGORY
// ------------------------------------------------------------------
export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    const products = await Product.find({ category });
    const formatted = products.map((p) => {
      const images = {};
      Object.keys(p.images || {}).forEach((key) => {
        if (p.images[key]?.data) {
          images[key] = {
            contentType: p.images[key].contentType,
            data: p.images[key].data.toString("base64"),
          };
        }
      });
      return { ...p.toObject(), images };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching products by category:", error.message);
    res.status(500).json({ message: "Failed to fetch products for the category" });
  }
};

// ------------------------------------------------------------------
// 8) GET PRODUCT BY ID
// ------------------------------------------------------------------
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid Product ID" });
    }

    const product = await Product.findById(id).lean();
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Convert images to Base64
    const images = {};
    Object.keys(product.images || {}).forEach((key) => {
      if (product.images[key]?.data) {
        images[key] = {
          contentType: product.images[key].contentType,
          data: product.images[key].data.toString("base64"),
        };
      }
    });
    product.images = images;

    return res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product by ID:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};
