import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import * as XLSX from "xlsx";
import {
  Table, Button, Tag, Tooltip, message, Spin, Empty,
  Modal, DatePicker, Input, Tabs, Select, Dropdown,
} from "antd";
import {
  Factory, Plus, LogOut, RefreshCcw, CalendarDays, UserCircle2,
  Package, ShieldAlert, RotateCcw, AlertTriangle, Clock3, Users,
  TrendingUp, Eye, Search, Download, Sun, Moon, MapPin,
  BarChart3, ChevronDown, FlaskConical, Wrench,
} from "lucide-react";

dayjs.extend(isBetween);

const API = axiosInstance;

/* ─────────────────────────────────────────────────────────
   DATE RANGE PRESETS
───────────────────────────────────────────────────────── */
const PRESETS = [
  {
    key: "today",
    label: "Today",
    range: () => [dayjs().startOf("day"), dayjs().endOf("day")],
  },
  {
    key: "yesterday",
    label: "Yesterday",
    range: () => [dayjs().subtract(1, "day").startOf("day"), dayjs().subtract(1, "day").endOf("day")],
  },
  {
    key: "last7",
    label: "Last 7 Days",
    range: () => [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")],
  },
  {
    key: "last30",
    label: "Last 30 Days",
    range: () => [dayjs().subtract(29, "day").startOf("day"), dayjs().endOf("day")],
  },
  {
    key: "thisMonth",
    label: "This Month",
    range: () => [dayjs().startOf("month"), dayjs().endOf("month")],
  },
  {
    key: "lastMonth",
    label: "Last Month",
    range: () => [
      dayjs().subtract(1, "month").startOf("month"),
      dayjs().subtract(1, "month").endOf("month"),
    ],
  },
  { key: "custom", label: "Custom Range", range: null },
];

/* ─────────────────────────────────────────────────────────
   STYLE HELPERS
───────────────────────────────────────────────────────── */
const CARD = "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden";

const TH = "text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2.5 py-1.5 bg-slate-50 border-b border-slate-200 whitespace-nowrap text-left";
const TD = "px-2.5 py-1.5 border-b border-slate-100 text-xs text-slate-700 align-top";

/* ─────────────────────────────────────────────────────────
   KPI CARD
───────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, tone = "slate", loading }) {
  const tones = {
    blue:   { bg: "#eff6ff", border: "#bfdbfe", val: "#1d4ed8", ic: "#93c5fd", circle: "#dbeafe" },
    red:    { bg: "#fff1f2", border: "#fecdd3", val: "#dc2626", ic: "#fca5a5", circle: "#fee2e2" },
    amber:  { bg: "#fffbeb", border: "#fde68a", val: "#d97706", ic: "#fcd34d", circle: "#fef3c7" },
    purple: { bg: "#faf5ff", border: "#e9d5ff", val: "#7c3aed", ic: "#c4b5fd", circle: "#ede9fe" },
    green:  { bg: "#f0fdf4", border: "#bbf7d0", val: "#16a34a", ic: "#86efac", circle: "#dcfce7" },
    teal:   { bg: "#f0fdfa", border: "#99f6e4", val: "#0d9488", ic: "#5eead4", circle: "#ccfbf1" },
    slate:  { bg: "#f8fafc", border: "#e2e8f0", val: "#334155", ic: "#94a3b8", circle: "#f1f5f9" },
  };
  const t = tones[tone] || tones.slate;

  return (
    <div
      className="relative rounded-lg border p-2.5 overflow-hidden"
      style={{ background: t.bg, borderColor: t.border }}
    >
      <div
        className="absolute -top-2.5 -right-2.5 w-10 h-10 rounded-full opacity-50"
        style={{ background: t.circle }}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-1">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500 m-0 leading-tight">{label}</p>
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: t.circle }}
          >
            <Icon size={11} style={{ color: t.ic }} />
          </div>
        </div>
        {loading ? (
          <div className="h-5 w-14 bg-slate-100 rounded animate-pulse" />
        ) : (
          <p className="text-lg font-black leading-none m-0" style={{ color: t.val }}>
            {typeof value === "string" ? value : (value ?? 0).toLocaleString()}
          </p>
        )}
        {sub && <p className="text-[9px] text-slate-400 mt-0.5 m-0 truncate">{sub}</p>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   DETAIL MODAL
───────────────────────────────────────────────────────── */
export function RecordDetailModal({ record, open, onClose, plantStrengths = [] }) {
  if (!record) return null;

  const modalTarget = (() => {
    if (record.shiftSummary?.target > 0) return record.shiftSummary.target;
    const rShiftId = record.shiftId?._id || record.shiftId;
    const scoped = rShiftId
      ? plantStrengths.filter((p) => String(p.shiftId) === String(rShiftId))
      : plantStrengths;
    return scoped.reduce((sum, p) => sum + (p.demandPerShift || 0), 0);
  })();
  const modalAchieved = record.shiftSummary?.achieved ?? record.totalProductionQty ?? 0;
  const modalAchievement = modalTarget > 0 ? parseFloat(((modalAchieved / modalTarget) * 100).toFixed(2)) : 0;

  /* helper to extract name from either populated object or plain string */
  const name = (obj, keys = ["name", "modelName", "partName"]) => {
    if (!obj) return "—";
    if (typeof obj === "string") return obj;
    for (const k of keys) if (obj[k]) return obj[k];
    return "—";
  };

  const shiftStyle =
    record.shift === "Day"
      ? { background: "#fefce8", border: "1px solid #fde68a", color: "#92400e" }
      : { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af" };

  const summaryItems = [
    { label: "Target",         value: modalTarget, color: "#0f766e", bg: "#f0fdfa" },
    { label: "Achievement %",  value: `${modalAchievement}%`, color: "#0d9488", bg: "#f0fdfa" },
    { label: "Production",     value: record.totalProductionQty ?? 0, color: "#1d4ed8", bg: "#eff6ff" },
    { label: "Reject",         value: record.totalRejectQty     ?? 0, color: "#dc2626", bg: "#fff1f2" },
    { label: "Rework",         value: record.totalReworkQty     ?? 0, color: "#d97706", bg: "#fffbeb" },
    { label: "Downtime (min)", value: record.totalDowntime      ?? 0, color: "#7c3aed", bg: "#faf5ff" },
    { label: "Required MP",    value: record.requiredManpower   ?? 0, color: "#334155", bg: "#f8fafc" },
    { label: "Short MP",       value: record.shortageManpower   ?? 0,
      color: (record.shortageManpower ?? 0) > 0 ? "#dc2626" : "#16a34a",
      bg:    (record.shortageManpower ?? 0) > 0 ? "#fff1f2" : "#f0fdf4" },
  ];

  
  const tabs = [
    /* ── PRODUCTION ── */
    {
      key: "production",
      label: (
        <span className="flex items-center gap-1.5">
          <Package size={13} /> Production ({(record.productions || []).length})
        </span>
      ),
      children: (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr>
                {["#", "Line", "Model", "Part", "Production Qty", "Painted Area (m²)", "Hanger Used"].map(h => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(record.productions || []).length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-slate-400">No production entries</td></tr>
              ) : (record.productions || []).map((e, i) => {
                const partArea = Number(e.partId?.area || 0);
                const partsPerHanger = Number(e.partId?.partsPerHanger || 1);
                const qty = Number(e.productionQty || 0);
                const rowPaintedArea = (qty * partArea).toFixed(2);
                const rowHangersUsed = (qty / partsPerHanger).toFixed(2);
                return (
                  <tr key={i} className="hover:bg-slate-50/60">
                    <td className={`${TD} text-slate-400 w-10`}>{i + 1}</td>
                    <td className={TD}>
                      {name(e.conveyorId, ["conveyorName"]) !== "—"
                        ? <Tag color="blue" className="!rounded-lg !font-semibold">{name(e.conveyorId, ["conveyorName"])}</Tag>
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className={TD}>
                      <Tag color="cyan" className="!rounded-lg !font-semibold">
                        {name(e.modelId, ["modelName", "name"])}
                      </Tag>
                    </td>
                    <td className={`${TD} font-medium`}>{name(e.partId, ["partName", "name"])}</td>
                    <td className={`${TD} font-bold text-blue-700 text-center`}>{qty}</td>
                    <td className={`${TD} font-semibold text-cyan-700 text-center`}>{rowPaintedArea}</td>
                    <td className={`${TD} font-semibold text-emerald-700 text-center`}>{rowHangersUsed}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ),
    },
    /* ── DEFECTS ── */
    {
      key: "defects",
      label: (
        <span className="flex items-center gap-1.5">
          <ShieldAlert size={13} /> Defects ({(record.rejects || []).length + (record.reworks || []).length})
        </span>
      ),
      children: (() => {
        const combinedDefects = [
          ...(record.rejects || []).map(d => ({ ...d, type: "Reject", defectTypeId: d.rejectTypeId })),
          ...(record.reworks || []).map(d => ({ ...d, type: "Rework", defectTypeId: d.reworkTypeId })),
        ];
        return (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr>
                  {["#", "Type", "Model", "Part", "Defect Name", "Qty"].map(h => (
                    <th key={h} className={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {combinedDefects.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-slate-400">No defects recorded</td></tr>
                ) : combinedDefects.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50/60">
                    <td className={`${TD} text-slate-400 w-10`}>{i + 1}</td>
                    <td className={TD}>
                      <Tag
                        color={d.type === "Reject" ? "red" : "orange"}
                        className="!rounded-lg !font-bold"
                      >
                        {d.type}
                      </Tag>
                    </td>
                    <td className={TD}>
                      <Tag color="cyan" className="!rounded-lg">
                        {name(d.modelId, ["modelName", "name"])}
                      </Tag>
                    </td>
                    <td className={TD}>{name(d.partId, ["partName", "name"])}</td>
                    <td className={TD}>{name(d.defectTypeId, ["name"])}</td>
                    <td className={`${TD} font-bold text-center`}>{d.quantity ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })(),
    },
    /* ── DOWNTIME ── */
    {
      key: "downtime",
      label: (
        <span className="flex items-center gap-1.5">
          <Clock3 size={13} /> Downtime ({(record.downtimes || []).length})
        </span>
      ),
      children: (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[620px]">
              <thead>
                <tr>
                  {["#", "Type", "Reason", "Start", "End", "Duration", "Remark"].map(h => (
                    <th key={h} className={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(record.downtimes || []).length === 0 ? (
                  <tr><td colSpan={7} className="py-10 text-center text-slate-400">No downtime recorded</td></tr>
                ) : (record.downtimes || []).map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50/60">
                    <td className={`${TD} text-slate-400 w-10`}>{i + 1}</td>
                    <td className={TD}>
                      <Tag
                        color={d.type === "Planned" ? "blue" : "volcano"}
                        className="!rounded-lg"
                      >
                        {d.type}
                      </Tag>
                    </td>
                    <td className={TD}>
                      {name(d.downtimeTypeId, ["name"]) !== "—"
                        ? name(d.downtimeTypeId, ["name"])
                        : (d.downtimeName || "—")}
                    </td>
                    <td className={TD}>
                      {d.startTime ? dayjs(d.startTime).format("HH:mm") : "—"}
                    </td>
                    <td className={TD}>
                      {d.endTime ? dayjs(d.endTime).format("HH:mm") : "—"}
                    </td>
                    <td className={TD}>
                      <Tag color="cyan" className="!rounded-lg">{d.duration ?? 0} min</Tag>
                    </td>
                    <td className={`${TD} text-slate-500 italic text-xs`}>
                      {d.remark || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(record.downtimes || []).length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Planned",   val: record.totalPlannedDowntime   ?? 0, col: "#1d4ed8", bg: "#eff6ff" },
                { label: "Unplanned", val: record.totalUnplannedDowntime ?? 0, col: "#dc2626", bg: "#fff1f2" },
                { label: "Total",     val: record.totalDowntime          ?? 0, col: "#334155", bg: "#f8fafc" },
              ].map(({ label, val, col, bg }) => (
                <div key={label} className="rounded-xl px-4 py-3 text-center border"
                  style={{ background: bg, borderColor: "#e2e8f0" }}>
                  <div className="text-xl font-black" style={{ color: col }}>{val}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{label} (min)</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    /* ── CONSUMABLES ── */
    {
      key: "consumables",
      label: (
        <span className="flex items-center gap-1.5">
          <FlaskConical size={13} /> Consumables ({(record.consumables || []).length})
        </span>
      ),
      children: (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[440px]">
            <thead>
              <tr>
                {["#", "Material Name", "Type", "Unit", "Quantity"].map(h => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(record.consumables || []).length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-slate-400">No consumables recorded</td></tr>
              ) : (record.consumables || []).map((c, i) => {
                const matName = name(c.materialId, ["name"]) !== "—"
                  ? name(c.materialId, ["name"])
                  : (c.materialName || "—");
                const matType = (c.materialId?.type || c.materialType || "").replace("Items", "");
                return (
                  <tr key={i} className="hover:bg-slate-50/60">
                    <td className={`${TD} text-slate-400 w-10`}>{i + 1}</td>
                    <td className={`${TD} font-medium`}>{matName}</td>
                    <td className={TD}>
                      <Tag
                        color={matType === "powder" ? "purple" : matType === "chemical" ? "cyan" : "blue"}
                        className="!rounded-lg capitalize"
                      >
                        {matType || "—"}
                      </Tag>
                    </td>
                    <td className={TD}>
                      <Tag className="!rounded-lg font-semibold">
                        {c.measurementType || c.materialId?.measurementType || c.materialId?.mesurmentType || "—"}
                      </Tag>
                    </td>
                    <td className={`${TD} font-bold`}>{c.quantity ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ),
    },
    /* ── MANPOWER ── */
    {
      key: "manpower",
      label: (
        <span className="flex items-center gap-1.5">
          <Users size={13} /> Manpower
        </span>
      ),
      children: (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Required Manpower",  val: record.requiredManpower  ?? 0, col: "#334155", bg: "#f8fafc" },
            { label: "Available Manpower", val: record.availableManpower ?? 0, col: "#16a34a", bg: "#f0fdf4" },
            { label: "Short Manpower",     val: record.shortageManpower  ?? 0,
              col: (record.shortageManpower ?? 0) > 0 ? "#dc2626" : "#16a34a",
              bg:  (record.shortageManpower ?? 0) > 0 ? "#fff1f2" : "#f0fdf4" },
          ].map(({ label, val, col, bg }) => (
            <div key={label} className="rounded-2xl border px-6 py-5 text-center"
              style={{ background: bg, borderColor: "#e2e8f0" }}>
              <div className="text-3xl font-black mb-1" style={{ color: col }}>{val}</div>
              <div className="text-xs text-slate-500 font-medium">{label}</div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={960}
      centered
      title={null}
      styles={{ body: { padding: 0 }, content: { borderRadius: 20, overflow: "hidden" } }}
    >
      {/* ── Header ── */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h2 className="text-lg font-bold text-slate-800 m-0">Production Entry Detail</h2>
          <Tag
            color={record.status === "Submitted" ? "success" : "default"}
            className="!rounded-full !text-xs !font-bold !px-3"
          >
            {record.status}
          </Tag>
          <div
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
            style={shiftStyle}
          >
            {record.shift === "Day" ? <Sun size={11} /> : <Moon size={11} />}
            {record.shift} Shift
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          {[
            { icon: CalendarDays, val: dayjs(record.entryDate || record.createdAt).format("DD MMM YYYY · HH:mm") },
            { icon: UserCircle2,  val: record.employeeName || "—" },
            { icon: Factory,      val: record.plantName    || record.plantId?.plantName || "—" },
            { icon: MapPin,       val: record.location     || record.plantId?.location  || "—" },
          ].map(({ icon: Ic, val }) => (
            <span key={val} className="flex items-center gap-1.5 text-xs text-slate-500">
              <Ic size={12} className="text-slate-400" /> {val}
            </span>
          ))}
        </div>

        {/* Mini summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mt-4">
          {summaryItems.map(({ label, value, color, bg }) => (
            <div key={label} className="rounded-xl px-3 py-2 text-center"
              style={{ background: bg }}>
              <div className="text-lg font-black leading-none" style={{ color }}>{value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="px-6 pb-6 pt-2">
        <Tabs items={tabs} size="small" />
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────
   DATE RANGE LABEL HELPER
───────────────────────────────────────────────────────── */
function rangeLabelFromPreset(key, dateRange) {
  const p = PRESETS.find(p => p.key === key);
  if (!p) return "";
  if (key === "custom" && dateRange[0] && dateRange[1]) {
    return `${dateRange[0].format("DD MMM")} – ${dateRange[1].format("DD MMM YYYY")}`;
  }
  return p.label;
}

/* ─────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────── */
export default function ProductionRecordsPage() {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();

  /* ── filter state ── */
  const [activePreset, setActivePreset]     = useState("last7");
  const [dateRange, setDateRange]           = useState(() => {
    const p = PRESETS.find(p => p.key === "last7");
    return p.range();
  });
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  /* ── data state ── */
  const [records, setRecords]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [exporting, setExporting]       = useState(false);
  const [searchText, setSearchText]     = useState("");
  const [shiftFilter, setShiftFilter]   = useState("All");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailOpen, setDetailOpen]         = useState(false);
  const [now, setNow]                   = useState(dayjs());
  const [plantStrengths, setPlantStrengths] = useState([]);


  /* live clock */
  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ── fetch ── */
  const fetchRecords = useCallback(async (range = dateRange) => {
    try {
      const {data} = await API.get("/production", {
        params: {
          from: dateRange[0].startOf("day").toISOString(),
          to:   dateRange[1].endOf("day").toISOString(),
        },
      });

      console.log("Fetched records:", data);
      const list = data?.data || data?.records || (Array.isArray(data) ? data : []);
      setRecords(list);
      setPlantStrengths(data?.plantStrengths || []);
    } catch (err) {
      console.error("Fetch error:", err);
      message.error("Failed to load production records");
    }
  }, [dateRange]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchRecords(dateRange);
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);


  
 

  /* ── preset selection ── */
  const handlePresetChange = (key) => {
    setActivePreset(key);
    if (key === "custom") {
      setShowCustomPicker(true);
      return;
    }
    setShowCustomPicker(false);
    const preset = PRESETS.find(p => p.key === key);
    if (preset?.range) {
      const range = preset.range();
      setDateRange(range);
    }
  };

  const handleCustomRangeChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates);
      setShowCustomPicker(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRecords(dateRange);
    setRefreshing(false);
    message.success("Records refreshed");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  /* ── filtered records ── */
  const filteredRecords = useMemo(() => {
    let list = [...records];
    if (shiftFilter  !== "All") list = list.filter(r => r.shift  === shiftFilter);
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
        list = list.filter(r => {
              const d = dayjs(r.entryDate || r.createdAt).format("DD MMM YYYY").toLowerCase();
              return (
                d.includes(q) ||
                (r.employeeName || "").toLowerCase().includes(q) ||
                (r.plantName    || "").toLowerCase().includes(q) ||
                (r.shift        || "").toLowerCase().includes(q)
              );
            });
    }
    return list;
  }, [records, shiftFilter, searchText]);

  // Plant-level per-shift target — ek hi value, us user ke plant ke PlantStrength se.
  // Yeh per-record nahi hai, poore plant ki capacity hai.
  const plantTotalTarget = useMemo(
      () => plantStrengths.reduce((sum, p) => sum + (p.demandPerShift || 0), 0),
      [plantStrengths]
    );

  const combinedWithTarget = filteredRecords;

    // Per-record target: prefer the value actually saved on that entry (shiftSummary.target).
    // Falls back to the plant's current demand only if an entry has 0/no target saved —
    // keeps numbers honest instead of a hardcoded value on every row.
  // Scoped fallback for records saved before the target fix (shiftSummary.target
  // was 0 on every entry due to the conveyorId/conveyorStrengthId field mismatch).
  // Instead of one blanket plant-wide sum, match plantStrengths to THIS record's
  // own shift so a Shift 1 record doesn't inherit Shift 2's demand and vice versa.
  const getRecordTarget = (r) => {
    if (r.shiftSummary?.target > 0) return r.shiftSummary.target;
    const rShiftId = r.shiftId?._id || r.shiftId;
    const scoped = rShiftId
      ? plantStrengths.filter((p) => String(p.shiftId) === String(rShiftId))
      : plantStrengths;
    return scoped.reduce((sum, p) => sum + (p.demandPerShift || 0), 0);
  };

  const getRecordAchievement = (r) => {
      const target = getRecordTarget(r);
      const achieved = r.shiftSummary?.achieved ?? r.totalProductionQty ?? 0;
      return target > 0 ? parseFloat(((achieved / target) * 100).toFixed(2)) : 0;
    };

  // Which conveyor line(s) contributed production rows to this record —
  // reads productions[].conveyorId (populated with conveyorName by the backend).
  // Still used for the "Total Target" KPI tooltip and the Excel export sheet,
  // even though it's no longer rendered as its own table column.
  const getRecordLines = (r) => {
    const names = new Set();
    (r.productions || []).forEach((p) => {
      const line = p.conveyorId;
      if (line && typeof line === "object" && line.conveyorName) names.add(line.conveyorName);
    });
    return [...names];
  };

  // Sum of (productionQty × part.area) across every production row in this
  // record — part.area comes from the populated partId (see POPULATE in
  // the controller: "productions.partId" selects "partName area partsPerHanger").
  // Rows whose part has no area configured contribute 0.
  const getRecordPaintedArea = (r) => {
    const total = (r.productions || []).reduce((sum, p) => {
      const area = Number(p.partId?.area || 0);
      return sum + Number(p.productionQty || 0) * area;
    }, 0);
    return total.toFixed(2);
  };

  // Sum of (productionQty ÷ part.partsPerHanger) across every production
  // row — falls back to 1 per hanger if partsPerHanger isn't configured.
  const getRecordHangersUsed = (r) => {
    const total = (r.productions || []).reduce((sum, p) => {
      const pph = Number(p.partId?.partsPerHanger || 1);
      return sum + Number(p.productionQty || 0) / pph;
    }, 0);
    return total.toFixed(2);
  };

  /* ── KPIs ── */

const kpis = useMemo(() => {
    const totalProduction = combinedWithTarget.reduce((s, r) => s + (r.totalProductionQty ?? 0), 0);
    const totalReject     = combinedWithTarget.reduce((s, r) => s + (r.totalRejectQty     ?? 0), 0);
    const totalRework     = combinedWithTarget.reduce((s, r) => s + (r.totalReworkQty     ?? 0), 0);
    const totalDowntime   = combinedWithTarget.reduce((s, r) => s + (r.totalDowntime      ?? 0), 0);
    const shortManpower   = combinedWithTarget.reduce((s, r) => s + (r.shortageManpower   ?? 0), 0);
    const submitted       = combinedWithTarget.filter(r => r.status === "Submitted").length;

    // cumulative target for the selected range = sum of each record's own shift target —
    // grows/shrinks with the date range instead of one fixed number.
    const totalTarget = combinedWithTarget.reduce((s, r) => s + getRecordTarget(r), 0);
    const totalAchieved = combinedWithTarget.reduce((s, r) => s + (r.shiftSummary?.achieved ?? r.totalProductionQty ?? 0), 0);
    const achievementPercent = totalTarget > 0
      ? parseFloat(((totalAchieved / totalTarget) * 100).toFixed(2))
      : 0;

    return {
      entries: combinedWithTarget.length, submitted,
      totalProduction, totalReject, totalRework,
      totalDefects: totalReject + totalRework,
      totalDowntime, shortManpower, totalTarget, achievementPercent,
    };
  }, [combinedWithTarget, plantTotalTarget]);
  
   
  /* ── row click ── */
  const handleRowClick = (record) => {
    setSelectedRecord(record);
    setDetailOpen(true);
  };

  /* ── excel export ── */
  const handleExportExcel = () => {
    try {
      setExporting(true);
      const rows = combinedWithTarget.map((r, i) => ({
        "S.N.":               i + 1,
        "Date":                dayjs(r.entryDate || r.createdAt).format("DD/MM/YYYY"),
        "Time":                r.reportTime ? dayjs(r.reportTime).format("HH:mm") : dayjs(r.createdAt).format("HH:mm"),
        "Shift":               r.shift,
        "Reported By":         r.employeeName,
        "Plant":               r.plantName,
        "Location":            r.location,
        "Line(s)":             getRecordLines(r).join(", ") || "—",
        "Target":              r.shiftSummary?.target      ?? 0,
        "Achieved":            r.shiftSummary?.achieved     ?? r.totalProductionQty ?? 0,
        "Achievement %":       r.shiftSummary?.achievement  ?? 0,
        "Production Qty":      r.totalProductionQty   ?? 0,
        "Painted Area (m²)":   getRecordPaintedArea(r),
        "Hanger Used":         getRecordHangersUsed(r),
        "Reject Qty":          r.totalRejectQty        ?? 0,
        "Rework Qty":          r.totalReworkQty        ?? 0,
        "Total Defects":       r.totalDefectQty ?? ((r.totalRejectQty ?? 0) + (r.totalReworkQty ?? 0)),
        "Planned DT (min)":    r.totalPlannedDowntime   ?? 0,
        "Unplanned DT (min)":  r.totalUnplannedDowntime ?? 0,
        "Total DT (min)":      r.totalDowntime          ?? 0,
        "Required MP":         r.requiredManpower  ?? 0,
        "Available MP":        r.availableManpower ?? 0,
        "Short MP":            r.shortageManpower  ?? 0,
        "Status":              r.status,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);

      // proper column widths — clean alignment, kuch bhi cramped nahi lagega
      ws["!cols"] = [
        { wch: 6 },  { wch: 12 }, { wch: 8 },  { wch: 8 },  { wch: 20 },
        { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 9 },  { wch: 10 },
        { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 11 }, { wch: 11 }, { wch: 13 },
        { wch: 15 }, { wch: 17 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 11 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Production Records");
      XLSX.writeFile(wb, `Production_${dateRange[0].format("DD-MMM")}_to_${dateRange[1].format("DD-MMM-YYYY")}.xlsx`);
      message.success("Excel report downloaded");
    } catch {
      message.error("Export failed");
    } finally {
      setExporting(false);
    }
  };



  /* ── table columns ── */
  const columns = [
    {
      title: "S.N.", key: "sn", width: 38, fixed: "left",
      render: (_, __, i) => <span className="text-slate-400 text-[11px]">{i + 1}</span>,
    },
    {
      title: "Date & Time", key: "date", width: 96, fixed: "left",
      sorter: (a, b) =>
        dayjs(a.entryDate || a.createdAt).unix() - dayjs(b.entryDate || b.createdAt).unix(),
      defaultSortOrder: "descend",
      render: (_, r) => (
        <div>
          <div className="text-xs font-bold text-slate-800">
            {dayjs(r.entryDate || r.createdAt).format("DD MMM YYYY")}
          </div>
          <div className="text-[10px] text-slate-400">
            {r.reportTime ? dayjs(r.reportTime).format("HH:mm") : dayjs(r.createdAt).format("HH:mm")}
          </div>
        </div>
      ),
    },
    {
      title: "Shift", key: "shift", width: 72,
      render: (_, r) => (
        <div
          className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={
            r.shift === "Day"
              ? { background: "#fefce8", border: "1px solid #fde68a", color: "#92400e" }
              : { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af" }
          }
        >
          {r.shift === "Day" ? <Sun size={9} /> : <Moon size={9} />}
          {r.shift}
        </div>
      ),
    },
    {
      title: "Reported By", key: "by", width: 112,
      render: (_, r) => (
        <div>
          <div className="text-xs font-semibold text-slate-800">{r.employeeName || "—"}</div>
          <div className="text-[10px] text-slate-400">{r.plantName || "—"}</div>
        </div>
      ),
    },
    {
      title: "Achievement %", key: "ach", width: 85, align: "center",
      sorter: (a, b) => getRecordAchievement(a) - getRecordAchievement(b),
      render: (_, r) => {
        const v = getRecordAchievement(r);
        const color = v >= 90 ? "text-green-600" : v >= 70 ? "text-amber-600" : "text-red-500";
        return (
          <span className={`text-xs font-black ${color}`}>
            {v}<span className="text-[9px] font-normal text-slate-400">%</span>
          </span>
        );
      },
    },
    {
      title: "Total Target", key: "target", width: 80, align: "center",
      render: (_, r) => <span className="text-xs font-bold text-teal-700">{getRecordTarget(r)}</span>,
    },
    {
      title: "Production", key: "prod", width: 78, align: "center",
      sorter: (a, b) => (a.totalProductionQty ?? 0) - (b.totalProductionQty ?? 0),
      render: (_, r) => (
        <span className="text-xs font-black text-blue-700">{r.totalProductionQty ?? 0}</span>
      ),
    },
    {
      title: "Painted Area (m²)", key: "paintedArea", width: 90, align: "center",
      sorter: (a, b) => parseFloat(getRecordPaintedArea(a)) - parseFloat(getRecordPaintedArea(b)),
      render: (_, r) => (
        <span className="text-xs font-bold text-cyan-700">{getRecordPaintedArea(r)}</span>
      ),
    },
    {
      title: "Hanger Used", key: "hangerUsed", width: 85, align: "center",
      sorter: (a, b) => parseFloat(getRecordHangersUsed(a)) - parseFloat(getRecordHangersUsed(b)),
      render: (_, r) => (
        <span className="text-xs font-bold text-emerald-700">{getRecordHangersUsed(r)}</span>
      ),
    },
    {
      title: "Reject", key: "rej", width: 55, align: "center",
      render: (_, r) => (
        <span className={`text-xs font-bold ${(r.totalRejectQty ?? 0) > 0 ? "text-red-600" : "text-slate-200"}`}>
          {r.totalRejectQty ?? 0}
        </span>
      ),
    },
    {
      title: "Rework", key: "rew", width: 55, align: "center",
      render: (_, r) => (
        <span className={`text-xs font-bold ${(r.totalReworkQty ?? 0) > 0 ? "text-amber-500" : "text-slate-200"}`}>
          {r.totalReworkQty ?? 0}
        </span>
      ),
    },
    {
      title: "Defects", key: "def", width: 65, align: "center",
      render: (_, r) => {
        const v = (r.totalRejectQty ?? 0) + (r.totalReworkQty ?? 0);
        return v > 0
          ? <Tag color="volcano" className="!rounded-full !font-bold !text-[10px] !m-0">{v}</Tag>
          : <span className="text-slate-200 text-xs">0</span>;
      },
    },
    {
      title: "Planned DT", key: "pdt", width: 70, align: "center",
      render: (_, r) => (
        <span className={`text-[11px] font-semibold ${(r.totalPlannedDowntime ?? 0) > 0 ? "text-blue-600" : "text-slate-200"}`}>
          {r.totalPlannedDowntime ?? 0}
          <span className="text-[9px] font-normal ml-0.5 text-slate-400">min</span>
        </span>
      ),
    },
    {
      title: "Unplanned DT", key: "udt", width: 78, align: "center",
      render: (_, r) => (
        <span className={`text-[11px] font-semibold ${(r.totalUnplannedDowntime ?? 0) > 0 ? "text-red-500" : "text-slate-200"}`}>
          {r.totalUnplannedDowntime ?? 0}
          <span className="text-[9px] font-normal ml-0.5 text-slate-400">min</span>
        </span>
      ),
    },
    {
      title: "Total DT", key: "tdt", width: 65, align: "center",
      render: (_, r) => (
        <span className={`text-[11px] font-bold ${(r.totalDowntime ?? 0) > 0 ? "text-purple-600" : "text-slate-200"}`}>
          {r.totalDowntime ?? 0}
          <span className="text-[9px] font-normal ml-0.5 text-slate-400">min</span>
        </span>
      ),
    },
    {
      title: "MP Req / Avail", key: "mp", width: 95, align: "center",
      render: (_, r) => (
        <div className="text-[11px] text-center leading-tight">
          <span className="font-bold text-slate-700">{r.requiredManpower ?? 0}</span>
          <span className="text-slate-300 mx-1">/</span>
          <span className="font-bold text-green-600">{r.availableManpower ?? 0}</span>
        </div>
      ),
    },
    {
      title: "Short MP", key: "smp", width: 70, align: "center",
      render: (_, r) => {
        const v = r.shortageManpower ?? 0;
        return (
          <span className={`text-xs font-bold ${v > 0 ? "text-red-500" : "text-green-500"}`}>
            {v}
          </span>
        );
      },
    },
    {
      title: "Status", key: "st", width: 85, align: "center",
      render: (_, r) => (
        <Tag
          color={r.status === "Submitted" ? "success" : "warning"}
          className="!rounded-full !text-[10px] !font-bold !px-2 !m-0"
        >
          {r.status}
        </Tag>
      ),
    },
    {
      title: "", key: "act", width: 44, fixed: "right", align: "center",
      render: (_, r) => (
        <Tooltip title="View full details">
          <Button
            type="text" size="small"
            icon={<Eye size={14} className="text-teal-600" />}
            className="!rounded-lg hover:!bg-teal-50"
            onClick={e => { e.stopPropagation(); handleRowClick(r); }}
          />
        </Tooltip>
      ),
    },
  ];

  /* ── preset dropdown items ── */
  const presetMenuItems = PRESETS.map(p => ({
    key:   p.key,
    label: (
      <span className={`text-sm ${activePreset === p.key ? "font-bold text-teal-600" : ""}`}>
        {p.label}
      </span>
    ),
  }));

  /* ─────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: "#f1f5f9" }}>

      {/* ══════════════════════════════════════════════
          SINGLE TOP NAVBAR — white, sticky
      ══════════════════════════════════════════════ */}
      <div
        className="bg-white sticky top-0 z-50"
        style={{
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 1px 12px rgba(0,0,0,0.06)",
        }}
      >
        <div className="px-5 h-[60px] flex items-center justify-between gap-3">

          {/* LEFT — branding */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
            
            >
               <img
                src="/src/assets/logo/pg-logo.png"
                alt="PG"
                className="w-20 h-20 object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentNode.innerHTML = '<span style="color:#fff;font-weight:800;font-size:14px;letter-spacing:0.5px">PG</span>';
                }}
              />
             </div> 

            <div className="leading-none">
              <div className="font-black text-[15px]" style={{ color: "#b00000", letterSpacing: "-0.5px" }}>
                PG-GROUP
              </div>                                   
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium tracking-wide">
                PAINT SHOP MIS
              </div>
            </div>
            <div className="w-px h-7 bg-slate-200 mx-1" />
            <div className="leading-none">
              <div className="text-sm font-bold text-slate-800">Production Records</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {now.format("dddd, DD MMM YYYY · HH:mm:ss")}
              </div>
            </div>
          </div>

          {/* CENTRE — date filter */}
          <div className="flex items-center gap-2 flex-1 justify-center flex-wrap">
            {/* Preset dropdown */}
            <Dropdown
              menu={{
                items: presetMenuItems,
                onClick: ({ key }) => handlePresetChange(key),
              }}
              trigger={["click"]}
            >
              <Button
                className="!rounded-lg !font-semibold !text-slate-700 !border-slate-300"
                icon={<CalendarDays size={13} className="text-teal-600" />}
              >
                {rangeLabelFromPreset(activePreset, dateRange)}
                <ChevronDown size={12} className="text-slate-400 ml-1" />
              </Button>
            </Dropdown>

            {/* Custom range picker — shown inline when custom selected */}
            {(activePreset === "custom" || showCustomPicker) && (
              <DatePicker.RangePicker
                value={dateRange}
                onChange={handleCustomRangeChange}
                format="DD MMM YYYY"
                className="!rounded-lg"
                allowClear={false}
              />
            )}

            {/* Date range label */}
            {activePreset !== "custom" && dateRange[0] && dateRange[1] && (
              <span className="text-[11px] text-slate-400 hidden md:block">
                {dateRange[0].format("DD MMM")} → {dateRange[1].format("DD MMM YYYY")}
              </span>
            )}

            <Tooltip title="Refresh data">
              <Button
                size="small"
                icon={<RefreshCcw size={19} />}
                loading={refreshing}
                onClick={handleRefresh}
                className="!rounded-lg !text-slate-600 !border-slate-300 hover:!text-teal-600 hover:!border-teal-300"
              >
              </Button>
            </Tooltip>

            <Tooltip title="Export to Excel">
              <Button
                size="small"
                icon={<Download size={13} />}
                loading={exporting}
                onClick={handleExportExcel}
                className="!rounded-lg !font-semibold !text-white"
                style={{ backgroundColor: "#059669", borderColor: "#059669" }}
              >
              
              </Button>
            </Tooltip>
          </div>

          {/* RIGHT — user info + actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className="items-center gap-2 px-3 py-1.5 rounded-lg hidden lg:flex"
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
            >
              <UserCircle2 size={14} className="text-teal-600" />
              <div className="leading-none">
                <div className="text-xs font-bold text-slate-800">{authUser?.name || "User"}</div>
                <div className="text-[10px] text-slate-400">{authUser?.email || ""}</div>
              </div>
            </div>

            <Button
              type="primary"
              size="small"
              icon={<Plus size={13} />}
              onClick={() => navigate("/production")}
              className="!rounded-lg !font-bold"
              style={{ backgroundColor: "#0d9488", borderColor: "#0d9488" }}
            >
              New Entry
            </Button>

            <div className="w-px h-7 bg-slate-200" />

            <Tooltip title="Sign out">
              <Button
                size="small"
                icon={<LogOut size={13} />}
                onClick={handleLogout}
                className="!rounded-lg !font-semibold !text-red-600 !border-red-200 !bg-red-50 hover:!bg-red-100"
              >
                
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          BODY
      ══════════════════════════════════════════════ */}
      <div className="px-5 py-5 max-w-[1700px] mx-auto space-y-4">

        {/* ── KPI CARDS — sticky just below the navbar. Always the combined total
             across every line (Line 1 + Line 2 + ...); never split per-line here. ── */}
        <div
          className="sticky z-40 -mx-5 px-5 py-3 bg-[#f1f5f9]/95 backdrop-blur-sm"
          style={{ top: 60 }}
        >
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(128px, 1fr))" }}
        >
          <Tooltip
            title={
              plantStrengths.length > 0
                ? plantStrengths.map((s, i) => `${s.conveyorName || `Line ${i + 1}`}: ${s.demandPerShift ?? 0}`).join("  ·  ")
                : "No active conveyor lines configured"
            }
          >
            <div>
              <StatCard
                icon={TrendingUp}  label="Total Target"
                value={kpis.totalTarget}
                sub={`${plantStrengths.length || 0} line(s) · per shift`}
                tone="green" loading={loading}
              />
            </div>
          </Tooltip>
          <StatCard
            icon={BarChart3}   label="Achievement %"
            value={`${kpis.achievementPercent}%`}
            sub="target vs achieved"
            tone="teal" loading={loading}
          />
          <StatCard
            icon={Package}     label="Total Production"
            value={kpis.totalProduction}
            sub="units produced"
            tone="blue" loading={loading}
          />
          <StatCard
            icon={AlertTriangle} label="Total Defects"
            value={kpis.totalDefects}
            sub="reject + rework"
            tone="slate" loading={loading}
          />
          <StatCard
            icon={ShieldAlert} label="Total Reject"
            value={kpis.totalReject}
            sub={kpis.totalProduction > 0 ? `${((kpis.totalReject / kpis.totalProduction) * 100).toFixed(1)}% rate` : "0% rate"}
            tone="red" loading={loading}
          />
          <StatCard
            icon={RotateCcw}   label="Total Rework"
            value={kpis.totalRework}
            sub={kpis.totalProduction > 0 ? `${((kpis.totalRework / kpis.totalProduction) * 100).toFixed(1)}% rate` : "0% rate"}
            tone="amber" loading={loading}
          />
          <StatCard
            icon={Clock3}      label="Total Downtime"
            value={kpis.totalDowntime}
            sub="minutes total"
            tone="purple" loading={loading}
          />
          <StatCard
            icon={Users}       label="Manpower Shortage"
            value={kpis.shortManpower}
            sub="cumulative"
            tone={kpis.shortManpower > 0 ? "red" : "green"}
            loading={loading}
          />
        </div>
        </div>

        {/* ── TABLE CARD ── */}
        <div className={CARD}>
          {/* Table toolbar */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 m-0">Daily Production Log</h2>
              <p className="text-[11px] text-slate-400 m-0 mt-0.5">
                {dateRange[0]?.format("DD MMM YYYY")} → {dateRange[1]?.format("DD MMM YYYY")} ·{" "}
                <strong className="text-slate-600">{combinedWithTarget.length}</strong> record
                {combinedWithTarget.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Shift filter */}
              <Select
                size="small"
                value={shiftFilter}
                onChange={setShiftFilter}
                className="!w-28 !rounded-lg"
                options={[
                  { value: "All",   label: "All Shifts" },
                  { value: "Day",   label: "☀️ Day"      },
                  { value: "Night", label: "🌙 Night"    },
                ]}
              />

              {/* Search */}
              <Input
                prefix={<Search size={12} className="text-slate-400" />}
                placeholder="Search..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
                className="!rounded-lg !w-44"
                size="small"
              />
            </div>
          </div>

          {/* Table */}
          <Table
            rowKey="_id"
            loading={{ spinning: loading, description: "Loading records..." }}
            dataSource={combinedWithTarget}
            columns={columns}
            scroll={{ x: 1150 }}
            size="small"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              showTotal: (total, range) => (
                <span className="text-xs text-slate-500">
                  {range[0]}–{range[1]} of {total}
                </span>
              ),
            }}
            onRow={record => ({
              onClick: () => handleRowClick(record),
              style: { cursor: "pointer" },
            })}
            rowClassName={() => "hover:bg-teal-50/40 transition-colors duration-100"}
            locale={{
              emptyText: (
                <div className="py-20 flex flex-col items-center gap-3">
                  <div className="text-6xl">📋</div>
                  <div className="text-base font-bold text-slate-500">No records found</div>
                  <p className="text-sm text-slate-400 m-0">
                    No entries for{" "}
                    <strong>{dateRange[0]?.format("DD MMM")} → {dateRange[1]?.format("DD MMM YYYY")}</strong>
                  </p>
                  <Button
                    type="primary"
                    icon={<Plus size={14} />}
                    onClick={() => navigate("/production")}
                    className="!rounded-xl mt-1"
                    style={{ backgroundColor: "#0d9488", borderColor: "#0d9488" }}
                  >
                    Add First Entry
                  </Button>
                </div>
              ),
            }}
          />
        </div>
      </div>

      {/* Detail modal */}
      <RecordDetailModal
        record={selectedRecord}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedRecord(null); }}
        plantStrengths={plantStrengths}
      />
    </div>
  );
}