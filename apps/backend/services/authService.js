import jwt from "jsonwebtoken";

/**
 * Generate a JWT token for the user.
 * @param {Object} user - The user object containing `_id` and `role`.
 * @returns {string} - The generated JWT token.
 */
export const generateToken = (user) => {
  if (!user || !user._id || !user.role) {
    throw new Error("Invalid user object for token generation");
  }

  return jwt.sign(
    { id: user._id, role: user.role }, // Payload includes user ID and role
    process.env.JWT_SECRET, // Use your JWT secret key from .env
    { expiresIn: "30d" } // Token expiration time (30 days)
  );
};

/**
 * Verify and decode a JWT token.
 * @param {string} token - The JWT token to verify.
 * @returns {Object} - Decoded token payload.
 * @throws {Error} - If the token is invalid or expired.
 */
export const verifyToken = (token) => {
  if (!token) {
    throw new Error("Token is required for verification");
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error("Error verifying token:", error.message);
    throw error; // Re-throw the error for the caller to handle
  }
};
