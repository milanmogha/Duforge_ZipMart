import express from 'express';
import multer from 'multer';
import { getBanner3s, addBanner3, deleteBanner3 } from '../controllers/banner3Controller.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Fetch all banner3s
router.get('/', getBanner3s);

// Add a new banner3
router.post('/', upload.single('image'), addBanner3);

// Delete a banner3
router.delete('/:id', deleteBanner3);

export default router;
