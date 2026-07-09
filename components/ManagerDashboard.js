"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Building2, Users as UsersIcon, CalendarCheck, ShieldCheck } from "lucide-react";

const TABS = [
  { id: "projects", label: "Projects" },
  { id: "supervisors", label: "Supervisors" },
  { id: "attendance", label: "Recent Attendance" },
];

export default function ManagerDashboard() {
  const [tab, setTab] = useState("projects");
  const [projects, setProjects] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: pr }, { data: a }] = await Promise.all([
        supabase.from("projects").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*"),
        supabase.from("attendance").select("*, employees(name), projects(name)").order("attendance_date", { ascending: false }).limit(50),
      ]);
      setProjects(p || []);
      setProfiles(pr || []);
      setAttendance(a || []);
      setLoading(false);
    })();
  }, []);

  const supervisors = profiles.filter((p) => p.role === "supervisor");
  const totalEmployeesEstimate = projects.length; // lightweight, avoids extra query

  if (loading) return <p className="dash-sub">Loading…</p>;

  return (
    <div>
      <div className="dash-header">
        <h1 className="h1" style={{ marginBottom: 0 }}>Manager Dashboard</h1>
      </div>
      <p className="dash-sub">Full visibility across Admin and Supervisor activity — read-only.</p>

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-num">{projects.length}</div><div className="stat-label">Total Projects</div></div>
        <div className="stat-card"><div className="stat-num">{supervisors.length}</div><div className="stat-label">Supervisors</div></div>
        <div className="stat-card"><div className="stat-num">{profiles.filter((p) => p.role === "pending").length}</div><div className="stat-label">Pending Approvals</div></div>
        <div className="stat-card"><div className="stat-num">{projects.filter((p) => p.status === "active").length}</div><div className="stat-label">Active Sites</div></div>
      </div>

      <div className="tab-row">
        {TABS.map((t) => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {tab === "projects" && (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr><th>Project</th><th>Client</th><th>Supervisor</th><th>Completion</th><th>Status</th></tr></thead>
            <tbody>
              {projects.map((p) => {
                const sup = profiles.find((x) => x.id === p.assigned_supervisor_id);
                return (
                  <tr key={p.id}>
                    <td><a href={`/projects/${p.id}`} style={{ color: "var(--navy-2)", fontWeight: 600 }}>{p.name}</a></td>
                    <td>{p.client || "—"}</td>
                    <td>{sup ? (sup.full_name || sup.email) : "Unassigned"}</td>
                    <td style={{ minWidth: 130 }}>
                      <div className="progress-track"><div className="progress-fill" style={{ width: `${p.completion_percentage}%` }} /></div>
                      <div className="muted" style={{ marginTop: 4 }}>{p.completion_percentage}%</div>
                    </td>
                    <td><span className={`status-pill ${p.status}`}>{p.status.replace("_", " ")}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "supervisors" && (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Projects Assigned</th></tr></thead>
            <tbody>
              {supervisors.map((s) => (
                <tr key={s.id}>
                  <td>{s.full_name || "—"}</td>
                  <td>{s.email}</td>
                  <td>{projects.filter((p) => p.assigned_supervisor_id === s.id).map((p) => p.name).join(", ") || "None"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "attendance" && (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr><th>Date</th><th>Employee</th><th>Project</th><th>Status</th></tr></thead>
            <tbody>
              {attendance.length === 0 && <tr><td colSpan={4} className="muted" style={{ padding: 20 }}>No attendance records yet.</td></tr>}
              {attendance.map((a) => (
                <tr key={a.id}>
                  <td>{a.attendance_date}</td>
                  <td>{a.employees?.name || "—"}</td>
                  <td>{a.projects?.name || "—"}</td>
                  <td><span className={`status-pill ${a.status}`}>{a.status.replace("_", " ")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
