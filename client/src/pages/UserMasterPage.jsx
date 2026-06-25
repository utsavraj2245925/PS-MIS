import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  ConfigProvider,
  theme as antdTheme,
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
  Briefcase,
  UserCheck,
  X,
  Mail,
  MapPin,
  Building2,
  Lock,
  RotateCcw,
  Check,
  ChevronDown,
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

/* =========================================================================
   DESIGN TOKENS — dark "workspace" theme (derived from reference mock)
   bg: near-black page, raised dark-gray panels, lime-acid accent for
   primary actions / active state, soft white floating card for the
   detail / edit overlay (mirrors the white "Summary" card floating over
   the dark canvas in the reference).
   ========================================================================= */
const T = {
  page: "#121212",
  panel: "#1A1A1A",
  panelBorder: "#272727",
  card: "#1E1E1E",
  cardHover: "#242424",
  cardBorder: "#2A2A2A",
  text: "#F2F2F0",
  textMuted: "#8C8C8C",
  textFaint: "#5E5E5E",
  lime: "#D7FE63",
  limeDeep: "#A9D62E",
  limeSoft: "rgba(215,254,99,0.12)",
  danger: "#FF6B6B",
  dangerSoft: "rgba(255,107,107,0.12)",
  divider: "#262626",
};

const ROLE_STYLE = {
  SUPER_ADMIN: { bg: "rgba(255,107,107,0.14)", fg: "#FF8B8B", dot: "#FF6B6B" },
  PLANT_ADMIN: { bg: "rgba(94,234,212,0.14)", fg: "#7DEFDD", dot: "#5EEAD4" },
  MANAGER: { bg: "rgba(196,181,253,0.14)", fg: "#CBB8FF", dot: "#C4B5FD" },
  USER: { bg: "rgba(255,255,255,0.08)", fg: "#C8C8C8", dot: "#8C8C8C" },
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
        letterSpacing: 0.4,
        padding: "4px 10px",
        borderRadius: 999,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot, flexShrink: 0 }} />
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
        background: active ? T.limeSoft : T.dangerSoft,
        color: active ? T.lime : T.danger,
        fontSize: 11,
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: active ? T.lime : T.danger }} />
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

const AVATAR_PALETTE = ["#5EEAD4", "#C4B5FD", "#FCD34D", "#D7FE63", "#FF8B8B", "#93C5FD"];
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

  // create / edit form — now a centered Modal instead of a side Drawer
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
    },
    {
      key: "active",
      label: "Active Users",
      value: activeUsers,
      icon: UserCheck,
    },
    {
      key: "managers",
      label: "Managers",
      value: managers,
      icon: Briefcase,
    },
    {
      key: "plantAdmins",
      label: "Plant Admin",
      value: plantAdmins,
      icon: Shield,
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
            size={32}
            style={{
              background: avatarColor(user.name || user.email),
              color: "#121212",
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
                fontSize: 13,
                color: T.text,
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
                color: T.textMuted,
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
      width: 130,
      render: (v) => <span style={{ fontSize: 13, color: "#B5B5B5" }}>{v || "—"}</span>,
    },
    {
      title: "Plant",
      dataIndex: "plant",
      key: "plant",
      width: 110,
      render: (v) => <span style={{ fontSize: 13, color: "#B5B5B5" }}>{v || "—"}</span>,
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
      width: 105,
      render: (v) => (
        <span style={{ fontSize: 12.5, color: T.textFaint }}>
          {v ? new Date(v).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 86,
      render: (_, user) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <Tooltip title="Edit">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(user);
              }}
              style={iconBtnStyle(T.limeSoft, T.lime)}
            >
              <Pencil size={14} />
            </button>
          </Tooltip>
          <Popconfirm
            title="Delete this user?"
            description="This action cannot be undone."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(user._id)}
            onPopupClick={(e) => e?.stopPropagation?.()}
          >
            <button onClick={(e) => e.stopPropagation()} style={iconBtnStyle(T.dangerSoft, T.danger)}>
              <Trash2 size={14} />
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: antdTheme.darkAlgorithm,
        token: {
          colorPrimary: T.lime,
          colorBgContainer: T.card,
          colorBgElevated: T.card,
          colorBorder: T.cardBorder,
          colorText: T.text,
          colorTextSecondary: T.textMuted,
          borderRadius: 10,
          fontFamily: "'IBM Plex Sans', sans-serif",
          colorLink: T.lime,
        },
        components: {
          Select: { colorBgContainer: T.card, colorBorder: T.cardBorder },
          Table: { colorBgContainer: "transparent", headerBg: "transparent" },
          Modal: { colorBgElevated: "#FAFAF8" },
        },
      }}
    >
      <div
        style={{
          minHeight: "100vh",
          background: T.page,
          fontFamily: "'IBM Plex Sans', sans-serif",
          padding: "30px 36px",
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
            marginBottom: 28,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: T.lime,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 18px -6px rgba(215,254,99,0.45)",
                }}
              >
                <Users size={18} color="#121212" />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0, letterSpacing: -0.3 }}>
                User Master
              </h1>
            </div>
            <p style={{ color: T.textMuted, fontSize: 13.5, margin: "6px 0 0 50px" }}>
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
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color={T.lime} />
                </div>
                <div>
                  <p style={{ color: T.textMuted, fontSize: 12, margin: 0, fontWeight: 500 }}>
                    {c.label}
                  </p>
                  <h3 style={{ fontSize: 25, fontWeight: 700, color: T.text, margin: "4px 0 0" }}>
                    {c.value}
                  </h3>
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
              gridTemplateColumns: "1.5fr 1fr 1fr auto",
              gap: 10,
            }}
            className="filters-grid"
          >
            <div style={{ position: "relative" }}>
              <Search
                size={15}
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: T.textFaint,
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search name or email…"
                style={{ ...pillInputStyle, paddingLeft: 38 }}
              />
            </div>

            <Select
              value={roleFilter || undefined}
              placeholder="All Roles"
              allowClear
              suffixIcon={<ChevronDown size={14} color={T.textMuted} />}
              onChange={(v) => setRoleFilter(v || "")}
              options={ROLE_OPTIONS}
              style={{ width: "100%", height: 42 }}
            />

            <Select
              value={statusFilter || undefined}
              placeholder="All Status"
              allowClear
              suffixIcon={<ChevronDown size={14} color={T.textMuted} />}
              onChange={(v) => setStatusFilter(v || "")}
              options={STATUS_OPTIONS}
              style={{ width: "100%", height: 42 }}
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
              padding: "18px 22px",
              borderBottom: `1px solid ${T.divider}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>
              User Directory
            </h2>
            <Badge
              count={filteredUsers.length}
              showZero
              style={{ backgroundColor: T.limeSoft, color: T.lime, fontWeight: 700, boxShadow: "none" }}
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
                      <span style={{ color: T.textMuted }}>
                        No users found. Create a new user to get started.
                      </span>
                    }
                  />
                </div>
              ),
            }}
          />
        </div>

        {/* CREATE / EDIT — centered modal (replaces side drawer) */}
        <Modal
          open={isDrawerOpen}
          onCancel={closeDrawer}
          footer={null}
          width={480}
          closeIcon={<X size={18} color="#1A1A1A" />}
          centered
          styles={{ body: { padding: 0 }, content: { padding: 0, borderRadius: 22, overflow: "hidden" } }}
        >
          <div>
            <div
              style={{
                background: "#F2F2EC",
                padding: "26px 28px 20px",
                borderBottom: "1px solid #E4E4DC",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 11,
                    background: editId ? "#FFE9B8" : "#E2F4A8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {editId ? <Pencil size={16} color="#92660C" /> : <Plus size={16} color="#3F6B0A" />}
                </div>
                <span style={{ fontSize: 17, fontWeight: 700, color: "#161616" }}>
                  {editId ? "Update User" : "Create New User"}
                </span>
              </div>
            </div>

            <div style={{ padding: 28, background: "#FAFAF8" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Field label="Full Name" required>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    style={lightInputStyle}
                  />
                </Field>

                <Field label="Email Address" required>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    style={lightInputStyle}
                  />
                </Field>

                <Field label="Password" hint={editId ? "Leave blank to keep current password" : undefined}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={lightInputStyle}
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
                      style={lightInputStyle}
                    />
                  </Field>

                  <Field label="Plant" required>
                    <input
                      type="text"
                      value={plant}
                      onChange={(e) => setPlant(e.target.value)}
                      placeholder="e.g. Plant 3"
                      style={lightInputStyle}
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

              <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
                <button onClick={closeDrawer} style={{ ...lightGhostBtnStyle, flex: 1, justifyContent: "center" }}>
                  Cancel
                </button>
                <button
                  onClick={handleSaveUser}
                  disabled={loading}
                  style={{ ...limeBtnStyle, flex: 1.4, justifyContent: "center", opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Saving…" : editId ? "Update User" : "Save User"}
                </button>
              </div>
            </div>
          </div>
        </Modal>

        {/* DETAILS / INLINE-EDIT MODAL — floating light card over the dark canvas */}
        <Modal
          open={isModalOpen}
          onCancel={closeModal}
          footer={null}
          width={640}
          closeIcon={<X size={18} color="#1A1A1A" />}
          centered
          styles={{ body: { padding: 0 }, content: { padding: 0, borderRadius: 24, overflow: "hidden" } }}
        >
          {selectedUser && (
            <div style={{ background: "#FAFAF8" }}>
              {/* modal header */}
              <div
                style={{
                  background: "#F2F2EC",
                  padding: "30px 30px 24px",
                  borderBottom: "1px solid #E4E4DC",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <Avatar
                    size={54}
                    style={{
                      background: T.lime,
                      color: "#161616",
                      fontWeight: 700,
                      fontSize: 18,
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
                          ...lightInputStyle,
                          fontWeight: 700,
                          fontSize: 16,
                        }}
                        placeholder="Full name"
                      />
                    ) : (
                      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#161616" }}>
                        {selectedUser.name}
                      </h2>
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 9, flexWrap: "wrap" }}>
                      <LightRoleTag role={isModalEditing ? modalDraft?.role : selectedUser.role} />
                      <LightStatusTag status={isModalEditing ? modalDraft?.status : selectedUser.status} />
                    </div>
                  </div>
                </div>
              </div>

              {/* modal body */}
              <div style={{ padding: 30 }}>
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
                    <LightFieldLabelRow icon={Shield} label="Role" />
                    {isModalEditing ? (
                      <Select
                        value={modalDraft?.role}
                        onChange={(v) => setModalDraft((d) => ({ ...d, role: v }))}
                        options={ROLE_OPTIONS}
                        style={{ width: "100%", marginTop: 6 }}
                        size="large"
                      />
                    ) : (
                      <div style={lightDetailValueBoxStyle}>{selectedUser.role}</div>
                    )}
                  </div>

                  <div>
                    <LightFieldLabelRow icon={Check} label="Status" />
                    {isModalEditing ? (
                      <Select
                        value={modalDraft?.status}
                        onChange={(v) => setModalDraft((d) => ({ ...d, status: v }))}
                        options={STATUS_OPTIONS}
                        style={{ width: "100%", marginTop: 6 }}
                        size="large"
                      />
                    ) : (
                      <div style={lightDetailValueBoxStyle}>{selectedUser.status}</div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 20,
                    paddingTop: 16,
                    borderTop: "1px solid #E4E4DC",
                    fontSize: 12.5,
                    color: "#8A8A82",
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
                        style={{ ...lightGhostBtnStyle, flex: 1, justifyContent: "center" }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleModalSave}
                        disabled={modalSaving}
                        style={{
                          ...limeBtnStyle,
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
                        style={{ ...lightGhostBtnStyle, flex: 1, justifyContent: "center" }}
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
                        style={{ ...lightDangerBtnStyle, flex: 1, justifyContent: "center" }}
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
    </ConfigProvider>
  );
}

/* ---------------- presentational helpers ---------------- */

const Field = ({ label, required, hint, children }) => (
  <div>
    <LightFieldLabelRow label={label} required={required} />
    {children}
    {hint && (
      <p style={{ fontSize: 11.5, color: "#9A9A92", margin: "4px 0 0" }}>{hint}</p>
    )}
  </div>
);

const LightFieldLabelRow = ({ icon: Icon, label, required }) => (
  <label
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 12.5,
      fontWeight: 600,
      color: "#5A5A52",
      marginBottom: 6,
    }}
  >
    {Icon && <Icon size={13} color="#9A9A92" />}
    {label}
    {required && <span style={{ color: "#D14343" }}>*</span>}
  </label>
);

const DetailField = ({ icon, label, editing, value, displayValue, onChange, type = "text", placeholder }) => (
  <div>
    <LightFieldLabelRow icon={icon} label={label} />
    {editing ? (
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={lightInputStyle}
      />
    ) : (
      <div style={lightDetailValueBoxStyle}>{displayValue || "—"}</div>
    )}
  </div>
);

const LIGHT_ROLE_STYLE = {
  SUPER_ADMIN: { bg: "#FBE0E0", fg: "#B5302F" },
  PLANT_ADMIN: { bg: "#DCF5F0", fg: "#1A7A68" },
  MANAGER: { bg: "#EAE2FB", fg: "#6B3FA0" },
  USER: { bg: "#ECECE6", fg: "#5A5A52" },
};

const LightRoleTag = ({ role }) => {
  const s = LIGHT_ROLE_STYLE[role] || LIGHT_ROLE_STYLE.USER;
  return (
    <span
      style={{
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
      {role?.replace("_", " ")}
    </span>
  );
};

const LightStatusTag = ({ status }) => {
  const active = status === "Active";
  return (
    <span
      style={{
        background: active ? "#E2F4A8" : "#FBE0E0",
        color: active ? "#3F6B0A" : "#B5302F",
        fontSize: 11,
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: 999,
      }}
    >
      {status}
    </span>
  );
};

const GlobalStyle = () => (
  <style>{`
    .ant-table {
      background: transparent !important;
    }
    .ant-table-thead > tr > th {
      background: transparent !important;
      color: #6E6E66 !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #262626 !important;
    }
    .ant-table-thead > tr > th::before { display: none !important; }
    .ant-table-tbody > tr > td {
      background: transparent !important;
      border-bottom: 1px solid #212121 !important;
      padding: 12px 16px !important;
    }
    .ant-table-tbody > tr:hover > td {
      background: #1C1C1C !important;
    }
    .ant-table-placeholder:hover > td {
      background: transparent !important;
    }
    .ant-select-selector {
      border-radius: 12px !important;
      border-color: #2A2A2A !important;
      height: 42px !important;
      display: flex !important;
      align-items: center !important;
    }
    .ant-modal-content {
      box-shadow: 0 30px 70px -20px rgba(0,0,0,0.6) !important;
    }
    .ant-empty-description { color: #8C8C8C; }
    @media (max-width: 900px) {
      .filters-grid { grid-template-columns: 1fr !important; }
    }
  `}</style>
);

/* ---------------- inline style tokens ---------------- */

const panelStyle = {
  background: T.panel,
  border: `1px solid ${T.panelBorder}`,
  borderRadius: 20,
  padding: 18,
  marginBottom: 18,
};

const statCardStyle = {
  background: T.panel,
  border: `1px solid ${T.panelBorder}`,
  borderRadius: 20,
  padding: "18px 20px",
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const pillInputStyle = {
  width: "100%",
  border: `1px solid ${T.cardBorder}`,
  borderRadius: 999,
  padding: "10px 14px",
  fontSize: 13.5,
  color: T.text,
  outline: "none",
  background: T.card,
  boxSizing: "border-box",
  fontFamily: "inherit",
  height: 42,
};

const lightInputStyle = {
  width: "100%",
  border: "1px solid #E0E0D8",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 13.5,
  color: "#161616",
  outline: "none",
  background: "#fff",
  boxSizing: "border-box",
  fontFamily: "inherit",
  height: 40,
};

const lightDetailValueBoxStyle = {
  background: "#F2F2EC",
  border: "1px solid #E4E4DC",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 13.5,
  color: "#161616",
  fontWeight: 500,
  minHeight: 40,
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  wordBreak: "break-all",
};

const primaryBtnStyle = {
  background: T.lime,
  color: "#121212",
  border: "none",
  padding: "11px 20px",
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13.5,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 10px 24px -8px rgba(215,254,99,0.45)",
};

const limeBtnStyle = {
  background: T.lime,
  color: "#121212",
  border: "none",
  padding: "10px 16px",
  borderRadius: 10,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13.5,
  fontWeight: 700,
  cursor: "pointer",
};

const ghostBtnStyle = {
  background: T.card,
  color: T.textMuted,
  border: `1px solid ${T.cardBorder}`,
  padding: "10px 18px",
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
};

const lightGhostBtnStyle = {
  background: "#fff",
  color: "#5A5A52",
  border: "1px solid #E0E0D8",
  padding: "10px 16px",
  borderRadius: 10,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
};

const amberBtnStyle = {
  background: "#FFF3D6",
  color: "#92660C",
  border: "1px solid #FFE9B8",
  padding: "10px 16px",
  borderRadius: 10,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
};

const lightDangerBtnStyle = {
  background: "#FBE0E0",
  color: "#B5302F",
  border: "1px solid #F5C6C6",
  padding: "10px 16px",
  borderRadius: 10,
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