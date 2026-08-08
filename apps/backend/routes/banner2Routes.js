import express from 'express';
import multer from 'multer';
import { getBanner2s, addBanner2, deleteBanner2 } from '../controllers/banner2Controller.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Fetch all banner2s
router.get('/', getBanner2s);

// Add a new banner2
router.post('/', upload.single('image'), addBanner2);

// Delete a banner2
router.delete('/:id', deleteBanner2);

export default router;
