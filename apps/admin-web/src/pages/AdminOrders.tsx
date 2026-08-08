import React, { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { getAllOrders } from "../api";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Loading from "../components/ui/Loading";
import { FaSearch, FaEye } from "react-icons/fa";

interface OrdersProps {
  socket: Socket | null;
}

interface Order {
  _id: string;
  totalAmount: number;
  deliveryStatus?: string;
}

const AdminOrders: React.FC<OrdersProps> = ({ socket }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(window.innerWidth < 550);
  const navigate = useNavigate();

  // Listen for window resize events to determine if the screen is small
  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 550);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Helper to trim order id on small screens
  const getTrimmedOrderId = (orderId: string) => {
    if (isSmallScreen && orderId.length > 10) {
      return `${orderId.slice(0, 8)}...`;
    }
    return orderId;
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersData: Order[] = await getAllOrders();
        setOrders(ordersData);
        setFilteredOrders(ordersData);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching orders:", err);
        setError(err.response?.data?.message || "Failed to load orders.");
        setLoading(false);
      }
    };

    fetchOrders();

    // Socket.IO integration
    if (socket) {
      socket.on("order-updated", (updatedOrder: Order) => {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === updatedOrder._id
              ? { ...order, ...updatedOrder }
              : order
          )
        );
      });

      socket.on("order-added", (newOrder: Order) => {
        setOrders((prevOrders) => [newOrder, ...prevOrders]);
      });

      socket.on("order-deleted", (deletedOrderId: string) => {
        setOrders((prevOrders) =>
          prevOrders.filter((order) => order._id !== deletedOrderId)
        );
      });
    }

    return () => {
      if (socket) {
        socket.off("order-updated");
        socket.off("order-added");
        socket.off("order-deleted");
      }
    };
  }, [socket]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredOrders(orders);
    } else {
      const lowerCaseQuery = searchQuery.toLowerCase();
      setFilteredOrders(
        orders.filter(
          (order) =>
            order._id.toLowerCase().includes(lowerCaseQuery) ||
            (order.deliveryStatus || "").toLowerCase().includes(lowerCaseQuery)
        )
      );
    }
  }, [searchQuery, orders]);

  const getStatusTone = (status: string) => {
    switch (status) {
      case "Delivered":
        return "success";
      case "Pending":
        return "danger";
      case "InTransit":
        return "info";
      case "Accepted":
        return "info";
      case "Cancelled":
        return "neutral";
      case "Rejected":
        return "warning";
      default:
        return "neutral";
    }
  };

  if (loading) {
    return <Loading fullPage label="Loading orders..." />;
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Orders"
        subtitle="All orders placed across the ZipMart platform"
      />

      {/* Search Bar */}
      <div className="relative mb-6 max-w-md">
        <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
        <input
          type="text"
          placeholder="Search orders by ID or delivery status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-base pl-10"
        />
      </div>

      {filteredOrders.length > 0 ? (
        <DataTable
          columns={["Order ID", "Amount", "Delivery Status", "Actions"]}
        >
          {filteredOrders.map((order) => (
            <tr
              key={order._id}
              className="cursor-pointer transition-colors hover:bg-slate-50"
              onClick={() => navigate(`/orders/${order._id}`)}
            >
              <td
                className="px-4 py-3 font-mono text-xs text-slate-500"
                title={order._id}
              >
                {getTrimmedOrderId(order._id)}
              </td>
              <td className="px-4 py-3 font-semibold text-slate-800">
                ₹{order.totalAmount}
              </td>
              <td className="px-4 py-3">
                <Badge tone={getStatusTone(order.deliveryStatus || "") as any}>
                  {order.deliveryStatus || "N/A"}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/orders/${order._id}`);
                  }}
                >
                  <FaEye size={12} /> View
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState message="No orders found." />
      )}
    </div>
  );
};

export default AdminOrders;
