"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ChevronLeft, Download, Loader2 } from "lucide-react";

function Section({ title, items }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div className="rep-section">
      <div className="rep-section-title">{title}</div>
      <ul className="rep-list">{items.map((it, i) => <li key={i}>{it}</li>)}</ul>
    </div>
  );
}

export default function ReportDetailPage() {
  const router = useRouter();
  const { id, reportId } = useParams();
  const [project, setProject] = useState(null);
  const [report, setReport] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) { router.replace("/login"); return; }
      const { data: proj } = await supabase.from("projects").select("*").eq("id", id).single();
      const { data: rep } = await supabase.from("reports").select("*").eq("id", reportId).single();
      setProject(proj);
      setReport(rep);
    })();
  }, [id, reportId, router]);

  if (!project || !report) {
    return <div className="screen center"><Loader2 className="spin" size={24} color="#2563EB" /></div>;
  }

  return (
    <div className="screen">
      <header className="topbar no-print">
        <button className="icon-btn" onClick={() => router.push(`/projects/${id}`)}><ChevronLeft size={18} /></button>
        <span className="topbar-title">Daily report</span>
        <button className="icon-btn" onClick={() => window.print()} title="Export as PDF"><Download size={18} /></button>
      </header>

      <div className="content narrow">
        <div className="titleblock">
          <div className="tb-row"><span className="tb-label">PROJECT</span><span className="tb-val">{project.name}</span></div>
          <div className="tb-row"><span className="tb-label">SHEET</span><span className="tb-val">DR</span></div>
          <div className="tb-row"><span className="tb-label">DATE</span><span className="tb-val">{report.report_date}</span></div>
        </div>

        <div className="report-paper">
          <div className="report-header">
            <div>
              <div className="report-title">Daily Construction Report</div>
              <div className="report-sub">{project.name} · {project.location}</div>
              <div className="report-sub">Client: {project.client}</div>
            </div>
            <div className="report-date">{report.report_date}</div>
          </div>

          {report.summary && <p className="rep-summary">{report.summary}</p>}

          <Section title="Work completed" items={report.work_completed} />
          <Section title="Materials & equipment" items={report.materials_equipment} />
          {report.crew_on_site && (
            <div className="rep-section">
              <div className="rep-section-title">Crew on site</div>
              <p>{report.crew_on_site}</p>
            </div>
          )}
          <Section title="Safety notes" items={report.safety_notes} />
          <Section title="Issues / delays" items={report.issues_delays} />
          <Section title="Plan for tomorrow" items={report.plan_for_tomorrow} />

          {report.photo_urls && report.photo_urls.length > 0 && (
            <div className="rep-section">
              <div className="rep-section-title">Site photos</div>
              <div className="rep-photo-grid">
                {report.photo_urls.map((src, i) => <img key={i} src={src} alt={`site ${i}`} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
