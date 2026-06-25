export default function ShiftSection({
  formData,
  handleChange,
}) {

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

      {/* HEADER */}

      <div className="mb-5">

        <h2 className="text-xl font-bold text-slate-800">
          Shift Information
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Shift & reporting details
        </p>

      </div>

      {/* FORM GRID */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* DATE */}

        <div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Production Date
          </label>

          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-600"
          />

        </div>

        {/* SHIFT */}

        <div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Shift
          </label>

          <select
            name="shift"
            value={formData.shift}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-600"
          >

            <option value="Day">
              Day Shift
            </option>

            <option value="Night">
              Night Shift
            </option>

          </select>

        </div>

        {/* REPORT TIME */}

        <div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Report Time
          </label>

          <input
            type="text"
            value={new Date().toLocaleTimeString()}
            disabled
            className="w-full border border-slate-200 bg-slate-100 rounded-xl px-4 py-3 text-slate-600"
          />

        </div>

        {/* LOCATION */}

        <div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Location
          </label>

          <input
            type="text"
            value={formData.location}
            disabled
            className="w-full border border-slate-200 bg-slate-100 rounded-xl px-4 py-3 text-slate-700"
          />

        </div>

        {/* PLANT */}

        <div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Plant Name
          </label>

          <input
            type="text"
            value={formData.plant}
            disabled
            className="w-full border border-slate-200 bg-slate-100 rounded-xl px-4 py-3 text-slate-700"
          />

        </div>

        {/* REPORTED BY */}

        <div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Reported By
          </label>

          <input
            type="text"
            value={formData.reportedBy}
            disabled
            className="w-full border border-slate-200 bg-slate-100 rounded-xl px-4 py-3 text-slate-700"
          />

        </div>

        {/* EMAIL */}

        <div className="md:col-span-2 lg:col-span-3">

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email ID
          </label>

          <input
            type="text"
            value={formData.email}
            disabled
            className="w-full border border-slate-200 bg-slate-100 rounded-xl px-4 py-3 text-slate-700"
          />

        </div>

      </div>

    </div>
  );
}                           