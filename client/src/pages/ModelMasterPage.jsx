import { useState } from "react";

export default function ModelMasterPage() {
  const [modelName, setModelName] = useState("");
  const [modelCode, setModelCode] = useState("");
  const [status, setStatus] = useState("Active");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [models, setModels] = useState([
    {
      id: 1,
      modelName: '18"',
      modelCode: "M18",
      status: "Active",
    },
    {
      id: 2,
      modelName: '20"',
      modelCode: "M20",
      status: "Active",
    },
    {
      id: 3,
      modelName: '20" Polar',
      modelCode: "M20P",
      status: "Active",
    },
    {
      id: 4,
      modelName: '22"',
      modelCode: "M22",
      status: "Active",
    },
    {
      id: 5,
      modelName: '26"',
      modelCode: "M26",
      status: "Active",
    },
  ]);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingModel, setEditingModel] = useState(null);

  const handleSaveModel = () => {
    if (!modelName || !modelCode) {
      alert("Please fill all fields");
      return;
    }

    const newModel = {
      id: Date.now(),
      modelName,
      modelCode,
      status,
    };

    setModels([...models, newModel]);

    setModelName("");
    setModelCode("");
    setStatus("Active");
  };

  const handleDelete = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this model?"
    );

    if (!confirmDelete) return;

    setModels(models.filter((model) => model.id !== id));
  };

  const handleEdit = (model) => {
    setEditingModel({ ...model });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    setModels(
      models.map((model) =>
        model.id === editingModel.id
          ? editingModel
          : model
      )
    );

    setIsEditOpen(false);
  };

  const handleExport = () => {
    const headers = [
      "Model Name",
      "Model Code",
      "Status",
    ];

    const rows = models.map((m) => [
      m.modelName,
      m.modelCode,
      m.status,
    ]);

    const csv =
      [headers, ...rows]
        .map((row) => row.join(","))
        .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv",
    });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = "models.csv";

    a.click();
  };

  const filteredModels = models.filter((model) => {
    const searchMatch =
      model.modelName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      model.modelCode
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const statusMatch =
      statusFilter === "All" ||
      model.status === statusFilter;

    return searchMatch && statusMatch;
  });

  const activeCount = models.filter(
    (m) => m.status === "Active"
  ).length;

  const inactiveCount = models.filter(
    (m) => m.status === "Inactive"
  ).length;

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">
            Model Master
          </h1>

          <p className="text-slate-500">
            Manage all AC models
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
          >
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border rounded-2xl p-6 shadow">
          <h3 className="text-gray-500">
            Total Models
          </h3>

          <p className="text-4xl font-bold text-blue-600">
            {models.length}
          </p>
        </div>

        <div className="bg-white border rounded-2xl p-6 shadow">
          <h3 className="text-gray-500">
            Active Models
          </h3>

          <p className="text-4xl font-bold text-green-600">
            {activeCount}
          </p>
        </div>

        <div className="bg-white border rounded-2xl p-6 shadow">
          <h3 className="text-gray-500">
            Inactive Models
          </h3>

          <p className="text-4xl font-bold text-red-600">
            {inactiveCount}
          </p>
        </div>
      </div>

      {/* Add Form */}

      <div className="bg-white border rounded-2xl shadow p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          Add New Model
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            value={modelName}
            onChange={(e) =>
              setModelName(e.target.value)
            }
            placeholder="Model Name"
            className="border p-3 rounded-lg"
          />

          <input
            value={modelCode}
            onChange={(e) =>
              setModelCode(e.target.value)
            }
            placeholder="Model Code"
            className="border p-3 rounded-lg"
          />

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
            className="border p-3 rounded-lg"
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>

          <button
            onClick={handleSaveModel}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Save Model
          </button>
        </div>
      </div>

      {/* Search */}

      <div className="bg-white border rounded-2xl shadow p-6">
        <div className="flex gap-4 mb-5">
          <input
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            placeholder="Search..."
            className="border p-3 rounded-lg flex-1"
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="border p-3 rounded-lg"
          >
            <option value="All">
              All Status
            </option>
            <option value="Active">
              Active
            </option>
            <option value="Inactive">
              Inactive
            </option>
          </select>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-slate-100">
              <th className="p-3 text-left">
                Model Name
              </th>
              <th className="p-3 text-left">
                Model Code
              </th>
              <th className="p-3 text-left">
                Status
              </th>
              <th className="p-3 text-left">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredModels.map((model) => (
              <tr
                key={model.id}
                className="border-b"
              >
                <td className="p-3">
                  {model.modelName}
                </td>

                <td className="p-3">
                  {model.modelCode}
                </td>

                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      model.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {model.status}
                  </span>
                </td>

                <td className="p-3">
                  <button
                    onClick={() =>
                      handleEdit(model)
                    }
                    className="bg-yellow-500 text-white px-3 py-1 rounded mr-2"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(model.id)
                    }
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}

      {isEditOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4">
              Edit Model
            </h2>

            <input
              value={editingModel.modelName}
              onChange={(e) =>
                setEditingModel({
                  ...editingModel,
                  modelName: e.target.value,
                })
              }
              className="border p-3 rounded-lg w-full mb-3"
            />

            <input
              value={editingModel.modelCode}
              onChange={(e) =>
                setEditingModel({
                  ...editingModel,
                  modelCode: e.target.value,
                })
              }
              className="border p-3 rounded-lg w-full mb-3"
            />

            <select
              value={editingModel.status}
              onChange={(e) =>
                setEditingModel({
                  ...editingModel,
                  status: e.target.value,
                })
              }
              className="border p-3 rounded-lg w-full mb-4"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setIsEditOpen(false)
                }
                className="border px-4 py-2 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdate}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}