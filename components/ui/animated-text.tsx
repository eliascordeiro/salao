"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface AnimatedTextProps {
  children: React.ReactNode;
  className?: string;
  gradient?: "primary" | "accent" | "none";
  animation?: "gradient" | "fadeInUp" | "fadeIn" | "none";
  delay?: number;
}

export function AnimatedText({ 
  children, 
  className,
  gradient = "primary",
  animation = "fadeInUp",
  delay = 0
}: AnimatedTextProps) {
  const gradientClass = {
    primary: "gradient-text-primary",
    accent: "gradient-text-accent",
    none: ""
  }[gradient];

  const animationClass = {
    gradient: "animate-gradient",
    fadeInUp: "animate-fadeInUp",
    fadeIn: "animate-fadeIn",
    none: ""
  }[animation];

  return (
    <span
      className={cn(
        gradientClass,
        animationClass,
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </span>
  );
}
