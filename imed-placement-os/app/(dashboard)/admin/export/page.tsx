"use client";

import { GlassCard } from "@/components/shared/GlassCard";

export default function NAACExportPage() {
  const handleExport = (type: string) => {
    // Trigger file download via API
    window.location.href = `/api/admin/export?type=${type}`;
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold gradient-text mb-1">
          Institutional Compliance Reports
        </h1>
        <p className="text-slate-400 text-sm">
          Generate auto-formatted data exports for NAAC, NBA, and corporate HR dispatches.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="border-emerald-500/20 hover:border-emerald-500/40 transition-colors flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">NAAC / NBA Placement Report</h3>
            <p className="text-slate-400 text-sm mb-6">
              Comprehensive institutional overview including total scans, average scores, batch-wide skill deficits, and per-student trajectory. Format matches NAAC Criteria 5 (Student Support and Progression).
            </p>
          </div>
          <button
            onClick={() => handleExport("naac-report")}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl transition-all glow-emerald"
          >
            Generate NAAC Report (CSV)
          </button>
        </GlassCard>

        <GlassCard className="border-cyan-500/20 hover:border-cyan-500/40 transition-colors flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Pre-Vetted Corporate Roster</h3>
            <p className="text-slate-400 text-sm mb-6">
              A curated list of placement-ready students (Match Score ≥ 75%). Ready to be dispatched to corporate HR partners to demonstrate candidate quality before campus drives.
            </p>
          </div>
          <button
            onClick={() => handleExport("roster")}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all glow-cyan"
          >
            Export Qualified Roster (CSV)
          </button>
        </GlassCard>
      </div>
    </div>
  );
}
