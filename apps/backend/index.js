// MUST stay first: ESM evaluates imported modules in order, and several of the
// modules below read process.env at module scope (mailer, cloudinary, Stripe,
// Razorpay). Calling dotenv.config() further down runs too late for those.
import "dotenv/config";

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import connectDB from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import deliveryBoyRoutes from "./routes/deliveryBoyRoutes.js";
import accountRequestsRoutes from "./routes/accountRequestsRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import banner2Routes from "./routes/banner2Routes.js";
import banner3Routes from "./routes/banner3Routes.js";
import ratingRoutes from "./routes/ratingRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import { generateInvoice } from "./controllers/invoiceController.js";
import Order from "./models/Order.js";
import supportRoutes from "./routes/supportRoutes.js";

connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Middleware to handle invoice generation when order is delivered
const handleInvoiceOnDelivery = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (status === "Delivered") {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found." });
      }

      if (order.deliveryStatus === "Delivered") {
        console.log("Invoice already generated for this order.");
        next();
        return;
      }

      await generateInvoice(orderId);
      console.log("Invoice generated successfully.");
    }
    next();
  } catch (error) {
    console.error("Error generating invoice on delivery:", error.message);
    res.status(500).json({ message: "Failed to generate invoice on delivery." });
  }
};

// Routes
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/orders", handleInvoiceOnDelivery, orderRoutes);
app.use("/api/deliveryboy", deliveryBoyRoutes);
app.use("/api/account-requests", accountRequestsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/banner2", banner2Routes);
app.use("/api/banner3", banner3Routes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/support", supportRoutes);

const PORT = process.env.PORT || 8000;

// Create HTTP server and set up Socket.IO
const server = http.createServer(app);

// Export `io` so we can import it in other controllers if needed
export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});


// ------------ Chat Logic ------------
let shopkeeperChatRequests = [];
let customerChatRequests = [];

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // ====================== SHOPKEEPER ======================
  // Shopkeeper chat request
  socket.on("shopkeeper-chat-request", () => {
    if (!shopkeeperChatRequests.includes(socket.id)) {
      shopkeeperChatRequests.push(socket.id);
      io.emit("new-shopkeeper-chat-request", shopkeeperChatRequests);
    }
    console.log("Shopkeeper chat requests:", shopkeeperChatRequests);
  });

  // Shopkeeper sends message
  socket.on("shopkeeper-message", ({ message }) => {
    io.emit("admin-receive-shopkeeper-message", {
      shopkeeperSocketId: socket.id,
      message,
    });
  });

  // Admin accepts a shopkeeper chat request
  socket.on("admin-accept-shopkeeper-chat", ({ shopkeeperSocketId }) => {
    io.to(shopkeeperSocketId).emit("shopkeeper-chat-accepted", {
      adminSocketId: socket.id,
    });
    shopkeeperChatRequests = shopkeeperChatRequests.filter(
      (id) => id !== shopkeeperSocketId
    );
    io.emit("new-shopkeeper-chat-request", shopkeeperChatRequests);
  });

  // Admin sends message to a specific shopkeeper
  socket.on("admin-shopkeeper-message", ({ shopkeeperSocketId, message }) => {
    io.to(shopkeeperSocketId).emit("shopkeeper-receive-message", { message });
  });

  // Shopkeeper ends session
  socket.on("shopkeeper-end-session", () => {
    io.emit("shopkeeper-end-session", { shopkeeperSocketId: socket.id });
  });

  // Admin forcibly ends shopkeeper session
  socket.on("admin-end-chat", ({ shopkeeperSocketId }) => {
    io.to(shopkeeperSocketId).emit("chat-deleted");
  });

  // Admin "deletes" a shopkeeper chat (existing logic)
  socket.on("admin-delete-chat", ({ shopkeeperSocketId }) => {
    io.to(shopkeeperSocketId).emit("chat-deleted");
    console.log(
      `Chat with shopkeeper ${shopkeeperSocketId} has been deleted by admin.`
    );
  });

  // ====================== CUSTOMER ======================
  // Customer chat request
  socket.on("customer-chat-request", () => {
    if (!customerChatRequests.includes(socket.id)) {
      customerChatRequests.push(socket.id);
      io.emit("new-customer-chat-request", customerChatRequests);
    }
    console.log("Customer chat requests:", customerChatRequests);
  });

  // Customer sends message
  socket.on("customer-message", ({ message }) => {
    io.emit("admin-receive-customer-message", {
      customerSocketId: socket.id,
      message,
    });
  });

  // Admin accepts a customer chat request
  socket.on("admin-accept-customer-chat", ({ customerSocketId }) => {
    io.to(customerSocketId).emit("customer-chat-accepted", {
      adminSocketId: socket.id,
    });
    customerChatRequests = customerChatRequests.filter(
      (id) => id !== customerSocketId
    );
    io.emit("new-customer-chat-request", customerChatRequests);
  });

  // Admin sends a message to a specific customer
  socket.on("admin-customer-message", ({ customerSocketId, message }) => {
    io.to(customerSocketId).emit("customer-receive-message", { message });
  });

  // Customer ends session
  socket.on("customer-end-session", () => {
    io.emit("customer-end-session", { customerSocketId: socket.id });
  });

  // Admin forcibly ends customer session
  socket.on("admin-end-session", ({ customerSocketId }) => {
    io.to(customerSocketId).emit("admin-end-session");
  });

  // ====================== DISCONNECT ======================
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    shopkeeperChatRequests = shopkeeperChatRequests.filter(
      (id) => id !== socket.id
    );
    customerChatRequests = customerChatRequests.filter(
      (id) => id !== socket.id
    );
    io.emit("new-shopkeeper-chat-request", shopkeeperChatRequests);
    io.emit("new-customer-chat-request", customerChatRequests);
  });
});
// ------------ End Chat Logic ------------

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
