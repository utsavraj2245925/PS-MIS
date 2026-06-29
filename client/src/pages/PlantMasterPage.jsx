import React, { useState, useEffect, useCallback } from "react";
import { message, Modal, Table, Avatar, Tooltip, Badge, Empty, Spin } from "antd";
import {
  Factory, Search, Plus, Pencil, Trash2,
  Activity, Building2, Gauge, Timer, Layers3, Package,
  CheckCircle2, XCircle, TrendingUp, Settings2, Zap,
  BarChart3, MapPin, User, RefreshCw, X, Save,
  RotateCcw,
} from "lucide-react";
import {
  getPlants, createPlant, updatePlant, deletePlant,
} from "../services/plantService";

/* ───────────────────────────────────────────── */
const PALETTE = ["#0E7490","#7E22CE","#B45309","#15803D","#BE123C","#4338CA","#0369A1","#9D174D"];
const avatarColor = (seed = "") => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
};
const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

const StatusTag = ({ status }) => {
  const active = status === "Active";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: active ? "#DCFCE7" : "#FFF1F2",
      color: active ? "#15803D" : "#BE123C",
      fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: 999,
        background: active ? "#22C55E" : "#F43F5E", flexShrink: 0,
      }} />
      {status}
    </span>
  );
};

const FieldLabel = ({ icon: Icon, label, required }) => (
  <label style={{
    display: "flex", alignItems: "center", gap: 5,
    fontSize: 11.5, fontWeight: 600, color: "#475569",
    marginBottom: 5, letterSpacing: 0.2,
  }}>
    {Icon && <Icon size={12} color="#94A3B8" />}
    {label}
    {required && <span style={{ color: "#F43F5E" }}>*</span>}
  </label>
);

const Field = ({ label, icon, required, children }) => (
  <div>
    <FieldLabel icon={icon} label={label} required={required} />
    {children}
  </div>
);

const SectionDivider = ({ icon: Icon, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, marginTop: 4 }}>
    <div style={{
      width: 26, height: 26, borderRadius: 8,
      background: "#ECFEFF", border: "1px solid rgba(14,116,144,0.2)",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <Icon size={13} color="#0E7490" />
    </div>
    <span style={{ fontSize: 10.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>
      {label}
    </span>
    <div style={{ flex: 1, height: 1, background: "#F1F5F9" }} />
  </div>
);

const ValueBox = ({ children, highlight }) => (
  <div style={{
    background: highlight ? "#F0FDF4" : "#F8FAFC",
    border: `1px solid ${highlight ? "#BBF7D0" : "#F1F5F9"}`,
    borderRadius: 10, padding: "9px 12px",
    fontSize: 13, color: highlight ? "#15803D" : "#0F172A",
    fontWeight: highlight ? 700 : 500,
    minHeight: 38, display: "flex", alignItems: "center",
  }}>
    {children ?? "—"}
  </div>
);

function SInput({ value, onChange, type = "text", placeholder = "", name }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      name={name} value={value ?? ""} onChange={onChange} type={type}
      placeholder={placeholder}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        ...S.input,
        borderColor: focused ? "#0E7490" : "#E2E8F0",
        boxShadow: focused ? "0 0 0 3px rgba(14,116,144,0.12)" : "none",
        background: focused ? "#fff" : "#F8FAFC",
        transition: "all 0.15s",
      }}
    />
  );
}

const IconBtn = ({ onClick, bg, fg, children, title }) => (
  <Tooltip title={title}>
    <button onClick={onClick} style={{
      background: bg, color: fg, border: "none",
      width: 30, height: 30, borderRadius: 8,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", flexShrink: 0,
    }}>
      {children}
    </button>
  </Tooltip>
);

const CalcChip = ({ icon: Icon, label, value, suffix, highlight }) => (
  <div style={{
    background: highlight ? "#F0FDF4" : "#F8FAFC",
    border: `1px solid ${highlight ? "#BBF7D0" : "#F1F5F9"}`,
    borderTop: `2px solid ${highlight ? "#22C55E" : "#E2E8F0"}`,
    borderRadius: 10, padding: "10px 10px 8px",
    textAlign: "center", flex: 1,
  }}>
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
      <Icon size={12} color={highlight ? "#15803D" : "#94A3B8"} />
    </div>
    <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ fontSize: 17, fontWeight: 800, color: highlight ? "#15803D" : "#0F172A", lineHeight: 1 }}>
      {value}
      {suffix && <span style={{ fontSize: 9, fontWeight: 500, marginLeft: 2, color: "#94A3B8" }}>{suffix}</span>}
    </div>
  </div>
);

/* ── Plant-level identity only now ── */
const DEFAULT_FORM = {
  plantName: "", plantCode: "", location: "", plantAdmin: "", status: "Active",
};

/* ── One conveyor entry ── */
const DEFAULT_CONVEYOR = {
  conveyorName: "",
  conveyorLength: "",
  conveyorSpeed: "",
  pitchDistance: "",
  availableTime: 630,
  shiftsPerDay: 2,
  demandPerShift: "",
  hangerEfficiency: 100,
};

const computeConveyorMetrics = (c) => {
  const cLen  = Number(c.conveyorLength)   || 0;
  const cSpd  = Number(c.conveyorSpeed)    || 0;
  const pitch = Number(c.pitchDistance)    || 0;
  const avail = Number(c.availableTime)    || 0;
  const eff   = Number(c.hangerEfficiency) || 100;

  const totalHangers            = pitch > 0 ? Math.round(cLen / pitch) : 0;
  const processTime             = cSpd  > 0 ? +(cLen / cSpd).toFixed(2) : 0;
  const totalRoundsShift        = processTime > 0 ? +(avail / processTime).toFixed(2) : 0;
  const hangerPerMinute         = pitch > 0 ? +(cSpd / pitch).toFixed(2) : 0;
  const availableHangerPerShift = Math.round(hangerPerMinute * avail) || 0;
  const effectiveHangerPerShift = Math.round(availableHangerPerShift * (eff / 100)) || 0;

  return { totalHangers, processTime, totalRoundsShift, hangerPerMinute, availableHangerPerShift, effectiveHangerPerShift };
};

const sumConveyor = (p, key) => (p.conveyors || []).reduce((s, c) => s + Number(c[key] || 0), 0);

/* ── One conveyor card inside the form ── */
const ConveyorCard = ({ conveyor, index, onChange, onFieldChange, onRemove, removable }) => {
  const m = computeConveyorMetrics(conveyor);
  const calcChips = [
    { icon: Layers3,      label: "Total Hangers",    value: m.totalHangers },
    { icon: Timer,        label: "Process Time",     value: m.processTime, suffix: "min" },
    { icon: RefreshCw,    label: "Rounds / Shift",   value: m.totalRoundsShift },
    { icon: Gauge,        label: "Hanger / Min",     value: m.hangerPerMinute },
    { icon: BarChart3,    label: "Avail. Hanger",    value: m.availableHangerPerShift },
    { icon: CheckCircle2, label: "Effective Hanger", value: m.effectiveHangerPerShift, highlight: true },
  ];

  return (
    <div style={{ border: "1px solid #F1F5F9", borderRadius: 14, padding: 16, marginBottom: 14, background: "#FAFBFC" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#0E7490" }}>
          Conveyor #{index + 1}
        </span>
        {removable && (
          <IconBtn title="Remove conveyor" bg="#FFF1F2" fg="#BE123C" onClick={() => onRemove(index)}>
            <Trash2 size={13} />
          </IconBtn>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px 18px", marginBottom: 14 }} className="pm-form-grid">
        <Field label="Conveyor Name">
          <SInput name="conveyorName" value={conveyor.conveyorName} onChange={(e) => onChange(index, e)} placeholder="e.g. Line A" />
        </Field>
        <Field label="Conveyor Length (m)" required>
          <SInput name="conveyorLength" value={conveyor.conveyorLength} onChange={(e) => onChange(index, e)} type="number" placeholder="0" />
        </Field>
        <Field label="Conveyor Speed (m/min)" required>
          <SInput name="conveyorSpeed" value={conveyor.conveyorSpeed} onChange={(e) => onChange(index, e)} type="number" placeholder="0" />
        </Field>
        <Field label="Pitch Distance (m)" required>
          <SInput name="pitchDistance" value={conveyor.pitchDistance} onChange={(e) => onChange(index, e)} type="number" placeholder="0" />
        </Field>
        <Field label="Available Time (min)">
          <SInput name="availableTime" value={conveyor.availableTime} onChange={(e) => onChange(index, e)} type="number" placeholder="630" />
        </Field>
        <Field label="Shifts / Day">
          <SInput name="shiftsPerDay" value={conveyor.shiftsPerDay} onChange={(e) => onChange(index, e)} type="number" placeholder="2" />
        </Field>
        <Field label="Demand Per Shift (ODU)">
          <SInput name="demandPerShift" value={conveyor.demandPerShift} onChange={(e) => onChange(index, e)} type="number" placeholder="0" />
        </Field>
        <Field label="Hanger Efficiency (%)">
          <select
            value={conveyor.hangerEfficiency}
            onChange={(e) => onFieldChange(index, "hangerEfficiency", +e.target.value)}
            style={S.nativeSelect}
          >
            {[100, 95, 85, 75].map((v) => (
              <option key={v} value={v}>{v}%</option>
            ))}
          </select>
        </Field>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {calcChips.map((c, i) => (
          <div key={i} style={{ flex: "1 1 100px", minWidth: 90 }}>
            <CalcChip icon={c.icon} label={c.label} value={c.value} suffix={c.suffix} highlight={c.highlight} />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ───────────────────────────────────────────── MAIN PAGE */
export default function PlantMasterPage() {

  const [plants,        setPlants]        = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("");
  const [formOpen,      setFormOpen]      = useState(false);
  const [detailOpen,    setDetailOpen]    = useState(false);
  const [selected,      setSelected]      = useState(null);
  const [editingId,     setEditingId]     = useState(null);
  const [form,          setForm]          = useState(DEFAULT_FORM);
  const [conveyors,     setConveyors]     = useState([{ ...DEFAULT_CONVEYOR }]);
  const [formSaving,    setFormSaving]    = useState(false);

  /* ── Fetch ── */
  const fetchPlants = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPlants();
      setPlants(res.data.plants || []);
    } catch {
      message.error("Failed to load plants");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlants(); }, [fetchPlants]);

  /* ── Plant-level form helpers ── */
  const resetForm = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setConveyors([{ ...DEFAULT_CONVEYOR }]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  /* ── Conveyor-array helpers ── */
  const addConveyor = () => setConveyors((prev) => [...prev, { ...DEFAULT_CONVEYOR }]);

  const removeConveyor = (idx) =>
    setConveyors((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  const handleConveyorChange = (idx, e) => {
    const { name, value } = e.target;
    setConveyors((prev) => prev.map((c, i) => (i === idx ? { ...c, [name]: value } : c)));
  };

  const handleConveyorField = (idx, name, value) =>
    setConveyors((prev) => prev.map((c, i) => (i === idx ? { ...c, [name]: value } : c)));

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!form.plantName || !form.plantCode || !form.location || !form.plantAdmin) {
      message.warning("Plant Name, Code, Location and Admin are required");
      return;
    }
    if (conveyors.some((c) => !c.conveyorLength || !c.conveyorSpeed || !c.pitchDistance)) {
      message.warning("Each conveyor needs Length, Speed and Pitch Distance");
      return;
    }
    try {
      setFormSaving(true);
      const payload = {
        ...form,
        conveyors: conveyors.map((c) => ({
          ...c,
          conveyorLength: +c.conveyorLength,
          conveyorSpeed: +c.conveyorSpeed,
          pitchDistance: +c.pitchDistance,
          availableTime: +c.availableTime,
          shiftsPerDay: +c.shiftsPerDay,
          demandPerShift: +c.demandPerShift,
          hangerEfficiency: +c.hangerEfficiency,
          ...computeConveyorMetrics(c),
        })),
      };
      if (editingId) {
        await updatePlant(editingId, payload);
        message.success("Plant updated");
      } else {
        await createPlant(payload);
        message.success("Plant created");
      }
      setFormOpen(false);
      resetForm();
      fetchPlants();
    } catch (err) {
      message.error(err?.response?.data?.message || "Save failed");
    } finally {
      setFormSaving(false);
    }
  };

  /* ── Edit ── */
  const handleEdit = (plant) => {
    setEditingId(plant._id);
    setForm({
      plantName:  plant.plantName  || "",
      plantCode:  plant.plantCode  || "",
      location:   plant.location   || "",
      plantAdmin: plant.plantAdmin || "",
      status:     plant.status     || (plant.isActive === false ? "Inactive" : "Active"),
    });
    setConveyors(
      plant.conveyors?.length
        ? plant.conveyors.map((c) => ({
            conveyorName:     c.conveyorName     || "",
            conveyorLength:   c.conveyorLength   || "",
            conveyorSpeed:    c.conveyorSpeed    || "",
            pitchDistance:    c.pitchDistance    || "",
            availableTime:    c.availableTime    || 630,
            shiftsPerDay:     c.shiftsPerDay      || 2,
            demandPerShift:   c.demandPerShift   || "",
            hangerEfficiency: c.hangerEfficiency || 100,
          }))
        : [{ ...DEFAULT_CONVEYOR }]
    );
    setFormOpen(true);
  };

  /* ── Delete ── */
  const handleDelete = (id) => {
    Modal.confirm({
      title: "Delete this plant?",
      content: "This will also remove all its conveyor entries. This action cannot be undone.",
      okText: "Delete", okType: "danger",
      onOk: async () => {
        try { await deletePlant(id); message.success("Plant deleted"); fetchPlants(); }
        catch { message.error("Delete failed"); }
      },
    });
  };

  /* ── Filter ── */
  const filtered = plants.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.plantName?.toLowerCase().includes(q) ||
      p.plantCode?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q)  ||
      p.plantAdmin?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  /* ── Stats ── */
  const totalPlants    = plants.length;
  const activePlants   = plants.filter((p) => p.status === "Active").length;
  const inactivePlants = plants.filter((p) => p.status === "Inactive").length;
  const totalDemand    = plants.reduce((s, p) => s + sumConveyor(p, "demandPerShift"), 0);

  const statCards = [
    { label: "Total Plants",    value: totalPlants,                  icon: Factory,      tint: "#0E7490", bg: "#ECFEFF" },
    { label: "Active Plants",   value: activePlants,                 icon: CheckCircle2, tint: "#15803D", bg: "#F0FDF4" },
    { label: "Inactive Plants", value: inactivePlants,               icon: XCircle,      tint: "#BE123C", bg: "#FFF1F2" },
    { label: "Total Demand",    value: totalDemand.toLocaleString(), icon: Package,      tint: "#7E22CE", bg: "#FAF5FF" },
  ];

  /* ── Table Columns ── */
  const columns = [
    {
      title: "Plant",
      dataIndex: "plantName",
      key: "plantName",
      render: (_, p) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            size={36}
            style={{
              background: avatarColor(p.plantName || p.plantCode),
              fontWeight: 700, fontSize: 12, flexShrink: 0,
            }}
          >
            {initials(p.plantName)}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>{p.plantName}</div>
            <div style={{ fontSize: 11, color: "#64748B", display: "flex", alignItems: "center", gap: 3 }}>
              <User size={9} /> {p.plantAdmin || "—"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Code",
      dataIndex: "plantCode",
      width: 90,
      render: (v) => (
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 12, fontWeight: 600, color: "#0E7490",
          background: "#ECFEFF", padding: "2px 8px", borderRadius: 6,
        }}>{v}</span>
      ),
    },
    {
      title: "Location",
      dataIndex: "location",
      width: 140,
      render: (v) => (
        <span style={{ fontSize: 12.5, color: "#334155", display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={10} color="#94A3B8" /> {v || "—"}
        </span>
      ),
    },
    {
      title: "Conveyors",
      key: "conveyorCount",
      width: 90, align: "center",
      render: (_, p) => (
        <span style={{
          fontSize: 12, fontWeight: 700, color: "#7E22CE",
          background: "#FAF5FF", padding: "2px 10px", borderRadius: 999,
        }}>
          {p.conveyors?.length || 0}
        </span>
      ),
    },
    {
      title: "Demand / Shift",
      key: "demandPerShift",
      width: 130, align: "right",
      render: (_, p) => (
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#B45309" }}>
            {sumConveyor(p, "demandPerShift").toLocaleString()}
          </div>
          <div style={{ fontSize: 9, color: "#94A3B8" }}>ODU / shift</div>
        </div>
      ),
    },
    {
      title: "Eff. Capacity",
      key: "effectiveHangerPerShift",
      width: 130, align: "right",
      render: (_, p) => (
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D" }}>
            {sumConveyor(p, "effectiveHangerPerShift").toLocaleString()}
          </div>
          <div style={{ fontSize: 9, color: "#94A3B8" }}>hangers / shift</div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 100, align: "center",
      render: (s) => <StatusTag status={s} />,
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_, p) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
          <IconBtn title="Edit" bg="#FFFBEB" fg="#B45309" onClick={() => handleEdit(p)}>
            <Pencil size={13} />
          </IconBtn>
          <IconBtn title="Delete" bg="#FFF1F2" fg="#BE123C" onClick={() => handleDelete(p._id)}>
            <Trash2 size={13} />
          </IconBtn>
        </div>
      ),
    },
  ];

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'IBM Plex Sans', sans-serif", padding: "28px 32px" }}>
      <CSS />

      {/* ══ HEADER ══ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11,
              background: "linear-gradient(135deg,#0E7490,#0891B2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 6px 14px -4px rgba(14,116,144,0.4)",
            }}>
              <Factory size={18} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>
              Plant Master
            </h1>
          </div>
          <p style={{ color: "#64748B", fontSize: 13, margin: "4px 0 0 46px" }}>
            Conveyor capacity planning &amp; hanger efficiency management
          </p>
        </div>
        <button onClick={() => { resetForm(); setFormOpen(true); }} style={S.primaryBtn}>
          <Plus size={15} /> Add Plant
        </button>
      </div>

      {/* ══ STAT CARDS ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 20 }}>
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} style={S.statCard}>
              <div>
                <p style={{ color: "#64748B", fontSize: 12, margin: 0, fontWeight: 500 }}>{c.label}</p>
                <h3 style={{ fontSize: 28, fontWeight: 700, color: "#0F172A", margin: "4px 0 0" }}>{c.value}</h3>
              </div>
              <div style={{
                width: 40, height: 40, borderRadius: 11,
                background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon size={19} color={c.tint} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ══ FILTERS ══ */}
      <div style={S.panel}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr auto auto", gap: 10 }} className="pm-filters">
          <div style={{ position: "relative" }}>
            <Search size={15} style={{
              position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
              color: "#94A3B8", pointerEvents: "none",
            }} />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search plant name, code, location…"
              style={{ ...S.input, paddingLeft: 34 }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={S.nativeSelect}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button onClick={() => { setSearch(""); setStatusFilter(""); }} style={S.ghostBtn}>
            <RotateCcw size={14} /> Reset
          </button>

          <button onClick={fetchPlants} style={S.ghostBtn}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* ══ TABLE ══ */}
      <div style={{ ...S.panel, padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "14px 20px", borderBottom: "1px solid #F1F5F9",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>Plant Directory</h2>
          <Badge count={filtered.length} showZero
            style={{ backgroundColor: "#ECFEFF", color: "#0E7490", fontWeight: 600 }} />
        </div>
        <Table
          dataSource={filtered} columns={columns} rowKey="_id"
          loading={{ spinning: loading, indicator: <Spin size="large" /> }}
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          scroll={{ x: 950 }}
          onRow={(p) => ({ onClick: () => { setSelected(p); setDetailOpen(true); }, style: { cursor: "pointer" } })}
          locale={{
            emptyText: (
              <div style={{ padding: "48px 0" }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<span style={{ color: "#64748B" }}>No plants found. Click "Add Plant" to get started.</span>} />
              </div>
            ),
          }}
        />
      </div>

      {/* ══════════════════════════════════════
          CREATE / EDIT MODAL
      ══════════════════════════════════════ */}
      <Modal
        open={formOpen}
        onCancel={() => { setFormOpen(false); resetForm(); }}
        footer={null} centered destroyOnHidden mask={{closable:false}}
        width={880} closeIcon={<X size={17} />}
        styles={{ header: { padding: 0 }, body: { padding: 0 } }}
      >
        <div style={{
          background: "linear-gradient(135deg,#0E7490,#155E75)",
          padding: "20px 28px", borderRadius: "8px 8px 0 0",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {editingId ? <Pencil size={16} color="#fff" /> : <Plus size={16} color="#fff" />}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#fff" }}>
              {editingId ? "Edit Plant Configuration" : "Register New Plant"}
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
              {editingId ? "Modify plant details and its conveyor lines" : "Add a manufacturing plant with one or more conveyor lines"}
            </p>
          </div>
        </div>

        <div style={{ padding: "22px 28px", overflowY: "auto", maxHeight: "72vh" }}>

          {/* ── Plant Identity ── */}
          <SectionDivider icon={Building2} label="Plant Identity" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px 18px", marginBottom: 22 }} className="pm-form-grid">
            <Field label="Plant Name" required>
              <SInput name="plantName" value={form.plantName} onChange={handleChange} placeholder="e.g. Paint Shop A" />
            </Field>
            <Field label="Plant Code" required>
              <SInput name="plantCode" value={form.plantCode} onChange={handleChange} placeholder="e.g. PS-A01" />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setField("status", e.target.value)} style={S.nativeSelect}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </Field>
            <Field label="Location" icon={MapPin} required>
              <SInput name="location" value={form.location} onChange={handleChange} placeholder="e.g. Unit 3, Block B" />
            </Field>
            <Field label="Plant Admin" icon={User} required>
              <SInput name="plantAdmin" value={form.plantAdmin} onChange={handleChange} placeholder="e.g. Rajesh Kumar" />
            </Field>
          </div>

          {/* ── Conveyors (multi) ── */}
          <SectionDivider icon={Settings2} label={`Conveyor Lines (${conveyors.length})`} />

          {conveyors.map((c, idx) => (
            <ConveyorCard
              key={idx}
              conveyor={c}
              index={idx}
              onChange={handleConveyorChange}
              onFieldChange={handleConveyorField}
              onRemove={removeConveyor}
              removable={conveyors.length > 1}
            />
          ))}

          <button onClick={addConveyor} style={{ ...S.ghostBtn, marginBottom: 6 }}>
            <Plus size={14} /> Add Another Conveyor
          </button>
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 28px", borderTop: "1px solid #F1F5F9",
          display: "flex", justifyContent: "flex-end", gap: 10,
          background: "#FAFAFA",
        }}>
          <button onClick={() => { setFormOpen(false); resetForm(); }} style={S.ghostBtn}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={formSaving} style={{ ...S.primaryBtn, opacity: formSaving ? 0.75 : 1 }}>
            <Save size={14} />
            {formSaving ? "Saving…" : editingId ? "Update Plant" : "Register Plant"}
          </button>
        </div>
      </Modal>

      {/* ══════════════════════════════════════
          DETAIL MODAL
      ══════════════════════════════════════ */}
      <Modal
        open={detailOpen} onCancel={() => setDetailOpen(false)}
        footer={null} width={760} closeIcon={<X size={17} />}
        destroyOnHidden
        styles={{ body: { padding: 0 } }}
      >
        {selected && (
          <div>
            <div style={{
              background: "linear-gradient(135deg,#0E7490,#155E75)",
              padding: "24px 28px 20px", borderRadius: "8px 8px 0 0",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar
                  size={50}
                  style={{
                    background: avatarColor(selected.plantName || selected.plantCode),
                    fontWeight: 700, fontSize: 17,
                    border: "2px solid rgba(255,255,255,0.35)", flexShrink: 0,
                  }}
                >
                  {initials(selected.plantName)}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>{selected.plantName}</h2>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600,
                      color: "#fff", background: "rgba(255,255,255,0.15)",
                      padding: "2px 8px", borderRadius: 6,
                    }}>{selected.plantCode}</span>
                    <StatusTag status={selected.status} />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={10} />{selected.location || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: "22px 28px" }}>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px 16px", marginBottom: 18 }}>
                <div>
                  <FieldLabel icon={User} label="Plant Admin" />
                  <ValueBox>{selected.plantAdmin || "—"}</ValueBox>
                </div>
                <div>
                  <FieldLabel icon={Layers3} label="Conveyor Lines" />
                  <ValueBox>{selected.conveyors?.length || 0}</ValueBox>
                </div>
                <div>
                  <FieldLabel label="Total Demand / Shift" />
                  <ValueBox highlight>{sumConveyor(selected, "demandPerShift").toLocaleString()}</ValueBox>
                </div>
              </div>

              {/* Capacity vs Demand panel (aggregated) */}
              <div style={{
                background: "#F8FAFC", border: "1px solid #F1F5F9",
                borderRadius: 12, padding: "16px 18px", marginBottom: 18,
              }}>
                <p style={{ fontSize: 10.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 14px" }}>
                  Capacity Overview (All Conveyors)
                </p>
                {(() => {
                  const demand = sumConveyor(selected, "demandPerShift");
                  const eff    = sumConveyor(selected, "effectiveHangerPerShift");
                  const util   = eff > 0 ? Math.round((demand / eff) * 100) : 0;
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                      <div>
                        <div style={{ fontSize: 10.5, color: "#94A3B8", marginBottom: 4 }}>Demand / Shift</div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: "#B45309" }}>{demand.toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: "#94A3B8" }}>ODU</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10.5, color: "#94A3B8", marginBottom: 4 }}>Effective Capacity</div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: "#15803D" }}>{eff.toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: "#94A3B8" }}>hangers</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10.5, color: "#94A3B8", marginBottom: 4 }}>Utilisation</div>
                        {eff > 0 ? (
                          <>
                            <div style={{ fontSize: 26, fontWeight: 800, color: "#0F172A" }}>{util}%</div>
                            <div style={{ height: 5, background: "#E2E8F0", borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
                              <div style={{
                                height: "100%", borderRadius: 3,
                                width: `${Math.min(util, 100)}%`,
                                background: "linear-gradient(90deg,#0E7490,#06B6D4)",
                                transition: "width 0.6s ease",
                              }} />
                            </div>
                          </>
                        ) : <div style={{ fontSize: 14, color: "#94A3B8" }}>—</div>}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Per-conveyor breakdown */}
              <p style={{ fontSize: 10.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px" }}>
                Conveyor Breakdown
              </p>
              {(selected.conveyors || []).map((c, idx) => (
                <div key={c._id || idx} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0E7490", marginBottom: 8 }}>
                    {c.conveyorName || `Conveyor #${idx + 1}`}
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[
                      { icon: Layers3,      label: "Total Hangers",   value: c.totalHangers            },
                      { icon: Timer,        label: "Process Time",    value: c.processTime, suffix: "min" },
                      { icon: RefreshCw,    label: "Rounds / Shift",  value: c.totalRoundsShift         },
                      { icon: Gauge,        label: "Hanger / Min",    value: c.hangerPerMinute          },
                      { icon: BarChart3,    label: "Avail. Hanger",   value: c.availableHangerPerShift  },
                      { icon: CheckCircle2, label: "Eff. Hanger",     value: c.effectiveHangerPerShift, highlight: true },
                    ].map((m, i) => (
                      <CalcChip key={i} icon={m.icon} label={m.label} value={m.value ?? "—"} suffix={m.suffix} highlight={m.highlight} />
                    ))}
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #F1F5F9", fontSize: 12, color: "#94A3B8" }}>
                Created {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "—"}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button onClick={() => setDetailOpen(false)} style={{ ...S.ghostBtn, flex: 1, justifyContent: "center" }}>
                  Close
                </button>
                <button onClick={() => { setDetailOpen(false); handleEdit(selected); }}
                  style={{ ...S.amberBtn, flex: 1, justifyContent: "center" }}>
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={() => { setDetailOpen(false); handleDelete(selected._id); }}
                  style={{ ...S.dangerBtn, flex: 1, justifyContent: "center" }}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ───────────────────────────────────────────── GLOBAL CSS */
const CSS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@600&display=swap');
    .ant-table-thead > tr > th {
      background: #F8FAFC !important; color: #64748B !important;
      font-size: 11px !important; font-weight: 700 !important;
      text-transform: uppercase; letter-spacing: 0.5px;
      border-bottom: 1px solid #F1F5F9 !important;
    }
    .ant-table-thead > tr > th::before { display: none !important; }
    .ant-table-tbody > tr > td {
      border-bottom: 1px solid #F8FAFC !important;
      padding: 11px 16px !important;
    }
    .ant-table-tbody > tr:hover > td { background: #F0FDFF !important; }
    .ant-badge-count { box-shadow: none !important; }
    .ant-pagination { font-size: 12px !important; }
    .ant-pagination-item-active { border-color: #0E7490 !important; }
    .ant-pagination-item-active a { color: #0E7490 !important; }
    input[type=number]::-webkit-inner-spin-button { opacity: 0.5; }
    @media (max-width: 960px) {
      .pm-filters    { grid-template-columns: 1fr 1fr !important; }
      .pm-form-grid  { grid-template-columns: 1fr 1fr !important; }
    }
    @media (max-width: 580px) {
      .pm-form-grid { grid-template-columns: 1fr !important; }
    }
  `}</style>
);

/* ───────────────────────────────────────────── STYLE TOKENS */
const S = {
  panel: {
    background: "#fff", border: "1px solid #F1F5F9",
    borderRadius: 18, padding: 18,
    boxShadow: "0 1px 3px rgba(15,23,42,0.05)", marginBottom: 18,
  },
  statCard: {
    background: "#fff", border: "1px solid #F1F5F9",
    borderRadius: 18, padding: "18px 20px",
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
  },
  input: {
    width: "100%", border: "1px solid #E2E8F0", borderRadius: 10,
    padding: "9px 12px", fontSize: 13, color: "#0F172A",
    outline: "none", background: "#F8FAFC", boxSizing: "border-box",
    fontFamily: "inherit", height: 40,
  },
  nativeSelect: {
    width: "100%", border: "1px solid #E2E8F0", borderRadius: 10,
    padding: "9px 12px", fontSize: 13, color: "#0F172A",
    outline: "none", background: "#F8FAFC", boxSizing: "border-box",
    fontFamily: "inherit", height: 40, cursor: "pointer",
    appearance: "none", WebkitAppearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32,
  },
  primaryBtn: {
    background: "linear-gradient(135deg,#0E7490,#0891B2)",
    color: "#fff", border: "none", padding: "9px 18px",
    borderRadius: 11, display: "inline-flex", alignItems: "center",
    gap: 7, fontSize: 13, fontWeight: 600, cursor: "pointer",
    boxShadow: "0 4px 14px -3px rgba(14,116,144,0.45)",
  },
  ghostBtn: {
    background: "#fff", color: "#475569", border: "1px solid #E2E8F0",
    padding: "9px 16px", borderRadius: 11,
    display: "inline-flex", alignItems: "center",
    gap: 7, fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  amberBtn: {
    background: "#FFFBEB", color: "#B45309", border: "1px solid #FEF3C7",
    padding: "9px 16px", borderRadius: 11,
    display: "inline-flex", alignItems: "center",
    gap: 7, fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  dangerBtn: {
    background: "#FFF1F2", color: "#BE123C", border: "1px solid #FFE4E6",
    padding: "9px 16px", borderRadius: 11,
    display: "inline-flex", alignItems: "center",
    gap: 7, fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
};