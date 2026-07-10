"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentProfile, ROLE_LABELS } from "@/lib/roles";
import { LogOut, Loader2, Clock } from "lucide-react";
import AdminDashboard from "@/components/AdminDashboard";
import SupervisorDashboard from "@/components/SupervisorDashboard";
import ManagerDashboard from "@/components/ManagerDashboard";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="screen center"><Loader2 className="spin" size={24} color="#111184" /></div>}>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

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

  if (loading) {
    return <div className="screen center"><Loader2 className="spin" size={24} color="#111184" /></div>;
  }

  // Which dashboard to actually render: the portal they logged into (if authorized),
  // otherwise fall back to their own role.
  const requestedPortal = searchParams.get("portal");
  const activeView =
    requestedPortal && (profile.role === "manager" || profile.role === requestedPortal)
      ? requestedPortal
      : profile.role;

  return (
    <div className="screen">
      <header className="topbar">
        <div className="brand small">
          <img src="/logo.png" alt="Workforge" className="brand-mark small" />
          <span className="brand-name small">WORKFORGE</span>
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
              Your account is created but not yet assigned a role. Ask an Admin or Manager to assign
              your access from Users management.
            </p>
          </div>
        )}

        {activeView === "admin" && <AdminDashboard user={user} />}
        {activeView === "supervisor" && <SupervisorDashboard user={user} />}
        {activeView === "manager" && <ManagerDashboard user={user} />}
      </div>
    </div>
  );
}
