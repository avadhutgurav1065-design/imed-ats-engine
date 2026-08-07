import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: jobs, error } = await supabase
      .from("corporate_jobs")
      .select("id, company_name, role_title, raw_requirements")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ jobs: jobs || [] });
  } catch (error: any) {
    console.error("Corporate Jobs Fetch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
