import express from 'express';
import { submitRating, getRatingByOrderId, getRatingsByProductId } from '../controllers/ratingController.js';
import authenticateUser from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/submit', authenticateUser, submitRating);
router.get('/order/:orderId', authenticateUser, getRatingByOrderId);
router.get('/product/:productId', authenticateUser, getRatingsByProductId);

export default router;
