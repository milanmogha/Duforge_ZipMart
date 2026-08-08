import express from "express";
import {
  createDelivery,
  updateDeliveryStatus,
  getDeliveriesByDeliveryBoy,
  trackDeliveryByOrderId,
  getAllDeliveries,
} from "../controllers/deliveryController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a delivery (admin or shopkeeper)
router.post("/create", authMiddleware, createDelivery);

// Update delivery status (deliveryBoy only)
router.patch("/update-status", authMiddleware, (req, res, next) => {
  if (req.deliveryBoy) return next();
  return res.status(403).json({ message: "Access denied. Delivery boy only." });
}, updateDeliveryStatus);

// Get deliveries for a delivery boy
router.get("/delivery-boy/:deliveryBoyId", authMiddleware, (req, res, next) => {
  if (req.deliveryBoy) return next();
  return res.status(403).json({ message: "Access denied. Delivery boy only." });
}, getDeliveriesByDeliveryBoy);

// Track delivery by order ID (admin, shopkeeper, or customer)
router.get("/track/:orderId", authMiddleware, trackDeliveryByOrderId);

// Get all deliveries (admin only)
router.get("/admin/all", authMiddleware, (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ message: "Access denied. Admin only." });
}, getAllDeliveries);

export default router;
