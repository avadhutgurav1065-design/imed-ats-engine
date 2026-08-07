"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Flame, Medal, Target, ChevronUp, Loader2 } from "lucide-react";

interface StudentRank {
  id: string;
  full_name: string;
  xp_points: number;
  current_streak: number;
  longest_streak: number;
}

export default function LeaderboardPage() {
  const [students, setStudents] = useState<StudentRank[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; rank: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/student/leaderboard");
        if (res.ok) {
          const json = await res.json();
          setStudents(json.data);
          setCurrentUser(json.currentUser);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Peer-to-Peer Leaderboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Compete with your batchmates by completing mock interviews and assignments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-8 rounded-2xl bg-[#0a0e1a]/80 border border-white/[0.06] backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Top Performers</h2>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                No XP points awarded yet. Start completing mock interviews!
              </div>
            ) : (
              students.map((student, i) => (
                <div 
                  key={student.id} 
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                    student.id === currentUser?.id 
                      ? "bg-amber-500/10 border-amber-500/30" 
                      : "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 font-bold text-slate-500 text-center">
                      {i === 0 ? <Medal className="w-6 h-6 text-amber-400 mx-auto" /> : 
                       i === 1 ? <Medal className="w-6 h-6 text-slate-300 mx-auto" /> :
                       i === 2 ? <Medal className="w-6 h-6 text-amber-700 mx-auto" /> : 
                       `#${i + 1}`}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${student.id === currentUser?.id ? "text-amber-400" : "text-white"}`}>
                        {student.full_name} {student.id === currentUser?.id && "(You)"}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">{student.xp_points.toLocaleString()} XP</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                      <Flame className={`w-3.5 h-3.5 ${student.current_streak > 0 ? "text-orange-500 animate-pulse" : "text-slate-500"}`} />
                      <span className="text-xs font-bold text-orange-400">{student.current_streak} Day Streak</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-center">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">Your Current Rank</h3>
            {isLoading ? (
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto my-4" />
            ) : (
              <>
                <div className="text-5xl font-black text-white mb-2">#{currentUser?.rank || "-"}</div>
                <p className="text-sm text-slate-400 mb-6">Top {(currentUser?.rank && currentUser.rank <= 10) ? "10%" : "25%"} of your batch</p>
              </>
            )}
            
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 w-[75%]" />
            </div>
            <p className="text-xs text-slate-400">2,500 XP needed to reach next rank</p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0a0e1a]/80 border border-white/[0.06] backdrop-blur-xl">
            <h3 className="text-base font-bold text-white mb-4">How to earn XP?</h3>
            <ul className="space-y-3">
              {[
                { task: "Complete AI Mock Interview", xp: "+500 XP", icon: Target },
                { task: "Generate ATS Resume", xp: "+250 XP", icon: ChevronUp },
                { task: "7-Day Login Streak", xp: "+1000 XP", icon: Flame },
              ].map((item, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <item.icon className="w-4 h-4 text-slate-500" />
                    {item.task}
                  </div>
                  <span className="font-bold text-emerald-400">{item.xp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
