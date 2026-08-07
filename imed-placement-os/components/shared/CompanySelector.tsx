"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  company_name: string;
  role_title: string;
  raw_requirements: string;
}

interface CompanySelectorProps {
  onSelect: (job: Job) => void;
  selectedJob?: Job | null;
  className?: string;
}

export function CompanySelector({
  onSelect,
  selectedJob,
  className,
}: CompanySelectorProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch("/api/corporate-jobs");
        if (res.ok) {
          const data = await res.json();
          setJobs(data.jobs || []);
        }
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchJobs();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = jobs.filter(
    (j) =>
      j.company_name.toLowerCase().includes(query.toLowerCase()) ||
      j.role_title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
        Target Company & Role
      </label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full bg-slate-950/50 border rounded-xl p-3 text-sm cursor-pointer transition-all flex items-center justify-between",
          isOpen ? "border-cyan-500/50 ring-1 ring-cyan-500/20" : "border-slate-800"
        )}
      >
        {selectedJob ? (
          <span className="text-white">
            {selectedJob.company_name} — {selectedJob.role_title}
          </span>
        ) : (
          <span className="text-slate-500">Select a target company & role...</span>
        )}
        <svg
          className={cn(
            "w-4 h-4 text-slate-400 transition-transform",
            isOpen && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-slide-in-up">
          <div className="p-2 border-b border-slate-800">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search companies or roles..."
              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-4 text-center text-cyan-400 text-sm animate-pulse">
                Loading corporate jobs...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">
                No matching jobs found
              </div>
            ) : (
              filtered.map((job) => (
                <button
                  key={job.id}
                  onClick={() => {
                    onSelect(job);
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-cyan-500/10 transition-colors border-b border-slate-800/50 last:border-0",
                    selectedJob?.id === job.id && "bg-cyan-500/10"
                  )}
                >
                  <span className="text-sm font-medium text-white block">
                    {job.company_name}
                  </span>
                  <span className="text-xs text-slate-400">{job.role_title}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
