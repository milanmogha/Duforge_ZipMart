import React from "react";
import logo from "../assets/favicon.svg";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children }) => {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 p-12 lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <img
            src={logo}
            alt="ZipMart"
            className="h-11 w-11 shrink-0 rounded-xl object-cover shadow-lg"
          />
          <div className="leading-tight">
            <h1 className="text-xl font-bold text-white tracking-tight">ZipMart</h1>
            <p className="text-xs font-medium uppercase tracking-wider text-brand-200">
              Delivery Partner
            </p>
          </div>
        </div>

        <div className="relative">
          <h2 className="max-w-md text-3xl font-bold leading-tight text-white tracking-tight">
            Deliver orders faster. Earn on every drop.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-100">
            Accept nearby orders, track your route, and keep customers updated — all
            from one dashboard.
          </p>
        </div>

        <p className="relative text-xs text-brand-200">
          © {new Date().getFullYear()} ZipMart. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md">
          {/* Mobile brand mark */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img
              src={logo}
              alt="ZipMart"
              className="h-11 w-11 shrink-0 rounded-xl object-cover shadow-lg"
            />
            <div className="leading-tight">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">ZipMart</h1>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Delivery Partner
              </p>
            </div>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} ZipMart. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
