import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import Shop from "../models/Shop.js";
import mongoose from "mongoose";
import { getDistanceFromLatLonInKm } from "../utils/distance.js";
import { io } from "../index.js";
import { generateInvoice } from "./invoiceController.js";
import { Expo } from "expo-server-sdk";

// Helper function to format product images in an order to Base64
const formatOrderImages = (order) => {
  if (!order) return order;
  const formattedOrder = order.toObject();
  formattedOrder.items = formattedOrder.items.map((item) => {
    const product = item.product;
    if (product && product.images) {
      Object.keys(product.images).forEach((key) => {
        const image = product.images[key];
        if (image?.data && image?.contentType) {
          product.images[key].data = image.data.toString("base64");
        } else {
          product.images[key] = { data: null, contentType: null };
        }
      });
    }
    return { ...item, product };
  });
  return formattedOrder;
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId).populate("customer");
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.deliveryStatus = status;
    await order.save();

    if (status === "Delivered") {
      try {
        // Generate and save the invoice when order is delivered
        await generateInvoice(orderId);
      } catch (err) {
        console.error("Error generating invoice:", err.message);
        return res.status(500).json({ message: "Failed to generate invoice." });
      }
    }

    res.status(200).json({ message: "Order status updated successfully", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create separate orders for products grouped by shop, accounting for discounts and coupons
 * POST /orders/create
 * Protected (Customer only)
 */
export const createOrder = async (req, res) => {
  try {
    const {
      items,
      totalAmount,
      discountAmount = 0,
      deliveryAddress,
      paymentMethod,
      couponCode,
      customerName,
      customerPhone,
      deliveryCoords,
      platformFee = 0,
      deliveryFee = 0,
      deliveryBoyEarning = 0,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items are missing or invalid." });
    }

    if (!deliveryAddress) {
      return res.status(400).json({ message: "Delivery address is required." });
    }

    const itemsByShop = {};
    let totalCalculatedAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.product).populate("shopkeeperId");
      if (!product) {
        return res.status(404).json({ message: `Product with ID ${item.product} not found.` });
      }

      // ✅ Check if stock is available
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product "${product.name}". Only ${product.stock} left.`,
        });
      }

      const discountPercent = product.discount || 0;
      const discountedUnitPrice = parseFloat(
        (product.price - (product.price * discountPercent) / 100).toFixed(2)
      );
      const totalItemPrice = parseFloat((discountedUnitPrice * item.quantity).toFixed(2));

      const shopId = product.shopkeeperId._id.toString();
      const shopName = product.shopkeeperId.shopName;

      if (!itemsByShop[shopId]) {
        itemsByShop[shopId] = { shopName, items: [] };
      }

      itemsByShop[shopId].items.push({
        product: item.product,
        quantity: item.quantity,
        price: totalItemPrice,
      });

      totalCalculatedAmount += totalItemPrice;
    }

    totalCalculatedAmount = parseFloat(totalCalculatedAmount.toFixed(2));
    const adjustedTotal = parseFloat((totalCalculatedAmount - discountAmount).toFixed(2));

    if (adjustedTotal !== parseFloat(totalAmount.toFixed(2))) {
      return res.status(400).json({
        message: "Total amount does not match the sum of item prices after discounts.",
        details: {
          totalCalculatedAmount,
          discountAmount,
          adjustedTotal,
          frontendTotal: totalAmount,
        },
      });
    }

    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (!coupon) {
        return res.status(400).json({ message: "Invalid or expired coupon." });
      }
      if (coupon.usageCount >= coupon.usageLimit) {
        return res.status(400).json({ message: "Coupon usage limit exceeded." });
      }
    }

    const createdOrders = [];

    const shopIds = Object.keys(itemsByShop);
    const shopTotals = shopIds.map((shopId) =>
      itemsByShop[shopId].items.reduce((sum, item) => sum + item.price, 0)
    );
    const totalShopAmount = shopTotals.reduce((sum, amount) => sum + amount, 0);

    const discountPerShop = shopTotals.map((shopTotal) => {
      if (totalShopAmount === 0) return 0;
      return parseFloat(((shopTotal / totalShopAmount) * discountAmount).toFixed(2));
    });

    for (let i = 0; i < shopIds.length; i++) {
      const shopId = shopIds[i];
      const shopName = itemsByShop[shopId].shopName;
      const shopItems = itemsByShop[shopId].items;
      const shopTotalAmount = shopTotals[i];
      const shopDiscount = discountPerShop[i];
      const adjustedShopTotal = parseFloat((shopTotalAmount - shopDiscount).toFixed(2));

      const newOrder = new Order({
        customer: req.user.id,
        items: shopItems,
        totalAmount: adjustedShopTotal,
        deliveryAddress,
        paymentMethod,
        paymentStatus: paymentMethod === "Razorpay" ? "Paid" : "Pending",
        shopId,
        shopName,
        customerName: customerName || "",
        customerPhone: customerPhone || "",
        deliveryCoords: deliveryCoords || { latitude: 0, longitude: 0 },
        couponCode: couponCode || null,
        platformFee: platformFee || 0,
        deliveryFee: deliveryFee || 0,
        deliveryBoyEarning: deliveryBoyEarning || 0,
      });

      await newOrder.save();

      // ✅ Update stock for each product in this shop order
      for (const item of shopItems) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock -= item.quantity;
          if (product.stock < 0) product.stock = 0; // Prevent negative stock
          await product.save();
        }
      }

      io.emit("new-order", newOrder);
      createdOrders.push(newOrder);
    }

    if (coupon) {
      coupon.usageCount += 1;
      if (coupon.usageCount >= coupon.usageLimit) {
        coupon.isActive = false;
      }
      await coupon.save();
    }

    // 🔔 Push Notifications to Delivery Boys
    try {
      const DeliveryBoy = (await import("../models/DeliveryBoy.js")).default;
      const deliveryBoys = await DeliveryBoy.find({ status: "active" });

      const messages = [];
      for (const boy of deliveryBoys) {
        if (boy.deviceTokens && boy.deviceTokens.length > 0) {
          for (const pushToken of boy.deviceTokens) {
            if (!Expo.isExpoPushToken(pushToken)) {
              console.error(`Push token ${pushToken} is not a valid Expo push token.`);
              continue;
            }
            messages.push({
              to: pushToken,
              sound: "default",
              body: "A new order has been placed!",
              data: { orderNotification: true },
            });
          }
        }
      }

      if (messages.length > 0) {
        const expo = new Expo();
        await expo.sendPushNotificationsAsync(messages);
      }
    } catch (pushError) {
      console.error("Failed to send delivery-boy push notifications:", pushError.message);
    }

    return res.status(201).json({
      message: "Orders created and stock updated successfully.",
      orders: createdOrders,
    });
  } catch (error) {
    console.error("Error creating orders:", error.message);
    return res.status(500).json({ message: error.message });
  }
};



/**
 * Get orders for a specific shop using the Shop model
 * GET /orders/shop/:shopId
 * Protected (Shopkeeper only)
 */
export const getShopOrders = async (req, res) => {
  try {
    const { shopId } = req.params;

    // Validate shopId from the token and request params
    if (!shopId) {
      return res.status(400).json({ message: "Shop ID is required." });
    }

    // Validate if the shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      console.error("Shop not found for shopId:", shopId);
      return res.status(404).json({ message: "Shop not found." });
    }

    // Validate if the logged-in user matches the shop ID
    if (req.shopId !== shopId) {
      console.error(
        `Access denied: Shopkeeper ID ${req.shopId} tried to access shop ${shopId}.`
      );
      return res.status(403).json({ message: "Access denied." });
    }

    // Fetch the orders
    const orders = await Order.find({ shopId })
      .populate({
        path: "items.product",
        select: "name price",
      })
      .sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(200).json({ message: "No orders found for this shop." });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching shop orders:", error.message);
    res.status(500).json({ message: "Unable to fetch shop orders." });
  }
};

/**
 * Get all orders for the logged-in customer
 * GET /orders/customer
 * Protected
 */
export const getCustomerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id })
      .populate("items.product")
      .sort({ createdAt: -1 });

    const formattedOrders = orders.map(formatOrderImages);
    return res.status(200).json(formattedOrders);
  } catch (error) {
    console.error("Error fetching customer orders:", error.message);
    return res.status(500).json({ message: "Unable to fetch orders." });
  }
};

/**
 * Get details of a specific order
 * GET /orders/:orderId
 */
/**
 * Get details of a specific order
 * GET /orders/:orderId
 */
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Populate shopId with required fields from Shop
    const order = await Order.findById(orderId)
      .populate("items.product")
      .populate({
        path: "shopId",
        select: "shopName phone location gstNumber locationCoordinates",
      });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Format images in the order (if needed)
    const formattedOrder = formatOrderImages(order);

    // Merge additional shop fields from the populated shop document
    formattedOrder.customerName = order.customerName;
    formattedOrder.customerPhone = order.customerPhone;
    formattedOrder.shopId = order.shopId._id;
    formattedOrder.shopName = order.shopId.shopName;
    formattedOrder.shopPhone = order.shopId.phone;       // New field
    formattedOrder.shopAddress = order.shopId.location;    // New field
    formattedOrder.shopGstNumber = order.shopId.gstNumber;   // New field
    formattedOrder.shopCoords = order.shopId.locationCoordinates;
    formattedOrder.customerCoords = order.deliveryCoords;

    // Include deliveryBoyLocation if available
    if (order.deliveryBoyLocation) {
      formattedOrder.deliveryBoyLocation = order.deliveryBoyLocation;
    }

    return res.status(200).json(formattedOrder);
  } catch (error) {
    console.error("Error fetching order details:", error.message);
    return res
      .status(500)
      .json({ message: "Unable to fetch order details." });
  }
};



// cancel order


export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log("Cancel Order Request Received:", { orderId, userId: req.user.id });

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to cancel this order." });
    }

    if (order.deliveryStatus === "Delivered" || order.deliveryStatus === "InTransit") {
      return res
        .status(400)
        .json({ message: "Order cannot be cancelled at this stage." });
    }

    order.deliveryStatus = "Cancelled";
    const cancelledOrder = await order.save();

    // Emit real-time notification for the cancellation
    io.emit("order-cancelled", { message: "Order cancelled", order: cancelledOrder });

    const formattedOrder = formatOrderImages(cancelledOrder);
    return res.status(200).json(formattedOrder);
  } catch (error) {
    console.error("Error canceling order:", error.message, error.stack);
    return res.status(500).json({ message: "Unable to cancel order." });
  }
};


/**
 * Get all orders across the platform (Admin only)
 * GET /orders/all
 * Protected (Admin only)
 */
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching all orders:", error.message);
    return res
      .status(500)
      .json({ message: "Unable to fetch all orders." });
  }
};

/**
 * GET /orders/in-range?lat=xx&lng=yy
 * Delivery boy calls this to see which orders are within 5 km (still pending).
 */
export const getOrdersInRange = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude are required." });
    }

    const boyLat = parseFloat(lat);
    const boyLng = parseFloat(lng);

    const pendingOrders = await Order.find({ deliveryStatus: "Pending" });

    // Filter and attach distances
    const ordersInRange = pendingOrders.filter((order) => {
      if (
        order.deliveryCoords &&
        typeof order.deliveryCoords.latitude === "number" &&
        typeof order.deliveryCoords.longitude === "number"
      ) {
        const distance = getDistanceFromLatLonInKm(
          boyLat,
          boyLng,
          order.deliveryCoords.latitude,
          order.deliveryCoords.longitude
        );
        return distance <= 5; // Include orders within 5 km range
      }
      return false; // Exclude invalid coordinates
    }).map((order) => {
      const distance = getDistanceFromLatLonInKm(
        boyLat,
        boyLng,
        order.deliveryCoords.latitude,
        order.deliveryCoords.longitude
      );
      return { ...order.toObject(), distance: distance.toFixed(1) }; // Attach distance
    });

    // Emit real-time updates to connected delivery boys
    io.emit("orders-updated", ordersInRange);

    return res.status(200).json(ordersInRange);
  } catch (error) {
    console.error("Error fetching in-range orders:", error);
    return res.status(500).json({ message: "Failed to fetch in-range orders." });
  }
};


/**
 * PATCH /orders/:orderId/pick
 * Delivery boy picks the order, sets it "InTransit."
 */
export const pickOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const deliveryBoyId = req.user.id;

    console.log(`Picking order: ${orderId} by deliveryBoyId: ${deliveryBoyId}`);

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (String(order.deliveryBoy) !== String(deliveryBoyId)) {
      return res.status(403).json({ message: "Order not assigned to you." });
    }
    if (order.deliveryStatus !== "Accepted") {
      return res.status(400).json({ message: "Order cannot be picked now." });
    }

    order.deliveryStatus = "InTransit";
    const updatedOrder = await order.save();

    console.log("Order status updated to InTransit:", updatedOrder);

    io.emit("order-picked", {
      message: "Order has been picked by the delivery boy",
      order: {
        id: order._id,
        deliveryBoy: deliveryBoyId,
        deliveryStatus: order.deliveryStatus,
      },
    });

    return res.status(200).json({ message: "Order picked successfully.", order: updatedOrder });
  } catch (error) {
    console.error("Error picking order:", error.message);
    return res.status(500).json({ message: "Failed to pick order." });
  }
};


/**
 * PATCH /orders/:orderId/accept
 * Delivery boy accepts a pending order
 */
export const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const deliveryBoyId = req.user.id;

    const order = await Order.findById(orderId).populate("shopId");

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.deliveryStatus !== "Pending") {
      return res.status(400).json({ message: "Order is not available for acceptance." });
    }

    const activeOrder = await Order.findOne({
      deliveryBoy: deliveryBoyId,
      deliveryStatus: { $in: ["Accepted", "InTransit"] },
    });

    if (activeOrder) {
      if (
        String(activeOrder.shopId._id) !== String(order.shopId._id) ||
        String(activeOrder.customer) !== String(order.customer)
      ) {
        return res.status(400).json({
          message: "You can only accept multiple orders if they are from the same shop and customer.",
        });
      }
    }

    order.deliveryStatus = "Accepted";
    order.deliveryBoy = deliveryBoyId;
    await order.save();

    io.emit("order-updated", {
      message: "Order has been accepted",
      order: {
        id: order._id,
        deliveryBoy: deliveryBoyId,
        deliveryStatus: order.deliveryStatus,
      },
    });

    return res.status(200).json({ message: "Order accepted successfully.", order });
  } catch (error) {
    console.error("Error accepting order:", error.message);
    return res.status(500).json({ message: "Failed to accept order." });
  }
};

/**
 * PATCH /orders/:orderId/reject
 * Delivery boy rejects a previously accepted or pending order
 */
export const rejectOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const deliveryBoyId = req.user.id;

    // Find the order by ID
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Check if the order can be rejected
    if (order.deliveryStatus !== "Pending" && order.deliveryStatus !== "Accepted") {
      return res.status(400).json({ message: "Order cannot be rejected in its current status." });
    }

    // If the order is accepted, verify it was assigned to the current delivery boy
    if (order.deliveryStatus === "Accepted" && String(order.deliveryBoy) !== String(deliveryBoyId)) {
      return res.status(403).json({ message: "Order not assigned to you." });
    }

    // Update the order to be available for others
    order.deliveryStatus = "Pending";
    order.deliveryBoy = null;
    await order.save();

    // Emit real-time notification for the rejected order
    io.emit("order-rejected", {
      message: "Order has been rejected",
      order: {
        id: order._id,
        previousDeliveryBoy: deliveryBoyId,
        deliveryStatus: order.deliveryStatus,
      },
    });

    // Return a success response
    return res.status(200).json({
      message: "Order rejected successfully. It is now available for other delivery boys.",
      order,
    });
  } catch (error) {
    console.error("Error rejecting order:", error.message);
    return res.status(500).json({ message: "Failed to reject order." });
  }
};

/**
 * Update order delivery status
 * PATCH /orders/:orderId/delivery-status
 * Protected
 */
export const updateOrderDeliveryStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryStatus } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    order.deliveryStatus = deliveryStatus;
    const updatedOrder = await order.save();

    // Emit real-time notification
    io.emit("order-updated", updatedOrder);

    return res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Error updating delivery status:", error.message);
    return res.status(500).json({ message: "Unable to update delivery status." });
  }
};

/**
 * GET /orders/accepted
 * Returns all orders accepted by the logged-in delivery boy.
 * Protected (Delivery boy only)
 */
export const getAcceptedOrders = async (req, res) => {
  try {
    // Ensure the role is deliveryBoy through authMiddleware
    const deliveryBoyId = req.user.id;
    const acceptedOrders = await Order.find({ deliveryBoy: deliveryBoyId, deliveryStatus: 'Accepted' });
    return res.status(200).json(acceptedOrders);
  } catch (error) {
    console.error("Error fetching accepted orders:", error.message);
    return res.status(500).json({ message: "Unable to fetch accepted orders." });
  }
};


/**
 * GET /orders/in-transit
 * Returns all orders in transit assigned to the logged-in delivery boy.
 * Protected (Delivery boy only)
 */
export const getInTransitOrders = async (req, res) => {
  try {
    const deliveryBoyId = req.user.id;
    console.log("Fetching in-transit orders for deliveryBoyId:", deliveryBoyId);

    const inTransitOrders = await Order.find({
      deliveryBoy: deliveryBoyId,
      deliveryStatus: 'InTransit',
    })
      .populate('items.product', 'name price images')
      .populate('shopId', 'shopName locationCoordinates')
      .exec();

    console.log("In-Transit Orders Found:", inTransitOrders);

    if (!inTransitOrders || inTransitOrders.length === 0) {
      return res.status(200).json([]); // Return an empty array instead of 404
    }

    return res.status(200).json(inTransitOrders);
  } catch (error) {
    console.error('Error fetching in-transit orders:', error.message);
    return res.status(500).json({ message: 'Failed to fetch in-transit orders.', error: error.message });
  }
};

/**
 * Update payment status of an order
 * PATCH /orders/:orderId/payment-status
 * Protected (Delivery Boy or Admin)
 */
export const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;

    // Validate payment status
    if (!['Pending', 'Paid', 'Failed'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status.' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    order.paymentStatus = paymentStatus;
    const updatedOrder = await order.save();

    // Emit real-time notification for updated payment status
    io.emit('payment-status-updated', {
      message: 'Payment status updated successfully.',
      order: updatedOrder,
    });

    return res.status(200).json({
      message: `Payment status updated to ${paymentStatus}.`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating payment status:', error.message);
    return res.status(500).json({ message: 'Failed to update payment status.' });
  }
};


/**
 * GET /orders/delivered
 * Returns all orders with a deliveryStatus of 'Delivered' for the logged-in delivery boy.
 * Protected (Delivery boy only)
 */
export const getDeliveredOrders = async (req, res) => {
  try {
    let deliveryBoyId;
    // Allow admin to fetch delivered orders for any delivery boy using a query parameter
    if (req.user.role && req.user.role.toLowerCase() === "admin") {
      deliveryBoyId = req.query.deliveryBoyId;
      if (!deliveryBoyId) {
        return res.status(400).json({ message: "DeliveryBoyId query parameter is required for admin" });
      }
    } else {
      // For a delivery boy, use his own id
      deliveryBoyId = req.user.id;
    }
    const deliveredOrders = await Order.find({
      deliveryBoy: deliveryBoyId,
      deliveryStatus: "Delivered"
    }).sort({ createdAt: -1 });
    return res.status(200).json(deliveredOrders);
  } catch (error) {
    console.error("Error fetching delivered orders:", error.message);
    return res.status(500).json({ message: "Unable to fetch delivered orders." });
  }
};



/**
 * Update the delivery boy's live location for an order
 * PATCH /orders/:orderId/location
 */
export const updateDeliveryBoyLocation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { latitude, longitude } = req.body;

    // Validate input
    if (latitude == null || longitude == null) {
      return res.status(400).json({ message: "Latitude and longitude are required." });
    }

    // Find the order
    const order = await Order.findById(orderId).populate("deliveryBoy");
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Check if the order is assigned to a delivery boy
    if (!order.deliveryBoy) {
      return res.status(400).json({ message: "Order is not assigned to any delivery boy." });
    }

    // Check if the requesting user is the assigned delivery boy
    if (String(order.deliveryBoy._id) !== String(req.user.id)) {
      return res.status(403).json({ message: "You are not assigned to this order." });
    }

    // Check if the order status allows location updates
    if (!["Accepted", "InTransit"].includes(order.deliveryStatus)) {
      return res.status(400).json({
        message: "Cannot update location for orders not in Accepted or InTransit status.",
      });
    }

    // Emit the location update via Socket.IO to specific rooms/namespaces if needed
    const locationUpdate = {
      orderId,
      deliveryBoyLocation: { latitude, longitude },
    };

    // Emit to all connected clients or specific rooms as per your application's architecture
    io.emit("location-update", locationUpdate);

    res.status(200).json({ message: "Location updated successfully", locationUpdate });
  } catch (error) {
    console.error("Error updating location:", error.message);
    res.status(500).json({ message: "Failed to update location." });
  }
};