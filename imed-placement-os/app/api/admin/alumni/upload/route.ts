import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const { alumniData } = await req.json();

    if (!alumniData || !Array.isArray(alumniData) || alumniData.length === 0) {
      return NextResponse.json({ error: "No valid alumni data provided." }, { status: 400 });
    }

    // Process and validate rows (ensure email exists)
    const validRows = alumniData
      .filter((row: any) => row.email)
      .map((row: any) => ({
        full_name: row.full_name || row.name || "Unknown",
        email: row.email,
        graduation_year: row.graduation_year?.toString() || null,
        branch: row.branch || null,
        linkedin_url: row.linkedin_url || null,
        current_company: row.current_company || null,
        role_title: row.role_title || null,
        is_mentor: row.is_mentor === "true" || row.is_mentor === true,
      }));

    if (validRows.length === 0) {
      return NextResponse.json({ error: "None of the provided rows contained a valid 'email'." }, { status: 400 });
    }

    // Upsert into Supabase (requires 'email' to be UNIQUE in the database schema)
    const { error: insertError } = await supabase
      .from('alumni_profiles')
      .upsert(validRows, { onConflict: 'email' });

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully uploaded and synced ${validRows.length} alumni records.`,
      count: validRows.length 
    });

  } catch (error: any) {
    console.error("Bulk Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
