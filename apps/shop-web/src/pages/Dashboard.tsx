import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaClipboardList,
  FaBoxOpen,
  FaPlusSquare,
  FaStore,
  FaUserCircle,
  FaQuestionCircle,
  FaBoxes,
  FaRupeeSign,
  FaCheckCircle,
  FaHourglassHalf,
  FaArrowRight,
  FaExclamationTriangle,
} from "react-icons/fa";
import api from "../api";

interface DashboardStats {
  shopName: string;
  orders: number;
  products: number;
  totalRevenue: number;
  delivered: number;
  pending: number;
}

interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  deliveryStatus: string;
  orderDate?: string;
}

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  images?: { image1?: { data: string; contentType: string } };
}

const statusBadge: Record<string, string> = {
  Delivered: "badge-green",
  Pending: "badge-yellow",
  Accepted: "badge-blue",
  InTransit: "badge-blue",
  Cancelled: "badge-red",
};

const statusLabel: Record<string, string> = {
  Delivered: "Delivered",
  Pending: "Pending",
  Accepted: "Accepted",
  InTransit: "In transit",
  Cancelled: "Cancelled",
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    shopName: "",
    orders: 0,
    products: 0,
    totalRevenue: 0,
    delivered: 0,
    pending: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const shopkeeperId = localStorage.getItem("shopkeeperId");
        if (!shopkeeperId) return;

        const [shopRes, ordersRes, productsRes] = await Promise.all([
          api.get(`/shop/${shopkeeperId}`),
          api.get(`/orders/shop/${shopkeeperId}`),
          api.get(`/products/shop/${shopkeeperId}`),
        ]);

        const orders: Order[] = Array.isArray(ordersRes.data)
          ? ordersRes.data
          : ordersRes.data?.orders ?? [];
        const products: Product[] = Array.isArray(productsRes.data)
          ? productsRes.data
          : [];

        setStats({
          shopName: shopRes.data?.shopName || "Your Shop",
          orders: orders.length,
          products: products.length,
          totalRevenue: orders.reduce(
            (sum: number, o: Order) => sum + (o.totalAmount || 0),
            0
          ),
          delivered: orders.filter((o) => o.deliveryStatus === "Delivered").length,
          pending: orders.filter(
            (o) =>
              o.deliveryStatus === "Pending" ||
              o.deliveryStatus === "Accepted" ||
              o.deliveryStatus === "InTransit"
          ).length,
        });

        // Most recent 5 orders, newest first
        const sorted = [...orders].sort(
          (a, b) =>
            new Date(b.orderDate || 0).getTime() -
            new Date(a.orderDate || 0).getTime()
        );
        setRecentOrders(sorted.slice(0, 5));

        // Low-stock products (10 or fewer units)
        setLowStock(
          products
            .filter((p) => p.stock <= 10)
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 5)
        );
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Total Orders",
      value: stats.orders,
      icon: <FaClipboardList />,
      accent: "bg-blue-50 text-blue-600",
      path: "/shopkeeper/orders",
    },
    {
      label: "Products Listed",
      value: stats.products,
      icon: <FaBoxes />,
      accent: "bg-brand-50 text-brand-600",
      path: "/shopkeeper/products",
    },
    {
      label: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`,
      icon: <FaRupeeSign />,
      accent: "bg-emerald-50 text-emerald-600",
      path: "/shopkeeper/orders",
    },
    {
      label: "Delivered",
      value: stats.delivered,
      icon: <FaCheckCircle />,
      accent: "bg-green-50 text-green-600",
      path: "/shopkeeper/orders",
    },
    {
      label: "In Progress",
      value: stats.pending,
      icon: <FaHourglassHalf />,
      accent: "bg-amber-50 text-amber-600",
      path: "/shopkeeper/orders",
    },
  ];

  const quickActions = [
    {
      label: "Add Product",
      description: "List a new item in your store",
      icon: <FaPlusSquare />,
      accent: "bg-brand-500",
      path: "/shopkeeper/add-product",
    },
    {
      label: "View Orders",
      description: "Track and manage incoming orders",
      icon: <FaClipboardList />,
      accent: "bg-blue-500",
      path: "/shopkeeper/orders",
    },
    {
      label: "Manage Products",
      description: "Edit stock, pricing and details",
      icon: <FaBoxOpen />,
      accent: "bg-violet-500",
      path: "/shopkeeper/products",
    },
    {
      label: "Account Settings",
      description: "Update location and service area",
      icon: <FaUserCircle />,
      accent: "bg-slate-600",
      path: "/shopkeeper/account",
    },
    {
      label: "Help & Support",
      description: "Chat with our support team",
      icon: <FaQuestionCircle />,
      accent: "bg-amber-500",
      path: "/shopkeeper/messages",
    },
  ];

  const imageSrc = (p: Product) =>
    p.images?.image1?.data
      ? `data:${p.images.image1.contentType};base64,${p.images.image1.data}`
      : null;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {stats.shopName}</h1>
          <p className="page-subtitle mt-1">
            Here's what's happening with your store today.
          </p>
        </div>
        <button onClick={() => navigate("/shopkeeper/add-product")} className="btn-primary">
          <FaPlusSquare />
          Add Product
        </button>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card h-28 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {statCards.map((stat) => (
            <button
              key={stat.label}
              onClick={() => navigate(stat.path)}
              className="card group flex flex-col items-start gap-3 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg ${stat.accent}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-slate-900">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-500">
                  {stat.label}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Real content: recent orders + low stock */}
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">Recent Orders</h2>
              <p className="text-sm text-slate-500">Your latest 5 orders</p>
            </div>
            <button
              onClick={() => navigate("/shopkeeper/orders")}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              View all
              <FaArrowRight />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3 p-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <FaClipboardList />
              </div>
              <p className="font-medium text-slate-700">No orders yet</p>
              <p className="text-sm text-slate-500">
                New orders from customers will show up here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <li key={order._id}>
                  <button
                    onClick={() => navigate(`/shopkeeper/orders/${order._id}`)}
                    className="flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        Order #{order._id.slice(-6)}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {order.customerName} · {order.customerPhone}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`badge ${
                          statusBadge[order.deliveryStatus] || "badge-gray"
                        }`}
                      >
                        {statusLabel[order.deliveryStatus] || order.deliveryStatus}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        ₹{order.totalAmount}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Low Stock */}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">Low Stock Alerts</h2>
              <p className="text-sm text-slate-500">Products running low</p>
            </div>
            <button
              onClick={() => navigate("/shopkeeper/products")}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Manage
              <FaArrowRight />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3 p-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : lowStock.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                <FaCheckCircle />
              </div>
              <p className="font-medium text-slate-700">All stocked up</p>
              <p className="text-sm text-slate-500">
                No products are running low right now.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {lowStock.map((product) => (
                <li key={product._id}>
                  <button
                    onClick={() =>
                      navigate("/shopkeeper/add-product", { state: { product } })
                    }
                    className="flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {imageSrc(product) ? (
                        <img
                          src={imageSrc(product)!}
                          alt={product.name}
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                          <FaBoxes />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {product.name}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {product.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {product.stock <= 0 ? (
                        <span className="badge-red">Out of stock</span>
                      ) : (
                        <span className="badge-yellow">
                          <FaExclamationTriangle />
                          {product.stock} left
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Quick Actions */}
      <h2 className="mb-4 mt-10 text-lg font-semibold text-slate-900">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="card group flex items-center gap-4 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg text-white shadow-md ${action.accent}`}
            >
              {action.icon}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{action.label}</p>
              <p className="truncate text-sm text-slate-500">{action.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Store identity */}
      <div className="card mt-10 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
            <FaStore className="text-lg" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{stats.shopName}</p>
            <p className="text-sm text-slate-500">Bellybasket Shopkeeper Portal</p>
          </div>
        </div>
        <button onClick={() => navigate("/shopkeeper/account")} className="btn-secondary">
          <FaUserCircle />
          Manage Account
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
