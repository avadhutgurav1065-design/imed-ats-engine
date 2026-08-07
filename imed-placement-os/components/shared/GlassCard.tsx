"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  glow?: "cyan" | "emerald" | "rose" | "none";
  padding?: "sm" | "md" | "lg";
}

export function GlassCard({
  children,
  className,
  hover = true,
  glow = "none",
  padding = "md",
  ...props
}: GlassCardProps) {
  const glowClasses = {
    cyan: "glow-cyan",
    emerald: "glow-emerald",
    rose: "glow-rose",
    none: "",
  };

  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={cn(
        "glass-card",
        paddingClasses[padding],
        hover && "glass-hover",
        glowClasses[glow],
        "animate-slide-in-up",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
