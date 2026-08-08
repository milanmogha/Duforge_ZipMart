import React, { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { getShopOrders } from "../api";
import { useNavigate } from "react-router-dom";
import {
  FaClipboardList,
  FaSearch,
  FaSpinner,
  FaChevronRight,
} from "react-icons/fa";

interface ShopkeeperOrdersProps {
  socket: Socket | null;
}

type OrderItem = {
  product: {
    _id: string;
    name: string;
  };
  quantity: number;
  price: number;
};

type Order = {
  _id: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  deliveryStatus: string;
  items: OrderItem[];
};

const statusStyles: Record<string, string> = {
  Delivered: "badge-green",
  Pending: "badge-yellow",
  Accepted: "badge-blue",
  InTransit: "badge-blue",
  Cancelled: "badge-red",
};

const statusLabels: Record<string, string> = {
  Delivered: "Delivered",
  Pending: "Pending",
  Accepted: "Accepted",
  InTransit: "In transit",
  Cancelled: "Cancelled",
};

const ShopkeeperOrders: React.FC<ShopkeeperOrdersProps> = ({ socket }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const navigate = useNavigate();

  // Fetch orders from the API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const shopId = localStorage.getItem("shopkeeperId");
        if (!shopId) {
          setError("Shopkeeper ID is missing. Please log in again.");
          return;
        }

        // Get the data from your API
        const ordersData = await getShopOrders(shopId);

        // Ensure the result is an array; if not, use an empty array
        if (Array.isArray(ordersData)) {
          setOrders(ordersData);
        } else if (ordersData && Array.isArray(ordersData.orders)) {
          // If your API returns something like { orders: [...] }
          setOrders(ordersData.orders);
        } else {
          setOrders([]);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Socket event listeners for real-time updates
    if (socket) {
      socket.on("order-added", (newOrder: Order) => {
        setOrders((prevOrders) => [newOrder, ...prevOrders]);
      });

      socket.on("order-updated", (updatedOrder: Order) => {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === updatedOrder._id ? updatedOrder : order
          )
        );
      });

      socket.on("order-deleted", (deletedOrderId: string) => {
        setOrders((prevOrders) =>
          prevOrders.filter((order) => order._id !== deletedOrderId)
        );
      });
    }

    // Cleanup socket listeners on unmount
    return () => {
      if (socket) {
        socket.off("order-added");
        socket.off("order-updated");
        socket.off("order-deleted");
      }
    };
  }, [socket]);

  // Filter orders based on search term
  const filteredOrders = orders.filter((order) =>
    order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerPhone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render loading state
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-slate-500">
        <FaSpinner className="animate-spin text-brand-500" />
        <span className="font-medium">Loading orders...</span>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="card max-w-md p-8 text-center">
          <p className="font-medium text-red-600">{error}</p>
          <button
            className="btn-secondary mt-4"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle mt-1">
            {orders.length} order{orders.length !== 1 ? "s" : ""} received
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-6 max-w-md">
        <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by order ID, customer name, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-10"
        />
      </div>

      {filteredOrders.length > 0 ? (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <button
              key={order._id}
              onClick={() => navigate(`/shopkeeper/orders/${order._id}`)}
              className="card group flex w-full flex-col items-start justify-between gap-3 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <FaClipboardList />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-slate-900">
                    Order #{order._id.slice(-6)}
                  </h2>
                  <p className="truncate text-sm text-slate-500">
                    {order.customerName} · {order.customerPhone}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {order.items?.length ?? 0} item
                    {(order.items?.length ?? 0) !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex w-full shrink-0 items-center justify-between gap-4 sm:w-auto">
                <div className="text-left sm:text-right">
                  <span
                    className={`badge ${
                      statusStyles[order.deliveryStatus] || "badge-gray"
                    }`}
                  >
                    {statusLabels[order.deliveryStatus] || order.deliveryStatus}
                  </span>
                  <p className="mt-1 font-bold text-slate-900">
                    ₹{order.totalAmount}
                  </p>
                </div>
                <FaChevronRight className="text-slate-300 transition-colors group-hover:text-brand-500" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <FaClipboardList className="text-xl" />
          </div>
          <p className="text-lg font-semibold text-slate-700">
            {searchTerm ? "No matching orders" : "No orders yet"}
          </p>
          <p className="max-w-sm text-sm text-slate-500">
            {searchTerm
              ? "Try a different search term."
              : "New orders from customers will appear here in real time."}
          </p>
        </div>
      )}
    </div>
  );
};

export default ShopkeeperOrders;
