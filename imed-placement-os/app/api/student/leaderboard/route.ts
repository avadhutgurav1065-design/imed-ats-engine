import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch top 10 students based on XP points
    const { data: topStudents, error } = await supabase
      .from("student_profiles")
      .select("id, full_name, xp_points, current_streak, longest_streak")
      .order("xp_points", { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    // Determine current user's rank
    const { count, error: rankError } = await supabase
      .from("student_profiles")
      .select("id", { count: "exact", head: true })
      .gte("xp_points", topStudents.find(s => s.id === user.id)?.xp_points || 0);
      
    // If we have actual DB data, return it
    if (topStudents && topStudents.length > 0 && topStudents[0].xp_points > 0) {
      return NextResponse.json({ 
        success: true, 
        data: topStudents,
        currentUser: {
          id: user.id,
          rank: count || 0,
        }
      });
    }

    // Fallback: If DB is empty or no XP has been awarded yet, return dummy gamified data for MVP
    return NextResponse.json({
      success: true,
      data: [
        { id: "1", full_name: "Aman Gupta", xp_points: 12450, current_streak: 15, longest_streak: 21 },
        { id: "2", full_name: "Priya Desai", xp_points: 11200, current_streak: 12, longest_streak: 14 },
        { id: "3", full_name: "Rohan Kumar", xp_points: 10850, current_streak: 8, longest_streak: 10 },
        { id: "4", full_name: "Neha Sharma", xp_points: 9500, current_streak: 5, longest_streak: 5 },
        { id: "5", full_name: "Your Profile", xp_points: 8200, current_streak: 3, longest_streak: 12 },
        { id: "6", full_name: "Karan Patel", xp_points: 7900, current_streak: 0, longest_streak: 8 },
        { id: "7", full_name: "Simran Kaur", xp_points: 7100, current_streak: 2, longest_streak: 9 },
      ],
      currentUser: { id: "5", rank: 5 }
    });

  } catch (error: any) {
    console.error("Leaderboard Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
