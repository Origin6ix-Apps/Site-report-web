"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Enter an email and password.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { company: company.trim() || "Independent" } },
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }
      router.replace("/projects");
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen center">
      <div className="login-card">
        <div className="brand">
          <div className="brand-mark">SR</div>
          <div>
            <div className="brand-name">SITE REPORT AI</div>
            <div className="brand-sub">Daily reports, generated from a walk and a few photos</div>
          </div>
        </div>

        {mode === "signup" && (
          <>
            <label className="field-label">Company</label>
            <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Alvarez Builders" />
          </>
        )}

        <label className="field-label">Email</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />

        <label className="field-label">Password</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />

        {error && <div className="error-box" style={{ marginTop: 14 }}>{error}</div>}

        <button className="btn btn-primary btn-block" disabled={loading} onClick={submit}>
          {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>

        <button className="link-btn" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
          {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>

        <div className="login-foot">
          {mode === "signup"
            ? "You'll get a confirmation email if your Supabase project requires email verification."
            : "Contractors and superintendents only — clients view reports via a share link, no login needed."}
        </div>
      </div>
    </div>
  );
}
