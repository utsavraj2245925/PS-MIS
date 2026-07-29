import React, { useState, useEffect, useCallback } from "react";
import { message, Modal, Table, Avatar, Tooltip, Badge, Empty, Spin } from "antd";
import {
  Factory, Search, Plus, Pencil, Trash2, Ban,
  Building2, Layers3, CheckCircle2, XCircle,
  Settings2, MapPin, RefreshCw, X, Save, RotateCcw,
} from "lucide-react";
import {
  getPlants, createPlant, updatePlant, deletePlant, permanentDeletePlant,
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

/* Diagnostic error reader — tells you WHY a request failed instead of
   always saying "Failed to X". A 404 here almost always means the
   updated route/controller hasn't been deployed to the running server. */
const getErrorMessage = (err, fallback = "Something went wrong") => {
  if (err?.response) {
    if (err.response.data?.message) return err.response.data.message;
    if (err.response.status === 404) {
      return "Endpoint not found (404) — the updated plant route/controller may not be deployed on the running server yet.";
    }
    if (err.response.status >= 500) {
      return "Server error — check the backend terminal/logs for the stack trace.";
    }
    return `Request failed (${err.response.status}).`;
  }
  if (err?.request) {
    return "No response from server — is the backend running and reachable at the configured API URL?";
  }
  return err?.message || fallback;
};

const StatusTag = ({ status }) => {
  const active = status === "Active";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: active ? "#DCFCE7" : "#FFF1F2",
      color: active ? "#15803D" : "#BE123C",
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: 999,
        background: active ? "#22C55E" : "#F43F5E", flexShrink: 0,
      }} />
      {status}
    </span>
  );
};

const FieldLabel = ({ icon: Icon, label, required }) => (
  <label style={{
    display: "flex", alignItems: "center", gap: 4,
    fontSize: 11, fontWeight: 600, color: "#475569",
    marginBottom: 4, letterSpacing: 0.2,
  }}>
    {Icon && <Icon size={11} color="#94A3B8" />}
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
  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12, marginTop: 3 }}>
    <div style={{
      width: 22, height: 22, borderRadius: 7,
      background: "#ECFEFF", border: "1px solid rgba(14,116,144,0.2)",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <Icon size={11} color="#0E7490" />
    </div>
    <span style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>
      {label}
    </span>
    <div style={{ flex: 1, height: 1, background: "#F1F5F9" }} />
  </div>
);

const ValueBox = ({ children, highlight }) => (
  <div style={{
    background: highlight ? "#F0FDF4" : "#F8FAFC",
    border: `1px solid ${highlight ? "#BBF7D0" : "#F1F5F9"}`,
    borderRadius: 9, padding: "8px 10px",
    fontSize: 12, color: highlight ? "#15803D" : "#0F172A",
    fontWeight: highlight ? 700 : 500,
    minHeight: 32, display: "flex", alignItems: "center",
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
      width: 26, height: 26, borderRadius: 7,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", flexShrink: 0,
    }}>
      {children}
    </button>
  </Tooltip>
);

/* ── Plant-level identity — Location is a free-text field again.
       The backend finds-or-creates the Location document from this
       name automatically; the frontend never touches a locationId. ── */
const DEFAULT_FORM = {
  plantName: "", plantCode: "", locationName: "", status: "Active",
};

/* ── One conveyor entry — name + its own Active/Inactive status ── */
const DEFAULT_CONVEYOR = { conveyorName: "", status: "Active" };

/* ── One conveyor row inside the form ── */
const ConveyorRow = ({ conveyor, index, onChange, onRemove, removable }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 8,
    border: "1px solid #F1F5F9", borderRadius: 10,
    padding: "7px 9px", marginBottom: 8, background: "#FAFBFC",
  }}>
    <div style={{
      width: 22, height: 22, borderRadius: 7, flexShrink: 0,
      background: "#ECFEFF", color: "#0E7490", fontSize: 10, fontWeight: 700,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {index + 1}
    </div>
    <div style={{ flex: 1 }}>
      <SInput
        name="conveyorName"
        value={conveyor.conveyorName}
        onChange={(e) => onChange(index, e)}
        placeholder={`e.g. Paint Line ${index + 1}`}
      />
    </div>
    <select
      name="status"
      value={conveyor.status}
      onChange={(e) => onChange(index, e)}
      style={{ ...S.nativeSelect, width: 100, flexShrink: 0 }}
    >
      <option value="Active">Active</option>
      <option value="Inactive">Inactive</option>
    </select>
    {removable && (
      <IconBtn title="Remove conveyor" bg="#FFF1F2" fg="#BE123C" onClick={() => onRemove(index)}>
        <Trash2 size={11} />
      </IconBtn>
    )}
  </div>
);

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
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to load plants"));
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

  /* ── Submit ──
     Hierarchy rules (mirrors the backend):
     ✔ Same Plant Name is fine across DIFFERENT locations
     ✘ Same Plant Name twice within the SAME location is not
     ✔ Conveyor names may repeat across plants/locations — only
       checked for duplicates within THIS plant's own list */
  const handleSubmit = async () => {
    if (!form.plantName.trim() || !form.plantCode.trim() || !form.locationName.trim()) {
      message.warning("Plant Name, Code and Location are required");
      return;
    }
    if (conveyors.some((c) => !c.conveyorName?.trim())) {
      message.warning("Every conveyor needs a name");
      return;
    }

    // Client-side pre-check, scoped to the SAME location — matches the
    // backend's {locationId, plantName} uniqueness rule. Plant codes and
    // within-plant conveyor-name duplicates are still enforced server-side.
    const nameClash = plants.some(
      (p) =>
        p.plantName.trim().toLowerCase() === form.plantName.trim().toLowerCase() &&
        (p.locationName || "").trim().toLowerCase() === form.locationName.trim().toLowerCase() &&
        p._id !== editingId
    );
    if (nameClash) {
      message.warning("A plant with this name already exists at this location");
      return;
    }

    try {
      setFormSaving(true);
      const payload = {
        plantName: form.plantName.trim(),
        plantCode: form.plantCode.trim(),
        locationName: form.locationName.trim(),
        status: form.status,
        conveyors: conveyors.map((c) => ({
          conveyorName: c.conveyorName.trim(),
          status: c.status || "Active",
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
      message.error(getErrorMessage(err, "Save failed"));
    } finally {
      setFormSaving(false);
    }
  };

  /* ── Edit ── */
  const handleEdit = (plant) => {
    setEditingId(plant._id);
    setForm({
      plantName:    plant.plantName || "",
      plantCode:    plant.plantCode || "",
      locationName: plant.locationName || plant.locationId?.locationName || "",
      status:       plant.status || (plant.isActive === false ? "Inactive" : "Active"),
    });
    setConveyors(
      plant.conveyors?.length
        ? plant.conveyors.map((c) => ({
            conveyorName: c.conveyorName || "",
            status: c.status || "Active",
          }))
        : [{ ...DEFAULT_CONVEYOR }]
    );
    setFormOpen(true);
  };

  /* ── Deactivate (soft delete — status → Inactive, fully reversible) ── */
  const handleDeactivate = (id) => {
    Modal.confirm({
      title: "Deactivate this plant?",
      content: "The plant will be marked Inactive. Its conveyor lines stay intact and you can reactivate it anytime with one click.",
      okText: "Deactivate", okType: "danger",
      onOk: async () => {
        try {
          await deletePlant(id);
          message.success("Plant deactivated");
          fetchPlants();
        } catch (err) {
          message.error(getErrorMessage(err, "Failed to deactivate plant"));
        }
      },
    });
  };

  /* ── Activate — one click, reuses the existing PUT /plants/:id endpoint.
       No new backend route needed: we just resend the plant's own data
       with status flipped back to Active. ── */
  const handleActivate = async (plant) => {
    try {
      const payload = {
        plantName: plant.plantName,
        plantCode: plant.plantCode,
        locationName: plant.locationName || plant.locationId?.locationName || "",
        status: "Active",
        conveyors: (plant.conveyors || []).map((c) => ({
          conveyorName: c.conveyorName,
          status: c.status || "Active",
        })),
      };
      await updatePlant(plant._id, payload);
      message.success("Plant activated");
      fetchPlants();
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to activate plant"));
    }
  };

  /* ── Permanently delete (hard delete — for plants added by mistake).
       Backend blocks this if the plant already has conveyor
       configurations linked to it; deactivate is the right tool then. ── */
  const handlePermanentDelete = (id) => {
    Modal.confirm({
      title: "Permanently delete this plant?",
      content: "This cannot be undone — the plant and all its conveyor lines will be removed completely. If it already has production configurations linked to it, deletion will be blocked; deactivate it instead.",
      okText: "Delete Permanently", okType: "danger",
      onOk: async () => {
        try {
          await permanentDeletePlant(id);
          message.success("Plant permanently deleted");
          if (selected?._id === id) setDetailOpen(false);
          fetchPlants();
        } catch (err) {
          message.error(getErrorMessage(err, "Failed to delete plant"));
        }
      },
    });
  };

  /* ── Filter ── */
  const filtered = plants.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.plantName?.toLowerCase().includes(q) ||
      p.plantCode?.toLowerCase().includes(q) ||
      p.locationName?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  /* ── Stats ── */
  const totalPlants     = plants.length;
  const activePlants    = plants.filter((p) => p.status === "Active").length;
  const inactivePlants  = plants.filter((p) => p.status === "Inactive").length;
  const totalConveyors  = plants.reduce((s, p) => s + (p.conveyors?.length || 0), 0);

  const statCards = [
    { label: "Total Plants",    value: totalPlants,    icon: Factory,      tint: "#0E7490", bg: "#ECFEFF" },
    { label: "Active Plants",   value: activePlants,   icon: CheckCircle2, tint: "#15803D", bg: "#F0FDF4" },
    { label: "Inactive Plants", value: inactivePlants, icon: XCircle,      tint: "#BE123C", bg: "#FFF1F2" },
    { label: "Conveyor Lines",  value: totalConveyors,  icon: Layers3,      tint: "#7E22CE", bg: "#FAF5FF" },
  ];

  /* ── Table Columns ── */
  const columns = [
    {
      title: "Plant",
      dataIndex: "plantName",
      key: "plantName",
      render: (_, p) => (
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Avatar
            size={30}
            style={{
              background: avatarColor(p.plantName || p.plantCode),
              fontWeight: 700, fontSize: 11, flexShrink: 0,
            }}
          >
            {initials(p.plantName)}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#0F172A" }}>{p.plantName}</div>
            <div style={{ fontSize: 10, color: "#94A3B8" }}>
              {p.conveyors?.length || 0} conveyor{p.conveyors?.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Code",
      dataIndex: "plantCode",
      width: 80,
      render: (v) => (
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11, fontWeight: 600, color: "#0E7490",
          background: "#ECFEFF", padding: "2px 6px", borderRadius: 5,
        }}>{v}</span>
      ),
    },
    {
      title: "Location",
      dataIndex: "locationName",
      width: 125,
      render: (v) => (
        <span style={{ fontSize: 11, color: "#334155", display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={9} color="#94A3B8" /> {v || "—"}
        </span>
      ),
    },
    {
      title: "Conveyor Lines",
      key: "conveyors",
      render: (_, p) => {
        const list = p.conveyors || [];
        if (!list.length) return <span style={{ color: "#94A3B8", fontSize: 11 }}>—</span>;
        const shown = list.slice(0, 2);
        const extra = list.length - shown.length;
        return (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {shown.map((c, i) => (
              <span key={c._id || i} style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 10, fontWeight: 600, color: "#7E22CE",
                background: "#FAF5FF", padding: "2px 7px", borderRadius: 999,
              }}>
                <span style={{
                  width: 4, height: 4, borderRadius: 999, flexShrink: 0,
                  background: c.status === "Inactive" ? "#F43F5E" : "#22C55E",
                }} />
                {c.conveyorName}
              </span>
            ))}
            {extra > 0 && (
              <span style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8" }}>+{extra} more</span>
            )}
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 90, align: "center",
      render: (s) => <StatusTag status={s} />,
    },
    {
      title: "",
      key: "actions",
      width: 100,
      render: (_, p) => (
        <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
          <IconBtn title="Edit" bg="#FFFBEB" fg="#B45309" onClick={() => handleEdit(p)}>
            <Pencil size={11} />
          </IconBtn>
          {p.status === "Active" ? (
            <IconBtn title="Deactivate" bg="#F1F5F9" fg="#475569" onClick={() => handleDeactivate(p._id)}>
              <Ban size={11} />
            </IconBtn>
          ) : (
            <IconBtn title="Activate" bg="#F0FDF4" fg="#15803D" onClick={() => handleActivate(p)}>
              <CheckCircle2 size={11} />
            </IconBtn>
          )}
          <IconBtn title="Delete permanently" bg="#FFF1F2" fg="#BE123C" onClick={() => handlePermanentDelete(p._id)}>
            <Trash2 size={11} />
          </IconBtn>
        </div>
      ),
    },
  ];

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'IBM Plex Sans', sans-serif", padding: "22px 26px" }}>
      <CSS />

      {/* ══ HEADER ══ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 31, height: 31, borderRadius: 9,
              background: "linear-gradient(135deg,#0E7490,#0891B2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 5px 12px -4px rgba(14,116,144,0.4)",
            }}>
              <Factory size={16} color="#fff" />
            </div>
            <h1 style={{ fontSize: 19, fontWeight: 700, color: "#0F172A", margin: 0 }}>
              Plant Master
            </h1>
          </div>
          <p style={{ color: "#64748B", fontSize: 12, margin: "3px 0 0 40px" }}>
            Location, plant &amp; conveyor line registry
          </p>
        </div>
        <button onClick={() => { resetForm(); setFormOpen(true); }} style={S.primaryBtn}>
          <Plus size={13} /> Add Plant
        </button>
      </div>

      {/* ══ STAT CARDS (fixed compact grid) ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(165px,1fr))", gap: 12, marginBottom: 17 }}>
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} style={S.statCard}>
              <div>
                <p style={{ color: "#64748B", fontSize: 11, margin: 0, fontWeight: 500 }}>{c.label}</p>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: "3px 0 0" }}>{c.value}</h3>
              </div>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon size={16} color={c.tint} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ══ FILTERS ══ */}
      <div style={S.panel}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr auto auto", gap: 8 }} className="pm-filters">
          <div style={{ position: "relative" }}>
            <Search size={13} style={{
              position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)",
              color: "#94A3B8", pointerEvents: "none",
            }} />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search plant name, code, location…"
              style={{ ...S.input, paddingLeft: 29 }}
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
            <RotateCcw size={12} /> Reset
          </button>

          <button onClick={fetchPlants} style={S.ghostBtn}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* ══ TABLE ══ */}
      <div style={{ ...S.panel, padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "11px 16px", borderBottom: "1px solid #F1F5F9",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: 0 }}>Plant Directory</h2>
          <Badge count={filtered.length} showZero
            style={{ backgroundColor: "#ECFEFF", color: "#0E7490", fontWeight: 600 }} />
        </div>
        <Table
          dataSource={filtered} columns={columns} rowKey="_id"
          loading={{ spinning: loading, indicator: <Spin size="large" /> }}
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          scroll={{ x: 750 }}
          onRow={(p) => ({ onClick: () => { setSelected(p); setDetailOpen(true); }, style: { cursor: "pointer" } })}
          locale={{
            emptyText: (
              <div style={{ padding: "40px 0" }}>
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
        width={540} closeIcon={<X size={15} />}
        styles={{ header: { padding: 0 }, body: { padding: 0 } }}
      >
        <div style={{
          background: "linear-gradient(135deg,#0E7490,#155E75)",
          padding: "16px 22px", borderRadius: "7px 7px 0 0",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 29, height: 29, borderRadius: 9,
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {editingId ? <Pencil size={14} color="#fff" /> : <Plus size={14} color="#fff" />}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff" }}>
              {editingId ? "Edit Plant" : "Register New Plant"}
            </h2>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
              {editingId
                ? "Modify plant details and its conveyor lines"
                : "Location is created automatically if it doesn't already exist"}
            </p>
          </div>
        </div>

        <div style={{ padding: "18px 22px", overflowY: "auto", maxHeight: "72vh" }}>

          {/* ── Plant Identity ── */}
          <SectionDivider icon={Building2} label="Plant Identity" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 15px", marginBottom: 18 }} className="pm-form-grid">
            <Field label="Plant Name" required>
              <SInput name="plantName" value={form.plantName} onChange={handleChange} placeholder="e.g. Paint Shop A" />
            </Field>
            <Field label="Plant Code" required>
              <SInput
                name="plantCode"
                value={form.plantCode}
                onChange={(e) => setField("plantCode", e.target.value.toUpperCase())}
                placeholder="e.g. PS-A01"
              />
            </Field>
            <Field label="Location" icon={MapPin} required>
              <SInput
                name="locationName"
                value={form.locationName}
                onChange={(e) => setField("locationName", e.target.value.toUpperCase())}
                placeholder="e.g. SUPA, BHIWADI, PUNE"
              />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setField("status", e.target.value)} style={S.nativeSelect}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </Field>
          </div>

          {/* ── Conveyors (name only) ── */}
          <SectionDivider icon={Settings2} label={`Conveyors (${conveyors.length})`} />

          {conveyors.map((c, idx) => (
            <ConveyorRow
              key={idx}
              conveyor={c}
              index={idx}
              onChange={handleConveyorChange}
              onRemove={removeConveyor}
              removable={conveyors.length > 1}
            />
          ))}

          <button onClick={addConveyor} style={{ ...S.ghostBtn, marginBottom: 5 }}>
            <Plus size={12} /> Add Conveyor
          </button>
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 22px", borderTop: "1px solid #F1F5F9",
          display: "flex", justifyContent: "flex-end", gap: 8,
          background: "#FAFAFA",
        }}>
          <button onClick={() => { setFormOpen(false); resetForm(); }} style={S.ghostBtn}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={formSaving} style={{ ...S.primaryBtn, opacity: formSaving ? 0.75 : 1 }}>
            <Save size={12} />
            {formSaving ? "Saving…" : editingId ? "Update Plant" : "Register Plant"}
          </button>
        </div>
      </Modal>

      {/* ══════════════════════════════════════
          DETAIL MODAL
      ══════════════════════════════════════ */}
      <Modal
        open={detailOpen} onCancel={() => setDetailOpen(false)}
        footer={null} width={440} closeIcon={<X size={15} />}
        destroyOnHidden
        styles={{ body: { padding: 0 } }}
      >
        {selected && (
          <div>
            <div style={{
              background: "linear-gradient(135deg,#0E7490,#155E75)",
              padding: "20px 22px 16px", borderRadius: "7px 7px 0 0",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar
                  size={42}
                  style={{
                    background: avatarColor(selected.plantName || selected.plantCode),
                    fontWeight: 700, fontSize: 15,
                    border: "2px solid rgba(255,255,255,0.35)", flexShrink: 0,
                  }}
                >
                  {initials(selected.plantName)}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>{selected.plantName}</h2>
                  <div style={{ display: "flex", gap: 7, marginTop: 7, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600,
                      color: "#fff", background: "rgba(255,255,255,0.15)",
                      padding: "2px 6px", borderRadius: 5,
                    }}>{selected.plantCode}</span>
                    <StatusTag status={selected.status} />
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={9} />{selected.locationName || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: "18px 22px" }}>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px", marginBottom: 15 }}>
                <div>
                  <FieldLabel icon={Layers3} label="Conveyor Lines" />
                  <ValueBox highlight>{selected.conveyors?.length || 0}</ValueBox>
                </div>
                <div>
                  <FieldLabel icon={CheckCircle2} label="Active Conveyors" />
                  <ValueBox highlight>
                    {(selected.conveyors || []).filter((c) => c.status !== "Inactive").length}
                  </ValueBox>
                </div>
              </div>

              {/* Conveyor list */}
              <p style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>
                Conveyors
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 7 }}>
                {(selected.conveyors || []).map((c, idx) => (
                  <div key={c._id || idx} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    border: "1px solid #F1F5F9", borderRadius: 9,
                    padding: "8px 11px", background: "#F8FAFC",
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                      background: "#ECFEFF", color: "#0E7490", fontSize: 10, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {idx + 1}
                    </div>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{c.conveyorName}</span>
                    <StatusTag status={c.status || "Active"} />
                  </div>
                ))}
                {!selected.conveyors?.length && (
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>No conveyor lines added.</div>
                )}
              </div>

              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #F1F5F9", fontSize: 11, color: "#94A3B8" }}>
                Created {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "—"}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 17 }}>
                <button onClick={() => setDetailOpen(false)} style={{ ...S.ghostBtn, justifyContent: "center" }}>
                  Close
                </button>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setDetailOpen(false); handleEdit(selected); }}
                    style={{ ...S.amberBtn, flex: 1, justifyContent: "center" }}>
                    <Pencil size={11} /> Edit
                  </button>
                  {selected.status === "Active" ? (
                    <button onClick={() => handleDeactivate(selected._id)}
                      style={{ ...S.neutralBtn, flex: 1, justifyContent: "center" }}>
                      <Ban size={11} /> Deactivate
                    </button>
                  ) : (
                    <button onClick={() => handleActivate(selected)}
                      style={{ ...S.activeBtn, flex: 1, justifyContent: "center" }}>
                      <CheckCircle2 size={11} /> Activate
                    </button>
                  )}
                  <button onClick={() => handlePermanentDelete(selected._id)}
                    style={{ ...S.dangerBtn, flex: 1, justifyContent: "center" }}>
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
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
      font-size: 10px !important; font-weight: 700 !important;
      text-transform: uppercase; letter-spacing: 0.4px;
      border-bottom: 1px solid #F1F5F9 !important;
    }
    .ant-table-thead > tr > th::before { display: none !important; }
    .ant-table-tbody > tr > td {
      border-bottom: 1px solid #F8FAFC !important;
      padding: 9px 13px !important;
    }
    .ant-table-tbody > tr:hover > td { background: #F0FDFF !important; }
    .ant-badge-count { box-shadow: none !important; }
    .ant-pagination { font-size: 11px !important; }
    .ant-pagination-item-active { border-color: #0E7490 !important; }
    .ant-pagination-item-active a { color: #0E7490 !important; }
    @media (max-width: 960px) {
      .pm-filters    { grid-template-columns: 1fr 1fr !important; }
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
    borderRadius: 15, padding: 15,
    boxShadow: "0 1px 3px rgba(15,23,42,0.05)", marginBottom: 15,
  },
  statCard: {
    background: "#fff", border: "1px solid #F1F5F9",
    borderRadius: 15, padding: "14px 16px",
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
  },
  input: {
    width: "100%", border: "1px solid #E2E8F0", borderRadius: 9,
    padding: "8px 10px", fontSize: 12, color: "#0F172A",
    outline: "none", background: "#F8FAFC", boxSizing: "border-box",
    fontFamily: "inherit", height: 34,
  },
  nativeSelect: {
    width: "100%", border: "1px solid #E2E8F0", borderRadius: 9,
    padding: "8px 10px", fontSize: 12, color: "#0F172A",
    outline: "none", background: "#F8FAFC", boxSizing: "border-box",
    fontFamily: "inherit", height: 34, cursor: "pointer",
    appearance: "none", WebkitAppearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 28,
  },
  primaryBtn: {
    background: "linear-gradient(135deg,#0E7490,#0891B2)",
    color: "#fff", border: "none", padding: "8px 15px",
    borderRadius: 9, display: "inline-flex", alignItems: "center",
    gap: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
    boxShadow: "0 4px 12px -3px rgba(14,116,144,0.45)",
  },
  ghostBtn: {
    background: "#fff", color: "#475569", border: "1px solid #E2E8F0",
    padding: "8px 13px", borderRadius: 9,
    display: "inline-flex", alignItems: "center",
    gap: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
  },
  amberBtn: {
    background: "#FFFBEB", color: "#B45309", border: "1px solid #FEF3C7",
    padding: "8px 13px", borderRadius: 9,
    display: "inline-flex", alignItems: "center",
    gap: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
  },
  neutralBtn: {
    background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0",
    padding: "8px 13px", borderRadius: 9,
    display: "inline-flex", alignItems: "center",
    gap: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
  },
  activeBtn: {
    background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0",
    padding: "8px 13px", borderRadius: 9,
    display: "inline-flex", alignItems: "center",
    gap: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
  },
  dangerBtn: {
    background: "#FFF1F2", color: "#BE123C", border: "1px solid #FFE4E6",
    padding: "8px 13px", borderRadius: 9,
    display: "inline-flex", alignItems: "center",
    gap: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
  },
};