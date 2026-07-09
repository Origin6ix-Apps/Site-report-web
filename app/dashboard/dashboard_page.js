"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentProfile, ROLE_LABELS } from "@/lib/roles";
import { LogOut, Loader2, Clock, Lock, ChevronRight, ShieldCheck, Building2, HardHat } from "lucide-react";
import AdminDashboard from "@/components/AdminDashboard";
import SupervisorDashboard from "@/components/SupervisorDashboard";
import ManagerDashboard from "@/components/ManagerDashboard";

const CARDS = [
  { id: "manager", label: "Manager", icon: ShieldCheck },
  { id: "admin", label: "Admin", icon: Building2 },
  { id: "supervisor", label: "Supervisor", icon: HardHat },
];

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState(null); // null = picker screen, else selected dashboard id

  useEffect(() => {
    (async () => {
      const { user, profile } = await getCurrentProfile();
      if (!user) {
        router.replace("/login");
        return;
      }
      setUser(user);
      setProfile(profile);
      setLoading(false);
    })();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function canAccess(cardId) {
    if (profile.role === "manager") return true; // Managers can view every dashboard
    return profile.role === cardId;
  }

  if (loading) {
    return <div className="screen center"><Loader2 className="spin" size={24} color="#111184" /></div>;
  }

  return (
    <div className="screen">
      <header className="topbar">
        <div className="brand small">
          <div className="brand-mark small">SR</div>
          <span className="brand-name small">SITE REPORT AI</span>
        </div>
        <div className="topbar-right">
          <span className={`role-badge ${profile.role}`}>{ROLE_LABELS[profile.role]}</span>
          <span className="user-chip">{user.email}</span>
          <button className="icon-btn" title="Log out" onClick={logout}><LogOut size={18} /></button>
        </div>
      </header>

      <div className="content">
        {profile.role === "pending" && (
          <div className="pending-screen">
            <div className="icon-wrap"><Clock size={26} /></div>
            <h1 className="h1" style={{ fontSize: 22 }}>Waiting for approval</h1>
            <p className="dash-sub">
              Your account is created but not yet assigned a role. Ask a Manager to assign your access
              from Users management.
            </p>
          </div>
        )}

        {profile.role !== "pending" && view === null && (
          <div style={{ maxWidth: 420, margin: "40px auto 0" }}>
            <h1 className="h1" style={{ fontSize: 22, textAlign: "center" }}>Choose a dashboard</h1>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 20 }}>
              {CARDS.map((c) => {
                const unlocked = canAccess(c.id);
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    onClick={() => unlocked && setView(c.id)}
                    disabled={!unlocked}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "#fff", border: "1px solid var(--border)", borderRadius: 10,
                      padding: "18px 20px", cursor: unlocked ? "pointer" : "not-allowed",
                      opacity: unlocked ? 1 : 0.55, fontFamily: "Montserrat", textAlign: "left",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Icon size={20} color={unlocked ? "#111184" : "#94A3B8"} />
                      <span style={{ fontWeight: 700, fontSize: 15, color: unlocked ? "var(--ink)" : "var(--muted)" }}>{c.label}</span>
                    </span>
                    {unlocked ? <ChevronRight size={18} color="#111184" /> : <Lock size={16} color="#94A3B8" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view !== null && (
          <>
            <button className="link-btn" style={{ marginBottom: 16 }} onClick={() => setView(null)}>← Back to dashboards</button>
            {view === "admin" && <AdminDashboard user={user} />}
            {view === "supervisor" && <SupervisorDashboard user={user} />}
            {view === "manager" && <ManagerDashboard user={user} />}
          </>
        )}
      </div>
    </div>
  );
}

