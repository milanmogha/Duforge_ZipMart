import Support from "../models/Support.js";

const SESSION_DURATION = 5 * 60 * 1000; // 5 minutes

// Create a new support request
export const createSupportRequest = async (req, res) => {
  try {
    const { socketId, userType } = req.body;
    // Create doc with status = 'pending' by default
    const support = new Support({ socketId, userType });
    await support.save();
    return res.status(201).json(support);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error while creating support request" });
  }
};

// Get all pending customer requests
export const getPendingCustomerRequests = async (req, res) => {
  try {
    const requests = await Support.find({ userType: "customer", status: "pending" });
    return res.json(requests);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error while fetching pending customer requests" });
  }
};

// Get all pending shopkeeper requests
export const getPendingShopkeeperRequests = async (req, res) => {
  try {
    const requests = await Support.find({ userType: "shopkeeper", status: "pending" });
    return res.json(requests);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error while fetching pending shopkeeper requests" });
  }
};

// Admin accepts a chat request; update the session to active and set expiry
export const adminAcceptChat = async (req, res) => {
  try {
    const { socketId } = req.body;
    // We look for a doc with status: 'pending'
    const support = await Support.findOne({ socketId, status: "pending" });
    if (!support) {
      return res.status(404).json({ error: "Support request not found or not 'pending'" });
    }
    support.status = "active";
    support.expiry = new Date(Date.now() + SESSION_DURATION);
    await support.save();

    return res.json(support);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error while accepting support request" });
  }
};

// Add a message to a support session (unused in your front-end, but here if needed)
export const sendMessage = async (req, res) => {
  try {
    const { socketId, sender, text } = req.body;
    const support = await Support.findOne({ socketId, status: { $in: ["pending", "active"] } });
    if (!support) {
      return res.status(404).json({ error: "Support session not found" });
    }
    support.messages.push({ sender, text });
    await support.save();
    return res.json(support);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error while sending message" });
  }
};

// End a support session
export const endSession = async (req, res) => {
  try {
    const { socketId } = req.body;
    const support = await Support.findOne({ socketId, status: { $in: ["pending", "active"] } });
    if (!support) {
      return res.status(404).json({ error: "Support session not found" });
    }
    support.status = "ended";
    await support.save();
    return res.json(support);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error while ending session" });
  }
};

// Retrieve chat history for a given support session
export const getChatHistory = async (req, res) => {
  try {
    const { socketId } = req.params;
    const support = await Support.findOne({ socketId });
    if (!support) {
      return res.status(404).json({ error: "Support session not found" });
    }
    return res.json(support.messages);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error while fetching chat history" });
  }
};
