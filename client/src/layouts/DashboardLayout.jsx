// DashboardLayout.jsx
import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { DashboardProvider } from "../context/DashboardContext";

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <DashboardProvider>
      <div className="min-h-screen bg-slate-100">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        <div className={`transition-all duration-300 ${collapsed ? "ml-[51px]" : "ml-[162px]"}`}>
          <Navbar collapsed={collapsed} />

          <main className="px-[14px] pb-[14px] pt-[14px] lg:px-[20px]">
            <div className="w-full overflow-x-auto">{children}</div>
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}