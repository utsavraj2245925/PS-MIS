import { useState, useEffect, useMemo, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import dayjs from "dayjs";
import {
  Table, Button, Modal, Form, Input, Select, TimePicker, Tag,
  Tooltip, message, Empty, Popconfirm, Divider,
} from "antd";
import {
  Clock3, Plus, RefreshCcw, Search, Sun, Sunset, Moon, Trash2, Ban,
  Pencil, Coffee, CheckCircle2, XCircle, Timer, Building2, MapPin,
} from "lucide-react";

const API = axiosInstance;
const BRAND = "#0E7490";

/* ──────────────────────────────────────────────────────────
   STYLE TOKENS
────────────────────────────────────────────────────────── */
const CARD  = "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden";
const LABEL = "block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1";

/* ──────────────────────────────────────────────────────────
   SHIFT TYPE — single source of truth for icon + colors,
   used by the table Type column, the filter dropdown, and the
   modal's Shift Type select, so all three always stay in sync.
────────────────────────────────────────────────────────── */
const SHIFT_TYPE_META = {
  Morning:   { icon: Sunset, emoji: "🌤️", bg: "#fefce8", border: "#fde68a", color: "#92400e" },
  Afternoon: { icon: Sun, emoji: "☀️", bg: "#fff7ed", border: "#fed7aa", color: "#c2410c" },
  Night:     { icon: Moon,   emoji: "🌙", bg: "#eff6ff", border: "#bfdbfe", color: "#1e40af" },
};
const SHIFT_TYPE_OPTIONS = Object.entries(SHIFT_TYPE_META).map(([value, m]) => ({
  value, label: `${m.emoji} ${value}`,
}));

/* ──────────────────────────────────────────────────────────
   TIME HELPERS — mirror the backend's overnight-safe math
   so the modal's live preview matches what gets saved.
────────────────────────────────────────────────────────── */
const toMinutes = (t) => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};
const normalize = (shiftStartMin, t) => {
  const v = toMinutes(t);
  if (v === null || shiftStartMin === null) return null;
  return v < shiftStartMin ? v + 1440 : v;
};
const fmtHM = (mins) => {
  if (mins == null || Number.isNaN(mins)) return "—";
  const m = Math.max(Math.round(mins), 0);
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

const getErrorMessage = (err, fallback) =>
  err?.response?.data?.message || fallback;

/* ──────────────────────────────────────────────────────────
   SMALL PRESENTATIONAL COMPONENTS
────────────────────────────────────────────────────────── */
const StatMini = ({ icon: Icon, label, value, tone = "slate", loading }) => {
  const tones = {
    teal:  "bg-teal-50 border-teal-100 text-teal-700",
    blue:  "bg-blue-50 border-blue-100 text-blue-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    orange:"bg-orange-50 border-orange-100 text-orange-700",
    purple:"bg-purple-50 border-purple-100 text-purple-700",
    green: "bg-green-50 border-green-100 text-green-700",
    slate: "bg-slate-50 border-slate-200 text-slate-700",
  };
  return (
    <div className={`rounded-2xl border p-3 flex items-center gap-2.5 ${tones[tone]}`}>
      <div className="w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0">
        <Icon size={15} />
      </div>
      <div>
        {loading ? (
          <div className="h-4 w-9 bg-white/60 rounded animate-pulse" />
        ) : (
          <div className="text-base font-extrabold leading-none">{value ?? 0}</div>
        )}
        <div className="text-[9px] font-semibold uppercase tracking-wide opacity-70 mt-1">{label}</div>
      </div>
    </div>
  );
};

/* Section header — same icon-chip + label + rule pattern used across
   Plant/Model/Part Master, so this modal reads as part of the same app. */
const SectionHeader = ({ icon: Icon, step, label, hint }) => (
  <div className="mb-2.5">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "#ECFEFF", border: "1px solid rgba(14,116,144,0.2)" }}>
        <Icon size={12} style={{ color: BRAND }} />
      </div>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{step} · {label}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
    {hint && <p className="text-[10px] text-slate-400 mt-1 ml-8">{hint}</p>}
  </div>
);

/* Section body — light bordered card so the three steps read as
   distinct groups instead of floating fields separated only by a Divider. */
const SectionCard = ({ children }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 mb-3">
    {children}
  </div>
);

const CalcTile = ({ icon: Icon, label, value, sub, tone }) => {
  const tones = {
    slate: "bg-slate-50 border-slate-200 text-slate-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    teal:  "bg-teal-50 border-teal-200 text-teal-700",
    cyan:  "bg-cyan-50 border-cyan-200 text-cyan-700",
  };
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${tones[tone]}`}>
      <div className="flex items-center gap-1.5 mb-1 opacity-70">
        <Icon size={11} />
        <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-sm font-extrabold">{value}</div>
      <div className="text-[8px] opacity-50 mt-0.5">{sub}</div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   MAIN PAGE
────────────────────────────────────────────────────────── */
export default function ManageShiftPage() {
  const [plants, setPlants] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const [searchText, setSearchText]         = useState("");
  const [locationFilter, setLocationFilter] = useState(null);
  const [plantFilter, setPlantFilter]       = useState(null);
  const [shiftTypeFilter, setShiftTypeFilter] = useState(null);

  const [modalOpen, setModalOpen]     = useState(false);
  const [editingShift, setEditingShift] = useState(null); // null => create mode
  const [form] = Form.useForm();
  const [liveCalc, setLiveCalc] = useState({ totalShiftMinutes: 0, totalBreakMinutes: 0, actualWorkingMinutes: 0 });

  // Watched so the modal's Plant dropdown re-filters live as Location changes
  const modalLocationId = Form.useWatch("locationId", form);

  /* ════════════════════════════════════════════════════════
     FETCHERS
  ════════════════════════════════════════════════════════ */
  const fetchPlants = useCallback(async () => {
    const { data } = await API.get("/plants");
    setPlants(data?.data || data?.plants || data || []);
  }, []);

  const fetchShifts = useCallback(async () => {
    const { data } = await API.get("/shifts");
    setShifts(data?.data || []);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchPlants(), fetchShifts()]);
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to load shift data"));
    } finally {
      setLoading(false);
    }
  }, [fetchPlants, fetchShifts]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
    message.success("Refreshed");
  };

  /* ════════════════════════════════════════════════════════
     LOCATION -> PLANT HIERARCHY
     Locations are derived from the plants list itself (one Location
     can contain many Plants) — no separate /locations call needed.
  ════════════════════════════════════════════════════════ */
  const locationOptions = useMemo(() => {
    const map = new Map();
    plants.forEach((p) => {
      const locId = p.locationId?._id || p.locationId;
      const locName = p.locationName || p.locationId?.locationName;
      if (locId && !map.has(locId)) map.set(locId, locName);
    });
    return Array.from(map, ([value, label]) => ({ value, label }));
  }, [plants]);

  const plantsInLocation = useCallback(
    (locId) => plants.filter((p) => !locId || (p.locationId?._id || p.locationId) === locId),
    [plants]
  );

  // Filter-bar Plant dropdown, scoped to the selected Location filter
  const filterPlantOptions = useMemo(
    () => plantsInLocation(locationFilter).map((p) => ({ value: p._id, label: p.plantName })),
    [plantsInLocation, locationFilter]
  );

  // Modal's Plant dropdown, scoped to the selected Location field
  const modalPlantOptions = useMemo(
    () => plantsInLocation(modalLocationId).map((p) => ({ value: p._id, label: p.plantName })),
    [plantsInLocation, modalLocationId]
  );

  const handleLocationFilterChange = (val) => {
    setLocationFilter(val);
    if (val && plantFilter) {
      const stillValid = plants.some(
        (p) => p._id === plantFilter && (p.locationId?._id || p.locationId) === val
      );
      if (!stillValid) setPlantFilter(null);
    }
  };

  /* ════════════════════════════════════════════════════════
     FILTERING + STATS
  ════════════════════════════════════════════════════════ */
  const filteredShifts = useMemo(() => {
    let list = [...shifts];
    if (locationFilter) list = list.filter((s) => String(s.locationId?._id || s.locationId) === String(locationFilter));
    if (plantFilter) list = list.filter((s) => (s.plantId?._id || s.plantId) === plantFilter);
    if (shiftTypeFilter) list = list.filter((s) => s.shiftType === shiftTypeFilter);
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter((s) =>
        (s.shiftName || "").toLowerCase().includes(q) ||
        (s.plantName || "").toLowerCase().includes(q) ||
        (s.locationName || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [shifts, locationFilter, plantFilter, shiftTypeFilter, searchText]);

  const stats = useMemo(() => {
    const totalLocations = new Set(shifts.map((s) => String(s.locationId?._id || s.locationId))).size;
    const totalPlants = new Set(shifts.map((s) => s.plantId?._id || s.plantId)).size;
    const totalConfigs = shifts.length;
    const dayShifts = shifts.filter((s) => s.shiftType === "Morning").length;
    const afternoonShifts = shifts.filter((s) => s.shiftType === "Afternoon").length;
    const nightShifts = shifts.filter((s) => s.shiftType === "Night").length;

    const now = dayjs();
    const nowMinutes = now.hour() * 60 + now.minute();
    const activeNow = shifts.filter((s) => {
      if (s.status !== "Active") return false;
      const startMin = toMinutes(s.shiftStartTime);
      let endMin = toMinutes(s.shiftEndTime);
      if (startMin === null || endMin === null) return false;
      if (endMin <= startMin) endMin += 1440;
      const nm = nowMinutes < startMin ? nowMinutes + 1440 : nowMinutes;
      return nm >= startMin && nm < endMin;
    }).length;

    return { totalLocations, totalPlants, totalConfigs, dayShifts, afternoonShifts, nightShifts, activeNow };
  }, [shifts]);

  const handleResetFilters = () => {
    setSearchText(""); setLocationFilter(null); setPlantFilter(null); setShiftTypeFilter(null);
  };

  /* ════════════════════════════════════════════════════════
     LIVE CALCULATION (modal)
  ════════════════════════════════════════════════════════ */
  const recalcFromValues = (values) => {
    const start = values?.shiftStartTime ? values.shiftStartTime.format("HH:mm") : null;
    const end = values?.shiftEndTime ? values.shiftEndTime.format("HH:mm") : null;
    if (!start || !end) { setLiveCalc({ totalShiftMinutes: 0, totalBreakMinutes: 0, actualWorkingMinutes: 0 }); return; }

    const shiftStartMin = toMinutes(start);
    const shiftEndMin = normalize(shiftStartMin, end);
    const totalShiftMinutes = shiftEndMin > shiftStartMin ? shiftEndMin - shiftStartMin : 0;

    let totalBreakMinutes = 0;
    (values.breaks || []).forEach((b) => {
      if (!b?.startTime || !b?.endTime) return;
      const bStart = normalize(shiftStartMin, b.startTime.format("HH:mm"));
      const bEnd = normalize(shiftStartMin, b.endTime.format("HH:mm"));
      if (bEnd > bStart) totalBreakMinutes += (bEnd - bStart);
    });

    const actualWorkingMinutes = Math.max(totalShiftMinutes - totalBreakMinutes, 0);
    setLiveCalc({ totalShiftMinutes, totalBreakMinutes, actualWorkingMinutes });
  };

  const handleValuesChange = (changedValues, allValues) => {
    // If Location changes and the currently-picked Plant no longer
    // belongs to it, clear Plant so the form can't submit a mismatch.
    if (Object.prototype.hasOwnProperty.call(changedValues, "locationId")) {
      const currentPlantId = allValues.plantId;
      const stillValid = plants.some(
        (p) => p._id === currentPlantId && (p.locationId?._id || p.locationId) === changedValues.locationId
      );
      if (currentPlantId && !stillValid) {
        form.setFieldsValue({ plantId: undefined });
      }
    }
    recalcFromValues(allValues);
  };

  /* ════════════════════════════════════════════════════════
     MODAL OPEN / CLOSE
  ════════════════════════════════════════════════════════ */
  const openCreateModal = () => {
    setEditingShift(null);
    form.resetFields();
    form.setFieldsValue({ shiftType: "Morning", status: "Active", breaks: [] });
    setLiveCalc({ totalShiftMinutes: 0, totalBreakMinutes: 0, actualWorkingMinutes: 0 });
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingShift(record);
    form.setFieldsValue({
      locationId: record.locationId?._id || record.locationId,
      plantId: record.plantId?._id || record.plantId,
      shiftName: record.shiftName,
      shiftType: record.shiftType,
      shiftStartTime: record.shiftStartTime ? dayjs(record.shiftStartTime, "HH:mm") : null,
      shiftEndTime: record.shiftEndTime ? dayjs(record.shiftEndTime, "HH:mm") : null,
      status: record.status,
      breaks: (record.breaks || []).map((b) => ({
        breakName: b.breakName,
        startTime: b.startTime ? dayjs(b.startTime, "HH:mm") : null,
        endTime: b.endTime ? dayjs(b.endTime, "HH:mm") : null,
      })),
    });
    setLiveCalc({
      totalShiftMinutes: record.totalShiftMinutes || 0,
      totalBreakMinutes: record.totalBreakMinutes || 0,
      actualWorkingMinutes: record.actualWorkingMinutes || 0,
    });
    setModalOpen(true);
  };

  /* ════════════════════════════════════════════════════════
     CLIENT-SIDE VALIDATION  (defense in depth — server re-checks too)
  ════════════════════════════════════════════════════════ */
  const validateBeforeSubmit = (values) => {
    const start = values.shiftStartTime?.format("HH:mm");
    const end = values.shiftEndTime?.format("HH:mm");
    if (!start || !end) return "Shift start and end time are required";

    const shiftStartMin = toMinutes(start);
    const shiftEndMin = normalize(shiftStartMin, end);
    if (shiftEndMin <= shiftStartMin) return "Shift end time must be after start time";

    const breaks = values.breaks || [];
    const normBreaks = [];
    for (const b of breaks) {
      if (!b?.breakName?.trim()) return "Every break needs a name";
      if (!b?.startTime || !b?.endTime) return `Break "${b.breakName}" needs both start & end time`;
      const bStart = normalize(shiftStartMin, b.startTime.format("HH:mm"));
      const bEnd = normalize(shiftStartMin, b.endTime.format("HH:mm"));
      if (bEnd <= bStart) return `Break "${b.breakName}" end time must be after its start time`;
      if (bStart < shiftStartMin || bEnd > shiftEndMin) return `Break "${b.breakName}" must lie within shift hours`;
      normBreaks.push({ name: b.breakName, start: bStart, end: bEnd });
    }
    normBreaks.sort((a, b) => a.start - b.start);
    for (let i = 1; i < normBreaks.length; i++) {
      if (normBreaks[i].start < normBreaks[i - 1].end) {
        return `"${normBreaks[i].name}" overlaps with "${normBreaks[i - 1].name}"`;
      }
    }

    const dupe = shifts.find((s) =>
      (s.plantId?._id || s.plantId) === values.plantId &&
      s.shiftName.trim().toLowerCase() === values.shiftName.trim().toLowerCase() &&
      s._id !== editingShift?._id
    );
    if (dupe) return `"${values.shiftName}" already exists for this plant`;

    return null;
  };

  /* ════════════════════════════════════════════════════════
     SAVE / DELETE / ACTIVATE / DEACTIVATE
  ════════════════════════════════════════════════════════ */
  const handleSave = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return; // antd already highlights the invalid fields
    }

    const validationError = validateBeforeSubmit(values);
    if (validationError) { message.error(validationError); return; }

    // plantName/locationName are intentionally NOT sent — the backend
    // always derives them fresh from the Plant document, so the two can
    // never drift out of sync with each other.
    const payload = {
      plantId: values.plantId,
      locationId: values.locationId,
      shiftName: values.shiftName.trim(),
      shiftType: values.shiftType,
      shiftStartTime: values.shiftStartTime.format("HH:mm"),
      shiftEndTime: values.shiftEndTime.format("HH:mm"),
      breaks: (values.breaks || []).map((b) => ({
        breakName: b.breakName.trim(),
        startTime: b.startTime.format("HH:mm"),
        endTime: b.endTime.format("HH:mm"),
      })),
      status: values.status || "Active",
    };

    setSaving(true);
    try {
      if (editingShift) {
        await API.put(`/shifts/${editingShift._id}`, payload);
        message.success("Shift updated successfully");
      } else {
        await API.post("/shifts", payload);
        message.success("Shift created successfully");
      }
      setModalOpen(false);
      await fetchShifts();
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to save shift"));
    } finally {
      setSaving(false);
    }
  };

  /* Permanent delete */
  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await API.delete(`/shifts/${id}`);
      message.success("Shift deleted");
      await fetchShifts();
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to delete shift"));
    } finally {
      setDeletingId(null);
    }
  };

  /* Activate / Deactivate — one click, reuses the existing PUT endpoint.
     Sending just { status } is safe: the controller keeps every other
     field (plant, times, breaks) exactly as it already was. */
  const handleToggleStatus = async (record, nextStatus) => {
    setStatusUpdatingId(record._id);
    try {
      await API.put(`/shifts/${record._id}`, { status: nextStatus });
      message.success(nextStatus === "Active" ? "Shift activated" : "Shift deactivated");
      await fetchShifts();
    } catch (err) {
      message.error(getErrorMessage(err, nextStatus === "Active" ? "Failed to activate shift" : "Failed to deactivate shift"));
    } finally {
      setStatusUpdatingId(null);
    }
  };

  /* ════════════════════════════════════════════════════════
     TABLE COLUMNS
  ════════════════════════════════════════════════════════ */
  const columns = [
    { title: "Plant", dataIndex: "plantName", key: "plantName", width: 130, render: (v) => <span className="font-semibold text-slate-800 text-xs">{v}</span> },
    { title: "Location", dataIndex: "locationName", key: "locationName", width: 120, render: (v) => <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={11} />{v}</span> },
    { title: "Shift Name", dataIndex: "shiftName", key: "shiftName", width: 130, render: (v) => <Tag color="cyan" className="!rounded-lg !text-[11px] !font-semibold">{v}</Tag> },
    {
      title: "Type", dataIndex: "shiftType", key: "shiftType", width: 100,
      render: (v) => {
        const m = SHIFT_TYPE_META[v] || SHIFT_TYPE_META.Morning;
        const Icon = m.icon;
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: m.bg, border: `1px solid ${m.border}`, color: m.color }}>
            <Icon size={10} />{v}
          </span>
        );
      },
      filters: [{ text: "Morning", value: "Morning" }, { text: "Afternoon", value: "Afternoon" }, { text: "Night", value: "Night" }],
      onFilter: (val, r) => r.shiftType === val,
    },
    { title: "Start", dataIndex: "shiftStartTime", key: "start", width: 74, align: "center", render: (v) => <span className="font-mono text-xs">{v}</span> },
    { title: "End", dataIndex: "shiftEndTime", key: "end", width: 74, align: "center", render: (v) => <span className="font-mono text-xs">{v}</span> },
    { title: "Total Break", dataIndex: "totalBreakMinutes", key: "break", width: 100, align: "center", render: (v) => <Tag className="!rounded-lg !text-[11px]">{v} min</Tag> },
    { title: "Actual Working", key: "working", width: 120, align: "center", render: (_, r) => <span className="font-bold text-teal-700 text-xs">{r.actualWorkingHours || fmtHM(r.actualWorkingMinutes)}</span> },
    {
      title: "Status", dataIndex: "status", key: "status", width: 100, align: "center",
      render: (v) => (
        <Tag color={v === "Active" ? "success" : "default"} className="!rounded-full !text-[11px] !font-semibold">
          {v === "Active" ? <CheckCircle2 size={10} className="inline -mt-0.5 mr-1" /> : <XCircle size={10} className="inline -mt-0.5 mr-1" />}{v}
        </Tag>
      ),
      filters: [{ text: "Active", value: "Active" }, { text: "Inactive", value: "Inactive" }],
      onFilter: (val, r) => r.status === val,
    },
    {
      title: "", key: "actions", fixed: "right", width: 130, align: "center",
      render: (_, r) => (
        <div className="flex items-center gap-0.5 justify-center">
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<Pencil size={13} style={{ color: BRAND }} />} onClick={() => openEditModal(r)} />
          </Tooltip>
          {r.status === "Active" ? (
            <Tooltip title="Deactivate">
              <Button type="text" size="small" loading={statusUpdatingId === r._id}
                icon={<Ban size={13} className="text-slate-500" />} onClick={() => handleToggleStatus(r, "Inactive")} />
            </Tooltip>
          ) : (
            <Tooltip title="Activate">
              <Button type="text" size="small" loading={statusUpdatingId === r._id}
                icon={<CheckCircle2 size={13} className="text-green-600" />} onClick={() => handleToggleStatus(r, "Active")} />
            </Tooltip>
          )}
          <Popconfirm title="Delete this shift?" description="This cannot be undone." okText="Delete" cancelText="Cancel"
            okButtonProps={{ danger: true, loading: deletingId === r._id }} onConfirm={() => handleDelete(r._id)}>
            <Tooltip title="Delete permanently"><Button type="text" size="small" danger icon={<Trash2 size={13} />} /></Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-slate-100 px-5 py-5">
      <div className="max-w-[1500px] mx-auto space-y-4">

        {/* ── TOP HEADER ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#0E7490,#0891B2)" }}>
              <Clock3 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-800 m-0">Manage Shift Information</h1>
              <p className="text-xs text-slate-400 m-0 mt-0.5">Configure Plant Shift Timing & Break Schedule</p>
            </div>
          </div>
          <Button type="primary" icon={<Plus size={14} />} onClick={openCreateModal}
            className="!rounded-xl !font-semibold" style={{ backgroundColor: BRAND, borderColor: BRAND }}>
            Add Shift
          </Button>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          <StatMini icon={MapPin} label="Locations" value={stats.totalLocations} tone="slate" loading={loading} />
          <StatMini icon={Building2} label="Total Plants" value={stats.totalPlants} tone="teal" loading={loading} />
          <StatMini icon={Clock3} label="Shift Configs" value={stats.totalConfigs} tone="blue" loading={loading} />
          <StatMini icon={Sun} label="Morning Shifts" value={stats.dayShifts} tone="amber" loading={loading} />
          <StatMini icon={Sunset} label="Afternoon Shifts" value={stats.afternoonShifts} tone="orange" loading={loading} />
          <StatMini icon={Moon} label="Night Shifts" value={stats.nightShifts} tone="purple" loading={loading} />
          <StatMini icon={Timer} label="Active Now" value={stats.activeNow} tone="green" loading={loading} />
        </div>

        {/* ── FILTERS + TABLE ── */}
        <div className={CARD}>
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 flex-wrap justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Input prefix={<Search size={13} className="text-slate-400" />} placeholder="Search shift, plant, location..."
                value={searchText} onChange={(e) => setSearchText(e.target.value)} allowClear size="small" className="!rounded-lg !w-52" />
              <Select placeholder="Filter by Location" allowClear size="small" style={{ width: 170 }}
                value={locationFilter} onChange={handleLocationFilterChange}
                options={locationOptions} showSearch optionFilterProp="label" />
              <Select placeholder="Filter by Plant" allowClear size="small" style={{ width: 170 }}
                value={plantFilter} onChange={setPlantFilter}
                options={filterPlantOptions} showSearch optionFilterProp="label" />
              <Select placeholder="Shift Type" allowClear size="small" style={{ width: 120 }}
                value={shiftTypeFilter} onChange={setShiftTypeFilter}
                options={[{ value: "Morning", label: "Morning" }, { value: "Afternoon", label: "Afternoon" }, { value: "Night", label: "Night" }]} />
            </div>
            <div className="flex items-center gap-2">
              <Button size="small" onClick={handleResetFilters} className="!rounded-lg">Reset</Button>
              <Button size="small" icon={<RefreshCcw size={13} />} loading={refreshing} onClick={handleRefresh} className="!rounded-lg">Refresh</Button>
            </div>
          </div>

          <Table
            rowKey="_id"
            loading={loading}
            dataSource={filteredShifts}
            columns={columns}
            scroll={{ x: 1260 }}
            size="small"
            pagination={{
              pageSize: 10, showSizeChanger: true,
              showTotal: (t, r) => <span className="text-xs text-slate-500">Showing {r[0]}–{r[1]} of {t}</span>,
            }}
            locale={{ emptyText: <Empty description="No shifts configured yet" className="py-10" /> }}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          ADD / EDIT MODAL — compact & polished
      ══════════════════════════════════════════════════ */}
      <Modal open={modalOpen} onCancel={() => setModalOpen(false)} title={null} footer={null} width={640} centered destroyOnClose>
        <div style={{
          borderBottom: "3px solid #0E7490", margin: "-20px -24px 16px", padding: "15px 22px",
          background: "linear-gradient(135deg,#ecfeff,#f0fdff)",
        }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Clock3 size={16} style={{ color: BRAND }} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">{editingShift ? "Edit Shift Configuration" : "Add Shift Configuration"}</div>
              <div className="text-[10.5px] text-slate-500 mt-0.5">
                {editingShift ? `Editing ${editingShift.shiftName} — ${editingShift.plantName}` : "Configure a new shift for a plant"}
              </div>
            </div>
          </div>
        </div>

        <Form form={form} layout="vertical" size="small" onValuesChange={handleValuesChange}>
          {/* Section 1 — Location & Plant */}
          <SectionHeader icon={Building2} step="1" label="Location & Plant" />
          <SectionCard>
            <div className="grid grid-cols-2 gap-x-2">
              <Form.Item name="locationId" label="Location" rules={[{ required: true, message: "Select a location" }]} className="!mb-1">
                <Select placeholder="Select location" showSearch optionFilterProp="label" options={locationOptions} />
              </Form.Item>
              <Form.Item name="plantId" label="Plant" rules={[{ required: true, message: "Select a plant" }]} className="!mb-1">
                <Select placeholder={modalLocationId ? "Select plant" : "Pick a location first"} showSearch optionFilterProp="label"
                  disabled={!modalLocationId} options={modalPlantOptions} />
              </Form.Item>
            </div>
          </SectionCard>

          {/* Section 2 — Shift Information */}
          <SectionHeader icon={Clock3} step="2" label="Shift Information" />
          <SectionCard>
            <div className="grid grid-cols-2 gap-x-2">
              <Form.Item name="shiftName" label="Shift Name" rules={[{ required: true, message: "Enter shift name" }]} className="!mb-2">
                <Input placeholder="e.g. A Shift, General Shift" />
              </Form.Item>
              <Form.Item name="shiftType" label="Shift Type" rules={[{ required: true, message: "Select shift type" }]} className="!mb-2">
                <Select options={SHIFT_TYPE_OPTIONS} />
              </Form.Item>
              <Form.Item name="shiftStartTime" label="Start Time" rules={[{ required: true, message: "Select start time" }]} className="!mb-1">
                <TimePicker format="HH:mm" className="w-full" />
              </Form.Item>
              <Form.Item name="shiftEndTime" label="End Time" rules={[{ required: true, message: "Select end time" }]} className="!mb-1">
                <TimePicker format="HH:mm" className="w-full" />
              </Form.Item>
              <Form.Item name="status" label="Status" className="!mb-1 col-span-2">
                <Select options={[{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]} />
              </Form.Item>
            </div>
          </SectionCard>

          {/* Section 3 — Breaks */}
          <SectionHeader icon={Coffee} step="3" label="Break Information" />
          <SectionCard>
            <Form.List name="breaks">
              {(fields, { add, remove }) => (
                <>
                  {fields.length === 0 && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2 bg-white border border-dashed border-slate-200 rounded-lg px-3 py-2.5">
                      <Coffee size={13} className="text-slate-300 flex-shrink-0" />
                      No breaks added yet — click "Add Break" below (Lunch, Tea, Maintenance, etc.)
                    </div>
                  )}

                  {fields.map((field, idx) => (
                    <div key={field.key} className="grid grid-cols-12 gap-1.5 items-start bg-white border border-slate-200 rounded-lg p-2 mb-1.5">
                      <div className="col-span-4">
                        {idx === 0 && <label className={LABEL}>Break Name</label>}
                        <Form.Item {...field} name={[field.name, "breakName"]} rules={[{ required: true, message: "Required" }]} className="!mb-0">
                          <Input placeholder="e.g. Lunch Break" />
                        </Form.Item>
                      </div>
                      <div className="col-span-3">
                        {idx === 0 && <label className={LABEL}>Start</label>}
                        <Form.Item {...field} name={[field.name, "startTime"]} rules={[{ required: true, message: "Required" }]} className="!mb-0">
                          <TimePicker format="HH:mm" className="w-full" />
                        </Form.Item>
                      </div>
                      <div className="col-span-3">
                        {idx === 0 && <label className={LABEL}>End</label>}
                        <Form.Item {...field} name={[field.name, "endTime"]} rules={[{ required: true, message: "Required" }]} className="!mb-0">
                          <TimePicker format="HH:mm" className="w-full" />
                        </Form.Item>
                      </div>
                      <div className="col-span-1 flex flex-col items-center">
                        {idx === 0 && <label className={LABEL}>Mins</label>}
                        <Form.Item shouldUpdate className="!mb-0">
                          {() => {
                            const b = form.getFieldValue(["breaks", field.name]);
                            const shiftStart = form.getFieldValue("shiftStartTime");
                            if (!b?.startTime || !b?.endTime) return <span className="text-[11px] text-slate-300 mt-1.5 block">—</span>;
                            const baseMin = shiftStart ? toMinutes(shiftStart.format("HH:mm")) : toMinutes(b.startTime.format("HH:mm"));
                            const bStart = normalize(baseMin, b.startTime.format("HH:mm"));
                            const bEnd = normalize(baseMin, b.endTime.format("HH:mm"));
                            const dur = bEnd - bStart;
                            return <Tag color={dur > 0 ? "cyan" : "red"} className="!rounded-lg !text-[11px] !mr-0 mt-0.5">{dur > 0 ? dur : "!"}</Tag>;
                          }}
                        </Form.Item>
                      </div>
                      <div className="col-span-1 flex justify-center pt-0.5">
                        {idx === 0 && <label className={LABEL}>&nbsp;</label>}
                        <Button danger type="text" size="small" icon={<Trash2 size={12} />}
                          onClick={() => { remove(field.name); recalcFromValues(form.getFieldsValue()); }} />
                      </div>
                    </div>
                  ))}

                  <Button type="dashed" size="small" icon={<Plus size={12} />} onClick={() => add()} block className="!rounded-lg !mt-1">
                    Add Break
                  </Button>
                </>
              )}
            </Form.List>
          </SectionCard>

          {/* Auto-calculated summary */}
          <div className="grid grid-cols-4 gap-2">
            <CalcTile icon={Clock3} label="Total Shift" value={fmtHM(liveCalc.totalShiftMinutes)} sub={`${liveCalc.totalShiftMinutes} min`} tone="slate" />
            <CalcTile icon={Coffee} label="Total Break" value={fmtHM(liveCalc.totalBreakMinutes)} sub={`${liveCalc.totalBreakMinutes} min`} tone="amber" />
            <CalcTile icon={CheckCircle2} label="Actual Working" value={fmtHM(liveCalc.actualWorkingMinutes)} sub={`${liveCalc.actualWorkingMinutes} min`} tone="teal" />
            <CalcTile icon={Timer} label="Working Hours" value={fmtHM(liveCalc.actualWorkingMinutes)} sub="excl. breaks" tone="cyan" />
          </div>
        </Form>

        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
          <Button size="small" onClick={() => setModalOpen(false)} className="!rounded-lg">Cancel</Button>
          <Button type="primary" size="small" loading={saving} onClick={handleSave}
            className="!rounded-lg !font-semibold" style={{ backgroundColor: BRAND, borderColor: BRAND, boxShadow: "0 4px 12px -3px rgba(14,116,144,0.4)" }}>
            {editingShift ? "Update Shift" : "Save Shift"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}