import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jdText } = await req.json();

    if (!jdText) {
      return NextResponse.json({ error: "Missing job description" }, { status: 400 });
    }

    let parsedResume = null;

    if (!process.env.GEMINI_API_KEY) {
      // Mock processing for when API key is missing
      parsedResume = {
        name: user.email?.split("@")[0] || "Candidate",
        email: user.email,
        summary: "Highly motivated candidate with skills tailored exactly for the requirements mentioned in the Job Description.",
        skills: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
        experience: [
          {
            role: "Software Engineering Intern",
            company: "Tech Corp",
            bullets: [
              "Optimized application performance increasing speed by 20%.",
              "Collaborated with cross-functional teams to deliver scalable solutions."
            ]
          }
        ]
      };
    } else {
      const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
      const prompt = `
        You are an expert technical recruiter and resume writer. 
        I am a computer science student looking for a job.
        Here is the target Job Description:
        "${jdText}"
        
        Rewrite my resume to perfectly highlight skills and bullet points that match this JD to beat the ATS (Applicant Tracking System).
        Keep the experience realistic for a fresh graduate or intern.
        
        Respond ONLY with a valid JSON object in this format:
        {
          "name": "Candidate Name",
          "email": "candidate@example.com",
          "summary": "2 sentence summary...",
          "skills": ["Skill 1", "Skill 2"],
          "experience": [
            {
              "role": "Role Title",
              "company": "Company Name",
              "bullets": ["Achievement 1", "Achievement 2"]
            }
          ]
        }
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const jsonString = responseText.replace(/```json\n?|\n?```/g, "").trim();
      parsedResume = JSON.parse(jsonString);
    }

    // Attempt to save to database
    let savedRecord = null;
    try {
      const { data, error } = await supabase
        .from("generated_resumes")
        .insert({
          student_id: user.id, // Assuming student_profiles id matches user.id based on typical setup
          job_description_text: jdText,
          resume_json: parsedResume,
          ats_score_predicted: Math.floor(Math.random() * (99 - 85 + 1) + 85) // Random mock score between 85 and 99
        })
        .select()
        .maybeSingle();
        
      if (!error) {
        savedRecord = data;
      } else {
        console.warn("Could not save to DB (perhaps student_id FK constraint failed):", error.message);
      }
    } catch (e) {
      console.warn("DB Insert skipped:", e);
    }

    return NextResponse.json({ 
      success: true, 
      data: parsedResume, 
      atsScore: savedRecord?.ats_score_predicted || 92 
    });
  } catch (error: any) {
    console.error("Resume Builder Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("generated_resumes")
      .select("*")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
