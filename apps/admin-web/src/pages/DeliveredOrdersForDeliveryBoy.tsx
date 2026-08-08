import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getDeliveredOrdersForDeliveryBoy,
  Order,
} from "../api"; // <--- We'll import from api.ts
// or keep `import api from "../api";` if you prefer direct calls
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import Loading from "../components/ui/Loading";
import { FaArrowLeft, FaBoxOpen } from "react-icons/fa";

interface GroupedOrders {
  key: string;    // e.g. "2023-3"
  label: string;  // e.g. "March 2023"
  orders: Order[];
  total: number;  // sum of totalAmount
  earningTotal: number; // sum of deliveryBoyEarning
}

const DeliveredOrdersForDeliveryBoy: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Delivery boy ID from URL params
  const [orders, setOrders] = useState<Order[]>([]);
  const [groupedOrders, setGroupedOrders] = useState<GroupedOrders[]>([]);

  // Set default selectedMonth to current month key
  const now = new Date();
  const defaultMonthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonthKey);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDeliveredOrders = async () => {
      if (!id) return; // If no ID, do nothing
      try {
        // Approach A: Use our new function from api.ts
        const data = await getDeliveredOrdersForDeliveryBoy(id);
        setOrders(data);
      } catch (err: any) {
        console.error(
          "Error fetching delivered orders",
          err.response?.data || err.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveredOrders();
  }, [id]);

  // Alternatively, if you want to keep direct call:
  //   const response = await api.get(`/orders/delivered?deliveryBoyId=${id}`);
  //   setOrders(response.data);

  // Group orders by month-year
  const groupOrdersByMonth = (allOrders: Order[]): GroupedOrders[] => {
    const groups: { [key: string]: GroupedOrders } = {};

    allOrders.forEach((order) => {
      const date = new Date(order.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`; // e.g. "2023-3"
      const label = date.toLocaleString("default", { month: "long", year: "numeric" });

      if (!groups[key]) {
        groups[key] = { key, label, orders: [], total: 0, earningTotal: 0 };
      }
      groups[key].orders.push(order);
      // add to total
      groups[key].total += order.totalAmount;

      // add to earningTotal (if any)
      const earning = order.deliveryBoyEarning ?? 0;
      groups[key].earningTotal += earning;
    });

    const groupedArray = Object.values(groups);
    // Sort groups descending (newest month first)
    groupedArray.sort((a, b) => {
      const dateA = new Date(a.orders[0].createdAt);
      const dateB = new Date(b.orders[0].createdAt);
      return dateB.getTime() - dateA.getTime();
    });
    return groupedArray;
  };

  useEffect(() => {
    if (!loading && orders.length > 0) {
      const groups = groupOrdersByMonth(orders);
      setGroupedOrders(groups);
    }
  }, [loading, orders]);

  // Filter groups based on selectedMonth
  const filteredGroups = groupedOrders.filter((group) => group.key === selectedMonth);

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Delivered Orders"
        subtitle={`Delivered orders for delivery boy ${id}`}
      />

      {/* Dropdown to select month */}
      <div className="mb-6 flex items-center gap-3">
        <label htmlFor="monthSelect" className="text-sm font-medium text-slate-700">
          Select Month:
        </label>
        <select
          id="monthSelect"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="input-base w-auto"
        >
          {groupedOrders.map((group) => (
            <option key={group.key} value={group.key}>
              {group.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loading label="Loading delivered orders..." />
      ) : orders.length === 0 ? (
        <EmptyState message="No delivered orders found." />
      ) : filteredGroups.length === 0 ? (
        <EmptyState message="No orders found for the selected month." />
      ) : (
        <>
          {filteredGroups.map((group) => (
            <div key={group.key} className="mb-8">
              <DataTable
                columns={["Order ID", "Customer", "Shop", "Total Amount", "Delivery Earning", "Order Date"]}
              >
                {group.orders.map((order) => (
                  <tr
                    key={order._id}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                    onClick={() => navigate(`/orders/${order._id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {order._id}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {order.customerName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{order.shopName}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      ₹{order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="success">
                        ₹{(order.deliveryBoyEarning ?? 0).toFixed(2)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </DataTable>

              {/* Summaries at bottom */}
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
                <FaBoxOpen size={14} />
                Monthly Delivery Boy Earnings: ₹{group.earningTotal.toFixed(2)}
              </div>
            </div>
          ))}
        </>
      )}

      <button
        onClick={() => navigate(`/delivery-partners/${id}`)}
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
      >
        <FaArrowLeft size={14} /> Back to Delivery Partner
      </button>
    </div>
  );
};

export default DeliveredOrdersForDeliveryBoy;
