"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { DataTable } from "@/components/shared/DataTable";

export default function RiskTelemetryPage() {
  const [atRiskStudents, setAtRiskStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRisk() {
      try {
        const res = await fetch("/api/admin/stats?type=risk-telemetry");
        if (res.ok) {
          const data = await res.json();
          setAtRiskStudents(data.atRiskStudents || []);
        }
      } catch (err) {
        console.error("Risk telemetry error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRisk();
  }, []);

  const highRisk = atRiskStudents.filter((s) => s.remediation_rate < 30);
  const mediumRisk = atRiskStudents.filter((s) => s.remediation_rate >= 30 && s.remediation_rate < 70);

  const columns = [
    {
      key: "student_name",
      header: "Student",
      render: (row: any) => (
        <span className="text-white font-medium">{row.student_name || "—"}</span>
      ),
    },
    {
      key: "match_score",
      header: "Score",
      render: (row: any) => (
        <span className="text-rose-400 font-bold">{row.match_score}%</span>
      ),
    },
    {
      key: "remediation_rate",
      header: "Remediation Progress",
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                row.remediation_rate >= 70
                  ? "bg-emerald-500"
                  : row.remediation_rate >= 30
                    ? "bg-amber-500"
                    : "bg-rose-500"
              }`}
              style={{ width: `${row.remediation_rate}%` }}
            />
          </div>
          <span className="text-xs text-slate-400">
            {row.remediation_completed}/{row.remediation_total} items
          </span>
        </div>
      ),
    },
    {
      key: "risk_level",
      header: "Risk Level",
      render: (row: any) => {
        const riskLevel =
          row.remediation_rate < 30 ? "High" : row.remediation_rate < 70 ? "Medium" : "Low";
        const colors = {
          High: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          Low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        };
        return (
          <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full border ${colors[riskLevel]}`}>
            {riskLevel}
          </span>
        );
      },
    },
    {
      key: "created_at",
      header: "Last Scan",
      render: (row: any) => {
        const days = row.created_at
          ? Math.floor((Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        return (
          <span className={`text-xs ${days > 7 ? "text-rose-400" : "text-slate-500"}`}>
            {days}d ago
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-extrabold gradient-text mb-1">
          Student Risk Telemetry
        </h1>
        <p className="text-slate-400 text-sm">
          Identify students with low match scores who are ignoring their remediation action plans.
        </p>
      </div>

      {/* Risk Summary */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard padding="sm" className="border-rose-500/10">
          <p className="text-xs text-slate-400 font-medium">High Risk</p>
          <p className="text-2xl font-extrabold text-rose-400">{highRisk.length}</p>
          <p className="text-[10px] text-slate-500 mt-1">{"<30% remediation"}</p>
        </GlassCard>
        <GlassCard padding="sm" className="border-amber-500/10">
          <p className="text-xs text-slate-400 font-medium">Medium Risk</p>
          <p className="text-2xl font-extrabold text-amber-400">{mediumRisk.length}</p>
          <p className="text-[10px] text-slate-500 mt-1">30-70% remediation</p>
        </GlassCard>
        <GlassCard padding="sm" className="border-cyan-500/10">
          <p className="text-xs text-slate-400 font-medium">Total At-Risk</p>
          <p className="text-2xl font-extrabold text-cyan-400">{atRiskStudents.length}</p>
          <p className="text-[10px] text-slate-500 mt-1">{"Score <75%"}</p>
        </GlassCard>
      </div>

      <DataTable
        columns={columns}
        data={atRiskStudents}
        isLoading={loading}
        emptyMessage="No at-risk students detected. All students are meeting the 75% threshold."
      />
    </div>
  );
}
