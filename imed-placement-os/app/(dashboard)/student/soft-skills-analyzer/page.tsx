"use client";

import React, { useState, useRef } from "react";
import { Video, Mic, Eye, Smile, BrainCircuit, Square, Loader2 } from "lucide-react";

interface AnalysisResult {
  eyeContact: string;
  tone: string;
  confidence: string;
  structure: string;
  feedback: string;
}

export default function SoftSkillsAnalyzerPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStreamActive(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera/microphone. Please allow permissions.");
    }
  };

  const startRecording = () => {
    if (!videoRef.current?.srcObject) return;
    
    setResults(null);
    chunksRef.current = [];
    const stream = videoRef.current.srcObject as MediaStream;
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      setIsAnalyzing(true);
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      
      // Convert to Base64 for Gemini API
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result?.toString().split(",")[1];
        
        try {
          const res = await fetch("/api/student/analyze-video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              mediaBase64: base64data,
              mimeType: "video/webm"
            })
          });
          
          if (res.ok) {
            const data = await res.json();
            setResults(data.data);
          }
        } catch (error) {
          console.error("Analysis failed", error);
        } finally {
          setIsAnalyzing(false);
        }
      };
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    
    // Auto-stop after 10 seconds for MVP demo
    setTimeout(() => {
      if (mediaRecorder.state === "recording") {
        stopRecording();
      }
    }, 10000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Behavioral & Soft Skills Analyzer</h1>
          <p className="text-sm text-slate-400 mt-1">
            We don't just fix your code; we fix your confidence.
          </p>
        </div>
        {!streamActive ? (
          <button onClick={startCamera} className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)] flex items-center gap-2">
            <Video className="w-4 h-4" />
            Enable Camera & Mic
          </button>
        ) : isRecording ? (
          <button onClick={stopRecording} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-rose-400 text-sm font-bold rounded-xl transition-all border border-rose-500/50 flex items-center gap-2">
            <Square className="w-4 h-4" />
            Stop Recording
          </button>
        ) : (
          <button onClick={startRecording} disabled={isAnalyzing} className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)] flex items-center gap-2 disabled:opacity-50">
            <Video className="w-4 h-4" />
            {isAnalyzing ? "Analyzing..." : "Start 10s Recording"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-1 rounded-2xl bg-gradient-to-br from-rose-500/30 via-[#0a0e1a] to-[#0a0e1a] overflow-hidden">
          <div className="w-full h-full min-h-[400px] bg-[#070a13] rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
            
            <video 
              ref={videoRef}
              autoPlay 
              muted 
              playsInline
              className={`w-full h-full object-cover absolute inset-0 transform -scale-x-100 ${streamActive ? "opacity-100 z-0" : "opacity-0 -z-10"}`}
            />

            {!streamActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#070a13]/80 backdrop-blur-sm">
                <div className="w-24 h-24 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
                  <Video className="w-10 h-10 text-rose-500" />
                </div>
                <h2 className="text-lg font-bold text-white mb-2">Multimodal AI Analysis Ready</h2>
                <p className="text-sm text-slate-400 max-w-sm text-center mb-6">
                  Grant camera and microphone permissions to start a mock HR interview. The AI will analyze your facial expressions, eye contact, and tone of voice.
                </p>
              </div>
            )}

            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-rose-500/20 rounded-lg backdrop-blur-md border border-rose-500/50 z-20">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-bold text-rose-200">Recording...</span>
              </div>
            )}
            
            {isAnalyzing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-[#070a13]/80 backdrop-blur-sm">
                <Loader2 className="w-12 h-12 text-rose-500 animate-spin mb-4" />
                <h2 className="text-lg font-bold text-white mb-2">Gemini is analyzing your response...</h2>
                <p className="text-sm text-slate-400">Processing facial cues and vocal tone</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-bold text-white">Analysis Metrics</h3>
          
          {[
            { name: "Eye Contact", icon: Eye, color: "text-cyan-400", bg: "bg-cyan-500/10", score: results?.eyeContact || "---" },
            { name: "Vocal Tone & Clarity", icon: Mic, color: "text-amber-400", bg: "bg-amber-500/10", score: results?.tone || "---" },
            { name: "Facial Confidence", icon: Smile, color: "text-rose-400", bg: "bg-rose-500/10", score: results?.confidence || "---" },
            { name: "Response Structure", icon: BrainCircuit, color: "text-indigo-400", bg: "bg-indigo-500/10", score: results?.structure || "---" },
          ].map((metric, i) => (
            <div key={i} className="p-4 rounded-xl bg-[#0a0e1a]/80 border border-white/[0.06] backdrop-blur-xl flex items-center justify-between transition-all" style={{ opacity: isAnalyzing ? 0.5 : 1 }}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${metric.bg}`}>
                  <metric.icon className={`w-5 h-5 ${metric.color}`} />
                </div>
                <span className="text-sm font-medium text-white">{metric.name}</span>
              </div>
              <span className={`text-sm font-bold ${results ? "text-white" : "text-slate-500"}`}>{metric.score}</span>
            </div>
          ))}
          
          {results?.feedback && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mt-6 animate-in fade-in slide-in-from-bottom-2">
              <h4 className="text-sm font-bold text-emerald-400 mb-1">AI Feedback</h4>
              <p className="text-sm text-slate-300 leading-relaxed">{results.feedback}</p>
            </div>
          )}
          
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] mt-6">
            <p className="text-xs text-slate-500 text-center">
              Powered by Gemini Multimodal AI. Your video data is processed in real-time and never stored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
