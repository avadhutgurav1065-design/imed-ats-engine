import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { history, targetRole, studentAnswer, mode } = await req.json();

    // Fetch job requirements for context
    const { data: jobData } = await supabase
      .from("corporate_jobs")
      .select("raw_requirements")
      .ilike("role_title", `%${targetRole}%`)
      .limit(1)
      .maybeSingle();

    const jobContext = jobData?.raw_requirements
      ? `Job Requirements: ${jobData.raw_requirements}`
      : `Role: ${targetRole}`;

    const systemInstruction = `You are an expert technical interviewer conducting a realistic placement screening for the role of "${targetRole}".
${jobContext}

Your behavior:
- Start by introducing yourself briefly and asking the first technical question
- After each student answer: evaluate it in 1-2 sentences, then ask a logical follow-up or new question
- Keep responses under 5 sentences total (they will be read via text-to-speech)
- If the student gives an excellent answer, compliment briefly, ask harder follow-up
- If the student gives a poor answer, point out the key flaw and provide a small hint
- After 5 exchanges, give a final summary score (out of 10) and key feedback points
- Never use markdown, bullet points, or code blocks in your response — plain text only`;

    // Build the Gemini chat history
    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.role === "ai" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction,
    });

    const chat = model.startChat({ history: chatHistory });

    const userMessage =
      mode === "start"
        ? "Begin the interview. Introduce yourself and ask the first question."
        : studentAnswer || "Please continue.";

    const result = await chat.sendMessage(userMessage);
    const aiResponse = result.response.text().trim();

    // Log the exchange to Supabase
    if (mode !== "start" && studentAnswer) {
      await supabase.from("interview_logs").insert({
        target_role: targetRole,
        question: history?.[history.length - 1]?.content || "",
        feedback: aiResponse,
      });
    }

    return NextResponse.json({ response: aiResponse, success: true });
  } catch (error: any) {
    console.error("Conversational Interview Error:", error);
    // Fallback so the UI doesn't break
    return NextResponse.json({
      response:
        "Let me ask you this: Can you explain the difference between synchronous and asynchronous programming, and when would you use each?",
      success: true,
      fallback: true,
    });
  }
}
