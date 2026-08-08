import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaLock, FaStore, FaArrowLeft } from "react-icons/fa";
import api from "../api";
import logo from "../assets/zipmart-logo.svg";

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve email from location.state or sessionStorage
  const email = location.state?.email || sessionStorage.getItem("resetEmail");

  useEffect(() => {
    if (!email) {
      // If no email is found, redirect back to forgot-password
      navigate("/shopkeeper/forgot-password");
    } else {
      // Store email in sessionStorage if available
      sessionStorage.setItem("resetEmail", email);
    }
  }, [email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      setError("Email is missing. Please try the reset process again.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      console.log("Submitting reset password for email:", email);
      await api.post("/shop/reset-password", { email, newPassword, confirmPassword });
      setMessage("Password reset successfully. Redirecting to login...");
      setTimeout(() => {
        sessionStorage.removeItem("resetEmail"); // Clear email after reset
        navigate("/shopkeeper/login");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error resetting password.");
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
              Reset password
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose a new password for your account
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <FaLock className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                required
                className="input pl-10"
              />
            </div>
            <div className="relative">
              <FaLock className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="input pl-10"
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full py-3"
            >
              Reset password
            </button>
          </form>

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

export default ResetPassword;
