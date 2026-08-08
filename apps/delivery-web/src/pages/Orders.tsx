import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaClipboardList, FaBoxOpen, FaTruck, FaStore, FaMapMarkerAlt, FaRupeeSign } from "react-icons/fa";
import {
  getOrdersInRange,
  getAcceptedOrders,
  getInTransitOrders,
  acceptOrder,
  rejectOrder,
  Order,
} from "../api";
import { useSocket } from "../socket";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Loading from "../components/ui/Loading";

type Tab = "available" | "accepted" | "intransit";

const statusTone = (status: string) => {
  switch (status) {
    case "Pending":
      return "warning";
    case "Accepted":
      return "info";
    case "InTransit":
      return "info";
    case "Delivered":
      return "success";
    case "Rejected":
      return "danger";
    default:
      return "neutral";
  }
};

const OrderCard: React.FC<{
  order: Order;
  onAccept?: (o: Order) => void;
  onReject?: (o: Order) => void;
  busy?: boolean;
}> = ({ order, onAccept, onReject, busy }) => {
  const navigate = useNavigate();
  return (
    <Card className="transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <FaStore size={20} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-gray-900">
              {order.shopName || "Shop"}
            </p>
            <p className="text-xs text-gray-500">Order {order._id.slice(-8)}</p>
          </div>
        </div>
        <Badge tone={statusTone(order.deliveryStatus) as any}>
          {order.deliveryStatus}
        </Badge>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <p className="flex items-center gap-2 text-gray-600">
          <FaMapMarkerAlt className="text-gray-400" size={13} />
          {order.customerName || "Customer"}
        </p>
        {typeof order.distance === "number" && (
          <p className="flex items-center gap-2 text-gray-600">
            <FaTruck className="text-gray-400" size={13} />
            {order.distance.toFixed(1)} km away
          </p>
        )}
        <p className="flex items-center gap-2 font-semibold text-gray-900">
          <FaRupeeSign className="text-brand-600" size={13} />
          ₹{order.totalAmount?.toFixed?.(2) ?? order.totalAmount}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {order.deliveryStatus === "Accepted" || order.deliveryStatus === "InTransit" ? (
          <Button variant="primary" size="sm" onClick={() => navigate(`/orders/${order._id}`)}>
            View Details
          </Button>
        ) : (
          <>
            {onAccept && (
              <Button
                variant="success"
                size="sm"
                disabled={busy}
                onClick={() => onAccept(order)}
              >
                <FaBoxOpen size={12} /> Accept
              </Button>
            )}
            {onReject && (
              <Button
                variant="danger"
                size="sm"
                disabled={busy}
                onClick={() => onReject(order)}
              >
                Reject
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
};

const Orders: React.FC = () => {
  const [tab, setTab] = useState<Tab>("available");
  const [available, setAvailable] = useState<Order[]>([]);
  const [accepted, setAccepted] = useState<Order[]>([]);
  const [inTransit, setInTransit] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const { socket } = useSocket();

  const fetchAccepted = useCallback(async () => {
    try {
      const data = await getAcceptedOrders();
      setAccepted(data);
    } catch (err: any) {
      console.error("Failed to fetch accepted orders:", err.message);
    }
  }, []);

  const fetchInTransit = useCallback(async () => {
    try {
      const data = await getInTransitOrders();
      setInTransit(data);
    } catch (err: any) {
      console.error("Failed to fetch in-transit orders:", err.message);
    }
  }, []);

  const fetchAvailable = useCallback(async (lat: number, lng: number) => {
    try {
      const data = await getOrdersInRange(lat, lng);
      setAvailable(data);
    } catch (err: any) {
      console.error("Failed to fetch available orders:", err.message);
    }
  }, []);

  // Load everything on mount (needs geolocation for in-range)
  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([fetchAccepted(), fetchInTransit()]);
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setCoords(c);
              await fetchAvailable(c.lat, c.lng);
            },
            (err) => {
              console.error("Geolocation error:", err.message);
              toast.error("Could not get your location. Available orders may be empty.");
            }
          );
        } else {
          toast.error("Geolocation not supported in this browser.");
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchAccepted, fetchInTransit, fetchAvailable]);

  // Socket-driven live updates
  useEffect(() => {
    if (!socket) return;

    const refreshAll = () => {
      fetchAccepted();
      fetchInTransit();
      if (coords) fetchAvailable(coords.lat, coords.lng);
    };

    socket.on("new-order", refreshAll);
    socket.on("orders-updated", refreshAll);
    socket.on("order-updated", refreshAll);
    socket.on("order-rejected", refreshAll);
    socket.on("payment-status-updated", refreshAll);

    return () => {
      socket.off("new-order", refreshAll);
      socket.off("orders-updated", refreshAll);
      socket.off("order-updated", refreshAll);
      socket.off("order-rejected", refreshAll);
      socket.off("payment-status-updated", refreshAll);
    };
  }, [socket, coords, fetchAccepted, fetchInTransit, fetchAvailable]);

  const handleAccept = async (order: Order) => {
    setActioning(order._id);
    try {
      await acceptOrder(order._id);
      toast.success("Order accepted!");
      await fetchAccepted();
      if (coords) await fetchAvailable(coords.lat, coords.lng);
    } catch (err: any) {
      toast.error(err.message || "Failed to accept order.");
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (order: Order) => {
    if (!window.confirm(`Reject order ${order._id.slice(-8)}?`)) return;
    setActioning(order._id);
    try {
      await rejectOrder(order._id);
      toast.success("Order rejected.");
      if (coords) await fetchAvailable(coords.lat, coords.lng);
    } catch (err: any) {
      toast.error(err.message || "Failed to reject order.");
    } finally {
      setActioning(null);
    }
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "available", label: "Available", count: available.length },
    { key: "accepted", label: "Accepted", count: accepted.length },
    { key: "intransit", label: "In Transit", count: inTransit.length },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <FaClipboardList size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orders</h1>
          <p className="text-sm text-gray-500">Accept nearby orders and manage deliveries</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200 pb-px">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative whitespace-nowrap px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "text-brand-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            <span
              className={`ml-1.5 rounded-full px-2 py-0.5 text-xs ${
                tab === t.key ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {t.count}
            </span>
            {tab === t.key && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-600" />
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading label="Loading orders..." />
      ) : tab === "available" ? (
        available.length === 0 ? (
          <EmptyState message="No available orders nearby right now." icon={FaBoxOpen} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {available.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onAccept={handleAccept}
                onReject={handleReject}
                busy={actioning === order._id}
              />
            ))}
          </div>
        )
      ) : tab === "accepted" ? (
        accepted.length === 0 ? (
          <EmptyState message="No accepted orders." icon={FaBoxOpen} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {accepted.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )
      ) : inTransit.length === 0 ? (
        <EmptyState message="No orders in transit." icon={FaTruck} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {inTransit.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
