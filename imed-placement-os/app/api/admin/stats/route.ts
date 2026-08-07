import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "overview";

    if (type === "overview") {
      // KPI summary stats
      const [analysesRes, profilesRes, drivesRes] = await Promise.all([
        supabase.from("gap_analyses").select("match_score, missing_skills, student_name"),
        supabase.from("student_profiles").select("id, branch, batch_year"),
        supabase.from("campus_drives").select("id, status"),
      ]);

      const analyses = analysesRes.data || [];
      const profiles = profilesRes.data || [];
      const drives = drivesRes.data || [];

      const totalScans = analyses.length;
      const avgScore =
        totalScans > 0
          ? Math.round(
              analyses.reduce((sum, a) => sum + (a.match_score || 0), 0) / totalScans
            )
          : 0;
      const readyStudents = analyses.filter((a) => (a.match_score || 0) >= 75).length;
      const atRiskStudents = analyses.filter((a) => (a.match_score || 0) < 75).length;
      const totalStudents = profiles.length;
      const upcomingDrives = drives.filter((d) => d.status === "upcoming").length;

      return NextResponse.json({
        totalScans,
        avgScore,
        readyStudents,
        atRiskStudents,
        totalStudents,
        upcomingDrives,
      });
    }

    if (type === "skill-radar") {
      const branch = url.searchParams.get("branch");
      const batchYear = url.searchParams.get("batch_year");

      let query = supabase.from("gap_analyses").select("missing_skills");

      // If we have branch/batchYear filters, we need to join with profiles
      const { data: analyses, error } = await query;
      if (error) throw error;

      // Aggregate missing skills across all scans
      const skillCounts: Record<string, number> = {};
      (analyses || []).forEach((a) => {
        try {
          const skills =
            typeof a.missing_skills === "string"
              ? JSON.parse(a.missing_skills)
              : a.missing_skills || [];
          if (Array.isArray(skills)) {
            skills.forEach((skill: string) => {
              const normalized = skill.trim();
              if (normalized) {
                skillCounts[normalized] = (skillCounts[normalized] || 0) + 1;
              }
            });
          }
        } catch {
          // skip unparseable entries
        }
      });

      const radarData = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([skill, count]) => ({
          skill,
          count,
          percentage: Math.round((count / (analyses?.length || 1)) * 100),
        }));

      return NextResponse.json({ radarData, totalScans: analyses?.length || 0 });
    }

    if (type === "risk-telemetry") {
      const { data: analyses, error } = await supabase
        .from("gap_analyses")
        .select("*")
        .lt("match_score", 75)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get action plan completion rates
      const atRiskStudents = await Promise.all(
        (analyses || []).map(async (analysis) => {
          const { data: progress } = await supabase
            .from("action_plan_progress")
            .select("is_completed")
            .eq("analysis_id", analysis.id);

          const totalItems = progress?.length || 0;
          const completedItems = progress?.filter((p) => p.is_completed).length || 0;

          return {
            ...analysis,
            remediation_total: totalItems,
            remediation_completed: completedItems,
            remediation_rate:
              totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
          };
        })
      );

      return NextResponse.json({ atRiskStudents });
    }

    if (type === "match-router") {
      const driveId = url.searchParams.get("drive_id");
      const minScore = parseInt(url.searchParams.get("min_score") || "75");

      const { data: qualifiedStudents, error } = await supabase
        .from("gap_analyses")
        .select("*")
        .gte("match_score", minScore)
        .order("match_score", { ascending: false });

      if (error) throw error;

      return NextResponse.json({ qualifiedStudents: qualifiedStudents || [] });
    }

    return NextResponse.json({ error: "Unknown stats type" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin Stats Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
