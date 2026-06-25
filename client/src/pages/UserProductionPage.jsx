import ProductionEntryPage from "./ProductionEntryPage";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function UserProductionPage() {

const navigate = useNavigate();

const { logout, user } = useAuth();

const handleLogout = async () => {


try {

  await fetch(
    "http://localhost:4000/api/auth/logout",
    {
      method: "POST",
      credentials: "include",
    }
  );

  logout();
  navigate("/login");
} catch (error) {
  console.log(error);
}

};

return (

<div className="min-h-screen bg-slate-100">

  {/* TOP BAR */}

  <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between shadow-sm">

    <div>

      <h1 className="text-lg font-semibold text-slate-800">
        Production Entry
      </h1>

      <p className="text-xs text-slate-500">
        Paint Shop MIS System
      </p>

    </div>

    <div className="flex items-center gap-3">

      <div className="text-right">

        <p className="text-sm font-medium text-slate-700">
          {user?.name}
        </p>

        <p className="text-xs text-slate-500">
          {user?.role}
        </p>

      </div>

      <button
        onClick={handleLogout}
        className="h-10 w-10 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-all"
      >

        <LogOut
          size={18}
          className="text-red-600"
        />

      </button>

    </div>

  </div>

  {/* CONTENT */}

  <div className="p-4">

    <div className="max-w-7xl mx-auto">

      <ProductionEntryPage />

    </div>

  </div>

</div>

);
}
