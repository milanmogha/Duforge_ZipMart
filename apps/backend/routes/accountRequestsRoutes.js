import express from 'express';
import Shop from '../models/Shop.js';
import DeliveryBoy from '../models/DeliveryBoy.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const pendingShops = await Shop.find({ status: 'pending' }, { idProof: 0, password: 0 });
    const pendingDeliveryBoys = await DeliveryBoy.find({ status: { $ne: 'active' } }, { idProof: 0, password: 0, plainPassword: 0 });

    // If you only consider 'pending' status for delivery boys as well, use:
    // const pendingDeliveryBoys = await DeliveryBoy.find({ status: 'pending' });

    res.status(200).json({
      pendingShops,
      pendingDeliveryBoys
    });
  } catch (error) {
    console.error('Error fetching account requests:', error);
    res.status(500).json({ message: 'Error fetching account requests' });
  }
});

export default router;
