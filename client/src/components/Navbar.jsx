// Navbar.jsx
import logo from "../assets/logo/pg-logo.png";
import { Bell, LogOut, MapPin, Factory, Sun, Layers, CalendarDays, RefreshCcw } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDashboard } from "../context/DashboardContext";
import { Select, DatePicker, Button } from "antd";
import { DATE_PRESETS, rangeLabelFromPreset } from "../utils/dateRangePresets";

const FILTER_LABEL = "flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5";

export default function Navbar({ collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const dashboard = useDashboard();

  const isDashboardRoute = location.pathname === "/" || location.pathname === "/dashboard";
  const showFilters = isDashboardRoute && user?.role && user.role !== "user" && dashboard;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.log(error);
    }
  };

  const roleColors = {
    SUPER_ADMIN: "bg-red-100 text-red-700",
    PLANT_ADMIN: "bg-purple-100 text-purple-700",
    MANAGER: "bg-blue-100 text-blue-700",
    USER: "bg-green-100 text-green-700",
  };

  const { filters, setFilters, locations, plants, shifts, conveyors, datePreset, dateRange, onPresetChange, onCustomRangeChange, onRefresh } = dashboard || {};

  const filteredPlants = showFilters && filters?.locationId
    ? plants.filter((p) => String(p.locationId) === String(filters.locationId))
    : plants || [];

  const filteredShifts = (() => {
    if (!showFilters) return [];
    if (user?.role === "plantAdmin" && !filters.plantId) return [];
    if (filters.plantId) return shifts.filter((s) => String(s.plantId) === String(filters.plantId));
    return shifts;
  })();

  const filteredConveyors = (() => {
    if (!showFilters) return [];
    if (user?.role === "plantAdmin" && !filters.plantId) return [];
    if (filters.plantId) return conveyors.filter((c) => String(c.plantId) === String(filters.plantId));
    if (user?.role === "manager") return conveyors;
    if (filters.locationId) return conveyors.filter((c) => filteredPlants.some((p) => String(p._id) === String(c.plantId)));
    return conveyors;
  })();

  return (
    <header
      className={`fixed top-0 right-0 bg-white border-b border-slate-200 z-40 transition-all duration-300 ${
        collapsed ? "left-[51px]" : "left-[162px]"
      }`}
    >
      {/* ── TOP ROW — unchanged on every page ── */}
      <div className="h-[48px] flex items-center justify-between px-[17px]">
        <div className="flex items-center gap-[10px]">
          <img src={logo} alt="PG Logo" className="h-[24px] object-contain" />
          <div>
            <h1 className="font-semibold text-[12px] text-slate-800 leading-tight">
              Paint Shop MIS & OEE
            </h1>
            <p className="text-[9px] text-slate-500">Production Monitoring System</p>
          </div>
        </div>

        <div className="flex items-center gap-[10px]">
          <button className="relative h-[31px] w-[31px] rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-all">
            <Bell size={14} className="text-slate-600" />
            <span className="absolute top-[7px] right-[7px] h-[7px] w-[7px] rounded-full bg-red-500"></span>
          </button>

          <div className="flex items-center gap-[10px] border border-slate-200 rounded-full pl-[7px] pr-[10px] py-[3px] bg-white shadow-sm">
            <div className="w-[27px] h-[27px] rounded-full bg-cyan-700 text-white flex items-center justify-center text-[10px] font-semibold uppercase">
              {user?.name ? user.name.charAt(0) : "U"}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[9px] font-semibold text-slate-800">
                {user?.name || "User"}
              </span>
              <span className={`text-[8px] px-[7px] py-[2px] rounded-full w-fit font-medium ${roleColors[user?.role] || "bg-slate-100 text-slate-700"}`}>
                {user?.role || "USER"}
              </span>
            </div>
            <button onClick={handleLogout} className="ml-[3px] h-[27px] w-[27px] rounded-full hover:bg-red-50 flex items-center justify-center transition-all">
              <LogOut size={14} className="text-red-600" />
            </button>
          </div>
        </div>
      </div>

      {/* ── FILTER ROW — Dashboard route only, superAdmin/plantAdmin/manager only ── */}
      {showFilters && (
        <div className="h-[56px] border-t border-slate-100 bg-slate-50/60 flex items-end gap-2 px-[17px] overflow-x-auto">

          {user?.role === "superAdmin" && (
            <div>
              <div className={FILTER_LABEL}><MapPin size={9} /> Location</div>
              <Select
                size="small" style={{ width: 140 }} placeholder="All Locations"
                value={filters.locationId || ""}
                onChange={(v) => setFilters((p) => ({ ...p, locationId: v || "", plantId: "", shiftId: "", conveyorId: "" }))}
                options={[{ value: "", label: "All Locations" }, ...locations.map((i) => ({ value: String(i._id), label: i.locationName }))]}
              />
            </div>
          )}

          {user?.role === "plantAdmin" && (
            <div>
              <div className={FILTER_LABEL}><MapPin size={9} /> Location</div>
              <Select
                size="small" style={{ width: 140 }} disabled value={filters.locationId || ""}
                options={
                  locations.length
                    ? locations.map((i) => ({ value: String(i._id), label: i.locationName }))
                    : [{ value: String(filters.locationId), label: user?.locationName || "My Location" }]
                }
              />
            </div>
          )}

          {user?.role === "manager" && (
            <div>
              <div className={FILTER_LABEL}><Factory size={9} /> Plant</div>
              <Select
                size="small" style={{ width: 140 }} disabled value={filters.plantId || ""}
                options={plants.map((i) => ({ value: String(i._id), label: i.plantName }))}
              />
            </div>
          )}

          {(user?.role === "superAdmin" || user?.role === "plantAdmin") && (
            <div>
              <div className={FILTER_LABEL}><Factory size={9} /> Plant</div>
              <Select
                size="small" style={{ width: 140 }} placeholder="All Plants"
                value={filters.plantId || ""}
                onChange={(v) => setFilters((p) => ({ ...p, plantId: v || "", shiftId: "", conveyorId: "" }))}
                options={[{ value: "", label: "All Plants" }, ...filteredPlants.map((i) => ({ value: String(i._id), label: i.plantName }))]}
              />
            </div>
          )}

          <div>
            <div className={FILTER_LABEL}><Sun size={9} /> Shift</div>
            <Select
              size="small" style={{ width: 130 }} placeholder="All Shifts"
              value={filters.shiftId || ""}
              disabled={user?.role === "plantAdmin" && !filters.plantId}
              onChange={(v) => setFilters((p) => ({ ...p, shiftId: v || "", conveyorId: "" }))}
              options={[{ value: "", label: "All Shifts" }, ...filteredShifts.map((i) => ({ value: String(i._id), label: i.shiftName }))]}
            />
          </div>

          <div>
            <div className={FILTER_LABEL}><Layers size={9} /> Conveyor</div>
            <Select
              size="small" style={{ width: 140 }} placeholder="All Conveyors"
              value={filters.conveyorId || ""}
              disabled={
                (user?.role === "plantAdmin" && !filters.plantId) ||
                (user?.role === "superAdmin" && !filters.plantId && !!filters.locationId)
              }
              onChange={(v) => setFilters((p) => ({ ...p, conveyorId: v || "" }))}
              options={[{ value: "", label: "All Conveyors" }, ...filteredConveyors.map((i) => ({ value: String(i._id), label: i.conveyorName }))]}
            />
          </div>

          <div>
            <div className={FILTER_LABEL}><CalendarDays size={9} /> Date Range</div>
            <Select
              size="small" style={{ width: 130 }} value={datePreset} onChange={onPresetChange}
              options={DATE_PRESETS.map((p) => ({ value: p.key, label: p.key === "custom" ? p.label : rangeLabelFromPreset(p.key) }))}
            />
          </div>

          {datePreset === "custom" && (
            <div>
              <div className={FILTER_LABEL}>&nbsp;</div>
              <DatePicker.RangePicker size="small" value={dateRange} onChange={onCustomRangeChange} format="DD MMM YYYY" allowClear={false} />
            </div>
          )}

          <div>
            <Button
              size="small" type="primary" icon={<RefreshCcw size={11} />} onClick={onRefresh}
              className="!rounded-lg !font-semibold" style={{ backgroundColor: "#0d9488", borderColor: "#0d9488" }}
            >
              Refresh
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}