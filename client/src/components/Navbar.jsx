import logo from "../assets/logo/pg-logo.png";
import { Bell } from "lucide-react";

export default function Navbar({ collapsed }) {
  return (
    <header
      className={`fixed top-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-5 z-40 transition-all duration-300 ${
        collapsed
          ? "left-[60px]"
          : "left-[190px]"
      }`}
    >
      {/* Left Section */}

      <div className="flex items-center gap-3">
        <img
          src={logo}
          alt="PG Logo"
          className="h-7 object-contain"
        />

        <div>
          <h1 className="font-semibold text-sm text-slate-800 leading-tight">
            Paint Shop MIS & OEE
          </h1>

          <p className="text-[10px] text-slate-500">
            Production Monitoring System
          </p>
        </div>
      </div>

      {/* Right Section */}

      <div className="flex items-center gap-4">
        {/* Notification */}

        <button className="relative text-slate-500 hover:text-cyan-700 transition-colors">
          <Bell size={18} />

          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        {/* User */}

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-cyan-700 text-white flex items-center justify-center text-xs font-semibold">
            A
          </div>

          <div className="leading-tight">
            <p className="text-xs font-medium text-slate-800">
              Admin
            </p>

            <p className="text-[10px] text-slate-500">
              Super Admin
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}