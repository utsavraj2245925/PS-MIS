import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  Form, Row, Col, Select, Input, Button, Table, Tag,
  Modal, Drawer, Skeleton, Spin, Empty, message, Divider, Space, Tooltip,
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

   NOTE ON THIS PASS: only visual/layout changes (sizing, spacing, columns,
   responsiveness). No function names, handlers, API calls, or logic were
   touched — everything still wires up exactly as before.
============================================================ */

const api = axios.create({ baseURL: "/api" });

const ROLE_META = {
  superAdmin: { label: "Super Admin", color: "gold" },
  plantAdmin: { label: "Plant Admin", color: "blue" },
  manager: { label: "Manager", color: "cyan" },
  user: { label: "User", color: "default" },
};

const resolveId = (val) => (val && typeof val === "object" ? val._id : val);

/* Turns a caught axios error into a message that actually explains what
   happened, instead of a generic fallback every time.
   - No err.response at all -> the request never got a reply (network
     block, CORS, or wrong URL) — not a validation problem.
   - 401 -> auth token missing/invalid/expired. This page's routes all
     require isAuthenticated server-side, so this is worth checking
     specifically here.
   - Otherwise -> whatever the server actually said. */
const diagnoseError = (err, fallback) => {
  if (!err?.response) {
    return "Request never reached the server — check the backend is running and that this request isn't being blocked (CORS, wrong URL, or network issue).";
  }
  if (err.response.status === 401) {
    return "Not authorized (401) — your session/token may be missing or expired. Try logging in again.";
  }
  if (err.response.status === 404) {
    return "Not found on the server. It may already be gone, or this route isn't registered on your running backend yet.";
  }
  return err.response.data?.message || fallback;
};

const showLocationFor = (role) => role && role !== "superAdmin";
const showPlantFor = (role) => role === "manager" || role === "user";
const showShiftFor = (role) => role === "user";
const showConveyorFor = (role) => role === "user";

/* ───────────────────────────────────────────── shared visual bits (same theme as the rest of Paint Shop MIS, tightened) */
const StatusTag = ({ status }) => {
  const active = status === "Active";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: active ? "#DCFCE7" : "#FFF1F2",
      color: active ? "#15803D" : "#BE123C",
      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: 999,
        background: active ? "#22C55E" : "#F43F5E", flexShrink: 0,
      }} />
      {active ? "Active" : "Inactive"}
    </span>
  );
};

const RoleTag = ({ role }) => {
  const meta = ROLE_META[role] || { label: role || "—", color: "default" };
  return (
    <Tag color={meta.color} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 600, fontSize: 10, borderRadius: 999, padding: "1px 8px" }}>
      <Shield size={9} /> {meta.label}
    </Tag>
  );
};

const FieldLabel = ({ icon: Icon, label, required }) => (
  <span style={{
    display: "flex", alignItems: "center", gap: 4,
    fontSize: 9.5, fontWeight: 600, color: "#475569", letterSpacing: 0.2,
  }}>
    {Icon && <Icon size={10} color="#94A3B8" />}
    {label}
    {required && <span style={{ color: "#F43F5E" }}>*</span>}
  </span>
);

const SectionDivider = ({ icon: Icon, label, hint }) => (
  <div style={{ margin: "14px 0 11px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: hint ? 3 : 0 }}>
      <div style={{
        width: 19, height: 19, borderRadius: 6,
        background: "#ECFEFF", border: "1px solid rgba(14,116,144,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={10} color="#0E7490" />
      </div>
      <span style={{ fontSize: 8.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "#F1F5F9" }} />
    </div>
    {hint && <p style={{ margin: "3px 0 0 25px", fontSize: 9.5, color: "#94A3B8" }}>{hint}</p>}
  </div>
);

const IconBtn = ({ onClick, bg, fg, children, title }) => (
  <button onClick={onClick} title={title} style={{
    background: bg, color: fg, border: "none",
    width: 26, height: 26, borderRadius: 7,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0,
  }}>
    {children}
  </button>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
    <div style={{
      width: 25, height: 25, borderRadius: 7, background: "#F8FAFC", border: "1px solid #F1F5F9",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
    }}>
      <Icon size={12} color="#0E7490" />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0F172A", marginTop: 2, wordBreak: "break-word" }}>{value ?? "—"}</div>
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

  /* Reset antd's message duration on mount. message.config() is GLOBAL —
     if another page/file in this app set it very short (e.g. 0.5s),
     every message.xxx() call everywhere inherits that, including here.
     This guarantees toasts on this page stay readable regardless of
     what else ran earlier in the session. */
  useEffect(() => {
    message.config({ duration: 4 });
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
      // Modal instead of a toast here on purpose — this stays open until you
      // close it, so it can't vanish before you get to read it.
      Modal.error({
        title: "Delete failed",
        content: diagnoseError(err, "Delete failed"),
      });
    }
  };

  const handleToggleStatus = async (record) => {
    const nextStatus = record.status === "Active" ? "Inactive" : "Active";
    try {
      await api.patch(`/users/${record._id}/status`, { status: nextStatus });
      message.success(`User ${nextStatus === "Active" ? "activated" : "deactivated"}`);
      fetchUsers();
    } catch (err) {
      message.error(diagnoseError(err, "Failed to update status"));
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
      render: (v) => <span style={{ fontWeight: 700, fontSize: 11.5, color: "#0F172A" }}>{v}</span> },
    { title: "Email", dataIndex: "email", ellipsis: true,
      render: (v) => <span style={{ fontSize: 11.5, color: "#334155" }}>{v}</span> },
    { title: "Role", dataIndex: "role", width: 112,
      filters: Object.entries(ROLE_META).map(([value, meta]) => ({ text: meta.label, value })),
      onFilter: (value, record) => record.role === value,
      render: (v) => <RoleTag role={v} /> },
    { title: "Location", dataIndex: "locationName", ellipsis: true, width: 115,
      render: (v) => v ? (
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#334155" }}>
          <MapPin size={9} color="#94A3B8" /> {v}
        </span>
      ) : <span style={{ color: "#CBD5E1" }}>—</span> },
    { title: "Plant", dataIndex: "plantName", ellipsis: true, width: 105,
      render: (v) => v || <span style={{ color: "#CBD5E1" }}>—</span> },
    { title: "Shift", dataIndex: "shiftName", ellipsis: true, width: 95,
      render: (v) => v || <span style={{ color: "#CBD5E1" }}>—</span> },
    { title: "Conveyor", dataIndex: "conveyorName", ellipsis: true, width: 105,
      render: (v) => v || <span style={{ color: "#CBD5E1" }}>—</span> },
    { title: "Status", dataIndex: "status", align: "center", width: 88,
      filters: [{ text: "Active", value: "Active" }, { text: "Inactive", value: "Inactive" }],
      onFilter: (value, record) => record.status === value,
      render: (v) => <StatusTag status={v} /> },
    { title: "Created Date", dataIndex: "createdAt", width: 112,
      sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
      render: (v) => <span style={{ fontSize: 11, color: "#64748B" }}>{v ? new Date(v).toLocaleDateString() : "—"}</span> },
    { title: "", key: "actions", width: 130, fixed: "right",
      render: (_, r) => (
        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View">
            <IconBtn bg="#F0F9FF" fg="#0369A1" onClick={() => handleViewUser(r)}>
              <Eye size={12} />
            </IconBtn>
          </Tooltip>
          <Tooltip title="Edit">
            <IconBtn bg="#FFFBEB" fg="#B45309" onClick={() => handleEditUser(r)}>
              <UserPen size={12} />
            </IconBtn>
          </Tooltip>
          <Tooltip title={r.status === "Active" ? "Deactivate" : "Activate"}>
            <IconBtn
              bg={r.status === "Active" ? "#FFF7ED" : "#F0FDF4"}
              fg={r.status === "Active" ? "#C2410C" : "#15803D"}
              onClick={() => handleToggleStatus(r)}
            >
              {r.status === "Active" ? <PowerOff size={12} /> : <Power size={12} />}
            </IconBtn>
          </Tooltip>
          <Tooltip title="Delete">
            <IconBtn
              bg="#FFF1F2" fg="#BE123C"
              onClick={() =>
                Modal.confirm({
                  title: "Delete this user?",
                  content: "This action permanently removes the user.",
                  okText: "Delete", cancelText: "Cancel", okType: "danger",
                  onOk: () => handleDeleteUser(r._id),
                })
              }
            >
              <Trash2 size={12} />
            </IconBtn>
          </Tooltip>
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
        backdropFilter: "blur(6px)", padding: "15px 22px 12px", borderBottom: "1px solid #F1F5F9",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 31, height: 31, borderRadius: 10,
              background: "linear-gradient(135deg,#0E7490,#0891B2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 5px 13px -4px rgba(14,116,144,0.4)",
            }}>
              <Users size={16} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 19, fontWeight: 700, color: "#0F172A", margin: 0 }}>Manage Users</h1>
              <p style={{ color: "#64748B", fontSize: 11.5, margin: "2px 0 0" }}>
                {filteredUsers.length} of {users.length} user{users.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <Button onClick={handleRefresh} icon={<RefreshCcw size={13} />} style={S.ghostBtnAntd}>Refresh</Button>
            <Button onClick={handleExportExcel} icon={<Download size={13} />} style={S.ghostBtnAntd}>Export Excel</Button>
            <Button type="primary" onClick={handleAddUser} icon={<UserPlus size={13} />} style={S.primaryBtnAntd}>Add User</Button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr", gap: 8, marginTop: 13 }} className="ump-filters">
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", zIndex: 1 }} />
            <Input
              className="ump-input" style={{ paddingLeft: 31 }}
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
      <div style={{ padding: "14px 22px 24px" }}>
        <div style={{ ...S.panel, padding: 0, overflow: "hidden" }}>
          {initialLoading ? (
            <div style={{ padding: 18 }}><Skeleton active paragraph={{ rows: 8 }} /></div>
          ) : (
            <Table
              dataSource={filteredUsers} columns={columns} rowKey="_id" size="small"
              loading={{ spinning: tableLoading, indicator: <Spin size="large" /> }}
              pagination={{ pageSize: 10, pageSizeOptions: [10, 20, 50, 100], showSizeChanger: true }}
              scroll={{ x: 1100 }}
              locale={{
                emptyText: (
                  <div style={{ padding: "42px 0" }}>
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
        width={680}
        centered
        destroyOnHidden
        closeIcon={<X size={15} color="#64748B" />}
        title={null}
        styles={{ content: { padding: 0, borderRadius: 15, overflow: "hidden" }, body: { padding: 0, maxHeight: "82vh", display: "flex", flexDirection: "column" } }}
      >
        <div style={{ background: "linear-gradient(135deg,#0E7490,#155E75)", padding: "13px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9, background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {isEditMode ? <UserPen size={15} color="#fff" /> : <UserPlus size={15} color="#fff" />}
            </div>
            <h2 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: "#fff" }}>
              {isEditMode ? "Edit User" : "Add New User"}
            </h2>
          </div>
        </div>

        <div style={{ padding: "4px 20px 0", overflowY: "auto", flex: 1 }}>
          {editLoading ? (
            <div style={{ padding: 20 }}><Skeleton active paragraph={{ rows: 10 }} /></div>
          ) : (
            <Form
              form={form}
              layout="vertical"
              className="ump-form"
              initialValues={{ status: "Active" }}
              onFinish={handleFinish}
            >
              <SectionDivider icon={Users} label="Basic Information" />
              <Row gutter={10}>
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

              <Row gutter={10}>
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

              <Row gutter={10}>
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
                  <Row gutter={10}>
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
                  <Row gutter={10}>
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

              <Divider style={{ margin: "5px 0 13px" }} />
            </Form>
          )}
        </div>

        {/* Sticky footer actions */}
        <div style={{
          padding: "11px 20px", borderTop: "1px solid #F1F5F9", background: "#fff",
          display: "flex", justifyContent: "flex-end", gap: 8,
        }}>
          <Button onClick={handleModalClose} style={S.ghostBtnAntd}>Cancel</Button>
          <Button
            type="primary" loading={saving} icon={<Save size={13} />}
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
        width={380}
        closeIcon={<X size={15} />}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: "#ECFEFF",
              border: "1px solid rgba(14,116,144,0.2)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Eye size={14} color="#0E7490" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14 }}>User Details</span>
          </div>
        }
      >
        {viewingUser && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
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

/* ───────────────────────────────────────────── GLOBAL CSS (scoped, same theme as the rest of Paint Shop MIS, tightened) */
const CSS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

    .ump-page .ump-select .ant-select-selector {
      background: #F8FAFC !important; border: 1px solid #E2E8F0 !important;
      border-radius: 9px !important;
      min-height: 36px !important; display: flex !important; align-items: center !important;
    }
    .ump-page .ant-select-focused .ant-select-selector {
      border-color: #0E7490 !important; box-shadow: 0 0 0 3px rgba(14,116,144,0.12) !important;
      background: #fff !important;
    }
    .ump-page .ump-input.ant-input, .ump-page .ump-input.ant-input-affix-wrapper {
      background: #F8FAFC !important; border: 1px solid #E2E8F0 !important;
      border-radius: 9px !important; height: 36px;
    }
    .ump-page .ump-input.ant-input:focus, .ump-page .ump-input.ant-input-affix-wrapper-focused {
      border-color: #0E7490 !important; box-shadow: 0 0 0 3px rgba(14,116,144,0.12) !important;
      background: #fff !important;
    }
    .ump-page .ump-form .ant-form-item { margin-bottom: 12px; }
    .ump-page .ant-form-item-label { padding-bottom: 3px; }
    .ump-page .ant-table-thead > tr > th {
      background: #F8FAFC !important; color: #64748B !important;
      font-size: 10px !important; font-weight: 700 !important;
      text-transform: uppercase; letter-spacing: 0.4px;
      border-bottom: 1px solid #F1F5F9 !important;
      padding: 8px 13px !important;
    }
    .ump-page .ant-table-thead > tr > th::before { display: none !important; }
    .ump-page .ant-table-tbody > tr > td {
      border-bottom: 1px solid #F8FAFC !important;
      padding: 6px 13px !important;
    }
    .ump-page .ant-table-tbody > tr:hover > td { background: #F0FDFF !important; }
    .ump-page .ant-pagination-item-active { border-color: #0E7490 !important; }
    .ump-page .ant-pagination-item-active a { color: #0E7490 !important; }
    .ump-page .ant-pagination { font-size: 12px !important; }
    @media (max-width: 900px) {
      .ump-filters { grid-template-columns: 1fr 1fr !important; }
    }
    @media (max-width: 560px) {
      .ump-filters { grid-template-columns: 1fr !important; }
    }
  `}</style>
);

/* ───────────────────────────────────────────── STYLE TOKENS (same as the rest of Paint Shop MIS, tightened) */
const S = {
  panel: {
    background: "#fff", border: "1px solid #F1F5F9",
    borderRadius: 15, padding: 14,
    boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
  },
  primaryBtnAntd: {
    background: "linear-gradient(135deg,#0E7490,#0891B2)",
    borderColor: "transparent", color: "#fff",
    borderRadius: 10, height: 36, fontWeight: 600,
    display: "inline-flex", alignItems: "center", gap: 6,
    boxShadow: "0 4px 13px -3px rgba(14,116,144,0.45)",
  },
  ghostBtnAntd: {
    background: "#fff", color: "#475569", border: "1px solid #E2E8F0",
    borderRadius: 10, height: 36, fontWeight: 600,
    display: "inline-flex", alignItems: "center", gap: 6,
  },
};