"use client";

import React, { useState, useEffect } from "react";
import { Building2, Copy, Send, Sparkles, Loader2 } from "lucide-react";

interface DriveLink {
  id: string;
  company_name: string;
  magic_token: string;
  status: string;
  views: number;
  matched_students: number;
}

export default function CorporateDriveLinkPage() {
  const [links, setLinks] = useState<DriveLink[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLinks = async () => {
    try {
      const res = await fetch("/api/admin/drive-links");
      if (res.ok) {
        const json = await res.json();
        setLinks(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch links", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleGenerate = async () => {
    if (!companyName.trim()) return;
    setIsGenerating(true);
    
    try {
      const res = await fetch("/api/admin/drive-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName })
      });
      
      if (res.ok) {
        setCompanyName("");
        await fetchLinks(); // Refresh the list
      }
    } catch (err) {
      console.error("Failed to generate link", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/drive/${token}`;
    navigator.clipboard.writeText(url);
    alert("Magic link copied to clipboard!");
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Corporate "Drive-Link" Portal</h1>
          <p className="text-sm text-slate-400 mt-1">
            Make it so easy for recruiters to hire your students that they never go to another college.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-8 rounded-2xl bg-gradient-to-br from-[#0a0e1a]/90 to-[#070a13] border border-cyan-500/20 backdrop-blur-xl relative overflow-hidden h-fit">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px]" />
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-3 rounded-xl bg-cyan-500/20">
              <Building2 className="w-6 h-6 text-cyan-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Generate Magic Link</h2>
          </div>

          <p className="text-sm text-slate-400 mb-6 relative z-10">
            Send this link to HR recruiters. They paste their JD, and our AI instantly returns a list of the top perfectly matched students from the college.
          </p>

          <div className="flex flex-col gap-4 relative z-10">
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                Company Name
              </label>
              <input 
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Google, TCS, Microsoft" 
                className="w-full bg-[#070a13] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !companyName.trim()}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isGenerating ? "Generating..." : "Generate Unique Drive-Link"}
            </button>
          </div>
        </div>

        <div className="p-8 rounded-2xl bg-[#0a0e1a]/80 border border-white/[0.06] backdrop-blur-xl flex flex-col">
          <h3 className="text-base font-bold text-white mb-6">Active Corporate Links</h3>
          
          <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            ) : links.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No active drive links. Generate one on the left.
              </div>
            ) : (
              links.map((link) => (
                <div key={link.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between group hover:bg-white/[0.05] transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-white">{link.company_name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className={link.status === "Active" ? "text-emerald-400" : "text-amber-400"}>
                        • {link.status}
                      </span>
                      <span>{link.views} Recruiter Views</span>
                      <span>{link.matched_students} Students Matched</span>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => copyToClipboard(link.magic_token)}
                      className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 transition-colors" 
                      title="Copy Link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-colors" title="Send Email">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
