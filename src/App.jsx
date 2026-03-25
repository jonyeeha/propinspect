import { useState, useCallback } from "react";

const SEED = {
  managerEmail: "manager@yourcompany.com",
  properties: [
    { id: "p1", name: "Verrado Marketplace", units: 1, type: "Commercial", address: "", inspectionFreq: "Quarterly" },
    { id: "p2", name: "Canyon Trails", units: 1, type: "Commercial", address: "", inspectionFreq: "Quarterly" },
  ],
  contractors: [
    { id: "c1", name: "Johnson Electric", trade: "Electrical", email: "johnson@johnsonelectric.com", phone: "(602) 555-0191", license: "AZ-EL-88214", avgResponse: "Same day" },
    { id: "c2", name: "BuildPro Maintenance", trade: "General", email: "contact@buildpro.com", phone: "(602) 555-0144", license: "", avgResponse: "1–2 days" },
    { id: "c3", name: "CoolStar HVAC", trade: "HVAC", email: "service@coolstarhvac.com", phone: "(480) 555-0177", license: "AZ-HV-44102", avgResponse: "1 day" },
    { id: "c4", name: "Desert Plumbing Co.", trade: "Plumbing", email: "info@desertplumbing.com", phone: "(480) 555-0233", license: "AZ-PL-11203", avgResponse: "Same day" },
  ],
  checklistTemplate: [
    { area: "Parking Lot", items: ["Condition", "Cleanliness", "Striping"] },
    { area: "Curbing and Tire Stops", items: ["Condition", "Paint", "Debris"] },
    { area: "Parking Garage (if applicable)", items: ["Condition", "Cleanliness", "Striping"] },
    { area: "Signs (stop, handicap, fire lane)", items: ["Condition", "Compliance", "Installation"] },
    { area: "Lighting (night inspection)", items: ["Parking Lot", "Back of House security lighting", "Common area sidewalk lighting", "Canopy/Sconce"] },
    { area: "Landscaping", items: ["Condition", "Adequate Coverage", "Trees", "Weeds"] },
    { area: "Back of House/Service Areas", items: ["Cleanliness", "Service Courts/Dumpster Enclosures", "Loading Docks", "Dumping/Graffiti"] },
    { area: "Building Exterior", items: ["Condition", "Paint", "Graffiti"] },
    { area: "Fountains/Water Features", items: ["Condition/Operation", "Cleanliness"] },
    { area: "Monument/Pylon/Directional Signage", items: ["Condition", "Current Information", "Operational"] },
    { area: "Common Area Amenities/General Standards", items: ["Cleanliness", "Organization (chairs arranged, umbrellas open)", "Music Levels"] },
    { area: "Storefronts", items: ["Cleanliness", "Banners/A-Frames/Stanchions", "Window/Storefront Vinyl"] },
    { area: "Elevator/Escalators", items: ["Cleanliness", "Operational"] },
    { area: "Marketing", items: ["Sign Holders", "Directories"] },
    { area: "Maintenance Staff", items: ["Uniform Standards", "Vehicle Standards", "Visibility"] },
    { area: "Security Staff", items: ["Uniform Standards", "Vehicle Standards", "Visibility"] },
    { area: "Vacant Suites", items: ["Cleanliness (Inside and Outside)", "Vacant Window Graphics", "Leasing Information"] },
  ],
  workOrders: [],
  nextWONumber: 1001,
};

const STORE_KEY = "propinspect_db";
const loadDB = () => { try { const r = localStorage.getItem(STORE_KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
const saveDB = (db) => { try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch {} };
const initDB = () => { const e = loadDB(); if (e) return e; saveDB(SEED); return JSON.parse(JSON.stringify(SEED)); };

const PRI = { Urgent: { bg: "#FCEBEB", tx: "#A32D2D" }, High: { bg: "#FAECE7", tx: "#993C1D" }, Medium: { bg: "#FAEEDA", tx: "#854F0B" }, Low: { bg: "#EAF3DE", tx: "#3B6D11" } };
const STA = { pending: { bg: "#FAEEDA", tx: "#854F0B" }, accepted: { bg: "#E6F1FB", tx: "#185FA5" }, complete: { bg: "#E1F5EE", tx: "#0F6E56" } };
const AVC = [{ bg: "#EEEDFE", tx: "#3C3489" }, { bg: "#E1F5EE", tx: "#0F6E56" }, { bg: "#FAEEDA", tx: "#854F0B" }, { bg: "#E6F1FB", tx: "#185FA5" }, { bg: "#FAECE7", tx: "#993C1D" }];
const ava = (name, i) => { const c = AVC[i % AVC.length]; return { initials: name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(), ...c }; };
const Bdg = ({ bg, tx, children }) => <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, background: bg, color: tx, fontWeight: 600, display: "inline-block", whiteSpace: "nowrap" }}>{children}</span>;

const S = {
  app: { maxWidth: 390, margin: "1rem auto", background: "#F4F2EE", borderRadius: 20, overflow: "hidden", minHeight: 780, display: "flex", flexDirection: "column", fontFamily: "'DM Sans', system-ui, sans-serif", border: "0.5px solid rgba(0,0,0,0.1)", boxShadow: "0 8px 40px rgba(0,0,0,0.12)" },
  sbar: { background: "#0F1F38", color: "#fff", fontSize: 12, padding: "8px 18px 6px", display: "flex", justifyContent: "space-between" },
  tbar: { background: "#0F1F38", color: "#fff", padding: "10px 16px 16px", display: "flex", alignItems: "center", gap: 10 },
  tabs: { display: "flex", background: "#fff", borderBottom: "0.5px solid rgba(0,0,0,0.08)" },
  tab: (on) => ({ flex: 1, padding: "10px 0", fontSize: 11, textAlign: "center", cursor: "pointer", color: on ? "#0F1F38" : "#888", borderBottom: on ? "2px solid #0F1F38" : "2px solid transparent", fontWeight: on ? 600 : 400, transition: "all 0.2s", fontFamily: "inherit", background: "none", border: on ? "none" : "none", borderBottom: on ? "2px solid #0F1F38" : "2px solid transparent" }),
  body: { flex: 1, overflowY: "auto", padding: 16 },
  slabel: { fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em", margin: "16px 0 8px" },
  card: { background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: 14, marginBottom: 10, overflow: "hidden" },
  crow: { padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" },
  inp: { width: "100%", padding: "10px 12px", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 10, background: "#fff", color: "#111", fontSize: 14, marginBottom: 14, outline: "none", fontFamily: "inherit" },
  ta: { width: "100%", padding: "10px 12px", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 10, background: "#fff", color: "#111", fontSize: 14, marginBottom: 14, minHeight: 80, resize: "none", outline: "none", fontFamily: "inherit" },
  lbl: { fontSize: 13, color: "#666", marginBottom: 6, display: "block", fontWeight: 500 },
  pbtn: (v = "dk") => ({ width: "100%", padding: "13px", border: v === "gh" ? "0.5px solid rgba(0,0,0,0.15)" : "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: v === "dk" ? "#0F1F38" : v === "gn" ? "#1D9E75" : "#fff", color: v === "dk" ? "#fff" : v === "gn" ? "#fff" : "#0F1F38" }),
  bbar: { padding: "12px 16px", borderTop: "0.5px solid rgba(0,0,0,0.08)", background: "#fff" },
  div: { height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "12px 0" },
  pwrap: { background: "rgba(0,0,0,0.08)", borderRadius: 4, height: 5, margin: "0 0 4px" },
  pfill: (p) => ({ height: 5, borderRadius: 4, background: "#1D9E75", width: `${p}%`, transition: "width 0.4s" }),
  cbox: (s) => ({ width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: s === "ok" ? "#1D9E75" : s === "flagged" ? "#D85A30" : "#fff", border: s === "none" ? "1.5px solid rgba(0,0,0,0.2)" : "none", color: s !== "none" ? "#fff" : "transparent" }),
  av: (bg, tx, size = 40) => ({ width: size, height: size, borderRadius: "50%", background: bg, color: tx, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size > 36 ? 14 : 12, fontWeight: 700, flexShrink: 0 }),
  copt: (sel) => ({ background: sel ? "#E1F5EE" : "#fff", border: sel ? "1.5px solid #1D9E75" : "0.5px solid rgba(0,0,0,0.12)", borderRadius: 10, padding: "12px 14px", marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }),
  irow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", fontSize: 14 },
  pthumb: { width: 68, height: 68, borderRadius: 10, background: "#B5D4F4", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24 },
  notifyCard: { background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: "12px 14px", marginTop: 16, width: "100%", textAlign: "left" },
};

const propIcon = (t) => t?.includes("Industrial") ? "🏭" : t?.includes("Retail") ? "🏬" : "🏢";
const hexRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const PHEX = { Urgent: "#A32D2D", High: "#993C1D", Medium: "#854F0B", Low: "#3B6D11" };
const SHEX = { pending: "#854F0B", accepted: "#185FA5", complete: "#0F6E56" };

export default function App() {
  const [db, setDB] = useState(() => initDB());
  const [tab, setTab] = useState("inspect");
  const [scr, setScr] = useState("home");
  const [prop, setProp] = useState(null);
  const [clState, setClState] = useState({});
  const [openA, setOpenA] = useState({});
  const [issItem, setIssItem] = useState(null);
  const [issDesc, setIssDesc] = useState("");
  const [issPri, setIssPri] = useState("Medium");
  const [issCont, setIssCont] = useState(null);
  const [issPhotos, setIssPhotos] = useState(0);
  const [newWO, setNewWO] = useState(null);
  const [woFilter, setWoFilter] = useState("all");
  const [showAddP, setShowAddP] = useState(false);
  const [editingP, setEditingP] = useState(null);
  const [newP, setNewP] = useState({ name: "", address: "", units: "", type: "", inspectionFreq: "Quarterly" });
  const [showAddC, setShowAddC] = useState(false);
  const [newC, setNewC] = useState({ name: "", trade: "", email: "", phone: "", license: "" });
  const [editMgr, setEditMgr] = useState(false);
  const [mgrEmail, setMgrEmail] = useState(db.managerEmail);
  const [editA, setEditA] = useState(null);
  const [editTxt, setEditTxt] = useState("");
  const [addItemTo, setAddItemTo] = useState(null);
  const [newItemTxt, setNewItemTxt] = useState("");
  const [newAreaTxt, setNewAreaTxt] = useState("");
  const [addingArea, setAddingArea] = useState(false);
  const [rptSel, setRptSel] = useState({});
  const [rptProp, setRptProp] = useState("all");
  const [rptSta, setRptSta] = useState("all");
  const [rptTitle, setRptTitle] = useState("Property Inspection Report");
  const [rptGen, setRptGen] = useState(false);

  const persist = useCallback((u) => { setDB(u); saveDB(u); }, []);

  // ── Inspection flow ────────────────────────────────────────────────────────
  const startInsp = (p) => {
    setProp(p);
    const st = {};
    db.checklistTemplate.forEach(s => s.items.forEach(it => {
      st[`${s.area}::${it}`] = { status: "none" }; // none | sat | unsat | flagged
    }));
    db.workOrders.filter(w => w.propertyId === p.id && w.status === "pending").forEach(w => {
      const k = `${w.area}::${w.item}`; if (st[k]) st[k] = { status: "flagged" };
    });
    setClState(st); setOpenA({ [db.checklistTemplate[0].area]: true }); setScr("checklist");
  };

  const done = Object.values(clState).filter(v => v.status !== "none").length;
  const total = Object.keys(clState).length;
  const pct = total ? Math.round(done / total * 100) : 0;

  const setSat = (k, val) => setClState(prev => ({ ...prev, [k]: { ...prev[k], status: val } }));

  const openIssue = (area, item) => { setIssItem({ area, item }); setIssDesc(""); setIssPri("Medium"); setIssCont(db.contractors[0]); setIssPhotos(0); setScr("issue"); };

  const createWO = () => {
    const num = `WO-${db.nextWONumber}`;
    const wo = { id: `wo${Date.now()}`, number: num, propertyId: prop.id, area: issItem.area, item: issItem.item, description: issDesc || "(No description)", priority: issPri, contractorId: issCont.id, status: "pending", photos: issPhotos, createdAt: new Date().toISOString().slice(0, 10), acceptedAt: null };
    const u = { ...db, workOrders: [...db.workOrders, wo], nextWONumber: db.nextWONumber + 1 };
    persist(u); setNewWO({ wo, contractor: issCont });
    setClState(prev => ({ ...prev, [`${issItem.area}::${issItem.item}`]: { status: "flagged" } }));
    setScr("sent");
  };

  // ── Work orders ────────────────────────────────────────────────────────────
  const fWOs = db.workOrders.filter(w => woFilter === "all" || w.status === woFilter).slice().reverse();

  // ── Contractors ────────────────────────────────────────────────────────────
  const addC = () => {
    if (!newC.name || !newC.email) return;
    persist({ ...db, contractors: [...db.contractors, { id: `c${Date.now()}`, ...newC }] });
    setNewC({ name: "", trade: "", email: "", phone: "", license: "" }); setShowAddC(false);
  };

  // ── Checklist editor ───────────────────────────────────────────────────────
  const delArea = (i) => persist({ ...db, checklistTemplate: db.checklistTemplate.filter((_, j) => j !== i) });
  const delItem = (ai, ii) => persist({ ...db, checklistTemplate: db.checklistTemplate.map((s, j) => j === ai ? { ...s, items: s.items.filter((_, k) => k !== ii) } : s) });
  const saveAreaName = (ai) => { persist({ ...db, checklistTemplate: db.checklistTemplate.map((s, j) => j === ai ? { ...s, area: editTxt } : s) }); setEditA(null); };
  const saveItemName = (ai, ii) => { persist({ ...db, checklistTemplate: db.checklistTemplate.map((s, j) => j === ai ? { ...s, items: s.items.map((it, k) => k === ii ? editTxt : it) } : s) }); setEditA(null); };
  const addItem = (ai) => { if (!newItemTxt.trim()) return; persist({ ...db, checklistTemplate: db.checklistTemplate.map((s, j) => j === ai ? { ...s, items: [...s.items, newItemTxt.trim()] } : s) }); setNewItemTxt(""); setAddItemTo(null); };
  const addArea = () => { if (!newAreaTxt.trim()) return; persist({ ...db, checklistTemplate: [...db.checklistTemplate, { area: newAreaTxt.trim(), items: [] }] }); setNewAreaTxt(""); setAddingArea(false); };

  // ── Report / PDF ───────────────────────────────────────────────────────────
  const rptWOs = db.workOrders.filter(w => (rptProp === "all" || w.propertyId === rptProp) && (rptSta === "all" || w.status === rptSta)).slice().reverse();
  const selWOs = rptWOs.filter(w => rptSel[w.id]);
  const toggleRpt = (id) => setRptSel(p => ({ ...p, [id]: !p[id] }));
  const selAll = () => { const s = {}; rptWOs.forEach(w => s[w.id] = true); setRptSel(s); };

  const genPDF = async () => {
    if (!selWOs.length) return;
    setRptGen(true);
    try {
      if (!window.jspdf) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
          s.onload = res; s.onerror = rej; document.head.appendChild(s);
        });
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const PW = 210, PH = 297, ML = 18, MR = 18, CW = PW - ML - MR;
      let y = 0;
      const addPage = () => { doc.addPage(); y = 0; };
      const chkY = (n) => { if (y + n > PH - 20) addPage(); };

      // Cover page
      doc.setFillColor(15, 31, 56); doc.rect(0, 0, PW, 80, "F");
      doc.setFillColor(29, 158, 117); doc.rect(0, 80, PW, 4, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
      doc.text("PROPINSPECT", ML, 22);
      doc.setFontSize(26); doc.text(doc.splitTextToSize(rptTitle, CW), ML, 42);
      doc.setFontSize(11); doc.setTextColor(180, 200, 230);
      doc.text(`Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}  ·  ${selWOs.length} work order${selWOs.length !== 1 ? "s" : ""}`, ML, 62);
      y = 100;
      const stats = [{ l: "Total", v: selWOs.length, c: "#0F1F38" }, { l: "Pending", v: selWOs.filter(w => w.status === "pending").length, c: "#854F0B" }, { l: "Accepted", v: selWOs.filter(w => w.status === "accepted").length, c: "#185FA5" }, { l: "Complete", v: selWOs.filter(w => w.status === "complete").length, c: "#0F6E56" }];
      const sw = CW / 4;
      stats.forEach((st, i) => {
        const x = ML + i * sw;
        doc.setFillColor(245, 244, 240); doc.roundedRect(x, y, sw - 4, 22, 3, 3, "F");
        doc.setFont("helvetica", "bold"); doc.setFontSize(18);
        const [r, g, b] = hexRgb(st.c); doc.setTextColor(r, g, b);
        doc.text(String(st.v), x + (sw - 4) / 2, y + 13, { align: "center" });
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(120, 120, 120);
        doc.text(st.l.toUpperCase(), x + (sw - 4) / 2, y + 19, { align: "center" });
      });
      y += 34;
      const propNames = [...new Set(selWOs.map(w => db.properties.find(p => p.id === w.propertyId)?.name).filter(Boolean))];
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
      doc.text("PROPERTIES INCLUDED", ML, y); y += 6;
      propNames.forEach(n => { doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(30, 30, 30); doc.text("• " + n, ML + 2, y); y += 6; });

      // Work order pages
      selWOs.forEach((wo, idx) => {
        addPage(); y = 18;
        const pr = db.properties.find(p => p.id === wo.propertyId);
        const ct = db.contractors.find(c => c.id === wo.contractorId);
        doc.setFillColor(15, 31, 56); doc.rect(0, 0, PW, 14, "F");
        doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
        doc.text(`${wo.number}  ·  ${pr?.name || ""}`, ML, 9);
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(180, 200, 230);
        doc.text(`${idx + 1} of ${selWOs.length}`, PW - MR, 9, { align: "right" });
        y = 24;
        doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(15, 31, 56);
        const il = doc.splitTextToSize(wo.item, CW); doc.text(il, ML, y); y += il.length * 7 + 3;
        doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(100, 100, 100);
        doc.text(wo.area, ML, y); y += 10;
        const drawBadge = (label, hx, xp, yp) => {
          const [r, g, b] = hexRgb(hx);
          doc.setFillColor(r + (255 - r) * 0.85, g + (255 - g) * 0.85, b + (255 - b) * 0.85);
          doc.roundedRect(xp, yp - 4, 28, 7, 2, 2, "F");
          doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(r, g, b);
          doc.text(label.toUpperCase(), xp + 14, yp, { align: "center" });
        };
        drawBadge(wo.status, SHEX[wo.status] || "#666", ML, y);
        drawBadge(wo.priority, PHEX[wo.priority] || "#666", ML + 32, y); y += 10;
        doc.setDrawColor(220, 220, 215); doc.setLineWidth(0.3); doc.line(ML, y, PW - MR, y); y += 8;
        const details = [["Property", pr?.name || "—"], ["Address", pr?.address || "—"], ["Contractor", ct?.name || "—"], ["Trade", ct?.trade || "—"], ["Phone", ct?.phone || "—"], ["Created", wo.createdAt], ["Accepted", wo.acceptedAt || "Not yet"], ["Photos", `${wo.photos} attached`]];
        const cw2 = CW / 2 - 4;
        details.forEach(([k, v], i) => {
          const col = i % 2 === 0 ? ML : ML + cw2 + 8;
          const ry = y + Math.floor(i / 2) * 12;
          doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(140, 140, 140); doc.text(k.toUpperCase(), col, ry);
          doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(30, 30, 30); doc.text(v, col, ry + 5);
        });
        y += Math.ceil(details.length / 2) * 12 + 6;
        doc.line(ML, y, PW - MR, y); y += 8;
        doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(15, 31, 56); doc.text("DESCRIPTION", ML, y); y += 6;
        doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(40, 40, 40);
        const dl = doc.splitTextToSize(wo.description, CW); chkY(dl.length * 5.5 + 6); doc.text(dl, ML, y); y += dl.length * 5.5 + 10;
        if (wo.photos > 0) {
          chkY(14); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(15, 31, 56); doc.text("PHOTOS", ML, y); y += 6;
          const pw2 = (CW - (Math.min(wo.photos, 3) - 1) * 4) / Math.min(wo.photos, 3);
          for (let p = 0; p < Math.min(wo.photos, 6); p++) {
            if (p > 0 && p % 3 === 0) { y += 38; chkY(38); }
            const px = ML + (p % 3) * (pw2 + 4);
            doc.setFillColor(230, 235, 245); doc.roundedRect(px, y, pw2, 32, 3, 3, "F");
            doc.setFillColor(180, 200, 220); doc.roundedRect(px + pw2 / 2 - 6, y + 10, 12, 9, 2, 2, "F");
            doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(120, 140, 160);
            doc.text(`Photo ${p + 1}`, px + pw2 / 2, y + 27, { align: "center" });
          }
          y += 38;
        }
        doc.setFillColor(15, 31, 56); doc.rect(0, PH - 10, PW, 10, "F");
        doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(180, 200, 230);
        doc.text("PropInspect  ·  Confidential Property Management Report", ML, PH - 4);
        doc.text(`Page ${idx + 2}`, PW - MR, PH - 4, { align: "right" });
      });

      // Index page
      addPage();
      doc.setFillColor(15, 31, 56); doc.rect(0, 0, PW, 14, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.text("WORK ORDER INDEX", ML, 9);
      y = 26;
      ["#", "Work Order", "Item", "Property", "Contractor", "Priority", "Status"].forEach((h, i) => {
        const xs = [ML, ML + 10, ML + 30, ML + 82, ML + 118, ML + 148, ML + 166];
        doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(120, 120, 120); doc.text(h, xs[i], y);
      });
      y += 2; doc.setDrawColor(200, 200, 195); doc.setLineWidth(0.3); doc.line(ML, y, PW - MR, y); y += 5;
      selWOs.forEach((wo, i) => {
        chkY(8);
        const pr = db.properties.find(p => p.id === wo.propertyId);
        const ct = db.contractors.find(c => c.id === wo.contractorId);
        if (i % 2 === 0) { doc.setFillColor(248, 247, 244); doc.rect(ML - 2, y - 3.5, CW + 4, 7, "F"); }
        const row = [String(i + 1), wo.number, wo.item.slice(0, 22), (pr?.name || "").slice(0, 24), (ct?.name || "").slice(0, 18), wo.priority, wo.status];
        const xs = [ML, ML + 10, ML + 30, ML + 82, ML + 118, ML + 148, ML + 166];
        row.forEach((val, ci) => {
          if (ci === 5) { const [r, g, b] = hexRgb(PHEX[wo.priority] || "#666"); doc.setTextColor(r, g, b); doc.setFont("helvetica", "bold"); }
          else if (ci === 6) { const [r, g, b] = hexRgb(SHEX[wo.status] || "#666"); doc.setTextColor(r, g, b); doc.setFont("helvetica", "bold"); }
          else { doc.setTextColor(40, 40, 40); doc.setFont("helvetica", "normal"); }
          doc.setFontSize(8); doc.text(val, xs[ci], y);
        });
        y += 7;
      });
      doc.setFillColor(15, 31, 56); doc.rect(0, PH - 10, PW, 10, "F");
      doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(180, 200, 230);
      doc.text("PropInspect  ·  Confidential Property Management Report", ML, PH - 4);
      doc.text(`Page ${selWOs.length + 2}`, PW - MR, PH - 4, { align: "right" });
      doc.save(`PropInspect-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) { alert("PDF error: " + e.message); }
    setRptGen(false);
  };

  // ── Screen renderers ───────────────────────────────────────────────────────
  const renderHome = () => (
    <div style={S.body}>
      <div style={S.slabel}>Properties</div>
      {db.properties.map((p, i) => {
        const av = ava(p.name, i);
        const due = db.workOrders.filter(w => w.propertyId === p.id && w.status === "pending").length;
        return (
          <div key={p.id} style={S.card}>
            <div style={S.crow} onClick={() => startInsp(p)}>
              <div style={{ ...S.av(av.bg, av.tx, 44), borderRadius: 12, fontSize: 22 }}>{propIcon(p.type)}</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>{p.name}</div><div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{p.units} units · {p.inspectionFreq}</div></div>
              {due > 0 && <Bdg bg="#FAECE7" tx="#993C1D">{due} pending</Bdg>}
              <span style={{ color: "#ccc", fontSize: 20 }}>›</span>
            </div>
          </div>
        );
      })}
      <div style={{ ...S.slabel, marginTop: 20 }}>Recent Work Orders</div>
      {db.workOrders.slice(-3).reverse().map(wo => {
        const sc = STA[wo.status] || STA.pending;
        const p = db.properties.find(x => x.id === wo.propertyId);
        return (
          <div key={wo.id} style={{ ...S.card, marginBottom: 8 }}>
            <div style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{wo.number}</span><Bdg bg={sc.bg} tx={sc.tx}>{wo.status}</Bdg></div>
              <div style={{ fontSize: 14, color: "#333", marginBottom: 3 }}>{wo.item}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{p?.name} · {wo.priority}</div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderChecklist = () => {
    const satBtn = (k, val, label, activeBg, activeTx, activeBorder) => {
      const cur = clState[k]?.status;
      const active = cur === val;
      return (
        <button onClick={e => { e.stopPropagation(); setSat(k, active ? "none" : val); }}
          style={{ fontSize: 12, padding: "5px 11px", borderRadius: 20, fontFamily: "inherit", fontWeight: active ? 700 : 400, cursor: "pointer", transition: "all 0.15s",
            border: active ? `1.5px solid ${activeBorder}` : "0.5px solid rgba(0,0,0,0.15)",
            background: active ? activeBg : "#fff", color: active ? activeTx : "#888" }}>
          {label}
        </button>
      );
    };

    return (
      <>
        <div style={{ padding: "12px 16px 0", background: "#fff", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0F1F38", marginBottom: 4 }}>{prop?.name}</div>
          <div style={S.pwrap}><div style={S.pfill(pct)} /></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888", marginBottom: 8 }}>
            <span>{done} of {total} items rated</span>
            <span style={{ color: "#1D9E75", fontWeight: 600 }}>{pct}%</span>
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 11, marginBottom: 10 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "#1D9E75", display: "inline-block" }} />Satisfactory</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "#D85A30", display: "inline-block" }} />Unsatisfactory</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "#FAEEDA", border: "1px solid #FAC775", display: "inline-block" }} />Work order flagged</span>
          </div>
        </div>
        <div style={S.body}>
          {db.checklistTemplate.map((sec) => {
            const isOpen = openA[sec.area];
            const unsat  = sec.items.filter(it => clState[`${sec.area}::${it}`]?.status === "unsat").length;
            const flagged = sec.items.filter(it => clState[`${sec.area}::${it}`]?.status === "flagged").length;
            const sat    = sec.items.filter(it => clState[`${sec.area}::${it}`]?.status === "sat").length;
            const rated  = sat + unsat + flagged;
            return (
              <div key={sec.area} style={{ background: "#fff", border: unsat > 0 || flagged > 0 ? "1px solid #F0997B" : "0.5px solid rgba(0,0,0,0.08)", borderRadius: 14, marginBottom: 8, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: unsat > 0 || flagged > 0 ? "#FFFAF8" : "#fff" }}
                  onClick={() => setOpenA(p => ({ ...p, [sec.area]: !p[sec.area] }))}>
                  <span style={{ fontSize: 13, fontWeight: 600, flex: 1, color: "#111", lineHeight: 1.3 }}>{sec.area}</span>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    {flagged > 0 && <Bdg bg="#FAEEDA" tx="#854F0B">{flagged} WO</Bdg>}
                    {unsat > 0  && <Bdg bg="#FAECE7" tx="#993C1D">{unsat} unsat</Bdg>}
                    {rated > 0 && unsat === 0 && flagged === 0 && <Bdg bg="#E1F5EE" tx="#0F6E56">{rated}/{sec.items.length}</Bdg>}
                  </div>
                  <span style={{ color: "#aaa", fontSize: 12, marginLeft: 4 }}>{isOpen ? "▲" : "▼"}</span>
                </div>
                {isOpen && (
                  <div style={{ borderTop: "0.5px solid rgba(0,0,0,0.06)" }}>
                    {sec.items.map((item, ii) => {
                      const k = `${sec.area}::${item}`;
                      const st = clState[k]?.status || "none";
                      const isFlagged = st === "flagged";
                      const isUnsat   = st === "unsat";
                      return (
                        <div key={item} style={{ padding: "10px 14px", borderBottom: ii < sec.items.length - 1 ? "0.5px solid rgba(0,0,0,0.05)" : "none", background: isFlagged ? "#FFFBF5" : isUnsat ? "#FFFAF8" : "#fff" }}>
                          <div style={{ fontSize: 14, color: "#111", marginBottom: 8, fontWeight: 500 }}>{item}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            {satBtn(k, "sat",   "✓ Satisfactory",   "#E1F5EE", "#0F6E56", "#1D9E75")}
                            {satBtn(k, "unsat", "✕ Unsatisfactory", "#FAECE7", "#993C1D", "#D85A30")}
                            {!isFlagged && (
                              <button onClick={() => openIssue(sec.area, item)}
                                style={{ fontSize: 12, padding: "5px 11px", borderRadius: 20, border: "0.5px solid rgba(0,0,0,0.15)", background: "#F4F2EE", color: "#555", cursor: "pointer", fontFamily: "inherit", marginLeft: "auto" }}>
                                + Work order
                              </button>
                            )}
                            {isFlagged && <span style={{ fontSize: 12, color: "#854F0B", background: "#FAEEDA", padding: "4px 10px", borderRadius: 20, marginLeft: "auto" }}>Work order sent</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={S.bbar}><button style={S.pbtn("dk")} onClick={() => setScr("home")}>Finish Inspection</button></div>
      </>
    );
  };

  const renderIssue = () => (
    <>
      <div style={S.body}>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{issItem?.area}</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#111", marginBottom: 18 }}>{issItem?.item}</div>
        <label style={S.lbl}>Describe the issue</label>
        <textarea style={S.ta} value={issDesc} onChange={e => setIssDesc(e.target.value)} placeholder="What did you observe?" />
        <label style={S.lbl}>Photos ({issPhotos})</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          {Array.from({ length: issPhotos }).map((_, i) => <div key={i} style={S.pthumb}>📷</div>)}
        </div>
        <div style={{ background: "#F4F2EE", border: "1.5px dashed rgba(0,0,0,0.15)", borderRadius: 10, padding: 16, textAlign: "center", cursor: "pointer", marginBottom: 14 }} onClick={() => setIssPhotos(p => p + 1)}>
          <div style={{ fontSize: 22 }}>📸</div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Tap to add photo</div>
        </div>
        <label style={S.lbl}>Priority</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {["Low", "Medium", "High", "Urgent"].map(p => {
            const pc = PRI[p]; const sel = issPri === p;
            return <button key={p} style={{ padding: "6px 14px", borderRadius: 20, border: sel ? `1.5px solid ${pc.bg}` : "0.5px solid rgba(0,0,0,0.12)", background: sel ? pc.bg : "#fff", color: sel ? pc.tx : "#666", fontWeight: sel ? 700 : 400, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }} onClick={() => setIssPri(p)}>{p}</button>;
          })}
        </div>
        <label style={S.lbl}>Assign contractor</label>
        {db.contractors.map((c, i) => {
          const av = ava(c.name, i); const sel = issCont?.id === c.id;
          return (
            <div key={c.id} style={S.copt(sel)} onClick={() => setIssCont(c)}>
              <div style={S.av(av.bg, av.tx)}>{av.initials}</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{c.name}</div><div style={{ fontSize: 12, color: "#888" }}>{c.trade} · {c.avgResponse}</div></div>
              {sel && <span style={{ color: "#1D9E75", fontSize: 18, fontWeight: 700 }}>✓</span>}
            </div>
          );
        })}
        <div style={S.div} />
        <div style={{ fontSize: 13, color: "#888" }}>Copy will be sent to <strong style={{ color: "#111" }}>{db.managerEmail}</strong></div>
      </div>
      <div style={S.bbar}><button style={S.pbtn("gn")} onClick={() => setScr("preview")}>Preview Work Order →</button></div>
    </>
  );

  const renderPreview = () => (
    <>
      <div style={S.body}>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>Exactly what {issCont?.name} will receive:</div>
        <div style={{ background: "#F0EEE8", borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <div style={{ background: "#fff", borderRadius: 10, border: "0.5px solid rgba(0,0,0,0.1)", padding: "13px 15px", marginBottom: 10, fontSize: 13, color: "#333", lineHeight: 1.7 }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
              <div><strong>To:</strong> {issCont?.email}</div>
              <div><strong>CC:</strong> {db.managerEmail}</div>
              <div><strong>Subject:</strong> Work Order #{db.nextWONumber} — {prop?.name}</div>
            </div>
            <div style={S.div} />
            <div style={{ fontSize: 14, color: "#111", lineHeight: 1.8 }}>
              <strong>Work Order #{db.nextWONumber}</strong><br />
              <strong>Property:</strong> {prop?.name}<br />
              <strong>Area:</strong> {issItem?.area}<br />
              <strong>Item:</strong> {issItem?.item}<br />
              <strong>Priority:</strong> <span style={{ color: PRI[issPri]?.tx, fontWeight: 700 }}>{issPri}</span><br />
              <strong>Description:</strong> {issDesc || "(none)"}<br />
              {issPhotos > 0 && <><strong>Photos:</strong> {issPhotos} attached<br /></>}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <div style={{ flex: 1, padding: "10px 0", background: "#1D9E75", color: "#fff", borderRadius: 8, textAlign: "center", fontSize: 14, fontWeight: 700 }}>✓ Accept Job</div>
              <div style={{ flex: 1, padding: "10px 0", background: "#fff", color: "#993C1D", border: "1px solid #D85A30", borderRadius: 8, textAlign: "center", fontSize: 14, fontWeight: 700 }}>✗ Decline</div>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: "#888", background: "#F4F2EE", padding: "10px 12px", borderRadius: 10 }}>A copy goes to <strong style={{ color: "#111" }}>{db.managerEmail}</strong></div>
      </div>
      <div style={S.bbar}>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...S.pbtn("gh"), flex: 1 }} onClick={() => setScr("issue")}>Edit</button>
          <button style={{ ...S.pbtn("gn"), flex: 2 }} onClick={createWO}>Send Work Order</button>
        </div>
      </div>
    </>
  );

  const renderSent = () => (
    <>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 20 }}>✓</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 8 }}>Work order dispatched</div>
        <div style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>{newWO?.wo.number} sent. {newWO?.contractor.name} can accept or decline from their email.</div>
        <div style={S.notifyCard}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", fontSize: 13 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1D9E75", flexShrink: 0 }} /><span style={{ color: "#111" }}>{newWO?.contractor.name} — email sent</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", fontSize: 13 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#378ADD", flexShrink: 0 }} /><span style={{ color: "#111" }}>{db.managerEmail} — copy sent</span></div>
        </div>
        <div style={{ marginTop: 16, fontSize: 13, color: "#888" }}>{newWO?.wo.number} · {issItem?.item} · {issPri}<br />{prop?.name}</div>
      </div>
      <div style={S.bbar}>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...S.pbtn("gh"), flex: 1 }} onClick={() => setScr("checklist")}>Back to checklist</button>
          <button style={{ ...S.pbtn("dk"), flex: 1 }} onClick={() => setScr("home")}>Done</button>
        </div>
      </div>
    </>
  );

  const renderWorkOrders = () => (
    <>
      <div style={{ padding: "12px 16px 0", background: "#fff", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", gap: 6, paddingBottom: 12, overflowX: "auto" }}>
          {["all", "pending", "accepted", "complete"].map(f => (
            <button key={f} style={{ padding: "6px 16px", borderRadius: 20, border: "0.5px solid rgba(0,0,0,0.15)", background: woFilter === f ? "#0F1F38" : "#fff", color: woFilter === f ? "#fff" : "#666", fontWeight: woFilter === f ? 600 : 400, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap", fontFamily: "inherit" }} onClick={() => setWoFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
      </div>
      <div style={S.body}>
        {fWOs.length === 0 && <div style={{ textAlign: "center", color: "#aaa", marginTop: 40, fontSize: 14 }}>No work orders found.</div>}
        {fWOs.map(wo => {
          const sc = STA[wo.status] || STA.pending;
          const p = db.properties.find(x => x.id === wo.propertyId);
          const c = db.contractors.find(x => x.id === wo.contractorId);
          const pc = PRI[wo.priority] || PRI.Medium;
          return (
            <div key={wo.id} style={{ ...S.card, marginBottom: 10 }}>
              <div style={{ padding: "13px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{wo.number}</span><Bdg bg={sc.bg} tx={sc.tx}>{wo.status}</Bdg></div>
                <div style={{ fontSize: 15, color: "#111", marginBottom: 4, fontWeight: 500 }}>{wo.item}</div>
                <div style={{ fontSize: 13, color: "#555", marginBottom: 8, lineHeight: 1.5 }}>{wo.description}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  <Bdg bg={pc.bg} tx={pc.tx}>{wo.priority}</Bdg>
                  <Bdg bg="#F4F2EE" tx="#666">{p?.name}</Bdg>
                  <Bdg bg="#EEEDFE" tx="#3C3489">{c?.name}</Bdg>
                </div>
                <div style={{ fontSize: 12, color: "#aaa", marginBottom: 10 }}>Created {wo.createdAt}{wo.acceptedAt ? ` · Accepted ${wo.acceptedAt}` : ""} · {wo.photos} photo{wo.photos !== 1 ? "s" : ""}</div>
                {wo.status !== "complete" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    {wo.status === "accepted" && <button style={{ ...S.pbtn("gn"), padding: "8px 0", fontSize: 13, flex: 1 }} onClick={() => persist({ ...db, workOrders: db.workOrders.map(w => w.id === wo.id ? { ...w, status: "complete" } : w) })}>Mark Complete</button>}
                    <button style={{ ...S.pbtn("gh"), padding: "8px 0", fontSize: 13, flex: 1 }} onClick={() => persist({ ...db, workOrders: db.workOrders.filter(w => w.id !== wo.id) })}>Delete</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  const addProperty = () => {
    if (!newP.name.trim()) return;
    const p = { id: `p${Date.now()}`, ...newP, units: parseInt(newP.units) || 1 };
    persist({ ...db, properties: [...db.properties, p] });
    setNewP({ name: "", address: "", units: "", type: "", inspectionFreq: "Quarterly" });
    setShowAddP(false);
  };
  const saveProperty = () => {
    if (!editingP.name.trim()) return;
    persist({ ...db, properties: db.properties.map(p => p.id === editingP.id ? { ...editingP, units: parseInt(editingP.units) || 1 } : p) });
    setEditingP(null);
  };
  const deleteProperty = (id) => {
    if (!window.confirm("Delete this property? Its work orders will remain in history.")) return;
    persist({ ...db, properties: db.properties.filter(p => p.id !== id) });
  };

  const FREQS = ["Monthly", "Quarterly", "Bi-Annual", "Annual"];

  const renderProperties = () => (
    <div style={S.body}>
      <div style={S.slabel}>Your properties</div>
      {db.properties.map((p, i) => {
        const av = ava(p.name, i);
        const wos = db.workOrders.filter(w => w.propertyId === p.id).length;
        const isEditing = editingP?.id === p.id;
        return (
          <div key={p.id} style={S.card}>
            {isEditing ? (
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 14 }}>Edit property</div>
                {[["Property name", "name", "text"], ["Address", "address", "text"], ["Units / Suites", "units", "number"], ["Type (e.g. Retail)", "type", "text"]].map(([ph, f, t]) => (
                  <input key={f} type={t} style={S.inp} placeholder={ph} value={editingP[f]} onChange={e => setEditingP(prev => ({ ...prev, [f]: e.target.value }))} />
                ))}
                <label style={S.lbl}>Inspection frequency</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  {FREQS.map(f => (
                    <button key={f} style={{ padding: "6px 12px", borderRadius: 20, border: editingP.inspectionFreq === f ? "1.5px solid #1D9E75" : "0.5px solid rgba(0,0,0,0.15)", background: editingP.inspectionFreq === f ? "#E1F5EE" : "#fff", color: editingP.inspectionFreq === f ? "#0F6E56" : "#666", fontWeight: editingP.inspectionFreq === f ? 700 : 400, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
                      onClick={() => setEditingP(prev => ({ ...prev, inspectionFreq: f }))}>{f}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ ...S.pbtn("gh"), flex: 1 }} onClick={() => setEditingP(null)}>Cancel</button>
                  <button style={{ ...S.pbtn("gn"), flex: 1 }} onClick={saveProperty}>Save changes</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ ...S.av(av.bg, av.tx, 44), borderRadius: 12, fontSize: 22 }}>{propIcon(p.type)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{p.address || "No address set"} · {p.inspectionFreq}</div>
                  </div>
                  <Bdg bg="#E1F5EE" tx="#0F6E56">{wos} WOs</Bdg>
                </div>
                <div style={{ borderTop: "0.5px solid rgba(0,0,0,0.06)", padding: "8px 16px 12px" }}>
                  {[["Units / Suites", p.units || "—"], ["Type", p.type || "—"], ["Inspection freq.", p.inspectionFreq]].map(([k, v]) => (
                    <div key={k} style={S.irow}><span style={{ color: "#888", fontSize: 13 }}>{k}</span><span style={{ color: "#111", fontWeight: 500, fontSize: 13 }}>{v}</span></div>
                  ))}
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button style={{ ...S.pbtn("gh"), padding: "8px 0", fontSize: 13, flex: 1 }} onClick={() => setEditingP({ ...p })}>Edit</button>
                    <button style={{ padding: "8px 0", fontSize: 13, flex: 1, borderRadius: 10, border: "0.5px solid #F09595", background: "#FCEBEB", color: "#A32D2D", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }} onClick={() => deleteProperty(p.id)}>Delete</button>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}

      {!showAddP ? (
        <button style={{ ...S.pbtn("gh"), marginTop: 4 }} onClick={() => setShowAddP(true)}>+ Add property</button>
      ) : (
        <div style={S.card}><div style={{ padding: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 14 }}>New property</div>
          {[["Property name *", "name", "text"], ["Address", "address", "text"], ["Units / Suites", "units", "number"], ["Type (e.g. Retail)", "type", "text"]].map(([ph, f, t]) => (
            <input key={f} type={t} style={S.inp} placeholder={ph} value={newP[f]} onChange={e => setNewP(p => ({ ...p, [f]: e.target.value }))} />
          ))}
          <label style={S.lbl}>Inspection frequency</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {FREQS.map(f => (
              <button key={f} style={{ padding: "6px 12px", borderRadius: 20, border: newP.inspectionFreq === f ? "1.5px solid #1D9E75" : "0.5px solid rgba(0,0,0,0.15)", background: newP.inspectionFreq === f ? "#E1F5EE" : "#fff", color: newP.inspectionFreq === f ? "#0F6E56" : "#666", fontWeight: newP.inspectionFreq === f ? 700 : 400, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
                onClick={() => setNewP(p => ({ ...p, inspectionFreq: f }))}>{f}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...S.pbtn("gh"), flex: 1 }} onClick={() => setShowAddP(false)}>Cancel</button>
            <button style={{ ...S.pbtn("dk"), flex: 1 }} onClick={addProperty}>Add property</button>
          </div>
        </div></div>
      )}
    </div>
  );

  const renderContractors = () => (
    <div style={S.body}>
      <div style={S.slabel}>Saved contractors</div>
      {db.contractors.map((c, i) => {
        const av = ava(c.name, i);
        const cnt = db.workOrders.filter(w => w.contractorId === c.id).length;
        return (
          <div key={c.id} style={S.card}>
            <div style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={S.av(av.bg, av.tx, 44)}>{av.initials}</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>{c.name}</div><div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{c.trade} · {c.email}</div></div>
              <Bdg bg="#E1F5EE" tx="#0F6E56">{cnt} WOs</Bdg>
            </div>
            <div style={{ borderTop: "0.5px solid rgba(0,0,0,0.06)", padding: "8px 16px 12px" }}>
              {[["Phone", c.phone || "—"], ["Response", c.avgResponse || "—"], ["License", c.license || "N/A"]].map(([k, v]) => (
                <div key={k} style={S.irow}><span style={{ color: "#888", fontSize: 13 }}>{k}</span><span style={{ color: "#111", fontWeight: 500, fontSize: 13 }}>{v}</span></div>
              ))}
            </div>
          </div>
        );
      })}
      {!showAddC ? (
        <button style={S.pbtn("gh")} onClick={() => setShowAddC(true)}>+ Add contractor</button>
      ) : (
        <div style={S.card}><div style={{ padding: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 14 }}>New contractor</div>
          {[["Name", "name", "text"], ["Trade", "trade", "text"], ["Email", "email", "email"], ["Phone", "phone", "tel"], ["License #", "license", "text"]].map(([ph, f, t]) => (
            <input key={f} type={t} style={S.inp} placeholder={ph} value={newC[f]} onChange={e => setNewC(p => ({ ...p, [f]: e.target.value }))} />
          ))}
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...S.pbtn("gh"), flex: 1 }} onClick={() => setShowAddC(false)}>Cancel</button>
            <button style={{ ...S.pbtn("dk"), flex: 1 }} onClick={addC}>Save</button>
          </div>
        </div></div>
      )}
      <div style={{ ...S.slabel, marginTop: 20 }}>Settings</div>
      <div style={S.card}><div style={{ padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 6 }}>Manager CC email</div>
        {editMgr ? (
          <>
            <input type="email" style={S.inp} value={mgrEmail} onChange={e => setMgrEmail(e.target.value)} />
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.pbtn("gh"), flex: 1 }} onClick={() => setEditMgr(false)}>Cancel</button>
              <button style={{ ...S.pbtn("gn"), flex: 1 }} onClick={() => { persist({ ...db, managerEmail: mgrEmail }); setEditMgr(false); }}>Save</button>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, color: "#555" }}>{db.managerEmail}</span>
            <button style={{ fontSize: 13, padding: "5px 12px", borderRadius: 20, border: "0.5px solid rgba(0,0,0,0.15)", background: "#fff", cursor: "pointer", fontFamily: "inherit" }} onClick={() => setEditMgr(true)}>Edit</button>
          </div>
        )}
      </div></div>
    </div>
  );

  const renderTemplate = () => (
    <div style={S.body}>
      <div style={{ fontSize: 13, color: "#888", marginBottom: 14, lineHeight: 1.6 }}>Edit your inspection checklist. Changes apply to all future inspections.</div>
      {db.checklistTemplate.map((sec, ai) => (
        <div key={ai} style={{ ...S.card, marginBottom: 10 }}>
          <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
            {editA?.ai === ai && editA?.ii == null ? (
              <div style={{ display: "flex", gap: 6, flex: 1 }}>
                <input style={{ ...S.inp, marginBottom: 0, flex: 1, padding: "7px 10px", fontSize: 14 }} value={editTxt} onChange={e => setEditTxt(e.target.value)} onKeyDown={e => e.key === "Enter" && saveAreaName(ai)} autoFocus />
                <button style={{ padding: "7px 12px", borderRadius: 8, background: "#0F1F38", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }} onClick={() => saveAreaName(ai)}>Save</button>
                <button style={{ padding: "7px 10px", borderRadius: 8, background: "#fff", color: "#666", border: "0.5px solid rgba(0,0,0,0.15)", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }} onClick={() => setEditA(null)}>✕</button>
              </div>
            ) : (
              <>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#111", flex: 1 }}>{sec.area}</span>
                <button style={{ fontSize: 12, padding: "4px 10px", borderRadius: 20, border: "0.5px solid rgba(0,0,0,0.12)", background: "#F4F2EE", color: "#555", cursor: "pointer", fontFamily: "inherit" }} onClick={() => { setEditA({ ai }); setEditTxt(sec.area); }}>Rename</button>
                <button style={{ fontSize: 12, padding: "4px 10px", borderRadius: 20, border: "0.5px solid #F09595", background: "#FCEBEB", color: "#A32D2D", cursor: "pointer", fontFamily: "inherit" }} onClick={() => delArea(ai)}>Delete</button>
              </>
            )}
          </div>
          <div style={{ padding: "4px 14px 8px" }}>
            {sec.items.map((item, ii) => (
              <div key={ii} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "0.5px solid rgba(0,0,0,0.04)" }}>
                {editA?.ai === ai && editA?.ii === ii ? (
                  <div style={{ display: "flex", gap: 6, flex: 1 }}>
                    <input style={{ ...S.inp, marginBottom: 0, flex: 1, padding: "6px 10px", fontSize: 13 }} value={editTxt} onChange={e => setEditTxt(e.target.value)} onKeyDown={e => e.key === "Enter" && saveItemName(ai, ii)} autoFocus />
                    <button style={{ padding: "6px 10px", borderRadius: 8, background: "#0F1F38", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }} onClick={() => saveItemName(ai, ii)}>Save</button>
                    <button style={{ padding: "6px 8px", borderRadius: 8, background: "#fff", color: "#666", border: "0.5px solid rgba(0,0,0,0.15)", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }} onClick={() => setEditA(null)}>✕</button>
                  </div>
                ) : (
                  <>
                    <span style={{ fontSize: 14, color: "#333", flex: 1 }}>{item}</span>
                    <button style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, border: "0.5px solid rgba(0,0,0,0.12)", background: "#F4F2EE", color: "#666", cursor: "pointer", fontFamily: "inherit" }} onClick={() => { setEditA({ ai, ii }); setEditTxt(item); }}>Edit</button>
                    <button style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, border: "0.5px solid #F09595", background: "#FCEBEB", color: "#A32D2D", cursor: "pointer", fontFamily: "inherit" }} onClick={() => delItem(ai, ii)}>✕</button>
                  </>
                )}
              </div>
            ))}
            {addItemTo === ai ? (
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <input style={{ ...S.inp, marginBottom: 0, flex: 1, padding: "7px 10px", fontSize: 13 }} placeholder="New item..." value={newItemTxt} onChange={e => setNewItemTxt(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem(ai)} autoFocus />
                <button style={{ padding: "7px 12px", borderRadius: 8, background: "#1D9E75", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }} onClick={() => addItem(ai)}>Add</button>
                <button style={{ padding: "7px 10px", borderRadius: 8, background: "#fff", color: "#666", border: "0.5px solid rgba(0,0,0,0.15)", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }} onClick={() => setAddItemTo(null)}>✕</button>
              </div>
            ) : (
              <button style={{ marginTop: 8, fontSize: 13, color: "#1D9E75", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: "4px 0", fontFamily: "inherit" }} onClick={() => { setAddItemTo(ai); setNewItemTxt(""); }}>+ Add item</button>
            )}
          </div>
        </div>
      ))}
      {addingArea ? (
        <div style={S.card}><div style={{ padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 10 }}>New area</div>
          <input style={S.inp} placeholder="e.g. Tenant Spaces" value={newAreaTxt} onChange={e => setNewAreaTxt(e.target.value)} onKeyDown={e => e.key === "Enter" && addArea()} autoFocus />
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...S.pbtn("gh"), flex: 1 }} onClick={() => setAddingArea(false)}>Cancel</button>
            <button style={{ ...S.pbtn("dk"), flex: 1 }} onClick={addArea}>Add Area</button>
          </div>
        </div></div>
      ) : (
        <button style={{ ...S.pbtn("gh"), marginTop: 4 }} onClick={() => setAddingArea(true)}>+ Add new area</button>
      )}
    </div>
  );

  const renderReport = () => (
    <>
      <div style={{ padding: "14px 16px 0", background: "#fff", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0F1F38", marginBottom: 4 }}>Export Report</div>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>Select work orders to include in a PDF.</div>
        <input style={{ ...S.inp, marginBottom: 12 }} placeholder="Report title..." value={rptTitle} onChange={e => setRptTitle(e.target.value)} />
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          <select style={{ ...S.inp, marginBottom: 0, flex: 1, padding: "7px 10px", fontSize: 13 }} value={rptProp} onChange={e => setRptProp(e.target.value)}>
            <option value="all">All properties</option>
            {db.properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select style={{ ...S.inp, marginBottom: 0, flex: 1, padding: "7px 10px", fontSize: 13 }} value={rptSta} onChange={e => setRptSta(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="complete">Complete</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, border: "0.5px solid rgba(0,0,0,0.15)", background: "#0F1F38", color: "#fff", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }} onClick={selAll}>Select all</button>
          <button style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, border: "0.5px solid rgba(0,0,0,0.15)", background: "#fff", color: "#555", cursor: "pointer", fontFamily: "inherit" }} onClick={() => setRptSel({})}>Clear</button>
          <span style={{ marginLeft: "auto", fontSize: 13, color: "#888", alignSelf: "center" }}>{selWOs.length} selected</span>
        </div>
      </div>
      <div style={{ ...S.body, paddingBottom: 80 }}>
        {rptWOs.map(wo => {
          const sel = !!rptSel[wo.id];
          const p = db.properties.find(x => x.id === wo.propertyId);
          const c = db.contractors.find(x => x.id === wo.contractorId);
          const sc = STA[wo.status] || STA.pending;
          const pc = PRI[wo.priority] || PRI.Medium;
          return (
            <div key={wo.id} style={{ ...S.card, marginBottom: 8, border: sel ? "1.5px solid #1D9E75" : "0.5px solid rgba(0,0,0,0.08)", cursor: "pointer" }} onClick={() => toggleRpt(wo.id)}>
              <div style={{ padding: "12px 14px", display: "flex", gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1, background: sel ? "#1D9E75" : "#fff", border: sel ? "none" : "1.5px solid rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>{sel ? "✓" : ""}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{wo.number}</span>
                    <div style={{ display: "flex", gap: 4 }}><Bdg bg={pc.bg} tx={pc.tx}>{wo.priority}</Bdg><Bdg bg={sc.bg} tx={sc.tx}>{wo.status}</Bdg></div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 2 }}>{wo.item}</div>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 4, lineHeight: 1.4 }}>{wo.description.slice(0, 80)}{wo.description.length > 80 ? "…" : ""}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{p?.name} · {c?.name} · {wo.photos} photo{wo.photos !== 1 ? "s" : ""} · {wo.createdAt}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ ...S.bbar, position: "sticky", bottom: 0 }}>
        <button style={{ ...S.pbtn(selWOs.length > 0 ? "gn" : "gh"), opacity: selWOs.length > 0 ? 1 : 0.5 }} onClick={genPDF} disabled={!selWOs.length || rptGen}>
          {rptGen ? "Generating PDF…" : `Download PDF (${selWOs.length} WO${selWOs.length !== 1 ? "s" : ""})`}
        </button>
      </div>
    </>
  );

  // ── Layout ─────────────────────────────────────────────────────────────────
  const inFlow = tab === "inspect" && scr !== "home";
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={S.app}>
        <div style={S.sbar}><span>9:41 AM</span><span style={{ fontWeight: 600 }}>PropInspect</span><span>●●●</span></div>
        {inFlow && (
          <div style={S.tbar}>
            <button style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 20, padding: "5px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
              onClick={() => { if (scr === "checklist") setScr("home"); else if (scr === "issue") setScr("checklist"); else if (scr === "preview") setScr("issue"); else setScr("home"); }}>‹ Back</button>
            <span style={{ fontSize: 17, fontWeight: 600, flex: 1, letterSpacing: -0.3 }}>{scr === "checklist" ? prop?.name : scr === "issue" ? "Flag Issue" : scr === "preview" ? "Preview" : "Sent"}</span>
          </div>
        )}
        {!inFlow && (
          <div style={S.tabs}>
            {[["inspect", "Inspect"], ["properties", "Properties"], ["workorders", "Orders"], ["contractors", "Contacts"], ["checklist", "Template"], ["report", "Report"]].map(([k, l]) => (
              <button key={k} style={{ ...S.tab(tab === k), fontSize: 10 }} onClick={() => { setTab(k); setScr("home"); }}>{l}</button>
            ))}
          </div>
        )}
        {tab === "inspect" && scr === "home" && renderHome()}
        {tab === "inspect" && scr === "checklist" && renderChecklist()}
        {tab === "inspect" && scr === "issue" && renderIssue()}
        {tab === "inspect" && scr === "preview" && renderPreview()}
        {tab === "inspect" && scr === "sent" && renderSent()}
        {tab === "properties" && renderProperties()}
        {tab === "workorders" && renderWorkOrders()}
        {tab === "contractors" && renderContractors()}
        {tab === "checklist" && renderTemplate()}
        {tab === "report" && renderReport()}
      </div>
    </>
  );
}
