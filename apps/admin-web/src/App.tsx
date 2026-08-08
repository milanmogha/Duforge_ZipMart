import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { io, Socket } from "socket.io-client";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import Shops from "./pages/Shops";
import CreateShop from "./pages/CreateShop";
import ViewShopDetails from "./pages/ViewShopDetails";
import DeliveryPartners from "./pages/DeliveryPartners";
import CreateDeliveryBoy from "./pages/CreateDeliveryBoy";
import ViewDeliveryBoyDetails from "./pages/ViewDeliveryBoyDetails";
import DeliveredOrdersForDeliveryBoy from "./pages/DeliveredOrdersForDeliveryBoy";
import AdminOrders from "./pages/AdminOrders";
import AdminOrderDetails from "./pages/AdminOrderDetails";
import Accounts from "./pages/Accounts";
import ShopProducts from "./pages/ShopProducts";
import Products from "./pages/Products";
import ManageBanners from "./pages/ManageBanners";
import ManageBanner2 from "./pages/ManageBanner2";
import ManageBanner3 from "./pages/ManageBanner3";
import EditProduct from "./pages/EditProduct";
import Support from "./pages/CustomerSupport";
import AdminChat from "./pages/ShopSupport";
import ManageCoupons from "./pages/ManageCoupons";
import { SOCKET_URL } from "@zipmart/shared";
import SupportNotifier from "./components/SupportNotifier"; // Import the notifier
import "./App.css";

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("adminToken")
  );
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleStorageChange = () =>
      setToken(localStorage.getItem("adminToken"));
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Initialize Socket.IO connection when admin is logged in
  useEffect(() => {
    if (token) {
      const newSocket = io(SOCKET_URL, {
        auth: { token },
      });
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [token]);

  return (
    <Router>
      {token && (
        <>
          <Sidebar
            setToken={setToken}
            isMobileOpen={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />
          <Topbar
            setToken={setToken}
            onOpenMobile={() => setIsMobileMenuOpen(true)}
          />
          {/* Global Support Notifier - always mounted if socket is available */}
          <SupportNotifier socket={socket} />
        </>
      )}
      <div className="min-h-screen bg-slate-50 lg:pl-64">
        <div className="pt-16">
          <Routes>
            {!token ? (
              <>
                <Route path="/login" element={<AdminLogin setToken={setToken} />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            ) : (
              <>
                <Route path="/dashboard" element={<Dashboard socket={socket} />} />
                <Route path="/shops" element={<Shops />} />
                <Route path="/shops/create" element={<CreateShop />} />
                <Route path="/products" element={<Products socket={socket} />} />
                <Route path="/shops/:id" element={<ViewShopDetails />} />
                <Route path="/delivery-partners" element={<DeliveryPartners socket={socket} />} />
                <Route path="/delivery-partners/create" element={<CreateDeliveryBoy />} />
                <Route path="/delivery-partners/:id" element={<ViewDeliveryBoyDetails />} />
                <Route
                  path="/delivery-partners/:id/delivered-orders"
                  element={<DeliveredOrdersForDeliveryBoy />}
                />
                <Route path="/orders" element={<AdminOrders socket={socket} />} />
                <Route path="/orders/:orderId" element={<AdminOrderDetails socket={socket} />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/shops/:id/products" element={<ShopProducts socket={socket} />} />
                <Route path="/shops/:id/edit-product" element={<EditProduct socket={socket} />} />
                <Route path="/customer-support" element={<Support socket={socket} />} />
                <Route path="/shop-support" element={<AdminChat socket={socket} />} />
                <Route path="/manage-banners" element={<ManageBanners />} />
                <Route path="/manage-banners2" element={<ManageBanner2 />} />
                <Route path="/manage-banners3" element={<ManageBanner3 />} />
                <Route path="/manage-coupons" element={<ManageCoupons />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </>
            )}
          </Routes>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Router>
  );
};

export default App;
