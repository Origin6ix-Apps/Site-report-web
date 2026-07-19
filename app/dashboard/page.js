"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentProfile } from "@/lib/roles";
import { Loader2, Clock } from "lucide-react";
import AdminDashboard from "@/components/AdminDashboard";
import SupervisorDashboard from "@/components/SupervisorDashboard";
import ManagerDashboard from "@/components/ManagerDashboard";
import SalesManagerDashboard from "@/components/SalesManagerDashboard";
import AccountExecutiveDashboard from "@/components/AccountExecutiveDashboard";
import FinanceDashboard from "@/components/FinanceDashboard";

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

  const requestedPortal = searchParams.get("portal");
  const activeView =
    requestedPortal && (profile.role === "manager" || profile.role === requestedPortal)
      ? requestedPortal
      : profile.role;

  if (profile.role === "pending") {
    return (
      <div className="screen">
        <header className="topbar">
          <div className="brand small">
            <img src="/logo.png" alt="MES Portal" className="brand-mark small" />
            <span className="brand-name small">MES PORTAL</span>
          </div>
          <div className="topbar-right">
            <span className="role-badge pending">Pending Approval</span>
            <span className="user-chip">{user.email}</span>
            <button className="icon-btn" title="Log out" onClick={logout}>Log out</button>
          </div>
        </header>
        <div className="content">
          <div className="pending-screen">
            <div className="icon-wrap"><Clock size={26} /></div>
            <h1 className="h1" style={{ fontSize: 22 }}>Waiting for approval</h1>
            <p className="dash-sub">
              Your account is created but not yet assigned a role. Ask an Admin or Manager to assign
              your access from Users management.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {activeView === "admin" && <AdminDashboard user={user} profile={profile} onLogout={logout} />}
      {activeView === "supervisor" && <SupervisorDashboard user={user} profile={profile} onLogout={logout} />}
      {activeView === "manager" && <ManagerDashboard user={user} profile={profile} onLogout={logout} />}
      {activeView === "sales_manager" && <SalesManagerDashboard user={user} profile={profile} onLogout={logout} />}
      {activeView === "account_executive" && <AccountExecutiveDashboard user={user} profile={profile} onLogout={logout} />}
      {activeView === "finance" && <FinanceDashboard user={user} profile={profile} onLogout={logout} />}
    </>
  );
}
