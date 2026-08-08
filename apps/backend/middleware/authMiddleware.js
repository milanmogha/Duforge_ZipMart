import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import DeliveryBoy from "../models/DeliveryBoy.js";

const authMiddleware = async (req, res, next) => {
  try {
    // Extract the Authorization header
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Authorization header missing or malformed.");
      return res.status(401).json({
        message: "Authorization token missing or malformed.",
      });
    }

    // Extract the token
    const token = authHeader.split(" ")[1];
    if (!token) {
      console.error("Token missing in Authorization header.");
      return res.status(401).json({ message: "Token missing in header." });
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded token:", decoded); // Debugging log

      // Handle roles
      switch (decoded.role) {
        case "admin":
        case "customer": {
          const user = await User.findById(decoded.id).select("-password");
          if (!user) {
            console.error(`User (ID: ${decoded.id}) not found.`);
            return res.status(404).json({ message: "User not found." });
          }
          req.user = user; // Attach user to request
          break;
        }
        case "shopkeeper": {
          const shop = await Shop.findById(decoded.shopId);
          if (!shop) {
            console.error(`Shop (ID: ${decoded.shopId}) not found.`);
            return res.status(404).json({ message: "Shop not found." });
          }
          if (shop.status !== "active") {
            console.warn(`Shop (ID: ${decoded.shopId}) is inactive.`);
            return res.status(403).json({
              message: "Shop account is inactive. Contact admin.",
            });
          }
          req.shop = shop; // Attach shop to request
          req.shopId = decoded.shopId; // Attach shop ID for convenience
          break;
        }
        case "deliveryBoy": {
          const deliveryBoy = await DeliveryBoy.findById(decoded.id).select("-password");
          if (!deliveryBoy) {
            console.error(`Delivery boy (ID: ${decoded.id}) not found.`);
            return res.status(404).json({ message: "Delivery boy not found." });
          }
          if (deliveryBoy.status !== "active") {
            console.warn(`Delivery boy (ID: ${decoded.id}) is inactive.`);
            return res.status(403).json({
              message: "Delivery boy account is inactive. Contact admin.",
            });
          }
          req.user = deliveryBoy;
          req.deliveryBoy = deliveryBoy; // Attach delivery boy to request
          break;
        }
        default:
          console.error("Unauthorized role:", decoded.role);
          return res.status(403).json({ message: "Unauthorized role." });
      }

      // Proceed to the next middleware
      next();
    } catch (error) {
      // Handle specific JWT errors
      if (error.name === "TokenExpiredError") {
        console.error("Token expired.");
        return res.status(401).json({ message: "Token expired, please log in again." });
      }
      if (error.name === "JsonWebTokenError") {
        console.error("Invalid token:", error.message);
        return res.status(401).json({ message: "Invalid token." });
      }
      console.error("JWT verification error:", error.message);
      return res.status(401).json({ message: "Token verification failed." });
    }
  } catch (error) {
    // Catch unexpected errors
    console.error("Authentication middleware error:", error.message);
    return res.status(500).json({ message: "Authentication failed due to server error." });
  }
};

export default authMiddleware;
