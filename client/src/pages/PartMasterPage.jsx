import { useState, useEffect, useMemo, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import {
  Modal, Table, Avatar, Empty, Spin, message, Tooltip, Popconfirm, Badge, Select,
} from "antd";
import {
  Puzzle, Plus, Search, Pencil, Trash2, X, Box, Ruler, Layers, RotateCcw,
} from "lucide-react";

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

const PALETTE = ["#0E7490","#7E22CE","#B45309","#15803D","#BE123C","#4338CA","#0369A1","#9D174D"];
const avatarColor = (seed = "") => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
};

/* ─────────────────────────────────────────────
   FIELD LABEL
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   ICON BUTTON
───────────────────────────────────────────── */
const IconBtn = ({ onClick, bg, fg, title, children }) => (
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

/* ─────────────────────────────────────────────
   VALUE BOX
───────────────────────────────────────────── */
const ValueBox = ({ children }) => (
  <div style={{
    background: "#F8FAFC", border: "1px solid #F1F5F9",
    borderRadius: 10, padding: "9px 12px",
    fontSize: 13, color: "#0F172A", fontWeight: 500,
    minHeight: 38, display: "flex", alignItems: "center",
  }}>
    {children || "—"}
  </div>
);

/* ─────────────────────────────────────────────
   STATUS TAG
───────────────────────────────────────────── */
const StatusTag = ({ status }) => {
  const active = status === "Active" || status === "active";
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
      {status || "Active"}
    </span>
  );
};

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function PartMasterPage() {

  const [parts,       setParts]       = useState([]);
  const [models,      setModels]      = useState([]); // for dropdown
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");

  const [formOpen,    setFormOpen]    = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const [modelId,     setModelId]     = useState(null);
  const [partName,    setPartName]    = useState("");
  const [area,        setArea]        = useState("");
  const [partsPerHanger, setPartsPerHanger] = useState("");
  const [status,      setStatus]      = useState("Active");
  const [isSaving,    setIsSaving]    = useState(false);

  const [detailOpen,  setDetailOpen]  = useState(false);
  const [selected,    setSelected]    = useState(null);

  /* ── Fetch parts ── */
  const fetchParts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/parts");
      setParts(res.data?.parts || []);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load parts");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Fetch models (for dropdown) ── */
  const fetchModels = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/models");
      setModels(res.data?.models || []);
    } catch (err) {
      message.error("Failed to load models for dropdown");
    }
  }, []);

  useEffect(() => { fetchParts(); fetchModels(); }, [fetchParts, fetchModels]);

  /* ── Form helpers ── */
  const resetForm = () => {
    setEditingId(null);
    setModelId(null);
    setPartName("");
    setArea("");
    setPartsPerHanger("");
    setStatus("Active");
  };

  const openAdd = () => { resetForm(); setFormOpen(true); };

  const openEdit = (part) => {
    setEditingId(part._id);
    setModelId(part.modelId?._id || part.modelId);
    setPartName(part.partName || "");
    setArea(part.area ?? "");
    setPartsPerHanger(part.partsPerHanger ?? "");
    setStatus(part.status || "Active");
    setFormOpen(true);
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (!modelId || !partName.trim()) {
      message.warning("Model and Part Name are required");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        modelId,
        partName: partName.trim(),
        area: area === "" ? undefined : Number(area),
        partsPerHanger: partsPerHanger === "" ? undefined : Number(partsPerHanger),
        status,
      };

      if (editingId) {
        await axiosInstance.put(`/parts/${editingId}`, payload);
        message.success("Part updated");
      } else {
        await axiosInstance.post("/parts", payload);
        message.success("Part created");
      }
      setFormOpen(false);
      resetForm();
      fetchParts();
    } catch (err) {
      message.error(err?.response?.data?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/parts/${id}`);
      message.success("Part deleted");
      fetchParts();
    } catch (err) {
      message.error(err?.response?.data?.message || "Delete failed");
    }
  };

  /* ── Filter ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return parts.filter((p) =>
      p.partName?.toLowerCase().includes(q) ||
      p.modelId?.modelName?.toLowerCase().includes(q)
    );
  }, [parts, search]);

  /* ── Stats ── */
  const totalParts  = parts.length;
  const activeParts = parts.filter((p) => p.status === "Active").length;
  const modelsLinked = new Set(parts.map((p) => p.modelId?._id || p.modelId)).size;

  /* ── Table columns ── */
  const columns = [
    {
      title: "Part",
      dataIndex: "partName",
      key: "partName",
      render: (_, p) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            size={34}
            style={{
              background: avatarColor(p.partName),
              fontWeight: 700, fontSize: 12, flexShrink: 0,
            }}
          >
            {initials(p.partName)}
          </Avatar>
          <span style={{ fontWeight: 600, fontSize: 13, color: "#0F172A" }}>
            {p.partName}
          </span>
        </div>
      ),
    },
    {
      title: "Model",
      key: "model",
      width: 140,
      render: (_, p) => (
        <span style={{ fontSize: 12.5, color: "#475569" }}>
          {p.modelId?.modelName || "—"}
        </span>
      ),
    },
    {
      title: "Area",
      key: "area",
      width: 90,
      render: (_, p) => (
        <span style={{ fontSize: 12.5, color: "#475569" }}>{p.area ?? "—"}</span>
      ),
    },
    {
      title: "Parts/Hanger",
      key: "partsPerHanger",
      width: 110,
      render: (_, p) => (
        <span style={{ fontSize: 12.5, color: "#475569" }}>{p.partsPerHanger ?? "—"}</span>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 100,
      render: (_, p) => <StatusTag status={p.status} />,
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_, p) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
          <IconBtn title="Edit" bg="#FFFBEB" fg="#B45309" onClick={() => openEdit(p)}>
            <Pencil size={13} />
          </IconBtn>
          <Popconfirm
            title="Delete this part?"
            description="This action cannot be undone."
            okText="Delete" okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(p._id)}
          >
            <button style={{
              background: "#FFF1F2", color: "#BE123C", border: "none",
              width: 30, height: 30, borderRadius: 8,
              display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
              <Trash2 size={13} />
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div style={{
      minHeight: "100vh", background: "#F8FAFC",
      fontFamily: "'IBM Plex Sans', sans-serif", padding: "28px 32px",
    }}>
      <CSS />

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11,
              background: "linear-gradient(135deg,#0E7490,#0891B2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 6px 14px -4px rgba(14,116,144,0.4)",
            }}>
              <Puzzle size={18} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>
              Part Master
            </h1>
          </div>
          <p style={{ color: "#64748B", fontSize: 13, margin: "4px 0 0 46px" }}>
            Model-Part configuration registry
          </p>
        </div>

        <button onClick={openAdd} style={S.primaryBtn}>
          <Plus size={15} /> Add Part
        </button>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Parts",   value: totalParts,   icon: Puzzle, tint: "#0E7490", bg: "#ECFEFF" },
          { label: "Active Parts",  value: activeParts,  icon: Layers, tint: "#15803D", bg: "#F0FDF4" },
          { label: "Models Linked", value: modelsLinked, icon: Box,    tint: "#7E22CE", bg: "#FAF5FF" },
        ].map((c) => {
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

      {/* ── SEARCH ── */}
      <div style={S.panel}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }} className="pm-filters">
          <div style={{ position: "relative" }}>
            <Search size={15} style={{
              position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
              color: "#94A3B8", pointerEvents: "none",
            }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search part name or model…"
              style={{ ...S.input, paddingLeft: 34 }}
            />
          </div>
          <button onClick={() => setSearch("")} style={S.ghostBtn}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div style={{ ...S.panel, padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "14px 20px", borderBottom: "1px solid #F1F5F9",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>Part Directory</h2>
          <Badge
            count={filtered.length} showZero
            style={{ backgroundColor: "#ECFEFF", color: "#0E7490", fontWeight: 600 }}
          />
        </div>
        <Table
          dataSource={filtered} columns={columns} rowKey="_id"
          loading={{ spinning: loading, indicator: <Spin size="large" /> }}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          onRow={(p) => ({
            onClick: () => { setSelected(p); setDetailOpen(true); },
            style: { cursor: "pointer" },
          })}
          locale={{
            emptyText: (
              <div style={{ padding: "48px 0" }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<span style={{ color: "#64748B" }}>No parts yet. Click "Add Part" to create one.</span>} />
              </div>
            ),
          }}
        />
      </div>

      {/* ══════════════════════════════════════
          ADD / EDIT MODAL
      ══════════════════════════════════════ */}
      <Modal
        open={formOpen}
        onCancel={() => { setFormOpen(false); resetForm(); }}
        footer={null} centered destroyOnHidden mask={{closable:false}}
        width={460} closeIcon={<X size={17} />}
        styles={{ header: { padding: 0 }, body: { padding: 0 } }}
      >
        <div style={{
          background: "linear-gradient(135deg,#0E7490,#155E75)",
          padding: "20px 26px", borderRadius: "8px 8px 0 0",
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
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>
              {editingId ? "Edit Part" : "Add New Part"}
            </h2>
            <p style={{ margin: 0, fontSize: 11.5, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
              {editingId ? "Update the part configuration" : "Map a part to a model"}
            </p>
          </div>
        </div>

        <div style={{ padding: "24px 26px" }}>
          <div style={{ marginBottom: 14 }}>
            <FieldLabel icon={Box} label="Model" required />
            <Select
              value={modelId}
              onChange={(val) => setModelId(val)}
              placeholder="Select model"
              showSearch
              optionFilterProp="label"
              style={{ width: "100%", height: 40 }}
              options={models.map((m) => ({ value: m._id, label: m.modelName }))}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <FieldLabel label="Part Name" required />
            <input
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              placeholder="e.g. Front Cover"
              style={S.input}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <FieldLabel icon={Ruler} label="Area (Sq Inch)" />
              <input
                type="number"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. 120"
                style={S.input}
              />
            </div>
            <div>
              <FieldLabel icon={Layers} label="Parts / Hanger" />
              <input
                type="number"
                value={partsPerHanger}
                onChange={(e) => setPartsPerHanger(e.target.value)}
                placeholder="e.g. 4"
                style={S.input}
              />
            </div>
          </div>

          <div>
            <FieldLabel label="Status" />
            <Select
              value={status}
              onChange={(val) => setStatus(val)}
              style={{ width: "100%", height: 40 }}
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
            />
          </div>
        </div>

        <div style={{
          padding: "14px 26px", borderTop: "1px solid #F1F5F9",
          display: "flex", justifyContent: "flex-end", gap: 10, background: "#FAFAFA",
          borderRadius: "0 0 8px 8px",
        }}>
          <button onClick={() => { setFormOpen(false); resetForm(); }} style={S.ghostBtn}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving}
            style={{ ...S.primaryBtn, opacity: isSaving ? 0.75 : 1 }}>
            {isSaving ? "Saving…" : editingId ? "Update Part" : "Save Part"}
          </button>
        </div>
      </Modal>

      {/* ══════════════════════════════════════
          DETAIL MODAL
      ══════════════════════════════════════ */}
      <Modal
        open={detailOpen} onCancel={() => setDetailOpen(false)}
        footer={null} width={460} closeIcon={<X size={17} />}
        destroyOnHidden
        styles={{ body: { padding: 0 } }}
      >
        {selected && (
          <div>
            <div style={{
              background: "linear-gradient(135deg,#0E7490,#155E75)",
              padding: "22px 26px 20px", borderRadius: "8px 8px 0 0",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar size={46} style={{
                  background: avatarColor(selected.partName),
                  fontWeight: 700, fontSize: 16,
                  border: "2px solid rgba(255,255,255,0.35)", flexShrink: 0,
                }}>
                  {initials(selected.partName)}
                </Avatar>
                <div>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#fff" }}>
                    {selected.partName}
                  </h2>
                  <div style={{ marginTop: 8 }}>
                    <StatusTag status={selected.status} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: "22px 26px" }}>

              <div style={{ marginBottom: 14 }}>
                <FieldLabel icon={Box} label="Model" />
                <ValueBox>
                  <Box size={12} color="#94A3B8" style={{ marginRight: 6, flexShrink: 0 }} />
                  {selected.modelId?.modelName || "—"}
                </ValueBox>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <FieldLabel icon={Ruler} label="Area" />
                  <ValueBox>{selected.area ?? "—"}</ValueBox>
                </div>
                <div>
                  <FieldLabel icon={Layers} label="Parts / Hanger" />
                  <ValueBox>{selected.partsPerHanger ?? "—"}</ValueBox>
                </div>
              </div>

              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F1F5F9", fontSize: 12, color: "#94A3B8" }}>
                Created {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "—"}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button onClick={() => setDetailOpen(false)}
                  style={{ ...S.ghostBtn, flex: 1, justifyContent: "center" }}>
                  Close
                </button>
                <button onClick={() => { setDetailOpen(false); openEdit(selected); }}
                  style={{ ...S.amberBtn, flex: 1, justifyContent: "center" }}>
                  <Pencil size={13} /> Edit
                </button>
                <Popconfirm
                  title="Delete this part?"
                  description="This action cannot be undone."
                  okText="Delete" okButtonProps={{ danger: true }}
                  onConfirm={() => { setDetailOpen(false); handleDelete(selected._id); }}
                >
                  <button style={{ ...S.dangerBtn, flex: 1, justifyContent: "center" }}>
                    <Trash2 size={13} /> Delete
                  </button>
                </Popconfirm>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────────────────
   GLOBAL CSS
───────────────────────────────────────────── */
const CSS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
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
    .ant-pagination-item-active { border-color: #0E7490 !important; }
    .ant-pagination-item-active a { color: #0E7490 !important; }
    @media (max-width: 680px) {
      .pm-filters { grid-template-columns: 1fr !important; }
    }
  `}</style>
);

/* ─────────────────────────────────────────────
   STYLE TOKENS
───────────────────────────────────────────── */
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