import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createRazorpayOrder, createOrder } from "../api";
import { loadRazorpay } from "../utils/loadRazorpay";
import { useCart } from "../context/CartContext";

const Payment: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const [paymentStarted, setPaymentStarted] = useState(false);

  // Destructure with defaults to avoid undefined
  const {
    deliveryAddress = "",
    amount = 0,
    couponCode = "",
    couponDiscount = 0,
    cartItems = [],
    customerName = "",
    customerPhone = "",
    deliveryCoords = { latitude: 0, longitude: 0 },
    platformFee = 0,
    deliveryFee = 0,
    deliveryBoyEarning = 0,
  } = (location.state as any) || {};

  useEffect(() => {
    if (paymentStarted) return;

    // Basic validation
    if (
      amount <= 0 ||
      !Array.isArray(cartItems) ||
      cartItems.length === 0
    ) {
      toast.error("Invalid payment details. Please try again.");
      navigate("/checkout", { replace: true });
      return;
    }

    const initiatePayment = async () => {
      try {
        // 1) Create Razorpay order
        const order = await createRazorpayOrder(amount);

        // 2) Load SDK
        const sdkLoaded = await loadRazorpay();
        if (!sdkLoaded) {
          toast.error("Failed to load Razorpay SDK.");
          navigate("/checkout", { replace: true });
          return;
        }

        // 3) Open Razorpay
        const options: any = {
          key: "rzp_test_G3yo5gEYUyAVKm",
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          name: "ZipMart",
          description: "Complete your payment securely.",
          handler: async (response: any) => {
            toast.success("Payment Successful!");
            try {
              // Recompute the items subtotal from the cart the same way the
              // backend does (discounted unit price × quantity), so the
              // validated `totalAmount` stays aligned with the server.
              const itemsSubtotal = parseFloat(
                cartItems
                  .reduce((sum: number, item: any) => {
                    const discountedPrice =
                      item.product.price -
                      (item.product.price * (item.product.discount || 0)) / 100;
                    return sum + discountedPrice * item.quantity;
                  }, 0)
                  .toFixed(2)
              );
              const orderTotalAmount = parseFloat(
                (itemsSubtotal - couponDiscount).toFixed(2)
              );

              // Build full order payload
              const orderData = {
                items: cartItems.map((item: any) => ({
                  product: item.product._id,
                  quantity: item.quantity,
                  price: parseFloat(
                    (
                      item.product.price -
                      (item.product.price * (item.product.discount || 0)) / 100
                    ).toFixed(2)
                  ),
                })),
                totalAmount: orderTotalAmount,
                discountAmount: parseFloat(couponDiscount.toFixed(2)),
                deliveryAddress,
                paymentMethod: "Razorpay",
                couponCode,
                customerName,
                customerPhone,
                deliveryCoords,
                platformFee,
                deliveryFee,
                deliveryBoyEarning,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              };

              await createOrder(orderData);
              toast.success("Order created successfully!");
              await clearCart();
              navigate("/account/orders", { replace: true });
            } catch (err: any) {
              console.error("Error creating order:", err);
              toast.error(err?.response?.data?.message || "Failed to create order.");
              navigate("/checkout", { replace: true });
            }
          },
          prefill: {
            name: customerName,
            email: "",
            contact: customerPhone,
          },
          theme: { color: "#218c4a" },
          modal: {
            ondismiss: () => {
              toast.info("Payment cancelled. Redirecting to checkout...");
              navigate("/checkout", { replace: true });
            },
          },
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();
      } catch (err: any) {
        console.error("Payment initiation error:", err);
        toast.error(err?.response?.data?.message);
        navigate("/checkout", { replace: true });
      }
    };

    setPaymentStarted(true);
    initiatePayment();
  }, [
    paymentStarted,
    amount,
    cartItems,
    couponDiscount,
    couponCode,
    deliveryAddress,
    customerName,
    customerPhone,
    deliveryCoords,
    platformFee,
    deliveryFee,
    deliveryBoyEarning,
    clearCart,
    navigate,
  ]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="card w-full max-w-md text-center">
        <h2 className="mb-3 text-2xl font-extrabold text-gray-900">
          Secure Payment
        </h2>
        <p className="mb-6 text-sm text-gray-600">
          Redirecting to Razorpay… please do not refresh or close this page.
        </p>
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      </div>
    </div>
  );
};

export default Payment;
