import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  FaTimes,
  FaHome,
  FaBoxOpen,
  FaPlus,
  FaPlusSquare,
  FaUserCircle,
  FaQuestionCircle,
  FaSignOutAlt,
  FaClipboardList,
  FaEllipsisH,
} from "react-icons/fa";
import logo from "../assets/zipmart-logo.svg";
import api from "../api";
import ConfirmDialog from "./ui/ConfirmDialog";

interface NavbarProps {
  setToken: (token: string | null) => void;
}

const Navbar: React.FC<NavbarProps> = ({ setToken }) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [shopName, setShopName] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const fetchShopName = async () => {
      try {
        const shopkeeperId = localStorage.getItem("shopkeeperId");
        if (shopkeeperId) {
          const response = await api.get(`/shop/${shopkeeperId}`);
          const { shopName } = response.data;
          setShopName(shopName || "");
        }
      } catch (error) {
        console.error("Error fetching shop name:", error);
      }
    };

    fetchShopName();
  }, []);

  // Close the sheet on navigation and keep the page behind it from scrolling.
  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMoreOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isMoreOpen]);

  const handleLogout = () => {
    localStorage.removeItem("shopkeeperToken");
    localStorage.removeItem("shopkeeperId");
    setToken(null);
    navigate("/shopkeeper/login", { replace: true });
  };

  const navItems = [
    { path: "/shopkeeper/dashboard", label: "Dashboard", icon: <FaHome /> },
    { path: "/shopkeeper/orders", label: "Orders", icon: <FaClipboardList /> },
    { path: "/shopkeeper/add-product", label: "Add Product", icon: <FaPlusSquare /> },
    { path: "/shopkeeper/products", label: "Products", icon: <FaBoxOpen /> },
    { path: "/shopkeeper/account", label: "Account", icon: <FaUserCircle /> },
    { path: "/shopkeeper/messages", label: "Help & Support", icon: <FaQuestionCircle /> },
  ];

  // Mobile: four tabs around a raised "Add Product" action, the rest in "More".
  const tabItems = [
    { path: "/shopkeeper/dashboard", label: "Home", icon: <FaHome /> },
    { path: "/shopkeeper/orders", label: "Orders", icon: <FaClipboardList /> },
    { path: "/shopkeeper/products", label: "Products", icon: <FaBoxOpen /> },
  ];

  const moreItems = [
    { path: "/shopkeeper/account", label: "Account", icon: <FaUserCircle /> },
    { path: "/shopkeeper/messages", label: "Help & Support", icon: <FaQuestionCircle /> },
  ];

  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.path));

  const currentLabel =
    navItems.find((item) => pathname.startsWith(item.path))?.label ??
    "Shopkeeper Portal";

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors duration-200 ${
      isActive ? "text-brand-600" : "text-slate-400 active:text-slate-600"
    }`;

  const sheetItemClass =
    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors active:bg-slate-100";

  return (
    <>
      {/* ── Desktop sidebar (hidden below 900px via CSS) ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white md-portal:flex">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2 border-b border-slate-100 px-6 py-7">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 shadow-md shadow-brand-500/30">
            <img src={logo} alt="ZipMart" className="h-14 w-14 rounded-2xl object-cover" />
          </div>
          <div className="text-center">
            <p className="text-base font-bold leading-tight text-slate-900">
              {shopName || "Bellybasket"}
            </p>
            <p className="text-xs font-medium text-slate-400">
              Shopkeeper Portal
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={navLinkClass}>
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className="border-t border-slate-100 p-4">
          <button
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar (visible below 900px via CSS) ── */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md md-portal:hidden">
        <img
          src={logo}
          alt="ZipMart"
          className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight text-slate-900">
            {shopName || "Bellybasket Shop"}
          </p>
          <p className="truncate text-[11px] font-medium text-slate-400">
            {currentLabel}
          </p>
        </div>
        <NavLink
          to="/shopkeeper/account"
          aria-label="Account"
          className={({ isActive }) =>
            `flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg transition-colors ${
              isActive
                ? "bg-brand-50 text-brand-600"
                : "bg-slate-100 text-slate-500"
            }`
          }
        >
          <FaUserCircle />
        </NavLink>
      </header>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md-portal:hidden">
        <div className="mx-auto flex h-16 max-w-lg items-stretch gap-1 px-2">
          {tabItems.slice(0, 2).map((item) => (
            <NavLink key={item.path} to={item.path} className={tabClass}>
              {({ isActive }) => (
                <>
                  <span className="text-[19px]">{item.icon}</span>
                  <span>{item.label}</span>
                  <span
                    className={`h-0.5 w-5 rounded-full transition-colors ${
                      isActive ? "bg-brand-500" : "bg-transparent"
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}

          {/* Raised primary action */}
          <div className="flex w-14 shrink-0 items-center justify-center">
            <NavLink
              to="/shopkeeper/add-product"
              aria-label="Add Product"
              className={({ isActive }) =>
                `-mt-2 flex h-11 w-11 items-center justify-center rounded-xl text-base text-white shadow-md shadow-brand-500/35 ring-[3px] ring-white transition-transform active:scale-95 ${
                  isActive ? "bg-brand-600" : "bg-brand-500"
                }`
              }
            >
              <FaPlus />
            </NavLink>
          </div>

          {tabItems.slice(2).map((item) => (
            <NavLink key={item.path} to={item.path} className={tabClass}>
              {({ isActive }) => (
                <>
                  <span className="text-[19px]">{item.icon}</span>
                  <span>{item.label}</span>
                  <span
                    className={`h-0.5 w-5 rounded-full transition-colors ${
                      isActive ? "bg-brand-500" : "bg-transparent"
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}

          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            aria-label="More"
            aria-expanded={isMoreOpen}
            className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors duration-200 ${
              isMoreActive || isMoreOpen
                ? "text-brand-600"
                : "text-slate-400 active:text-slate-600"
            }`}
          >
            <span className="text-[19px]">
              <FaEllipsisH />
            </span>
            <span>More</span>
            <span
              className={`h-0.5 w-5 rounded-full transition-colors ${
                isMoreActive ? "bg-brand-500" : "bg-transparent"
              }`}
            />
          </button>
        </div>
      </nav>

      {/* ── Mobile "More" bottom sheet ── */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 md-portal:hidden">
          <div
            className="absolute inset-0 animate-[fade-in_150ms_ease-out] bg-slate-900/50"
            onClick={() => setIsMoreOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="More options"
            className="absolute inset-x-0 bottom-0 animate-[slide-up_220ms_cubic-bezier(0.22,1,0.36,1)] rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 pb-2 pt-3">
              <span className="mx-auto h-1.5 w-10 rounded-full bg-slate-200" />
            </div>
            <div className="flex items-center gap-3 px-5 pb-3">
              <img
                src={logo}
                alt="ZipMart"
                className="h-10 w-10 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">
                  {shopName || "Bellybasket Shop"}
                </p>
                <p className="text-xs text-slate-400">Shopkeeper Portal</p>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="rounded-full p-2 text-slate-400 active:bg-slate-100"
                aria-label="Close menu"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-1 border-t border-slate-100 p-3">
              {moreItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `${sheetItemClass} ${isActive ? "bg-brand-50 text-brand-700" : ""}`
                  }
                  onClick={() => setIsMoreOpen(false)}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <button
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors active:bg-red-50"
                onClick={() => setShowLogoutConfirm(true)}
              >
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          </div>
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

export default Navbar;
