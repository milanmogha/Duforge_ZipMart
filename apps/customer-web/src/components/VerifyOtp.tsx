// src/components/VerifyOtp.tsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sendLoginOtp } from "../api";
import { FiMail } from "react-icons/fi";

const VerifyOtp: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithOtp } = useAuth();

  const location = useLocation();
  const { email = "" } = (location.state as { email?: string }) ?? {};

  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [counter, setCounter] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) {
      navigate("/signin", { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (counter > 0) {
      const timer = setTimeout(() => setCounter((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [counter]);

  const handleChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    if (val && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(6).fill("");
    pasted.split("").forEach((d, i) => (next[i] = d));
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
  };

  const verifyOtp = async () => {
    setError(null);
    const otp = digits.join("");
    if (otp.length < 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    setLoading(true);
    try {
      await loginWithOtp(email, otp);
      navigate("/landing", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Verification failed.");
      setDigits(Array(6).fill(""));
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError(null);
    setLoading(true);
    try {
      await sendLoginOtp(email);
      setDigits(Array(6).fill(""));
      setCounter(30);
      inputsRef.current[0]?.focus();
    } catch (err: any) {
      setError(err?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-white p-5">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
        <FiMail size={30} />
      </span>

      <h1 className="mb-1 text-2xl font-bold text-gray-900">OTP Verification</h1>
      <p className="mb-6 text-center text-sm text-gray-500">
        Enter the 6‑digit code sent to{" "}
        <span className="font-semibold text-gray-800">{email}</span>
      </p>

      <div className="card w-full max-w-sm">
        <div className="mb-4 flex justify-center gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(e.target.value, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onPaste={handlePaste}
              disabled={loading}
              className="h-12 w-12 rounded-xl border border-gray-200 bg-gray-50 text-center text-xl font-bold text-gray-900 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          ))}
        </div>

        <div className="mb-4 flex justify-end">
          {counter > 0 ? (
            <span className="text-sm text-gray-500">
              Resend OTP in {String(counter).padStart(2, "0")}s
            </span>
          ) : (
            <button
              onClick={resendOtp}
              disabled={loading}
              className="text-sm font-semibold text-brand-600 hover:underline"
            >
              Resend OTP
            </button>
          )}
        </div>

        {error && (
          <p className="mb-4 text-center text-sm text-red-500">{error}</p>
        )}

        <button
          onClick={verifyOtp}
          disabled={loading || digits.some((d) => !d)}
          className="btn-primary mb-3 w-full"
        >
          {loading ? "Verifying…" : "Verify OTP"}
        </button>

        <button
          onClick={() => navigate("/signin", { replace: true })}
          disabled={loading}
          className="btn-outline w-full"
        >
          Change email address
        </button>
      </div>
    </div>
  );
};

export default VerifyOtp;
