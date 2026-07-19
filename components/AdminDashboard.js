"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, X, Trash2, Users as UsersIcon, Building2, CalendarCheck, ShieldCheck, Package, FileText, Wallet, TrendingUp, Truck, ClipboardList } from "lucide-react";
import SidebarNav from "@/components/SidebarNav";

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
  { id: "vendors", label: "Vendors", icon: Truck },
  { id: "workorders", label: "Work Orders", icon: ClipboardList },
  { id: "payments", label: "Payments", icon: Wallet },
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
  const [payments, setPayments] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    if (!hasLoadedOnce.current) setLoading(true);
    const [{ data: p }, { data: e }, { data: a }, { data: pr }, { data: si }, { data: m }, { data: dl }, { data: sc }, { data: pm }, { data: pd }, { data: vd }, { data: wo }] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("employees").select("*, projects(name)").order("created_at", { ascending: false }),
      supabase.from("attendance").select("*, employees(name), projects(name)").order("attendance_date", { ascending: false }).limit(100),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("stock_items").select("*").order("name", { ascending: true }),
      supabase.from("materials").select("*"),
      supabase.from("daily_logs").select("*, projects(name)").order("created_at", { ascending: false }),
      supabase.from("scope_items").select("*").order("created_at", { ascending: true }),
      supabase.from("payments").select("*").order("payment_date", { ascending: false }),
      supabase.from("prospects").select("*").order("created_at", { ascending: false }),
      supabase.from("vendors").select("*").order("name", { ascending: true }),
      supabase.from("work_orders").select("*").order("created_at", { ascending: false }),
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
    setPayments(pm || []);
    setProspects(pd || []);
    setVendors(vd || []);
    setWorkOrders(wo || []);
    hasLoadedOnce.current = true;
    setLoading(false);
  }

  const stats = {
    projects: projects.length,
    employees: employees.filter((e) => e.active).length,
    supervisors: supervisors.length,
    pending: profiles.filter((p) => p.role === "pending").length,
  };

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

          {loading ? (
            <p className="dash-sub">Loading…</p>
          ) : (
            <>
              {tab === "projects" && <ProjectsTab projects={projects} supervisors={supervisors} scopeItems={scopeItems} employees={employees} user={user} onChange={loadAll} />}
              {tab === "employees" && <EmployeesTab employees={employees} projects={projects} user={user} onChange={loadAll} />}
              {tab === "attendance" && <AttendanceTab attendance={attendance} onChange={loadAll} />}
              {tab === "stores" && <StoresTab stockItems={stockItems} materials={materials} user={user} onChange={loadAll} />}
              {tab === "vendors" && <VendorsTab vendors={vendors} user={user} onChange={loadAll} />}
              {tab === "workorders" && <WorkOrdersTab projects={projects} vendors={vendors} workOrders={workOrders} user={user} onChange={loadAll} />}
              {tab === "payments" && <PaymentsTab projects={projects} payments={payments} user={user} onChange={loadAll} />}
              {tab === "dailyreports" && <DailyReportsTab dailyLogs={dailyLogs} />}
              {tab === "users" && <UsersTab profiles={profiles} onChange={loadAll} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectsTab({ projects, supervisors, scopeItems, employees, user, onChange }) {
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

  async function createAndOpenScope() {
    if (!form.name.trim()) return;
    setError("");
    const { data, error: insertError } = await supabase
      .from("projects")
      .insert({ ...form, deadline: form.deadline || null, assigned_supervisor_id: form.assigned_supervisor_id || null, owner_id: user.id })
      .select()
      .single();
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setForm({ name: "", client: "", location: "", point_of_contact: "", point_of_contact_phone: "", deadline: "", scope_of_work: "", assigned_supervisor_id: "" });
    setShowNew(false);
    await onChange();
    setScopeProjectId(data.id);
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
                    <button onClick={() => setScopeProjectId(p.id)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }} title="Manage scope of work">
                      <strong style={{ color: "var(--blue)", textDecoration: "underline" }}>{p.name}</strong>
                    </button>
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
                      {supervisors.map((s) => <option key={s.id} value={s.id}>{s.full_name || s.email}</option>)}
                    </select>
                  </td>
                  <td style={{ minWidth: 130 }}>
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${p.completion_percentage}%` }} /></div>
                    {(() => {
                      const items = scopeItems.filter((s) => s.project_id === p.id);
                      if (items.length > 0) {
                        const done = items.filter((s) => s.completed).length;
                        return <div className="muted" style={{ marginTop: 6, fontSize: 11 }}>{p.completion_percentage}% · {done}/{items.length} scope items done</div>;
                      }
                      return <div className="muted" style={{ marginTop: 6, fontSize: 11 }}>{p.completion_percentage}% · no scope items yet</div>;
                    })()}
                  </td>
                  <td>
                    <span className={`status-pill ${p.status === "completed" ? "active" : "pending"}`}>{p.status === "completed" ? "Completed" : "Active"}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
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
              {supervisors.map((s) => <option key={s.id} value={s.id}>{s.full_name || s.email}</option>)}
            </select>
            <div className="field-hint" style={{ marginBottom: 8 }}>Status is set automatically based on completion — no need to choose it here.</div>
            <label className="field-label">Deadline</label>
            <input type="date" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            <label className="field-label" style={{ marginTop: 4 }}>Scope of work</label>
            <div className="field-hint" style={{ marginBottom: 8 }}>Create the project first, then use this button to build a checklist or attach a document — progress will track automatically from there.</div>
            <button className="btn btn-primary btn-sm" disabled={!form.name.trim()} onClick={createAndOpenScope}>Create project & set scope</button>
            {error && <div className="error-box" style={{ marginTop: 12 }}>{error}</div>}
            <button className="btn btn-primary btn-block" style={{ marginTop: 10 }} disabled={!form.name.trim()} onClick={createProject}>Create project</button>
          </div>
        </div>
      )}

      {scopeProjectId && (
        <ScopeModal
          project={projects.find((p) => p.id === scopeProjectId)}
          items={scopeItems.filter((s) => s.project_id === scopeProjectId)}
          employees={employees.filter((e) => e.project_id === scopeProjectId)}
          onClose={() => setScopeProjectId(null)}
          onChange={onChange}
        />
      )}
    </div>
  );
}

function ScopeModal({ project, items, employees, onClose, onChange }) {
  const [text, setText] = useState(project.scope_of_work || "");
  const [newItem, setNewItem] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function saveText() {
    await supabase.from("projects").update({ scope_of_work: text }).eq("id", project.id);
    onChange();
  }

  async function addItem() {
    if (!newItem.trim()) return;
    await supabase.from("scope_items").insert({
      project_id: project.id, description: newItem.trim(),
      assigned_to_employee_id: newAssignee || null, due_date: newDueDate || null, priority: newPriority,
    });
    setNewItem(""); setNewAssignee(""); setNewDueDate(""); setNewPriority("medium");
    onChange();
  }

  async function toggleItem(id, completed) {
    await supabase.from("scope_items").update({ completed: !completed }).eq("id", id);
    onChange();
  }

  async function updateAssignee(id, employeeId) {
    await supabase.from("scope_items").update({ assigned_to_employee_id: employeeId || null }).eq("id", id);
    onChange();
  }

  async function updateDueDate(id, dueDate) {
    await supabase.from("scope_items").update({ due_date: dueDate || null }).eq("id", id);
    onChange();
  }

  async function updatePriority(id, priority) {
    await supabase.from("scope_items").update({ priority }).eq("id", id);
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

  async function removeDocument() {
    if (!confirm("Remove this document? You can upload a new one right after.")) return;
    await supabase.from("projects").update({ scope_document_url: "" }).eq("id", project.id);
    onChange();
  }

  const done = items.filter((i) => i.completed).length;
  const priorityColor = { low: "#64748B", medium: "#A16207", high: "#B91C1C" };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 560, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="row-between">
          <h2 className="h2" style={{ color: "var(--ink)" }}>Tasks — {project.name}</h2>
          <button className="icon-btn" style={{ color: "var(--ink)" }} onClick={onClose}><X size={18} /></button>
        </div>

        {items.length > 0 && (
          <div className="dash-sub" style={{ marginBottom: 8 }}>
            Progress is calculated automatically: {done}/{items.length} tasks checked = {project.completion_percentage}%
          </div>
        )}

        <label className="field-label">Short summary (optional)</label>
        <textarea className="textarea" rows={2} value={text} onChange={(e) => setText(e.target.value)} onBlur={saveText} placeholder="What does this project actually cover?" />

        <label className="field-label">Attach a scope document</label>
        <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={handleUpload} disabled={uploading} />
        {uploading && <div className="muted" style={{ marginTop: 4 }}>Uploading…</div>}
        {error && <div className="error-box" style={{ marginTop: 8 }}>{error}</div>}
        {project.scope_document_url && (
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 10 }}>
            <a href={project.scope_document_url} target="_blank" rel="noreferrer">View uploaded document</a>
            <button className="icon-btn-sm" onClick={removeDocument} title="Remove document"><Trash2 size={13} /></button>
          </div>
        )}

        <label className="field-label" style={{ marginTop: 16 }}>Tasks</label>
        {items.length === 0 && <div className="muted" style={{ marginBottom: 8 }}>No tasks yet — add some below, or just attach a document above.</div>}
        {items.map((item) => {
          const assignee = employees.find((e) => e.id === item.assigned_to_employee_id);
          return (
            <div key={item.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={item.completed} onChange={() => toggleItem(item.id, item.completed)} />
                <span style={{ flex: 1, fontSize: 13, textDecoration: item.completed ? "line-through" : "none", color: item.completed ? "var(--muted)" : "var(--ink)" }}>
                  {item.description}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: priorityColor[item.priority] || priorityColor.medium, textTransform: "uppercase" }}>{item.priority || "medium"}</span>
                <button className="icon-btn-sm" onClick={() => removeItem(item.id)}><Trash2 size={12} /></button>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 6, paddingLeft: 24, flexWrap: "wrap" }}>
                <select className="select-input" style={{ fontSize: 11 }} value={item.assigned_to_employee_id || ""} onChange={(e) => updateAssignee(item.id, e.target.value)}>
                  <option value="">— Unassigned —</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <input type="date" className="input" style={{ fontSize: 11, width: 140 }} value={item.due_date || ""} onChange={(e) => updateDueDate(item.id, e.target.value)} />
                <select className="select-input" style={{ fontSize: 11 }} value={item.priority || "medium"} onChange={(e) => updatePriority(item.id, e.target.value)}>
                  <option value="low">Low priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="high">High priority</option>
                </select>
              </div>
            </div>
          );
        })}
        <div style={{ marginTop: 12, padding: "10px", background: "var(--paper)", borderRadius: 6 }}>
          <input className="input" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="e.g. Foundation work" onKeyDown={(e) => e.key === "Enter" && addItem()} />
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <select className="select-input" value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)}>
              <option value="">— Unassigned —</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <input type="date" className="input" style={{ width: 140 }} value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
            <select className="select-input" value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={addItem}><Plus size={14} /> Add task</button>
          </div>
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

export function UsersTab({ profiles, onChange, canManageAccounts }) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", role: "pending" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function setRole(id, role) {
    await supabase.from("profiles").update({ role }).eq("id", id);
    onChange();
  }

  async function callManageUser(method, body) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const res = await fetch("/api/manage-user", {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Something went wrong.");
    return json;
  }

  async function createUser() {
    setError("");
    if (!form.fullName.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Full name, email, and password are required.");
      return;
    }
    setBusy(true);
    try {
      await callManageUser("POST", { email: form.email, password: form.password, fullName: form.fullName, phone: form.phone, role: form.role });
      setForm({ fullName: "", email: "", phone: "", password: "", role: "pending" });
      setShowNew(false);
      onChange();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeUser(id, email) {
    if (!confirm(`Permanently remove ${email}? This can't be undone.`)) return;
    try {
      await callManageUser("DELETE", { userId: id });
      onChange();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div>
      {canManageAccounts && (
        <div className="row-between" style={{ marginBottom: 12 }}>
          <span className="dash-sub" style={{ marginBottom: 0 }}>{profiles.length} accounts</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}><Plus size={16} /> Add user</button>
        </div>
      )}
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead><tr><th>Email</th><th>Name</th><th>Role</th>{canManageAccounts && <th></th>}</tr></thead>
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
                    <option value="sales_manager">Sales Manager</option>
                    <option value="account_executive">Account Executive</option>
                    <option value="finance">Finance</option>
                  </select>
                </td>
                {canManageAccounts && (
                  <td><button className="icon-btn-sm" onClick={() => removeUser(p.id, p.email)}><Trash2 size={13} /></button></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && (
        <div className="modal-backdrop" onClick={() => setShowNew(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row-between">
              <h2 className="h2" style={{ color: "var(--ink)" }}>Add user</h2>
              <button className="icon-btn" style={{ color: "var(--ink)" }} onClick={() => setShowNew(false)}><X size={18} /></button>
            </div>
            <label className="field-label">Full name</label>
            <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: sanitizeName(e.target.value) })} autoFocus />
            <label className="field-label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <label className="field-label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })} />
            <label className="field-label">Temporary password</label>
            <input className="input" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="They can change this after signing in" />
            <label className="field-label">Role</label>
            <select className="select-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="pending">Pending</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="supervisor">Supervisor</option>
                    <option value="sales_manager">Sales Manager</option>
                    <option value="account_executive">Account Executive</option>
                    <option value="finance">Finance</option>
            </select>
            {error && <div className="error-box" style={{ marginTop: 12 }}>{error}</div>}
            <button className="btn btn-primary btn-block" disabled={busy} onClick={createUser}>{busy ? "Creating…" : "Create account"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function VendorsTab({ vendors, user, onChange }) {
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", contact_person: "", phone: "", email: "", trade: "", rate: "", rate_unit: "", notes: "" });
  const [error, setError] = useState("");

  function openEdit(v) {
    setForm({
      name: v.name, contact_person: v.contact_person || "", phone: v.phone || "", email: v.email || "",
      trade: v.trade || "", rate: v.rate || "", rate_unit: v.rate_unit || "", notes: v.notes || "",
    });
    setEditingId(v.id);
  }

  async function save() {
    if (!form.name.trim()) return;
    setError("");
    const payload = { ...form, contact_person: sanitizeName(form.contact_person), phone: sanitizePhone(form.phone), rate: Math.max(0, Number(form.rate) || 0) };
    const { error: saveError } = editingId
      ? await supabase.from("vendors").update(payload).eq("id", editingId)
      : await supabase.from("vendors").insert({ ...payload, created_by: user.id });
    if (saveError) { setError(saveError.message); return; }
    setForm({ name: "", contact_person: "", phone: "", email: "", trade: "", rate: "", rate_unit: "", notes: "" });
    setShowNew(false);
    setEditingId(null);
    onChange();
  }

  async function removeVendor(id, name) {
    if (!confirm(`Remove "${name}" from your vendor directory? This can't be undone.`)) return;
    await supabase.from("vendors").delete().eq("id", id);
    onChange();
  }

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <span className="dash-sub" style={{ marginBottom: 0 }}>Your directory of subcontractors and outside vendors — Work Orders pull from this list.</span>
        <button className="btn btn-primary btn-sm" onClick={() => { setForm({ name: "", contact_person: "", phone: "", email: "", trade: "", rate: "", rate_unit: "", notes: "" }); setEditingId(null); setShowNew(true); }}>
          <Plus size={16} /> Add vendor
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Trade</th><th>Contact</th><th>Phone</th><th>Rate</th><th></th></tr></thead>
          <tbody>
            {vendors.length === 0 && <tr><td colSpan={6} className="muted" style={{ padding: 20 }}>No vendors added yet.</td></tr>}
            {vendors.map((v) => (
              <tr key={v.id}>
                <td><strong>{v.name}</strong></td>
                <td>{v.trade || "—"}</td>
                <td>{v.contact_person || "—"}</td>
                <td>{v.phone || "—"}</td>
                <td>{v.rate ? `₹${Number(v.rate).toLocaleString()}${v.rate_unit ? ` / ${v.rate_unit}` : ""}` : "—"}</td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="icon-btn-sm" onClick={() => openEdit(v)}>Edit</button>
                    <button className="icon-btn-sm" onClick={() => removeVendor(v.id, v.name)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && (
        <div className="modal-backdrop" onClick={() => { setShowNew(false); setEditingId(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row-between">
              <h2 className="h2" style={{ color: "var(--ink)" }}>{editingId ? "Edit vendor" : "Add vendor"}</h2>
              <button className="icon-btn" style={{ color: "var(--ink)" }} onClick={() => { setShowNew(false); setEditingId(null); }}><X size={18} /></button>
            </div>
            <label className="field-label">Vendor / company name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            <label className="field-label">Contact person</label>
            <input className="input" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: sanitizeName(e.target.value) })} />
            <label className="field-label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })} />
            <label className="field-label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <label className="field-label">Trade / specialty</label>
            <input className="input" value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })} placeholder="e.g. Electrical, Scaffolding" />
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label className="field-label">Rate</label>
                <input type="number" min="0" className="input" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="field-label">Rate unit</label>
                <input className="input" value={form.rate_unit} onChange={(e) => setForm({ ...form, rate_unit: e.target.value })} placeholder="e.g. day, unit, sq.ft" />
              </div>
            </div>
            <label className="field-label">Notes</label>
            <textarea className="textarea" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            {error && <div className="error-box" style={{ marginTop: 12 }}>{error}</div>}
            <button className="btn btn-primary btn-block" disabled={!form.name.trim()} onClick={save}>{editingId ? "Save changes" : "Add vendor"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkOrdersTab({ projects, vendors, workOrders, user, onChange }) {
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ project_id: projects[0]?.id || "", vendor_id: "", title: "", description: "", status: "open", cost: "", issued_date: new Date().toISOString().slice(0, 10), due_date: "" });
  const [error, setError] = useState("");

  const STATUS_LABEL = { open: "Open", in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled" };
  const STATUS_CLASS = { open: "pending", in_progress: "pending", completed: "active", cancelled: "absent" };

  function openEdit(wo) {
    setForm({
      project_id: wo.project_id, vendor_id: wo.vendor_id || "", title: wo.title, description: wo.description || "",
      status: wo.status, cost: wo.cost || "", issued_date: wo.issued_date || "", due_date: wo.due_date || "",
    });
    setEditingId(wo.id);
    setShowNew(true);
  }

  async function save() {
    if (!form.title.trim() || !form.project_id) return;
    setError("");
    const payload = { ...form, vendor_id: form.vendor_id || null, cost: Math.max(0, Number(form.cost) || 0), due_date: form.due_date || null, updated_at: new Date().toISOString() };
    const { error: saveError } = editingId
      ? await supabase.from("work_orders").update(payload).eq("id", editingId)
      : await supabase.from("work_orders").insert({ ...payload, created_by: user.id });
    if (saveError) { setError(saveError.message); return; }
    setForm({ project_id: projects[0]?.id || "", vendor_id: "", title: "", description: "", status: "open", cost: "", issued_date: new Date().toISOString().slice(0, 10), due_date: "" });
    setShowNew(false);
    setEditingId(null);
    onChange();
  }

  async function removeWorkOrder(id, title) {
    if (!confirm(`Remove work order "${title}"? This can't be undone.`)) return;
    await supabase.from("work_orders").delete().eq("id", id);
    onChange();
  }

  async function quickSetStatus(id, status) {
    await supabase.from("work_orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    onChange();
  }

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <span className="dash-sub" style={{ marginBottom: 0 }}>Formal orders issued against a project — optionally to an outside vendor.</span>
        {projects.length > 0 && (
          <button className="btn btn-primary btn-sm" onClick={() => { setForm({ project_id: projects[0]?.id || "", vendor_id: "", title: "", description: "", status: "open", cost: "", issued_date: new Date().toISOString().slice(0, 10), due_date: "" }); setEditingId(null); setShowNew(true); }}>
            <Plus size={16} /> New work order
          </button>
        )}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead><tr><th>Project</th><th>Title</th><th>Vendor</th><th>Cost</th><th>Status</th><th>Due</th><th></th></tr></thead>
          <tbody>
            {workOrders.length === 0 && <tr><td colSpan={7} className="muted" style={{ padding: 20 }}>No work orders yet.</td></tr>}
            {workOrders.map((wo) => {
              const proj = projects.find((p) => p.id === wo.project_id);
              const vendor = vendors.find((v) => v.id === wo.vendor_id);
              return (
                <tr key={wo.id}>
                  <td>{proj?.name || "—"}</td>
                  <td><strong>{wo.title}</strong></td>
                  <td>{vendor?.name || <span className="muted">Internal</span>}</td>
                  <td>₹{Number(wo.cost || 0).toLocaleString()}</td>
                  <td>
                    <select className="select-input" value={wo.status} onChange={(e) => quickSetStatus(wo.id, e.target.value)}>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>{wo.due_date || "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="icon-btn-sm" onClick={() => openEdit(wo)}>Edit</button>
                      <button className="icon-btn-sm" onClick={() => removeWorkOrder(wo.id, wo.title)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showNew && (
        <div className="modal-backdrop" onClick={() => { setShowNew(false); setEditingId(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row-between">
              <h2 className="h2" style={{ color: "var(--ink)" }}>{editingId ? "Edit work order" : "New work order"}</h2>
              <button className="icon-btn" style={{ color: "var(--ink)" }} onClick={() => { setShowNew(false); setEditingId(null); }}><X size={18} /></button>
            </div>
            <label className="field-label">Project</label>
            <select className="select-input" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <label className="field-label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Electrical wiring — Level 2" autoFocus />
            <label className="field-label">Description</label>
            <textarea className="textarea" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <label className="field-label">Vendor (optional — leave unassigned for internal work)</label>
            <select className="select-input" value={form.vendor_id} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}>
              <option value="">— Internal / no vendor —</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}{v.trade ? ` — ${v.trade}` : ""}</option>)}
            </select>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label className="field-label">Cost</label>
                <input type="number" min="0" className="input" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="field-label">Status</label>
                <select className="select-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label className="field-label">Issued date</label>
                <input type="date" className="input" value={form.issued_date} onChange={(e) => setForm({ ...form, issued_date: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="field-label">Due date</label>
                <input type="date" className="input" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            {error && <div className="error-box" style={{ marginTop: 12 }}>{error}</div>}
            <button className="btn btn-primary btn-block" disabled={!form.title.trim()} onClick={save}>{editingId ? "Save changes" : "Create work order"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PaymentsTab({ projects, payments, user, onChange }) {
  const [selectedId, setSelectedId] = useState(projects[0]?.id || null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [contractDraft, setContractDraft] = useState(null);

  const selected = projects.find((p) => p.id === selectedId) || projects[0];
  const projPayments = payments.filter((pm) => pm.project_id === selected?.id);
  const totalPaid = projPayments.reduce((sum, pm) => sum + Number(pm.amount || 0), 0);
  const balance = (selected?.contract_value || 0) - totalPaid;
  const knownMethods = [...new Set(payments.map((pm) => pm.method).filter(Boolean))];

  async function addPayment() {
    if (!selected || !amount || Number(amount) <= 0) return;
    await supabase.from("payments").insert({
      project_id: selected.id, amount: Number(amount), method: method.trim() || "Not specified", payment_date: date, added_by: user.id,
    });
    setAmount("");
    setMethod("");
    onChange();
  }

  async function removePayment(id) {
    if (!confirm("Remove this payment record?")) return;
    await supabase.from("payments").delete().eq("id", id);
    onChange();
  }

  async function saveContractValue() {
    if (contractDraft === null || !selected) return;
    await supabase.from("projects").update({ contract_value: Number(contractDraft) }).eq("id", selected.id);
    setContractDraft(null);
    onChange();
  }

  if (projects.length === 0) return <div className="empty"><p>No projects yet.</p></div>;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {projects.map((p) => (
          <button key={p.id} onClick={() => setSelectedId(p.id)} className={`tab-btn ${selected?.id === p.id ? "active" : ""}`} style={{ border: "1px solid var(--border)", borderRadius: 20, padding: "6px 14px" }}>
            {p.name}
          </button>
        ))}
      </div>

      {selected && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-num">
                {contractDraft !== null ? (
                  <input type="number" min="0" autoFocus value={contractDraft} onChange={(e) => setContractDraft(e.target.value)} onBlur={saveContractValue} onKeyDown={(e) => e.key === "Enter" && saveContractValue()} style={{ width: 100, fontSize: 20, border: "1px solid var(--line)", borderRadius: 4, padding: "2px 6px" }} />
                ) : (
                  <span onClick={() => setContractDraft(selected.contract_value || 0)} style={{ cursor: "pointer" }} title="Click to edit">₹{Number(selected.contract_value || 0).toLocaleString()}</span>
                )}
              </div>
              <div className="stat-label">Contract Value (click to edit)</div>
            </div>
            <div className="stat-card"><div className="stat-num">₹{totalPaid.toLocaleString()}</div><div className="stat-label">Paid So Far</div></div>
            <div className="stat-card"><div className="stat-num" style={{ color: balance > 0 ? "#B91C1C" : "#15803D" }}>₹{balance.toLocaleString()}</div><div className="stat-label">{balance <= 0 ? "Fully Paid" : "Balance Due"}</div></div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-head">Record a payment</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <label className="field-label">Amount</label>
                <input type="number" min="0" className="input" style={{ width: 130 }} value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div>
                <label className="field-label">Payment method</label>
                <input className="input" list="payment-methods" style={{ width: 160 }} value={method} onChange={(e) => setMethod(e.target.value)} placeholder="e.g. UPI" />
                <datalist id="payment-methods">{knownMethods.map((m) => <option key={m} value={m} />)}</datalist>
              </div>
              <div>
                <label className="field-label">Date</label>
                <input type="date" className="input" style={{ width: 150 }} value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <button className="btn btn-primary btn-sm" onClick={addPayment} disabled={!amount || Number(amount) <= 0}>Add payment</button>
            </div>
          </div>

          <table className="data-table">
            <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th></th></tr></thead>
            <tbody>
              {projPayments.length === 0 && <tr><td colSpan={4} className="muted" style={{ padding: 20 }}>No payments recorded yet for this project.</td></tr>}
              {projPayments.map((pm) => (
                <tr key={pm.id}>
                  <td>{pm.payment_date}</td>
                  <td>₹{Number(pm.amount).toLocaleString()}</td>
                  <td>{pm.method}</td>
                  <td><button className="icon-btn-sm" onClick={() => removePayment(pm.id)}><Trash2 size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
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

const PIPELINE_STAGES = [
  { id: "lead", label: "Lead" },
  { id: "site_visit", label: "Site Visit" },
  { id: "quote", label: "Quote" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
];

export function ProspectsTab({ prospects, user, onChange }) {
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showHistoryId, setShowHistoryId] = useState(null);
  const [form, setForm] = useState({ business_name: "", contact_person: "", phone: "", email: "", source: "", requirement: "", notes: "" });
  const [error, setError] = useState("");

  const pending = prospects.filter((p) => p.stage === "pending_review");
  const decided = prospects.filter((p) => p.stage !== "pending_review");

  function priorCount(p) {
    if (!p.client_id) return 0;
    return prospects.filter((pp) => pp.client_id === p.client_id && pp.id !== p.id).length;
  }

  async function addProspect() {
    if (!form.business_name.trim()) return;
    setError("");
    const { error: insertError } = await supabase.from("prospects").insert({
      ...form, contact_person: sanitizeName(form.contact_person), phone: sanitizePhone(form.phone), created_by: user.id,
    });
    if (insertError) { setError(insertError.message); return; }
    setForm({ business_name: "", contact_person: "", phone: "", email: "", source: "", requirement: "", notes: "" });
    setShowNew(false);
    onChange();
  }

  async function decide(id, stage) {
    await supabase.from("prospects").update({ stage, updated_at: new Date().toISOString() }).eq("id", id);
    onChange();
  }

  async function deleteProspect(id, name) {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
    await supabase.from("prospects").delete().eq("id", id);
    onChange();
  }

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <span className="dash-sub" style={{ marginBottom: 0 }}>Enter prospects here, then Qualify or Disqualify each one — Qualified prospects move into Client Management as a Lead.</span>
        <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}><Plus size={16} /> Add prospect</button>
      </div>

      <h3 className="h2" style={{ fontSize: 13, marginBottom: 8 }}>Pending review ({pending.length})</h3>
      <div style={{ overflowX: "auto", marginBottom: 24 }}>
        <table className="data-table">
          <thead><tr><th>Business</th><th>Contact</th><th>Phone</th><th>Source</th><th></th></tr></thead>
          <tbody>
            {pending.length === 0 && <tr><td colSpan={5} className="muted" style={{ padding: 20 }}>Nothing waiting for review.</td></tr>}
            {pending.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.business_name}</strong>
                  {priorCount(p) > 0 && (
                    <div>
                      <button className="icon-btn-sm" style={{ color: "#A16207", fontSize: 10.5 }} onClick={() => setShowHistoryId(p.id)}>
                        ↻ Returning client ({priorCount(p)} prior)
                      </button>
                    </div>
                  )}
                </td>
                <td>{p.contact_person || "—"}</td>
                <td>{p.phone || "—"}</td>
                <td>{p.source || "—"}</td>
                <td>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button className="btn btn-primary btn-sm" style={{ background: "#15803D", fontSize: 11, padding: "4px 10px" }} onClick={() => decide(p.id, "lead")}>Qualified</button>
                    <button className="btn btn-primary btn-sm" style={{ background: "#B91C1C", fontSize: 11, padding: "4px 10px" }} onClick={() => decide(p.id, "disqualified")}>Disqualified</button>
                    <button className="icon-btn-sm" onClick={() => setEditingId(p.id)}>Edit</button>
                    <button className="icon-btn-sm" onClick={() => deleteProspect(p.id, p.business_name)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="h2" style={{ fontSize: 13, marginBottom: 8 }}>Already decided ({decided.length})</h3>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead><tr><th>Business</th><th>Contact</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {decided.length === 0 && <tr><td colSpan={4} className="muted" style={{ padding: 20 }}>Nothing decided yet.</td></tr>}
            {decided.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.business_name}
                  {priorCount(p) > 0 && (
                    <div>
                      <button className="icon-btn-sm" style={{ color: "#A16207", fontSize: 10.5 }} onClick={() => setShowHistoryId(p.id)}>
                        ↻ Returning client ({priorCount(p)} prior)
                      </button>
                    </div>
                  )}
                </td>
                <td>{p.contact_person || "—"}</td>
                <td>
                  {p.stage === "disqualified" ? (
                    <span className="status-pill absent">Disqualified</span>
                  ) : (
                    <span className="status-pill active">Qualified — {PIPELINE_STAGES.find((s) => s.id === p.stage)?.label || p.stage}</span>
                  )}
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="icon-btn-sm" onClick={() => setEditingId(p.id)}>Edit</button>
                    <button className="icon-btn-sm" onClick={() => deleteProspect(p.id, p.business_name)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showHistoryId && (
        <ClientHistoryModal
          clientId={prospects.find((p) => p.id === showHistoryId)?.client_id}
          currentProspectId={showHistoryId}
          prospects={prospects}
          onClose={() => setShowHistoryId(null)}
        />
      )}

      {showNew && (
        <div className="modal-backdrop" onClick={() => setShowNew(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row-between">
              <h2 className="h2" style={{ color: "var(--ink)" }}>Add prospect</h2>
              <button className="icon-btn" style={{ color: "var(--ink)" }} onClick={() => setShowNew(false)}><X size={18} /></button>
            </div>
            <label className="field-label">Business name</label>
            <input className="input" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} autoFocus />
            <label className="field-label">Contact person</label>
            <input className="input" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: sanitizeName(e.target.value) })} />
            <label className="field-label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })} />
            <label className="field-label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <label className="field-label">Source</label>
            <input className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="e.g. Referral, Website, Cold call" />
            <label className="field-label">Requirement</label>
            <textarea className="textarea" rows={2} value={form.requirement} onChange={(e) => setForm({ ...form, requirement: e.target.value })} placeholder="What does this prospect actually need?" />
            <label className="field-label">Notes</label>
            <textarea className="textarea" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            {error && <div className="error-box" style={{ marginTop: 12 }}>{error}</div>}
            <button className="btn btn-primary btn-block" disabled={!form.business_name.trim()} onClick={addProspect}>Add prospect</button>
          </div>
        </div>
      )}

      {editingId && (
        <EditProspectModal
          prospect={prospects.find((p) => p.id === editingId)}
          onClose={() => setEditingId(null)}
          onChange={onChange}
        />
      )}
    </div>
  );
}

function ClientHistoryModal({ clientId, currentProspectId, prospects, onClose }) {
  const history = prospects.filter((p) => p.client_id === clientId && p.id !== currentProspectId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  function outcomeLabel(p) {
    if (p.stage === "disqualified") return { text: "Disqualified at prospect stage", color: "#B91C1C" };
    if (p.stage === "lost") return { text: "Lost" + (p.lost_reason ? ` — ${p.lost_reason}` : ""), color: "#B91C1C" };
    if (p.stage === "won") return { text: "Won" + (p.converted_project_id ? " (became a project)" : ""), color: "#15803D" };
    return { text: "Still in progress — " + (PIPELINE_STAGES.find((s) => s.id === p.stage)?.label || p.stage), color: "#A16207" };
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row-between">
          <h2 className="h2" style={{ color: "var(--ink)" }}>Client history</h2>
          <button className="icon-btn" style={{ color: "var(--ink)" }} onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dash-sub" style={{ marginBottom: 12 }}>Every past time this business has approached before — so you know what happened last time before deciding again.</div>
        {history.length === 0 ? (
          <div className="muted">No prior history found.</div>
        ) : (
          history.map((p) => {
            const outcome = outcomeLabel(p);
            return (
              <div key={p.id} style={{ borderBottom: "1px solid var(--line)", padding: "10px 0" }}>
                <div className="muted" style={{ fontSize: 11 }}>{p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: outcome.color }}>{outcome.text}</div>
                {p.requirement && <div style={{ fontSize: 12, marginTop: 2 }}>Requirement: {p.requirement}</div>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function EditProspectModal({ prospect, onClose, onChange }) {
  const [form, setForm] = useState({
    business_name: prospect.business_name || "",
    contact_person: prospect.contact_person || "",
    phone: prospect.phone || "",
    email: prospect.email || "",
    source: prospect.source || "",
    requirement: prospect.requirement || "",
    notes: prospect.notes || "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!form.business_name.trim()) return;
    setBusy(true);
    setError("");
    const { error: updateError } = await supabase.from("prospects").update(form).eq("id", prospect.id);
    setBusy(false);
    if (updateError) { setError(updateError.message); return; }
    onChange();
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row-between">
          <h2 className="h2" style={{ color: "var(--ink)" }}>Edit prospect</h2>
          <button className="icon-btn" style={{ color: "var(--ink)" }} onClick={onClose}><X size={18} /></button>
        </div>
        <label className="field-label">Business name</label>
        <input className="input" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} autoFocus />
        <label className="field-label">Contact person</label>
        <input className="input" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: sanitizeName(e.target.value) })} />
        <label className="field-label">Phone</label>
        <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })} />
        <label className="field-label">Email</label>
        <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label className="field-label">Source</label>
        <input className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
        <label className="field-label">Requirement</label>
        <textarea className="textarea" rows={2} value={form.requirement} onChange={(e) => setForm({ ...form, requirement: e.target.value })} />
        <label className="field-label">Notes</label>
        <textarea className="textarea" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        {error && <div className="error-box" style={{ marginTop: 12 }}>{error}</div>}
        <button className="btn btn-primary btn-block" disabled={busy || !form.business_name.trim()} onClick={save}>{busy ? "Saving…" : "Save changes"}</button>
      </div>
    </div>
  );
}

export function ClientManagementTab({ prospects, supervisors, user, onChange }) {
  const [showConvertId, setShowConvertId] = useState(null);
  const [showQuoteId, setShowQuoteId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showHistoryId, setShowHistoryId] = useState(null);
  const qualified = prospects.filter((p) => p.stage !== "pending_review" && p.stage !== "disqualified");

  function priorCount(p) {
    if (!p.client_id) return 0;
    return prospects.filter((pp) => pp.client_id === p.client_id && pp.id !== p.id).length;
  }

  const openValue = qualified.filter((p) => p.stage !== "won" && p.stage !== "lost").reduce((s, p) => s + Number(p.estimated_value || 0), 0);
  const wonValue = qualified.filter((p) => p.stage === "won").reduce((s, p) => s + Number(p.estimated_value || 0), 0);
  const wonCount = qualified.filter((p) => p.stage === "won").length;
  const lostCount = qualified.filter((p) => p.stage === "lost").length;
  const closedCount = wonCount + lostCount;
  const winRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;

  async function setSiteVisit(id, value) {
    await supabase.from("prospects").update({ site_visit: value, updated_at: new Date().toISOString() }).eq("id", id);
    onChange();
  }

  async function saveLostReason(id, reason) {
    await supabase.from("prospects").update({ lost_reason: reason }).eq("id", id);
    onChange();
  }

  async function deleteClient(id, name) {
    if (!confirm(`Delete "${name}" from the pipeline? This can't be undone.`)) return;
    await supabase.from("prospects").delete().eq("id", id);
    onChange();
  }

  return (
    <div>
      <div className="stat-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card"><div className="stat-num">₹{openValue.toLocaleString()}</div><div className="stat-label">Open Pipeline Value</div></div>
        <div className="stat-card"><div className="stat-num">₹{wonValue.toLocaleString()}</div><div className="stat-label">Won Value</div></div>
        <div className="stat-card"><div className="stat-num">{qualified.filter((p) => p.stage !== "won" && p.stage !== "lost").length}</div><div className="stat-label">Active Leads</div></div>
        <div className="stat-card"><div className="stat-num">{winRate}%</div><div className="stat-label">Win Rate</div></div>
        <div className="stat-card"><div className="stat-num">{wonCount}</div><div className="stat-label">Won</div></div>
      </div>
      <div className="dash-sub" style={{ marginBottom: 12 }}>
        Set Site Visit to Yes, then add the quote — Qualified moves a lead to Won (its amount moves from "Open Pipeline Value" into "Won Value"); Disqualified moves it to Lost with a reason kept on file.
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr><th>Business</th><th>Requirement</th><th>Contact</th><th>Site Visit</th><th>Quote</th><th>Status</th><th>Reason (if Lost)</th><th></th></tr>
          </thead>
          <tbody>
            {qualified.length === 0 && <tr><td colSpan={8} className="muted" style={{ padding: 20 }}>No qualified leads yet — qualify a prospect first.</td></tr>}
            {qualified.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.business_name}</strong>
                  {priorCount(p) > 0 && (
                    <div>
                      <button className="icon-btn-sm" style={{ color: "#A16207", fontSize: 10.5 }} onClick={() => setShowHistoryId(p.id)}>
                        ↻ Returning ({priorCount(p)} prior)
                      </button>
                    </div>
                  )}
                </td>
                <td style={{ maxWidth: 180, whiteSpace: "normal" }}>{p.requirement || "—"}</td>
                <td>{p.contact_person || "—"}</td>
                <td>
                  <select className="select-input" value={p.site_visit || "pending"} onChange={(e) => setSiteVisit(p.id, e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </td>
                <td>
                  {p.site_visit !== "yes" ? (
                    <span className="muted" style={{ fontSize: 11 }}>Awaiting site visit</span>
                  ) : p.quote_decision === "pending" || !p.quote_decision ? (
                    <button className="btn btn-primary btn-sm" style={{ fontSize: 11 }} onClick={() => setShowQuoteId(p.id)}>Add quote</button>
                  ) : (
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700 }}>₹{Number(p.quote_amount || 0).toLocaleString()}</div>
                      {p.quote_document_url && <a href={p.quote_document_url} target="_blank" rel="noreferrer" style={{ fontSize: 10.5 }}>View quote</a>}
                    </div>
                  )}
                </td>
                <td>
                  {p.stage === "won" && <span className="status-pill active">Won</span>}
                  {p.stage === "lost" && <span className="status-pill absent">Lost</span>}
                  {p.stage === "lead" && <span className="status-pill pending">Lead</span>}
                </td>
                <td>
                  {p.stage === "lost" ? (
                    <input
                      className="input" defaultValue={p.lost_reason || ""} placeholder="Why was this lost?"
                      onBlur={(e) => { if (e.target.value !== p.lost_reason) saveLostReason(p.id, e.target.value); }}
                      style={{ minWidth: 160 }}
                    />
                  ) : "NA"}
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    {p.stage === "won" && !p.converted_project_id && (
                      <button className="btn btn-primary btn-sm" style={{ fontSize: 11 }} onClick={() => setShowConvertId(p.id)}>Convert to project</button>
                    )}
                    {p.converted_project_id && <span className="muted" style={{ fontSize: 11 }}>✓ Converted</span>}
                    <button className="icon-btn-sm" onClick={() => setEditingId(p.id)}>Edit</button>
                    <button className="icon-btn-sm" onClick={() => deleteClient(p.id, p.business_name)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showConvertId && (
        <ConvertProspectModal
          prospect={qualified.find((p) => p.id === showConvertId)}
          supervisors={supervisors}
          user={user}
          onClose={() => setShowConvertId(null)}
          onChange={onChange}
        />
      )}

      {showQuoteId && (
        <QuoteModal
          prospect={qualified.find((p) => p.id === showQuoteId)}
          onClose={() => setShowQuoteId(null)}
          onChange={onChange}
        />
      )}

      {editingId && (
        <EditProspectModal
          prospect={qualified.find((p) => p.id === editingId)}
          onClose={() => setEditingId(null)}
          onChange={onChange}
        />
      )}

      {showHistoryId && (
        <ClientHistoryModal
          clientId={qualified.find((p) => p.id === showHistoryId)?.client_id}
          currentProspectId={showHistoryId}
          prospects={prospects}
          onClose={() => setShowHistoryId(null)}
        />
      )}
    </div>
  );
}

function QuoteModal({ prospect, onClose, onChange }) {
  const [amount, setAmount] = useState(prospect.quote_amount || "");
  const [file, setFile] = useState(null);
  const [documentUrl, setDocumentUrl] = useState(prospect.quote_document_url || "");
  const [extracting, setExtracting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function fileToBase64(f) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  }

  async function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError("");
    setExtracting(true);
    try {
      const base64 = await fileToBase64(f);
      const res = await fetch("/api/extract-quote-amount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, mediaType: f.type }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Couldn't read that document.");
      setAmount(json.amount);
    } catch (err) {
      setError(err.message + " You can enter the amount below manually instead.");
    } finally {
      setExtracting(false);
    }
  }

  async function decide(decision) {
    if (!amount || Number(amount) <= 0) {
      setError("No amount yet — upload a quote document, or enter the amount manually.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      let finalDocumentUrl = documentUrl;
      if (file) {
        const path = `quote-docs/${prospect.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("site-photos").upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("site-photos").getPublicUrl(path);
        finalDocumentUrl = pub.publicUrl;
      }
      const { error: updateError } = await supabase.from("prospects").update({
        quote_amount: Number(amount),
        quote_document_url: finalDocumentUrl,
        quote_decision: decision,
        updated_at: new Date().toISOString(),
      }).eq("id", prospect.id);
      if (updateError) throw updateError;
      onChange();
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row-between">
          <h2 className="h2" style={{ color: "var(--ink)" }}>Add quote — {prospect.business_name}</h2>
          <button className="icon-btn" style={{ color: "var(--ink)" }} onClick={onClose}><X size={18} /></button>
        </div>
        <label className="field-label">Upload quote document</label>
        <input type="file" accept=".pdf,image/*" onChange={handleFile} disabled={extracting} />
        <div className="field-hint">PDF or image only — the amount is read automatically from the document, no need to type it separately.</div>
        {extracting && <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>Reading the quote…</div>}
        {!extracting && amount && (
          <div style={{ marginTop: 10 }}>
            <div className="field-label">Quote amount {file ? "(read from document — edit if it's wrong)" : ""}</div>
            <input type="number" min="0" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        )}
        {documentUrl && !file && (
          <div className="muted" style={{ marginTop: 6, fontSize: 11 }}><a href={documentUrl} target="_blank" rel="noreferrer">View current quote document</a> — upload a new one only to replace it.</div>
        )}
        {error && <div className="error-box" style={{ marginTop: 12 }}>{error}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button className="btn btn-primary btn-block" style={{ background: "#15803D" }} disabled={uploading || extracting} onClick={() => decide("qualified")}>
            {uploading ? "Saving…" : "Qualified"}
          </button>
          <button className="btn btn-primary btn-block" style={{ background: "#B91C1C" }} disabled={uploading || extracting} onClick={() => decide("disqualified")}>
            {uploading ? "Saving…" : "Disqualified"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConvertProspectModal({ prospect, supervisors, user, onClose, onChange }) {
  const [projectName, setProjectName] = useState(prospect.business_name);
  const [supervisorId, setSupervisorId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function convert() {
    if (!projectName.trim()) return;
    setBusy(true);
    setError("");
    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert({
        name: projectName.trim(),
        client: prospect.business_name,
        client_id: prospect.client_id || null,
        point_of_contact: prospect.contact_person,
        point_of_contact_phone: prospect.phone,
        contract_value: prospect.estimated_value,
        assigned_supervisor_id: supervisorId || null,
        owner_id: user.id,
      })
      .select()
      .single();
    if (insertError) { setError(insertError.message); setBusy(false); return; }

    await supabase.from("prospects").update({ converted_project_id: project.id }).eq("id", prospect.id);
    setBusy(false);
    onChange();
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row-between">
          <h2 className="h2" style={{ color: "var(--ink)" }}>Convert to project</h2>
          <button className="icon-btn" style={{ color: "var(--ink)" }} onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dash-sub" style={{ marginBottom: 12 }}>
          Client, contact info, and estimated value (₹{Number(prospect.estimated_value).toLocaleString()}) carry over automatically as the contract value.
        </div>
        <label className="field-label">Project name</label>
        <input className="input" value={projectName} onChange={(e) => setProjectName(e.target.value)} autoFocus />
        <label className="field-label">Assign Supervisor</label>
        <select className="select-input" value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)}>
          <option value="">— Unassigned —</option>
          {supervisors.map((s) => <option key={s.id} value={s.id}>{s.full_name || s.email}</option>)}
        </select>
        {error && <div className="error-box" style={{ marginTop: 12 }}>{error}</div>}
        <button className="btn btn-primary btn-block" disabled={busy || !projectName.trim()} onClick={convert}>{busy ? "Creating…" : "Create project from this client"}</button>
      </div>
    </div>
  );
}
