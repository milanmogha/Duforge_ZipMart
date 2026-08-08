import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaStore, FaEnvelope, FaLock } from "react-icons/fa";
import api from "../api";
import logo from "../assets/zipmart-logo.svg";

interface LoginProps {
  setToken: (token: string | null) => void;
  connectSocket: (shopkeeperId: string) => void;
}

const Login: React.FC<LoginProps> = ({ setToken, connectSocket }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const passwordRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (passwordRef.current && !passwordRef.current.contains(event.target as Node)) {
        setShowPassword(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/shop/login", { email, password });
      const { token, shop } = response.data;

      localStorage.setItem("shopkeeperToken", token);
      localStorage.setItem("shopkeeperId", shop.id);

      setToken(token);
      connectSocket(shop.id);
      navigate("/shopkeeper/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error logging in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-brand-50 via-surface to-brand-100 p-5">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-card sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/30">
              <img src={logo} alt="ZipMart" className="h-16 w-16 rounded-2xl" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to your shopkeeper account
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <div className="relative">
                <FaEnvelope className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="input pl-10"
                />
              </div>
            </div>

            <div className="relative" ref={passwordRef}>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <FaLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="input pl-10 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm">
            <p className="text-slate-600">
              Don't have an account?{" "}
              <button
                className="font-semibold text-brand-600 hover:text-brand-700"
                onClick={() => navigate("/shopkeeper/signup")}
              >
                Create one
              </button>
            </p>
            <button
              className="font-semibold text-brand-600 hover:text-brand-700"
              onClick={() => navigate("/shopkeeper/forgot-password")}
            >
              Forgot password?
            </button>
          </div>
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
          <FaStore className="text-brand-400" />
          Bellybasket Shopkeeper Portal
        </p>
      </div>
    </div>
  );
};

export default Login;
