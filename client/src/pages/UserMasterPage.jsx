import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  Modal,
  Drawer,
  Form,
  Input,
  Select,
  Button,
  Table,
  Tag,
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
  Briefcase,
  UserCheck,
  X,
  Mail,
  MapPin,
  Building2,
  Lock,
  RotateCcw,
  Check,
} from "lucide-react";

const API = "http://localhost:4000/api/users";

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "PLANT_ADMIN", label: "Plant Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "USER", label: "User" },
];

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

// ---- visual tokens for role / status (kept purely presentational) ----
const ROLE_STYLE = {
  SUPER_ADMIN: { bg: "#FEE2E2", fg: "#B91C1C", dot: "#EF4444" },
  PLANT_ADMIN: { bg: "#CFFAFE", fg: "#0E7490", dot: "#06B6D4" },
  MANAGER: { bg: "#F3E8FF", fg: "#7E22CE", dot: "#A855F7" },
  USER: { bg: "#F1F5F9", fg: "#475569", dot: "#94A3B8" },
};

const RoleTag = ({ role }) => {
  const s = ROLE_STYLE[role] || ROLE_STYLE.USER;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: s.bg,
        color: s.fg,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.3,
        padding: "4px 10px",
        borderRadius: 999,
        textTransform: "uppercase",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot }} />
      {role?.replace("_", " ")}
    </span>
  );
};

const StatusTag = ({ status }) => {
  const active = status === "Active";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: active ? "#DCFCE7" : "#FFE4E6",
        color: active ? "#15803D" : "#BE123C",
        fontSize: 11,
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: 999,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: active ? "#22C55E" : "#F43F5E",
        }}
      />
      {status}
    </span>
  );
};

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

const AVATAR_PALETTE = ["#0E7490", "#7E22CE", "#B45309", "#15803D", "#BE123C", "#4338CA"];
const avatarColor = (seed = "") => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
};

export default function UserMasterPage() {
  const [users, setUsers] = useState([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [location, setLocation] = useState("");
  const [plant, setPlant] = useState("");
  const [status, setStatus] = useState("Active");
  const [editId, setEditId] = useState(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // drawer (create / edit form) visibility — purely presentational addition
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // inline-edit toggle inside the details modal
  const [isModalEditing, setIsModalEditing] = useState(false);
  const [modalDraft, setModalDraft] = useState(null);
  const [modalSaving, setModalSaving] = useState(false);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("USER");
    setLocation("");
    setPlant("");
    setStatus("Active");
    setEditId(null);
  };

  const fetchUsers = async () => {
    try {
      setTableLoading(true);

      const res = await axios.get(API);

      setUsers(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveUser = async () => {
    try {
      if (!name || !email || !role || !location || !plant) {
        message.warning("Please fill all required fields");
        return;
      }

      setLoading(true);

      const payload = {
        name,
        email,
        password,
        role,
        location,
        plant,
        status,
      };

      if (editId) {
        await axios.put(`${API}/${editId}`, payload);
        message.success("User updated successfully");
      } else {
        await axios.post(API, payload);
        message.success("User created successfully");
      }

      await fetchUsers();

      resetForm();
      setIsDrawerOpen(false);
    } catch (error) {
      console.error(error);

      message.error(error?.response?.data?.message || "Unable to save user");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/${id}`);
      message.success("User deleted");
      fetchUsers();
    } catch (error) {
      console.error(error);
      message.error("Unable to delete user");
    }
  };

  const handleEdit = (user) => {
    setEditId(user._id);
    setName(user.name || "");
    setEmail(user.email || "");
    setPassword("");
    setRole(user.role || "USER");
    setLocation(user.location || "");
    setPlant(user.plant || "");
    setStatus(user.status || "Active");

    setIsDrawerOpen(true);
  };

  const handleSearch = (value) => {
    setSearch(value);
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchMatch =
        user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        user?.email?.toLowerCase().includes(search.toLowerCase());

      const roleMatch = !roleFilter || user.role === roleFilter;

      const statusMatch = !statusFilter || user.status === statusFilter;

      return searchMatch && roleMatch && statusMatch;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalUsers = users.length;

  const activeUsers = users.filter((u) => u.status === "Active").length;

  const managers = users.filter((u) => u.role === "MANAGER").length;

  const plantAdmins = users.filter((u) => u.role === "PLANT_ADMIN").length;

  const openUserModal = (user) => {
    setSelectedUser(user);
    setModalDraft(user);
    setIsModalEditing(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setModalDraft(null);
    setIsModalEditing(false);
    setIsModalOpen(false);
  };

  const openCreateDrawer = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    resetForm();
    setIsDrawerOpen(false);
  };

  // Save edits made inline inside the details modal.
  // Reuses the exact same PUT contract as handleSaveUser.
  const handleModalSave = async () => {
    try {
      if (
        !modalDraft?.name ||
        !modalDraft?.email ||
        !modalDraft?.role ||
        !modalDraft?.location ||
        !modalDraft?.plant
      ) {
        message.warning("Please fill all required fields");
        return;
      }

      setModalSaving(true);

      const payload = {
        name: modalDraft.name,
        email: modalDraft.email,
        password: modalDraft.password || "",
        role: modalDraft.role,
        location: modalDraft.location,
        plant: modalDraft.plant,
        status: modalDraft.status,
      };

      await axios.put(`${API}/${selectedUser._id}`, payload);

      message.success("User updated successfully");

      await fetchUsers();

      setIsModalEditing(false);
      closeModal();
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || "Unable to save user");
    } finally {
      setModalSaving(false);
    }
  };

  const statCards = [
    {
      key: "total",
      label: "Total Users",
      value: totalUsers,
      icon: Users,
      tint: "#0E7490",
      tintBg: "#ECFEFF",
    },
    {
      key: "active",
      label: "Active Users",
      value: activeUsers,
      icon: UserCheck,
      tint: "#15803D",
      tintBg: "#F0FDF4",
    },
    {
      key: "managers",
      label: "Managers",
      value: managers,
      icon: Briefcase,
      tint: "#7E22CE",
      tintBg: "#FAF5FF",
    },
    {
      key: "plantAdmins",
      label: "Plant Admin",
      value: plantAdmins,
      icon: Shield,
      tint: "#B91C1C",
      tintBg: "#FEF2F2",
    },
  ];

  const columns = [
    {
      title: "User",
      dataIndex: "name",
      key: "name",
      render: (_, user) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            size={34}
            style={{
              background: avatarColor(user.name || user.email),
              fontWeight: 700,
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            {initials(user.name)}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: 13.5,
                color: "#0F172A",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.name}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#64748B",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (r) => <RoleTag role={r} />,
      width: 150,
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      width: 140,
      render: (v) => <span style={{ fontSize: 13, color: "#334155" }}>{v || "—"}</span>,
    },
    {
      title: "Plant",
      dataIndex: "plant",
      key: "plant",
      width: 120,
      render: (v) => <span style={{ fontSize: 13, color: "#334155" }}>{v || "—"}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (s) => <StatusTag status={s} />,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 110,
      render: (v) => (
        <span style={{ fontSize: 12.5, color: "#94A3B8" }}>
          {v ? new Date(v).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 90,
      render: (_, user) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <Tooltip title="Edit">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(user);
              }}
              style={iconBtnStyle("#FFFBEB", "#B45309")}
            >
              <Pencil size={14} />
            </button>
          </Tooltip>
          <Popconfirm
            title="Delete this user?"
            description="This action cannot be undone."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={(e) => {
              handleDelete(user._id);
            }}
            onPopupClick={(e) => e?.stopPropagation?.()}
          >
            <button onClick={(e) => e.stopPropagation()} style={iconBtnStyle("#FFF1F2", "#BE123C")}>
              <Trash2 size={14} />
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        fontFamily: "'IBM Plex Sans', sans-serif",
        padding: "28px 32px",
      }}
    >
      <GlobalStyle />

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                background: "linear-gradient(135deg,#0E7490,#0891B2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 6px 14px -4px rgba(14,116,144,0.45)",
              }}
            >
              <Users size={18} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>
              User Master
            </h1>
          </div>
          <p style={{ color: "#64748B", fontSize: 13.5, margin: "4px 0 0 46px" }}>
            Enterprise user management &amp; access control
          </p>
        </div>

        <button onClick={openCreateDrawer} style={primaryBtnStyle}>
          <Plus size={16} />
          Add User
        </button>
      </div>

      {/* STATS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          marginBottom: 22,
        }}
      >
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.key} style={statCardStyle}>
              <div>
                <p style={{ color: "#64748B", fontSize: 12.5, margin: 0, fontWeight: 500 }}>
                  {c.label}
                </p>
                <h3 style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", margin: "6px 0 0" }}>
                  {c.value}
                </h3>
              </div>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: c.tintBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={20} color={c.tint} />
              </div>
            </div>
          );
        })}
      </div>

      {/* SEARCH + FILTERS */}
      <div style={panelStyle}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr auto",
            gap: 10,
          }}
          className="filters-grid"
        >
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94A3B8",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search name or email…"
              style={{ ...inputStyle, paddingLeft: 36 }}
            />
          </div>

          <Select
            value={roleFilter || undefined}
            placeholder="All Roles"
            allowClear
            onChange={(v) => setRoleFilter(v || "")}
            options={ROLE_OPTIONS}
            style={{ width: "100%" }}
            size="large"
          />

          <Select
            value={statusFilter || undefined}
            placeholder="All Status"
            allowClear
            onChange={(v) => setStatusFilter(v || "")}
            options={STATUS_OPTIONS}
            style={{ width: "100%" }}
            size="large"
          />

          <button
            onClick={() => {
              setSearch("");
              setRoleFilter("");
              setStatusFilter("");
            }}
            style={ghostBtnStyle}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ ...panelStyle, padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #F1F5F9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: 15.5, fontWeight: 700, color: "#0F172A", margin: 0 }}>
            User Directory
          </h2>
          <Badge
            count={filteredUsers.length}
            showZero
            style={{ backgroundColor: "#ECFEFF", color: "#0E7490", fontWeight: 600 }}
          />
        </div>

        <Table
          dataSource={filteredUsers}
          columns={columns}
          rowKey="_id"
          loading={{
            spinning: tableLoading,
            indicator: <Spin size="large" />,
          }}
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          onRow={(user) => ({
            onClick: () => openUserModal(user),
            style: { cursor: "pointer" },
          })}
          locale={{
            emptyText: (
              <div style={{ padding: "48px 0" }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span style={{ color: "#64748B" }}>
                      No users found. Create a new user to get started.
                    </span>
                  }
                />
              </div>
            ),
          }}
        />
      </div>

      {/* CREATE / EDIT DRAWER */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: editId ? "#FFFBEB" : "#ECFEFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {editId ? (
                <Pencil size={15} color="#B45309" />
              ) : (
                <Plus size={15} color="#0E7490" />
              )}
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
              {editId ? "Update User" : "Create User"}
            </span>
          </div>
        }
        placement="right"
        width={420}
        open={isDrawerOpen}
        onClose={closeDrawer}
        closeIcon={<X size={18} />}
        styles={{ body: { padding: 24 } }}
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={closeDrawer} style={{ ...ghostBtnStyle, flex: 1, justifyContent: "center" }}>
              Cancel
            </button>
            <button
              onClick={handleSaveUser}
              disabled={loading}
              style={{ ...primaryBtnStyle, flex: 1.4, justifyContent: "center", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Saving…" : editId ? "Update User" : "Save User"}
            </button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Full Name" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              style={inputStyle}
            />
          </Field>

          <Field label="Email Address" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              style={inputStyle}
            />
          </Field>

          <Field label="Password" hint={editId ? "Leave blank to keep current password" : undefined}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
            />
          </Field>

          <Field label="Role" required>
            <Select
              value={role}
              onChange={(v) => setRole(v)}
              options={ROLE_OPTIONS}
              style={{ width: "100%" }}
              size="large"
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Location" required>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Pune"
                style={inputStyle}
              />
            </Field>

            <Field label="Plant" required>
              <input
                type="text"
                value={plant}
                onChange={(e) => setPlant(e.target.value)}
                placeholder="e.g. Plant 3"
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Status">
            <Select
              value={status}
              onChange={(v) => setStatus(v)}
              options={STATUS_OPTIONS}
              style={{ width: "100%" }}
              size="large"
            />
          </Field>
        </div>
      </Drawer>

      {/* DETAILS / INLINE-EDIT MODAL */}
      <Modal
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
        width={620}
        closeIcon={<X size={18} />}
        styles={{ body: { padding: 0 } }}
      >
        {selectedUser && (
          <div>
            {/* modal header */}
            <div
              style={{
                background: "linear-gradient(135deg,#0E7490,#155E75)",
                padding: "28px 28px 22px",
                borderRadius: "8px 8px 0 0",
                color: "#fff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar
                  size={52}
                  style={{
                    background: "rgba(255,255,255,0.18)",
                    fontWeight: 700,
                    fontSize: 18,
                    border: "2px solid rgba(255,255,255,0.35)",
                  }}
                >
                  {initials(selectedUser.name)}
                </Avatar>
                <div style={{ minWidth: 0, flex: 1 }}>
                  {isModalEditing ? (
                    <input
                      value={modalDraft?.name || ""}
                      onChange={(e) =>
                        setModalDraft((d) => ({ ...d, name: e.target.value }))
                      }
                      style={{
                        ...inputStyle,
                        background: "rgba(255,255,255,0.12)",
                        border: "1px solid rgba(255,255,255,0.35)",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 16,
                      }}
                      placeholder="Full name"
                    />
                  ) : (
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>
                      {selectedUser.name}
                    </h2>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    <RoleTag role={isModalEditing ? modalDraft?.role : selectedUser.role} />
                    <StatusTag status={isModalEditing ? modalDraft?.status : selectedUser.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* modal body */}
            <div style={{ padding: 28 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <DetailField
                  icon={Mail}
                  label="Email Address"
                  editing={isModalEditing}
                  value={modalDraft?.email}
                  displayValue={selectedUser.email}
                  onChange={(v) => setModalDraft((d) => ({ ...d, email: v }))}
                  type="email"
                />
                <DetailField
                  icon={Lock}
                  label="Password"
                  editing={isModalEditing}
                  value={modalDraft?.password}
                  displayValue="••••••••"
                  onChange={(v) => setModalDraft((d) => ({ ...d, password: v }))}
                  type="password"
                  placeholder="Leave blank to keep current"
                />
                <DetailField
                  icon={MapPin}
                  label="Location"
                  editing={isModalEditing}
                  value={modalDraft?.location}
                  displayValue={selectedUser.location}
                  onChange={(v) => setModalDraft((d) => ({ ...d, location: v }))}
                />
                <DetailField
                  icon={Building2}
                  label="Plant"
                  editing={isModalEditing}
                  value={modalDraft?.plant}
                  displayValue={selectedUser.plant}
                  onChange={(v) => setModalDraft((d) => ({ ...d, plant: v }))}
                />

                <div>
                  <FieldLabelRow icon={Shield} label="Role" />
                  {isModalEditing ? (
                    <Select
                      value={modalDraft?.role}
                      onChange={(v) => setModalDraft((d) => ({ ...d, role: v }))}
                      options={ROLE_OPTIONS}
                      style={{ width: "100%", marginTop: 6 }}
                      size="large"
                    />
                  ) : (
                    <div style={detailValueBoxStyle}>{selectedUser.role}</div>
                  )}
                </div>

                <div>
                  <FieldLabelRow icon={Check} label="Status" />
                  {isModalEditing ? (
                    <Select
                      value={modalDraft?.status}
                      onChange={(v) => setModalDraft((d) => ({ ...d, status: v }))}
                      options={STATUS_OPTIONS}
                      style={{ width: "100%", marginTop: 6 }}
                      size="large"
                    />
                  ) : (
                    <div style={detailValueBoxStyle}>{selectedUser.status}</div>
                  )}
                </div>
              </div>

              <div
                style={{
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: "1px solid #F1F5F9",
                  fontSize: 12.5,
                  color: "#94A3B8",
                }}
              >
                Created{" "}
                {selectedUser.createdAt
                  ? new Date(selectedUser.createdAt).toLocaleString()
                  : "—"}
              </div>

              {/* actions */}
              <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                {isModalEditing ? (
                  <>
                    <button
                      onClick={() => {
                        setModalDraft(selectedUser);
                        setIsModalEditing(false);
                      }}
                      style={{ ...ghostBtnStyle, flex: 1, justifyContent: "center" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleModalSave}
                      disabled={modalSaving}
                      style={{
                        ...primaryBtnStyle,
                        flex: 1.4,
                        justifyContent: "center",
                        opacity: modalSaving ? 0.7 : 1,
                      }}
                    >
                      {modalSaving ? "Saving…" : "Save Changes"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={closeModal}
                      style={{ ...ghostBtnStyle, flex: 1, justifyContent: "center" }}
                    >
                      Close
                    </button>
                    <button
                      onClick={() => setIsModalEditing(true)}
                      style={{ ...amberBtnStyle, flex: 1, justifyContent: "center" }}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        closeModal();
                        handleDelete(selectedUser._id);
                      }}
                      style={{ ...dangerBtnStyle, flex: 1, justifyContent: "center" }}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
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

/* ---------------- presentational helpers ---------------- */

const Field = ({ label, required, hint, children }) => (
  <div>
    <FieldLabelRow label={label} required={required} />
    {children}
    {hint && (
      <p style={{ fontSize: 11.5, color: "#94A3B8", margin: "4px 0 0" }}>{hint}</p>
    )}
  </div>
);

const FieldLabelRow = ({ icon: Icon, label, required }) => (
  <label
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 12.5,
      fontWeight: 600,
      color: "#475569",
      marginBottom: 6,
    }}
  >
    {Icon && <Icon size={13} color="#94A3B8" />}
    {label}
    {required && <span style={{ color: "#F43F5E" }}>*</span>}
  </label>
);

const DetailField = ({ icon, label, editing, value, displayValue, onChange, type = "text", placeholder }) => (
  <div>
    <FieldLabelRow icon={icon} label={label} />
    {editing ? (
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    ) : (
      <div style={detailValueBoxStyle}>{displayValue || "—"}</div>
    )}
  </div>
);

const GlobalStyle = () => (
  <style>{`
    .ant-table-thead > tr > th {
      background: #F8FAFC !important;
      color: #64748B !important;
      font-size: 11.5px !important;
      font-weight: 700 !important;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      border-bottom: 1px solid #F1F5F9 !important;
    }
    .ant-table-thead > tr > th::before { display: none !important; }
    .ant-table-tbody > tr > td {
      border-bottom: 1px solid #F8FAFC !important;
      padding: 12px 16px !important;
    }
    .ant-table-tbody > tr:hover > td {
      background: #F0FDFF !important;
    }
    .ant-select-selector {
      border-radius: 10px !important;
      border-color: #E2E8F0 !important;
    }
    @media (max-width: 900px) {
      .filters-grid { grid-template-columns: 1fr !important; }
    }
  `}</style>
);

/* ---------------- inline style tokens ---------------- */

const panelStyle = {
  background: "#fff",
  border: "1px solid #F1F5F9",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
  marginBottom: 18,
};

const statCardStyle = {
  background: "#fff",
  border: "1px solid #F1F5F9",
  borderRadius: 18,
  padding: "18px 20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
};

const inputStyle = {
  width: "100%",
  border: "1px solid #E2E8F0",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 13.5,
  color: "#0F172A",
  outline: "none",
  background: "#fff",
  boxSizing: "border-box",
  fontFamily: "inherit",
  height: 40,
};

const detailValueBoxStyle = {
  background: "#F8FAFC",
  border: "1px solid #F1F5F9",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 13.5,
  color: "#0F172A",
  fontWeight: 500,
  minHeight: 40,
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  wordBreak: "break-all",
};

const primaryBtnStyle = {
  background: "linear-gradient(135deg,#0E7490,#0891B2)",
  color: "#fff",
  border: "none",
  padding: "10px 18px",
  borderRadius: 12,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 6px 16px -4px rgba(14,116,144,0.4)",
};

const ghostBtnStyle = {
  background: "#fff",
  color: "#475569",
  border: "1px solid #E2E8F0",
  padding: "10px 16px",
  borderRadius: 12,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
};

const amberBtnStyle = {
  background: "#FFFBEB",
  color: "#B45309",
  border: "1px solid #FEF3C7",
  padding: "10px 16px",
  borderRadius: 12,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
};

const dangerBtnStyle = {
  background: "#FFF1F2",
  color: "#BE123C",
  border: "1px solid #FFE4E6",
  padding: "10px 16px",
  borderRadius: 12,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
};

const iconBtnStyle = (bg, fg) => ({
  background: bg,
  color: fg,
  border: "none",
  width: 30,
  height: 30,
  borderRadius: 8,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
});