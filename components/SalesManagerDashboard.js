"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { TrendingUp } from "lucide-react";
import SidebarNav from "@/components/SidebarNav";
import { ProspectsTab } from "@/components/AdminDashboard";

const TABS = [{ id: "prospects", label: "Prospects", icon: TrendingUp }];

export default function SalesManagerDashboard({ user, profile, onLogout }) {
  const [tab, setTab] = useState("prospects");
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    if (!hasLoadedOnce.current) setLoading(true);
    const { data: pd } = await supabase.from("prospects").select("*").order("created_at", { ascending: false });
    setProspects(pd || []);
    hasLoadedOnce.current = true;
    setLoading(false);
  }

  const pendingCount = prospects.filter((p) => p.stage === "pending_review").length;
  const qualifiedCount = prospects.filter((p) => p.stage !== "pending_review" && p.stage !== "disqualified").length;

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
          <span className="role-badge admin" style={{ marginRight: 10 }}>Sales Manager</span>
          <span className="user-chip" style={{ marginRight: 12 }}>{user.email}</span>
          <button className="icon-btn" title="Log out" onClick={onLogout}>Log out</button>
        </header>

        <div className="app-main-content">
          <div className="dash-header">
            <h1 className="h1" style={{ marginBottom: 0 }}>Sales Manager Dashboard</h1>
          </div>
          <p className="dash-sub">Review every incoming prospect and decide if it's worth pursuing.</p>

          <div className="stat-grid">
            <div className="stat-card"><div className="stat-num">{pendingCount}</div><div className="stat-label">Pending Review</div></div>
            <div className="stat-card"><div className="stat-num">{qualifiedCount}</div><div className="stat-label">Qualified</div></div>
          </div>

          {loading ? (
            <p className="dash-sub">Loading…</p>
          ) : (
            <>
              {tab === "prospects" && <ProspectsTab prospects={prospects} user={user} onChange={loadAll} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
