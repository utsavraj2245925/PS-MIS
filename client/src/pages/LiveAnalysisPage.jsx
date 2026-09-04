/**
 * LiveAnalysisPage.jsx — Paint Shop MIS Real-Time Monitor
 *
 * Fixes applied:
 * 1. Plants cascade from selected locationId ONLY — no cross-location bleed
 * 2. Conveyors cascade from plant + shift + locationId
 * 3. Total Target reads session.demandPerShift (correct field)
 * 4. Achievement % = (totalProduction / totalTarget) × 100, shows "—" when no target
 * 5. Navbar + KPI bar both sticky (navbar top:0, KPI bar top:56px)
 * 6. All sessions shown in timeline table
 * 7. Real-time clock anchored to serverTime with local drift correction
 * 8. One poll every 10 seconds — inFlight guard prevents overlap
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import dayjs from "dayjs";
import { Select, Button, Tag, Spin, Empty, Tooltip, Table, Alert, Progress } from "antd";
import {
  Activity, MapPin, Clock3, ChevronRight, ArrowLeft,
  RefreshCw, Radio, Lock, AlertTriangle, WifiOff, RotateCcw,
  Package, Target, Award, Timer, TrendingDown, Gauge, CheckCircle2,
  Zap, Coffee, Layers, Play, XCircle, Sun, Moon, Sigma, Cpu,
  BarChart2,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────── */
const API     = axiosInstance;
const POLL_MS = 10_000;

/* ─────────────────────────────────────────────────────────── */
/*  PURE HELPERS                                               */
/* ─────────────────────────────────────────────────────────── */
const safeNum = (v, fb = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
const fmt1    = (n) => safeNum(n).toFixed(1);
const fmt0    = (n) => Math.round(safeNum(n)).toLocaleString();
const pct     = (a, b) => (safeNum(b) > 0 ? Math.round((safeNum(a) / safeNum(b)) * 10000) / 100 : null);

const formatHM = (mins) => {
  const m = Math.max(Math.round(safeNum(mins)), 0);
  if (m === 0) return "0m";
  const h = Math.floor(m / 60), r = m % 60;
  return h === 0 ? `${r}m` : `${h}h ${String(r).padStart(2, "0")}m`;
};

const fmtClock = (v) => v ? dayjs(v).format("HH:mm:ss") : "—";
const fmtHHMM  = (v) => v ? dayjs(v).format("HH:mm")    : "—";

/* Is HH:mm shift window currently active? */
const shiftNow = (s) => {
  if (!s?.shiftStartTime || !s?.shiftEndTime) return false;
  const nowM = dayjs().hour() * 60 + dayjs().minute();
  const [sh, sm] = s.shiftStartTime.split(":").map(Number);
  const [eh, em] = s.shiftEndTime.split(":").map(Number);
  let sMin = sh * 60 + sm, eMin = eh * 60 + em;
  if (eMin <= sMin) eMin += 1440;
  const nm = nowM < sMin ? nowM + 1440 : nowM;
  return nm >= sMin && nm < eMin;
};

/* Achievement colour */
const achv = (p) => {
  if (p === null || p === undefined) return { hex: "#94a3b8", antd: "default", bg: "#f8fafc", border: "#e2e8f0" };
  const n = safeNum(p);
  if (n >= 90) return { hex: "#16a34a", antd: "green",  bg: "#f0fdf4", border: "#bbf7d0" };
  if (n >= 70) return { hex: "#d97706", antd: "gold",   bg: "#fffbeb", border: "#fde68a" };
  return              { hex: "#dc2626", antd: "red",    bg: "#fef2f2", border: "#fecaca" };
};

/* ─────────────────────────────────────────────────────────── */
/*  STYLE TOKENS                                               */
/* ─────────────────────────────────────────────────────────── */
const CARD  = "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden";
const LABEL = "block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5";
const FIELD = "bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-700 font-semibold";

/* ─────────────────────────────────────────────────────────── */
/*  ATOMS                                                      */
/* ─────────────────────────────────────────────────────────── */
const SHead = ({ icon: I, color = "text-teal-600", border = "#0d9488", children, extra }) => (
  <div className="flex items-center justify-between w-full">
    <div className="flex items-center gap-2" style={{ borderLeft: `3px solid ${border}`, paddingLeft: 8 }}>
      <I size={12} className={color} />
      <span className="text-[11px] font-black text-slate-800 tracking-wide">{children}</span>
    </div>
    {extra}
  </div>
);

const SPill = ({ status }) => {
  const M = {
    Running:     "bg-green-50 border-green-200 text-green-700",
    Break:       "bg-amber-50 border-amber-200 text-amber-700",
    "Not Started": "bg-slate-50 border-slate-200 text-slate-500",
    Completed:   "bg-blue-50 border-blue-200 text-blue-700",
  };
  const dot = {
    Running: "bg-green-500 animate-pulse", Break: "bg-amber-400 animate-pulse",
    "Not Started": "bg-slate-400", Completed: "bg-blue-500",
  };
  const s = status || "Not Started";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${M[s] || M["Not Started"]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[s] || dot["Not Started"]}`} />
      {s}
    </span>
  );
};

/* KPI card — gradient tone */
const KCard = ({ icon: I, label, value, sub, tone = "slate", pulse, warn }) => {
  const T = {
    blue:   { g: "from-blue-50 to-blue-100/40",     b: "border-blue-200",   v: "text-blue-900",   i: "text-blue-400",   arc: "#3b82f6" },
    teal:   { g: "from-teal-50 to-teal-100/40",     b: "border-teal-200",   v: "text-teal-900",   i: "text-teal-400",   arc: "#0d9488" },
    green:  { g: "from-green-50 to-green-100/40",   b: "border-green-200",  v: "text-green-900",  i: "text-green-400",  arc: "#16a34a" },
    red:    { g: "from-red-50 to-red-100/40",       b: "border-red-200",    v: "text-red-800",    i: "text-red-400",    arc: "#dc2626" },
    amber:  { g: "from-amber-50 to-amber-100/40",   b: "border-amber-200",  v: "text-amber-900",  i: "text-amber-400",  arc: "#f59e0b" },
    purple: { g: "from-purple-50 to-purple-100/40", b: "border-purple-200", v: "text-purple-900", i: "text-purple-400", arc: "#7c3aed" },
    cyan:   { g: "from-cyan-50 to-cyan-100/40",     b: "border-cyan-200",   v: "text-cyan-900",   i: "text-cyan-400",   arc: "#0891b2" },
    indigo: { g: "from-indigo-50 to-indigo-100/40", b: "border-indigo-200", v: "text-indigo-900", i: "text-indigo-400", arc: "#4f46e5" },
    slate:  { g: "from-slate-50 to-slate-100/40",   b: "border-slate-200",  v: "text-slate-700",  i: "text-slate-400",  arc: "#64748b" },
  };
  const t = T[tone] || T.slate;
  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${t.g} ${t.b} px-3 py-2.5 flex flex-col gap-1 relative overflow-hidden`}
      style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}>
      <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full opacity-10" style={{ background: t.arc }} />
      <div className="flex items-center justify-between">
        <I size={12} className={t.i} />
        {pulse && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
        {warn  && !pulse && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
      </div>
      <div className={`text-[15px] font-black tabular-nums leading-none ${t.v}`}>{value}</div>
      <div className="text-[8px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
      {sub && <div className="text-[8px] text-slate-300 leading-none">{sub}</div>}
    </div>
  );
};

const LockedField = ({ label, value }) => (
  <div>
    <label className={LABEL}>{label}</label>
    <Tooltip title="Locked to your assigned scope">
      <div className={`${FIELD} flex items-center gap-1.5 cursor-not-allowed opacity-70`}>
        <Lock size={8} className="text-slate-300 flex-shrink-0" />
        <span className="truncate text-slate-500">{value || "—"}</span>
      </div>
    </Tooltip>
  </div>
);

const SRow = ({ label, children }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
    <span className="text-[10px] text-slate-400">{label}</span>
    <div>{children}</div>
  </div>
);

const BigN = ({ label, value, tone = "slate" }) => {
  const C = {
    blue:   "border-blue-200 bg-blue-50 text-blue-900",
    teal:   "border-teal-200 bg-teal-50 text-teal-900",
    slate:  "border-slate-200 bg-slate-50 text-slate-800",
    red:    "border-red-200 bg-red-50 text-red-800",
    green:  "border-green-200 bg-green-50 text-green-900",
    amber:  "border-amber-200 bg-amber-50 text-amber-900",
    purple: "border-purple-200 bg-purple-50 text-purple-900",
  };
  return (
    <div className={`rounded-xl border p-2 text-center ${C[tone] || C.slate}`}>
      <div className="text-[8px] font-bold uppercase tracking-widest opacity-40 mb-1">{label}</div>
      <div className="text-[20px] font-black tabular-nums leading-none">{value}</div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────── */
/*  DOWNTIME BANNER (live ticking)                              */
/* ─────────────────────────────────────────────────────────── */
function DowntimeBanner({ activeDowntime }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const dtStart   = activeDowntime?.startTime ? dayjs(activeDowntime.startTime) : null;
  const dtElapsed = dtStart ? Math.max(dayjs().diff(dtStart, "second"), 0) : 0;
  const dtMins    = Math.floor(dtElapsed / 60);
  const dtSecs    = dtElapsed % 60;
  const dtType    = activeDowntime?.type === "Planned" ? "PLANNED" : "UNPLANNED";
  const dtReason  = activeDowntime?.downtimeReason ? ` — ${activeDowntime.downtimeReason.toUpperCase()}` : "";
  const dtLabel   = `${dtType}${dtReason}`;

  return (
    <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 flex items-center justify-between gap-2">
      <div>
        <div className="text-[9px] font-bold uppercase tracking-widest text-red-500 mb-0.5">{dtLabel}</div>
        <div className="text-[11px] font-bold text-red-700">
          Started {dtStart ? dtStart.format("HH:mm") : "—"}
        </div>
      </div>
      <div className="text-right">
        <div className="text-[9px] text-red-400 font-semibold uppercase tracking-wider mb-0.5">Running</div>
        <div className="text-[18px] font-black font-mono tabular-nums text-red-600">
          {String(dtMins).padStart(2, "0")}:{String(dtSecs).padStart(2, "0")}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  MAIN PAGE                                                  */
/* ─────────────────────────────────────────────────────────── */
export default function LiveAnalysisPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role     = user?.role;

  /* ── scope dropdowns ── */
  const [locations, setLocations] = useState([]);
  const [plants,    setPlants]    = useState([]);
  const [shifts,    setShifts]    = useState([]);
  const [conveyors, setConveyors] = useState([]);

  const [selLoc, setSelLoc] = useState(null);
  const [selPlt, setSelPlt] = useState(null);
  const [selSft, setSelSft] = useState(null);
  const [selCnv, setSelCnv] = useState(null);

  const [ldLoc, setLdLoc] = useState(false);
  const [ldPlt, setLdPlt] = useState(false);
  const [ldSft, setLdSft] = useState(false);
  const [ldCnv, setLdCnv] = useState(false);

  /* ── live data ── */
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [firstLoad,   setFirstLoad]   = useState(true);
  const [error,       setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const pollRef  = useRef(null);
  const inFlight = useRef(false);

  /* 1-second ticker for live clock */
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  /* ── PRE-FILL FROM USER RECORD ── */
  useEffect(() => {
    if (!user) return;
    const pid = user.plantId?._id    || user.plantId    || null;
    const lid = user.locationId?._id || user.locationId || null;
    if (role === "manager")    { if (pid) setSelPlt(String(pid)); if (lid) setSelLoc(String(lid)); }
    if (role === "plantAdmin") { if (lid) setSelLoc(String(lid)); }
  }, [user, role]);

  /* ── FETCH LOCATIONS (superAdmin) ── */
  useEffect(() => {
    if (role !== "superAdmin") return;
    setLdLoc(true);
    API.get("/locations")
      .then(({ data: d }) => setLocations(d?.locations || d?.data || []))
      .catch(() => setLocations([]))
      .finally(() => setLdLoc(false));
  }, [role]);

    /* ── FETCH PLANTS — filtered by locationId ── */
    useEffect(() => {
      if (!selLoc && role === "superAdmin") { setPlants([]); setSelPlt(null); return; }
      setLdPlt(true);
      API.get("/plants", { params: selLoc ? { locationId: selLoc } : {} })
        .then(({ data: d }) => {
          const list = d?.plants || d?.data || [];
          const filtered = selLoc
            ? list.filter((p) => String(p.locationId?._id || p.locationId || "") === String(selLoc))
            : list;
          setPlants(filtered.filter((p) => p.status !== "Inactive"));
        })
        .catch(() => setPlants([]))
        .finally(() => setLdPlt(false));
    }, [selLoc, role]);

    /* ── FETCH SHIFTS — for selected plant ── */
    useEffect(() => {
      if (!selPlt) { setShifts([]); setSelSft(null); return; }
      setLdSft(true);
      API.get(`/shifts/plant/${selPlt}`)
        .then(({ data: d }) => {
          const list = (d?.data || d?.shifts || []).filter((s) => s.status !== "Inactive");
          setShifts(list);
          const active = list.find(shiftNow);
          setSelSft(active ? String(active._id) : list[0] ? String(list[0]._id) : null);
        })
        .catch(() => setShifts([]))
        .finally(() => setLdSft(false));
    }, [selPlt]);

    /* ── FETCH CONVEYORS — scoped to selected plant & shift, with deduplication ── */
    useEffect(() => {
      if (!selPlt || !selSft) { setConveyors([]); setSelCnv(null); return; }
      setLdCnv(true);

      // Fetch active conveyor strengths for this specific shift
      API.get(`/conveyor-strength/shift/${selSft}`)
        .then(({ data: d }) => {
          const list = d?.data || d?.conveyorStrengths || [];
          // Deduplicate by conveyor name and ID so Line 1 appears only once
          const seenNames = new Set();
          const seenIds = new Set();
          const unique = [];

          list.forEach((c) => {
            const name = String(c.conveyorName || "").trim();
            const id = String(c.conveyorId?._id || c.conveyorId || c._id);
            if (c.status !== "Inactive" && (!seenNames.has(name) && !seenIds.has(id))) {
              seenNames.add(name);
              seenIds.add(id);
              unique.push(c);
            }
          });

          // Fallback to plant's physical conveyors if none configured in ConveyorStrength
          if (unique.length === 0) {
            const selectedPlant = plants.find((p) => String(p._id) === String(selPlt));
            const plantConveyors = (selectedPlant?.conveyors || [])
              .filter((c) => c.status === "Active")
              .map((c) => ({ _id: c._id, conveyorId: c._id, conveyorName: c.conveyorName }));
            setConveyors(plantConveyors);
          } else {
            setConveyors(unique);
          }
        })
        .catch(() => {
          const selectedPlant = plants.find((p) => String(p._id) === String(selPlt));
          setConveyors((selectedPlant?.conveyors || []).filter((c) => c.status === "Active"));
        })
        .finally(() => setLdCnv(false));
    }, [selPlt, selSft, plants]);
    
      /* ── AUTO-RESET & SWITCH ON SHIFT FINISH ── */
    useEffect(() => {
      if (!shifts.length) return;
      const currentActive = shifts.find(shiftNow);
      const activeId = currentActive ? String(currentActive._id) : null;

      // When the currently viewed shift ends and a new shift becomes active
      if (activeId && selSft && activeId !== selSft) {
        setSelSft(activeId);
        setSelCnv(null);
        setData(null);
        setFirstLoad(true);
      }
    }, [tick, shifts, selSft]);
  /* ── SCOPE READY ── */
  const scopeReady = useMemo(() => {
    if (!selSft) return false;
    if (role === "superAdmin" && (!selLoc || !selPlt)) return false;
    if (role === "plantAdmin" && !selPlt) return false;
    return true;
  }, [selSft, selLoc, selPlt, role]);

  /* ── BUILD PARAMS ── */
  const buildParams = useCallback(() => {
    const p = { shiftId: selSft, date: dayjs().format("YYYY-MM-DD") };
    if (role === "superAdmin" || role === "plantAdmin") p.plantId    = selPlt;
    if (role === "superAdmin")                          p.locationId = selLoc;
    if (selCnv)                                         p.conveyorId = selCnv;
    return p;
  }, [selSft, selPlt, selLoc, selCnv, role]);

  /* ── FETCH LIVE ANALYSIS ── */
  const fetchLive = useCallback(async (bg = false) => {
    if (!scopeReady || inFlight.current) return;
    inFlight.current = true;
    if (!bg) setLoading(true);
    setError(null);
    try {
      const { data: d } = await API.get("/live-analysis", { params: buildParams() });
      setData(d?.data || d);
      setLastUpdated(new Date());
      if (firstLoad) setFirstLoad(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load Live Analysis. Check your scope and retry.");
    } finally {
      inFlight.current = false;
      if (!bg) setLoading(false);
    }
  }, [scopeReady, buildParams, firstLoad]);

  /* ── POLLING ── */
  const startPoll = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchLive(true), POLL_MS);
  }, [fetchLive]);

  useEffect(() => {
    if (!scopeReady) { if (pollRef.current) clearInterval(pollRef.current); return; }
    setData(null); setFirstLoad(true);
    fetchLive(false).then(() => startPoll());
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeReady, selSft, selCnv]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  /* ── FILTER HANDLERS — strict cascade reset ── */
    const onLoc = (v) => {
      setSelLoc(v);
      setSelPlt(null);
      setSelSft(null);
      setSelCnv(null);
      setPlants([]);
      setShifts([]);
      setConveyors([]);
      setData(null);
    };

    const onPlt = (v) => {
      setSelPlt(v);
      setSelSft(null);
      setSelCnv(null);
      setShifts([]);
      setConveyors([]);
      setData(null);
    };

    const onSft = (v) => {
      setSelSft(v);
      setSelCnv(null);
      setData(null);
    };

    const onCnv = (v) => {
      setSelCnv(v || null);
      setData(null);
    };

  /* ── DERIVED ── */
  const raw        = data?.summary         || {};
  const shift      = data?.shift           || {};
  const block      = data?.currentBlock    || null;
  const sess       = data?.currentSession  || null;
  const allBlocks  = data?.blocks?.all     || [];
  const upcoming   = data?.blocks?.upcoming || [];
  const timeline   = data?.timeline        || [];
  const status     = shift.status          || "Not Started";
  const perf       = sess?.performance     || {};

  /* Total Target — from session.demandPerShift sum */
  const totalTarget     = safeNum(raw.totalTarget);
  const totalProduction = safeNum(raw.totalProduction);
  const hasTarget       = totalTarget > 0;

  /* Summary achievement */
  const sumAchvPct = hasTarget ? safeNum(raw.achievementPercent) : null;
  const sumAchv    = achv(sumAchvPct);

  /* Session achievement */
  const sessTarget    = safeNum(perf.target);
  const sessProd      = safeNum(perf.quantity);
  const sessHasTarget = sessTarget > 0;
  const sessAchvPct   = sessHasTarget
    ? pct(sessProd, sessTarget)
    : (perf.achievementPercent !== undefined && perf.achievementPercent !== null ? safeNum(perf.achievementPercent) : null);
  const sessAchv      = achv(sessAchvPct);

  /* Live elapsed (server-time anchored) */
  const elapsedMin = useMemo(() => {
    if (!shift.shiftStartTime) return 0;
    const start  = dayjs(shift.shiftStartTime);
    const drift  = lastUpdated ? dayjs().diff(dayjs(lastUpdated), "second") : 0;
    const now    = data?.serverTime ? dayjs(data.serverTime).add(drift, "second") : dayjs();
    if (now.isBefore(start)) return 0;
    if (status === "Completed") return Math.round(dayjs(shift.shiftEndTime).diff(start, "minute"));
    return Math.max(Math.round(now.diff(start, "minute")), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shift, status, lastUpdated, tick]);

  const remainMin = useMemo(() => {
    if (!shift.shiftEndTime || status === "Completed") return 0;
    const drift = lastUpdated ? dayjs().diff(dayjs(lastUpdated), "second") : 0;
    const now   = data?.serverTime ? dayjs(data.serverTime).add(drift, "second") : dayjs();
    return Math.max(Math.round(dayjs(shift.shiftEndTime).diff(now, "minute")), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shift, status, lastUpdated, tick]);

  const shiftPct = shift.totalShiftMinutes
    ? Math.min(Math.round((elapsedMin / shift.totalShiftMinutes) * 100), 100) : 0;

  /* Locked display names */
  const uPlant = user?.plantId?.plantName    || user?.plantName    || "—";
  const uLoc   = user?.locationId?.locationName || user?.locationName || "—";

  /* Conveyor label for breadcrumb */
  const cnvLabel = useMemo(() => {
    if (!selCnv) return null;
    const c = conveyors.find((c) => String(c.conveyorId?._id || c.conveyorId || c._id) === selCnv);
    return c?.conveyorName || "Conveyor";
  }, [selCnv, conveyors]);

  /* KPI achievement tone */
  const achvTone = (p) => p === null ? "slate" : p >= 90 ? "green" : p >= 70 ? "amber" : "red";

    /* ── BLOCK TABLE COLS ── */
    const blockCols = [
      { title: "#", key: "n", width: 40,
        render: (_, r) => <span className="text-[10px] font-black text-slate-300 tabular-nums">{r.blockNumber ?? "—"}</span> },
      { title: "Block", key: "l",
        render: (_, r) => (
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.isBreak ? "bg-amber-400" : "bg-blue-400"}`} />
            <span className="text-[11px] font-semibold text-slate-700">{r.blockLabel || "—"}</span>
          </div>
        ) },
      { title: "Type", key: "t", width: 110,
        render: (_, r) => r.isBreak
          ? <Tag color="gold"  className="!rounded-lg !text-[10px] !font-bold">☕ Break</Tag>
          : <Tag color="blue"  className="!rounded-lg !text-[10px] !font-bold">⚡ Production</Tag> },
      { title: "Start",   key: "s",  width: 70, align: "center",
        render: (_, r) => <span className="text-[11px] tabular-nums font-mono">{fmtHHMM(r.startTime)}</span> },
      { title: "End",     key: "e",  width: 70, align: "center",
        render: (_, r) => <span className="text-[11px] tabular-nums font-mono">{fmtHHMM(r.endTime)}</span> },
      { title: "Dur",     key: "d",  width: 70, align: "center",
        render: (_, r) => <span className="text-[11px] text-slate-500">{formatHM(r.durationMinutes)}</span> },
      { title: "Qty",     key: "q",  width: 70, align: "center",
        render: (_, r) => !r.isBreak
          ? <span className="text-[12px] font-black text-slate-800 tabular-nums">{safeNum(r.productionQty)}</span>
          : <span className="text-slate-200">—</span> },
      { title: "Target",  key: "tgt", width: 75, align: "center",
        render: (_, r) => !r.isBreak && safeNum(r.target) > 0
          ? <span className="text-[11px] font-semibold text-slate-600 tabular-nums">{safeNum(r.target)}</span>
          : <span className="text-slate-200">—</span> },
      { title: "Achv %",  key: "achv", width: 80, align: "center",
        render: (_, r) => {
          if (r.isBreak) return <span className="text-slate-200">—</span>;
          const a = safeNum(r.achievementPercent);
          if (a <= 0 && safeNum(r.productionQty) === 0) return <span className="text-slate-300 text-[10px]">0%</span>;
          const color = a >= 90 ? "green" : a >= 70 ? "gold" : "red";
          return <Tag color={color} className="!rounded-md !text-[10px] !font-black">{fmt1(a)}%</Tag>;
        } },
      { title: "Rate/hr", key: "r",  width: 84, align: "center",
        render: (_, r) => !r.isBreak && safeNum(r.productionRatePerHour) > 0
          ? <span className="text-[11px] font-bold text-teal-700 tabular-nums">{fmt1(r.productionRatePerHour)}</span>
          : <span className="text-slate-200">—</span> },
    ];

  /* ── TIMELINE TABLE COLS ── */
  const tlCols = [
    { title: "Model", key: "m", ellipsis: true,
      render: (_, r) => (
        <div className="flex items-center gap-1.5">
          {r.isRunning && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />}
          <Tag color="cyan" className="!rounded-lg !text-[11px] !font-bold !m-0">{r.modelName || "—"}</Tag>
        </div>
      ) },
    { title: "Start", key: "st", width: 68, align: "center",
      render: (_, r) => <span className="text-[11px] tabular-nums font-mono">{fmtHHMM(r.startTime)}</span> },
    { title: "End", key: "en", width: 68, align: "center",
      render: (_, r) => r.endTime
        ? <span className="text-[11px] tabular-nums font-mono">{fmtHHMM(r.endTime)}</span>
        : <Tag color="green" className="!rounded-md !text-[9px] !font-black animate-pulse">● LIVE</Tag> },
    { title: "Qty", key: "q", width: 65, align: "center",
      render: (_, r) => <span className="text-[12px] font-black text-slate-800 tabular-nums">{safeNum(r.productionQty)}</span> },
    { title: "Target", key: "tg", width: 72, align: "center",
      render: (_, r) => {
        /* target per session = session.demandPerShift saved at start */
        const t = safeNum(r.demandPerShift || r.targetQty || r.target || 0);
        return t > 0
          ? <span className="text-[11px] font-semibold text-slate-600 tabular-nums">{t}</span>
          : <Tooltip title="demandPerShift not set on ConveyorStrength">
              <span className="text-slate-300 text-[10px]">—</span>
            </Tooltip>;
      } },
    { title: "Achv %", key: "a", width: 80, align: "center",
      render: (_, r) => {
        const prod  = safeNum(r.productionQty);
        const tgt   = safeNum(r.demandPerShift || r.targetQty || r.target || 0);
        const ap    = tgt > 0 ? pct(prod, tgt) : (safeNum(r.achievementPercent) > 0 ? safeNum(r.achievementPercent) : null);
        if (ap === null) return <span className="text-slate-300 text-[10px]">—</span>;
        const ac = achv(ap);
        return <Tag color={ac.antd} className="!rounded-md !text-[10px] !font-black">{fmt1(ap)}%</Tag>;
      } },
    { title: "Running", key: "ru", width: 78, align: "center",
      render: (_, r) => <span className="text-[11px] text-teal-700 font-semibold">{formatHM(r.runningMinutes)}</span> },
    { title: "Downtime", key: "dt", width: 78, align: "center",
      render: (_, r) => {
        const v = safeNum(r.downtimeMinutes);
        return v > 0 ? <span className="text-[11px] text-red-600 font-semibold">{formatHM(v)}</span>
                     : <span className="text-slate-200">—</span>;
      } },
    { title: "Rate/hr", key: "rt", width: 76, align: "center",
      render: (_, r) => safeNum(r.averageProductionRate) > 0
        ? <span className="text-[11px] font-semibold text-slate-600 tabular-nums">{fmt1(r.averageProductionRate)}</span>
        : <span className="text-slate-200">—</span> },
    { title: "Status", key: "s", width: 90, align: "center",
      render: (_, r) => r.isRunning
        ? <Tag color="green"    className="!rounded-md !text-[10px] !font-bold">▶ Running</Tag>
        : <Tag color="geekblue" className="!rounded-md !text-[10px] !font-bold">✓ Done</Tag> },
  ];

  /* ── INITIAL LOADING SCREEN ── */
  if (loading && firstLoad && scopeReady) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "rgba(15,23,42,0.1)", backdropFilter: "blur(8px)" }}>
        <div className="flex flex-col items-center gap-5 bg-white border border-slate-200 rounded-3xl px-14 py-12"
          style={{ boxShadow: "0 24px 60px rgba(15,23,42,0.12)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#0d9488,#0891b2)" }}>
            <Activity size={26} className="text-white animate-pulse" />
          </div>
          <Spin size="large" />
          <div className="text-center">
            <p className="text-slate-700 font-bold text-sm">Loading Live Analysis</p>
            <p className="text-slate-400 text-xs mt-1">Connecting to production stream…</p>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-slate-100">

      {/* ══ STICKY NAVBAR (top: 0) ══ */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200"
        style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
        <div className="px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#0d9488,#0891b2)" }}>
              <Activity size={17} className="text-white" />
            </div>
            <div className="leading-none">
              <div className="text-[13px] font-black text-slate-800">Live Analysis</div>
              <div className="text-[9px] text-slate-400 font-medium tracking-wide hidden sm:block">Paint Shop MIS</div>
            </div>
            {/* LIVE pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full"
              style={{ background: "#f0fdf4", border: "1px solid #86efac" }}>
              <Radio size={9} className="text-green-500 animate-pulse" />
              <span className="text-[9px] font-black text-green-600 tracking-widest">LIVE</span>
            </div>
            {data && <SPill status={status} />}
          </div>

          {/* Breadcrumb (desktop) */}
          {data && (
            <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
              <span>{data.scope?.locationName || uLoc}</span>
              <ChevronRight size={9} className="text-slate-300" />
              <span>{data.scope?.plantName}</span>
              <ChevronRight size={9} className="text-slate-300" />
              <span className="font-bold text-slate-700">{data.scope?.shiftName}</span>
              {cnvLabel && <><ChevronRight size={9} className="text-slate-300" /><span className="font-bold text-slate-700">{cnvLabel}</span></>}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {lastUpdated && (
              <span className="hidden md:block text-[9px] text-slate-400 tabular-nums font-mono">
                {fmtClock(lastUpdated)}
              </span>
            )}
            <Tooltip title="Refresh (auto every 10 s)">
              <Button size="small"
                icon={<RefreshCw size={12} className={loading && !firstLoad ? "animate-spin" : ""} />}
                onClick={() => fetchLive(false)}
                disabled={loading && !firstLoad}
                className="!rounded-lg" />
            </Tooltip>
            <Button size="small" icon={<ArrowLeft size={11} />} onClick={() => navigate(-1)}
              className="!rounded-lg !text-slate-600 !border-slate-200 !text-[11px]">
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ══ STICKY KPI BAR (top: 56px = navbar height) ══ */}
      {data && !error && (
        <div className="sticky z-40 bg-white border-b border-slate-100"
          style={{ top: 56, boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}>
          <div className="px-4 sm:px-6 py-2">
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              <KCard icon={Package}      tone="blue"
                label="Total Production"
                value={fmt0(totalProduction)}
                pulse={!!raw.activeModel} />

              <KCard icon={Target}       tone={hasTarget ? "slate" : "slate"}
                label="Total Target"
                value={hasTarget ? fmt0(totalTarget) : "—"}
                sub={!hasTarget ? "Set demandPerShift" : undefined}
                warn={!hasTarget} />

              <KCard icon={Award}        tone={achvTone(sumAchvPct)}
                label="Achievement %"
                value={sumAchvPct !== null ? `${fmt1(sumAchvPct)}%` : "—"}
                sub={sumAchvPct === null ? "No target set" : undefined}
                warn={sumAchvPct === null} />

              <KCard icon={Timer}        tone="teal"
                label="Running Time"
                value={formatHM(raw.totalRunningMinutes)} />

              <KCard icon={TrendingDown} tone={safeNum(raw.totalDowntimeMinutes) > 30 ? "red" : "slate"}
                label="Downtime"
                value={formatHM(raw.totalDowntimeMinutes)} />

              <KCard icon={Gauge}        tone="cyan"
                label="Rate / hr"
                value={fmt1(raw.averageProductionRate)} />

              <KCard icon={CheckCircle2} tone="purple"
                label="Completed"
                value={String(safeNum(raw.completedModels))}
                sub="models" />

              <KCard icon={Activity}     tone={raw.activeModel ? "green" : "slate"}
                label="Active Model"
                value={raw.activeModel ? "Yes" : "—"}
                pulse={!!raw.activeModel} />
            </div>
          </div>
        </div>
      )}

      {/* ══ SCROLLABLE BODY ══ */}
      {/* paddingBottom for footer */}
      <div className="px-3 sm:px-5 py-3 space-y-3 max-w-[1700px] mx-auto pb-14">

        {/* ── SCOPE FILTER ── */}
        <div className={CARD}>
          <div className="px-4 py-2.5 border-b border-slate-100">
            <SHead icon={MapPin} border="#0d9488" color="text-teal-500">Scope Selection</SHead>
          </div>
          <div className="px-4 py-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

              {/* LOCATION */}
              {role === "superAdmin" ? (
                <div>
                  <label className={LABEL}>Location</label>
                  <Select size="small" className="w-full" placeholder="Select location"
                    loading={ldLoc} value={selLoc} showSearch optionFilterProp="label"
                    options={locations.map((l) => ({ value: String(l._id), label: l.locationName }))}
                    onChange={onLoc} />
                </div>
              ) : <LockedField label="Location" value={uLoc} />}

              {/* PLANT — only shows plants of the selected location */}
              {role === "superAdmin" || role === "plantAdmin" ? (
                <div>
                  <label className={LABEL}>Plant</label>
                  <Select size="small" className="w-full"
                    placeholder={selLoc ? "Select plant" : "Select location first"}
                    loading={ldPlt} disabled={!selLoc} value={selPlt}
                    showSearch optionFilterProp="label"
                    options={plants.map((p) => ({ value: String(p._id), label: p.plantName }))}
                    onChange={onPlt} />
                </div>
              ) : <LockedField label="Plant" value={uPlant} />}

              {/* SHIFT — only shows shifts of the selected plant */}
              <div>
                <label className={LABEL}>Shift</label>
                <Select size="small" className="w-full"
                  placeholder={selPlt ? "Select shift" : "Select plant first"}
                  loading={ldSft} disabled={!selPlt} value={selSft}
                  options={shifts.map((s) => ({
                    value: String(s._id),
                    label: `${s.shiftName}${shiftNow(s) ? " ●" : ""}  (${s.shiftStartTime}–${s.shiftEndTime})`,
                  }))}
                  onChange={onSft} />
              </div>

              {/* CONVEYOR — only shows conveyors of location+plant+shift */}
              <div>
                <label className={LABEL}>
                  Conveyor <span className="font-normal normal-case text-slate-300">(optional)</span>
                </label>
                <Select size="small" className="w-full" placeholder="All conveyors"
                  loading={ldCnv} disabled={!selSft} value={selCnv} allowClear
                  options={conveyors.map((c) => ({
                    value: String(c.conveyorId?._id || c.conveyorId || c._id),
                    label: c.conveyorName || "Conveyor",
                  }))}
                  onChange={onCnv} />
              </div>
            </div>

            {!scopeReady && (
              <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-slate-400">
                <AlertTriangle size={9} className="text-amber-400 flex-shrink-0" />
                {role === "manager" ? "Select a shift to load Live Analysis."
                  : role === "plantAdmin" ? "Select plant → shift to load."
                    : "Select location → plant → shift to load."}
              </div>
            )}
          </div>
        </div>

        {/* ── SCOPE NOT READY ── */}
        {!scopeReady && (
          <div className={`${CARD} py-20 flex flex-col items-center gap-4`}>
            <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <Cpu size={32} className="text-slate-200" />
            </div>
            <div className="text-center">
              <p className="text-slate-600 text-sm font-bold">Live Production Monitor</p>
              <p className="text-slate-400 text-xs mt-1">Select scope above to begin.</p>
              <p className="text-slate-300 text-[10px] mt-1">Auto-refreshes every 10 seconds.</p>
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {scopeReady && error && (
          <Alert type="error" showIcon icon={<WifiOff size={14} />}
            message={<span className="text-[12px] font-semibold">{error}</span>}
            action={<Button size="small" icon={<RotateCcw size={11} />} onClick={() => fetchLive(false)} className="!rounded-lg">Retry</Button>}
            className="!rounded-2xl" />
        )}

        {/* ── FETCHING FALLBACK ── */}
        {scopeReady && !error && !data && loading && (
          <div className={`${CARD} py-24 flex flex-col items-center gap-4`}>
            <Spin size="large" /><p className="text-slate-400 text-xs">Fetching production data…</p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            DASHBOARD
        ════════════════════════════════════════════════════ */}
        {scopeReady && !error && data && (
          <>

            {/* No-target advisory */}
            {!hasTarget && timeline.length > 0 && (
              <Alert type="warning" showIcon icon={<AlertTriangle size={13} />}
                message={<span className="text-[11px] font-bold">Total Target & Achievement % unavailable</span>}
                description={
                  <span className="text-[10px]">
                    <b>demandPerShift</b> is 0 on the ConveyorStrength records for today's sessions.
                    Open <b>Conveyor Strength Master</b> → set <b>Demand Per Shift</b> for this plant + shift + conveyor.
                    Metrics will populate automatically from the next session start.
                  </span>
                }
                className="!rounded-2xl" />
            )}

            {/* ── ROW 1: SHIFT TIMER + SHIFT SUMMARY ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

              {/* SHIFT TIMER (2 cols) */}
              <div className={`${CARD} lg:col-span-2`}>
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <SHead icon={Clock3} border="#0d9488" color="text-teal-600"
                    extra={<SPill status={status} />}>Shift Timer</SHead>
                </div>
                <div className="px-4 py-3 space-y-3">
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { lbl: "Shift",       val: <span className="flex items-center gap-1">{status !== "Completed" && status !== "Not Started" ? <Sun size={9} className="text-amber-400" /> : <Moon size={9} className="text-slate-400" />}{data.scope?.shiftName}</span> },
                      { lbl: "Start",       val: <span className="tabular-nums font-mono">{fmtHHMM(shift.shiftStartTime)}</span> },
                      { lbl: "End",         val: <span className="tabular-nums font-mono">{fmtHHMM(shift.shiftEndTime)}</span>   },
                      { lbl: "Elapsed",     val: <span className="text-teal-700 font-black">{formatHM(elapsedMin)}</span>         },
                      { lbl: "Remaining",   val: <span className={`font-black ${status === "Completed" ? "text-slate-400" : "text-blue-700"}`}>{status === "Completed" ? "Ended" : formatHM(remainMin)}</span> },
                      { lbl: "Working Hrs", val: <span className="font-semibold">{shift.actualWorkingHours || formatHM(shift.actualWorkingMinutes)}</span> },
                    ].map(({ lbl, val }) => (
                      <div key={lbl}><label className={LABEL}>{lbl}</label><div className={FIELD}>{val}</div></div>
                    ))}
                  </div>
                  {shift.totalShiftMinutes > 0 && (
                    <div>
                      <Progress percent={shiftPct}
                        strokeColor={status === "Completed" ? "#94a3b8" : status === "Break" ? "#f59e0b" : { "0%": "#0d9488", "100%": "#0891b2" }}
                        trailColor="#f1f5f9" size={["100%", 8]} showInfo={false} />
                      <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                        <span>{shiftPct}% elapsed</span>
                        <span>Break: {formatHM(shift.totalBreakMinutes)}</span>
                        <span>{shift.crossesMidnight ? "Overnight" : "Day shift"}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SHIFT SUMMARY (1 col) */}
              <div className={CARD}>
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <SHead icon={Sigma} border="#6366f1" color="text-indigo-500">Shift Summary</SHead>
                </div>
                <div className="px-4 py-2">
                  <SRow label="Total Production">
                    <span className="text-blue-700 font-black tabular-nums text-[14px]">{fmt0(totalProduction)}</span>
                  </SRow>
                  <SRow label="Total Target">
                    {hasTarget
                      ? <span className="font-black tabular-nums text-[13px] text-slate-700">{fmt0(totalTarget)}</span>
                      : <Tooltip title="Set demandPerShift in Conveyor Strength Master">
                          <span className="text-slate-400 text-[10px]">Not configured</span>
                        </Tooltip>}
                  </SRow>
                  <SRow label="Achievement %">
                    {sumAchvPct !== null
                      ? <span className="font-black tabular-nums text-[13px]" style={{ color: sumAchv.hex }}>{fmt1(sumAchvPct)}%</span>
                      : <Tooltip title="Requires demandPerShift on ConveyorStrength">
                          <span className="text-slate-400 text-[10px]">No target set</span>
                        </Tooltip>}
                  </SRow>
                  <SRow label="Running Time">
                    <span className="text-teal-700 font-bold">{formatHM(raw.totalRunningMinutes)}</span>
                  </SRow>
                  <SRow label="Total Downtime">
                    <span className={safeNum(raw.totalDowntimeMinutes) > 0 ? "text-red-600 font-bold" : "text-slate-400"}>
                      {formatHM(raw.totalDowntimeMinutes)}
                    </span>
                  </SRow>
                  <SRow label="Avg Rate / hr">
                    <span className="text-cyan-700 font-bold tabular-nums">{fmt1(raw.averageProductionRate)}</span>
                  </SRow>
                  <SRow label="Completed Models">
                    <Tag color="purple" className="!rounded-md !text-[10px] !font-bold">{safeNum(raw.completedModels)}</Tag>
                  </SRow>
                  <SRow label="Active Now">
                    {raw.activeModel
                      ? <Tag color="green" className="!rounded-md !text-[10px] !font-bold animate-pulse">● Running</Tag>
                      : <span className="text-slate-400 text-[10px]">None</span>}
                  </SRow>
                </div>
              </div>
            </div>

            {/* ── ROW 2: CURRENT BLOCK + CURRENT SESSION ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

              {/* CURRENT BLOCK */}
              <div className={CARD}>
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <SHead icon={Layers} border="#7c3aed" color="text-purple-600">
                    Current Block
                    {block && !block.isBreak && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                  </SHead>
                </div>
                <div className="px-4 py-4">
                  {!block ? (
                    <div className="py-7 flex flex-col items-center gap-3 text-center">
                      <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <Layers size={20} className="text-slate-200" />
                      </div>
                      <p className="text-[11px] font-semibold text-slate-400">
                        {status === "Not Started" ? "Shift has not started" : status === "Completed" ? "Shift ended" : "No active block"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={block.isBreak ? { background: "#fefce8", border: "1px solid #fde68a" } : { background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                            {block.isBreak ? <Coffee size={15} className="text-amber-600" /> : <Zap size={15} className="text-blue-600" />}
                          </div>
                          <div>
                            <div className="text-[13px] font-black text-slate-800">{block.blockName}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5">{block.isBreak ? "Scheduled break" : `Block ${block.blockNumber || ""}`}</div>
                          </div>
                        </div>
                        {block.isBreak
                          ? <Tag color="gold" className="!rounded-xl !font-bold !text-[10px] !px-3">☕ Break</Tag>
                          : <Tag color="blue" className="!rounded-xl !font-bold !text-[10px] !px-3">⚡ Active</Tag>}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div><label className={LABEL}>Start</label><div className={`${FIELD} tabular-nums font-mono text-center`}>{fmtHHMM(block.startTime)}</div></div>
                        <div><label className={LABEL}>End</label>  <div className={`${FIELD} tabular-nums font-mono text-center`}>{fmtHHMM(block.endTime)}</div></div>
                        <div><label className={LABEL}>Duration</label><div className={`${FIELD} text-center font-semibold`}>{formatHM(block.durationMinutes)}</div></div>
                      </div>
                      {!block.isBreak && block.durationMinutes > 0 && (() => {
                        const el  = Math.min(Math.max(Math.round(dayjs().diff(dayjs(block.startTime), "minute")), 0), block.durationMinutes);
                        const bp  = Math.round((el / block.durationMinutes) * 100);
                        return (
                          <div>
                            <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                              <span>Block progress</span>
                              <span className="tabular-nums font-mono">{el}m / {block.durationMinutes}m</span>
                            </div>
                            <Progress percent={bp} strokeColor={{ "0%": "#7c3aed", "100%": "#6366f1" }}
                              trailColor="#f5f3ff" size={["100%", 6]} showInfo={false} />
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* CURRENT SESSION */}
              <div className={CARD}>
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <SHead icon={Play} border="#2563eb" color="text-blue-600">
                    Current Session
                    {perf.isRunning && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                  </SHead>
                </div>
                <div className="px-4 py-4">
                  {!sess ? (
                    <div className="py-7 flex flex-col items-center gap-3 text-center">
                      <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <XCircle size={20} className="text-slate-200" />
                      </div>
                      <p className="text-[11px] font-semibold text-slate-400">No active production session</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag color="cyan" className="!rounded-xl !text-[13px] !font-black !px-3.5 !py-0.5 !m-0">{sess.modelName}</Tag>
                        {sess.activeDowntime ? (
                          <Tag color="volcano" className="!rounded-xl !text-[10px] !font-bold animate-pulse">● Downtime</Tag>
                        ) : (
                          <Tag color="green" className="!rounded-xl !text-[10px] !font-bold animate-pulse">● Running</Tag>
                        )}
                      </div>

                      {/* ── LIVE DOWNTIME BANNER ── */}
                      {sess.activeDowntime && sess.activeDowntime.startTime && (
                        <DowntimeBanner activeDowntime={sess.activeDowntime} />
                      )}

                      {/* Produced & Achievement */}
                      <div className="grid grid-cols-2 gap-2">
                        <BigN tone="blue"  label="Produced"    value={fmt0(sessProd)} />
                        <div className="rounded-xl border p-2 text-center"
                          style={{ borderColor: sessAchv.hex + "55", background: sessAchv.hex + "0d" }}>
                          <div className="text-[8px] font-bold uppercase tracking-widest opacity-50 mb-1"
                            style={{ color: sessAchv.hex }}>Achievement</div>
                          <div className="text-[20px] font-black tabular-nums leading-none"
                            style={{ color: sessAchv.hex }}>
                            {sessAchvPct !== null ? `${fmt1(sessAchvPct)}%` : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>


            {/* ── ROW 3: BLOCK PERFORMANCE ── */}
            <div className={CARD}>
              <div className="px-4 py-2.5 border-b border-slate-100">
                <SHead icon={BarChart2} border="#0891b2" color="text-cyan-600"
                  extra={<span className="text-[10px] text-slate-400">{allBlocks.filter((b) => !b.isBreak).length} production · {allBlocks.filter((b) => b.isBreak).length} break</span>}>
                  Block Performance
                </SHead>
              </div>
              <div className="px-1.5 py-1.5">
                {allBlocks.length === 0
                  ? <Empty description="No blocks generated." image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-8" />
                  : <div className="overflow-x-auto">
                      <Table size="small" rowKey={(_, i) => `b${i}`} columns={blockCols}
                        dataSource={allBlocks} pagination={false}
                        rowClassName={(r) => {
                          if (r.isBreak) return "!bg-amber-50/50";
                          if (block && !block.isBreak && r.blockNumber === block.blockNumber) return "!bg-blue-50/60";
                          return "";
                        }} />
                    </div>}
              </div>
            </div>

            {/* ── ROW 4: SESSION TIMELINE (ALL sessions) ── */}
            <div className={CARD}>
              <div className="px-4 py-2.5 border-b border-slate-100">
                <SHead icon={Activity} border="#059669" color="text-emerald-600"
                  extra={
                    <div className="flex items-center gap-2">
                      {timeline.filter((r) => r.isRunning).length > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-green-600 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          {timeline.filter((r) => r.isRunning).length} running
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">{timeline.length} total</span>
                    </div>
                  }>
                  Session Timeline
                </SHead>
              </div>
              <div className="px-1.5 py-1.5">
                {timeline.length === 0
                  ? <div className="py-10">
                      <Empty description={
                        <div className="text-center">
                          <p className="text-[11px] text-slate-400 font-semibold">No sessions yet today</p>
                          <p className="text-[9px] text-slate-300 mt-0.5">Appears when operators start production jobs.</p>
                        </div>
                      } image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    </div>
                  : <div className="overflow-x-auto">
                      <Table size="small" rowKey={(_, i) => `s${i}`} columns={tlCols}
                        dataSource={timeline} pagination={false}
                        rowClassName={(r) => r.isRunning ? "!bg-green-50/40" : ""} />
                    </div>}
              </div>
            </div>

            {/* ── ROW 5: UPCOMING BLOCKS ── */}
            {upcoming.length > 0 && (
              <div className={CARD}>
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <SHead icon={ChevronRight} border="#6366f1" color="text-indigo-500"
                    extra={<span className="text-[10px] text-slate-400">{upcoming.length} remaining</span>}>
                    Upcoming Blocks
                  </SHead>
                </div>
                <div className="px-4 py-3 flex flex-wrap gap-1.5">
                  {upcoming.slice(0, 20).map((b, i) => {
                    const cls = `flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold ${b.isBreak ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-slate-50 border-slate-200 text-slate-600"}`;
                    return (
                      <div key={i} className={cls}>
                        {b.isBreak ? <Coffee size={9} /> : <Timer size={9} />}
                        <span>{b.blockName}</span>
                        <span className="opacity-30 mx-0.5">·</span>
                        <span className="tabular-nums font-mono opacity-60">{fmtHHMM(b.startTime)}</span>
                      </div>
                    );
                  })}

                  {upcoming.length > 20 && <span className="text-[10px] text-slate-400 self-center">+{upcoming.length - 20} more</span>}
                </div>
              </div>
            )}

            {/* ── SHIFT STATUS BANNERS ── */}
            {status === "Completed" && (
              <Alert type="info" showIcon icon={<CheckCircle2 size={14} />}
                message={<span className="text-[12px] font-bold">Shift Completed</span>}
                description="This shift has ended. The data above is the final recorded state."
                className="!rounded-2xl" />
            )}
            {status === "Not Started" && (
              <Alert type="warning" showIcon icon={<AlertTriangle size={14} />}
                message={<span className="text-[12px] font-bold">Shift Not Started</span>}
                description={"This shift begins at " + fmtHHMM(shift.shiftStartTime) + ". Data will appear once production starts."}
                className="!rounded-2xl" />
            )}
          </>
        )}
      </div>

      {/* ══ STICKY FOOTER — polling heartbeat ══ */}
      {scopeReady && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-100 px-4 py-1">
          <div className="max-w-[1700px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
              <Radio size={9} className={loading && !firstLoad ? "text-teal-500 animate-pulse" : "text-slate-300"} />
              {loading && !firstLoad ? "Refreshing…" : "Auto-refreshing every 10 seconds"}
            </div>
            {lastUpdated && (
              <span className="text-[9px] text-slate-400 tabular-nums font-mono">
                Last: {fmtClock(lastUpdated)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 