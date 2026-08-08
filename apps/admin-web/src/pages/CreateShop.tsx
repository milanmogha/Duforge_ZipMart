import React, { useState, useRef, useEffect } from "react";
import api from "../api";
import { io } from "socket.io-client";
import { FaEye, FaEyeSlash, FaStore } from "react-icons/fa";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Field from "../components/ui/Field";
import Input from "../components/ui/Input";
import { SOCKET_URL } from "@zipmart/shared";

interface ShopData {
  ownerName: string;
  shopName: string;
  email: string;
  phone: string;
  location: string;
  password: string;
  confirmPassword: string;
  aadharNumber: string;
  gstNumber: string;
}

const CreateShop: React.FC = () => {
  const initialShopData: ShopData = {
    ownerName: "",
    shopName: "",
    email: "",
    phone: "",
    location: "",
    password: "",
    confirmPassword: "",
    aadharNumber: "",
    gstNumber: "",
  };

  const [shopData, setShopData] = useState<ShopData>(initialShopData);
  const [aadharCard, setAadharCard] = useState<File | null>(null);
  const [gstProof, setGstProof] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordFieldRef = useRef<HTMLDivElement>(null);
  const confirmPasswordFieldRef = useRef<HTMLDivElement>(null);
  // Fetch Admin's Live Location (Latitude & Longitude)
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setShopData((prev) => ({
            ...prev,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
          }));
        },
        (error) => {
          console.error("Error fetching location:", error);
          setError(
            "Failed to fetch location. Please enable location services."
          );
        }
      );
    } else {
      setError("Geolocation is not supported in this browser.");
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        passwordFieldRef.current &&
        !passwordFieldRef.current.contains(event.target as Node)
      ) {
        setShowPassword(false);
      }
      if (
        confirmPasswordFieldRef.current &&
        !confirmPasswordFieldRef.current.contains(event.target as Node)
      ) {
        setShowConfirmPassword(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const validateForm = (): boolean => {
    if (shopData.password !== shopData.confirmPassword) {
      setError("Passwords do not match!");
      return false;
    }
    if (!aadharCard || !gstProof) {
      setError("Both Aadhar Card and GST Proof images are required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }
    const MAX_FILE_SIZE = 60 * 1024; // 60 KB
    if (aadharCard && aadharCard.size > MAX_FILE_SIZE) {
      setError("Aadhar Card image must be at most 60 KB");
      return;
    }
    if (gstProof && gstProof.size > MAX_FILE_SIZE) {
      setError("GST Proof image must be at most 60 KB");
      return;
    }
    setIsSubmitting(true);

    const formData = new FormData();
    Object.entries(shopData).forEach(([key, value]) => {
      if (key !== "confirmPassword") {
        formData.append(key, value);
      }
    });

    if (aadharCard) formData.append("aadharCard", aadharCard);
    if (gstProof) formData.append("gstProof", gstProof);

    try {
      const response = await api.post("/shop/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const socket = io(SOCKET_URL); // Ensure the correct backend server URL
      socket.emit("shopCreated", response.data.shop); // Notify backend about the new shop
      setSuccess(response.data.message || "Shop created successfully!");
      setShopData(initialShopData);
      setAadharCard(null);
      setGstProof(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create shop.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const textFields = [
    { id: "ownerName", label: "Owner's Name", type: "text", value: shopData.ownerName },
    { id: "shopName", label: "Shop Name", type: "text", value: shopData.shopName },
    { id: "email", label: "Email", type: "email", value: shopData.email },
    { id: "phone", label: "Phone (10 digits)", type: "text", value: shopData.phone },
    { id: "location", label: "Location", type: "text", value: shopData.location },
    { id: "aadharNumber", label: "Aadhar Number (12 digits)", type: "text", value: shopData.aadharNumber },
    { id: "gstNumber", label: "GST Number (15 characters)", type: "text", value: shopData.gstNumber },
  ];

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Create Shop"
        subtitle="Register a new shop on the ZipMart platform"
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {textFields.map(({ id, label, type, value }) => (
            <Field key={id} label={label} required>
              <Input
                id={id}
                type={type}
                value={value}
                onChange={(e) =>
                  setShopData({ ...shopData, [id]: e.target.value })
                }
                required
              />
            </Field>
          ))}

          <Field label="Password" required>
            <div ref={passwordFieldRef} className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={shopData.password}
                onChange={(e) =>
                  setShopData({ ...shopData, password: e.target.value })
                }
                className="pr-10"
                required
              />
              <div
                className="absolute inset-y-0 right-3 flex cursor-pointer items-center text-slate-400 hover:text-slate-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>
          </Field>

          <Field label="Confirm Password" required>
            <div ref={confirmPasswordFieldRef} className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={shopData.confirmPassword}
                onChange={(e) =>
                  setShopData({ ...shopData, confirmPassword: e.target.value })
                }
                className="pr-10"
                required
              />
              <div
                className="absolute inset-y-0 right-3 flex cursor-pointer items-center text-slate-400 hover:text-slate-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>
          </Field>

          <Field label="Aadhar Card" hint="Max 60 KB" required>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setAadharCard(e.target.files ? e.target.files[0] : null)
              }
              className="input-base file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-indigo-600 hover:file:bg-indigo-100"
              required
            />
          </Field>

          <Field label="GST Proof" hint="Max 60 KB" required>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setGstProof(e.target.files ? e.target.files[0] : null)
              }
              className="input-base file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-indigo-600 hover:file:bg-indigo-100"
              required
            />
          </Field>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-500/30 sm:w-auto ${
                isSubmitting
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-indigo-700"
              }`}
            >
              <FaStore size={14} />
              {isSubmitting ? "Creating Shop..." : "Create Shop"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateShop;
