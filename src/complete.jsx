import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPA_URL = "https://efhbnddgcazzkbppzdqw.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaGJuZGRnY2F6emticHB6ZHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTAzMjYsImV4cCI6MjA5MDEyNjMyNn0.BmEoq6jAq_2U0fK13YnCB9rtmblI5Cse3P-9-qtOkfA";
const supabase = createClient(SUPA_URL, SUPA_KEY);

const toDataURL = f => new Promise(res => { const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(f); });

const uploadPhoto = async (dataUrl, path) => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const { error } = await supabase.storage.from("photos").upload(path, blob, { upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from("photos").getPublicUrl(path);
  return publicUrl;
};

const S = {
  wrap:   { maxWidth: 420, margin: "0 auto", fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: "100vh", background: "#F4F2EE", padding: "0 0 40px" },
  header: { background: "#0F1F38", padding: "18px 20px 16px", display: "flex", alignItems: "center", gap: 12 },
  card:   { background: "#fff", borderLeft: "0.5px solid rgba(0,0,0,0.08)", borderRight: "0.5px solid rgba(0,0,0,0.08)", padding: "16px 20px" },
  btn:    (bg, color, border) => ({ width: "100%", padding: 14, borderRadius: 10, border: border || "1.5px solid rgba(0,0,0,0.12)", background: bg, color, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8, transition: "all 0.15s" }),
  inp:    { width: "100%", padding: "10px 12px", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 10, background: "#fff", color: "#111", fontSize: 14, marginBottom: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
  ta:     { width: "100%", padding: "10px 12px", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 10, background: "#fff", color: "#111", fontSize: 14, marginBottom: 14, minHeight: 100, resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
  lbl:    { fontSize: 13, color: "#666", fontWeight: 500, display: "block", marginBottom: 6 },
  bdg:    (bg, tx) => ({ fontSize: 11, padding: "3px 9px", borderRadius: 20, background: bg, color: tx, fontWeight: 600, display: "inline-block", whiteSpace: "nowrap" }),
};

const PRI = { Urgent:{bg:"#FCEBEB",tx:"#A32D2D"}, High:{bg:"#FAECE7",tx:"#993C1D"}, Medium:{bg:"#FAEEDA",tx:"#854F0B"}, Low:{bg:"#EAF3DE",tx:"#3B6D11"} };

export default function CompletePage() {
  const [wo, setWo]           = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [action, setAction]   = useState(null); // accept | complete | decline
  const [note, setNote]       = useState("");
  const [photos, setPhotos]   = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]       = useState(false);
  const [doneMsg, setDoneMsg] = useState("");
  const fileRef = useRef();

  const token = new URLSearchParams(window.location.search).get("token");

  useEffect(() => {
    if (!token) { setError("Invalid link — no work order token found."); setLoading(false); return; }
    (async () => {
      const { data, error: e } = await supabase
        .from("work_orders")
        .select("*, properties(name, address)")
        .eq("token", token)
        .single();
      if (e || !data) { setError("Work order not found or link has expired."); setLoading(false); return; }
      setWo(data);
      setProperty(data.properties);
      setLoading(false);
    })();
  }, [token]);

  const addPhoto = async (e) => {
    const files = Array.from(e.target.files);
    const dataUrls = await Promise.all(files.map(toDataURL));
    setPhotos(prev => [...prev, ...dataUrls]);
    e.target.value = "";
  };
  const removePhoto = (i) => setPhotos(prev => prev.filter((_, j) => j !== i));

  const submit = async () => {
    if (!action) return;
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const updates = { status: action === "accept" ? "accepted" : action === "complete" ? "complete" : "pending" };
      if (action === "accept")   updates.accepted_at = now;
      if (action === "complete") { updates.accepted_at = updates.accepted_at || now; updates.completed_at = now; }
      if (action === "decline")  updates.status = "declined";

      if (action === "complete" && photos.length > 0) {
        const urls = await Promise.all(photos.map((d, i) =>
          uploadPhoto(d, `completions/${wo.id}/${Date.now()}_${i}.jpg`)
        ));
        updates.completion_photos = [...(wo.completion_photos || []), ...urls];
        updates.completion_note = note;
      }

      const { error: e } = await supabase.from("work_orders").update(updates).eq("token", token);
      if (e) throw e;

      const msgs = {
        accept:   "Job accepted! The property manager has been notified.",
        complete: "Completion submitted. Photos and notes have been attached to the work order.",
        decline:  "Response recorded. The property manager has been notified.",
      };
      setDoneMsg(msgs[action]);
      setDone(true);
    } catch (e) {
      alert("Error submitting: " + e.message);
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div style={{ ...S.wrap, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", color:"#888" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <div style={{ fontSize: 14 }}>Loading work order...</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ ...S.wrap, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", padding: 32 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#111", marginBottom: 8 }}>Link not found</div>
        <div style={{ fontSize: 14, color: "#888" }}>{error}</div>
      </div>
    </div>
  );

  if (done) return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div style={{ width:40, height:40, borderRadius:10, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🏢</div>
        <div>
          <div style={{ color:"#fff", fontSize:15, fontWeight:600 }}>PropInspect</div>
          <div style={{ color:"rgba(180,200,230,0.8)", fontSize:12 }}>Work Order Response</div>
        </div>
      </div>
      <div style={{ ...S.card, textAlign:"center", padding:"48px 24px" }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:"#E1F5EE", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 20px" }}>✓</div>
        <div style={{ fontSize:20, fontWeight:700, color:"#111", marginBottom:10 }}>Response submitted</div>
        <div style={{ fontSize:14, color:"#666", lineHeight:1.7 }}>{doneMsg}</div>
        <div style={{ marginTop:20, fontSize:13, color:"#aaa" }}>Work Order {wo?.number}<br/>{property?.name}</div>
      </div>
      <div style={{ background:"#0F1F38", padding:"12px 20px", textAlign:"center" }}>
        <div style={{ color:"rgba(180,200,230,0.7)", fontSize:11 }}>PropInspect · Vestar Property Management</div>
      </div>
    </div>
  );

  const pc = PRI[wo?.priority] || PRI.Medium;

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ width:40, height:40, borderRadius:10, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🏢</div>
        <div style={{ flex:1 }}>
          <div style={{ color:"#fff", fontSize:15, fontWeight:600 }}>Work Order {wo?.number}</div>
          <div style={{ color:"rgba(180,200,230,0.8)", fontSize:12, marginTop:1 }}>{property?.name}</div>
        </div>
        <span style={S.bdg("#FAEEDA","#854F0B")}>{wo?.status}</span>
      </div>

      {/* WO details */}
      <div style={S.card}>
        <div style={{ fontSize:17, fontWeight:700, color:"#111", marginBottom:5 }}>{wo?.item}</div>
        <div style={{ fontSize:13, color:"#555", lineHeight:1.6, marginBottom:12 }}>{wo?.description}</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <span style={S.bdg(pc.bg, pc.tx)}>{wo?.priority} priority</span>
          <span style={S.bdg("#F4F2EE","#666")}>{wo?.area}</span>
          <span style={S.bdg("#F4F2EE","#666")}>Sent {wo?.created_at?.slice(0,10)}</span>
        </div>
      </div>

      {/* Issue photos */}
      {wo?.photos?.length > 0 && (
        <div style={{ ...S.card, borderTop:"0.5px solid rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:12, fontWeight:600, color:"#666", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.05em" }}>Issue photos</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {wo.photos.map((src, i) => (
              <img key={i} src={src} alt="" style={{ width:90, height:90, objectFit:"cover", borderRadius:8, border:"0.5px solid rgba(0,0,0,0.1)" }} />
            ))}
          </div>
        </div>
      )}

      <div style={{ height:"0.5px", background:"rgba(0,0,0,0.08)" }} />

      {/* Response buttons */}
      <div style={{ ...S.card }}>
        <div style={{ fontSize:13, fontWeight:600, color:"#0F1F38", marginBottom:14, textTransform:"uppercase", letterSpacing:"0.05em" }}>Your response</div>

        {[
          { id:"accept",   icon:"✓",  label:"Accept — I'll get started",  bg: action==="accept"  ? "#E6F1FB":"#fff", color:"#185FA5", border: action==="accept"  ? "1.5px solid #378ADD" : undefined },
          { id:"complete", icon:"✔✔", label:"Completed — Work is done",    bg: action==="complete"? "#E1F5EE":"#fff", color:"#0F6E56", border: action==="complete"? "1.5px solid #1D9E75" : undefined },
          { id:"decline",  icon:"✗",  label:"Decline — Unable to complete",bg: action==="decline" ? "#FAECE7":"#fff", color:"#993C1D", border: action==="decline" ? "1.5px solid #D85A30" : undefined },
        ].map(b => (
          <button key={b.id} onClick={() => setAction(b.id)}
            style={{ ...S.btn(b.bg, b.color, b.border) }}>
            <span>{b.icon}</span>{b.label}
          </button>
        ))}
      </div>

      {/* Completion details panel */}
      {action === "complete" && (
        <div style={{ ...S.card, borderTop:"0.5px solid rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#0F1F38", marginBottom:14, textTransform:"uppercase", letterSpacing:"0.05em" }}>Completion details</div>

          <label style={S.lbl}>Completion note</label>
          <textarea style={S.ta} value={note} onChange={e => setNote(e.target.value)}
            placeholder="Describe what was done, parts used, anything the manager should know..." />

          <label style={S.lbl}>Completion photos ({photos.length})</label>
          {photos.length > 0 && (
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
              {photos.map((src, i) => (
                <div key={i} style={{ position:"relative" }}>
                  <img src={src} alt="" style={{ width:88, height:88, objectFit:"cover", borderRadius:8, border:"2px solid #1D9E75" }} />
                  <button onClick={() => removePhoto(i)}
                    style={{ position:"absolute", top:-6, right:-6, width:20, height:20, borderRadius:"50%", background:"#D85A30", color:"#fff", border:"none", cursor:"pointer", fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                </div>
              ))}
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" style={{ display:"none" }} onChange={addPhoto} />
          <div onClick={() => fileRef.current.click()}
            style={{ background:"#F4F2EE", border:"1.5px dashed rgba(0,0,0,0.15)", borderRadius:10, padding:18, textAlign:"center", cursor:"pointer", marginBottom:16 }}>
            <div style={{ fontSize:24 }}>📸</div>
            <div style={{ fontSize:13, color:"#888", marginTop:5 }}>Tap to take or upload completion photo</div>
          </div>
        </div>
      )}

      {/* Decline note */}
      {action === "decline" && (
        <div style={{ ...S.card, borderTop:"0.5px solid rgba(0,0,0,0.06)" }}>
          <label style={S.lbl}>Reason for declining (optional)</label>
          <textarea style={S.ta} value={note} onChange={e => setNote(e.target.value)} placeholder="Let the manager know why you're unable to complete this..." />
        </div>
      )}

      {/* Submit */}
      {action && (
        <div style={{ padding:"0 20px" }}>
          <button onClick={submit} disabled={submitting}
            style={{ ...S.btn(submitting?"#aaa":action==="complete"?"#1D9E75":action==="accept"?"#0F1F38":"#D85A30", "#fff", "none"), marginTop:16, opacity: submitting?0.7:1 }}>
            {submitting ? "Submitting..." : action==="complete" ? "Submit Completion" : action==="accept" ? "Confirm Acceptance" : "Confirm Decline"}
          </button>
        </div>
      )}

      {/* Footer */}
      <div style={{ background:"#0F1F38", padding:"12px 20px", textAlign:"center", marginTop:20 }}>
        <div style={{ color:"rgba(180,200,230,0.7)", fontSize:11 }}>PropInspect · Vestar Property Management</div>
      </div>
    </div>
  );
}
