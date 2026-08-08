import { Router } from "express";
import {
  createSupportRequest,
  getPendingCustomerRequests,
  getPendingShopkeeperRequests,
  adminAcceptChat,
  sendMessage,
  endSession,
  getChatHistory,
} from "../controllers/supportController.js";

const router = Router();

// POST /api/support/request  (Create new support request)
router.post("/request", createSupportRequest);

// GET /api/support/pending-customer-requests
router.get("/pending-customer-requests", getPendingCustomerRequests);

// GET /api/support/pending-shopkeeper-requests
router.get("/pending-shopkeeper-requests", getPendingShopkeeperRequests);

// POST /api/support/accept-chat
router.post("/accept-chat", adminAcceptChat);

// POST /api/support/send-message
router.post("/send-message", sendMessage);

// POST /api/support/end-session
router.post("/end-session", endSession);

// GET /api/support/history/:socketId
router.get("/history/:socketId", getChatHistory);

export default router;
