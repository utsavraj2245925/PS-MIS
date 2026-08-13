// Sidebar.jsx
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
  ChevronLeft,
  ChevronRight,
  Clock3,
  Workflow,
} from "lucide-react";

export default function Sidebar({ collapsed, setCollapsed }) {
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

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-slate-950 border-r border-slate-800 text-white transition-all duration-300 z-50 ${
        collapsed ? "w-[51px]" : "w-[162px]"
      }`}
    >
      {/* HEADER */}
      <div
        className={`h-[48px] border-b border-slate-800 flex items-center ${
          collapsed ? "justify-center" : "justify-between px-[10px]"
        }`}
      >
        {!collapsed && (
          <h2 className="text-[9px] font-semibold tracking-wide text-slate-200">
            PAINT SHOP MIS
          </h2>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white transition-all"
        >
          {collapsed ? (
            <ChevronRight size={14} strokeWidth={2.5} />
          ) : (
            <ChevronLeft size={14} strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* MASTER DATA */}
      <div className="p-[7px]">
        {!collapsed && (
          <p className="text-[8px] uppercase text-slate-500 px-[7px] mb-[7px]">
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
                  } ${active ? "bg-cyan-700 text-white" : "text-slate-300 hover:bg-slate-800"}`}
                >
                  <Icon size={15} className="flex-shrink-0" />
                  {!collapsed && <span className="text-[10px]">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div className="border-t border-slate-800 my-[14px]"></div>

        {!collapsed && (
          <p className="text-[8px] uppercase text-slate-500 px-[7px] mb-[7px]">
            Analytics
          </p>
        )}

        <ul className="space-y-1">
          <li>
            <button
              className={`w-full flex items-center rounded-lg text-slate-300 hover:bg-slate-800 transition-all ${
                collapsed ? "justify-center h-[34px]" : "gap-[10px] px-[10px] h-[34px]"
              }`}
            >
              <CheckCircle size={15} />
              {!collapsed && <span className="text-[10px]">Live Analysis</span>}
            </button>
          </li>

          <li>
            <button
              className={`w-full flex items-center rounded-lg text-slate-300 hover:bg-slate-800 transition-all ${
                collapsed ? "justify-center h-[34px]" : "gap-[10px] px-[10px] h-[34px]"
              }`}
            >
              <BarChart3 size={15} />
              {!collapsed && <span className="text-[10px]">Reports</span>}
            </button>
          </li>

          <li>
            <button
              className={`w-full flex items-center rounded-lg text-slate-300 hover:bg-slate-800 transition-all ${
                collapsed ? "justify-center h-[34px]" : "gap-[10px] px-[10px] h-[34px]"
              }`}
            >
              <Settings size={15} />
              {!collapsed && <span className="text-[10px]">Settings</span>}
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}