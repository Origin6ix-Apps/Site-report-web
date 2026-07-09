"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Plus, LogOut, X, Loader2, Eye, FileText } from "lucide-react";

export default function ProjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [pname, setPname] = useState("");
  const [client, setClient] = useState("");
  const [loc, setLoc] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setUser(data.session.user);
      await loadProjects();
      setLoading(false);
    })();
  }, [router]);

  async function loadProjects() {
    const { data, error: err } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (!err) setProjects(data || []);
  }

  async function createProject() {
    setError("");
    if (!pname.trim()) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const { error: err } = await supabase.from("projects").insert({
      owner_id: sessionData.session.user.id,
      name: pname.trim(),
      client: client.trim(),
      location: loc.trim(),
    });
    if (err) {
      setError(err.message);
      return;
    }
    setPname(""); setClient(""); setLoc(""); setShowNew(false);
    await loadProjects();
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return <div className="screen center"><Loader2 className="spin" size={24} color="#2563EB" /></div>;
  }

  return (
    <div className="screen">
      <header className="topbar">
        <div className="brand small">
          <div className="brand-mark small">SR</div>
          <span className="brand-name small">SITE REPORT AI</span>
        </div>
        <div className="topbar-right">
          <a href="/dashboard" className="user-chip" style={{ textDecoration: "underline" }}>← Dashboard</a>
          <span className="user-chip">{user?.email}</span>
          <button className="icon-btn" title="Log out" onClick={logout}><LogOut size={18} /></button>
        </div>
      </header>

      <div className="content">
        <div className="row-between">
          <h1 className="h1">Projects</h1>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}><Plus size={16} /> New project</button>
        </div>

        {projects.length === 0 && (
          <div className="empty"><p>No projects yet. Create one to start logging daily reports.</p></div>
        )}

        <div className="grid">
          {projects.map((p) => (
            <div key={p.id} className="project-card">
              <div className="project-name"><a href={`/projects/${p.id}`}>{p.name}</a></div>
              <div className="project-meta">Client — {p.client || "—"}</div>
              <div className="project-meta">Site — {p.location || "—"}</div>
              <div className="project-actions">
                <a className="link-action" href={`/projects/${p.id}`}><FileText size={14} /> Daily reports</a>
                <a className="link-action" href={`/owner/${p.share_token}`} target="_blank" rel="noreferrer">
                  <Eye size={14} /> Owner view
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showNew && (
        <div className="modal-backdrop" onClick={() => setShowNew(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row-between">
              <h2 className="h2" style={{ color: "var(--ink)" }}>New project</h2>
              <button className="icon-btn" style={{ color: "var(--ink)" }} onClick={() => setShowNew(false)}><X size={18} /></button>
            </div>
            <label className="field-label">Project name</label>
            <input className="input" value={pname} onChange={(e) => setPname(e.target.value)} placeholder="e.g. Riverside Apartments — Block C" autoFocus />
            <label className="field-label">Client / Owner</label>
            <input className="input" value={client} onChange={(e) => setClient(e.target.value)} placeholder="e.g. Riverside Holdings LLC" />
            <label className="field-label">Site location</label>
            <input className="input" value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="e.g. 4th & Main, Austin TX" />
            {error && <div className="error-box" style={{ marginTop: 12 }}>{error}</div>}
            <button className="btn btn-primary btn-block" disabled={!pname.trim()} onClick={createProject}>Create project</button>
          </div>
        </div>
      )}
    </div>
  );
}
