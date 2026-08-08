import Coupon from "../models/Coupon.js";

/**
 * Create a new coupon
 * POST /api/coupons
 */
export const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, usageLimit, expirationDate, expirationTime } = req.body;

    // Backend validation
    if (!code || !discountType || !discountValue || !usageLimit || !expirationDate || !expirationTime) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (discountValue <= 0) {
      return res.status(400).json({ message: "Discount value must be greater than 0." });
    }

    if (discountType === "percentage" && discountValue > 98) {
      return res.status(400).json({ message: "Percentage discount cannot exceed 98%." });
    }

    const expirationDateObject = new Date(expirationDate);

    // Validate and format expiration time (24-hour format)
    const [hours, minutes] = expirationTime.split(":").map(Number);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return res.status(400).json({ message: "Invalid time format. Use HH:mm in 24-hour format." });
    }

    expirationDateObject.setHours(hours, minutes, 0, 0);

    if (expirationDateObject < new Date()) {
      return res.status(400).json({ message: "Expiration date and time must be in the future." });
    }

    const coupon = new Coupon({
      code,
      discountType,
      discountValue,
      usageLimit,
      usageCount: 0,
      expirationDate,
      expirationTime,
      isActive: true,
    });

    await coupon.save();
    return res.status(201).json({ message: "Coupon created successfully.", coupon });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return res.status(500).json({ message: "Failed to create coupon." });
  }
};

/**
 * Get all coupons
 * GET /api/coupons
 */
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return res.status(200).json(coupons);
  } catch (error) {
    console.error("Error fetching coupons:", error.message);
    return res.status(500).json({ message: "Failed to fetch coupons" });
  }
};

/**
 * Delete a coupon
 * DELETE /api/coupons/:id
 */
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    await Coupon.deleteOne({ _id: id });
    return res.status(200).json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Error deleting coupon:", error.message);
    return res.status(500).json({ message: "Failed to delete coupon" });
  }
};

/**
 * Apply a coupon
 * POST /api/coupons/apply
 */
export const applyCoupon = async (req, res) => {
  try {
    const { code, totalAmount } = req.body;

    if (!code || totalAmount === undefined) {
      return res.status(400).json({ message: "Code and total amount are required" });
    }

    const coupon = await Coupon.findOne({ code, isActive: true });
    if (!coupon) {
      return res.status(404).json({ message: "Invalid or expired coupon" });
    }

    if (coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }

    const expirationDateObject = new Date(coupon.expirationDate);
    const [hours, minutes] = coupon.expirationTime.split(":").map(Number);
    expirationDateObject.setHours(hours, minutes, 0, 0);

    if (new Date() > expirationDateObject) {
      return res.status(400).json({ message: "Coupon has expired" });
    }

    let discount = 0;
    if (coupon.discountType === "flat") {
      discount = coupon.discountValue;
    } else if (coupon.discountType === "percentage") {
      discount = (totalAmount * coupon.discountValue) / 100;
    }

    const finalAmount = Math.max(totalAmount - discount, 0);

    return res.status(200).json({
      message: "Coupon applied successfully",
      discount,
      finalAmount,
    });
  } catch (error) {
    console.error("Error applying coupon:", error.message);
    return res.status(500).json({ message: "Failed to apply coupon" });
  }
};
