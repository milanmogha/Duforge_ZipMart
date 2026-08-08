import React, { useState, useRef, useEffect } from "react";
import api from "../api";
import { io } from "socket.io-client";
import { FaEye, FaEyeSlash, FaTruck } from "react-icons/fa";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Field from "../components/ui/Field";
import Input from "../components/ui/Input";
import { SOCKET_URL } from "@zipmart/shared";

const MAX_FILE_SIZE = 60 * 1024; // 60 KB

const CreateDeliveryBoy: React.FC = () => {
  const [deliveryBoyData, setDeliveryBoyData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
  });
  const [aadhar, setAadhar] = useState<File | null>(null);
  const [drivingLicence, setDrivingLicence] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordFieldRef = useRef<HTMLDivElement>(null);
  const confirmPasswordFieldRef = useRef<HTMLDivElement>(null);

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
    if (deliveryBoyData.password !== deliveryBoyData.confirmPassword) {
      setError("Passwords do not match!");
      return false;
    }
    if (!aadhar || !drivingLicence) {
      setError("Both Aadhar and Driving Licence images are required");
      return false;
    }
    if (aadhar.size > MAX_FILE_SIZE) {
      setError("Aadhar image must be 60 KB or smaller");
      return false;
    }
    if (drivingLicence.size > MAX_FILE_SIZE) {
      setError("Driving Licence image must be 60 KB or smaller");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    // --- FIXED: correctly instantiate FormData ---
    const formData = new FormData();
    Object.entries(deliveryBoyData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // --- FIXED: use if-statements instead of && expressions ---
    if (aadhar) {
      formData.append("aadhar", aadhar);
    }
    if (drivingLicence) {
      formData.append("drivingLicence", drivingLicence);
    }

    try {
      const response = await api.post("/deliveryboy/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const socket = io(SOCKET_URL); // adjust URL as needed
      socket.emit("deliveryBoyCreated", response.data.deliveryBoy);
      setSuccess("Delivery boy created successfully!");
      setDeliveryBoyData({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        address: "",
      });
      setAadhar(null);
      setDrivingLicence(null);
    } catch (err: any) {
      console.error("Error creating delivery boy:", err);
      setError(err.response?.data?.message || "Failed to create delivery boy.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const textFields = [
    { id: "name", label: "Name", type: "text", value: deliveryBoyData.name },
    { id: "email", label: "Email", type: "email", value: deliveryBoyData.email },
    { id: "phone", label: "Phone", type: "text", value: deliveryBoyData.phone },
    { id: "address", label: "Address", type: "text", value: deliveryBoyData.address },
  ];

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Create Delivery Boy"
        subtitle="Add a new delivery partner to the ZipMart platform"
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
                  setDeliveryBoyData({ ...deliveryBoyData, [id]: e.target.value })
                }
                required
              />
            </Field>
          ))}

          <Field label="Password" required>
            <div ref={passwordFieldRef} className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={deliveryBoyData.password}
                onChange={(e) =>
                  setDeliveryBoyData({ ...deliveryBoyData, password: e.target.value })
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
                value={deliveryBoyData.confirmPassword}
                onChange={(e) =>
                  setDeliveryBoyData({
                    ...deliveryBoyData,
                    confirmPassword: e.target.value,
                  })
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

          <Field label="Aadhar" hint="Max 60 KB" required>
            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) => setAadhar(e.target.files?.[0] ?? null)}
              className="input-base file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-indigo-600 hover:file:bg-indigo-100"
            />
          </Field>

          <Field label="Driving Licence" hint="Max 60 KB" required>
            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) => setDrivingLicence(e.target.files?.[0] ?? null)}
              className="input-base file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-indigo-600 hover:file:bg-indigo-100"
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
              <FaTruck size={14} />
              {isSubmitting ? "Creating Delivery Boy..." : "Create Delivery Boy"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateDeliveryBoy;
