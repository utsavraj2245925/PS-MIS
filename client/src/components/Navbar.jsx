// Navbar.jsx
import { useRef, useLayoutEffect } from "react";
import logo from "../assets/logo/pg-logo.png";
import { Bell, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDashboard } from "../context/DashboardContext";
import DashboardFilterBar from "./DashboardFilterBar";

export default function Navbar({ collapsed, onHeightChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const dashboard = useDashboard();
  const headerRef = useRef(null);

  const isDashboardRoute = location.pathname === "/" || location.pathname === "/dashboard";
  const showFilters = isDashboardRoute && user?.role && user.role !== "user" && dashboard;

  // Report the header's real rendered height, live — both up to
  // DashboardLayout (for <main>'s padding-top) and into DashboardContext
  // (for the sticky KPI row's offset). Both consumers derive from this
  // ONE measured number, so they can never drift apart the way two
  // independently-hardcoded pixel values did before.
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
    filters,
    setFilters,
    locations,
    plants,
    shifts,
    conveyors,
    datePreset,
    dateRange,
    onPresetChange,
    onCustomRangeChange,
    onRefresh,
  } = dashboard || {};

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 bg-white border-b border-slate-200 w-full"
    >
      <div
        className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-[17px] ${
          showFilters ? "min-h-[56px] py-1.5" : "h-[48px]"
        }`}
      >
        {/* Brand — left */}
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <img src={logo} alt="PG Logo" className="h-[22px] lg:h-[24px] object-contain shrink-0" />
          <div className="min-w-0 hidden sm:block">
            <h1 className="font-semibold text-[11px] lg:text-[12px] text-slate-800 leading-tight truncate">
              Paint Shop MIS & OEE
            </h1>
            <p className="text-[8px] lg:text-[9px] text-slate-500 truncate hidden md:block">
              Production Monitoring System
            </p>
          </div>
        </div>

        {/* Filters — center (dashboard only) */}
        {showFilters && (
          <div className="flex-1 min-w-0 flex justify-center overflow-x-auto px-1 [scrollbar-width:thin]">
            <DashboardFilterBar
              user={user}
              filters={filters}
              setFilters={setFilters}
              locations={locations}
              plants={plants}
              shifts={shifts}
              conveyors={conveyors}
              datePreset={datePreset}
              dateRange={dateRange}
              onPresetChange={onPresetChange}
              onCustomRangeChange={onCustomRangeChange}
              onRefresh={onRefresh}
            />
          </div>
        )}

        {/* User actions — right */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <button
            type="button"
            className="relative h-[31px] w-[31px] rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-all"
          >
            <Bell size={14} className="text-slate-600" />
            <span className="absolute top-[7px] right-[7px] h-[7px] w-[7px] rounded-full bg-red-500" />
          </button>

          <div className="flex items-center gap-2 border border-slate-200 rounded-full pl-[7px] pr-[10px] py-[3px] bg-white shadow-sm">
            <div className="w-[27px] h-[27px] rounded-full bg-cyan-700 text-white flex items-center justify-center text-[10px] font-semibold uppercase shrink-0">
              {user?.name ? user.name.charAt(0) : "U"}
            </div>
            <div className="flex flex-col leading-tight hidden lg:flex">
              <span className="text-[9px] font-semibold text-slate-800 max-w-[90px] truncate">
                {user?.name || "User"}
              </span>
              <span
                className={`text-[8px] px-[7px] py-[2px] rounded-full w-fit font-medium ${
                  roleColors[user?.role] || "bg-slate-100 text-slate-700"
                }`}
              >
                {user?.role || "USER"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="ml-[3px] h-[27px] w-[27px] rounded-full hover:bg-red-50 flex items-center justify-center transition-all"
            >
              <LogOut size={14} className="text-red-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}