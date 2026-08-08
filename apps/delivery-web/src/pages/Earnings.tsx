import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaRupeeSign, FaWallet, FaArrowRight } from "react-icons/fa";
import { getDeliveredOrders, Order } from "../api";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import Loading from "../components/ui/Loading";

interface EarningEntry {
  orderId: string;
  earning: number;
  date: string;
}

const Earnings: React.FC = () => {
  const [entries, setEntries] = useState<EarningEntry[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchEarnings = useCallback(async () => {
    try {
      const orders: Order[] = await getDeliveredOrders();
      const mapped: EarningEntry[] = orders.map((order) => ({
        orderId: order._id,
        earning: order.deliveryBoyEarning ?? 0,
        date: order.createdAt || order.orderDate || "",
      }));
      setEntries(mapped);
      setTotalEarnings(mapped.reduce((sum, e) => sum + e.earning, 0));
    } catch (err: any) {
      console.error("Failed to fetch earnings:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <FaRupeeSign size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Earnings</h1>
          <p className="text-sm text-gray-500">Your delivery earnings</p>
        </div>
      </div>

      {loading ? (
        <Loading label="Fetching earnings..." />
      ) : (
        <>
          {/* Total earnings card */}
          <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-card-hover">
            <div className="flex items-center gap-2 text-brand-100">
              <FaWallet size={16} />
              <span className="text-sm font-medium">Total Earnings</span>
            </div>
            <p className="mt-2 text-4xl font-extrabold tracking-tight">
              ₹{totalEarnings.toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-brand-200">{entries.length} completed deliveries</p>
          </div>

          {/* Earnings history */}
          <h2 className="section-title mb-4">Earnings History</h2>
          {entries.length === 0 ? (
            <EmptyState message="No earnings yet. Complete deliveries to start earning." icon={FaWallet} />
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <Card
                  key={entry.orderId}
                  className="flex items-center justify-between gap-4 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-gray-400">{entry.orderId}</p>
                    {entry.date && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        {new Date(entry.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone="success">₹{entry.earning.toFixed(2)}</Badge>
                    <button
                      onClick={() => navigate(`/orders/${entry.orderId}`)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition-colors hover:bg-brand-50 hover:text-brand-700"
                      aria-label="View order"
                    >
                      <FaArrowRight size={14} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Earnings;
