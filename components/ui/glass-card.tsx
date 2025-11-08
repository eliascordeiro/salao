import { cn } from "@/lib/utils";
import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  glow?: "primary" | "accent" | "success" | "none";
}

export function GlassCard({ 
  children, 
  className, 
  hover = false, 
  glow = "none",
  ...props 
}: GlassCardProps) {
  const glowClass = {
    primary: "glow-primary",
    accent: "glow-accent",
    success: "glow-success",
    none: ""
  }[glow];

  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-6",
        hover && "glass-card-hover",
        glowClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
