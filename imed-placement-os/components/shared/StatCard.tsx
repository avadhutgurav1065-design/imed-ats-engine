"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: "cyan" | "emerald" | "rose" | "amber";
  className?: string;
}

export function StatCard({
  label,
  value,
  suffix = "",
  prefix = "",
  icon,
  trend,
  color = "cyan",
  className,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const duration = 1200;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  const colorMap = {
    cyan: {
      border: "border-cyan-500/20",
      iconBg: "bg-cyan-500/10",
      iconText: "text-cyan-400",
      value: "text-cyan-400",
    },
    emerald: {
      border: "border-emerald-500/20",
      iconBg: "bg-emerald-500/10",
      iconText: "text-emerald-400",
      value: "text-emerald-400",
    },
    rose: {
      border: "border-rose-500/20",
      iconBg: "bg-rose-500/10",
      iconText: "text-rose-400",
      value: "text-rose-400",
    },
    amber: {
      border: "border-amber-500/20",
      iconBg: "bg-amber-500/10",
      iconText: "text-amber-400",
      value: "text-amber-400",
    },
  };

  const c = colorMap[color];

  return (
    <div
      ref={ref}
      className={cn(
        "glass-card p-5 animate-slide-in-up",
        c.border,
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2.5 rounded-xl", c.iconBg)}>
          <span className={c.iconText}>{icon}</span>
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-semibold px-2 py-1 rounded-full",
              trend.value >= 0
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-rose-400 bg-rose-500/10"
            )}
          >
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%{" "}
            {trend.label}
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={cn("text-3xl font-extrabold", c.value)}>
        {prefix}
        {displayValue}
        {suffix}
      </p>
    </div>
  );
}
