export default function ManpowerSection({
  formData,
  handleChange,
}) {

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

      {/* HEADER */}

      <div className="mb-5">

        <h2 className="text-xl font-bold text-slate-800">
          Manpower Details
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Shift manpower monitoring
        </p>

      </div>

      {/* GRID */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* REQUIRED */}

        <div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Required Manpower
          </label>

          <input
            type="number"
            name="requiredManpower"
            value={formData.requiredManpower}
            onChange={handleChange}
            placeholder="Enter required manpower"
            className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-600"
          />

        </div>

        {/* AVAILABLE */}

        <div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Available Manpower
          </label>

          <input
            type="number"
            name="availableManpower"
            value={formData.availableManpower}
            onChange={handleChange}
            placeholder="Enter available manpower"
            className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-600"
          />

        </div>

        {/* SHORT */}

        <div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Short Manpower
          </label>

          <input
            type="number"
            value={formData.shortManpower}
            disabled
            className="w-full border border-red-200 bg-red-50 rounded-xl px-4 py-3 text-red-700 font-semibold"
          />

        </div>

      </div>

    </div>
  );
}