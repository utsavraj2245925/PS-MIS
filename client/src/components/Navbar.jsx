import logo
from "../assets/logo/pg-logo.png";

import {
  Bell,
  LogOut,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
export default function Navbar({collapsed }) {
  const navigate = useNavigate();
  const {
    user,
    logout,
  } = useAuth();

  // LOGOUT

  const handleLogout =
    async () => {
      try {
        await logout();
        navigate("/login");
      } catch (error) {
        console.log(error);
      }
    };

  // ROLE COLORS

  const roleColors = {
    SUPER_ADMIN:
      "bg-red-100 text-red-700",
    PLANT_ADMIN:
      "bg-purple-100 text-purple-700",
    MANAGER:
      "bg-blue-100 text-blue-700",
    USER:
      "bg-green-100 text-green-700",
  };
  return (
    <header
      className={`fixed top-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-5 z-40 transition-all duration-300 ${
        collapsed
          ? "left-[60px]"
          : "left-[190px]"
      }`}
    >

      {/* LEFT */}

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

      {/* RIGHT */}

      <div className="flex items-center gap-3">

        {/* NOTIFICATION */}

        <button className="relative h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-all">
          <Bell
            size={17}
            className="text-slate-600"
          />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        {/* USER CARD */}

        <div className="flex items-center gap-3 border border-slate-200 rounded-full pl-2 pr-3 py-1 bg-white shadow-sm">

          {/* AVATAR */}

          <div className="w-8 h-8 rounded-full bg-cyan-700 text-white flex items-center justify-center text-xs font-semibold uppercase">

            {user?.name
              ? user.name.charAt(0)
              : "U"}
          </div>

          {/* USER INFO */}

          <div className="flex flex-col leading-tight">
            <span className="text-[11px] font-semibold text-slate-800">
              {user?.name || "User"}
            </span>
            <span
              className={`text-[9px] px-2 py-[2px] rounded-full w-fit font-medium ${
                roleColors[user?.role] ||
                "bg-slate-100 text-slate-700"
              }`}
            >
              {user?.role || "USER"}
            </span>
          </div>

          {/* LOGOUT */}

          <button
            onClick={handleLogout}
            className="ml-1 h-8 w-8 rounded-full hover:bg-red-50 flex items-center justify-center transition-all"
          >
            <LogOut
              size={16}
              className="text-red-600"
            />
          </button>
        </div>
      </div>
    </header>
  );

}