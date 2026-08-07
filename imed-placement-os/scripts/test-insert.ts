import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log("Attempting to insert test student...");
  const { data, error } = await supabase
    .from("student_profiles")
    .upsert(
      {
        full_name: "Avadhut Admin",
        email: "avadhut@imed.edu",
        role: "admin",
      },
      { onConflict: "email" }
    )
    .select();

  if (error) {
    console.error("Insert failed:", error);
  } else {
    console.log("Insert successful:", data);
  }

  // Also fetch all students to see what's in the table
  const { data: allData, error: fetchError } = await supabase
    .from("student_profiles")
    .select("*");
    
  if (fetchError) {
    console.error("Fetch failed:", fetchError);
  } else {
    console.log("All students currently in DB:", allData);
  }
}

testInsert();
