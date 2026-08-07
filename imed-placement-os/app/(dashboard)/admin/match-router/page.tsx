"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { DataTable } from "@/components/shared/DataTable";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function MatchRouterPage() {
  const [activeTab, setActiveTab] = useState<"role" | "student">("student");
  
  // Role-centric state
  const [drives, setDrives] = useState<any[]>([]);
  const [selectedDrive, setSelectedDrive] = useState<string>("");
  const [minScore, setMinScore] = useState(75);
  const [qualifiedStudents, setQualifiedStudents] = useState<any[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Student-centric state
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [suggestedCompanies, setSuggestedCompanies] = useState<any[]>([]);
  const [studentName, setStudentName] = useState("");
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    async function loadData() {
      // Load active corporate jobs
      const resDrives = await fetch("/api/corporate-jobs");
      if (resDrives.ok) {
        const data = await resDrives.json();
        setDrives(data.jobs || []);
      }
      
      // Load all students who took gap analysis
      const { data: analyses } = await supabase.from('gap_analyses').select('user_id, student_name');
      if (analyses) {
        // Unique students
        const unique = Array.from(new Set(analyses.map(a => a.user_id)))
          .map(id => analyses.find(a => a.user_id === id));
        setStudents(unique);
      }
    }
    loadData();
  }, []);

  const handleRoute = async () => {
    setLoadingRoles(true);
    try {
      const res = await fetch(
        `/api/admin/stats?type=match-router&min_score=${minScore}${selectedDrive ? `&drive_id=${selectedDrive}` : ""}`
      );
      if (res.ok) {
        const data = await res.json();
        setQualifiedStudents(data.qualifiedStudents || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleSuggest = async () => {
    if (!selectedStudent) return;
    setLoadingSuggestions(true);
    setSuggestedCompanies([]);
    try {
      const res = await fetch("/api/admin/match-router/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudent })
      });
      const data = await res.json();
      if (res.ok) {
        setSuggestedCompanies(data.suggestions || []);
        setStudentName(data.student_name);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const roleColumns = [
    { key: "rank", header: "#", render: (_: any, i: number) => <span className="text-slate-500">{i + 1}</span> },
    { key: "student_name", header: "Student Name", render: (row: any) => <span className="text-white font-medium">{row.student_name}</span> },
    { key: "match_score", header: "Match Score", render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-full bg-slate-800 rounded-full h-1.5 max-w-[100px]">
            <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: `${row.match_score}%` }} />
          </div>
          <span className="text-cyan-400 font-bold">{row.match_score}%</span>
        </div>
      )
    },
    { key: "status", header: "Status", render: (row: any) => (
        <span className="px-2 py-1 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Ready to Interview</span>
      )
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Corporate Precision Matcher</h1>
        <p className="text-slate-400">Map students to exact corporate requirements using AI analysis.</p>
      </div>

      <div className="flex gap-4 mb-8 border-b border-white/[0.05] pb-4">
        <button 
          onClick={() => setActiveTab("student")}
          className={`px-4 py-2 font-bold rounded-lg transition-all ${activeTab === 'student' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-500 hover:text-white'}`}
        >
          Student Capability Matrix
        </button>
        <button 
          onClick={() => setActiveTab("role")}
          className={`px-4 py-2 font-bold rounded-lg transition-all ${activeTab === 'role' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-500 hover:text-white'}`}
        >
          Role-Centric Filter
        </button>
      </div>

      {activeTab === "student" && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-400 mb-2">Select Student</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200"
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                >
                  <option value="">-- Select a student who has analyzed their resume --</option>
                  {students.map(s => (
                    <option key={s.user_id} value={s.user_id}>{s.student_name}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={handleSuggest}
                disabled={loadingSuggestions || !selectedStudent}
                className="bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-2.5 rounded-lg font-bold transition-all disabled:opacity-50"
              >
                {loadingSuggestions ? 'Judging Capability...' : 'Suggest Companies'}
              </button>
            </div>
          </GlassCard>

          {suggestedCompanies.length > 0 && (
            <div className="grid gap-4 mt-8">
              <h2 className="text-xl font-bold text-white mb-4">Top Matches for {studentName}</h2>
              {suggestedCompanies.map((comp: any, i: number) => (
                <GlassCard key={i} className="p-6 border-l-4 border-l-indigo-500 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{comp.company_name}</h3>
                      <p className="text-indigo-400 font-medium">{comp.role_title}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-white">{comp.match_score}%</div>
                      <div className="text-xs text-slate-500">Capability Match</div>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm italic border-t border-white/[0.05] pt-4 mt-4">
                    "{comp.reason}"
                  </p>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "role" && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-400 mb-2">Target Corporate Role</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200"
                  value={selectedDrive}
                  onChange={(e) => setSelectedDrive(e.target.value)}
                >
                  <option value="">All Available Roles</option>
                  {drives.map(d => (
                    <option key={d.id} value={d.id}>{d.company_name} - {d.role_title}</option>
                  ))}
                </select>
              </div>
              <div className="w-48">
                <label className="block text-sm font-medium text-slate-400 mb-2">Min Capability Score ({minScore}%)</label>
                <input 
                  type="range" min="50" max="100" value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
              <button 
                onClick={handleRoute}
                disabled={loadingRoles}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-6 py-2.5 rounded-lg font-bold transition-all disabled:opacity-50"
              >
                {loadingRoles ? 'Routing...' : 'Filter Students'}
              </button>
            </div>
          </GlassCard>
          
          <GlassCard className="p-6">
            <DataTable columns={roleColumns} data={qualifiedStudents} emptyMessage="No students meet this capability threshold yet." />
          </GlassCard>
        </div>
      )}
    </div>
  );
}
