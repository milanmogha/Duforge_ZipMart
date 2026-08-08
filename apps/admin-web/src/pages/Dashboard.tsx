import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "../components/ui/StatCard";
import { Socket } from "socket.io-client";
import api from "../api";
import {
  FaStore,
  FaRupeeSign,
  FaShoppingBag,
  FaImage,
  FaImages,
  FaPhotoVideo,
  FaTicketAlt,
} from "react-icons/fa";

interface DashboardProps {
  socket: Socket | null;
}

const Dashboard: React.FC<DashboardProps> = ({ socket }) => {
  const [stats, setStats] = useState({
    totalShops: 0,
    totalSales: 0,
    totalOrders: 0,
  });

  // Main (rotating) banners
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Banner2 carousel
  const [banners2, setBanners2] = useState<any[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Banner3 carousel
  const [banners3, setBanners3] = useState<any[]>([]);
  const [carouselIndex3, setCarouselIndex3] = useState(0);

  const navigate = useNavigate();

  // Refs to measure container width for carousels
  const banner2ContainerRef = useRef<HTMLDivElement>(null);
  const banner3ContainerRef = useRef<HTMLDivElement>(null);
  const [banner2Width, setBanner2Width] = useState(0);
  const [banner3Width, setBanner3Width] = useState(0);

  useEffect(() => {
    fetchDashboardData();
    fetchBanners();
    fetchBanners2();
    fetchBanners3();

    if (socket) {
      socket.on("order:added", updateStatsFromSocket);
      socket.on("order:updated", updateStatsFromSocket);
      socket.on("shopUpdatedOrAdded", fetchDashboardData);

      return () => {
        socket.off("order:added", updateStatsFromSocket);
        socket.off("order:updated", updateStatsFromSocket);
        socket.off("shopUpdatedOrAdded", fetchDashboardData);
      };
    }
  }, [socket]);

  // Auto-rotate the main banner every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) =>
        banners.length > 0 ? (prevIndex + 1) % banners.length : 0
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [banners]);

  // Auto-rotate Banner2 carousel every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prevIndex) =>
        banners2.length > 0 ? (prevIndex + 1) % banners2.length : 0
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [banners2]);

  // Auto-rotate Banner3 carousel every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex3((prevIndex) =>
        banners3.length > 0 ? (prevIndex + 1) % banners3.length : 0
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [banners3]);

  // Update carousel container widths on mount and window resize
  useEffect(() => {
    const updateBannerWidths = () => {
      if (banner2ContainerRef.current) {
        setBanner2Width(banner2ContainerRef.current.clientWidth);
      }
      if (banner3ContainerRef.current) {
        setBanner3Width(banner3ContainerRef.current.clientWidth);
      }
    };
    updateBannerWidths();
    window.addEventListener("resize", updateBannerWidths);
    return () => window.removeEventListener("resize", updateBannerWidths);
  }, []);

  // ------------------------------------------------------------------
  // Fetch Data
  // ------------------------------------------------------------------
  const fetchDashboardData = async () => {
    try {
      const [shopsResponse, ordersResponse] = await Promise.all([
        api.get("/shop"),
        api.get("/orders/all"),
      ]);

      const totalShops = shopsResponse.data.length;
      const totalOrders = ordersResponse.data.length;
      const totalSales = ordersResponse.data.reduce(
        (acc: number, order: any) => acc + order.totalAmount,
        0
      );

      setStats({ totalShops, totalSales, totalOrders });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  // Existing banners
  const fetchBanners = async () => {
    try {
      const response = await api.get("/banners");
      setBanners(response.data);
    } catch (error) {
      console.error("Error fetching banners:", error);
    }
  };

  // Banner2 carousel banners
  const fetchBanners2 = async () => {
    try {
      const response = await api.get("/banner2");
      setBanners2(response.data);
    } catch (error) {
      console.error("Error fetching banner2:", error);
    }
  };

  // Banner3 carousel banners
  const fetchBanners3 = async () => {
    try {
      const response = await api.get("/banner3");
      setBanners3(response.data);
    } catch (error) {
      console.error("Error fetching banner3:", error);
    }
  };

  const updateStatsFromSocket = async () => {
    await fetchDashboardData();
  };

  const manageTiles = [
    {
      title: "Manage Banners",
      description: "View and manage the main rotating banners.",
      icon: FaImage,
      path: "/manage-banners",
      accent: "from-indigo-500 to-indigo-600",
    },
    {
      title: "Manage Banner 2",
      description: "View and manage the second set of banners.",
      icon: FaImages,
      path: "/manage-banners2",
      accent: "from-sky-500 to-sky-600",
    },
    {
      title: "Manage Banner 3",
      description: "View and manage the third set of banners.",
      icon: FaPhotoVideo,
      path: "/manage-banners3",
      accent: "from-violet-500 to-violet-600",
    },
    {
      title: "Manage Coupons",
      description: "Create and manage discount coupons.",
      icon: FaTicketAlt,
      path: "/manage-coupons",
      accent: "from-emerald-500 to-emerald-600",
    },
  ];

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div className="p-4 sm:p-6">
      {/* Welcome header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back 👋
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Here's how the ZipMart marketplace is doing.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-card">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Shops"
          value={stats.totalShops.toString()}
          icon={FaStore}
          tone="indigo"
          sub="Active stores on the platform"
        />
        <StatCard
          title="Total Sales"
          value={`₹${stats.totalSales.toLocaleString()}`}
          icon={FaRupeeSign}
          tone="emerald"
          sub="Across all orders"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toString()}
          icon={FaShoppingBag}
          tone="amber"
          sub="All-time order volume"
        />
      </div>

      {/* Banner previews */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-800 tracking-tight">
          Banner Previews
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Main Rotating Banner */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Banner 1</h3>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
                1200 × 600
              </span>
            </div>
            {banners.length > 0 ? (
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={banners[currentBannerIndex]?.image}
                  alt={`Banner ${currentBannerIndex + 1}`}
                  className="aspect-[2/1] w-full object-cover"
                />
                {banners[currentBannerIndex]?.text && (
                  <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-white">
                    <h2 className="text-sm font-bold">
                      {banners[currentBannerIndex]?.text}
                    </h2>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex aspect-[2/1] items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-400">
                No banners available
              </div>
            )}
          </div>

          {/* Banner2 Carousel */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Banner 2</h3>
              <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-600">
                1200 × 500
              </span>
            </div>
            <div ref={banner2ContainerRef} className="overflow-hidden rounded-lg">
              <div
                className="flex items-center transition-transform duration-300"
                style={{
                  transform: `translateX(-${carouselIndex * banner2Width}px)`,
                }}
              >
                {banners2.length > 0 ? (
                  banners2.map((banner) => (
                    <div key={banner._id} className="relative w-full flex-shrink-0">
                      <img
                        src={banner.image}
                        alt="Banner2"
                        className="aspect-[12/5] w-full object-cover"
                      />
                      {banner.text && (
                        <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-white">
                          <h2 className="text-sm font-bold">{banner.text}</h2>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex aspect-[12/5] w-full items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-400">
                    No banners available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Banner3 Carousel */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Banner 3</h3>
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-600">
                800 × 400
              </span>
            </div>
            <div ref={banner3ContainerRef} className="overflow-hidden rounded-lg">
              <div
                className="flex items-center transition-transform duration-300"
                style={{
                  transform: `translateX(-${carouselIndex3 * banner3Width}px)`,
                }}
              >
                {banners3.length > 0 ? (
                  banners3.map((banner) => (
                    <div key={banner._id} className="relative w-full flex-shrink-0">
                      <img
                        src={banner.image}
                        alt="Banner3"
                        className="aspect-[2/1] w-full object-cover"
                      />
                      {banner.text && (
                        <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-white">
                          <h2 className="text-sm font-bold">{banner.text}</h2>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex aspect-[2/1] w-full items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-400">
                    No banners available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manage tiles */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-800 tracking-tight">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {manageTiles.map((tile) => (
            <div
              key={tile.path}
              onClick={() => navigate(tile.path)}
              className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${tile.accent} text-white shadow-md transition-transform group-hover:scale-105`}
              >
                <tile.icon size={20} />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-800">
                {tile.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{tile.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
