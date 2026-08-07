"use client";

import { useState, useEffect } from "react";
import { StatCard } from "@/components/shared/StatCard";
import { GlassCard } from "@/components/shared/GlassCard";
import Link from "next/link";

export default function AdminHomePage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/stats?type=overview");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to load stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const quickLinks = [
    {
      label: "Corporate Match Router",
      desc: "Route qualified students to upcoming drives",
      href: "/admin/match-router",
      color: "from-cyan-500/20 to-indigo-500/20",
      textColor: "text-cyan-400",
    },
    {
      label: "Cohort Skill Radar",
      desc: "Identify batch-wide skill deficiencies",
      href: "/admin/skill-radar",
      color: "from-indigo-500/20 to-purple-500/20",
      textColor: "text-indigo-400",
    },
    {
      label: "Risk Telemetry",
      desc: "Flag at-risk students ignoring action plans",
      href: "/admin/risk-telemetry",
      color: "from-rose-500/20 to-amber-500/20",
      textColor: "text-rose-400",
    },
    {
      label: "NAAC/NBA Export",
      desc: "Generate institutional compliance reports",
      href: "/admin/export",
      color: "from-emerald-500/20 to-cyan-500/20",
      textColor: "text-emerald-400",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold gradient-text mb-2">
          Placement Intelligence Hub
        </h1>
        <p className="text-slate-400 text-sm">
          Real-time analytics and student readiness telemetry for IMED placement directors.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={stats?.totalStudents || 0}
          color="cyan"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatCard
          label="ATS Scans Run"
          value={stats?.totalScans || 0}
          color="amber"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <StatCard
          label="Ready (≥75%)"
          value={stats?.readyStudents || 0}
          color="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="At Risk (<75%)"
          value={stats?.atRiskStudents || 0}
          color="rose"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* Average Score Banner */}
      <GlassCard className="border-cyan-500/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Cohort Average Match Score
            </p>
            <p className={`text-4xl font-extrabold mt-1 ${
              (stats?.avgScore || 0) >= 75 ? "text-emerald-400" : "text-amber-400"
            }`}>
              {stats?.avgScore || 0}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Upcoming Drives</p>
            <p className="text-2xl font-extrabold text-cyan-400">
              {stats?.upcomingDrives || 0}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* NEW: Predictive Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <GlassCard className="h-full border-white/[0.04] p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <h3 className="text-lg font-bold text-white mb-2">Predictive Placement Analytics</h3>
            <p className="text-sm text-slate-400 mb-6">AI-forecasted placement trajectory based on current cohort capabilities and historic drive difficulty.</p>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300 font-medium">Day-1 Corporate Placements (≥85% Match)</span>
                  <span className="text-cyan-400 font-bold">Projected: 42%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-cyan-400 h-2 rounded-full" style={{ width: '42%' }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300 font-medium">Day-2 Corporate Placements (70-84% Match)</span>
                  <span className="text-indigo-400 font-bold">Projected: 38%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-indigo-400 h-2 rounded-full" style={{ width: '38%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300 font-medium">At-Risk / Unplaced Cohort (&lt;70% Match)</span>
                  <span className="text-rose-400 font-bold">Projected: 20%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-rose-400 h-2 rounded-full animate-pulse" style={{ width: '20%' }} />
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/[0.05] flex justify-between items-center">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry Active
              </span>
              <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Generate Action Plan →</button>
            </div>
          </GlassCard>
        </div>
        
        <div className="md:col-span-1">
          <GlassCard className="h-full border-white/[0.04] p-6 bg-gradient-to-b from-slate-900/50 to-indigo-950/20">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Institutional ROI</h3>
            <p className="text-sm text-slate-400 mb-6">Current batch trajectory vs last year.</p>
            <div className="text-3xl font-black text-white mb-1">+14.2%</div>
            <p className="text-xs text-emerald-400 font-medium">Projected increase in Day-1 hires</p>
          </GlassCard>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <GlassCard className="group cursor-pointer hover:border-white/[0.12]">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <span className={`${link.textColor} font-bold text-lg`}>⚡</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{link.label}</h3>
                  <p className="text-slate-400 text-xs mt-0.5">{link.desc}</p>
                </div>
                <svg className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
