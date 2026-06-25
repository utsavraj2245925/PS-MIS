export default function OEESection() {

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">

      <h2 className="text-lg font-semibold mb-5">
        OEE Calculation
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
          <h3 className="text-sm text-slate-500">
            Availability
          </h3>

          <p className="text-3xl font-bold text-blue-700 mt-2">
            0%
          </p>
        </div>

        <div className="bg-green-50 rounded-xl p-5 border border-green-100">
          <h3 className="text-sm text-slate-500">
            Performance
          </h3>

          <p className="text-3xl font-bold text-green-700 mt-2">
            0%
          </p>
        </div>

        <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-100">
          <h3 className="text-sm text-slate-500">
            Quality
          </h3>

          <p className="text-3xl font-bold text-yellow-700 mt-2">
            0%
          </p>
        </div>

        <div className="bg-purple-50 rounded-xl p-5 border border-purple-100">
          <h3 className="text-sm text-slate-500">
            OEE
          </h3>

          <p className="text-3xl font-bold text-purple-700 mt-2">
            0%
          </p>
        </div>

      </div>

    </div>
  );
}
