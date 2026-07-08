"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ChevronLeft, Camera, Mic, Square, Plus, Trash2, FileText, Loader2 } from "lucide-react";

function resizeImage(file, maxWidth = 900, quality = 0.7) {
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

function todayStr() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export default function NewReportPage() {
  const router = useRouter();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [photos, setPhotos] = useState([]); // { id, previewUrl, blob }
  const [uploading, setUploading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recording, setRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) { router.replace("/login"); return; }
      const { data: proj } = await supabase.from("projects").select("*").eq("id", id).single();
      setProject(proj);
    })();
  }, [id, router]);

  useEffect(() => {
    const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) { setSpeechSupported(false); return; }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    let finalText = "";
    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t + " ";
        else interim += t;
      }
      setTranscript((finalText + interim).trim());
    };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    recognitionRef.current = rec;
  }, []);

  function toggleRecording() {
    if (!speechSupported) return;
    if (recording) {
      recognitionRef.current.stop();
      setRecording(false);
    } else {
      try { recognitionRef.current.start(); setRecording(true); } catch { /* already started */ }
    }
  }

  async function handlePhotoUpload(e) {
    const files = Array.from(e.target.files || []).slice(0, 6 - photos.length);
    for (const f of files) {
      const blob = await resizeImage(f);
      const previewUrl = URL.createObjectURL(blob);
      setPhotos((prev) => [...prev, { id: crypto.randomUUID(), previewUrl, blob }]);
    }
    e.target.value = "";
  }

  function removePhoto(pid) {
    setPhotos((prev) => prev.filter((p) => p.id !== pid));
  }

  async function generate() {
    setError("");
    if (photos.length === 0 && !transcript.trim()) {
      setError("Add at least one photo or a voice note before generating a report.");
      return;
    }
    setGenerating(true);
    setUploading(true);
    try {
      // 1. Upload photos to Supabase Storage, collect public URLs
      const photoUrls = [];
      for (const p of photos) {
        const path = `${id}/${p.id}.jpg`;
        const { error: upErr } = await supabase.storage.from("site-photos").upload(path, p.blob, {
          contentType: "image/jpeg",
          upsert: true,
        });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("site-photos").getPublicUrl(path);
        photoUrls.push(pub.publicUrl);
      }
      setUploading(false);

      // 2. Call our server API route, which calls Claude and saves the report
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: id,
          projectName: project?.name,
          client: project?.client,
          location: project?.location,
          date: todayStr(),
          transcript,
          photoUrls,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Report generation failed.");

      router.push(`/projects/${id}/reports/${data.reportId}`);
    } catch (e) {
      console.error(e);
      setError(e.message || "Something went wrong generating the report.");
      setGenerating(false);
      setUploading(false);
    }
  }

  if (!project) {
    return <div className="screen center"><Loader2 className="spin" size={24} color="#fff" /></div>;
  }

  return (
    <div className="screen">
      <header className="topbar">
        <button className="icon-btn" onClick={() => router.push(`/projects/${id}`)}><ChevronLeft size={18} /></button>
        <span className="topbar-title">New daily report</span>
        <span />
      </header>

      <div className="content narrow">
        <div className="titleblock">
          <div className="tb-row"><span className="tb-label">PROJECT</span><span className="tb-val">{project.name}</span></div>
          <div className="tb-row"><span className="tb-label">SHEET</span><span className="tb-val">DR-NEW</span></div>
          <div className="tb-row"><span className="tb-label">DATE</span><span className="tb-val">{todayStr()}</span></div>
        </div>

        <section className="card">
          <div className="card-head"><Camera size={16} style={{ verticalAlign: -3 }} /> Site photos <span className="muted">({photos.length}/6)</span></div>
          <div className="photo-grid">
            {photos.map((p) => (
              <div className="photo-thumb" key={p.id}>
                <img src={p.previewUrl} alt="site" />
                <button className="photo-remove" onClick={() => removePhoto(p.id)}><Trash2 size={12} /></button>
              </div>
            ))}
            {photos.length < 6 && (
              <label className="photo-add">
                <Plus size={20} />
                <span>Add</span>
                <input type="file" accept="image/*" multiple capture="environment" onChange={handlePhotoUpload} hidden />
              </label>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-head"><Mic size={16} style={{ verticalAlign: -3 }} /> Voice note</div>
          {!speechSupported && (
            <div className="muted" style={{ marginBottom: 10 }}>Voice-to-text isn't supported in this browser. Type your field notes instead.</div>
          )}
          <div className="record-row">
            <button className={`record-btn ${recording ? "recording" : ""}`} onClick={toggleRecording} disabled={!speechSupported}>
              {recording ? <Square size={14} /> : <Mic size={14} />} {recording ? "Stop" : "Record"}
            </button>
            {recording && <span className="rec-pulse">● listening…</span>}
          </div>
          <textarea
            className="textarea"
            rows={5}
            placeholder="Notes appear here as you speak — or type directly."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />
        </section>

        {error && <div className="error-box">{error}</div>}

        <button className="btn btn-primary btn-block" onClick={generate} disabled={generating}>
          {generating ? (
            <><Loader2 size={16} className="spin" /> {uploading ? "Uploading photos…" : "Generating report…"}</>
          ) : (
            <><FileText size={16} /> Generate daily report</>
          )}
        </button>
      </div>
    </div>
  );
}
