import React, { useState } from "react";

export default function PlantMasterPage() {
  const [plantName, setPlantName] = useState("");
  const [plantCode, setPlantCode] = useState("");
  const [location, setLocation] = useState("");
  const [plantAdmin, setPlantAdmin] = useState("");
  const [status, setStatus] = useState("Active");

  const [conveyorLength, setConveyorLength] = useState("");
  const [conveyorSpeed, setConveyorSpeed] = useState("");
  const [pitchDistance, setPitchDistance] = useState("");
  const [setPerRound, setSetPerRound] = useState("");
  const [availableTime, setAvailableTime] = useState("630");
  const [efficiency, setEfficiency] = useState("100");

  const hangers =
    conveyorLength && pitchDistance
      ? Math.floor(conveyorLength / pitchDistance)
      : 0;

  const processTime =
    conveyorLength && conveyorSpeed
      ? (conveyorLength / conveyorSpeed).toFixed(1)
      : 0;

  const totalRounds =
    availableTime && processTime
      ? (availableTime / processTime).toFixed(1)
      : 0;

  const effectiveRounds =
    totalRounds
      ? (
          totalRounds *
          (Number(efficiency) / 100)
        ).toFixed(1)
      : 0;

  const productionPerShift =
    setPerRound && effectiveRounds
      ? Math.round(
          setPerRound * effectiveRounds
        )
      : 0;

  const totalTargetPerDay =
    productionPerShift * 2;

  return (
    <div className="min-h-screen bg-white p-6">

      {/* Header */}

      <div className="flex flex-col md:flex-row justify-between items-center mb-8">

        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Plant Master
          </h1>

          <p className="text-slate-500 mt-1">
            Manage all manufacturing plants and production capacities
          </p>
        </div>

        <div className="flex gap-3 mt-4 md:mt-0">

          <button className="px-5 py-2 bg-green-600 text-white rounded-xl shadow hover:bg-green-700">
            Export
          </button>

          <button className="px-5 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700">
            Add Plant
          </button>

        </div>

      </div>

      {/* Search */}

      <div className="bg-white border rounded-2xl shadow-sm p-4 mb-6">

        <div className="flex flex-col md:flex-row gap-4">

          <input
            type="text"
            placeholder="Search Plant..."
            className="border rounded-xl p-3 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select className="border rounded-xl p-3 w-full md:w-56">

            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>

          </select>

        </div>

      </div>

      {/* Statistics */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        <div className="bg-white border rounded-2xl p-6 shadow-sm">

          <h3 className="text-slate-500">
            Total Plants
          </h3>

          <p className="text-4xl font-bold text-blue-600 mt-2">
            3
          </p>

        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-sm">

          <h3 className="text-slate-500">
            Active Plants
          </h3>

          <p className="text-4xl font-bold text-green-600 mt-2">
            3
          </p>

        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-sm">

          <h3 className="text-slate-500">
            Inactive Plants
          </h3>

          <p className="text-4xl font-bold text-red-600 mt-2">
            0
          </p>

        </div>

      </div>

  
      {/* Add New Plant */}

      <div className="bg-white border rounded-2xl shadow-sm p-6 mb-8">

        <h2 className="text-2xl font-semibold text-slate-800 mb-6">
          Add New Plant
        </h2>

        <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          <input
            type="text"
            placeholder="Plant Name"
            value={plantName}
            onChange={(e) => setPlantName(e.target.value)}
            className="border p-3 rounded-xl"
          />

          <input
            type="text"
            placeholder="Plant Code"
            value={plantCode}
            onChange={(e) => setPlantCode(e.target.value)}
            className="border p-3 rounded-xl"
          />

          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border p-3 rounded-xl"
          />

          <input
            type="text"
            placeholder="Plant Admin"
            value={plantAdmin}
            onChange={(e) => setPlantAdmin(e.target.value)}
            className="border p-3 rounded-xl"
          />

          <input
            type="number"
            placeholder="Conveyor Length (m)"
            value={conveyorLength}
            onChange={(e) => setConveyorLength(e.target.value)}
            className="border p-3 rounded-xl"
          />

          <input
            type="number"
            placeholder="Conveyor Speed (m/min)"
            value={conveyorSpeed}
            onChange={(e) => setConveyorSpeed(e.target.value)}
            className="border p-3 rounded-xl"
          />

          <input
            type="number"
            placeholder="Pitch Distance (m)"
            value={pitchDistance}
            onChange={(e) => setPitchDistance(e.target.value)}
            className="border p-3 rounded-xl"
          />

          <input
            type="number"
            placeholder="Set Per Round"
            value={setPerRound}
            onChange={(e) => setSetPerRound(e.target.value)}
            className="border p-3 rounded-xl"
          />

          <input
            type="number"
            placeholder="Available Time (Minutes)"
            value={availableTime}
            onChange={(e) => setAvailableTime(e.target.value)}
            className="border p-3 rounded-xl"
          />

          <select
            value={efficiency}
            onChange={(e) => setEfficiency(e.target.value)}
            className="border p-3 rounded-xl"
          >
            <option value="100">100%</option>
            <option value="95">95%</option>
            <option value="85">85%</option>
            <option value="75">75%</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border p-3 rounded-xl"
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>

          <button
            type="button"
            className="bg-blue-600 text-white rounded-xl px-5 py-3 hover:bg-blue-700"
          >
            Save Plant
          </button>

        </form>

      </div>

      {/* Capacity Calculation */}

      <div className="bg-white border rounded-2xl shadow-sm p-6 mb-8">

        <h2 className="text-2xl font-semibold text-slate-800 mb-6">
          Plant Capacity Calculation
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">

          <div className="bg-slate-50 p-5 rounded-xl">
            <p className="text-slate-500 text-sm">
              Hangers
            </p>
            <h3 className="text-3xl font-bold text-blue-600">
              {hangers}
            </h3>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl">
            <p className="text-slate-500 text-sm">
              Process Time
            </p>
            <h3 className="text-3xl font-bold text-purple-600">
              {processTime}
            </h3>
            <span className="text-xs text-slate-500">
              Minutes
            </span>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl">
            <p className="text-slate-500 text-sm">
              Total Rounds
            </p>
            <h3 className="text-3xl font-bold text-indigo-600">
              {totalRounds}
            </h3>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl">
            <p className="text-slate-500 text-sm">
              Effective Rounds
            </p>
            <h3 className="text-3xl font-bold text-orange-600">
              {effectiveRounds}
            </h3>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl">
            <p className="text-slate-500 text-sm">
              Production / Shift
            </p>
            <h3 className="text-3xl font-bold text-green-600">
              {productionPerShift}
            </h3>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl">
            <p className="text-slate-500 text-sm">
              Target / Day
            </p>
            <h3 className="text-3xl font-bold text-red-600">
              {totalTargetPerDay}
            </h3>
          </div>

        </div>

      </div>

      {/* Plant List */}

      <div className="bg-white border rounded-2xl shadow-sm p-6">

        <h2 className="text-2xl font-semibold text-slate-800 mb-6">
          Plant List
        </h2>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>

              <tr className="bg-slate-100">

                <th className="p-3 text-left">Plant Name</th>
                <th className="p-3 text-left">Code</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Admin</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Target / Day</th>
                <th className="p-3 text-left">Actions</th>

              </tr>

            </thead>

            <tbody>

              <tr className="border-b">

                <td className="p-3">Plant A</td>
                <td className="p-3">PLA</td>
                <td className="p-3">Noida</td>
                <td className="p-3">Amit Kumar</td>
                <td className="p-3 text-green-600 font-semibold">
                  Active
                </td>
                <td className="p-3">4814</td>

                <td className="p-3">

                  <button className="bg-yellow-500 text-white px-3 py-1 rounded-lg mr-2">
                    Edit
                  </button>

                  <button className="bg-red-600 text-white px-3 py-1 rounded-lg">
                    Delete
                  </button>

                </td>

              </tr>

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}