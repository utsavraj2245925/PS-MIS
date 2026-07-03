import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import {
  Table, Button, Tag, Tooltip, message, Spin, Empty,
  Modal, DatePicker, Input, Tabs, Divider,
} from "antd";
import {
  Factory, Plus, LogOut, RefreshCcw, CalendarDays, UserCircle2,
  Package, ShieldAlert, RotateCcw, AlertTriangle, Clock3, Users,
  TrendingUp, ChevronRight, Eye, Search, Download, FileSpreadsheet,
  Sun, Moon, MapPin, BarChart3, CheckCircle2, CircleDot, Timer,
} from "lucide-react";

const API = axiosInstance;

/* ────────────────────────────────────────────────────────
   STYLE TOKENS
──────────────────────────────────────────────────────── */
const CARD = "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden";

/* ────────────────────────────────────────────────────────
   KPI STAT CARD
──────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, tone = "slate", loading }) {
  const tones = {
    blue:   { bg: "bg-blue-50",   border: "border-blue-100",   val: "text-blue-700",   icon: "text-blue-400",  circle: "bg-blue-100"   },
    red:    { bg: "bg-red-50",    border: "border-red-100",    val: "text-red-600",    icon: "text-red-400",   circle: "bg-red-100"    },
    amber:  { bg: "bg-amber-50",  border: "border-amber-100",  val: "text-amber-600",  icon: "text-amber-400", circle: "bg-amber-100"  },
    slate:  { bg: "bg-slate-50",  border: "border-slate-200",  val: "text-slate-800",  icon: "text-slate-400", circle: "bg-slate-100"  },
    purple: { bg: "bg-purple-50", border: "border-purple-100", val: "text-purple-700", icon: "text-purple-400",circle: "bg-purple-100" },
    green:  { bg: "bg-green-50",  border: "border-green-100",  val: "text-green-700",  icon: "text-green-400", circle: "bg-green-100"  },
    teal:   { bg: "bg-teal-50",   border: "border-teal-100",   val: "text-teal-700",   icon: "text-teal-400",  circle: "bg-teal-100"   },
  };
  const t = tones[tone] || tones.slate;
  return (
    <div className={`relative rounded-2xl border p-5 overflow-hidden ${t.bg} ${t.border}`}>
      {/* decorative circle */}
      <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-40 ${t.circle}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">{label}</p>
          {loading ? (
            <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
          ) : (
            <p className={`text-3xl font-extrabold leading-none ${t.val}`}>{value ?? 0}</p>
          )}
          {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${t.circle}`}>
          <Icon size={20} className={t.icon} />
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   DETAIL MODAL — full record view
──────────────────────────────────────────────────────── */
function RecordDetailModal({ record, open, onClose }) {
  if (!record) return null;

  const shiftColor = record.shift === "Day"
    ? { bg: "#fefce8", border: "#fde68a", color: "#92400e" }
    : { bg: "#eff6ff", border: "#bfdbfe", color: "#1e40af" };

  const statusColor = record.status === "Submitted" ? "success" : "default";

  const TH = "text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 bg-slate-50 border-b border-slate-200 whitespace-nowrap";
  const TD = "px-3 py-2.5 border-b border-slate-100 text-sm text-slate-700";

  const tabItems = [
    {
      key: "production",
      label: <span className="flex items-center gap-1.5"><Package size={13} />Production</span>,
      children: (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full">
            <thead>
              <tr>
                {["#","Model","Part","Production Qty","Reject Qty","Rework Qty"].map(h => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(record.productionEntries || []).length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400">No production entries</td></tr>
              ) : (record.productionEntries || []).map((e, i) => (
                <tr key={i} className="hover:bg-slate-50/60">
                  <td className={`${TD} text-slate-400`}>{i+1}</td>
                  <td className={TD}><Tag color="cyan" className="!rounded-lg">{e.modelId?.modelName || e.modelId?.name || "—"}</Tag></td>
                  <td className={`${TD} font-medium`}>{e.partId?.partName || e.partId?.name || "—"}</td>
                  <td className={`${TD} font-bold text-blue-700`}>{e.productionQty ?? 0}</td>
                  <td className={`${TD} font-semibold text-red-500`}>{e.rejectQty ?? 0}</td>
                  <td className={`${TD} font-semibold text-amber-600`}>{e.reworkQty ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      key: "defects",
      label: <span className="flex items-center gap-1.5"><ShieldAlert size={13} />Defects</span>,
      children: (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full">
            <thead>
              <tr>
                {["#","Type","Model","Part","Defect Name","Qty"].map(h => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(record.defects || []).length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400">No defects recorded</td></tr>
              ) : (record.defects || []).map((d, i) => (
                <tr key={i} className="hover:bg-slate-50/60">
                  <td className={`${TD} text-slate-400`}>{i+1}</td>
                  <td className={TD}>
                    <Tag color={d.type === "Reject" ? "red" : "orange"} className="!rounded-lg !font-semibold">
                      {d.type}
                    </Tag>
                  </td>
                  <td className={TD}><Tag color="cyan" className="!rounded-lg">{d.modelId?.modelName || "—"}</Tag></td>
                  <td className={TD}>{d.partId?.partName || "—"}</td>
                  <td className={TD}>{d.defectTypeId?.name || d.defectName || "—"}</td>
                  <td className={`${TD} font-bold`}>{d.quantity ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      key: "downtime",
      label: <span className="flex items-center gap-1.5"><Clock3 size={13} />Downtime</span>,
      children: (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full">
              <thead>
                <tr>
                  {["#","Type","Reason","Start","End","Duration (min)","Remark"].map(h => (
                    <th key={h} className={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(record.downtimes || []).length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-400">No downtime recorded</td></tr>
                ) : (record.downtimes || []).map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50/60">
                    <td className={`${TD} text-slate-400`}>{i+1}</td>
                    <td className={TD}>
                      <Tag color={d.type === "Planned" ? "blue" : "volcano"} className="!rounded-lg">{d.type}</Tag>
                    </td>
                    <td className={TD}>{d.downtimeTypeId?.name || d.downtimeName || "—"}</td>
                    <td className={TD}>{d.startTime ? dayjs(d.startTime).format("HH:mm") : "—"}</td>
                    <td className={TD}>{d.endTime   ? dayjs(d.endTime).format("HH:mm")   : "—"}</td>
                    <td className={TD}><Tag color="cyan" className="!rounded-lg">{d.duration ?? 0} min</Tag></td>
                    <td className={`${TD} text-slate-500 italic`}>{d.remark || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {record.downtimes?.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                { label: "Planned (min)",   val: record.totalPlannedDowntime   ?? 0, color: "text-blue-600 bg-blue-50 border-blue-100" },
                { label: "Unplanned (min)", val: record.totalUnplannedDowntime ?? 0, color: "text-red-600 bg-red-50 border-red-100" },
                { label: "Total (min)",     val: record.totalDowntime          ?? 0, color: "text-slate-800 bg-slate-100 border-slate-200" },
              ].map(({ label, val, color }) => (
                <div key={label} className={`border rounded-xl px-4 py-2.5 text-center ${color}`}>
                  <div className="text-xl font-bold">{val}</div>
                  <div className="text-xs opacity-70 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          )}
        </>
      ),
    },
    {
      key: "consumables",
      label: <span className="flex items-center gap-1.5"><Factory size={13} />Consumables</span>,
      children: (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full">
            <thead>
              <tr>
                {["#","Material","Type","Unit","Quantity"].map(h => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(record.consumables || []).length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400">No consumables recorded</td></tr>
              ) : (record.consumables || []).map((c, i) => (
                <tr key={i} className="hover:bg-slate-50/60">
                  <td className={`${TD} text-slate-400`}>{i+1}</td>
                  <td className={`${TD} font-medium`}>{c.materialId?.name || c.materialName || "—"}</td>
                  <td className={TD}><Tag color="purple" className="!rounded-lg">{c.materialType || "—"}</Tag></td>
                  <td className={TD}><Tag className="!rounded-lg">{c.measurementType || "—"}</Tag></td>
                  <td className={`${TD} font-bold`}>{c.quantity ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
      title={null}
      styles={{ body: { padding: 0 } }}
    >
      {/* Modal header */}
      <div className="px-6 pt-5 pb-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-slate-800 m-0">Production Entry Detail</h2>
              <Tag color={statusColor} className="!rounded-full !text-xs !font-semibold !px-3">
                {record.status}
              </Tag>
              <div
                className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                style={shiftColor}
              >
                {record.shift === "Day" ? <Sun size={11} /> : <Moon size={11} />}
                {record.shift} Shift
              </div>
            </div>
            <div className="flex items-center gap-4 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <CalendarDays size={12} /> {dayjs(record.reportDate || record.createdAt).format("DD MMM YYYY")}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <UserCircle2 size={12} /> {record.reportedByName || record.reportedBy?.name || "—"}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Factory size={12} /> {record.plantName || record.plantId?.name || "—"}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin size={12} /> {record.location || record.plantId?.location || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Mini summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mt-4">
          {[
            { label: "Production",    value: record.totalProductionQty ?? 0, color: "text-blue-700",   bg: "bg-blue-50" },
            { label: "Reject",        value: record.totalRejectQty     ?? 0, color: "text-red-600",    bg: "bg-red-50" },
            { label: "Rework",        value: record.totalReworkQty     ?? 0, color: "text-amber-600",  bg: "bg-amber-50" },
            { label: "Downtime (min)",value: record.totalDowntime      ?? 0, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Required MP",   value: record.requiredManpower   ?? 0, color: "text-slate-700",  bg: "bg-slate-100" },
            { label: "Short MP",      value: record.shortManpower      ?? 0, color: record.shortManpower > 0 ? "text-red-600" : "text-green-600", bg: record.shortManpower > 0 ? "bg-red-50" : "bg-green-50" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl px-3 py-2 text-center`}>
              <div className={`text-lg font-extrabold leading-none ${color}`}>{value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal tabs */}
      <div className="px-6 pb-6 pt-2">
        <Tabs items={tabItems} size="small" />
      </div>
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────
   MAIN PAGE
──────────────────────────────────────────────────────── */
export default function ProductionRecordsPage() {
  const { user, logout } = useAuth();

  const navigate   = useNavigate();

  const [records, setRecords]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [exporting, setExporting]       = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(dayjs()); // current month
  const [searchText, setSearchText]     = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailOpen, setDetailOpen]     = useState(false);
  const [now, setNow] = useState(dayjs());

  /* live clock */
  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ── fetch records ── */
  const fetchRecords = useCallback(async (month = selectedMonth) => {
    try {
      const startDate = month.startOf("month").toISOString();
      const endDate   = month.endOf("month").toISOString();
      const { data }  = await API.get("/production", {
        params: { startDate, endDate },
      });
      console.log("Fetched production records:", data);
      setRecords(data?.data || data?.records || data || []);
    } catch (err) {
      message.error("Failed to load production records");
    }
  }, [selectedMonth]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchRecords(selectedMonth);
      setLoading(false);
    })();
  }, [selectedMonth]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRecords(selectedMonth);
    setRefreshing(false);
    message.success("Records refreshed");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleMonthChange = (val) => {
    if (val) setSelectedMonth(val);
  };

  /* ── filtered records ── */
  const filteredRecords = useMemo(() => {
    let list = [...records];

    if (statusFilter !== "All") {
      list = list.filter((r) => r.status === statusFilter);
    }

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter((r) => {
        const date   = dayjs(r.reportDate || r.createdAt).format("DD MMM YYYY").toLowerCase();
        const name   = (r.reportedByName || "").toLowerCase();
        const plant  = (r.plantName || "").toLowerCase();
        const shift  = (r.shift || "").toLowerCase();
        return date.includes(q) || name.includes(q) || plant.includes(q) || shift.includes(q);
      });
    }

    return list;
  }, [records, statusFilter, searchText]);

  /* ── KPI totals from filtered records ── */
  const kpis = useMemo(() => {
    const totalProduction = filteredRecords.reduce((s, r) => s + (r.totalProductionQty ?? 0), 0);
    const totalReject     = filteredRecords.reduce((s, r) => s + (r.totalRejectQty     ?? 0), 0);
    const totalRework     = filteredRecords.reduce((s, r) => s + (r.totalReworkQty     ?? 0), 0);
    const totalDowntime   = filteredRecords.reduce((s, r) => s + (r.totalDowntime      ?? 0), 0);
    const shortManpower   = filteredRecords.reduce((s, r) => s + (r.shortManpower      ?? 0), 0);
    const submitted       = filteredRecords.filter((r) => r.status === "Submitted").length;
    return {
      totalProduction, totalReject, totalRework,
      totalDefects: totalReject + totalRework,
      totalDowntime, shortManpower, submitted,
      entries: filteredRecords.length,
    };
  }, [filteredRecords]);

  /* ── row click ── */
  const handleRowClick = (record) => {
    setSelectedRecord(record);
    setDetailOpen(true);
  };

  /* ── excel export ── */
  const handleExportExcel = () => {
    try {
      setExporting(true);
      const rows = filteredRecords.map((r, i) => ({
        "S.N.":        i + 1,
        Date:          dayjs(r.reportDate || r.createdAt).format("DD/MM/YYYY"),
        Shift:         r.shift,
        "Reported By": r.reportedByName,
        Plant:         r.plantName,
        "Production Qty": r.totalProductionQty ?? 0,
        "Reject Qty":     r.totalRejectQty     ?? 0,
        "Rework Qty":     r.totalReworkQty     ?? 0,
        "Total Defects":  (r.totalRejectQty ?? 0) + (r.totalReworkQty ?? 0),
        "Downtime (min)": r.totalDowntime    ?? 0,
        "Short Manpower": r.shortManpower    ?? 0,
        Status: r.status,
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Production Records");
      XLSX.writeFile(wb, `Production_Records_${selectedMonth.format("MMM_YYYY")}.xlsx`);
      message.success("Excel exported");
    } catch {
      message.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  /* ── table columns ── */
  const columns = [
    {
      title: "S.N.", key: "sn", width: 56, fixed: "left",
      render: (_, __, i) => <span className="text-slate-400 text-xs font-medium">{i + 1}</span>,
    },
    {
      title: "Date", key: "date", width: 110, fixed: "left",
      render: (_, r) => (
        <div>
          <div className="text-sm font-semibold text-slate-800">
            {dayjs(r.reportDate || r.createdAt).format("DD MMM")}
          </div>
          <div className="text-[11px] text-slate-400">
            {dayjs(r.reportDate || r.createdAt).format("YYYY")}
          </div>
        </div>
      ),
      sorter: (a, b) => dayjs(a.reportDate || a.createdAt).unix() - dayjs(b.reportDate || b.createdAt).unix(),
    },
    {
      title: "Shift", key: "shift", width: 90,
      render: (_, r) => (
        <div
          className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
          style={r.shift === "Day"
            ? { background: "#fefce8", border: "1px solid #fde68a", color: "#92400e" }
            : { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af" }}
        >
          {r.shift === "Day" ? <Sun size={11} /> : <Moon size={11} />}
          {r.shift}
        </div>
      ),
    },
    {
      title: "Reported By", key: "reportedBy", width: 130,
      render: (_, r) => (
        <div>
          <div className="text-sm font-semibold text-slate-700">{r.reportedByName || "—"}</div>
          <div className="text-[11px] text-slate-400">{r.plantName || "—"}</div>
        </div>
      ),
    },
    {
      title: "Production", key: "prod", width: 100, align: "center",
      render: (_, r) => (
        <span className="text-lg font-extrabold text-blue-700">{r.totalProductionQty ?? 0}</span>
      ),
      sorter: (a, b) => (a.totalProductionQty ?? 0) - (b.totalProductionQty ?? 0),
    },
    {
      title: "Reject", key: "reject", width: 80, align: "center",
      render: (_, r) => (
        <span className={`text-base font-bold ${(r.totalRejectQty ?? 0) > 0 ? "text-red-600" : "text-slate-300"}`}>
          {r.totalRejectQty ?? 0}
        </span>
      ),
    },
    {
      title: "Rework", key: "rework", width: 80, align: "center",
      render: (_, r) => (
        <span className={`text-base font-bold ${(r.totalReworkQty ?? 0) > 0 ? "text-amber-600" : "text-slate-300"}`}>
          {r.totalReworkQty ?? 0}
        </span>
      ),
    },
    {
      title: "Defects", key: "defects", width: 80, align: "center",
      render: (_, r) => {
        const total = (r.totalRejectQty ?? 0) + (r.totalReworkQty ?? 0);
        return (
          <Tag color={total > 0 ? "volcano" : "default"} className="!rounded-lg !font-bold">
            {total}
          </Tag>
        );
      },
    },
    {
      title: "Downtime", key: "downtime", width: 100, align: "center",
      render: (_, r) => (
        <div className="text-center">
          <span className={`text-base font-bold ${(r.totalDowntime ?? 0) > 0 ? "text-purple-600" : "text-slate-300"}`}>
            {r.totalDowntime ?? 0}
          </span>
          <span className="text-[10px] text-slate-400 ml-0.5">min</span>
        </div>
      ),
    },
    {
      title: "Short MP", key: "shortmp", width: 90, align: "center",
      render: (_, r) => {
        const v = r.shortManpower ?? 0;
        return (
          <span className={`text-base font-bold ${v > 0 ? "text-red-500" : "text-green-500"}`}>{v}</span>
        );
      },
    },
    {
      title: "Status", key: "status", width: 100, align: "center",
      render: (_, r) => (
        <Tag
          color={r.status === "Submitted" ? "success" : "default"}
          className="!rounded-full !text-[11px] !font-semibold !px-3"
        >
          {r.status}
        </Tag>
      ),
      filters: [
        { text: "Submitted", value: "Submitted" },
        { text: "Draft",     value: "Draft"     },
      ],
      onFilter: (val, r) => r.status === val,
    },
    {
      title: "", key: "action", width: 60, align: "center", fixed: "right",
      render: (_, r) => (
        <Tooltip title="View full details">
          <Button type="text" size="small" icon={<Eye size={15} className="text-teal-600" />}
            className="!rounded-lg hover:!bg-teal-50"
            onClick={(e) => { e.stopPropagation(); handleRowClick(r); }} />
        </Tooltip>
      ),
    },
  ];

  /* ────────────────────────────────────────────────────
     RENDER
  ──────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-100">

      {/* ════════════════════════════════════════════════
          WHITE PROFESSIONAL NAVBAR
      ════════════════════════════════════════════════ */}
      <div
        className="bg-white sticky top-0 z-50"
        style={{ borderBottom: "1px solid #e5e7eb", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}
      >
        <div className="px-5 flex items-center justify-between gap-4 h-[60px]">

          {/* LEFT — branding */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
            
            >
               <img
                src="/src/assets/logo/pg-logo.png"
                alt="PG"
                className="w-20 h-20 object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentNode.innerHTML = '<span style="color:#fff;font-weight:800;font-size:14px;letter-spacing:0.5px">PG</span>';
                }}
              />
             </div> 
            <div className="leading-none">
              <div className="font-extrabold text-base" style={{ color: "#b00000", letterSpacing: "-0.3px" }}>
                PG-GROUP
              </div>
              <div className="text-[10px] font-medium text-slate-400 mt-0.5 tracking-wide uppercase">
                MIS Dashboard · {now.format("DD MMM YYYY")}
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200 mx-1" />
            <div>
              <div className="text-sm font-bold text-slate-800">Production Records</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Paint Shop Daily Log</div>
            </div>
          </div>

          {/* CENTRE — month picker + actions */}
          <div className="flex items-center gap-2 justify-center flex-1">
            <DatePicker
              picker="month"
              value={selectedMonth}
              onChange={handleMonthChange}
              allowClear={false}
              format="MMMM YYYY"
              className="!rounded-lg !font-semibold"
              style={{ width: 160 }}
            />
            <Tooltip title="Refresh records">
              <Button size="small" icon={<RefreshCcw size={13} />} loading={refreshing}
                onClick={handleRefresh}
                className="!rounded-lg !text-slate-600 !border-slate-300 hover:!border-teal-400 hover:!text-teal-600">
                Refresh
              </Button>
            </Tooltip>
            <Tooltip title="Export to Excel">
              <Button size="small" icon={<Download size={13} />} loading={exporting}
                onClick={handleExportExcel}
                className="!rounded-lg !font-semibold !text-white"
                style={{ backgroundColor: "#059669", borderColor: "#059669" }}>
                Export
              </Button>
            </Tooltip>
          </div>

          {/* RIGHT — user + new entry + logout */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hidden sm:flex"
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
            >
              <UserCircle2 size={15} className="text-teal-600 flex-shrink-0" />
              <div className="leading-none">
                <div className="text-xs font-semibold text-slate-800">
                        {user?.name || "User"}
                </div>
                <div className="text-[10px] text-slate-400">
                  {user?.email || ""}
                </div>
              </div>
            </div>

            <Button
              type="primary"
              size="small"
              icon={<Plus size={13} />}
              onClick={() => navigate("/production-entry")}
              className="!rounded-lg !font-semibold"
              style={{ backgroundColor: "#0d9488", borderColor: "#0d9488" }}
            >
              New Entry
            </Button>

            <div className="w-px h-7 bg-slate-200" />

            <Tooltip title="Sign out">
              <Button size="small" icon={<LogOut size={13} />} onClick={handleLogout}
                className="!rounded-lg !font-semibold !text-red-600 !border-red-200 !bg-red-50 hover:!bg-red-100 hover:!border-red-300">
                Logout
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          PAGE BODY
      ════════════════════════════════════════════════ */}
      <div className="px-5 py-5 max-w-[1600px] mx-auto space-y-5">

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard icon={BarChart3}      label="Total Entries"       value={kpis.entries}         sub={`${kpis.submitted} submitted`}               tone="teal"   loading={loading} />
          <StatCard icon={Package}        label="Total Production"    value={kpis.totalProduction} sub="units produced"                              tone="blue"   loading={loading} />
          <StatCard icon={ShieldAlert}    label="Total Reject"        value={kpis.totalReject}     sub={`${kpis.totalReject} units`}                 tone="red"    loading={loading} />
          <StatCard icon={RotateCcw}      label="Total Rework"        value={kpis.totalRework}     sub={`${kpis.totalRework} units`}                 tone="amber"  loading={loading} />
          <StatCard icon={Clock3}         label="Total Downtime"      value={kpis.totalDowntime}   sub="minutes total"                               tone="purple" loading={loading} />
          <StatCard icon={Users}          label="Manpower Shortage"   value={kpis.shortManpower}   sub="cumulative shortage"                         tone={kpis.shortManpower > 0 ? "red" : "green"} loading={loading} />
        </div>

        {/* ── TABLE CARD ── */}
        <div className={CARD}>
          {/* Table header */}
          <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800 m-0">
                Daily Production Log
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 m-0">
                {selectedMonth.format("MMMM YYYY")} — {filteredRecords.length} record{filteredRecords.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Status filter pills */}
              <div className="flex items-center gap-1.5">
                {["All", "Submitted", "Draft"].map((s) => (
                  <button key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      statusFilter === s
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {s}
                    {s !== "All" && (
                      <span className="ml-1.5 opacity-70">
                        {s === "Submitted"
                          ? records.filter(r => r.status === "Submitted").length
                          : records.filter(r => r.status === "Draft").length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Search */}
              <Input
                prefix={<Search size={13} className="text-slate-400" />}
                placeholder="Search date, name, plant..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                className="!rounded-lg !w-52"
                size="small"
              />
            </div>
          </div>

          {/* Table */}
          <Table
            rowKey="_id"
            loading={loading}
            dataSource={filteredRecords}
            columns={columns}
            scroll={{ x: 1100 }}
            pagination={{
              pageSize: 15,
              showSizeChanger: true,
              showTotal: (total, range) => (
                <span className="text-xs text-slate-500">
                  Showing {range[0]}–{range[1]} of {total} records
                </span>
              ),
            }}
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              style: { cursor: "pointer" },
              className: "hover:bg-teal-50/30 transition-colors",
            })}
            locale={{
              emptyText: (
                <div className="py-16 flex flex-col items-center gap-3">
                  <div className="text-5xl">📋</div>
                  <div className="text-base font-semibold text-slate-600">No records yet</div>
                  <p className="text-sm text-slate-400 m-0">
                    No entries found for {selectedMonth.format("MMMM YYYY")}
                  </p>
                  <Button type="primary" icon={<Plus size={14} />}
                    onClick={() => navigate("/production-entry")}
                    className="!rounded-xl mt-1"
                    style={{ backgroundColor: "#0d9488", borderColor: "#0d9488" }}>
                    Add First Entry
                  </Button>
                </div>
              ),
            }}
            size="small"
          />
        </div>

      </div>

      {/* Detail Modal */}
      <RecordDetailModal
        record={selectedRecord}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedRecord(null); }}
      />

    </div>
  );
}