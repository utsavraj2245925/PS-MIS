import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import {
  Modal,
  Select,
  Table,
  Avatar,
  Tooltip,
  Popconfirm,
  Empty,
  Spin,
  message,
  Badge,
} from "antd";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  Shield,
  UserCheck,
  UserX,
  X,
  Mail,
  MapPin,
  Building2,
  Lock,
  RotateCcw,
  Check,
  ChevronDown,
} from "lucide-react";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "PLANT_ADMIN", label: "Plant Admin" },
  { value: "MANAGER",     label: "Manager"     },
  { value: "USER",        label: "User"        },
];

const STATUS_OPTIONS = [
  { value: "Active",   label: "Active"   },
  { value: "Inactive", label: "Inactive" },
];

/* ─────────────────────────────────────────────
   ROLE / STATUS VISUAL TOKENS
───────────────────────────────────────────── */
const ROLE_META = {
  SUPER_ADMIN: { bg: "#FEE2E2", fg: "#B91C1C", dot: "#EF4444", label: "Super Admin" },
  PLANT_ADMIN: { bg: "#CFFAFE", fg: "#0E7490", dot: "#06B6D4", label: "Plant Admin" },
  MANAGER:     { bg: "#F3E8FF", fg: "#7E22CE", dot: "#A855F7", label: "Manager"     },
  USER:        { bg: "#F1F5F9", fg: "#475569", dot: "#94A3B8", label: "User"        },
};

const RoleTag = ({ role }) => {
  const m = ROLE_META[role] || ROLE_META.USER;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: m.bg, color: m.fg,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.4,
      padding: "3px 9px", borderRadius: 999, textTransform: "uppercase",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: m.dot, flexShrink: 0 }} />
      {m.label}
    </span>
  );
};

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

/* ─────────────────────────────────────────────
   AVATAR HELPERS
───────────────────────────────────────────── */
const PALETTE = ["#0E7490","#7E22CE","#B45309","#15803D","#BE123C","#4338CA","#0369A1","#9D174D"];
const avatarColor = (seed = "") => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
};
const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

/* ─────────────────────────────────────────────
   SMALL REUSABLE COMPONENTS
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

const Field = ({ label, icon, required, children }) => (
  <div>
    <FieldLabel icon={icon} label={label} required={required} />
    {children}
  </div>
);

const ValueBox = ({ children }) => (
  <div style={{
    background: "#F8FAFC", border: "1px solid #F1F5F9",
    borderRadius: 10, padding: "9px 12px",
    fontSize: 13, color: "#0F172A", fontWeight: 500,
    minHeight: 38, display: "flex", alignItems: "center",
    wordBreak: "break-all",
  }}>
    {children || "—"}
  </div>
);

const DetailField = ({ icon, label, editing, value, displayValue, onChange, type = "text", placeholder }) => (
  <div>
    <FieldLabel icon={icon} label={label} />
    {editing
      ? <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} style={S.input} />
      : <ValueBox>{displayValue || "—"}</ValueBox>
    }
  </div>
);

/* ─────────────────────────────────────────────
   ICON BUTTON
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function UserMasterPage() {

  /* ── data ── */
  const [users,  setUsers]  = useState([]);
  const [plants, setPlants] = useState([]);

  /* ── form state ── */
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState("USER");
  const [location, setLocation] = useState("");
  const [plantId,  setPlantId]  = useState("");
  const [status,   setStatus]   = useState("Active");
  const [editId,   setEditId]   = useState(null);

  /* ── filter state ── */
  const [search,       setSearch]       = useState("");
  const [roleFilter,   setRoleFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  /* ── loading ── */
  const [loading,      setLoading]      = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  /* ── modals ── */
  const [isFormOpen,    setIsFormOpen]    = useState(false);
  const [isDetailOpen,  setIsDetailOpen]  = useState(false);
  const [selectedUser,  setSelectedUser]  = useState(null);
  const [isEditing,     setIsEditing]     = useState(false);
  const [draft,         setDraft]         = useState(null);
  const [draftPlantId,  setDraftPlantId]  = useState("");
  const [saving,        setSaving]        = useState(false);

  /* ─────────────── FETCH ─────────────── */
  const fetchUsers = async () => {
    try {
      setTableLoading(true);
      const res = await axiosInstance.get("/users");
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to load users");
    } finally {
      setTableLoading(false);
    }
  };

  const fetchPlants = async () => {
    try {
      const res = await axiosInstance.get("/plants");
      setPlants(res.data.plants || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPlants();
  }, []);

  /* ─────────────── RESET ─────────────── */
  const resetForm = () => {
    setName(""); setEmail(""); setPassword("");
    setRole("USER"); setLocation(""); setPlantId(""); setStatus("Active");
    setEditId(null);
  };

  /* ─────────────── CREATE / UPDATE ─────────────── */
  const handleSave = async () => {
    if (!name || !email || !role || !location || !plantId) {
      message.warning("Please fill all required fields");
      return;
    }
    try {
      setLoading(true);
      const payload = { name, email, password, role, location, plantId, status };
      if (editId) {
        await axiosInstance.put(`/users/${editId}`, payload);
        message.success("User updated");
      } else {
        await axiosInstance.post("/users", payload);
        message.success("User created");
      }
      await fetchUsers();
      resetForm();
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────── DELETE ─────────────── */
  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/users/${id}`);
      message.success("User deleted");
      fetchUsers();
    } catch (err) {
      console.error(err);
      message.error("Failed to delete user");
    }
  };

  /* ─────────────── EDIT OPEN ─────────────── */
  const openEdit = (user) => {
    setEditId(user._id);
    setName(user.name || "");
    setEmail(user.email || "");
    setPassword("");
    setRole(user.role || "USER");
    setLocation(user.location || "");
    setPlantId(user.plantId?._id || "");
    setStatus(user.status || "Active");
    setIsFormOpen(true);
  };

  /* ─────────────── DETAIL MODAL ─────────────── */
  const openDetail = (user) => {
    setSelectedUser(user);
    setDraft({ ...user });
    setDraftPlantId(user.plantId?._id || "");
    setIsEditing(false);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setSelectedUser(null); setDraft(null);
    setIsEditing(false); setIsDetailOpen(false);
  };

  const handleDetailSave = async () => {
    if (!draft?.name || !draft?.email || !draft?.role || !draft?.location || !draftPlantId) {
      message.warning("Please fill all required fields");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name: draft.name, email: draft.email,
        password: draft.password || "",
        role: draft.role, location: draft.location,
        plantId: draftPlantId, status: draft.status,
      };
      await axiosInstance.put(`/users/${selectedUser._id}`, payload);
      message.success("User updated");
      await fetchUsers();
      setIsEditing(false);
      closeDetail();
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  /* ─────────────── FILTER ─────────────── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      const plantName = u.plantId?.plantName?.toLowerCase() || "";
      const matchSearch =
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q) ||
        u.location?.toLowerCase().includes(q) ||
        u.status?.toLowerCase().includes(q) ||
        plantName.includes(q);
      const matchRole   = !roleFilter   || u.role   === roleFilter;
      const matchStatus = !statusFilter || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  /* ─────────────── STATS ─────────────── */
  const stats = [
    { label: "Total Users",  value: users.length,                                     icon: Users,     tint: "#0E7490", bg: "#ECFEFF" },
    { label: "Active",       value: users.filter(u => u.status === "Active").length,   icon: UserCheck, tint: "#15803D", bg: "#F0FDF4" },
    { label: "Inactive",     value: users.filter(u => u.status === "Inactive").length, icon: UserX,     tint: "#BE123C", bg: "#FFF1F2" },
    { label: "Plant Admins", value: users.filter(u => u.role === "PLANT_ADMIN").length,icon: Shield,    tint: "#7E22CE", bg: "#FAF5FF" },
  ];

  /* ─────────────── TABLE COLUMNS ─────────────── */
  const columns = [
    {
      title: "User",
      dataIndex: "name",
      key: "name",
      render: (_, u) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar size={34} style={{
            background: avatarColor(u.name || u.email),
            fontWeight: 700, fontSize: 12, flexShrink: 0,
          }}>
            {initials(u.name)}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {u.name}
            </div>
            <div style={{ fontSize: 11.5, color: "#64748B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {u.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 130,
      render: (r) => <RoleTag role={r} />,
    },
    {
      title: "Plant",
      key: "plant",
      width: 130,
      render: (_, u) => (
        <span style={{ fontSize: 12.5, color: "#334155" }}>
          {u.plantId?.plantName || "—"}
        </span>
      ),
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      width: 130,
      render: (v) => <span style={{ fontSize: 12.5, color: "#334155" }}>{v || "—"}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (s) => <StatusTag status={s} />,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 100,
      render: (v) => (
        <span style={{ fontSize: 11.5, color: "#94A3B8" }}>
          {v ? new Date(v).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_, u) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
          <IconBtn title="Edit" bg="#FFFBEB" fg="#B45309" onClick={() => openEdit(u)}>
            <Pencil size={13} />
          </IconBtn>
          <Popconfirm
            title="Delete this user?"
            description="This action cannot be undone."
            okText="Delete" okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(u._id)}
          >
            <button style={{
              background: "#FFF1F2", color: "#BE123C", border: "none",
              width: 30, height: 30, borderRadius: 8,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}>
              <Trash2 size={13} />
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  /* ─────────────── PLANT SELECT OPTIONS ─────────────── */
  const plantOptions = plants.map((p) => ({ label: p.plantName, value: p._id }));

  /* ─────────────── RENDER ─────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'IBM Plex Sans', sans-serif", padding: "28px 32px" }}>
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
              <Users size={18} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>
              User Master
            </h1>
          </div>
          <p style={{ color: "#64748B", fontSize: 13, margin: "4px 0 0 46px" }}>
            Enterprise user management &amp; access control
          </p>
        </div>
        <button onClick={() => { resetForm(); setIsFormOpen(true); }} style={S.primaryBtn}>
          <Plus size={15} /> Add User
        </button>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 20 }}>
        {stats.map((c) => {
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

      {/* ── FILTERS ── */}
      <div style={S.panel}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr auto", gap: 10 }} className="um-filters">
          <div style={{ position: "relative" }}>
            <Search size={15} style={{
              position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
              color: "#94A3B8", pointerEvents: "none",
            }} />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, plant, role…"
              style={{ ...S.input, paddingLeft: 34 }}
            />
          </div>
          <Select
            value={roleFilter || undefined} placeholder="All Roles" allowClear
            onChange={(v) => setRoleFilter(v || "")} options={ROLE_OPTIONS}
            style={{ width: "100%" }} size="large"
          />
          <Select
            value={statusFilter || undefined} placeholder="All Status" allowClear
            onChange={(v) => setStatusFilter(v || "")} options={STATUS_OPTIONS}
            style={{ width: "100%" }} size="large"
          />
          <button onClick={() => { setSearch(""); setRoleFilter(""); setStatusFilter(""); }} style={S.ghostBtn}>
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
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>User Directory</h2>
          <Badge count={filtered.length} showZero
            style={{ backgroundColor: "#ECFEFF", color: "#0E7490", fontWeight: 600 }} />
        </div>
        <Table
          dataSource={filtered} columns={columns} rowKey="_id"
          loading={{ spinning: tableLoading, indicator: <Spin size="large" /> }}
          pagination={{ pageSize: 9, hideOnSinglePage: true }}
          onRow={(u) => ({ onClick: () => openDetail(u), style: { cursor: "pointer" } })}
          locale={{
            emptyText: (
              <div style={{ padding: "48px 0" }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<span style={{ color: "#64748B" }}>No users found. Click "Add User" to get started.</span>} />
              </div>
            ),
          }}
        />
      </div>

      {/* ══════════════════════════════════════
          CREATE / EDIT MODAL
      ══════════════════════════════════════ */}
      <Modal
        open={isFormOpen} onCancel={() => { resetForm(); setIsFormOpen(false); }}
        footer={null} centered destroyOnHidden mask={{ closable: false }}
        width={720} closeIcon={<X size={17} />}
        styles={{ header: { padding: 0 }, body: { padding: 0 } }}
      >
        {/* styled modal header */}
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
            {editId ? <Pencil size={16} color="#fff" /> : <Plus size={16} color="#fff" />}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#fff" }}>
              {editId ? "Update User" : "Create New User"}
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
              {editId ? "Modify the user's details below" : "Fill in the details to add a new user"}
            </p>
          </div>
        </div>

        <div style={{ padding: "24px 28px" }}>
          {/* 3-column grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "18px 20px" }} className="um-form-grid">

            <Field label="Full Name" required>
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name" style={S.input} />
            </Field>

            <Field label="Email Address" required>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com" style={S.input} />
            </Field>

            <Field label="Password" icon={Lock}>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={editId ? "Leave blank to keep" : "Set password"}
                style={S.input} />
            </Field>

            <Field label="Role" required>
              <Select
                value={role} onChange={setRole} options={ROLE_OPTIONS}
                style={{ width: "100%" }} size="large"
              />
            </Field>

            <Field label="Location" required icon={MapPin}>
              <input value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Noida" style={S.input} />
            </Field>

            <Field label="Plant" required icon={Building2}>
              <Select
                value={plantId || undefined}
                onChange={setPlantId}
                options={plantOptions}
                placeholder="Select plant"
                style={{ width: "100%" }} size="large"
              />
            </Field>

            <Field label="Status">
              <Select
                value={status} onChange={setStatus} options={STATUS_OPTIONS}
                style={{ width: "100%" }} size="large"
              />
            </Field>

          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 26, paddingTop: 20, borderTop: "1px solid #F1F5F9" }}>
            <button onClick={() => { resetForm(); setIsFormOpen(false); }} style={S.ghostBtn}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={loading} style={{ ...S.primaryBtn, opacity: loading ? 0.75 : 1 }}>
              {loading ? "Saving…" : editId ? "Update User" : "Save User"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ══════════════════════════════════════
          DETAIL / INLINE-EDIT MODAL
      ══════════════════════════════════════ */}
      <Modal
        open={isDetailOpen} onCancel={closeDetail}
        footer={null} width={640} closeIcon={<X size={17} />}
        destroyOnHidden
        styles={{ body: { padding: 0 } }}
      >
        {selectedUser && (
          <div>
            {/* header */}
            <div style={{
              background: "linear-gradient(135deg,#0E7490,#155E75)",
              padding: "26px 28px 22px", borderRadius: "8px 8px 0 0",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar size={50} style={{
                  background: "rgba(255,255,255,0.18)", fontWeight: 700,
                  fontSize: 17, border: "2px solid rgba(255,255,255,0.35)", flexShrink: 0,
                }}>
                  {initials(selectedUser.name)}
                </Avatar>
                <div style={{ minWidth: 0, flex: 1 }}>
                  {isEditing
                    ? <input value={draft?.name || ""} onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))}
                        style={{ ...S.input, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.35)", color: "#fff", fontWeight: 700, fontSize: 16 }} />
                    : <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>{selectedUser.name}</h2>
                  }
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    <RoleTag role={isEditing ? draft?.role : selectedUser.role} />
                    <StatusTag status={isEditing ? draft?.status : selectedUser.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* body */}
            <div style={{ padding: "24px 28px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>

                <DetailField icon={Mail} label="Email" editing={isEditing}
                  value={draft?.email} displayValue={selectedUser.email}
                  onChange={(v) => setDraft(d => ({ ...d, email: v }))} type="email" />

                <DetailField icon={Lock} label="Password" editing={isEditing}
                  value={draft?.password} displayValue="••••••••"
                  onChange={(v) => setDraft(d => ({ ...d, password: v }))}
                  type="password" placeholder="Leave blank to keep current" />

                <DetailField icon={MapPin} label="Location" editing={isEditing}
                  value={draft?.location} displayValue={selectedUser.location}
                  onChange={(v) => setDraft(d => ({ ...d, location: v }))} />

                <div>
                  <FieldLabel icon={Building2} label="Plant" />
                  {isEditing
                    ? <Select value={draftPlantId || undefined} onChange={setDraftPlantId}
                        options={plantOptions} placeholder="Select plant"
                        style={{ width: "100%" }} size="large" />
                    : <ValueBox>{selectedUser.plantId?.plantName || "—"}</ValueBox>
                  }
                </div>

                <div>
                  <FieldLabel icon={Shield} label="Role" />
                  {isEditing
                    ? <Select value={draft?.role} onChange={(v) => setDraft(d => ({ ...d, role: v }))}
                        options={ROLE_OPTIONS} style={{ width: "100%" }} size="large" />
                    : <ValueBox>{ROLE_META[selectedUser.role]?.label || selectedUser.role}</ValueBox>
                  }
                </div>

                <div>
                  <FieldLabel icon={Check} label="Status" />
                  {isEditing
                    ? <Select value={draft?.status} onChange={(v) => setDraft(d => ({ ...d, status: v }))}
                        options={STATUS_OPTIONS} style={{ width: "100%" }} size="large" />
                    : <ValueBox><StatusTag status={selectedUser.status} /></ValueBox>
                  }
                </div>

              </div>

              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #F1F5F9", fontSize: 12, color: "#94A3B8" }}>
                Created {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : "—"}
              </div>

              {/* actions */}
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                {isEditing ? (
                  <>
                    <button onClick={() => { setDraft(selectedUser); setDraftPlantId(selectedUser.plantId?._id || ""); setIsEditing(false); }}
                      style={{ ...S.ghostBtn, flex: 1, justifyContent: "center" }}>
                      Cancel
                    </button>
                    <button onClick={handleDetailSave} disabled={saving}
                      style={{ ...S.primaryBtn, flex: 1.5, justifyContent: "center", opacity: saving ? 0.75 : 1 }}>
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={closeDetail} style={{ ...S.ghostBtn, flex: 1, justifyContent: "center" }}>Close</button>
                    <button onClick={() => setIsEditing(true)} style={{ ...S.amberBtn, flex: 1, justifyContent: "center" }}>
                      <Pencil size={13} /> Edit
                    </button>
                    <Popconfirm title="Delete this user?" description="This action cannot be undone."
                      okText="Delete" okButtonProps={{ danger: true }}
                      onConfirm={() => { closeDetail(); handleDelete(selectedUser._id); }}>
                      <button style={{ ...S.dangerBtn, flex: 1, justifyContent: "center" }}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </Popconfirm>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────────────────
   GLOBAL CSS OVERRIDES (injected once)
───────────────────────────────────────────── */
const CSS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
    .ant-table-thead > tr > th {
      background: #F8FAFC !important;
      color: #64748B !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #F1F5F9 !important;
    }
    .ant-table-thead > tr > th::before { display: none !important; }
    .ant-table-tbody > tr > td {
      border-bottom: 1px solid #F8FAFC !important;
      padding: 11px 16px !important;
    }
    .ant-table-tbody > tr:hover > td { background: #F0FDFF !important; }
    .ant-select-selector { border-radius: 10px !important; border-color: #E2E8F0 !important; }
    .ant-select-selector:hover { border-color: #0E7490 !important; }
    .ant-badge-count { box-shadow: none !important; }
    @media (max-width: 900px) {
      .um-filters { grid-template-columns: 1fr !important; }
      .um-form-grid { grid-template-columns: 1fr 1fr !important; }
    }
    @media (max-width: 580px) {
      .um-form-grid { grid-template-columns: 1fr !important; }
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
    boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
    marginBottom: 18,
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
    outline: "none", background: "#fff", boxSizing: "border-box",
    fontFamily: "inherit", height: 40, transition: "border-color 0.15s",
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