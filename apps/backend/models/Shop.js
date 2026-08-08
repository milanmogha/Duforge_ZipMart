import mongoose from "mongoose";

// Define the Shop schema
const shopSchema = new mongoose.Schema(
  {
    ownerName: {
      type: String,
      required: [true, "Owner name is required"],
      trim: true,
    },
    shopName: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"],
    },
    location: {
      type: String,
      trim: true,
    },
    locationCoordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    serviceRadius: {
      // Service radius for the shop in kilometers
      type: Number,
      default: 5,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    aadharNumber: {
      type: String,
      required: [true, "Aadhar number is required"],
      unique: true,
      match: [/^\d{12}$/, "Please enter a valid 12-digit Aadhar number"],
    },
    gstNumber: {
      type: String,
      required: [true, "GST number is required"],
      unique: true,
      uppercase: true,
      match: [/^[0-9A-Z]{15}$/, "Please enter a valid 15-character GST number"],
    },
    role: {
      type: String,
      default: "shop",
      enum: ["shop", "admin"],
    },
    idProof: {
      aadharCard: {
        data: Buffer,
        contentType: String,
      },
      gstProof: {
        data: Buffer,
        contentType: String,
      },
    },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "active"],
    },
    shopkeeperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shopkeeper",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure null values are not saved for required fields
shopSchema.pre("save", function (next) {
  const requiredFields = [
    "ownerName",
    "shopName",
    "email",
    "phone",
    "location",
    "aadharNumber",
    "gstNumber",
  ];
  for (const field of requiredFields) {
    if (
      this[field] === null ||
      this[field] === undefined ||
      this[field] === ""
    ) {
      next(new Error(`${field} cannot be empty`));
      return;
    }
  }
  if (this.isModified("gstNumber")) {
    this.gstNumber = this.gstNumber.toUpperCase();
  }
  next();
});

const Shop = mongoose.model("Shop", shopSchema);

export default Shop;
