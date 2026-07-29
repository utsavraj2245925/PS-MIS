// Navbar.jsx
import logo from "../assets/logo/pg-logo.png";
import { Bell, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ collapsed }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.log(error);
    }
  };

  const roleColors = {
    SUPER_ADMIN: "bg-red-100 text-red-700",
    PLANT_ADMIN: "bg-purple-100 text-purple-700",
    MANAGER: "bg-blue-100 text-blue-700",
    USER: "bg-green-100 text-green-700",
  };

  return (
    <header
      className={`fixed top-0 right-0 h-[48px] bg-white border-b border-slate-200 flex items-center justify-between px-[17px] z-40 transition-all duration-300 ${
        collapsed ? "left-[51px]" : "left-[162px]"
      }`}
    >
      {/* LEFT */}
      <div className="flex items-center gap-[10px]">
        <img src={logo} alt="PG Logo" className="h-[24px] object-contain" />

        <div>
          <h1 className="font-semibold text-[12px] text-slate-800 leading-tight">
            Paint Shop MIS & OEE
          </h1>
          <p className="text-[9px] text-slate-500">Production Monitoring System</p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-[10px]">
        {/* NOTIFICATION */}
        <button className="relative h-[31px] w-[31px] rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-all">
          <Bell size={14} className="text-slate-600" />
          <span className="absolute top-[7px] right-[7px] h-[7px] w-[7px] rounded-full bg-red-500"></span>
        </button>

        {/* USER CARD */}
        <div className="flex items-center gap-[10px] border border-slate-200 rounded-full pl-[7px] pr-[10px] py-[3px] bg-white shadow-sm">
          <div className="w-[27px] h-[27px] rounded-full bg-cyan-700 text-white flex items-center justify-center text-[10px] font-semibold uppercase">
            {user?.name ? user.name.charAt(0) : "U"}
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-[9px] font-semibold text-slate-800">
              {user?.name || "User"}
            </span>
            <span
              className={`text-[8px] px-[7px] py-[2px] rounded-full w-fit font-medium ${
                roleColors[user?.role] || "bg-slate-100 text-slate-700"
              }`}
            >
              {user?.role || "USER"}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="ml-[3px] h-[27px] w-[27px] rounded-full hover:bg-red-50 flex items-center justify-center transition-all"
          >
            <LogOut size={14} className="text-red-600" />
          </button>
        </div>
      </div>
    </header>
  );
}