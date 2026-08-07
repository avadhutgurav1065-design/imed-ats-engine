"use client";

import React, { useState, useEffect } from "react";
import { Users, Loader2, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { createClient } from "@/lib/supabase/client";

export default function MentorshipOptInPage() {
  const [profile, setProfile] = useState<any>(null);
  const [isMentor, setIsMentor] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
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
        if (data) {
          setProfile(data);
          setIsMentor(data.is_mentor || false);
        }
      }
    }
    loadData();
  }, [supabase]);

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    setToastMessage("");
    
    try {
      const { error } = await supabase
        .from("alumni_profiles")
        .update({ is_mentor: isMentor })
        .eq("id", profile.id);

      if (error) throw error;
      setToastMessage("Preferences updated successfully! (+50 Engagement Points)");
    } catch (err: any) {
      console.error(err);
      setToastMessage("Failed to update preferences.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setToastMessage(""), 5000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Mentorship Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Give back to the IMED community by mentoring struggling students.
        </p>
      </div>

      {toastMessage && (
        <div className="bg-emerald-500/90 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 animate-in slide-in-from-top-4 fade-in">
          <CheckCircle2 className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      <GlassCard padding="lg">
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 shrink-0">
            <Users className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">IMED AI Matching Program</h3>
            <p className="text-sm text-slate-400 mt-1">
              By opting in, our AI will automatically pair you with a 3rd or 4th-year student who is struggling with interviews or technical skills relevant to your current role at {profile?.current_company || "your company"}.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-white">Available for Mentorship</h4>
            <p className="text-xs text-slate-400 mt-1">Allow students to be matched with you.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={isMentor}
              onChange={(e) => setIsMentor(e.target.checked)}
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
          </label>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Preferences
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
