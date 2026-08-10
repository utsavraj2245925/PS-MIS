import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import {
  Select, Input, InputNumber,
  Button, Tag, Tooltip, message, Spin, Empty, Modal, Table,
} from "antd";
import {
  Factory, Package, AlertTriangle, Users, Clock3, FlaskConical,
  RefreshCcw, Download, Save, Plus, Trash2, ShieldAlert, RotateCcw, ArrowLeft,
  CalendarDays, MapPin, UserCircle2, Sun, Moon, ChevronRight, TrendingUp, LogOut,
  Play, Square, Coffee, Timer, Eraser,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────
   CONSTANTS & UTILITIES
────────────────────────────────────────────────────────── */
const API = axiosInstance;

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const wordCount = (t = "") => t.trim().split(/\s+/).filter(Boolean).length;
/* dayjs's .diff(x, "minute") TRUNCATES rather than rounds — a 45-second gap
   comes back as 0, which made every quick Stop/Resume during testing show
   up as "0 min" downtime everywhere (KPIs, footer, Excel). Round from the
   seconds-level diff instead so sub-minute gaps still register correctly. */
const minutesBetween = (s, e) => {
  if (!s || !e) return 0;
  const seconds = dayjs(e).diff(dayjs(s), "second");
  return Math.max(Math.round(seconds / 60), 0);
};

const MATERIAL_TYPE_LABELS = {
  powderItems:   "Powder Items",
  chemicalItems: "Chemical Items",
  usefulItems:   "Useful Items",
};
const MATERIAL_TYPE_COLORS = {
  powderItems: "purple",
  chemicalItems: "teal",
  usefulItems: "blue",
};

/* ── SHIFT TIMING — now fully dynamic, sourced from ManageShiftPage's
   Shift Master via GET /shifts/plant/:plantId. No hardcoded windows. ── */
const atTime = (base, h, m) => base.hour(h).minute(m).second(0).millisecond(0);
const parseHM = (t) => {
  if (!t || typeof t !== "string" || !t.includes(":")) return [0, 0];
  const [h, m] = t.split(":").map(Number);
  return [h || 0, m || 0];
};

const formatHM = (totalMinutes) => {
  const m = Math.max(Math.round(totalMinutes || 0), 0);
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};
const formatHMS = (totalSeconds) => {
  const s = Math.max(Math.round(totalSeconds || 0), 0);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
};

/* ──────────────────────────────────────────────────────────
   DRAFT PERSISTENCE (localStorage)
   Survives refresh, tab close, browser close, and logout — scoped per
   operator email so a shared shop-floor terminal doesn't show one
   person's unsaved entry to the next person who logs in.

   Note on "runs in the background while the browser is closed": no
   client-side JS can literally keep executing once the browser is fully
   closed. What actually solves the real need here is that every timer on
   this page is computed as (now − a stored real timestamp), never as an
   incrementing counter. Because we persist the real ISO timestamps
   (job start times, downtime start times, etc.) and recompute against
   the current clock on every load, reopening the page shows the exact
   same elapsed time it would have if it had "kept running" the whole
   time — same result, without needing anything to execute while closed.
────────────────────────────────────────────────────────── */
const draftKey = (email) => `pg_prod_entry_draft_${email || "guest"}`;

const loadDraft = (email) => {
  try {
    const raw = localStorage.getItem(draftKey(email));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const saveDraft = (email, data) => {
  try {
    localStorage.setItem(draftKey(email), JSON.stringify(data));
  } catch {
    // storage full or unavailable (private browsing etc.) — fail silently,
    // in-memory state still works fine for the current tab session
  }
};
const clearDraft = (email) => {
  try { localStorage.removeItem(draftKey(email)); } catch { /* noop */ }
};

/* ──────────────────────────────────────────────────────────
   DESIGN SYSTEM — "Clean Enterprise"
   Crisp white surfaces, navy authority accents, airy but dense
   enough for a shop-floor entry screen. All visual decisions are
   centralised here so every section stays perfectly consistent.
────────────────────────────────────────────────────────── */
const NAVY       = "#1e3a5f";
const NAVY_SOFT  = "#3b6fa0";

/* Surfaces */
const CARD  =
  "bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_-8px_rgba(16,24,40,0.10)] overflow-hidden transition-shadow hover:shadow-[0_1px_2px_rgba(16,24,40,0.05),0_10px_28px_-12px_rgba(16,24,40,0.16)]";
const CARD_HEAD = "px-4 py-3 border-b border-slate-200/70 bg-gradient-to-b from-slate-50/80 to-white";
const CARD_BODY = "px-4 py-4";

/* Sub-panels (the tinted "input wells" inside each section) */
const WELL  = "rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5";

/* Tables */
const TH    = "text-left text-[10px] font-semibold text-slate-500 uppercase tracking-[0.08em] px-3 py-2 bg-slate-50 border-b border-slate-200 whitespace-nowrap";
const TD    = "text-left px-3 py-2 border-b border-slate-100 text-xs text-slate-700";
const TABLE_WRAP = "overflow-x-auto rounded-xl border border-slate-200/80 bg-white";

/* Form primitives */
const LABEL = "block text-[10px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-1";
const FIELD = "h-8 flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 text-xs text-slate-700 font-medium";

/* Empty / hint state */
const HINT  = "text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/40";

const SectionHead = ({ icon: Icon, color = "text-[#1e3a5f]", border = NAVY, children, extra, subtitle }) => (
  <div className="flex items-center justify-between w-full gap-3">
    <div className="flex items-center gap-2.5 min-w-0">
      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${border}12`, border: `1px solid ${border}26` }}
      >
        <Icon size={15} className={color} />
      </span>
      <div className="min-w-0">
        <h2 className="text-[13px] font-bold text-slate-800 m-0 leading-tight tracking-[-0.01em] truncate">{children}</h2>
        {subtitle && <div className="text-[10px] text-slate-400 mt-0.5 truncate">{subtitle}</div>}
      </div>
    </div>
    {extra}
  </div>
);

const KpiCard = ({ icon: Icon, label, value, tone }) => {
  const tones = {
    cyan:   { ring: "#0891b2", text: "text-cyan-700" },
    blue:   { ring: "#2563eb", text: "text-blue-700" },
    red:    { ring: "#dc2626", text: "text-red-600" },
    amber:  { ring: "#d97706", text: "text-amber-600" },
    purple: { ring: "#7c3aed", text: "text-purple-700" },
    slate:  { ring: "#475569", text: "text-slate-700" },
    green:  { ring: "#16a34a", text: "text-green-700" },
    teal:   { ring: NAVY_SOFT, text: "text-[#1e3a5f]" },
  };
  const t = tones[tone] || tones.slate;
  return (
    <div className="group relative bg-white rounded-xl border border-slate-200/80 px-3 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-[0_8px_24px_-12px_rgba(16,24,40,0.25)] hover:-translate-y-0.5 transition-all overflow-hidden">
      <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: t.ring }} />
      <div className="flex items-center justify-between">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${t.ring}12` }}
        >
          <Icon size={14} className={t.text} />
        </span>
        <ChevronRight size={12} className="text-slate-300 group-hover:translate-x-0.5 transition-transform" />
      </div>
      <div className={`text-xl font-extrabold mt-2 leading-none tabular-nums ${t.text}`}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-1.5 font-medium tracking-wide">{label}</div>
    </div>
  );
};

/* Small stat tile used under Defects / Downtime tables */
const StatTile = ({ label, value, accent = NAVY }) => (
  <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
    <div className="text-2xl font-extrabold tabular-nums leading-none" style={{ color: accent }}>{value}</div>
    <div className="text-[10px] text-slate-500 mt-1.5 font-medium tracking-wide">{label}</div>
  </div>
);

/* ──────────────────────────────────────────────────────────
   MAIN PAGE
────────────────────────────────────────────────────────── */
export default function UserProductionPage() {
  /* ── auth + routing ── */
  const { logout, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);

  /* ── page states ── */
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving]           = useState(false);
  const [exporting, setExporting]     = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [now, setNow] = useState(dayjs());

  /* ── master data ── */
  const [models, setModels]           = useState([]);
  const [partsByModel, setPartsByModel] = useState({});
  const [partsLoading, setPartsLoading] = useState({});
  const [rejectTypes, setRejectTypes] = useState([]);
  const [reworkTypes, setReworkTypes] = useState([]);
  const [downtimeTypes, setDowntimeTypes] = useState([]);
  const [materials, setMaterials]     = useState([]);
  const [plantStrengths, setPlantStrengths] = useState([]);

  /* ── shift master — plant's Active shift configs (Day + Night), fetched
     once; which one is "current" is derived live from the clock below ── */
  const [plantShifts, setPlantShifts] = useState([]);

  /* ── production entry form (free-form fallback) ── */
  const [selectedModelId, setSelectedModelId]     = useState(null);
  const [loadingCurrentParts, setLoadingCurrentParts] = useState(false);
  const [currentModelParts, setCurrentModelParts] = useState([]);
  const [currentPartQtys, setCurrentPartQtys]     = useState({});
  const [productionLog, setProductionLog]         = useState([]);
  const [freeJob, setFreeJob] = useState({ startTime: null, running: false });

  /* ── conveyor line switcher ── */
  const [activeLineIdx, setActiveLineIdx] = useState(0);
  const [lineQty, setLineQty]             = useState(0);
  const [lineJobs, setLineJobs]           = useState({}); // { [lineId]: { startTime, running } }

  /* ── defect form ── */
  const [defectForm, setDefectForm] = useState({
    modelId: null, partId: null,
    defectType: null, defectTypeId: null, quantity: 0,
  });
  const [defectModelParts, setDefectModelParts] = useState([]);
  const [defectLog, setDefectLog] = useState([]);

  /* ── manpower ── */
  const [requiredManpower, setRequiredManpower]   = useState(0);
  const [availableManpower, setAvailableManpower] = useState(0);

  /* ── shift timer / downtime (auto-captured, locked) ── */
  const [downtimes, setDowntimes]           = useState([]); // closed entries
  const [activeDowntime, setActiveDowntime] = useState(null); // currently running stop / auto-break
  const [stopModalOpen, setStopModalOpen]   = useState(false);
  const [stopType, setStopType]             = useState(null);
  const [stopReasonId, setStopReasonId]     = useState(null);
  const [stopRemark, setStopRemark]         = useState("");

  /* ── consumable form ── */
  const [consumableMaterialType, setConsumableMaterialType] = useState("powderItems");
  const [consumableForm, setConsumableForm] = useState({ materialId: null, quantity: 0 });
  const [consumableLog, setConsumableLog] = useState([]);

  /* ── live clock (1s tick — drives shift timer, downtime timer, job timers) ── */
  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ════════════════════════════════════════════════════════
     SHIFT MASTER — which shift (Day/Night) is active RIGHT NOW,
     derived live against the plant's configured shift windows.
     No manual Day/Night selection — this is the source of truth.
  ════════════════════════════════════════════════════════ */
  const activeShift = useMemo(() => {
    if (!plantShifts.length) return null;
    const nowMin = now.hour() * 60 + now.minute();
    return plantShifts.find((s) => {
      const [sh, sm] = parseHM(s.shiftStartTime);
      const [eh, em] = parseHM(s.shiftEndTime);
      let startMin = sh * 60 + sm;
      let endMin = eh * 60 + em;
      if (endMin <= startMin) endMin += 1440; // overnight shift
      const nm = nowMin < startMin ? nowMin + 1440 : nowMin;
      return nm >= startMin && nm < endMin;
    }) || null;
  }, [plantShifts, now]);

  const shiftStart = useMemo(() => {
    if (!activeShift) return null;
    const [h, m] = parseHM(activeShift.shiftStartTime);
    return atTime(now, h, m);
  }, [activeShift, now]);

  const shiftEnd = useMemo(() => {
    if (!activeShift || !shiftStart) return null;
    const [h, m] = parseHM(activeShift.shiftEndTime);
    let e = atTime(now, h, m);
    if (!e.isAfter(shiftStart)) e = e.add(1, "day"); // overnight
    return e;
  }, [activeShift, shiftStart, now]);

  const shiftPhase = !activeShift ? "none" : now.isBefore(shiftStart) ? "before" : now.isAfter(shiftEnd) ? "ended" : "active";

  const breaksConfig = activeShift?.breaks || [];

  /** Which configured break window (if any) contains `now`, overnight-safe. */
  const activeBreakWindow = useMemo(() => {
    if (!activeShift || !shiftStart) return null;
    for (const b of breaksConfig) {
      const [bh, bm] = parseHM(b.startTime);
      const [eh, em] = parseHM(b.endTime);
      let bStart = atTime(now, bh, bm);
      let bEnd = atTime(now, eh, em);
      if (bStart.isBefore(shiftStart)) bStart = bStart.add(1, "day");
      if (!bEnd.isAfter(bStart)) bEnd = bEnd.add(1, "day");
      if (!now.isBefore(bStart) && now.isBefore(bEnd)) {
        return { id: `${b.breakName}-${bStart.format("YYYY-MM-DD-HH:mm")}`, breakName: b.breakName, start: bStart, end: bEnd };
      }
    }
    return null;
  }, [now, activeShift, shiftStart, breaksConfig]);

  const inBreakWindow = !!activeBreakWindow;

  /* auto break lockout — starts/ends itself off the Shift Master's
     breaks[] array; fires only when crossing a window boundary. */
  useEffect(() => {
    if (activeBreakWindow && !activeDowntime) {
      setActiveDowntime({
        key: uid(), startTime: activeBreakWindow.start.toISOString(), type: "Planned",
        downtimeTypeId: null, downtimeName: activeBreakWindow.breakName,
        remark: `Auto ${activeBreakWindow.breakName}`, isAutoBreak: true,
      });
    }
    if (!activeBreakWindow && activeDowntime?.isAutoBreak) {
      const endTime = dayjs();
      setDowntimes((prev) => [...prev, {
        ...activeDowntime, endTime: endTime.toISOString(),
        duration: minutesBetween(activeDowntime.startTime, endTime),
      }]);
      setActiveDowntime(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBreakWindow?.id]);

  const shiftElapsedSeconds = useMemo(() => {
    if (shiftPhase === "none" || shiftPhase === "before") return 0;
    const capNow = shiftPhase === "ended" ? shiftEnd : now;
    return Math.max(capNow.diff(shiftStart, "second"), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, shiftPhase, shiftStart, shiftEnd]);

  const totalDowntimeSeconds = useMemo(() => {
    const closed = downtimes.reduce((s, d) => s + (d.duration || 0) * 60, 0);
    const live = activeDowntime ? Math.max(now.diff(dayjs(activeDowntime.startTime), "second"), 0) : 0;
    return closed + live;
  }, [downtimes, activeDowntime, now]);

  const actualRunningSeconds = Math.max(shiftElapsedSeconds - totalDowntimeSeconds, 0);
  const actualRunningMinutes = Math.floor(actualRunningSeconds / 60);

  const downtimeTotals = useMemo(() => {
    const liveSec = activeDowntime ? Math.max(now.diff(dayjs(activeDowntime.startTime), "second"), 0) : 0;
    const planned = Math.floor((downtimes.filter((d) => d.type === "Planned").reduce((s, d) => s + (d.duration || 0), 0) * 60
      + (activeDowntime?.type === "Planned" ? liveSec : 0)) / 60);
    const unplanned = Math.floor((downtimes.filter((d) => d.type === "Unplanned").reduce((s, d) => s + (d.duration || 0), 0) * 60
      + (activeDowntime?.type === "Unplanned" ? liveSec : 0)) / 60);
    return { planned, unplanned, total: planned + unplanned };
  }, [downtimes, activeDowntime, now]);

  const openStopModal = () => {
    setStopType(null); setStopReasonId(null); setStopRemark("");
    setStopModalOpen(true);
  };

  const confirmStopDowntime = () => {
    if (!stopType) { message.error("Select Planned or Unplanned"); return; }
    if (!stopReasonId) { message.error("Select a downtime reason"); return; }
    if (stopType === "Unplanned" && wordCount(stopRemark) === 0) { message.error("Description is required for Unplanned downtime"); return; }
    if (stopType === "Unplanned" && wordCount(stopRemark) > 10) { message.error("Description cannot exceed 10 words"); return; }

    const reasonName = downtimeTypes.find((t) => t._id === stopReasonId)?.name || "";
    setActiveDowntime({
      key: uid(), startTime: dayjs().toISOString(), type: stopType,
      downtimeTypeId: stopReasonId, downtimeName: reasonName,
      remark: stopType === "Unplanned" ? stopRemark : "", isAutoBreak: false,
    });
    setStopModalOpen(false);
    message.info(`Line stopped — ${stopType} downtime started`);
  };

  const resumeProduction = () => {
    if (!activeDowntime) return;
    const endTime = dayjs();
    const duration = minutesBetween(activeDowntime.startTime, endTime);
    setDowntimes((prev) => [...prev, { ...activeDowntime, endTime: endTime.toISOString(), duration }]);
    setActiveDowntime(null);
    message.success("Production resumed");
  };

  /** How many seconds of downtime (closed entries + the currently-active one,
      if any) overlap the given [intervalStart, intervalEnd] window. Used to
      pause a model's job clock — whether the line stopped for a Planned
      tool change, an Unplanned issue, or an auto shift break, the job's own
      elapsed/duration should exclude that dead time either way. */
  const downtimeOverlapSeconds = useCallback((intervalStart, intervalEnd) => {
    if (!intervalStart) return 0;
    const s = dayjs(intervalStart);
    const e = intervalEnd ? dayjs(intervalEnd) : dayjs();
    const allDowntimes = activeDowntime ? [...downtimes, { ...activeDowntime, endTime: dayjs().toISOString() }] : downtimes;
    let total = 0;
    for (const d of allDowntimes) {
      const dStart = dayjs(d.startTime);
      const dEnd = d.endTime ? dayjs(d.endTime) : dayjs();
      const overlapStart = dStart.isAfter(s) ? dStart : s;
      const overlapEnd = dEnd.isBefore(e) ? dEnd : e;
      if (overlapEnd.isAfter(overlapStart)) total += overlapEnd.diff(overlapStart, "second");
    }
    return total;
  }, [downtimes, activeDowntime]);

  /* ════════════════════════════════════════════════════════
     FETCHERS
  ════════════════════════════════════════════════════════ */

  const fetchModels = useCallback(async () => {
    const { data } = await API.get("/models");
    setModels(data?.data || data?.models || data || []);
  }, []);

  const fetchPartsForModel = useCallback(async (modelId) => {
    if (!modelId) return [];
    if (partsByModel[modelId]) return partsByModel[modelId];
    setPartsLoading((p) => ({ ...p, [modelId]: true }));
    try {
      const { data } = await API.get(`/parts/by-model/${modelId}`);
      const parts = data?.data || data?.parts || data || [];
      setPartsByModel((p) => ({ ...p, [modelId]: parts }));
      return parts;
    } catch {
      return [];
    } finally {
      setPartsLoading((p) => ({ ...p, [modelId]: false }));
    }
  }, [partsByModel]);

  const fetchRejectTypes = useCallback(async () => {
    const { data } = await API.get("/defects/reject");
    setRejectTypes(data?.data || []);
  }, []);

  const fetchReworkTypes = useCallback(async () => {
    const { data } = await API.get("/defects/rework");
    setReworkTypes(data?.data || []);
  }, []);

  const fetchDowntimeTypes = useCallback(async () => {
    const { data } = await API.get("/downtime-types");
    setDowntimeTypes(data?.data || []);
  }, []);

  const fetchMaterials = useCallback(async () => {
    const { data } = await API.get("/materials");
    setMaterials(data?.data || []);
  }, []);

  const fetchPlantStrengths = useCallback(async (shiftId) => {
    const today = dayjs().format("YYYY-MM-DD");
    const { data } = await API.get("/production", {
      params: { from: today, to: today, ...(shiftId ? { shiftId } : {}) },
    });
    setPlantStrengths(data?.plantStrengths || []);
  }, []);

  /** Loads this plant's Active shift configs (Day + Night) from the Shift
      Master. Which one is "current" is computed live in `activeShift` above. */
  const fetchPlantShifts = useCallback(async () => {
    const plantId = user?.plantId?._id || user?.plantId;
    if (!plantId) { setPlantShifts([]); return; }
    try {
      const { data } = await API.get(`/shifts/plant/${plantId}`);
      setPlantShifts(data?.data || []);
    } catch {
      setPlantShifts([]);
    }
  }, [user]);

  const loadEverything = useCallback(async () => {
    setPageLoading(true);
    try {
      await Promise.all([
        fetchModels(), fetchRejectTypes(), fetchReworkTypes(),
        fetchDowntimeTypes(), fetchMaterials(), fetchPlantShifts(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      message.error(error?.response?.data?.message || "Failed to load data");
    } finally {
      setPageLoading(false);
    }
  }, [fetchModels, fetchRejectTypes, fetchReworkTypes, fetchDowntimeTypes, fetchMaterials, fetchPlantShifts]);

  useEffect(() => {
  if (authLoading || !user) return; // wait for /auth/me to resolve before fetching plant-scoped data
  loadEverything();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [authLoading, user?._id, loadEverything]);

  /* ════════════════════════════════════════════════════════
     DRAFT PERSISTENCE — hydrate once per operator, then keep
     localStorage in sync with every entry change. This is what makes
     refresh / navigate away / close-and-reopen / logout all preserve
     the in-progress shift entry.
  ════════════════════════════════════════════════════════ */
  const [draftLoaded, setDraftLoaded] = useState(false);

  useEffect(() => {
    if (!user?.email || draftLoaded) return;
    const draft = loadDraft(user.email);
    if (draft) {
      if (draft.productionLog?.length) setProductionLog(draft.productionLog);
      if (draft.defectLog?.length) setDefectLog(draft.defectLog);
      if (draft.consumableLog?.length) setConsumableLog(draft.consumableLog);
      if (draft.downtimes?.length) setDowntimes(draft.downtimes);
      if (draft.activeDowntime) setActiveDowntime(draft.activeDowntime);
      if (draft.lineJobs) setLineJobs(draft.lineJobs);
      if (draft.freeJob) setFreeJob(draft.freeJob);
      if (draft.currentPartQtys) setCurrentPartQtys(draft.currentPartQtys);
      if (typeof draft.activeLineIdx === "number") setActiveLineIdx(draft.activeLineIdx);
      if (typeof draft.lineQty === "number") setLineQty(draft.lineQty);
      if (typeof draft.requiredManpower === "number") setRequiredManpower(draft.requiredManpower);
      if (typeof draft.availableManpower === "number") setAvailableManpower(draft.availableManpower);
      if (draft.selectedModelId) {
        setSelectedModelId(draft.selectedModelId);
        fetchPartsForModel(draft.selectedModelId).then(setCurrentModelParts);
      }
      const hasSomething = draft.productionLog?.length || draft.defectLog?.length || draft.downtimes?.length || draft.activeDowntime;
      if (hasSomething) message.info("Restored your unsaved shift entry from this browser");
    }
    setDraftLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, draftLoaded]);

  useEffect(() => {
    if (!user?.email || !draftLoaded) return; // don't overwrite a real draft with blank initial state before hydration runs
    saveDraft(user.email, {
      productionLog, defectLog, consumableLog, downtimes, activeDowntime,
      lineJobs, freeJob, selectedModelId, currentPartQtys, activeLineIdx, lineQty,
      requiredManpower, availableManpower, savedAt: new Date().toISOString(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    productionLog, defectLog, consumableLog, downtimes, activeDowntime,
    lineJobs, freeJob, selectedModelId, currentPartQtys, activeLineIdx, lineQty,
    requiredManpower, availableManpower, user?.email, draftLoaded,
  ]);

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const handleResetAll = () => {
    setProductionLog([]); setDefectLog([]); setConsumableLog([]);
    setDowntimes([]); setActiveDowntime(null);
    setLineJobs({}); setFreeJob({ startTime: null, running: false });
    setSelectedModelId(null); setCurrentModelParts([]); setCurrentPartQtys({});
    setActiveLineIdx(0); setLineQty(0);
    setRequiredManpower(0); setAvailableManpower(0);
    setDefectForm({ modelId: null, partId: null, defectType: null, defectTypeId: null, quantity: 0 });
    setDefectModelParts([]);
    clearDraft(user?.email);
    setResetConfirmOpen(false);
    message.success("All entry data has been reset");
  };

  const handleLogout = async () => {
    // Intentionally does NOT clear the draft — an operator logging back in
    // (or a shift handover on the same login) should still see it.
    await logout();
    navigate("/login");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setPartsByModel({});
    await loadEverything();
    if (activeShift?._id) await fetchPlantStrengths(activeShift._id);
    setRefreshing(false);
    message.success("Data refreshed");
  };

  /* Re-fetch conveyor-strength targets whenever the resolved active shift
     changes (page load, or a Morning→Night rollover mid-session). Scoping
     by shiftId (and conveyorId, via the backend) is what stops the plant's
     other shift's demandPerShift from being summed in — e.g. Line 1 having
     separate 15000 (Shift 1) / 12000 (Shift 2) configs no longer double-count. */
  useEffect(() => {
    if (activeShift?._id) {
      fetchPlantStrengths(activeShift._id);
    } else {
      setPlantStrengths([]);
    }
  }, [activeShift?._id, fetchPlantStrengths]);

  /* ════════════════════════════════════════════════════════
     CONVEYOR LINES  (model+part scoped lines from PlantStrength)
  ════════════════════════════════════════════════════════ */
  const conveyorLines = useMemo(
    () => plantStrengths.filter((l) => l.modelId && l.partId),
    [plantStrengths]
  );
  const hasConveyorLines = conveyorLines.length > 0;
  const safeLineIdx = conveyorLines.length > 0 ? Math.min(activeLineIdx, conveyorLines.length - 1) : 0;
  const activeLine = conveyorLines[safeLineIdx] || null;
  const activeLineLabel = activeLine ? (activeLine.conveyorName || `Line ${safeLineIdx + 1}`) : "";
  const activeLineJob = activeLine ? lineJobs[activeLine._id] : null;
  const activeLineJobSeconds = activeLineJob?.running
    ? Math.max(now.diff(dayjs(activeLineJob.startTime), "second") - downtimeOverlapSeconds(activeLineJob.startTime, now), 0) : 0;
  const activeLineJobPaused = !!activeLineJob?.running && !!activeDowntime;

  const handleSwitchLine = (idx) => {
    setActiveLineIdx(idx);
    setLineQty(0);
  };

  /** Operator marks the moment loading begins on this line */
  const handleStartLineJob = () => {
    if (!activeLine) return;
    setLineJobs((prev) => ({ ...prev, [activeLine._id]: { startTime: dayjs().toISOString(), running: true } }));
    message.info(`Job started on ${activeLineLabel}`);
  };

  /** "Complete & Add to List" — stops this line's job timer, logs start/end/duration */
  const handleAddLineProductionRow = () => {
    if (!activeLine) return;
    if (!activeLineJob?.running) { message.error("Click Start Job before logging production"); return; }
    if (!lineQty || lineQty <= 0) { message.error("Enter a production quantity"); return; }

    const startTime = activeLineJob.startTime;
    const endTime = dayjs().toISOString();
    const rawSeconds = dayjs(endTime).diff(dayjs(startTime), "second");
    const durationMinutes = Math.max(Math.round((rawSeconds - downtimeOverlapSeconds(startTime, endTime)) / 60), 0);

    setProductionLog((prev) => [
      ...prev,
      {
        key: uid(),
        modelId: activeLine.modelId?._id || activeLine.modelId,
        modelName: activeLine.modelId?.modelName || activeLine.modelId?.name || "",
        conveyorId: activeLine._id,
        conveyorName: activeLineLabel,
        demandPerShift: activeLine.demandPerShift || 0,
        startTime, endTime, durationMinutes,
        parts: [{
          partId: activeLine.partId?._id || activeLine.partId,
          partName: activeLine.partId?.partName || activeLine.partId?.name || "",
          qty: lineQty,
        }],
      },
    ]);
    setLineJobs((prev) => ({ ...prev, [activeLine._id]: { startTime: null, running: false } }));
    setLineQty(0);
    message.success(`${activeLineLabel} logged — ${formatHM(durationMinutes)}`);
  };

  const activeLineRows = useMemo(
    () => activeLine ? productionLog.filter((r) => r.conveyorId === activeLine._id) : [],
    [productionLog, activeLine]
  );

  /* ════════════════════════════════════════════════════════
     PRODUCTION ENTRY — free-form fallback (no conveyor lines)
  ════════════════════════════════════════════════════════ */

  /** Models already logged in productionLog disappear from the picker
      until their row is removed — prevents double-entry for the same model. */
  const usedModelIds = useMemo(() => new Set(productionLog.map((e) => e.modelId)), [productionLog]);
  const selectableModels = useMemo(() => models.filter((m) => !usedModelIds.has(m._id)), [models, usedModelIds]);

  const handleModelChange = async (modelId) => {
    setSelectedModelId(modelId);
    setCurrentPartQtys({});
    setFreeJob({ startTime: null, running: false });
    setLoadingCurrentParts(true);
    const parts = await fetchPartsForModel(modelId);
    setCurrentModelParts(parts);
    setLoadingCurrentParts(false);
  };

  const handlePartQtyChange = (partId, qty) => {
    setCurrentPartQtys((prev) => ({ ...prev, [partId]: qty || 0 }));
  };

  const handleStartFreeJob = () => {
    if (!selectedModelId) { message.error("Select a model first"); return; }
    setFreeJob({ startTime: dayjs().toISOString(), running: true });
  };
  const freeJobSeconds = freeJob.running
    ? Math.max(now.diff(dayjs(freeJob.startTime), "second") - downtimeOverlapSeconds(freeJob.startTime, now), 0) : 0;
  const freeJobPaused = freeJob.running && !!activeDowntime;

  const handleAddProductionRow = () => {
    if (!selectedModelId) { message.error("Please select a model first"); return; }
    if (!freeJob.running) { message.error("Click Start Job before logging production"); return; }
    const anyQty = currentModelParts.some((p) => (currentPartQtys[p._id] || 0) > 0);
    if (!anyQty) { message.error("Enter production qty for at least one part"); return; }

    const startTime = freeJob.startTime;
    const endTime = dayjs().toISOString();
    const rawSeconds = dayjs(endTime).diff(dayjs(startTime), "second");
    const durationMinutes = Math.max(Math.round((rawSeconds - downtimeOverlapSeconds(startTime, endTime)) / 60), 0);

    const model = models.find((m) => m._id === selectedModelId);
    setProductionLog((prev) => [
      ...prev,
      {
        key: uid(),
        modelId: selectedModelId,
        modelName: model?.modelName || model?.name || "",
        conveyorId: null, conveyorName: null, demandPerShift: 0,
        startTime, endTime, durationMinutes,
        parts: currentModelParts.map((p) => ({
        partId: p._id,
        partName: p.partName || p.name,
        qty: currentPartQtys[p._id] || 0,

        area: Number(p.area || 0),

        partsPerHanger: Number(
          p.partsPerHanger || 1
        ),
      })),
      },
    ]);

    setSelectedModelId(null);
    setCurrentModelParts([]);
    setCurrentPartQtys({});
    setFreeJob({ startTime: null, running: false });
  };

  const handleRemoveProductionRow = (key) => {
    setProductionLog((prev) => prev.filter((r) => r.key !== key));
  };

  const allPartNames = useMemo(() => {
    const s = new Set();
    productionLog.forEach((e) => e.parts.forEach((p) => s.add(p.partName)));
    return [...s];
  }, [productionLog]);

  /* ── Per-hour target + row-level Achievement % ──
     perHourTarget = Total Target ÷ Available Working Hours (from Shift Master).
     Row Achievement % = actual qty produced ÷ expected qty for that job's
     duration at perHourTarget. */
  const achievementTone = (pct) => (pct == null ? "default" : pct >= 100 ? "green" : pct >= 70 ? "gold" : "red");

  const computeRowAchievement = useCallback((row, ratePerHour) => {
    if (!ratePerHour || !row.durationMinutes) return null;
    const actualQty = row.parts.reduce((s, p) => s + (p.qty || 0), 0);
    const expectedQty = ratePerHour * (row.durationMinutes / 60);
    if (!expectedQty) return null;
    return Math.round((actualQty / expectedQty) * 100);
  }, []);

  const calculatePaintedArea = (row) => {
      return row.parts
        .reduce(
          (sum, part) =>
            sum +
            (Number(part.qty || 0) *
              Number(part.area || 0)),
          0
        )
        .toFixed(2);
    };

    const calculateHangersUsed = (row) => {
      return row.parts
        .reduce(
          (sum, part) =>
            sum +
            (
              Number(part.qty || 0) /
              Number(
                part.partsPerHanger || 1
              )
            ),
          0
        )
        .toFixed(2);
    };

  const calculateTotalQty = (row) => {
  return row.parts.reduce(
    (sum, part) =>
      sum + Number(part.qty || 0),
    0
  );
};

  const productionColumns = useMemo(() => [
    { title: "#", key: "idx", width: 40, render: (_, __, i) => <span className="text-slate-400">{i + 1}</span> },
    { title: "Model", dataIndex: "modelName", key: "model", width: 110, render: (v) => <Tag color="cyan" className="!rounded-lg !text-[11px] !font-semibold">{v}</Tag> },
    { title: "Start", key: "start", width: 66, align: "center", render: (_, r) => r.startTime ? dayjs(r.startTime).format("HH:mm") : "—" },
    { title: "End", key: "end", width: 66, align: "center", render: (_, r) => r.endTime ? dayjs(r.endTime).format("HH:mm") : "—" },
    { title: "Duration", key: "dur", width: 86, align: "center", render: (_, r) => r.durationMinutes ? <Tag color="geekblue" className="!rounded-lg !text-[11px]">{formatHM(r.durationMinutes)}</Tag> : "—" },
    { title: "Achv %", key: "achv", width: 84, align: "center",
      render: (_, row) => {
        // eslint-disable-next-line no-use-before-define
        const pct = computeRowAchievement(row, perHourTarget);
        if (pct == null) return <span className="text-slate-300">—</span>;
        return <Tag color={achievementTone(pct)} className="!rounded-lg !text-[11px] !font-bold">{pct}%</Tag>;
      },
    },
    { title: "Painted Area (m²)",

      key: "paintedArea",

      width: 130,

      align: "center",

      render: (_, row) => (
        <span className="font-semibold text-cyan-700">
          {calculatePaintedArea(row)}
        </span>
      ),
    },

    {
      title: "Hangers Used",

      key: "hangerUsed",

      width: 110,

      align: "center",

      render: (_, row) => (
        <span className="font-semibold text-emerald-700">
          {calculateHangersUsed(row)}
        </span>
      ),
    },
    {
      title: "Total Qty",

      key: "totalQty",

      width: 100,

      align: "center",

      render: (_, row) => (
        <Tag
          color="blue"
          className="!rounded-lg !font-semibold"
        >
          {calculateTotalQty(row)}
        </Tag>
      ),
    },
    ...allPartNames.map((name) => ({
      title: <span className="uppercase">{name}</span>, key: name, align: "center", width: 110,
      render: (_, row) => {
        const p = row.parts.find((x) => x.partName === name);
        return p && p.qty ? <span className="font-semibold text-slate-800">{p.qty}</span> : <span className="text-slate-300">—</span>;
      },
    })),
    { title: "", key: "action", width: 80, render: (_, row) => <Button danger size="small" onClick={() => handleRemoveProductionRow(row.key)} className="!rounded-lg !text-[11px]">Remove</Button> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [allPartNames, computeRowAchievement]);

  const lineProductionColumns = useMemo(() => [
    { title: "#", key: "idx", width: 40, render: (_, __, i) => <span className="text-slate-400">{i + 1}</span> },
    { title: "Start", key: "start", width: 70, align: "center", render: (_, r) => r.startTime ? dayjs(r.startTime).format("HH:mm") : "—" },
    { title: "End", key: "end", width: 70, align: "center", render: (_, r) => r.endTime ? dayjs(r.endTime).format("HH:mm") : "—" },
    { title: "Duration", key: "dur", width: 90, align: "center", render: (_, r) => r.durationMinutes ? <Tag color="geekblue" className="!rounded-lg !text-[11px]">{formatHM(r.durationMinutes)}</Tag> : "—" },
    {
      title: "Achv %", key: "achv", width: 84, align: "center",
      render: (_, row) => {
        // eslint-disable-next-line no-use-before-define
        const pct = computeRowAchievement(row, perHourTarget);
        if (pct == null) return <span className="text-slate-300">—</span>;
        return <Tag color={achievementTone(pct)} className="!rounded-lg !text-[11px] !font-bold">{pct}%</Tag>;
      },
    },
    { title: "Qty", key: "qty", align: "center", width: 70, render: (_, row) => <span className="font-bold text-slate-800">{row.parts[0]?.qty ?? 0}</span> },
    { title: "", key: "action", width: 80, render: (_, row) => <Button danger size="small" onClick={() => handleRemoveProductionRow(row.key)} className="!rounded-lg !text-[11px]">Remove</Button> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [computeRowAchievement]);

  /* ════════════════════════════════════════════════════════
     DEFECT HANDLERS — dynamically scoped to models already
     started/added in Production Entry only
  ════════════════════════════════════════════════════════ */

  const dynamicModelIds = useMemo(() => {
    const ids = new Set(productionLog.map((e) => e.modelId));
    if (hasConveyorLines) {
      Object.entries(lineJobs).forEach(([lineId, job]) => {
        if (job?.running) {
          const line = conveyorLines.find((l) => l._id === lineId);
          if (line) ids.add(line.modelId?._id || line.modelId);
        }
      });
    } else if (freeJob.running && selectedModelId) {
      ids.add(selectedModelId);
    }
    return [...ids];
  }, [productionLog, lineJobs, freeJob, selectedModelId, hasConveyorLines, conveyorLines]);

  const availableDefectModels = useMemo(
    () => models.filter((m) => dynamicModelIds.includes(m._id)),
    [models, dynamicModelIds]
  );

  /* clear a stale defect-form model selection if it drops out of scope */
  useEffect(() => {
    if (defectForm.modelId && !dynamicModelIds.includes(defectForm.modelId)) {
      setDefectForm({ modelId: null, partId: null, defectType: null, defectTypeId: null, quantity: 0 });
      setDefectModelParts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dynamicModelIds]);

  const handleDefectModelChange = async (modelId) => {
    setDefectForm((p) => ({ ...p, modelId, partId: null, defectTypeId: null }));
    const parts = await fetchPartsForModel(modelId);
    setDefectModelParts(parts);
  };

  /** Total qty already logged in Production Entry for this (model, part) — a
      Reject can never exceed what was actually produced. */
  const producedQtyForPart = useCallback((modelId, partId) => {
    let total = 0;
    productionLog.forEach((row) => {
      if (row.modelId !== modelId) return;
      row.parts.forEach((p) => { if (p.partId === partId) total += p.qty || 0; });
    });
    return total;
  }, [productionLog]);

  /** Reject qty already logged against this (model, part) — subtracted from
      producedQtyForPart to get what's still available to reject. */
  const rejectedQtyForPart = useCallback((modelId, partId) => (
    defectLog
      .filter((d) => d.modelId === modelId && d.partId === partId && d.defectType === "Reject")
      .reduce((s, d) => s + (d.quantity || 0), 0)
  ), [defectLog]);

  const availableToReject = (modelId, partId) => (
    Math.max(producedQtyForPart(modelId, partId) - rejectedQtyForPart(modelId, partId), 0)
  );

  const handleAddDefectRow = () => {
    const { modelId, partId, defectType, defectTypeId, quantity } = defectForm;
    if (!modelId)      { message.error("Select a model for the defect"); return; }
    if (!partId)       { message.error("Select a part for the defect"); return; }
    if (!defectType)   { message.error("Select Reject or Rework"); return; }
    if (!defectTypeId) { message.error("Select a defect type"); return; }
    if ((quantity || 0) <= 0) { message.error("Quantity must be > 0"); return; }

    const model = models.find((m) => m._id === modelId);
    const part  = defectModelParts.find((p) => p._id === partId);
    const modelLabel = model?.modelName || model?.name || "this model";
    const partLabel  = part?.partName || part?.name || "this part";

    // Reject can never exceed what was actually produced for this part
    if (defectType === "Reject") {
      const remaining = availableToReject(modelId, partId);
      if (quantity > remaining) {
        message.error(`Only ${remaining} unit(s) of ${partLabel} available to reject (produced ${producedQtyForPart(modelId, partId)}, already rejected ${rejectedQtyForPart(modelId, partId)})`);
        return;
      }
    }

    // Rework can only apply to a part that's actually in a logged production row
    let reworkRow = null;
    if (defectType === "Rework") {
      reworkRow = productionLog.find((r) => r.modelId === modelId);
      if (!reworkRow) { message.error(`Complete ${modelLabel}'s production entry before logging rework for it`); return; }
      if (!reworkRow.parts.some((p) => p.partId === partId)) { message.error(`${partLabel} wasn't part of ${modelLabel}'s production entry`); return; }
    }

    const typeList = defectType === "Reject" ? rejectTypes : reworkTypes;
    const defectTypeName = typeList.find((t) => t._id === defectTypeId)?.name || "";

    setDefectLog((prev) => [
      ...prev,
      {
        key: uid(), modelId,
        modelName: modelLabel,
        partId,
        partName: partLabel,
        defectType, defectTypeId, defectTypeName, quantity,
      },
    ]);

    // Reworked units are recovered as good output — add them straight into
    // that part's production qty and tell the operator it happened.
    if (defectType === "Rework") {
      setProductionLog((prev) => prev.map((row) => (
        row.modelId !== modelId ? row : {
          ...row,
          parts: row.parts.map((p) => p.partId === partId ? { ...p, qty: (p.qty || 0) + quantity } : p),
        }
      )));
      message.success(`${quantity} Qty updated/Added in ${modelLabel}(${partLabel})`);
    }

    setDefectForm({ modelId: null, partId: null, defectType: null, defectTypeId: null, quantity: 0 });
    setDefectModelParts([]);
  };

  const handleRemoveDefectRow = (key) => {
    const row = defectLog.find((d) => d.key === key);
    // undo a rework's production-qty bump so deleting it doesn't leave the
    // count silently inflated
    if (row?.defectType === "Rework") {
      setProductionLog((prev) => prev.map((r) => (
        r.modelId !== row.modelId ? r : {
          ...r,
          parts: r.parts.map((p) => p.partId === row.partId ? { ...p, qty: Math.max((p.qty || 0) - row.quantity, 0) } : p),
        }
      )));
      message.info(`${row.quantity} Qty removed from ${row.modelName}(${row.partName})`);
    }
    setDefectLog((prev) => prev.filter((d) => d.key !== key));
  };

  const defectTotals = useMemo(() => {
    const reject = defectLog.filter((d) => d.defectType === "Reject").reduce((s, d) => s + (d.quantity || 0), 0);
    const rework = defectLog.filter((d) => d.defectType === "Rework").reduce((s, d) => s + (d.quantity || 0), 0);
    return { reject, rework, total: reject + rework };
  }, [defectLog]);


  /* ════════════════════════════════════════════════════════
     MANPOWER
  ════════════════════════════════════════════════════════ */
  const shortageManpower = useMemo(
    () => Math.max((requiredManpower || 0) - (availableManpower || 0), 0),
    [requiredManpower, availableManpower]
  );

  /* ════════════════════════════════════════════════════════
     CONSUMABLE HANDLERS
  ════════════════════════════════════════════════════════ */

  const filteredMaterials = useMemo(
    () => materials.filter((m) => m.type === consumableMaterialType),
    [materials, consumableMaterialType]
  );

  const handleMaterialChange = (materialId) => {
    const mat = materials.find((m) => m._id === materialId);
    setConsumableForm((p) => ({ ...p, materialId, measurementType: mat?.mesurmentType || "" }));
  };

  const handleAddConsumableRow = () => {
    const { materialId, quantity } = consumableForm;
    if (!materialId)       { message.error("Select a material"); return; }
    if ((quantity || 0) <= 0) { message.error("Quantity must be > 0"); return; }

    const mat = materials.find((m) => m._id === materialId);
    setConsumableLog((prev) => [
      ...prev,
      {
        key: uid(), materialId,
        materialName: mat?.name || "",
        materialType: mat?.type || consumableMaterialType,
        measurementType: mat?.mesurmentType || "",
        quantity,
      },
    ]);
    setConsumableForm({ materialId: null, quantity: 0 });
  };

  const handleRemoveConsumableRow = (key) => {
    setConsumableLog((prev) => prev.filter((c) => c.key !== key));
  };

  /* ════════════════════════════════════════════════════════
     PRODUCTION TOTALS + TARGETS
  ════════════════════════════════════════════════════════ */
  const productionTotals = useMemo(() => {
    let production = 0;
    productionLog.forEach((e) => e.parts.forEach((p) => { production += p.qty || 0; }));
    return production;
  }, [productionLog]);

  const plantTotalTarget = useMemo(
    () => plantStrengths.reduce((sum, p) => sum + (p.demandPerShift || 0), 0),
    [plantStrengths]
  );

  const achievementPercent = useMemo(
    () => (plantTotalTarget > 0 ? parseFloat(((productionTotals / plantTotalTarget) * 100).toFixed(2)) : 0),
    [productionTotals, plantTotalTarget]
  );

  const avgRatePerHour = useMemo(
    () => (actualRunningMinutes > 0 ? Math.round(productionTotals / (actualRunningMinutes / 60)) : 0),
    [productionTotals, actualRunningMinutes]
  );

  /** Total Target ÷ Available Working Hours (from Shift Master's
      actualWorkingMinutes) — used to score each row's Achievement %. */
  const perHourTarget = useMemo(() => {
    const targetVal = hasConveyorLines ? (activeLine?.demandPerShift ?? 0) : plantTotalTarget;
    const hours = (activeShift?.actualWorkingMinutes || 0) / 60;
    return hours > 0 ? Math.round(targetVal / hours) : 0;
  }, [hasConveyorLines, activeLine, plantTotalTarget, activeShift]);

  /* ════════════════════════════════════════════════════════
     VALIDATION
  ════════════════════════════════════════════════════════ */
  const validate = () => {
    if (!activeShift) return "No active shift is configured for this time — check Manage Shift Information";
    if (productionLog.length === 0) return "Add at least one production entry";
    if (activeDowntime) return "Resume production (or wait out the break) before submitting the shift entry";
    if (requiredManpower < availableManpower) return "Required manpower cannot be less than available manpower";
    return null;
  };

  /* ════════════════════════════════════════════════════════
     SAVE
  ════════════════════════════════════════════════════════ */
  const handleSaveProduction = async () => {
    const error = validate();
    if (error) { message.error(error); return; }
    setConfirmSaveOpen(true);
  };

  const confirmAndSave = async () => {
    setConfirmSaveOpen(false);
    setSaving(true);
    try {
      const productions = productionLog.flatMap((entry) =>
        entry.parts.map((p) => ({
          modelId: entry.modelId,
          partId: p.partId,
          productionQty: p.qty,
          conveyorId: entry.conveyorId || undefined,
          startTime: entry.startTime || undefined,
          endTime: entry.endTime || undefined,
          durationMinutes: entry.durationMinutes || 0,
        }))
      );

      const rejects = defectLog
        .filter((d) => d.defectType === "Reject")
        .map((d) => ({ modelId: d.modelId, partId: d.partId, rejectTypeId: d.defectTypeId, quantity: d.quantity }));

      const reworks = defectLog
        .filter((d) => d.defectType === "Rework")
        .map((d) => ({ modelId: d.modelId, partId: d.partId, reworkTypeId: d.defectTypeId, quantity: d.quantity }));

      const payload = {
        reportedBy: user?._id,
        shift: activeShift?.shiftType,
        shiftId: activeShift?._id,
        requiredManpower,
        availableManpower,
        productions, rejects, reworks,
        downtimes: downtimes.map(({ key, downtimeName, isAutoBreak, ...d }) => ({
          ...d,
          startTime: d.startTime ? dayjs(d.startTime).toISOString() : null,
          endTime: d.endTime ? dayjs(d.endTime).toISOString() : null,
        })),
        consumables: consumableLog.map(({ key, ...c }) => c),
        finalRemark: "",
        status: "Submitted",
      };

      await API.post("/production", payload);
      message.success("Production entry submitted successfully!");

      setProductionLog([]); setDefectLog([]); setDowntimes([]);
      setActiveDowntime(null); setLineJobs({}); setFreeJob({ startTime: null, running: false });
      setConsumableLog([]); setRequiredManpower(0); setAvailableManpower(0);
      setActiveLineIdx(0); setLineQty(0);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to save production entry");
    } finally {
      setSaving(false);
    }
  };

  /* ════════════════════════════════════════════════════════
     EXCEL EXPORT
  ════════════════════════════════════════════════════════ */
  const handleExportExcel = () => {
    try {
      setExporting(true);
      const wb = XLSX.utils.book_new();

      const breaksSummary = breaksConfig.map((b) => `${b.breakName} ${b.startTime}-${b.endTime}`).join(" | ");

      const summary = [
        { Field: "Reported By", Value: user?.name },
        { Field: "Email", Value: user?.email },
        { Field: "Plant", Value: user?.plantId?.plantName || user?.plantName },
        { Field: "Location", Value: user?.locationName || user?.plantId?.locationName },
        { Field: "Shift", Value: activeShift?.shiftType || "No active shift" },
        { Field: "Date", Value: dayjs().format("DD/MM/YYYY HH:mm") },
        { Field: "Shift Window", Value: activeShift ? `${activeShift.shiftStartTime} – ${activeShift.shiftEndTime}` : "—" },
        { Field: "Breaks", Value: breaksSummary || "—" },
        { Field: "Actual Running Time", Value: formatHM(actualRunningMinutes) },
        { Field: "Total Target", Value: plantTotalTarget },
        { Field: "Per Hour Target", Value: perHourTarget },
        { Field: "Achievement %", Value: `${achievementPercent}%` },
        { Field: "Avg Rate / hr", Value: avgRatePerHour },
        { Field: "Required Manpower", Value: requiredManpower },
        { Field: "Available Manpower", Value: availableManpower },
        { Field: "Short Manpower", Value: shortageManpower },
        { Field: "Total Production Qty", Value: productionTotals },
        { Field: "Total Reject", Value: defectTotals.reject },
        { Field: "Total Rework", Value: defectTotals.rework },
        { Field: "Total Planned Downtime (min)", Value: downtimeTotals.planned },
        { Field: "Total Unplanned Downtime (min)", Value: downtimeTotals.unplanned },
        { Field: "Total Downtime (min)", Value: downtimeTotals.total },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "Summary");

      const prodRows = productionLog.flatMap((e) =>
        e.parts.map((p) => ({
          Model: e.modelName, Part: p.partName, Line: e.conveyorName || "—",
          Start: e.startTime ? dayjs(e.startTime).format("HH:mm") : "",
          End: e.endTime ? dayjs(e.endTime).format("HH:mm") : "",
          "Duration (min)": e.durationMinutes || 0,
          "Achievement %": computeRowAchievement(e, perHourTarget) ?? "",
          "Production Qty": p.qty, Target: e.demandPerShift || 0,
        }))
      );
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prodRows.length ? prodRows : [{}]), "Production");

      const defectRows = defectLog.map((d) => ({
        Type: d.defectType, Model: d.modelName, Part: d.partName,
        "Defect Name": d.defectTypeName, Quantity: d.quantity,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(defectRows.length ? defectRows : [{}]), "Defects");

      const dtRows = [...downtimes, ...(activeDowntime ? [{ ...activeDowntime, endTime: null, duration: Math.floor(now.diff(dayjs(activeDowntime.startTime), "second") / 60) }] : [])]
        .map((d) => ({
          Type: d.type, Reason: d.downtimeName || "", Source: d.isAutoBreak ? "Auto (Shift Break)" : "Operator",
          "Start Time": d.startTime ? dayjs(d.startTime).format("HH:mm") : "",
          "End Time": d.endTime ? dayjs(d.endTime).format("HH:mm") : "Ongoing",
          "Duration (min)": d.duration || 0, Remark: d.remark || "",
        }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dtRows.length ? dtRows : [{}]), "Downtime");

      const conRows = consumableLog.map((c) => ({
        Material: c.materialName, Type: MATERIAL_TYPE_LABELS[c.materialType] || c.materialType,
        Unit: c.measurementType, Quantity: c.quantity,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(conRows.length ? conRows : [{}]), "Consumables");

      XLSX.writeFile(wb, "Production_Report.xlsx");
      message.success("Production_Report.xlsx downloaded");
    } catch {
      message.error("Failed to generate Excel report");
    } finally {
      setExporting(false);
    }
  };

  /* ════════════════════════════════════════════════════════
     LOADING SCREEN
  ════════════════════════════════════════════════════════ */
  if (pageLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100/70 backdrop-blur-md">
        <div className="flex flex-col items-center gap-4 bg-white border border-slate-200 shadow-[0_24px_60px_-20px_rgba(16,24,40,0.35)] rounded-2xl px-12 py-9">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${NAVY}0f`, border: `1px solid ${NAVY}26` }}>
            <Factory size={20} style={{ color: NAVY }} />
          </div>
          <Spin size="large" />
          <div className="text-center">
            <div className="text-slate-800 text-sm font-semibold tracking-tight">Initializing Production System</div>
            <div className="text-slate-400 text-[11px] mt-1">Loading shift master, models and materials…</div>
          </div>
        </div>
      </div>

    );
  }

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#f1f5f9] bg-[radial-gradient(1200px_500px_at_50%_-200px,rgba(59,111,160,0.10),transparent)]">

      


      {/* ══════════════════════════════════════════════════
          PAGE BODY
      ══════════════════════════════════════════════════ */}
      <div className="px-4 py-5 pb-24 space-y-4 max-w-[1600px] mx-auto">

        {/* ─── 1. SHIFT INFORMATION + LIVE TIMER ─────────── */}
        <div className={CARD}>
          <div className={CARD_HEAD}> 
            <SectionHead icon={Clock3} border={NAVY} color="text-[#1e3a5f]" subtitle="Live shift window, targets and running time">Shift Information</SectionHead>
          </div> <Tooltip title="Back to Production Records">
              <Button size="small" icon={<ArrowLeft size={12} />} onClick={() => navigate("/production-records")}
                className="!rounded-lg !h-8 !font-semibold !text-slate-600 !border-slate-300 !text-[11px]">Records</Button>
            </Tooltip>
          <div className={`${CARD_BODY} space-y-3.5`}>

            {!activeShift && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700 flex items-center gap-2">
                <AlertTriangle size={14} className="flex-shrink-0" />
                No shift is configured for this time slot at your plant. Check Manage Shift Information, or check back at shift start.
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
              <div>
                <label className={LABEL}>Shift</label>
                <div className={`h-8 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
                  !activeShift ? "bg-slate-100 text-slate-400 border border-slate-200"
                  : activeShift.shiftType === "Day" ? "bg-amber-400 text-white" : "bg-slate-800 text-white"
                }`}>
                  {activeShift ? (activeShift.shiftType === "Day" ? <Sun size={12} /> : <Moon size={12} />) : null}
                  {activeShift?.shiftType || "None"}
                </div>
              </div>
              <div><label className={LABEL}>Reported By</label><div className={FIELD}>{user?.name || "—"}</div></div>
              <div><label className={LABEL}>Email</label><div className={`${FIELD} truncate`}>{user?.email || "—"}</div></div>
              <div><label className={LABEL}>Plant</label><div className={FIELD}>{user?.plantId?.plantName || user?.plantName || "—"}</div></div>
              <div><label className={LABEL}>Location</label><div className={FIELD}>{user?.locationName || user?.plantId?.locationName || "—"}</div></div>
              <div>
                <label className={LABEL}>Total Target{hasConveyorLines && activeLine ? ` — ${activeLineLabel}` : ""}</label>
                <div className={`${FIELD} text-teal-700 font-bold`}>{hasConveyorLines ? (activeLine?.demandPerShift ?? 0) : plantTotalTarget}</div>
              </div>
              <div><label className={LABEL}>Working Hours</label><div className={`${FIELD} text-cyan-700 font-bold`}>{activeShift?.actualWorkingHours || "—"}</div></div>
              <div><label className={LABEL}>Per Hour Target</label><div className={`${FIELD} text-purple-700 font-bold`}>{perHourTarget || "—"}</div></div>
            </div>

            {/* Live shift timer bar */}
            <div className={`rounded-xl border px-3 py-2.5 flex items-center justify-between gap-3 flex-wrap ${
              activeDowntime ? (activeDowntime.isAutoBreak ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200")
                : shiftPhase !== "active" ? "bg-slate-50 border-slate-200" : "bg-green-50 border-green-200"
            }`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  shiftPhase !== "active" ? "bg-slate-400" : activeDowntime ? "bg-red-500 animate-pulse" : "bg-green-500 animate-pulse"
                }`} />
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {shiftPhase === "none" ? "No Active Shift" : shiftPhase === "before" ? `Shift starts ${activeShift?.shiftStartTime}` : shiftPhase === "ended" ? "Shift Ended"
                      : activeDowntime ? (activeDowntime.isAutoBreak ? `${activeDowntime.downtimeName} (Auto)` : `Stopped — ${activeDowntime.type}`) : "Production Running"}
                  </div>
                  <div className="text-base font-mono font-extrabold text-slate-800 tabular-nums leading-none mt-0.5">
                    {formatHMS(actualRunningSeconds)}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {activeShift
                      ? `Window ${activeShift.shiftStartTime}–${activeShift.shiftEndTime} · ${breaksConfig.length} break${breaksConfig.length !== 1 ? "s" : ""} scheduled · Effective ${activeShift.actualWorkingHours || "—"}`
                      : "Configure a shift in Manage Shift Information to begin timing"}
                  </div>
                </div>
              </div>

              {activeDowntime && (
                <div className="text-right">
                  <div className="text-[9px] font-semibold uppercase text-red-500">
                    {activeDowntime.isAutoBreak ? "Break Elapsed" : `${activeDowntime.type}${activeDowntime.downtimeName ? " — " + activeDowntime.downtimeName : ""}`}
                  </div>
                  <div className="text-sm font-mono font-bold text-red-600">
                    {formatHMS(now.diff(dayjs(activeDowntime.startTime), "second"))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {shiftPhase === "active" && !inBreakWindow && (
                  activeDowntime ? (
                    <Button size="small" icon={<Play size={12} />} onClick={resumeProduction}
                      className="!rounded-lg !font-bold !text-white !text-xs" style={{ backgroundColor: "#16a34a", borderColor: "#16a34a" }}>
                      Resume
                    </Button>
                  ) : (
                    <Button size="small" icon={<Square size={12} />} onClick={openStopModal}
                      className="!rounded-lg !font-bold !text-white !text-xs" style={{ backgroundColor: "#dc2626", borderColor: "#dc2626" }}>
                      Stop
                    </Button>
                  )
                )}
                {inBreakWindow && (
                  <Tag color="gold" className="!rounded-lg !font-semibold !px-2.5 !py-1 !text-xs">
                    <Coffee size={11} className="inline -mt-0.5 mr-1" />Auto: {activeBreakWindow.breakName}
                  </Tag>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stop → classify downtime popup */}
        <Modal open={stopModalOpen} onCancel={() => setStopModalOpen(false)} footer={null} title={null} centered width={400} forceRender>
          <div className="pb-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Square size={14} className="text-red-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">Line Stopped</div>
                <div className="text-[10px] text-slate-500">Classify this downtime to continue</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {["Planned", "Unplanned"].map((t) => (
                <button key={t} onClick={() => { setStopType(t); setStopReasonId(null); }}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    stopType === t
                      ? t === "Planned" ? "bg-blue-600 border-blue-600 text-white" : "bg-red-600 border-red-600 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}>
                  {t}
                </button>
              ))}
            </div>

            {stopType && (
              <div className="mb-3">
                <label className={LABEL}>Reason</label>
                <Select className="w-full" size="small" placeholder="Select downtime reason"
                  value={stopReasonId}
                  options={downtimeTypes.filter((t) => t.type === stopType).map((t) => ({ value: t._id, label: t.name }))}
                  onChange={setStopReasonId} />
              </div>
            )}

            {stopType === "Unplanned" && (
              <div className="mb-3">
                <label className={LABEL}>Description (required, max 10 words)</label>
                <Input size="small" placeholder="Brief reason..." value={stopRemark} onChange={(e) => setStopRemark(e.target.value)} />
                <span className={`text-[10px] ${wordCount(stopRemark) > 10 ? "text-red-500" : "text-slate-400"}`}>{wordCount(stopRemark)}/10 words</span>
              </div>
            )}

            <Button type="primary" block onClick={confirmStopDowntime}
              className="!rounded-xl !font-bold !mt-1" style={{ backgroundColor: "#dc2626", borderColor: "#dc2626" }}>
              Confirm Stop
            </Button>
          </div>
        </Modal>

        {/* Reset-all confirmation popup */}
        <Modal open={resetConfirmOpen} onCancel={() => setResetConfirmOpen(false)} footer={null} title={null} centered width={380} forceRender>
          <div className="pb-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Eraser size={14} className="text-red-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">Reset All Entry Data?</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Clears production, defects, downtime, manpower & consumables for this shift, including the saved browser draft. This cannot be undone.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end mt-3">
              <Button size="small" onClick={() => setResetConfirmOpen(false)} className="!rounded-lg">Cancel</Button>
              <Button size="small" danger type="primary" onClick={handleResetAll} className="!rounded-lg !font-semibold">
                Yes, Reset Everything
              </Button>
            </div>
          </div>
        </Modal>

        {/* ─── 2. PRODUCTION ENTRY ──────────────────────── */}
        <div className={CARD}>
          <div className={CARD_HEAD}>
            <SectionHead icon={Package} border={NAVY_SOFT} color="text-[#3b6fa0]" subtitle="Log completed output per line / model">Production Entry</SectionHead>
          </div>
          <div className={CARD_BODY}>

            {hasConveyorLines && (
              <div className={`${WELL} mb-4`}>
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  <Tooltip title="Back to previous line">
                    <Button size="small" type="text" icon={<ArrowLeft size={12} />} onClick={() => handleSwitchLine(safeLineIdx - 1)} disabled={safeLineIdx === 0} className="!rounded-lg !text-slate-500" />
                  </Tooltip>
                  {conveyorLines.map((line, idx) => (
                    <button key={line._id} onClick={() => handleSwitchLine(idx)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        idx === safeLineIdx ? "bg-blue-600 border-blue-600 text-white shadow" : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"
                      }`}>
                      {line.conveyorName || `Line ${idx + 1}`}
                      {lineJobs[line._id]?.running && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-red-400 inline-block animate-pulse" />}
                    </button>
                  ))}
                  <Tooltip title="Next line">
                    <Button size="small" type="text" icon={<ArrowLeft size={12} style={{ transform: "rotate(180deg)" }} />} onClick={() => handleSwitchLine(safeLineIdx + 1)} disabled={safeLineIdx >= conveyorLines.length - 1} className="!rounded-lg !text-slate-500" />
                  </Tooltip>
                </div>

                {activeLine && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                    <div><label className={LABEL}>Model</label><div className={FIELD}>{activeLine.modelId?.modelName || activeLine.modelId?.name || "—"}</div></div>
                    <div><label className={LABEL}>Part</label><div className={FIELD}>{activeLine.partId?.partName || activeLine.partId?.name || "—"}</div></div>
                    <div><label className={LABEL}>Target (this line)</label><div className={`${FIELD} text-teal-700 font-bold`}>{activeLine.demandPerShift ?? 0}</div></div>
                    <div>
                      <label className={LABEL}>Production Qty</label>
                      <InputNumber className="w-full" size="small" min={0} placeholder="0" value={lineQty || null} onChange={(v) => setLineQty(v || 0)} />
                    </div>
                    <div>
                      <label className={LABEL}>Job Timer</label>
                      {activeLineJob?.running ? (
                        <Tooltip title={activeLineJobPaused ? "Paused — line is stopped for downtime" : "Running"}>
                          <div className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 border ${activeLineJobPaused ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeLineJobPaused ? "bg-amber-500" : "bg-red-500 animate-pulse"}`} />
                            <span className={`text-xs font-mono font-bold ${activeLineJobPaused ? "text-amber-600" : "text-red-600"}`}>{formatHMS(activeLineJobSeconds)}</span>
                            {activeLineJobPaused && <span className="text-[9px] font-bold text-amber-500 uppercase">Paused</span>}
                          </div>
                        </Tooltip>
                      ) : (
                        <Button size="small" icon={<Play size={11} />} onClick={handleStartLineJob} disabled={!!activeDowntime}
                          className="!rounded-lg !w-full !font-semibold !text-white !text-xs" style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}>
                          Start Job
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <Button type="primary" size="small" icon={<Plus size={13} />} onClick={handleAddLineProductionRow}
                  disabled={!activeLine || !activeLineJob?.running}
                  className="!rounded-xl !bg-blue-600 !border-blue-600 !font-semibold mt-3">
                  Complete & Add to List
                </Button>

                {activeLineRows.length > 0 ? (
                  <div className="mt-3">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      {activeLineLabel} — {activeLineRows.length} {activeLineRows.length === 1 ? "Entry" : "Entries"}
                    </div>
                    <div className={TABLE_WRAP}>
                      <Table size="small" rowKey="key" columns={lineProductionColumns} dataSource={activeLineRows} pagination={false} />
                    </div>
                  </div>
                ) : (
                  <div className={HINT}>No entries yet for {activeLineLabel}</div>
                )}
              </div>
            )}

            {!hasConveyorLines && (
              <div className={`${WELL} mb-4`}>
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  <div className="flex-shrink-0">
                    <label className={LABEL}>Select Model</label>
                    <Select className="w-48" size="small" placeholder="— choose model —" value={selectedModelId}
                      showSearch optionFilterProp="label" loading={pageLoading}
                      options={selectableModels.map((m) => ({ value: m._id, label: m.modelName || m.name }))}
                      notFoundContent={selectableModels.length === 0 && models.length > 0 ? "All models already added" : undefined}
                      onChange={handleModelChange} />
                  </div>
                  {selectedModelId && (
                    freeJob.running ? (
                      <Tooltip title={freeJobPaused ? "Paused — line is stopped for downtime" : "Running"}>
                        <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 mt-4 border ${freeJobPaused ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${freeJobPaused ? "bg-amber-500" : "bg-red-500 animate-pulse"}`} />
                          <span className={`text-xs font-mono font-bold ${freeJobPaused ? "text-amber-600" : "text-red-600"}`}>{formatHMS(freeJobSeconds)}</span>
                          {freeJobPaused && <span className="text-[9px] font-bold text-amber-500 uppercase">Paused</span>}
                        </div>
                      </Tooltip>
                    ) : (
                      <Button size="small" icon={<Play size={11} />} onClick={handleStartFreeJob} disabled={!!activeDowntime}
                        className="!rounded-lg !font-semibold !text-white !text-xs mt-4" style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}>
                        Start Job
                      </Button>
                    )
                  )}
                </div>

                {loadingCurrentParts && (
                  <div className="flex items-center gap-2 py-2 text-slate-500 text-xs"><Spin size="small" /> Loading parts...</div>
                )}

                {!loadingCurrentParts && selectedModelId && currentModelParts.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 mb-3">
                    {currentModelParts.map((part) => (
                      <div key={part._id}>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">{part.partName || part.name}</label>
                        <InputNumber className="w-full" size="small" min={0} placeholder="0"
                          value={currentPartQtys[part._id] || null} onChange={(v) => handlePartQtyChange(part._id, v)} />
                      </div>
                    ))}
                  </div>
                )}

                {!loadingCurrentParts && selectedModelId && currentModelParts.length === 0 && (
                  <Empty description="No parts configured for this model" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-2" />
                )}

                <Button type="primary" size="small" icon={<Plus size={13} />} onClick={handleAddProductionRow}
                  disabled={!selectedModelId || currentModelParts.length === 0 || !freeJob.running}
                  className="!rounded-xl !bg-blue-600 !border-blue-600 !font-semibold">
                  Complete & Add to List
                </Button>
              </div>
            )}

            {!hasConveyorLines && (
              productionLog.length > 0 ? (
                <>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Production Log — {productionLog.length} {productionLog.length === 1 ? "Entry" : "Entries"}
                  </div>
                  <div className={TABLE_WRAP}>
                    <Table size="small" rowKey="key" columns={productionColumns} dataSource={productionLog} pagination={false} />
                  </div>
                </>
              ) : (
                <div className={HINT}>No entries yet — select a model and add production data above</div>
              )
            )}
          </div>
        </div>

        {/* ─── 3. DEFECTS (REJECT + REWORK) — dynamic to started models ── */}
        <div className={CARD}>
          <div className={CARD_HEAD}>
            <SectionHead icon={ShieldAlert} border="#dc2626" color="text-red-500" subtitle="Quality losses captured against started models">Defects — Reject & Rework</SectionHead>
          </div>
          <div className={CARD_BODY}>
            {availableDefectModels.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-5 text-center text-xs text-slate-400 mb-3">
                Start or add a model in Production Entry above to log defects for it.
              </div>
            ) : (
              <div className={`${WELL} mb-4`}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 items-end">
                  <div>
                    <label className={LABEL}>Model</label>
                    <Select className="w-full" size="small" placeholder="Select model" showSearch optionFilterProp="label"
                      value={defectForm.modelId}
                      options={availableDefectModels.map((m) => ({ value: m._id, label: m.modelName || m.name }))}
                      onChange={(v) => handleDefectModelChange(v)} />
                  </div>
                  <div>
                    <label className={LABEL}>Part</label>
                    <Select className="w-full" size="small" placeholder="Select part" showSearch optionFilterProp="label"
                      disabled={!defectForm.modelId} loading={!!partsLoading[defectForm.modelId]}
                      value={defectForm.partId}
                      options={defectModelParts.map((p) => ({ value: p._id, label: p.partName || p.name }))}
                      onChange={(v) => setDefectForm((f) => ({ ...f, partId: v }))} />
                  </div>
                  <div>
                    <label className={LABEL}>Type</label>
                    <Select className="w-full" size="small" placeholder="Reject / Rework"
                      value={defectForm.defectType}
                      options={[{ value: "Reject", label: "🔴 Reject" }, { value: "Rework", label: "🟠 Rework" }]}
                      onChange={(v) => setDefectForm((f) => ({ ...f, defectType: v, defectTypeId: null }))} />
                  </div>
                  <div>
                    <label className={LABEL}>Defect Name</label>
                    <Select className="w-full" size="small" placeholder="Select reason" showSearch optionFilterProp="label"
                      disabled={!defectForm.defectType}
                      value={defectForm.defectTypeId}
                      options={(defectForm.defectType === "Reject" ? rejectTypes : reworkTypes).map((t) => ({ value: t._id, label: t.name }))}
                      onChange={(v) => setDefectForm((f) => ({ ...f, defectTypeId: v }))} />
                  </div>
                  <div>
                    <label className={LABEL}>Quantity</label>
                    <InputNumber className="w-full" size="small" min={0} value={defectForm.quantity} onChange={(v) => setDefectForm((f) => ({ ...f, quantity: v || 0 }))} />
                    {defectForm.defectType === "Reject" && defectForm.modelId && defectForm.partId && (
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        Available to reject: <span className="font-semibold text-slate-500">{availableToReject(defectForm.modelId, defectForm.partId)}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <Button type="primary" size="small" icon={<Plus size={13} />} className="w-full !rounded-xl"
                      style={{ backgroundColor: "#dc2626", borderColor: "#dc2626" }} onClick={handleAddDefectRow}>
                      Add Defect
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {defectLog.length > 0 ? (
              <div className={TABLE_WRAP}>
                <table className="w-full">
                  <thead><tr>{["#", "Type", "Model", "Part", "Defect Name", "Qty", ""].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    {defectLog.map((row, i) => (
                      <tr key={row.key} className="hover:bg-slate-50/50">
                        <td className={`${TD} text-slate-400`}>{i + 1}</td>
                        <td className={TD}><Tag color={row.defectType === "Reject" ? "red" : "orange"} className="!rounded-lg !font-semibold !text-[11px]">{row.defectType}</Tag></td>
                        <td className={TD}><Tag color="cyan" className="!rounded-lg !text-[11px]">{row.modelName}</Tag></td>
                        <td className={TD}><span className="font-medium">{row.partName}</span></td>
                        <td className={TD}>{row.defectTypeName}</td>
                        <td className={`${TD} font-bold text-slate-800`}>{row.quantity}</td>
                        <td className={TD}><Button danger type="text" size="small" icon={<Trash2 size={12} />} onClick={() => handleRemoveDefectRow(row.key)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={HINT}>No defects added yet</div>
            )}

            {defectLog.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-3.5">
                <StatTile label="Total Reject" value={defectTotals.reject} accent="#dc2626" />
                <StatTile label="Total Rework" value={defectTotals.rework} accent="#ea580c" />
                <StatTile label="Total Defects" value={defectTotals.total} accent={NAVY} />
              </div>

            )}
          </div>
        </div>

        {/* ─── 4. MANPOWER ─────────────────────────────── */}
        <div className={CARD}>
          <div className={CARD_HEAD}>
            <SectionHead icon={Users} border="#7c3aed" color="text-purple-600" subtitle="Planned vs available operators on the line">Manpower Details</SectionHead>
          </div>
          <div className={CARD_BODY}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>Required Manpower</label>
                <InputNumber className="w-full" size="small" min={0} value={requiredManpower} onChange={(v) => setRequiredManpower(v || 0)} />
              </div>
              <div>
                <label className={LABEL}>Available Manpower</label>
                <InputNumber className="w-full" size="small" min={0} value={availableManpower} onChange={(v) => setAvailableManpower(v || 0)} />
              </div>
              <div>
                <label className={LABEL}>Manpower Shortage <span className="normal-case font-normal text-slate-400">(auto)</span></label>
                <div className={`w-full border rounded-xl px-3 py-1.5 text-base font-bold text-center ${
                  shortageManpower > 0 ? "bg-red-50 border-red-200 text-red-600" : "bg-green-50 border-green-200 text-green-600"
                }`}>
                  {shortageManpower}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 5. DOWNTIME LOG — auto-captured, read-only ── */}
        <div className={CARD}>
          <div className={CARD_HEAD}>
            <SectionHead icon={Clock3} border="#d97706" color="text-amber-600" subtitle="Auto-captured stops and scheduled breaks" extra={
              <Tag className="!rounded-lg !text-[10px]">Locked — auto-tracked from Shift Master</Tag>
            }>
              Downtime Log
            </SectionHead>
          </div>
          <div className={CARD_BODY}>
            {downtimes.length === 0 && !activeDowntime ? (
              <Empty description="No downtime recorded" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-3" />
            ) : (
              <div className={TABLE_WRAP}>
                <table className="w-full">
                  <thead><tr>{["#", "Type", "Reason", "Start", "End", "Duration", "Remark"].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    {activeDowntime && (
                      <tr className="bg-red-50/50">
                        <td className={`${TD} text-slate-400`}>•</td>
                        <td className={TD}><Tag color={activeDowntime.type === "Planned" ? "blue" : "volcano"} className="!rounded-lg !text-[11px]">{activeDowntime.type}</Tag></td>
                        <td className={TD}>{activeDowntime.downtimeName || "—"}</td>
                        <td className={TD}>{dayjs(activeDowntime.startTime).format("HH:mm")}</td>
                        <td className={TD}><Tag color="red" className="!rounded-lg !text-[10px] animate-pulse">LIVE</Tag></td>
                        <td className={TD}><Tag color="cyan" className="!rounded-lg !text-[11px]">{formatHMS(now.diff(dayjs(activeDowntime.startTime), "second"))}</Tag></td>
                        <td className={`${TD} italic text-slate-500`}>{activeDowntime.remark || "—"}</td>
                      </tr>
                    )}
                    {downtimes.slice().reverse().map((d, i) => (
                      <tr key={d.key} className="hover:bg-slate-50/50">
                        <td className={`${TD} text-slate-400`}>{downtimes.length - i}</td>
                        <td className={TD}><Tag color={d.type === "Planned" ? "blue" : "volcano"} className="!rounded-lg !text-[11px]">{d.type}</Tag></td>
                        <td className={TD}>{d.downtimeName || "—"}</td>
                        <td className={TD}>{dayjs(d.startTime).format("HH:mm")}</td>
                        <td className={TD}>{dayjs(d.endTime).format("HH:mm")}</td>
                        <td className={TD}><Tag color="cyan" className="!rounded-lg !text-[11px]">{formatHM(d.duration)}</Tag></td>
                        <td className={`${TD} italic text-slate-500`}>{d.remark || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 mt-3.5">
              <StatTile label="Planned (min)" value={downtimeTotals.planned} accent="#2563eb" />
              <StatTile label="Unplanned (min)" value={downtimeTotals.unplanned} accent="#dc2626" />
              <StatTile label="Total (min)" value={downtimeTotals.total} accent={NAVY} />
            </div>

          </div>
        </div>

        {/* ─── 6. CONSUMABLE MATERIALS ─────────────────── */}
        <div className={CARD}>
          <div className={CARD_HEAD}>
            <SectionHead icon={FlaskConical} border={NAVY} color="text-[#1e3a5f]" subtitle="Powder, chemical and useful item consumption">Consumable Materials</SectionHead>
          </div>
          <div className={CARD_BODY}>
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {Object.entries(MATERIAL_TYPE_LABELS).map(([key, label]) => (
                <button key={key} onClick={() => { setConsumableMaterialType(key); setConsumableForm({ materialId: null, quantity: 0 }); }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    consumableMaterialType === key ? "bg-teal-600 border-teal-600 text-white shadow" : "bg-white border-slate-200 text-slate-600 hover:border-teal-300"
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            <div className={`${WELL} mb-4`}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                <div className="md:col-span-2">
                  <label className={LABEL}>{MATERIAL_TYPE_LABELS[consumableMaterialType]} Name</label>
                  <Select className="w-full" size="small" placeholder={`Select ${MATERIAL_TYPE_LABELS[consumableMaterialType].toLowerCase()}`}
                    showSearch optionFilterProp="label" value={consumableForm.materialId}
                    options={filteredMaterials.map((m) => ({ value: m._id, label: m.name }))}
                    onChange={(v) => handleMaterialChange(v)} />
                </div>
                <div>
                  <label className={LABEL}>Unit (auto)</label>
                  <div className={FIELD}>{consumableForm.materialId ? materials.find((m) => m._id === consumableForm.materialId)?.mesurmentType || "—" : "—"}</div>
                </div>
                <div>
                  <label className={LABEL}>Quantity</label>
                  <InputNumber className="w-full" size="small" min={0} value={consumableForm.quantity} onChange={(v) => setConsumableForm((f) => ({ ...f, quantity: v || 0 }))} />
                </div>
              </div>
              <div className="mt-2.5">
                <Button type="primary" size="small" icon={<Plus size={13} />} onClick={handleAddConsumableRow}
                  className="!rounded-xl" style={{ backgroundColor: "#0d9488", borderColor: "#0d9488" }}>
                  Add {MATERIAL_TYPE_LABELS[consumableMaterialType]}
                </Button>
              </div>
            </div>

            {consumableLog.length > 0 ? (
              <div className={TABLE_WRAP}>
                <table className="w-full">
                  <thead><tr>{["#", "Material", "Type", "Unit", "Qty", ""].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    {consumableLog.map((row, i) => (
                      <tr key={row.key} className="hover:bg-slate-50/50">
                        <td className={`${TD} text-slate-400`}>{i + 1}</td>
                        <td className={`${TD} font-medium`}>{row.materialName}</td>
                        <td className={TD}><Tag color={MATERIAL_TYPE_COLORS[row.materialType] || "default"} className="!rounded-lg !text-[11px]">{MATERIAL_TYPE_LABELS[row.materialType] || row.materialType}</Tag></td>
                        <td className={TD}><Tag className="!rounded-lg !font-semibold !text-[11px]">{row.measurementType}</Tag></td>
                        <td className={`${TD} font-bold text-slate-800`}>{row.quantity}</td>
                        <td className={TD}><Button danger type="text" size="small" icon={<Trash2 size={12} />} onClick={() => handleRemoveConsumableRow(row.key)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={HINT}>No consumables added yet</div>
            )}
          </div>
        </div>

        {/* ─── 7. FINAL SUMMARY KPIs ───────────────────── */}
        <div className="pt-1">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${NAVY}12`, border: `1px solid ${NAVY}26` }}>
              <TrendingUp size={14} style={{ color: NAVY }} />
            </span>
            <h2 className="text-[13px] font-bold text-slate-800 m-0 tracking-[-0.01em]">Final Summary</h2>
            <span className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">

            <KpiCard icon={Package}       label="Total Production"    value={productionTotals}         tone="blue" />
            <KpiCard icon={ShieldAlert}   label="Total Reject"        value={defectTotals.reject}      tone="red" />
            <KpiCard icon={RotateCcw}     label="Total Rework"        value={defectTotals.rework}      tone="amber" />
            <KpiCard icon={AlertTriangle} label="Total Defects"       value={defectTotals.total}       tone="slate" />
            <KpiCard icon={Clock3}        label="Downtime (min)"      value={downtimeTotals.total}     tone="purple" />
            <KpiCard icon={Timer}         label="Actual Running"      value={formatHM(actualRunningMinutes)} tone="teal" />
            <KpiCard icon={TrendingUp}    label="Avg Rate / hr"       value={avgRatePerHour}           tone="cyan" />
            <KpiCard icon={Users}         label="Manpower Shortage"   value={shortageManpower}         tone={shortageManpower > 0 ? "red" : "green"} />
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════
          STICKY SAVE FOOTER
      ══════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200 shadow-[0_-6px_28px_rgba(16,24,40,0.10)] px-4 py-2.5">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { v: productionLog.length, l: "production rows", c: NAVY },
              { v: defectTotals.reject, l: "rejects", c: "#dc2626" },
              { v: defectTotals.rework, l: "reworks", c: "#ea580c" },
              { v: `${downtimeTotals.total} min`, l: "downtime", c: "#d97706" },
              { v: formatHM(actualRunningMinutes), l: "running", c: "#0f766e" },
            ].map(({ v, l, c }) => (
              <span key={l} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1">
                <strong className="text-xs font-bold tabular-nums" style={{ color: c }}>{v}</strong>
                <span className="text-[10px] text-slate-500 tracking-wide">{l}</span>
              </span>
            ))}
          </div>
          <Button type="primary" size="middle" icon={<Save size={15} />} loading={saving} onClick={handleSaveProduction}
            className="!rounded-xl !font-bold !px-7 !h-9 !text-xs !shadow-lg"
            style={{ backgroundColor: NAVY, borderColor: NAVY, boxShadow: "0 8px 20px -8px rgba(30,58,95,0.6)" }}>
            Save Production Entry
          </Button>


          <Modal
            open={confirmSaveOpen}
            onCancel={() => setConfirmSaveOpen(false)}
            onOk={confirmAndSave}
            okText="Yes, Submit Entry"
            cancelText="Go Back & Review"
            okButtonProps={{ loading: saving, style: { backgroundColor: "#0e7490", borderColor: "#0e7490", fontWeight: 600 } }}
            cancelButtonProps={{ className: "!rounded-lg" }}
            title={null}
            centered
            width={440}
            forceRender
          >
            <div style={{ borderBottom: "3px solid #0e7490", margin: "-20px -24px 16px", padding: "16px 24px", borderRadius: "8px 8px 0 0", background: "#f0fdfa" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <Save size={16} className="text-teal-700" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">Submit Production Entry?</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Please confirm before final submission</div>
                </div>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600 py-1">
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-1.5">
                <span className="text-slate-500">Shift</span><span className="font-semibold text-slate-800">{activeShift?.shiftType || "—"}</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-1.5">
                <span className="text-slate-500">Production Entries</span><span className="font-semibold text-slate-800">{productionLog.length} row(s)</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-1.5">
                <span className="text-slate-500">Total Production Qty</span><span className="font-semibold text-teal-700">{productionTotals}</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-1.5">
                <span className="text-slate-500">Achievement %</span>
                <span className={`font-semibold ${achievementPercent >= 90 ? "text-green-600" : achievementPercent >= 70 ? "text-amber-600" : "text-red-500"}`}>{achievementPercent}%</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-1.5">
                <span className="text-slate-500">Total Defects</span><span className="font-semibold text-red-600">{defectTotals.total}</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-1.5">
                <span className="text-slate-500">Actual Running Time</span><span className="font-semibold text-teal-700">{formatHM(actualRunningMinutes)}</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-1.5">
                <span className="text-slate-500">Total Downtime</span><span className="font-semibold text-amber-600">{downtimeTotals.total} min</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-1.5">
                <span className="text-slate-500">Reported By</span><span className="font-semibold text-slate-800">{user?.name || "—"}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2.5">
              This entry will be marked as <strong>Submitted</strong> and cannot be edited afterwards.
            </p>
          </Modal>
        </div>
      </div>

    </div>
  );
}