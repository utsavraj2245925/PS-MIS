import { useState } from "react";

export default function PartMasterPage() {
  const [model, setModel] = useState("");
  const [partName, setPartName] = useState("");
  const [area, setArea] = useState("");
  const [partsPerHanger, setPartsPerHanger] = useState("");
  const [status, setStatus] = useState("Active");

  const [filterModel, setFilterModel] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [partData, setPartData] = useState([
    {
      id: 1,
      model: '20"',
      partName: "Front Panel",
      area: 450,
      partsPerHanger: 12,
      status: "Active",
    },
    {
      id: 2,
      model: '20"',
      partName: "Top Cover",
      area: 320,
      partsPerHanger: 10,
      status: "Active",
    },
    {
      id: 3,
      model: '22"',
      partName: "Side RH",
      area: 280,
      partsPerHanger: 8,
      status: "Active",
    },
    {
      id: 4,
      model: '26"',
      partName: "Base",
      area: 510,
      partsPerHanger: 6,
      status: "Active",
    },
  ]);

  const resetForm = () => {
    setModel("");
    setPartName("");
    setArea("");
    setPartsPerHanger("");
    setStatus("Active");
    setEditId(null);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this part?")) {
      setPartData(partData.filter((part) => part.id !== id));
    }
  };

  const handleEdit = (part) => {
    setEditId(part.id);

    setModel(part.model);
    setPartName(part.partName);
    setArea(part.area);
    setPartsPerHanger(part.partsPerHanger);
    setStatus(part.status);

    setShowModal(true);
  };

  const handleSavePart = () => {
    if (!model || !partName) {
      alert("Please fill required fields");
      return;
    }

    const newPart = {
      id: Date.now(),
      model,
      partName,
      area,
      partsPerHanger,
      status,
    };

    setPartData([...partData, newPart]);

    resetForm();
  };

  const handleUpdatePart = () => {
    const updated = partData.map((part) =>
      part.id === editId
        ? {
            ...part,
            model,
            partName,
            area,
            partsPerHanger,
            status,
          }
        : part
    );

    setPartData(updated);
    setShowModal(false);
    resetForm();
  };

  const filteredParts = partData.filter((part) => {
    const matchesSearch =
      part.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.model.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModel =
      filterModel === "All" ||
      part.model === filterModel;

    const matchesStatus =
      filterStatus === "All" ||
      part.status === filterStatus;

    return (
      matchesSearch &&
      matchesModel &&
      matchesStatus
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      <div className="max-w-7xl mx-auto space-y-8">

        <div className="flex flex-col lg:flex-row justify-between items-center">

          <div>

            <h1 className="text-4xl font-bold text-slate-800">
              Part Master
            </h1>

            <p className="text-slate-500 mt-2">
              Manage Model-Part Configuration
            </p>

          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">

            <p className="text-slate-500 text-sm">
              Total Parts
            </p>

            <h2 className="text-4xl font-bold text-blue-600 mt-3">
              {partData.length}
            </h2>

          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">

            <p className="text-slate-500 text-sm">
              Active Parts
            </p>

            <h2 className="text-4xl font-bold text-green-600 mt-3">
              {partData.filter(
                (p) => p.status === "Active"
              ).length}
            </h2>

          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">

            <p className="text-slate-500 text-sm">
              Inactive Parts
            </p>

            <h2 className="text-4xl font-bold text-red-600 mt-3">
              {partData.filter(
                (p) => p.status === "Inactive"
              ).length}
            </h2>

          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">

            <p className="text-slate-500 text-sm">
              Models Linked
            </p>

            <h2 className="text-4xl font-bold text-purple-600 mt-3">
              {
                [...new Set(
                  partData.map((p) => p.model)
                )].length
              }
            </h2>

          </div>

        </div>

             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">

          <div className="mb-8">

            <h2 className="text-2xl font-bold text-slate-800">
              Add New Part
            </h2>

            <p className="text-slate-500 mt-1">
              Create and manage model-part mapping
            </p>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full border border-slate-300 rounded-2xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Model</option>
              <option value='18"'>18"</option>
              <option value='20"'>20"</option>
              <option value='20" Polar'>20" Polar</option>
              <option value='22"'>22"</option>
              <option value='26"'>26"</option>
            </select>

            <select
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              className="w-full border border-slate-300 rounded-2xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Part</option>
              <option value="Front">Front</option>
              <option value="Top Cover">Top Cover</option>
              <option value="Side RH">Side RH</option>
              <option value="LH">LH</option>
              <option value="Base">Base</option>
              <option value="Base + Leg">Base + Leg</option>
              <option value="Valve Plate">Valve Plate</option>
            </select>

            <input
              type="number"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Area (Sq Inch)"
              className="w-full border border-slate-300 rounded-2xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <input
              type="number"
              value={partsPerHanger}
              onChange={(e) => setPartsPerHanger(e.target.value)}
              placeholder="Parts Per Hanger"
              className="w-full border border-slate-300 rounded-2xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-slate-300 rounded-2xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <button
              type="button"
              onClick={handleSavePart}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-5 py-3 font-semibold transition-all"
            >
              Save Part
            </button>

          </div>

        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">

            <div>

              <h2 className="text-2xl font-bold text-slate-800">
                Part List
              </h2>

              <p className="text-slate-500 mt-1">
                Search, Filter & Manage Parts
              </p>

            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

            <input
              type="text"
              placeholder="Search by Part Name or Model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-slate-300 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <select
              value={filterModel}
              onChange={(e) => setFilterModel(e.target.value)}
              className="border border-slate-300 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="All">All Models</option>
              <option value='18"'>18"</option>
              <option value='20"'>20"</option>
              <option value='20" Polar'>20" Polar</option>
              <option value='22"'>22"</option>
              <option value='26"'>26"</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-slate-300 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">

            <table className="w-full">

              <thead>

                <tr className="bg-slate-50">

                  <th className="px-6 py-4 text-left font-semibold text-slate-700">
                    Model
                  </th>

                  <th className="px-6 py-4 text-left font-semibold text-slate-700">
                    Part Name
                  </th>

                  <th className="px-6 py-4 text-left font-semibold text-slate-700">
                    Area
                  </th>

                  <th className="px-6 py-4 text-left font-semibold text-slate-700">
                    Parts/Hanger
                  </th>

                  <th className="px-6 py-4 text-left font-semibold text-slate-700">
                    Status
                  </th>

                  <th className="px-6 py-4 text-center font-semibold text-slate-700">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredParts.length > 0 ? (

                  filteredParts.map((part) => (

                    <tr
                      key={part.id}
                      className="border-t hover:bg-slate-50 transition"
                    >

                      <td className="px-6 py-4">
                        {part.model}
                      </td>

                      <td className="px-6 py-4 font-medium">
                        {part.partName}
                      </td>

                      <td className="px-6 py-4">
                        {part.area}
                      </td>

                      <td className="px-6 py-4">
                        {part.partsPerHanger}
                      </td>

                      <td className="px-6 py-4">

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            part.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {part.status}
                        </span>

                      </td>

                      <td className="px-6 py-4 text-center">

                        <button
                          onClick={() => handleEdit(part)}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl mr-2 transition"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(part.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition"
                        >
                          Delete
                        </button>

                      </td>

                    </tr>

                  ))

                ) : (

                  <tr>

                    <td
                      colSpan="6"
                      className="text-center py-12 text-slate-500"
                    >
                      No Parts Found
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </div>

        {showModal && (

          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">

            <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl">

              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Edit Part
              </h2>

              <div className="space-y-4">

                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full border border-slate-300 rounded-2xl p-3"
                >
                  <option value='18"'>18"</option>
                  <option value='20"'>20"</option>
                  <option value='20" Polar'>20" Polar</option>
                  <option value='22"'>22"</option>
                  <option value='26"'>26"</option>
                </select>

                <select
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  className="w-full border border-slate-300 rounded-2xl p-3"
                >
                  <option>Front</option>
                  <option>Top Cover</option>
                  <option>Side RH</option>
                  <option>Side RH Small</option>
                  <option>LH</option>
                  <option>Base</option>
                  <option>Base + Leg</option>
                  <option>Base 53/76/43.7 With Leg</option>
                  <option>Valve Plate</option>
                </select>

                <input
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Area"
                  className="w-full border border-slate-300 rounded-2xl p-3"
                />

                <input
                  type="number"
                  value={partsPerHanger}
                  onChange={(e) => setPartsPerHanger(e.target.value)}
                  placeholder="Parts Per Hanger"
                  className="w-full border border-slate-300 rounded-2xl p-3"
                />

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-slate-300 rounded-2xl p-3"
                >
                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>

              </div>

              <div className="flex justify-end gap-3 mt-8">

                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-3 rounded-2xl border border-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleUpdatePart}
                  className="px-5 py-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-700"
                >
                  Update Part
                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </div>

  );
}