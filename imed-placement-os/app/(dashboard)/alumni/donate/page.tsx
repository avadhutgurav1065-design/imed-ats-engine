"use client";

import React, { useState, useEffect } from "react";
import { Heart, Loader2, CheckCircle2, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { createClient } from "@/lib/supabase/client";

export default function DonatePage() {
  const [profile, setProfile] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [isPledging, setIsPledging] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [amount, setAmount] = useState<number>(5000);
  const [campaign, setCampaign] = useState("Scholarship Fund");
  
  const supabase = createClient();

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profileData } = await supabase
        .from("alumni_profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (profileData) {
        setProfile(profileData);
        const { data: donData } = await supabase
          .from("donations")
          .select("*")
          .eq("alumni_id", profileData.id)
          .order("created_at", { ascending: false });
        setDonations(donData || []);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [supabase]);

  const handlePledge = async () => {
    if (!profile || amount <= 0) return;
    setIsPledging(true);
    setToastMessage("");
    
    try {
      const { error } = await supabase
        .from("donations")
        .insert([{
          alumni_id: profile.id,
          amount: amount,
          campaign_name: campaign,
          status: "pledged"
        }]);

      if (error) throw error;
      
      setToastMessage(`Pledged ₹${amount} successfully! (+100 Engagement Points)`);
      loadData();
    } catch (err: any) {
      console.error(err);
      setToastMessage("Failed to process pledge.");
    } finally {
      setIsPledging(false);
      setTimeout(() => setToastMessage(""), 5000);
    }
  };

  const predefinedAmounts = [1000, 5000, 10000, 50000];

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Give Back to IMED</h1>
        <p className="text-sm text-slate-400 mt-1">
          Support the next generation of students through our active campaigns.
        </p>
      </div>

      {toastMessage && (
        <div className="bg-emerald-500/90 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard padding="lg">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Make a Pledge</h3>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs text-slate-400 mb-2">Select Campaign</label>
              <select 
                value={campaign} 
                onChange={(e) => setCampaign(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-rose-500/50 appearance-none"
              >
                <option value="Scholarship Fund">Student Scholarship Fund</option>
                <option value="New Computer Lab">Computer Lab Upgrade 2026</option>
                <option value="Library Expansion">Library Expansion Project</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">Pledge Amount (₹)</label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {predefinedAmounts.map(amt => (
                  <button 
                    key={amt} 
                    onClick={() => setAmount(amt)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all border ${amount === amt ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
              <input 
                type="number" 
                value={amount} 
                onChange={e => setAmount(Number(e.target.value))} 
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-rose-500/50" 
              />
            </div>

            <button 
              onClick={handlePledge}
              disabled={isPledging || amount <= 0} 
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(225,29,72,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {isPledging ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Pledge ₹{amount}
            </button>
            <p className="text-[10px] text-slate-500 text-center">In this MVP, pledges are recorded but no actual payment is processed.</p>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white mb-2">Your Contribution History</h3>
          {donations.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 text-sm flex flex-col items-center">
               <Heart className="w-8 h-8 text-slate-700 mb-2" />
               You haven't made any pledges yet.
            </div>
          ) : (
            donations.map(don => (
              <div key={don.id} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex justify-between items-center group hover:bg-slate-800/50 transition-colors">
                <div>
                  <h4 className="font-bold text-white text-sm">{don.campaign_name}</h4>
                  <span className="text-xs text-slate-500">{new Date(don.created_at).toLocaleDateString()}</span>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <div className="text-emerald-400 font-bold">₹{don.amount}</div>
                    <div className={`text-[10px] uppercase font-bold ${don.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>{don.status}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
