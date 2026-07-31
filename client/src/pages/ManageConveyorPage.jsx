import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import {
  Form, Row, Col, Select, InputNumber, Button, Table,
  Input, Empty, Skeleton, Spin, message, Modal,
} from "antd";
import {
  Settings2, Gauge, Timer, Layers3, RefreshCw, Target, Ban,
  CheckCircle2, BarChart3, Search, Building2,
  Save, RotateCcw, Trash2, Pencil, Zap, Clock, MapPin, X,
} from "lucide-react";

/* ============================================================
   ⚠ ASSUMPTIONS — VERIFY AGAINST YOUR ACTUAL BACKEND
   The hierarchy is Location → Plant → Shift → Conveyor.
   I don't have the Location model, so the lines below are
   educated guesses based on your Plant/Shift schema pattern.
   Search this file for "⚠ VERIFY" and adjust if your field/
   response names differ.

   1. GET /api/locations         -> { success, locations: [...] }  (guessed)
   2. Location fields assumed: locationName                        (guessed)
   3. GET /api/plants            -> { success, plants: [...] }     (confirmed earlier)
   4. Plant fields assumed: locationId (ref to Location), plantName,
      conveyors: [{ _id, conveyorName, status }]                   (guessed locationId)
   5. GET /api/shifts            -> { success, shifts: [...] }     (guessed)
   6. Shift fields assumed: shiftName, shiftType, workingHours,
      actualWorkingMinutes, plantId (ref to Plant)                 (guessed)
   7. GET /api/conveyor-strength -> { success, data: [...] }       (confirmed from
      your controller — getAllConfigurations returns { success, total, data })
   8. status is a String enum ["Active","Inactive"] on
      ConveyorStrength (confirmed from your schema).

   STATUS TOGGLE: your backend has no dedicated activate/deactivate
   route, and deleteConfiguration is a genuine hard delete. So the
   Activate/Deactivate actions below just resend the record's own
   current data through your EXISTING PUT /conveyor-strength/:id
   with only `status` flipped — no new backend route needed.

   DELETE — fixed in this pass: was wrapped in antd's <Popconfirm>,
   which clones its trigger and floats its "Yes/No" popup in a portal
   outside the table's DOM. With this table's scroll={{x:...}}, that
   popup can end up clipped/mispositioned so clicking "Yes" silently
   does nothing. Your own backend test (raw fetch, 200 OK) already
   proved the API itself is fine — so Delete confirmation now uses
   Modal.confirm instead, the exact same pattern Deactivate already
   uses successfully in this file. Diagnostic console.log lines are
   also added around the request so any future issue is visible in
   DevTools instead of failing silently.
============================================================ */

const api = axios.create({ baseURL: "/api" });

const EFFICIENCY_OPTIONS = [100, 95, 85, 75];

const resolveId = (val) => (val && typeof val === "object" ? val._id : val);

/* ⚠ VERIFY: field name for a shift's usable minutes per shift */
const getShiftMinutes = (shift) =>
  Number(shift?.actualWorkingMinutes ?? shift?.workingMinutes ?? shift?.netWorkingMinutes ?? 0);

/* Same formulas as before — mirrors the six computed fields that still
   exist on ConveyorStrength. No estimated-capacity math anywhere. */
const computeMetrics = ({ conveyorLength, conveyorSpeed, pitchDistance, availableTime, hangerEfficiency }) => {
  const cLen  = Number(conveyorLength)   || 0;
  const cSpd  = Number(conveyorSpeed)    || 0;
  const pitch = Number(pitchDistance)    || 0;
  const avail = Number(availableTime)    || 0;
  const eff   = Number(hangerEfficiency) || 100;

  const totalHangers            = pitch > 0 ? Math.round(cLen / pitch) : 0;
  const processTime             = cSpd  > 0 ? +(cLen / cSpd).toFixed(2) : 0;
  const totalRoundsShift        = processTime > 0 ? +(avail / processTime).toFixed(2) : 0;
  const hangerPerMinute         = pitch > 0 ? +(cSpd / pitch).toFixed(2) : 0;
  const availableHangerPerShift = Math.round(hangerPerMinute * avail) || 0;
  const effectiveHangerPerShift = Math.round(availableHangerPerShift * (eff / 100)) || 0;

  return {
    totalHangers, processTime, totalRoundsShift, hangerPerMinute,
    availableHangerPerShift, effectiveHangerPerShift,
  };
};

/* Rebuilds the full update payload your PUT endpoint expects, from a
   record's own stored data, with only `status` changed. This is how
   Activate/Deactivate work without any new backend route. */
const buildStatusPayload = (record, status) => ({
  locationId: resolveId(record.locationId),
  plantId: resolveId(record.plantId),
  conveyorId: record.conveyorId,
  shiftId: resolveId(record.shiftId),
  conveyorLength: record.conveyorLength,
  conveyorSpeed: record.conveyorSpeed,
  pitchDistance: record.pitchDistance,
  demandPerShift: record.demandPerShift,
  hangerEfficiency: record.hangerEfficiency,
  status,
});

/* Turns a caught axios error into a message that actually says what
   happened, instead of a generic fallback every time. In particular:
   err.response being completely absent means the request never got a
   reply at all — most commonly a CORS block (e.g. DELETE not listed
   in your server's allowed methods), the backend being down, or a
   wrong baseURL — NOT a validation problem on the server. */
const diagnoseError = (err, fallback) => {
  if (!err?.response) {
    return "Request never reached the server — check the backend is running, and that DELETE/PATCH are allowed in its CORS config (a common cause when PUT/POST work but this one doesn't).";
  }
  if (err.response.status === 404) {
    return "Not found on the server. It may already be gone, or this route isn't registered on your running backend yet.";
  }
  return err.response.data?.message || fallback;
};

/* ───────────────────────────────────────────── shared visual bits (same theme as PlantMasterPage, ~10% tighter) */
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
      {active ? "Active" : "Inactive"}
    </span>
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
  <div style={{ marginBottom: 11 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: hint ? 3 : 0 }}>
      <div style={{
        width: 20, height: 20, borderRadius: 6,
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
    {hint && <p style={{ margin: "3px 0 0 26px", fontSize: 9.5, color: "#94A3B8" }}>{hint}</p>}
  </div>
);

const IconBtn = ({ onClick, bg, fg, children, title }) => (
  <button onClick={onClick} title={title} style={{
    background: bg, color: fg, border: "none",
    width: 27, height: 27, borderRadius: 7,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0,
  }}>
    {children}
  </button>
);

/* Statistic-style card used for every computed KPI (Live Calculation panel + modal) */
const CalcChip = ({ icon: Icon, label, value, suffix, tone }) => {
  const green = tone === "green";
  return (
    <div style={{
      background: green ? "#F0FDF4" : "#F8FAFC",
      border: `1px solid ${green ? "#BBF7D0" : "#F1F5F9"}`,
      borderTop: `2px solid ${green ? "#22C55E" : "#E2E8F0"}`,
      borderRadius: 9, padding: "8px 7px 7px", textAlign: "center",
      boxShadow: "0 1px 2px rgba(15,23,42,0.05)",
    }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 3 }}>
        <Icon size={11} color={green ? "#15803D" : "#94A3B8"} />
      </div>
      <div style={{ fontSize: 7.5, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 800, color: green ? "#15803D" : "#0F172A", lineHeight: 1 }}>
        {value}
        {suffix && <span style={{ fontSize: 8, fontWeight: 500, marginLeft: 2, color: "#94A3B8" }}>{suffix}</span>}
      </div>
    </div>
  );
};

/* Dedicated KPI card for Demand Per Shift */
const DemandCard = ({ value }) => (
  <div style={{
    background: "#EFF6FF", border: "1px solid #BFDBFE", borderTop: "2px solid #3B82F6",
    borderRadius: 9, padding: "8px 7px 7px", textAlign: "center",
    boxShadow: "0 1px 2px rgba(15,23,42,0.05)",
  }}>
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 3 }}>
      <Target size={11} color="#1D4ED8" />
    </div>
    <div style={{ fontSize: 7.5, fontWeight: 700, color: "#3B82F6", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>
      Demand Per Shift
    </div>
    <div style={{ fontSize: 14.5, fontWeight: 800, color: "#1D4ED8", lineHeight: 1 }}>
      {value ?? "—"}
    </div>
    <div style={{ fontSize: 7, color: "#60A5FA", marginTop: 3 }}>Configured Production Target</div>
  </div>
);

/* Description-style value box, used for plain info/config fields (non-computed) */
const ValueBox = ({ children, tone }) => {
  const blue = tone === "blue";
  return (
    <div style={{
      background: blue ? "#EFF6FF" : "#F8FAFC",
      border: `1px solid ${blue ? "#BFDBFE" : "#F1F5F9"}`,
      borderRadius: 7, padding: "6px 9px",
      fontSize: 11, color: blue ? "#1D4ED8" : "#0F172A",
      fontWeight: blue ? 700 : 500,
      minHeight: 29, display: "flex", alignItems: "center", gap: 5,
      boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
    }}>
      {children ?? "—"}
    </div>
  );
};

const InfoField = ({ label, value, tone }) => (
  <div>
    <FieldLabel label={label} />
    <div style={{ marginTop: 4 }}><ValueBox tone={tone}>{value}</ValueBox></div>
  </div>
);

/* Bordered card wrapper used for each section inside the detail modal */
const DetailSection = ({ icon, label, children }) => (
  <div style={{
    border: "1px solid #F1F5F9", borderRadius: 11, background: "#fff",
    padding: 13, marginBottom: 11, boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
  }}>
    <SectionDivider icon={icon} label={label} />
    {children}
  </div>
);

/* ───────────────────────────────────────────── MAIN PAGE */
export default function ManageConveyorPage() {
  const [form] = Form.useForm();
  const pageTopRef = useRef(null);

  const [locations, setLocations]     = useState([]);
  const [plants, setPlants]           = useState([]);
  const [shifts, setShifts]           = useState([]);
  const [records, setRecords]         = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [editingId, setEditingId]     = useState(null);

  const [search, setSearch]           = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterPlant, setFilterPlant] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [detailOpen, setDetailOpen]     = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [formState, setFormState] = useState({
    locationId: undefined, plantId: undefined, conveyorId: undefined, shiftId: undefined,
    conveyorLength: undefined, conveyorSpeed: undefined, pitchDistance: undefined,
    demandPerShift: undefined, hangerEfficiency: 85, status: "Active",
  });

  /* ── Fetch ── */
  const fetchRecords = useCallback(async () => {
    try {
      setTableLoading(true);
      const res = await api.get("/conveyor-strength");
      setRecords(res.data.data || res.data.conveyorStrengths || res.data.records || res.data || []);
    } catch {
      message.error("Failed to load conveyor configurations");
    } finally {
      setTableLoading(false);
    }
  }, []);

  /* Reset antd's message duration on mount. message.config() is GLOBAL —
     if another page in this app set it very short (e.g. 0.5s), every
     message.xxx() call everywhere inherits that, including this page.
     This guarantees toasts here stay readable regardless of what else
     ran earlier in the session. */
  useEffect(() => {
    message.config({ duration: 4 });
  }, []);

  useEffect(() => {
    (async () => {
      setInitialLoading(true);
      try {
        const [locationsRes, plantsRes, shiftsRes] = await Promise.all([
          api.get("/locations"),
          api.get("/plants"),
          api.get("/shifts"),
        ]);
        setLocations(locationsRes.data.locations || locationsRes.data.data || []);
        setPlants(plantsRes.data.plants || []);
        setShifts(shiftsRes.data.shifts || shiftsRes.data.data || []);
      } catch {
        message.error("Failed to load locations, plants or shifts");
      } finally {
        setInitialLoading(false);
      }
      fetchRecords();
    })();
  }, [fetchRecords]);

  /* ── Derived selections for the form / live preview ── */
  const plantOptions = useMemo(
    () => plants.filter((p) => resolveId(p.locationId) === formState.locationId),
    [plants, formState.locationId]
  );

  const selectedPlant = useMemo(
    () => plants.find((p) => p._id === formState.plantId),
    [plants, formState.plantId]
  );
  const conveyorOptions = selectedPlant?.conveyors || [];

  const plantShifts = useMemo(
    () => shifts.filter((s) => resolveId(s.plantId ?? s.plant) === formState.plantId),
    [shifts, formState.plantId]
  );
  const selectedShift = plantShifts.find((s) => s._id === formState.shiftId);
  const availableTime = getShiftMinutes(selectedShift);

  const metrics = useMemo(
    () => computeMetrics({ ...formState, availableTime }),
    [formState, availableTime]
  );

  /* ── Form helpers ── */
  const handleValuesChange = (changed, all) => {
    if ("locationId" in changed) {
      form.setFieldsValue({ plantId: undefined, conveyorId: undefined, shiftId: undefined });
      setFormState({ ...all, plantId: undefined, conveyorId: undefined, shiftId: undefined });
      return;
    }
    if ("plantId" in changed) {
      form.setFieldsValue({ conveyorId: undefined, shiftId: undefined });
      setFormState({ ...all, conveyorId: undefined, shiftId: undefined });
      return;
    }
    setFormState(all);
  };

  const handleReset = () => {
    setEditingId(null);
    form.resetFields();
    setFormState({
      locationId: undefined, plantId: undefined, conveyorId: undefined, shiftId: undefined,
      conveyorLength: undefined, conveyorSpeed: undefined, pitchDistance: undefined,
      demandPerShift: undefined, hangerEfficiency: 85, status: "Active",
    });
  };

  const handleEdit = (record) => {
    const locationId = resolveId(record.locationId);
    const plantId = resolveId(record.plantId);
    const shiftId = resolveId(record.shiftId);
    setEditingId(record._id);
    const vals = {
      locationId,
      plantId,
      conveyorId: record.conveyorId,
      shiftId,
      conveyorLength: record.conveyorLength,
      conveyorSpeed: record.conveyorSpeed,
      pitchDistance: record.pitchDistance,
      demandPerShift: record.demandPerShift,
      hangerEfficiency: record.hangerEfficiency,
      status: record.status,
    };
    form.setFieldsValue(vals);
    setFormState(vals);
    pageTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ── Delete (hard delete — your service does configuration.deleteOne()) ──
     Confirmation goes through Modal.confirm (see confirmDelete below)
     instead of Popconfirm — see the note above that function for why. */
  const handleDelete = async (id) => {
    // Temporary diagnostics: your backend already tested clean (200 +
    // success via raw fetch), so if delete still doesn't visibly work,
    // these three lines show exactly which stage stops — "requested" never
    // appearing means confirmDelete's onOk isn't firing; "requested"
    // appearing but no "response" means the request hung or was blocked;
    // "response" appearing but the row not disappearing means fetchRecords()
    // or the render is the problem, not the delete itself.
    console.log("[ManageConveyor] delete requested for id:", id);
    try {
      const res = await api.delete(`/conveyor-strength/${id}`);
      console.log("[ManageConveyor] delete response:", res.status, res.data);
      message.success("Configuration deleted");
      if (editingId === id) handleReset();
      if (selectedRecord?._id === id) setDetailOpen(false);
      fetchRecords();
    } catch (err) {
      console.error("[ManageConveyor] delete failed:", err);
      // Modal instead of a toast here on purpose — this stays open until you
      // close it, so it can't vanish before you get to read it.
      Modal.error({
        title: "Delete failed",
        content: diagnoseError(err, "Delete failed"),
      });
    }
  };

  /* ── Delete confirmation — Modal.confirm, not Popconfirm ──
     Popconfirm works by cloning its trigger child and injecting its own
     onClick, then rendering its "Yes/No" popup in a portal that floats
     outside the table's DOM. In a table with scroll={{ x: ... }} (like
     this one), that popup can end up clipped or mispositioned, so it looks
     like clicking "Yes" does nothing even though the click technically
     lands somewhere else. Deactivate already uses Modal.confirm in this
     same file and that one isn't reported as broken — Delete now uses the
     identical, proven pattern instead of Popconfirm. */
  const confirmDelete = (record) => {
    Modal.confirm({
      title: "Delete this configuration?",
      content: `This permanently removes "${record.conveyorName || "this configuration"}" for ${record.plantName || "this plant"}. This cannot be undone.`,
      okText: "Delete", okType: "danger", cancelText: "Cancel",
      onOk: () => handleDelete(record._id),
    });
  };

  /* ── Activate — instant, non-destructive. Reuses the existing PUT
       endpoint with the record's own data and status flipped. ── */
  const handleActivateConfig = async (record) => {
    try {
      await api.put(`/conveyor-strength/${record._id}`, buildStatusPayload(record, "Active"));
      message.success("Configuration activated");
      if (selectedRecord?._id === record._id) setSelectedRecord({ ...selectedRecord, status: "Active" });
      fetchRecords();
    } catch (err) {
      message.error(diagnoseError(err, "Failed to activate configuration"));
    }
  };

  /* ── Deactivate — same PUT reuse, with a light confirm since it
       removes the configuration from active capacity planning. ── */
  const handleDeactivateConfig = (record) => {
    Modal.confirm({
      title: "Deactivate this configuration?",
      content: "It will be marked Inactive and excluded from active capacity planning. You can reactivate it anytime with one click.",
      okText: "Deactivate", okType: "danger",
      onOk: async () => {
        try {
          await api.put(`/conveyor-strength/${record._id}`, buildStatusPayload(record, "Inactive"));
          message.success("Configuration deactivated");
          if (selectedRecord?._id === record._id) setSelectedRecord({ ...selectedRecord, status: "Inactive" });
          fetchRecords();
        } catch (err) {
          message.error(diagnoseError(err, "Failed to deactivate configuration"));
        }
      },
    });
  };

  /* ── Submit ── */
  const handleFinish = async (values) => {
    const location = locations.find((l) => l._id === values.locationId);
    const plant = plants.find((p) => p._id === values.plantId);
    const conveyor = conveyorOptions.find((c) => c._id === values.conveyorId);
    const shift = plantShifts.find((s) => s._id === values.shiftId);

    if (!location || !plant || !conveyor || !shift) {
      message.error("Selected location, plant, conveyor or shift could not be resolved");
      return;
    }

    const shiftMinutes = getShiftMinutes(shift);
    const calc = computeMetrics({ ...values, availableTime: shiftMinutes });

    const payload = {
      locationId: location._id,
      plantId: plant._id,
      shiftId: shift._id,
      conveyorId: conveyor._id,
      locationName: location.locationName, // ⚠ VERIFY: Location field name
      plantName: plant.plantName,
      shiftName: shift.shiftName,
      conveyorName: conveyor.conveyorName,
      availableTime: shiftMinutes,
      conveyorLength: values.conveyorLength,
      conveyorSpeed: values.conveyorSpeed,
      pitchDistance: values.pitchDistance,
      demandPerShift: values.demandPerShift,
      hangerEfficiency: values.hangerEfficiency,
      totalHangers: calc.totalHangers,
      processTime: calc.processTime,
      totalRoundsShift: calc.totalRoundsShift,
      hangerPerMinute: calc.hangerPerMinute,
      availableHangerPerShift: calc.availableHangerPerShift,
      effectiveHangerPerShift: calc.effectiveHangerPerShift,
      status: values.status,
    };

    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/conveyor-strength/${editingId}`, payload);
        message.success("Configuration updated");
      } else {
        await api.post("/conveyor-strength", payload);
        message.success("Configuration saved");
      }
      handleReset();
      fetchRecords();
    } catch (err) {
      const raw = err?.response?.data?.message || "";
      if (raw.includes("E11000") || err?.response?.status === 409) {
        message.error("A configuration already exists for this Plant + Conveyor + Shift. Edit the existing entry instead.");
      } else {
        message.error(raw || "Save failed");
      }
    } finally {
      setSaving(false);
    }
  };

  /* ── Table data ── */
  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const matchesSearch = !q || [r.locationName, r.plantName, r.conveyorName, r.shiftName]
        .some((v) => v?.toLowerCase().includes(q));
      const matchesLocation = !filterLocation || resolveId(r.locationId) === filterLocation;
      const matchesPlant = !filterPlant || resolveId(r.plantId) === filterPlant;
      const matchesStatus = !filterStatus || r.status === filterStatus;
      return matchesSearch && matchesLocation && matchesPlant && matchesStatus;
    });
  }, [records, search, filterLocation, filterPlant, filterStatus]);

  /* Compact columns only — every engineering detail lives in the detail modal instead */
  const columns = [
    { title: "Location", dataIndex: "locationName", ellipsis: true, width: 120,
      render: (v) => (
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#334155" }}>
          <MapPin size={9} color="#94A3B8" /> {v || "—"}
        </span>
      ) },
    { title: "Plant", dataIndex: "plantName", ellipsis: true,
      sorter: (a, b) => (a.plantName || "").localeCompare(b.plantName || ""),
      render: (v) => <span style={{ fontWeight: 700, fontSize: 11, color: "#0F172A" }}>{v}</span> },
    { title: "Conveyor", dataIndex: "conveyorName", ellipsis: true,
      render: (v) => <span style={{ fontSize: 11, color: "#334155" }}>{v}</span> },
    { title: "Shift", dataIndex: "shiftName", ellipsis: true,
      render: (v) => <span style={{ fontSize: 11, color: "#334155" }}>{v}</span> },
    { title: "Demand", dataIndex: "demandPerShift", align: "right", width: 90,
      sorter: (a, b) => (a.demandPerShift || 0) - (b.demandPerShift || 0),
      render: (v) => <span style={{ fontWeight: 700, fontSize: 11, color: "#1D4ED8" }}>{v ?? "—"}</span> },
    { title: "Efficiency", dataIndex: "hangerEfficiency", align: "center", width: 90,
      render: (v) => <span style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>{v}%</span> },
    { title: "Status", dataIndex: "status", align: "center", width: 90,
      render: (v) => <StatusTag status={v} /> },
    { title: "", key: "actions", width: 105,
      render: (_, r) => (
        <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
          <IconBtn title="Edit" bg="#FFFBEB" fg="#B45309" onClick={() => handleEdit(r)}>
            <Pencil size={12} />
          </IconBtn>
          {r.status === "Active" ? (
            <IconBtn title="Deactivate" bg="#F1F5F9" fg="#475569" onClick={() => handleDeactivateConfig(r)}>
              <Ban size={12} />
            </IconBtn>
          ) : (
            <IconBtn title="Activate" bg="#F0FDF4" fg="#15803D" onClick={() => handleActivateConfig(r)}>
              <CheckCircle2 size={12} />
            </IconBtn>
          )}
          <IconBtn title="Delete" bg="#FFF1F2" fg="#BE123C" onClick={() => confirmDelete(r)}>
            <Trash2 size={12} />
          </IconBtn>
        </div>
      ) },
  ];

  const saveLabel = editingId ? "Update Configuration" : "Save Configuration";

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div className="mcp-page" style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'IBM Plex Sans', sans-serif", padding: "25px 29px" }}>
      <CSS />

      {/* ══ HEADER ══ */}
      <div ref={pageTopRef} style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 33, height: 33, borderRadius: 10,
            background: "linear-gradient(135deg,#0E7490,#0891B2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 5px 13px -4px rgba(14,116,144,0.4)",
          }}>
            <Settings2 size={16} color="#fff" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0 }}>
            Manage Conveyor Configuration
          </h1>
        </div>
        <p style={{ color: "#64748B", fontSize: 12, margin: "3px 0 0 42px" }}>
          Configure production capacity for every conveyor.
        </p>
      </div>

      {/* ══ FORM + LIVE CALCULATION ══ */}
      <Row gutter={18}>
        {/* ── LEFT: Configuration Form — full 2-column layout ── */}
        <Col xs={24} lg={10}>
          <div style={S.panel}>
            <SectionDivider icon={Settings2} label="Configuration Details" />
            {initialLoading ? (
              <Skeleton active paragraph={{ rows: 8 }} />
            ) : (
              <Form
                form={form}
                layout="vertical"
                initialValues={{ hangerEfficiency: 85, status: "Active" }}
                onValuesChange={handleValuesChange}
                onFinish={handleFinish}
                className="mcp-form"
              >
                <Row gutter={11}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="locationId" label={<FieldLabel label="Location" required />}
                      rules={[{ required: true, message: "Location is required" }]}>
                      <Select className="mcp-select" placeholder="Select location" showSearch optionFilterProp="children">
                        {locations.map((l) => (
                          <Select.Option key={l._id} value={l._id}>{l.locationName}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="plantId" label={<FieldLabel label="Plant" required />}
                      rules={[{ required: true, message: "Plant is required" }]}>
                      <Select
                        className="mcp-select" placeholder={formState.locationId ? "Select plant" : "Select a location first"}
                        disabled={!formState.locationId} showSearch optionFilterProp="children"
                      >
                        {plantOptions.map((p) => (
                          <Select.Option key={p._id} value={p._id}>{p.plantName}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={11}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="conveyorId" label={<FieldLabel label="Conveyor" required />}
                      rules={[{ required: true, message: "Conveyor is required" }]}>
                      <Select
                        className="mcp-select" placeholder={formState.plantId ? "Select conveyor" : "Select a plant first"}
                        disabled={!formState.plantId}
                      >
                        {conveyorOptions.map((c) => (
                          <Select.Option key={c._id} value={c._id} disabled={c.status === "Inactive"}>
                            {c.conveyorName} {c.status === "Inactive" && <span style={{ color: "#F43F5E" }}>(Inactive)</span>}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="shiftId" label={<FieldLabel label="Shift" required />}
                      rules={[{ required: true, message: "Shift is required" }]}>
                      <Select
                        className="mcp-select" placeholder={formState.plantId ? "Select shift" : "Select a plant first"}
                        disabled={!formState.plantId}
                      >
                        {plantShifts.map((s) => (
                          <Select.Option key={s._id} value={s._id}>
                            {s.shiftName} <span style={{ color: "#94A3B8" }}>— {s.shiftType} · {s.workingHours}</span>
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={11}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="conveyorLength" label={<FieldLabel label="Length (m)" required />}
                      rules={[
                        { required: true, message: "Required" },
                        { type: "number", min: 0.01, message: "Must be > 0" },
                      ]}>
                      <InputNumber className="mcp-input-number" style={{ width: "100%" }} min={0.01} step={0.1} placeholder="0" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="conveyorSpeed" label={<FieldLabel label="Speed (m/min)" required />}
                      rules={[
                        { required: true, message: "Required" },
                        { type: "number", min: 0.01, message: "Must be > 0" },
                      ]}>
                      <InputNumber className="mcp-input-number" style={{ width: "100%" }} min={0.01} step={0.1} placeholder="0" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={11}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="pitchDistance" label={<FieldLabel label="Pitch Distance (m)" required />}
                      rules={[
                        { required: true, message: "Required" },
                        { type: "number", min: 0.01, message: "Must be > 0" },
                      ]}>
                      <InputNumber className="mcp-input-number" style={{ width: "100%" }} min={0.01} step={0.01} placeholder="0" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="demandPerShift" label={<FieldLabel label="Demand / Shift" required />}
                      rules={[
                        { required: true, message: "Required" },
                        { type: "number", min: 1, message: "Must be > 0" },
                      ]}>
                      <InputNumber className="mcp-input-number" style={{ width: "100%" }} min={1} step={1} placeholder="0" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={11}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="hangerEfficiency" label={<FieldLabel label="Hanger Efficiency" required />}
                      rules={[{ required: true, message: "Required" }]}>
                      <Select className="mcp-select">
                        {EFFICIENCY_OPTIONS.map((v) => (
                          <Select.Option key={v} value={v}>{v}%</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="status" label={<FieldLabel label="Status" required />}
                      rules={[{ required: true, message: "Required" }]}>
                      <Select className="mcp-select">
                        <Select.Option value="Active">Active</Select.Option>
                        <Select.Option value="Inactive">Inactive</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <div style={{ display: "flex", gap: 9, marginTop: 3 }}>
                  <Button onClick={handleReset} icon={<RotateCcw size={13} />} style={S.ghostBtnAntd}>
                    Reset
                  </Button>
                  <Button
                    type="primary" htmlType="submit" loading={saving}
                    icon={<Save size={13} />} style={S.primaryBtnAntd}
                  >
                    {saveLabel}
                  </Button>
                </div>
              </Form>
            )}
          </div>
        </Col>

        {/* ── RIGHT: Live Calculation Card ── */}
        <Col xs={24} lg={14}>
          <div style={S.panel}>
            <SectionDivider icon={Zap} label="Live Calculation"
              hint="Working time is pulled from the selected shift's actual working minutes." />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 9 }} className="mcp-calc-grid">
              <CalcChip icon={Clock}        label="Working Time"      value={availableTime || "—"} suffix="min" />
              <CalcChip icon={Layers3}      label="Total Hangers"     value={metrics.totalHangers} />
              <CalcChip icon={Timer}        label="Process Time"      value={metrics.processTime} suffix="min" />
              <CalcChip icon={RefreshCw}    label="Rounds / Shift"    value={metrics.totalRoundsShift} />
              <CalcChip icon={Gauge}        label="Hanger / Min"      value={metrics.hangerPerMinute} />
              <CalcChip icon={BarChart3}    label="Avail. Hangers"    value={metrics.availableHangerPerShift} />
              <CalcChip icon={CheckCircle2} label="Effective Hangers" value={metrics.effectiveHangerPerShift} tone="green" />
              <DemandCard value={formState.demandPerShift} />
            </div>
          </div>
        </Col>
      </Row>

      {/* ══ FILTERS ══ */}
      <div style={{ ...S.panel, marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr auto", gap: 9 }} className="mcp-filters">
          <div style={{ position: "relative" }}>
            <Search size={14} style={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              color: "#94A3B8", pointerEvents: "none", zIndex: 1,
            }} />
            <Input
              className="mcp-input" style={{ paddingLeft: 31 }}
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search location, plant, conveyor, shift…"
            />
          </div>

          <Select
            className="mcp-select" allowClear placeholder="All Locations"
            value={filterLocation || undefined}
            onChange={(v) => setFilterLocation(v || "")}
          >
            {locations.map((l) => (
              <Select.Option key={l._id} value={l._id}>{l.locationName}</Select.Option>
            ))}
          </Select>

          <Select
            className="mcp-select" allowClear placeholder="All Plants"
            value={filterPlant || undefined}
            onChange={(v) => setFilterPlant(v || "")}
          >
            {plants.map((p) => (
              <Select.Option key={p._id} value={p._id}>{p.plantName}</Select.Option>
            ))}
          </Select>

          <Select
            className="mcp-select" allowClear placeholder="All Status"
            value={filterStatus || undefined}
            onChange={(v) => setFilterStatus(v || "")}
          >
            <Select.Option value="Active">Active</Select.Option>
            <Select.Option value="Inactive">Inactive</Select.Option>
          </Select>

          <Button onClick={fetchRecords} icon={<RefreshCw size={13} />} style={S.ghostBtnAntd}>
            Refresh
          </Button>
        </div>
      </div>

      {/* ══ TABLE (compact — full detail lives in the modal) ══ */}
      <div style={{ ...S.panel, padding: 0, overflow: "hidden", marginTop: 13 }}>
        <div style={{
          padding: "12px 18px", borderBottom: "1px solid #F1F5F9",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: 0 }}>Conveyor Configurations</h2>
          <span style={{ fontSize: 11, color: "#94A3B8" }}>{filteredRecords.length} record{filteredRecords.length === 1 ? "" : "s"}</span>
        </div>
        <Table
          dataSource={filteredRecords} columns={columns} rowKey="_id" size="middle"
          loading={{ spinning: tableLoading, indicator: <Spin size="large" /> }}
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          scroll={{ x: 990 }}
          onRow={(r) => ({
            onClick: () => { setSelectedRecord(r); setDetailOpen(true); },
            style: { cursor: "pointer" },
          })}
          locale={{
            emptyText: (
              <div style={{ padding: "44px 0" }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<span style={{ color: "#64748B" }}>No configurations found. Save one above to get started.</span>} />
              </div>
            ),
          }}
        />
      </div>

      {/* ══ DETAIL MODAL — opens on row click instead of expanding inline ══ */}
      <Modal
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={640}
        centered
        destroyOnHidden
        closeIcon={<X size={15} color="#fff" />}
        styles={{ content: { padding: 0, borderRadius: 15, overflow: "hidden" }, body: { padding: 0 } }}
      >
        {selectedRecord && (
          <div>
            {/* colored top navbar */}
            <div style={{
              background: "linear-gradient(135deg,#0E7490,#155E75)",
              padding: "15px 18px 13px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <div style={{
                  width: 35, height: 35, borderRadius: 9,
                  background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Settings2 size={16} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: "#fff" }}>{selectedRecord.conveyorName}</h2>
                  <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{
                      fontSize: 9.5, fontWeight: 600, color: "#fff",
                      background: "rgba(255,255,255,0.15)", padding: "2px 7px", borderRadius: 5,
                    }}>{selectedRecord.plantName}</span>
                    <StatusTag status={selectedRecord.status} />
                    <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 3 }}>
                      <MapPin size={8} />{selectedRecord.locationName}
                    </span>
                    <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.65)" }}>· {selectedRecord.shiftName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* body */}
            <div style={{ padding: "14px 18px 4px" }}>
              <DetailSection icon={Building2} label="Plant Information">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }} className="mcp-info-grid">
                  <InfoField label="Location" value={
                    <><MapPin size={10} color="#94A3B8" /> {selectedRecord.locationName}</>
                  } />
                  <InfoField label="Plant" value={selectedRecord.plantName} />
                  <InfoField label="Shift" value={selectedRecord.shiftName} />
                  <InfoField label="Conveyor" value={selectedRecord.conveyorName} />
                </div>
              </DetailSection>

              <DetailSection icon={Settings2} label="Configuration">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }} className="mcp-modal-grid">
                  <InfoField label="Conveyor Length" value={`${selectedRecord.conveyorLength} m`} />
                  <InfoField label="Conveyor Speed" value={`${selectedRecord.conveyorSpeed} m/min`} />
                  <InfoField label="Pitch Distance" value={`${selectedRecord.pitchDistance} m`} />
                  <InfoField label="Demand / Shift" value={selectedRecord.demandPerShift} tone="blue" />
                  <InfoField label="Hanger Efficiency" value={`${selectedRecord.hangerEfficiency}%`} />
                  <InfoField label="Working Time" value={`${selectedRecord.availableTime} min`} />
                </div>
              </DetailSection>

              <DetailSection icon={Zap} label="Calculated Values">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }} className="mcp-modal-grid">
                  <CalcChip icon={Layers3}      label="Total Hangers"     value={selectedRecord.totalHangers} />
                  <CalcChip icon={Timer}        label="Process Time"      value={selectedRecord.processTime} suffix="min" />
                  <CalcChip icon={RefreshCw}    label="Rounds / Shift"    value={selectedRecord.totalRoundsShift} />
                  <CalcChip icon={Gauge}        label="Hanger / Min"      value={selectedRecord.hangerPerMinute} />
                  <CalcChip icon={BarChart3}    label="Avail. Hangers"    value={selectedRecord.availableHangerPerShift} />
                  <CalcChip icon={CheckCircle2} label="Effective Hangers" value={selectedRecord.effectiveHangerPerShift} tone="green" />
                </div>
              </DetailSection>

              <div style={{ fontSize: 10, color: "#94A3B8", margin: "2px 0 11px" }}>
                Created {selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toLocaleString() : "—"}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 15 }}>
                <Button onClick={() => setDetailOpen(false)} style={{ ...S.ghostBtnAntd, justifyContent: "center", height: 33 }}>
                  Close
                </Button>
                <div style={{ display: "flex", gap: 7 }}>
                  <Button
                    onClick={() => { setDetailOpen(false); handleEdit(selectedRecord); }}
                    style={{ ...S.amberBtnAntd, flex: 1, justifyContent: "center", height: 33 }} icon={<Pencil size={12} />}
                  >
                    Edit
                  </Button>
                  {selectedRecord.status === "Active" ? (
                    <Button
                      onClick={() => handleDeactivateConfig(selectedRecord)}
                      style={{ ...S.neutralBtnAntd, flex: 1, justifyContent: "center", height: 33 }} icon={<Ban size={12} />}
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleActivateConfig(selectedRecord)}
                      style={{ ...S.successBtnAntd, flex: 1, justifyContent: "center", height: 33 }} icon={<CheckCircle2 size={12} />}
                    >
                      Activate
                    </Button>
                  )}
                  <Button
                    style={{ ...S.dangerBtnAntd, flex: 1, justifyContent: "center", height: 33 }} icon={<Trash2 size={12} />}
                    onClick={() => confirmDelete(selectedRecord)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ───────────────────────────────────────────── GLOBAL CSS (scoped, same theme, ~10% tighter) */
const CSS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@600&display=swap');

    .mcp-page .mcp-select .ant-select-selector {
      background: #F8FAFC !important; border: 1px solid #E2E8F0 !important;
      border-radius: 9px !important;
      min-height: 36px !important; display: flex !important; align-items: center !important;
    }
    .mcp-page .ant-select-focused .ant-select-selector {
      border-color: #0E7490 !important; box-shadow: 0 0 0 3px rgba(14,116,144,0.12) !important;
      background: #fff !important;
    }
    .mcp-page .mcp-input-number.ant-input-number {
      background: #F8FAFC !important; border: 1px solid #E2E8F0 !important;
      border-radius: 9px !important;
      width: 100%; height: 36px; display: flex; align-items: center;
    }
    .mcp-page .mcp-input-number.ant-input-number-focused {
      border-color: #0E7490 !important; box-shadow: 0 0 0 3px rgba(14,116,144,0.12) !important;
      background: #fff !important;
    }
    .mcp-page .mcp-input.ant-input {
      background: #F8FAFC !important; border: 1px solid #E2E8F0 !important;
      border-radius: 9px !important; height: 36px;
    }
    .mcp-page .mcp-input.ant-input:focus {
      border-color: #0E7490 !important; box-shadow: 0 0 0 3px rgba(14,116,144,0.12) !important;
      background: #fff !important;
    }
    .mcp-page .mcp-form .ant-form-item { margin-bottom: 13px; }
    .mcp-page .ant-form-item-label { padding-bottom: 3px; }
    .mcp-page .ant-table-thead > tr > th {
      background: #F8FAFC !important; color: #64748B !important;
      font-size: 10px !important; font-weight: 700 !important;
      text-transform: uppercase; letter-spacing: 0.4px;
      border-bottom: 1px solid #F1F5F9 !important;
    }
    .mcp-page .ant-table-thead > tr > th::before { display: none !important; }
    .mcp-page .ant-table-tbody > tr > td {
      border-bottom: 1px solid #F8FAFC !important;
      padding: 8px 14px !important;
    }
    .mcp-page .ant-table-tbody > tr:hover > td { background: #F0FDFF !important; }
    .mcp-page .ant-pagination-item-active { border-color: #0E7490 !important; }
    .mcp-page .ant-pagination-item-active a { color: #0E7490 !important; }
    .mcp-info-grid, .mcp-modal-grid { gap: 7px 11px; }
    @media (max-width: 1080px) {
      .mcp-filters { grid-template-columns: 1fr 1fr 1fr !important; }
    }
    @media (max-width: 960px) {
      .mcp-calc-grid { grid-template-columns: repeat(2, 1fr) !important; }
    }
    @media (max-width: 768px) {
      .mcp-modal-grid { grid-template-columns: repeat(2, 1fr) !important; }
    }
    @media (max-width: 560px) {
      .mcp-filters { grid-template-columns: 1fr !important; }
      .mcp-info-grid, .mcp-modal-grid { grid-template-columns: 1fr !important; }
    }
  `}</style>
);

/* ───────────────────────────────────────────── STYLE TOKENS (same theme, ~10% tighter) */
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
  amberBtnAntd: {
    background: "#FFFBEB", color: "#B45309", border: "1px solid #FEF3C7",
    borderRadius: 10, height: 36, fontWeight: 600,
    display: "inline-flex", alignItems: "center", gap: 6,
  },
  neutralBtnAntd: {
    background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0",
    borderRadius: 10, height: 36, fontWeight: 600,
    display: "inline-flex", alignItems: "center", gap: 6,
  },
  successBtnAntd: {
    background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0",
    borderRadius: 10, height: 36, fontWeight: 600,
    display: "inline-flex", alignItems: "center", gap: 6,
  },
  dangerBtnAntd: {
    background: "#FFF1F2", color: "#BE123C", border: "1px solid #FFE4E6",
    borderRadius: 10, height: 36, fontWeight: 600,
    display: "inline-flex", alignItems: "center", gap: 6,
  },
};