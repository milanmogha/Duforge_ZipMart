import mongoose from 'mongoose';

const deliveryBoySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    password: { type: String, required: true },
    plainPassword: { type: String, required: true },
    idProof: {
      aadhar: { data: Buffer, contentType: String },
      drivingLicence: { data: Buffer, contentType: String },
    },
    role: { type: String, default: 'deliveryBoy' },
    status: {
      type: String,
      default: 'pending', // Default to pending
      enum: ['pending', 'active', 'rejected'], // Valid statuses
      required: true,
    },
    deviceTokens: { type: [String], default: [] },
  },
  { timestamps: true }
);

const DeliveryBoy = mongoose.model('DeliveryBoy', deliveryBoySchema);

export default DeliveryBoy;
