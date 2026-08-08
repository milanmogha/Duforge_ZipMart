import express from "express";
import { getBotResponse, connectToSupport } from "../controllers/chatbotController.js";

const router = express.Router();

// Chatbot responses (FAQs)
router.post("/", getBotResponse);

// Escalate to human support
router.post("/support", connectToSupport);

export default router;
