"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ExportButtonProps {
  data: Record<string, any>[];
  filename: string;
  headers?: string[];
  label?: string;
  className?: string;
}

export function ExportButton({
  data,
  filename,
  headers,
  label = "Export CSV",
  className,
}: ExportButtonProps) {
  const handleExport = () => {
    if (data.length === 0) return;

    const keys = headers || Object.keys(data[0]);
    const csvRows = [
      keys.join(","),
      ...data.map((row) =>
        keys
          .map((key) => {
            const val = row[key];
            const str = val === null || val === undefined ? "" : String(val);
            // Escape commas and quotes
            return str.includes(",") || str.includes('"')
              ? `"${str.replace(/"/g, '""')}"`
              : str;
          })
          .join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={data.length === 0}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
        "bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white border border-slate-700/50",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        className
      )}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {label}
    </button>
  );
}
