"use client";

import React, { useState, useEffect } from "react";
import { Briefcase, Loader2, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { createClient } from "@/lib/supabase/client";

export default function JobReferralsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  const [formData, setFormData] = useState({
    role_title: "",
    location: "",
    description: "",
    referral_link: ""
  });

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
        const { data: refData } = await supabase
          .from("job_referrals")
          .select("*")
          .eq("alumni_id", profileData.id)
          .order("created_at", { ascending: false });
        setReferrals(refData || []);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("job_referrals")
        .insert([{
          alumni_id: profile.id,
          company: profile.current_company,
          role_title: formData.role_title,
          location: formData.location,
          description: formData.description,
          referral_link: formData.referral_link
        }]);

      if (error) throw error;
      
      setToastMessage("Referral posted successfully! (+20 Engagement Points)");
      setFormData({ role_title: "", location: "", description: "", referral_link: "" });
      loadData();
    } catch (err: any) {
      console.error(err);
      setToastMessage("Failed to post referral.");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMessage(""), 5000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Post a Referral</h1>
        <p className="text-sm text-slate-400 mt-1">
          Share exclusive job openings at {profile?.current_company || "your company"} with IMED students.
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
          <h3 className="text-lg font-bold text-white mb-6">New Referral</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Company</label>
              <input type="text" disabled value={profile?.current_company || ""} className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm opacity-50 cursor-not-allowed" />
              <p className="text-[10px] text-slate-500 mt-1">This is automatically synced from your profile.</p>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Role Title</label>
              <input required type="text" value={formData.role_title} onChange={e => setFormData({...formData, role_title: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500/50" placeholder="e.g. Software Engineer Intern" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Location</label>
              <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500/50" placeholder="e.g. Remote / Bangalore" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Referral Link / Email</label>
              <input required type="text" value={formData.referral_link} onChange={e => setFormData({...formData, referral_link: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500/50" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Description</label>
              <textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500/50" placeholder="Briefly describe the requirements..." />
            </div>
            <button type="submit" disabled={isSubmitting || !profile?.current_company} className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(217,119,6,0.4)] flex items-center justify-center gap-2 disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
              Post Referral
            </button>
          </form>
        </GlassCard>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white mb-2">Your Past Referrals</h3>
          {referrals.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 text-sm">
              You haven't posted any referrals yet.
            </div>
          ) : (
            referrals.map(ref => (
              <div key={ref.id} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-amber-500/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-white text-sm">{ref.role_title}</h4>
                  <span className="text-xs text-slate-500">{new Date(ref.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-amber-400 mb-2">{ref.company} • {ref.location}</p>
                <p className="text-xs text-slate-400 line-clamp-2">{ref.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
