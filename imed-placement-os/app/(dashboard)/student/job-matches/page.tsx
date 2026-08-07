"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { createClient } from "@/lib/supabase/client";
import { Briefcase, Zap, TrendingUp, ExternalLink, RefreshCw } from "lucide-react";

interface JobMatch {
  company_name: string;
  role_title: string;
  match_score: number;
  reason: string;
}

export default function JobMatchesPage() {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [studentName, setStudentName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [hasAnalysis, setHasAnalysis] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    checkForAnalysis();
  }, []);

  async function checkForAnalysis() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("gap_analyses")
      .select("id, student_name")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (data) {
      setHasAnalysis(true);
      setStudentName(data.student_name || "");
      // Auto-fetch on load
      fetchMatches(user.id);
    } else {
      setHasAnalysis(false);
    }
  }

  async function fetchMatches(userId?: string) {
    setLoading(true);
    setError(null);
    try {
      let uid = userId;
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        uid = user?.id;
      }
      if (!uid) throw new Error("Not authenticated");

      const res = await fetch("/api/admin/match-router/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: uid }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch matches");

      setMatches(data.suggestions || []);
      if (data.student_name) setStudentName(data.student_name);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-rose-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20";
    if (score >= 60) return "from-amber-500/10 to-amber-500/5 border-amber-500/20";
    return "from-rose-500/10 to-rose-500/5 border-rose-500/20";
  };

  const getScoreGlow = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-rose-500";
  };

  if (hasAnalysis === false) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-16">
        <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto">
          <Briefcase className="w-10 h-10 text-cyan-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">No Gap Analysis Found</h1>
        <p className="text-slate-400">
          You need to run a Gap Analysis first before we can match you to jobs. The AI will use your skills and missing areas to find the best opportunities.
        </p>
        <a
          href="/student/analyze"
          className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-xl font-bold text-white hover:from-cyan-500 transition-all"
        >
          Run Gap Analysis →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold gradient-text mb-2 tracking-tight">
            AI Job Matches
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Gemini AI analyzes your skill profile and gap analysis to rank the best-fit corporate opportunities for{" "}
            <span className="text-white font-semibold">{studentName || "you"}</span>.
          </p>
        </div>
        <button
          onClick={() => fetchMatches()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08] transition-all text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <GlassCard key={i} className="animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-800 rounded w-1/3" />
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                  <div className="h-3 bg-slate-800 rounded w-3/4" />
                </div>
                <div className="w-16 h-16 rounded-full bg-slate-800" />
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <GlassCard className="border-rose-500/20 bg-rose-500/5">
          <p className="text-rose-400 text-sm">⚠️ {error}</p>
        </GlassCard>
      )}

      {/* Matches */}
      {!loading && matches.length > 0 && (
        <div className="grid gap-4">
          {matches.map((job, idx) => (
            <GlassCard
              key={idx}
              className={`bg-gradient-to-br ${getScoreBg(job.match_score)} group hover:scale-[1.01] transition-all duration-200`}
            >
              <div className="flex items-center gap-5">
                {/* Rank Badge */}
                <div className="flex-shrink-0 text-center">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-1">
                    <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                  </div>
                </div>

                {/* Company Icon */}
                <div className="w-14 h-14 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-black text-white">
                    {job.company_name?.[0] || "?"}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-white font-bold truncate">{job.company_name}</h3>
                    {idx === 0 && (
                      <span className="text-[10px] font-bold uppercase bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30 flex-shrink-0">
                        Best Match
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm mb-2">{job.role_title}</p>
                  <div className="flex items-start gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-300 leading-relaxed">{job.reason}</p>
                  </div>
                </div>

                {/* Score Dial */}
                <div className="flex-shrink-0 text-center">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                      <circle
                        cx="32" cy="32" r="28"
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="6"
                      />
                      <circle
                        cx="32" cy="32" r="28"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${(job.match_score / 100) * 175.9} 175.9`}
                        className={getScoreColor(job.match_score)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-sm font-black ${getScoreColor(job.match_score)}`}>
                        {job.match_score}%
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold mt-1 block ${getScoreColor(job.match_score)}`}>
                    Match
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 pt-4 border-t border-white/[0.05]">
                <div className="w-full h-1.5 rounded-full bg-slate-900/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getScoreGlow(job.match_score)} transition-all duration-700`}
                    style={{ width: `${job.match_score}%` }}
                  />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* No matches empty state */}
      {!loading && matches.length === 0 && !error && !loading && hasAnalysis && (
        <GlassCard className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Click Refresh to generate your personalized job matches.</p>
          <button
            onClick={() => fetchMatches()}
            className="mt-4 px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-xl font-bold text-white text-sm hover:from-cyan-500 transition-all"
          >
            Generate Matches
          </button>
        </GlassCard>
      )}

      {/* Info Card */}
      {matches.length > 0 && !loading && (
        <GlassCard className="bg-indigo-900/20 border-indigo-500/20">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white mb-1">How matches are calculated</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gemini AI cross-references your latest gap analysis results — including your target role, identified missing skills, and remediation progress — against active corporate job descriptions to compute these scores.
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
