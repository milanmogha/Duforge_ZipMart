import Razorpay from "razorpay";
import crypto from "crypto";
import Payment from "../models/Payment.js";
import dotenv from "dotenv";
dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @desc    Create a new Razorpay Order (for web payments)
 * @route   POST /payments/create-order
 * @access  Protected
 */
export const createOrder = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.warn("WARNING: RAZORPAY_KEY_SECRET is not set! Payment verification may fail.");
    }

    const { amount } = req.body;
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({
        message: "Invalid amount. Amount must be a positive number.",
      });
    }

    // Convert rupees to paise
    const amountInPaisa = Math.round(amount * 100);
    const options = {
      amount: amountInPaisa,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    if (!order) {
      return res.status(500).json({
        message: "Failed to create Razorpay order.",
      });
    }

    console.log("Razorpay Order Created:", order);
    return res.status(200).json(order);
  } catch (error) {
    console.error("Error creating Razorpay order:", error.message);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/**
 * @desc    Verify Razorpay Payment
 * @route   POST /payments/verify
 * @access  Protected
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    console.log("## verifyPayment request:", {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      amountType: typeof amount,
    });

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !amount ||
      typeof amount !== "number" ||
      amount <= 0
    ) {
      return res.status(400).json({
        message: "Invalid or missing required fields.",
      });
    }

    // Generate signature and compare
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.error("Signature mismatch:", { generatedSignature, razorpay_signature });
      return res.status(400).json({ message: "Invalid payment signature." });
    }

    // Save payment details in the database
    const payment = new Payment({
      orderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      paymentMethod: "Razorpay",
      status: "Paid",
      amount, // Amount in rupees
    });
    await payment.save();
    console.log("Payment Verified Successfully:", payment);

    return res.status(200).json({
      message: "Payment verified successfully.",
      payment,
    });
  } catch (error) {
    console.error("Error verifying payment:", error.message);
    return res.status(500).json({
      message: "Payment verification failed.",
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new Razorpay Order for Native App Payment
 *          Returns an order id and a paymentUrl for native apps.
 * @route   POST /payments/native/create-order
 * @access  Protected
 */
export const createNativeOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({
        message: "Invalid amount. Amount must be a positive number.",
      });
    }

    // Convert rupees to paise
    const amountInPaisa = Math.round(amount * 100);
    const options = {
      amount: amountInPaisa,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    if (!order) {
      return res.status(500).json({
        message: "Failed to create Razorpay order.",
      });
    }
    console.log("Razorpay Order Created (Native):", order);

    // Construct payment URL. Ensure that BASE_URL is accessible by your mobile device.
    const baseUrl = process.env.BASE_URL || "http://192.168.1.111:8000";
    const paymentUrl = `${baseUrl}/payments/native/checkout?order_id=${order.id}&amount=${order.amount}&currency=${order.currency}`;
    return res.status(200).json({ id: order.id, paymentUrl });
  } catch (error) {
    console.error("Error creating native Razorpay order:", error.message);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/**
 * @desc    Serve the Native Payment Checkout HTML Page
 * @route   GET /payments/native/checkout
 * @access  Public
 */
export const nativeCheckout = (req, res) => {
  const { order_id, amount, currency } = req.query;
  if (!order_id || !amount || !currency) {
    return res.status(400).send("Missing required query parameters.");
  }
  // Build the HTML for the checkout page.
  // The BASE_URL is used in the redirect URL so that your mobile WebView can access it.
  const baseUrl = process.env.BASE_URL || "http://192.168.1.111:8000";
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Native Payment Checkout</title>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body onload="onLoadHandler()">
        <script>
          function onLoadHandler() {
            var options = {
              "key": "${process.env.RAZORPAY_KEY_ID}",
              "amount": "${amount}",
              "currency": "${currency}",
              "name": "Belly-Basket",
              "description": "Payment for your order",
              "order_id": "${order_id}",
              "handler": function (response) {
                // Redirect with payment details (signature will be appended manually).
                window.location.href = "${baseUrl}/payments/native/payment-success?payment_id=" 
                  + response.razorpay_payment_id + "&order_id=${order_id}&signature=";
              },
              "prefill": {
                "name": "",
                "email": "",
                "contact": ""
              },
              "theme": {
                "color": "#2563eb"
              }
            };
            var rzp1 = new Razorpay(options);
            rzp1.open();
          }
        </script>
      </body>
    </html>
  `;
  res.send(html);
};

/**
 * @desc    Native Payment Success Page
 * @route   GET /payments/native/payment-success
 * @access  Public
 */
export const nativePaymentSuccess = (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Payment Successful</title>
      </head>
      <body>
        <h1>Payment Successful!</h1>
        <p>You can now close this window.</p>
      </body>
    </html>
  `;
  res.send(html);
};