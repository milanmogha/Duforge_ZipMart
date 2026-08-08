import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendLoginOtp } from "../api";
import { Wordmark } from "./Navbar";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SignIn: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const sendOTP = async () => {
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await sendLoginOtp(trimmed);
      navigate("/verify-otp", { state: { email: trimmed } });
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-white p-5">
      <Wordmark className="mb-2 text-4xl" />
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Sign In</h1>
      <p className="mb-6 text-sm text-gray-500">
        Enter your email address to continue
      </p>

      <div className="card w-full max-w-sm">
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) sendOTP();
            }}
            placeholder="you@example.com"
            disabled={loading}
            className="w-full bg-transparent px-4 py-2.5 text-base text-gray-800 placeholder-gray-400 outline-none"
          />
        </div>

        {error && (
          <p className="mb-4 text-center text-sm text-red-500">{error}</p>
        )}

        <button onClick={sendOTP} disabled={loading} className="btn-primary w-full">
          {loading ? "Sending OTP…" : "Send OTP"}
        </button>
      </div>
    </div>
  );
};

export default SignIn;
