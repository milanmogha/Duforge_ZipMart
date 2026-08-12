import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { LocationProvider } from "./context/LocationContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Screens and Components
import SplashScreen from "./components/SplashScreen";
import SignIn from "./components/Login";
import VerifyOtp from "./components/VerifyOtp";
import LandingPage from "./components/HomePage";
import Explore from "./components/Explore";
import Cart from "./components/Cart";
import Checkout from "./pages/Checkout";
import Account from "./components/Account";
import About from "./components/About";
import PrivacyPolicy from "./components/PrivacyPolicy";
import Support from "./components/CustomerSupport";
import OrderListPage from "./components/Orders";
import OrderDetails from "./components/OrderDetails";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./components/ProductPage";
import Payment from "./pages/Payment";

// Socket.IO client
import { io, Socket } from "socket.io-client";

// Private Route Wrapper
interface PrivateRouteProps {
  children: JSX.Element;
}
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/signin" replace />;
};

// Global Socket Listener for Push Notifications
const GlobalSocketListener: React.FC = () => {
  const token = localStorage.getItem("shopkeeperToken");

  const showPushNotification = React.useCallback((message: string, order: any) => {
    if ("Notification" in window) {
      const notify = () =>
        navigator.serviceWorker.getRegistration()?.then((registration) => {
          registration?.showNotification(message, {
            body: `Order ID: ${order._id}`,
            data: { url: `/orders/${order._id}` },
            icon: "/favicon.svg",
          });
        });

      if (Notification.permission === "granted") {
        notify();
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            notify();
          }
        });
      }
    }
  }, []);

  React.useEffect(() => {
    if (!token) return;
    const socket: Socket = io("https://bellybasketstore.in", { query: { token } });

    socket.on("order-updated", (order: any) => {
      switch (order.deliveryStatus) {
        case "Accepted":
          showPushNotification("Your order has been accepted.", order);
          break;
        case "InTransit":
          showPushNotification("Your order is on its way.", order);
          break;
        case "Delivered":
          showPushNotification("Your order has been delivered.", order);
          break;
        case "Rejected":
          showPushNotification("Your order was rejected.", order);
          break;
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, showPushNotification]);

  return null;
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = React.useState(true);
  if (showSplash) return <SplashScreen onDone={() => setShowSplash(false)} />;

  return (
    <HelmetProvider>
      <AuthProvider>
        <LocationProvider>
          <CartProvider>
          <Helmet>
            <title>ZipMart – Instant Grocery Delivery</title>
            <meta
              name="description"
              content="Order fresh fruits, vegetables, dairy and more from ZipMart. Instant, reliable grocery delivery across your city."
            />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="canonical" href="https://bellybasketstore.in/" />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://bellybasketstore.in/" />
            <meta property="og:title" content="ZipMart – Instant Grocery Delivery" />
            <meta
              property="og:description"
              content="Order fresh groceries online with ZipMart. Quality produce, delivered to your doorstep in minutes."
            />
            <meta property="og:image" content="https://bellybasketstore.in/og-image.jpg" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content="https://bellybasketstore.in/" />
            <meta name="twitter:title" content="ZipMart – Instant Grocery Delivery" />
            <meta
              name="twitter:description"
              content="Order fresh groceries online with ZipMart. Quality produce, delivered to your doorstep in minutes."
            />
            <meta name="twitter:image" content="https://bellybasketstore.in/og-image.jpg" />
          </Helmet>

          <Router>
            <GlobalSocketListener />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/about-us" element={<About />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />

              {/* Private Routes */}
              <Route
                path="/cart"
                element={
                  <PrivateRoute>
                    <ErrorBoundary>
                      <Cart />
                    </ErrorBoundary>
                  </PrivateRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <PrivateRoute>
                    <ErrorBoundary>
                      <Checkout />
                    </ErrorBoundary>
                  </PrivateRoute>
                }
              />
              <Route
                path="/payment"
                element={
                  <PrivateRoute>
                    <ErrorBoundary>
                      <Payment />
                    </ErrorBoundary>
                  </PrivateRoute>
                }
              />

              {/* Nested Account Routes */}
              <Route path="/orders/:orderId" element={<OrderDetails />} />
              <Route path="/category/:categoryName" element={<CategoryPage />} />
              <Route
                path="/account"
                element={
                  <ErrorBoundary>
                    <Account />
                  </ErrorBoundary>
                }
              >
                <Route index element={<Navigate to="/account/orders" replace />} />
                <Route path="orders" element={<OrderListPage />} />
                <Route path="help" element={<Support />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <ToastContainer position="bottom-right" autoClose={5000} />
          </Router>
          </CartProvider>
        </LocationProvider>
      </AuthProvider>
    </HelmetProvider>
  );
};

export default App;
