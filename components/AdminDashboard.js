"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, X, Trash2, Users as UsersIcon, Building2, CalendarCheck, ShieldCheck, Package, FileText } from "lucide-react";

// Only letters and spaces — no numbers, no special characters.
function sanitizeName(value) {
  return value.replace(/[^a-zA-Z\s]/g, "");
}
// Digits only, with an optional leading + for country codes.
function sanitizePhone(value) {
  let v = value.replace(/[^\d+]/g, "");
  v = v.replace(/(?!^)\+/g, "");
  return v;
}

const TABS = [
  { id: "projects", label: "Projects", icon: Building2 },
  { id: "employees", label: "Employees", icon: UsersIcon },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "stores", label: "Stores", icon: Package },
  { id: "dailyreports", label: "Daily Reports", icon: FileText },
  { id: "users", label: "Users", icon: ShieldCheck },
];

export default function AdminDashboard({ user, profile, onLogout }) {
  const [tab, setTab] = useState("projects");
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [scopeItems, setScopeItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [{ data: p }, { data: e }, { data: a }, { data: pr }, { data: si }, { data: m }, { data: dl }, { data: sc }] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("employees").select("*, projects(name)").order("created_at", { ascending: false }),
      supabase.from("attendance").select("*, employees(name), projects(name)").order("attendance_date", { ascending: false }).limit(100),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("stock_items").select("*").order("name", { ascending: true }),
      supabase.from("materials").select("*"),
      supabase.from("daily_logs").select("*, projects(name)").order("created_at", { ascending: false }),
      supabase.from("scope_items").select("*").order("created_at", { ascending: true }),
    ]);
    setProjects(p || []);
    setEmployees(e || []);
    setAttendance(a || []);
    setProfiles(pr || []);
    setSupervisors((pr || []).filter((x) => x.role === "supervisor"));
    setStockItems(si || []);
    setMaterials(m || []);
    setDailyLogs(dl || []);
    setScopeItems(sc || []);
    setLoading(false);
  }

  const stats = {
    projects: projects.length,
    employees: employees.filter((e) => e.active).length,
    supervisors: supervisors.length,
    pending: profiles.filter((p) => p.role === "pending").length,
  };

  const overallProgress = projects.length
    ? Math.round(projects.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / projects.length)
    : 0;

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <img src="/logo.png" alt="MES Portal" className="brand-mark small" />
          <span className="brand-name small">MES PORTAL</span>
        </div>
        <nav className="app-sidebar-nav">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} className={`app-sidebar-item ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="app-main">
        <header className="app-main-topbar">
          <span className="role-badge admin" style={{ marginRight: 10 }}>Admin</span>
          <span className="user-chip" style={{ marginRight: 12 }}>{user.email}</span>
          <button className="icon-btn" title="Log out" onClick={onLogout}>Log out</button>
        </header>

        <div className="app-main-content">
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

          {projects.length > 0 && (
            <div className="card" style={{ marginBottom: 8 }}>
              <div className="card-head">Overall progress across all projects</div>
              <div className="progress-track" style={{ height: 12 }}><div className="progress-fill" style={{ width: `${overallProgress}%` }} /></div>
              <div className="muted" style={{ marginTop: 6 }}>{overallProgress}% average completion across {projects.length} project{projects.length === 1 ? "" : "s"}</div>
            </div>
          )}

          {loading ? (
            <p className="dash-sub">Loading…</p>
          ) : (
            <>
              {tab === "projects" && <ProjectsTab projects={projects} supervisors={supervisors} scopeItems={scopeItems} user={user} onChange={loadAll} />}
              {tab === "employees" && <EmployeesTab employees={employees} projects={projects} user={user} onChange={loadAll} />}
              {tab === "attendance" && <AttendanceTab attendance={attendance} onChange={loadAll} />}
              {tab === "stores" && <StoresTab stockItems={stockItems} materials={materials} user={user} onChange={loadAll} />}
              {tab === "dailyreports" && <DailyReportsTab dailyLogs={dailyLogs} />}
              {tab === "users" && <UsersTab profiles={profiles} onChange={loadAll} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectsTab({ projects, supervisors, scopeItems, user, onChange }) {
  const [showNew, setShowNew] = useState(false);
  const [scopeProjectId, setScopeProjectId] = useState(null);
  const [form, setForm] = useState({ name: "", client: "", location: "", point_of_contact: "", point_of_contact_phone: "", deadline: "", scope_of_work: "", assigned_supervisor_id: "" });
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState("");

  async function createProject() {
    if (!form.name.trim()) return;
    setError("");
    const { error: insertError } = await supabase.from("projects").insert({ ...form, deadline: form.deadline || null, assigned_supervisor_id: form.assigned_supervisor_id || null, owner_id: user.id });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setForm({ name: "", client: "", location: "", point_of_contact: "", point_of_contact_phone: "", deadline: "", scope_of_work: "", assigned_supervisor_id: "" });
    setShowNew(false);
    onChange();
  }

  function draftValue(p, field) {
    return drafts[p.id]?.[field] !== undefined ? drafts[p.id][field] : p[field];
  }
  function setDraft(id, field, value) {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [field]: value } }));
  }
  async function saveRow(id) {
    if (!drafts[id]) return;
    await supabase.from("projects").update(drafts[id]).eq("id", id);
    setDrafts((d) => { const next = { ...d }; delete next[id]; return next; });
    onChange();
  }

  async function deleteProject(id) {
    if (!confirm("Delete this project? This also removes its reports, materials, and daily logs.")) return;
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
              <th>Project</th><th>Client / POC</th><th>Site</th><th>Deadline</th><th>Supervisor</th><th>Completion</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => {
              const hasDraft = !!drafts[p.id];
              return (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    {p.scope_of_work && (
                      <div className="muted" style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.scope_of_work}>
                        {p.scope_of_work}
                      </div>
                    )}
                  </td>
                  <td>{p.client}{p.point_of_contact ? ` · ${p.point_of_contact}` : ""}{p.point_of_contact_phone ? ` · ${p.point_of_contact_phone}` : ""}</td>
                  <td>{p.location}</td>
                  <td>
                    <input type="date" className="select-input" value={draftValue(p, "deadline") || ""} onChange={(e) => setDraft(p.id, "deadline", e.target.value)} />
                  </td>
                  <td>
                    <select className="select-input" value={draftValue(p, "assigned_supervisor_id") || ""} onChange={(e) => setDraft(p.id, "assigned_supervisor_id", e.target.value || null)}>
                      <option value="">— Unassigned —</option>
                      {supervisors.map((s) => <option key={s.id} value={s.id}>{s.email}{s.full_name ? ` — ${s.full_name}` : ""}</option>)}
                    </select>
                  </td>
                  <td style={{ minWidth: 130 }}>
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${draftValue(p, "completion_percentage")}%` }} /></div>
                    {(() => {
                      const items = scopeItems.filter((s) => s.project_id === p.id);
                      if (items.length > 0) {
                        const done = items.filter((s) => s.completed).length;
                        return <div className="muted" style={{ marginTop: 6, fontSize: 11 }}>{p.completion_percentage}% · {done}/{items.length} scope items done</div>;
                      }
                      return (
                        <input
                          type="number" min="0" max="100" value={draftValue(p, "completion_percentage")}
                          onChange={(e) => setDraft(p.id, "completion_percentage", Number(e.target.value))}
                          style={{ width: 50, marginTop: 6, border: "1px solid var(--line)", borderRadius: 3, padding: "2px 6px", fontSize: 12 }}
                        />
                      );
                    })()}
                  </td>
                  <td>
                    <select className="select-input" value={draftValue(p, "status")} onChange={(e) => setDraft(p.id, "status", e.target.value)}>
                      <option value="active">Active</option>
                      <option value="on_hold">On hold</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="icon-btn-sm" onClick={() => setScopeProjectId(p.id)}>Scope</button>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ opacity: hasDraft ? 1 : 0.4, cursor: hasDraft ? "pointer" : "not-allowed", padding: "4px 10px", fontSize: 11 }}
                        disabled={!hasDraft} onClick={() => saveRow(p.id)}
                      >
                        Update
                      </button>
                      <button className="icon-btn-sm" onClick={() => deleteProject(p.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
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
            <label className="field-label">Point of contact name</label>
            <input className="input" value={form.point_of_contact} onChange={(e) => setForm({ ...form, point_of_contact: sanitizeName(e.target.value) })} placeholder="e.g. Ramesh Kumar" />
            <div className="field-hint">Letters only — no numbers or special characters.</div>
            <label className="field-label">Point of contact phone</label>
            <input className="input" value={form.point_of_contact_phone} onChange={(e) => setForm({ ...form, point_of_contact_phone: sanitizePhone(e.target.value) })} placeholder="e.g. +919876543210" />
            <div className="field-hint">Numbers only.</div>
            <label className="field-label">Site location</label>
            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <label className="field-label">Assign Supervisor</label>
            <select className="select-input" value={form.assigned_supervisor_id} onChange={(e) => setForm({ ...form, assigned_supervisor_id: e.target.value })}>
              <option value="">— Unassigned —</option>
              {supervisors.map((s) => <option key={s.id} value={s.id}>{s.email}{s.full_name ? ` — ${s.full_name}` : ""}</option>)}
            </select>
            <label className="field-label">Deadline</label>
            <input type="date" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            <label className="field-label">Scope of work</label>
            <textarea className="textarea" rows={3} value={form.scope_of_work} onChange={(e) => setForm({ ...form, scope_of_work: e.target.value })} placeholder="What does this project actually cover?" />
            <div className="field-hint">Optional short summary — after creating the project, use the "Scope" button to build a checklist or upload a document instead of typing everything here.</div>
            {error && <div className="error-box" style={{ marginTop: 12 }}>{error}</div>}
            <button className="btn btn-primary btn-block" disabled={!form.name.trim()} onClick={createProject}>Create project</button>
          </div>
        </div>
      )}

      {scopeProjectId && (
        <ScopeModal
          project={projects.find((p) => p.id === scopeProjectId)}
          items={scopeItems.filter((s) => s.project_id === scopeProjectId)}
          onClose={() => setScopeProjectId(null)}
          onChange={onChange}
        />
      )}
    </div>
  );
}

function ScopeModal({ project, items, onClose, onChange }) {
  const [text, setText] = useState(project.scope_of_work || "");
  const [newItem, setNewItem] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function saveText() {
    await supabase.from("projects").update({ scope_of_work: text }).eq("id", project.id);
    onChange();
  }

  async function addItem() {
    if (!newItem.trim()) return;
    await supabase.from("scope_items").insert({ project_id: project.id, description: newItem.trim() });
    setNewItem("");
    onChange();
  }

  async function toggleItem(id, completed) {
    await supabase.from("scope_items").update({ completed: !completed }).eq("id", id);
    onChange();
  }

  async function removeItem(id) {
    await supabase.from("scope_items").delete().eq("id", id);
    onChange();
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const path = `scope-docs/${project.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("site-photos").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("site-photos").getPublicUrl(path);
      await supabase.from("projects").update({ scope_document_url: pub.publicUrl }).eq("id", project.id);
      onChange();
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const done = items.filter((i) => i.completed).length;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 480, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="row-between">
          <h2 className="h2" style={{ color: "var(--ink)" }}>Scope — {project.name}</h2>
          <button className="icon-btn" style={{ color: "var(--ink)" }} onClick={onClose}><X size={18} /></button>
        </div>

        {items.length > 0 && (
          <div className="dash-sub" style={{ marginBottom: 8 }}>
            Progress is calculated automatically: {done}/{items.length} items checked = {project.completion_percentage}%
          </div>
        )}

        <label className="field-label">Short summary (optional)</label>
        <textarea className="textarea" rows={2} value={text} onChange={(e) => setText(e.target.value)} onBlur={saveText} placeholder="What does this project actually cover?" />

        <label className="field-label">Attach a scope document</label>
        <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={handleUpload} disabled={uploading} />
        {uploading && <div className="muted" style={{ marginTop: 4 }}>Uploading…</div>}
        {error && <div className="error-box" style={{ marginTop: 8 }}>{error}</div>}
        {project.scope_document_url && (
          <div style={{ marginTop: 6 }}>
            <a href={project.scope_document_url} target="_blank" rel="noreferrer">View uploaded document</a>
          </div>
        )}

        <label className="field-label" style={{ marginTop: 16 }}>Checklist items</label>
        {items.length === 0 && <div className="muted" style={{ marginBottom: 8 }}>No items yet — add some below, or just attach a document above.</div>}
        {items.map((item) => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
            <input type="checkbox" checked={item.completed} onChange={() => toggleItem(item.id, item.completed)} />
            <span style={{ flex: 1, fontSize: 13, textDecoration: item.completed ? "line-through" : "none", color: item.completed ? "var(--muted)" : "var(--ink)" }}>
              {item.description}
            </span>
            <button className="icon-btn-sm" onClick={() => removeItem(item.id)}><Trash2 size={12} /></button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input className="input" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="e.g. Foundation work" onKeyDown={(e) => e.key === "Enter" && addItem()} />
          <button className="btn btn-primary btn-sm" onClick={addItem}><Plus size={14} /> Add</button>
        </div>
      </div>
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
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: sanitizeName(e.target.value) })} autoFocus />
            <div className="field-hint">Letters only — no numbers or special characters.</div>
            <label className="field-label">Position / Trade</label>
            <input className="input" value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })} placeholder="e.g. Electrician" />
            <label className="field-label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })} />
            <div className="field-hint">Numbers only.</div>
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

function AttendanceTab({ attendance, onChange }) {
  async function updateStatus(id, status) {
    await supabase.from("attendance").update({ status }).eq("id", id);
    onChange();
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <div className="dash-sub" style={{ marginBottom: 10 }}>Change the status below to correct any record, including past dates.</div>
      <table className="data-table">
        <thead><tr><th>Date</th><th>Employee</th><th>Project</th><th>Status</th></tr></thead>
        <tbody>
          {attendance.length === 0 && <tr><td colSpan={4} className="muted" style={{ padding: 20 }}>No attendance records yet.</td></tr>}
          {attendance.map((a) => (
            <tr key={a.id}>
              <td>{a.attendance_date}</td>
              <td>{a.employees?.name || "—"}</td>
              <td>{a.projects?.name || "—"}</td>
              <td>
                <select className="select-input" value={a.status} onChange={(e) => updateStatus(a.id, e.target.value)}>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="half_day">Half day</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function UsersTab({ profiles, onChange }) {
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

function StoresTab({ stockItems, materials, user, onChange }) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", quantity: "", unit: "" });
  const [error, setError] = useState("");

  function usedFor(name) {
    return materials.filter((m) => m.name === name).reduce((sum, m) => sum + (Number(m.used) || 0), 0);
  }

  async function addStock() {
    if (!form.name.trim()) return;
    setError("");
    const { error: insertError } = await supabase.from("stock_items").insert({
      name: form.name.trim(), quantity: Math.max(0, Number(form.quantity) || 0), unit: form.unit, added_by: user.id,
    });
    if (insertError) { setError(insertError.message); return; }
    setForm({ name: "", quantity: "", unit: "" });
    setShowNew(false);
    onChange();
  }

  async function updateQuantity(id, quantity) {
    await supabase.from("stock_items").update({ quantity: Math.max(0, quantity), updated_at: new Date().toISOString() }).eq("id", id);
    onChange();
  }

  async function removeStock(id) {
    if (!confirm("Remove this stock item?")) return;
    await supabase.from("stock_items").delete().eq("id", id);
    onChange();
  }

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <span className="dash-sub" style={{ marginBottom: 0 }}>Central stock list — remaining updates automatically as Supervisors log material used on projects</span>
        <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}><Plus size={16} /> Add stock item</button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead><tr><th>Material</th><th>Total Stock</th><th>Used (all projects)</th><th>Remaining</th><th>Unit</th><th></th></tr></thead>
          <tbody>
            {stockItems.length === 0 && <tr><td colSpan={6} className="muted" style={{ padding: 20 }}>No stock items added yet.</td></tr>}
            {stockItems.map((s) => {
              const used = usedFor(s.name);
              const remaining = s.quantity - used;
              return (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td>
                    <input
                      type="number" min="0" defaultValue={s.quantity}
                      onBlur={(e) => { const v = Number(e.target.value); if (v !== s.quantity) updateQuantity(s.id, v); }}
                      style={{ width: 80, border: "1px solid var(--line)", borderRadius: 3, padding: "3px 6px", fontSize: 12 }}
                    />
                  </td>
                  <td>{used}</td>
                  <td><span className={`status-pill ${remaining <= 0 ? "absent" : remaining < s.quantity * 0.2 ? "pending" : "active"}`}>{remaining}</span></td>
                  <td>{s.unit || "—"}</td>
                  <td><button className="icon-btn-sm" onClick={() => removeStock(s.id)}><Trash2 size={13} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showNew && (
        <div className="modal-backdrop" onClick={() => setShowNew(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row-between">
              <h2 className="h2" style={{ color: "var(--ink)" }}>Add stock item</h2>
              <button className="icon-btn" style={{ color: "var(--ink)" }} onClick={() => setShowNew(false)}><X size={18} /></button>
            </div>
            <label className="field-label">Material name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cement bags" autoFocus />
            <label className="field-label">Total stock quantity</label>
            <input type="number" min="0" className="input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <label className="field-label">Unit</label>
            <input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. bags, tons, pieces" />
            {error && <div className="error-box" style={{ marginTop: 12 }}>{error}</div>}
            <button className="btn btn-primary btn-block" disabled={!form.name.trim()} onClick={addStock}>Add to stock</button>
          </div>
        </div>
      )}
    </div>
  );
}

function DailyReportsTab({ dailyLogs }) {
  const [lightboxSrc, setLightboxSrc] = useState(null);

  return (
    <div>
      <div className="dash-sub" style={{ marginBottom: 12 }}>All daily logs submitted by Supervisors, across every project</div>
      {dailyLogs.length === 0 && <div className="empty"><p>No daily reports submitted yet.</p></div>}
      {dailyLogs.map((r) => (
        <div key={r.id} className="card">
          <div className="row-between">
            <strong>{r.projects?.name || "—"}</strong>
            <span className="muted">{r.log_date}</span>
          </div>
          {r.text && <p style={{ fontSize: 13, marginTop: 6 }}>{r.text}</p>}
          {r.photo_urls?.length > 0 && (
            <div className="photo-grid" style={{ marginTop: 8 }}>
              {r.photo_urls.map((p, i) => (
                <div className="photo-thumb" key={i} onClick={() => setLightboxSrc(p)} style={{ cursor: "zoom-in" }}>
                  <img src={p} alt="" />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {lightboxSrc && <AdminImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}

function AdminImageLightbox({ src, onClose }) {
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
      a.href = url; a.download = "site-photo.jpg";
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { alert("Couldn't download this image."); } finally { setBusy(false); }
  }
  async function handleCopy() {
    setBusy(true);
    try {
      const blob = await getBlob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    } catch (e) { alert("Couldn't copy this image — your browser may not support copying images."); } finally { setBusy(false); }
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,15,30,0.9)", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8, zIndex: 101 }}>
        <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} className="btn btn-sm" style={{ background: "#fff", color: "var(--ink)" }}>−</button>
        <button onClick={() => setZoom((z) => Math.min(3, z + 0.25))} className="btn btn-sm" style={{ background: "#fff", color: "var(--ink)" }}>+</button>
        <button onClick={handleCopy} disabled={busy} className="btn btn-sm" style={{ background: "#fff", color: "var(--ink)" }}>Copy</button>
        <button onClick={handleDownload} disabled={busy} className="btn btn-sm" style={{ background: "#fff", color: "var(--ink)" }}>Download</button>
        <button onClick={onClose} className="btn btn-sm" style={{ background: "#fff", color: "var(--ink)" }}>✕</button>
      </div>
      <div style={{ overflow: "auto", maxWidth: "92vw", maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
        <img src={src} alt="" style={{ transform: `scale(${zoom})`, transition: "transform 0.15s", maxWidth: "92vw", maxHeight: "85vh", display: "block" }} />
      </div>
    </div>
  );
}
