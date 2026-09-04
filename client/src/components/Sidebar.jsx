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

const navItemClass = (active, collapsed) =>
  `flex items-center rounded-lg transition-colors duration-200 ${
    collapsed ? "justify-center h-[34px]" : "gap-[10px] px-[10px] h-[34px]"
  } ${
    active
      ? "bg-red-50 text-red-700 font-semibold shadow-[inset_3px_0_0_0_theme(colors.red.600)]"
      : "text-slate-900 font-medium hover:bg-red-50/70 hover:text-red-700"
  }`;

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
      className={`fixed left-0 top-0 h-screen bg-slate-50 border-r border-slate-200 text-slate-700 transition-[width] duration-500 ease-in-out z-50 ${
        collapsed ? "w-[51px]" : "w-[162px]"
      }`}
    >
      <div
        className={`border-b border-slate-200 flex items-center ${
          collapsed ? "h-[60px] justify-center" : "h-[60px] px-[16px] gap-3"
        }`}
      >
        <img
          src={logo}
          alt="PG Logo"
          className={`${collapsed ? "h-[40px] w-[40px]" : "h-[64px] w-[64px]"} object-contain flex-shrink-0 transition-all duration-500 ease-in-out`}
        />
        {!collapsed && (
          <div className="min-w-0 flex items-center">
            <h1 className="font-extrabold text-[18px] tracking-tight text-slate-900 truncate">
              PSMS
            </h1>
          </div>
        )}
      </div>

      <div className="p-[7px]">
        {!collapsed && (
          <p className="text-[9px] font-semibold text-slate-400 px-[7px] mb-[7px] mt-[6px]">
            Master Data
          </p>
        )}

        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link to={item.path} className={navItemClass(active, collapsed)}>
                  <Icon size={15} className="flex-shrink-0" />
                  {!collapsed && <span className="text-[10px]">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-slate-200 my-[14px]"></div>

        {!collapsed && (
          <p className="text-[9px] font-semibold text-slate-400 px-[7px] mb-[7px]">
            Analytics
          </p>
        )}

        <ul className="space-y-1">
          <li>
            <Link to="/live-analysis" className={navItemClass(location.pathname === "/live-analysis", collapsed)}>
              <Activity size={15} className="flex-shrink-0" />
              {!collapsed && <span className="text-[10px]">Live Analysis</span>}
            </Link>
          </li>

          {canViewReports && (
            <li>
              <Link to="/reports" className={navItemClass(location.pathname === "/reports", collapsed)}>
                <BarChart3 size={15} className="flex-shrink-0" />
                {!collapsed && <span className="text-[10px]">Reports</span>}
              </Link>
            </li>
          )}

          <li>
            <button className={`w-full ${navItemClass(false, collapsed)}`}>
              <Settings size={15} className="flex-shrink-0" />
              {!collapsed && <span className="text-[10px]">Settings</span>}
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}