import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Bulk import students from CSV
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("csv") as File;

    if (!file) {
      return NextResponse.json({ error: "No CSV file provided" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV must have a header row and at least one data row" },
        { status: 400 }
      );
    }

    // Parse header
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

    // Expected columns: full_name, email, enrollment_no, branch, batch_year, cgpa
    const requiredColumns = ["full_name", "email"];
    const missingColumns = requiredColumns.filter((col) => !headers.includes(col));

    if (missingColumns.length > 0) {
      return NextResponse.json(
        { error: `Missing required CSV columns: ${missingColumns.join(", ")}` },
        { status: 400 }
      );
    }

    const students: any[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/['"]/g, ""));
      const row: Record<string, any> = {};

      headers.forEach((header, idx) => {
        row[header] = values[idx] || null;
      });

      if (!row.full_name || !row.email) {
        errors.push(`Row ${i + 1}: Missing full_name or email`);
        continue;
      }

      // Create auth user first (if they don't exist)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: row.email,
        password: `IMED${row.enrollment_no || Date.now()}!`, // Temporary password
        email_confirm: true,
      });

      if (authError) {
        // User might already exist — try to look them up
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find((u) => u.email === row.email);

        if (existingUser) {
          students.push({
            user_id: existingUser.id,
            full_name: row.full_name,
            email: row.email,
            enrollment_no: row.enrollment_no || null,
            branch: row.branch || null,
            batch_year: row.batch_year ? parseInt(row.batch_year) : null,
            cgpa: row.cgpa ? parseFloat(row.cgpa) : null,
            role: row.role || "student",
          });
        } else {
          errors.push(`Row ${i + 1}: Failed to create user — ${authError.message}`);
        }
        continue;
      }

      students.push({
        user_id: authData.user.id,
        full_name: row.full_name,
        email: row.email,
        enrollment_no: row.enrollment_no || null,
        branch: row.branch || null,
        batch_year: row.batch_year ? parseInt(row.batch_year) : null,
        cgpa: row.cgpa ? parseFloat(row.cgpa) : null,
        role: row.role || "student",
      });
    }

    // Bulk upsert profiles
    if (students.length > 0) {
      const { error: dbError } = await supabase
        .from("student_profiles")
        .upsert(students, { onConflict: "user_id" });

      if (dbError) {
        return NextResponse.json(
          { error: `Database error: ${dbError.message}`, imported: 0, errors },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      imported: students.length,
      errors,
      total: lines.length - 1,
    });
  } catch (error: any) {
    console.error("CSV Import Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
