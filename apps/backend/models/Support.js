import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ["admin", "user"], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const supportSchema = new mongoose.Schema(
  {
    socketId: { type: String, required: true },
    userType: { type: String, enum: ["customer", "shopkeeper"], required: true },
    status: { type: String, enum: ["pending", "active", "ended"], default: "pending" },
    messages: [messageSchema],
    expiry: { type: Date }, // e.g. new Date(Date.now() + 5*60*1000)
  },
  { timestamps: true }
);

export default mongoose.model("Support", supportSchema);
