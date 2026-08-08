import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuth } from "../context/AuthContext";
import API from "../api";
import {
  FaCube,
  FaInfoCircle,
  FaQuestionCircle,
  FaSignOutAlt,
  FaUserAlt,
} from "react-icons/fa";

const navItems = [
  { path: "/account/orders", label: "My Orders", icon: FaCube },
  { path: "/about-us", label: "About Us", icon: FaInfoCircle },
  { path: "/account/help", label: "Help", icon: FaQuestionCircle },
];

const Account: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profile, setProfile] = useState<{ name?: string; email?: string; phone?: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchProfile = async () => {
      try {
        const res = await API.get<{ user: { name: string; email?: string; phone?: string } }>("/users/me");
        setProfile(res.data.user);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, [isAuthenticated]);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate("/landing");
  };

  return (
    <div className="min-h-screen bg-cream-100 pb-20 md:pb-0">
      <Navbar active="account" />

      <main className="mx-auto max-w-5xl px-4">
        {isAuthenticated ? (
          <>
            {/* ── Profile hero ── */}
            <section className="relative mt-6 overflow-hidden rounded-[2rem] border border-cream-300 bg-gradient-to-br from-cream-200 via-cream-100 to-cream-300 px-6 py-8 shadow-arch sm:px-8">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent-300/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-brand-300/30 blur-3xl" />

              <div className="relative flex flex-wrap items-center gap-5">
                <div className="arch-frame flex h-20 w-20 shrink-0 items-center justify-center bg-brand-100 text-brand-700">
                  <FaUserAlt size={34} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm italic text-accent-600">
                    Your market account
                  </p>
                  <h1 className="font-display mt-0.5 truncate text-3xl font-black tracking-tight text-ink-800 sm:text-4xl">
                    Hi, {profile?.name || "Customer"} 👋
                  </h1>
                  <p className="mt-1 truncate text-sm text-ink-600">
                    {profile?.email}
                    {profile?.phone ? ` · ${profile.phone}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                >
                  <FaSignOutAlt size={14} /> Logout
                </button>
              </div>
            </section>

            {/* ── Tabs ── */}
            <nav className="mt-6 flex gap-2 overflow-x-auto rounded-3xl border border-cream-300 bg-cream-50 p-1.5 shadow-arch">
              {navItems.map(({ path, label, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                      isActive
                        ? "bg-brand-600 text-white shadow-arch"
                        : "text-ink-700 hover:bg-cream-200 hover:text-brand-700"
                    }`
                  }
                >
                  <Icon size={15} />
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* ── Content ── */}
            <div className="mt-6">
              <Outlet />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="arch-frame flex h-20 w-20 items-center justify-center bg-cream-200 text-ink-400">
              <FaUserAlt size={34} />
            </div>
            <h2 className="font-display mt-5 text-2xl font-bold text-ink-800">
              You are not logged in
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Sign in to see your orders and account details
            </p>
            <button onClick={() => navigate("/signin")} className="btn-primary mt-6">
              Login
            </button>
          </div>
        )}
      </main>

      {/* Logout confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative w-full max-w-sm rounded-[2rem] border border-cream-300 bg-cream-50 p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <FaSignOutAlt size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold text-ink-800">
                  Log out of ZipMart?
                </h3>
                <p className="mt-1 text-sm text-ink-500">
                  You'll need to sign in again to view your orders and account.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-full border border-cream-300 bg-cream-100 px-5 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-cream-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;
