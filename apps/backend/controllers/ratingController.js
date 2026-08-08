import mongoose from 'mongoose';
import Rating from '../models/Rating.js';
import Order from '../models/Order.js';

export const submitRating = async (req, res) => {
  try {
    const { orderId, rating, review } = req.body;
    const customerId = req.user.id;

    // Verify order exists and belongs to the customer (optional)
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    if (order.customer.toString() !== customerId) {
      return res.status(403).json({ message: "You cannot rate this order." });
    }

    const newRating = await Rating.create({
      order: orderId,
      customer: customerId,
      rating,
      review,
    });

    res.status(201).json({ message: "Rating submitted.", rating: newRating });
  } catch (error) {
    console.error("Submit Rating Error:", error);
    res.status(500).json({ message: "Failed to submit rating." });
  }
};

// get rating by order id

export const getRatingByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate orderId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid Order ID." });
    }

    // Find the rating for the given order
    const rating = await Rating.findOne({ order: orderId }).populate("customer", "name email");

    if (!rating) {
      return res.status(404).json({ message: "No rating found for this order." });
    }

    res.status(200).json(rating);
  } catch (error) {
    console.error("Error fetching rating for order:", error.message);
    res.status(500).json({ message: "Failed to fetch rating." });
  }
};


 // get rating by product

  export const getRatingsByProductId = async (req, res) => {
    try {
      const { productId } = req.params;
      if (!productId) {
        return res.status(400).json({ message: "Product ID is required." });
      }
  
      // Find orders that include the product (requires order model details)
      const ordersWithProduct = await Order.find({ 'items.product': productId }).select('_id');
      const orderIds = ordersWithProduct.map(order => order._id);
  
      // Find ratings for those orders
      const ratings = await Rating.find({ order: { $in: orderIds } });
  
      res.status(200).json(ratings);
    } catch (error) {
      console.error("Error fetching ratings by product:", error.message);
      res.status(500).json({ message: "Failed to fetch ratings." });
    }
  };