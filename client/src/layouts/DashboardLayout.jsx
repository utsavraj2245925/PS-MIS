import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ children }) {

  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-slate-100 min-h-screen">

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div
        className={`transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >

        <Navbar collapsed={collapsed} />

        <main className="pt-24 p-6">
          {children}
        </main>

      </div>

    </div>
  );
}