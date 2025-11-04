import { cn } from "@/lib/utils";
import React from "react";

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "success";
  children: React.ReactNode;
}

export function GradientButton({ 
  children, 
  className, 
  variant = "primary",
  ...props 
}: GradientButtonProps) {
  const variantClass = {
    primary: "btn-gradient-primary glow-primary",
    accent: "btn-gradient-accent glow-accent",
    success: "bg-gradient-success glow-success rounded-xl px-8 py-4 font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl"
  }[variant];

  return (
    <button
      className={cn(
        variantClass,
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
