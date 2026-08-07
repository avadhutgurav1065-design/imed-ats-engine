"use client";

import { useState, useEffect, useRef } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { MessageCircle, Mic, MicOff, Send, Bot, User, RotateCcw } from "lucide-react";

interface Message {
  role: "ai" | "user";
  content: string;
  timestamp: Date;
}

export default function ConversationalInterviewPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [targetRole, setTargetRole] = useState("");
  const [inputText, setInputText] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ROLES = ["Software Engineer", "Data Analyst", "Product Manager", "Cloud Engineer", "Frontend Developer", "Security Engineer"];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        const r = new SR();
        r.continuous = false;
        r.interimResults = false;
        r.lang = "en-US";
        r.onresult = (e: any) => {
          const transcript = e.results[0][0].transcript;
          setInputText(transcript);
          setIsListening(false);
        };
        r.onerror = () => setIsListening(false);
        r.onend = () => setIsListening(false);
        recognitionRef.current = r;
      }
    }
  }, []);

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const callChatAPI = async (history: Message[], mode: "start" | "respond", answer?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          history: history.map(m => ({ role: m.role, content: m.content })),
          studentAnswer: answer,
          mode,
        }),
      });
      const data = await res.json();
      const aiMsg: Message = { role: "ai", content: data.response, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      speakText(data.response);
      setExchangeCount(prev => prev + 1);
    } catch (err) {
      const errMsg: Message = {
        role: "ai",
        content: "I encountered a technical issue. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const startInterview = async () => {
    if (!targetRole) return;
    setIsStarted(true);
    setMessages([]);
    setExchangeCount(0);
    await callChatAPI([], "start");
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText("");

    await callChatAPI(updatedMessages, "respond", text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition requires Chrome or Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputText("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const resetInterview = () => {
    window.speechSynthesis?.cancel();
    setIsStarted(false);
    setMessages([]);
    setInputText("");
    setExchangeCount(0);
    setTargetRole("");
  };

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Role Selection View
  if (!isStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-extrabold gradient-text">Conversational AI Interview</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            A multi-turn chat interview. The AI asks technical questions, evaluates your answers, and follows up — just like a real recruiter.
          </p>
        </div>

        <GlassCard>
          <h3 className="text-white font-bold mb-4">Select Your Target Role</h3>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {ROLES.map(role => (
              <button
                key={role}
                onClick={() => setTargetRole(role)}
                className={`px-4 py-3 rounded-xl text-sm font-medium text-left transition-all border ${
                  targetRole === role
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                    : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-500">or type custom role</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <input
            type="text"
            value={targetRole}
            onChange={e => setTargetRole(e.target.value)}
            placeholder="e.g. DevOps Engineer, ML Engineer..."
            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors mb-4"
          />

          <button
            onClick={startInterview}
            disabled={!targetRole}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Start Conversational Interview →
          </button>
        </GlassCard>
      </div>
    );
  }

  // Chat View
  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-160px)] animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">AI Interviewer</h2>
            <p className="text-xs text-slate-500">
              {targetRole} • {exchangeCount} exchange{exchangeCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          onClick={resetInterview}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* Messages */}
      <GlassCard className="flex-1 overflow-y-auto custom-scrollbar mb-4 p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-in slide-in-from-bottom-2 duration-300`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
              msg.role === "ai"
                ? "bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/20"
                : "bg-gradient-to-br from-cyan-500/30 to-teal-500/30 border border-cyan-500/20"
            }`}>
              {msg.role === "ai" ? (
                <Bot className="w-4 h-4 text-indigo-400" />
              ) : (
                <User className="w-4 h-4 text-cyan-400" />
              )}
            </div>

            {/* Bubble */}
            <div className={`max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "ai"
                  ? "bg-slate-800/80 text-slate-200 rounded-tl-sm"
                  : "bg-cyan-600/20 border border-cyan-500/20 text-white rounded-tr-sm"
              }`}>
                {msg.content}
              </div>
              <span className="text-[10px] text-slate-600 px-1">{formatTime(msg.timestamp)}</span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex gap-3 animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="bg-slate-800/80 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center h-4">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </GlassCard>

      {/* Input */}
      <div className="flex gap-3 items-end">
        <button
          onClick={toggleListening}
          className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            isListening
              ? "bg-rose-500 text-white animate-pulse"
              : "bg-white/[0.05] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08]"
          }`}
          title="Voice input"
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={isListening ? "Listening..." : "Type your answer or use voice..."}
            className="w-full bg-slate-900/80 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors disabled:opacity-50"
          />
          {isListening && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </div>
          )}
        </div>

        <button
          onClick={sendMessage}
          disabled={isLoading || !inputText.trim()}
          className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white hover:from-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      <p className="text-center text-[10px] text-slate-600 mt-2">
        Press Enter to send • Click mic for voice • AI responses auto-read via text-to-speech
      </p>
    </div>
  );
}
