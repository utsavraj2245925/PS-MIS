import { useState } from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({
  children,
}) {
  const [collapsed, setCollapsed] =
    useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div
        className={`transition-all duration-300 ${
          collapsed
            ? "ml-[60px]"
            : "ml-[190px]"
        }`}
      >
        <Navbar
          collapsed={collapsed}
        />

        <main className="pt-[70px] px-4 pb-4 lg:px-6">
          <div className="w-full overflow-x-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}