import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import Invoice from "../models/Invoice.js";
import Order from "../models/Order.js";

export const generateInvoice = async (orderId) => {
  try {
    const order = await Order.findById(orderId)
      .populate("customer")
      .populate("shopId");

    if (!order) throw new Error("Order not found");

    const invoicePath = path.join(
      "invoices",
      `invoice_${orderId}_${Date.now()}.pdf`
    );

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(invoicePath));

    // Title
    doc.fontSize(20).text("Invoice", { align: "center" }).moveDown(2);

    // Order Details
    doc.fontSize(12).text(`Invoice ID: ${order._id}`);
    doc.text(`Customer Name: ${order.customerName || "N/A"}`);
    doc.text(`Customer Phone: ${order.customerPhone || "N/A"}`);
    doc.text(`Order Date: ${new Date(order.orderDate).toLocaleDateString()}`);
    doc.text(`Total Amount: ₹${order.totalAmount}`).moveDown(1);

    // Shop Details
    doc.text(`Shop ID: ${order.shopId?._id || "N/A"}`);
    doc.text(`Shop Name: ${order.shopName || "N/A"}`).moveDown(1);

    // Payment Details
    doc.text(`Payment Method: ${order.paymentMethod}`);
    doc.text(`Payment Status: ${order.paymentStatus}`).moveDown(1);

    // Delivery Details
    doc.text(`Delivery Address: ${order.deliveryAddress}`);
    if (order.deliveryCoords) {
      doc.text(
        `Coords: ${order.deliveryCoords.latitude}, ${order.deliveryCoords.longitude}`
      );
    }
    doc.text(`Delivery Status: ${order.deliveryStatus}`).moveDown(2);

    // Items
    doc.fontSize(14).text("Items:", { underline: true }).moveDown(0.5);
    order.items.forEach((item, index) => {
      doc
        .fontSize(12)
        .text(
          `${index + 1}. ${item.product?.name || "N/A"} - ₹${item.price} x ${
            item.quantity
          }`
        );
    });

    // Finalize and close the document
    doc.end();

    // Save invoice to database
    const newInvoice = new Invoice({
      orderId: order._id,
      customerId: order.customer,
      shopId: order.shopId?._id,
      shopName: order.shopName,
      deliveryStatus: order.deliveryStatus,
      orderDate: order.orderDate,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      deliveryAddress: order.deliveryAddress,
      totalAmount: order.totalAmount,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryCoords: order.deliveryCoords,
      invoicePath,
    });

    await newInvoice.save();

    return newInvoice;
  } catch (error) {
    console.error("Error generating invoice:", error.message);
    throw new Error("Failed to generate invoice.");
  }
};

export const downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const invoice = await Invoice.findOne({ orderId });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const filePath = path.resolve(invoice.invoicePath);
    res.download(filePath, (err) => {
      if (err) {
        console.error("Error downloading invoice:", err.message);
        res.status(500).json({ message: "Failed to download invoice" });
      }
    });
  } catch (error) {
    console.error("Error downloading invoice:", error.message);
    res.status(500).json({ message: "Failed to download invoice" });
  }
};
