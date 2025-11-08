import { cn } from "@/lib/utils";
import React from "react";

interface GridBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export function GridBackground({ children, className }: GridBackgroundProps) {
  return (
    <div className={cn("grid-background relative", className)}>
      {/* Content - removed gradient overlay that was causing visual artifacts */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
