"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ReadinessGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

export function ReadinessGauge({
  score,
  size = "md",
  label = "Readiness",
  className,
}: ReadinessGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));

  const sizeMap = {
    sm: { dim: 80, stroke: 6, fontSize: "text-lg", labelSize: "text-[9px]" },
    md: { dim: 120, stroke: 8, fontSize: "text-2xl", labelSize: "text-xs" },
    lg: { dim: 160, stroke: 10, fontSize: "text-3xl", labelSize: "text-sm" },
  };

  const { dim, stroke, fontSize, labelSize } = sizeMap[size];
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedScore / 100) * circumference;

  const getColor = () => {
    if (clampedScore >= 75) return { stroke: "#10b981", glow: "rgba(16,185,129,0.3)" };
    if (clampedScore >= 50) return { stroke: "#f59e0b", glow: "rgba(245,158,11,0.3)" };
    return { stroke: "#f43f5e", glow: "rgba(244,63,94,0.3)" };
  };

  const color = getColor();

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg
          width={dim}
          height={dim}
          className="transform -rotate-90"
          style={{ filter: `drop-shadow(0 0 8px ${color.glow})` }}
        >
          {/* Background ring */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />
          {/* Progress ring */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="transparent"
            stroke={color.stroke}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-extrabold", fontSize)} style={{ color: color.stroke }}>
            {clampedScore}%
          </span>
        </div>
      </div>
      <span className={cn("text-slate-400 font-medium mt-2", labelSize)}>
        {label}
      </span>
    </div>
  );
}
