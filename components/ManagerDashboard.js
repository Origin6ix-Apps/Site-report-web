"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { UsersTab } from "@/components/AdminDashboard";
import { X } from "lucide-react";

const TABS = [
  { id: "projects", label: "Projects" },
  { id: "users", label: "Users" },
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

export default function ManagerDashboard() {
  const [tab, setTab] = useState("projects");
  const [projects, setProjects] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [{ data: p }, { data: pr }, { data: e }, { data: a }, { data: m }, { data: dl }] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("employees").select("*").order("created_at", { ascending: false }),
      supabase.from("attendance").select("*"),
      supabase.from("materials").select("*"),
      supabase.from("daily_logs").select("*").order("created_at", { ascending: false }),
    ]);
    setProjects(p || []);
    setProfiles(pr || []);
    setEmployees(e || []);
    setAttendance(a || []);
    setMaterials(m || []);
    setDailyLogs(dl || []);
    setLoading(false);
  }

  const admins = profiles.filter((p) => p.role === "admin");
  const supervisors = profiles.filter((p) => p.role === "supervisor");
  const openProject = projects.find((p) => p.id === openId);

  if (loading) return <p className="dash-sub">Loading…</p>;

  return (
    <div>
      <div className="dash-header">
        <h1 className="h1" style={{ marginBottom: 0 }}>Manager Dashboard</h1>
      </div>
      <p className="dash-sub">Full visibility across every portal.</p>

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-num">{projects.length}</div><div className="stat-label">Total Projects</div></div>
        <div className="stat-card"><div className="stat-num">{admins.length}</div><div className="stat-label">Admins</div></div>
        <div className="stat-card"><div className="stat-num">{supervisors.length}</div><div className="stat-label">Supervisors</div></div>
        <div className="stat-card"><div className="stat-num">{employees.length}</div><div className="stat-label">Employees</div></div>
      </div>

      <div className="tab-row">
        {TABS.map((t) => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
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

      {tab === "users" && <UsersTab profiles={profiles} onChange={loadAll} />}

      {openProject && (
        <ProjectDetailModal
          project={openProject} profiles={profiles} employees={employees} attendance={attendance}
          materials={materials} dailyLogs={dailyLogs} onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

function ProjectDetailModal({ project, profiles, employees, attendance, materials, dailyLogs, onClose }) {
  const sup = profiles.find((u) => u.id === project.assigned_supervisor_id);
  const team = employees.filter((e) => e.project_id === project.id);
  const projMaterials = materials.filter((m) => m.project_id === project.id);
  const projLogs = dailyLogs.filter((r) => r.project_id === project.id);
  const totalDays = daysInCurrentMonth();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 560, maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
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

        <h3 className="h2" style={{ fontSize: 13, marginTop: 18, marginBottom: 6, color: "var(--ink)" }}>Team & attendance ({team.length})</h3>
        {team.length === 0 ? <div className="muted">No team members yet.</div> : (
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
        )}

        <h3 className="h2" style={{ fontSize: 13, marginTop: 18, marginBottom: 6, color: "var(--ink)" }}>Materials ({projMaterials.length})</h3>
        {projMaterials.length === 0 ? <div className="muted">No materials logged yet.</div> : (
          <table className="data-table">
            <thead><tr><th>Material</th><th>Used</th><th>Required</th><th>Unit</th></tr></thead>
            <tbody>
              {projMaterials.map((m) => (
                <tr key={m.id}><td>{m.name}</td><td>{m.used || 0}</td><td>{m.required || 0}</td><td>{m.unit || "—"}</td></tr>
              ))}
            </tbody>
          </table>
        )}

        <h3 className="h2" style={{ fontSize: 13, marginTop: 18, marginBottom: 6, color: "var(--ink)" }}>Daily logs ({projLogs.length})</h3>
        {projLogs.length === 0 ? <div className="muted">No daily logs yet.</div> : (
          projLogs.map((r) => (
            <div key={r.id} style={{ borderBottom: "1px solid var(--line)", padding: "8px 0" }}>
              <div className="muted">{r.log_date}</div>
              {r.text && <div style={{ fontSize: 12.5 }}>{r.text}</div>}
              {r.photo_urls?.length > 0 && (
                <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                  {r.photo_urls.map((p, i) => <img key={i} src={p} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} />)}
                </div>
              )}
            </div>
          ))
        )}
        <div className="muted" style={{ marginTop: 12, fontSize: 11 }}>
          All of this stays visible here until this project is deleted from the Admin portal.
        </div>
      </div>
    </div>
  );
}
