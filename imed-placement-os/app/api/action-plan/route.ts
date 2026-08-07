import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET action plan items for a specific gap_analysis
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const analysisId = url.searchParams.get("analysis_id");
    const studentId = url.searchParams.get("student_id");

    if (!analysisId && !studentId) {
      return NextResponse.json({ error: "Missing analysis_id or student_id" }, { status: 400 });
    }

    let query = supabase.from("action_plan_progress").select("*");

    if (analysisId) {
      query = query.eq("analysis_id", analysisId);
    }
    if (studentId) {
      query = query.eq("student_id", studentId);
    }

    const { data, error } = await query.order("created_at", { ascending: true });
    if (error) throw error;

    return NextResponse.json({ items: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE action plan item completion status
export async function PATCH(req: Request) {
  try {
    const { id, is_completed } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing item id" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("action_plan_progress")
      .update({
        is_completed,
        completed_at: is_completed ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ item: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
