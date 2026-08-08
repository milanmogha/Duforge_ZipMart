import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerName: {
      type: String,
      default: "",
      trim: true,
    },
    customerPhone: {
      type: String,
      default: "",
      match: [/^\d{10}$/, "Invalid phone number"],
    },
    // Coordinates for customer delivery location
    deliveryCoords: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    // Coordinates for driver’s location (updated over time)
    deliveryBoyLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product is required."],
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required."],
          min: [1, "Quantity must be at least 1."],
        },
        price: {
          type: Number,
          required: [true, "Price is required."],
          min: [0, "Price cannot be negative."],
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required."],
      min: [0, "Total amount cannot be negative."],
    },
    paymentMethod: {
      type: String,
      default: "Cash On Delivery",
      enum: ["Cash On Delivery", "Razorpay"],
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    deliveryAddress: {
      type: String,
      required: [true, "Delivery address is required."],
      trim: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    shopName: {
      type: String,
      required: [true, "Shop name is required."],
      trim: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    couponCode: {
      type: String,
      default: null,
      trim: true,
    },
    deliveryStatus: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "InTransit",
        "Delivered",
        "Cancelled",
        "Rejected"
      ],
      default: "Pending",
    },
    deliveryBoy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      default: null,
    },
    // NEW: Field to store the delivery boy's computed earning for the order.
    deliveryBoyEarning: {
      type: Number,
      default: 0,
    },
    // Platform & delivery fees applied at checkout (informational / accounting).
    platformFee: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
