"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Building2 } from "lucide-react";
import SidebarNav from "@/components/SidebarNav";
import { ClientManagementTab } from "@/components/AdminDashboard";

const TABS = [{ id: "clients", label: "Sales Pipeline", icon: Building2 }];

export default function AccountExecutiveDashboard({ user, profile, onLogout }) {
  const [tab, setTab] = useState("clients");
  const [prospects, setProspects] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    if (!hasLoadedOnce.current) setLoading(true);
    const [{ data: pd }, { data: pr }] = await Promise.all([
      supabase.from("prospects").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("role", "supervisor"),
    ]);
    setProspects(pd || []);
    setSupervisors(pr || []);
    hasLoadedOnce.current = true;
    setLoading(false);
  }

  const qualified = prospects.filter((p) => p.stage !== "pending_review" && p.stage !== "disqualified");
  const wonCount = qualified.filter((p) => p.stage === "won").length;
  const lostCount = qualified.filter((p) => p.stage === "lost").length;

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <img src="/logo.png" alt="MES Portal" className="brand-mark small" />
          <span className="brand-name small">MES PORTAL</span>
        </div>
        <SidebarNav tabs={TABS} activeTab={tab} onSelect={setTab} />
      </aside>

      <div className="app-main">
        <header className="app-main-topbar">
          <span className="role-badge admin" style={{ marginRight: 10 }}>Account Executive</span>
          <span className="user-chip" style={{ marginRight: 12 }}>{user.email}</span>
          <button className="icon-btn" title="Log out" onClick={onLogout}>Log out</button>
        </header>

        <div className="app-main-content">
          <div className="dash-header">
            <h1 className="h1" style={{ marginBottom: 0 }}>Account Executive Dashboard</h1>
          </div>
          <p className="dash-sub">Take every qualified lead through Site Visit, Quote, and on to Won.</p>

          <div className="stat-grid">
            <div className="stat-card"><div className="stat-num">{qualified.length}</div><div className="stat-label">In Pipeline</div></div>
            <div className="stat-card"><div className="stat-num">{wonCount}</div><div className="stat-label">Won</div></div>
            <div className="stat-card"><div className="stat-num">{lostCount}</div><div className="stat-label">Lost</div></div>
          </div>

          {loading ? (
            <p className="dash-sub">Loading…</p>
          ) : (
            <>
              {tab === "clients" && <ClientManagementTab prospects={prospects} supervisors={supervisors} user={user} onChange={loadAll} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
