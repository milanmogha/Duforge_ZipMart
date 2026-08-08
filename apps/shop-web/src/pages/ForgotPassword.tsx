import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaStore, FaArrowLeft } from "react-icons/fa";
import api from "../api";
import logo from "../assets/zipmart-logo.svg";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await api.post("/shop/send-otp", { email });
      setShowOtpInput(true);
      setMessage("OTP sent successfully. Please check your email.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error sending OTP.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await api.post("/shop/verify-otp", { email, otp });
      setIsOtpVerified(true);
      setMessage("OTP verified successfully. Redirecting to reset password...");
      setTimeout(() => {
        navigate("/shopkeeper/reset-password", { state: { email } });
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired OTP.");
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
              Forgot password
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              We'll email you an OTP to verify your identity
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-center text-sm font-medium text-brand-700">
              {message}
            </div>
          )}

          {!showOtpInput ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
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
              <button type="submit" className="btn-primary w-full py-3">
                Send OTP
              </button>
            </form>
          ) : !isOtpVerified ? (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="label" htmlFor="otp">OTP</label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  placeholder="6-digit OTP"
                  className="input"
                />
              </div>
              <button type="submit" className="btn-primary w-full py-3">
                Verify OTP
              </button>
            </form>
          ) : (
            <p className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-center text-sm font-medium text-brand-700">
              OTP verified! Redirecting...
            </p>
          )}

          <div className="mt-6 text-center">
            <button
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
              onClick={() => navigate("/shopkeeper/login")}
            >
              <FaArrowLeft />
              Back to login
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

export default ForgotPassword;
