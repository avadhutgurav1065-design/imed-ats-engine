"use client";

import React, { useState, useEffect } from "react";
import { Heart, TrendingUp, Users, DollarSign, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { DataTable } from "@/components/shared/DataTable";
import { createClient } from "@/lib/supabase/client";

export default function FundraisingPage() {
  const [donations, setDonations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase
        .from("donations")
        .select(`
          *,
          alumni:alumni_id ( full_name, email, current_company )
        `)
        .order("created_at", { ascending: false });
        
      if (!error && data) {
        setDonations(data);
      }
      setIsLoading(false);
    }
    loadData();
  }, [supabase]);

  const totalRaised = donations.reduce((sum, d) => sum + Number(d.amount), 0);
  const topDonors = [...donations].sort((a, b) => b.amount - a.amount).slice(0, 3);
  const totalDonors = new Set(donations.map(d => d.alumni_id)).size;

  const columns = [
    {
      key: "alumni",
      header: "Alumni Donor",
      render: (row: any) => (
        <div>
          <span className="text-white font-medium block">{row.alumni?.full_name || "Unknown"}</span>
          <span className="text-xs text-slate-400">{row.alumni?.current_company || "No company"}</span>
        </div>
      ),
    },
    {
      key: "campaign_name",
      header: "Campaign",
      render: (row: any) => <span className="text-slate-300 font-medium">{row.campaign_name}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      render: (row: any) => <span className="text-emerald-400 font-bold">₹{row.amount.toLocaleString()}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row: any) => (
        <span className={`text-xs font-bold uppercase ${row.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Date",
      render: (row: any) => (
        <span className="text-slate-500 text-xs">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Fundraising & Giving</h1>
        <p className="text-sm text-slate-400 mt-1">
          Track alumni donations and manage active institutional campaigns.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard padding="sm" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
            <DollarSign className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Raised</p>
            <h3 className="text-2xl font-black text-white">₹{totalRaised.toLocaleString()}</h3>
          </div>
        </GlassCard>
        
        <GlassCard padding="sm" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
            <Heart className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Donations</p>
            <h3 className="text-2xl font-black text-white">{donations.length}</h3>
          </div>
        </GlassCard>

        <GlassCard padding="sm" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
            <Users className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Unique Donors</p>
            <h3 className="text-2xl font-black text-white">{totalDonors}</h3>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white mb-2">Recent Pledges & Donations</h3>
          <DataTable 
            columns={columns} 
            data={donations} 
            isLoading={isLoading} 
            emptyMessage="No donations found." 
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white mb-2">Top Donors</h3>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>
          ) : topDonors.length === 0 ? (
             <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 text-sm">No donors yet.</div>
          ) : (
            topDonors.map((don, idx) => (
              <GlassCard key={don.id} padding="sm" className="flex items-center justify-between border-l-4 border-l-emerald-500">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{don.alumni?.full_name || "Anonymous"}</p>
                    <p className="text-[10px] text-slate-400">{don.campaign_name}</p>
                  </div>
                </div>
                <div className="text-emerald-400 font-bold">
                  ₹{Number(don.amount).toLocaleString()}
                </div>
              </GlassCard>
            ))
          )}
          
          <div className="mt-8">
             <h3 className="text-lg font-bold text-white mb-4">Active Campaigns</h3>
             <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                   <div className="flex justify-between items-end mb-2">
                      <span className="font-bold text-sm text-white">Scholarship Fund</span>
                      <span className="text-xs text-emerald-400">₹{donations.filter(d => d.campaign_name === 'Scholarship Fund').reduce((sum, d) => sum + Number(d.amount), 0).toLocaleString()} raised</span>
                   </div>
                   <div className="w-full bg-slate-800 rounded-full h-1.5">
                     <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                   </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                   <div className="flex justify-between items-end mb-2">
                      <span className="font-bold text-sm text-white">New Computer Lab</span>
                      <span className="text-xs text-rose-400">₹{donations.filter(d => d.campaign_name === 'New Computer Lab').reduce((sum, d) => sum + Number(d.amount), 0).toLocaleString()} raised</span>
                   </div>
                   <div className="w-full bg-slate-800 rounded-full h-1.5">
                     <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: '30%' }}></div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
