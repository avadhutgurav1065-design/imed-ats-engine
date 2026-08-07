"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatCard } from "@/components/shared/StatCard";
import { ReadinessGauge } from "@/components/shared/ReadinessGauge";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function StudentHome() {
  const [stats, setStats] = useState({
    totalScans: 0,
    avgScore: 0,
    bestScore: 0,
    recentScans: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: analyses } = await supabase
          .from("gap_analyses")
          .select("*")
          .order("created_at", { ascending: false });

        const all = analyses || [];
        const totalScans = all.length;
        const avgScore =
          totalScans > 0
            ? Math.round(all.reduce((s, a) => s + (a.match_score || 0), 0) / totalScans)
            : 0;
        const bestScore =
          totalScans > 0
            ? Math.max(...all.map((a) => a.match_score || 0))
            : 0;

        setStats({
          totalScans,
          avgScore,
          bestScore,
          recentScans: all.slice(0, 5),
        });
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold gradient-text mb-2">
            Student Workspace
          </h1>
          <p className="text-slate-400 text-sm max-w-lg">
            Upload your resume, analyze gaps against corporate JDs, and track your placement readiness in real-time.
          </p>
        </div>
        <ReadinessGauge
          score={stats.avgScore}
          size="lg"
          label="Placement Readiness"
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Scans"
          value={stats.totalScans}
          color="cyan"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <StatCard
          label="Average Match"
          value={stats.avgScore}
          suffix="%"
          color={stats.avgScore >= 75 ? "emerald" : "amber"}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <StatCard
          label="Best Score"
          value={stats.bestScore}
          suffix="%"
          color="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/student/analyze">
          <GlassCard className="group cursor-pointer border-cyan-500/10 hover:border-cyan-500/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Run Gap Analysis</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Upload resume & match against corporate JDs
                </p>
              </div>
              <svg className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 ml-auto transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </GlassCard>
        </Link>

        <Link href="/student/interview">
          <GlassCard className="group cursor-pointer border-indigo-500/10 hover:border-indigo-500/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">AI Mock Interview</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Practice with voice-based AI technical screening
                </p>
              </div>
              <svg className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 ml-auto transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </GlassCard>
        </Link>
      </div>

      {/* Recent Scans */}
      <GlassCard>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Recent Scans</h3>
          <Link
            href="/student/history"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            View All →
          </Link>
        </div>
        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm animate-pulse">
            Loading scan history...
          </div>
        ) : stats.recentScans.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm">No scans yet.</p>
            <Link
              href="/student/analyze"
              className="text-cyan-400 text-sm font-medium hover:text-cyan-300 mt-2 inline-block"
            >
              Run your first analysis →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentScans.map((scan, i) => (
              <div
                key={scan.id || i}
                className="flex items-center justify-between px-4 py-3 bg-white/[0.02] rounded-xl border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      (scan.match_score || 0) >= 75 ? "bg-emerald-400" : "bg-rose-400"
                    }`}
                  />
                  <div>
                    <p className="text-sm text-white font-medium">
                      {scan.job_role || scan.student_name || "Gap Analysis"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {scan.created_at
                        ? new Date(scan.created_at).toLocaleDateString()
                        : ""}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-lg font-extrabold ${
                    (scan.match_score || 0) >= 75 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {scan.match_score || 0}%
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
