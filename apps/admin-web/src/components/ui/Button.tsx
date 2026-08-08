import React from "react";

type ButtonVariant = "primary" | "success" | "danger" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500/30",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500/30",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/30",
  secondary:
    "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-400/30",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-400/30",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
};

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...rest
}) => {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold shadow-sm transition-colors focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    />
  );
};

export default Button;
