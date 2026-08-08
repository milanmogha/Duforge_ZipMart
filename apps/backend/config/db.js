import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config(); // Ensure this is called to load variables from .env

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables.");
    }

    console.log("Connecting to MongoDB with URI:", process.env.MONGO_URI);

    const conn = await mongoose.connect(process.env.MONGO_URI);

    // Debug the connection state
    const connectionState = conn.connection.readyState;
    console.log("MongoDB connection state:", connectionState);

    if (connectionState === 1) {
      console.log("MongoDB connection is established successfully.");
    } else {
      console.log("MongoDB connection is not fully established. Check server logs.");
    }
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Exit on failure
  }
};

export default connectDB;