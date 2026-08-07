"use client";

import React, { useState } from "react";
import { Download, FileText, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

export default function AccreditationReportsPage() {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const handleDownload = async (type: "NAAC" | "NBA") => {
    setIsGenerating(type);

    // Map button type to API param
    const apiType = type === "NAAC" ? "naac-report" : "naac-report";
    const filename = type === "NAAC"
      ? `IMED_NAAC_Placement_Report_${new Date().getFullYear()}.csv`
      : `IMED_NBA_Placement_Index_${new Date().getFullYear()}.csv`;

    try {
      const res = await fetch(`/api/admin/export?type=${apiType}&format=csv`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Failed to generate report: ${data.error || res.statusText}`);
      }
    } catch (err) {
      console.error("Download Error", err);
      alert("Error generating report. Make sure data exists in the database.");
    } finally {
      setIsGenerating(null);
    }
  };


  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Automated Accreditation Reports</h1>
          <p className="text-sm text-slate-400 mt-1">
            One-click data export perfectly formatted for NAAC and NBA compliance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-6 border border-indigo-500/30">
            <FileText className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">NAAC Criterion 5 (Student Support)</h2>
          <p className="text-sm text-slate-400 mb-6 min-h-[60px]">
            Aggregates total number of placement offers, average salary packages, and employer details into the exact NAAC required schema.
          </p>
          
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Includes verified offer letters
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Company categorization (Tier 1/2/3)
            </div>
          </div>

          <button 
            onClick={() => handleDownload("NAAC")}
            disabled={isGenerating !== null}
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating === "NAAC" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isGenerating === "NAAC" ? "Generating CSV..." : "Download NAAC Report (CSV)"}
          </button>
        </div>

        <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-500/30">
            <FileText className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">NBA Placement Index</h2>
          <p className="text-sm text-slate-400 mb-6 min-h-[60px]">
            Generates the placement ratio formula metrics: Number of students placed vs total eligible students.
          </p>
          
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Excludes higher education students
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Formatted for NBA uploading
            </div>
          </div>

          <button 
            onClick={() => handleDownload("NBA")}
            disabled={isGenerating !== null}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
          >
            {isGenerating === "NBA" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isGenerating === "NBA" ? "Generating CSV..." : "Download NBA Report (CSV)"}
          </button>
        </div>
      </div>
    </div>
  );
}
