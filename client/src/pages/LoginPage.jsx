import { useState } from "react";
import logo from "../assets/logo/pg-logo.png";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance"; // ← use axiosInstance, not axios

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.post("/auth/login", { email, password });
      const { user } = response.data; // ← no token needed, it's in the cookie now

      login(user); // ← only user, no token

      // ROLE BASED REDIRECT
      if (user.role === "USER") {
        navigate("/production-entry");
      } else {
        navigate("/");
      }

    } catch (error) {
      setError(error.response?.data?.message || "Login Failed");
    } finally {
      setLoading(false);
    }
  };

return ( <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex">


  {/* Left Side */}
  <div className="hidden lg:flex w-1/2 items-center justify-center relative overflow-hidden">

    <div className="absolute w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>

    <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl"></div>

    <div className="relative z-10 max-w-lg px-10">

      <h1 className="text-5xl font-bold text-slate-800 leading-tight">
        Paint Shop
        <span className="text-blue-600">
          {" "}Management
        </span>
      </h1>

      <p className="mt-6 text-slate-600 text-lg">
        Real-time production tracking,
        paint consumption analytics,
        quality monitoring, defect
        management, inventory control
        and industrial reporting in
        one platform.
      </p>

      <div className="grid grid-cols-2 gap-4 mt-10">

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md">
          <h3 className="font-semibold text-slate-700">
            Production
          </h3>

          <p className="text-sm text-slate-500">
            Live shop floor visibility
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md">
          <h3 className="font-semibold text-slate-700">
            Quality
          </h3>

          <p className="text-sm text-slate-500">
            Inspection & tracking
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md">
          <h3 className="font-semibold text-slate-700">
            Inventory
          </h3>

          <p className="text-sm text-slate-500">
            Paint stock monitoring
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md">
          <h3 className="font-semibold text-slate-700">
            Analytics
          </h3>

          <p className="text-sm text-slate-500">
            Enterprise dashboards
          </p>
        </div>

      </div>

    </div>

  </div>


  {/* Right Side */}
  <div className="w-full lg:w-1/2 flex items-center justify-center px-6">

    <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white shadow-2xl rounded-3xl p-8">

      <div className="flex flex-col items-center">

        <img
          src={logo}
          alt="PG Logo"
          className="w-24 h-24 object-contain"
        />

        <h2 className="mt-4 text-3xl font-bold text-slate-800">
          Paint Shop MIS
        </h2>

        <p className="text-slate-500 mt-2 text-center">
          Paint Shop Management System
        </p>

      </div>


      <div className="mt-8 space-y-4">

        {/* ERROR */}
        {error && (

          <div className="bg-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>

        )}


        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
        />


        <div className="flex justify-between text-sm">

          <label className="flex items-center gap-2">

            <input type="checkbox" />

            Remember Me

          </label>

          <button className="text-blue-600 hover:text-blue-700">
            Forgot Password?
          </button>

        </div>


        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-semibold py-3 rounded-xl"
        >

          {loading
            ? "Logging In..."
            : "Login"}

        </button>

      </div>

    </div>

  </div>

</div>

);
}

export default LoginPage;
