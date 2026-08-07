import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const { question, studentAnswer, targetRole } = await req.json();
    
    // For this demonstration, we will default the email to your student account
    const studentEmail = "avadhut@imed.edu";

    if (!studentAnswer || studentAnswer.trim() === '') {
      return NextResponse.json({ error: "No voice input detected." }, { status: 400 });
    }

    const evaluationPrompt = `
      You are an expert technical interviewer conducting a live screening for the role of "${targetRole}".
      
      TECHNICAL QUESTION ASKED:
      "${question}"
      
      CANDIDATE SPOKEN RESPONSE:
      "${studentAnswer}"
      
      Task:
      1. Evaluate if the candidate's answer is technically accurate.
      2. If correct, acknowledge briefly and ask ONE logical follow-up question.
      3. If incorrect or missing key concepts, point out the exact flaw in 2 sentences, then give them a clue to correct themselves.
      
      Keep the entire response under 4 sentences so it can be spoken quickly via voice text-to-speech. Do not use markdown syntax or code blocks.
    `;

    let feedback = "";
    
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
      const result = await model.generateContent(evaluationPrompt);
      feedback = result.response.text().trim();
    } catch (e) {
      // Fallback for more robust reasoning if flash fails JSON format
      const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
      const result = await fallbackModel.generateContent(evaluationPrompt);
      feedback = result.response.text().trim();
    }

    // --- SECURE LOGGING TO SUPABASE ---
    const { error: dbError } = await supabase
      .from('interview_logs')
      .insert({
        student_email: studentEmail,
        target_role: targetRole,
        question_asked: question,
        student_transcript: studentAnswer,
        ai_feedback: feedback
      });

    if (dbError) {
      console.error("Database Logging Error:", dbError);
    }

    return NextResponse.json({ feedback });

  } catch (error: any) {
    console.error("Voice Response Evaluation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}