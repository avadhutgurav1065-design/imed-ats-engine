"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, X, Minimize2, MessageCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

interface ChatWindowProps {
  otherUserId: string;
  otherUserName: string;
  otherUserRole?: string;
  onClose: () => void;
}

export function ChatWindow({ otherUserId, otherUserName, otherUserRole, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = useCallback(async () => {
    const res = await fetch(`/api/messages?with=${otherUserId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages || []);
    }
    setIsLoading(false);
  }, [otherUserId]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
      await loadMessages();
    }
    init();
  }, [supabase, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time message subscription
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`chat-${currentUserId}-${otherUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload: any) => {
          const msg = payload.new as Message;
          if (
            (msg.sender_id === currentUserId && msg.receiver_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.receiver_id === currentUserId)
          ) {
            setMessages((prev) => {
              // avoid duplicates
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, currentUserId, otherUserId]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInputText("");

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiver_id: otherUserId, content: text }),
      });
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 w-80 rounded-2xl shadow-2xl border border-white/[0.08] bg-[#0d1121]/95 backdrop-blur-xl flex flex-col transition-all duration-300",
        minimized ? "h-14" : "h-[420px]"
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] cursor-pointer"
        onClick={() => setMinimized((p) => !p)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300">
            {otherUserName[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-tight">{otherUserName}</p>
            {otherUserRole && (
              <p className="text-[10px] text-slate-500">{otherUserRole}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setMinimized((p) => !p); }}
            className="p-1 text-slate-500 hover:text-white transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-xs text-slate-600">No messages yet. Say hello!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender_id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-relaxed",
                        isOwn
                          ? "bg-cyan-600/80 text-white rounded-tr-sm"
                          : "bg-slate-800/80 text-slate-200 rounded-tl-sm"
                      )}
                    >
                      <p>{msg.content}</p>
                      <p className={cn("text-[9px] mt-1", isOwn ? "text-cyan-200/60" : "text-slate-600")}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 pb-3 pt-2 border-t border-white/[0.05]">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              placeholder="Type a message..."
              className="flex-1 bg-slate-900/80 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isSending}
              className="w-8 h-8 rounded-xl bg-cyan-600 flex items-center justify-center text-white hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              {isSending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
