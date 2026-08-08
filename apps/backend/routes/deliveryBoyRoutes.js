import express from 'express';
import multer from 'multer';
import DeliveryBoy from '../models/DeliveryBoy.js';
import {
  createDeliveryBoy,
  signupDeliveryBoy,
  approveDeliveryBoy,
  getAllDeliveryBoys, // <-- Make sure it's imported
  getDeliveryBoyById,
  deleteDeliveryBoy,
  loginDeliveryBoy,
  registerDeviceToken,
  sendOtp,
  verifyOtp,
  sendForgotPasswordOtpDeliveryBoy,
  resetPasswordDeliveryBoy,
} from '../controllers/deliveryBoyController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ------------------------------------------------
// 1) POST routes
// ------------------------------------------------
router.post(
  '/create',
  upload.fields([
    { name: 'aadhar', maxCount: 1 },
    { name: 'drivingLicence', maxCount: 1 },
  ]),
  createDeliveryBoy
);

router.post(
  '/signup',
  upload.fields([
    { name: 'aadhar', maxCount: 1 },
    { name: 'drivingLicence', maxCount: 1 },
  ]),
  signupDeliveryBoy
);

router.post('/login', loginDeliveryBoy);
router.put('/approve/:id', approveDeliveryBoy);
router.post('/register-device', authMiddleware, registerDeviceToken);

// ------------------------------------------------
// 2) OTP routes
// ------------------------------------------------
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

router.post('/forgot-password/otp/send', sendForgotPasswordOtpDeliveryBoy);
router.post('/forgot-password/reset', resetPasswordDeliveryBoy);

// ------------------------------------------------
// 3) GET all Delivery Boys (needed for your React list)
// ------------------------------------------------
router.get('/', getAllDeliveryBoys); // <-- ADD THIS

// ------------------------------------------------
// 4) GET profile (protected) - must come before :id
// ------------------------------------------------
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const deliveryBoyId = req.deliveryBoy.id;
    const deliveryBoy = await DeliveryBoy.findById(deliveryBoyId);

    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery boy not found' });
    }

    res.status(200).json({
      name: deliveryBoy.name,
      phone: deliveryBoy.phone,
      address: deliveryBoy.address,
      email: deliveryBoy.email,
    });
  } catch (error) {
    console.error('Error fetching delivery boy profile:', error);
    res
      .status(500)
      .json({ message: 'Failed to fetch profile', error: error.message });
  }
});

// ------------------------------------------------
// 5) GET by ID and DELETE
// ------------------------------------------------
router.get('/:id', getDeliveryBoyById);
router.delete('/:id', deleteDeliveryBoy);

export default router;
