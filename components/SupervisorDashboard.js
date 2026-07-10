"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, X, FileText, CalendarCheck, Package, Building2, CheckCircle2, XCircle, Trash2 } from "lucide-react";

const TABS = [
  { id: "projects", label: "My Projects", icon: Building2 },
  { id: "employees", label: "Employees", icon: Package },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "materials", label: "Materials", icon: Package },
  { id: "dailylog", label: "Daily Log", icon: FileText },
];

export default function SupervisorDashboard({ user }) {
  const [tab, setTab] = useState("projects");
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const { data: p } = await supabase.from("projects").select("*").eq("assigned_supervisor_id", user.id).order("created_at", { ascending: false });
    const projectIds = (p || []).map((x) => x.id);
    const [{ data: e }, { data: a }, { data: m }, { data: dl }] = projectIds.length
      ? await Promise.all([
          supabase.from("employees").select("*").in("project_id", projectIds).order("created_at", { ascending: false }),
          supabase.from("attendance").select("*").in("project_id", projectIds),
          supabase.from("materials").select("*").in("project_id", projectIds).order("created_at", { ascending: false }),
          supabase.from("daily_logs").select("*").in("project_id", projectIds).order("created_at", { ascending: false }),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];
    setProjects(p || []);
    setEmployees(e || []);
    setAttendance(a || []);
    setMaterials(m || []);
    setDailyLogs(dl || []);
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
          {tab === "projects" && <MyProjectsTab projects={projects} employees={employees} onChange={loadAll} />}
          {tab === "employees" && <MyEmployeesTab employees={employees} projects={projects} user={user} onChange={loadAll} />}
          {tab === "attendance" && <MarkAttendanceTab employees={employees} attendance={attendance} user={user} onChange={loadAll} />}
          {tab === "materials" && <MaterialsTab projects={projects} materials={materials} user={user} onChange={loadAll} />}
          {tab === "dailylog" && <DailyLogTab projects={projects} dailyLogs={dailyLogs} user={user} onChange={loadAll} />}
        </>
      )}
    </div>
  );
}

function MyProjectsTab({ projects, employees, onChange }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(0);

  async function saveCompletion(id) {
    await supabase.from("projects").update({ completion_percentage: draft }).eq("id", id);
    setEditingId(null);
    onChange();
  }

  if (projects.length === 0) {
    return <div className="empty"><p>No projects assigned to you yet — check with your Admin.</p></div>;
  }
  return (
    <div className="grid">
      {projects.map((p) => {
        const team = employees.filter((e) => e.project_id === p.id);
        const isEditing = editingId === p.id;
        return (
          <div key={p.id} className="project-card">
            <div className="project-name"><a href={`/projects/${p.id}`}>{p.name}</a></div>
            <div className="project-meta">Client — {p.client || "—"}</div>
            <div className="project-meta">Site — {p.location || "—"}</div>
            {p.deadline && <div className="project-meta">Deadline — {p.deadline}</div>}
            <div style={{ marginTop: 10 }}>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${p.completion_percentage}%` }} /></div>
              {isEditing ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
                  <input type="number" min="0" max="100" value={draft} onChange={(e) => setDraft(Number(e.target.value))}
                    style={{ width: 55, border: "1px solid var(--line)", borderRadius: 3, padding: "2px 6px", fontSize: 12 }} />
                  <span className="muted">%</span>
                  <button className="btn btn-primary btn-sm" style={{ padding: "3px 10px", fontSize: 11 }} onClick={() => saveCompletion(p.id)}>Save</button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                  <span className="muted">{p.completion_percentage}% complete</span>
                  <button className="icon-btn-sm" onClick={() => { setEditingId(p.id); setDraft(p.completion_percentage); }}>Update</button>
                </div>
              )}
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 4 }}>Team ({team.length})</div>
              {team.length === 0 ? <span className="muted">No crew assigned yet.</span> : (
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5 }}>
                  {team.map((e) => <li key={e.id}>{e.name} — {e.trade || "—"}</li>)}
                </ul>
              )}
            </div>
            <div className="project-actions">
              <a className="link-action" href={`/projects/${p.id}/new-report`}><FileText size={14} /> Full AI daily report</a>
            </div>
          </div>
        );
      })}
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
            <label className="field-label">Position / Trade</label>
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

function MarkAttendanceTab({ employees, attendance, user, onChange }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [statuses, setStatuses] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const forDate = {};
    attendance.filter((a) => a.attendance_date === date).forEach((a) => { forDate[a.employee_id] = a.status; });
    setStatuses(forDate);
  }, [date, attendance]);

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
    onChange();
    setTimeout(() => setSaved(false), 2500);
  }

  if (employees.length === 0) {
    return <div className="empty"><p>Add crew members first, then mark attendance here.</p></div>;
  }

  return (
    <div>
      <label className="field-label">Date</label>
      <input type="date" className="input" style={{ maxWidth: 200, marginBottom: 6 }} value={date} onChange={(e) => setDate(e.target.value)} />
      <div className="dash-sub" style={{ marginTop: 0, marginBottom: 12 }}>Pick any past date to view or correct that day's attendance.</div>

      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Present</th><th>Absent</th><th>Half day</th><th>Status</th></tr></thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id}>
                <td>{e.name}</td>
                {["present", "absent", "half_day"].map((s) => (
                  <td key={s}>
                    <input type="radio" name={`att-${e.id}`} checked={statuses[e.id] === s} onChange={() => setStatus(e.id, s)} />
                  </td>
                ))}
                <td>
                  {statuses[e.id] === "present" && <CheckCircle2 size={18} color="#15803D" />}
                  {statuses[e.id] === "absent" && <XCircle size={18} color="#B91C1C" />}
                  {statuses[e.id] === "half_day" && <span className="status-pill half_day">half day</span>}
                  {!statuses[e.id] && <span className="muted">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={saveAll}>Save attendance</button>
      {saved && <span className="muted" style={{ marginLeft: 12, color: "#15803D" }}>Saved ✓</span>}
    </div>
  );
}

function MaterialsTab({ projects, materials, user, onChange }) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ project_id: projects[0]?.id || "", name: "", used: "", required: "", unit: "" });

  async function add() {
    if (!form.name.trim() || !form.project_id) return;
    await supabase.from("materials").insert({ ...form, logged_by: user.id });
    setForm({ project_id: projects[0]?.id || "", name: "", used: "", required: "", unit: "" });
    setShowNew(false);
    onChange();
  }
  async function remove(id) {
    await supabase.from("materials").delete().eq("id", id);
    onChange();
  }

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <span className="dash-sub" style={{ marginBottom: 0 }}>Stock used vs. required, per material</span>
        {projects.length > 0 && <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}><Plus size={16} /> Add material</button>}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead><tr><th>Material</th><th>Used</th><th>Required</th><th>Unit</th><th></th></tr></thead>
          <tbody>
            {materials.length === 0 && <tr><td colSpan={5} className="muted" style={{ padding: 20 }}>No materials logged yet.</td></tr>}
            {materials.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td><td>{m.used || 0}</td><td>{m.required || 0}</td><td>{m.unit || "—"}</td>
                <td><button className="icon-btn-sm" onClick={() => remove(m.id)}><Trash2 size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && (
        <div className="modal-backdrop" onClick={() => setShowNew(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row-between">
              <h2 className="h2" style={{ color: "var(--ink)" }}>Add material</h2>
              <button className="icon-btn" style={{ color: "var(--ink)" }} onClick={() => setShowNew(false)}><X size={18} /></button>
            </div>
            <label className="field-label">Project</label>
            <select className="select-input" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <label className="field-label">Material name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cement bags" autoFocus />
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label className="field-label">Stock used</label>
                <input type="number" min="0" className="input" value={form.used} onChange={(e) => setForm({ ...form, used: Math.max(0, Number(e.target.value) || 0) })} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="field-label">Stock required</label>
                <input type="number" min="0" className="input" value={form.required} onChange={(e) => setForm({ ...form, required: Math.max(0, Number(e.target.value) || 0) })} />
              </div>
            </div>
            <label className="field-label">Unit</label>
            <input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. bags, tons, pieces" />
            <button className="btn btn-primary btn-block" disabled={!form.name.trim()} onClick={add}>Add material</button>
          </div>
        </div>
      )}
    </div>
  );
}

function resizeImage(file, maxWidth = 900, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function DailyLogTab({ projects, dailyLogs, user, onChange }) {
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState([]); // { id, previewUrl, blob }
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e) {
    const files = Array.from(e.target.files || []).slice(0, 8 - photos.length);
    for (const f of files) {
      const blob = await resizeImage(f);
      setPhotos((prev) => [...prev, { id: crypto.randomUUID(), previewUrl: URL.createObjectURL(blob), blob }]);
    }
    e.target.value = "";
  }
  function removePhoto(id) { setPhotos((prev) => prev.filter((p) => p.id !== id)); }

  async function submit() {
    if (!projectId || (!text.trim() && photos.length === 0)) return;
    setUploading(true);
    try {
      const photoUrls = [];
      for (const p of photos) {
        const path = `dailylogs/${projectId}/${p.id}.jpg`;
        const { error: upErr } = await supabase.storage.from("site-photos").upload(path, p.blob, { contentType: "image/jpeg", upsert: true });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("site-photos").getPublicUrl(path);
        photoUrls.push(pub.publicUrl);
      }
      await supabase.from("daily_logs").insert({ project_id: projectId, log_date: date, text: text.trim(), photo_urls: photoUrls, logged_by: user.id });
      setText(""); setPhotos([]);
      onChange();
    } catch (e) {
      alert("Failed to submit daily log: " + e.message);
    } finally {
      setUploading(false);
    }
  }

  if (projects.length === 0) {
    return <div className="empty"><p>You need an assigned project before submitting a daily log.</p></div>;
  }

  const myLogs = dailyLogs;

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <div>
          <label className="field-label">Project</label>
          <select className="select-input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Date</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <label className="field-label">Work summary</label>
      <textarea className="textarea" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="What happened on site today?" />

      <label className="field-label">Photos ({photos.length}/8)</label>
      <div className="photo-grid">
        {photos.map((p) => (
          <div className="photo-thumb" key={p.id}>
            <img src={p.previewUrl} alt="" />
            <button className="photo-remove" onClick={() => removePhoto(p.id)}><Trash2 size={12} /></button>
          </div>
        ))}
        {photos.length < 8 && (
          <label className="photo-add">
            <Plus size={20} />
            <span>Add</span>
            <input type="file" accept="image/*" multiple capture="environment" onChange={handleUpload} hidden />
          </label>
        )}
      </div>

      <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} disabled={uploading} onClick={submit}>
        {uploading ? "Uploading…" : "Submit daily log"}
      </button>

      <h2 className="h2" style={{ marginTop: 28, marginBottom: 10 }}>Past logs</h2>
      {myLogs.length === 0 && <div className="muted">No daily logs submitted yet.</div>}
      {myLogs.map((r) => (
        <div key={r.id} className="project-card" style={{ marginBottom: 10 }}>
          <div className="muted">{r.log_date} · {projects.find((p) => p.id === r.project_id)?.name}</div>
          {r.text && <div style={{ fontSize: 13, marginTop: 4 }}>{r.text}</div>}
          {r.photo_urls?.length > 0 && (
            <div className="rep-photo-grid" style={{ marginTop: 8 }}>
              {r.photo_urls.map((p, i) => <img key={i} src={p} alt="" />)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}