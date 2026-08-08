import express from "express";
import { 
  createOrder, 
  verifyPayment, 
  createNativeOrder, 
  nativeCheckout, 
  nativePaymentSuccess 
} from "../controllers/paymentController.js";

const router = express.Router();

// Web payment routes
router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);

// Native payment routes
router.post("/native/create-order", createNativeOrder);
router.get("/native/checkout", nativeCheckout);
router.get("/native/payment-success", nativePaymentSuccess);

export default router;
