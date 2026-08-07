"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileType, CheckCircle2, AlertCircle, ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/shared/GlassCard";

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setStatus(null);

    try {
      const text = await file.text();
      // Extremely basic CSV parser (assumes first row is headers)
      const rows = text.split('\n').map(row => row.trim()).filter(row => row);
      if (rows.length < 2) throw new Error("CSV appears to be empty or has no data rows.");
      
      const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
      
      const alumniData = rows.slice(1).map(row => {
        // Simple split by comma (doesn't handle quotes properly, but sufficient for MVP)
        const values = row.split(',').map(v => v.trim());
        const record: any = {};
        headers.forEach((h, i) => {
          record[h] = values[i] || "";
        });
        return record;
      });

      const res = await fetch("/api/admin/alumni/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alumniData })
      });

      const json = await res.json();
      
      if (res.ok) {
        setStatus({ type: 'success', message: json.message || `Successfully uploaded ${json.count} records.` });
        setFile(null);
      } else {
        throw new Error(json.error || "Upload failed.");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setStatus({ type: 'error', message: err.message || "Failed to process the CSV file." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in zoom-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/admin/alumni-tracking" className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center hover:bg-slate-700 transition-colors border border-slate-700/50">
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Bulk Upload Alumni</h1>
          <p className="text-sm text-slate-400 mt-1">
            Import thousands of alumni records instantly via CSV.
          </p>
        </div>
      </div>

      {status && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
          <div>
            <h4 className="font-bold">{status.type === 'success' ? 'Upload Successful' : 'Upload Failed'}</h4>
            <p className="text-sm opacity-90">{status.message}</p>
          </div>
        </div>
      )}

      <GlassCard className="p-8">
        <div className="mb-8">
          <h3 className="text-white font-bold text-lg mb-2">CSV Requirements</h3>
          <p className="text-slate-400 text-sm mb-4">Your CSV file must include a header row with the exact column names below. It must be comma-separated.</p>
          <div className="flex flex-wrap gap-2">
            {['email (required)', 'full_name', 'graduation_year', 'branch', 'linkedin_url', 'current_company', 'role_title'].map(col => (
              <span key={col} className="px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400">
                {col}
              </span>
            ))}
          </div>
        </div>

        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all ${file ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-700 bg-slate-900/50 hover:bg-slate-800/50 hover:border-slate-600'}`}
        >
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
          />
          
          {file ? (
            <>
              <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
                <FileType className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-white font-bold text-lg">{file.name}</h3>
              <p className="text-slate-400 text-sm mt-1">{(file.size / 1024).toFixed(2)} KB</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <UploadCloud className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-white font-bold text-lg">Click to Upload CSV</h3>
              <p className="text-slate-400 text-sm mt-1">Drag and drop is not supported yet. Please click to select.</p>
            </>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
            {isUploading ? "Uploading Data..." : "Process Upload"}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
