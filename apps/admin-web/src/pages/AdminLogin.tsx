import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../api";
import logo from "../assets/favicon.svg";

interface AdminLoginProps {
  setToken: (token: string | null) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ setToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const passwordRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/users/admin/login", { email, password });
      const token = response.data.token;

      // Save token to local storage
      localStorage.setItem("adminToken", token);
      setToken(token);

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error logging in admin");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (passwordRef.current && !passwordRef.current.contains(event.target as Node)) {
        setShowPassword(false); // Close the eye icon when clicking outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-700 p-12 lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <img
            src={logo}
            alt="ZipMart"
            className="h-11 w-11 shrink-0 rounded-xl object-cover shadow-lg"
          />
          <div className="leading-tight">
            <h1 className="text-xl font-bold text-white tracking-tight">
              ZipMart
            </h1>
            <p className="text-xs font-medium uppercase tracking-wider text-indigo-300">
              Admin Panel
            </p>
          </div>
        </div>

        <div className="relative">
          <h2 className="max-w-md text-3xl font-bold leading-tight text-white tracking-tight">
            Run your entire grocery marketplace from one place.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-indigo-200">
            Manage shops, delivery partners, orders, products, banners, coupons
            and customer support — all in a single dashboard.
          </p>
        </div>

        <p className="relative text-xs text-indigo-300">
          © {new Date().getFullYear()} ZipMart. All rights reserved.
        </p>
      </div>

      {/* Login form */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          {/* Mobile brand mark */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img
              src={logo}
              alt="ZipMart"
              className="h-11 w-11 shrink-0 rounded-xl object-cover shadow-lg"
            />
            <div className="leading-tight">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                ZipMart
              </h1>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Admin Panel
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Admin Login
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to access the ZipMart admin dashboard.
            </p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base"
                  placeholder="admin@zipmart.com"
                  required
                />
              </div>
              <div ref={passwordRef}>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-base pr-10"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
              >
                Sign in
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} ZipMart. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
