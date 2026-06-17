import { Link } from "react-router-dom";

export default function Sidebar({
  collapsed,
  setCollapsed,
}) {
  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-slate-900 text-white transition-all duration-300 z-50 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >

      <div className="p-4 flex justify-between items-center border-b border-slate-700">

        {!collapsed && (
          <h2 className="font-bold text-lg">
            Paint Shop MIS
          </h2>
        )}

        <button
          onClick={() =>
            setCollapsed(!collapsed)
          }
          className="text-xl"
        >
          ☰
        </button>

      </div>

      <nav className="mt-4">

        <ul className="space-y-2 px-2">

          <Link to="/">
            <li className="hover:bg-slate-800 rounded-lg p-3">
              📊 {!collapsed && "Dashboard"}
            </li>
          </Link>

          <Link to="/plant-master">
            <li className="hover:bg-slate-800 rounded-lg p-3">
              🏭 {!collapsed && "Plant Master"}
            </li>
          </Link>

          <Link to="/model-master">
            <li className="hover:bg-slate-800 rounded-lg p-3">
              📦 {!collapsed && "Model Master"}
            </li>
          </Link>

          <Link to="/part-master">
            <li className="hover:bg-slate-800 rounded-lg p-3">
              🧩 {!collapsed && "Part Master"}
            </li>
          </Link>

          <Link to="/user-master">
            <li className="hover:bg-slate-800 rounded-lg p-3">
              👤 {!collapsed && "User Master"}
            </li>
          </Link>

          <Link to="/production-entry">
            <li className="hover:bg-slate-800 rounded-lg p-3">
              🏗 {!collapsed && "Production Entry"}
            </li>
          </Link>

        </ul>

        <div className="border-t border-slate-700 mt-6 pt-6">

          <ul className="space-y-2 px-2">

            <li className="hover:bg-slate-800 rounded-lg p-3">
              ✅ {!collapsed && "Quality Inspection"}
            </li>

            <li className="hover:bg-slate-800 rounded-lg p-3">
              📈 {!collapsed && "Reports & Analysis"}
            </li>

            <li className="hover:bg-slate-800 rounded-lg p-3">
              ⚙️ {!collapsed && "Settings"}
            </li>

          </ul>

        </div>

      </nav>

    </aside>
  );
}