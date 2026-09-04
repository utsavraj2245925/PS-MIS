// Navbar.jsx
import { useRef, useLayoutEffect } from "react";
import { Bell, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDashboard } from "../context/DashboardContext";
import DashboardFilterBar from "./DashboardFilterBar";

export default function Navbar({ collapsed, setCollapsed, onHeightChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const dashboard = useDashboard();
  const headerRef = useRef(null);

  const isDashboardRoute = location.pathname === "/" || location.pathname === "/dashboard";
  const isReportsRoute = location.pathname === "/reports";
  const showFilters = (isDashboardRoute || isReportsRoute) && user?.role && user.role !== "user" && dashboard;

  useLayoutEffect(() => {
    if (!headerRef.current) return;
    const report = () => {
      const h = headerRef.current.getBoundingClientRect().height;
      onHeightChange?.(h);
      dashboard?.setNavHeight?.(h);
    };
    report();
    const ro = new ResizeObserver(report);
    ro.observe(headerRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsed, showFilters]);

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

  const {
    filters, setFilters, locations, plants, shifts, conveyors,
    datePreset, dateRange, onPresetChange, onCustomRangeChange, onRefresh,
  } = dashboard || {};

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 bg-slate-200/95 backdrop-blur-sm border-b border-slate-300 shadow-sm w-full transition-all duration-500 ease-in-out"
    >
      <div className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-[17px] ${showFilters ? "min-h-[46px] py-1" : "h-[40px]"}`}>
        <button
          type="button"
          onClick={() => setCollapsed?.(!collapsed)}
          className="flex items-center justify-center h-[30px] w-[30px] rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all flex-shrink-0"
        >
          {collapsed ? <ChevronRight size={16} strokeWidth={2.5} /> : <ChevronLeft size={16} strokeWidth={2.5} />}
        </button>

        <div className="flex-col ml-1 hidden sm:flex">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-[14px] text-slate-900 tracking-tight leading-tight">
              Paint Shop MIS & OEE
            </h1>
            <span className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-full px-[7px] py-[1px]">
              <span className="relative flex h-[6px] w-[6px]">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-red-600" />
              </span>
              <span className="text-[8px] font-bold text-red-600">LIVE</span>
            </span>
          </div>
          <p className="text-[11px] text-red-600 font-medium">Production Monitoring System</p>
        </div>

        {showFilters && (
          <div className="flex-1 min-w-0 flex justify-center overflow-x-auto px-1 [scrollbar-width:thin]">
            <DashboardFilterBar
              user={user} filters={filters} setFilters={setFilters} locations={locations}
              plants={plants} shifts={shifts} conveyors={conveyors} datePreset={datePreset}
              dateRange={dateRange} onPresetChange={onPresetChange} onCustomRangeChange={onCustomRangeChange}
              onRefresh={onRefresh}
            />
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <button type="button" className="relative h-[31px] w-[31px] rounded-full border border-slate-300 bg-white flex items-center justify-center hover:bg-slate-50 transition-all">
            <Bell size={14} className="text-slate-600" />
            <span className="absolute top-[7px] right-[7px] h-[7px] w-[7px] rounded-full bg-red-500 ring-2 ring-slate-100" />
          </button>

          <div className="flex items-center gap-2 border border-slate-300 rounded-full pl-[7px] pr-[10px] py-[3px] bg-white shadow-sm">
            <div className="w-[27px] h-[27px] rounded-full bg-cyan-700 text-white flex items-center justify-center text-[10px] font-semibold uppercase shrink-0">
              {user?.name ? user.name.charAt(0) : "U"}
            </div>
            <div className="flex flex-col leading-tight hidden lg:flex">
              <span className="text-[9px] font-semibold text-slate-800 max-w-[90px] truncate">{user?.name || "User"}</span>
              <span className={`text-[8px] px-[7px] py-[2px] rounded-full w-fit font-medium ${roleColors[user?.role] || "bg-slate-100 text-slate-700"}`}>
                {user?.role || "USER"}
              </span>
            </div>
            <button type="button" onClick={handleLogout} className="ml-[3px] h-[27px] w-[27px] rounded-full hover:bg-red-50 flex items-center justify-center transition-all">
              <LogOut size={14} className="text-red-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}