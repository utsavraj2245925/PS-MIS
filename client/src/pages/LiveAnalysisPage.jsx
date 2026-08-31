// client/src/pages/LiveAnalysisPage.jsx
//
// Role-scoped, read-only, 10-second live monitoring view for Paint Shop MIS.
// Everything rendered here comes from GET /live-analysis (liveAnalysis.service.js)
// plus existing org master data (/locations, /plants, /shifts/plant/:plantId).
// No backend files touched. No mock data. No new axios instance, no new packages.

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import dayjs from "dayjs";
import {
  Select, Button, Tag, Table, Progress, Tooltip,
  Empty, Spin, Alert, Divider, Badge, Space, Row, Col,
} from "antd";
import {
  Activity, MapPin, Factory, Layers3, Clock, Clock3, Timer, RefreshCw,
  Lock, AlertTriangle, CheckCircle2, Coffee, Play, Package, Target,
  TrendingUp, Gauge, Zap, ChevronRight, ShieldCheck, Users2,
} from "lucide-react";

const API = axiosInstance;

/* ══════════════════════════════════════════════════════════
   ROLE HANDLING
══════════════════════════════════════════════════════════ */
const ROLE = { SUPER_ADMIN: "superAdmin", PLANT_ADMIN: "plantAdmin", MANAGER: "manager" };

const normalizeRole = (role) => {
  const r = String(role || "").toLowerCase().replace(/[_\s]/g, "");
  if (r === "superadmin") return ROLE.SUPER_ADMIN;
  if (r === "plantadmin") return ROLE.PLANT_ADMIN;
  if (r === "manager") return ROLE.MANAGER;
  return null;
};

const ROLE_LABEL = {
  [ROLE.SUPER_ADMIN]: "Super Admin",
  [ROLE.PLANT_ADMIN]: "Plant Admin",
  [ROLE.MANAGER]: "Manager",
};

const resolveId = (val) => (val && typeof val === "object" ? val._id : val);

/* ══════════════════════════════════════════════════════════
   TIME HELPERS — mirrors UserProductionPage's activeShift logic exactly.
══════════════════════════════════════════════════════════ */
const parseHM = (t) => {
  if (!t || typeof t !== "string" || !t.includes(":")) return [0, 0];
  const [h, m] = t.split(":").map(Number);
  return [h || 0, m || 0];
};

const findCurrentShift = (shiftList, now) => {
  if (!shiftList?.length) return null;
  const nowMin = now.hour() * 60 + now.minute();
  return shiftList.find((s) => {
    const [sh, sm] = parseHM(s.shiftStartTime);
    const [eh, em] = parseHM(s.shiftEndTime);
    let startMin = sh * 60 + sm;
    let endMin = eh * 60 + em;
    if (endMin <= startMin) endMin += 1440; // overnight
    const nm = nowMin < startMin ? nowMin + 1440 : nowMin;
    return nm >= startMin && nm < endMin;
  }) || null;
};

const fmtNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n).toLocaleString() : "0";
};
const fmtPct = (v) => {
  const n = Number(v);
  return `${Number.isFinite(n) ? n.toFixed(1).replace(/\.0$/, "") : "0"}%`;
};
const fmtMinutes = (mins) => {
  const m = Math.max(Math.round(Number(mins) || 0), 0);
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
};
const fmtTime = (val) => (val ? dayjs(val).format("HH:mm") : "—");

const achvTone = (pct) => {
  const n = Number(pct);
  if (!Number.isFinite(n)) return "slate";
  return n >= 100 ? "green" : n >= 70 ? "amber" : "red";
};

const SHIFT_STATUS_META = {
  "Not Started": { color: "default", icon: Clock, label: "Not Started", tone: "slate" },
  Running: { color: "green", icon: Play, label: "Running", tone: "green" },
  Break: { color: "gold", icon: Coffee, label: "Break", tone: "amber" },
  Completed: { color: "default", icon: CheckCircle2, label: "Completed", tone: "slate" },
};

/* ══════════════════════════════════════════════════════════
   SHARED UI TOKENS
══════════════════════════════════════════════════════════ */
const CARD = "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden";

const TONE = {
  blue:   { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   chip: "bg-blue-100" },
  teal:   { bg: "bg-teal-50",   border: "border-teal-200",   text: "text-teal-700",   chip: "bg-teal-100" },
  amber:  { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700",  chip: "bg-amber-100" },
  cyan:   { bg: "bg-cyan-50",   border: "border-cyan-200",   text: "text-cyan-700",   chip: "bg-cyan-100" },
  green:  { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700",  chip: "bg-green-100" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", chip: "bg-purple-100" },
  red:    { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700",    chip: "bg-red-100" },
  slate:  { bg: "bg-slate-50",  border: "border-slate-200",  text: "text-slate-700",  chip: "bg-slate-100" },
};

const SectionHead = ({ icon: Icon, color = "text-teal-600", border = "#0d9488", children, extra }) => (
  <div className="flex items-center justify-between w-full">
    <div className="flex items-center gap-1.5" style={{ borderLeft: `2px solid ${border}`, paddingLeft: 8 }}>
      <Icon size={13} className={color} />
      <h2 className="text-[13px] font-bold text-slate-800 m-0 tracking-wide">{children}</h2>
    </div>
    {extra}
  </div>
);

const FullPageSpin = ({ label }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/10 backdrop-blur-md">
    <div className="flex flex-col items-center gap-4 bg-white/80 backdrop-blur-2xl border border-white shadow-2xl shadow-slate-900/10 rounded-2xl px-10 py-8">
      <Spin size="large" />
      <span className="text-slate-500 text-sm font-medium tracking-wide">{label}</span>
    </div>
  </div>
);

const FieldLabel = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-1 mb-1">
    {Icon && <Icon size={10} className="text-slate-400" />}
    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{children}</span>
  </div>
);

const SelectField = ({ icon, label, hint, ...props }) => (
  <div>
    <FieldLabel icon={icon}>{label}</FieldLabel>
    <Select className="w-full" {...props} />
    {hint}
  </div>
);

const LockedField = ({ icon, label, value }) => (
  <div>
    <FieldLabel icon={icon}>{label}</FieldLabel>
    <Tooltip title="Locked — assigned to your role">
      <div className="h-8 rounded-lg border border-slate-200 bg-slate-100 px-2.5 flex items-center justify-between">
        <span className="text-[12px] font-semibold text-slate-600 truncate">{value || "—"}</span>
        <Lock size={11} className="text-slate-400 flex-shrink-0 ml-1.5" />
      </div>
    </Tooltip>
  </div>
);

const ShiftStatusTag = ({ status, light }) => {
  const meta = SHIFT_STATUS_META[status] || SHIFT_STATUS_META["Not Started"];
  const Icon = meta.icon;
  if (light) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
        <Icon size={11} /> {meta.label}
      </span>
    );
  }
  return (
    <Tag color={meta.color} className="!rounded-lg !font-bold !text-[11px]">
      <Icon size={11} className="inline -mt-0.5 mr-1" />{meta.label}
    </Tag>
  );
};

const RoleBadge = ({ role }) => (
  <span className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wide">
    <ShieldCheck size={11} /> {ROLE_LABEL[role] || role}
  </span>
);

/* Tone-coded KPI tile — matches UserProductionPage's KpiCard language. */
const KpiTile = ({ icon: Icon, label, value, tone = "slate", progress }) => {
  const t = TONE[tone];
  return (
    <div className={`rounded-xl border p-3 shadow-sm flex flex-col gap-1.5 w-full h-full ${t.bg} ${t.border} ${t.text}`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${t.chip}`}>
        <Icon size={14} />
      </div>
      <div className="text-xl font-extrabold leading-none mt-0.5 tabular-nums truncate">{value}</div>
      <div className="text-[9px] font-bold opacity-70 uppercase tracking-wider">{label}</div>
      {typeof progress === "number" && (
        <div className="w-full h-1 rounded-full bg-white/60 overflow-hidden mt-0.5">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%`, backgroundColor: "currentColor" }}
          />
        </div>
      )}
    </div>
  );
};

/* Tone-coded stat box used inside Current Block / Current Session cards */
const StatBox = ({ label, value, tone = "slate", full }) => {
  const t = TONE[tone];
  return (
    <div className={full ? "col-span-full" : ""}>
      <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</div>
      <div className={`rounded-lg border px-2.5 py-1.5 text-[12px] font-bold truncate ${t.bg} ${t.border} ${t.text}`}>
        {value ?? "—"}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function LiveAnalysisPage() {
  const { user, loading: authLoading } = useAuth();
  const role = normalizeRole(user?.role);

  /* ── 1s clock, corrected against backend serverTime once we have it ── */
  const [now, setNow] = useState(dayjs());
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(t);
  }, []);
  const syncedNow = useMemo(() => now.add(serverOffsetMs, "millisecond"), [now, serverOffsetMs]);

  /* ── org master data ── */
  const [locations, setLocations] = useState([]);
  const [plants, setPlants] = useState([]);
  const [masterLoading, setMasterLoading] = useState(true);
  const [masterError, setMasterError] = useState(null);

  const loadMasterData = useCallback(async () => {
    setMasterLoading(true);
    setMasterError(null);
    try {
      const [locRes, plantRes] = await Promise.all([API.get("/locations"), API.get("/plants")]);
      setLocations(locRes.data?.locations || locRes.data?.data || []);
      setPlants(plantRes.data?.plants || plantRes.data?.data || []);
    } catch (err) {
      setMasterError(err?.response?.data?.message || "Unable to load organization data.");
    } finally {
      setMasterLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    loadMasterData();
  }, [authLoading, user?._id, loadMasterData]);

  /* ── selection state (only what each role is actually allowed to change) ── */
  const [locationId, setLocationId] = useState(null);
  const [plantId, setPlantId] = useState(null);
  const [shiftId, setShiftId] = useState(null);
  const [conveyorId, setConveyorId] = useState(null);

  const userLocationId = resolveId(user?.locationId);
  const userPlantId = resolveId(user?.plantId);

  const assignedPlant = useMemo(() => {
    if (role !== ROLE.MANAGER || !userPlantId) return null;
    return plants.find((p) => p._id === userPlantId) || null;
  }, [role, userPlantId, plants]);
  const assignedLocationIdForManager = assignedPlant ? resolveId(assignedPlant.locationId) : null;

  // Effective scope per role — this is the single source of truth used to
  // build query params, so a role can never accidentally query outside its
  // own authorized scope, matching resolveRoleAwareLiveScope on the backend.
  const effectiveLocationId =
    role === ROLE.SUPER_ADMIN ? locationId
    : role === ROLE.PLANT_ADMIN ? userLocationId
    : role === ROLE.MANAGER ? assignedLocationIdForManager
    : null;

  const effectivePlantId =
    role === ROLE.SUPER_ADMIN ? plantId
    : role === ROLE.PLANT_ADMIN ? plantId
    : role === ROLE.MANAGER ? userPlantId
    : null;

  const lockedLocationName = useMemo(() => {
    if (role === ROLE.PLANT_ADMIN) return locations.find((l) => l._id === userLocationId)?.locationName || "—";
    if (role === ROLE.MANAGER) {
      return locations.find((l) => l._id === assignedLocationIdForManager)?.locationName
        || assignedPlant?.locationName || "—";
    }
    return null;
  }, [role, locations, userLocationId, assignedLocationIdForManager, assignedPlant]);

  const plantOptions = useMemo(() => {
    if (role === ROLE.SUPER_ADMIN) {
      if (!locationId) return [];
      return plants.filter((p) => resolveId(p.locationId) === locationId && p.status !== "Inactive");
    }
    if (role === ROLE.PLANT_ADMIN) {
      return plants.filter((p) => resolveId(p.locationId) === userLocationId && p.status !== "Inactive");
    }
    return [];
  }, [role, plants, locationId, userLocationId]);

  const selectedPlantObj = useMemo(
    () => plants.find((p) => p._id === effectivePlantId) || null,
    [plants, effectivePlantId]
  );

  const conveyorOptions = useMemo(
    () => (selectedPlantObj?.conveyors || []).filter((c) => c.status === "Active"),
    [selectedPlantObj]
  );

  /* ── cascading clears — parent change always wipes dependent children ── */
  const handleLocationChange = (v) => {
    setLocationId(v); setPlantId(null); setShiftId(null); setConveyorId(null);
    setShifts([]);
  };
  const handlePlantChange = (v) => {
    setPlantId(v); setShiftId(null); setConveyorId(null);
    setShifts([]);
  };
  const handleShiftChange = (v) => { setShiftId(v); setConveyorId(null); };
  const handleConveyorChange = (v) => setConveyorId(v || null);

  /* ── shifts for the effective plant ── */
  const [shifts, setShifts] = useState([]);
  const [shiftsLoading, setShiftsLoading] = useState(false);
  const [shiftsError, setShiftsError] = useState(null);

  const loadShiftsForPlant = useCallback(async (pid) => {
    if (!pid) { setShifts([]); return; }
    setShiftsLoading(true);
    setShiftsError(null);
    try {
      const { data } = await API.get(`/shifts/plant/${pid}`);
      setShifts((data?.data || []).filter((s) => s.status !== "Inactive"));
    } catch (err) {
      setShiftsError(err?.response?.data?.message || "Unable to load shifts for this plant.");
      setShifts([]);
    } finally {
      setShiftsLoading(false);
    }
  }, []);

  useEffect(() => { loadShiftsForPlant(effectivePlantId); }, [effectivePlantId, loadShiftsForPlant]);

  /* ── auto-select current shift once, don't fight a manual pick ── */
  useEffect(() => {
    if (!shifts.length || shiftId) return;
    const current = findCurrentShift(shifts, now);
    if (current) setShiftId(current._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shifts]);

  const currentShiftId = useMemo(() => findCurrentShift(shifts, now)?._id || null, [shifts, now]);

  /* ── live analysis scope readiness + query params (mirrors backend exactly) ── */
  const canFetchLive = useMemo(() => {
    if (role === ROLE.SUPER_ADMIN) return !!(effectiveLocationId && effectivePlantId && shiftId);
    if (role === ROLE.PLANT_ADMIN) return !!(effectivePlantId && shiftId);
    if (role === ROLE.MANAGER) return !!shiftId;
    return false;
  }, [role, effectiveLocationId, effectivePlantId, shiftId]);

  const liveParams = useMemo(() => {
    if (!canFetchLive) return null;
    const p = { shiftId };
    if (role === ROLE.SUPER_ADMIN) { p.locationId = effectiveLocationId; p.plantId = effectivePlantId; }
    if (role === ROLE.PLANT_ADMIN) { p.plantId = effectivePlantId; }
    // Manager sends neither locationId nor plantId — backend derives both
    // from the authenticated user, exactly as resolveRoleAwareLiveScope does.
    if (conveyorId) p.conveyorId = conveyorId;
    return p;
  }, [canFetchLive, role, effectiveLocationId, effectivePlantId, shiftId, conveyorId]);
  const liveParamsKey = liveParams ? JSON.stringify(liveParams) : null;

  /* ── live analysis fetch + exactly-10s polling, no overlap ── */
  const [liveData, setLiveData] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveRefreshing, setLiveRefreshing] = useState(false);
  const [liveError, setLiveError] = useState(null);
  const pollRef = useRef(null);
  const fetchingRef = useRef(false);

  const fetchLive = useCallback(async ({ background } = {}) => {
    if (!liveParams || fetchingRef.current) return;
    fetchingRef.current = true;
    if (background) setLiveRefreshing(true); else setLiveLoading(true);
    setLiveError(null);
    try {
      const { data } = await API.get("/live-analysis", { params: liveParams });
      setLiveData(data?.data || null);
      if (data?.data?.serverTime) setServerOffsetMs(new Date(data.data.serverTime).getTime() - Date.now());
    } catch (err) {
      setLiveError(err?.response?.data?.message || "Unable to load Live Analysis data.");
    } finally {
      fetchingRef.current = false;
      if (background) setLiveRefreshing(false); else setLiveLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveParamsKey]);

  useEffect(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (!liveParamsKey) { setLiveData(null); return; }

    setLiveData(null); // new scope — drop stale data, show initial spinner
    fetchLive({ background: false });

    pollRef.current = setInterval(() => fetchLive({ background: true }), 10000);
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveParamsKey]);

  /* ── shift timer, corrected against serverTime ── */
  const shiftInfo = liveData?.shift;
  const totalShiftMin = shiftInfo?.totalShiftMinutes || 0;
  let elapsedMin = 0, remainingMin = 0;
  if (shiftInfo?.shiftStartTime && shiftInfo?.shiftEndTime) {
    if (shiftInfo.status === "Not Started") { elapsedMin = 0; remainingMin = totalShiftMin; }
    else if (shiftInfo.status === "Completed") { elapsedMin = totalShiftMin; remainingMin = 0; }
    else {
      elapsedMin = Math.max(syncedNow.diff(dayjs(shiftInfo.shiftStartTime), "minute"), 0);
      remainingMin = Math.max(dayjs(shiftInfo.shiftEndTime).diff(syncedNow, "minute"), 0);
    }
  }
  const shiftProgressPct = totalShiftMin > 0 ? Math.min(100, Math.round((elapsedMin / totalShiftMin) * 100)) : 0;
  const shiftMeta = SHIFT_STATUS_META[shiftInfo?.status] || SHIFT_STATUS_META["Not Started"];
  const shiftToneBg = { green: "bg-green-50 border-green-200", amber: "bg-amber-50 border-amber-200", slate: "bg-slate-50 border-slate-200" }[shiftMeta.tone];
  const shiftProgressColor = { green: "#16a34a", amber: "#d97706", slate: "#94a3b8" }[shiftMeta.tone];

  /* ── current block elapsed/remaining, corrected against serverTime ── */
  let blockElapsedMin = 0, blockRemainingMin = 0;
  if (liveData?.currentBlock?.startTime && liveData?.currentBlock?.endTime) {
    blockElapsedMin = Math.max(syncedNow.diff(dayjs(liveData.currentBlock.startTime), "minute"), 0);
    blockRemainingMin = Math.max(dayjs(liveData.currentBlock.endTime).diff(syncedNow, "minute"), 0);
  }

  /* ── multiple concurrent LIVE sessions — surfaced, never hidden/filtered ── */
  const liveSessionCount = useMemo(
    () => (liveData?.timeline || []).filter((r) => r.isRunning).length,
    [liveData]
  );

  /* ── breadcrumb pills ── */
  const breadcrumbParts = useMemo(() => {
    const locName = liveData?.scope?.locationName || locations.find((l) => l._id === effectiveLocationId)?.locationName || lockedLocationName;
    const plantName = liveData?.scope?.plantName || selectedPlantObj?.plantName;
    const shiftName = liveData?.scope?.shiftName || shifts.find((s) => s._id === shiftId)?.shiftName;
    const convName = conveyorOptions.find((c) => c._id === conveyorId)?.conveyorName;
    return [locName, plantName, shiftName, convName].filter((v) => v && v !== "—");
  }, [liveData, locations, effectiveLocationId, lockedLocationName, selectedPlantObj, shifts, shiftId, conveyorOptions, conveyorId]);

  /* ── table columns ── */
  const blockColumns = useMemo(() => [
    { title: "Block", dataIndex: "blockLabel", key: "block",
      render: (v) => <span className="font-semibold text-slate-700">{v}</span> },
    { title: "Type", dataIndex: "blockType", key: "type", width: 100,
      render: (v, r) => <Tag color={r.isBreak ? "gold" : "blue"} className="!rounded-lg !text-[11px]">{r.isBreak ? "BREAK" : v}</Tag> },
    { title: "Start", dataIndex: "startTime", key: "start", width: 76, align: "center", render: fmtTime },
    { title: "End", dataIndex: "endTime", key: "end", width: 76, align: "center", render: fmtTime },
    { title: "Duration", dataIndex: "durationMinutes", key: "dur", width: 90, align: "center",
      render: (v) => <Tag color="geekblue" className="!rounded-lg !text-[11px]">{fmtMinutes(v)}</Tag> },
    { title: "Production Qty", dataIndex: "productionQty", key: "qty", width: 110, align: "center",
      render: (v, r) => r.isBreak ? <span className="text-slate-300">—</span> : <span className="font-bold text-slate-800">{fmtNum(v)}</span> },
    { title: "Rate/hr", dataIndex: "productionRatePerHour", key: "rate", width: 90, align: "center",
      render: (v, r) => r.isBreak ? <span className="text-slate-300">—</span> : fmtNum(v) },
    { title: "Status", key: "status", width: 100, align: "center",
      render: (_, r) => {
        const rowStart = dayjs(r.startTime).valueOf();
        const rowEnd = dayjs(r.endTime).valueOf();
        const curStart = liveData?.currentBlock?.startTime ? dayjs(liveData.currentBlock.startTime).valueOf() : null;
        if (curStart && rowStart === curStart) return <Tag color="green" className="!rounded-lg !text-[11px]">Live</Tag>;
        if (syncedNow.valueOf() >= rowEnd) return <Tag className="!rounded-lg !text-[11px]">Completed</Tag>;
        return <Tag color="processing" className="!rounded-lg !text-[11px]">Upcoming</Tag>;
      } },
  ], [liveData, syncedNow]);

  // Session Timeline faithfully renders every row the backend returns —
  // including multiple concurrent Running sessions. Nothing is filtered
  // or deduplicated here; see the "N Live" badge on the section header.
  const timelineColumns = useMemo(() => [
    { title: "Model", dataIndex: "modelName", key: "model",
      render: (v, r) => (
        <span className="flex items-center gap-1.5">
          <Tag color="cyan" className="!rounded-lg !text-[11px] !font-semibold !m-0">{v}</Tag>
          {r.isRunning && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />}
        </span>
      ) },
    { title: "Start", dataIndex: "startTime", key: "start", width: 76, align: "center", render: fmtTime },
    { title: "End", dataIndex: "endTime", key: "end", width: 76, align: "center",
      render: (v, r) => r.isRunning ? <Tag color="red" className="!rounded-lg !text-[10px]">LIVE</Tag> : fmtTime(v) },
    { title: "Production Qty", dataIndex: "productionQty", key: "qty", width: 110, align: "center",
      render: (v) => <span className="font-bold text-slate-800">{fmtNum(v)}</span> },
    { title: "Running Time", dataIndex: "runningTime", key: "running", width: 100, align: "center" },
    { title: "Downtime", dataIndex: "downtimeMinutes", key: "downtime", width: 90, align: "center", render: fmtMinutes },
    { title: "Rate/hr", dataIndex: "averageProductionRate", key: "rate", width: 90, align: "center", render: fmtNum },
    { title: "Achievement", dataIndex: "achievementPercent", key: "achv", width: 100, align: "center",
      render: (v) => <Tag color={achvTone(v)} className="!rounded-lg !text-[11px] !font-bold">{fmtPct(v)}</Tag> },
    { title: "Status", dataIndex: "status", key: "status", width: 100, align: "center",
      render: (v, r) => {
        const s = String(v || "").toLowerCase();
        const color = r.isRunning ? "green" : s === "cancelled" ? "red" : s === "completed" ? "default" : "default";
        const label = r.isRunning ? "Running" : s === "cancelled" ? "Cancelled" : v || "Completed";
        return <Tag color={color} className="!rounded-lg !text-[11px] !font-semibold">{label}</Tag>;
      } },
  ], []);

  const upcomingColumns = useMemo(() => [
    { title: "Block", dataIndex: "blockName", key: "block" },
    { title: "Start", dataIndex: "startTime", key: "start", width: 76, align: "center", render: fmtTime },
    { title: "End", dataIndex: "endTime", key: "end", width: 76, align: "center", render: fmtTime },
    { title: "Duration", dataIndex: "durationMinutes", key: "dur", width: 90, align: "center", render: fmtMinutes },
    { title: "Type", dataIndex: "type", key: "type", width: 90, align: "center",
      render: (v, r) => <Tag color={r.isBreak ? "gold" : "blue"} className="!rounded-lg !text-[11px]">{r.isBreak ? "BREAK" : v}</Tag> },
  ], []);

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  if (authLoading) return <FullPageSpin label="Authenticating..." />;
  if (!user) return null;

  if (!role) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Alert type="error" showIcon message="Not authorized" description="Your account role is not recognized for Live Analysis." className="!rounded-xl !max-w-md" />
      </div>
    );
  }

  if (masterLoading) return <FullPageSpin label="Loading organization data..." />;

  const scopeHint =
    role === ROLE.SUPER_ADMIN ? "Select Location → Plant → Shift to view Live Analysis"
    : role === ROLE.PLANT_ADMIN ? "Select Plant → Shift to view Live Analysis"
    : "Select a Shift to view Live Analysis";

  return (
    <div className="min-h-screen bg-slate-50 p-3 space-y-3 max-w-[1600px] mx-auto">

      {/* ── HEADER ── */}
      <div className="rounded-2xl overflow-hidden shadow-md relative" style={{ background: "linear-gradient(135deg,#0E7490,#0891B2)" }}>
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 85% 20%, white 0%, transparent 45%)" }} />
        <div className="px-4 py-3.5 flex items-center justify-between flex-wrap gap-3 relative">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center flex-shrink-0">
              <Activity size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-white font-extrabold text-sm tracking-wide">LIVE PRODUCTION ANALYSIS</div>
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                {breadcrumbParts.length ? breadcrumbParts.map((part, i) => (
                  <span key={`${part}-${i}`} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight size={9} className="text-white/40" />}
                    <span className="text-[10px] font-semibold text-white/90 bg-white/10 border border-white/15 rounded-md px-1.5 py-0.5">
                      {part}
                    </span>
                  </span>
                )) : (
                  <span className="text-white/60 text-[10px]">Select scope below to begin</span>
                )}
              </div>
            </div>
          </div>
          <Space size={8}>
            {liveData?.shift?.status && <ShiftStatusTag status={liveData.shift.status} light />}
            <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-lg px-2.5 py-1">
              <Clock size={11} className="text-white/70" />
              <span className="text-white text-[11px] font-mono tabular-nums">
                {liveData?.lastUpdatedAt ? dayjs(liveData.lastUpdatedAt).format("HH:mm:ss") : "—"}
              </span>
              {liveRefreshing && <Spin size="small" />}
            </div>
            <Tooltip title="Refresh now">
              <Button
                size="small" icon={<RefreshCw size={13} />} loading={liveRefreshing}
                onClick={() => fetchLive({ background: true })} disabled={!canFetchLive}
                className="!rounded-lg !border-white/25 !bg-white/10 !text-white hover:!bg-white/20"
              />
            </Tooltip>
          </Space>
        </div>
      </div>

      {masterError && (
        <Alert type="error" showIcon message="Unable to load organization data." description={masterError}
          action={<Button size="small" danger onClick={loadMasterData}>Retry</Button>} className="!rounded-xl" />
      )}

      {/* ── FILTERS ── */}
      <div className={CARD}>
        <div className="px-3.5 py-2.5 border-b border-slate-100">
          <SectionHead icon={Layers3} border="#0d9488" color="text-teal-600"
            extra={<RoleBadge role={role} />}>
            Filter Scope
          </SectionHead>
        </div>
        <div className="px-4 py-3.5 space-y-2.5">
          <Row gutter={[10, 10]}>
            <Col xs={24} sm={12} md={6}>
              {role === ROLE.SUPER_ADMIN ? (
                <SelectField
                  icon={MapPin} label="Location" placeholder="Select location" showSearch optionFilterProp="label"
                  value={locationId} onChange={handleLocationChange}
                  options={locations.map((l) => ({ value: l._id, label: l.locationName }))}
                  notFoundContent={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No locations found" />}
                />
              ) : (
                <LockedField icon={MapPin} label="Location" value={lockedLocationName} />
              )}
            </Col>

            <Col xs={24} sm={12} md={6}>
              {role === ROLE.MANAGER ? (
                <LockedField icon={Factory} label="Plant" value={assignedPlant?.plantName} />
              ) : (
                <SelectField
                  icon={Factory} label="Plant"
                  placeholder={role === ROLE.SUPER_ADMIN && !locationId ? "Select a location first" : "Select plant"}
                  disabled={role === ROLE.SUPER_ADMIN && !locationId}
                  showSearch optionFilterProp="label"
                  value={plantId} onChange={handlePlantChange}
                  options={plantOptions.map((p) => ({ value: p._id, label: p.plantName }))}
                  notFoundContent={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No plants under this location" />}
                />
              )}
            </Col>

            <Col xs={24} sm={12} md={6}>
              <SelectField
                icon={Clock} label="Shift"
                placeholder={!effectivePlantId ? "Select a plant first" : "Select shift"}
                disabled={!effectivePlantId} loading={shiftsLoading}
                value={shiftId} onChange={handleShiftChange}
                options={shifts.map((s) => ({
                  value: s._id,
                  label: `${s.shiftName}${s.shiftType ? ` — ${s.shiftType}` : ""}${s._id === currentShiftId ? " • Now" : ""}`,
                }))}
                notFoundContent={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No shifts configured for this plant" />}
                hint={
                  !shiftsLoading && shifts.length > 0 && !currentShiftId && !shiftId ? (
                    <div className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle size={10} /> Currently no active shift — select one manually
                    </div>
                  ) : null
                }
              />
              {shiftsError && <div className="text-[10px] text-red-500 mt-1">{shiftsError}</div>}
            </Col>

            <Col xs={24} sm={12} md={6}>
              <SelectField
                icon={Layers3} label="Conveyor (optional)"
                placeholder={!shiftId ? "Select a shift first" : "All conveyors on this shift"}
                disabled={!shiftId} allowClear
                value={conveyorId} onChange={handleConveyorChange}
                options={conveyorOptions.map((c) => ({ value: c._id, label: c.conveyorName }))}
                notFoundContent={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No active conveyors on this plant" />}
              />
            </Col>
          </Row>

          <Divider style={{ margin: "6px 0" }} />

          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              {canFetchLive ? "Live Analysis refreshes every 10 seconds" : scopeHint}
            </span>
            {liveData?.shift?.status && <ShiftStatusTag status={liveData.shift.status} />}
          </div>
        </div>
      </div>

      {/* ── NOTHING SELECTED YET ── */}
      {!canFetchLive && (
        <div className={CARD}>
          <div className="py-12">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={scopeHint} />
          </div>
        </div>
      )}

      {/* ── LIVE ANALYSIS ── */}
      {canFetchLive && (
        <>
          {liveError && (
            <Alert
              type="error" showIcon message="Unable to load Live Analysis" description={liveError}
              action={<Button size="small" danger onClick={() => fetchLive({ background: false })}>Retry</Button>}
              className="!rounded-xl"
            />
          )}

          {liveLoading && !liveData && (
            <div className={CARD}><div className="py-16 flex justify-center"><Spin size="large" /></div></div>
          )}

          {liveData && (
            <>
              {/* Shift Timer — status-colored, clock synced to serverTime */}
              <div className={`${CARD} border ${shiftToneBg}`}>
                <div className="px-4 py-3.5 flex items-center justify-between flex-wrap gap-4">
                  <div className="min-w-[140px]">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${shiftMeta.tone === "green" ? "bg-green-500 animate-pulse" : shiftMeta.tone === "amber" ? "bg-amber-500 animate-pulse" : "bg-slate-400"}`} />
                      {liveData.scope.shiftName || "Shift"}
                    </div>
                    <div className="text-base font-mono font-extrabold text-slate-800 mt-1 tabular-nums">
                      {fmtTime(liveData.shift.shiftStartTime)} — {fmtTime(liveData.shift.shiftEndTime)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Elapsed</div>
                    <div className="text-lg font-mono font-extrabold text-teal-700 tabular-nums leading-tight">{fmtMinutes(elapsedMin)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Remaining</div>
                    <div className="text-lg font-mono font-extrabold text-slate-700 tabular-nums leading-tight">{fmtMinutes(remainingMin)}</div>
                  </div>
                  <div className="flex-1 min-w-[160px] flex items-center gap-2.5">
                    <Progress
                      percent={shiftProgressPct} size="small" showInfo={false}
                      strokeColor={shiftProgressColor} trailColor="#e2e8f0" strokeLinecap="round"
                      className="!flex-1"
                    />
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: shiftProgressColor }}>{shiftProgressPct}%</span>
                  </div>
                </div>
              </div>

              {/* KPI Row — exactly the 8 metrics specified, in order */}
              <Row gutter={[10, 10]}>
                <Col xs={12} sm={8} md={6} lg={3}>
                  <KpiTile icon={Package} label="Total Production" value={fmtNum(liveData.summary?.totalProduction)} tone="blue" />
                </Col>
                <Col xs={12} sm={8} md={6} lg={3}>
                  <KpiTile icon={Target} label="Total Target" value={fmtNum(liveData.summary?.totalTarget)} tone="purple" />
                </Col>
                <Col xs={12} sm={8} md={6} lg={3}>
                  <KpiTile
                    icon={TrendingUp} label="Achievement" value={fmtPct(liveData.summary?.achievementPercent)}
                    tone={achvTone(liveData.summary?.achievementPercent)}
                    progress={Number(liveData.summary?.achievementPercent) || 0}
                  />
                </Col>
                <Col xs={12} sm={8} md={6} lg={3}>
                  <KpiTile icon={Timer} label="Running Time" value={fmtMinutes(liveData.summary?.totalRunningMinutes)} tone="teal" />
                </Col>
                <Col xs={12} sm={8} md={6} lg={3}>
                  <KpiTile icon={Clock3} label="Downtime" value={fmtMinutes(liveData.summary?.totalDowntimeMinutes)} tone="amber" />
                </Col>
                <Col xs={12} sm={8} md={6} lg={3}>
                  <KpiTile icon={Gauge} label="Avg Rate / hr" value={fmtNum(liveData.summary?.averageProductionRate)} tone="cyan" />
                </Col>
                <Col xs={12} sm={8} md={6} lg={3}>
                  <KpiTile icon={CheckCircle2} label="Completed Models" value={fmtNum(liveData.summary?.completedModels)} tone="green" />
                </Col>
                <Col xs={12} sm={8} md={6} lg={3}>
                  <KpiTile icon={Zap} label="Active Model" value={liveData.summary?.activeModel ? "Running" : "Idle"} tone={liveData.summary?.activeModel ? "green" : "slate"} />
                </Col>
              </Row>

              {/* Current Block + Current Session */}
              <Row gutter={[10, 10]}>
                <Col xs={24} md={12}>
                  <div className={`${CARD} h-full`}>
                    <div className="px-3.5 py-2.5 border-b border-slate-100">
                      <SectionHead icon={Layers3} border="#0d9488" color="text-teal-600"
                        extra={liveData.currentBlock?.isBreak && (
                          <Tag color="gold" className="!rounded-lg !font-bold !text-[10px]"><Coffee size={10} className="inline -mt-0.5 mr-1" />BREAK</Tag>
                        )}>
                        Current Block
                      </SectionHead>
                    </div>
                    <div className="px-4 py-3.5">
                      {!liveData.currentBlock ? (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            liveData.shift.status === "Not Started" ? "Shift not started"
                            : liveData.shift.status === "Completed" ? "Shift completed"
                            : "No active block"
                          }
                          className="py-4"
                        />
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <StatBox full label="Block" value={liveData.currentBlock.blockName} tone={liveData.currentBlock.isBreak ? "amber" : "teal"} />
                          <StatBox label="Type" value={liveData.currentBlock.isBreak ? "Break" : "Production"} tone={liveData.currentBlock.isBreak ? "amber" : "blue"} />
                          <StatBox label="Duration" value={fmtMinutes(liveData.currentBlock.durationMinutes)} tone="slate" />
                          <StatBox label="Start" value={fmtTime(liveData.currentBlock.startTime)} tone="slate" />
                          <StatBox label="End" value={fmtTime(liveData.currentBlock.endTime)} tone="slate" />
                          <StatBox label="Elapsed" value={fmtMinutes(blockElapsedMin)} tone="cyan" />
                          <StatBox label="Remaining" value={fmtMinutes(blockRemainingMin)} tone="purple" />
                        </div>
                      )}
                    </div>
                  </div>
                </Col>

                <Col xs={24} md={12}>
                  <div className={`${CARD} h-full`}>
                    <div className="px-3.5 py-2.5 border-b border-slate-100">
                      <SectionHead icon={Activity} border="#2563eb" color="text-blue-600">Current Production Session</SectionHead>
                    </div>
                    <div className="px-4 py-3.5">
                      {!liveData.currentSession ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No active production session" className="py-4" />
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <StatBox full label="Model" value={liveData.currentSession.modelName} tone="cyan" />
                          <StatBox label="Status" value={liveData.currentSession.status} tone={liveData.currentSession.performance?.isRunning ? "green" : "slate"} />
                          <StatBox label="Quantity" value={fmtNum(liveData.currentSession.performance?.quantity)} tone="blue" />
                          <StatBox label="Target" value={fmtNum(liveData.currentSession.performance?.target)} tone="purple" />
                          <StatBox label="Achievement" value={fmtPct(liveData.currentSession.performance?.achievementPercent)} tone={achvTone(liveData.currentSession.performance?.achievementPercent)} />
                          <StatBox label="Running Time" value={liveData.currentSession.performance?.runningTime} tone="slate" />
                          <StatBox label="Downtime" value={fmtMinutes(liveData.currentSession.performance?.downtimeMinutes)} tone="amber" />
                          <StatBox label="Average Rate" value={`${fmtNum(liveData.currentSession.performance?.averageProductionRate)}/hr`} tone="teal" />
                        </div>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Session Timeline — every running session is shown, none hidden */}
              <div className={CARD}>
                <div className="px-3.5 py-2.5 border-b border-slate-100">
                  <SectionHead
                    icon={Timer} border="#7c3aed" color="text-purple-600"
                    extra={
                      <Space size={6}>
                        {liveSessionCount > 1 && (
                          <Tag color="red" className="!rounded-lg !font-bold !text-[10px] !m-0">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-1 animate-pulse" />
                            {liveSessionCount} Live
                          </Tag>
                        )}
                        <Badge count={liveData.timeline?.length || 0} showZero style={{ backgroundColor: "#7c3aed" }} />
                      </Space>
                    }
                  >
                    Session Timeline
                  </SectionHead>
                </div>
                <div className="px-3.5 py-3">
                  <Table
                    size="small" rowKey={(r) => r.sessionId}
                    columns={timelineColumns} dataSource={liveData.timeline || []}
                    pagination={{ pageSize: 8, hideOnSinglePage: true }} scroll={{ x: 880 }}
                    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No production sessions yet" /> }}
                  />
                </div>
              </div>

              {/* Upcoming Blocks */}
              <div className={CARD}>
                <div className="px-3.5 py-2.5 border-b border-slate-100">
                  <SectionHead icon={Clock3} border="#d97706" color="text-amber-600">Upcoming Blocks</SectionHead>
                </div>
                <div className="px-3.5 py-3">
                  <Table
                    size="small" rowKey={(r) => `${r.blockName}-${r.startTime}`}
                    columns={upcomingColumns} dataSource={liveData.blocks?.upcoming || []}
                    pagination={false} scroll={{ x: 500 }}
                    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No upcoming blocks" /> }}
                  />
                </div>
              </div>

              {/* Block Performance — full-shift log */}
              <div className={CARD}>
                <div className="px-3.5 py-2.5 border-b border-slate-100">
                  <SectionHead icon={Layers3} border="#0891b2" color="text-cyan-700">Block Performance — Full Shift Log</SectionHead>
                </div>
                <div className="px-3.5 py-3">
                  <Table
                    size="small" rowKey={(r) => `${r.blockLabel}-${r.startTime}`}
                    columns={blockColumns} dataSource={liveData.blocks?.all || []}
                    pagination={false} scroll={{ x: 760 }}
                    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No blocks for this shift" /> }}
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}