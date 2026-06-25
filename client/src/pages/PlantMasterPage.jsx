import React, { useState, useEffect, useCallback } from "react";
import { message, Modal, Table } from "antd";
import {
  Factory, Search, Plus, Pencil, Trash2, Eye,
  Activity, Building2, Gauge, Timer, Layers3, Package,
  CheckCircle2, XCircle, TrendingUp, Settings2, Zap,
  BarChart3, MapPin, User, RefreshCw, X, Save, ArrowUpRight,
} from "lucide-react";
import {
  getPlants, createPlant, updatePlant, deletePlant,
} from "../services/plantService";

/* ═══════════════════════════════════════════════════════════
   DESIGN SYSTEM — Industrial Enterprise (Tesla × Siemens × SAP)
═══════════════════════════════════════════════════════════ */
const DS = {
  red:"#E53935", redDark:"#B71C1C", redGlow:"rgba(229,57,53,0.15)", redFaint:"rgba(229,57,53,0.06)",
  black:"#111111", blackSoft:"#1A1A1A", blackCard:"#161616", blackBorder:"#242424",
  white:"#FFFFFF", gray50:"#F8F9FA", gray100:"#F1F3F5", gray200:"#E9ECEF",
  gray400:"#ADB5BD", gray500:"#6C757D", gray600:"#495057", gray700:"#343A40",
  success:"#00C853", successBg:"rgba(0,200,83,0.08)",
  warning:"#FF9800", warningBg:"rgba(255,152,0,0.08)",
  info:"#2196F3", infoBg:"rgba(33,150,243,0.08)",
  radius:"12px", radiusSm:"8px", radiusXs:"6px",
  shadowCard:"0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)",
  shadowHover:"0 2px 8px rgba(0,0,0,0.12), 0 16px 40px rgba(0,0,0,0.1)",
  font:"'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
};

/* ── Micro-components ─────────────────────────── */
const SectionLabel = ({ icon, label }) => (
  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12 }}>
    <div style={{ width:24, height:24, borderRadius:DS.radiusXs, background:DS.redFaint, border:`1px solid ${DS.redGlow}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
      {React.cloneElement(icon, { size:12, color:DS.red })}
    </div>
    <span style={{ fontSize:10, fontWeight:700, color:DS.gray500, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:DS.font }}>{label}</span>
    <div style={{ flex:1, height:1, background:DS.gray200 }} />
  </div>
);

const StatusPill = ({ status }) => {
  const ok = status === "Active";
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:100, background:ok?DS.successBg:"rgba(229,57,53,0.08)", border:`1px solid ${ok?"rgba(0,200,83,0.3)":"rgba(229,57,53,0.3)"}` }}>
      <div style={{ width:5, height:5, borderRadius:"50%", background:ok?DS.success:DS.red }} />
      <span style={{ fontSize:11, fontWeight:600, color:ok?DS.success:DS.red, fontFamily:DS.font }}>{status}</span>
    </div>
  );
};

const KpiCard = ({ icon, label, value, color, bgColor, delta }) => (
  <div style={{ background:DS.white, borderRadius:DS.radius, border:`1px solid ${DS.gray200}`, padding:"16px 18px", boxShadow:DS.shadowCard, position:"relative", overflow:"hidden" }}>
    <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:color, borderRadius:`${DS.radius} ${DS.radius} 0 0` }} />
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
      <div>
        <div style={{ fontSize:10, fontWeight:600, color:DS.gray400, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:DS.font }}>{label}</div>
        <div style={{ fontSize:26, fontWeight:800, color:DS.black, marginTop:4, fontFamily:DS.font, lineHeight:1 }}>{value}</div>
      </div>
      <div style={{ width:38, height:38, borderRadius:10, background:bgColor, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {React.cloneElement(icon, { size:18, color })}
      </div>
    </div>
    {delta && (
      <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:4 }}>
        <ArrowUpRight size={11} color={DS.success} />
        <span style={{ fontSize:10, color:DS.gray500, fontFamily:DS.font }}>{delta}</span>
      </div>
    )}
  </div>
);

const FField = ({ label, required, children }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
    <label style={{ fontSize:11, fontWeight:600, color:DS.gray600, fontFamily:DS.font }}>
      {label}{required && <span style={{ color:DS.red, fontSize:10 }}> *</span>}
    </label>
    {children}
  </div>
);

function SInput({ name, value, onChange, type="text", placeholder="" }) {
  const [focus, setFocus] = useState(false);
  return (
    <input name={name} value={value??""} onChange={onChange} type={type} placeholder={placeholder}
      onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
      style={{ width:"100%", padding:"8px 12px", fontSize:12, fontFamily:DS.font, fontWeight:500, color:DS.black, background:focus?DS.white:DS.gray50, border:`1.5px solid ${focus?DS.red:DS.gray200}`, borderRadius:DS.radiusSm, outline:"none", transition:"all 0.18s", boxShadow:focus?`0 0 0 3px ${DS.redGlow}`:"none", boxSizing:"border-box" }}
    />
  );
}

function SSelect({ value, onChange, children }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{ width:"100%", padding:"8px 12px", fontSize:12, fontFamily:DS.font, fontWeight:500, color:DS.black, background:DS.gray50, border:`1.5px solid ${DS.gray200}`, borderRadius:DS.radiusSm, outline:"none", cursor:"pointer", appearance:"none", WebkitAppearance:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236C757D' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center", paddingRight:30, boxSizing:"border-box" }}
    >{children}</select>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function PlantMasterPage() {
  const [plants, setPlants]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const [searchTerm, setSearchTerm]   = useState("");
  const [statusFilter, setStatus]     = useState("All");
  const [formOpen, setFormOpen]       = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedPlant, setSelected]  = useState(null);
  const [editingId, setEditingId]     = useState(null);
  const [hoveredRow, setHoveredRow]   = useState(null);
  const [formSaving, setFormSaving]   = useState(false);

  const defaultForm = {
    plantName:"", plantCode:"", location:"", plantAdmin:"",
    conveyorLength:"", conveyorSpeed:"", pitchDistance:"",
    availableTime:630, demandPerShift:"", hangerEfficiency:100, status:"Active",
  };
  const [form, setForm] = useState(defaultForm);

  /* Live Calculations */
  const cLen  = Number(form.conveyorLength)  || 0;
  const cSpd  = Number(form.conveyorSpeed)   || 0;
  const pitch = Number(form.pitchDistance)   || 0;
  const avail = Number(form.availableTime)   || 0;
  const eff   = Number(form.hangerEfficiency)|| 100;
  const totalHangers            = pitch>0 ? Math.round(cLen/pitch) : 0;
  const processTime             = cSpd>0  ? +(cLen/cSpd).toFixed(2) : 0;
  const totalRoundsShift        = processTime>0 ? +(avail/processTime).toFixed(2) : 0;
  const hangerPerMinute         = pitch>0 ? +(cSpd/pitch).toFixed(2) : 0;
  const availableHangerPerShift = Math.round(hangerPerMinute*avail)||0;
  const effectiveHangerPerShift = Math.round(availableHangerPerShift*(eff/100))||0;

  /* API */
  const fetchPlants = useCallback(async()=>{
    try{ setLoading(true); const r=await getPlants(); setPlants(r.data||[]); }
    catch{ message.error("Failed to load plants"); }
    finally{ setLoading(false); }
  },[]);
  useEffect(()=>{ fetchPlants(); },[fetchPlants]);

  const resetForm=()=>{ setEditingId(null); setForm(defaultForm); };
  const handleChange=e=>{ const{name,value}=e.target; setForm(p=>({...p,[name]:value})); };

  const handleSubmit=async()=>{
    if(!form.plantName||!form.plantCode){ message.warning("Plant Name and Code required"); return; }
    try{
      setFormSaving(true);
      const payload={...form, conveyorLength:+form.conveyorLength, conveyorSpeed:+form.conveyorSpeed, pitchDistance:+form.pitchDistance, availableTime:+form.availableTime, demandPerShift:+form.demandPerShift, hangerEfficiency:+form.hangerEfficiency};
      if(editingId){ await updatePlant(editingId,payload); message.success("Plant updated"); }
      else         { await createPlant(payload);           message.success("Plant created"); }
      setFormOpen(false); resetForm(); fetchPlants();
    } catch(err){ message.error(err?.response?.data?.message||"Save failed"); }
    finally{ setFormSaving(false); }
  };

  const handleEdit=plant=>{
    setEditingId(plant._id);
    setForm({ plantName:plant.plantName||"", plantCode:plant.plantCode||"", location:plant.location||"", plantAdmin:plant.plantAdmin||"", conveyorLength:plant.conveyorLength||"", conveyorSpeed:plant.conveyorSpeed||"", pitchDistance:plant.pitchDistance||"", availableTime:plant.availableTime||630, demandPerShift:plant.demandPerShift||"", hangerEfficiency:plant.hangerEfficiency||100, status:plant.status||"Active" });
    setFormOpen(true);
  };

  const handleDelete=id=>{
    Modal.confirm({ title:"Delete this plant?", content:"This action cannot be undone.", okText:"Delete", okType:"danger",
      onOk:async()=>{ try{ await deletePlant(id); message.success("Plant deleted"); fetchPlants(); } catch{ message.error("Delete failed"); } }
    });
  };

  const openDetails=plant=>{ setSelected(plant); setDetailsOpen(true); };

  const filtered=plants.filter(p=>{
    const s=searchTerm.toLowerCase();
    return (p.plantName?.toLowerCase().includes(s)||p.plantCode?.toLowerCase().includes(s)) && (statusFilter==="All"||p.status===statusFilter);
  });

  const totalPlants=plants.length;
  const activePlants=plants.filter(p=>p.status==="Active").length;
  const inactivePlants=plants.filter(p=>p.status==="Inactive").length;
  const totalDemand=plants.reduce((s,p)=>s+Number(p.demandPerShift||0),0);

  const calcRow=[
    {label:"Total Hangers",   value:totalHangers},
    {label:"Process Time",    value:processTime,            suffix:"min"},
    {label:"Rounds / Shift",  value:totalRoundsShift},
    {label:"Hanger / Min",    value:hangerPerMinute},
    {label:"Avail Hanger",    value:availableHangerPerShift},
    {label:"Effective Hanger",value:effectiveHangerPerShift,highlight:true},
  ];

  /* Table */
  const columns=[
    { title:"Plant", dataIndex:"plantName", key:"plantName", width:210,
      render:(_,r)=>(
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:9,background:`linear-gradient(135deg,${DS.redFaint},rgba(229,57,53,0.12))`,border:`1px solid ${DS.redGlow}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Building2 size={16} color={DS.red} />
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:13,color:DS.black,fontFamily:DS.font}}>{r.plantName}</div>
            <div style={{fontSize:11,color:DS.gray400,fontFamily:DS.font,display:"flex",alignItems:"center",gap:3}}><User size={9}/> {r.plantAdmin||"—"}</div>
          </div>
        </div>
      ),
    },
    { title:"Code", dataIndex:"plantCode", width:90,
      render:v=><span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,fontWeight:600,color:DS.red,background:DS.redFaint,padding:"2px 7px",borderRadius:5}}>{v}</span>,
    },
    { title:"Location", dataIndex:"location", width:140,
      render:v=><span style={{fontSize:12,color:DS.gray600,fontFamily:DS.font,display:"flex",alignItems:"center",gap:4}}><MapPin size={10} color={DS.gray400}/>{v}</span>,
    },
    { title:"Demand / Shift", dataIndex:"demandPerShift", width:130, align:"right",
      render:v=>(
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end"}}>
          <span style={{fontSize:13,fontWeight:700,color:DS.warning,fontFamily:DS.font}}>{Number(v||0).toLocaleString()}</span>
          <span style={{fontSize:9,color:DS.gray400,fontFamily:DS.font}}>ODU / shift</span>
        </div>
      ),
    },
    { title:"Eff. Capacity", dataIndex:"effectiveHangerPerShift", width:130, align:"right",
      render:v=>(
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end"}}>
          <span style={{fontSize:13,fontWeight:700,color:DS.success,fontFamily:DS.font}}>{Number(v||0).toLocaleString()}</span>
          <span style={{fontSize:9,color:DS.gray400,fontFamily:DS.font}}>hangers / shift</span>
        </div>
      ),
    },
    { title:"Status", dataIndex:"status", width:100, align:"center",
      render:v=><StatusPill status={v}/>,
    },
    { title:"", key:"actions", width:80, align:"center",
      render:(_,record)=>(
        <div style={{display:"flex",gap:4,justifyContent:"center"}} onClick={e=>e.stopPropagation()}>
          <button onClick={()=>handleEdit(record)}
            style={{width:28,height:28,borderRadius:7,border:`1px solid ${DS.gray200}`,background:DS.white,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=DS.redFaint;e.currentTarget.style.borderColor=DS.red;}}
            onMouseLeave={e=>{e.currentTarget.style.background=DS.white;e.currentTarget.style.borderColor=DS.gray200;}}
          ><Pencil size={12} color={DS.gray600}/></button>
          <button onClick={()=>handleDelete(record._id)}
            style={{width:28,height:28,borderRadius:7,border:`1px solid ${DS.gray200}`,background:DS.white,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(229,57,53,0.08)";e.currentTarget.style.borderColor=DS.red;}}
            onMouseLeave={e=>{e.currentTarget.style.background=DS.white;e.currentTarget.style.borderColor=DS.gray200;}}
          ><Trash2 size={12} color={DS.red}/></button>
        </div>
      ),
    },
  ];

  /* ── Modal shared header factory ── */
  const ModalHeader=({icon, title, subtitle, right})=>(
    <div style={{background:DS.black,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",overflow:"hidden",flexShrink:0}}>
      <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:DS.red}}/>
      <div style={{display:"flex",alignItems:"center",gap:10,zIndex:1}}>
        <div style={{width:32,height:32,borderRadius:9,background:`linear-gradient(135deg,${DS.red},${DS.redDark})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 3px 10px ${DS.redGlow}`}}>
          {React.cloneElement(icon,{size:16,color:DS.white})}
        </div>
        <div>
          <div style={{color:DS.white,fontSize:14,fontWeight:800,fontFamily:DS.font}}>{title}</div>
          {subtitle&&<div style={{color:"rgba(255,255,255,0.35)",fontSize:10,fontFamily:DS.font}}>{subtitle}</div>}
        </div>
      </div>
      <div style={{display:"flex",gap:6,zIndex:1}}>{right}</div>
    </div>
  );

  /* ── Stat box for details ── */
  const StatBox=({label,value,suffix,highlight,icon})=>(
    <div style={{background:highlight?DS.successBg:DS.gray50,border:`1px solid ${highlight?"rgba(0,200,83,0.3)":DS.gray200}`,borderTop:`2px solid ${highlight?DS.success:DS.gray200}`,borderRadius:DS.radiusSm,padding:"10px 8px",textAlign:"center"}}>
      {icon&&<div style={{display:"flex",justifyContent:"center",color:highlight?DS.success:DS.gray400,marginBottom:3}}>{icon}</div>}
      <div style={{fontSize:9,fontWeight:600,color:DS.gray400,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</div>
      <div style={{fontSize:16,fontWeight:800,color:highlight?DS.success:DS.black,marginTop:3}}>
        {value??<span style={{color:DS.gray300}}>—</span>}{suffix&&<span style={{fontSize:9,fontWeight:500,marginLeft:2,color:DS.gray500}}>{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div style={{background:"#F4F5F7",minHeight:"100vh",padding:"16px 20px",fontFamily:DS.font}}>

      {/* ══ TOPBAR ══ */}
      <div style={{background:DS.black,borderRadius:DS.radius,marginBottom:14,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56,position:"relative",overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.18)"}}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:DS.red}}/>
        <div style={{position:"absolute",inset:0,opacity:0.03,backgroundImage:"linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)",backgroundSize:"20px 20px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:12,zIndex:1}}>
          <div style={{width:34,height:34,borderRadius:9,background:`linear-gradient(135deg,${DS.red},${DS.redDark})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 2px 8px ${DS.redGlow}`}}>
            <Factory size={17} color={DS.white}/>
          </div>
          <div>
            <div style={{color:DS.white,fontSize:14,fontWeight:800,letterSpacing:"-0.01em",lineHeight:1.2,fontFamily:DS.font}}>Plant Master</div>
            <div style={{color:"rgba(255,255,255,0.4)",fontSize:10,fontFamily:DS.font,letterSpacing:"0.04em"}}>CONVEYOR CAPACITY & HANGER PLANNING</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,zIndex:1}}>
          {["Overview","Analytics","Reports"].map(n=>(
            <div key={n} style={{padding:"5px 12px",borderRadius:7,cursor:"pointer",fontSize:11,color:"rgba(255,255,255,0.5)",fontWeight:500,fontFamily:DS.font}}
              onMouseEnter={e=>e.currentTarget.style.color=DS.white}
              onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.5)"}
            >{n}</div>
          ))}
          <div style={{width:1,height:18,background:"rgba(255,255,255,0.12)",margin:"0 6px"}}/>
          <button onClick={()=>{resetForm();setFormOpen(true);}}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,background:`linear-gradient(135deg,${DS.red},${DS.redDark})`,border:"none",cursor:"pointer",color:DS.white,fontSize:11,fontWeight:700,fontFamily:DS.font,boxShadow:`0 2px 8px ${DS.redGlow}`,transition:"all 0.2s"}}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-1px)"}
            onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
          ><Plus size={13}/> Add Plant</button>
        </div>
      </div>

      {/* ══ KPI ROW ══ */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:14}}>
        <KpiCard icon={<Factory/>}      label="Total Plants"    value={totalPlants}                  color={DS.red}     bgColor={DS.redFaint}  delta="All registered plants"/>
        <KpiCard icon={<CheckCircle2/>} label="Active Plants"   value={activePlants}                 color={DS.success} bgColor={DS.successBg} delta={`${Math.round((activePlants/Math.max(totalPlants,1))*100)}% of total`}/>
        <KpiCard icon={<XCircle/>}      label="Inactive Plants" value={inactivePlants}               color={DS.warning} bgColor={DS.warningBg}/>
        <KpiCard icon={<Package/>}      label="Total Demand"    value={totalDemand.toLocaleString()} color={DS.info}    bgColor={DS.infoBg}    delta="ODU / shift aggregate"/>
      </div>

      {/* ══ LIVE CALC BAR ══ */}
      <div style={{background:DS.white,borderRadius:DS.radius,border:`1px solid ${DS.gray200}`,padding:"12px 16px",marginBottom:14,boxShadow:DS.shadowCard}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <Zap size={12} color={DS.red}/>
          <span style={{fontSize:10,fontWeight:700,color:DS.gray500,textTransform:"uppercase",letterSpacing:"0.08em"}}>Live Capacity Calculator</span>
          <span style={{fontSize:10,color:DS.gray400}}>— reflects form inputs in real time</span>
          <div style={{flex:1}}/>
          <div style={{fontSize:10,color:DS.gray400,display:"flex",alignItems:"center",gap:4}}><RefreshCw size={9}/> auto-update</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8}}>
          {[
            {label:"Total Hangers",   value:totalHangers,            icon:<Layers3 size={10}/>},
            {label:"Process Time",    value:processTime,suffix:"min", icon:<Timer size={10}/>},
            {label:"Rounds / Shift",  value:totalRoundsShift,         icon:<RefreshCw size={10}/>},
            {label:"Hanger / Min",    value:hangerPerMinute,          icon:<Gauge size={10}/>},
            {label:"Avail Hanger",    value:availableHangerPerShift,  icon:<BarChart3 size={10}/>},
            {label:"Effective Hanger",value:effectiveHangerPerShift,  icon:<CheckCircle2 size={10}/>,highlight:true},
          ].map((c,i)=>(
            <div key={i} style={{background:c.highlight?DS.successBg:DS.gray50,border:`1px solid ${c.highlight?"rgba(0,200,83,0.25)":DS.gray200}`,borderTop:`2px solid ${c.highlight?DS.success:DS.gray200}`,borderRadius:DS.radiusSm,padding:"9px 10px",textAlign:"center"}}>
              <div style={{display:"flex",justifyContent:"center",color:c.highlight?DS.success:DS.gray400,marginBottom:4}}>{c.icon}</div>
              <div style={{fontSize:9,fontWeight:600,color:DS.gray400,textTransform:"uppercase",letterSpacing:"0.06em"}}>{c.label}</div>
              <div style={{fontSize:16,fontWeight:800,color:c.highlight?DS.success:DS.black,marginTop:2,lineHeight:1}}>
                {c.value}{c.suffix&&<span style={{fontSize:9,fontWeight:500,marginLeft:2}}>{c.suffix}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ TABLE CARD ══ */}
      <div style={{background:DS.white,borderRadius:DS.radius,border:`1px solid ${DS.gray200}`,boxShadow:DS.shadowCard,overflow:"hidden"}}>
        <div style={{padding:"10px 16px",borderBottom:`1px solid ${DS.gray100}`,display:"flex",alignItems:"center",gap:10}}>
          <div style={{position:"relative"}}>
            <Search size={13} color={DS.gray400} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}/>
            <input placeholder="Search plant name or code…" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
              style={{paddingLeft:32,paddingRight:12,paddingTop:7,paddingBottom:7,fontSize:12,fontFamily:DS.font,width:260,border:`1.5px solid ${DS.gray200}`,borderRadius:DS.radiusSm,background:DS.gray50,color:DS.black,outline:"none"}}/>
          </div>
          <SSelect value={statusFilter} onChange={setStatus}>
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </SSelect>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:11,color:DS.gray400,fontFamily:DS.font}}>{filtered.length} plant{filtered.length!==1?"s":""}</span>
            <button onClick={fetchPlants} style={{width:28,height:28,borderRadius:7,border:`1px solid ${DS.gray200}`,background:DS.white,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <RefreshCw size={12} color={DS.gray500}/>
            </button>
          </div>
        </div>
        <Table rowKey="_id" loading={loading} columns={columns} dataSource={filtered} size="small"
          scroll={{x:900}} pagination={{pageSize:8,size:"small",showSizeChanger:false,style:{padding:"8px 16px"}}}
          onRow={record=>({
            onClick:()=>openDetails(record),
            onMouseEnter:()=>setHoveredRow(record._id),
            onMouseLeave:()=>setHoveredRow(null),
            style:{cursor:"pointer",transition:"background 0.15s",background:hoveredRow===record._id?"#FFF5F5":DS.white},
          })}
        />
      </div>

      {/* ══ CREATE/EDIT MODAL ══ */}
      {formOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={e=>{if(e.target===e.currentTarget){setFormOpen(false);resetForm();}}}>
          <div style={{background:DS.white,borderRadius:16,width:860,maxWidth:"94vw",maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 80px rgba(0,0,0,0.25)",overflow:"hidden"}}>

            <ModalHeader icon={editingId?<Pencil/>:<Plus/>}
              title={editingId?"Edit Plant Configuration":"Register New Plant"}
              subtitle={editingId?"Modify existing plant parameters":"Add a new manufacturing plant to the system"}
              right={
                <button onClick={()=>{setFormOpen(false);resetForm();}} style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <X size={14} color="rgba(255,255,255,0.6)"/>
                </button>
              }
            />

            <div style={{padding:"18px 22px",overflowY:"auto",flex:1}}>

              {/* Section 1: Plant Identity — 3 cols */}
              <SectionLabel icon={<Building2/>} label="Plant Identity"/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px 16px",marginBottom:18}}>
                <FField label="Plant Name" required><SInput name="plantName" value={form.plantName} onChange={handleChange} placeholder="e.g. Paint Shop A"/></FField>
                <FField label="Plant Code" required><SInput name="plantCode" value={form.plantCode} onChange={handleChange} placeholder="e.g. PS-A01"/></FField>
                <FField label="Status">
                  <SSelect value={form.status} onChange={v=>setForm(p=>({...p,status:v}))}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </SSelect>
                </FField>
                <FField label="Location" required><SInput name="location" value={form.location} onChange={handleChange} placeholder="e.g. Unit 3, Block B"/></FField>
                <FField label="Plant Admin" required><SInput name="plantAdmin" value={form.plantAdmin} onChange={handleChange} placeholder="e.g. Rajesh Kumar"/></FField>
              </div>

              {/* Section 2: Conveyor Configuration — 3 cols */}
              <SectionLabel icon={<Settings2/>} label="Conveyor Configuration"/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px 16px",marginBottom:18}}>
                <FField label="Conveyor Length (m)"><SInput name="conveyorLength" value={form.conveyorLength} onChange={handleChange} type="number" placeholder="0"/></FField>
                <FField label="Conveyor Speed (m/min)"><SInput name="conveyorSpeed" value={form.conveyorSpeed} onChange={handleChange} type="number" placeholder="0"/></FField>
                <FField label="Pitch Distance (m)"><SInput name="pitchDistance" value={form.pitchDistance} onChange={handleChange} type="number" placeholder="0"/></FField>
                <FField label="Available Time (min)"><SInput name="availableTime" value={form.availableTime} onChange={handleChange} type="number" placeholder="630"/></FField>
              </div>

              {/* Section 3: Planning & Efficiency — 3 cols */}
              <SectionLabel icon={<TrendingUp/>} label="Planning & Efficiency"/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px 16px",marginBottom:18}}>
                <FField label="Demand Per Shift (ODU)"><SInput name="demandPerShift" value={form.demandPerShift} onChange={handleChange} type="number" placeholder="0"/></FField>
                <FField label="Hanger Efficiency (%)">
                  <SSelect value={form.hangerEfficiency} onChange={v=>setForm(p=>({...p,hangerEfficiency:+v}))}>
                    {[100,95,85,75].map(v=><option key={v} value={v}>{v}%</option>)}
                  </SSelect>
                </FField>
              </div>

              {/* Auto-Calculated Results */}
              <SectionLabel icon={<Activity/>} label="Auto-Calculated Capacity"/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8}}>
                {calcRow.map((c,i)=><StatBox key={i} label={c.label} value={c.value} suffix={c.suffix} highlight={c.highlight}/>)}
              </div>
            </div>

            <div style={{padding:"12px 22px",borderTop:`1px solid ${DS.gray100}`,display:"flex",justifyContent:"flex-end",gap:8,flexShrink:0,background:DS.gray50}}>
              <button onClick={()=>{setFormOpen(false);resetForm();}}
                style={{padding:"8px 18px",borderRadius:8,border:`1.5px solid ${DS.gray200}`,background:DS.white,cursor:"pointer",fontSize:12,fontWeight:600,color:DS.gray600,fontFamily:DS.font,transition:"all 0.15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=DS.gray400}
                onMouseLeave={e=>e.currentTarget.style.borderColor=DS.gray200}
              >Cancel</button>
              <button onClick={handleSubmit} disabled={formSaving}
                style={{padding:"8px 20px",borderRadius:8,background:formSaving?DS.gray400:`linear-gradient(135deg,${DS.red},${DS.redDark})`,border:"none",cursor:formSaving?"default":"pointer",fontSize:12,fontWeight:700,color:DS.white,fontFamily:DS.font,display:"flex",alignItems:"center",gap:6,boxShadow:formSaving?"none":`0 2px 8px ${DS.redGlow}`,transition:"all 0.2s"}}
                onMouseEnter={e=>!formSaving&&(e.currentTarget.style.transform="translateY(-1px)")}
                onMouseLeave={e=>(e.currentTarget.style.transform="translateY(0)")}
              ><Save size={13}/>{formSaving?"Saving…":(editingId?"Update Plant":"Register Plant")}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DETAILS MODAL ══ */}
      {detailsOpen&&selectedPlant&&(
        <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={e=>{if(e.target===e.currentTarget)setDetailsOpen(false);}}>
          <div style={{background:DS.white,borderRadius:16,width:760,maxWidth:"94vw",maxHeight:"88vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 80px rgba(0,0,0,0.25)",overflow:"hidden"}}>

            <ModalHeader icon={<Building2/>}
              title={selectedPlant.plantName}
              subtitle={<span style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:DS.red,background:DS.redFaint,border:`1px solid ${DS.redGlow}`,padding:"1px 6px",borderRadius:4}}>{selectedPlant.plantCode}</span>
                <span style={{fontSize:10,color:"rgba(255,255,255,0.4)",fontFamily:DS.font}}>{selectedPlant.location}</span>
              </span>}
              right={<>
                <button onClick={()=>{setDetailsOpen(false);handleEdit(selectedPlant);}}
                  style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:7,background:DS.redFaint,border:`1px solid ${DS.redGlow}`,cursor:"pointer",color:DS.red,fontSize:11,fontWeight:600,fontFamily:DS.font}}>
                  <Pencil size={11}/> Edit
                </button>
                <button onClick={()=>setDetailsOpen(false)} style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <X size={14} color="rgba(255,255,255,0.6)"/>
                </button>
              </>}
            />

            <div style={{padding:"18px 22px",overflowY:"auto",flex:1}}>

              {/* Identity row */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
                {[
                  {label:"Plant Admin", value:selectedPlant.plantAdmin, icon:<User size={11}/>},
                  {label:"Status",      custom:<StatusPill status={selectedPlant.status}/>},
                  {label:"Efficiency",  value:`${selectedPlant.hangerEfficiency}%`, icon:<Gauge size={11}/>},
                ].map((f,i)=>(
                  <div key={i} style={{background:DS.gray50,border:`1px solid ${DS.gray200}`,borderRadius:DS.radiusSm,padding:"12px 14px"}}>
                    <div style={{fontSize:10,fontWeight:600,color:DS.gray400,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6,display:"flex",alignItems:"center",gap:4}}>{f.icon}{f.label}</div>
                    {f.custom||<div style={{fontSize:14,fontWeight:700,color:DS.black,fontFamily:DS.font}}>{f.value||"—"}</div>}
                  </div>
                ))}
              </div>

              {/* Capacity vs Demand */}
              <div style={{background:DS.gray50,border:`1px solid ${DS.gray200}`,borderRadius:DS.radiusSm,padding:"14px 16px",marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:700,color:DS.gray500,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12}}>Capacity Overview</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:12}}>
                  <div>
                    <div style={{fontSize:10,color:DS.gray400,marginBottom:4}}>Demand / Shift</div>
                    <div style={{fontSize:24,fontWeight:800,color:DS.warning,fontFamily:DS.font}}>{Number(selectedPlant.demandPerShift||0).toLocaleString()}</div>
                    <div style={{fontSize:10,color:DS.gray400}}>ODU</div>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:DS.gray400,marginBottom:4}}>Effective Capacity</div>
                    <div style={{fontSize:24,fontWeight:800,color:DS.success,fontFamily:DS.font}}>{Number(selectedPlant.effectiveHangerPerShift||0).toLocaleString()}</div>
                    <div style={{fontSize:10,color:DS.gray400}}>hangers</div>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:DS.gray400,marginBottom:4}}>Utilization</div>
                    {selectedPlant.demandPerShift&&selectedPlant.effectiveHangerPerShift?(
                      <>
                        <div style={{fontSize:24,fontWeight:800,color:DS.black,fontFamily:DS.font}}>{Math.round((selectedPlant.demandPerShift/selectedPlant.effectiveHangerPerShift)*100)}%</div>
                        <div style={{height:4,background:DS.gray200,borderRadius:2,marginTop:8,overflow:"hidden"}}>
                          <div style={{height:"100%",borderRadius:2,width:`${Math.min(Math.round((selectedPlant.demandPerShift/selectedPlant.effectiveHangerPerShift)*100),100)}%`,background:`linear-gradient(90deg,${DS.success},#00E676)`,transition:"width 0.6s ease"}}/>
                        </div>
                      </>
                    ):<div style={{fontSize:14,color:DS.gray400}}>—</div>}
                  </div>
                </div>
              </div>

              {/* Conveyor stats */}
              <div style={{fontSize:10,fontWeight:700,color:DS.gray500,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10}}>Conveyor Stats</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8}}>
                {[
                  {label:"Total Hangers",  value:selectedPlant.totalHangers||selectedPlant.hangers},
                  {label:"Process Time",   value:selectedPlant.processTime,                 suffix:" min"},
                  {label:"Rounds / Shift", value:selectedPlant.totalRoundsShift},
                  {label:"Hanger / Min",   value:selectedPlant.hangerPerMinute},
                  {label:"Avail Hanger",   value:selectedPlant.availableHangerPerShift},
                  {label:"Eff Hanger",     value:selectedPlant.effectiveHangerPerShift,     highlight:true},
                ].map((c,i)=><StatBox key={i} label={c.label} value={c.value} suffix={c.suffix} highlight={c.highlight}/>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global overrides */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .ant-table-thead>tr>th{background:#F8F9FA!important;padding:9px 14px!important;border-bottom:1.5px solid #E9ECEF!important;font-size:10px!important;font-weight:700!important;color:#6C757D!important;text-transform:uppercase;letter-spacing:0.06em;}
        .ant-table-tbody>tr>td{padding:10px 14px!important;border-bottom:1px solid #F1F3F5!important;font-size:13px;}
        .ant-table-tbody>tr:hover>td{background:#FFF5F5!important;}
        .ant-pagination{font-size:12px!important;}
        .ant-pagination-item-active{border-color:#E53935!important;}
        .ant-pagination-item-active a{color:#E53935!important;}
        .ant-message-notice-content{border-radius:10px!important;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,0.12)!important;}
        input[type=number]::-webkit-inner-spin-button{opacity:0.5;}
      `}</style>
    </div>
  );
}