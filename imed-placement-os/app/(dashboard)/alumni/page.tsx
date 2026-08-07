"use client";

import React, { useState, useEffect } from "react";
import { Users, Briefcase, Heart, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { createClient } from "@/lib/supabase/client";

export default function AlumniDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("alumni_profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data) setProfile(data);
      }
      setIsLoading(false);
    }
    loadData();
  }, [supabase]);

  if (isLoading) {
    return <div className="text-white p-8 text-center">Loading portal...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500 max-w-7xl">
      <div>
        <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
          Welcome back, {profile?.full_name?.split(" ")[0] || "Alumni"}!
        </h1>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
          Your engagement score is <span className="text-purple-400 font-bold">{profile?.engagement_score || 0}</span>. 
          Thank you for continuing to be an active part of the IMED community. Your contributions help shape the next generation of professionals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard padding="lg" className="hover:bg-purple-500/5 transition-colors group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Engagement Score</p>
              <h3 className="text-3xl font-black text-white">{profile?.engagement_score || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">Top 10% Contributor</span>
          </div>
        </GlassCard>

        <GlassCard padding="lg" className="hover:bg-cyan-500/5 transition-colors group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Mentorship Status</p>
              <h3 className="text-xl font-bold text-white mt-2">
                {profile?.is_mentor ? "Opted In" : "Not Active"}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800">
             <a href="/alumni/mentorship" className="text-xs text-cyan-400 hover:underline">Update Preferences →</a>
          </div>
        </GlassCard>

        <GlassCard padding="lg" className="hover:bg-amber-500/5 transition-colors group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Job Referrals</p>
              <h3 className="text-xl font-bold text-white mt-2">Post an Opening</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Briefcase className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800">
             <a href="/alumni/referrals" className="text-xs text-amber-400 hover:underline">Refer a Student →</a>
          </div>
        </GlassCard>
        
        <GlassCard padding="lg" className="hover:bg-rose-500/5 transition-colors group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Giving Back</p>
              <h3 className="text-xl font-bold text-white mt-2">Donate</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Heart className="w-6 h-6 text-rose-400" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800">
             <a href="/alumni/donate" className="text-xs text-rose-400 hover:underline">View Campaigns →</a>
          </div>
        </GlassCard>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-6 pt-4">
        <GlassCard padding="lg">
           <h3 className="text-lg font-bold text-white mb-4">Your Profile Details</h3>
           <div className="space-y-4">
              <div className="flex justify-between border-b border-slate-800 pb-3">
                 <span className="text-slate-400 text-sm">Company</span>
                 <span className="text-white font-medium text-sm">{profile?.current_company || "Not set"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-3">
                 <span className="text-slate-400 text-sm">Role</span>
                 <span className="text-white font-medium text-sm">{profile?.role_title || "Not set"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-3">
                 <span className="text-slate-400 text-sm">Graduation Year</span>
                 <span className="text-white font-medium text-sm">{profile?.graduation_year || "Not set"}</span>
              </div>
              <div className="flex justify-between pb-1">
                 <span className="text-slate-400 text-sm">Branch</span>
                 <span className="text-white font-medium text-sm">{profile?.branch || "Not set"}</span>
              </div>
           </div>
           <p className="text-xs text-slate-500 mt-6 italic">This data is automatically synced from LinkedIn.</p>
        </GlassCard>
        
        <GlassCard padding="lg" className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-indigo-500/20">
           <h3 className="text-lg font-bold text-white mb-2">Upcoming IMED Events</h3>
           <p className="text-sm text-slate-400 mb-6">Join us for our annual alumni meet and network with the newest batch of graduates.</p>
           
           <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                 <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-indigo-300">Annual Tech Symposium 2024</h4>
                    <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">Next Month</span>
                 </div>
                 <p className="text-xs text-slate-400">Looking for alumni speakers to talk about Cloud Infrastructure.</p>
              </div>
           </div>
        </GlassCard>
      </div>
    </div>
  );
}
