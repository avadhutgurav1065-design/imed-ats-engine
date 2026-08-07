"use client";

import React, { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface DragDropZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  isUploading?: boolean;
  uploadSuccess?: boolean;
  fileName?: string;
  className?: string;
}

export function DragDropZone({
  onFileSelect,
  accept = ".pdf",
  isUploading = false,
  uploadSuccess = false,
  fileName,
  className,
}: DragDropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type === "application/pdf") {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFileSelect(e.target.files[0]);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        "relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer min-h-[180px] flex flex-col items-center justify-center gap-3 transition-all duration-300",
        isDragActive && "drag-active",
        uploadSuccess
          ? "border-emerald-500/50 bg-emerald-500/5"
          : "border-slate-700/60 hover:border-cyan-500/40 hover:bg-cyan-500/[0.03]",
        className
      )}
    >
      <input
        type="file"
        accept={accept}
        ref={fileInputRef}
        onChange={handleFileInput}
        className="hidden"
      />

      {isUploading ? (
        <>
          <div className="w-12 h-12 rounded-full border-3 border-cyan-500/20 border-t-cyan-400 animate-spin" />
          <span className="text-cyan-300 animate-pulse font-medium text-sm">
            Uploading to secure cloud...
          </span>
        </>
      ) : uploadSuccess ? (
        <>
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-emerald-400 font-bold text-sm">
            ✓ {fileName} Uploaded Successfully
          </span>
          <span className="text-slate-500 text-xs">Click or drag to replace</span>
        </>
      ) : (
        <>
          <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-1">
            <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <span className="text-slate-300 font-medium text-sm block">
              Drag & drop your resume here
            </span>
            <span className="text-slate-500 text-xs">
              or click to browse (PDF only, max 10MB)
            </span>
          </div>
          {isDragActive && (
            <div className="absolute inset-0 rounded-2xl bg-cyan-500/10 backdrop-blur-sm flex items-center justify-center">
              <span className="text-cyan-400 font-bold text-lg">Drop Resume Here</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
