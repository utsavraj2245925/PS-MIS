// DashboardLayout.jsx
import { useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { DashboardProvider } from "../context/DashboardContext";

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const autoCollapseTimer = useRef(null);

  const handleSetCollapsed = (value) => {
    if (autoCollapseTimer.current) clearTimeout(autoCollapseTimer.current);
    setCollapsed(value);
  };

  const scheduleAutoCollapse = () => {
    if (collapsed) return;
    if (autoCollapseTimer.current) clearTimeout(autoCollapseTimer.current);
    autoCollapseTimer.current = setTimeout(() => setCollapsed(true), 3000);
  };

  useEffect(() => {
    return () => {
      if (autoCollapseTimer.current) clearTimeout(autoCollapseTimer.current);
    };
  }, []);

  return (
    <DashboardProvider>
      <div className="min-h-screen bg-slate-100">
        <Sidebar collapsed={collapsed} />

        <div className={`transition-[margin-left] duration-500 ease-in-out ${collapsed ? "ml-[51px]" : "ml-[162px]"}`}>
          <Navbar collapsed={collapsed} setCollapsed={handleSetCollapsed} />

          <main onClick={scheduleAutoCollapse} className="px-[14px] pb-[14px] pt-0 lg:px-[20px]">
            <div className="w-full">{children}</div>
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}