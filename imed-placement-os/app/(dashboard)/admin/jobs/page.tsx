"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { DataTable } from "@/components/shared/DataTable";

export default function JobIngestionPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [targetCompanies, setTargetCompanies] = useState("TCS, Infosys, Wipro, Capgemini, Cognizant");
  const [scrapeResult, setScrapeResult] = useState<any>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      const res = await fetch("/api/corporate-jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleScrape = async () => {
    const companies = targetCompanies.split(",").map((c) => c.trim()).filter(Boolean);
    if (companies.length === 0) return;

    setScraping(true);
    setScrapeResult(null);
    try {
      const res = await fetch("/api/jobs/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companies, location: "Pune, India" }),
      });
      const data = await res.json();
      
      setScrapeResult({
        success: res.ok,
        message: data.stubMode 
          ? "Stub Mode: Configure RAPIDAPI_KEY to enable live scraping." 
          : `Successfully ingested ${data.ingested || 0} new job profiles.`,
        details: data,
      });

      if (res.ok && !data.stubMode) {
        loadJobs();
      }
    } catch (err: any) {
      setScrapeResult({ success: false, message: err.message });
    } finally {
      setScraping(false);
    }
  };

  const columns = [
    {
      key: "company_name",
      header: "Company",
      render: (row: any) => <span className="text-white font-bold">{row.company_name}</span>,
    },
    {
      key: "role_title",
      header: "Role Profile",
      render: (row: any) => <span className="text-cyan-400 font-medium">{row.role_title}</span>,
    },
    {
      key: "raw_requirements",
      header: "JD Length",
      render: (row: any) => (
        <span className="text-slate-400 text-sm">
          {row.raw_requirements?.length || 0} chars
        </span>
      ),
    },
    {
      key: "vectorized",
      header: "Vector Status",
      render: () => (
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
          Vectorized
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-extrabold gradient-text mb-1">
          Corporate JD Ingestion Engine
        </h1>
        <p className="text-slate-400 text-sm">
          Automate scraping of LinkedIn job descriptions and vectorize them via Gemini for student matching.
        </p>
      </div>

      <GlassCard>
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Live LinkedIn Scraper
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Target Companies (comma separated)
            </label>
            <input
              type="text"
              value={targetCompanies}
              onChange={(e) => setTargetCompanies(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>
          
          <button
            onClick={handleScrape}
            disabled={scraping || !targetCompanies}
            className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-cyan-500 disabled:opacity-50 transition-all glow-cyan flex justify-center items-center gap-2"
          >
            {scraping ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Scraping & Vectorizing...
              </>
            ) : (
              "Trigger Ingestion Pipeline"
            )}
          </button>

          {scrapeResult && (
            <div className={`p-4 rounded-xl border text-sm ${
              scrapeResult.success ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}>
              {scrapeResult.message}
            </div>
          )}
        </div>
      </GlassCard>

      <div className="flex justify-between items-end">
        <h3 className="text-white font-bold">Ingested Job Profiles ({jobs.length})</h3>
      </div>
      
      <DataTable
        columns={columns}
        data={jobs}
        isLoading={loading}
        emptyMessage="No job profiles ingested yet."
      />
    </div>
  );
}
