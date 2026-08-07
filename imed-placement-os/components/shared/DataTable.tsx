"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  emptyMessage = "No data available",
  isLoading = false,
  onRowClick,
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="glass-card overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin mx-auto mb-3" />
          <span className="text-slate-400 text-sm">Loading data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("glass-card overflow-hidden", className)}>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-8 text-center text-slate-500 text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "transition-colors",
                    onRowClick
                      ? "hover:bg-cyan-500/[0.04] cursor-pointer"
                      : "hover:bg-white/[0.02]"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-5 py-4 text-slate-300", col.className)}
                    >
                      {col.render ? col.render(row, i) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
