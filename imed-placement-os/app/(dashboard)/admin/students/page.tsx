"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/shared/GlassCard";
import { DataTable } from "@/components/shared/DataTable";

const supabase = createClient();

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    const { data } = await supabase
      .from("student_profiles")
      .select("*")
      .order("full_name", { ascending: true });
    setStudents(data || []);
    setLoading(false);
  }

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append("csv", file);

    try {
      const res = await fetch("/api/admin/students/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      setImportResult({
        success: res.ok,
        message: res.ok 
          ? `Successfully imported ${data.imported} out of ${data.total} students.` 
          : data.error,
        errors: data.errors || [],
      });

      if (res.ok) {
        setFile(null);
        loadStudents(); // reload the table
      }
    } catch (err: any) {
      setImportResult({ success: false, message: err.message, errors: [] });
    } finally {
      setImporting(false);
    }
  };

  const columns = [
    {
      key: "full_name",
      header: "Name",
      render: (row: any) => <span className="text-white font-medium">{row.full_name}</span>,
    },
    {
      key: "enrollment_no",
      header: "Enrollment No.",
      render: (row: any) => <span className="text-slate-300 font-mono text-xs">{row.enrollment_no || "—"}</span>,
    },
    {
      key: "email",
      header: "Email",
      render: (row: any) => <span className="text-slate-400 text-sm">{row.email}</span>,
    },
    {
      key: "branch",
      header: "Branch",
      render: (row: any) => <span className="text-cyan-400">{row.branch || "—"}</span>,
    },
    {
      key: "cgpa",
      header: "CGPA",
      render: (row: any) => <span className="text-amber-400 font-bold">{row.cgpa || "—"}</span>,
    },
    {
      key: "role",
      header: "System Role",
      render: (row: any) => (
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
          row.role === "admin" 
            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
            : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
        }`}>
          {row.role}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold gradient-text mb-1">Student Management</h1>
          <p className="text-slate-400 text-sm">Manage student profiles and bulk import batches via CSV.</p>
        </div>
      </div>

      <GlassCard className="border-cyan-500/20">
        <h3 className="text-white font-semibold mb-4">Bulk Import Students</h3>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1 w-full">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-xl file:border-0
                file:text-sm file:font-semibold
                file:bg-cyan-500/10 file:text-cyan-400
                hover:file:bg-cyan-500/20 cursor-pointer transition-all
                border border-slate-800 rounded-xl p-2 bg-slate-950/50"
            />
            <p className="text-xs text-slate-500 mt-2">
              Required CSV columns: <span className="font-mono text-cyan-400">full_name, email</span>. Optional: enrollment_no, branch, batch_year, cgpa, role.
            </p>
          </div>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-cyan-500 disabled:opacity-50 transition-all glow-cyan whitespace-nowrap"
          >
            {importing ? "Importing Data..." : "Execute Bulk Import"}
          </button>
        </div>

        {importResult && (
          <div className={`mt-4 p-4 rounded-xl border text-sm ${
            importResult.success ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}>
            <p className="font-bold">{importResult.message}</p>
            {importResult.errors?.length > 0 && (
              <ul className="mt-2 list-disc pl-5 space-y-1 text-xs">
                {importResult.errors.map((err: string, i: number) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </GlassCard>

      <DataTable 
        columns={columns} 
        data={students} 
        isLoading={loading} 
        emptyMessage="No students found. Use the bulk import tool to add them."
      />
    </div>
  );
}
