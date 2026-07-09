"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ChevronLeft, Plus, CheckCircle2, ClipboardList, Loader2 } from "lucide-react";

export default function ProjectDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) { router.replace("/login"); return; }

      const { data: proj, error: projErr } = await supabase.from("projects").select("*").eq("id", id).single();
      if (projErr || !proj) { router.replace("/projects"); return; }
      setProject(proj);

      const { data: reps } = await supabase.from("reports").select("*").eq("project_id", id).order("created_at", { ascending: false });
      setReports(reps || []);
      setLoading(false);
    })();
  }, [id, router]);

  if (loading || !project) {
    return <div className="screen center"><Loader2 className="spin" size={24} color="#2563EB" /></div>;
  }

  return (
    <div className="screen">
      <header className="topbar">
        <button className="icon-btn" onClick={() => router.push("/dashboard")}><ChevronLeft size={18} /></button>
        <span className="topbar-title">{project.name}</span>
        <span />
      </header>

      <div className="content narrow">
        <div className="titleblock">
          <div className="tb-row"><span className="tb-label">PROJECT</span><span className="tb-val">{project.name}</span></div>
          <div className="tb-row"><span className="tb-label">CLIENT</span><span className="tb-val">{project.client || "—"}</span></div>
          <div className="tb-row"><span className="tb-label">SITE</span><span className="tb-val">{project.location || "—"}</span></div>
        </div>

        <div className="row-between">
          <h2 className="h2">Daily reports</h2>
          <button className="btn btn-primary btn-sm" onClick={() => router.push(`/projects/${id}/new-report`)}>
            <Plus size={16} /> New report
          </button>
        </div>

        {reports.length === 0 && (
          <div className="empty">
            <ClipboardList size={28} strokeWidth={1.5} />
            <p>No reports logged yet for this project.</p>
          </div>
        )}

        <div className="report-list">
          {reports.map((r) => (
            <div key={r.id} className="report-row" style={{ cursor: "pointer" }} onClick={() => router.push(`/projects/${id}/reports/${r.id}`)}>
              <CheckCircle2 size={16} color="var(--orange)" style={{ flexShrink: 0 }} />
              <div className="report-row-main">
                <div className="report-row-date">{r.report_date}</div>
                <div className="report-row-sum">{r.summary || "Report ready"}</div>
              </div>
              <span className="muted">{(r.photo_urls || []).length} photos</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
