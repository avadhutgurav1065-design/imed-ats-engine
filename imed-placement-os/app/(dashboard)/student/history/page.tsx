"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { GlassCard } from "@/components/shared/GlassCard";
import { DataTable } from "@/components/shared/DataTable";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ScanHistoryPage() {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      const { data } = await supabase
        .from("gap_analyses")
        .select("*")
        .order("created_at", { ascending: false });

      setScans(data || []);
      setLoading(false);
    }
    loadHistory();
  }, []);

  const columns = [
    {
      key: "student_name",
      header: "Student",
      render: (row: any) => (
        <span className="text-white font-medium">{row.student_name || "—"}</span>
      ),
    },
    {
      key: "job_role",
      header: "Target Role",
      render: (row: any) => (
        <span className="text-slate-300">{row.job_role || "General"}</span>
      ),
    },
    {
      key: "match_score",
      header: "Score",
      render: (row: any) => (
        <span
          className={`text-lg font-extrabold ${
            (row.match_score || 0) >= 75 ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {row.match_score || 0}%
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: any) => (
        <span
          className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
            (row.match_score || 0) >= 75
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          }`}
        >
          {(row.match_score || 0) >= 75 ? "Unlocked" : "Locked"}
        </span>
      ),
    },
    {
      key: "missing_skills",
      header: "Deficit Count",
      render: (row: any) => {
        try {
          const skills =
            typeof row.missing_skills === "string"
              ? JSON.parse(row.missing_skills)
              : row.missing_skills || [];
          return <span className="text-slate-400">{Array.isArray(skills) ? skills.length : 0} skills</span>;
        } catch {
          return <span className="text-slate-500">—</span>;
        }
      },
    },
    {
      key: "created_at",
      header: "Date",
      render: (row: any) => (
        <span className="text-slate-500 text-xs">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
        </span>
      ),
    },
  ];

  // Calculate stats
  const avgScore =
    scans.length > 0
      ? Math.round(scans.reduce((s, a) => s + (a.match_score || 0), 0) / scans.length)
      : 0;
  const bestScore = scans.length > 0 ? Math.max(...scans.map((s) => s.match_score || 0)) : 0;
  const unlockedCount = scans.filter((s) => (s.match_score || 0) >= 75).length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-extrabold gradient-text mb-1">Scan History</h1>
        <p className="text-slate-400 text-sm">Track your gap analysis results over time.</p>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard padding="sm">
          <p className="text-xs text-slate-400 font-medium">Total Scans</p>
          <p className="text-2xl font-extrabold text-cyan-400">{scans.length}</p>
        </GlassCard>
        <GlassCard padding="sm">
          <p className="text-xs text-slate-400 font-medium">Average Score</p>
          <p className={`text-2xl font-extrabold ${avgScore >= 75 ? "text-emerald-400" : "text-amber-400"}`}>
            {avgScore}%
          </p>
        </GlassCard>
        <GlassCard padding="sm">
          <p className="text-xs text-slate-400 font-medium">Times Unlocked</p>
          <p className="text-2xl font-extrabold text-emerald-400">{unlockedCount}</p>
        </GlassCard>
      </div>

      <DataTable
        columns={columns}
        data={scans}
        isLoading={loading}
        emptyMessage="No scans yet. Run your first gap analysis to see results here."
      />
    </div>
  );
}
