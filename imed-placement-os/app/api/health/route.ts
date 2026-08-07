import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ status: "error", message: "Missing Supabase Environment Variables" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Test Supabase Connection
    const { data: pingData, error: pingError } = await supabase.from('student_profiles').select('id').limit(1);
    
    if (pingError) {
      if (pingError.code === '42P01') {
        return NextResponse.json({ 
          status: "uninitialized", 
          message: "Database tables do not exist. Please execute schema.sql in Supabase SQL Editor.",
          error: pingError.message 
        }, { status: 503 });
      }
      throw pingError;
    }

    // 2. Test Gemini API Key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        status: "degraded", 
        message: "Database is connected, but GEMINI_API_KEY is missing. AI features will fail." 
      }, { status: 200 });
    }

    return NextResponse.json({ 
      status: "healthy", 
      message: "End-to-End system is fully operational. Database connected and API keys present.",
      database: "connected",
      ai_engine: "ready"
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
