export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white">
      <div className="p-5 border-b border-slate-700">
        <h2 className="text-xl font-bold">Paint Shop MIS</h2>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">

          <li className="px-4 py-3 rounded-lg hover:bg-slate-800 cursor-pointer">
            Dashboard
          </li>

          <li className="px-4 py-3 rounded-lg hover:bg-slate-800 cursor-pointer">
            Plant Master
          </li>

          <li className="px-4 py-3 rounded-lg hover:bg-slate-800 cursor-pointer">
            Model Master
          </li>

          <li className="px-4 py-3 rounded-lg hover:bg-slate-800 cursor-pointer">
            Part Master
          </li>

          <li className="px-4 py-3 rounded-lg hover:bg-slate-800 cursor-pointer">
            User Master
          </li>


          <li className="px-4 py-3 rounded-lg hover:bg-slate-800 cursor-pointer">
            Reports
          </li>

          <li className="px-4 py-3 rounded-lg hover:bg-slate-800 cursor-pointer">
            Settings
          </li>

        </ul>
      </nav>
    </aside>
  );
}