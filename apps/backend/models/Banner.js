import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    image: {
      data: {
        type: Buffer, // Image data as a buffer
        required: true, // Ensure the image buffer is required
      },
      contentType: {
        type: String, // Content type (e.g., image/jpeg)
        required: true, // Ensure content type is provided
      },
    },
    text: {
      type: String, // Optional text for the banner
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now, // Timestamp for when the banner is created
    },
  },
  { timestamps: true }
);

export default mongoose.model("Banner", bannerSchema);
