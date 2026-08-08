import Delivery from "../models/Delivery.js";
import Order from "../models/Order.js";
import DeliveryBoy from "../models/DeliveryBoy.js";
import axios from "axios";

// Google Maps Distance Matrix API Key
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Create a delivery for a new order
 */
export const createDelivery = async (req, res) => {
  try {
    const { orderId, deliveryBoyId, pickupLocation, dropoffLocation } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const deliveryBoy = await DeliveryBoy.findById(deliveryBoyId);
    if (!deliveryBoy || deliveryBoy.status !== "active") {
      return res
        .status(400)
        .json({ message: "Delivery boy is not available or inactive." });
    }

    // Check if the delivery boy is within a 5 KM radius
    const distance = await calculateDistance(
      pickupLocation,
      deliveryBoy.location // DeliveryBoy's current location
    );
    if (distance > 5) {
      return res.status(400).json({
        message: "Delivery boy is not within the 5 KM radius of the shop.",
      });
    }

    // Create the delivery
    const delivery = new Delivery({
      order: orderId,
      deliveryBoy: deliveryBoyId,
      pickupLocation,
      dropoffLocation,
    });

    await delivery.save();
    return res
      .status(201)
      .json({ message: "Delivery created successfully.", delivery });
  } catch (error) {
    console.error("Error creating delivery:", error);
    return res.status(500).json({ message: "Error creating delivery." });
  }
};

/**
 * Update delivery status (e.g., Accepted, In Transit, Delivered)
 */
export const updateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryId, status } = req.body;

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found." });
    }

    delivery.status = status;
    if (status === "Delivered") {
      delivery.deliveryTime = new Date();
    }

    await delivery.save();
    return res
      .status(200)
      .json({ message: "Delivery status updated successfully.", delivery });
  } catch (error) {
    console.error("Error updating delivery status:", error);
    return res
      .status(500)
      .json({ message: "Error updating delivery status." });
  }
};

/**
 * Get deliveries for a specific delivery boy
 */
export const getDeliveriesByDeliveryBoy = async (req, res) => {
  try {
    const { deliveryBoyId } = req.params;

    const deliveries = await Delivery.find({ deliveryBoy: deliveryBoyId })
      .populate("order")
      .sort({ createdAt: -1 });

    return res.status(200).json(deliveries);
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    return res
      .status(500)
      .json({ message: "Error fetching deliveries for delivery boy." });
  }
};

/**
 * Calculate the distance between two locations using Google Maps API
 */
const calculateDistance = async (origin, destination) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json`,
      {
        params: {
          origins: `${origin.latitude},${origin.longitude}`,
          destinations: `${destination.latitude},${destination.longitude}`,
          key: GOOGLE_MAPS_API_KEY,
        },
      }
    );

    const distanceInMeters =
      response.data.rows[0].elements[0].distance.value || 0;
    return distanceInMeters / 1000; // Convert to kilometers
  } catch (error) {
    console.error("Error calculating distance:", error);
    throw new Error("Failed to calculate distance.");
  }
};

/**
 * Get all deliveries (Admin only)
 */
export const getAllDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find()
      .populate("order")
      .populate("deliveryBoy")
      .sort({ createdAt: -1 });

    return res.status(200).json(deliveries);
  } catch (error) {
    console.error("Error fetching all deliveries:", error);
    return res.status(500).json({ message: "Error fetching all deliveries." });
  }
};

/**
 * Track delivery by Order ID
 */
export const trackDeliveryByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the delivery associated with the order
    const delivery = await Delivery.findOne({ order: orderId })
      .populate("order")
      .populate("deliveryBoy");

    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found for the given order ID." });
    }

    return res.status(200).json({
      message: "Delivery details fetched successfully.",
      delivery,
    });
  } catch (error) {
    console.error("Error tracking delivery:", error.message);
    return res.status(500).json({ message: "Error tracking delivery." });
  }
};
