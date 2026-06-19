export default function DashboardPage() {
  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Dashboard
          </h1>

          <p className="text-sm text-slate-500">
            Paint Shop Production Monitoring Overview
          </p>
        </div>

        <div className="text-xs text-slate-500">
          Last Updated : Today 09:45 AM
        </div>

      </div>

      {/* FILTERS */}

      <div className="bg-white border border-slate-200 rounded-xl p-4">

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">

          <select className="h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600">
            <option>All Plants</option>
            <option>Plant 1</option>
            <option>Plant 2</option>
            <option>Plant 3</option>
          </select>

          <select className="h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600">
            <option>All Shifts</option>
            <option>Day Shift</option>
            <option>Night Shift</option>
          </select>

          <input
            type="date"
            className="h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
          />

          <button className="h-10 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-sm font-medium transition-all">
            Refresh Dashboard
          </button>

        </div>

      </div>

      {/* KPI CARDS */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        <div className="bg-white border border-slate-200 rounded-xl p-4">

          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Total Production
          </p>

          <h2 className="text-2xl font-bold text-cyan-700 mt-2">
            12,540
          </h2>

        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">

          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Rework Qty
          </p>

          <h2 className="text-2xl font-bold text-amber-500 mt-2">
            342
          </h2>

        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">

          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Rejection Qty
          </p>

          <h2 className="text-2xl font-bold text-red-500 mt-2">
            95
          </h2>

        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">

          <p className="text-xs text-slate-500 uppercase tracking-wide">
            OEE %
          </p>

          <h2 className="text-2xl font-bold text-emerald-600 mt-2">
            87%
          </h2>

        </div>

      </div>

      {/* PLANT PERFORMANCE OVERVIEW */}

      <div>

        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Plant Performance Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="bg-white border border-slate-200 rounded-xl p-4">

            <h3 className="text-sm font-semibold text-slate-700">
              Plant 1
            </h3>

            <p className="text-2xl font-bold text-emerald-600 mt-3">
              89%
            </p>

            <p className="text-xs text-slate-500 mt-1">
              OEE Performance
            </p>

          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">

            <h3 className="text-sm font-semibold text-slate-700">
              Plant 2
            </h3>

            <p className="text-2xl font-bold text-amber-500 mt-3">
              84%
            </p>

            <p className="text-xs text-slate-500 mt-1">
              OEE Performance
            </p>

          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">

            <h3 className="text-sm font-semibold text-slate-700">
              Plant 3
            </h3>

            <p className="text-2xl font-bold text-emerald-600 mt-3">
              91%
            </p>

            <p className="text-xs text-slate-500 mt-1">
              OEE Performance
            </p>

          </div>

        </div>

      </div>

      {/* PLANT WISE PRODUCTION */}

      <div>

        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Plant Wise Production
        </h2>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          <div className="bg-white border border-slate-200 rounded-xl p-4">

            <div className="flex justify-between items-center mb-3">

              <h3 className="text-sm font-semibold text-slate-700">
                Plant 1
              </h3>

              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                Active
              </span>

            </div>

            <div className="space-y-3">

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Target</span>
                  <span>5,000</span>
                </div>

                <div className="h-2 bg-slate-200 rounded-full">
                  <div className="h-2 bg-cyan-600 rounded-full w-[90%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Actual</span>
                  <span>4,520</span>
                </div>

                <div className="h-2 bg-slate-200 rounded-full">
                  <div className="h-2 bg-emerald-500 rounded-full w-[85%]"></div>
                </div>
              </div>

            </div>

          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">

            <div className="flex justify-between items-center mb-3">

              <h3 className="text-sm font-semibold text-slate-700">
                Plant 2
              </h3>

              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                Active
              </span>

            </div>

            <div className="space-y-3">

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Target</span>
                  <span>4,000</span>
                </div>

                <div className="h-2 bg-slate-200 rounded-full">
                  <div className="h-2 bg-cyan-600 rounded-full w-[88%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Actual</span>
                  <span>3,650</span>
                </div>

                <div className="h-2 bg-slate-200 rounded-full">
                  <div className="h-2 bg-emerald-500 rounded-full w-[82%]"></div>
                </div>
              </div>

            </div>

          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">

            <div className="flex justify-between items-center mb-3">

              <h3 className="text-sm font-semibold text-slate-700">
                Plant 3
              </h3>

              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                Maintenance
              </span>

            </div>

            <div className="space-y-3">

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Target</span>
                  <span>3,500</span>
                </div>

                <div className="h-2 bg-slate-200 rounded-full">
                  <div className="h-2 bg-cyan-600 rounded-full w-[75%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Actual</span>
                  <span>2,950</span>
                </div>

                <div className="h-2 bg-slate-200 rounded-full">
                  <div className="h-2 bg-amber-500 rounded-full w-[68%]"></div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* SHIFT SUMMARY */}

      <div>

        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Shift Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="bg-white border border-slate-200 rounded-xl p-4">

            <p className="text-xs uppercase text-slate-500">
              Shift A
            </p>

            <h3 className="text-2xl font-bold text-cyan-700 mt-2">
              4,250
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              Units Produced
            </p>

          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">

            <p className="text-xs uppercase text-slate-500">
              Shift B
            </p>

            <h3 className="text-2xl font-bold text-emerald-600 mt-2">
              4,110
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              Units Produced
            </p>

          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">

            <p className="text-xs uppercase text-slate-500">
              Shift C
            </p>

            <h3 className="text-2xl font-bold text-amber-500 mt-2">
              3,980
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              Units Produced
            </p>

          </div>

        </div>

      </div>

      {/* RECENT PRODUCTION ENTRIES */}

      <div>

        <div className="flex items-center justify-between mb-4">

          <h2 className="text-lg font-semibold text-slate-800">
            Recent Production Entries
          </h2>

          <button className="text-sm text-cyan-700 hover:text-cyan-800 font-medium">
            View All
          </button>

        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-50">

                <tr>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                    Date
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                    Plant
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                    Shift
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                    Model
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                    Quantity
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                <tr className="border-t">
                  <td className="px-4 py-3 text-sm">19-Jun-2026</td>
                  <td className="px-4 py-3 text-sm">Plant 1</td>
                  <td className="px-4 py-3 text-sm">A</td>
                  <td className="px-4 py-3 text-sm">Model X</td>
                  <td className="px-4 py-3 text-sm">1250</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                      Completed
                    </span>
                  </td>
                </tr>

                <tr className="border-t">
                  <td className="px-4 py-3 text-sm">19-Jun-2026</td>
                  <td className="px-4 py-3 text-sm">Plant 2</td>
                  <td className="px-4 py-3 text-sm">B</td>
                  <td className="px-4 py-3 text-sm">Model Y</td>
                  <td className="px-4 py-3 text-sm">980</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      Running
                    </span>
                  </td>
                </tr>

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* PRODUCTION TREND */}

      <div>

        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Production Trend
        </h2>

        <div className="bg-white border border-slate-200 rounded-xl p-4">

          <div className="h-64 flex items-end justify-between gap-2">

            {[65, 80, 55, 90, 75, 95, 85].map((value, index) => (
              <div
                key={index}
                className="flex flex-col items-center flex-1"
              >
                <div
                  className="w-full bg-cyan-600 rounded-t-md"
                  style={{
                    height: `${value}%`,
                  }}
                ></div>

                <span className="text-xs text-slate-500 mt-2">
                  D{index + 1}
                </span>
              </div>
            ))}

          </div>

        </div>

      </div>

      {/* TOP MODELS & DEFECT ANALYSIS */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* TOP MODELS */}

        <div className="bg-white border border-slate-200 rounded-xl p-4">

          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Top Running Models
          </h2>

          <div className="space-y-4">

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-slate-700">
                  Model X
                </span>

                <span className="text-sm font-medium">
                  4,250
                </span>
              </div>

              <div className="h-2 bg-slate-200 rounded-full">
                <div className="h-2 bg-cyan-600 rounded-full w-[90%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-slate-700">
                  Model Y
                </span>

                <span className="text-sm font-medium">
                  3,890
                </span>
              </div>

              <div className="h-2 bg-slate-200 rounded-full">
                <div className="h-2 bg-emerald-600 rounded-full w-[80%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-slate-700">
                  Model Z
                </span>

                <span className="text-sm font-medium">
                  3,150
                </span>
              </div>

              <div className="h-2 bg-slate-200 rounded-full">
                <div className="h-2 bg-amber-500 rounded-full w-[70%]"></div>
              </div>
            </div>

          </div>

        </div>

        {/* DEFECT ANALYSIS */}

        <div className="bg-white border border-slate-200 rounded-xl p-4">

          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Defect Analysis
          </h2>

          <div className="space-y-3">

            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-slate-700">
                Paint Peel Off
              </span>

              <span className="font-semibold text-red-500">
                38
              </span>
            </div>

            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-slate-700">
                Dust Marks
              </span>

              <span className="font-semibold text-amber-500">
                24
              </span>
            </div>

            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-slate-700">
                Color Variation
              </span>

              <span className="font-semibold text-orange-500">
                19
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-700">
                Scratch Marks
              </span>

              <span className="font-semibold text-red-600">
                14
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* OEE SUMMARY */}

      <div>

        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          OEE Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="bg-white border border-slate-200 rounded-xl p-4">

            <p className="text-xs uppercase text-slate-500">
              Availability
            </p>

            <h3 className="text-3xl font-bold text-cyan-700 mt-3">
              92%
            </h3>

          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">

            <p className="text-xs uppercase text-slate-500">
              Performance
            </p>

            <h3 className="text-3xl font-bold text-emerald-600 mt-3">
              88%
            </h3>

          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">

            <p className="text-xs uppercase text-slate-500">
              Quality
            </p>

            <h3 className="text-3xl font-bold text-amber-500 mt-3">
              96%
            </h3>

          </div>

        </div>

      </div>

    </div>
  );
}

      