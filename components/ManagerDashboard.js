"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { UsersTab } from "@/components/AdminDashboard";
import { X, Building2, ShieldCheck, HardHat, Users as UsersIcon, Package, BarChart3 } from "lucide-react";
import SidebarNav from "@/components/SidebarNav";

const TABS = [
  { id: "projects", label: "Projects", icon: Building2 },
  { id: "admins", label: "Admins", icon: ShieldCheck },
  { id: "supervisors", label: "Supervisors", icon: HardHat },
  { id: "employees", label: "Employees", icon: UsersIcon },
  { id: "materials", label: "Materials", icon: Package },
  { id: "analytics", label: "Business Analytics & Performance", icon: BarChart3 },
  { id: "users", label: "Users", icon: ShieldCheck },
];

function daysInCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}
function currentMonthPrefix() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
function presentDaysThisMonth(employeeId, attendance) {
  const prefix = currentMonthPrefix();
  return attendance.filter((a) => a.employee_id === employeeId && a.attendance_date?.startsWith(prefix) && a.status === "present").length;
}

export default function ManagerDashboard({ user, profile, onLogout }) {
  const [tab, setTab] = useState("projects");
  const [projects, setProjects] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const hasLoadedOnce = useRef(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    if (!hasLoadedOnce.current) setLoading(true);
    const [{ data: p }, { data: pr }, { data: e }, { data: a }, { data: m }, { data: dl }, { data: pm }, { data: si }] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("employees").select("*").order("created_at", { ascending: false }),
      supabase.from("attendance").select("*"),
      supabase.from("materials").select("*"),
      supabase.from("daily_logs").select("*").order("created_at", { ascending: false }),
      supabase.from("payments").select("*").order("payment_date", { ascending: false }),
      supabase.from("stock_items").select("*"),
    ]);
    setProjects(p || []);
    setProfiles(pr || []);
    setEmployees(e || []);
    setAttendance(a || []);
    setMaterials(m || []);
    setDailyLogs(dl || []);
    setPayments(pm || []);
    setStockItems(si || []);
    hasLoadedOnce.current = true;
    setLoading(false);
  }

  const managers = profiles.filter((p) => p.role === "manager");
  const admins = profiles.filter((p) => p.role === "admin");
  const supervisors = profiles.filter((p) => p.role === "supervisor");
  const totalWorkforce = managers.length + admins.length + supervisors.length + employees.length;
  const openProject = projects.find((p) => p.id === openId);

  if (loading) {
    return (
      <div className="app-shell">
        <div className="app-main"><div className="app-main-content"><p className="dash-sub">Loading…</p></div></div>
      </div>
    );
  }

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
          <span className="role-badge manager" style={{ marginRight: 10 }}>Manager</span>
          <span className="user-chip" style={{ marginRight: 12 }}>{user?.email}</span>
          <button className="icon-btn" title="Log out" onClick={onLogout}>Log out</button>
        </header>

        <div className="app-main-content">
      <div className="dash-header">
        <h1 className="h1" style={{ marginBottom: 0 }}>Manager Dashboard</h1>
      </div>
      <p className="dash-sub">Full visibility across every portal.</p>

      <div className="stat-grid">
        <button className="stat-card" style={{ textAlign: "left", cursor: "pointer", width: "100%", fontFamily: "inherit" }} onClick={() => setTab("projects")}>
          <div className="stat-num">{projects.length}</div><div className="stat-label">Total Projects</div>
        </button>
        <button className="stat-card" style={{ textAlign: "left", cursor: "pointer", width: "100%", fontFamily: "inherit" }} onClick={() => setTab("employees")}>
          <div className="stat-num">{totalWorkforce}</div><div className="stat-label">Total Employees</div>
        </button>
      </div>

      <div className="card" style={{ marginBottom: 8 }}>
        <div className="card-head">Workforce breakdown</div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <button onClick={() => setTab("users")} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, fontFamily: "inherit" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--blue)" }}>{managers.length}</div>
            <div className="muted" style={{ fontSize: 11 }}>Managers</div>
          </button>
          <button onClick={() => setTab("admins")} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, fontFamily: "inherit" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--blue)" }}>{admins.length}</div>
            <div className="muted" style={{ fontSize: 11 }}>Admins</div>
          </button>
          <button onClick={() => setTab("supervisors")} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, fontFamily: "inherit" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--blue)" }}>{supervisors.length}</div>
            <div className="muted" style={{ fontSize: 11 }}>Supervisors</div>
          </button>
          <button onClick={() => setTab("employees")} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, fontFamily: "inherit" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--blue)" }}>{employees.length}</div>
            <div className="muted" style={{ fontSize: 11 }}>Field Staff</div>
          </button>
        </div>
      </div>

      {tab === "projects" && (
        projects.length === 0 ? <div className="empty"><p>No projects yet.</p></div> : (
          <div className="grid">
            {projects.map((p) => {
              const sup = profiles.find((u) => u.id === p.assigned_supervisor_id);
              const team = employees.filter((e) => e.project_id === p.id);
              return (
                <button key={p.id} onClick={() => setOpenId(p.id)} className="project-card" style={{ textAlign: "left", cursor: "pointer", width: "100%", border: "1px solid var(--line)" }}>
                  <div className="project-name">{p.name}</div>
                  <div className="project-meta">{sup ? (sup.full_name || sup.email) : "Unassigned"}</div>
                  {p.scope_of_work && (
                    <div className="muted" style={{ marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {p.scope_of_work}
                    </div>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${p.completion_percentage}%` }} /></div>
                    <div className="muted" style={{ marginTop: 4 }}>{p.completion_percentage}% · {team.length} on team</div>
                  </div>
                </button>
              );
            })}
          </div>
        )
      )}

      {tab === "admins" && (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th></tr></thead>
            <tbody>
              {admins.length === 0 && <tr><td colSpan={3} className="muted" style={{ padding: 20 }}>No Admins yet.</td></tr>}
              {admins.map((a) => (
                <tr key={a.id}><td>{a.full_name || "—"}</td><td>{a.email}</td><td>{a.phone || "—"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "supervisors" && (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Projects Assigned</th></tr></thead>
            <tbody>
              {supervisors.length === 0 && <tr><td colSpan={4} className="muted" style={{ padding: 20 }}>No Supervisors yet.</td></tr>}
              {supervisors.map((s) => (
                <tr key={s.id}>
                  <td>{s.full_name || "—"}</td>
                  <td>{s.email}</td>
                  <td>{s.phone || "—"}</td>
                  <td>{projects.filter((p) => p.assigned_supervisor_id === s.id).map((p) => p.name).join(", ") || "None"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "employees" && (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Trade</th><th>Phone</th><th>Project</th><th>Status</th><th>Attendance (this month)</th></tr></thead>
            <tbody>
              {employees.length === 0 && <tr><td colSpan={6} className="muted" style={{ padding: 20 }}>No employees yet.</td></tr>}
              {employees.map((e) => {
                const proj = projects.find((p) => p.id === e.project_id);
                return (
                  <tr key={e.id}>
                    <td>{e.name}</td>
                    <td>{e.trade || "—"}</td>
                    <td>{e.phone || "—"}</td>
                    <td>{proj?.name || "Unassigned"}</td>
                    <td><span className={`status-pill ${e.active ? "active" : "absent"}`}>{e.active ? "Active" : "Inactive"}</span></td>
                    <td>{presentDaysThisMonth(e.id, attendance)}/{daysInCurrentMonth()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "materials" && <MaterialsOverviewTab projects={projects} materials={materials} profiles={profiles} />}

      {tab === "analytics" && (
        <AnalyticsTab projects={projects} profiles={profiles} employees={employees} attendance={attendance}
          materials={materials} payments={payments} stockItems={stockItems} dailyLogs={dailyLogs} />
      )}

      {tab === "users" && <UsersTab profiles={profiles} onChange={loadAll} canManageAccounts />}

      {openProject && (
        <ProjectDetailModal
          project={openProject} profiles={profiles} employees={employees} attendance={attendance}
          materials={materials} dailyLogs={dailyLogs} payments={payments} onClose={() => setOpenId(null)}
        />
      )}
        </div>
      </div>
    </div>
  );
}

function MaterialsOverviewTab({ projects, materials, profiles }) {
  // Only show projects that actually have at least one material order — keeps the
  // list short and relevant instead of cluttering it with empty projects.
  const projectsWithMaterials = projects.filter((p) => materials.some((m) => m.project_id === p.id));
  const [selectedId, setSelectedId] = useState(projectsWithMaterials[0]?.id || null);

  if (projectsWithMaterials.length === 0) {
    return <div className="empty"><p>No materials ordered yet on any project.</p></div>;
  }

  const selectedProject = projectsWithMaterials.find((p) => p.id === selectedId) || projectsWithMaterials[0];
  const sup = selectedProject ? profiles.find((u) => u.id === selectedProject.assigned_supervisor_id) : null;
  const projMaterials = materials.filter((m) => m.project_id === selectedProject?.id);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {projectsWithMaterials.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            className={`tab-btn ${selectedProject?.id === p.id ? "active" : ""}`}
            style={{ border: "1px solid var(--border)", borderRadius: 20, padding: "6px 14px" }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {selectedProject && (
        <>
          <div className="dash-sub" style={{ marginBottom: 12 }}>
            Supervisor: {sup ? `${sup.full_name || sup.email}` : "Unassigned"}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead><tr><th>Material</th><th>Used</th><th>Required</th><th>Unit</th><th>Status</th><th>Last updated</th></tr></thead>
              <tbody>
                {projMaterials.length === 0 && <tr><td colSpan={6} className="muted" style={{ padding: 20 }}>No materials for this project.</td></tr>}
                {projMaterials.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.used || 0}</td>
                    <td>{m.required || 0}</td>
                    <td>{m.unit || "—"}</td>
                    <td><span className={`status-pill ${m.status === "delivered" ? "active" : m.status === "not_delivered" ? "absent" : "pending"}`}>{(m.status || "ordered").replace("_", " ")}</span></td>
                    <td className="muted">{m.status_updated_at ? new Date(m.status_updated_at).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function ProjectDetailModal({ project, profiles, employees, attendance, materials, dailyLogs, payments, onClose }) {
  const sup = profiles.find((u) => u.id === project.assigned_supervisor_id);
  const team = employees.filter((e) => e.project_id === project.id);
  const projMaterials = materials.filter((m) => m.project_id === project.id);
  const projLogs = dailyLogs.filter((r) => r.project_id === project.id);
  const projPayments = payments.filter((pm) => pm.project_id === project.id);
  const totalPaid = projPayments.reduce((sum, pm) => sum + Number(pm.amount || 0), 0);
  const balance = (project.contract_value || 0) - totalPaid;
  const totalDays = daysInCurrentMonth();
  const [modalTab, setModalTab] = useState("team");
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const MODAL_TABS = [
    { id: "team", label: `Team & Attendance (${team.length})` },
    { id: "materials", label: `Materials (${projMaterials.length})` },
    { id: "payments", label: `Payments (${projPayments.length})` },
    { id: "logs", label: `Daily Logs (${projLogs.length})` },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 620, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="row-between">
          <h2 className="h2" style={{ color: "var(--ink)" }}>{project.name}</h2>
          <button className="icon-btn" style={{ color: "var(--ink)" }} onClick={onClose}><X size={18} /></button>
        </div>
        <div className="muted">{project.client} · {project.location}</div>
        <div style={{ marginTop: 10 }}>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${project.completion_percentage}%` }} /></div>
          <div className="muted" style={{ marginTop: 4 }}>{project.completion_percentage}% complete · Deadline: {project.deadline || "—"} · Status: {project.status}</div>
        </div>
        <div className="muted" style={{ marginTop: 6 }}>
          Supervisor: {sup ? `${sup.email}${sup.full_name ? " — " + sup.full_name : ""}${sup.phone ? " — " + sup.phone : ""}` : "Unassigned"}
        </div>
        {project.scope_of_work && (
          <div style={{ marginTop: 10, background: "var(--paper)", borderRadius: 6, padding: "8px 12px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 4 }}>Scope of work</div>
            <div style={{ fontSize: 13, color: "var(--ink)" }}>{project.scope_of_work}</div>
          </div>
        )}

        <div className="tab-row" style={{ marginTop: 16 }}>
          {MODAL_TABS.map((t) => (
            <button key={t.id} className={`tab-btn ${modalTab === t.id ? "active" : ""}`} onClick={() => setModalTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {modalTab === "team" && (
          team.length === 0 ? <div className="muted">No team members yet.</div> : (
            <table className="data-table">
              <thead><tr><th>Name</th><th>Trade</th><th>Attendance (this month)</th></tr></thead>
              <tbody>
                {team.map((e) => (
                  <tr key={e.id}>
                    <td>{e.name}</td>
                    <td>{e.trade || "—"}</td>
                    <td>{presentDaysThisMonth(e.id, attendance)}/{totalDays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {modalTab === "materials" && (
          projMaterials.length === 0 ? <div className="muted">No materials logged yet.</div> : (
            <table className="data-table">
              <thead><tr><th>Material</th><th>Used</th><th>Required</th><th>Unit</th><th>Status</th><th>Last updated</th></tr></thead>
              <tbody>
                {projMaterials.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td><td>{m.used || 0}</td><td>{m.required || 0}</td><td>{m.unit || "—"}</td>
                    <td><span className={`status-pill ${m.status === "delivered" ? "active" : m.status === "not_delivered" ? "absent" : "pending"}`}>{(m.status || "ordered").replace("_", " ")}</span></td>
                    <td className="muted">{m.status_updated_at ? new Date(m.status_updated_at).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {modalTab === "payments" && (
          <div>
            <div className="stat-grid" style={{ marginBottom: 12 }}>
              <div className="stat-card"><div className="stat-num">₹{Number(project.contract_value || 0).toLocaleString()}</div><div className="stat-label">Contract Value</div></div>
              <div className="stat-card"><div className="stat-num">₹{totalPaid.toLocaleString()}</div><div className="stat-label">Paid</div></div>
              <div className="stat-card"><div className="stat-num" style={{ color: balance > 0 ? "#B91C1C" : "#15803D" }}>{balance <= 0 ? "Fully paid" : `₹${balance.toLocaleString()}`}</div><div className="stat-label">{balance <= 0 ? "Status" : "Balance due"}</div></div>
            </div>
            {projPayments.length === 0 ? <div className="muted">No payments recorded yet.</div> : (
              <table className="data-table">
                <thead><tr><th>Date</th><th>Amount</th><th>Method</th></tr></thead>
                <tbody>
                  {projPayments.map((pm) => (
                    <tr key={pm.id}><td>{pm.payment_date}</td><td>₹{Number(pm.amount).toLocaleString()}</td><td>{pm.method}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {modalTab === "logs" && (
          projLogs.length === 0 ? <div className="muted">No daily logs yet.</div> : (
            projLogs.map((r) => (
              <div key={r.id} style={{ borderBottom: "1px solid var(--line)", padding: "10px 0" }}>
                <div className="muted">{r.log_date}</div>
                {r.text && <div style={{ fontSize: 12.5, marginTop: 2 }}>{r.text}</div>}
                {r.photo_urls?.length > 0 && (
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    {r.photo_urls.map((p, i) => (
                      <img
                        key={i} src={p} alt=""
                        onClick={() => setLightboxSrc(p)}
                        style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6, cursor: "zoom-in" }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )
        )}

        <div className="muted" style={{ marginTop: 16, fontSize: 11 }}>
          All of this stays visible here until this project is deleted from the Admin portal.
        </div>
      </div>

      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}

function AnalyticsTab({ projects, profiles, employees, attendance, materials, payments, stockItems, dailyLogs }) {
  const [range, setRange] = useState("month");

  function inRange(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    if (range === "month") return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    if (range === "lastmonth") {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth();
    }
    if (range === "quarter") { const q = Math.floor(now.getMonth() / 3); return d.getFullYear() === now.getFullYear() && Math.floor(d.getMonth() / 3) === q; }
    if (range === "year") return d.getFullYear() === now.getFullYear();
    return true;
  }

  const rangedPayments = payments.filter((p) => inRange(p.payment_date));
  const totalRevenue = rangedPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const allTimeRevenue = payments.reduce((s, p) => s + Number(p.amount || 0), 0);

  const today = new Date();
  const activeProjects = projects.filter((p) => p.status === "active");
  const completedProjects = projects.filter((p) => p.status === "completed");
  const delayedProjects = projects.filter((p) => p.status !== "completed" && p.deadline && new Date(p.deadline) < today);
  const onHoldProjects = projects.filter((p) => p.status === "on_hold");

  const activeEmployees = employees.filter((e) => e.active);
  const thisMonthAttendance = attendance.filter((a) => inRange(a.attendance_date));
  const attendancePct = thisMonthAttendance.length ? Math.round((thisMonthAttendance.filter((a) => a.status === "present").length / thisMonthAttendance.length) * 100) : 0;

  const outstandingTotal = projects.reduce((s, p) => {
    const paid = payments.filter((pm) => pm.project_id === p.id).reduce((sum, pm) => sum + Number(pm.amount || 0), 0);
    const bal = (p.contract_value || 0) - paid;
    return s + (bal > 0 ? bal : 0);
  }, 0);

  const revenueByProject = projects.map((p) => ({
    name: p.name,
    total: payments.filter((pm) => pm.project_id === p.id).reduce((s, pm) => s + Number(pm.amount || 0), 0),
  })).filter((r) => r.total > 0).sort((a, b) => b.total - a.total).slice(0, 8);
  const maxProjectRevenue = Math.max(1, ...revenueByProject.map((r) => r.total));

  const revenueByClient = Object.values(
    projects.reduce((acc, p) => {
      const client = p.client || "Unspecified";
      const paid = payments.filter((pm) => pm.project_id === p.id).reduce((s, pm) => s + Number(pm.amount || 0), 0);
      if (!acc[client]) acc[client] = { name: client, total: 0 };
      acc[client].total += paid;
      return acc;
    }, {})
  ).filter((c) => c.total > 0).sort((a, b) => b.total - a.total).slice(0, 8);
  const maxClientRevenue = Math.max(1, ...revenueByClient.map((c) => c.total));

  // Monthly revenue trend — last 6 months
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const label = d.toLocaleDateString(undefined, { month: "short" });
    const total = payments.filter((pm) => {
      const pd = new Date(pm.payment_date);
      return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
    }).reduce((s, pm) => s + Number(pm.amount || 0), 0);
    monthlyTrend.push({ label, total });
  }
  const maxMonthly = Math.max(1, ...monthlyTrend.map((m) => m.total));

  const progressBuckets = [
    { label: "0-25%", count: projects.filter((p) => p.completion_percentage < 25).length },
    { label: "25-50%", count: projects.filter((p) => p.completion_percentage >= 25 && p.completion_percentage < 50).length },
    { label: "50-75%", count: projects.filter((p) => p.completion_percentage >= 50 && p.completion_percentage < 75).length },
    { label: "75-100%", count: projects.filter((p) => p.completion_percentage >= 75).length },
  ];
  const maxBucket = Math.max(1, ...progressBuckets.map((b) => b.count));

  const pendingMaterials = materials.filter((m) => m.status !== "delivered");
  const upcomingDeadlines = projects.filter((p) => p.deadline && new Date(p.deadline) >= today && p.status !== "completed")
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 8);
  const pendingPaymentProjects = projects.filter((p) => {
    const paid = payments.filter((pm) => pm.project_id === p.id).reduce((s, pm) => s + Number(pm.amount || 0), 0);
    return (p.contract_value || 0) - paid > 0;
  }).sort((a, b) => {
    const balA = (a.contract_value || 0) - payments.filter((pm) => pm.project_id === a.id).reduce((s, pm) => s + Number(pm.amount || 0), 0);
    const balB = (b.contract_value || 0) - payments.filter((pm) => pm.project_id === b.id).reduce((s, pm) => s + Number(pm.amount || 0), 0);
    return balB - balA;
  }).slice(0, 10);

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <span className="dash-sub" style={{ marginBottom: 0 }}>Real numbers from your own data — revenue figures respect the filter below, project/employee counts are always current.</span>
        <select className="select-input" value={range} onChange={(e) => setRange(e.target.value)}>
          <option value="month">This month</option>
          <option value="lastmonth">Last month</option>
          <option value="quarter">This quarter</option>
          <option value="year">This year</option>
          <option value="all">All time</option>
        </select>
      </div>

      <h3 className="h2" style={{ fontSize: 14, marginBottom: 8 }}>Executive KPIs</h3>
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-num">₹{totalRevenue.toLocaleString()}</div><div className="stat-label">Revenue (filtered)</div></div>
        <div className="stat-card"><div className="stat-num">₹{allTimeRevenue.toLocaleString()}</div><div className="stat-label">Total Revenue (all time)</div></div>
        <div className="stat-card"><div className="stat-num">₹{outstandingTotal.toLocaleString()}</div><div className="stat-label">Outstanding Payments</div></div>
        <div className="stat-card"><div className="stat-num">{activeProjects.length}</div><div className="stat-label">Active Projects</div></div>
        <div className="stat-card"><div className="stat-num">{completedProjects.length}</div><div className="stat-label">Completed Projects</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color: delayedProjects.length > 0 ? "#B91C1C" : undefined }}>{delayedProjects.length}</div><div className="stat-label">Delayed Projects</div></div>
        <div className="stat-card"><div className="stat-num">{onHoldProjects.length}</div><div className="stat-label">On Hold</div></div>
        <div className="stat-card"><div className="stat-num">{activeEmployees.length}</div><div className="stat-label">Active Employees</div></div>
        <div className="stat-card"><div className="stat-num">{attendancePct}%</div><div className="stat-label">Attendance Rate (filtered)</div></div>
      </div>

      <h3 className="h2" style={{ fontSize: 14, marginBottom: 8 }}>Monthly revenue trend (last 6 months)</h3>
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120 }}>
          {monthlyTrend.map((m) => (
            <div key={m.label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ height: 90, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                <div style={{ width: "60%", background: "var(--blue)", borderRadius: "3px 3px 0 0", height: `${Math.max(4, (m.total / maxMonthly) * 90)}px` }} title={`₹${m.total.toLocaleString()}`} />
              </div>
              <div className="muted" style={{ fontSize: 10, marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div>
          <h3 className="h2" style={{ fontSize: 14, marginBottom: 8 }}>Revenue by project</h3>
          <div className="card">
            {revenueByProject.length === 0 && <div className="muted">No payments recorded yet.</div>}
            {revenueByProject.map((r) => (
              <div key={r.name} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}><span>{r.name}</span><span className="muted">₹{r.total.toLocaleString()}</span></div>
                <div className="progress-track" style={{ height: 6 }}><div className="progress-fill" style={{ width: `${(r.total / maxProjectRevenue) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="h2" style={{ fontSize: 14, marginBottom: 8 }}>Revenue by client</h3>
          <div className="card">
            {revenueByClient.length === 0 && <div className="muted">No payments recorded yet.</div>}
            {revenueByClient.map((c) => (
              <div key={c.name} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}><span>{c.name}</span><span className="muted">₹{c.total.toLocaleString()}</span></div>
                <div className="progress-track" style={{ height: 6 }}><div className="progress-fill" style={{ width: `${(c.total / maxClientRevenue) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h3 className="h2" style={{ fontSize: 14, marginBottom: 8 }}>Project progress distribution</h3>
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 90 }}>
          {progressBuckets.map((b) => (
            <div key={b.label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ height: 70, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                <div style={{ width: "50%", background: "var(--blue-tint)", border: "1px solid var(--blue)", borderRadius: "3px 3px 0 0", height: `${Math.max(4, (b.count / maxBucket) * 70)}px` }} />
              </div>
              <div className="muted" style={{ fontSize: 10, marginTop: 4 }}>{b.label} ({b.count})</div>
            </div>
          ))}
        </div>
      </div>

      <h3 className="h2" style={{ fontSize: 16, marginTop: 28, marginBottom: 8 }}>Management meeting summary</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div className="card-head" style={{ marginBottom: 6 }}>Top delayed projects</div>
          {delayedProjects.length === 0 ? <div className="muted" style={{ marginBottom: 16 }}>Nothing delayed right now.</div> : (
            <table className="data-table" style={{ marginBottom: 16 }}>
              <thead><tr><th>Project</th><th>Deadline</th><th>Completion</th></tr></thead>
              <tbody>{delayedProjects.slice(0, 10).map((p) => <tr key={p.id}><td>{p.name}</td><td>{p.deadline}</td><td>{p.completion_percentage}%</td></tr>)}</tbody>
            </table>
          )}

          <div className="card-head" style={{ marginBottom: 6 }}>Upcoming deadlines</div>
          {upcomingDeadlines.length === 0 ? <div className="muted">None coming up.</div> : (
            <table className="data-table">
              <thead><tr><th>Project</th><th>Deadline</th></tr></thead>
              <tbody>{upcomingDeadlines.map((p) => <tr key={p.id}><td>{p.name}</td><td>{p.deadline}</td></tr>)}</tbody>
            </table>
          )}
        </div>
        <div>
          <div className="card-head" style={{ marginBottom: 6 }}>Pending client payments</div>
          {pendingPaymentProjects.length === 0 ? <div className="muted" style={{ marginBottom: 16 }}>Nothing outstanding.</div> : (
            <table className="data-table" style={{ marginBottom: 16 }}>
              <thead><tr><th>Project</th><th>Balance</th></tr></thead>
              <tbody>
                {pendingPaymentProjects.map((p) => {
                  const paid = payments.filter((pm) => pm.project_id === p.id).reduce((s, pm) => s + Number(pm.amount || 0), 0);
                  const bal = (p.contract_value || 0) - paid;
                  return <tr key={p.id}><td>{p.name}</td><td>₹{bal.toLocaleString()}</td></tr>;
                })}
              </tbody>
            </table>
          )}

          <div className="card-head" style={{ marginBottom: 6 }}>Pending material requests</div>
          {pendingMaterials.length === 0 ? <div className="muted">None pending.</div> : (
            <table className="data-table">
              <thead><tr><th>Material</th><th>Status</th></tr></thead>
              <tbody>{pendingMaterials.slice(0, 10).map((m) => <tr key={m.id}><td>{m.name}</td><td>{(m.status || "ordered").replace("_", " ")}</td></tr>)}</tbody>
            </table>
          )}
        </div>
      </div>

      <div className="muted" style={{ marginTop: 20, fontSize: 11 }}>
        Not shown here because the app doesn't collect this data yet: net profit/expenses, customer satisfaction ratings, employee overtime, task-level time tracking, material wastage, and budget-vs-actual cost. These would need new data entry points before they could show real numbers.
      </div>
    </div>
  );
}

function ImageLightbox({ src, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [busy, setBusy] = useState(false);

  async function getBlob() {
    const res = await fetch(src);
    return await res.blob();
  }

  async function handleDownload() {
    setBusy(true);
    try {
      const blob = await getBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "site-photo.jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Couldn't download this image.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    setBusy(true);
    try {
      const blob = await getBlob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    } catch (e) {
      alert("Couldn't copy this image — your browser may not support copying images.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,15,30,0.9)", zIndex: 100,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute", top: 16, right: 16, display: "flex", gap: 8, zIndex: 101,
        }}
      >
        <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} className="btn btn-sm" style={{ background: "#fff", color: "var(--ink)" }}>−</button>
        <button onClick={() => setZoom((z) => Math.min(3, z + 0.25))} className="btn btn-sm" style={{ background: "#fff", color: "var(--ink)" }}>+</button>
        <button onClick={handleCopy} disabled={busy} className="btn btn-sm" style={{ background: "#fff", color: "var(--ink)" }}>Copy</button>
        <button onClick={handleDownload} disabled={busy} className="btn btn-sm" style={{ background: "#fff", color: "var(--ink)" }}>Download</button>
        <button onClick={onClose} className="btn btn-sm" style={{ background: "#fff", color: "var(--ink)" }}>✕</button>
      </div>
      <div style={{ overflow: "auto", maxWidth: "92vw", maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
        <img
          src={src} alt=""
          style={{ transform: `scale(${zoom})`, transition: "transform 0.15s", maxWidth: "92vw", maxHeight: "85vh", display: "block" }}
        />
      </div>
    </div>
  );
}
