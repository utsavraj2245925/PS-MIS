export default function DashboardPage() {
  return (
    <div>

      <h1 className="text-3xl font-bold mb-6">
        Dashboard
      </h1>

      {/* Dashboard Filters */}

      <div className="bg-white rounded-xl shadow p-4 mt-4 mb-6">

        <div className="flex flex-wrap gap-4">

          <select className="border rounded-lg px-4 py-2">
            <option>All Plants</option>
            <option>Plant 1</option>
            <option>Plant 2</option>
            <option>Plant 3</option>
          </select>

          <select className="border rounded-lg px-4 py-2">
            <option>All Shifts</option>
            <option>Day Shift</option>
            <option>Night Shift</option>
          </select>

          <input
            type="date"
            className="border rounded-lg px-4 py-2"
          />

          <button className="bg-blue-600 text-white px-5 py-2 rounded-lg">
            Refresh
          </button>

        </div>

      </div>

      <div className="grid grid-cols-4 gap-6">

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500">
            Total Production
          </p>

          <h2 className="text-3xl font-bold text-blue-600 mt-2">
            12,540
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500">
            Rework Qty
          </p>

          <h2 className="text-3xl font-bold text-yellow-500 mt-2">
            342
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500">
            Rejection Qty
          </p>

          <h2 className="text-3xl font-bold text-red-500 mt-2">
            95
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500">
            OEE %
          </p>

          <h2 className="text-3xl font-bold text-green-500 mt-2">
            87%
          </h2>
        </div>

            </div>

      {/* Plant Performance Overview */}

      <div className="mb-8">

        <h2 className="text-2xl font-bold mb-4">
          Plant Performance Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="bg-white p-5 rounded-xl shadow">
            <h3 className="font-bold text-lg">
              Plant 1
            </h3>

            <p className="text-green-600 text-3xl font-bold mt-3">
              89%
            </p>

            <p className="text-gray-500">
              OEE Performance
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow">
            <h3 className="font-bold text-lg">
              Plant 2
            </h3>

            <p className="text-yellow-500 text-3xl font-bold mt-3">
              84%
            </p>

            <p className="text-gray-500">
              OEE Performance
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow">
            <h3 className="font-bold text-lg">
              Plant 3
            </h3>

            <p className="text-green-600 text-3xl font-bold mt-3">
              91%
            </p>

            <p className="text-gray-500">
              OEE Performance
            </p>
          </div>

        </div>

      </div>                



      {/* Plant Wise Production */}

      <h2 className="text-2xl font-bold mt-10 mb-5">
        Plant Wise Production
      </h2>

      <div className="grid grid-cols-4 gap-6">

        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold text-lg">
            Plant 1
          </h3>

          <p className="text-gray-500 mt-2">
            Production
          </p>

          <h4 className="text-2xl font-bold text-blue-600">
            3,250
          </h4>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold text-lg">
            Plant 2
          </h3>

          <p className="text-gray-500 mt-2">
            Production
          </p>

          <h4 className="text-2xl font-bold text-blue-600">
            2,980
          </h4>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold text-lg">
            Plant 3
          </h3>

          <p className="text-gray-500 mt-2">
            Production
          </p>

          <h4 className="text-2xl font-bold text-blue-600">
            3,420
          </h4>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold text-lg">
            Plant 4
          </h3>

          <p className="text-gray-500 mt-2">
            Production
          </p>

          <h4 className="text-2xl font-bold text-blue-600">
            2,890
          </h4>
        </div>

      </div>

      {/* Shift Summary */}


      <h2 className="text-2xl font-bold mt-10 mb-5">
        Today's Shift Summary
      </h2>

      <div className="grid grid-cols-4 gap-6">

        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold">
            Day Shift
          </h3>

          <h4 className="text-3xl font-bold text-blue-600 mt-2">
            6,540
          </h4>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold">
            Night Shift
          </h3>

          <h4 className="text-3xl font-bold text-indigo-600 mt-2">
            6,000
          </h4>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold">
            Operating Time
          </h3>

          <h4 className="text-3xl font-bold text-orange-500 mt-2">
            630 Min
          </h4>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold">
            Availability
          </h3>

          <h4 className="text-3xl font-bold text-green-600 mt-2">
            87%
          </h4>
        </div>

            </div>

      {/* Recent Production */}

      <h2 className="text-2xl font-bold mt-10 mb-5">
        Recent Production
      </h2>

      <div className="bg-white rounded-xl shadow overflow-hidden">

        <table className="w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="text-left p-4">
                Plant
              </th>

              <th className="text-left p-4">
                Shift
              </th>

              <th className="text-left p-4">
                Model
              </th>

              <th className="text-left p-4">
                Part
              </th>

              <th className="text-left p-4">
                Qty
              </th>

            </tr>

          </thead>

          <tbody>

            <tr className="border-t">
              <td className="p-4">Plant 1</td>
              <td className="p-4">Day</td>
              <td className="p-4">20"</td>
              <td className="p-4">Front</td>
              <td className="p-4">3252</td>
            </tr>

            <tr className="border-t">
              <td className="p-4">Plant 2</td>
              <td className="p-4">Night</td>
              <td className="p-4">22"</td>
              <td className="p-4">Top Cover</td>
              <td className="p-4">1980</td>
            </tr>

            <tr className="border-t">
              <td className="p-4">Plant 3</td>
              <td className="p-4">Day</td>
              <td className="p-4">26"</td>
              <td className="p-4">Base</td>
              <td className="p-4">2450</td>
            </tr>

          </tbody>

        </table>

            </div>
      
      {/* Production Trend */}

        <div className="mt-8">
        <h2 className="text-3xl font-bold mb-4">
            Production Trend
        </h2>

        <div className="bg-white rounded-xl shadow p-6">
            <div className="grid grid-cols-6 gap-4 text-center">

            <div>
                <p className="text-gray-500">Mon</p>
                <h3 className="font-bold text-blue-600">
                10,500
                </h3>
            </div>

            <div>
                <p className="text-gray-500">Tue</p>
                <h3 className="font-bold text-blue-600">
                11,200
                </h3>
            </div>

            <div>
                <p className="text-gray-500">Wed</p>
                <h3 className="font-bold text-blue-600">
                10,800
                </h3>
            </div>

            <div>
                <p className="text-gray-500">Thu</p>
                <h3 className="font-bold text-blue-600">
                12,540
                </h3>
            </div>

            <div>
                <p className="text-gray-500">Fri</p>
                <h3 className="font-bold text-blue-600">
                11,800
                </h3>
            </div>

            <div>
                <p className="text-gray-500">Sat</p>
                <h3 className="font-bold text-blue-600">
                13,200
                </h3>
            </div>

            </div>
        </div>
        </div>
      
      {/* Top Models Production */}

      <div className="mt-8">

        <h2 className="text-3xl font-bold mb-4">
          Top Models Production
        </h2>

        <div className="bg-white rounded-xl shadow p-6">

          <div className="space-y-4">

            <div className="flex justify-between">
              <span>20"</span>
              <span className="font-bold text-blue-600">
                4,200
              </span>
            </div>

            <div className="flex justify-between">
              <span>22"</span>
              <span className="font-bold text-blue-600">
                3,100
              </span>
            </div>

            <div className="flex justify-between">
              <span>26"</span>
              <span className="font-bold text-blue-600">
                2,800
              </span>
            </div>

            <div className="flex justify-between">
              <span>20" Polar</span>
              <span className="font-bold text-blue-600">
                1,500
              </span>
            </div>

            <div className="flex justify-between">
              <span>18"</span>
              <span className="font-bold text-blue-600">
                1,240
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* Defect Summary */}

      <div className="mt-8">

        <h2 className="text-3xl font-bold mb-4">
          Defect Summary
        </h2>

        <div className="bg-white rounded-xl shadow p-6">

          <div className="space-y-4">

            <div className="flex justify-between">
              <span>Dent</span>
              <span className="font-bold text-red-500">
                25
              </span>
            </div>

            <div className="flex justify-between">
              <span>Scratch</span>
              <span className="font-bold text-red-500">
                18
              </span>
            </div>

            <div className="flex justify-between">
              <span>Orange Peel</span>
              <span className="font-bold text-red-500">
                10
              </span>
            </div>

            <div className="flex justify-between">
              <span>Dust</span>
              <span className="font-bold text-red-500">
                7
              </span>
            </div>

            <div className="flex justify-between">
              <span>Powder Missing</span>
              <span className="font-bold text-red-500">
                5
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* OEE Performance */}

      <h2 className="text-2xl font-bold mt-10 mb-5">
        OEE Performance
      </h2>

      <div className="grid grid-cols-3 gap-6">

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500">
            Availability
          </p>

          <h3 className="text-4xl font-bold text-green-600 mt-3">
            87%
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500">
            Performance
          </p>

          <h3 className="text-4xl font-bold text-blue-600 mt-3">
            91%
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500">
            Quality
          </p>

          <h3 className="text-4xl font-bold text-purple-600 mt-3">
            96%
          </h3>
        </div>

      </div>

    </div>
  );
}
