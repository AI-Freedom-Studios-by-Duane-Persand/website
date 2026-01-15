import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  size?: "sm" | "md";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  className = "",
}) => {
  const variantStyles = {
    default: "bg-white/10 border-white/10 text-slate-200",
    primary: "bg-blue-500/10 border-blue-500/20 text-blue-200",
    success: "bg-green-500/10 border-green-500/20 text-green-200",
    warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-200",
    danger: "bg-red-500/10 border-red-500/20 text-red-200",
  };

  const sizeStyles = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-3 py-1",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
