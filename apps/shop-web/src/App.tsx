import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import AddProduct from "./pages/AddProduct";
import Products from "./pages/Products";
import Account from "./pages/Account";
import MessagePage from "./pages/Support";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Orders from "./pages/ShopkeeperOrders";
import OrderDetails from "./pages/OrderDetails";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "@zipmart/shared";
import "./App.css";

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("shopkeeperToken")
  );
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false); // Detect iframe mode

  useEffect(() => {
    const shopkeeperId = localStorage.getItem("shopkeeperId");
    if (!shopkeeperId || !token) {
      setToken(null);
    }
  }, [token]);

  // Function to connect socket
  const connectSocket = () => {
    if (token) {
      const newSocket = io(SOCKET_URL, {
        query: { token },
      });
      setSocket(newSocket);
      
      // New order alert
      newSocket.on("new-order", (order) => {
        alert(`New order received! Order ID: ${order._id}`);
      });
      
      // Delivered order alert – similar to new order
      newSocket.on("order-updated", (order) => {
        if (order.deliveryStatus === "Delivered") {
          alert(`Order ${order._id} is delivered`);
        }
      });
    }
  };

  // Connect socket when token is available
  useEffect(() => {
    if (token) {
      connectSocket();
    }
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [token]);

  useEffect(() => {
    // Detect if running inside an iframe
    if (window.self !== window.top) {
      setIsEmbedded(true);
    }
  }, []);

  return (
    <Router>
      <div className={`app-container ${isEmbedded ? "iframe-mode" : ""}`}>
        {token && !isEmbedded && <Navbar setToken={setToken} />}
        <main className={`content ${token && !isEmbedded ? "with-sidebar" : ""}`}>
          <Routes>
            {!token ? (
              <>
                <Route
                  path="/shopkeeper/login"
                  element={<Login setToken={setToken} connectSocket={connectSocket} />}
                />
                <Route path="/shopkeeper/signup" element={<Signup />} />
                <Route path="*" element={<Navigate to="/shopkeeper/login" replace />} />
                <Route path="/shopkeeper/forgot-password" element={<ForgotPassword />} />
                <Route path="/shopkeeper/reset-password" element={<ResetPassword />} />
              </>
            ) : (
              <>
                <Route path="/shopkeeper/dashboard" element={<Dashboard />} />
                <Route path="/shopkeeper/add-product" element={<AddProduct />} />
                <Route path="/shopkeeper/products" element={<Products />} />
                <Route path="/shopkeeper/account" element={<Account />} />
                <Route path="/shopkeeper/messages" element={<MessagePage />} />
                <Route path="/shopkeeper/orders" element={<Orders socket={socket} />} />
                <Route path="/shopkeeper/orders/:orderId" element={<OrderDetails socket={socket} />} />
                <Route path="*" element={<Navigate to="/shopkeeper/dashboard" replace />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;