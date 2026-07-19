"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ShieldCheck, Building2, HardHat, ChevronRight, Check, Briefcase, TrendingUp } from "lucide-react";

const PORTALS = [
  {
    id: "admin", label: "Admin", icon: Building2,
    tagline: "Run your projects like clockwork.",
    features: [
      "Create and manage projects, deadlines, and scope in minutes",
      "Assign Supervisors to sites with one click",
      "Track attendance and crew across every active project",
      "Manage central stock and material orders from one place",
      "Record payments and keep every project's balance accurate automatically",
    ],
  },
  {
    id: "supervisor", label: "Supervisor", icon: HardHat,
    tagline: "Your site, fully in hand.",
    features: [
      "Submit daily site reports with photos, straight from the field",
      "Mark attendance and manage your crew without paperwork",
      "Order materials and see stock levels update in real time",
      "Check off scope-of-work items as work actually gets done",
      "Everything you report reaches your Admin and Manager instantly",
    ],
  },
  {
    id: "manager", label: "Manager", icon: ShieldCheck,
    tagline: "See everything. Control everything.",
    features: [
      "View every project, Admin, and Supervisor from one screen",
      "Assign or change any role instantly — no approval delays",
      "Track revenue, payments, and outstanding balances in real time",
      "See company-wide progress, attendance, and material stock at a glance",
      "Get a management-ready view of projects",
    ],
  },
];

const LEADS_PORTALS = [
  {
    id: "sales_manager", label: "Sales Manager", icon: Briefcase,
    tagline: "Every prospect, judged fairly.",
    features: [
      "Log every incoming prospect in one place",
      "Qualify or disqualify each one with a clear decision",
      "Qualified prospects move straight into the sales pipeline",
      "Nothing falls through the cracks before it's even reviewed",
    ],
  },
  {
    id: "account_executive", label: "Account Executive", icon: TrendingUp,
    tagline: "Take a lead all the way to won.",
    features: [
      "Track every qualified lead through Site Visit and Quote",
      "Mark a quote Qualified or Disqualified in one click",
      "Won deals convert straight into a real project",
      "Lost deals keep their reason on file — useful if they come back",
    ],
  },
];

// Only letters and spaces — no numbers, no special characters.
function sanitizeName(value) {
  return value.replace(/[^a-zA-Z\s]/g, "");
}
// Digits only, with an optional leading + for country codes.
function sanitizePhone(value) {
  let v = value.replace(/[^\d+]/g, "");
  v = v.replace(/(?!^)\+/g, "");
  return v;
}

export default function LoginPage() {
  const [screen, setScreen] = useState("main"); // "main" | "leads" | a portal id
  const activePortal = [...PORTALS, ...LEADS_PORTALS].find((p) => p.id === screen);

  return (
    <div className="split-screen">
      {screen === "main" && <PortalPicker onChoose={setScreen} onLeadsPortal={() => setScreen("leads")} />}
      {screen === "leads" && <LeadsPortalPicker onChoose={setScreen} onBack={() => setScreen("main")} />}
      {activePortal && <PortalLogin portal={screen} onBack={() => setScreen(LEADS_PORTALS.some((p) => p.id === screen) ? "leads" : "main")} />}
    </div>
  );
}

function PortalPicker({ onChoose, onLeadsPortal }) {
  return (
    <>
      <div className="split-panel blue">
        <img src="/logo.png" alt="MES Portal" style={{ width: 140, height: "auto", marginBottom: 24 }} />
        <div className="split-tagline">Run smarter. Grow faster. Stay in control.</div>
        <ul className="split-feature-list">
          <li><span className="split-feature-dot" /><span>No more phone calls for project updates.</span></li>
          <li><span className="split-feature-dot" /><span>No more scattered WhatsApp chats.</span></li>
          <li><span className="split-feature-dot" /><span>No more spreadsheets to manage operations.</span></li>
          <li><span className="split-feature-dot" /><span>Track teams, attendance, and productivity in one place.</span></li>
          <li><span className="split-feature-dot" /><span>Monitor projects, materials, approvals, and daily reports in real time.</span></li>
          <li><span className="split-feature-dot" /><span>Stay informed and make better decisions — from anywhere.</span></li>
        </ul>
      </div>
      <div className="split-panel">
        <div style={{ width: 340, maxWidth: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div className="brand-name" style={{ fontSize: 20 }}>Sign in to your workspace</div>
            <div className="brand-sub">Select where you'd like to sign in</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={onLeadsPortal}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "var(--blue-light)", border: "1px solid var(--blue-tint)", borderRadius: 10,
                padding: "16px 18px", width: "100%", cursor: "pointer", fontFamily: "Montserrat",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <TrendingUp size={20} color="var(--blue)" />
                <span style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>Leads Portal</span>
              </span>
              <ChevronRight size={18} color="var(--blue)" />
            </button>
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
      </div>
    </>
  );
}

function LeadsPortalPicker({ onChoose, onBack }) {
  return (
    <>
      <div className="split-panel blue">
        <img src="/logo.png" alt="MES Portal" style={{ width: 140, height: "auto", marginBottom: 24 }} />
        <div className="split-tagline">From first contact to closed deal.</div>
        <div className="split-subtagline">The Leads Portal covers the front of your business — prospects coming in, and the pipeline that turns them into real projects.</div>
      </div>
      <div className="split-panel">
        <div style={{ width: 340, maxWidth: "100%" }}>
          <button className="link-btn" style={{ marginTop: 0, marginBottom: 16 }} onClick={onBack}>← Choose a different portal</button>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div className="brand-name" style={{ fontSize: 20 }}>Leads Portal</div>
            <div className="brand-sub">Select your role</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {LEADS_PORTALS.map((p) => {
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
      </div>
    </>
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
  const info = [...PORTALS, ...LEADS_PORTALS].find((p) => p.id === portal);
  const portalLabel = info?.label || portal;

  async function submit() {
    setError("");
    if (!email.trim() || !password.trim()) { setError("Enter an email and password."); return; }
    if (mode === "signup" && !fullName.trim()) { setError("Full name is required."); return; }
    if (mode === "signup" && !phone.trim()) { setError("Phone number is required."); return; }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim(), phone: phone.trim(), role: portal === "manager" ? "manager" : undefined } },
        });
        if (signUpError) throw signUpError;
        router.replace(portal === "manager" ? "/dashboard?portal=manager" : "/dashboard");
        return;
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw signInError;

      let role = null;
      let fetchFailed = false;
      for (let attempt = 0; attempt < 4; attempt++) {
        const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", signInData.user.id).single();
        if (!profileError && profile) { role = profile.role; fetchFailed = false; break; }
        fetchFailed = true;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      if (fetchFailed) {
        await supabase.auth.signOut();
        setError("Couldn't verify your account role right now — this looks like a temporary connection issue. Please try again in a moment.");
        setLoading(false);
        return;
      }

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
    <>
      <div className="split-panel blue">
        <img src="/logo.png" alt="MES Portal" style={{ width: 110, height: "auto", marginBottom: 20 }} />
        <div className="split-tagline" style={{ fontSize: 28 }}>{portalLabel} Portal</div>
        <div className="split-subtagline" style={{ marginTop: 6, fontWeight: 600, color: "#fff" }}>{info?.tagline}</div>
        <ul className="split-feature-list">
          {info?.features.map((f, i) => (
            <li key={i}><span className="split-feature-dot" /><span>{f}</span></li>
          ))}
        </ul>
      </div>
      <div className="split-panel">
        <div className="login-card" style={{ boxShadow: "none", border: "none", width: 340 }}>
          <button className="link-btn" style={{ marginTop: 0, marginBottom: 12 }} onClick={onBack}>← Choose a different portal</button>
          <div style={{ marginBottom: 16 }}>
            <div className="brand-name" style={{ fontSize: 18 }}>{mode === "signup" ? "Create your account" : `Sign in to ${portalLabel} Portal`}</div>
            <div className="brand-sub">Teams, projects, and reports — managed in one place</div>
          </div>

          <label className="field-label">Full name{mode === "signup" ? " *" : ""}</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(sanitizeName(e.target.value))} placeholder="e.g. Pavan Kumar" />
          {mode === "signup" && <div className="field-hint">Letters only — no numbers or special characters.</div>}

          {mode === "signup" && (
            <>
              <label className="field-label">Phone number *</label>
              <input className="input" value={phone} onChange={(e) => setPhone(sanitizePhone(e.target.value))} placeholder="e.g. +919876543210" />
              <div className="field-hint">Numbers only.</div>
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
              ? (portal === "manager"
                  ? "Manager accounts get instant access — no approval needed."
                  : "New accounts start as Pending — an Admin or Manager assigns your portal access afterward.")
              : `Only accounts assigned to ${portalLabel} (or Manager) can sign in here.`}
          </div>
        </div>
      </div>
    </>
  );
}
