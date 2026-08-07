"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

export default function SkillRadarPage() {
  const [radarData, setRadarData] = useState<any[]>([]);
  const [totalScans, setTotalScans] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"radar" | "bar">("radar");

  useEffect(() => {
    async function loadRadar() {
      try {
        const res = await fetch("/api/admin/stats?type=skill-radar");
        if (res.ok) {
          const data = await res.json();
          setRadarData(data.radarData || []);
          setTotalScans(data.totalScans || 0);
        }
      } catch (err) {
        console.error("Skill radar error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRadar();
  }, []);

  const COLORS = [
    "#06b6d4", "#818cf8", "#f43f5e", "#f59e0b", "#10b981",
    "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
    "#ef4444", "#22d3ee",
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold gradient-text mb-1">
            Cohort Skill Deficit Radar
          </h1>
          <p className="text-slate-400 text-sm">
            Aggregated skill gaps across {totalScans} student scans — identify workshop priorities.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("radar")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "radar"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                : "bg-white/[0.03] text-slate-500 border border-white/[0.06]"
            }`}
          >
            Radar View
          </button>
          <button
            onClick={() => setViewMode("bar")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "bar"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                : "bg-white/[0.03] text-slate-500 border border-white/[0.06]"
            }`}
          >
            Bar Chart
          </button>
        </div>
      </div>

      {loading ? (
        <GlassCard className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
        </GlassCard>
      ) : radarData.length === 0 ? (
        <GlassCard className="text-center py-16">
          <p className="text-slate-500">No skill deficit data available yet. Students need to run gap analyses first.</p>
        </GlassCard>
      ) : (
        <>
          {/* Chart */}
          <GlassCard className="p-8">
            {viewMode === "radar" ? (
              <ResponsiveContainer width="100%" height={450}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                  />
                  <PolarRadiusAxis
                    tick={{ fill: "#475569", fontSize: 10 }}
                    axisLine={false}
                  />
                  <Radar
                    name="Deficit Count"
                    dataKey="count"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={radarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis
                    dataKey="skill"
                    type="category"
                    width={150}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#e2e8f0",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {radarData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </GlassCard>

          {/* Table */}
          <GlassCard>
            <h3 className="text-white font-semibold mb-4">Skill Deficit Breakdown</h3>
            <div className="space-y-2">
              {radarData.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3 bg-white/[0.02] rounded-xl border border-white/[0.04]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-sm text-white font-medium">{item.skill}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500">
                      {item.percentage}% of students lack this
                    </span>
                    <span className="text-sm font-bold text-cyan-400">
                      {item.count} students
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
