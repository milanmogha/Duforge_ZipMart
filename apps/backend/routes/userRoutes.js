import express from "express";
import {
  registerUser,
  loginUser,
  adminLogin,
  createAdmin,
  googleLogin,
  sendOtp,
  verifyOtp,
  sendLoginOtp,
  verifyLoginOtp,
  sendForgotPasswordOtp,
  resetPassword,
  getUserDetails, // New endpoint to fetch user details
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import {
  loginOtpSendLimiter,
  loginOtpVerifyLimiter,
} from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// -----------------------------------------------------------------------------
// User Routes
// -----------------------------------------------------------------------------
/**
 * @route POST /users/register
 * @desc Register a new user
 * @access Public
 */
router.post("/register", registerUser);

/**
 * @route POST /users/login
 * @desc Login a user
 * @access Public
 */
router.post("/login", loginUser);

/**
 * @route POST /users/google-login
 * @desc Login or register a user using Google Authentication
 * @access Public
 */
router.post("/google-login", googleLogin);

/**
 * @route POST /users/otp/send
 * @desc Send OTP for email verification
 * @access Public
 */
router.post("/otp/send", sendOtp);

/**
 * @route POST /users/otp/verify
 * @desc Verify OTP for email verification
 * @access Public
 */
router.post("/otp/verify", verifyOtp);

/**
 * @route POST /users/otp/login/send
 * @desc Send OTP for passwordless email login
 * @access Public (rate limited per email address)
 */
router.post("/otp/login/send", loginOtpSendLimiter, sendLoginOtp);

/**
 * @route POST /users/otp/login/verify
 * @desc Verify login OTP and issue a JWT (registers the user on first sign-in)
 * @access Public (rate limited per email address)
 */
router.post("/otp/login/verify", loginOtpVerifyLimiter, verifyLoginOtp);

/**
 * @route GET /users/me
 * @desc Get the details of the authenticated user (including name)
 * @access Private
 */
router.get("/me", authMiddleware, getUserDetails);

// -----------------------------------------------------------------------------
// Admin Routes
// -----------------------------------------------------------------------------
/**
 * @route POST /users/admin/login
 * @desc Login an admin
 * @access Admin Only
 */
router.post("/admin/login", adminLogin);

/**
 * @route POST /users/admin/create
 * @desc Create a new admin
 * @access Admin Only
 */
router.post(
  "/admin/create",
  authMiddleware, // Middleware to verify if the user is authenticated
  adminMiddleware, // Middleware to ensure the user is an admin
  createAdmin
);

// -----------------------------------------------------------------------------
// Forgot Password Routes
// -----------------------------------------------------------------------------
router.post("/forgot-password/otp/send", sendForgotPasswordOtp);
router.post("/forgot-password/reset", resetPassword);

export default router;
