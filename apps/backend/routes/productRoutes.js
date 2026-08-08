import express from "express";
import multer from "multer";
import {
  addProduct,
  getProductsByShopkeeper,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductsByCategory,
  getProductsByLocation,
  getProductById,
} from "../controllers/productController.js";

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5MB per file
});

const uploadMiddleware = upload.fields([
  { name: "image1", maxCount: 1 },
  { name: "image2", maxCount: 1 },
  { name: "image3", maxCount: 1 },
  { name: "image4", maxCount: 1 },
  { name: "image5", maxCount: 1 },
]);

// Routes
router.get("/all", getAllProducts); // Get all products
router.post("/add", uploadMiddleware, addProduct); // Add a new product
router.get("/shop/:shopkeeperId", getProductsByShopkeeper); // Get all products for a shopkeeper
router.put("/update/:id", uploadMiddleware, updateProduct); // Update a product
router.delete("/delete/:id", deleteProduct); // Delete a product
router.get("/category/:category", getProductsByCategory); // Get products by category
router.get("/location", getProductsByLocation); // Get products based on customer location
router.get("/:id", getProductById);  // get product by id


export default router;
