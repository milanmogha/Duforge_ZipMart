import React, { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { FaHeadset } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface SupportNotifierProps {
  socket: Socket | null;
}

const SupportNotifier: React.FC<SupportNotifierProps> = ({ socket }) => {
  const [customerRequestCount, setCustomerRequestCount] = useState<number>(0);
  const [shopkeeperRequestCount, setShopkeeperRequestCount] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    // Listen for new customer chat requests
    socket.on("new-customer-chat-request", (requests: string[]) => {
      setCustomerRequestCount(requests.length);
      // Optionally trigger a toast notification here
      console.log("New customer request(s):", requests);
    });

    // Listen for new shopkeeper chat requests
    socket.on("new-shopkeeper-chat-request", (requests: string[]) => {
      setShopkeeperRequestCount(requests.length);
      console.log("New shopkeeper request(s):", requests);
    });

    // Clean up listeners on unmount
    return () => {
      socket.off("new-customer-chat-request");
      socket.off("new-shopkeeper-chat-request");
    };
  }, [socket]);

  const goTo = (path: string) => {
    navigate(path);
    setCustomerRequestCount(0);
    setShopkeeperRequestCount(0);
  };

  // Simple UI to display notifications in the top-right corner
  return (
    <div className="fixed right-4 top-16 z-40 flex flex-col gap-2">
      {customerRequestCount > 0 && (
        <button
          onClick={() => goTo("/customer-support")}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-colors hover:bg-red-700"
        >
          <FaHeadset size={14} />
          {customerRequestCount} new customer support
          {customerRequestCount > 1 ? "s" : ""}
        </button>
      )}
      {shopkeeperRequestCount > 0 && (
        <button
          onClick={() => goTo("/shop-support")}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-lg transition-colors hover:bg-amber-600"
        >
          <FaHeadset size={14} />
          {shopkeeperRequestCount} new shopkeeper support
          {shopkeeperRequestCount > 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
};

export default SupportNotifier;
