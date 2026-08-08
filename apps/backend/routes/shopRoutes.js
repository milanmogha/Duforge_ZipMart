import express from 'express';
import multer from 'multer';
import {
  createShop,
  signup,
  approveShop,
  getAllShops,
  getShopById,
  deleteShop,
  loginShopkeeper,
  updateShopLocation,
  getShopsWithinRadius,
  getShopLocation,
  sendOtp,
  verifyOtp,
  resetPassword,
} from '../controllers/shopController.js';

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 2,
  },
});

const uploadMiddleware = upload.fields([
  { name: 'aadharCard', maxCount: 1 },
  { name: 'gstProof', maxCount: 1 },
]);

//  routes
router.post('/create', uploadMiddleware, createShop);
router.post('/signup', uploadMiddleware, signup);
router.put('/approve/:id', approveShop);
router.get('/', getAllShops);
router.get('/:id', getShopById);
router.delete('/:id', deleteShop);
router.post('/login', loginShopkeeper);

//  routes for location functionality
router.put('/update-location/:id', updateShopLocation); // Update location and radius
router.get('/nearby', getShopsWithinRadius); // Get shops within a radius
router.get('/location/:id', getShopLocation);


// OTP routes
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// Reset Password route
router.post("/reset-password", resetPassword);

export default router;
