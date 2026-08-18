import { useCallback, useEffect, useState } from "react";
import { Button, Card, Popconfirm, Table, Tag, Tooltip, message } from "antd";
import dayjs from "dayjs";
import {
  BarChart3,
  Factory,
  Package,
  Users,
  Wrench,
  Clock3,
  Trash2,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useDashboard } from "../context/DashboardContext";
import { RecordDetailModal } from "./ProductionRecordPage";
import axiosInstance from "../api/axiosInstance";

const API = axiosInstance;

function KpiCard({ title, value, subtitle, icon: Icon, color = "#0d9488" }) {
  return (
    <div
      className="relative min-w-0 rounded-lg border bg-white px-2.5 py-2 shadow-sm sm:px-3 sm:py-2.5"
      style={{ borderColor: `${color}33` }}
    >
      <div className="flex items-start justify-between gap-1.5">
        <p className="m-0 text-[9px] font-bold uppercase leading-tight tracking-wide text-slate-400 sm:text-[10px]">
          {title}
        </p>
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md sm:h-6 sm:w-6"
          style={{ backgroundColor: `${color}1A` }}
        >
          <Icon size={12} style={{ color }} />
        </span>
      </div>

      <p
        className="m-0 mt-1 truncate text-base font-black leading-none sm:mt-1.5 sm:text-xl"
        style={{ color }}
      >
        {value}
      </p>

      {subtitle && (
        <p className="m-0 mt-1 truncate text-[9px] text-slate-400 sm:text-[10px]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const { user } = useAuth();
  const { filters, dateRange, navHeight } = useDashboard();

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({
    target: 0,
    production: 0,
    achievement: 0,
    reject: 0,
    rework: 0,
    defects: 0,
    downtime: 0,
    shortage: 0,
  });

  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleRowClick = (record) => {
    setSelectedRecord(record);
    setDetailOpen(true);
  };

  const loadReport = useCallback(async () => {
    if (!dateRange?.[0] || !dateRange?.[1]) return;

    try {
      setLoading(true);

      const { data } = await API.get("/production/report", {
        params: {
          fromDate: dateRange[0].startOf("day").toISOString(),
          toDate: dateRange[1].endOf("day").toISOString(),
          locationId: filters.locationId || undefined,
          plantId: filters.plantId || undefined,
          shiftId: filters.shiftId || undefined,
          conveyorId: filters.conveyorId || undefined,
        },
      });

      setRecords(data?.data || []);
      setSummary(data?.summary || {});
    } catch (error) {
      console.error(error);
      message.error("Failed to load production report");
    } finally {
      setLoading(false);
    }
  }, [dateRange, filters]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleDelete = async (entryId) => {
    try {
      setDeletingId(entryId);

      await API.delete(`/production/${entryId}`);

      message.success("Production entry deleted successfully");

      // Reloads the table and all KPI totals after deletion.
      await loadReport();
    } catch (error) {
      console.error(error);

      message.error(
        error?.response?.data?.message || "Failed to delete production entry"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Derived subtitles for KPI cards (no logic/API changes, just display text)
  const rejectRate =
    summary.production > 0
      ? ((summary.reject / summary.production) * 100).toFixed(1)
      : "0.0";
  const reworkRate =
    summary.production > 0
      ? ((summary.rework / summary.production) * 100).toFixed(1)
      : "0.0";

  const columns = [
    {
      title: "Date & Time",
      key: "date",
      width: 96,
      render: (_, record) => (
        <div className="leading-tight">
          <div className="text-xs font-semibold text-slate-700">
            {dayjs(record.entryDate).format("DD MMM")}
          </div>
          <div className="text-[11px] text-slate-400">
            {dayjs(record.reportTime || record.createdAt).format("HH:mm")}
          </div>
        </div>
      ),
    },
    {
      title: "Location",
      dataIndex: "locationName",
      key: "location",
      width: 72,
      ellipsis: true,
      responsive: ["md"],
    },
    {
      title: "Plant",
      dataIndex: "plantName",
      key: "plant",
      width: 72,
      ellipsis: true,
    },
    {
      title: "Shift",
      dataIndex: "shiftName",
      key: "shift",
      width: 68,
      render: (value) =>
        value ? (
          <Tag color="cyan" className="m-0 text-[11px]">
            {value}
          </Tag>
        ) : (
          "—"
        ),
    },
    {
      title: "Reported By",
      key: "reportedBy",
      width: 96,
      ellipsis: true,
      responsive: ["lg"],
      render: (_, record) =>
        record.employeeName || record.reportedBy?.name || "—",
    },
    {
      title: "Target",
      key: "target",
      width: 64,
      align: "right",
      render: (_, record) =>
        Number(record.shiftSummary?.target || 0).toLocaleString(),
    },
    {
      title: "Prod.",
      dataIndex: "totalProductionQty",
      key: "production",
      width: 68,
      align: "right",
      render: (value) => (
        <span className="font-semibold text-blue-600">
          {Number(value || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Ach. %",
      key: "achievement",
      width: 68,
      align: "right",
      render: (_, record) => {
        const target = Number(record.shiftSummary?.target || 0);
        const production = Number(record.totalProductionQty || 0);
        const achievement = target > 0 ? (production / target) * 100 : 0;
        const color =
          achievement >= 90
            ? "text-emerald-600"
            : achievement >= 70
            ? "text-amber-600"
            : "text-red-500";

        return (
          <span className={`font-semibold ${color}`}>
            {achievement.toFixed(1)}%
          </span>
        );
      },
    },
    {
      title: "Rej.",
      dataIndex: "totalRejectQty",
      key: "reject",
      width: 52,
      align: "right",
      responsive: ["md"],
      render: (value) => <span className="text-red-500">{value || 0}</span>,
    },
    {
      title: "Rwk",
      dataIndex: "totalReworkQty",
      key: "rework",
      width: 52,
      align: "right",
      responsive: ["md"],
      render: (value) => (
        <span className="text-amber-600">{value || 0}</span>
      ),
    },
    {
      title: "Def.",
      dataIndex: "totalDefectQty",
      key: "defects",
      width: 52,
      align: "right",
      responsive: ["lg"],
    },
    {
      title: "D/T",
      dataIndex: "totalDowntime",
      key: "downtime",
      width: 64,
      align: "right",
      responsive: ["lg"],
      render: (value) => `${value || 0}m`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 84,
      render: (status) => (
        <Tag
          color={status === "Submitted" ? "green" : "orange"}
          className="m-0 text-[11px]"
        >
          {status || "Submitted"}
        </Tag>
      ),
    },

    ...(user?.role === "superAdmin"
      ? [
          {
            title: "",
            key: "action",
            width: 44,
            fixed: "right",
            align: "center",
            render: (_, record) => (
              <Popconfirm
                title="Delete production entry?"
                description="This action permanently deletes this production record."
                okText="Yes, Delete"
                cancelText="Cancel"
                okButtonProps={{
                  danger: true,
                  loading: deletingId === record._id,
                }}
                onConfirm={() => handleDelete(record._id)}
              >
                <Tooltip title="Delete">
                  <Button
                    danger
                    type="text"
                    size="small"
                    icon={<Trash2 size={14} />}
                    loading={deletingId === record._id}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Tooltip>
              </Popconfirm>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="p-3 sm:p-5">
      <style>{`
        .compact-reports-table .ant-table-thead > tr > th {
          padding: 8px 8px !important;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          color: #64748b;
          background: #f8fafc;
        }
        .compact-reports-table .ant-table-tbody > tr > td {
          padding: 7px 8px !important;
          font-size: 12.5px;
        }
        .compact-reports-table .ant-table-tbody > tr:hover > td {
          background: #f0fdfa;
        }
      `}</style>

      <div
        className="sticky z-30 -mx-3 -mt-3 border-b border-slate-200 bg-slate-100/95 px-3 py-2.5 backdrop-blur sm:-mx-5 sm:-mt-5 sm:px-5 sm:py-3"
        style={{ top: navHeight }}
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5 lg:grid-cols-8">
          <KpiCard
            title="Total Target"
            value={Number(summary.target || 0).toLocaleString()}
            subtitle={`${records.length} record${
              records.length === 1 ? "" : "s"
            }`}
            icon={Factory}
          />

          <KpiCard
            title="Achievement %"
            value={`${summary.achievement || 0}%`}
            subtitle="target vs achieved"
            icon={BarChart3}
            color="#0891b2"
          />

          <KpiCard
            title="Total Production"
            value={Number(summary.production || 0).toLocaleString()}
            subtitle="units produced"
            icon={Package}
            color="#2563eb"
          />

          <KpiCard
            title="Total Defects"
            value={Number(summary.defects || 0).toLocaleString()}
            subtitle="quality issues"
            icon={Wrench}
            color="#475569"
          />

          <KpiCard
            title="Total Reject"
            value={Number(summary.reject || 0).toLocaleString()}
            subtitle={`${rejectRate}% rate`}
            icon={Wrench}
            color="#dc2626"
          />

          <KpiCard
            title="Total Rework"
            value={Number(summary.rework || 0).toLocaleString()}
            subtitle={`${reworkRate}% rate`}
            icon={Package}
            color="#d97706"
          />

          <KpiCard
            title="Total Downtime"
            value={`${summary.downtime || 0} min`}
            subtitle="minutes total"
            icon={Clock3}
            color="#7c3aed"
          />

          <KpiCard
            title="Manpower Shortage"
            value={Number(summary.shortage || 0).toLocaleString()}
            subtitle="cumulative"
            icon={Users}
            color="#dc2626"
          />
        </div>
      </div>

      <div className="mb-4 mt-4 sm:mb-5">
        <h1 className="m-0 text-xl font-bold text-slate-800 sm:text-2xl">
          Production Reports
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View production records according to your assigned access.
        </p>
      </div>

      <Card
        title={`Production Records (${records.length})`}
        className="rounded-xl"
        styles={{ body: { padding: "8px 4px" } }}
      >
        <Table
          rowKey="_id"
          loading={loading}
          size="small"
          className="compact-reports-table"
          columns={columns}
          dataSource={records}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: "pointer" },
          })}
          scroll={{ x: "max-content" }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ["20", "50", "100"],
          }}
        />
      </Card>

      <RecordDetailModal
        record={selectedRecord}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedRecord(null);
        }}
      />
    </div>
  );
}