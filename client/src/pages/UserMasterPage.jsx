import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  Form, Row, Col, Select, Input, Button, Table, Tag,
  Modal, Drawer, Popconfirm, Skeleton, Spin, Empty, message, Divider, Space, Tooltip,
} from "antd";
import {
  Users, UserPlus, UserPen, Trash2, RefreshCcw, Download, Search,
  MapPin, Factory, Clock3, GitBranch, Shield, Eye, Power, PowerOff, Save, X,
} from "lucide-react";

/* ============================================================
   ⚠ ASSUMPTIONS — VERIFY AGAINST YOUR ACTUAL BACKEND
   ------------------------------------------------------------
   1. GET /api/locations              -> { success, data: [...] }  (guessed shape,
      falls back to res.data.locations too)
   2. GET /api/plants/location/:id    -> { success, data: [...] }  (guessed shape,
      falls back to res.data.plants too) — each Plant has an embedded
      `conveyors: [{ _id, conveyorName, status }]` array
   3. GET /api/shifts/plant/:id       -> { success, data: [...] }  (guessed shape,
      falls back to res.data.shifts too) — assumed already Active-only per spec
   4. GET /api/users                  -> { success, data: [...] }  (confirmed —
      matches the users.controller.js built earlier in this project)
   5. Location/Plant/Shift display names assumed: locationName, plantName, shiftName
   6. User document already carries snapshot fields locationName, plantName,
      shiftName, conveyorName directly (confirmed — matches user.model.js),
      so the table/export/drawer read those directly rather than relying on
      populate() shape.

   ⚠ IMPORTANT SPEC CONFLICT — PLEASE CONFIRM
   ------------------------------------------------------------
   This page hides/requires Location, Plant, Shift, Conveyor based on Role
   (superAdmin sees none, plantAdmin sees Location only, manager sees
   Location+Plant, user sees all four) — exactly as specified in this brief.

   However, the users.controller.js built earlier in this conversation now
   requires Location, Plant, Shift AND Conveyor for every role, with no
   role-based exemption. As built, creating a superAdmin/plantAdmin/manager
   from this page will fail backend validation, because this form won't send
   the hidden fields. You'll want to either:
     a) revert the controller to the earlier role-conditional validation, or
     b) tell this page to always require/collect all four fields regardless
        of role.
   This file follows the role-based hiding exactly as written in this brief;
   it does not silently resolve the conflict for you.
============================================================ */

const api = axios.create({ baseURL: "/api" });

const ROLE_META = {
  superAdmin: { label: "Super Admin", color: "gold" },
  plantAdmin: { label: "Plant Admin", color: "blue" },
  manager: { label: "Manager", color: "cyan" },
  user: { label: "User", color: "default" },
};

const resolveId = (val) => (val && typeof val === "object" ? val._id : val);

const showLocationFor = (role) => role && role !== "superAdmin";
const showPlantFor = (role) => role === "manager" || role === "user";
const showShiftFor = (role) => role === "user";
const showConveyorFor = (role) => role === "user";

/* ───────────────────────────────────────────── shared visual bits (same theme as the rest of Paint Shop MIS) */
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
      {active ? "Active" : "Inactive"}
    </span>
  );
};

const RoleTag = ({ role }) => {
  const meta = ROLE_META[role] || { label: role || "—", color: "default" };
  return (
    <Tag color={meta.color} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600, fontSize: 11, borderRadius: 999, padding: "2px 9px" }}>
      <Shield size={10} /> {meta.label}
    </Tag>
  );
};

const FieldLabel = ({ icon: Icon, label, required }) => (
  <span style={{
    display: "flex", alignItems: "center", gap: 4,
    fontSize: 10.5, fontWeight: 600, color: "#475569", letterSpacing: 0.2,
  }}>
    {Icon && <Icon size={11} color="#94A3B8" />}
    {label}
    {required && <span style={{ color: "#F43F5E" }}>*</span>}
  </span>
);

const SectionDivider = ({ icon: Icon, label, hint }) => (
  <div style={{ margin: "18px 0 14px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: hint ? 4 : 0 }}>
      <div style={{
        width: 22, height: 22, borderRadius: 7,
        background: "#ECFEFF", border: "1px solid rgba(14,116,144,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={11} color="#0E7490" />
      </div>
      <span style={{ fontSize: 9.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "#F1F5F9" }} />
    </div>
    {hint && <p style={{ margin: "4px 0 0 29px", fontSize: 10.5, color: "#94A3B8" }}>{hint}</p>}
  </div>
);

const IconBtn = ({ onClick, bg, fg, children, title }) => (
  <button onClick={onClick} title={title} style={{
    background: bg, color: fg, border: "none",
    width: 30, height: 30, borderRadius: 8,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0,
  }}>
    {children}
  </button>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid #F1F5F9" }}>
    <div style={{
      width: 28, height: 28, borderRadius: 8, background: "#F8FAFC", border: "1px solid #F1F5F9",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
    }}>
      <Icon size={13} color="#0E7490" />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A", marginTop: 2, wordBreak: "break-word" }}>{value ?? "—"}</div>
    </div>
  </div>
);

/* ───────────────────────────────────────────── MAIN PAGE */
export default function UserMasterPage() {
  const [form] = Form.useForm();

  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [plants, setPlants] = useState([]);
  const [shifts, setShifts] = useState([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [plantsLoading, setPlantsLoading] = useState(false);
  const [shiftsLoading, setShiftsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRole, setFilterRole] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);

  // Live-watched form values — drive conditional fields + the Conveyor dropdown
  const watchedRole = Form.useWatch("role", form);
  const watchedLocationId = Form.useWatch("locationId", form);
  const watchedPlantId = Form.useWatch("plantId", form);

  const selectedPlant = useMemo(
    () => plants.find((p) => p._id === watchedPlantId),
    [plants, watchedPlantId]
  );
  const conveyorOptions = selectedPlant?.conveyors || [];

  /* ================================================================
     FETCHERS
  ================================================================ */
  const fetchUsers = useCallback(async () => {
    try {
      setTableLoading(true);
      const res = await api.get("/users");
      setUsers(res.data.data || res.data.users || []);
    } catch {
      message.error("Failed to load users");
    } finally {
      setTableLoading(false);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await api.get("/locations");
      const list = res.data.data || res.data.locations || [];
      // Active Locations Only
      setLocations(list.filter((l) => !l.status || l.status === "Active"));
    } catch {
      message.error("Failed to load locations");
    }
  }, []);

  const fetchPlantsByLocation = useCallback(async (locationId) => {
    if (!locationId) {
      setPlants([]);
      return;
    }
    try {
      setPlantsLoading(true);
      const res = await api.get(`/plants/location/${locationId}`);
      setPlants(res.data.data || res.data.plants || []);
    } catch {
      message.error("Failed to load plants for the selected location");
      setPlants([]);
    } finally {
      setPlantsLoading(false);
    }
  }, []);

  const fetchShiftsByPlant = useCallback(async (plantId) => {
    if (!plantId) {
      setShifts([]);
      return;
    }
    try {
      setShiftsLoading(true);
      const res = await api.get(`/shifts/plant/${plantId}`);
      setShifts(res.data.data || res.data.shifts || []);
    } catch {
      message.error("Failed to load shifts for the selected plant");
      setShifts([]);
    } finally {
      setShiftsLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setInitialLoading(true);
      await Promise.all([fetchUsers(), fetchLocations()]);
      setInitialLoading(false);
    })();
  }, [fetchUsers, fetchLocations]);

  /* ================================================================
     DEPENDENT DROPDOWN RESET
  ================================================================ */
  const resetDependentDropdowns = (level) => {
    if (level === "role") {
      setPlants([]);
      setShifts([]);
      form.setFieldsValue({ locationId: undefined, plantId: undefined, shiftId: undefined, conveyorId: undefined });
    } else if (level === "location") {
      setPlants([]);
      setShifts([]);
      form.setFieldsValue({ plantId: undefined, shiftId: undefined, conveyorId: undefined });
    } else if (level === "plant") {
      setShifts([]);
      form.setFieldsValue({ shiftId: undefined, conveyorId: undefined });
    } else if (level === "shift") {
      form.setFieldsValue({ conveyorId: undefined });
    }
  };

  /* ================================================================
     CASCADE HANDLERS
  ================================================================ */
  const handleRoleChange = (value) => {
    resetDependentDropdowns("role");
    // Re-fetching happens naturally once the person picks Location/Plant again
    void value;
  };

  const handleLocationChange = async (value) => {
    resetDependentDropdowns("location");
    if (value) await fetchPlantsByLocation(value);
  };

  const handlePlantChange = async (value) => {
    resetDependentDropdowns("plant");
    if (value) await fetchShiftsByPlant(value);
  };

  const handleShiftChange = () => {
    resetDependentDropdowns("shift");
  };

  /* ================================================================
     ADD / EDIT
  ================================================================ */
  const handleAddUser = () => {
    setEditingUser(null);
    form.resetFields();
    setPlants([]);
    setShifts([]);
    setModalOpen(true);
  };

  const handleEditUser = async (record) => {
    try {
      setEditLoading(true);
      setEditingUser(record);
      setModalOpen(true);

      const res = await api.get(`/users/${record._id}`);
      const u = res.data.data || res.data;

      const locationId = resolveId(u.locationId);
      const plantId = resolveId(u.plantId);
      const shiftId = resolveId(u.shiftId);

      // Pre-load the cascading lists so the selects have options to show
      if (locationId) await fetchPlantsByLocation(locationId);
      if (plantId) await fetchShiftsByPlant(plantId);

      form.setFieldsValue({
        name: u.name,
        email: u.email,
        password: undefined,
        confirmPassword: undefined,
        role: u.role,
        status: u.status,
        locationId,
        plantId,
        shiftId,
        conveyorId: u.conveyorId,
      });
    } catch {
      message.error("Failed to load user details");
      setModalOpen(false);
    } finally {
      setEditLoading(false);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingUser(null);
    form.resetFields();
    setPlants([]);
    setShifts([]);
  };

  const handleFinish = async (values) => {
    const payload = {
      name: values.name,
      email: values.email,
      role: values.role,
      status: values.status,
      locationId: showLocationFor(values.role) ? values.locationId : undefined,
      plantId: showPlantFor(values.role) ? values.plantId : undefined,
      shiftId: showShiftFor(values.role) ? values.shiftId : undefined,
      conveyorId: showConveyorFor(values.role) ? values.conveyorId : undefined,
    };

    // Password is required on create; optional on edit (blank = keep existing)
    if (values.password) {
      payload.password = values.password;
    }

    try {
      setSaving(true);
      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, payload);
        message.success("User updated successfully");
      } else {
        await api.post("/users", payload);
        message.success("User created successfully");
      }
      handleModalClose();
      fetchUsers();
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  /* ================================================================
     DELETE / TOGGLE STATUS
  ================================================================ */
  const handleDeleteUser = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      message.success("User deleted");
      fetchUsers();
    } catch (err) {
      message.error(err?.response?.data?.message || "Delete failed");
    }
  };

  const handleToggleStatus = async (record) => {
    const nextStatus = record.status === "Active" ? "Inactive" : "Active";
    try {
      await api.patch(`/users/${record._id}/status`, { status: nextStatus });
      message.success(`User ${nextStatus === "Active" ? "activated" : "deactivated"}`);
      fetchUsers();
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  /* ================================================================
     VIEW DRAWER
  ================================================================ */
  const handleViewUser = (record) => {
    setViewingUser(record);
    setDrawerOpen(true);
  };

  /* ================================================================
     REFRESH / EXPORT
  ================================================================ */
  const handleRefresh = async () => {
    setSearch("");
    setFilterStatus("");
    setFilterRole("");
    await Promise.all([fetchUsers(), fetchLocations()]);
    message.success("Refreshed");
  };

  const handleExportExcel = () => {
    if (!filteredUsers.length) {
      message.warning("No users to export");
      return;
    }
    const rows = filteredUsers.map((u) => ({
      "Employee Name": u.name,
      Email: u.email,
      Role: ROLE_META[u.role]?.label || u.role,
      Location: u.locationName || "-",
      Plant: u.plantName || "-",
      Shift: u.shiftName || "-",
      Conveyor: u.conveyorName || "-",
      Status: u.status,
      "Created Date": u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-",
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, "Users_Report.xlsx");
  };

  /* ================================================================
     SEARCH + FILTER (client-side, live)
  ================================================================ */
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch = !q || [
        u.name, u.email, ROLE_META[u.role]?.label, u.plantName, u.locationName, u.shiftName, u.status,
      ].some((v) => v?.toLowerCase?.().includes(q));
      const matchesStatus = !filterStatus || u.status === filterStatus;
      const matchesRole = !filterRole || u.role === filterRole;
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, search, filterStatus, filterRole]);

  /* ================================================================
     TABLE COLUMNS
  ================================================================ */
  const columns = [
    { title: "Employee Name", dataIndex: "name", ellipsis: true,
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      render: (v) => <span style={{ fontWeight: 700, fontSize: 12.5, color: "#0F172A" }}>{v}</span> },
    { title: "Email", dataIndex: "email", ellipsis: true,
      render: (v) => <span style={{ fontSize: 12.5, color: "#334155" }}>{v}</span> },
    { title: "Role", dataIndex: "role", width: 130,
      filters: Object.entries(ROLE_META).map(([value, meta]) => ({ text: meta.label, value })),
      onFilter: (value, record) => record.role === value,
      render: (v) => <RoleTag role={v} /> },
    { title: "Location", dataIndex: "locationName", ellipsis: true, width: 130,
      render: (v) => v ? (
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#334155" }}>
          <MapPin size={10} color="#94A3B8" /> {v}
        </span>
      ) : <span style={{ color: "#CBD5E1" }}>—</span> },
    { title: "Plant", dataIndex: "plantName", ellipsis: true, width: 120,
      render: (v) => v || <span style={{ color: "#CBD5E1" }}>—</span> },
    { title: "Shift", dataIndex: "shiftName", ellipsis: true, width: 110,
      render: (v) => v || <span style={{ color: "#CBD5E1" }}>—</span> },
    { title: "Conveyor", dataIndex: "conveyorName", ellipsis: true, width: 120,
      render: (v) => v || <span style={{ color: "#CBD5E1" }}>—</span> },
    { title: "Status", dataIndex: "status", align: "center", width: 100,
      filters: [{ text: "Active", value: "Active" }, { text: "Inactive", value: "Inactive" }],
      onFilter: (value, record) => record.status === value,
      render: (v) => <StatusTag status={v} /> },
    { title: "Created Date", dataIndex: "createdAt", width: 130,
      sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
      render: (v) => <span style={{ fontSize: 12, color: "#64748B" }}>{v ? new Date(v).toLocaleDateString() : "—"}</span> },
    { title: "", key: "actions", width: 150, fixed: "right",
      render: (_, r) => (
        <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View">
            <IconBtn bg="#F0F9FF" fg="#0369A1" onClick={() => handleViewUser(r)}>
              <Eye size={13} />
            </IconBtn>
          </Tooltip>
          <Tooltip title="Edit">
            <IconBtn bg="#FFFBEB" fg="#B45309" onClick={() => handleEditUser(r)}>
              <UserPen size={13} />
            </IconBtn>
          </Tooltip>
          <Tooltip title={r.status === "Active" ? "Deactivate" : "Activate"}>
            <IconBtn
              bg={r.status === "Active" ? "#FFF7ED" : "#F0FDF4"}
              fg={r.status === "Active" ? "#C2410C" : "#15803D"}
              onClick={() => handleToggleStatus(r)}
            >
              {r.status === "Active" ? <PowerOff size={13} /> : <Power size={13} />}
            </IconBtn>
          </Tooltip>
          <Popconfirm
            title="Delete this user?"
            description="This action permanently removes the user."
            okText="Delete" cancelText="Cancel" okType="danger"
            onConfirm={() => handleDeleteUser(r._id)}
          >
            <IconBtn bg="#FFF1F2" fg="#BE123C" title="Delete">
              <Trash2 size={13} />
            </IconBtn>
          </Popconfirm>
        </div>
      ) },
  ];

  const isEditMode = Boolean(editingUser);

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div className="ump-page" style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <CSS />

      {/* ══ STICKY HEADER ══ */}
      <div className="ump-sticky-header" style={{
        position: "sticky", top: 0, zIndex: 20, background: "rgba(248,250,252,0.92)",
        backdropFilter: "blur(6px)", padding: "20px 32px 16px", borderBottom: "1px solid #F1F5F9",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11,
              background: "linear-gradient(135deg,#0E7490,#0891B2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 6px 14px -4px rgba(14,116,144,0.4)",
            }}>
              <Users size={18} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>Manage Users</h1>
              <p style={{ color: "#64748B", fontSize: 12.5, margin: "2px 0 0" }}>
                {filteredUsers.length} of {users.length} user{users.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button onClick={handleRefresh} icon={<RefreshCcw size={14} />} style={S.ghostBtnAntd}>Refresh</Button>
            <Button onClick={handleExportExcel} icon={<Download size={14} />} style={S.ghostBtnAntd}>Export Excel</Button>
            <Button type="primary" onClick={handleAddUser} icon={<UserPlus size={14} />} style={S.primaryBtnAntd}>Add User</Button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr", gap: 10, marginTop: 16 }} className="ump-filters">
          <div style={{ position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", zIndex: 1 }} />
            <Input
              className="ump-input" style={{ paddingLeft: 34 }}
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, role, plant, location, shift, status…"
              allowClear
            />
          </div>
          <Select
            className="ump-select" allowClear placeholder="All Status"
            value={filterStatus || undefined} onChange={(v) => setFilterStatus(v || "")}
          >
            <Select.Option value="Active">Active</Select.Option>
            <Select.Option value="Inactive">Inactive</Select.Option>
          </Select>
          <Select
            className="ump-select" allowClear placeholder="All Roles"
            value={filterRole || undefined} onChange={(v) => setFilterRole(v || "")}
          >
            {Object.entries(ROLE_META).map(([value, meta]) => (
              <Select.Option key={value} value={value}>{meta.label}</Select.Option>
            ))}
          </Select>
        </div>
      </div>

      {/* ══ TABLE ══ */}
      <div style={{ padding: "18px 32px 32px" }}>
        <div style={{ ...S.panel, padding: 0, overflow: "hidden" }}>
          {initialLoading ? (
            <div style={{ padding: 20 }}><Skeleton active paragraph={{ rows: 8 }} /></div>
          ) : (
            <Table
              dataSource={filteredUsers} columns={columns} rowKey="_id" size="middle"
              loading={{ spinning: tableLoading, indicator: <Spin size="large" /> }}
              pagination={{ pageSize: 10, pageSizeOptions: [10, 20, 50, 100], showSizeChanger: true }}
              scroll={{ x: 1200 }}
              locale={{
                emptyText: (
                  <div style={{ padding: "48px 0" }}>
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={<span style={{ color: "#64748B" }}>No users found. Add one to get started.</span>} />
                  </div>
                ),
              }}
            />
          )}
        </div>
      </div>

      {/* ══ ADD / EDIT MODAL ══ */}
      <Modal
        open={modalOpen}
        onCancel={handleModalClose}
        footer={null}
        width={760}
        centered
        destroyOnHidden
        closeIcon={<X size={16} color="#64748B" />}
        title={null}
        styles={{ content: { padding: 0, borderRadius: 16, overflow: "hidden" }, body: { padding: 0, maxHeight: "82vh", display: "flex", flexDirection: "column" } }}
      >
        <div style={{ background: "linear-gradient(135deg,#0E7490,#155E75)", padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {isEditMode ? <UserPen size={16} color="#fff" /> : <UserPlus size={16} color="#fff" />}
            </div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>
              {isEditMode ? "Edit User" : "Add New User"}
            </h2>
          </div>
        </div>

        <div style={{ padding: "4px 24px 0", overflowY: "auto", flex: 1 }}>
          {editLoading ? (
            <div style={{ padding: 24 }}><Skeleton active paragraph={{ rows: 10 }} /></div>
          ) : (
            <Form
              form={form}
              layout="vertical"
              className="ump-form"
              initialValues={{ status: "Active" }}
              onFinish={handleFinish}
            >
              <SectionDivider icon={Users} label="Basic Information" />
              <Row gutter={12}>
                <Col xs={24} sm={12}>
                  <Form.Item name="name" label={<FieldLabel label="Employee Name" required />}
                    rules={[{ required: true, message: "Name is required" }]}>
                    <Input className="ump-input" placeholder="e.g. Ramesh Kulkarni" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="email" label={<FieldLabel label="Email" required />}
                    rules={[
                      { required: true, message: "Email is required" },
                      { type: "email", message: "Enter a valid email" },
                    ]}>
                    <Input className="ump-input" placeholder="name@company.com" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col xs={24} sm={12}>
                  <Form.Item name="password" label={<FieldLabel label="Password" required={!isEditMode} />}
                    rules={[
                      { required: !isEditMode, message: "Password is required" },
                      { min: 8, message: "Minimum 8 characters" },
                    ]}
                    extra={isEditMode ? "Leave blank to keep the current password" : undefined}>
                    <Input.Password className="ump-input" placeholder={isEditMode ? "••••••••" : "Minimum 8 characters"} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="confirmPassword" label={<FieldLabel label="Confirm Password" required={!isEditMode} />}
                    dependencies={["password"]}
                    rules={[
                      { required: !isEditMode, message: "Please confirm the password" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("password") === value) return Promise.resolve();
                          return Promise.reject(new Error("Passwords do not match"));
                        },
                      }),
                    ]}>
                    <Input.Password className="ump-input" placeholder="Re-enter password" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col xs={24} sm={12}>
                  <Form.Item name="role" label={<FieldLabel label="Role" required />}
                    rules={[{ required: true, message: "Role is required" }]}>
                    <Select className="ump-select" placeholder="Select role" onChange={handleRoleChange}>
                      {Object.entries(ROLE_META).map(([value, meta]) => (
                        <Select.Option key={value} value={value}>{meta.label}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="status" label={<FieldLabel label="Status" required />}
                    rules={[{ required: true, message: "Status is required" }]}>
                    <Select className="ump-select">
                      <Select.Option value="Active">Active</Select.Option>
                      <Select.Option value="Inactive">Inactive</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              {(showLocationFor(watchedRole) || showPlantFor(watchedRole) || showShiftFor(watchedRole) || showConveyorFor(watchedRole)) && (
                <>
                  <SectionDivider icon={GitBranch} label="Organization Mapping"
                    hint="Location → Plant → Shift → Conveyor. Fields shown depend on the selected role." />
                  <Row gutter={12}>
                    {showLocationFor(watchedRole) && (
                      <Col xs={24} sm={12}>
                        <Form.Item name="locationId" label={<FieldLabel icon={MapPin} label="Location" required />}
                          rules={[{ required: true, message: "Location is required" }]}>
                          <Select className="ump-select" placeholder="Select location" showSearch optionFilterProp="children" onChange={handleLocationChange}>
                            {locations.map((l) => (
                              <Select.Option key={l._id} value={l._id}>{l.locationName}</Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    )}
                    {showPlantFor(watchedRole) && (
                      <Col xs={24} sm={12}>
                        <Form.Item name="plantId" label={<FieldLabel icon={Factory} label="Plant" required />}
                          rules={[{ required: true, message: "Plant is required" }]}>
                          <Select
                            className="ump-select" placeholder="Select plant" showSearch optionFilterProp="children"
                            loading={plantsLoading} disabled={!watchedLocationId}
                            onChange={handlePlantChange}
                          >
                            {plants.map((p) => (
                              <Select.Option key={p._id} value={p._id}>{p.plantName}</Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    )}
                  </Row>
                  <Row gutter={12}>
                    {showShiftFor(watchedRole) && (
                      <Col xs={24} sm={12}>
                        <Form.Item name="shiftId" label={<FieldLabel icon={Clock3} label="Shift" required />}
                          rules={[{ required: true, message: "Shift is required" }]}>
                          <Select
                            className="ump-select" placeholder="Select shift"
                            loading={shiftsLoading} disabled={!watchedPlantId}
                            onChange={handleShiftChange}
                          >
                            {shifts.map((s) => (
                              <Select.Option key={s._id} value={s._id}>{s.shiftName}</Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    )}
                    {showConveyorFor(watchedRole) && (
                      <Col xs={24} sm={12}>
                        <Form.Item name="conveyorId" label={<FieldLabel icon={GitBranch} label="Conveyor" required />}
                          rules={[{ required: true, message: "Conveyor is required" }]}>
                          <Select className="ump-select" placeholder={watchedPlantId ? "Select conveyor" : "Select a plant first"} disabled={!watchedPlantId}>
                            {conveyorOptions.map((c) => (
                              <Select.Option key={c._id} value={c._id} disabled={c.status === "Inactive"}>
                                {c.conveyorName} {c.status === "Inactive" && <span style={{ color: "#F43F5E" }}>(Inactive)</span>}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    )}
                  </Row>
                </>
              )}

              <Divider style={{ margin: "6px 0 16px" }} />
            </Form>
          )}
        </div>

        {/* Sticky footer actions */}
        <div style={{
          padding: "14px 24px", borderTop: "1px solid #F1F5F9", background: "#fff",
          display: "flex", justifyContent: "flex-end", gap: 10,
        }}>
          <Button onClick={handleModalClose} style={S.ghostBtnAntd}>Cancel</Button>
          <Button
            type="primary" loading={saving} icon={<Save size={14} />}
            style={S.primaryBtnAntd} onClick={() => form.submit()}
          >
            {isEditMode ? "Update User" : "Save User"}
          </Button>
        </div>
      </Modal>

      {/* ══ VIEW DRAWER ══ */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={420}
        closeIcon={<X size={16} />}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, background: "#ECFEFF",
              border: "1px solid rgba(14,116,144,0.2)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Eye size={15} color="#0E7490" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15 }}>User Details</span>
          </div>
        }
      >
        {viewingUser && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <StatusTag status={viewingUser.status} />
              <RoleTag role={viewingUser.role} />
            </div>
            <InfoRow icon={Users} label="Employee Name" value={viewingUser.name} />
            <InfoRow icon={Search} label="Email" value={viewingUser.email} />
            <InfoRow icon={MapPin} label="Location" value={viewingUser.locationName} />
            <InfoRow icon={Factory} label="Plant" value={viewingUser.plantName} />
            <InfoRow icon={Clock3} label="Shift" value={viewingUser.shiftName} />
            <InfoRow icon={GitBranch} label="Conveyor" value={viewingUser.conveyorName} />
            <InfoRow icon={Clock3} label="Created Date" value={viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleString() : "—"} />
            <InfoRow icon={Clock3} label="Updated Date" value={viewingUser.updatedAt ? new Date(viewingUser.updatedAt).toLocaleString() : "—"} />
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ───────────────────────────────────────────── GLOBAL CSS (scoped, same theme as the rest of Paint Shop MIS) */
const CSS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

    .ump-page .ump-select .ant-select-selector {
      background: #F8FAFC !important; border: 1px solid #E2E8F0 !important;
      border-radius: 10px !important;
      min-height: 40px !important; display: flex !important; align-items: center !important;
    }
    .ump-page .ant-select-focused .ant-select-selector {
      border-color: #0E7490 !important; box-shadow: 0 0 0 3px rgba(14,116,144,0.12) !important;
      background: #fff !important;
    }
    .ump-page .ump-input.ant-input, .ump-page .ump-input.ant-input-affix-wrapper {
      background: #F8FAFC !important; border: 1px solid #E2E8F0 !important;
      border-radius: 10px !important; height: 40px;
    }
    .ump-page .ump-input.ant-input:focus, .ump-page .ump-input.ant-input-affix-wrapper-focused {
      border-color: #0E7490 !important; box-shadow: 0 0 0 3px rgba(14,116,144,0.12) !important;
      background: #fff !important;
    }
    .ump-page .ump-form .ant-form-item { margin-bottom: 14px; }
    .ump-page .ant-form-item-label { padding-bottom: 4px; }
    .ump-page .ant-table-thead > tr > th {
      background: #F8FAFC !important; color: #64748B !important;
      font-size: 11px !important; font-weight: 700 !important;
      text-transform: uppercase; letter-spacing: 0.5px;
      border-bottom: 1px solid #F1F5F9 !important;
    }
    .ump-page .ant-table-thead > tr > th::before { display: none !important; }
    .ump-page .ant-table-tbody > tr > td {
      border-bottom: 1px solid #F8FAFC !important;
      padding: 9px 16px !important;
    }
    .ump-page .ant-table-tbody > tr:hover > td { background: #F0FDFF !important; }
    .ump-page .ant-pagination-item-active { border-color: #0E7490 !important; }
    .ump-page .ant-pagination-item-active a { color: #0E7490 !important; }
    @media (max-width: 900px) {
      .ump-filters { grid-template-columns: 1fr 1fr !important; }
    }
    @media (max-width: 560px) {
      .ump-filters { grid-template-columns: 1fr !important; }
    }
  `}</style>
);

/* ───────────────────────────────────────────── STYLE TOKENS (same as the rest of Paint Shop MIS) */
const S = {
  panel: {
    background: "#fff", border: "1px solid #F1F5F9",
    borderRadius: 16, padding: 16,
    boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
  },
  primaryBtnAntd: {
    background: "linear-gradient(135deg,#0E7490,#0891B2)",
    borderColor: "transparent", color: "#fff",
    borderRadius: 11, height: 40, fontWeight: 600,
    display: "inline-flex", alignItems: "center", gap: 7,
    boxShadow: "0 4px 14px -3px rgba(14,116,144,0.45)",
  },
  ghostBtnAntd: {
    background: "#fff", color: "#475569", border: "1px solid #E2E8F0",
    borderRadius: 11, height: 40, fontWeight: 600,
    display: "inline-flex", alignItems: "center", gap: 7,
  },
};