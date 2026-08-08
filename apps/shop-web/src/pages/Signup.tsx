import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaStore } from "react-icons/fa";
import api from "../api";

// Assets
import logo from "../assets/zipmart-logo.svg";

interface SignupFormData {
  ownerName: string;
  shopName: string;
  email: string;
  phone: string;
  location: string;
  latitude: string;
  longitude: string;
  aadharNumber: string;
  gstNumber: string;
  password: string;
  confirmPassword: string;
}

const initialSignupFormData: SignupFormData = {
  ownerName: "",
  shopName: "",
  email: "",
  phone: "",
  location: "",
  latitude: "",
  longitude: "",
  aadharNumber: "",
  gstNumber: "",
  password: "",
  confirmPassword: "",
};

const Signup: React.FC = () => {
  const navigate = useNavigate();

  // Helper functions for managing local storage with expiration
  const saveToLocalStorage = (key: string, value: any, ttl: number) => {
    const data = { value, expiry: Date.now() + ttl };
    localStorage.setItem(key, JSON.stringify(data));
  };

  const getFromLocalStorage = (key: string) => {
    const data = localStorage.getItem(key);
    if (!data) return null;
    const { value, expiry } = JSON.parse(data);
    if (Date.now() > expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return value;
  };

  // State
  const [formData, setFormData] = useState<SignupFormData>(() => {
    const savedData = localStorage.getItem("signupFormData");
    return savedData
      ? (JSON.parse(savedData) as SignupFormData)
      : initialSignupFormData;
  });

  const [aadharCard, setAadharCard] = useState<File | null>(null);
  const [gstProof, setGstProof] = useState<File | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState<boolean>(false);

  const [otp, setOtp] = useState(""); // OTP input
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Refs for password fields (kept for toggling password visibility)
  const passwordFieldRef = useRef<HTMLDivElement>(null);
  const confirmPasswordFieldRef = useRef<HTMLDivElement>(null);

  // Keep passwordMismatch in sync
  useEffect(() => {
    setPasswordMismatch(formData.password !== formData.confirmPassword);
  }, [formData.password, formData.confirmPassword]);

  // Save form data to local storage (5-minute TTL)
  useEffect(() => {
    saveToLocalStorage("signupFormData", formData, 5 * 60 * 1000);
  }, [formData]);

  // Load saved form data on mount (if available)
  useEffect(() => {
    const storedFormData = getFromLocalStorage("signupFormData");
    if (storedFormData) setFormData(storedFormData);
  }, []);

  // Fetch the user's location (for latitude and longitude)
  const fetchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
          setError("");
        },
        () => {
          setError("Location is required. Please enable location access.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  useEffect(() => {
    if (!formData.latitude || !formData.longitude) {
      fetchLocation();
    }
  }, [formData.latitude, formData.longitude]);

  // Input change handler
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // File input change handler
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  // OTP functions
  const sendOtp = async () => {
    try {
      setError("");
      await api.post("/shop/send-otp", { email: formData.email });
      setOtpSent(true);
      alert("OTP sent to your email! Please check your inbox.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error sending OTP.");
    }
  };

  const verifyOtp = async () => {
    try {
      setError("");
      const response = await api.post("/shop/verify-otp", {
        email: formData.email,
        otp,
      });
      if (response.data.verified) {
        setEmailVerified(true);
        alert("Email verified successfully!");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid OTP.");
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.latitude || !formData.longitude) {
      setError("Location is required. Please enable location access.");
      return;
    }
    if (!emailVerified) {
      setError("Please verify your email before signing up.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    if (!aadharCard || !gstProof) {
      setError("Aadhar Card and GST Proof are required!");
      return;
    }

    setLoading(true);
    try {
      const submissionData = new FormData();
      Object.entries(formData).forEach(([key, value]) =>
        submissionData.append(key, value)
      );
      submissionData.append("aadharCard", aadharCard);
      submissionData.append("gstProof", gstProof);

      await api.post("/shop/signup", submissionData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Account created successfully and submitted for admin approval!");
      localStorage.removeItem("signupFormData");
      navigate("/shopkeeper/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error creating account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-brand-50 via-surface to-brand-100 p-5">
      <div className="w-full max-w-4xl">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8 md:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/30">
              <img src={logo} alt="ZipMart" className="h-16 w-16 rounded-2xl" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Create shopkeeper account
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Set up your shop to start selling on Bellybasket
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {[
              { name: "ownerName", label: "Owner's Name", type: "text", placeholder: "Full name" },
              { name: "shopName", label: "Shop Name", type: "text", placeholder: "Your shop name" },
              { name: "email", label: "Email", type: "email", placeholder: "you@example.com" },
              { name: "phone", label: "Phone (10 digits)", type: "text", placeholder: "10-digit mobile" },
              {
                name: "location",
                label: "Location (e.g., Shop Address)",
                type: "text",
                placeholder: "Shop address",
              },
              {
                name: "aadharNumber",
                label: "Aadhar Number (12 digits)",
                type: "text",
                placeholder: "12-digit Aadhar",
              },
              {
                name: "gstNumber",
                label: "GST Number (15 characters)",
                type: "text",
                placeholder: "GSTIN",
              },
            ].map(({ name, label, type, placeholder }) => (
              <div key={name}>
                <label className="label">{label}</label>
                <input
                  name={name}
                  type={type}
                  value={formData[name as keyof SignupFormData]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className="input"
                  required
                />
              </div>
            ))}

            {/* Aadhar Card Upload */}
            <div className="md:col-span-2">
              <label className="label">Aadhar Card</label>
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setAadharCard)}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-200"
                  required
                />
              </div>
            </div>

            {/* GST Proof Upload */}
            <div className="md:col-span-2">
              <label className="label">GST Proof</label>
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setGstProof)}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-200"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div ref={passwordFieldRef}>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className="input pr-10"
                  required
                />
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div ref={confirmPasswordFieldRef}>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className={`input pr-10 ${
                    passwordMismatch
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                      : ""
                  }`}
                  required
                />
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:text-slate-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
            </div>

            {/* OTP + Buttons */}
            {!otpSent ? (
              <div className="md:col-span-2">
                <button type="button" onClick={sendOtp} className="btn-secondary w-full">
                  Send OTP
                </button>
              </div>
            ) : !emailVerified ? (
              <>
                <div>
                  <label className="label">Enter OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit OTP"
                    className="input"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={verifyOtp} className="btn-secondary w-full">
                    Verify OTP
                  </button>
                </div>
              </>
            ) : (
              <div className="md:col-span-2">
                <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-center text-sm font-medium text-brand-700">
                  Email verified successfully
                </div>
              </div>
            )}

            {/* Sign Up Button */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={!emailVerified || loading}
                className="btn-primary w-full py-3"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm">
            <span className="text-slate-600">Already have an account? </span>
            <button
              className="font-semibold text-brand-600 hover:text-brand-700"
              onClick={() => navigate("/shopkeeper/login")}
            >
              Sign in
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

export default Signup;
