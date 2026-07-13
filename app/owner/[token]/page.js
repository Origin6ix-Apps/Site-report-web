"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Eye, FileText, Loader2, Download } from "lucide-react";

function Section({ title, items }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div className="rep-section">
      <div className="rep-section-title">{title}</div>
      <ul className="rep-list">{items.map((it, i) => <li key={i}>{it}</li>)}</ul>
    </div>
  );
}

export default function OwnerPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/owner/${token}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Not found");
        setData(json);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [token]);

  if (error) {
    return <div className="screen center"><div className="empty"><p>{error}</p></div></div>;
  }
  if (!data) {
    return <div className="screen center"><Loader2 className="spin" size={24} color="#111184" /></div>;
  }

  const { project, reports } = data;
  const open = reports.find((r) => r.id === openId);

  return (
    <div className="screen">
      <header className="topbar no-print">
        <span className="topbar-title">{project.name}</span>
        <span />
      </header>

      <div className="content narrow">
        {!open && (
          <>
            <div className="owner-banner"><Eye size={14} style={{ verticalAlign: -2 }} /> Read-only project summary for {project.client}.</div>
            {reports.length === 0 && <div className="empty"><p>No reports have been shared yet.</p></div>}
            <div className="report-list">
              {reports.map((r) => (
                <div key={r.id} className="report-row" style={{ cursor: "pointer" }} onClick={() => setOpenId(r.id)}>
                  <FileText size={16} color="var(--orange)" style={{ flexShrink: 0 }} />
                  <div className="report-row-main">
                    <div className="report-row-date">{r.report_date}</div>
                    <div className="report-row-sum">{r.summary || "Report ready"}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {open && (
          <>
            <button className="link-btn no-print" style={{ color: "#111184", marginBottom: 14 }} onClick={() => setOpenId(null)}>← Back to all reports</button>
            <div className="report-paper">
              <div className="report-header">
                <div>
                  <div className="report-title">Daily Construction Report</div>
                  <div className="report-sub">{project.name} · {project.location}</div>
                  <div className="report-sub">Client: {project.client}</div>
                </div>
                <div className="report-date">{open.report_date}</div>
              </div>
              {open.summary && <p className="rep-summary">{open.summary}</p>}
              <Section title="Work completed" items={open.work_completed} />
              <Section title="Materials & equipment" items={open.materials_equipment} />
              {open.crew_on_site && (
                <div className="rep-section">
                  <div className="rep-section-title">Crew on site</div>
                  <p>{open.crew_on_site}</p>
                </div>
              )}
              <Section title="Safety notes" items={open.safety_notes} />
              <Section title="Issues / delays" items={open.issues_delays} />
              <Section title="Plan for tomorrow" items={open.plan_for_tomorrow} />
              {open.photo_urls && open.photo_urls.length > 0 && (
                <div className="rep-section">
                  <div className="rep-section-title">Site photos</div>
                  <div className="rep-photo-grid">
                    {open.photo_urls.map((src, i) => <img key={i} src={src} alt={`site ${i}`} />)}
                  </div>
                </div>
              )}
            </div>
            <button className="btn btn-primary no-print" style={{ marginTop: 16 }} onClick={() => window.print()}>
              <Download size={16} /> Save as PDF
            </button>
          </>
        )}
      </div>
    </div>
  );
}
