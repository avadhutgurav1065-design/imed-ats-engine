"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { GlassCard } from "@/components/shared/GlassCard";
import { DragDropZone } from "@/components/shared/DragDropZone";
import { CompanySelector } from "@/components/shared/CompanySelector";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function GapAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [manualJD, setManualJD] = useState("");
  const [manualRole, setManualRole] = useState("");
  const [useManualInput, setUseManualInput] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsUploading(true);
    setUploadSuccess(false);
    setAnalysisData(null);

    const fileName = `${Date.now()}-${selectedFile.name}`;

    const { error } = await supabase.storage
      .from("resumes")
      .upload(fileName, selectedFile);

    setIsUploading(false);

    if (error) {
      alert("Upload failed: " + error.message);
    } else {
      setUploadedFileName(fileName);
      setUploadSuccess(true);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    const jobRole = useManualInput
      ? manualRole
      : selectedJob
        ? `${selectedJob.role_title} at ${selectedJob.company_name}`
        : "";

    const jobDescription = useManualInput
      ? manualJD
      : selectedJob?.raw_requirements || "";

    if (!jobRole || !jobDescription) {
      alert("Please select a target company or enter a job description.");
      return;
    }

    setIsAnalyzing(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("You are not logged in. Please go to /login.");
        setIsAnalyzing(false);
        return;
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          fileName: uploadedFileName,
          jobRole,
          jobDescription,
        }),
      });

      if (!response.ok) throw new Error("AI Engine failed to process");

      const data = await response.json();
      setAnalysisData(data);
    } catch (error) {
      console.error(error);
      alert("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold gradient-text mb-1">
          AI Gap Analyzer & Matchmaker
        </h1>
        <p className="text-slate-400 text-sm">
          Upload your resume, select a target company, and let the AI engine calculate your compatibility score.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Target Selection */}
        <GlassCard>
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-cyan-400 text-xs font-bold bg-cyan-500/10 px-2 py-0.5 rounded">01</span>
            Define Target Role
          </h2>

          {/* Toggle between dropdown and manual */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setUseManualInput(false)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                !useManualInput
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                  : "bg-white/[0.03] text-slate-500 border border-white/[0.06]"
              }`}
            >
              From Database
            </button>
            <button
              onClick={() => setUseManualInput(true)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                useManualInput
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                  : "bg-white/[0.03] text-slate-500 border border-white/[0.06]"
              }`}
            >
              Manual Input
            </button>
          </div>

          {!useManualInput ? (
            <CompanySelector
              onSelect={(job) => setSelectedJob(job)}
              selectedJob={selectedJob}
            />
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Target Role & Company
                </label>
                <input
                  type="text"
                  value={manualRole}
                  onChange={(e) => setManualRole(e.target.value)}
                  placeholder="e.g. Full Stack Engineer at Amazon"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Paste Job Description
                </label>
                <textarea
                  value={manualJD}
                  onChange={(e) => setManualJD(e.target.value)}
                  placeholder="Paste the exact requirements and responsibilities here..."
                  className="w-full h-36 bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors resize-none custom-scrollbar"
                />
              </div>
            </div>
          )}
        </GlassCard>

        {/* Resume Upload */}
        <div className="lg:col-span-2">
          <GlassCard className="h-full flex flex-col justify-between">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-cyan-400 text-xs font-bold bg-cyan-500/10 px-2 py-0.5 rounded">02</span>
              Upload Student Resume
            </h2>

            <DragDropZone
              onFileSelect={handleFileSelect}
              isUploading={isUploading}
              uploadSuccess={uploadSuccess}
              fileName={file?.name}
              className="mb-4"
            />

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !uploadSuccess}
              className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold py-3.5 px-6 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all glow-cyan"
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Running AI Vector Match...
                </span>
              ) : (
                "Execute AI Gap Analysis"
              )}
            </button>
          </GlassCard>
        </div>
      </div>

      {/* Analysis Results */}
      {analysisData && (
        <div className="space-y-6 animate-slide-in-up">
          {/* Score & Status */}
          <GlassCard
            glow={analysisData.matchScore >= 75 ? "emerald" : "rose"}
            className={
              analysisData.matchScore >= 75
                ? "border-emerald-500/20"
                : "border-rose-500/20"
            }
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                  AI Match Compatibility
                </p>
                <p
                  className={`text-5xl font-extrabold ${
                    analysisData.matchScore >= 75
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {analysisData.matchScore}%
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <h4
                    className={`text-lg font-bold uppercase tracking-wider ${
                      analysisData.matchScore >= 75
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {analysisData.matchScore >= 75
                      ? "STATUS: UNLOCKED"
                      : "STATUS: LOCKED"}
                  </h4>
                  <p className="text-sm text-slate-400 mt-1 max-w-sm">
                    {analysisData.matchScore >= 75
                      ? "You meet the minimum threshold. You are cleared to register for the campus drive."
                      : "You have not met the 75% threshold. Complete the Action Plan below to bridge your skill deficits."}
                  </p>
                </div>
                <button
                  disabled={analysisData.matchScore < 75}
                  className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                    analysisData.matchScore >= 75
                      ? "bg-emerald-500 hover:bg-emerald-400 text-slate-900 cursor-pointer glow-emerald"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                  }`}
                >
                  {analysisData.matchScore >= 75
                    ? "Register for Drive"
                    : "Application Locked"}
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Missing Skills & Action Plan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard>
              <h4 className="text-sm font-semibold text-rose-400 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                Missing Skills ({analysisData.missingSkills?.length || 0})
              </h4>
              <div className="space-y-2">
                {analysisData.missingSkills?.map((skill: string, i: number) => (
                  <div
                    key={i}
                    className="text-sm text-slate-300 px-3 py-2.5 bg-rose-500/[0.05] border border-rose-500/10 rounded-lg"
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <h4 className="text-sm font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                48-Hour Action Plan
              </h4>
              <div className="space-y-2">
                {analysisData.actionPlan?.map((action: string, i: number) => (
                  <div
                    key={i}
                    className="text-sm text-slate-300 px-3 py-2.5 bg-cyan-500/[0.05] border border-cyan-500/10 rounded-lg flex items-start gap-2"
                  >
                    <span className="text-cyan-400 font-bold text-xs mt-0.5">
                      {i + 1}.
                    </span>
                    {action}
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
