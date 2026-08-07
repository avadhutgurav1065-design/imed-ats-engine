import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { studentId } = await req.json();

    // 1. Fetch Student's latest Gap Analysis
    const { data: studentAnalysis, error: studentErr } = await supabase
      .from('gap_analyses')
      .select('*')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (studentErr || !studentAnalysis) {
      return NextResponse.json({ error: "No gap analysis found for this student. They must run the analyzer first." }, { status: 404 });
    }

    // 2. Fetch all Active Corporate Jobs
    const { data: jobs, error: jobsErr } = await supabase
      .from('corporate_jobs')
      .select('id, company_name, role_title, raw_requirements')
      .eq('is_active', true)
      .limit(10); // Limit to top 10 for prompt size

    if (jobsErr || !jobs || jobs.length === 0) {
      return NextResponse.json({ error: "No corporate jobs ingested in the database yet." }, { status: 404 });
    }

    // 3. Ask Gemini to Judge the Student against the Jobs
    const systemPrompt = `
      You are an expert technical recruiter matching a student to corporate jobs.
      
      Student Profile Summary:
      Target Role: ${studentAnalysis.target_role}
      Missing Skills Identified: ${studentAnalysis.missing_skills}
      Action Plan: ${studentAnalysis.action_plan}

      Available Corporate Jobs:
      ${jobs.map((j: any) => `- Company: ${j.company_name}, Role: ${j.role_title}, Requirements: ${j.raw_requirements}`).join('\n')}

      Evaluate the student's capability for EACH of these jobs. 
      Return a JSON array of the top 3 best matching jobs.
      Format:
      [
        {
          "company_name": "Name",
          "role_title": "Role",
          "match_score": 85,
          "reason": "1-sentence reason why they fit or what they lack."
        }
      ]
      Only return valid JSON. Do not include markdown formatting like \`\`\`json.
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const result = await model.generateContent(systemPrompt);
    let rawText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Attempt to parse
    let suggestions = [];
    try {
      suggestions = JSON.parse(rawText);
    } catch (e) {
      console.error("Gemini didn't return pure JSON:", rawText);
      suggestions = [];
    }

    return NextResponse.json({ suggestions, student_name: studentAnalysis.student_name });

  } catch (error: any) {
    console.error("Match Suggestion Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
