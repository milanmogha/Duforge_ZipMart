import express from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
  clearCart,
  updateCart,
} from "../controllers/cartController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/add", addToCart);
router.get("/", getCart);
router.post("/remove", removeFromCart);
router.delete("/clear", clearCart);
router.put("/update", updateCart);

export default router;
