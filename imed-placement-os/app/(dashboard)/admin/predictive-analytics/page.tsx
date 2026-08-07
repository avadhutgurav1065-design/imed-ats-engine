"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, AlertCircle, BarChart3, Loader2 } from "lucide-react";

interface AnalyticsData {
  totalStudents: number;
  predictions: {
    day1: { count: number; percentage: number; threshold: string };
    day2: { count: number; percentage: number; threshold: string };
    highRisk: { count: number; percentage: number; threshold: string };
  };
  trajectory: {
    trend: string;
    increasePercentage: number;
    reason: string;
  };
  recentScans: any[];
}

export default function PredictiveAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/admin/predictive-analytics");
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Predictive Placement Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">
            The "Crystal Ball" – know exactly who is at risk before placement season begins.
          </p>
        </div>
        <button className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)]">
          Generate Full Report
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 border border-white/[0.06] bg-[#0a0e1a]/80 backdrop-blur-xl rounded-2xl">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0a0e1a]/80 border border-white/[0.06] backdrop-blur-xl min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden">
            {/* Decorative background blur */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
            
            <BarChart3 className="w-12 h-12 text-indigo-400 mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-white mb-2">Day-1 vs Day-2 Predictions</h3>
            <p className="text-sm text-slate-400 text-center max-w-md">
              Aggregating data from {data.totalStudents} student profiles to predict batch placement distribution months in advance.
            </p>
            <div className="mt-6 w-full max-w-md space-y-4 relative z-10">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-emerald-400 font-medium">Day-1 Candidates ({data.predictions.day1.count})</span>
                  <span className="text-white">{data.predictions.day1.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${data.predictions.day1.percentage}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-400 font-medium">Day-2 Candidates ({data.predictions.day2.count})</span>
                  <span className="text-white">{data.predictions.day2.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${data.predictions.day2.percentage}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-rose-400 font-medium">High Risk ({data.predictions.highRisk.count})</span>
                  <span className="text-white">{data.predictions.highRisk.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${data.predictions.highRisk.percentage}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-colors cursor-pointer group">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">{data.predictions.highRisk.count} Students at Risk</h4>
                  <p className="text-xs text-slate-400 mt-1 group-hover:text-slate-300 transition-colors">
                    These students have readiness scores {data.predictions.highRisk.threshold} and require immediate intervention.
                  </p>
                  <button className="mt-3 text-xs font-bold text-rose-400 group-hover:text-rose-300">View List &rarr;</button>
                </div>
              </div>
            </div>
            
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">Positive Trajectory</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Overall batch readiness has increased by {data.trajectory.increasePercentage}% since last month. {data.trajectory.reason}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* NEW: Telemetry Table */}
      {data && data.recentScans && (
        <div className="mt-8 p-6 rounded-2xl bg-[#0a0e1a]/80 border border-white/[0.06] backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Live Resume Scan Telemetry</h3>
            <span className="text-xs text-slate-400">Latest Scans</span>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-white/[0.02] text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-lg">Student Name</th>
                  <th className="px-4 py-3 font-medium">Target Role</th>
                  <th className="px-4 py-3 font-medium text-center">Match Score</th>
                  <th className="px-4 py-3 font-medium text-right rounded-tr-lg">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {data.recentScans.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No resume scans found in the database yet. Run the Gap Analyzer to populate this table.
                    </td>
                  </tr>
                ) : (
                  data.recentScans.map((scan: any, i: number) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{scan.student_name}</td>
                      <td className="px-4 py-3">{scan.target_role}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                          scan.match_score >= 75 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          scan.match_score >= 40 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {scan.match_score}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {new Date(scan.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
