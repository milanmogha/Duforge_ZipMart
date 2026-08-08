import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/db.js';

dotenv.config();
connectDB();

const seedAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash('milan12345', 10);

    const admin = new User({
      name: 'Milan',
      email: 'moghamilan@gmail.com',
      password: hashedPassword,
      role: 'admin', 
    });

    await admin.save();
    console.log('Admin user created successfully');
    process.exit();
  } catch (error) {
    console.error(`Error seeding admin: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
