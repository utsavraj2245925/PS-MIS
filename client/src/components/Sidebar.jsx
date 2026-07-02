import { Link,useLocation} from "react-router-dom";
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
} from "lucide-react";
export default function Sidebar({ collapsed,setCollapsed }) {
  const { user } = useAuth();
  const location = useLocation();
  const allMenus = {
    superAdmin: [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
    },

    {
      name: "Plant Master",
      path: "/plant-master",
      icon: Factory,
    },

    {
      name: "Model Master",
      path: "/model-master",
      icon: Boxes,
    },

    {
      name: "Part Master",
      path: "/part-master",
      icon: Package,
    },

    {
      name: "Manage Defects",
      path: "/manage-defects",
      icon: CheckCircle,
    },

    {
      name: "Manage Material",
      path: "/manage-material",
      icon: Package,
    },

    {
      name: "Manage Downtime",
      path: "/manage-downtime",
      icon: BarChart3,
    },

    {
      name: "User Master",
      path: "/user-master",
      icon: Users,
    },


    {
      name: "Production",
      path: "/production-entry",
      icon: ClipboardList,
    },

    ],

    plantAdmin: [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
    },

    ],

    manager: [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
    },

    {
      name: "Production",
      path: "/production-entry",
      icon: ClipboardList,
    },

    {
      name: "User Master",
      path: "/user-master",
      icon: Users,
    },
    ],

    user: [
    {
      name: "Production",
      path: "/production-entry",
      icon: ClipboardList,
    },
    ],

    };

    const menuItems =
    allMenus[user?.role] || [];


  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-slate-950 border-r border-slate-800 text-white transition-all duration-300 z-50 ${
        collapsed
          ? "w-[60px]"
          : "w-[190px]"
      }`}
    >
      {/* HEADER */}

      <div
        className={`h-14 border-b border-slate-800 flex items-center ${
          collapsed
            ? "justify-center"
            : "justify-between px-3"
        }`}
      >
        {!collapsed && (
          <h2 className="text-[11px] font-semibold tracking-wide text-slate-200">
            PAINT SHOP MIS
          </h2>
        )}

        <button
          onClick={() =>
            setCollapsed(!collapsed)
          }
          className="text-slate-400 hover:text-white transition-all"
        >
          {collapsed ? (
            <ChevronRight size={16} strokeWidth={2.5} />
          ) : (
            <ChevronLeft size={16} strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* MASTER DATA */}

      <div className="p-2">
        {!collapsed && (
          <p className="text-[9px] uppercase text-slate-500 px-2 mb-2">
            Master Data
          </p>
        )}

        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const active =
              location.pathname ===
              item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center rounded-lg transition-all duration-200 ${
                    collapsed
                      ? "justify-center h-10"
                      : "gap-3 px-3 h-10"
                  } ${
                    active
                      ? "bg-cyan-700 text-white"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Icon
                    size={18}
                    className="flex-shrink-0"
                  />

                  {!collapsed && (
                    <span className="text-[12px]">
                      {item.name}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Divider */}

        <div className="border-t border-slate-800 my-4"></div>

        {!collapsed && (
          <p className="text-[9px] uppercase text-slate-500 px-2 mb-2">
            Analytics
          </p>
        )}

        <ul className="space-y-1">
          <li>
            <button
              className={`w-full flex items-center rounded-lg text-slate-300 hover:bg-slate-800 transition-all ${
                collapsed
                  ? "justify-center h-10"
                  : "gap-3 px-3 h-10"
              }`}
            >
              <CheckCircle size={18} />

              {!collapsed && (
                <span className="text-[12px]">
                  Quality
                </span>
              )}
            </button>
          </li>

          <li>
            <button
              className={`w-full flex items-center rounded-lg text-slate-300 hover:bg-slate-800 transition-all ${
                collapsed
                  ? "justify-center h-10"
                  : "gap-3 px-3 h-10"
              }`}
            >
              <BarChart3 size={18} />

              {!collapsed && (
                <span className="text-[12px]">
                  Reports
                </span>
              )}
            </button>
          </li>

          <li>
            <button
              className={`w-full flex items-center rounded-lg text-slate-300 hover:bg-slate-800 transition-all ${
                collapsed
                  ? "justify-center h-10"
                  : "gap-3 px-3 h-10"
              }`}
            >
              <Settings size={18} />

              {!collapsed && (
                <span className="text-[12px]">
                  Settings
                </span>
              )}
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}