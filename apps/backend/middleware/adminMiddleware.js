import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const adminMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    req.user = user; // Pass the user object to the next middleware/controller
    next();
  } catch (error) {
    return res.status(400).json({ message: 'Invalid token' });
  }
};


export default adminMiddleware;