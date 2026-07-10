"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { UsersTab } from "@/components/AdminDashboard";
import { X } from "lucide-react";

const TABS = [
  { id: "projects", label: "Projects" },
  { id: "admins", label: "Admins" },
  { id: "supervisors", label: "Supervisors" },
  { id: "employees", label: "Employees" },
  { id: "materials", label: "Materials" },
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
        <button className="stat-card" style={{ textAlign: "left", cursor: "pointer", width: "100%", fontFamily: "inherit" }} onClick={() => setTab("projects")}>
          <div className="stat-num">{projects.length}</div><div className="stat-label">Total Projects</div>
        </button>
        <button className="stat-card" style={{ textAlign: "left", cursor: "pointer", width: "100%", fontFamily: "inherit" }} onClick={() => setTab("admins")}>
          <div className="stat-num">{admins.length}</div><div className="stat-label">Admins</div>
        </button>
        <button className="stat-card" style={{ textAlign: "left", cursor: "pointer", width: "100%", fontFamily: "inherit" }} onClick={() => setTab("supervisors")}>
          <div className="stat-num">{supervisors.length}</div><div className="stat-label">Supervisors</div>
        </button>
        <button className="stat-card" style={{ textAlign: "left", cursor: "pointer", width: "100%", fontFamily: "inherit" }} onClick={() => setTab("employees")}>
          <div className="stat-num">{employees.length}</div><div className="stat-label">Employees</div>
        </button>
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

function ProjectDetailModal({ project, profiles, employees, attendance, materials, dailyLogs, onClose }) {
  const sup = profiles.find((u) => u.id === project.assigned_supervisor_id);
  const team = employees.filter((e) => e.project_id === project.id);
  const projMaterials = materials.filter((m) => m.project_id === project.id);
  const projLogs = dailyLogs.filter((r) => r.project_id === project.id);
  const totalDays = daysInCurrentMonth();
  const [modalTab, setModalTab] = useState("team");
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const MODAL_TABS = [
    { id: "team", label: `Team & Attendance (${team.length})` },
    { id: "materials", label: `Materials (${projMaterials.length})` },
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