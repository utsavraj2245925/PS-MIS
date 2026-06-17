import logo from "../assets/logo/pg-logo.png";

export default function Navbar({ collapsed }) {
  return (
    <header
      className={`fixed top-0 right-0 bg-white shadow-sm px-6 py-4 flex items-center justify-between z-50 transition-all duration-300 ${
        collapsed ? "left-20" : "left-64"
      }`}
    >

      <div className="flex items-center gap-3">
        <img
          src={logo}
          alt="PG Logo"
          className="h-10"
        />

        <div>
          <h1 className="font-bold text-lg">
            Paint Shop MIS & OEE
          </h1>

          <p className="text-sm text-gray-500">
            Production Monitoring System
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">

        <button className="text-gray-600">
          🔔
        </button>

        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
            A
          </div>

          <div>
            <p className="font-medium">
              Admin
            </p>

            <p className="text-xs text-gray-500">
              Super Admin
            </p>
          </div>
        </div>

      </div>

    </header>
  );
}