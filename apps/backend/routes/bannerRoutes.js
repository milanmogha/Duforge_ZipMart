import express from 'express';
import multer from 'multer';
import { getBanners, addBanner, deleteBanner } from '../controllers/bannerController.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Fetch all banners
router.get('/', getBanners);

// Add a new banner
router.post('/', upload.single('image'), addBanner);

// Delete a banner
router.delete('/:id', deleteBanner);

export default router;
