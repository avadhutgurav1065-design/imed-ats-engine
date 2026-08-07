"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Briefcase, FileText, Users, CheckCircle, Wand2, Loader2, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";

function DriveLinkContent() {
  const params = useParams();
  const token = params.token as string;

  
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [companyName, setCompanyName] = useState("");
  
  const [jdText, setJdText] = useState("");
  const [isMatching, setIsMatching] = useState(false);
  const [matchedStudents, setMatchedStudents] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    // Validate the token (Mock validation for MVP)
    setTimeout(() => {
      if (token && token.length > 5) {
        setIsValid(true);
        setCompanyName("Acme Corp"); // Simulated lookup
      }
      setIsValidating(false);
    }, 1000);
  }, [token]);

  const handleMatch = () => {
    if (!jdText.trim()) return;
    setIsMatching(true);
    
    // Simulate AI Vector Matching delay
    setTimeout(() => {
      setMatchedStudents([
        { name: "Rahul Sharma", score: 94, branch: "B.Tech Computer Science", skills: ["React", "Node.js", "AWS"] },
        { name: "Aditi Verma", score: 88, branch: "MCA", skills: ["Python", "Django", "PostgreSQL"] },
        { name: "Vikram Singh", score: 82, branch: "BCA", skills: ["Java", "Spring Boot", "MySQL"] },
        { name: "Sneha Patel", score: 79, branch: "B.Tech IT", skills: ["JavaScript", "TypeScript", "Next.js"] },
        { name: "Karan Johar", score: 76, branch: "B.Tech Computer Science", skills: ["C++", "Data Structures", "Algorithms"] },
      ]);
      setIsMatching(false);
      setHasSearched(true);
    }, 2500);
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white">Validating Secure Drive-Link...</h2>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-6">
          <FileText className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Invalid or Expired Link</h2>
        <p className="text-slate-400 max-w-md">
          This corporate drive-link is no longer active. Please contact the IMED Placement Cell for a new invitation.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto p-6 lg:p-12 space-y-12 animate-in fade-in zoom-in duration-500">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-sm">
            <Sparkles className="w-4 h-4" /> IMED AI Placement Matcher
          </div>
          <h1 className="text-3xl lg:text-5xl font-bold text-white tracking-tight">
            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{companyName}</span> Recruiter
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Paste your Job Description below. Our AI Vector Engine will instantly scan the entire IMED student cohort and return perfectly matched, vetted candidates.
          </p>
        </div>

        {/* Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Input Panel */}
          <div className="p-8 rounded-3xl bg-[#0a0e1a]/80 border border-white/[0.06] backdrop-blur-xl flex flex-col shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-indigo-500/10">
                <Briefcase className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Target Job Description</h2>
            </div>
            
            <textarea 
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="E.g. We are looking for a Full Stack Developer with React, Node.js, and AWS experience..."
              className="flex-1 w-full bg-[#070a13] border border-white/[0.06] rounded-2xl p-6 text-sm text-white focus:outline-none focus:border-indigo-500/50 resize-none min-h-[300px] mb-6 custom-scrollbar leading-relaxed"
            />
            
            <button 
              onClick={handleMatch}
              disabled={isMatching || !jdText.trim()}
              className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 text-white text-lg font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
            >
              {isMatching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              {isMatching ? "Scanning Cohort Resumes..." : "Find Perfect Matches"}
            </button>
          </div>

          {/* Results Panel */}
          <div className="p-8 rounded-3xl bg-[#0a0e1a]/80 border border-white/[0.06] backdrop-blur-xl flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <Users className="w-6 h-6 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Top Matched Students</h2>
              </div>
              {hasSearched && (
                <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">{matchedStudents.length} Found</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
              {!hasSearched && !isMatching ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-white/[0.02] flex items-center justify-center mb-6 border border-white/[0.05]">
                    <Users className="w-10 h-10 text-slate-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-300 mb-2">Awaiting Job Description</h3>
                  <p className="text-sm text-slate-500 max-w-sm">
                    Enter your requirements to instantly discover the most qualified students from the IMED cohort.
                  </p>
                </div>
              ) : isMatching ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-6">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
                    <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Wand2 className="w-8 h-8 text-indigo-400 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-indigo-400 font-bold animate-pulse">Running Neural Vector Matching...</p>
                    <p className="text-xs text-slate-500">Scanning 400+ student profiles and resumes.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
                  {matchedStudents.map((student, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors group">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">{student.name}</h4>
                          <p className="text-xs text-slate-500 mt-1">{student.branch}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-lg font-black text-emerald-400">{student.score}%</span>
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Match</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {student.skills.map((skill: string, j: number) => (
                          <span key={j} className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">
                            {skill}
                          </span>
                        ))}
                      </div>
                      <div className="mt-5 pt-4 border-t border-white/[0.05] flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white text-xs font-bold rounded-lg transition-colors">View Resume</button>
                        <button className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold rounded-lg transition-colors">Select for Interview</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CorporateDriveLinkPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white">Validating Secure Drive-Link...</h2>
      </div>
    }>
      <DriveLinkContent />
    </Suspense>
  );
}
