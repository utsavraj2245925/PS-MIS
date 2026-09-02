// Sidebar.jsx
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo/pg-logo.png";
import {
  LayoutDashboard,
  Factory,
  Boxes,
  Package,
  Users,
  ClipboardList,
  BarChart3,
  Settings,
  CheckCircle,
  Clock3,
  Workflow,
  Activity,
} from "lucide-react";

export default function Sidebar({ collapsed }) {
  const { user } = useAuth();
  const location = useLocation();

  const allMenus = {
    superAdmin: [
      { name: "Dashboard", path: "/", icon: LayoutDashboard },
      { name: "Plant Master", path: "/plant-master", icon: Factory },
      { name: "Manage Shift", path: "/manage-shift", icon: Clock3 },
      { name: "Manage Conveyor", path: "/manage-conveyor", icon: Workflow },
      { name: "Model Master", path: "/model-master", icon: Boxes },
      { name: "Part Master", path: "/part-master", icon: Package },
      { name: "Manage Defects", path: "/manage-defects", icon: CheckCircle },
      { name: "Manage Material", path: "/manage-material", icon: Package },
      { name: "Manage Downtime", path: "/manage-downtime", icon: BarChart3 },
      { name: "User Master", path: "/user-master", icon: Users },
      { name: "Production", path: "/production-entry", icon: ClipboardList },
    ],

    plantAdmin: [{ name: "Dashboard", path: "/", icon: LayoutDashboard }],

    manager: [
      { name: "Dashboard", path: "/", icon: LayoutDashboard },
      { name: "Production", path: "/production-entry", icon: ClipboardList },
      { name: "User Master", path: "/user-master", icon: Users },
    ],

    user: [{ name: "Production", path: "/production-entry", icon: ClipboardList }],
  };

  const menuItems = allMenus[user?.role] || [];
  const canViewReports = ["superAdmin", "plantAdmin", "manager"].includes(user?.role);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-slate-50 border-r border-slate-200 text-slate-700 transition-all duration-300 z-50 ${
        collapsed ? "w-[51px]" : "w-[162px]"
      }`}
    >
      {/* Brand header — logo now lives here, always visible even when
          collapsed. No toggle button here anymore — moved to Navbar. */}
      <div
        className={`border-b border-slate-200 flex items-center ${
          collapsed ? "h-[60px] justify-center" : "h-[60px] px-[16px] gap-3"
        }`}
      >
        <img src={logo} alt="PG Logo" className={`${collapsed ? "h-[40px] w-[40px]" : "h-[64px] w-[64px]"} object-contain flex-shrink-0`} />
        {!collapsed && (
          <div className="min-w-0 flex items-center">
            <h1 className="font-black text-[16px] text-slate-800 tracking-wide truncate">
              PSMS
            </h1>
          </div>
        )}
      </div>

      {/* MASTER DATA */}
      <div className="p-[7px]">
        {!collapsed && (
          <p className="text-[8px] uppercase font-semibold text-slate-400 px-[7px] mb-[7px] mt-[6px]">
            Master Data
          </p>
        )}

        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center rounded-lg transition-all duration-200 ${
                    collapsed ? "justify-center h-[34px]" : "gap-[10px] px-[10px] h-[34px]"
                  } ${
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                  }`}
                >
                  <Icon size={15} className="flex-shrink-0" />
                  {!collapsed && <span className="text-[10px] font-medium">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div className="border-t border-slate-200 my-[14px]"></div>

        {!collapsed && (
          <p className="text-[8px] uppercase font-semibold text-slate-400 px-[7px] mb-[7px]">
            Analytics
          </p>
        )}

        <ul className="space-y-1">
          <li>
            <Link
              to="/live-analysis"
              className={`w-full flex items-center rounded-lg transition-all ${
                collapsed ? "justify-center h-[34px]" : "gap-[10px] px-[10px] h-[34px]"
              } ${
                location.pathname === "/live-analysis"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
              }`}
            >
              <Activity size={15} />
              {!collapsed && <span className="text-[10px] font-medium">Live Analysis</span>}
            </Link>
          </li>

          {canViewReports && (
            <li>
              <Link
                to="/reports"
                className={`w-full flex items-center rounded-lg transition-all ${
                  collapsed ? "justify-center h-[34px]" : "gap-[10px] px-[10px] h-[34px]"
                } ${
                  location.pathname === "/reports"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                }`}
              >
                <BarChart3 size={15} />
                {!collapsed && <span className="text-[10px] font-medium">Reports</span>}
              </Link>
            </li>
          )}

          <li>
            <button
              className={`w-full flex items-center rounded-lg text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition-all ${
                collapsed ? "justify-center h-[34px]" : "gap-[10px] px-[10px] h-[34px]"
              }`}
            >
              <Settings size={15} />
              {!collapsed && <span className="text-[10px] font-medium">Settings</span>}
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}