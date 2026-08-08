import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCustomerOrders } from "../api";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "@zipmart/shared";

type OrderItem = {
  product: {
    _id: string;
    name: string;
    category: string;
    images?: {
      image1?: {
        data: string;
        contentType: string;
      };
    };
    price: number;
  };
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  amount: number;
  deliveryStatus: string;
  date: string;
  time: string;
  items: OrderItem[];
};

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to show a push notification using the Notification API
  const showNotification = (title: string, body: string) => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, { body });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(title, { body });
          }
        });
      }
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const ordersData = await getCustomerOrders();
        const transformedOrders: Order[] = ordersData.map((o: any) => ({
          id: o._id,
          amount: o.totalAmount,
          deliveryStatus: o.deliveryStatus,
          date: new Date(o.orderDate).toLocaleDateString(),
          time: new Date(o.orderDate).toLocaleTimeString(),
          items: o.items || [],
        }));
        setOrders(transformedOrders);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch orders."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Initialize Socket.IO connection
    const socketInstance: Socket = io(SOCKET_URL);

    // Real-time order updates
    socketInstance.on("order-updated", (payload: any) => {
      console.log("order-updated received:", payload);
      const updatedOrder = payload.order ? payload.order : payload;
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === updatedOrder.id || order.id === updatedOrder._id
            ? {
                ...order,
                deliveryStatus: updatedOrder.deliveryStatus,
                amount: updatedOrder.totalAmount,
              }
            : order
        )
      );

      const status = updatedOrder.deliveryStatus.toLowerCase();
      if (status === "accepted") {
        showNotification(
          "Your Order is accepted",
          `Order ${updatedOrder.id || updatedOrder._id} has been accepted.`
        );
      } else if (status === "intransit") {
        showNotification(
          "Your Order is in the way",
          `Order ${updatedOrder.id || updatedOrder._id} is in transit.`
        );
      } else if (status === "delivered") {
        showNotification(
          "Your Order is delivered",
          `Order ${updatedOrder.id || updatedOrder._id} has been delivered.`
        );
      } else if (status === "rejected") {
        showNotification(
          "Your Order is Rejected",
          `Order ${updatedOrder.id || updatedOrder._id} has been rejected.`
        );
      }
    });

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-brand-100 text-brand-700";
      case "Cancelled":
        return "bg-red-100 text-red-600";
      case "Pending":
        return "bg-amber-100 text-amber-600";
      case "InTransit":
        return "bg-blue-100 text-blue-600";
      case "Rejected":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const handleOrderClick = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg font-medium text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl p-4 sm:p-6">
      <div className="mb-6">
        <p className="font-display text-sm italic text-accent-600">
          Your basket history
        </p>
        <h1 className="font-display mt-0.5 text-3xl font-black tracking-tight text-ink-800">
          My Orders
        </h1>
      </div>
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex cursor-pointer flex-col justify-between gap-4 rounded-3xl border border-cream-300 bg-cream-50 p-4 shadow-arch transition hover:-translate-y-0.5 hover:border-brand-400 sm:flex-row sm:items-center"
              onClick={() => handleOrderClick(order.id)}
            >
              <div className="flex w-full items-center gap-4 sm:w-auto">
                <div className="arch-frame flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden bg-cream-200/70">
                  {order.items.length > 0 &&
                  order.items[0]?.product?.images?.image1?.data ? (
                    <img
                      src={`data:${order.items[0].product.images.image1.contentType};base64,${order.items[0].product.images.image1.data}`}
                      alt={order.items[0].product.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-ink-400">N/A</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink-800">
                    Order #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-ink-500">
                    Placed {order.date}, {order.time}
                  </p>
                  <p className="text-xs text-ink-500">
                    {order.items.length} item{order.items.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                <p className="text-base font-extrabold text-ink-900">₹{order.amount}</p>
                <span className={`chip ${getStatusStyles(order.deliveryStatus)}`}>
                  {order.deliveryStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-cream-400 bg-cream-50 py-20">
          <p className="font-display text-lg italic text-ink-500">No orders found</p>
        </div>
      )}
    </div>
  );
};

export default Orders;
