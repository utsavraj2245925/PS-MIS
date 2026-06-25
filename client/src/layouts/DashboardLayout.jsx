import { useState } from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({
children,
}) {
const [collapsed, setCollapsed] =
useState(false);

// TEMP ROLE
// Later this will come from login user data

return ( <div className="min-h-screen bg-slate-100">


  {/* SIDEBAR */}

  <Sidebar
    collapsed={collapsed}
    setCollapsed={setCollapsed}
  />

  {/* MAIN CONTENT */}

  <div
    className={`transition-all duration-300 ${
      collapsed
        ? "ml-[60px]"
        : "ml-[190px]"
    }`}
  >

    {/* NAVBAR */}

    <Navbar collapsed={collapsed} />

    {/* PAGE CONTENT */}

    <main className="pt-[70px] px-4 pb-4 lg:px-6">

      <div className="w-full overflow-x-auto">
        {children}
      </div>

    </main>

  </div>

</div>


);
}
