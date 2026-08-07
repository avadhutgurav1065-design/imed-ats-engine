import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET profile for a user
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// CREATE or UPDATE profile
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, full_name, enrollment_no, branch, batch_year, cgpa, email, role } = body;

    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("student_profiles")
      .upsert(
        {
          user_id,
          full_name,
          enrollment_no,
          branch,
          batch_year,
          cgpa,
          email,
          role: role || "student",
        },
        { onConflict: "email" }
      )
      .select()
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ profile: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
