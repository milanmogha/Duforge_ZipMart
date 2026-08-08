import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash, FaTruck } from "react-icons/fa";
import AuthLayout from "../components/AuthLayout";
import Field from "../components/ui/Field";
import Input from "../components/ui/Input";
import { login } from "../api";

interface LoginProps {
  setToken: (token: string | null) => void;
  setDeliveryBoyId: (id: string | null) => void;
}

const Login: React.FC<LoginProps> = ({ setToken, setDeliveryBoyId }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await login(email.trim(), password);
      localStorage.setItem("deliveryToken", data.token);
      localStorage.setItem("deliveryBoyId", data.deliveryBoy.id);
      setToken(data.token);
      setDeliveryBoyId(data.deliveryBoy.id);
      toast.success(`Welcome, ${data.deliveryBoy.name}!`);
      navigate("/orders", { replace: true });
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Delivery Partner Login"
      subtitle="Sign in to start accepting orders"
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Email" required>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="delivery@zipmart.com"
            autoComplete="email"
            required
          />
        </Field>

        <Field label="Password" required>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="pr-10"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </Field>

        <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
          <FaTruck size={16} />
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-gray-400">
        New delivery partner? Contact the ZipMart admin to activate your account.
      </p>
    </AuthLayout>
  );
};

export default Login;
