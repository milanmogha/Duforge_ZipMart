import mongoose from "mongoose";

const banner2Schema = new mongoose.Schema(
  {
    image: {
      data: {
        type: Buffer, // Image data as a buffer
        required: true,
      },
      contentType: {
        type: String, // Content type (e.g., image/jpeg)
        required: true,
      },
    },
    text: {
      type: String, // Optional text for the banner2
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now, // Timestamp for when the banner2 is created
    },
  },
  { timestamps: true }
);

export default mongoose.model("Banner2", banner2Schema);
