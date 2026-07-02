import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import {
  Card, Table, Select, Input, InputNumber, TimePicker,
  Button, Tag, Divider, Tooltip, message, Spin, Empty, Modal,
} from "antd";
import {
  Factory, Package, Boxes, AlertTriangle, Users, Clock3, FlaskConical,
  RefreshCcw, Download, Save, Plus, Trash2, ShieldAlert, RotateCcw,
  CalendarDays, MapPin, UserCircle2, Sun, Moon, ChevronRight, TrendingUp, LogOut,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────
   CONSTANTS & UTILITIES
────────────────────────────────────────────────────────── */
const API = axiosInstance;

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const wordCount = (t = "") => t.trim().split(/\s+/).filter(Boolean).length;
const minutesBetween = (s, e) => {
  if (!s || !e) return 0;
  const d = dayjs(e).diff(dayjs(s), "minute");
  return d > 0 ? d : 0;
};

const emptyDowntimeRow = () => ({
  key: uid(), type: "Planned", downtimeTypeId: null,
  startTime: null, endTime: null, duration: 0, remark: "",
});

const MATERIAL_TYPE_LABELS = {
  powderItems:   "Powder Items",
  chemicalItems: "Chemical Items",
  usefulItems:   "Useful Items",
};
const MATERIAL_TYPE_COLORS = {
  powderItems: "purple",
  chemicalItems: "teal",
  usefulItems: "blue",
};

/* ──────────────────────────────────────────────────────────
   STYLE TOKENS
────────────────────────────────────────────────────────── */
const CARD  = "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden";
const TH    = "text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 bg-slate-50 border-b border-slate-200 whitespace-nowrap";
const TD    = "px-3 py-2.5 border-b border-slate-100 text-sm text-slate-700";
const LABEL = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5";
const FIELD = "bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium";

const SectionHead = ({ icon: Icon, color = "text-teal-600", border = "#0d9488", children }) => (
  <div className="flex items-center gap-2" style={{ borderLeft: `4px solid ${border}`, paddingLeft: 14 }}>
    <Icon size={16} className={color} />
    <h2 className="text-base font-bold text-slate-800 m-0">{children}</h2>
  </div>
);

const KpiCard = ({ icon: Icon, label, value, tone }) => {
  const tones = {
    cyan:   "bg-cyan-50 border-cyan-200 text-cyan-700",
    blue:   "bg-blue-50 border-blue-200 text-blue-700",
    red:    "bg-red-50 border-red-200 text-red-600",
    amber:  "bg-amber-50 border-amber-200 text-amber-600",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    slate:  "bg-slate-100 border-slate-200 text-slate-700",
    green:  "bg-green-50 border-green-200 text-green-700",
  };
  return (
    <div className={`rounded-2xl border p-4 shadow-sm flex flex-col gap-1 ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <Icon size={18} className="opacity-70" />
        <ChevronRight size={13} className="opacity-30" />
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className="text-xs opacity-70">{label}</div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   MAIN PAGE
────────────────────────────────────────────────────────── */
export default function UserProductionPage() {
  /* ── auth + routing ── */
  const { logout, user, setUser } = useAuth();
  const navigate   = useNavigate();
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);

  /* ── page states ── */
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving]           = useState(false);
  const [exporting, setExporting]     = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [now, setNow] = useState(dayjs());

  /* ── master data ── */
  const [models, setModels]           = useState([]);
  const [partsByModel, setPartsByModel] = useState({});
  const [partsLoading, setPartsLoading] = useState({});
  const [rejectTypes, setRejectTypes] = useState([]);
  const [reworkTypes, setReworkTypes] = useState([]);
  const [downtimeTypes, setDowntimeTypes] = useState([]);
  const [materials, setMaterials]     = useState([]);

  /* ── shift ── */
  const [shift, setShift] = useState("Day");

  /* ── production entry form ── */
  const [selectedModelId, setSelectedModelId]     = useState(null);
  const [loadingCurrentParts, setLoadingCurrentParts] = useState(false);
  const [currentModelParts, setCurrentModelParts] = useState([]);
  const [currentPartQtys, setCurrentPartQtys]     = useState({}); // {partId: number}
  // production log: [{key, modelId, modelName, parts:[{partId,partName,qty}]}]
  const [productionLog, setProductionLog]         = useState([]);

  /* ── defect form ── */
  const [defectForm, setDefectForm] = useState({
    modelId: null, partId: null,
    defectType: null, defectTypeId: null, quantity: 0,
  });
  const [defectModelParts, setDefectModelParts] = useState([]);
  // defect log: [{key, modelId, modelName, partId, partName, defectType, defectTypeId, defectTypeName, quantity}]
  const [defectLog, setDefectLog] = useState([]);

  /* ── manpower ── */
  const [requiredManpower, setRequiredManpower]   = useState(0);
  const [availableManpower, setAvailableManpower] = useState(0);

  /* ── downtime ── */
  const [downtimes, setDowntimes] = useState([]);

  /* ── consumable form ── */
  const [consumableMaterialType, setConsumableMaterialType] = useState("powderItems");
  const [consumableForm, setConsumableForm] = useState({ materialId: null, quantity: 0 });
  // consumable log: [{key, materialId, materialName, materialType, measurementType, quantity}]
  const [consumableLog, setConsumableLog] = useState([]);

  /* ── live clock ── */
  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ════════════════════════════════════════════════════════
     FETCHERS  (same names as source doc)
  ════════════════════════════════════════════════════════ */

  const fetchModels = useCallback(async () => {
    const { data } = await API.get("/models");
    setModels(data?.data || data?.models || data || []);
  }, []);

  const fetchPartsForModel = useCallback(async (modelId) => {
    if (!modelId) return [];
    if (partsByModel[modelId]) return partsByModel[modelId];
    setPartsLoading((p) => ({ ...p, [modelId]: true }));
    try {
      const { data } = await API.get(`/parts/by-model/${modelId}`);
      const parts = data?.data || data?.parts || data || [];
      setPartsByModel((p) => ({ ...p, [modelId]: parts }));
      return parts;
    } catch {
      return [];
    } finally {
      setPartsLoading((p) => ({ ...p, [modelId]: false }));
    }
  }, [partsByModel]);

  const fetchRejectTypes = useCallback(async () => {
    const { data } = await API.get("/defects/reject");
    setRejectTypes(data?.data || []);
  }, []);

  const fetchReworkTypes = useCallback(async () => {
    const { data } = await API.get("/defects/rework");
    setReworkTypes(data?.data || []);
  }, []);

  const fetchDowntimeTypes = useCallback(async () => {
    const { data } = await API.get("/downtime-types");
    setDowntimeTypes(data?.data || []);
  }, []);

  const fetchMaterials = useCallback(async () => {
    const { data } = await API.get("/materials");
    setMaterials(data?.data || []);
  }, []);

  const loadEverything = useCallback(async () => {
    setPageLoading(true);
    try {
    const response =  await Promise.all([
        fetchModels(), 
        fetchRejectTypes(),
        fetchReworkTypes(), 
        fetchDowntimeTypes(), 
        fetchMaterials(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      message.error(error?.response?.data?.message || "Failed to load data");
    } finally {
      setPageLoading(false);
    }
  }, [ fetchModels, fetchRejectTypes, fetchReworkTypes, fetchDowntimeTypes, fetchMaterials]);

  useEffect(() => { loadEverything(); }, [loadEverything]);

  /* ── logout ── */
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setPartsByModel({});
    await loadEverything();
    setRefreshing(false);
    message.success("Data refreshed");
  };

  /* ════════════════════════════════════════════════════════
     PRODUCTION ENTRY HANDLERS
  ════════════════════════════════════════════════════════ */

  /** When user picks a model in the production form */
  const handleModelChange = async (modelId) => {
    setSelectedModelId(modelId);
    setCurrentPartQtys({});
    setLoadingCurrentParts(true);
    const parts = await fetchPartsForModel(modelId);
    setCurrentModelParts(parts);
    setLoadingCurrentParts(false);
  };

  /** When user types a qty for a part field */
  const handlePartQtyChange = (partId, qty) => {
    setCurrentPartQtys((prev) => ({ ...prev, [partId]: qty || 0 }));
  };

  /** "Add Model to List" button → appends to production log */
  const handleAddProductionRow = () => {
    if (!selectedModelId) { message.error("Please select a model first"); return; }
    const anyQty = currentModelParts.some((p) => (currentPartQtys[p._id] || 0) > 0);
    if (!anyQty) { message.error("Enter production qty for at least one part"); return; }

    const model = models.find((m) => m._id === selectedModelId);
    setProductionLog((prev) => [
      ...prev,
      {
        key: uid(),
        modelId: selectedModelId,
        modelName: model?.modelName || model?.name || "",
        parts: currentModelParts.map((p) => ({
          partId: p._id,
          partName: p.partName || p.name,
          qty: currentPartQtys[p._id] || 0,
        })),
      },
    ]);

    // reset form
    setSelectedModelId(null);
    setCurrentModelParts([]);
    setCurrentPartQtys({});
  };

  /** Remove a row from production log */
  const handleRemoveProductionRow = (key) => {
    setProductionLog((prev) => prev.filter((r) => r.key !== key));
  };

  /* ── production log dynamic table ── */
  const allPartNames = useMemo(() => {
    const s = new Set();
    productionLog.forEach((e) => e.parts.forEach((p) => s.add(p.partName)));
    return [...s];
  }, [productionLog]);

  const productionColumns = useMemo(() => [
    {
      title: "#", key: "idx", width: 48,
      render: (_, __, i) => <span className="text-slate-400 font-medium">{i + 1}</span>,
    },
    {
      title: "Model", dataIndex: "modelName", key: "model", width: 120,
      render: (v) => <Tag color="cyan" className="!rounded-lg !font-semibold">{v}</Tag>,
    },
    ...allPartNames.map((name) => ({
      title: <span className="uppercase">{name}</span>,
      key: name,
      align: "center",
      width: 130,
      render: (_, row) => {
        const p = row.parts.find((x) => x.partName === name);
        return p && p.qty
          ? <span className="font-semibold text-slate-800">{p.qty}</span>
          : <span className="text-slate-300">—</span>;
      },
    })),
    {
      title: "Rework", key: "rework", align: "center", width: 100,
      render: (_, row) => {
        const total = defectLog
          .filter((d) => d.modelId === row.modelId && d.defectType === "Rework")
          .reduce((s, d) => s + (d.quantity || 0), 0);
        return total > 0
          ? <Tag color="orange" className="!rounded-lg">{total}</Tag>
          : <span className="text-slate-300">—</span>;
      },
    },
    {
      title: "", key: "action", width: 90,
      render: (_, row) => (
        <Button danger size="small" onClick={() => handleRemoveProductionRow(row.key)}
          className="!rounded-lg">Remove</Button>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [allPartNames, defectLog]);

  /* ════════════════════════════════════════════════════════
     DEFECT HANDLERS
  ════════════════════════════════════════════════════════ */

  const handleDefectModelChange = async (modelId) => {
    setDefectForm((p) => ({ ...p, modelId, partId: null, defectTypeId: null }));
    const parts = await fetchPartsForModel(modelId);
    setDefectModelParts(parts);
  };

  /** "Add Defect" button */
  const handleAddDefectRow = () => {
    const { modelId, partId, defectType, defectTypeId, quantity } = defectForm;
    if (!modelId)      { message.error("Select a model for the defect"); return; }
    if (!partId)       { message.error("Select a part for the defect"); return; }
    if (!defectType)   { message.error("Select Reject or Rework"); return; }
    if (!defectTypeId) { message.error("Select a defect type"); return; }
    if ((quantity || 0) <= 0) { message.error("Quantity must be > 0"); return; }

    const model = models.find((m) => m._id === modelId);
    const part  = defectModelParts.find((p) => p._id === partId);
    const typeList = defectType === "Reject" ? rejectTypes : reworkTypes;
    const defectTypeName = typeList.find((t) => t._id === defectTypeId)?.name || "";

    setDefectLog((prev) => [
      ...prev,
      {
        key: uid(), modelId,
        modelName:      model?.modelName || model?.name || "",
        partId,
        partName:       part?.partName || part?.name || "",
        defectType, defectTypeId, defectTypeName, quantity,
      },
    ]);
    setDefectForm({ modelId: null, partId: null, defectType: null, defectTypeId: null, quantity: 0 });
    setDefectModelParts([]);
  };

  /** Remove defect row */
  const handleRemoveDefectRow = (key) => {
    setDefectLog((prev) => prev.filter((d) => d.key !== key));
  };

  const updateDefectRow = (key, patch) => {
    setDefectLog((prev) => prev.map((d) => d.key === key ? { ...d, ...patch } : d));
  };

  const defectTotals = useMemo(() => {
    const reject = defectLog.filter((d) => d.defectType === "Reject").reduce((s, d) => s + (d.quantity || 0), 0);
    const rework = defectLog.filter((d) => d.defectType === "Rework").reduce((s, d) => s + (d.quantity || 0), 0);
    return { reject, rework, total: reject + rework };
  }, [defectLog]);

  /* ════════════════════════════════════════════════════════
     MANPOWER
  ════════════════════════════════════════════════════════ */
  const shortageManpower = useMemo(
    () => Math.max((requiredManpower || 0) - (availableManpower || 0), 0),
    [requiredManpower, availableManpower]
  );

  /* ════════════════════════════════════════════════════════
     DOWNTIME HANDLERS (same names as source doc)
  ════════════════════════════════════════════════════════ */

  const handleAddDowntimeRow = () =>
    setDowntimes((r) => [...r, emptyDowntimeRow()]);

  const handleRemoveDowntimeRow = (key) =>
    setDowntimes((r) => r.filter((d) => d.key !== key));

  const handleCalculateDowntime = (key, patch) => {
    setDowntimes((rows) =>
      rows.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, ...patch };
        if (next.type === "Planned") next.remark = "";
        next.duration = minutesBetween(next.startTime, next.endTime);
        return next;
      })
    );
  };

  const downtimeTotals = useMemo(() => {
    const planned   = downtimes.filter((d) => d.type === "Planned").reduce((s, d) => s + d.duration, 0);
    const unplanned = downtimes.filter((d) => d.type === "Unplanned").reduce((s, d) => s + d.duration, 0);
    return { planned, unplanned, total: planned + unplanned };
  }, [downtimes]);

  /* ════════════════════════════════════════════════════════
     CONSUMABLE HANDLERS (same names as source doc)
  ════════════════════════════════════════════════════════ */

  const filteredMaterials = useMemo(
    () => materials.filter((m) => m.type === consumableMaterialType),
    [materials, consumableMaterialType]
  );

  const handleMaterialChange = (materialId) => {
    const mat = materials.find((m) => m._id === materialId);
    setConsumableForm((p) => ({ ...p, materialId, measurementType: mat?.mesurmentType || "" }));
  };

  const handleAddConsumableRow = () => {
    const { materialId, quantity } = consumableForm;
    if (!materialId)       { message.error("Select a material"); return; }
    if ((quantity || 0) <= 0) { message.error("Quantity must be > 0"); return; }

    const mat = materials.find((m) => m._id === materialId);
    setConsumableLog((prev) => [
      ...prev,
      {
        key: uid(), materialId,
        materialName:    mat?.name || "",
        materialType:    mat?.type || consumableMaterialType,
        measurementType: mat?.mesurmentType || "",
        quantity,
      },
    ]);
    setConsumableForm({ materialId: null, quantity: 0 });
  };

  const handleRemoveConsumableRow = (key) => {
    setConsumableLog((prev) => prev.filter((c) => c.key !== key));
  };

  const updateConsumableRow = (key, patch) => {
    setConsumableLog((prev) => prev.map((c) => c.key === key ? { ...c, ...patch } : c));
  };

  /* ════════════════════════════════════════════════════════
     PRODUCTION TOTALS
  ════════════════════════════════════════════════════════ */
  const productionTotals = useMemo(() => {
    let production = 0;
    productionLog.forEach((e) => e.parts.forEach((p) => { production += p.qty || 0; }));
    return production;
  }, [productionLog]);

  /* ════════════════════════════════════════════════════════
     VALIDATION
  ════════════════════════════════════════════════════════ */
  const validate = () => {
    if (!shift)                  return "Shift is required";
    if (productionLog.length === 0) return "Add at least one production entry";

    for (const d of downtimes) {
      if (d.startTime && d.endTime && dayjs(d.endTime).isBefore(dayjs(d.startTime)))
        return "Downtime end time must be after start time";
      if (d.type === "Unplanned" && wordCount(d.remark) === 0)
        return "Remark is required for Unplanned downtime";
      if (d.type === "Unplanned" && wordCount(d.remark) > 10)
        return "Unplanned downtime remark cannot exceed 10 words";
    }
    if (requiredManpower < availableManpower)
      return "Required manpower cannot be less than available manpower";

    return null;
  };

  /* ════════════════════════════════════════════════════════
     SAVE  (same name as source doc)
  ════════════════════════════════════════════════════════ */
  const handleSaveProduction = async () => {
    const error = validate();
    if (error) { message.error(error); return; }
    // open confirm modal instead of saving immediately
    setConfirmSaveOpen(true);
  };

  const confirmAndSave = async () => {
    setConfirmSaveOpen(false);
    setSaving(true);
    try {
      // flatten productionLog to productionEntries (per part row)
      const productionEntries = productionLog.flatMap((entry) =>
        entry.parts.map((p) => {
          const reworkQty = defectLog
            .filter((d) => d.modelId === entry.modelId && d.partId === p.partId && d.defectType === "Rework")
            .reduce((s, d) => s + (d.quantity || 0), 0);
          const rejectQty = defectLog
            .filter((d) => d.modelId === entry.modelId && d.partId === p.partId && d.defectType === "Reject")
            .reduce((s, d) => s + (d.quantity || 0), 0);
          return {
            modelId: entry.modelId,
            partId: p.partId,
            productionQty: p.qty,
            reworkQty,
            rejectQty,
          };
        })
      );

      const payload = {
        reportedBy:      user?._id,
        reportedByName:  user?.name,
        reportedByEmail: user?.email,
        plantId:   user?.plantId?._id || user?.plantId,
        plantName: user?.plantId?.plantName || "",
        location:  user?.plantId?.location || user?.location || "",
        shift,
        reportDate:  dayjs().toISOString(),
        reportTime:  dayjs().format("HH:mm"),
        requiredManpower,
        availableManpower,
        shortManpower: shortageManpower,
        productionEntries,
        defects: defectLog.map((d) => ({
          type:        d.defectType,
          modelId:     d.modelId,
          partId:      d.partId,
          defectTypeId: d.defectTypeId,
          defectModel: d.defectType,
          quantity:    d.quantity,
        })),
        downtimes: downtimes.map(({ key, ...d }) => ({
          ...d,
          startTime: d.startTime ? dayjs(d.startTime).toISOString() : null,
          endTime:   d.endTime   ? dayjs(d.endTime).toISOString()   : null,
        })),
        consumables: consumableLog.map(({ key, ...c }) => c),
        totalProductionQty:     productionTotals,
        totalRejectQty:         defectTotals.reject,
        totalReworkQty:         defectTotals.rework,
        totalPlannedDowntime:   downtimeTotals.planned,
        totalUnplannedDowntime: downtimeTotals.unplanned,
        totalDowntime:          downtimeTotals.total,
        status: "Submitted",
      };

      await API.post("/production", payload);
      message.success("Production entry submitted successfully!");

      // reset
      setProductionLog([]); setDefectLog([]); setDowntimes([]);
      setConsumableLog([]); setRequiredManpower(0); setAvailableManpower(0); setShift("Day");
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to save production entry");
    } finally {
      setSaving(false);
    }
  };

  /* ════════════════════════════════════════════════════════
     EXCEL EXPORT  (same name as source doc)
  ════════════════════════════════════════════════════════ */
  const handleExportExcel = () => {
    try {
      setExporting(true);
      const wb = XLSX.utils.book_new();

      // Summary
      const summary = [
        { Field: "Reported By",  Value: user?.name },
        { Field: "Email",        Value: user?.email },
        { Field: "Plant",        Value: user?.plantId?.plantName || user?.plantName },
        { Field: "Location",     Value: user?.plantId?.location || user?.location },
        { Field: "Shift",        Value: shift },
        { Field: "Date",         Value: dayjs().format("DD/MM/YYYY HH:mm") },
        { Field: "Required Manpower",   Value: requiredManpower },
        { Field: "Available Manpower",  Value: availableManpower },
        { Field: "Short Manpower",      Value: shortageManpower },
        { Field: "Total Production Qty", Value: productionTotals },
        { Field: "Total Reject",         Value: defectTotals.reject },
        { Field: "Total Rework",         Value: defectTotals.rework },
        { Field: "Total Planned Downtime (min)",   Value: downtimeTotals.planned },
        { Field: "Total Unplanned Downtime (min)", Value: downtimeTotals.unplanned },
        { Field: "Total Downtime (min)",           Value: downtimeTotals.total },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "Summary");

      // Production
      const prodRows = productionLog.flatMap((e) =>
        e.parts.map((p) => ({ Model: e.modelName, Part: p.partName, "Production Qty": p.qty }))
      );
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prodRows.length ? prodRows : [{}]), "Production");

      // Defects
      const defectRows = defectLog.map((d) => ({
        Type: d.defectType, Model: d.modelName, Part: d.partName,
        "Defect Name": d.defectTypeName, Quantity: d.quantity,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(defectRows.length ? defectRows : [{}]), "Defects");

      // Downtime
      const dtRows = downtimes.map((d) => ({
        Type: d.type,
        "Downtime Reason": downtimeTypes.find((t) => t._id === d.downtimeTypeId)?.name || "",
        "Start Time": d.startTime ? dayjs(d.startTime).format("HH:mm") : "",
        "End Time":   d.endTime   ? dayjs(d.endTime).format("HH:mm")   : "",
        "Duration (min)": d.duration, Remark: d.remark,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dtRows.length ? dtRows : [{}]), "Downtime");

      // Consumables
      const conRows = consumableLog.map((c) => ({
        Material: c.materialName, Type: MATERIAL_TYPE_LABELS[c.materialType] || c.materialType,
        Unit: c.measurementType, Quantity: c.quantity,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(conRows.length ? conRows : [{}]), "Consumables");

      XLSX.writeFile(wb, "Production_Report.xlsx");
      message.success("Production_Report.xlsx downloaded");
    } catch (err) {
      message.error("Failed to generate Excel report");
    } finally {
      setExporting(false);
    }
  };

  /* ════════════════════════════════════════════════════════
     DOWNTIME TABLE COLUMNS
  ════════════════════════════════════════════════════════ */
  const downtimeColumns = [
    {
      title: "#", key: "idx", width: 48,
      render: (_, __, i) => <span className="text-slate-400">{i + 1}</span>,
    },
    {
      title: "Type", dataIndex: "type", width: 140,
      render: (v, row) => (
        <Select size="small" className="w-full" value={v}
          options={[{ value: "Planned", label: "Planned" }, { value: "Unplanned", label: "Unplanned" }]}
          onChange={(val) => handleCalculateDowntime(row.key, { type: val })} />
      ),
    },
    {
      title: "Reason", dataIndex: "downtimeTypeId", width: 200,
      render: (v, row) => (
        <Select size="small" className="w-full" placeholder="Select reason" value={v}
          options={downtimeTypes.filter((t) => t.type === row.type).map((t) => ({ value: t._id, label: t.name }))}
          onChange={(val) => handleCalculateDowntime(row.key, { downtimeTypeId: val })} />
      ),
    },
    {
      title: "Start", width: 120,
      render: (_, row) => (
        <TimePicker size="small" format="HH:mm" className="w-full"
          value={row.startTime ? dayjs(row.startTime) : null}
          onChange={(val) => handleCalculateDowntime(row.key, { startTime: val })} />
      ),
    },
    {
      title: "End", width: 120,
      render: (_, row) => (
        <TimePicker size="small" format="HH:mm" className="w-full"
          value={row.endTime ? dayjs(row.endTime) : null}
          onChange={(val) => handleCalculateDowntime(row.key, { endTime: val })} />
      ),
    },
    {
      title: "Duration", dataIndex: "duration", width: 100, align: "center",
      render: (v) => <Tag color="cyan" className="!rounded-lg">{v} min</Tag>,
    },
    {
      title: "Remark (Unplanned only)", dataIndex: "remark",
      render: (v, row) => row.type === "Unplanned" ? (
        <div>
          <Input size="small" placeholder="Max 10 words *" value={v}
            onChange={(e) => handleCalculateDowntime(row.key, { remark: e.target.value })} />
          <span className="text-[11px] text-slate-400">
            {wordCount(v)}/10 words
          </span>
        </div>
      ) : (
        <span className="text-xs text-slate-300 italic">N/A</span>
      ),
    },
    {
      title: "", width: 46,
      render: (_, row) => (
        <Button danger type="text" size="small" icon={<Trash2 size={14} />}
          onClick={() => handleRemoveDowntimeRow(row.key)} />
      ),
    },
  ];

  /* ════════════════════════════════════════════════════════
     LOADING SCREEN
  ════════════════════════════════════════════════════════ */
  if (pageLoading) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/10 backdrop-blur-md">
      <div className="flex flex-col items-center gap-4 bg-white/80 backdrop-blur-2xl border border-white shadow-2xl shadow-slate-900/10 rounded-2xl px-10 py-8">
        <Spin size="large" />
        <span className="text-slate-500 text-sm font-medium tracking-wide">
          Initializing Production System...
        </span>
      </div>
    </div>
  );
}

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-slate-100">

      

      {/* ══════════════════════════════════════════════════
          PAGE BODY
      ══════════════════════════════════════════════════ */}
      <div className="px-5 py-5 pb-28 space-y-5 max-w-[1600px] mx-auto">

        {/* ─── 1. SHIFT INFORMATION ─────────────────────── */}
        <div className={CARD}>
          <div className="px-5 py-4 border-b border-slate-100">
            <SectionHead icon={Clock3} border="#0d9488" color="text-teal-600">
              Shift Information
            </SectionHead>
          </div>
          <div className="px-5 py-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Shift selector */}
              <div className="col-span-2 md:col-span-1">
                <label className={LABEL}>Shift *</label>
                <div className="flex gap-2">
                  {["Day", "Night"].map((s) => (
                    <button key={s} onClick={() => setShift(s)}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm font-semibold border transition-all ${
                        shift === s
                          ? s === "Day"
                            ? "bg-amber-400 border-amber-400 text-white shadow"
                            : "bg-slate-800 border-slate-800 text-white shadow"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}>
                      {s === "Day" ? <Sun size={14} /> : <Moon size={14} />} {s}
                    </button>
                  ))}
                </div>
              </div>
              {/* Report Time */}
              <div>
                <label className={LABEL}>Report Time</label>
                <div className={FIELD}>{now.format("HH:mm")}</div>
              </div>
              {/* User Name */}
              <div>
                <label className={LABEL}>Reported By</label>
                <div className={FIELD}>{user?.name || "—"}</div>
              </div>
              {/* Email */}
              <div>
                <label className={LABEL}>Email</label>
                <div className={`${FIELD} truncate`}>{user?.email || "—"}</div>
              </div>
              {/* Plant */}
              <div>
                <label className={LABEL}>Plant</label>
                <div className={FIELD}>{user?.plantId?.plantName || user?.plantName || "—"}</div>
              </div>
              {/* Location */}
              <div>
                <label className={LABEL}>Location</label>
                <div className={FIELD}>{user?.plantId?.location || user?.location || "—"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 2. PRODUCTION ENTRY ──────────────────────── */}
        <div className={CARD}>
          <div className="px-5 py-4 border-b border-slate-100">
            <SectionHead icon={Package} border="#2563eb" color="text-blue-600">
              Production Entry
            </SectionHead>
          </div>
          <div className="px-5 py-4">
            {/* Model selector */}
            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 mb-5">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <div className="flex-shrink-0">
                  <label className={LABEL}>Select Model</label>
                  <Select
                    className="w-52"
                    placeholder="— choose model —"
                    value={selectedModelId}
                    showSearch
                    optionFilterProp="label"
                    loading={pageLoading}
                    options={models.map((m) => ({ value: m._id, label: m.modelName || m.name }))}
                    onChange={handleModelChange}
                  />
                </div>
                {selectedModelId && (
                  <p className="text-sm text-blue-700 mt-5 font-medium">
                    Enter quantities for each part, then click{" "}
                    <strong>Add to list.</strong>
                  </p>
                )}
              </div>

              {/* Dynamic parts grid */}
              {loadingCurrentParts && (
                <div className="flex items-center gap-2 py-3 text-slate-500">
                  <Spin size="small" /> Loading parts...
                </div>
              )}

              {!loadingCurrentParts && selectedModelId && currentModelParts.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-4">
                  {currentModelParts.map((part) => (
                    <div key={part._id}>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        {part.partName || part.name}
                      </label>
                      <InputNumber
                        className="w-full"
                        min={0}
                        placeholder="0"
                        value={currentPartQtys[part._id] || null}
                        onChange={(v) => handlePartQtyChange(part._id, v)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {!loadingCurrentParts && selectedModelId && currentModelParts.length === 0 && (
                <Empty description="No parts configured for this model" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-3" />
              )}

              <Button
                type="primary"
                icon={<Plus size={14} />}
                onClick={handleAddProductionRow}
                disabled={!selectedModelId || currentModelParts.length === 0}
                className="!rounded-xl !bg-blue-600 !border-blue-600 !font-semibold"
              >
                + Add Model to List
              </Button>
            </div>

            {/* Production log table */}
            {productionLog.length > 0 ? (
              <>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Production Log — {productionLog.length} {productionLog.length === 1 ? "Entry" : "Entries"}
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <Table
                    size="small"
                    rowKey="key"
                    columns={productionColumns}
                    dataSource={productionLog}
                    pagination={false}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-slate-400 text-sm">
                No entries yet — select a model and add production data above
              </div>
            )}
          </div>
        </div>

        {/* ─── 3. DEFECTS (REJECT + REWORK) ─────────────── */}
        <div className={CARD}>
          <div className="px-5 py-4 border-b border-slate-100">
            <SectionHead icon={ShieldAlert} border="#dc2626" color="text-red-500">
              Defects — Reject & Rework
            </SectionHead>
          </div>
          <div className="px-5 py-4">
            {/* Defect entry form */}
            <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 mb-5">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
                <div>
                  <label className={LABEL}>Model</label>
                  <Select className="w-full" placeholder="Select model"
                    showSearch optionFilterProp="label"
                    value={defectForm.modelId}
                    options={models.map((m) => ({ value: m._id, label: m.modelName || m.name }))}
                    onChange={(v) => handleDefectModelChange(v)} />
                </div>
                <div>
                  <label className={LABEL}>Part</label>
                  <Select className="w-full" placeholder="Select part"
                    showSearch optionFilterProp="label"
                    disabled={!defectForm.modelId}
                    loading={!!partsLoading[defectForm.modelId]}
                    value={defectForm.partId}
                    options={defectModelParts.map((p) => ({ value: p._id, label: p.partName || p.name }))}
                    onChange={(v) => setDefectForm((f) => ({ ...f, partId: v }))} />
                </div>
                <div>
                  <label className={LABEL}>Type</label>
                  <Select className="w-full" placeholder="Reject / Rework"
                    value={defectForm.defectType}
                    options={[{ value: "Reject", label: "🔴 Reject" }, { value: "Rework", label: "🟠 Rework" }]}
                    onChange={(v) => setDefectForm((f) => ({ ...f, defectType: v, defectTypeId: null }))} />
                </div>
                <div>
                  <label className={LABEL}>Defect Name</label>
                  <Select className="w-full" placeholder="Select reason"
                    showSearch optionFilterProp="label"
                    disabled={!defectForm.defectType}
                    value={defectForm.defectTypeId}
                    options={(defectForm.defectType === "Reject" ? rejectTypes : reworkTypes)
                      .map((t) => ({ value: t._id, label: t.name }))}
                    onChange={(v) => setDefectForm((f) => ({ ...f, defectTypeId: v }))} />
                </div>
                <div>
                  <label className={LABEL}>Quantity</label>
                  <InputNumber className="w-full" min={0}
                    value={defectForm.quantity}
                    onChange={(v) => setDefectForm((f) => ({ ...f, quantity: v || 0 }))} />
                </div>
                <div>
                  <Button type="primary" icon={<Plus size={14} />} className="w-full !rounded-xl"
                    style={{ backgroundColor: "#dc2626", borderColor: "#dc2626" }}
                    onClick={handleAddDefectRow}>
                    Add Defect
                  </Button>
                </div>
              </div>
            </div>

            {/* Defect log */}
            {defectLog.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full">
                  <thead>
                    <tr>
                      {["#", "Type", "Model", "Part", "Defect Name", "Qty", ""].map((h) => (
                        <th key={h} className={TH}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {defectLog.map((row, i) => (
                      <tr key={row.key} className="hover:bg-slate-50/50">
                        <td className={`${TD} text-slate-400`}>{i + 1}</td>
                        <td className={TD}>
                          <Tag color={row.defectType === "Reject" ? "red" : "orange"}
                            className="!rounded-lg !font-semibold">
                            {row.defectType}
                          </Tag>
                        </td>
                        <td className={TD}><Tag color="cyan" className="!rounded-lg">{row.modelName}</Tag></td>
                        <td className={TD}><span className="font-medium">{row.partName}</span></td>
                        <td className={TD}>{row.defectTypeName}</td>
                        <td className={`${TD} font-bold text-slate-800`}>{row.quantity}</td>
                        <td className={TD}>
                          <Button danger type="text" size="small" icon={<Trash2 size={13} />}
                            onClick={() => handleRemoveDefectRow(row.key)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400 text-sm">
                No defects added yet
              </div>
            )}

            {/* Defect totals */}
            {defectLog.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: "Total Reject", value: defectTotals.reject, color: "text-red-600", bg: "bg-red-50 border-red-200" },
                  { label: "Total Rework", value: defectTotals.rework, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
                  { label: "Total Defects", value: defectTotals.total, color: "text-slate-800", bg: "bg-slate-100 border-slate-200" },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={`border rounded-xl px-4 py-3 text-center ${bg}`}>
                    <div className={`text-2xl font-bold ${color}`}>{value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── 4. MANPOWER ─────────────────────────────── */}
        <div className={CARD}>
          <div className="px-5 py-4 border-b border-slate-100">
            <SectionHead icon={Users} border="#7c3aed" color="text-purple-600">
              Manpower Details
            </SectionHead>
          </div>
          <div className="px-5 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className={LABEL}>Required Manpower</label>
                <InputNumber className="w-full" min={0} value={requiredManpower}
                  onChange={(v) => setRequiredManpower(v || 0)} />
              </div>
              <div>
                <label className={LABEL}>Available Manpower</label>
                <InputNumber className="w-full" min={0} value={availableManpower}
                  onChange={(v) => setAvailableManpower(v || 0)} />
              </div>
              <div>
                <label className={LABEL}>Manpower Shortage <span className="normal-case font-normal text-slate-400">(auto)</span></label>
                <div className={`w-full border rounded-xl px-3 py-2.5 text-lg font-bold text-center ${
                  shortageManpower > 0 ? "bg-red-50 border-red-200 text-red-600" : "bg-green-50 border-green-200 text-green-600"
                }`}>
                  {shortageManpower}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 5. DOWNTIME ─────────────────────────────── */}
        <div className={CARD}>
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <SectionHead icon={Clock3} border="#d97706" color="text-amber-600">
              Downtime Details
            </SectionHead>
            <Button size="small" icon={<Plus size={13} />} onClick={handleAddDowntimeRow}
              className="!rounded-xl !border-amber-400 !text-amber-600 hover:!bg-amber-50">
              Add Downtime
            </Button>
          </div>
          <div className="px-5 py-4">
            {downtimes.length === 0 ? (
              <Empty description="No downtime added" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-4" />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <Table size="small" rowKey="key"
                  columns={downtimeColumns} dataSource={downtimes} pagination={false} />
              </div>
            )}

            {/* Downtime totals */}
            {downtimes.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: "Planned (min)",   value: downtimeTotals.planned,   bg: "bg-blue-50 border-blue-200 text-blue-700" },
                  { label: "Unplanned (min)", value: downtimeTotals.unplanned, bg: "bg-red-50 border-red-200 text-red-600" },
                  { label: "Total (min)",     value: downtimeTotals.total,     bg: "bg-slate-100 border-slate-200 text-slate-800" },
                ].map(({ label, value, bg }) => (
                  <div key={label} className={`border rounded-xl px-4 py-3 text-center ${bg}`}>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-xs opacity-70 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── 6. CONSUMABLE MATERIALS ─────────────────── */}
        <div className={CARD}>
          <div className="px-5 py-4 border-b border-slate-100">
            <SectionHead icon={FlaskConical} border="#0d9488" color="text-teal-600">
              Consumable Materials
            </SectionHead>
          </div>
          <div className="px-5 py-4">
            {/* Type selector tabs */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {Object.entries(MATERIAL_TYPE_LABELS).map(([key, label]) => (
                <button key={key} onClick={() => {
                  setConsumableMaterialType(key);
                  setConsumableForm({ materialId: null, quantity: 0 });
                }}
                  className={`px-4 py-1.5 rounded-xl text-sm font-semibold border transition-all ${
                    consumableMaterialType === key
                      ? "bg-teal-600 border-teal-600 text-white shadow"
                      : "bg-white border-slate-200 text-slate-600 hover:border-teal-300"
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Consumable entry form */}
            <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 mb-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className={LABEL}>
                    {MATERIAL_TYPE_LABELS[consumableMaterialType]} Name
                  </label>
                  <Select className="w-full" placeholder={`Select ${MATERIAL_TYPE_LABELS[consumableMaterialType].toLowerCase()}`}
                    showSearch optionFilterProp="label"
                    value={consumableForm.materialId}
                    options={filteredMaterials.map((m) => ({ value: m._id, label: m.name }))}
                    onChange={(v) => handleMaterialChange(v)} />
                </div>
                <div>
                  <label className={LABEL}>Unit (auto)</label>
                  <div className={FIELD}>
                    {consumableForm.materialId
                      ? materials.find((m) => m._id === consumableForm.materialId)?.mesurmentType || "—"
                      : "—"
                    }
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Quantity</label>
                  <InputNumber className="w-full" min={0}
                    value={consumableForm.quantity}
                    onChange={(v) => setConsumableForm((f) => ({ ...f, quantity: v || 0 }))} />
                </div>
              </div>
              <div className="mt-3">
                <Button type="primary" icon={<Plus size={14} />} onClick={handleAddConsumableRow}
                  className="!rounded-xl"
                  style={{ backgroundColor: "#0d9488", borderColor: "#0d9488" }}>
                  Add {MATERIAL_TYPE_LABELS[consumableMaterialType]}
                </Button>
              </div>
            </div>

            {/* Consumable log */}
            {consumableLog.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full">
                  <thead>
                    <tr>
                      {["#", "Material", "Type", "Unit", "Qty", ""].map((h) => (
                        <th key={h} className={TH}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {consumableLog.map((row, i) => (
                      <tr key={row.key} className="hover:bg-slate-50/50">
                        <td className={`${TD} text-slate-400`}>{i + 1}</td>
                        <td className={`${TD} font-medium`}>{row.materialName}</td>
                        <td className={TD}>
                          <Tag color={MATERIAL_TYPE_COLORS[row.materialType] || "default"}
                            className="!rounded-lg">
                            {MATERIAL_TYPE_LABELS[row.materialType] || row.materialType}
                          </Tag>
                        </td>
                        <td className={TD}>
                          <Tag className="!rounded-lg !font-semibold">{row.measurementType}</Tag>
                        </td>
                        <td className={`${TD} font-bold text-slate-800`}>{row.quantity}</td>
                        <td className={TD}>
                          <Button danger type="text" size="small" icon={<Trash2 size={13} />}
                            onClick={() => handleRemoveConsumableRow(row.key)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400 text-sm">
                No consumables added yet
              </div>
            )}
          </div>
        </div>

        {/* ─── 7. FINAL SUMMARY KPIs ───────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} className="text-slate-600" />
            <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider m-0">
              Final Summary
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard icon={Package}     label="Total Production"    value={productionTotals}         tone="blue" />
            <KpiCard icon={ShieldAlert} label="Total Reject"        value={defectTotals.reject}      tone="red" />
            <KpiCard icon={RotateCcw}   label="Total Rework"        value={defectTotals.rework}      tone="amber" />
            <KpiCard icon={AlertTriangle} label="Total Defects"     value={defectTotals.total}       tone="slate" />
            <KpiCard icon={Clock3}      label="Total Downtime (min)" value={downtimeTotals.total}    tone="purple" />
            <KpiCard icon={Users}       label="Manpower Shortage"   value={shortageManpower}
              tone={shortageManpower > 0 ? "red" : "green"} />
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════
          STICKY SAVE FOOTER
      ══════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-5 py-3">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-sm text-slate-500 flex gap-4 flex-wrap">
            <span><strong className="text-slate-800">{productionLog.length}</strong> production rows</span>
            <span>·</span>
            <span><strong className="text-red-600">{defectTotals.reject}</strong> rejects</span>
            <span>·</span>
            <span><strong className="text-orange-500">{defectTotals.rework}</strong> reworks</span>
            <span>·</span>
            <span><strong className="text-amber-600">{downtimeTotals.total} min</strong> downtime</span>
            <span>·</span>
            <span><strong className="text-teal-600">{consumableLog.length}</strong> consumables</span>
          </div>
          <Button type="primary" size="large" icon={<Save size={16} />} loading={saving}
            onClick={handleSaveProduction}
            className="!rounded-xl !font-bold !px-10 !h-11"
            style={{ backgroundColor: "#0e7490", borderColor: "#0e7490" }}>
            Save Production Entry
          </Button>

          {/* Confirmation Modal */}
          <Modal
            open={confirmSaveOpen}
            onCancel={() => setConfirmSaveOpen(false)}
            onOk={confirmAndSave}
            okText="Yes, Submit Entry"
            cancelText="Go Back & Review"
            okButtonProps={{
              loading: saving,
              style: { backgroundColor: "#0e7490", borderColor: "#0e7490", fontWeight: 600 },
            }}
            cancelButtonProps={{ className: "!rounded-lg" }}
            title={null}
            centered
            width={460}
          >
            <div style={{ borderBottom: "3px solid #0e7490", margin: "-20px -24px 20px", padding: "20px 24px", borderRadius: "8px 8px 0 0", background: "#f0fdfa" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <Save size={18} className="text-teal-700" />
                </div>
                <div>
                  <div className="text-base font-bold text-slate-800">Submit Production Entry?</div>
                  <div className="text-xs text-slate-500 mt-0.5">Please confirm before final submission</div>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-slate-600 py-1">
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                <span className="text-slate-500">Shift</span>
                <span className="font-semibold text-slate-800">{shift === "Day" ? "☀️ Day" : "🌙 Night"}</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                <span className="text-slate-500">Production Entries</span>
                <span className="font-semibold text-slate-800">{productionLog.length} model(s)</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                <span className="text-slate-500">Total Production Qty</span>
                <span className="font-semibold text-teal-700">{productionTotals}</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                <span className="text-slate-500">Total Defects (Reject + Rework)</span>
                <span className="font-semibold text-red-600">{defectTotals.total}</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                <span className="text-slate-500">Total Downtime</span>
                <span className="font-semibold text-amber-600">{downtimeTotals.total} min</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                <span className="text-slate-500">Reported By</span>
                <span className="font-semibold text-slate-800">{user?.name || "—"}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              This entry will be marked as <strong>Submitted</strong> and cannot be edited afterwards.
            </p>
          </Modal>
        </div>
      </div>

    </div>
  );
}