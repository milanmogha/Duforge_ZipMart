import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaBars, FaSignOutAlt } from "react-icons/fa";
import ConfirmDialog from "./ui/ConfirmDialog";

interface TopbarProps {
  setToken: (token: string | null) => void;
  onOpenMobile: () => void;
}

const titleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/shops": "Shops",
  "/delivery-partners": "Delivery Partners",
  "/orders": "Orders",
  "/accounts": "Accounts",
  "/products": "Products",
  "/shop-support": "Shop Support",
  "/customer-support": "Customer Support",
  "/manage-banners": "Manage Banners",
  "/manage-banners2": "Manage Banners 2",
  "/manage-banners3": "Manage Banners 3",
  "/manage-coupons": "Manage Coupons",
};

const Topbar: React.FC<TopbarProps> = ({ setToken, onOpenMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const title = titleMap[location.pathname] ?? "ZipMart Admin";

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setToken(null);
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6">
      {/* Mobile hamburger */}
      <button
        onClick={onOpenMobile}
        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 lg:hidden"
        aria-label="Open menu"
      >
        <FaBars size={18} />
      </button>

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-lg font-semibold text-slate-800 tracking-tight">
          {title}
        </h2>
        <p className="hidden text-xs text-slate-400 sm:block">
          ZipMart Admin Panel
        </p>
      </div>

      {/* Logout */}
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <FaSignOutAlt size={14} />
        <span className="hidden sm:inline">Logout</span>
      </button>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmLabel="Logout"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </header>
  );
};

export default Topbar;
