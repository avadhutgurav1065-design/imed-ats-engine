"use client";

import React, { useState, useEffect } from "react";
import { Users, Linkedin, Briefcase, Wand2, Loader2, CheckCircle2, Upload, Search, Heart, IndianRupee, TrendingUp, Sparkles, Building2 } from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/shared/DataTable";
import { createClient } from "@supabase/supabase-js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// We use the anonymous client to read public data securely via RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MentorshipPair {
  id: string;
  student: { full_name: string; readiness_score: number };
  alumni: { full_name: string; current_company: string; role_title: string };
  status: string;
}

export default function AlumniTrackingPage() {
  const [pairs, setPairs] = useState<MentorshipPair[]>([]);
  const [alumniList, setAlumniList] = useState<any[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAlumni, setSelectedAlumni] = useState<any>(null);
  const [alumniDetails, setAlumniDetails] = useState<{ referrals: any[], donations: any[] }>({ referrals: [], donations: [] });
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ totalReferrals: 0, totalDonations: 0, referralsList: [] as any[], donationsList: [] as any[] });
  const [activeModal, setActiveModal] = useState<'mentors' | 'referrals' | 'donations' | null>(null);

  const fetchPairsAndAlumni = async () => {
    try {
      setIsLoading(true);
      // Fetch Mentorship pairs
      const res = await fetch("/api/admin/alumni/match");
      if (res.ok) {
        const json = await res.json();
        setPairs(json.data || []);
      }
      
      // Fetch all alumni
      const { data: alumniData } = await supabase
        .from("alumni_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      setAlumniList(alumniData || []);

      // Fetch Recent Activity and Metrics
      const [refRes, donRes] = await Promise.all([
        supabase.from("job_referrals").select("id, created_at, role_title, company, referral_link, location, alumni:alumni_id(*)").order("created_at", { ascending: false }),
        supabase.from("donations").select("id, created_at, amount, campaign_name, alumni:alumni_id(*)").order("created_at", { ascending: false })
      ]);

      const totalReferrals = refRes.data?.length || 0;
      const totalDonations = donRes.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      setMetrics({ 
        totalReferrals, 
        totalDonations, 
        referralsList: refRes.data || [], 
        donationsList: donRes.data || [] 
      });

      const activities = [
        ...(refRes.data || []).map(r => ({ type: 'referral', ...r })),
        ...(donRes.data || []).map(d => ({ type: 'donation', ...d }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);

      setRecentActivity(activities);

    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPairsAndAlumni();
  }, []);

  const handleRowClick = async (alumni: any) => {
    setSelectedAlumni(alumni);
    setIsLoadingDetails(true);
    
    try {
      const [refRes, donRes] = await Promise.all([
        supabase.from("job_referrals").select("*").eq("alumni_id", alumni.id).order("created_at", { ascending: false }),
        supabase.from("donations").select("*").eq("alumni_id", alumni.id).order("created_at", { ascending: false })
      ]);
      
      setAlumniDetails({
        referrals: refRes.data || [],
        donations: donRes.data || []
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleMatch = async () => {
    setIsMatching(true);
    setToastMessage("");
    
    try {
      const res = await fetch("/api/admin/alumni/match", { method: "POST" });
      const json = await res.json();
      
      if (res.ok) {
        setToastMessage(json.message);
        await fetchPairsAndAlumni(); // Refresh the list
      } else {
        setToastMessage(json.error || "Failed to match.");
      }
    } catch (err) {
      console.error("Match error", err);
      setToastMessage("An error occurred during matching.");
    } finally {
      setIsMatching(false);
      setTimeout(() => setToastMessage(""), 5000); // hide toast after 5s
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setToastMessage("Triggering background LinkedIn sync...");
    
    try {
      // In production, you would pass the Cron Secret if required
      const res = await fetch("/api/cron/sync-alumni", { method: "GET" });
      const json = await res.json();
      
      if (res.ok) {
        setToastMessage(`Success: Checked ${json.totalChecked} profiles. Updated ${json.updatedCount} records.`);
        await fetchPairsAndAlumni();
      } else {
        setToastMessage(json.error || "Failed to sync.");
      }
    } catch (err) {
      console.error("Sync error", err);
      setToastMessage("An error occurred during syncing.");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setToastMessage(""), 5000);
    }
  };

  const filteredAlumni = alumniList.filter(a => 
    (a.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (a.current_company?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (a.role_title?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  const alumniColumns = [
    {
      key: "full_name",
      header: "Alumni Name",
      render: (row: any) => (
        <div>
          <span className="text-white font-medium block">{row.full_name}</span>
          <span className="text-xs text-slate-400">{row.email || 'No email'}</span>
        </div>
      ),
    },
    {
      key: "current_company",
      header: "Company",
      render: (row: any) => (
        <span className="text-cyan-400 font-medium">{row.current_company || "—"}</span>
      ),
    },
    {
      key: "role_title",
      header: "Role",
      render: (row: any) => <span className="text-slate-300">{row.role_title || "—"}</span>,
    },
    {
      key: "linkedin_url",
      header: "LinkedIn",
      render: (row: any) => row.linkedin_url ? (
        <a href={row.linkedin_url} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1">
          <Linkedin className="w-3 h-3" /> Profile
        </a>
      ) : <span className="text-slate-500 text-xs">—</span>,
    },
    {
      key: "last_synced_at",
      header: "Last Synced",
      render: (row: any) => (
        <span className="text-slate-500 text-xs">
          {row.last_synced_at ? new Date(row.last_synced_at).toLocaleDateString() : "Never"}
        </span>
      ),
    },
    {
      key: "engagement_score",
      header: "Engagement",
      render: (row: any) => (
        <span className="text-purple-400 font-bold text-xs">{row.engagement_score || 0} pts</span>
      ),
    },
    {
      key: "is_mentor",
      header: "Mentor Status",
      render: (row: any) => (
        row.is_mentor ? 
        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-full">Opted-In</span> :
        <span className="text-xs text-slate-500">Opted-Out</span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500 relative">
      {/* Modal */}
      {selectedAlumni && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a0e1a] border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-[#0a0e1a]/95 backdrop-blur-md p-6 border-b border-slate-800 flex justify-between items-start z-10">
               <div>
                  <h2 className="text-2xl font-bold text-white">{selectedAlumni.full_name}</h2>
                  <p className="text-cyan-400 text-sm mt-1">{selectedAlumni.role_title} @ {selectedAlumni.current_company}</p>
               </div>
               <button onClick={() => setSelectedAlumni(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            
            <div className="p-6 space-y-6">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                     <div className="text-xs text-slate-500 mb-1">Engagement Score</div>
                     <div className="text-xl font-bold text-purple-400">{selectedAlumni.engagement_score || 0} pts</div>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                     <div className="text-xs text-slate-500 mb-1">Mentor Status</div>
                     <div className="text-xl font-bold text-emerald-400">{selectedAlumni.is_mentor ? 'Opted-In' : 'Opted-Out'}</div>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                     <div className="text-xs text-slate-500 mb-1">Total Referrals</div>
                     <div className="text-xl font-bold text-white">{alumniDetails.referrals.length}</div>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                     <div className="text-xs text-slate-500 mb-1">Total Donated</div>
                     <div className="text-xl font-bold text-rose-400">₹{alumniDetails.donations.reduce((sum, d) => sum + Number(d.amount), 0).toLocaleString()}</div>
                  </div>
               </div>

               {isLoadingDetails ? (
                 <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-cyan-500" /></div>
               ) : (
                 <>
                   <div className="space-y-3">
                     <h3 className="font-bold text-white border-b border-slate-800 pb-2">Job Referrals ({alumniDetails.referrals.length})</h3>
                     {alumniDetails.referrals.length === 0 ? <p className="text-sm text-slate-500">No referrals posted.</p> : (
                       <div className="space-y-2">
                         {alumniDetails.referrals.map(ref => (
                           <div key={ref.id} className="p-3 bg-slate-900/30 border border-slate-800 rounded-lg flex justify-between items-center">
                             <div>
                               <div className="text-sm font-bold text-white">{ref.role_title}</div>
                               <div className="text-xs text-slate-400">{ref.location} • {new Date(ref.created_at).toLocaleDateString()}</div>
                             </div>
                             <a href={ref.referral_link} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">View Link</a>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>

                   <div className="space-y-3">
                     <h3 className="font-bold text-white border-b border-slate-800 pb-2">Donations ({alumniDetails.donations.length})</h3>
                     {alumniDetails.donations.length === 0 ? <p className="text-sm text-slate-500">No donations recorded.</p> : (
                       <div className="space-y-2">
                         {alumniDetails.donations.map(don => (
                           <div key={don.id} className="p-3 bg-slate-900/30 border border-slate-800 rounded-lg flex justify-between items-center">
                             <div>
                               <div className="text-sm font-bold text-white">{don.campaign_name}</div>
                               <div className="text-xs text-slate-400">{new Date(don.created_at).toLocaleDateString()}</div>
                             </div>
                             <div className="text-sm font-bold text-emerald-400">₹{don.amount}</div>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 </>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Lists Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a0e1a] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="bg-[#0a0e1a]/95 backdrop-blur-md p-6 border-b border-slate-800 flex justify-between items-center z-10 shrink-0">
               <h2 className="text-xl font-bold text-white capitalize flex items-center gap-2">
                 {activeModal === 'mentors' && <><Sparkles className="w-5 h-5 text-emerald-400" /> Active Mentors</>}
                 {activeModal === 'referrals' && <><Briefcase className="w-5 h-5 text-amber-400" /> All Job Referrals</>}
                 {activeModal === 'donations' && <><IndianRupee className="w-5 h-5 text-rose-400" /> All Funds Pledged</>}
               </h2>
               <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
              {activeModal === 'mentors' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {alumniList.filter(a => a.is_mentor).map(mentor => (
                    <div key={mentor.id} onClick={() => {setActiveModal(null); handleRowClick(mentor);}} className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-cyan-500/50 cursor-pointer transition-colors flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white">{mentor.full_name}</h4>
                        <p className="text-xs text-slate-400">{mentor.role_title} @ {mentor.current_company}</p>
                      </div>
                      <div className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded text-[10px] font-bold">Mentor</div>
                    </div>
                  ))}
                </div>
              )}

              {activeModal === 'referrals' && (
                <div className="space-y-3">
                  {metrics.referralsList.map(ref => (
                    <div key={ref.id} className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-between group">
                      <div>
                        <h4 className="font-bold text-white">{ref.role_title} <span className="text-amber-400 font-normal">at {ref.company}</span></h4>
                        <p className="text-xs text-slate-400 mt-1">Posted by: <button onClick={() => {setActiveModal(null); handleRowClick(ref.alumni);}} className="text-cyan-400 hover:underline">{ref.alumni?.full_name}</button> • {new Date(ref.created_at).toLocaleDateString()}</p>
                      </div>
                      <a href={ref.referral_link} target="_blank" rel="noreferrer" className="text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 hover:bg-amber-500/20 transition-colors">Apply Link</a>
                    </div>
                  ))}
                </div>
              )}

              {activeModal === 'donations' && (
                <div className="space-y-3">
                  {metrics.donationsList.map(don => (
                    <div key={don.id} className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-between group">
                      <div>
                        <h4 className="font-bold text-white">₹{don.amount.toLocaleString()} <span className="text-slate-400 font-normal text-sm">to {don.campaign_name}</span></h4>
                        <p className="text-xs text-slate-400 mt-1">Donated by: <button onClick={() => {setActiveModal(null); handleRowClick(don.alumni);}} className="text-cyan-400 hover:underline">{don.alumni?.full_name}</button> • {new Date(don.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                        <Heart className="w-4 h-4 text-rose-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Alumni Trajectory & Mentorship</h1>
          <p className="text-sm text-slate-400 mt-1">
            Turn your alumni network into an automated placement asset.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/alumni-tracking/upload"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-all border border-slate-700 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Bulk Upload CSV
          </Link>
          <button 
            onClick={handleMatch}
            disabled={isMatching}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] flex items-center gap-2 disabled:opacity-50"
          >
            {isMatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {isMatching ? "Matching..." : "Run AI Matching Algorithm"}
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2 bg-emerald-500/90 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 animate-in slide-in-from-top-4 fade-in z-50">
          <CheckCircle2 className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl bg-[#0a0e1a]/80 border border-white/[0.06] backdrop-blur-xl h-full">
            <h3 className="text-base font-bold text-white mb-4">Active Mentorship Pairs</h3>
            
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
              ) : pairs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No active pairs. Run the AI matching algorithm above!
                </div>
              ) : (
                pairs.map((pair, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between group hover:bg-white/[0.05] transition-colors">
                    <div className="flex items-center gap-4 w-[40%]">
                      <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                        <Users className="w-5 h-5 text-rose-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{pair.student?.full_name}</h4>
                        <p className="text-xs text-rose-400">At-Risk Student (Score: {pair.student?.readiness_score})</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex justify-center">
                      <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        <span className="text-xs font-bold text-indigo-400">Paired</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-[40%] justify-end text-right">
                      <div>
                        <h4 className="text-sm font-bold text-white">{pair.alumni?.full_name}</h4>
                        <p className="text-xs text-slate-400">{pair.alumni?.role_title} @ {pair.alumni?.current_company}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                        <Briefcase className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 h-full flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4">
              <Linkedin className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Automated LinkedIn Sync</h3>
            <p className="text-sm text-slate-400 mb-6 flex-1">
              The system automatically tracks alumni career changes via LinkedIn integration and updates their profiles here. A cron job runs this process on a schedule.
            </p>
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className="w-full px-4 py-3 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Linkedin className="w-4 h-4" />}
              {isSyncing ? "Scanning Profiles..." : "Force Sync Now"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
        <div 
           onClick={() => document.getElementById('alumni-directory')?.scrollIntoView({ behavior: 'smooth' })}
           className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 backdrop-blur-xl relative overflow-hidden group cursor-pointer hover:border-indigo-500/40 transition-all"
        >
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-12 h-12 text-indigo-400" />
           </div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                 <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Alumni</div>
           </div>
           <div className="text-3xl font-black text-white mt-4">{alumniList.length}</div>
           <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-indigo-400 font-bold">View Directory →</div>
        </div>
        
        <div 
           onClick={() => setActiveModal('mentors')}
           className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 backdrop-blur-xl relative overflow-hidden group cursor-pointer hover:border-emerald-500/40 transition-all"
        >
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-12 h-12 text-emerald-400" />
           </div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                 <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Mentors</div>
           </div>
           <div className="text-3xl font-black text-emerald-400 mt-4">{alumniList.filter(a => a.is_mentor).length}</div>
           <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-emerald-400 font-bold">View Mentors →</div>
        </div>

        <div 
           onClick={() => setActiveModal('referrals')}
           className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 backdrop-blur-xl relative overflow-hidden group cursor-pointer hover:border-amber-500/40 transition-all"
        >
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Briefcase className="w-12 h-12 text-amber-400" />
           </div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                 <Briefcase className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Job Referrals</div>
           </div>
           <div className="text-3xl font-black text-amber-400 mt-4">{metrics.totalReferrals}</div>
           <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-amber-400 font-bold">View Referrals →</div>
        </div>

        <div 
           onClick={() => setActiveModal('donations')}
           className="p-5 rounded-2xl bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/20 backdrop-blur-xl relative overflow-hidden group cursor-pointer hover:border-rose-500/40 transition-all"
        >
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <IndianRupee className="w-12 h-12 text-rose-400" />
           </div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                 <IndianRupee className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Funds Pledged</div>
           </div>
           <div className="text-3xl font-black text-rose-400 mt-4">₹{metrics.totalDonations.toLocaleString()}</div>
           <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-rose-400 font-bold">View Donors →</div>
        </div>
      </div>

      {/* Analytics Charts */}
      {alumniList.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
          <div className="p-6 rounded-2xl bg-[#0a0e1a]/80 border border-white/[0.06] backdrop-blur-xl">
             <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" /> Top Alumni Roles
             </h3>
             <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart 
                   data={Object.entries(alumniList.reduce((acc: any, curr) => {
                     const role = curr.role_title || 'Other';
                     acc[role] = (acc[role] || 0) + 1;
                     return acc;
                   }, {})).map(([name, value]) => ({ name, value })).sort((a: any, b: any) => b.value - a.value).slice(0, 5)}
                   layout="vertical"
                   margin={{ top: 0, right: 0, left: 40, bottom: 0 }}
                 >
                   <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                   <XAxis type="number" stroke="#475569" fontSize={12} />
                   <YAxis type="category" dataKey="name" stroke="#475569" fontSize={12} width={100} />
                   <RechartsTooltip 
                     contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                     itemStyle={{ color: '#818cf8' }}
                   />
                   <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0a0e1a]/80 border border-white/[0.06] backdrop-blur-xl">
             <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" /> Mentorship Participation
             </h3>
             <div className="h-[250px] w-full flex items-center justify-center relative">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={[
                       { name: 'Mentors', value: alumniList.filter(a => a.is_mentor).length },
                       { name: 'Not Mentoring', value: alumniList.filter(a => !a.is_mentor).length }
                     ]}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={90}
                     paddingAngle={5}
                     dataKey="value"
                     stroke="none"
                   >
                     <Cell fill="#10b981" />
                     <Cell fill="#334155" />
                   </Pie>
                   <RechartsTooltip 
                     contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                   />
                   <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                 <span className="text-2xl font-black text-white">{Math.round((alumniList.filter(a => a.is_mentor).length / Math.max(1, alumniList.length)) * 100)}%</span>
                 <span className="text-[10px] text-slate-500 uppercase">Opt-In Rate</span>
               </div>
             </div>
          </div>
        </div>
      )}

      <div className="pt-2">
        <h2 className="text-lg font-bold text-white mb-3">Live Activity Feed</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
          ) : recentActivity.length === 0 ? (
            <div className="col-span-full p-6 text-center text-slate-500 border border-slate-800 border-dashed rounded-xl">No recent activity found.</div>
          ) : (
            recentActivity.map((act) => (
              <div 
                key={act.id} 
                onClick={() => handleRowClick(act.alumni)}
                className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {act.type === 'referral' ? (
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-amber-400" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                         <Heart className="w-4 h-4 text-rose-400" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{act.alumni?.full_name}</h4>
                      <p className="text-[10px] text-slate-400">{new Date(act.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    View Details →
                  </div>
                </div>
                {act.type === 'referral' ? (
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Posted a new job referral for <span className="font-bold text-amber-400">{act.role_title}</span> at <span className="text-white">{act.company}</span>.
                  </p>
                ) : (
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Pledged <span className="font-bold text-emerald-400">₹{act.amount.toLocaleString()}</span> to the <span className="text-white">{act.campaign_name}</span> campaign.
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Alumni Directory ({alumniList.length})</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by name, company or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 w-64"
            />
          </div>
        </div>
        <DataTable 
          columns={alumniColumns} 
          data={filteredAlumni} 
          isLoading={isLoading} 
          emptyMessage="No alumni found matching your search."
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
}
