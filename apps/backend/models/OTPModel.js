import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    otpVerified: { type: Boolean, default: false },
    purpose: {
      type: String,
      enum: ["register", "login"],
      default: "register", // Keeps existing registration OTPs behaving as before
    },
    attempts: { type: Number, default: 0 }, // Failed verification count, for lockout
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // OTP expires in 5 minutes
    },
  },
  {
    timestamps: true,
  }
);

const OTPModel = mongoose.model("OTP", otpSchema);

export default OTPModel;
