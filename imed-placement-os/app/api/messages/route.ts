import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/messages?with=<other_user_id>
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const otherUserId = url.searchParams.get("with");

    if (!otherUserId) {
      return NextResponse.json({ error: "Missing ?with=<user_id>" }, { status: 400 });
    }

    const { data, error } = await serviceSupabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ messages: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/messages
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { receiver_id, content } = await req.json();

    if (!receiver_id || !content?.trim()) {
      return NextResponse.json({ error: "receiver_id and content are required" }, { status: 400 });
    }

    const { data, error } = await serviceSupabase
      .from("messages")
      .insert({
        sender_id: user.id,
        receiver_id,
        content: content.trim(),
        read: false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: data });
  } catch (error: any) {
    console.error("Message send error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
