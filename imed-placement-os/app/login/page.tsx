"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// Initialize Supabase Client for the browser using singleton
const supabase = createClient();

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/health").then(res => res.json()).then(data => {
      if (data.status === "uninitialized") {
        setDbStatus("uninitialized");
      }
    }).catch(() => {});
  }, []);

  const handleAuth = async (action: 'login' | 'signup') => {
    setLoading(true);
    setError(null);

    let authError;
    let authData;

    if (action === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      authError = error;
      authData = data;
      
      // If signup is successful but there is no session, email confirmations are enabled.
      if (!error && data?.user && !data?.session) {
        setError("Signup successful! Please check your email for a verification link, OR disable 'Confirm Email' in your Supabase Auth settings to log in immediately.");
        setLoading(false);
        return;
      }

      // If signup is successful, create a blank profile entry in the database
      if (!error && data?.user) {
        try {
          await fetch("/api/student/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: data.user.id,
              email: data.user.email,
              full_name: data.user.email?.split("@")[0] || "Student",
              role: "student"
            })
          });
        } catch (err) {
          console.error("Failed to create profile:", err);
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      authError = error;
    }

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      // Upon success, redirect to the secured student dashboard
      router.push("/student");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-slate-200">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative">
        {dbStatus === "uninitialized" && (
          <div className="absolute -top-16 left-0 right-0 bg-rose-500/10 border border-rose-500/50 text-rose-400 p-3 rounded-xl text-xs text-center font-bold">
            ⚠️ DATABASE NOT INITIALIZED. <br/> Please execute schema.sql in your Supabase SQL Editor.
          </div>
        )}
        <h1 className="text-3xl font-extrabold text-cyan-400 text-center mb-2">Student Login</h1>
        <p className="text-slate-400 text-center mb-8">Access the AI Technical Screening</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">University Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              placeholder="student@university.edu"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && <div className="text-rose-400 text-sm bg-rose-900/20 p-3 rounded border border-rose-500/30">{error}</div>}

          <div className="flex gap-4 pt-4">
            <button 
              onClick={() => handleAuth('login')}
              disabled={loading}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-lg transition-all"
            >
              {loading ? 'Processing...' : 'Log In'}
            </button>
            <button 
              onClick={() => handleAuth('signup')}
              disabled={loading}
              className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-3 rounded-lg transition-all"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}