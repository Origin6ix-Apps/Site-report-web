"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, X, Trash2, Users as UsersIcon, Building2, CalendarCheck, ShieldCheck } from "lucide-react";

const TABS = [
  { id: "projects", label: "Projects", icon: Building2 },
  { id: "employees", label: "Employees", icon: UsersIcon },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "users", label: "Users", icon: ShieldCheck },
];

export default function AdminDashboard({ user }) {
  const [tab, setTab] = useState("projects");
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [{ data: p }, { data: e }, { data: a }, { data: pr }] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("employees").select("*, projects(name)").order("created_at", { ascending: false }),
      supabase.from("attendance").select("*, employees(name), projects(name)").order("attendance_date", { ascending: false }).limit(100),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    ]);
    setProjects(p || []);
    setEmployees(e || []);
    setAttendance(a || []);
    setProfiles(pr || []);
    setSupervisors((pr || []).filter((x) => x.role === "supervisor"));
    setLoading(false);
  }

  const stats = {
    projects: projects.length,
    employees: employees.filter((e) => e.active).length,
    supervisors: supervisors.length,
    pending: profiles.filter((p) => p.role === "pending").length,
  };

  return (
    <div>
      <div className="dash-header">
        <h1 className="h1" style={{ marginBottom: 0 }}>Admin Dashboard</h1>
      </div>
      <p className="dash-sub">Company-wide view — projects, people, and attendance.</p>

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-num">{stats.projects}</div><div className="stat-label">Projects</div></div>
        <div className="stat-card"><div className="stat-num">{stats.employees}</div><div className="stat-label">Active Employees</div></div>
        <div className="stat-card"><div className="stat-num">{stats.supervisors}</div><div className="stat-label">Supervisors</div></div>
        <div className="stat-card"><div className="stat-num">{stats.pending}</div><div className="stat-label">Pending Approval</div></div>
      </div>

      <div className="tab-row">
        {TABS.map((t) => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="dash-sub">Loading…</p>
      ) : (
        <>
          {tab === "projects" && <ProjectsTab projects={projects} supervisors={supervisors} onChange={loadAll} />}
          {tab === "employees" && <EmployeesTab employees={employees} projects={projects} user={user} onChange={loadAll} />}
          {tab === "attendance" && <AttendanceTab attendance={attendance} />}
          {tab === "users" && <UsersTab profiles={profiles} onChange={loadAll} />}
        </>
      )}
    </div>
  );
}

function ProjectsTab({ projects, supervisors, onChange }) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", client: "", location: "", point_of_contact: "" });

  async function createProject() {
    if (!form.name.trim()) return;
    await supabase.from("projects").insert({ ...form });
    setForm({ name: "", client: "", location: "", point_of_contact: "" });
    setShowNew(false);
    onChange();
  }

  async function updateField(id, field, value) {
    await supabase.from("projects").update({ [field]: value }).eq("id", id);
    onChange();
  }

  async function deleteProject(id) {
    if (!confirm("Delete this project? This also removes its reports.")) return;
    await supabase.from("projects").delete().eq("id", id);
    onChange();
  }

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <span className="dash-sub" style={{ marginBottom: 0 }}>{projects.length} projects</span>
        <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}><Plus size={16} /> New project</button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Project</th><th>Client / POC</th><th>Site</th><th>Supervisor</th><th>Completion</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong></td>
                <td>{p.client}{p.point_of_contact ? ` · ${p.point_of_contact}` : ""}</td>
                <td>{p.location}</td>
                <td>
                  <select className="select-input" value={p.assigned_supervisor_id || ""} onChange={(e) => updateField(p.id, "assigned_supervisor_id", e.target.value || null)}>
                    <option value="">— Unassigned —</option>
                    {supervisors.map((s) => <option key={s.id} value={s.id}>{s.full_name || s.email}</option>)}
                  </select>
                </td>
                <td style={{ minWidth: 130 }}>
                  <div className="progress-track"><div className="progress-fill" style={{ width: `${p.completion_percentage}%` }} /></div>
                  <input
                    type="number" min="0" max="100" value={p.completion_percentage}
                    onChange={(e) => updateField(p.id, "completion_percentage", Number(e.target.value))}
                    style={{ width: 50, marginTop: 6, border: "1px solid var(--line)", borderRadius: 3, padding: "2px 6px", fontSize: 12 }}
                  /> %
                </td>
                <td>
                  <select className="select-input" value={p.status} onChange={(e) => updateField(p.id, "status", e.target.value)}>
                    <option value="active">Active</option>
                    <option value="on_hold">On hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </td>
                <td><button className="icon-btn-sm" onClick={() => deleteProject(p.id)}><Trash2 size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && (
        <div className="modal-backdrop" onClick={() => setShowNew(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row-between">
              <h2 className="h2" style={{ color: "var(--ink)" }}>New project</h2>
              <button className="icon-btn" style={{ color: "var(--ink)" }} onClick={() => setShowNew(false)}><X size={18} /></button>
            </div>
            <label className="field-label">Project name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            <label className="field-label">Client</label>
            <input className="input" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} />
            <label className="field-label">Point of contact</label>
            <input className="input" value={form.point_of_contact} onChange={(e) => setForm({ ...form, point_of_contact: e.target.value })} placeholder="Name / phone" />
            <label className="field-label">Site location</label>
            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <button className="btn btn-primary btn-block" disabled={!form.name.trim()} onClick={createProject}>Create project</button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmployeesTab({ employees, projects, user, onChange }) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", trade: "", phone: "", project_id: "" });

  async function addEmployee() {
    if (!form.name.trim()) return;
    await supabase.from("employees").insert({ ...form, project_id: form.project_id || null, added_by: user.id });
    setForm({ name: "", trade: "", phone: "", project_id: "" });
    setShowNew(false);
    onChange();
  }

  async function toggleActive(id, active) {
    await supabase.from("employees").update({ active: !active }).eq("id", id);
    onChange();
  }

  async function removeEmployee(id) {
    if (!confirm("Remove this employee record?")) return;
    await supabase.from("employees").delete().eq("id", id);
    onChange();
  }

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <span className="dash-sub" style={{ marginBottom: 0 }}>{employees.length} employees</span>
        <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}><Plus size={16} /> Add employee</button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Trade</th><th>Phone</th><th>Project</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id}>
                <td>{e.name}</td>
                <td>{e.trade || "—"}</td>
                <td>{e.phone || "—"}</td>
                <td>{e.projects?.name || "Unassigned"}</td>
                <td><span className={`status-pill ${e.active ? "active" : "absent"}`} style={{ cursor: "pointer" }} onClick={() => toggleActive(e.id, e.active)}>{e.active ? "Active" : "Inactive"}</span></td>
                <td><button className="icon-btn-sm" onClick={() => removeEmployee(e.id)}><Trash2 size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && (
        <div className="modal-backdrop" onClick={() => setShowNew(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row-between">
              <h2 className="h2" style={{ color: "var(--ink)" }}>Add employee</h2>
              <button className="icon-btn" style={{ color: "var(--ink)" }} onClick={() => setShowNew(false)}><X size={18} /></button>
            </div>
            <label className="field-label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            <label className="field-label">Trade / role</label>
            <input className="input" value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })} placeholder="e.g. Electrician" />
            <label className="field-label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <label className="field-label">Project</label>
            <select className="select-input" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
              <option value="">— Unassigned —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button className="btn btn-primary btn-block" disabled={!form.name.trim()} onClick={addEmployee}>Add employee</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AttendanceTab({ attendance }) {
  return (
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
  );
}

function UsersTab({ profiles, onChange }) {
  async function setRole(id, role) {
    await supabase.from("profiles").update({ role }).eq("id", id);
    onChange();
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="data-table">
        <thead><tr><th>Email</th><th>Name</th><th>Role</th></tr></thead>
        <tbody>
          {profiles.map((p) => (
            <tr key={p.id}>
              <td>{p.email}</td>
              <td>{p.full_name || "—"}</td>
              <td>
                <select className="select-input" value={p.role} onChange={(e) => setRole(p.id, e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
