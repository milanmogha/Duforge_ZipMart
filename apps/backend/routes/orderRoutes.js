import express from "express";
import {
  createOrder,
  getCustomerOrders,
  getShopOrders,
  getAllOrders,
  getOrderById,
  cancelOrder,
  updateOrderDeliveryStatus,
  getOrdersInRange,
  acceptOrder,
  pickOrder,
  rejectOrder,
  getAcceptedOrders,
  getInTransitOrders,
  updatePaymentStatus,
  updateDeliveryBoyLocation, 
  getDeliveredOrders,
} from "../controllers/orderController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Delivery Boy Routes
// These routes are intended for Delivery Boys to manage their orders
router.get("/in-range", authMiddleware, getOrdersInRange); // Fetch orders in range for delivery boy
router.get("/accepted", authMiddleware, getAcceptedOrders); // Fetch accepted orders for delivery boy
router.get("/delivered", authMiddleware, getDeliveredOrders); // order delivered by a deliveryboy
router.get("/in-transit", authMiddleware, getInTransitOrders); // Fetch in-transit orders for delivery boy
router.patch("/:orderId/accept", authMiddleware, acceptOrder); // Accept an order
router.patch("/:orderId/pick", authMiddleware, pickOrder); // Mark an order as picked
router.patch("/:orderId/reject", authMiddleware, rejectOrder); // Reject an order
router.patch("/:orderId/location", authMiddleware, updateDeliveryBoyLocation); // Update delivery boy's live location

// Shopkeeper Routes
// These routes are intended for Shopkeepers to manage their orders
router.get("/shop/:shopId", authMiddleware, getShopOrders); // Fetch all orders for a specific shop
router.patch("/:orderId/delivery-status", authMiddleware, updateOrderDeliveryStatus); // Update delivery status of an order

// Customer Routes
// These routes are intended for Customers to manage their orders
router.post("/create", authMiddleware, createOrder); // Create a new order
router.get("/customer", authMiddleware, getCustomerOrders); // Fetch orders for a specific customer
router.patch("/:orderId/cancel", authMiddleware, cancelOrder); // Cancel an order

// Admin Routes
// These routes are intended for Admins to manage all orders across the platform
router.get("/all", authMiddleware, getAllOrders); // Fetch all orders across the platform

// General Routes
// These routes are accessible by multiple roles based on authentication and authorization
router.get("/:orderId", authMiddleware, getOrderById); // Fetch details of a specific order

// Payment Status Route
// Allows updating the payment status of an order
router.patch('/:orderId/payment-status', authMiddleware, updatePaymentStatus);

// Export the router to be used in the main server file
export default router;
