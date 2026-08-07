import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { fileName, jobRole, jobDescription } = await req.json();

    // 1. Dynamically grab the auth token sent from the frontend
    const authHeader = req.headers.get('Authorization');

    // 2. Initialize Supabase WITH the user's active context
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader || '',
          },
        },
      }
    );

    // 3. Verify the real user identity
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized request");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

    // 2. Download the PDF from your Supabase bucket
    const { data, error } = await supabase.storage.from('resumes').download(fileName);
    if (error) throw new Error('Failed to download PDF from storage');

    // 3. Convert PDF directly to Base64 for Gemini
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    const pdfPart = {
      inlineData: {
        data: base64Data,
        mimeType: 'application/pdf',
      },
    };

    // 4. Construct the Vector Match Prompt for Gemini
    const prompt = `
      You are an expert enterprise ATS scanner. Analyze the attached candidate's resume strictly against this specific job description for the role of: ${jobRole}. 
      "Extract the candidate's full name from the resume and return it under the JSON key: candidateName."
      OFFICIAL JOB DESCRIPTION:
      ${jobDescription}
      
      Return ONLY a raw JSON object (no markdown, no backticks, no code blocks) with exactly this structure:
{
  "candidateName": "string (extracted from resume)",
  "matchScore": number (0 to 100),
  "missingSkills": ["Skill 1", "Skill 2"],
  "actionPlan": ["Action 1", "Action 2"]
}
    `;

    // 5. Execute AI Evaluation with Auto-Retry for 503 Errors
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    
    let result;
    let retries = 3;
    
    while (retries > 0) {
      try {
        result = await model.generateContent([prompt, pdfPart]);
        break; // If successful, break out of the loop
      } catch (apiError: any) {
        if (apiError.status === 503 && retries > 1) {
          console.warn(`Google API 503 error. Retrying silently... (${retries - 1} attempts left)`);
          retries--;
          await new Promise(res => setTimeout(res, 2000)); // Wait 2 seconds before retrying
        } else {
          throw apiError; // Throw to frontend if it's not a 503 or we run out of retries
        }
      }
    }

    if (!result) throw new Error("AI Engine failed to respond after multiple attempts.");
    
    // 6. Clean and parse the JSON response
    const rawResponse = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const analysis = JSON.parse(rawResponse);

    // --- NEW: Save Telemetry to Database ---
    const { error: dbError } = await supabase
      .from('gap_analyses')
      .insert({
         user_id: user.id,
         target_role: jobRole || "General Submission",
         student_name: analysis.candidateName || 'Unknown Student',
         match_score: analysis.matchScore || 0,
         missing_skills: analysis.missingSkills || [],
         action_plan: analysis.actionPlan || []
      });

    if (dbError) {
      console.error("Supabase Insertion Error:", dbError);
    }
    // ---------------------------------------

    return NextResponse.json(analysis); 
  } catch (error: any) {
    console.error("Analysis API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}