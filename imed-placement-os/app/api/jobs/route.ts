import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { companyName, roleTitle, rawRequirements } = await req.json();

    if (!companyName || !roleTitle || !rawRequirements) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Generate Mathematical Vector (Embedding) using Gemini
    // This turns the text into a 768-dimension array that the AI can mathematically search
   const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await embeddingModel.embedContent(rawRequirements);
    const embedding = result.embedding.values;

    // 2. Save the raw text AND the mathematical vector to Supabase pgvector
    const { error: dbError } = await supabase
      .from('corporate_jobs')
      .insert({
        company_name: companyName,
        role_title: roleTitle,
        raw_requirements: rawRequirements,
        embedding: embedding
      });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, message: "Job vectorized successfully" });

  } catch (error: any) {
    console.error("Vectorization API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}