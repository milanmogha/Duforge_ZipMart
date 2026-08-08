import express from "express";
import { generateInvoice, downloadInvoice } from "../controllers/invoiceController.js";
import { updateOrderStatus } from "../controllers/orderController.js";

const router = express.Router();

/**
 * Middleware to check if the order is delivered and generate the invoice automatically.
 * If the order is delivered, the invoice will be generated and saved in the database.
 */
const generateInvoiceOnDelivery = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (status === "Delivered") {
      // Generate invoice if the order is delivered
      const invoice = await generateInvoice(orderId);
      console.log("Invoice generated on delivery:", invoice);
    }
    next();
  } catch (error) {
    console.error("Error generating invoice on delivery:", error.message);
    res.status(500).json({ message: "Failed to generate invoice on delivery." });
  }
};

/**
 * @route PATCH /invoices/update-status/:orderId
 * @desc Update order status and generate invoice if delivered
 * @access Private (Requires authentication if needed)
 */
router.patch(
  "/update-status/:orderId",
  generateInvoiceOnDelivery,
  updateOrderStatus
);

/**
 * @route POST /invoices/generate/:orderId
 * @desc Generate Invoice for a specific order
 * @access Private (Requires authentication if needed)
 */
router.post("/generate/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Ensure orderId is provided
    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required." });
    }

    // Generate the invoice
    const invoice = await generateInvoice(orderId);

    // Send success response
    res.status(201).json({
      message: "Invoice generated successfully",
      invoice,
    });
  } catch (error) {
    console.error("Error generating invoice:", error.message);
    res.status(500).json({
      message: "Failed to generate invoice",
      error: error.message,
    });
  }
});

/**
 * @route GET /invoices/download/:orderId
 * @desc Download Invoice for a specific order
 * @access Private (Requires authentication if needed)
 */
router.get("/download/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Ensure orderId is provided
    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required." });
    }

    // Invoke downloadInvoice function to process the request
    await downloadInvoice(req, res);
  } catch (error) {
    console.error("Error downloading invoice:", error.message);
    res.status(500).json({
      message: "Failed to download invoice",
      error: error.message,
    });
  }
});

export default router;
