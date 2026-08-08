import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";
import { io } from "../index.js";

// Helper function to format product images to Base64
const formatCartImages = (cart) => {
  const formattedCart = cart.toObject();
  formattedCart.items = formattedCart.items.map((item) => {
    const product = item.product;
    const formattedProduct = { ...product };
    if (product.images) {
      Object.keys(product.images).forEach((key) => {
        const image = product.images[key];
        if (image?.data && image?.contentType) {
          formattedProduct.images[key].data = image.data.toString("base64");
        } else {
          formattedProduct.images[key] = { data: null, contentType: null };
        }
      });
    }
    return { ...item, product: formattedProduct };
  });
  return formattedCart;
};

// Add or update an item in the cart
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [{ product: productId, quantity }],
      });
      await cart.save();
      cart = await cart.populate("items.product");
      cart = formatCartImages(cart);
      io.emit("cartUpdated", { userId, cart });
      return res.status(201).json(cart);
    }

    const productIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (productIndex !== -1) {
      cart.items[productIndex].quantity = quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    cart = await cart.populate("items.product");
    cart = formatCartImages(cart);
    io.emit("cartUpdated", { userId, cart });
    return res.status(200).json(cart);
  } catch (error) {
    console.error("Error updating cart:", error);
    return res.status(500).json({ message: "Failed to update cart" });
  }
};

// Update the quantity of an item in the cart
export const updateCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const productIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    cart.items[productIndex].quantity = quantity;

    await cart.save();
    cart = await cart.populate("items.product");
    cart = formatCartImages(cart);
    io.emit("cartUpdated", { userId, cart });
    return res.status(200).json(cart);
  } catch (error) {
    console.error("Error updating cart:", error);
    return res.status(500).json({ message: "Error updating cart" });
  }
};

// Get the authenticated user's cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
      await cart.save();
      cart = await cart.populate("items.product");
    }
    cart = formatCartImages(cart);
    return res.status(200).json(cart);
  } catch (error) {
    console.error("Error fetching cart:", error);
    return res.status(500).json({ message: "Error fetching cart" });
  }
};

// Remove an item from the cart
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const productIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );
    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    cart.items.splice(productIndex, 1);
    await cart.save();

    cart = await cart.populate("items.product");
    cart = formatCartImages(cart);
    io.emit("cartUpdated", { userId, cart });
    return res.status(200).json({ message: "Product removed from cart", cart });
  } catch (error) {
    console.error("Error removing from cart:", error);
    return res.status(500).json({ message: "Error removing from cart" });
  }
};

// Clear the authenticated user's cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOneAndDelete({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    io.emit("cartUpdated", { userId, cart: null });
    return res.status(200).json({ message: "Cart cleared" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return res.status(500).json({ message: "Error clearing cart" });
  }
};
