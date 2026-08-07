import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Replace the ANON key with the new SERVICE ROLE key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // <-- CHANGED THIS LINE

// Initialize Supabase with Admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { targetRole } = await req.json();

    // 1. REAL DATABASE FETCH: Pull the exact job requirements you ingested earlier
    const { data: jobData, error: dbError } = await supabase
      .from('corporate_jobs')
      .select('raw_requirements')
      .ilike('role_title', `%${targetRole}%`)
      .limit(1)
      .maybeSingle();

    let systemPrompt = "";

    if (dbError || !jobData) {
      // MASSIVE WIN: Graceful Fallback if the database is empty or role isn't found
      systemPrompt = `
        You are an expert technical interviewer for a corporate placement drive.
        The candidate is applying for the role of: "${targetRole}".
        
        Generate ONE difficult, highly specific technical interview question to test their knowledge on a core skill required for this role.
        Do not include pleasantries. Just return the question.
      `;
    } else {
      // RAG PROMPT: Feed the live corporate data to Gemini
      systemPrompt = `
        You are an expert technical interviewer for a corporate placement drive.
        The candidate is applying for the role based on these exact requirements:
        "${jobData.raw_requirements}"
        
        Generate ONE difficult, highly specific technical interview question to test their knowledge on a core skill mentioned in these requirements.
        Do not include pleasantries. Just return the question.
      `;
    }

    // 3. GENERATE THE QUESTION
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const result = await model.generateContent(systemPrompt);
    const question = result.response.text().trim();

    return NextResponse.json({ question });

  } catch (error: any) {
    console.error("Interview Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}