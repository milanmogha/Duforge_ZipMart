export const getBotResponse = (req, res) => {
    const { message } = req.body;
  
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
  
    // Sample FAQ responses
    const faqResponses = {
      "How do I add a product?": "Navigate to 'Add Product' in your dashboard.",
      "How do I track an order?": "Check the 'Orders' page for tracking details.",
      "Connect to support": "Connecting you to customer support...",
    };
  
    const response = faqResponses[message] || "Sorry, I didn't understand that.";
    res.json({ response });
  };
  
  export const connectToSupport = (req, res) => {
    // Simulated response for connecting to human support
    res.json({ response: "You are being connected to support. Please wait..." });
  };
  
  