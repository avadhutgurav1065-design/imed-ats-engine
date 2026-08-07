import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const format = url.searchParams.get("format") || "csv";
    const type = url.searchParams.get("type") || "full-report";

    if (type === "roster") {
      // Pre-vetted CSV for corporate HR
      const minScore = parseInt(url.searchParams.get("min_score") || "75");

      const { data: students, error } = await supabase
        .from("gap_analyses")
        .select("student_name, match_score, missing_skills, job_role, target_company, created_at")
        .gte("match_score", minScore)
        .order("match_score", { ascending: false });

      if (error) throw error;

      const csvHeaders = [
        "Student Name",
        "Match Score (%)",
        "Target Role",
        "Target Company",
        "Missing Skills",
        "Scan Date",
      ];

      const csvRows = (students || []).map((s) => [
        s.student_name || "N/A",
        s.match_score,
        s.job_role || "N/A",
        s.target_company || "N/A",
        typeof s.missing_skills === "string"
          ? s.missing_skills.replace(/[\[\]"]/g, "")
          : "",
        s.created_at ? new Date(s.created_at).toLocaleDateString() : "N/A",
      ]);

      const csv = [
        csvHeaders.join(","),
        ...csvRows.map((row) =>
          row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="imed_placement_roster_${Date.now()}.csv"`,
        },
      });
    }

    if (type === "naac-report") {
      // NAAC/NBA report with comprehensive placement data
      const [analysesRes, profilesRes, drivesRes, interviewsRes] = await Promise.all([
        supabase.from("gap_analyses").select("*").order("created_at", { ascending: false }),
        supabase.from("student_profiles").select("*"),
        supabase.from("campus_drives").select("*"),
        supabase.from("interview_logs").select("*"),
      ]);

      const analyses = analysesRes.data || [];
      const profiles = profilesRes.data || [];
      const drives = drivesRes.data || [];
      const interviews = interviewsRes.data || [];

      const totalStudents = profiles.length;
      const totalScans = analyses.length;
      const avgScore =
        totalScans > 0
          ? Math.round(analyses.reduce((s, a) => s + (a.match_score || 0), 0) / totalScans)
          : 0;
      const readyStudents = analyses.filter((a) => (a.match_score || 0) >= 75).length;
      const totalInterviews = interviews.length;

      // Aggregate missing skills
      const skillCounts: Record<string, number> = {};
      analyses.forEach((a) => {
        try {
          const skills =
            typeof a.missing_skills === "string"
              ? JSON.parse(a.missing_skills)
              : a.missing_skills || [];
          if (Array.isArray(skills)) {
            skills.forEach((skill: string) => {
              const normalized = skill.trim();
              if (normalized) skillCounts[normalized] = (skillCounts[normalized] || 0) + 1;
            });
          }
        } catch {}
      });

      const topDeficits = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      const csvHeaders = [
        "NAAC/NBA Placement Readiness Report — IMED Bharati Vidyapeeth",
        "",
        "Report Generated," + new Date().toLocaleString(),
        "",
        "SUMMARY METRICS",
        "Total Registered Students," + totalStudents,
        "Total ATS Scans Conducted," + totalScans,
        "Average Match Score (%)," + avgScore,
        "Students Meeting 75% Threshold," + readyStudents,
        "AI Interview Sessions Completed," + totalInterviews,
        "Campus Drives Configured," + drives.length,
        "",
        "TOP 10 BATCH-WIDE SKILL DEFICITS",
        "Skill,Student Count Lacking",
        ...topDeficits.map(([skill, count]) => `${skill},${count}`),
        "",
        "STUDENT-WISE SCAN TELEMETRY",
        "Student Name,Match Score (%),Target Role,Missing Skills,Scan Date",
        ...analyses.map((a) =>
          [
            `"${a.student_name || "N/A"}"`,
            a.match_score || 0,
            `"${a.job_role || "N/A"}"`,
            `"${typeof a.missing_skills === "string" ? a.missing_skills.replace(/[\[\]"]/g, "") : ""}"`,
            a.created_at ? new Date(a.created_at).toLocaleDateString() : "N/A",
          ].join(",")
        ),
      ];

      const csv = csvHeaders.join("\n");

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="IMED_NAAC_Placement_Report_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
  } catch (error: any) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
