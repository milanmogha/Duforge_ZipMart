import express from "express";
import {
  createCoupon,
  getAllCoupons,
  deleteCoupon,
  applyCoupon,
} from "../controllers/couponController.js";

const router = express.Router();

// Routes
router.post("/", createCoupon); // Create a coupon
router.get("/", getAllCoupons); // Get all coupons
router.delete("/:id", deleteCoupon); // Delete a coupon
router.post("/apply", applyCoupon); // Apply a coupon

export default router;
