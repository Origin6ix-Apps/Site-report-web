"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentProfile, ROLE_LABELS } from "@/lib/roles";
import { LogOut, Loader2, Clock } from "lucide-react";
import AdminDashboard from "@/components/AdminDashboard";
import SupervisorDashboard from "@/components/SupervisorDashboard";
import ManagerDashboard from "@/components/ManagerDashboard";

export default function DashboardPage() {
  const router = useRouter();
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
    return <div className="screen center"><Loader2 className="spin" size={24} color="#2563EB" /></div>;
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
              Your account is created but not yet assigned a role. Ask an Admin to approve your access in
              Users management — this happens the same day for most pilot teams.
            </p>
          </div>
        )}

        {profile.role === "admin" && <AdminDashboard user={user} />}
        {profile.role === "supervisor" && <SupervisorDashboard user={user} />}
        {profile.role === "manager" && <ManagerDashboard user={user} />}
      </div>
    </div>
  );
}
