import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SocketProvider } from "./socket";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import DeliveredOrders from "./pages/DeliveredOrders";
import Earnings from "./pages/Earnings";
import Profile from "./pages/Profile";

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("deliveryToken")
  );
  const [, setDeliveryBoyId] = useState<string | null>(
    localStorage.getItem("deliveryBoyId")
  );

  // Sync token across tabs.
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("deliveryToken"));
      setDeliveryBoyId(localStorage.getItem("deliveryBoyId"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <SocketProvider token={token}>
      <Router>
        {token ? (
          <div className="min-h-screen bg-gray-50 lg:pl-64">
            <Sidebar setToken={setToken} />
            <main className="min-h-screen">
              <Routes>
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:orderId" element={<OrderDetail />} />
                <Route path="/delivered" element={<DeliveredOrders />} />
                <Route path="/earnings" element={<Earnings />} />
                <Route path="/profile" element={<Profile setToken={setToken} />} />
                <Route path="*" element={<Navigate to="/orders" replace />} />
              </Routes>
            </main>
          </div>
        ) : (
          <Routes>
            <Route path="/login" element={<Login setToken={setToken} setDeliveryBoyId={setDeliveryBoyId} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </Router>

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
    </SocketProvider>
  );
};

export default App;
