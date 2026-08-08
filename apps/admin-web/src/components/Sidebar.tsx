import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaStore,
  FaTruck,
  FaShoppingBag,
  FaUsers,
  FaBoxOpen,
  FaHeadset,
  FaComments,
  FaSignOutAlt,
  FaTimes,
} from "react-icons/fa";
import logo from "../assets/favicon.svg";
import ConfirmDialog from "./ui/ConfirmDialog";

interface SidebarProps {
  setToken: (token: string | null) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: FaHome },
  { path: "/shops", label: "Shops", icon: FaStore },
  { path: "/delivery-partners", label: "Delivery Partners", icon: FaTruck },
  { path: "/orders", label: "Orders", icon: FaShoppingBag },
  { path: "/accounts", label: "Accounts", icon: FaUsers },
  { path: "/products", label: "Products", icon: FaBoxOpen },
  { path: "/shop-support", label: "Shop Support", icon: FaComments },
  { path: "/customer-support", label: "Customer Support", icon: FaHeadset },
];

const SidebarContent: React.FC<{
  setToken: (token: string | null) => void;
  onNavigate?: () => void;
}> = ({ setToken, onNavigate }) => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setToken(null);
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-5">
        <img
          src={logo}
          alt="ZipMart"
          className="h-9 w-9 shrink-0 rounded-lg object-cover shadow-md"
        />
        <div className="leading-tight">
          <h1 className="text-base font-bold text-white tracking-tight">
            ZipMart
          </h1>
          <p className="text-[11px] font-medium text-indigo-300 uppercase tracking-wider">
            Admin Panel
          </p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path} className="relative">
              <NavLink
                to={item.path}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-500/20 text-white"
                      : "text-indigo-200 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-emerald-400 transition-opacity ${
                        isActive ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <item.icon
                      className={`shrink-0 text-base ${
                        isActive ? "text-white" : "text-indigo-300"
                      }`}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex w-full items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5 text-sm font-medium text-indigo-100 transition-colors hover:bg-red-500/20 hover:text-red-200"
        >
          <FaSignOutAlt className="shrink-0 text-base" />
          Logout
        </button>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmLabel="Logout"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  setToken,
  isMobileOpen,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900 lg:flex">
        <SidebarContent setToken={setToken} />
      </aside>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900 shadow-drawer">
            <button
              onClick={onCloseMobile}
              className="absolute right-3 top-4 rounded-lg p-2 text-indigo-200 hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <FaTimes size={18} />
            </button>
            <SidebarContent setToken={setToken} onNavigate={onCloseMobile} />
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
