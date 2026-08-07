"use client";

import React, { useState, useEffect } from "react";
import { Briefcase, Building, MapPin, ExternalLink, Search, MessageCircle } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { createClient } from "@/lib/supabase/client";
import { ChatWindow } from "@/components/shared/ChatWindow";

export default function StudentReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeChat, setActiveChat] = useState<{ userId: string; name: string; role?: string } | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      // We fetch job_referrals and join with alumni_profiles to get the alumni name
      const { data, error } = await supabase
        .from("job_referrals")
        .select(`
          *,
          alumni:alumni_id ( full_name, role_title )
        `)
        .order("created_at", { ascending: false });
        
      if (!error && data) {
        setReferrals(data);
      }
      setIsLoading(false);
    }
    loadData();
  }, [supabase]);

  const filteredReferrals = referrals.filter(r => 
    r.role_title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Alumni Job Referrals</h1>
          <p className="text-sm text-slate-400 mt-1">
            Exclusive job opportunities referred by IMED Alumni at top companies.
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search roles or companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/50 w-full md:w-64"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
        </div>
      ) : filteredReferrals.length === 0 ? (
        <div className="text-center p-12 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <Briefcase className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-white font-medium">No referrals found</h3>
          <p className="text-sm text-slate-500 mt-1">Check back later for new opportunities from our alumni network.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReferrals.map(ref => (
            <GlassCard key={ref.id} padding="lg" className="flex flex-col h-full group hover:bg-slate-800/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">{ref.role_title}</h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-amber-400" />
                      {ref.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      {ref.location}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 bg-slate-900/50 rounded-xl p-4 border border-slate-800 mb-4">
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{ref.description}</p>
              </div>
              
                <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-auto gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                      {ref.alumni?.full_name?.[0] || "?"}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Referred by <span className="text-white font-medium">{ref.alumni?.full_name || "Alumni"}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {ref.alumni_id && (
                      <button
                        onClick={() => setActiveChat({
                          userId: ref.alumni_id,
                          name: ref.alumni?.full_name || "Alumni",
                          role: ref.alumni?.role_title,
                        })}
                        className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 text-indigo-400 text-xs font-bold rounded-lg transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Message
                      </button>
                    )}
                    <a
                      href={ref.referral_link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Apply <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Floating Chat Window */}
      {activeChat && (
        <ChatWindow
          otherUserId={activeChat.userId}
          otherUserName={activeChat.name}
          otherUserRole={activeChat.role}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
}
