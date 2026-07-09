"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, X, FileText, CalendarCheck, Package, Building2 } from "lucide-react";

const TABS = [
  { id: "projects", label: "My Projects", icon: Building2 },
  { id: "employees", label: "Employees", icon: Package },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "requests", label: "Requests", icon: FileText },
];

export default function SupervisorDashboard({ user }) {
  const [tab, setTab] = useState("projects");
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const { data: p } = await supabase.from("projects").select("*").eq("assigned_supervisor_id", user.id).order("created_at", { ascending: false });
    const projectIds = (p || []).map((x) => x.id);
    const { data: e } = projectIds.length
      ? await supabase.from("employees").select("*").in("project_id", projectIds).order("created_at", { ascending: false })
      : { data: [] };
    setProjects(p || []);
    setEmployees(e || []);
    setLoading(false);
  }

  return (
    <div>
      <div className="dash-header">
        <h1 className="h1" style={{ marginBottom: 0 }}>Supervisor Dashboard</h1>
      </div>
      <p className="dash-sub">Your assigned sites — reports, crew, and attendance.</p>

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-num">{projects.length}</div><div className="stat-label">My Projects</div></div>
        <div className="stat-card"><div className="stat-num">{employees.filter((e) => e.active).length}</div><div className="stat-label">Crew Members</div></div>
      </div>

      <div className="tab-row">
        {TABS.map((t) => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {loading ? <p className="dash-sub">Loading…</p> : (
        <>
          {tab === "projects" && <MyProjectsTab projects={projects} />}
          {tab === "employees" && <MyEmployeesTab employees={employees} projects={projects} user={user} onChange={loadAll} />}
          {tab === "attendance" && <MarkAttendanceTab employees={employees} projects={projects} user={user} />}
          {tab === "requests" && <RequestsTab projects={projects} user={user} />}
        </>
      )}
    </div>
  );
}

function MyProjectsTab({ projects }) {
  if (projects.length === 0) {
    return <div className="empty"><p>No projects assigned to you yet — check with your Admin.</p></div>;
  }
  return (
    <div className="grid">
      {projects.map((p) => (
        <div key={p.id} className="project-card">
          <div className="project-name"><a href={`/projects/${p.id}`}>{p.name}</a></div>
          <div className="project-meta">Client — {p.client || "—"}</div>
          <div className="project-meta">Site — {p.location || "—"}</div>
          <div style={{ marginTop: 10 }}>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${p.completion_percentage}%` }} /></div>
            <div className="muted" style={{ marginTop: 4 }}>{p.completion_percentage}% complete</div>
          </div>
          <div className="project-actions">
            <a className="link-action" href={`/projects/${p.id}/new-report`}><FileText size={14} /> Add daily report</a>
          </div>
        </div>
      ))}
    </div>
  );
}

function MyEmployeesTab({ employees, projects, user, onChange }) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", trade: "", phone: "", project_id: projects[0]?.id || "" });

  async function addEmployee() {
    if (!form.name.trim() || !form.project_id) return;
    await supabase.from("employees").insert({ ...form, added_by: user.id });
    setForm({ name: "", trade: "", phone: "", project_id: projects[0]?.id || "" });
    setShowNew(false);
    onChange();
  }

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <span className="dash-sub" style={{ marginBottom: 0 }}>{employees.length} crew members</span>
        {projects.length > 0 && <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}><Plus size={16} /> Add employee</button>}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Trade</th><th>Phone</th><th>Status</th></tr></thead>
          <tbody>
            {employees.length === 0 && <tr><td colSpan={4} className="muted" style={{ padding: 20 }}>No crew added yet.</td></tr>}
            {employees.map((e) => (
              <tr key={e.id}><td>{e.name}</td><td>{e.trade || "—"}</td><td>{e.phone || "—"}</td>
                <td><span className={`status-pill ${e.active ? "active" : "absent"}`}>{e.active ? "Active" : "Inactive"}</span></td>
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
            <input className="input" value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })} />
            <label className="field-label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <label className="field-label">Project</label>
            <select className="select-input" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button className="btn btn-primary btn-block" disabled={!form.name.trim()} onClick={addEmployee}>Add employee</button>
          </div>
        </div>
      )}
    </div>
  );
}

function MarkAttendanceTab({ employees, projects, user }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [statuses, setStatuses] = useState({});
  const [saved, setSaved] = useState(false);

  function setStatus(empId, status) {
    setStatuses((prev) => ({ ...prev, [empId]: status }));
  }

  async function saveAll() {
    const rows = employees
      .filter((e) => statuses[e.id])
      .map((e) => ({
        employee_id: e.id,
        project_id: e.project_id,
        attendance_date: date,
        status: statuses[e.id],
        marked_by: user.id,
      }));
    if (rows.length === 0) return;
    await supabase.from("attendance").upsert(rows, { onConflict: "employee_id,attendance_date" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (employees.length === 0) {
    return <div className="empty"><p>Add crew members first, then mark attendance here.</p></div>;
  }

  return (
    <div>
      <label className="field-label">Date</label>
      <input type="date" className="input" style={{ maxWidth: 200, marginBottom: 16 }} value={date} onChange={(e) => setDate(e.target.value)} />

      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Present</th><th>Absent</th><th>Half day</th></tr></thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id}>
                <td>{e.name}</td>
                {["present", "absent", "half_day"].map((s) => (
                  <td key={s}>
                    <input type="radio" name={`att-${e.id}`} checked={statuses[e.id] === s} onChange={() => setStatus(e.id, s)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={saveAll}>Save attendance</button>
      {saved && <span className="muted" style={{ marginLeft: 12, color: "#7ECBA1" }}>Saved ✓</span>}
    </div>
  );
}

function RequestsTab({ projects, user }) {
  const [requests, setRequests] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ project_id: projects[0]?.id || "", request_type: "material", description: "", quantity: "" });

  useEffect(() => { loadRequests(); }, [projects]);

  async function loadRequests() {
    const projectIds = projects.map((p) => p.id);
    if (projectIds.length === 0) { setRequests([]); return; }
    const { data } = await supabase.from("resource_requests").select("*, projects(name)").in("project_id", projectIds).order("created_at", { ascending: false });
    setRequests(data || []);
  }

  async function submit() {
    if (!form.description.trim() || !form.project_id) return;
    await supabase.from("resource_requests").insert({ ...form, requested_by: user.id });
    setForm({ project_id: projects[0]?.id || "", request_type: "material", description: "", quantity: "" });
    setShowNew(false);
    loadRequests();
  }

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <span className="dash-sub" style={{ marginBottom: 0 }}>Material & crew requests</span>
        {projects.length > 0 && <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}><Plus size={16} /> New request</button>}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead><tr><th>Project</th><th>Type</th><th>Description</th><th>Qty</th><th>Status</th></tr></thead>
          <tbody>
            {requests.length === 0 && <tr><td colSpan={5} className="muted" style={{ padding: 20 }}>No requests yet.</td></tr>}
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.projects?.name}</td>
                <td style={{ textTransform: "capitalize" }}>{r.request_type}</td>
                <td>{r.description}</td>
                <td>{r.quantity || "—"}</td>
                <td><span className={`status-pill ${r.status}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && (
        <div className="modal-backdrop" onClick={() => setShowNew(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row-between">
              <h2 className="h2" style={{ color: "var(--ink)" }}>New request</h2>
              <button className="icon-btn" style={{ color: "var(--ink)" }} onClick={() => setShowNew(false)}><X size={18} /></button>
            </div>
            <label className="field-label">Project</label>
            <select className="select-input" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <label className="field-label">Type</label>
            <select className="select-input" value={form.request_type} onChange={(e) => setForm({ ...form, request_type: e.target.value })}>
              <option value="material">Material</option>
              <option value="employee">Additional crew</option>
            </select>
            <label className="field-label">Description</label>
            <textarea className="textarea" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. 50 bags of cement, or 2 more electricians" />
            <label className="field-label">Quantity (optional)</label>
            <input className="input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <button className="btn btn-primary btn-block" disabled={!form.description.trim()} onClick={submit}>Submit request</button>
          </div>
        </div>
      )}
    </div>
  );
}
