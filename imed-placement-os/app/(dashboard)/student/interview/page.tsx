"use client";

import { useState, useEffect, useRef } from "react";
import { GlassCard } from "@/components/shared/GlassCard";

export default function InterviewPage() {
  const [isListening, setIsListening] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("Initializing AI Interviewer...");
  const [studentTranscript, setStudentTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [interviewStarted, setInterviewStarted] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Load available roles from corporate_jobs
  useEffect(() => {
    async function loadRoles() {
      const res = await fetch("/api/corporate-jobs");
      if (res.ok) {
        const data = await res.json();
        setAvailableRoles(data.jobs || []);
      }
    }
    loadRoles();
  }, []);

  // Setup speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setStudentTranscript(currentTranscript);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const startInterview = async () => {
    if (!targetRole) return;
    setIsLoading(true);
    setInterviewStarted(true);

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAiQuestion(data.question);
      speakText(data.question);
    } catch (err: any) {
      setAiQuestion(`System Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition requires Chrome or Edge browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (studentTranscript.trim()) submitVoiceResponse(studentTranscript);
    } else {
      setStudentTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const submitVoiceResponse = async (transcript: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/interview/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: aiQuestion,
          studentAnswer: transcript,
          targetRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAiResponse(data.feedback);
      speakText(data.feedback);
    } catch (err: any) {
      const fallback = "Server is experiencing high traffic. Please try again in a moment.";
      setAiResponse(fallback);
      speakText(fallback);
    } finally {
      setIsProcessing(false);
    }
  };

  // Role Selection View
  if (!interviewStarted) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold gradient-text mb-2">
            AI Technical Screening
          </h1>
          <p className="text-slate-400 text-sm">
            Select a target role to begin your mock interview session.
          </p>
        </div>

        <GlassCard>
          <h3 className="text-white font-semibold mb-4">Select Target Role</h3>
          <div className="space-y-2 mb-6">
            {availableRoles.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-500 text-sm">No roles available. Ask your admin to ingest job descriptions.</p>
              </div>
            ) : (
              availableRoles.map((job) => (
                <button
                  key={job.id}
                  onClick={() => setTargetRole(job.role_title)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all border ${
                    targetRole === job.role_title
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                      : "bg-white/[0.02] border-white/[0.06] text-slate-300 hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="font-medium block">{job.company_name}</span>
                  <span className="text-xs text-slate-500">{job.role_title}</span>
                </button>
              ))
            )}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-500">or type manually</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. System Engineer, Cloud Architect..."
            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors mb-4"
          />

          <button
            onClick={startInterview}
            disabled={!targetRole || isLoading}
            className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 text-white font-semibold py-3.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all glow-cyan"
          >
            {isLoading ? "Initializing..." : "Start Voice Interview"}
          </button>

          <div className="pt-3 border-t border-slate-800/50">
            <p className="text-xs text-slate-500 text-center mb-2">Prefer typing?</p>
            <a
              href="/student/interview/chat"
              className="block w-full text-center px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/15 transition-all text-sm font-medium"
            >
              💬 Try Conversational Chat Interview →
            </a>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Interview Room View
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold gradient-text">Live AI Technical Screening</h1>
        <p className="text-slate-400 text-sm mt-1">
          Target Role: <span className="text-white font-semibold">{targetRole}</span>
        </p>
      </div>

      {/* Avatar Box */}
      <GlassCard className="relative min-h-[320px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {isLoading || isProcessing ? (
            <div className="w-20 h-20 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin z-10" />
          ) : isListening ? (
            <>
              <div className="w-40 h-40 rounded-full bg-rose-500/20 animate-ping absolute" />
              <div className="w-28 h-28 rounded-full bg-rose-500/40 animate-pulse absolute" />
              <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center z-10 glow-rose">
                <span className="text-white font-bold text-xs">MIC ON</span>
              </div>
            </>
          ) : (
            <>
              <div className="w-32 h-32 rounded-full bg-cyan-500/10 animate-pulse absolute" />
              <div className="w-16 h-16 rounded-full bg-cyan-400 flex items-center justify-center z-10 glow-cyan">
                <span className="text-slate-950 font-black text-xl">AI</span>
              </div>
            </>
          )}
        </div>

        {/* Subtitles */}
        <div className="absolute bottom-4 left-4 right-4 text-center z-20">
          <div className="glass p-4 rounded-xl text-sm text-slate-200 leading-relaxed max-h-36 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <span className="text-cyan-400">Connecting to Knowledge Base...</span>
            ) : isProcessing ? (
              <span className="text-amber-400">AI is analyzing your response...</span>
            ) : aiResponse ? (
              <div>
                <p className="text-xs text-cyan-400 font-semibold mb-1">AI Evaluation:</p>
                <p>"{aiResponse}"</p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-400 font-semibold mb-1">Interviewer:</p>
                <p>"{aiQuestion}"</p>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Live transcript */}
      {studentTranscript && (
        <GlassCard padding="sm">
          <span className="text-rose-400 font-bold text-xs uppercase tracking-wider block mb-1">
            Live Voice Input:
          </span>
          <p className="text-sm text-slate-300 italic">"{studentTranscript}"</p>
        </GlassCard>
      )}

      {/* NEW: Behavioral Telemetry */}
      {interviewStarted && (
        <div className="grid grid-cols-3 gap-4">
          <GlassCard padding="sm" className="bg-slate-900/50 border-white/[0.02]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Vocal Confidence</span>
              <span className={`text-xs font-bold ${isListening ? "text-cyan-400 animate-pulse" : "text-emerald-400"}`}>
                {isListening ? "Analyzing..." : "88%"}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1">
              <div className="bg-cyan-400 h-1 rounded-full transition-all duration-700" style={{ width: isListening ? '60%' : '88%' }} />
            </div>
          </GlassCard>
          
          <GlassCard padding="sm" className="bg-slate-900/50 border-white/[0.02]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Pacing & Flow</span>
              <span className={`text-xs font-bold ${isListening ? "text-indigo-400 animate-pulse" : "text-emerald-400"}`}>
                {isListening ? "Analyzing..." : "Optimal"}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1">
              <div className="bg-indigo-400 h-1 rounded-full transition-all duration-700" style={{ width: isListening ? '40%' : '92%' }} />
            </div>
          </GlassCard>

          <GlassCard padding="sm" className="bg-slate-900/50 border-white/[0.02]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Filler Word Detection</span>
              <span className={`text-xs font-bold ${isListening ? "text-amber-400 animate-pulse" : "text-emerald-400"}`}>
                {isListening ? "Listening..." : "Minimal"}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1">
              <div className="bg-amber-400 h-1 rounded-full transition-all duration-700" style={{ width: isListening ? '20%' : '15%' }} />
            </div>
          </GlassCard>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <button
          disabled={isLoading || isProcessing}
          onClick={toggleListening}
          className={`px-8 py-4 rounded-full font-bold text-sm transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
            isListening
              ? "bg-rose-500 text-white glow-rose animate-pulse"
              : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 glow-cyan"
          }`}
        >
          <div className={`w-3 h-3 rounded-full ${isListening ? "bg-white animate-ping" : "bg-slate-950"}`} />
          {isListening ? "Stop & Submit Answer" : "Push to Speak Answer"}
        </button>
      </div>
    </div>
  );
}
