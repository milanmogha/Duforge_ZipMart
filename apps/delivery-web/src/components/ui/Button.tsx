import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "danger" | "success";
  size?: "sm" | "md";
}

const variantClasses = {
  primary: "btn-primary",
  outline: "btn-outline",
  danger: "btn-danger",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-100",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-xl",
};

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  children,
  ...rest
}) => {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 font-semibold shadow-sm transition-colors focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
