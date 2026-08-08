import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBoxOpen, FaStore, FaUser, FaRupeeSign, FaMapMarkerAlt } from "react-icons/fa";
import { getDeliveredOrders, Order } from "../api";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import Loading from "../components/ui/Loading";

const DeliveredOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getDeliveredOrders();
      setOrders(data);
    } catch (err: any) {
      console.error("Failed to fetch delivered orders:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <FaBoxOpen size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Delivered Orders</h1>
          <p className="text-sm text-gray-500">Orders you have completed</p>
        </div>
      </div>

      {loading ? (
        <Loading label="Loading delivered orders..." />
      ) : orders.length === 0 ? (
        <EmptyState message="No delivered orders yet." icon={FaBoxOpen} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <Card
              key={order._id}
              className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <div onClick={() => navigate(`/orders/${order._id}`)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <FaStore size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-gray-900">
                        {order.shopName || "Shop"}
                      </p>
                      <p className="text-xs text-gray-500">Order {order._id.slice(-8)}</p>
                    </div>
                  </div>
                  <Badge tone="success">Delivered</Badge>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-gray-600">
                    <FaUser className="text-gray-400" size={13} />
                    {order.customerName || "Customer"}
                  </p>
                  <p className="flex items-center gap-2 font-semibold text-gray-900">
                    <FaRupeeSign className="text-brand-600" size={13} />
                    ₹{order.totalAmount?.toFixed?.(2) ?? order.totalAmount}
                  </p>
                  {order.deliveryAddress && (
                    <p className="flex items-start gap-2 text-gray-500">
                      <FaMapMarkerAlt className="mt-0.5 shrink-0 text-gray-400" size={13} />
                      <span className="line-clamp-2">{order.deliveryAddress}</span>
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveredOrders;
