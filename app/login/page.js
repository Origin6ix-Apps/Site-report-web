"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ShieldCheck, Building2, HardHat, ChevronRight } from "lucide-react";

const PORTALS = [
  { id: "manager", label: "Manager", icon: ShieldCheck },
  { id: "admin", label: "Admin", icon: Building2 },
  { id: "supervisor", label: "Supervisor", icon: HardHat },
];

export default function LoginPage() {
  const [portal, setPortal] = useState(null);

  return (
    <div className="screen center">
      {portal === null ? (
        <PortalPicker onChoose={setPortal} />
      ) : (
        <PortalLogin portal={portal} onBack={() => setPortal(null)} />
      )}
    </div>
  );
}

function PortalPicker({ onChoose }) {
  return (
    <div style={{ width: 340 }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div className="brand-mark" style={{ margin: "0 auto 10px" }}>WF</div>
        <div className="brand-name">WORKFORGE</div>
        <div className="brand-sub">Choose your portal to sign in</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {PORTALS.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => onChoose(p.id)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "#fff", border: "1px solid var(--border)", borderRadius: 10,
                padding: "16px 18px", width: "100%", cursor: "pointer", fontFamily: "Montserrat",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Icon size={20} color="var(--blue)" />
                <span style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{p.label}</span>
              </span>
              <ChevronRight size={18} color="var(--blue)" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PortalLogin({ portal, onBack }) {
  const router = useRouter();
  const [mode, setMode] = useState("signin");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const portalLabel = PORTALS.find((p) => p.id === portal)?.label || portal;

  async function submit() {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Enter an email and password.");
      return;
    }
    if (mode === "signup" && !fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (mode === "signup" && !phone.trim()) {
      setError("Phone number is required.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim(), phone: phone.trim() } },
        });
        if (signUpError) throw signUpError;
        router.replace("/dashboard");
        return;
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", signInData.user.id)
        .single();

      const role = profile?.role;
      const authorized = role === "manager" || role === portal;
      if (!authorized) {
        await supabase.auth.signOut();
        setError(`This account isn't authorized for the ${portalLabel} portal.`);
        setLoading(false);
        return;
      }

      router.replace(`/dashboard?portal=${portal}`);
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-card">
      <button className="link-btn" style={{ marginTop: 0, marginBottom: 12 }} onClick={onBack}>← Choose a different portal</button>
      <div className="brand">
        <div className="brand-mark">WF</div>
        <div>
          <div className="brand-name">{portalLabel} Portal</div>
          <div className="brand-sub">Teams, projects, and reports — managed in one place</div>
        </div>
      </div>

      <label className="field-label">Full name{mode === "signup" ? " *" : ""}</label>
      <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Pavan Kumar" />

      {mode === "signup" && (
        <>
          <label className="field-label">Phone number *</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +91 98765 43210" />
        </>
      )}

      <label className="field-label">Email</label>
      <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />

      <label className="field-label">Password</label>
      <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />

      {error && <div className="error-box" style={{ marginTop: 14 }}>{error}</div>}

      <button className="btn btn-primary btn-block" disabled={loading} onClick={submit}>
        {loading ? "Please wait…" : mode === "signup" ? "Create account" : `Sign in to ${portalLabel} Portal`}
      </button>

      <button className="link-btn" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
        {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
      </button>

      <div className="login-foot">
        {mode === "signup"
          ? "New accounts start as Pending — an Admin or Manager assigns your portal access afterward."
          : `Only accounts assigned to ${portalLabel} (or Manager) can sign in here.`}
      </div>
    </div>
  );
}
