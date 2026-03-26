import { useState, useCallback, useRef } from "react";

// ── Persistent storage ────────────────────────────────────────────────────────
const STORE_KEY = "propinspect_v2";
const loadDB = () => { try { const r = localStorage.getItem(STORE_KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
const saveDB = (db) => { try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch {} };

const CHECKLIST_TEMPLATE = [
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
];

const SEED = {
  managerEmail: "manager@yourcompany.com",
  properties: [
    { id: "p1", name: "Verrado Marketplace",  vacantUnits: "", type: "Commercial", address: "", inspectionFreq: "Monthly" },
    { id: "p2", name: "Canyon Trails",         vacantUnits: "", type: "Commercial", address: "", inspectionFreq: "Monthly" },
    { id: "p3", name: "Tempe Marketplace",     vacantUnits: "", type: "Commercial", address: "", inspectionFreq: "Monthly" },
    { id: "p4", name: "Novus Place",           vacantUnits: "", type: "Commercial", address: "", inspectionFreq: "Monthly" },
    { id: "p5", name: "Superstition Gateway",  vacantUnits: "", type: "Commercial", address: "", inspectionFreq: "Monthly" },
  ],
  contractors: [
    { id: "c1", name: "Maintenance Contractor", trade: "Maintenance", email: "", phone: "", license: "", avgResponse: "" },
    { id: "c2", name: "Sweeping Contractor",    trade: "Sweeping",    email: "", phone: "", license: "", avgResponse: "" },
    { id: "c3", name: "Security Contractor",    trade: "Security",    email: "", phone: "", license: "", avgResponse: "" },
  ],
  checklistTemplate: CHECKLIST_TEMPLATE,
  workOrders: [],
  inspections: [],
  nextWONumber: 1001,
};

const initDB = () => { const e = loadDB(); if (e) return e; saveDB(SEED); return JSON.parse(JSON.stringify(SEED)); };

const PRI  = { Urgent:{bg:"#FCEBEB",tx:"#A32D2D"}, High:{bg:"#FAECE7",tx:"#993C1D"}, Medium:{bg:"#FAEEDA",tx:"#854F0B"}, Low:{bg:"#EAF3DE",tx:"#3B6D11"} };
const STA  = { pending:{bg:"#FAEEDA",tx:"#854F0B"}, accepted:{bg:"#E6F1FB",tx:"#185FA5"}, complete:{bg:"#E1F5EE",tx:"#0F6E56"} };
const AVC  = [{bg:"#EEEDFE",tx:"#3C3489"},{bg:"#E1F5EE",tx:"#0F6E56"},{bg:"#FAEEDA",tx:"#854F0B"},{bg:"#E6F1FB",tx:"#185FA5"},{bg:"#FAECE7",tx:"#993C1D"}];
const ava  = (n,i) => { const c=AVC[i%AVC.length]; return {initials:n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(),...c}; };
const Bdg  = ({bg,tx,children}) => <span style={{fontSize:11,padding:"3px 9px",borderRadius:20,background:bg,color:tx,fontWeight:600,display:"inline-block",whiteSpace:"nowrap"}}>{children}</span>;
const hexRgb = h => [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const PHEX = {Urgent:"#A32D2D",High:"#993C1D",Medium:"#854F0B",Low:"#3B6D11"};
const SHEX = {pending:"#854F0B",accepted:"#185FA5",complete:"#0F6E56"};
const propIcon = t => t?.includes("Industrial")?"🏭":t?.includes("Retail")?"🏬":"🏢";
const today = () => new Date().toISOString().slice(0,10);
const toDataURL = f => new Promise(res => { const r=new FileReader(); r.onload=e=>res(e.target.result); r.readAsDataURL(f); });

const S = {
  app:    {maxWidth:390,margin:"1rem auto",background:"#F4F2EE",borderRadius:20,overflow:"hidden",minHeight:780,display:"flex",flexDirection:"column",fontFamily:"'DM Sans',system-ui,sans-serif",border:"0.5px solid rgba(0,0,0,0.1)",boxShadow:"0 8px 40px rgba(0,0,0,0.12)"},
  sbar:   {background:"#0F1F38",color:"#fff",fontSize:12,padding:"8px 18px 6px",display:"flex",justifyContent:"space-between"},
  tbar:   {background:"#0F1F38",color:"#fff",padding:"10px 16px 16px",display:"flex",alignItems:"center",gap:10},
  tabs:   {display:"flex",background:"#fff",borderBottom:"0.5px solid rgba(0,0,0,0.08)"},
  tab:    on=>({flex:1,padding:"10px 0",fontSize:10,textAlign:"center",cursor:"pointer",color:on?"#0F1F38":"#888",borderBottom:on?"2px solid #0F1F38":"2px solid transparent",fontWeight:on?600:400,fontFamily:"inherit",background:"none",border:"none",borderBottom:on?"2px solid #0F1F38":"2px solid transparent"}),
  body:   {flex:1,overflowY:"auto",padding:16},
  slabel: {fontSize:11,fontWeight:600,color:"#888",textTransform:"uppercase",letterSpacing:"0.07em",margin:"16px 0 8px"},
  card:   {background:"#fff",border:"0.5px solid rgba(0,0,0,0.08)",borderRadius:14,marginBottom:10,overflow:"hidden"},
  crow:   {padding:"13px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer"},
  inp:    {width:"100%",padding:"10px 12px",border:"0.5px solid rgba(0,0,0,0.15)",borderRadius:10,background:"#fff",color:"#111",fontSize:14,marginBottom:14,outline:"none",fontFamily:"inherit"},
  ta:     {width:"100%",padding:"10px 12px",border:"0.5px solid rgba(0,0,0,0.15)",borderRadius:10,background:"#fff",color:"#111",fontSize:14,marginBottom:14,minHeight:80,resize:"none",outline:"none",fontFamily:"inherit"},
  lbl:    {fontSize:13,color:"#666",marginBottom:6,display:"block",fontWeight:500},
  pbtn:   (v="dk")=>({width:"100%",padding:"13px",border:v==="gh"?"0.5px solid rgba(0,0,0,0.15)":"none",borderRadius:10,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit",background:v==="dk"?"#0F1F38":v==="gn"?"#1D9E75":"#fff",color:v==="dk"?"#fff":v==="gn"?"#fff":"#0F1F38"}),
  bbar:   {padding:"12px 16px",borderTop:"0.5px solid rgba(0,0,0,0.08)",background:"#fff"},
  div:    {height:"0.5px",background:"rgba(0,0,0,0.08)",margin:"12px 0"},
  pwrap:  {background:"rgba(0,0,0,0.08)",borderRadius:4,height:5,margin:"0 0 4px"},
  pfill:  p=>({height:5,borderRadius:4,background:"#1D9E75",width:`${p}%`,transition:"width 0.4s"}),
  av:     (bg,tx,size=40)=>({width:size,height:size,borderRadius:"50%",background:bg,color:tx,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size>36?14:12,fontWeight:700,flexShrink:0}),
  copt:   sel=>({background:sel?"#E1F5EE":"#fff",border:sel?"1.5px solid #1D9E75":"0.5px solid rgba(0,0,0,0.12)",borderRadius:10,padding:"12px 14px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:10}),
  irow:   {display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",fontSize:14},
  pthumb: {width:64,height:64,borderRadius:10,background:"#B5D4F4",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:22,overflow:"hidden",flexShrink:0},
  ncard:  {background:"#fff",border:"0.5px solid rgba(0,0,0,0.08)",borderRadius:12,padding:"12px 14px",marginTop:16,width:"100%",textAlign:"left"},
};

function PhotoPicker({photos=[],onChange,label="Photos"}) {
  const ref = useRef();
  const add = async e => { const d=await Promise.all(Array.from(e.target.files).map(toDataURL)); onChange([...photos,...d]); e.target.value=""; };
  const rm  = i => onChange(photos.filter((_,j)=>j!==i));
  return (
    <div style={{marginBottom:14}}>
      <label style={S.lbl}>{label} ({photos.length})</label>
      {photos.length>0&&<div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
        {photos.map((src,i)=>(
          <div key={i} style={{position:"relative"}}>
            <div style={{...S.pthumb,background:"#ddd"}}><img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>
            <button onClick={()=>rm(i)} style={{position:"absolute",top:-6,right:-6,width:18,height:18,borderRadius:"50%",background:"#D85A30",color:"#fff",border:"none",cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>✕</button>
          </div>
        ))}
      </div>}
      <input ref={ref} type="file" accept="image/*" multiple capture="environment" style={{display:"none"}} onChange={add}/>
      <div style={{background:"#F4F2EE",border:"1.5px dashed rgba(0,0,0,0.15)",borderRadius:10,padding:14,textAlign:"center",cursor:"pointer"}} onClick={()=>ref.current.click()}>
        <div style={{fontSize:20}}>📸</div>
        <div style={{fontSize:13,color:"#888",marginTop:3}}>Tap to take or upload photo</div>
      </div>
    </div>
  );
}

export default function App() {
  const [db,setDB]           = useState(()=>initDB());
  const [tab,setTab]         = useState("inspect");
  const [scr,setScr]         = useState("home");
  const [prop,setProp]       = useState(null);
  const [clState,setClState] = useState({});
  const [openA,setOpenA]     = useState({});
  const [issItem,setIssItem] = useState(null);
  const [issDesc,setIssDesc] = useState("");
  const [issPri,setIssPri]   = useState("Medium");
  const [issCont,setIssCont] = useState(null);
  const [issPhotos,setIssPhotos] = useState([]);
  const [newWO,setNewWO]     = useState(null);
  const [woFilter,setWoFilter] = useState("all");
  const [expandedWO,setExpandedWO] = useState(null);
  const [compPhotos,setCompPhotos] = useState([]);
  const [compNote,setCompNote]     = useState("");
  const [showAddP,setShowAddP] = useState(false);
  const [editingP,setEditingP] = useState(null);
  const [newP,setNewP]         = useState({name:"",address:"",vacantUnits:"",type:"",inspectionFreq:"Monthly"});
  const [editingC,setEditingC] = useState(null);
  const [showAddC,setShowAddC] = useState(false);
  const [newC,setNewC]         = useState({name:"",trade:"",email:"",phone:"",license:"",avgResponse:""});
  const [editMgr,setEditMgr]   = useState(false);
  const [mgrEmail,setMgrEmail] = useState(db.managerEmail);
  const [editA,setEditA]       = useState(null);
  const [editTxt,setEditTxt]   = useState("");
  const [addItemTo,setAddItemTo] = useState(null);
  const [newItemTxt,setNewItemTxt] = useState("");
  const [newAreaTxt,setNewAreaTxt] = useState("");
  const [addingArea,setAddingArea] = useState(false);
  const [rptSel,setRptSel]     = useState({});
  const [rptProp,setRptProp]   = useState("all");
  const [rptSta,setRptSta]     = useState("all");
  const [rptTitle,setRptTitle] = useState("Property Inspection Report");
  const [rptGen,setRptGen]     = useState(false);
  const [rptMode,setRptMode]   = useState("wo");

  const persist = useCallback(u=>{setDB(u);saveDB(u);},[]);

  const freshCl = () => { const st={}; db.checklistTemplate.forEach(s=>s.items.forEach(it=>{st[`${s.area}::${it}`]={status:"none",photos:[]};})); return st; };

  const startInsp = p => {
    setProp(p);
    const st=freshCl();
    db.workOrders.filter(w=>w.propertyId===p.id&&w.status==="pending").forEach(w=>{const k=`${w.area}::${w.item}`;if(st[k])st[k]={...st[k],status:"flagged"};});
    setClState(st); setOpenA({[db.checklistTemplate[0].area]:true}); setScr("checklist");
  };

  const finishInspection = () => {
    const record={id:`insp${Date.now()}`,propertyId:prop.id,date:today(),items:clState};
    persist({...db,inspections:[...(db.inspections||[]),record]});
    setClState(freshCl()); setProp(null); setScr("home");
  };

  const setSat = (k,val) => setClState(prev=>({...prev,[k]:{...prev[k],status:prev[k]?.status===val?"none":val}}));
  const setItemPhotos = (k,photos) => setClState(prev=>({...prev,[k]:{...prev[k],photos}}));

  const done=Object.values(clState).filter(v=>v.status!=="none").length;
  const total=Object.keys(clState).length;
  const pct=total?Math.round(done/total*100):0;

  const openIssue = (area,item) => {
    setIssItem({area,item}); setIssDesc(""); setIssPri("Medium");
    setIssCont(db.contractors[0]||null); setIssPhotos([]); setScr("issue");
  };

  const createWO = () => {
    const number=`WO-${db.nextWONumber}`;
    const wo={id:`wo${Date.now()}`,number,propertyId:prop.id,area:issItem.area,item:issItem.item,
      description:issDesc||"(No description)",priority:issPri,contractorId:issCont?.id||null,
      status:"pending",photos:issPhotos,completionPhotos:[],completionNote:"",
      createdAt:today(),acceptedAt:null,completedAt:null};
    persist({...db,workOrders:[...db.workOrders,wo],nextWONumber:db.nextWONumber+1});
    setNewWO({wo,contractor:issCont});
    setClState(prev=>({...prev,[`${issItem.area}::${issItem.item}`]:{...prev[`${issItem.area}::${issItem.item}`],status:"flagged"}}));
    setScr("sent");
  };

  const updateWO=(id,changes)=>persist({...db,workOrders:db.workOrders.map(w=>w.id===id?{...w,...changes}:w)});
  const deleteWO=id=>persist({...db,workOrders:db.workOrders.filter(w=>w.id!==id)});

  const FREQS=["Monthly","Quarterly","Bi-Annual","Annual"];
  const addProperty=()=>{if(!newP.name.trim())return;persist({...db,properties:[...db.properties,{id:`p${Date.now()}`,...newP}]});setNewP({name:"",address:"",vacantUnits:"",type:"",inspectionFreq:"Monthly"});setShowAddP(false);};
  const saveProperty=()=>{persist({...db,properties:db.properties.map(p=>p.id===editingP.id?editingP:p)});setEditingP(null);};
  const deleteProperty=id=>persist({...db,properties:db.properties.filter(p=>p.id!==id)});

  const addC=()=>{if(!newC.name)return;persist({...db,contractors:[...db.contractors,{id:`c${Date.now()}`,...newC}]});setNewC({name:"",trade:"",email:"",phone:"",license:"",avgResponse:""});setShowAddC(false);};
  const saveContractor=()=>{persist({...db,contractors:db.contractors.map(c=>c.id===editingC.id?editingC:c)});setEditingC(null);};
  const deleteContractor=id=>persist({...db,contractors:db.contractors.filter(c=>c.id!==id)});

  const delArea=(i)=>persist({...db,checklistTemplate:db.checklistTemplate.filter((_,j)=>j!==i)});
  const delItem=(ai,ii)=>persist({...db,checklistTemplate:db.checklistTemplate.map((s,j)=>j===ai?{...s,items:s.items.filter((_,k)=>k!==ii)}:s)});
  const saveAreaName=ai=>{persist({...db,checklistTemplate:db.checklistTemplate.map((s,j)=>j===ai?{...s,area:editTxt}:s)});setEditA(null);};
  const saveItemName=(ai,ii)=>{persist({...db,checklistTemplate:db.checklistTemplate.map((s,j)=>j===ai?{...s,items:s.items.map((it,k)=>k===ii?editTxt:it)}:s)});setEditA(null);};
  const addItem=ai=>{if(!newItemTxt.trim())return;persist({...db,checklistTemplate:db.checklistTemplate.map((s,j)=>j===ai?{...s,items:[...s.items,newItemTxt.trim()]}:s)});setNewItemTxt("");setAddItemTo(null);};
  const addArea=()=>{if(!newAreaTxt.trim())return;persist({...db,checklistTemplate:[...db.checklistTemplate,{area:newAreaTxt.trim(),items:[]}]});setNewAreaTxt("");setAddingArea(false);};

  const fWOs=db.workOrders.filter(w=>woFilter==="all"||w.status===woFilter).slice().reverse();
  const rptWOs=db.workOrders.filter(w=>(rptProp==="all"||w.propertyId===rptProp)&&(rptSta==="all"||w.status===rptSta)).slice().reverse();
  const selWOs=rptWOs.filter(w=>rptSel[w.id]);
  const toggleRpt=id=>setRptSel(p=>({...p,[id]:!p[id]}));
  const selAll=()=>{const s={};rptWOs.forEach(w=>s[w.id]=true);setRptSel(s);};

  const genPDF = async () => {
    setRptGen(true);
    try {
      if(!window.jspdf){await new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";s.onload=res;s.onerror=rej;document.head.appendChild(s);});}
      const {jsPDF}=window.jspdf;
      const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
      const PW=210,PH=297,ML=18,MR=18,CW=PW-ML-MR;
      let y=0;
      const addPage=()=>{doc.addPage();y=0;};
      const chkY=n=>{if(y+n>PH-20)addPage();};
      const footer=(lbl)=>{doc.setFillColor(15,31,56);doc.rect(0,PH-10,PW,10,"F");doc.setFont("helvetica","normal");doc.setFontSize(7);doc.setTextColor(180,200,230);doc.text("PropInspect  ·  Confidential",ML,PH-4);doc.text(lbl,PW-MR,PH-4,{align:"right"});};

      // Cover
      doc.setFillColor(15,31,56);doc.rect(0,0,PW,80,"F");
      doc.setFillColor(29,158,117);doc.rect(0,80,PW,4,"F");
      doc.setFont("helvetica","bold");doc.setFontSize(11);doc.setTextColor(255,255,255);doc.text("PROPINSPECT",ML,22);
      doc.setFontSize(22);doc.text(doc.splitTextToSize(rptTitle,CW),ML,42);
      doc.setFontSize(11);doc.setTextColor(180,200,230);doc.text(`Generated ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}`,ML,64);
      y=100;footer("Page 1");

      if(rptMode==="wo"){
        const stats=[{l:"Total",v:selWOs.length,c:"#0F1F38"},{l:"Pending",v:selWOs.filter(w=>w.status==="pending").length,c:"#854F0B"},{l:"Accepted",v:selWOs.filter(w=>w.status==="accepted").length,c:"#185FA5"},{l:"Complete",v:selWOs.filter(w=>w.status==="complete").length,c:"#0F6E56"}];
        const sw=CW/4;
        stats.forEach((st,i)=>{
          const x=ML+i*sw;doc.setFillColor(245,244,240);doc.roundedRect(x,y,sw-4,22,3,3,"F");
          const[r,g,b]=hexRgb(st.c);doc.setTextColor(r,g,b);doc.setFont("helvetica","bold");doc.setFontSize(18);doc.text(String(st.v),x+(sw-4)/2,y+13,{align:"center"});
          doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(120,120,120);doc.text(st.l.toUpperCase(),x+(sw-4)/2,y+19,{align:"center"});
        });y+=34;

        selWOs.forEach((wo,idx)=>{
          addPage();y=18;
          const pr=db.properties.find(p=>p.id===wo.propertyId);
          const ct=db.contractors.find(c=>c.id===wo.contractorId);
          doc.setFillColor(15,31,56);doc.rect(0,0,PW,14,"F");
          doc.setFont("helvetica","bold");doc.setFontSize(9);doc.setTextColor(255,255,255);doc.text(`${wo.number}  ·  ${pr?.name||""}`,ML,9);
          doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(180,200,230);doc.text(`${idx+1} of ${selWOs.length}`,PW-MR,9,{align:"right"});
          y=24;
          doc.setFont("helvetica","bold");doc.setFontSize(17);doc.setTextColor(15,31,56);
          const il=doc.splitTextToSize(wo.item,CW);doc.text(il,ML,y);y+=il.length*7+3;
          doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(100,100,100);doc.text(wo.area,ML,y);y+=10;
          const drawBadge=(lbl,hx,xp,yp)=>{const[r,g,b]=hexRgb(hx);doc.setFillColor(r+(255-r)*0.85,g+(255-g)*0.85,b+(255-b)*0.85);doc.roundedRect(xp,yp-4,30,7,2,2,"F");doc.setFont("helvetica","bold");doc.setFontSize(7.5);doc.setTextColor(r,g,b);doc.text(lbl.toUpperCase(),xp+15,yp,{align:"center"});};
          drawBadge(wo.status,SHEX[wo.status]||"#666",ML,y);drawBadge(wo.priority,PHEX[wo.priority]||"#666",ML+34,y);y+=10;
          doc.setDrawColor(220,220,215);doc.setLineWidth(0.3);doc.line(ML,y,PW-MR,y);y+=8;
          const details=[["Property",pr?.name||"—"],["Area",wo.area],["Contractor",ct?.name||"—"],["Phone",ct?.phone||"—"],["Created",wo.createdAt],["Accepted",wo.acceptedAt||"—"],["Completed",wo.completedAt||"—"],["Issue Photos",`${(wo.photos||[]).length}`]];
          const cw2=CW/2-4;
          details.forEach(([k,v],i)=>{const col=i%2===0?ML:ML+cw2+8;const ry=y+Math.floor(i/2)*12;doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(140,140,140);doc.text(k.toUpperCase(),col,ry);doc.setFont("helvetica","bold");doc.setFontSize(10);doc.setTextColor(30,30,30);doc.text(String(v).slice(0,30),col,ry+5);});
          y+=Math.ceil(details.length/2)*12+6;
          doc.line(ML,y,PW-MR,y);y+=8;
          doc.setFont("helvetica","bold");doc.setFontSize(9);doc.setTextColor(15,31,56);doc.text("DESCRIPTION",ML,y);y+=6;
          doc.setFont("helvetica","normal");doc.setFontSize(10.5);doc.setTextColor(40,40,40);
          const dl=doc.splitTextToSize(wo.description,CW);chkY(dl.length*5.5+6);doc.text(dl,ML,y);y+=dl.length*5.5+10;
          const issArr=Array.isArray(wo.photos)?wo.photos:[];
          if(issArr.length>0){chkY(14);doc.setFont("helvetica","bold");doc.setFontSize(9);doc.setTextColor(15,31,56);doc.text("ISSUE PHOTOS",ML,y);y+=6;const pw2=(CW-8)/3;issArr.slice(0,6).forEach((src,pi)=>{if(pi>0&&pi%3===0){y+=38;chkY(38);}const px=ML+(pi%3)*(pw2+4);try{doc.addImage(src,"JPEG",px,y,pw2,32);}catch{doc.setFillColor(230,235,245);doc.roundedRect(px,y,pw2,32,3,3,"F");}});y+=38;}
          const cmpArr=Array.isArray(wo.completionPhotos)?wo.completionPhotos:[];
          if(cmpArr.length>0){chkY(14);doc.setFont("helvetica","bold");doc.setFontSize(9);doc.setTextColor(29,158,117);doc.text("COMPLETION PHOTOS",ML,y);y+=6;if(wo.completionNote){doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(40,40,40);doc.text(`Note: ${wo.completionNote}`,ML,y);y+=6;}const pw2=(CW-8)/3;cmpArr.slice(0,6).forEach((src,pi)=>{if(pi>0&&pi%3===0){y+=38;chkY(38);}const px=ML+(pi%3)*(pw2+4);try{doc.addImage(src,"JPEG",px,y,pw2,32);}catch{doc.setFillColor(225,245,238);doc.roundedRect(px,y,pw2,32,3,3,"F");}});y+=38;}
          footer(`Page ${idx+2}`);
        });

        // Index
        addPage();
        doc.setFillColor(15,31,56);doc.rect(0,0,PW,14,"F");doc.setFont("helvetica","bold");doc.setFontSize(9);doc.setTextColor(255,255,255);doc.text("WORK ORDER INDEX",ML,9);
        y=26;
        ["#","Work Order","Item","Property","Contractor","Priority","Status"].forEach((h,i)=>{const xs=[ML,ML+10,ML+30,ML+82,ML+118,ML+148,ML+166];doc.setFont("helvetica","bold");doc.setFontSize(8.5);doc.setTextColor(120,120,120);doc.text(h,xs[i],y);});
        y+=2;doc.setDrawColor(200,200,195);doc.setLineWidth(0.3);doc.line(ML,y,PW-MR,y);y+=5;
        selWOs.forEach((wo,i)=>{
          chkY(8);const pr=db.properties.find(p=>p.id===wo.propertyId);const ct=db.contractors.find(c=>c.id===wo.contractorId);
          if(i%2===0){doc.setFillColor(248,247,244);doc.rect(ML-2,y-3.5,CW+4,7,"F");}
          const row=[String(i+1),wo.number,wo.item.slice(0,22),(pr?.name||"").slice(0,24),(ct?.name||"").slice(0,18),wo.priority,wo.status];
          const xs=[ML,ML+10,ML+30,ML+82,ML+118,ML+148,ML+166];
          row.forEach((val,ci)=>{if(ci===5){const[r,g,b]=hexRgb(PHEX[wo.priority]||"#666");doc.setTextColor(r,g,b);doc.setFont("helvetica","bold");}else if(ci===6){const[r,g,b]=hexRgb(SHEX[wo.status]||"#666");doc.setTextColor(r,g,b);doc.setFont("helvetica","bold");}else{doc.setTextColor(40,40,40);doc.setFont("helvetica","normal");}doc.setFontSize(8);doc.text(val,xs[ci],y);});
          y+=7;
        });
        footer(`Page ${selWOs.length+2}`);

      } else {
        // Inspection report
        const insps=(db.inspections||[]).filter(i=>rptProp==="all"||i.propertyId===rptProp).slice().reverse();
        if(insps.length===0){doc.setFont("helvetica","normal");doc.setFontSize(12);doc.setTextColor(80,80,80);doc.text("No completed inspections found.",ML,110);}
        insps.forEach((insp,ii)=>{
          if(ii>0)addPage();y=100;
          const pr=db.properties.find(p=>p.id===insp.propertyId);
          doc.setFont("helvetica","bold");doc.setFontSize(14);doc.setTextColor(15,31,56);doc.text(pr?.name||"Unknown Property",ML,y);y+=8;
          doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(100,100,100);doc.text(`Inspection date: ${insp.date}`,ML,y);y+=12;
          db.checklistTemplate.forEach(sec=>{
            const si=sec.items.map(item=>({item,state:insp.items?.[`${sec.area}::${item}`]||{status:"none",photos:[]}})).filter(x=>x.state.status!=="none");
            if(!si.length)return;
            chkY(20);
            doc.setFillColor(15,31,56);doc.roundedRect(ML,y,CW,9,2,2,"F");doc.setFont("helvetica","bold");doc.setFontSize(9);doc.setTextColor(255,255,255);doc.text(sec.area,ML+4,y+6);y+=13;
            si.forEach(({item,state})=>{
              chkY(12);const isSat=state.status==="sat";const[r,g,b]=hexRgb(isSat?"#0F6E56":state.status==="flagged"?"#854F0B":"#993C1D");
              doc.setFillColor(isSat?225:250,isSat?245:236,isSat?238:231);doc.roundedRect(ML,y-3,CW,8,1.5,1.5,"F");
              doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(40,40,40);doc.text(item,ML+3,y+2);
              doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(r,g,b);
              doc.text(state.status==="sat"?"SATISFACTORY":state.status==="flagged"?"WORK ORDER":"UNSATISFACTORY",PW-MR,y+2,{align:"right"});y+=10;
              const ip=Array.isArray(state.photos)?state.photos:[];
              if(ip.length>0){const pw2=(CW-8)/3;ip.slice(0,3).forEach((src,pi)=>{chkY(36);const px=ML+pi*(pw2+4);try{doc.addImage(src,"JPEG",px,y,pw2,28);}catch{doc.setFillColor(230,235,245);doc.roundedRect(px,y,pw2,28,2,2,"F");}});y+=32;}
            });
            y+=4;
          });
          footer(`Page ${ii+2}`);
        });
      }
      doc.save(`PropInspect-${rptMode==="wo"?"WorkOrders":"Inspection"}-${today()}.pdf`);
    } catch(e){alert("PDF error: "+e.message);}
    setRptGen(false);
  };

  // ── Render: Home ──────────────────────────────────────────────────────────
  const renderHome = () => (
    <div style={S.body}>
      <div style={S.slabel}>Properties — tap to inspect</div>
      {db.properties.map((p,i)=>{
        const av=ava(p.name,i);
        const pending=db.workOrders.filter(w=>w.propertyId===p.id&&w.status==="pending").length;
        return(
          <div key={p.id} style={S.card}>
            <div style={S.crow} onClick={()=>startInsp(p)}>
              <div style={{...S.av(av.bg,av.tx,44),borderRadius:12,fontSize:22}}>{propIcon(p.type)}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:600,color:"#111"}}>{p.name}</div>
                <div style={{fontSize:12,color:"#888",marginTop:2}}>{p.inspectionFreq}{p.vacantUnits?` · ${p.vacantUnits} vacant`:""}</div>
              </div>
              {pending>0&&<Bdg bg="#FAECE7" tx="#993C1D">{pending} pending</Bdg>}
              <span style={{color:"#ccc",fontSize:20,marginLeft:4}}>›</span>
            </div>
          </div>
        );
      })}
      {db.workOrders.length>0&&<>
        <div style={{...S.slabel,marginTop:20}}>Recent Work Orders</div>
        {db.workOrders.slice(-3).reverse().map(wo=>{
          const sc=STA[wo.status]||STA.pending;
          const p=db.properties.find(x=>x.id===wo.propertyId);
          return(
            <div key={wo.id} style={{...S.card,marginBottom:8}}>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,fontWeight:700,color:"#111"}}>{wo.number}</span><Bdg bg={sc.bg} tx={sc.tx}>{wo.status}</Bdg></div>
                <div style={{fontSize:14,color:"#333",marginBottom:3}}>{wo.item}</div>
                <div style={{fontSize:12,color:"#888"}}>{p?.name} · {wo.priority}</div>
              </div>
            </div>
          );
        })}
      </>}
    </div>
  );

  // ── Render: Checklist ─────────────────────────────────────────────────────
  const renderChecklist = () => {
    const satBtn=(k,val,label,aBg,aTx,aBorder)=>{
      const cur=clState[k]?.status;const active=cur===val;
      return <button onClick={e=>{e.stopPropagation();setSat(k,val);}} style={{fontSize:12,padding:"5px 11px",borderRadius:20,fontFamily:"inherit",fontWeight:active?700:400,cursor:"pointer",border:active?`1.5px solid ${aBorder}`:"0.5px solid rgba(0,0,0,0.15)",background:active?aBg:"#fff",color:active?aTx:"#888"}}>{label}</button>;
    };
    return(
      <>
        <div style={{padding:"12px 16px 8px",background:"#fff",borderBottom:"0.5px solid rgba(0,0,0,0.06)"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#0F1F38",marginBottom:4}}>{prop?.name}</div>
          <div style={S.pwrap}><div style={S.pfill(pct)}/></div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#888",marginBottom:6}}><span>{done} of {total} rated</span><span style={{color:"#1D9E75",fontWeight:600}}>{pct}%</span></div>
          <div style={{display:"flex",gap:14,fontSize:11,color:"#666"}}>
            <span style={{display:"flex",alignItems:"center",gap:3}}><span style={{width:9,height:9,borderRadius:2,background:"#1D9E75",display:"inline-block"}}/> Sat</span>
            <span style={{display:"flex",alignItems:"center",gap:3}}><span style={{width:9,height:9,borderRadius:2,background:"#D85A30",display:"inline-block"}}/> Unsat</span>
            <span style={{display:"flex",alignItems:"center",gap:3}}><span style={{width:9,height:9,borderRadius:2,background:"#FAEEDA",border:"1px solid #FAC775",display:"inline-block"}}/> Work order</span>
          </div>
        </div>
        <div style={S.body}>
          {db.checklistTemplate.map(sec=>{
            const isOpen=openA[sec.area];
            const unsat=sec.items.filter(it=>clState[`${sec.area}::${it}`]?.status==="unsat").length;
            const flagged=sec.items.filter(it=>clState[`${sec.area}::${it}`]?.status==="flagged").length;
            const sat=sec.items.filter(it=>clState[`${sec.area}::${it}`]?.status==="sat").length;
            const rated=sat+unsat+flagged;
            return(
              <div key={sec.area} style={{background:"#fff",border:unsat>0||flagged>0?"1px solid #F0997B":"0.5px solid rgba(0,0,0,0.08)",borderRadius:14,marginBottom:8,overflow:"hidden"}}>
                <div style={{padding:"11px 14px",display:"flex",alignItems:"center",gap:8,cursor:"pointer",background:unsat>0||flagged>0?"#FFFAF8":"#fff"}} onClick={()=>setOpenA(p=>({...p,[sec.area]:!p[sec.area]}))}>
                  <span style={{fontSize:13,fontWeight:600,flex:1,color:"#111",lineHeight:1.3}}>{sec.area}</span>
                  <div style={{display:"flex",gap:4,flexShrink:0}}>
                    {flagged>0&&<Bdg bg="#FAEEDA" tx="#854F0B">{flagged} WO</Bdg>}
                    {unsat>0&&<Bdg bg="#FAECE7" tx="#993C1D">{unsat} ✕</Bdg>}
                    {rated>0&&unsat===0&&flagged===0&&<Bdg bg="#E1F5EE" tx="#0F6E56">{rated}/{sec.items.length}</Bdg>}
                  </div>
                  <span style={{color:"#aaa",fontSize:11,marginLeft:4}}>{isOpen?"▲":"▼"}</span>
                </div>
                {isOpen&&(
                  <div style={{borderTop:"0.5px solid rgba(0,0,0,0.06)"}}>
                    {sec.items.map((item,ii)=>{
                      const k=`${sec.area}::${item}`;
                      const st=clState[k]?.status||"none";
                      const itemPhotos=clState[k]?.photos||[];
                      const isFlagged=st==="flagged";
                      return(
                        <div key={item} style={{padding:"10px 14px",borderBottom:ii<sec.items.length-1?"0.5px solid rgba(0,0,0,0.05)":"none",background:isFlagged?"#FFFBF5":st==="unsat"?"#FFFAF8":"#fff"}}>
                          <div style={{fontSize:14,color:"#111",marginBottom:8,fontWeight:500,lineHeight:1.3}}>{item}</div>
                          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:8}}>
                            {satBtn(k,"sat","✓ Satisfactory","#E1F5EE","#0F6E56","#1D9E75")}
                            {satBtn(k,"unsat","✕ Unsatisfactory","#FAECE7","#993C1D","#D85A30")}
                            {!isFlagged&&<button onClick={()=>openIssue(sec.area,item)} style={{fontSize:12,padding:"5px 10px",borderRadius:20,border:"0.5px solid rgba(0,0,0,0.15)",background:"#F4F2EE",color:"#555",cursor:"pointer",fontFamily:"inherit",marginLeft:"auto"}}>+ Work order</button>}
                            {isFlagged&&<span style={{fontSize:12,color:"#854F0B",background:"#FAEEDA",padding:"4px 10px",borderRadius:20,marginLeft:"auto",fontWeight:600}}>WO sent</span>}
                          </div>
                          <PhotoPicker photos={itemPhotos} onChange={photos=>setItemPhotos(k,photos)} label={`Photos (${itemPhotos.length})`}/>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={S.bbar}><button style={S.pbtn("dk")} onClick={finishInspection}>Finish &amp; Save Inspection</button></div>
      </>
    );
  };

  // ── Render: Issue ─────────────────────────────────────────────────────────
  const renderIssue = () => (
    <>
      <div style={S.body}>
        <div style={{fontSize:12,color:"#888",marginBottom:4}}>{issItem?.area}</div>
        <div style={{fontSize:17,fontWeight:700,color:"#111",marginBottom:18}}>{issItem?.item}</div>
        <label style={S.lbl}>Describe the issue</label>
        <textarea style={S.ta} value={issDesc} onChange={e=>setIssDesc(e.target.value)} placeholder="What did you observe?"/>
        <PhotoPicker photos={issPhotos} onChange={setIssPhotos} label="Issue photos"/>
        <label style={S.lbl}>Priority</label>
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          {["Low","Medium","High","Urgent"].map(p=>{const pc=PRI[p];const sel=issPri===p;return <button key={p} style={{padding:"6px 14px",borderRadius:20,border:sel?`1.5px solid ${pc.bg}`:"0.5px solid rgba(0,0,0,0.12)",background:sel?pc.bg:"#fff",color:sel?pc.tx:"#666",fontWeight:sel?700:400,cursor:"pointer",fontSize:13,fontFamily:"inherit"}} onClick={()=>setIssPri(p)}>{p}</button>;})}
        </div>
        <label style={S.lbl}>Assign contractor</label>
        {db.contractors.length===0&&<div style={{fontSize:13,color:"#888",marginBottom:14}}>No contractors yet — add them in Contacts.</div>}
        {db.contractors.map((c,i)=>{const av=ava(c.name,i);const sel=issCont?.id===c.id;return(
          <div key={c.id} style={S.copt(sel)} onClick={()=>setIssCont(c)}>
            <div style={S.av(av.bg,av.tx)}>{av.initials}</div>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:"#111"}}>{c.name}</div><div style={{fontSize:12,color:"#888"}}>{c.trade}{c.avgResponse?` · ${c.avgResponse}`:""}</div></div>
            {sel&&<span style={{color:"#1D9E75",fontSize:18,fontWeight:700}}>✓</span>}
          </div>
        );})}
        <div style={S.div}/>
        <div style={{fontSize:13,color:"#888"}}>Copy sent to <strong style={{color:"#111"}}>{db.managerEmail}</strong></div>
      </div>
      <div style={S.bbar}><button style={S.pbtn("gn")} onClick={()=>setScr("preview")}>Preview Work Order →</button></div>
    </>
  );

  // ── Render: Preview ───────────────────────────────────────────────────────
  const renderPreview = () => (
    <>
      <div style={S.body}>
        <div style={{fontSize:13,color:"#888",marginBottom:12}}>What {issCont?.name||"contractor"} will receive:</div>
        <div style={{background:"#F0EEE8",borderRadius:14,padding:14,marginBottom:14}}>
          <div style={{background:"#fff",borderRadius:10,border:"0.5px solid rgba(0,0,0,0.1)",padding:"13px 15px",fontSize:13,color:"#333",lineHeight:1.7}}>
            <div style={{fontSize:12,color:"#888",marginBottom:8}}>
              <div><strong>To:</strong> {issCont?.email||"(no email set)"}</div>
              <div><strong>CC:</strong> {db.managerEmail}</div>
              <div><strong>Subject:</strong> Work Order #{db.nextWONumber} — {prop?.name}</div>
            </div>
            <div style={S.div}/>
            <div style={{fontSize:14,color:"#111",lineHeight:1.8}}>
              <strong>Work Order #{db.nextWONumber}</strong><br/>
              <strong>Property:</strong> {prop?.name}<br/>
              <strong>Area:</strong> {issItem?.area}<br/>
              <strong>Item:</strong> {issItem?.item}<br/>
              <strong>Priority:</strong> <span style={{color:PRI[issPri]?.tx,fontWeight:700}}>{issPri}</span><br/>
              <strong>Description:</strong> {issDesc||"(none)"}<br/>
              {issPhotos.length>0&&<><strong>Photos:</strong> {issPhotos.length} attached<br/></>}
            </div>
            <div style={{marginTop:14,padding:"10px",background:"#F4F2EE",borderRadius:8,fontSize:13,color:"#555"}}>
              When complete, reply using a button below and attach a completion photo if available.
            </div>
            <div style={{display:"flex",gap:6,marginTop:12}}>
              <div style={{flex:1,padding:"10px 0",background:"#1D9E75",color:"#fff",borderRadius:8,textAlign:"center",fontSize:12,fontWeight:700}}>✓ Accept</div>
              <div style={{flex:1,padding:"10px 0",background:"#0F1F38",color:"#fff",borderRadius:8,textAlign:"center",fontSize:12,fontWeight:700}}>✔✔ Completed</div>
              <div style={{flex:1,padding:"10px 0",background:"#fff",color:"#993C1D",border:"1px solid #D85A30",borderRadius:8,textAlign:"center",fontSize:12,fontWeight:700}}>✗ Decline</div>
            </div>
          </div>
        </div>
        <div style={{fontSize:13,color:"#888",background:"#F4F2EE",padding:"10px 12px",borderRadius:10}}>Copy goes to <strong style={{color:"#111"}}>{db.managerEmail}</strong></div>
      </div>
      <div style={S.bbar}>
        <div style={{display:"flex",gap:8}}>
          <button style={{...S.pbtn("gh"),flex:1}} onClick={()=>setScr("issue")}>Edit</button>
          <button style={{...S.pbtn("gn"),flex:2}} onClick={createWO}>Send Work Order</button>
        </div>
      </div>
    </>
  );

  // ── Render: Sent ──────────────────────────────────────────────────────────
  const renderSent = () => (
    <>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",textAlign:"center"}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:"#E1F5EE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,marginBottom:20}}>✓</div>
        <div style={{fontSize:20,fontWeight:700,color:"#111",marginBottom:8}}>Work order dispatched</div>
        <div style={{fontSize:14,color:"#666",lineHeight:1.6}}>{newWO?.wo.number} sent. Contractor can accept, mark complete, or decline from email.</div>
        <div style={S.ncard}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"5px 0",fontSize:13}}><div style={{width:8,height:8,borderRadius:"50%",background:"#1D9E75",flexShrink:0}}/><span style={{color:"#111"}}>{newWO?.contractor?.name||"Contractor"} — email sent</span></div>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"5px 0",fontSize:13}}><div style={{width:8,height:8,borderRadius:"50%",background:"#378ADD",flexShrink:0}}/><span style={{color:"#111"}}>{db.managerEmail} — copy sent</span></div>
        </div>
        <div style={{marginTop:16,fontSize:13,color:"#888"}}>{newWO?.wo.number} · {issItem?.item} · {issPri}<br/>{prop?.name}</div>
      </div>
      <div style={S.bbar}>
        <div style={{display:"flex",gap:8}}>
          <button style={{...S.pbtn("gh"),flex:1}} onClick={()=>setScr("checklist")}>Back to checklist</button>
          <button style={{...S.pbtn("dk"),flex:1}} onClick={()=>setScr("home")}>Done</button>
        </div>
      </div>
    </>
  );

  // ── Render: Work Orders ───────────────────────────────────────────────────
  const renderWorkOrders = () => (
    <>
      <div style={{padding:"12px 16px 0",background:"#fff",borderBottom:"0.5px solid rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",gap:6,paddingBottom:12,overflowX:"auto"}}>
          {["all","pending","accepted","complete"].map(f=>(
            <button key={f} style={{padding:"6px 14px",borderRadius:20,border:"0.5px solid rgba(0,0,0,0.15)",background:woFilter===f?"#0F1F38":"#fff",color:woFilter===f?"#fff":"#666",fontWeight:woFilter===f?600:400,cursor:"pointer",fontSize:13,whiteSpace:"nowrap",fontFamily:"inherit"}} onClick={()=>setWoFilter(f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
          ))}
        </div>
      </div>
      <div style={S.body}>
        {fWOs.length===0&&<div style={{textAlign:"center",color:"#aaa",marginTop:40,fontSize:14}}>No work orders found.</div>}
        {fWOs.map(wo=>{
          const sc=STA[wo.status]||STA.pending;
          const p=db.properties.find(x=>x.id===wo.propertyId);
          const c=db.contractors.find(x=>x.id===wo.contractorId);
          const pc=PRI[wo.priority]||PRI.Medium;
          const exp=expandedWO===wo.id;
          const issArr=Array.isArray(wo.photos)?wo.photos:[];
          const cmpArr=Array.isArray(wo.completionPhotos)?wo.completionPhotos:[];
          return(
            <div key={wo.id} style={{...S.card,marginBottom:10}}>
              <div style={{padding:"13px 16px",cursor:"pointer"}} onClick={()=>setExpandedWO(exp?null:wo.id)}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:14,fontWeight:700,color:"#111"}}>{wo.number}</span>
                  <Bdg bg={sc.bg} tx={sc.tx}>{wo.status}</Bdg>
                </div>
                <div style={{fontSize:15,color:"#111",marginBottom:3,fontWeight:500}}>{wo.item}</div>
                <div style={{fontSize:13,color:"#555",marginBottom:6,lineHeight:1.4}}>{wo.description}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <Bdg bg={pc.bg} tx={pc.tx}>{wo.priority}</Bdg>
                  <Bdg bg="#F4F2EE" tx="#666">{p?.name}</Bdg>
                  {c&&<Bdg bg="#EEEDFE" tx="#3C3489">{c.name}</Bdg>}
                </div>
                {(issArr.length>0||cmpArr.length>0)&&<div style={{fontSize:11,color:"#aaa",marginTop:6}}>
                  {issArr.length>0&&`${issArr.length} issue photo${issArr.length!==1?"s":""}`}
                  {issArr.length>0&&cmpArr.length>0&&" · "}
                  {cmpArr.length>0&&<span style={{color:"#0F6E56"}}>{cmpArr.length} completion photo{cmpArr.length!==1?"s":""}</span>}
                </div>}
              </div>
              {exp&&(
                <div style={{borderTop:"0.5px solid rgba(0,0,0,0.06)",padding:"12px 16px"}}>
                  {issArr.length>0&&<div style={{marginBottom:12}}>
                    <div style={{fontSize:12,fontWeight:600,color:"#666",marginBottom:6}}>ISSUE PHOTOS</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{issArr.map((src,i)=><div key={i} style={S.pthumb}><img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>)}</div>
                  </div>}
                  {cmpArr.length>0&&<div style={{marginBottom:12}}>
                    <div style={{fontSize:12,fontWeight:600,color:"#0F6E56",marginBottom:6}}>COMPLETION PHOTOS</div>
                    {wo.completionNote&&<div style={{fontSize:13,color:"#555",marginBottom:6}}>{wo.completionNote}</div>}
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{cmpArr.map((src,i)=><div key={i} style={{...S.pthumb,border:"2px solid #1D9E75"}}><img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>)}</div>
                  </div>}
                  {wo.status!=="complete"&&<div style={{marginBottom:12}}>
                    <PhotoPicker photos={compPhotos} onChange={setCompPhotos} label="Attach completion photos"/>
                    <input style={{...S.inp,marginBottom:8}} placeholder="Completion note (optional)" value={compNote} onChange={e=>setCompNote(e.target.value)}/>
                  </div>}
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {wo.status==="pending"&&<button style={{...S.pbtn("gh"),flex:1,padding:"9px 0",fontSize:13}} onClick={()=>updateWO(wo.id,{status:"accepted",acceptedAt:today()})}>Accept</button>}
                    {(wo.status==="pending"||wo.status==="accepted")&&<button style={{...S.pbtn("gn"),flex:1,padding:"9px 0",fontSize:13}} onClick={()=>{updateWO(wo.id,{status:"complete",completedAt:today(),completionPhotos:[...cmpArr,...compPhotos],completionNote:compNote||wo.completionNote});setCompPhotos([]);setCompNote("");setExpandedWO(null);}}>Completed</button>}
                    <button style={{padding:"9px 0",fontSize:13,flex:1,borderRadius:10,border:"0.5px solid #F09595",background:"#FCEBEB",color:"#A32D2D",cursor:"pointer",fontFamily:"inherit",fontWeight:600}} onClick={()=>{deleteWO(wo.id);setExpandedWO(null);}}>Delete</button>
                  </div>
                  <div style={{fontSize:11,color:"#aaa",marginTop:8}}>Created {wo.createdAt}{wo.acceptedAt?` · Accepted ${wo.acceptedAt}`:""}{wo.completedAt?` · Completed ${wo.completedAt}`:""}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  // ── Render: Properties ────────────────────────────────────────────────────
  const renderProperties = () => (
    <div style={S.body}>
      <div style={S.slabel}>Your properties</div>
      {db.properties.map((p,i)=>{
        const av=ava(p.name,i);const wos=db.workOrders.filter(w=>w.propertyId===p.id).length;const isEd=editingP?.id===p.id;
        return(
          <div key={p.id} style={S.card}>
            {isEd?(
              <div style={{padding:16}}>
                <div style={{fontSize:14,fontWeight:700,color:"#111",marginBottom:14}}>Edit property</div>
                {[["Property name","name","text"],["Address","address","text"],["Vacant Units/Suites","vacantUnits","text"],["Type (e.g. Retail)","type","text"]].map(([ph,f,t])=>(
                  <input key={f} type={t} style={S.inp} placeholder={ph} value={editingP[f]||""} onChange={e=>setEditingP(prev=>({...prev,[f]:e.target.value}))}/>
                ))}
                <label style={S.lbl}>Inspection frequency</label>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
                  {FREQS.map(f=><button key={f} style={{padding:"6px 12px",borderRadius:20,border:editingP.inspectionFreq===f?"1.5px solid #1D9E75":"0.5px solid rgba(0,0,0,0.15)",background:editingP.inspectionFreq===f?"#E1F5EE":"#fff",color:editingP.inspectionFreq===f?"#0F6E56":"#666",fontWeight:editingP.inspectionFreq===f?700:400,cursor:"pointer",fontSize:13,fontFamily:"inherit"}} onClick={()=>setEditingP(prev=>({...prev,inspectionFreq:f}))}>{f}</button>)}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button style={{...S.pbtn("gh"),flex:1}} onClick={()=>setEditingP(null)}>Cancel</button>
                  <button style={{...S.pbtn("gn"),flex:1}} onClick={saveProperty}>Save changes</button>
                </div>
              </div>
            ):(
              <>
                <div style={{padding:"13px 16px",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{...S.av(av.bg,av.tx,44),borderRadius:12,fontSize:22}}>{propIcon(p.type)}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:600,color:"#111"}}>{p.name}</div>
                    <div style={{fontSize:12,color:"#888",marginTop:2}}>{p.address||"No address"} · {p.inspectionFreq}</div>
                  </div>
                  <Bdg bg="#E1F5EE" tx="#0F6E56">{wos} WOs</Bdg>
                </div>
                <div style={{borderTop:"0.5px solid rgba(0,0,0,0.06)",padding:"8px 16px 12px"}}>
                  {[["Vacant Units/Suites",p.vacantUnits||"—"],["Type",p.type||"—"],["Inspection freq.",p.inspectionFreq]].map(([k,v])=>(
                    <div key={k} style={S.irow}><span style={{color:"#888",fontSize:13}}>{k}</span><span style={{color:"#111",fontWeight:500,fontSize:13}}>{v}</span></div>
                  ))}
                  <div style={{display:"flex",gap:8,marginTop:10}}>
                    <button style={{...S.pbtn("gh"),padding:"8px 0",fontSize:13,flex:1}} onClick={()=>setEditingP({...p})}>Edit</button>
                    <button style={{padding:"8px 0",fontSize:13,flex:1,borderRadius:10,border:"0.5px solid #F09595",background:"#FCEBEB",color:"#A32D2D",cursor:"pointer",fontFamily:"inherit",fontWeight:600}} onClick={()=>deleteProperty(p.id)}>Delete</button>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
      {!showAddP?<button style={{...S.pbtn("gh"),marginTop:4}} onClick={()=>setShowAddP(true)}>+ Add property</button>:(
        <div style={S.card}><div style={{padding:16}}>
          <div style={{fontSize:15,fontWeight:700,color:"#111",marginBottom:14}}>New property</div>
          {[["Property name *","name","text"],["Address","address","text"],["Vacant Units/Suites","vacantUnits","text"],["Type (e.g. Retail)","type","text"]].map(([ph,f,t])=>(
            <input key={f} type={t} style={S.inp} placeholder={ph} value={newP[f]} onChange={e=>setNewP(p=>({...p,[f]:e.target.value}))}/>
          ))}
          <label style={S.lbl}>Inspection frequency</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
            {FREQS.map(f=><button key={f} style={{padding:"6px 12px",borderRadius:20,border:newP.inspectionFreq===f?"1.5px solid #1D9E75":"0.5px solid rgba(0,0,0,0.15)",background:newP.inspectionFreq===f?"#E1F5EE":"#fff",color:newP.inspectionFreq===f?"#0F6E56":"#666",fontWeight:newP.inspectionFreq===f?700:400,cursor:"pointer",fontSize:13,fontFamily:"inherit"}} onClick={()=>setNewP(p=>({...p,inspectionFreq:f}))}>{f}</button>)}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button style={{...S.pbtn("gh"),flex:1}} onClick={()=>setShowAddP(false)}>Cancel</button>
            <button style={{...S.pbtn("dk"),flex:1}} onClick={addProperty}>Add property</button>
          </div>
        </div></div>
      )}
    </div>
  );

  // ── Render: Contractors ───────────────────────────────────────────────────
  const renderContractors = () => (
    <div style={S.body}>
      <div style={S.slabel}>Saved contractors</div>
      {db.contractors.map((c,i)=>{
        const av=ava(c.name,i);const cnt=db.workOrders.filter(w=>w.contractorId===c.id).length;const isEd=editingC?.id===c.id;
        return(
          <div key={c.id} style={S.card}>
            {isEd?(
              <div style={{padding:16}}>
                <div style={{fontSize:14,fontWeight:700,color:"#111",marginBottom:14}}>Edit contractor</div>
                {[["Name","name","text"],["Trade","trade","text"],["Email","email","email"],["Phone","phone","tel"],["License #","license","text"],["Avg. response","avgResponse","text"]].map(([ph,f,t])=>(
                  <input key={f} type={t} style={S.inp} placeholder={ph} value={editingC[f]||""} onChange={e=>setEditingC(prev=>({...prev,[f]:e.target.value}))}/>
                ))}
                <div style={{display:"flex",gap:8}}>
                  <button style={{...S.pbtn("gh"),flex:1}} onClick={()=>setEditingC(null)}>Cancel</button>
                  <button style={{...S.pbtn("gn"),flex:1}} onClick={saveContractor}>Save changes</button>
                </div>
              </div>
            ):(
              <>
                <div style={{padding:"13px 16px",display:"flex",alignItems:"center",gap:12}}>
                  <div style={S.av(av.bg,av.tx,44)}>{av.initials}</div>
                  <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600,color:"#111"}}>{c.name}</div><div style={{fontSize:12,color:"#888",marginTop:2}}>{c.trade}{c.email?` · ${c.email}`:""}</div></div>
                  <Bdg bg="#E1F5EE" tx="#0F6E56">{cnt} WOs</Bdg>
                </div>
                <div style={{borderTop:"0.5px solid rgba(0,0,0,0.06)",padding:"8px 16px 12px"}}>
                  {[["Phone",c.phone||"—"],["Response",c.avgResponse||"—"],["License",c.license||"N/A"]].map(([k,v])=>(
                    <div key={k} style={S.irow}><span style={{color:"#888",fontSize:13}}>{k}</span><span style={{color:"#111",fontWeight:500,fontSize:13}}>{v}</span></div>
                  ))}
                  <div style={{display:"flex",gap:8,marginTop:10}}>
                    <button style={{...S.pbtn("gh"),padding:"8px 0",fontSize:13,flex:1}} onClick={()=>setEditingC({...c})}>Edit</button>
                    <button style={{padding:"8px 0",fontSize:13,flex:1,borderRadius:10,border:"0.5px solid #F09595",background:"#FCEBEB",color:"#A32D2D",cursor:"pointer",fontFamily:"inherit",fontWeight:600}} onClick={()=>deleteContractor(c.id)}>Delete</button>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
      {!showAddC?<button style={{...S.pbtn("gh"),marginTop:4}} onClick={()=>setShowAddC(true)}>+ Add contractor</button>:(
        <div style={S.card}><div style={{padding:16}}>
          <div style={{fontSize:15,fontWeight:700,color:"#111",marginBottom:14}}>New contractor</div>
          {[["Name *","name","text"],["Trade","trade","text"],["Email","email","email"],["Phone","phone","tel"],["License #","license","text"],["Avg. response","avgResponse","text"]].map(([ph,f,t])=>(
            <input key={f} type={t} style={S.inp} placeholder={ph} value={newC[f]} onChange={e=>setNewC(p=>({...p,[f]:e.target.value}))}/>
          ))}
          <div style={{display:"flex",gap:8}}>
            <button style={{...S.pbtn("gh"),flex:1}} onClick={()=>setShowAddC(false)}>Cancel</button>
            <button style={{...S.pbtn("dk"),flex:1}} onClick={addC}>Save</button>
          </div>
        </div></div>
      )}
      <div style={{...S.slabel,marginTop:20}}>Settings</div>
      <div style={S.card}><div style={{padding:16}}>
        <div style={{fontSize:14,fontWeight:600,color:"#111",marginBottom:6}}>Manager CC email</div>
        {editMgr?(<>
          <input type="email" style={S.inp} value={mgrEmail} onChange={e=>setMgrEmail(e.target.value)}/>
          <div style={{display:"flex",gap:8}}>
            <button style={{...S.pbtn("gh"),flex:1}} onClick={()=>setEditMgr(false)}>Cancel</button>
            <button style={{...S.pbtn("gn"),flex:1}} onClick={()=>{persist({...db,managerEmail:mgrEmail});setEditMgr(false);}}>Save</button>
          </div>
        </>):(
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:14,color:"#555"}}>{db.managerEmail}</span>
            <button style={{fontSize:13,padding:"5px 12px",borderRadius:20,border:"0.5px solid rgba(0,0,0,0.15)",background:"#fff",cursor:"pointer",fontFamily:"inherit"}} onClick={()=>setEditMgr(true)}>Edit</button>
          </div>
        )}
      </div></div>
    </div>
  );

  // ── Render: Template editor ───────────────────────────────────────────────
  const renderTemplate = () => (
    <div style={S.body}>
      <div style={{fontSize:13,color:"#888",marginBottom:14,lineHeight:1.6}}>Edit your inspection checklist. Changes apply to all future inspections.</div>
      {db.checklistTemplate.map((sec,ai)=>(
        <div key={ai} style={{...S.card,marginBottom:10}}>
          <div style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:8,borderBottom:"0.5px solid rgba(0,0,0,0.06)"}}>
            {editA?.ai===ai&&editA?.ii==null?(
              <div style={{display:"flex",gap:6,flex:1}}>
                <input style={{...S.inp,marginBottom:0,flex:1,padding:"7px 10px",fontSize:14}} value={editTxt} onChange={e=>setEditTxt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveAreaName(ai)} autoFocus/>
                <button style={{padding:"7px 12px",borderRadius:8,background:"#0F1F38",color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit"}} onClick={()=>saveAreaName(ai)}>Save</button>
                <button style={{padding:"7px 10px",borderRadius:8,background:"#fff",color:"#666",border:"0.5px solid rgba(0,0,0,0.15)",cursor:"pointer",fontSize:13,fontFamily:"inherit"}} onClick={()=>setEditA(null)}>✕</button>
              </div>
            ):(
              <>
                <span style={{fontSize:14,fontWeight:700,color:"#111",flex:1,lineHeight:1.3}}>{sec.area}</span>
                <button style={{fontSize:11,padding:"3px 9px",borderRadius:20,border:"0.5px solid rgba(0,0,0,0.12)",background:"#F4F2EE",color:"#555",cursor:"pointer",fontFamily:"inherit"}} onClick={()=>{setEditA({ai});setEditTxt(sec.area);}}>Rename</button>
                <button style={{fontSize:11,padding:"3px 9px",borderRadius:20,border:"0.5px solid #F09595",background:"#FCEBEB",color:"#A32D2D",cursor:"pointer",fontFamily:"inherit"}} onClick={()=>delArea(ai)}>Delete</button>
              </>
            )}
          </div>
          <div style={{padding:"4px 14px 8px"}}>
            {sec.items.map((item,ii)=>(
              <div key={ii} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"0.5px solid rgba(0,0,0,0.04)"}}>
                {editA?.ai===ai&&editA?.ii===ii?(
                  <div style={{display:"flex",gap:6,flex:1}}>
                    <input style={{...S.inp,marginBottom:0,flex:1,padding:"6px 10px",fontSize:13}} value={editTxt} onChange={e=>setEditTxt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveItemName(ai,ii)} autoFocus/>
                    <button style={{padding:"6px 10px",borderRadius:8,background:"#0F1F38",color:"#fff",border:"none",cursor:"pointer",fontSize:12,fontFamily:"inherit"}} onClick={()=>saveItemName(ai,ii)}>Save</button>
                    <button style={{padding:"6px 8px",borderRadius:8,background:"#fff",color:"#666",border:"0.5px solid rgba(0,0,0,0.15)",cursor:"pointer",fontSize:12,fontFamily:"inherit"}} onClick={()=>setEditA(null)}>✕</button>
                  </div>
                ):(
                  <>
                    <span style={{fontSize:13,color:"#333",flex:1,lineHeight:1.3}}>{item}</span>
                    <button style={{fontSize:11,padding:"3px 8px",borderRadius:20,border:"0.5px solid rgba(0,0,0,0.12)",background:"#F4F2EE",color:"#666",cursor:"pointer",fontFamily:"inherit"}} onClick={()=>{setEditA({ai,ii});setEditTxt(item);}}>Edit</button>
                    <button style={{fontSize:11,padding:"3px 8px",borderRadius:20,border:"0.5px solid #F09595",background:"#FCEBEB",color:"#A32D2D",cursor:"pointer",fontFamily:"inherit"}} onClick={()=>delItem(ai,ii)}>✕</button>
                  </>
                )}
              </div>
            ))}
            {addItemTo===ai?(
              <div style={{display:"flex",gap:6,marginTop:8}}>
                <input style={{...S.inp,marginBottom:0,flex:1,padding:"7px 10px",fontSize:13}} placeholder="New item..." value={newItemTxt} onChange={e=>setNewItemTxt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addItem(ai)} autoFocus/>
                <button style={{padding:"7px 12px",borderRadius:8,background:"#1D9E75",color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit"}} onClick={()=>addItem(ai)}>Add</button>
                <button style={{padding:"7px 10px",borderRadius:8,background:"#fff",color:"#666",border:"0.5px solid rgba(0,0,0,0.15)",cursor:"pointer",fontSize:13,fontFamily:"inherit"}} onClick={()=>setAddItemTo(null)}>✕</button>
              </div>
            ):(
              <button style={{marginTop:8,fontSize:13,color:"#1D9E75",background:"none",border:"none",cursor:"pointer",fontWeight:600,padding:"4px 0",fontFamily:"inherit"}} onClick={()=>{setAddItemTo(ai);setNewItemTxt("");}}>+ Add item</button>
            )}
          </div>
        </div>
      ))}
      {addingArea?(
        <div style={S.card}><div style={{padding:14}}>
          <div style={{fontSize:14,fontWeight:600,color:"#111",marginBottom:10}}>New area</div>
          <input style={S.inp} placeholder="e.g. Tenant Spaces" value={newAreaTxt} onChange={e=>setNewAreaTxt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addArea()} autoFocus/>
          <div style={{display:"flex",gap:8}}>
            <button style={{...S.pbtn("gh"),flex:1}} onClick={()=>setAddingArea(false)}>Cancel</button>
            <button style={{...S.pbtn("dk"),flex:1}} onClick={addArea}>Add Area</button>
          </div>
        </div></div>
      ):(
        <button style={{...S.pbtn("gh"),marginTop:4}} onClick={()=>setAddingArea(true)}>+ Add new area</button>
      )}
    </div>
  );

  // ── Render: Report ────────────────────────────────────────────────────────
  const renderReport = () => (
    <>
      <div style={{padding:"14px 16px 0",background:"#fff",borderBottom:"0.5px solid rgba(0,0,0,0.06)"}}>
        <div style={{fontSize:16,fontWeight:700,color:"#0F1F38",marginBottom:10}}>Export Report</div>
        <input style={{...S.inp,marginBottom:12}} placeholder="Report title..." value={rptTitle} onChange={e=>setRptTitle(e.target.value)}/>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          {[["wo","Work Orders"],["inspection","Inspection Results"]].map(([v,l])=>(
            <button key={v} style={{flex:1,padding:"8px 0",borderRadius:10,border:rptMode===v?"1.5px solid #0F1F38":"0.5px solid rgba(0,0,0,0.15)",background:rptMode===v?"#0F1F38":"#fff",color:rptMode===v?"#fff":"#666",fontWeight:rptMode===v?600:400,cursor:"pointer",fontSize:13,fontFamily:"inherit"}} onClick={()=>setRptMode(v)}>{l}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
          <select style={{...S.inp,marginBottom:0,flex:1,padding:"7px 10px",fontSize:13}} value={rptProp} onChange={e=>setRptProp(e.target.value)}>
            <option value="all">All properties</option>
            {db.properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {rptMode==="wo"&&<select style={{...S.inp,marginBottom:0,flex:1,padding:"7px 10px",fontSize:13}} value={rptSta} onChange={e=>setRptSta(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="complete">Complete</option>
          </select>}
        </div>
        {rptMode==="wo"&&<div style={{display:"flex",gap:8,marginBottom:12}}>
          <button style={{fontSize:12,padding:"5px 12px",borderRadius:20,border:"0.5px solid rgba(0,0,0,0.15)",background:"#0F1F38",color:"#fff",cursor:"pointer",fontWeight:600,fontFamily:"inherit"}} onClick={selAll}>Select all</button>
          <button style={{fontSize:12,padding:"5px 12px",borderRadius:20,border:"0.5px solid rgba(0,0,0,0.15)",background:"#fff",color:"#555",cursor:"pointer",fontFamily:"inherit"}} onClick={()=>setRptSel({})}>Clear</button>
          <span style={{marginLeft:"auto",fontSize:13,color:"#888",alignSelf:"center"}}>{selWOs.length} selected</span>
        </div>}
      </div>
      <div style={{...S.body,paddingBottom:80}}>
        {rptMode==="inspection"?(
          (db.inspections||[]).length===0?(
            <div style={{textAlign:"center",color:"#aaa",marginTop:40,fontSize:14}}>No completed inspections yet.<br/>Finish an inspection to generate this report.</div>
          ):(
            (db.inspections||[]).filter(i=>rptProp==="all"||i.propertyId===rptProp).slice().reverse().map((insp,idx)=>{
              const pr=db.properties.find(p=>p.id===insp.propertyId);
              const all=Object.entries(insp.items||{});
              const satC=all.filter(([,v])=>v.status==="sat").length;
              const unsatC=all.filter(([,v])=>v.status==="unsat").length;
              const flagC=all.filter(([,v])=>v.status==="flagged").length;
              return(
                <div key={idx} style={S.card}>
                  <div style={{padding:"13px 16px"}}>
                    <div style={{fontSize:15,fontWeight:600,color:"#111",marginBottom:3}}>{pr?.name||"Unknown"}</div>
                    <div style={{fontSize:12,color:"#888",marginBottom:10}}>Completed {insp.date}</div>
                    <div style={{display:"flex",gap:8,flex
