import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    details: { type: String },
    images: {
      image1: { data: Buffer, contentType: String },
      image2: { data: Buffer, contentType: String },
      image3: { data: Buffer, contentType: String },
      image4: { data: Buffer, contentType: String },
      image5: { data: Buffer, contentType: String },
    },
    shopkeeperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop", 
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
