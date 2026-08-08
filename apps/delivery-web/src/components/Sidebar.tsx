import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaClipboardList,
  FaBoxOpen,
  FaRupeeSign,
  FaUser,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import logo from "../assets/favicon.svg";
import ConfirmDialog from "./ui/ConfirmDialog";

interface SidebarProps {
  setToken: (token: string | null) => void;
}

const navItems = [
  { path: "/orders", label: "Orders", icon: FaClipboardList },
  { path: "/delivered", label: "Delivered Orders", icon: FaBoxOpen },
  { path: "/earnings", label: "Earnings", icon: FaRupeeSign },
  { path: "/profile", label: "Profile", icon: FaUser },
];

const Sidebar: React.FC<SidebarProps> = ({ setToken }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("deliveryToken");
    localStorage.removeItem("deliveryBoyId");
    setToken(null);
    navigate("/login", { replace: true });
  };

  const links = (
    <ul className="space-y-1">
      {navItems.map((item) => (
        <li key={item.path}>
          <NavLink
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-brand-50 hover:text-brand-700"
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-5">
          <img
            src={logo}
            alt="ZipMart"
            className="h-9 w-9 shrink-0 rounded-xl object-cover"
          />
          <div className="leading-tight">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">ZipMart</h1>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
              Delivery Partner
            </p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">{links}</nav>
        <div className="border-t border-gray-100 p-3">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <FaSignOutAlt size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <FaBars size={20} />
        </button>
        <div className="flex items-center gap-2">
          <img
            src={logo}
            alt="ZipMart"
            className="h-8 w-8 shrink-0 rounded-lg object-cover"
          />
          <span className="text-base font-bold text-gray-900 tracking-tight">ZipMart Delivery</span>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-lg">
            <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4">
              <div className="flex items-center gap-2">
                <img
                  src={logo}
                  alt="ZipMart"
                  className="h-8 w-8 shrink-0 rounded-lg object-cover"
                />
                <span className="text-base font-bold text-gray-900 tracking-tight">ZipMart Delivery</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close menu"
              >
                <FaTimes size={18} />
              </button>
            </div>
            <nav className="p-3">
              {links}
              <div className="mt-4 border-t border-gray-100 pt-4">
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <FaSignOutAlt size={18} />
                  Logout
                </button>
              </div>
            </nav>
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmLabel="Logout"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
};

export default Sidebar;
