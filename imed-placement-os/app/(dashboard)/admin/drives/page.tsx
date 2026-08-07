"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { GlassCard } from "@/components/shared/GlassCard";
import { DataTable } from "@/components/shared/DataTable";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DrivesPage() {
  const [drives, setDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    company_name: "",
    role_title: "",
    drive_date: "",
    max_slots: 100,
    min_match_score: 75,
    status: "upcoming",
    job_id: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDrives();
    loadJobs();
  }, []);

  async function loadDrives() {
    const { data } = await supabase
      .from("campus_drives")
      .select("*")
      .order("drive_date", { ascending: true });
    setDrives(data || []);
    setLoading(false);
  }

  async function loadJobs() {
    const res = await fetch("/api/corporate-jobs");
    if (res.ok) {
      const data = await res.json();
      setJobs(data.jobs || []);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from("campus_drives").insert(formData);
      if (error) throw error;

      setShowForm(false);
      setFormData({
        company_name: "",
        role_title: "",
        drive_date: "",
        max_slots: 100,
        min_match_score: 75,
        status: "upcoming",
        job_id: "",
      });
      loadDrives();
    } catch (err: any) {
      alert("Failed to create drive: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: "company_name",
      header: "Company",
      render: (row: any) => (
        <span className="text-white font-medium">{row.company_name}</span>
      ),
    },
    {
      key: "role_title",
      header: "Role",
      render: (row: any) => <span className="text-slate-300">{row.role_title}</span>,
    },
    {
      key: "drive_date",
      header: "Date",
      render: (row: any) => (
        <span className="text-slate-400 text-sm">
          {row.drive_date ? new Date(row.drive_date).toLocaleDateString() : "TBD"}
        </span>
      ),
    },
    {
      key: "max_slots",
      header: "Slots",
      render: (row: any) => <span className="text-cyan-400 font-bold">{row.max_slots}</span>,
    },
    {
      key: "min_match_score",
      header: "Min Score",
      render: (row: any) => (
        <span className="text-amber-400 font-medium">{row.min_match_score}%</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: any) => {
        const colors: Record<string, string> = {
          upcoming: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
          active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          completed: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        };
        return (
          <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full border ${colors[row.status] || colors.upcoming}`}>
            {row.status}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold gradient-text mb-1">Campus Drives</h1>
          <p className="text-slate-400 text-sm">Create and manage campus placement drives.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-cyan-500 transition-all text-sm"
        >
          {showForm ? "Cancel" : "+ New Drive"}
        </button>
      </div>

      {showForm && (
        <GlassCard className="animate-slide-in-up">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Company Name</label>
                <input
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="e.g. Infosys"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Role Title</label>
                <input
                  required
                  value={formData.role_title}
                  onChange={(e) => setFormData({ ...formData, role_title: e.target.value })}
                  placeholder="e.g. Systems Engineer"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Drive Date</label>
                <input
                  type="date"
                  value={formData.drive_date}
                  onChange={(e) => setFormData({ ...formData, drive_date: e.target.value })}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Max Slots</label>
                <input
                  type="number"
                  value={formData.max_slots}
                  onChange={(e) => setFormData({ ...formData, max_slots: parseInt(e.target.value) || 100 })}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Min Match Score (%)</label>
                <input
                  type="number"
                  value={formData.min_match_score}
                  onChange={(e) => setFormData({ ...formData, min_match_score: parseInt(e.target.value) || 75 })}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Link to Job Profile</label>
                <select
                  value={formData.job_id}
                  onChange={(e) => setFormData({ ...formData, job_id: e.target.value })}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="">None (standalone)</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>{j.company_name} — {j.role_title}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-cyan-500 disabled:opacity-50 transition-all"
            >
              {saving ? "Creating..." : "Create Drive"}
            </button>
          </form>
        </GlassCard>
      )}

      <DataTable columns={columns} data={drives} isLoading={loading} emptyMessage="No drives configured yet." />
    </div>
  );
}
