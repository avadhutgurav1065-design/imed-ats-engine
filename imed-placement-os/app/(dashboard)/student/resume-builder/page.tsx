"use client";

import React, { useState } from "react";
import { FileText, Wand2, Download, CheckCircle, Loader2 } from "lucide-react";

interface GeneratedResume {
  name: string;
  email: string;
  summary: string;
  skills: string[];
  experience: { role: string; company: string; bullets: string[] }[];
}

export default function AIResumeBuilderPage() {
  const [jdText, setJdText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [resume, setResume] = useState<GeneratedResume | null>(null);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [jdKeywords, setJdKeywords] = useState<string[]>([]);

  const extractKeywords = (jd: string): string[] => {
    const techWords = jd.match(/\b(React|Next\.js|Node|Python|SQL|AWS|TypeScript|Java|Docker|Kubernetes|GraphQL|Redis|MongoDB|PostgreSQL|REST|API|CI\/CD|Git|Agile|Scrum|Machine Learning|Data Science|TensorFlow|PyTorch|Excel|PowerBI|Tableau|C\+\+|Golang|Rust|Kotlin|Swift|Flutter|Spring|Django|FastAPI)\b/gi);
    return [...new Set(techWords?.map(w => w) || [])].slice(0, 10);
  };

  const handleGenerate = async () => {
    if (!jdText.trim()) return;
    setIsGenerating(true);
    setResume(null);
    setJdKeywords(extractKeywords(jdText));
    
    try {
      const res = await fetch("/api/student/resume-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jdText })
      });
      
      if (res.ok) {
        const json = await res.json();
        setResume(json.data);
        setAtsScore(json.atsScore);
      }
    } catch (err) {
      console.error("Failed to generate resume", err);
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500 print:space-y-0 print:m-0 print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Resume Builder</h1>
          <p className="text-sm text-slate-400 mt-1">
            Generate customized, ATS-beating resumes for every company you apply to.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block print:w-full">
        <div className="p-8 rounded-2xl bg-[#0a0e1a]/80 border border-white/[0.06] backdrop-blur-xl flex flex-col print:hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-cyan-500/10">
              <Wand2 className="w-6 h-6 text-cyan-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Auto-Tailor Resume</h2>
          </div>

          <div className="flex-1 flex flex-col space-y-5">
            <div className="flex-1 flex flex-col">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                Target Job Description
              </label>
              <textarea 
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the Job Description (JD) here..." 
                className="flex-1 w-full bg-[#070a13] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 resize-none min-h-[300px]"
              />
            </div>
            
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !jdText.trim()}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {isGenerating ? "Analyzing JD & Tailoring..." : "Generate ATS-Optimized Resume"}
            </button>
          </div>
        </div>

        <div className="p-8 rounded-2xl bg-[#0a0e1a]/80 border border-white/[0.06] backdrop-blur-xl flex flex-col print:p-0 print:bg-white print:text-black print:border-none print:block">
          <div className="flex items-center justify-between mb-6 print:hidden">
            <h3 className="text-base font-bold text-white">Your Tailored Resume</h3>
            <div className="flex items-center gap-2">
              {atsScore && (
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">ATS Match: {atsScore}%</span>
                </div>
              )}
              {resume && (
                <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold rounded-lg transition-colors">
                  <Download className="w-4 h-4" /> Download PDF
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 bg-white/[0.02] border border-white/[0.04] rounded-xl p-6 overflow-y-auto custom-scrollbar print:bg-white print:border-none print:p-0 print:overflow-visible">
            {!resume ? (
              <div className="h-full flex flex-col items-center justify-center text-center print:hidden">
                <div className="w-16 h-16 rounded-full bg-white/[0.02] flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-sm text-slate-400 mb-2">No tailored resumes generated yet.</p>
                <p className="text-xs text-slate-500 max-w-xs">
                  Paste a JD on the left, and we will dynamically re-write your bullet points and skills to match exactly what the ATS is looking for.
                </p>
              </div>
            ) : (
              <div className="space-y-6 text-slate-300 animate-in fade-in print:text-black">
                <div className="text-center border-b border-white/[0.06] print:border-slate-300 pb-4">
                  <h2 className="text-2xl font-bold text-white mb-1 print:text-black">{resume.name}</h2>
                  <p className="text-sm text-cyan-400 print:text-slate-600">{resume.email}</p>
                </div>
                
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 print:text-black">Professional Summary</h4>
                  <p className="text-sm leading-relaxed print:text-slate-800">{resume.summary}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 print:text-black">Core Competencies</h4>
                  <div className="flex flex-wrap gap-2">
                    {resume.skills.map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 text-xs font-medium border border-cyan-500/20 print:bg-slate-100 print:text-black print:border-slate-300">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 print:text-black">Experience</h4>
                  <div className="space-y-4">
                    {resume.experience.map((exp, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-baseline mb-1">
                          <h5 className="text-sm font-bold text-white print:text-black">{exp.role}</h5>
                          <span className="text-xs font-medium text-slate-500 print:text-slate-600">{exp.company}</span>
                        </div>
                        <ul className="list-disc list-outside ml-4 space-y-1">
                          {exp.bullets.map((bullet, j) => (
                            <li key={j} className="text-sm leading-relaxed pl-1 text-slate-300 print:text-slate-800">{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Tailoring Suggestions Panel */}
      {resume && jdKeywords.length > 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/15 print:hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Tailoring Insights</h3>
              <p className="text-xs text-slate-500">Keywords detected in the JD that were woven into your resume</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Detected Keywords */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">📌 JD Keywords Detected</p>
              <div className="flex flex-wrap gap-1.5">
                {jdKeywords.map((kw, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* What Changed */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">✅ What Was Optimized</p>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold mt-0.5">+</span>
                  Skills reordered to match JD priority
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold mt-0.5">+</span>
                  Bullet points contain exact JD terminology
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold mt-0.5">+</span>
                  Summary written to pass ATS keyword scan
                </li>
              </ul>
            </div>

            {/* ATS Tips */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">💡 ATS Tips</p>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>• Use this exact resume for <em className="text-white">this specific company</em></li>
                <li>• Don't convert to PDF with images/tables</li>
                <li>• Save as <span className="font-mono text-cyan-400">.docx</span> for upload portals</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
