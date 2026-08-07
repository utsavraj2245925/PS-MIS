// DashboardLayout.jsx
import { useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { DashboardProvider } from "../context/DashboardContext";
import { useAuth } from "../context/AuthContext";

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const isDashboardRoute = location.pathname === "/" || location.pathname === "/dashboard";
  const showFilterRow = isDashboardRoute && user?.role && user.role !== "user";

  return (
    <DashboardProvider>
      <div className="min-h-screen bg-slate-100">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        <div
          className={`transition-all duration-300 ${
            collapsed ? "ml-[51px]" : "ml-[162px]"
          }`}
        >
          <Navbar collapsed={collapsed} />

          <main className={`${showFilterRow ? "pt-[116px]" : "pt-[60px]"} px-[14px] pb-[14px] lg:px-[20px]`}>
            <div className="w-full overflow-x-auto">{children}</div>
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}