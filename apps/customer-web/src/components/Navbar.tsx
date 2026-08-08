import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiSearch, FiShoppingCart, FiUser, FiHome, FiGrid, FiMapPin, FiChevronDown } from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { useLocationCtx } from "../context/LocationContext";
import LocationPicker from "./LocationPicker";

export const Wordmark: React.FC<{ className?: string }> = ({ className = "text-2xl" }) => (
  <span className={`font-extrabold tracking-tight ${className}`}>
    <span className="text-brand-600">Zip</span>
    <span className="text-gray-900">Mart</span>
    <span className="text-brand-500">⚡</span>
  </span>
);

interface NavbarProps {
  active?: "home" | "explore" | "cart" | "account";
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

const tabs = [
  { key: "home", label: "Home", icon: FiHome, route: "/landing" },
  { key: "explore", label: "Categories", icon: FiGrid, route: "/explore" },
  { key: "cart", label: "Cart", icon: FiShoppingCart, route: "/cart" },
  { key: "account", label: "Account", icon: FiUser, route: "/account" },
] as const;

const Navbar: React.FC<NavbarProps> = ({ active, searchValue, onSearchChange, searchPlaceholder }) => {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { location } = useLocationCtx();
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const count = cartItems?.length || 0;

  const CartBadge = () =>
    count > 0 ? (
      <span className="absolute -right-2 -top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
        {count}
      </span>
    ) : null;

  // Shorten the address for display: show first 2 parts, e.g. "MG Road, Bengaluru"
  const shortAddress = location?.address
    ? location.address
        .split(",")
        .slice(0, 2)
        .join(",")
        .trim()
    : "";

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <Link to="/landing" className="flex shrink-0 flex-col leading-none">
            <Wordmark />
            <span className="hidden text-[11px] font-semibold text-gray-500 sm:block">
              Groceries in minutes
            </span>
          </Link>

          {/* Delivery location chip */}
          <button
            onClick={() => setShowLocationPicker(true)}
            className="ml-auto flex min-w-0 max-w-[200px] items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-left transition hover:border-brand-300 hover:bg-brand-50 lg:ml-0"
            title="Change delivery location"
          >
            <FiMapPin className="shrink-0 text-brand-600" />
            <span className="truncate text-xs font-semibold text-gray-700">
              {location ? shortAddress || "Deliver here" : "Set delivery location"}
            </span>
            <FiChevronDown className="shrink-0 text-gray-400" />
          </button>

          {/* Search — desktop inline; mobile moves below (rendered twice) */}
          {onSearchChange && (
            <div className="relative hidden min-w-0 flex-1 lg:block lg:max-w-xl">
              <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder || "Search groceries…"}
                className="input-field pl-10"
              />
            </div>
          )}

          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {tabs.map(({ key, label, icon: Icon, route }) => (
              <button
                key={key}
                onClick={() => navigate(route)}
                className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  active === key
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="relative">
                  <Icon size={18} />
                  {key === "cart" && <CartBadge />}
                </span>
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile search row */}
        {onSearchChange && (
          <div className="border-t border-gray-100 px-4 py-2.5 lg:hidden">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder || "Search groceries…"}
                className="input-field pl-10"
              />
            </div>
          </div>
        )}
      </header>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-gray-100 bg-white py-1.5 lg:hidden">
        {tabs.map(({ key, label, icon: Icon, route }) => (
          <button
            key={key}
            onClick={() => navigate(route)}
            className={`flex flex-col items-center gap-0.5 py-1 text-[11px] font-semibold ${
              active === key ? "text-brand-600" : "text-gray-500"
            }`}
          >
            <span className="relative">
              <Icon size={20} />
              {key === "cart" && <CartBadge />}
            </span>
            {label}
          </button>
        ))}
      </nav>

      <LocationPicker open={showLocationPicker} onClose={() => setShowLocationPicker(false)} />
    </>
  );
};

export default Navbar;
